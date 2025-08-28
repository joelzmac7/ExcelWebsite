/**
 * LaborEdge API Service
 * 
 * This service handles all interactions with the LaborEdge API, including:
 * - Authentication
 * - Job data retrieval
 * - Facility information
 * - Data transformation
 * - Error handling and retries
 */

import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import { RedisClient } from 'redis';
import { promisify } from 'util';
import { Logger } from '../../utils/logger';
import { CircuitBreaker } from '../../utils/circuit-breaker';
import { withRetry } from '../../utils/retry';
import { JobTransformer } from '../transformers/job-transformer.service';
import { FacilityTransformer } from '../transformers/facility-transformer.service';
import { JobRepository } from '../../repositories/job.repository';
import { FacilityRepository } from '../../repositories/facility.repository';
import { Job } from '../../models/job.model';
import { Facility } from '../../models/facility.model';
import { ApiMetrics } from '../../utils/metrics';

export class LaborEdgeApiService {
  private readonly axiosInstance: AxiosInstance;
  private readonly redisClient: RedisClient;
  private readonly getAsync: (key: string) => Promise<string | null>;
  private readonly setAsync: (key: string, value: string, mode: string, duration: number) => Promise<unknown>;
  private readonly logger: Logger;
  private readonly circuitBreaker: CircuitBreaker;
  private readonly jobTransformer: JobTransformer;
  private readonly facilityTransformer: FacilityTransformer;
  private readonly jobRepository: JobRepository;
  private readonly facilityRepository: FacilityRepository;
  private readonly metrics: ApiMetrics;

  constructor(
    config: any, 
    redisClient: RedisClient,
    logger: Logger,
    jobTransformer: JobTransformer,
    facilityTransformer: FacilityTransformer,
    jobRepository: JobRepository,
    facilityRepository: FacilityRepository,
    metrics: ApiMetrics
  ) {
    this.redisClient = redisClient;
    this.logger = logger.child({ service: 'LaborEdgeApiService' });
    this.jobTransformer = jobTransformer;
    this.facilityTransformer = facilityTransformer;
    this.jobRepository = jobRepository;
    this.facilityRepository = facilityRepository;
    this.metrics = metrics;
    
    // Promisify Redis methods
    this.getAsync = promisify(this.redisClient.get).bind(this.redisClient);
    this.setAsync = promisify(this.redisClient.set).bind(this.redisClient);
    
    // Initialize circuit breaker
    this.circuitBreaker = new CircuitBreaker({
      failureThreshold: 5,
      resetTimeout: 30000
    });
    
    // Initialize axios instance
    this.axiosInstance = axios.create({
      baseURL: config.LABOREDGE_API_BASE_URL || 'https://api.laboredge.com',
      timeout: config.LABOREDGE_API_TIMEOUT || 10000,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    });
    
    // Request interceptor to add authentication token
    this.axiosInstance.interceptors.request.use(
      async (config: AxiosRequestConfig) => {
        const token = await this.getAccessToken();
        if (token) {
          config.headers = {
            ...config.headers,
            Authorization: `Bearer ${token}`
          };
        }
        
        // Log API request (without sensitive data)
        this.logger.debug({
          message: 'API request',
          method: config.method?.toUpperCase(),
          url: `${config.baseURL}${config.url}`,
          params: config.params
        });
        
        return config;
      },
      (error) => {
        this.logger.error({
          message: 'API request interceptor error',
          error: error.message
        });
        return Promise.reject(error);
      }
    );
    
    // Response interceptor to handle errors
    this.axiosInstance.interceptors.response.use(
      (response) => {
        // Log API response (without sensitive data)
        this.logger.debug({
          message: 'API response',
          status: response.status,
          url: response.config.url,
          dataSize: JSON.stringify(response.data).length
        });
        
        // Record metrics
        this.metrics.recordApiCall(
          'laboredge',
          response.config.method?.toUpperCase() || 'UNKNOWN',
          response.status,
          response.config.metadata?.requestStartTime 
            ? Date.now() - response.config.metadata.requestStartTime 
            : 0
        );
        
        return response;
      },
      async (error) => {
        // Handle 401 errors (unauthorized)
        if (error.response && error.response.status === 401) {
          this.logger.warn('Authentication token expired, clearing cache');
          await this.redisClient.del('laboredge_access_token');
          
          // Retry the request once with a new token
          if (!error.config._retry) {
            error.config._retry = true;
            const token = await this.getAccessToken(true);
            error.config.headers['Authorization'] = `Bearer ${token}`;
            return this.axiosInstance(error.config);
          }
        }
        
        // Log error details
        this.logger.error({
          message: 'API response error',
          status: error.response?.status,
          url: error.config?.url,
          error: error.message,
          response: error.response?.data
        });
        
        // Record error metrics
        this.metrics.recordApiError(
          'laboredge',
          error.config?.method?.toUpperCase() || 'UNKNOWN',
          error.response?.status || 0
        );
        
        return Promise.reject(error);
      }
    );
  }
  
  /**
   * Get access token for LaborEdge API
   * @param forceRefresh Force refresh of token even if cached
   * @returns Access token
   */
  async getAccessToken(forceRefresh = false): Promise<string> {
    try {
      // Check if token exists in Redis cache and not forcing refresh
      if (!forceRefresh) {
        const cachedToken = await this.getAsync('laboredge_access_token');
        if (cachedToken) {
          return cachedToken;
        }
      }
      
      // If no cached token or forcing refresh, request a new one
      const tokenResponse = await this.requestNewToken();
      
      // Cache the token with expiration
      const expiresIn = tokenResponse.expires_in;
      await this.setAsync(
        'laboredge_access_token', 
        tokenResponse.access_token,
        'EX',
        expiresIn - 60 // Buffer of 60 seconds
      );
      
      // Also cache the refresh token
      await this.setAsync(
        'laboredge_refresh_token',
        tokenResponse.refresh_token,
        'EX',
        30 * 24 * 60 * 60 // 30 days
      );
      
      return tokenResponse.access_token;
    } catch (error) {
      this.logger.error({
        message: 'Failed to get access token',
        error: error instanceof Error ? error.message : String(error)
      });
      throw new Error('Authentication failed');
    }
  }
  
  /**
   * Request a new access token
   * @returns Token response
   */
  private async requestNewToken(): Promise<any> {
    try {
      // Check if we have a refresh token
      const refreshToken = await this.getAsync('laboredge_refresh_token');
      
      if (refreshToken) {
        // Try to use refresh token
        try {
          return await this.refreshToken(refreshToken);
        } catch (refreshError) {
          this.logger.warn({
            message: 'Refresh token failed, falling back to password grant',
            error: refreshError instanceof Error ? refreshError.message : String(refreshError)
          });
          // If refresh fails, fall back to password grant
        }
      }
      
      // Use password grant
      const response = await axios.post(
        `${this.axiosInstance.defaults.baseURL}/oauth/token`,
        {
          grant_type: 'password',
          username: process.env.LABOREDGE_USERNAME || 'API_Excel_User',
          password: process.env.LABOREDGE_PASSWORD || 'API@EXCEL_03262025',
          organizationCode: process.env.LABOREDGE_ORG_CODE || 'Excel'
        },
        {
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );
      
      return response.data;
    } catch (error) {
      this.logger.error({
        message: 'Token request failed',
        error: error instanceof Error ? error.message : String(error),
        response: axios.isAxiosError(error) ? error.response?.data : undefined
      });
      throw error;
    }
  }
  
  /**
   * Refresh access token using refresh token
   * @param refreshToken Refresh token
   * @returns Token response
   */
  private async refreshToken(refreshToken: string): Promise<any> {
    try {
      const response = await axios.post(
        `${this.axiosInstance.defaults.baseURL}/oauth/token`,
        {
          grant_type: 'refresh_token',
          refresh_token: refreshToken
        },
        {
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );
      
      return response.data;
    } catch (error) {
      this.logger.error({
        message: 'Token refresh failed',
        error: error instanceof Error ? error.message : String(error),
        response: axios.isAxiosError(error) ? error.response?.data : undefined
      });
      throw error;
    }
  }
  
  /**
   * Execute API request with circuit breaker and retry logic
   * @param method Method to execute
   * @returns Response data
   */
  private async executeWithCircuitBreaker<T>(method: () => Promise<AxiosResponse<T>>): Promise<T> {
    return this.circuitBreaker.execute(async () => {
      return withRetry(
        async () => {
          const response = await method();
          return response.data;
        },
        {
          maxRetries: 3,
          initialDelay: 1000,
          maxDelay: 10000,
          factor: 2,
          onRetry: (error, attempt) => {
            this.logger.warn({
              message: `Retrying API request (attempt ${attempt})`,
              error: error instanceof Error ? error.message : String(error)
            });
          }
        }
      );
    });
  }
  
  /**
   * Get jobs with pagination
   * @param params Query parameters
   * @returns Jobs response
   */
  async getJobs(params?: any): Promise<any> {
    return this.executeWithCircuitBreaker(() => {
      return this.axiosInstance.get('/api/v1/jobs', { 
        params,
        metadata: { requestStartTime: Date.now() }
      });
    });
  }
  
  /**
   * Get job by ID
   * @param id Job ID
   * @returns Job data
   */
  async getJobById(id: string): Promise<any> {
    return this.executeWithCircuitBreaker(() => {
      return this.axiosInstance.get(`/api/v1/jobs/${id}`, {
        metadata: { requestStartTime: Date.now() }
      });
    });
  }
  
  /**
   * Get jobs updated since a specific date
   * @param date Date to check updates since
   * @returns Updated jobs
   */
  async getJobsUpdatedSince(date: Date): Promise<any> {
    return this.executeWithCircuitBreaker(() => {
      return this.axiosInstance.get('/api/v1/jobs', {
        params: {
          updated_since: date.toISOString()
        },
        metadata: { requestStartTime: Date.now() }
      });
    });
  }
  
  /**
   * Get facility information
   * @param id Facility ID
   * @returns Facility data
   */
  async getFacilityById(id: string): Promise<any> {
    return this.executeWithCircuitBreaker(() => {
      return this.axiosInstance.get(`/api/v1/facilities/${id}`, {
        metadata: { requestStartTime: Date.now() }
      });
    });
  }
  
  /**
   * Get all facilities
   * @param params Query parameters
   * @returns Facilities response
   */
  async getFacilities(params?: any): Promise<any> {
    return this.executeWithCircuitBreaker(() => {
      return this.axiosInstance.get('/api/v1/facilities', { 
        params,
        metadata: { requestStartTime: Date.now() }
      });
    });
  }
  
  /**
   * Get specialties
   * @returns Specialties data
   */
  async getSpecialties(): Promise<any> {
    return this.executeWithCircuitBreaker(() => {
      return this.axiosInstance.get('/api/v1/specialties', {
        metadata: { requestStartTime: Date.now() }
      });
    });
  }
  
  /**
   * Get health check status
   * @returns Health check response
   */
  async getHealthCheck(): Promise<any> {
    return this.executeWithCircuitBreaker(() => {
      return this.axiosInstance.get('/api/v1/health', {
        metadata: { requestStartTime: Date.now() }
      });
    });
  }
  
  /**
   * Synchronize all jobs from LaborEdge
   * @returns Number of jobs synchronized
   */
  async syncAllJobs(): Promise<number> {
    this.logger.info('Starting full job synchronization');
    let page = 1;
    let totalJobs = 0;
    let hasMoreData = true;
    
    try {
      while (hasMoreData) {
        const jobsResponse = await this.getJobs({ 
          page, 
          limit: 100,
          include_details: true
        });
        
        const jobs = jobsResponse.data || [];
        
        if (jobs.length > 0) {
          await this.processJobs(jobs);
          totalJobs += jobs.length;
          this.logger.info(`Processed ${jobs.length} jobs (page ${page})`);
          page++;
        } else {
          hasMoreData = false;
        }
        
        // If the API indicates there are no more pages
        if (jobsResponse.meta && jobsResponse.meta.total_pages && page > jobsResponse.meta.total_pages) {
          hasMoreData = false;
        }
      }
      
      this.logger.info(`Full job synchronization completed. Processed ${totalJobs} jobs.`);
      return totalJobs;
    } catch (error) {
      this.logger.error({
        message: 'Full job synchronization failed',
        error: error instanceof Error ? error.message : String(error)
      });
      throw error;
    }
  }
  
  /**
   * Synchronize jobs updated since a specific date
   * @param since Date to check updates since
   * @returns Number of jobs synchronized
   */
  async syncJobsUpdatedSince(since: Date): Promise<number> {
    this.logger.info(`Starting incremental job synchronization since ${since.toISOString()}`);
    
    try {
      const jobsResponse = await this.getJobsUpdatedSince(since);
      const jobs = jobsResponse.data || [];
      
      if (jobs.length > 0) {
        await this.processJobs(jobs);
        this.logger.info(`Incremental job synchronization completed. Processed ${jobs.length} jobs.`);
        return jobs.length;
      }
      
      this.logger.info('No jobs updated since the specified date.');
      return 0;
    } catch (error) {
      this.logger.error({
        message: 'Incremental job synchronization failed',
        error: error instanceof Error ? error.message : String(error)
      });
      throw error;
    }
  }
  
  /**
   * Process jobs data and save to database
   * @param jobs Jobs data from LaborEdge API
   */
  private async processJobs(jobs: any[]): Promise<void> {
    for (const jobData of jobs) {
      try {
        // Transform job data
        const transformedJob = this.jobTransformer.transform(jobData);
        
        // Save or update job in database
        await this.jobRepository.upsert(transformedJob);
        
        // Process facility data if available
        if (jobData.facility) {
          const transformedFacility = this.facilityTransformer.transform(jobData.facility);
          await this.facilityRepository.upsert(transformedFacility);
        }
      } catch (error) {
        this.logger.error({
          message: `Failed to process job ${jobData.id}`,
          error: error instanceof Error ? error.message : String(error),
          jobId: jobData.id
        });
        // Continue processing other jobs
      }
    }
  }
  
  /**
   * Handle webhook event from LaborEdge
   * @param event Webhook event data
   */
  async handleWebhookEvent(event: any): Promise<void> {
    this.logger.info({
      message: 'Received webhook event',
      eventType: event.type
    });
    
    try {
      switch (event.type) {
        case 'job.created':
        case 'job.updated':
          await this.processJobs([event.data]);
          break;
          
        case 'job.deleted':
          await this.jobRepository.markAsDeleted(event.data.id);
          break;
          
        case 'facility.updated':
          if (event.data) {
            const transformedFacility = this.facilityTransformer.transform(event.data);
            await this.facilityRepository.upsert(transformedFacility);
          }
          break;
          
        default:
          this.logger.warn({
            message: 'Unhandled webhook event type',
            eventType: event.type
          });
      }
    } catch (error) {
      this.logger.error({
        message: 'Failed to process webhook event',
        eventType: event.type,
        error: error instanceof Error ? error.message : String(error)
      });
      throw error;
    }
  }
}