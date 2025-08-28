/**
 * Metrics Utility
 * 
 * Provides functionality for tracking and reporting application metrics
 * such as API response times, error rates, and system health.
 */

const { Logger } = require('./logger');

class ApiMetrics {
  constructor() {
    this.logger = new Logger({ service: 'ApiMetrics' });
    this.metrics = {
      apiCalls: {
        total: 0,
        byService: {},
        byMethod: {},
        byStatus: {},
        errors: 0
      },
      responseTimes: {
        sum: 0,
        count: 0,
        min: Number.MAX_SAFE_INTEGER,
        max: 0
      },
      lastUpdated: new Date()
    };
  }

  /**
   * Record an API call
   * @param {string} service Service name
   * @param {string} method HTTP method
   * @param {number} status HTTP status code
   * @param {number} duration Duration in milliseconds
   */
  recordApiCall(service, method, status, duration) {
    // Update total count
    this.metrics.apiCalls.total++;

    // Update service metrics
    if (!this.metrics.apiCalls.byService[service]) {
      this.metrics.apiCalls.byService[service] = {
        total: 0,
        errors: 0,
        responseTimes: {
          sum: 0,
          count: 0,
          min: Number.MAX_SAFE_INTEGER,
          max: 0
        }
      };
    }
    this.metrics.apiCalls.byService[service].total++;

    // Update method metrics
    if (!this.metrics.apiCalls.byMethod[method]) {
      this.metrics.apiCalls.byMethod[method] = 0;
    }
    this.metrics.apiCalls.byMethod[method]++;

    // Update status metrics
    if (!this.metrics.apiCalls.byStatus[status]) {
      this.metrics.apiCalls.byStatus[status] = 0;
    }
    this.metrics.apiCalls.byStatus[status]++;

    // Update error count if status >= 400
    if (status >= 400) {
      this.metrics.apiCalls.errors++;
      this.metrics.apiCalls.byService[service].errors++;
    }

    // Update response time metrics
    if (duration) {
      // Global response times
      this.metrics.responseTimes.sum += duration;
      this.metrics.responseTimes.count++;
      this.metrics.responseTimes.min = Math.min(this.metrics.responseTimes.min, duration);
      this.metrics.responseTimes.max = Math.max(this.metrics.responseTimes.max, duration);

      // Service-specific response times
      const serviceResponseTimes = this.metrics.apiCalls.byService[service].responseTimes;
      serviceResponseTimes.sum += duration;
      serviceResponseTimes.count++;
      serviceResponseTimes.min = Math.min(serviceResponseTimes.min, duration);
      serviceResponseTimes.max = Math.max(serviceResponseTimes.max, duration);
    }

    // Update timestamp
    this.metrics.lastUpdated = new Date();

    // Log the API call
    this.logger.logApiCall(service, method, status, duration);
  }

  /**
   * Record an API error
   * @param {string} service Service name
   * @param {string} method HTTP method
   * @param {number} status HTTP status code
   */
  recordApiError(service, method, status) {
    // Update error count
    this.metrics.apiCalls.errors++;

    // Update service metrics
    if (!this.metrics.apiCalls.byService[service]) {
      this.metrics.apiCalls.byService[service] = {
        total: 0,
        errors: 0,
        responseTimes: {
          sum: 0,
          count: 0,
          min: Number.MAX_SAFE_INTEGER,
          max: 0
        }
      };
    }
    this.metrics.apiCalls.byService[service].errors++;

    // Update timestamp
    this.metrics.lastUpdated = new Date();

    // Log the API error
    this.logger.warn({
      message: 'API error',
      service,
      method,
      status
    });
  }

  /**
   * Get current metrics
   * @returns {Object} Current metrics
   */
  getMetrics() {
    const avgResponseTime = this.metrics.responseTimes.count > 0
      ? this.metrics.responseTimes.sum / this.metrics.responseTimes.count
      : 0;

    const serviceMetrics = {};
    for (const [service, data] of Object.entries(this.metrics.apiCalls.byService)) {
      const avgServiceResponseTime = data.responseTimes.count > 0
        ? data.responseTimes.sum / data.responseTimes.count
        : 0;

      serviceMetrics[service] = {
        total: data.total,
        errors: data.errors,
        errorRate: data.total > 0 ? (data.errors / data.total) * 100 : 0,
        avgResponseTime: avgServiceResponseTime,
        minResponseTime: data.responseTimes.min === Number.MAX_SAFE_INTEGER ? 0 : data.responseTimes.min,
        maxResponseTime: data.responseTimes.max
      };
    }

    return {
      apiCalls: {
        total: this.metrics.apiCalls.total,
        errors: this.metrics.apiCalls.errors,
        errorRate: this.metrics.apiCalls.total > 0
          ? (this.metrics.apiCalls.errors / this.metrics.apiCalls.total) * 100
          : 0,
        byMethod: this.metrics.apiCalls.byMethod,
        byStatus: this.metrics.apiCalls.byStatus,
        byService: serviceMetrics
      },
      responseTimes: {
        avg: avgResponseTime,
        min: this.metrics.responseTimes.min === Number.MAX_SAFE_INTEGER ? 0 : this.metrics.responseTimes.min,
        max: this.metrics.responseTimes.max
      },
      lastUpdated: this.metrics.lastUpdated
    };
  }

  /**
   * Reset metrics
   */
  resetMetrics() {
    this.metrics = {
      apiCalls: {
        total: 0,
        byService: {},
        byMethod: {},
        byStatus: {},
        errors: 0
      },
      responseTimes: {
        sum: 0,
        count: 0,
        min: Number.MAX_SAFE_INTEGER,
        max: 0
      },
      lastUpdated: new Date()
    };

    this.logger.info('Metrics reset');
  }
}

module.exports = { ApiMetrics };