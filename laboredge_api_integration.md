# LaborEdge API Integration Plan

## 1. Overview

This document outlines the integration strategy between Excel Medical Staffing's platform and the LaborEdge ATS/VMS API. The integration will enable seamless job data synchronization, candidate submission, and status tracking between the two systems.

## 2. Authentication Flow

### 2.1 OAuth Authentication

Based on the LaborEdge API documentation, we'll implement the following authentication flow:

1. **Initial Authentication**
   - Endpoint: `https://api-nexus.laboredge.com:9000/api/secured/oauth/token`
   - Method: POST
   - Headers:
     ```
     Content-Type: application/x-www-form-urlencoded
     Authorization: Basic dm1zOnZtc1NlY3JldCMk
     ```
   - Request Body:
     ```
     username=<provided_by_LaborEdge>
     password=<provided_by_LaborEdge>
     client_id=<provided_by_LaborEdge>
     grant_type=<provided_by_LaborEdge>
     organizationCode=<provided_by_LaborEdge>
     ```
   - Response:
     ```json
     {
       "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
       "token_type": "bearer",
       "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
       "expires_in": 7199,
       "scope": "read write",
       ...
     }
     ```

2. **Token Refresh**
   - Implement automatic token refresh when the access token expires
   - Store refresh token securely
   - Set up a background job to refresh tokens before expiration

### 2.2 Token Management

1. **Secure Storage**
   - Store access and refresh tokens in a secure vault (e.g., AWS Secrets Manager)
   - Never expose tokens in client-side code or logs

2. **Token Rotation**
   - Implement token rotation strategy
   - Handle token revocation scenarios

3. **Error Handling**
   - Handle authentication failures
   - Implement exponential backoff for retry attempts
   - Alert system administrators on persistent authentication issues

## 3. Master Data Synchronization

### 3.1 Initial Data Load

The following master data will be synchronized from LaborEdge to our system:

1. **Professions**
   - Endpoint: `https://api-nexus.laboredge.com:9000/api/api-integration/v1/master/professions`
   - Method: GET
   - Frequency: Daily sync, with initial full load

2. **Specialties**
   - Endpoint: `https://api-nexus.laboredge.com:9000/api/api-integration/v1/master/specialties`
   - Method: GET
   - Frequency: Daily sync, with initial full load

3. **States**
   - Endpoint: `https://api-nexus.laboredge.com:9000/api/api-integration/v1/master/states`
   - Method: GET
   - Frequency: Monthly sync, with initial full load

4. **Countries**
   - Endpoint: `https://api-nexus.laboredge.com:9000/api/api-integration/v1/master/countries`
   - Method: GET
   - Frequency: Monthly sync, with initial full load

5. **Candidate Statuses**
   - Endpoint: `https://api-nexus.laboredge.com:9000/api/api-integration/v1/master/candidate-statuses`
   - Method: GET
   - Frequency: Weekly sync, with initial full load

6. **Referral Sources**
   - Endpoint: `https://api-nexus.laboredge.com:9000/api/api-integration/v1/master/referral-sources`
   - Method: GET
   - Frequency: Weekly sync, with initial full load

7. **Recruiters**
   - Endpoint: `https://api-nexus.laboredge.com:9000/api/api-integration/v1/master/recruiters`
   - Method: GET
   - Frequency: Daily sync, with initial full load

8. **Candidate Types**
   - Endpoint: `https://api-nexus.laboredge.com:9000/api/api-integration/v1/master/candidate-types`
   - Method: GET
   - Frequency: Weekly sync, with initial full load

### 3.2 Data Mapping

Each master data entity will be mapped to our internal database schema:

| LaborEdge Entity | Excel Medical Staffing Entity | Mapping Strategy |
|------------------|-------------------------------|------------------|
| Profession | professions | Direct mapping with external_id reference |
| Specialty | specialties | Direct mapping with external_id reference |
| State | states | Direct mapping with external_id reference |
| Country | countries | Direct mapping with external_id reference |
| Candidate Status | candidate_statuses | Direct mapping with external_id reference |
| Referral Source | referral_sources | Direct mapping with external_id reference |
| Recruiter | recruiters | Map to internal recruiter with external_recruiter_id |
| Candidate Type | candidate_types | Direct mapping with external_id reference |

## 4. Job Data Synchronization

### 4.1 Job Fetching Strategy

1. **Initial Full Load**
   - Fetch all open jobs to populate the initial database
   - Transform and enhance job data with AI-generated content
   - Index jobs in Elasticsearch for search functionality

2. **Incremental Updates**
   - Schedule hourly job syncs for new and updated jobs
   - Use date filters to only fetch jobs modified since last sync
   - Implement delta detection to minimize data transfer

3. **Real-time Updates**
   - Set up webhooks (if supported by LaborEdge) for real-time job updates
   - Implement event-driven architecture for job data processing

### 4.2 Job Search API Integration

Based on the LaborEdge API documentation:

- Endpoint: `https://api-nexus.laboredge.com:9000/api/job-service/v1/ats/external/jobs/search`
- Method: POST
- Headers:
  ```
  Authorization: Bearer <jwt_access_token>
  ```
- Request Body:
  ```json
  {
    "jobStatusCode": "OPEN",
    "startDateFrom": "2025-08-01",
    "startDateTo": "2025-09-30",
    "pagingDetails": {"start": 0},
    "hotJob": true
  }
  ```

### 4.3 Job Data Processing Pipeline

1. **Fetch Jobs**
   - Call LaborEdge API with appropriate filters
   - Handle pagination (100 records at a time)
   - Process all pages until complete dataset is retrieved

2. **Transform Job Data**
   - Map LaborEdge job fields to our schema
   - Extract and normalize rate information
   - Process certification requirements

3. **Enhance Job Data**
   - Generate SEO-optimized job titles and descriptions
   - Add schema markup for job postings
   - Generate location-specific content

4. **Store and Index**
   - Save to PostgreSQL database
   - Index in Elasticsearch
   - Generate static pages for high-traffic job categories

### 4.4 Job Data Refresh Strategy

1. **Full Refresh (Daily)**
   - Complete refresh of all active jobs
   - Update all job metadata and status information

2. **Incremental Updates (Hourly)**
   - Fetch only jobs modified since last sync
   - Update changed fields only

3. **Status Updates (Real-time)**
   - Monitor for job status changes
   - Immediately update when jobs are filled or closed

## 5. Candidate Data Integration

### 5.1 Candidate Submission

Based on the LaborEdge API documentation:

- Endpoint: `https://api-nexus.laboredge.com:9000/api/api-integration/v1/candidates`
- Method: POST
- Headers:
  ```
  Authorization: Bearer <access_token>
  ```
- Request Body:
  ```json
  {
    "firstName": "John",
    "lastName": "Doe",
    "email": "john.doe@example.com",
    "phone": "123-456-7890",
    "cellPhone": "987-654-3210",
    "statusId": 1,
    "referralSourceId": 2,
    "professionIds": [15],
    "specialtyIds": [24],
    "primarySpecialtyId": 24,
    "jobTypeIds": [
      "PERM",
      "TRAVEL"
    ],
    "addressLine1": "123 Main St",
    "city": "Springfield",
    "stateId": 245,
    "zip": "12345",
    "countryId": 8,
    "yearsOfExperience": 5.5,
    "availableFrom": "2025-09-01",
    "preferredStateIds": [228],
    "candidateTypeIds": [1],
    "licensedStateIds": [241, 259],
    "travelStatus": true,
    "recruiterId": 1475
  }
  ```

### 5.2 Candidate Update

- Endpoint: `https://api-nexus.laboredge.com:9000/api/api-integration/v1/candidates/{candidateId}`
- Method: PUT
- Similar payload structure to candidate submission

### 5.3 Candidate Data Processing Pipeline

1. **Capture Application**
   - Collect candidate information from application form
   - Parse resume using AI resume parser
   - Validate required fields

2. **Transform Data**
   - Map internal candidate fields to LaborEdge format
   - Format data according to API requirements
   - Validate against LaborEdge constraints

3. **Submit to LaborEdge**
   - Call candidate submission API
   - Store external candidate ID for future reference
   - Handle submission errors

4. **Status Tracking**
   - Periodically check candidate status
   - Update internal records based on LaborEdge status
   - Notify candidate of status changes

### 5.4 Resume Parsing and Submission

1. **Resume Parsing Flow**
   - Extract text from resume (PDF, DOCX, etc.)
   - Use AI to identify key information (contact details, experience, skills, etc.)
   - Populate candidate profile with extracted data
   - Allow candidate to verify and correct information

2. **Data Enrichment**
   - Identify missing required fields
   - Prompt candidate to provide additional information
   - Validate professional credentials

3. **Submission to LaborEdge**
   - Format parsed data according to LaborEdge API requirements
   - Submit candidate profile
   - Track submission status

## 6. Error Handling and Monitoring

### 6.1 Error Handling Strategy

1. **API Errors**
   - Implement retry logic with exponential backoff
   - Log detailed error information
   - Alert on persistent errors

2. **Data Validation Errors**
   - Validate data before submission
   - Provide clear error messages
   - Implement data correction workflows

3. **Network Errors**
   - Handle timeouts and connection issues
   - Implement circuit breaker pattern
   - Queue failed requests for retry

### 6.2 Monitoring and Alerting

1. **API Health Monitoring**
   - Track API response times
   - Monitor error rates
   - Set up alerts for API degradation

2. **Data Sync Monitoring**
   - Track job and candidate sync status
   - Monitor data consistency between systems
   - Alert on sync failures

3. **Usage Metrics**
   - Track API call volume
   - Monitor rate limit usage
   - Forecast capacity needs

## 7. Implementation Phases

### 7.1 Phase 1: Authentication and Master Data

1. Implement OAuth authentication flow
2. Set up secure token storage and management
3. Implement master data synchronization
4. Validate data mapping and consistency

### 7.2 Phase 2: Job Data Integration

1. Implement job search API integration
2. Set up job data processing pipeline
3. Implement job data enhancement with AI
4. Deploy job search and display functionality

### 7.3 Phase 3: Candidate Submission

1. Implement resume parsing
2. Build candidate data collection forms
3. Implement candidate submission to LaborEdge
4. Set up candidate status tracking

### 7.4 Phase 4: Advanced Features

1. Implement real-time updates
2. Set up bidirectional sync
3. Implement analytics and reporting
4. Optimize performance and scalability

## 8. Testing Strategy

### 8.1 Integration Testing

1. **Authentication Testing**
   - Verify token acquisition
   - Test token refresh
   - Validate error handling

2. **Data Sync Testing**
   - Verify master data synchronization
   - Test job data retrieval and processing
   - Validate candidate submission

### 8.2 Performance Testing

1. **Load Testing**
   - Test API performance under load
   - Validate rate limiting handling
   - Measure response times

2. **Volume Testing**
   - Test with large datasets
   - Validate pagination handling
   - Measure processing times

### 8.3 Error Handling Testing

1. **Failure Scenarios**
   - Test network failures
   - Validate timeout handling
   - Verify retry mechanisms

2. **Data Error Scenarios**
   - Test with invalid data
   - Validate error responses
   - Verify data correction workflows

## 9. Security Considerations

### 9.1 Data Protection

1. **Credential Security**
   - Store API credentials in secure vault
   - Rotate credentials regularly
   - Implement least privilege access

2. **Data Encryption**
   - Encrypt sensitive data at rest
   - Use HTTPS for all API communications
   - Implement field-level encryption for PII

### 9.2 Compliance

1. **Audit Logging**
   - Log all API interactions
   - Track data access and modifications
   - Maintain compliance audit trail

2. **Data Retention**
   - Implement data retention policies
   - Provide data deletion capabilities
   - Comply with privacy regulations

## 10. Maintenance and Support

### 10.1 Ongoing Maintenance

1. **API Version Management**
   - Monitor for API changes
   - Plan for version upgrades
   - Maintain backward compatibility

2. **Performance Optimization**
   - Regularly review API usage
   - Optimize data synchronization
   - Tune caching strategies

### 10.2 Support Procedures

1. **Issue Resolution**
   - Define escalation procedures
   - Establish communication channels with LaborEdge
   - Document troubleshooting processes

2. **Documentation**
   - Maintain up-to-date integration documentation
   - Document API usage patterns
   - Create troubleshooting guides