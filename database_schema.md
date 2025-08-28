# Excel Medical Staffing - Database Schema

## 1. Overview

The database schema is designed to support the Excel Medical Staffing platform's requirements for job management, candidate tracking, recruiter attribution, referral tracking, and content management. The schema uses a combination of PostgreSQL for structured data and MongoDB for unstructured data.

## 2. PostgreSQL Schema

### 2.1 Users and Authentication

#### users
- `id` (PK, UUID)
- `email` (VARCHAR, UNIQUE)
- `password_hash` (VARCHAR)
- `first_name` (VARCHAR)
- `last_name` (VARCHAR)
- `phone` (VARCHAR)
- `user_type` (ENUM: 'candidate', 'recruiter', 'admin')
- `status` (ENUM: 'active', 'inactive', 'pending')
- `created_at` (TIMESTAMP)
- `updated_at` (TIMESTAMP)
- `last_login` (TIMESTAMP)

#### user_roles
- `id` (PK, UUID)
- `user_id` (FK -> users.id)
- `role` (VARCHAR)
- `created_at` (TIMESTAMP)
- `updated_at` (TIMESTAMP)

#### sessions
- `id` (PK, UUID)
- `user_id` (FK -> users.id)
- `token` (VARCHAR)
- `expires_at` (TIMESTAMP)
- `created_at` (TIMESTAMP)
- `ip_address` (VARCHAR)
- `user_agent` (VARCHAR)

### 2.2 Candidate Management

#### candidates
- `id` (PK, UUID)
- `user_id` (FK -> users.id)
- `status_id` (FK -> candidate_statuses.id)
- `referral_source_id` (FK -> referral_sources.id)
- `referring_user_id` (FK -> users.id, nullable)
- `primary_specialty_id` (FK -> specialties.id)
- `years_of_experience` (DECIMAL)
- `available_from` (DATE)
- `travel_status` (BOOLEAN)
- `address_line1` (VARCHAR)
- `address_line2` (VARCHAR)
- `city` (VARCHAR)
- `state_id` (FK -> states.id)
- `zip` (VARCHAR)
- `country_id` (FK -> countries.id)
- `cell_phone` (VARCHAR)
- `home_phone` (VARCHAR)
- `send_mass_emails` (BOOLEAN)
- `send_mass_sms` (BOOLEAN)
- `recruiter_id` (FK -> recruiters.id)
- `ambassador` (BOOLEAN)
- `ambassador_url` (VARCHAR)
- `facebook` (VARCHAR)
- `instagram` (VARCHAR)
- `linkedin` (VARCHAR)
- `other_social` (VARCHAR)
- `created_at` (TIMESTAMP)
- `updated_at` (TIMESTAMP)
- `external_candidate_id` (VARCHAR, nullable) - For LaborEdge integration

#### candidate_professions
- `id` (PK, UUID)
- `candidate_id` (FK -> candidates.id)
- `profession_id` (FK -> professions.id)
- `created_at` (TIMESTAMP)

#### candidate_specialties
- `id` (PK, UUID)
- `candidate_id` (FK -> candidates.id)
- `specialty_id` (FK -> specialties.id)
- `created_at` (TIMESTAMP)

#### candidate_job_types
- `id` (PK, UUID)
- `candidate_id` (FK -> candidates.id)
- `job_type` (ENUM: 'PERM', 'TRAVEL', 'PERDIEM', 'LOCAL')
- `created_at` (TIMESTAMP)

#### candidate_preferred_states
- `id` (PK, UUID)
- `candidate_id` (FK -> candidates.id)
- `state_id` (FK -> states.id)
- `created_at` (TIMESTAMP)

#### candidate_licenses
- `id` (PK, UUID)
- `candidate_id` (FK -> candidates.id)
- `state_id` (FK -> states.id)
- `profession_id` (FK -> professions.id)
- `license_number` (VARCHAR)
- `expiration_date` (DATE)
- `status` (ENUM: 'active', 'pending', 'expired')
- `verification_status` (ENUM: 'verified', 'pending', 'failed')
- `created_at` (TIMESTAMP)
- `updated_at` (TIMESTAMP)

#### candidate_resumes
- `id` (PK, UUID)
- `candidate_id` (FK -> candidates.id)
- `file_name` (VARCHAR)
- `file_path` (VARCHAR)
- `file_type` (VARCHAR)
- `parsed` (BOOLEAN)
- `parsed_data_id` (VARCHAR) - Reference to MongoDB document
- `created_at` (TIMESTAMP)
- `updated_at` (TIMESTAMP)

#### candidate_statuses
- `id` (PK, INT)
- `name` (VARCHAR)
- `description` (VARCHAR)
- `active` (BOOLEAN)
- `external_id` (INT) - For LaborEdge integration

#### candidate_types
- `id` (PK, INT)
- `name` (VARCHAR)
- `description` (VARCHAR)
- `active` (BOOLEAN)
- `external_id` (INT) - For LaborEdge integration

### 2.3 Job Management

#### jobs
- `id` (PK, UUID)
- `external_job_id` (INT) - From LaborEdge
- `job_title` (VARCHAR)
- `posting_id` (VARCHAR)
- `display_on_external_job_board` (BOOLEAN)
- `description` (TEXT)
- `posted_date` (TIMESTAMP)
- `preferred_certifications` (TEXT)
- `sign_on_bonus` (DECIMAL, nullable)
- `no_of_openings` (INT)
- `job_type` (ENUM: 'Travel', 'Perm', 'Per Diem', 'Local')
- `msa` (BOOLEAN)
- `start_date` (DATE)
- `end_date` (DATE)
- `asap` (BOOLEAN)
- `duration` (INT)
- `duration_type` (ENUM: 'DAYS', 'WEEKS', 'MONTHS')
- `job_status_id` (FK -> job_statuses.id)
- `job_status_code` (VARCHAR)
- `hot_job` (BOOLEAN)
- `floating_req_units` (TEXT)
- `position_type` (VARCHAR)
- `shift_start_time1` (TIME)
- `shift_end_time1` (TIME)
- `shift_start_time2` (TIME, nullable)
- `shift_end_time2` (TIME, nullable)
- `shifts_per_week1` (INT)
- `scheduled_hrs1` (DECIMAL)
- `shifts_per_week2` (INT, nullable)
- `scheduled_hrs2` (DECIMAL, nullable)
- `shift` (VARCHAR)
- `title` (VARCHAR)
- `offering` (VARCHAR)
- `sub_offering` (VARCHAR, nullable)
- `profession_id` (FK -> professions.id)
- `specialty_id` (FK -> specialties.id)
- `sales_rep_id` (INT)
- `sales_rep_first_name` (VARCHAR)
- `sales_rep_last_name` (VARCHAR)
- `sales_rep_email` (VARCHAR)
- `staffing_specialist_id` (INT)
- `staffing_specialist_first_name` (VARCHAR)
- `staffing_specialist_last_name` (VARCHAR)
- `staffing_specialist_email` (VARCHAR)
- `vms_id` (INT)
- `vms` (VARCHAR)
- `client_name` (VARCHAR)
- `client_website` (VARCHAR, nullable)
- `client_primary_division` (VARCHAR)
- `client_city` (VARCHAR)
- `client_state_id` (FK -> states.id)
- `client_state` (VARCHAR)
- `client_state_code` (VARCHAR)
- `client_zip` (VARCHAR)
- `client_country` (VARCHAR)
- `weekly_pay` (DECIMAL)
- `hourly_pay` (DECIMAL)
- `hourly_pay_range` (VARCHAR)
- `weekly_pay_range` (VARCHAR)
- `featured_job` (BOOLEAN)
- `position_urgency_id` (VARCHAR)
- `position_urgency` (VARCHAR)
- `created_at` (TIMESTAMP)
- `updated_at` (TIMESTAMP)
- `seo_title` (VARCHAR)
- `seo_description` (VARCHAR)
- `seo_keywords` (VARCHAR)
- `page_views` (INT)
- `application_count` (INT)

#### job_required_certifications
- `id` (PK, UUID)
- `job_id` (FK -> jobs.id)
- `certification` (VARCHAR)
- `for_onboarding` (BOOLEAN)
- `for_submittal` (BOOLEAN)
- `created_at` (TIMESTAMP)

#### job_rates
- `id` (PK, UUID)
- `job_id` (FK -> jobs.id)
- `bill_rate_code_id` (VARCHAR)
- `bill_rate_code` (VARCHAR)
- `rate` (DECIMAL)
- `created_at` (TIMESTAMP)

#### job_statuses
- `id` (PK, INT)
- `name` (VARCHAR)
- `code` (VARCHAR)
- `description` (VARCHAR)
- `active` (BOOLEAN)
- `external_id` (INT) - For LaborEdge integration

### 2.4 Application Management

#### applications
- `id` (PK, UUID)
- `candidate_id` (FK -> candidates.id)
- `job_id` (FK -> jobs.id)
- `status` (ENUM: 'applied', 'reviewing', 'interviewing', 'offered', 'placed', 'rejected')
- `recruiter_id` (FK -> recruiters.id, nullable)
- `referrer_id` (FK -> users.id, nullable)
- `referral_code` (VARCHAR, nullable)
- `source` (VARCHAR)
- `notes` (TEXT)
- `created_at` (TIMESTAMP)
- `updated_at` (TIMESTAMP)

#### application_status_history
- `id` (PK, UUID)
- `application_id` (FK -> applications.id)
- `status` (ENUM: 'applied', 'reviewing', 'interviewing', 'offered', 'placed', 'rejected')
- `notes` (TEXT)
- `created_by` (FK -> users.id)
- `created_at` (TIMESTAMP)

### 2.5 Recruiter Management

#### recruiters
- `id` (PK, UUID)
- `user_id` (FK -> users.id)
- `external_recruiter_id` (INT) - For LaborEdge integration
- `title` (VARCHAR)
- `bio` (TEXT)
- `photo_url` (VARCHAR)
- `phone` (VARCHAR)
- `email` (VARCHAR)
- `active` (BOOLEAN)
- `created_at` (TIMESTAMP)
- `updated_at` (TIMESTAMP)

#### recruiter_job_shares
- `id` (PK, UUID)
- `recruiter_id` (FK -> recruiters.id)
- `job_id` (FK -> jobs.id)
- `share_code` (VARCHAR)
- `share_url` (VARCHAR)
- `created_at` (TIMESTAMP)
- `views` (INT)
- `applications` (INT)
- `placements` (INT)

### 2.6 Referral Management

#### referral_sources
- `id` (PK, INT)
- `name` (VARCHAR)
- `description` (VARCHAR)
- `active` (BOOLEAN)
- `external_id` (INT) - For LaborEdge integration

#### referrals
- `id` (PK, UUID)
- `referrer_id` (FK -> users.id)
- `referred_email` (VARCHAR)
- `referred_user_id` (FK -> users.id, nullable)
- `referral_code` (VARCHAR)
- `status` (ENUM: 'sent', 'registered', 'applied', 'placed')
- `job_id` (FK -> jobs.id, nullable)
- `created_at` (TIMESTAMP)
- `updated_at` (TIMESTAMP)

#### referral_rewards
- `id` (PK, UUID)
- `referral_id` (FK -> referrals.id)
- `amount` (DECIMAL)
- `status` (ENUM: 'pending', 'approved', 'paid', 'rejected')
- `payment_date` (DATE, nullable)
- `payment_method` (VARCHAR, nullable)
- `payment_reference` (VARCHAR, nullable)
- `created_at` (TIMESTAMP)
- `updated_at` (TIMESTAMP)

### 2.7 Content Management

#### blog_posts
- `id` (PK, UUID)
- `title` (VARCHAR)
- `slug` (VARCHAR, UNIQUE)
- `content` (TEXT)
- `excerpt` (TEXT)
- `author_id` (FK -> users.id)
- `status` (ENUM: 'draft', 'published', 'archived')
- `featured_image` (VARCHAR)
- `published_at` (TIMESTAMP)
- `seo_title` (VARCHAR)
- `seo_description` (VARCHAR)
- `seo_keywords` (VARCHAR)
- `created_at` (TIMESTAMP)
- `updated_at` (TIMESTAMP)
- `ai_generated` (BOOLEAN)

#### city_guides
- `id` (PK, UUID)
- `city` (VARCHAR)
- `state_id` (FK -> states.id)
- `title` (VARCHAR)
- `slug` (VARCHAR, UNIQUE)
- `content` (TEXT)
- `cost_of_living_index` (DECIMAL)
- `housing_info` (TEXT)
- `things_to_do` (TEXT)
- `healthcare_facilities` (TEXT)
- `featured_image` (VARCHAR)
- `seo_title` (VARCHAR)
- `seo_description` (VARCHAR)
- `seo_keywords` (VARCHAR)
- `created_at` (TIMESTAMP)
- `updated_at` (TIMESTAMP)
- `ai_generated` (BOOLEAN)

#### specialty_pages
- `id` (PK, UUID)
- `specialty_id` (FK -> specialties.id)
- `title` (VARCHAR)
- `slug` (VARCHAR, UNIQUE)
- `content` (TEXT)
- `featured_image` (VARCHAR)
- `seo_title` (VARCHAR)
- `seo_description` (VARCHAR)
- `seo_keywords` (VARCHAR)
- `created_at` (TIMESTAMP)
- `updated_at` (TIMESTAMP)
- `ai_generated` (BOOLEAN)

#### city_specialty_pages
- `id` (PK, UUID)
- `city` (VARCHAR)
- `state_id` (FK -> states.id)
- `specialty_id` (FK -> specialties.id)
- `title` (VARCHAR)
- `slug` (VARCHAR, UNIQUE)
- `content` (TEXT)
- `featured_image` (VARCHAR)
- `seo_title` (VARCHAR)
- `seo_description` (VARCHAR)
- `seo_keywords` (VARCHAR)
- `created_at` (TIMESTAMP)
- `updated_at` (TIMESTAMP)
- `ai_generated` (BOOLEAN)

### 2.8 Master Data Tables

#### professions
- `id` (PK, INT)
- `name` (VARCHAR)
- `description` (VARCHAR)
- `active` (BOOLEAN)
- `external_id` (INT) - For LaborEdge integration

#### specialties
- `id` (PK, INT)
- `profession_id` (FK -> professions.id)
- `name` (VARCHAR)
- `description` (VARCHAR)
- `active` (BOOLEAN)
- `external_id` (INT) - For LaborEdge integration

#### states
- `id` (PK, INT)
- `name` (VARCHAR)
- `code` (VARCHAR)
- `country_id` (FK -> countries.id)
- `active` (BOOLEAN)
- `external_id` (INT) - For LaborEdge integration

#### countries
- `id` (PK, INT)
- `name` (VARCHAR)
- `code` (VARCHAR)
- `active` (BOOLEAN)
- `external_id` (INT) - For LaborEdge integration

#### certifications
- `id` (PK, INT)
- `name` (VARCHAR)
- `description` (VARCHAR)
- `active` (BOOLEAN)

### 2.9 Marketing and Communication

#### email_templates
- `id` (PK, UUID)
- `name` (VARCHAR)
- `subject` (VARCHAR)
- `content` (TEXT)
- `type` (ENUM: 'welcome', 'job_alert', 'application_status', 'referral', 'newsletter')
- `active` (BOOLEAN)
- `created_at` (TIMESTAMP)
- `updated_at` (TIMESTAMP)

#### email_campaigns
- `id` (PK, UUID)
- `name` (VARCHAR)
- `subject` (VARCHAR)
- `content` (TEXT)
- `status` (ENUM: 'draft', 'scheduled', 'sent', 'cancelled')
- `scheduled_at` (TIMESTAMP)
- `sent_at` (TIMESTAMP)
- `created_at` (TIMESTAMP)
- `updated_at` (TIMESTAMP)

#### email_campaign_recipients
- `id` (PK, UUID)
- `campaign_id` (FK -> email_campaigns.id)
- `user_id` (FK -> users.id)
- `email` (VARCHAR)
- `status` (ENUM: 'pending', 'sent', 'opened', 'clicked', 'bounced')
- `sent_at` (TIMESTAMP)
- `opened_at` (TIMESTAMP)
- `clicked_at` (TIMESTAMP)

#### social_media_posts
- `id` (PK, UUID)
- `content` (TEXT)
- `image_url` (VARCHAR)
- `platform` (ENUM: 'facebook', 'twitter', 'linkedin', 'instagram')
- `status` (ENUM: 'draft', 'scheduled', 'posted', 'failed')
- `scheduled_at` (TIMESTAMP)
- `posted_at` (TIMESTAMP)
- `job_id` (FK -> jobs.id, nullable)
- `city_guide_id` (FK -> city_guides.id, nullable)
- `blog_post_id` (FK -> blog_posts.id, nullable)
- `created_at` (TIMESTAMP)
- `updated_at` (TIMESTAMP)

### 2.10 Analytics and Tracking

#### page_views
- `id` (PK, UUID)
- `user_id` (FK -> users.id, nullable)
- `session_id` (VARCHAR)
- `page_url` (VARCHAR)
- `referrer_url` (VARCHAR)
- `user_agent` (VARCHAR)
- `ip_address` (VARCHAR)
- `created_at` (TIMESTAMP)

#### job_views
- `id` (PK, UUID)
- `job_id` (FK -> jobs.id)
- `user_id` (FK -> users.id, nullable)
- `session_id` (VARCHAR)
- `referrer_url` (VARCHAR)
- `referral_code` (VARCHAR, nullable)
- `recruiter_share_id` (FK -> recruiter_job_shares.id, nullable)
- `created_at` (TIMESTAMP)

#### candidate_journey_events
- `id` (PK, UUID)
- `user_id` (FK -> users.id)
- `event_type` (VARCHAR)
- `event_data` (JSONB)
- `created_at` (TIMESTAMP)

#### user_searches
- `id` (PK, UUID)
- `user_id` (FK -> users.id, nullable)
- `session_id` (VARCHAR)
- `search_query` (VARCHAR)
- `filters` (JSONB)
- `results_count` (INT)
- `created_at` (TIMESTAMP)

## 3. MongoDB Collections

### 3.1 Parsed Resumes
```
parsed_resumes {
  _id: ObjectId,
  candidate_id: UUID,
  raw_text: String,
  structured_data: {
    contact_info: {
      name: String,
      email: String,
      phone: String,
      address: String
    },
    education: [{
      institution: String,
      degree: String,
      field: String,
      start_date: Date,
      end_date: Date
    }],
    experience: [{
      company: String,
      title: String,
      location: String,
      start_date: Date,
      end_date: Date,
      description: String
    }],
    skills: [String],
    certifications: [{
      name: String,
      issuer: String,
      date: Date,
      expiration_date: Date
    }],
    licenses: [{
      type: String,
      state: String,
      number: String,
      expiration_date: Date
    }]
  },
  vector_embedding: [Float],
  created_at: Date,
  updated_at: Date
}
```

### 3.2 AI Generated Content
```
ai_content {
  _id: ObjectId,
  content_type: String,  // 'job_description', 'blog_post', 'city_guide', etc.
  reference_id: UUID,    // ID of the related entity in PostgreSQL
  original_prompt: String,
  generated_content: String,
  metadata: {
    model: String,
    parameters: Object,
    generation_time: Number
  },
  version: Number,
  status: String,  // 'draft', 'reviewed', 'published', 'rejected'
  reviewer_id: UUID,
  review_notes: String,
  created_at: Date,
  updated_at: Date
}
```

### 3.3 Chat Conversations
```
chat_conversations {
  _id: ObjectId,
  user_id: UUID,
  session_id: String,
  conversation: [{
    role: String,  // 'user', 'assistant', 'system'
    content: String,
    timestamp: Date
  }],
  context: {
    page_url: String,
    referrer: String,
    user_agent: String,
    ip_address: String
  },
  metadata: {
    job_searches: [UUID],
    job_views: [UUID],
    applications_started: [UUID],
    applications_completed: [UUID]
  },
  created_at: Date,
  updated_at: Date,
  last_activity: Date
}
```

### 3.4 Analytics Data
```
analytics_events {
  _id: ObjectId,
  event_type: String,
  user_id: UUID,
  session_id: String,
  timestamp: Date,
  data: Object,
  context: {
    page_url: String,
    referrer: String,
    user_agent: String,
    ip_address: String
  }
}
```

## 4. Database Relationships

### 4.1 One-to-One Relationships
- User to Candidate
- User to Recruiter
- Candidate to Primary Specialty

### 4.2 One-to-Many Relationships
- Candidate to Applications
- Job to Applications
- Recruiter to Candidates
- Recruiter to Job Shares
- User to Referrals

### 4.3 Many-to-Many Relationships
- Candidates to Professions
- Candidates to Specialties
- Candidates to Job Types
- Candidates to Preferred States
- Candidates to Licensed States
- Jobs to Required Certifications

## 5. Indexing Strategy

### 5.1 PostgreSQL Indexes
- B-tree indexes on all primary keys
- B-tree indexes on all foreign keys
- B-tree indexes on email fields
- B-tree indexes on status fields
- GIN indexes on JSONB fields
- Partial indexes on boolean flags (e.g., hot_job, featured_job)
- Composite indexes on frequently queried combinations

### 5.2 MongoDB Indexes
- Default _id index
- Single-field indexes on frequently queried fields
- Compound indexes for common query patterns
- Text indexes for full-text search
- TTL indexes for time-based data expiration

## 6. Data Migration and Synchronization

### 6.1 Initial Data Load
- Import master data from LaborEdge API
- Transform and load job data
- Set up continuous synchronization

### 6.2 Ongoing Synchronization
- Scheduled jobs to pull new and updated data
- Webhook endpoints for real-time updates
- Change data capture for database replication

## 7. Data Backup and Recovery

### 7.1 Backup Strategy
- Daily full backups
- Continuous incremental backups
- Point-in-time recovery capability

### 7.2 Disaster Recovery
- Multi-region replication
- Automated failover
- Regular recovery testing