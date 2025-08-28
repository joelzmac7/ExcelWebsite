# LaborEdge API Authentication Guide

## Overview

This document provides instructions for authenticating with the LaborEdge API, which is the primary data source for job listings, facilities, and other critical information for the Excel Medical Staffing AI Platform.

## Authentication Credentials

The LaborEdge API uses OAuth 2.0 for authentication. The following credentials have been provided for API access:

- **Username**: `API_Excel_User`
- **Password**: `API@EXCEL_03262025`
- **Organization Code**: `Excel`
- **Grant Type**: `password`

> **IMPORTANT SECURITY NOTICE**: These credentials should be treated as sensitive information. Do not commit them to public repositories, share them in unsecured communications, or expose them in client-side code. Always store these credentials in secure environment variables or a secrets management system.

## Authentication Flow

### 1. Obtain Access Token

To authenticate with the LaborEdge API, you need to obtain an access token by making a POST request to the token endpoint.

#### Request

```http
POST /oauth/token HTTP/1.1
Host: api.laboredge.com
Content-Type: application/x-www-form-urlencoded

grant_type=password&username=API_Excel_User&password=API@EXCEL_03262025&organizationCode=Excel
```

#### cURL Example

```bash
curl -X POST \
  https://api.laboredge.com/oauth/token \
  -H 'Content-Type: application/x-www-form-urlencoded' \
  -d 'grant_type=password&username=API_Excel_User&password=API@EXCEL_03262025&organizationCode=Excel'
```

#### JavaScript Example

```javascript
const axios = require('axios');
const qs = require('querystring');

const getAccessToken = async () => {
  try {
    const response = await axios.post('https://api.laboredge.com/oauth/token', 
      qs.stringify({
        grant_type: 'password',
        username: 'API_Excel_User',
        password: 'API@EXCEL_03262025',
        organizationCode: 'Excel'
      }),
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      }
    );
    
    return response.data;
  } catch (error) {
    console.error('Authentication error:', error.response?.data || error.message);
    throw error;
  }
};
```

#### Expected Response

```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "Bearer",
  "expires_in": 3600,
  "refresh_token": "def50200641f3e6c83a31a..."
}
```

### 2. Use Access Token for API Requests

Once you have obtained an access token, include it in the Authorization header of all API requests.

#### Request Example

```http
GET /api/v1/jobs HTTP/1.1
Host: api.laboredge.com
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

#### cURL Example

```bash
curl -X GET \
  https://api.laboredge.com/api/v1/jobs \
  -H 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
```

#### JavaScript Example

```javascript
const axios = require('axios');

const getJobs = async (accessToken) => {
  try {
    const response = await axios.get('https://api.laboredge.com/api/v1/jobs', {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });
    
    return response.data;
  } catch (error) {
    console.error('API request error:', error.response?.data || error.message);
    throw error;
  }
};
```

### 3. Refresh Token

Access tokens expire after the time specified in the `expires_in` field of the token response (typically 1 hour). When an access token expires, you can obtain a new one using the refresh token.

#### Request

```http
POST /oauth/token HTTP/1.1
Host: api.laboredge.com
Content-Type: application/x-www-form-urlencoded

grant_type=refresh_token&refresh_token=def50200641f3e6c83a31a...
```

#### cURL Example

```bash
curl -X POST \
  https://api.laboredge.com/oauth/token \
  -H 'Content-Type: application/x-www-form-urlencoded' \
  -d 'grant_type=refresh_token&refresh_token=def50200641f3e6c83a31a...'
```

#### JavaScript Example

```javascript
const axios = require('axios');
const qs = require('querystring');

const refreshAccessToken = async (refreshToken) => {
  try {
    const response = await axios.post('https://api.laboredge.com/oauth/token', 
      qs.stringify({
        grant_type: 'refresh_token',
        refresh_token: refreshToken
      }),
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      }
    );
    
    return response.data;
  } catch (error) {
    console.error('Token refresh error:', error.response?.data || error.message);
    throw error;
  }
};
```

## Implementation in Our Application

### Authentication Service

In our application, we will implement an authentication service that handles token acquisition, storage, and renewal. Here's a simplified example of how this service will be implemented:

```typescript
// src/services/auth/laboredge-auth.service.ts
import axios from 'axios';
import * as qs from 'querystring';
import { RedisClient } from 'redis';
import { promisify } from 'util';

export class LaborEdgeAuthService {
  private readonly clientId: string;
  private readonly clientSecret: string;
  private readonly tokenUrl: string;
  private readonly redisClient: RedisClient;
  private readonly getAsync: (key: string) => Promise<string | null>;
  private readonly setAsync: (key: string, value: string, mode: string, duration: number) => Promise<unknown>;

  constructor(config: any, redisClient: RedisClient) {
    this.clientId = config.LABOREDGE_CLIENT_ID || 'API_Excel_User';
    this.clientSecret = config.LABOREDGE_CLIENT_SECRET || 'API@EXCEL_03262025';
    this.tokenUrl = config.LABOREDGE_TOKEN_URL || 'https://api.laboredge.com/oauth/token';
    this.redisClient = redisClient;
    
    // Promisify Redis methods
    this.getAsync = promisify(this.redisClient.get).bind(this.redisClient);
    this.setAsync = promisify(this.redisClient.set).bind(this.redisClient);
  }
  
  async getAccessToken(): Promise<string> {
    try {
      // Check if token exists in Redis cache
      const cachedToken = await this.getAsync('laboredge_access_token');
      if (cachedToken) {
        return cachedToken;
      }
      
      // If no cached token, request a new one
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
      console.error('Failed to get access token:', error);
      throw new Error('Authentication failed');
    }
  }
  
  private async requestNewToken(): Promise<any> {
    try {
      // Check if we have a refresh token
      const refreshToken = await this.getAsync('laboredge_refresh_token');
      
      if (refreshToken) {
        // Try to use refresh token
        try {
          return await this.refreshToken(refreshToken);
        } catch (refreshError) {
          console.warn('Refresh token failed, falling back to password grant:', refreshError);
          // If refresh fails, fall back to password grant
        }
      }
      
      // Use password grant
      const response = await axios.post(this.tokenUrl, 
        qs.stringify({
          grant_type: 'password',
          username: this.clientId,
          password: this.clientSecret,
          organizationCode: 'Excel'
        }),
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
          }
        }
      );
      
      return response.data;
    } catch (error) {
      console.error('Token request failed:', error.response?.data || error.message);
      throw error;
    }
  }
  
  private async refreshToken(refreshToken: string): Promise<any> {
    try {
      const response = await axios.post(this.tokenUrl, 
        qs.stringify({
          grant_type: 'refresh_token',
          refresh_token: refreshToken
        }),
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
          }
        }
      );
      
      return response.data;
    } catch (error) {
      console.error('Token refresh failed:', error.response?.data || error.message);
      throw error;
    }
  }
}
```

### API Request Interceptor

We will also implement an API request interceptor that automatically adds the authentication token to all requests and handles token renewal when needed:

```typescript
// src/services/api/laboredge-api.service.ts
import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';
import { LaborEdgeAuthService } from '../auth/laboredge-auth.service';

export class LaborEdgeApiService {
  private readonly axiosInstance: AxiosInstance;
  private readonly authService: LaborEdgeAuthService;
  
  constructor(config: any, authService: LaborEdgeAuthService) {
    this.authService = authService;
    
    this.axiosInstance = axios.create({
      baseURL: config.LABOREDGE_API_BASE_URL || 'https://api.laboredge.com',
      timeout: 10000
    });
    
    // Request interceptor to add authentication token
    this.axiosInstance.interceptors.request.use(
      async (config: AxiosRequestConfig) => {
        const token = await this.authService.getAccessToken();
        if (token) {
          config.headers = {
            ...config.headers,
            Authorization: `Bearer ${token}`
          };
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );
    
    // Response interceptor to handle errors
    this.axiosInstance.interceptors.response.use(
      (response) => {
        return response;
      },
      async (error) => {
        // Handle 401 errors (unauthorized)
        if (error.response && error.response.status === 401) {
          // Force token refresh on next request
          await this.authService.getAccessToken();
        }
        return Promise.reject(error);
      }
    );
  }
  
  // API methods
  async getJobs(params?: any) {
    return this.axiosInstance.get('/api/v1/jobs', { params });
  }
  
  async getJobById(id: string) {
    return this.axiosInstance.get(`/api/v1/jobs/${id}`);
  }
  
  async getJobsUpdatedSince(date: Date) {
    return this.axiosInstance.get('/api/v1/jobs', {
      params: {
        updated_since: date.toISOString()
      }
    });
  }
  
  // Add more API methods as needed
}
```

## Security Considerations

1. **Environment Variables**: Store API credentials in environment variables, not in code.
2. **Secure Storage**: Use a secure storage solution like AWS Secrets Manager or HashiCorp Vault for production environments.
3. **Token Handling**: Never expose tokens to client-side code or log them.
4. **HTTPS**: Always use HTTPS for API communications.
5. **IP Restrictions**: Consider implementing IP restrictions for API access if supported by LaborEdge.
6. **Monitoring**: Implement monitoring for authentication failures and suspicious activity.

## Error Handling

Common authentication errors and how to handle them:

| Error | Description | Handling Strategy |
|-------|-------------|-------------------|
| 401 Unauthorized | Invalid credentials or expired token | Retry with new credentials or refresh token |
| 403 Forbidden | Insufficient permissions | Check API permissions and roles |
| 429 Too Many Requests | Rate limit exceeded | Implement exponential backoff and retry |
| 500 Server Error | Server-side issue | Retry with exponential backoff |

## Troubleshooting

If you encounter authentication issues:

1. Verify that the credentials are correct
2. Check that the organization code is correct
3. Ensure the API endpoint URLs are correct
4. Verify that your IP address is allowed by LaborEdge
5. Check for rate limiting issues
6. Look for error messages in the API response

## References

- [LaborEdge API Documentation](https://api.laboredge.com/docs)
- [OAuth 2.0 Password Grant](https://oauth.net/2/grant-types/password/)
- [JWT.io](https://jwt.io/) - For debugging JWT tokens

## Next Steps

1. Implement the authentication service in the backend
2. Set up secure credential storage
3. Create API wrapper services for different LaborEdge endpoints
4. Implement error handling and retry logic
5. Set up monitoring for authentication issues