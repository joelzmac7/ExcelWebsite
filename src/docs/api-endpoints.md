# Excel Medical Staffing AI Platform - API Endpoints

## Overview

This document outlines the API endpoints for the Excel Medical Staffing AI Platform. The API follows RESTful principles and uses JSON for request and response bodies. All endpoints are prefixed with `/api/v1`.

## Authentication

### Authentication Endpoints

| Method | Endpoint | Description | Request Body | Response |
|--------|----------|-------------|-------------|----------|
| `POST` | `/auth/login` | User login | `{ "email": "string", "password": "string" }` | `{ "token": "string", "user": User }` |
| `POST` | `/auth/register` | User registration | `{ "email": "string", "password": "string", "firstName": "string", "lastName": "string", "role": "string", "phone": "string" }` | `{ "token": "string", "user": User }` |
| `POST` | `/auth/logout` | User logout | None | `{ "success": true }` |
| `POST` | `/auth/refresh-token` | Refresh authentication token | `{ "refreshToken": "string" }` | `{ "token": "string", "refreshToken": "string" }` |
| `POST` | `/auth/forgot-password` | Request password reset | `{ "email": "string" }` | `{ "success": true, "message": "string" }` |
| `POST` | `/auth/reset-password` | Reset password | `{ "token": "string", "password": "string" }` | `{ "success": true }` |
| `GET` | `/auth/verify-email/:token` | Verify email address | None | `{ "success": true }` |

### Authentication Headers

All authenticated requests must include the following header:

```
Authorization: Bearer {token}
```

## Users

### User Endpoints

| Method | Endpoint | Description | Request Body | Response |
|--------|----------|-------------|-------------|----------|
| `GET` | `/users/me` | Get current user profile | None | `User` |
| `PUT` | `/users/me` | Update current user profile | `UserUpdateDto` | `User` |
| `GET` | `/users/:id` | Get user by ID | None | `User` |
| `PUT` | `/users/:id` | Update user by ID (admin only) | `UserUpdateDto` | `User` |
| `DELETE` | `/users/:id` | Delete user by ID (admin only) | None | `{ "success": true }` |
| `GET` | `/users` | Get users (admin only) | None | `{ "users": User[], "total": number, "page": number, "limit": number }` |

### User Profile Endpoints

| Method | Endpoint | Description | Request Body | Response |
|--------|----------|-------------|-------------|----------|
| `GET` | `/users/me/profile` | Get detailed user profile | None | `UserProfile` |
| `PUT` | `/users/me/profile` | Update user profile | `ProfileUpdateDto` | `UserProfile` |
| `GET` | `/users/me/preferences` | Get user preferences | None | `UserPreferences` |
| `PUT` | `/users/me/preferences` | Update user preferences | `PreferencesUpdateDto` | `UserPreferences` |
| `GET` | `/users/me/licenses` | Get user licenses | None | `License[]` |
| `POST` | `/users/me/licenses` | Add user license | `LicenseDto` | `License` |
| `PUT` | `/users/me/licenses/:id` | Update user license | `LicenseDto` | `License` |
| `DELETE` | `/users/me/licenses/:id` | Delete user license | None | `{ "success": true }` |
| `GET` | `/users/me/certifications` | Get user certifications | None | `Certification[]` |
| `POST` | `/users/me/certifications` | Add user certification | `CertificationDto` | `Certification` |
| `PUT` | `/users/me/certifications/:id` | Update user certification | `CertificationDto` | `Certification` |
| `DELETE` | `/users/me/certifications/:id` | Delete user certification | None | `{ "success": true }` |
| `GET` | `/users/me/experience` | Get user work experience | None | `WorkExperience[]` |
| `POST` | `/users/me/experience` | Add work experience | `WorkExperienceDto` | `WorkExperience` |
| `PUT` | `/users/me/experience/:id` | Update work experience | `WorkExperienceDto` | `WorkExperience` |
| `DELETE` | `/users/me/experience/:id` | Delete work experience | None | `{ "success": true }` |

## Jobs

### Job Search Endpoints

| Method | Endpoint | Description | Query Parameters | Response |
|--------|----------|-------------|-----------------|----------|
| `GET` | `/jobs` | Search jobs | `specialty`, `state`, `city`, `minPay`, `maxPay`, `shiftType`, `startDate`, `endDate`, `page`, `limit`, `sort`, `featured` | `{ "jobs": Job[], "total": number, "page": number, "limit": number }` |
| `GET` | `/jobs/:id` | Get job by ID | None | `Job` |
| `GET` | `/jobs/featured` | Get featured jobs | `limit` | `Job[]` |
| `GET` | `/jobs/recent` | Get recently posted jobs | `limit` | `Job[]` |
| `GET` | `/jobs/similar/:id` | Get similar jobs | `limit` | `Job[]` |
| `GET` | `/jobs/search` | Search jobs with natural language | `q` (query string) | `{ "jobs": Job[], "total": number, "page": number, "limit": number }` |

### Job Management Endpoints (Recruiter/Admin)

| Method | Endpoint | Description | Request Body | Response |
|--------|----------|-------------|-------------|----------|
| `POST` | `/jobs` | Create job | `JobCreateDto` | `Job` |
| `PUT` | `/jobs/:id` | Update job | `JobUpdateDto` | `Job` |
| `DELETE` | `/jobs/:id` | Delete job | None | `{ "success": true }` |
| `PUT` | `/jobs/:id/status` | Update job status | `{ "status": "string" }` | `Job` |
| `PUT` | `/jobs/:id/featured` | Toggle featured status | `{ "featured": boolean }` | `Job` |
| `GET` | `/jobs/recruiter/:recruiterId` | Get recruiter's jobs | `page`, `limit`, `status` | `{ "jobs": Job[], "total": number, "page": number, "limit": number }` |

### Job Interaction Endpoints

| Method | Endpoint | Description | Request Body | Response |
|--------|----------|-------------|-------------|----------|
| `POST` | `/jobs/:id/view` | Record job view | None | `{ "success": true }` |
| `POST` | `/jobs/:id/save` | Save job | None | `{ "success": true }` |
| `DELETE` | `/jobs/:id/save` | Unsave job | None | `{ "success": true }` |
| `GET` | `/jobs/saved` | Get saved jobs | `page`, `limit` | `{ "jobs": Job[], "total": number, "page": number, "limit": number }` |
| `POST` | `/jobs/:id/share` | Share job | `{ "method": "string", "recipient": "string" }` | `{ "success": true, "shareUrl": "string" }` |

## Applications

### Application Endpoints

| Method | Endpoint | Description | Request Body/Query Parameters | Response |
|--------|----------|-------------|--------------------------|----------|
| `POST` | `/applications` | Submit application | `ApplicationCreateDto` | `Application` |
| `GET` | `/applications/:id` | Get application by ID | None | `Application` |
| `GET` | `/applications` | Get user applications | `page`, `limit`, `status` | `{ "applications": Application[], "total": number, "page": number, "limit": number }` |
| `PUT` | `/applications/:id/withdraw` | Withdraw application | None | `Application` |

### Application Management Endpoints (Recruiter/Admin)

| Method | Endpoint | Description | Request Body | Response |
|--------|----------|-------------|-------------|----------|
| `GET` | `/applications/job/:jobId` | Get applications for job | `page`, `limit`, `status` | `{ "applications": Application[], "total": number, "page": number, "limit": number }` |
| `GET` | `/applications/recruiter/:recruiterId` | Get recruiter's applications | `page`, `limit`, `status` | `{ "applications": Application[], "total": number, "page": number, "limit": number }` |
| `PUT` | `/applications/:id/status` | Update application status | `{ "status": "string", "notes": "string" }` | `Application` |
| `POST` | `/applications/:id/notes` | Add recruiter notes | `{ "notes": "string" }` | `Application` |

## Resumes

### Resume Endpoints

| Method | Endpoint | Description | Request Body | Response |
|--------|----------|-------------|-------------|----------|
| `POST` | `/resumes/upload` | Upload resume | `multipart/form-data` with file | `{ "id": "string", "url": "string", "parsedData": object }` |
| `GET` | `/resumes` | Get user resumes | None | `Resume[]` |
| `GET` | `/resumes/:id` | Get resume by ID | None | `Resume` |
| `DELETE` | `/resumes/:id` | Delete resume | None | `{ "success": true }` |
| `POST` | `/resumes/:id/parse` | Parse existing resume | None | `{ "parsedData": object }` |

## AI Services

### Resume Parser Endpoints

| Method | Endpoint | Description | Request Body | Response |
|--------|----------|-------------|-------------|----------|
| `POST` | `/ai/resume-parser/parse` | Parse resume | `multipart/form-data` with file | `{ "parsedData": object, "confidence": number }` |
| `POST` | `/ai/resume-parser/extract-from-text` | Extract from text | `{ "text": "string" }` | `{ "parsedData": object, "confidence": number }` |

### Job Matching Endpoints

| Method | Endpoint | Description | Request Body/Query Parameters | Response |
|--------|----------|-------------|--------------------------|----------|
| `GET` | `/ai/job-matcher/recommendations` | Get job recommendations | `limit`, `offset` | `{ "jobs": JobWithMatchScore[], "total": number }` |
| `GET` | `/ai/job-matcher/match/:jobId` | Get match score for job | None | `{ "score": number, "reasons": string[] }` |
| `GET` | `/ai/job-matcher/candidates/:jobId` | Get candidate recommendations for job | `limit`, `offset` | `{ "candidates": CandidateWithMatchScore[], "total": number }` |

### Conversational AI Endpoints

| Method | Endpoint | Description | Request Body | Response |
|--------|----------|-------------|-------------|----------|
| `POST` | `/ai/conversation/message` | Send message to AI assistant | `{ "message": "string", "sessionId": "string" }` | `{ "response": "string", "data": object, "sessionId": "string" }` |
| `GET` | `/ai/conversation/history` | Get conversation history | `sessionId` | `{ "messages": Message[] }` |
| `POST` | `/ai/conversation/reset` | Reset conversation | `{ "sessionId": "string" }` | `{ "success": true, "sessionId": "string" }` |

### Content Generator Endpoints

| Method | Endpoint | Description | Request Body | Response |
|--------|----------|-------------|-------------|----------|
| `POST` | `/ai/content-generator/city-guide` | Generate city guide | `{ "city": "string", "state": "string" }` | `{ "content": object, "html": "string" }` |
| `POST` | `/ai/content-generator/job-description` | Generate job description | `{ "jobData": object }` | `{ "content": "string", "html": "string" }` |
| `POST` | `/ai/content-generator/specialty-guide` | Generate specialty guide | `{ "specialty": "string" }` | `{ "content": object, "html": "string" }` |

## Locations & Specialties

### Location Endpoints

| Method | Endpoint | Description | Query Parameters | Response |
|--------|----------|-------------|-----------------|----------|
| `GET` | `/locations/states` | Get all states | None | `State[]` |
| `GET` | `/locations/cities` | Get cities by state | `state` | `City[]` |
| `GET` | `/locations/cities/:id` | Get city by ID | None | `City` |
| `GET` | `/locations/cities/search` | Search cities | `q` (query string) | `City[]` |
| `GET` | `/locations/popular-cities` | Get popular cities | `limit` | `City[]` |

### Specialty Endpoints

| Method | Endpoint | Description | Query Parameters | Response |
|--------|----------|-------------|-----------------|----------|
| `GET` | `/specialties` | Get all specialties | `category` | `Specialty[]` |
| `GET` | `/specialties/:id` | Get specialty by ID | None | `Specialty` |
| `GET` | `/specialties/categories` | Get specialty categories | None | `Category[]` |
| `GET` | `/specialties/popular` | Get popular specialties | `limit` | `Specialty[]` |

## Content

### City Guide Endpoints

| Method | Endpoint | Description | Query Parameters | Response |
|--------|----------|-------------|-----------------|----------|
| `GET` | `/content/city-guides` | Get all city guides | `page`, `limit` | `{ "guides": CityGuide[], "total": number, "page": number, "limit": number }` |
| `GET` | `/content/city-guides/:cityId` | Get city guide | None | `CityGuide` |

### Specialty Guide Endpoints

| Method | Endpoint | Description | Query Parameters | Response |
|--------|----------|-------------|-----------------|----------|
| `GET` | `/content/specialty-guides` | Get all specialty guides | `page`, `limit` | `{ "guides": SpecialtyGuide[], "total": number, "page": number, "limit": number }` |
| `GET` | `/content/specialty-guides/:specialtyId` | Get specialty guide | None | `SpecialtyGuide` |

### Blog Endpoints

| Method | Endpoint | Description | Query Parameters | Response |
|--------|----------|-------------|-----------------|----------|
| `GET` | `/content/blog` | Get blog posts | `page`, `limit`, `category` | `{ "posts": BlogPost[], "total": number, "page": number, "limit": number }` |
| `GET` | `/content/blog/:slug` | Get blog post by slug | None | `BlogPost` |
| `GET` | `/content/blog/categories` | Get blog categories | None | `Category[]` |

## Notifications

### Notification Endpoints

| Method | Endpoint | Description | Query Parameters | Response |
|--------|----------|-------------|-----------------|----------|
| `GET` | `/notifications` | Get user notifications | `page`, `limit`, `read` | `{ "notifications": Notification[], "total": number, "page": number, "limit": number }` |
| `PUT` | `/notifications/:id/read` | Mark notification as read | None | `Notification` |
| `PUT` | `/notifications/read-all` | Mark all notifications as read | None | `{ "success": true }` |
| `DELETE` | `/notifications/:id` | Delete notification | None | `{ "success": true }` |

## Job Alerts

### Job Alert Endpoints

| Method | Endpoint | Description | Request Body/Query Parameters | Response |
|--------|----------|-------------|--------------------------|----------|
| `GET` | `/job-alerts` | Get user job alerts | None | `JobAlert[]` |
| `POST` | `/job-alerts` | Create job alert | `JobAlertDto` | `JobAlert` |
| `GET` | `/job-alerts/:id` | Get job alert by ID | None | `JobAlert` |
| `PUT` | `/job-alerts/:id` | Update job alert | `JobAlertDto` | `JobAlert` |
| `DELETE` | `/job-alerts/:id` | Delete job alert | None | `{ "success": true }` |
| `PUT` | `/job-alerts/:id/toggle` | Toggle job alert active status | `{ "active": boolean }` | `JobAlert` |

## Referrals

### Referral Endpoints

| Method | Endpoint | Description | Request Body | Response |
|--------|----------|-------------|-------------|----------|
| `POST` | `/referrals` | Create referral | `ReferralDto` | `Referral` |
| `GET` | `/referrals` | Get user referrals | None | `Referral[]` |
| `GET` | `/referrals/:id` | Get referral by ID | None | `Referral` |
| `GET` | `/referrals/code/:code` | Get referral by code | None | `{ "referrerId": "string", "referrerName": "string" }` |

## Analytics

### Analytics Endpoints (Recruiter/Admin)

| Method | Endpoint | Description | Query Parameters | Response |
|--------|----------|-------------|-----------------|----------|
| `GET` | `/analytics/dashboard` | Get dashboard analytics | `startDate`, `endDate` | `DashboardAnalytics` |
| `GET` | `/analytics/jobs` | Get job analytics | `startDate`, `endDate`, `jobId` | `JobAnalytics` |
| `GET` | `/analytics/applications` | Get application analytics | `startDate`, `endDate` | `ApplicationAnalytics` |
| `GET` | `/analytics/users` | Get user analytics | `startDate`, `endDate` | `UserAnalytics` |
| `GET` | `/analytics/recruiters` | Get recruiter analytics | `startDate`, `endDate`, `recruiterId` | `RecruiterAnalytics` |

### Event Tracking Endpoints

| Method | Endpoint | Description | Request Body | Response |
|--------|----------|-------------|-------------|----------|
| `POST` | `/analytics/events` | Track analytics event | `{ "event_type": "string", "event_data": object }` | `{ "success": true }` |

## Compliance

### Compliance Endpoints

| Method | Endpoint | Description | Request Body/Query Parameters | Response |
|--------|----------|-------------|--------------------------|----------|
| `POST` | `/compliance/verify-license` | Verify license | `{ "licenseData": object, "documentUrl": "string" }` | `{ "verified": boolean, "status": "string", "message": "string" }` |
| `POST` | `/compliance/verify-certification` | Verify certification | `{ "certificationData": object, "documentUrl": "string" }` | `{ "verified": boolean, "status": "string", "message": "string" }` |
| `GET` | `/compliance/check` | Check compliance status | `state`, `specialty` | `{ "compliant": boolean, "results": object[], "alerts": object[] }` |

## Admin

### Admin Endpoints

| Method | Endpoint | Description | Request Body/Query Parameters | Response |
|--------|----------|-------------|--------------------------|----------|
| `GET` | `/admin/users` | Get all users | `page`, `limit`, `role`, `search` | `{ "users": User[], "total": number, "page": number, "limit": number }` |
| `PUT` | `/admin/users/:id/role` | Update user role | `{ "role": "string" }` | `User` |
| `GET` | `/admin/jobs` | Get all jobs | `page`, `limit`, `status`, `search` | `{ "jobs": Job[], "total": number, "page": number, "limit": number }` |
| `GET` | `/admin/applications` | Get all applications | `page`, `limit`, `status` | `{ "applications": Application[], "total": number, "page": number, "limit": number }` |
| `GET` | `/admin/system-health` | Get system health | None | `SystemHealth` |
| `GET` | `/admin/audit-logs` | Get audit logs | `page`, `limit`, `type`, `userId` | `{ "logs": AuditLog[], "total": number, "page": number, "limit": number }` |

## Data Models

### User Model

```typescript
interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'candidate' | 'recruiter' | 'admin';
  phone?: string;
  specialty?: string;
  yearsExperience?: number;
  preferredStates?: string[];
  preferredCities?: string[];
  preferredPayRange?: {
    min: number;
    max: number;
  };
  preferredShiftType?: string;
  licenseStates?: string[];
  createdAt: string;
  updatedAt: string;
  lastLogin?: string;
  isActive: boolean;
  emailVerified: boolean;
  phoneVerified: boolean;
  profileCompletionPercentage: number;
  avatarUrl?: string;
  referralCode?: string;
  referredBy?: string;
}
```

### Job Model

```typescript
interface Job {
  id: string;
  externalId: string;
  title: string;
  specialty: string;
  facilityName: string;
  facilityType?: string;
  city: string;
  state: string;
  zipCode?: string;
  coordinates?: {
    latitude: number;
    longitude: number;
  };
  startDate: string;
  endDate?: string;
  weeklyHours: number;
  shiftDetails?: string;
  shiftType?: string;
  payRate: number;
  housingStipend?: number;
  requirements?: string;
  benefits?: string;
  description?: string;
  status: 'active' | 'filled' | 'expired' | 'draft';
  isFeatured: boolean;
  isUrgent: boolean;
  createdAt: string;
  updatedAt: string;
  recruiterId?: string;
  viewsCount: number;
  applicationsCount: number;
  seoTitle?: string;
  seoDescription?: string;
  seoKeywords?: string[];
}
```

### Application Model

```typescript
interface Application {
  id: string;
  jobId: string;
  candidateId: string;
  resumeId?: string;
  status: 'submitted' | 'reviewing' | 'interview' | 'offered' | 'placed' | 'rejected' | 'withdrawn';
  applicationDate: string;
  lastStatusChange: string;
  recruiterNotes?: string;
  candidateNotes?: string;
  source: string;
  referralId?: string;
  matchScore?: number;
  interviewDate?: string;
  offerDetails?: {
    offerDate: string;
    startDate: string;
    payRate: number;
    housingStipend?: number;
    otherBenefits?: string;
  };
  rejectionReason?: string;
  job: Job;
  candidate: User;
}
```

### Resume Model

```typescript
interface Resume {
  id: string;
  userId: string;
  originalFilename: string;
  fileUrl: string;
  fileType: string;
  uploadDate: string;
  parsedData?: {
    contactInfo: {
      name?: string;
      email?: string;
      phone?: string;
      address?: string;
      city?: string;
      state?: string;
      zipCode?: string;
    };
    education: Array<{
      institution?: string;
      degree?: string;
      field?: string;
      startDate?: string;
      endDate?: string;
      gpa?: number;
    }>;
    workExperience: Array<{
      employer?: string;
      position?: string;
      startDate?: string;
      endDate?: string;
      isCurrent?: boolean;
      location?: string;
      responsibilities?: string;
      skills?: string[];
    }>;
    skills: string[];
    certifications: Array<{
      name?: string;
      issuer?: string;
      date?: string;
      expirationDate?: string;
    }>;
    licenses: Array<{
      type?: string;
      number?: string;
      state?: string;
      expirationDate?: string;
    }>;
  };
  confidence?: number;
  parseDate?: string;
}
```

### License Model

```typescript
interface License {
  id: string;
  userId: string;
  licenseType: string;
  licenseNumber: string;
  state: string;
  issueDate: string;
  expirationDate: string;
  status: 'active' | 'expired' | 'pending' | 'verified';
  verificationDate?: string;
  verificationMethod?: string;
  documentUrl?: string;
  createdAt: string;
  updatedAt: string;
}
```

### Certification Model

```typescript
interface Certification {
  id: string;
  userId: string;
  certificationName: string;
  issuingOrganization: string;
  issueDate: string;
  expirationDate?: string;
  credentialId?: string;
  documentUrl?: string;
  status: 'active' | 'expired' | 'pending' | 'verified';
  verificationDate?: string;
  createdAt: string;
  updatedAt: string;
}
```

### WorkExperience Model

```typescript
interface WorkExperience {
  id: string;
  userId: string;
  employer: string;
  position: string;
  startDate: string;
  endDate?: string;
  isCurrent: boolean;
  city?: string;
  state?: string;
  responsibilities?: string;
  specialty?: string;
  facilityType?: string;
  createdAt: string;
  updatedAt: string;
}
```

### City Model

```typescript
interface City {
  id: string;
  name: string;
  state: string;
  stateName: string;
  zipCodes?: string[];
  coordinates?: {
    latitude: number;
    longitude: number;
  };
  population?: number;
  costOfLivingIndex?: number;
  housingCostIndex?: number;
  healthcareFacilitiesCount?: number;
  topEmployers?: string[];
  climateDescription?: string;
  publicTransportRating?: number;
  walkabilityScore?: number;
  crimeRateIndex?: number;
  hasCityGuide: boolean;
  cityGuideUrl?: string;
  featuredImageUrl?: string;
}
```

### Specialty Model

```typescript
interface Specialty {
  id: string;
  name: string;
  category: string;
  description?: string;
  requiredCertifications?: string[];
  averagePayRate?: number;
  demandLevel?: number;
  featuredImageUrl?: string;
  hasSpecialtyGuide: boolean;
  specialtyGuideUrl?: string;
}
```

### Notification Model

```typescript
interface Notification {
  id: string;
  userId: string;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  actionUrl?: string;
  createdAt: string;
  readAt?: string;
  expiresAt?: string;
}
```

### JobAlert Model

```typescript
interface JobAlert {
  id: string;
  userId: string;
  name: string;
  specialties?: string[];
  states?: string[];
  cities?: string[];
  minPayRate?: number;
  shiftTypes?: string[];
  frequency: 'daily' | 'weekly' | 'instant';
  isActive: boolean;
  lastSentAt?: string;
  createdAt: string;
  updatedAt: string;
}
```

### Referral Model

```typescript
interface Referral {
  id: string;
  referrerId: string;
  referredEmail: string;
  referredName?: string;
  referredPhone?: string;
  status: 'invited' | 'registered' | 'applied' | 'placed';
  invitationDate: string;
  registrationDate?: string;
  referredUserId?: string;
  jobId?: string;
  applicationId?: string;
  bonusAmount?: number;
  bonusStatus?: 'pending' | 'approved' | 'paid' | 'denied';
  bonusPaidDate?: string;
  notes?: string;
}
```

## Error Handling

### Error Response Format

```json
{
  "error": {
    "code": "string",
    "message": "string",
    "details": {}
  }
}
```

### Common Error Codes

| Code | Description |
|------|-------------|
| `UNAUTHORIZED` | Authentication required or failed |
| `FORBIDDEN` | User does not have permission |
| `NOT_FOUND` | Resource not found |
| `BAD_REQUEST` | Invalid request parameters |
| `VALIDATION_ERROR` | Request validation failed |
| `INTERNAL_ERROR` | Server error |
| `CONFLICT` | Resource conflict |
| `RATE_LIMITED` | Too many requests |

## Pagination

### Request Parameters

| Parameter | Description | Default |
|-----------|-------------|---------|
| `page` | Page number (1-based) | 1 |
| `limit` | Number of items per page | 20 |

### Response Format

```json
{
  "data": [],
  "pagination": {
    "total": 0,
    "page": 1,
    "limit": 20,
    "pages": 0
  }
}
```

## Filtering and Sorting

### Filtering

Filtering is done using query parameters:

```
GET /api/v1/jobs?specialty=ICU&state=CA&minPay=2000
```

### Sorting

Sorting is done using the `sort` query parameter:

```
GET /api/v1/jobs?sort=payRate:desc
```

Multiple sort fields can be specified:

```
GET /api/v1/jobs?sort=payRate:desc,startDate:asc
```

## API Versioning

The API is versioned using the URL path. The current version is `v1`:

```
/api/v1/jobs
```

Future versions will use incremented version numbers:

```
/api/v2/jobs
```

## Rate Limiting

API requests are rate limited to prevent abuse. The current limits are:

- 100 requests per minute for authenticated users
- 20 requests per minute for unauthenticated users

Rate limit information is included in the response headers:

```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 99
X-RateLimit-Reset: 1625097600
```

## Webhook Endpoints

### Webhook Registration

| Method | Endpoint | Description | Request Body | Response |
|--------|----------|-------------|-------------|----------|
| `POST` | `/webhooks` | Register webhook | `{ "url": "string", "events": string[], "secret": "string" }` | `{ "id": "string", "url": "string", "events": string[] }` |
| `GET` | `/webhooks` | Get registered webhooks | None | `Webhook[]` |
| `DELETE` | `/webhooks/:id` | Delete webhook | None | `{ "success": true }` |

### Webhook Events

| Event | Description | Payload |
|-------|-------------|---------|
| `job.created` | Job created | `{ "event": "job.created", "data": Job }` |
| `job.updated` | Job updated | `{ "event": "job.updated", "data": Job }` |
| `job.deleted` | Job deleted | `{ "event": "job.deleted", "data": { "id": "string" } }` |
| `application.created` | Application created | `{ "event": "application.created", "data": Application }` |
| `application.updated` | Application updated | `{ "event": "application.updated", "data": Application }` |
| `user.registered` | User registered | `{ "event": "user.registered", "data": User }` |

## Health Check

| Method | Endpoint | Description | Response |
|--------|----------|-------------|----------|
| `GET` | `/health` | API health check | `{ "status": "UP", "version": "string", "timestamp": "string" }` |
| `GET` | `/health/detailed` | Detailed health check | `{ "status": "UP", "components": { "database": { "status": "UP" }, "cache": { "status": "UP" } }, "version": "string", "timestamp": "string" }` |

## API Documentation

The full API documentation is available at `/api/docs` when the server is running. The documentation is generated using Swagger/OpenAPI and provides interactive documentation for all endpoints.