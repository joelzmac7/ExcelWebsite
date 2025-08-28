/**
 * Metrics Utility
 * 
 * This utility provides functionality for tracking and reporting metrics
 * throughout the application, such as API call durations, error rates,
 * and custom business metrics.
 */

/**
 * API call metric
 */
interface ApiCallMetric {
  service: string;
  method: string;
  statusCode: number;
  duration: number;
  timestamp: number;
}

/**
 * API error metric
 */
interface ApiErrorMetric {
  service: string;
  method: string;
  statusCode: number;
  timestamp: number;
}

/**
 * Business metric
 */
interface BusinessMetric {
  name: string;
  value: number;
  tags: Record<string, string>;
  timestamp: number;
}

/**
 * Metrics options
 */
export interface MetricsOptions {
  /**
   * Whether to enable metrics collection
   */
  enabled: boolean;
  
  /**
   * Maximum number of metrics to keep in memory
   */
  maxBufferSize: number;
  
  /**
   * Interval in milliseconds to flush metrics to storage
   */
  flushInterval: number;
  
  /**
   * Custom metrics storage function
   */
  storageFunction?: (metrics: {
    apiCalls: ApiCallMetric[];
    apiErrors: ApiErrorMetric[];
    businessMetrics: BusinessMetric[];
  }) => Promise<void>;
}

/**
 * Default metrics options
 */
const defaultOptions: MetricsOptions = {
  enabled: process.env.NODE_ENV === 'production',
  maxBufferSize: 1000,
  flushInterval: 60000 // 1 minute
};

/**
 * API metrics implementation
 */
export class ApiMetrics {
  private readonly options: MetricsOptions;
  private apiCalls: ApiCallMetric[] = [];
  private apiErrors: ApiErrorMetric[] = [];
  private businessMetrics: BusinessMetric[] = [];
  private flushTimer: NodeJS.Timeout | null = null;
  
  /**
   * Create a new metrics instance
   * 
   * @param options Metrics options
   */
  constructor(options: Partial<MetricsOptions> = {}) {
    this.options = {
      ...defaultOptions,
      ...options
    };
    
    // Start flush timer if enabled
    if (this.options.enabled) {
      this.startFlushTimer();
    }
  }
  
  /**
   * Record an API call
   * 
   * @param service Service name
   * @param method HTTP method
   * @param statusCode HTTP status code
   * @param duration Call duration in milliseconds
   */
  recordApiCall(service: string, method: string, statusCode: number, duration: number): void {
    if (!this.options.enabled) return;
    
    this.apiCalls.push({
      service,
      method,
      statusCode,
      duration,
      timestamp: Date.now()
    });
    
    this.checkBufferSize();
  }
  
  /**
   * Record an API error
   * 
   * @param service Service name
   * @param method HTTP method
   * @param statusCode HTTP status code
   */
  recordApiError(service: string, method: string, statusCode: number): void {
    if (!this.options.enabled) return;
    
    this.apiErrors.push({
      service,
      method,
      statusCode,
      timestamp: Date.now()
    });
    
    this.checkBufferSize();
  }
  
  /**
   * Record a business metric
   * 
   * @param name Metric name
   * @param value Metric value
   * @param tags Additional tags
   */
  recordBusinessMetric(name: string, value: number, tags: Record<string, string> = {}): void {
    if (!this.options.enabled) return;
    
    this.businessMetrics.push({
      name,
      value,
      tags,
      timestamp: Date.now()
    });
    
    this.checkBufferSize();
  }
  
  /**
   * Check if buffer size exceeds maximum and flush if necessary
   */
  private checkBufferSize(): void {
    const totalSize = this.apiCalls.length + this.apiErrors.length + this.businessMetrics.length;
    
    if (totalSize >= this.options.maxBufferSize) {
      this.flush();
    }
  }
  
  /**
   * Start the flush timer
   */
  private startFlushTimer(): void {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
    }
    
    this.flushTimer = setInterval(() => {
      this.flush();
    }, this.options.flushInterval);
    
    // Ensure timer doesn't prevent Node from exiting
    if (this.flushTimer.unref) {
      this.flushTimer.unref();
    }
  }
  
  /**
   * Flush metrics to storage
   */
  async flush(): Promise<void> {
    if (!this.options.enabled || 
        (this.apiCalls.length === 0 && 
         this.apiErrors.length === 0 && 
         this.businessMetrics.length === 0)) {
      return;
    }
    
    // Copy current metrics
    const metrics = {
      apiCalls: [...this.apiCalls],
      apiErrors: [...this.apiErrors],
      businessMetrics: [...this.businessMetrics]
    };
    
    // Clear buffers
    this.apiCalls = [];
    this.apiErrors = [];
    this.businessMetrics = [];
    
    try {
      // Use custom storage function if provided, otherwise log to console
      if (this.options.storageFunction) {
        await this.options.storageFunction(metrics);
      } else {
        this.logMetrics(metrics);
      }
    } catch (error) {
      console.error('Failed to flush metrics:', error);
    }
  }
  
  /**
   * Log metrics to console
   * 
   * @param metrics Metrics to log
   */
  private logMetrics(metrics: {
    apiCalls: ApiCallMetric[];
    apiErrors: ApiErrorMetric[];
    businessMetrics: BusinessMetric[];
  }): void {
    if (metrics.apiCalls.length > 0) {
      console.log(`[Metrics] API Calls: ${metrics.apiCalls.length}`);
    }
    
    if (metrics.apiErrors.length > 0) {
      console.log(`[Metrics] API Errors: ${metrics.apiErrors.length}`);
    }
    
    if (metrics.businessMetrics.length > 0) {
      console.log(`[Metrics] Business Metrics: ${metrics.businessMetrics.length}`);
    }
  }
  
  /**
   * Get API call statistics
   * 
   * @returns API call statistics
   */
  getApiCallStats(): Record<string, any> {
    if (this.apiCalls.length === 0) {
      return {};
    }
    
    // Group by service and method
    const groupedCalls: Record<string, ApiCallMetric[]> = {};
    
    this.apiCalls.forEach(call => {
      const key = `${call.service}:${call.method}`;
      if (!groupedCalls[key]) {
        groupedCalls[key] = [];
      }
      groupedCalls[key].push(call);
    });
    
    // Calculate statistics for each group
    const stats: Record<string, {
      count: number;
      avgDuration: number;
      minDuration: number;
      maxDuration: number;
      p95Duration: number;
      errorRate: number;
    }> = {};
    
    Object.entries(groupedCalls).forEach(([key, calls]) => {
      // Sort durations for percentile calculation
      const durations = calls.map(call => call.duration).sort((a, b) => a - b);
      
      // Calculate error rate
      const errorCount = calls.filter(call => call.statusCode >= 400).length;
      
      stats[key] = {
        count: calls.length,
        avgDuration: durations.reduce((sum, duration) => sum + duration, 0) / durations.length,
        minDuration: durations[0],
        maxDuration: durations[durations.length - 1],
        p95Duration: durations[Math.floor(durations.length * 0.95)],
        errorRate: (errorCount / calls.length) * 100
      };
    });
    
    return stats;
  }
  
  /**
   * Get API error statistics
   * 
   * @returns API error statistics
   */
  getApiErrorStats(): Record<string, any> {
    if (this.apiErrors.length === 0) {
      return {};
    }
    
    // Group by service and status code
    const groupedErrors: Record<string, number> = {};
    
    this.apiErrors.forEach(error => {
      const key = `${error.service}:${error.statusCode}`;
      if (!groupedErrors[key]) {
        groupedErrors[key] = 0;
      }
      groupedErrors[key]++;
    });
    
    return groupedErrors;
  }
  
  /**
   * Get business metric statistics
   * 
   * @returns Business metric statistics
   */
  getBusinessMetricStats(): Record<string, any> {
    if (this.businessMetrics.length === 0) {
      return {};
    }
    
    // Group by metric name
    const groupedMetrics: Record<string, number[]> = {};
    
    this.businessMetrics.forEach(metric => {
      const key = metric.name;
      if (!groupedMetrics[key]) {
        groupedMetrics[key] = [];
      }
      groupedMetrics[key].push(metric.value);
    });
    
    // Calculate statistics for each group
    const stats: Record<string, {
      count: number;
      sum: number;
      avg: number;
      min: number;
      max: number;
    }> = {};
    
    Object.entries(groupedMetrics).forEach(([key, values]) => {
      // Sort values
      const sortedValues = [...values].sort((a, b) => a - b);
      
      stats[key] = {
        count: values.length,
        sum: values.reduce((sum, value) => sum + value, 0),
        avg: values.reduce((sum, value) => sum + value, 0) / values.length,
        min: sortedValues[0],
        max: sortedValues[sortedValues.length - 1]
      };
    });
    
    return stats;
  }
  
  /**
   * Stop metrics collection
   */
  stop(): void {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
      this.flushTimer = null;
    }
  }
}

/**
 * Create the default metrics instance
 */
export const createMetrics = (): ApiMetrics => {
  return new ApiMetrics({
    enabled: process.env.ENABLE_METRICS === 'true',
    maxBufferSize: parseInt(process.env.METRICS_BUFFER_SIZE || '1000', 10),
    flushInterval: parseInt(process.env.METRICS_FLUSH_INTERVAL || '60000', 10)
  });
};

/**
 * Default metrics instance
 */
export const metrics = createMetrics();