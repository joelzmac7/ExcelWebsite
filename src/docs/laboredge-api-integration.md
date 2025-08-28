# LaborEdge API Integration Specification

## Overview

This document outlines the technical specifications for integrating with the LaborEdge API to power the Excel Medical Staffing platform. The integration will enable real-time job data synchronization, candidate application processing, and recruiter operations.

## Authentication Flow

### OAuth 2.0 Implementation

1. **Client Credentials Flow**:
   - Store client ID and secret in AWS Secrets Manager
   - Implement token acquisition with automatic refresh
   - Cache valid tokens in Redis with TTL matching expiration

2. **Authentication Service**:
   ```javascript
   // src/backend/services/auth/laboredge-auth.service.js
   class LaborEdgeAuthService {
     constructor(config, redisClient) {
       this.clientId = config.LABOREDGE_CLIENT_ID;
       this.clientSecret = config.LABOREDGE_CLIENT_SECRET;
       this.tokenUrl = config.LABOREDGE_TOKEN_URL;
       this.redisClient = redisClient;
     }
     
     async getAccessToken() {
       // Check Redis cache first
       const cachedToken = await this.redisClient.get('laboredge_access_token');
       if (cachedToken) return cachedToken;
       
       // Request new token
       const tokenResponse = await axios.post(this.tokenUrl, {
         grant_type: 'client_credentials',
         client_id: this.clientId,
         client_secret: this.clientSecret
       });
       
       // Cache token with expiration
       const expiresIn = tokenResponse.data.expires_in;
       await this.redisClient.set(
         'laboredge_access_token', 
         tokenResponse.data.access_token,
         'EX',
         expiresIn - 60 // Buffer of 60 seconds
       );
       
       return tokenResponse.data.access_token;
     }
   }
   ```

3. **Request Interceptor**:
   ```javascript
   // src/backend/services/api/laboredge-api.service.js
   const axiosInstance = axios.create({
     baseURL: config.LABOREDGE_API_BASE_URL
   });
   
   axiosInstance.interceptors.request.use(async (config) => {
     const token = await authService.getAccessToken();
     config.headers.Authorization = `Bearer ${token}`;
     return config;
   });
   ```

## Data Synchronization

### Job Data Synchronization

1. **Synchronization Strategy**:
   - Full sync daily during off-peak hours
   - Incremental sync every 15 minutes
   - Webhook-based real-time updates for critical changes

2. **Job Sync Service**:
   ```javascript
   // src/backend/services/sync/job-sync.service.js
   class JobSyncService {
     constructor(laboredgeApiService, jobRepository) {
       this.apiService = laboredgeApiService;
       this.jobRepository = jobRepository;
       this.logger = createLogger('JobSyncService');
     }
     
     async performFullSync() {
       try {
         this.logger.info('Starting full job sync');
         let page = 1;
         let hasMoreData = true;
         
         while (hasMoreData) {
           const jobs = await this.apiService.getJobs({ page, limit: 100 });
           await this.processJobs(jobs.data);
           
           hasMoreData = jobs.data.length === 100;
           page++;
         }
         
         this.logger.info('Full job sync completed');
       } catch (error) {
         this.logger.error('Full job sync failed', error);
         throw error;
       }
     }
     
     async performIncrementalSync(since) {
       try {
         this.logger.info(`Starting incremental job sync since ${since}`);
         const jobs = await this.apiService.getJobsUpdatedSince(since);
         await this.processJobs(jobs.data);
         this.logger.info('Incremental job sync completed');
       } catch (error) {
         this.logger.error('Incremental job sync failed', error);
         throw error;
       }
     }
     
     async processJobs(jobs) {
       for (const job of jobs) {
         await this.jobRepository.upsert({
           externalId: job.id,
           title: job.title,
           specialty: job.specialty,
           facilityName: job.facility_name,
           city: job.city,
           state: job.state,
           startDate: job.start_date,
           endDate: job.end_date,
           weeklyHours: job.weekly_hours,
           shiftDetails: job.shift_details,
           payRate: job.pay_rate,
           housingStipend: job.housing_stipend,
           requirements: job.requirements,
           benefits: job.benefits,
           status: job.status,
           updatedAt: new Date(),
           rawData: job // Store complete raw data for reference
         });
       }
     }
   }
   ```

3. **Scheduler Configuration**:
   ```javascript
   // src/backend/services/scheduler/job-scheduler.service.js
   const schedule = require('node-schedule');
   
   // Full sync at 3 AM daily
   schedule.scheduleJob('0 3 * * *', async () => {
     await jobSyncService.performFullSync();
   });
   
   // Incremental sync every 15 minutes
   schedule.scheduleJob('*/15 * * * *', async () => {
     const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000);
     await jobSyncService.performIncrementalSync(fifteenMinutesAgo);
   });
   ```

### Webhook Handler

```javascript
// src/backend/api/webhooks/laboredge-webhook.controller.js
router.post('/webhooks/laboredge', async (req, res) => {
  try {
    // Verify webhook signature
    const isValid = verifyWebhookSignature(req);
    if (!isValid) {
      return res.status(401).json({ error: 'Invalid signature' });
    }
    
    const event = req.body;
    
    switch (event.type) {
      case 'job.created':
      case 'job.updated':
        await jobSyncService.processJobs([event.data]);
        break;
      case 'job.deleted':
        await jobRepository.markAsDeleted(event.data.id);
        break;
      // Handle other event types
    }
    
    res.status(200).json({ success: true });
  } catch (error) {
    logger.error('Webhook processing error', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});
```

## Error Handling & Resilience

### Retry Mechanism

```javascript
// src/backend/utils/retry.js
async function withRetry(fn, options = {}) {
  const {
    maxRetries = 3,
    initialDelay = 1000,
    maxDelay = 30000,
    factor = 2,
    onRetry = () => {}
  } = options;
  
  let attempt = 0;
  let delay = initialDelay;
  
  while (true) {
    try {
      return await fn();
    } catch (error) {
      attempt++;
      
      if (attempt >= maxRetries) {
        throw error;
      }
      
      onRetry(error, attempt);
      
      await new Promise(resolve => setTimeout(resolve, delay));
      delay = Math.min(delay * factor, maxDelay);
    }
  }
}
```

### Circuit Breaker

```javascript
// src/backend/utils/circuit-breaker.js
class CircuitBreaker {
  constructor(options = {}) {
    this.failureThreshold = options.failureThreshold || 5;
    this.resetTimeout = options.resetTimeout || 30000;
    this.state = 'CLOSED';
    this.failureCount = 0;
    this.lastFailureTime = null;
  }
  
  async execute(fn) {
    if (this.state === 'OPEN') {
      if (Date.now() - this.lastFailureTime >= this.resetTimeout) {
        this.state = 'HALF_OPEN';
      } else {
        throw new Error('Circuit breaker is open');
      }
    }
    
    try {
      const result = await fn();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }
  
  onSuccess() {
    this.failureCount = 0;
    this.state = 'CLOSED';
  }
  
  onFailure() {
    this.failureCount++;
    this.lastFailureTime = Date.now();
    
    if (this.state === 'HALF_OPEN' || this.failureCount >= this.failureThreshold) {
      this.state = 'OPEN';
    }
  }
}
```

## Data Transformation Layer

### Job Data Transformer

```javascript
// src/backend/services/transformers/job-transformer.service.js
class JobTransformer {
  transformForAPI(jobEntity) {
    return {
      id: jobEntity.id,
      externalId: jobEntity.externalId,
      title: jobEntity.title,
      specialty: jobEntity.specialty,
      location: {
        facility: jobEntity.facilityName,
        city: jobEntity.city,
        state: jobEntity.state,
        coordinates: jobEntity.coordinates
      },
      duration: {
        startDate: jobEntity.startDate,
        endDate: jobEntity.endDate,
        weeklyHours: jobEntity.weeklyHours
      },
      compensation: {
        payRate: jobEntity.payRate,
        housingStipend: jobEntity.housingStipend,
        benefits: jobEntity.benefits
      },
      requirements: this.parseRequirements(jobEntity.requirements),
      shift: this.parseShiftDetails(jobEntity.shiftDetails),
      status: jobEntity.status,
      updatedAt: jobEntity.updatedAt
    };
  }
  
  parseRequirements(requirementsText) {
    // Parse requirements text into structured format
    // This could be enhanced with NLP in future versions
    const requirements = {
      certifications: [],
      experience: null,
      skills: []
    };
    
    // Basic parsing logic
    if (requirementsText) {
      // Extract certifications (e.g., "BLS, ACLS required")
      const certMatch = requirementsText.match(/\b(BLS|ACLS|PALS|TNCC|CCRN|CEN|CNOR|RN|LPN|CNA)\b/gi);
      if (certMatch) {
        requirements.certifications = certMatch;
      }
      
      // Extract experience (e.g., "2+ years experience")
      const expMatch = requirementsText.match(/(\d+)\+?\s*years?\s*experience/i);
      if (expMatch) {
        requirements.experience = parseInt(expMatch[1], 10);
      }
    }
    
    return requirements;
  }
  
  parseShiftDetails(shiftDetailsText) {
    // Parse shift details into structured format
    const shift = {
      type: null, // Day, Night, Evening, etc.
      hours: null, // 8, 10, 12
      schedule: null // 3x12, 4x10, etc.
    };
    
    if (shiftDetailsText) {
      // Extract shift type
      if (shiftDetailsText.match(/\bday\b/i)) shift.type = 'Day';
      else if (shiftDetailsText.match(/\bnight\b/i)) shift.type = 'Night';
      else if (shiftDetailsText.match(/\bevening\b/i)) shift.type = 'Evening';
      
      // Extract hours
      const hoursMatch = shiftDetailsText.match(/(\d+)\s*hour/i);
      if (hoursMatch) {
        shift.hours = parseInt(hoursMatch[1], 10);
      }
      
      // Extract schedule pattern
      const scheduleMatch = shiftDetailsText.match(/(\d+)x(\d+)/i);
      if (scheduleMatch) {
        shift.schedule = `${scheduleMatch[1]}x${scheduleMatch[2]}`;
      }
    }
    
    return shift;
  }
}
```

## Monitoring & Logging

### API Call Logging

```javascript
// src/backend/middleware/api-logger.middleware.js
const apiLogger = (req, res, next) => {
  const start = Date.now();
  const requestId = uuid.v4();
  
  // Log request
  logger.info({
    type: 'api_request',
    requestId,
    method: req.method,
    url: req.originalUrl,
    service: 'LaborEdge',
    timestamp: new Date().toISOString()
  });
  
  // Capture response
  const originalSend = res.send;
  res.send = function(body) {
    const duration = Date.now() - start;
    
    // Log response
    logger.info({
      type: 'api_response',
      requestId,
      statusCode: res.statusCode,
      duration,
      service: 'LaborEdge',
      timestamp: new Date().toISOString()
    });
    
    // Store metrics
    metrics.recordApiCall('laboredge', req.method, res.statusCode, duration);
    
    return originalSend.call(this, body);
  };
  
  next();
};
```

### Health Check Endpoint

```javascript
// src/backend/api/health/health.controller.js
router.get('/health/laboredge', async (req, res) => {
  try {
    // Check if we can authenticate with LaborEdge
    const token = await authService.getAccessToken();
    
    // Make a simple API call to verify connectivity
    await laboredgeApiService.getHealthCheck();
    
    res.status(200).json({
      status: 'UP',
      details: {
        authentication: 'SUCCESS',
        api: 'AVAILABLE'
      }
    });
  } catch (error) {
    logger.error('LaborEdge health check failed', error);
    
    res.status(503).json({
      status: 'DOWN',
      details: {
        authentication: error.message.includes('auth') ? 'FAILED' : 'UNKNOWN',
        api: error.message.includes('api') ? 'UNAVAILABLE' : 'UNKNOWN',
        error: error.message
      }
    });
  }
});
```

## Testing Strategy

### Unit Tests

```javascript
// src/backend/services/auth/__tests__/laboredge-auth.service.test.js
describe('LaborEdgeAuthService', () => {
  let authService;
  let mockRedisClient;
  let mockAxios;
  
  beforeEach(() => {
    mockRedisClient = {
      get: jest.fn(),
      set: jest.fn()
    };
    
    mockAxios = {
      post: jest.fn()
    };
    
    authService = new LaborEdgeAuthService({
      LABOREDGE_CLIENT_ID: 'test-client-id',
      LABOREDGE_CLIENT_SECRET: 'test-client-secret',
      LABOREDGE_TOKEN_URL: 'https://api.laboredge.com/oauth/token'
    }, mockRedisClient);
    
    authService.axios = mockAxios;
  });
  
  test('should return cached token if available', async () => {
    mockRedisClient.get.mockResolvedValue('cached-token');
    
    const token = await authService.getAccessToken();
    
    expect(token).toBe('cached-token');
    expect(mockRedisClient.get).toHaveBeenCalledWith('laboredge_access_token');
    expect(mockAxios.post).not.toHaveBeenCalled();
  });
  
  test('should request new token if cache is empty', async () => {
    mockRedisClient.get.mockResolvedValue(null);
    mockAxios.post.mockResolvedValue({
      data: {
        access_token: 'new-token',
        expires_in: 3600
      }
    });
    
    const token = await authService.getAccessToken();
    
    expect(token).toBe('new-token');
    expect(mockRedisClient.get).toHaveBeenCalledWith('laboredge_access_token');
    expect(mockAxios.post).toHaveBeenCalledWith(
      'https://api.laboredge.com/oauth/token',
      {
        grant_type: 'client_credentials',
        client_id: 'test-client-id',
        client_secret: 'test-client-secret'
      }
    );
    expect(mockRedisClient.set).toHaveBeenCalledWith(
      'laboredge_access_token',
      'new-token',
      'EX',
      3540 // 3600 - 60
    );
  });
});
```

### Integration Tests

```javascript
// src/backend/services/sync/__tests__/job-sync.service.integration.test.js
describe('JobSyncService Integration', () => {
  let jobSyncService;
  let jobRepository;
  let laboredgeApiService;
  
  beforeAll(async () => {
    // Set up test database
    await setupTestDatabase();
    
    // Create real repositories with test DB connection
    jobRepository = new JobRepository(testDbConnection);
    
    // Mock the API service
    laboredgeApiService = {
      getJobs: jest.fn(),
      getJobsUpdatedSince: jest.fn()
    };
    
    jobSyncService = new JobSyncService(laboredgeApiService, jobRepository);
  });
  
  afterAll(async () => {
    await cleanupTestDatabase();
  });
  
  beforeEach(async () => {
    // Clear the jobs table before each test
    await jobRepository.deleteAll();
  });
  
  test('should perform full sync and store jobs in database', async () => {
    // Mock API response
    laboredgeApiService.getJobs.mockResolvedValueOnce({
      data: [
        {
          id: 'job-1',
          title: 'ICU Nurse',
          specialty: 'ICU',
          facility_name: 'Memorial Hospital',
          city: 'Los Angeles',
          state: 'CA',
          start_date: '2025-09-01',
          end_date: '2025-12-01',
          weekly_hours: 36,
          shift_details: 'Night shift, 12 hours, 3x12',
          pay_rate: 3200,
          housing_stipend: 1200,
          requirements: 'BLS, ACLS required. 2+ years ICU experience.',
          benefits: 'Medical, dental, vision',
          status: 'active'
        },
        {
          id: 'job-2',
          title: 'ER Nurse',
          specialty: 'Emergency',
          facility_name: 'County Hospital',
          city: 'San Francisco',
          state: 'CA',
          start_date: '2025-09-15',
          end_date: '2025-12-15',
          weekly_hours: 40,
          shift_details: 'Day shift, 10 hours, 4x10',
          pay_rate: 3400,
          housing_stipend: 1400,
          requirements: 'BLS, ACLS, PALS required. 3+ years ER experience.',
          benefits: 'Medical, dental, vision, 401k',
          status: 'active'
        }
      ]
    }).mockResolvedValueOnce({
      data: [] // No more data on second page
    });
    
    // Perform full sync
    await jobSyncService.performFullSync();
    
    // Verify API was called
    expect(laboredgeApiService.getJobs).toHaveBeenCalledWith({ page: 1, limit: 100 });
    expect(laboredgeApiService.getJobs).toHaveBeenCalledWith({ page: 2, limit: 100 });
    
    // Verify jobs were stored in database
    const jobs = await jobRepository.findAll();
    expect(jobs).toHaveLength(2);
    
    expect(jobs[0].externalId).toBe('job-1');
    expect(jobs[0].title).toBe('ICU Nurse');
    expect(jobs[0].specialty).toBe('ICU');
    
    expect(jobs[1].externalId).toBe('job-2');
    expect(jobs[1].title).toBe('ER Nurse');
    expect(jobs[1].specialty).toBe('Emergency');
  });
});
```

## Deployment Configuration

### Environment Variables

```
# LaborEdge API Configuration
LABOREDGE_API_BASE_URL=https://api.laboredge.com/v1
LABOREDGE_CLIENT_ID=your-client-id
LABOREDGE_CLIENT_SECRET=your-client-secret
LABOREDGE_TOKEN_URL=https://api.laboredge.com/oauth/token
LABOREDGE_WEBHOOK_SECRET=your-webhook-secret

# Database Configuration
POSTGRES_HOST=postgres
POSTGRES_PORT=5432
POSTGRES_DB=excel_medical
POSTGRES_USER=app_user
POSTGRES_PASSWORD=secure_password

# Redis Configuration
REDIS_HOST=redis
REDIS_PORT=6379
REDIS_PASSWORD=secure_redis_password

# Logging Configuration
LOG_LEVEL=info
ENABLE_API_LOGGING=true
```

### Docker Compose Configuration

```yaml
# docker-compose.yml
version: '3.8'

services:
  api:
    build:
      context: .
      dockerfile: Dockerfile
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - LABOREDGE_API_BASE_URL=${LABOREDGE_API_BASE_URL}
      - LABOREDGE_CLIENT_ID=${LABOREDGE_CLIENT_ID}
      - LABOREDGE_CLIENT_SECRET=${LABOREDGE_CLIENT_SECRET}
      - LABOREDGE_TOKEN_URL=${LABOREDGE_TOKEN_URL}
      - LABOREDGE_WEBHOOK_SECRET=${LABOREDGE_WEBHOOK_SECRET}
      - POSTGRES_HOST=postgres
      - POSTGRES_PORT=5432
      - POSTGRES_DB=${POSTGRES_DB}
      - POSTGRES_USER=${POSTGRES_USER}
      - POSTGRES_PASSWORD=${POSTGRES_PASSWORD}
      - REDIS_HOST=redis
      - REDIS_PORT=6379
      - REDIS_PASSWORD=${REDIS_PASSWORD}
    depends_on:
      - postgres
      - redis
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s

  postgres:
    image: postgres:14-alpine
    environment:
      - POSTGRES_DB=${POSTGRES_DB}
      - POSTGRES_USER=${POSTGRES_USER}
      - POSTGRES_PASSWORD=${POSTGRES_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    restart: unless-stopped
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${POSTGRES_USER} -d ${POSTGRES_DB}"]
      interval: 10s
      timeout: 5s
      retries: 5

  redis:
    image: redis:7-alpine
    command: redis-server --requirepass ${REDIS_PASSWORD}
    volumes:
      - redis_data:/data
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "redis-cli", "-a", "${REDIS_PASSWORD}", "ping"]
      interval: 10s
      timeout: 5s
      retries: 5

volumes:
  postgres_data:
  redis_data:
```

## Next Steps

1. Implement the authentication service
2. Set up the database models and repositories
3. Create the API wrapper services
4. Implement the data synchronization service
5. Set up the webhook handler
6. Configure the monitoring and logging
7. Write unit and integration tests
8. Create deployment configuration