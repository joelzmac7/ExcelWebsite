# Database Schema Specification

## Overview

This document outlines the database schema design for the Excel Medical Staffing AI-Powered Healthcare Staffing Platform. The platform uses a hybrid database approach:

1. **PostgreSQL**: For structured relational data (jobs, users, applications, etc.)
2. **MongoDB**: For unstructured data (resumes, content, etc.)

## PostgreSQL Schema

### Users Table

```sql
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255),
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    phone VARCHAR(20),
    role VARCHAR(20) NOT NULL CHECK (role IN ('candidate', 'recruiter', 'admin')),
    specialty VARCHAR(100),
    years_experience INTEGER,
    preferred_states VARCHAR(255)[],
    preferred_cities VARCHAR(255)[],
    preferred_pay_range JSONB,
    preferred_shift_type VARCHAR(50),
    license_states VARCHAR(255)[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT TRUE,
    email_verified BOOLEAN DEFAULT FALSE,
    phone_verified BOOLEAN DEFAULT FALSE,
    profile_completion_percentage INTEGER DEFAULT 0,
    avatar_url VARCHAR(255),
    referral_code VARCHAR(20) UNIQUE,
    referred_by UUID REFERENCES users(id),
    external_id VARCHAR(100),
    metadata JSONB
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_specialty ON users(specialty);
CREATE INDEX idx_users_referral_code ON users(referral_code);
```

### Jobs Table

```sql
CREATE TABLE jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    external_id VARCHAR(100) UNIQUE NOT NULL,
    title VARCHAR(255) NOT NULL,
    specialty VARCHAR(100) NOT NULL,
    facility_name VARCHAR(255) NOT NULL,
    facility_type VARCHAR(100),
    city VARCHAR(100) NOT NULL,
    state VARCHAR(2) NOT NULL,
    zip_code VARCHAR(10),
    coordinates POINT,
    start_date DATE NOT NULL,
    end_date DATE,
    weekly_hours INTEGER NOT NULL,
    shift_details VARCHAR(255),
    shift_type VARCHAR(50),
    pay_rate DECIMAL(10, 2) NOT NULL,
    housing_stipend DECIMAL(10, 2),
    requirements TEXT,
    benefits TEXT,
    description TEXT,
    status VARCHAR(20) NOT NULL CHECK (status IN ('active', 'filled', 'expired', 'draft')),
    is_featured BOOLEAN DEFAULT FALSE,
    is_urgent BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    recruiter_id UUID REFERENCES users(id),
    views_count INTEGER DEFAULT 0,
    applications_count INTEGER DEFAULT 0,
    seo_title VARCHAR(255),
    seo_description VARCHAR(500),
    seo_keywords VARCHAR(255)[],
    metadata JSONB
);

CREATE INDEX idx_jobs_specialty ON jobs(specialty);
CREATE INDEX idx_jobs_location ON jobs(state, city);
CREATE INDEX idx_jobs_status ON jobs(status);
CREATE INDEX idx_jobs_date ON jobs(start_date);
CREATE INDEX idx_jobs_external_id ON jobs(external_id);
CREATE INDEX idx_jobs_recruiter ON jobs(recruiter_id);
CREATE INDEX idx_jobs_featured ON jobs(is_featured) WHERE is_featured = TRUE;
```

### Applications Table

```sql
CREATE TABLE applications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_id UUID NOT NULL REFERENCES jobs(id),
    candidate_id UUID NOT NULL REFERENCES users(id),
    resume_id VARCHAR(100),
    status VARCHAR(50) NOT NULL CHECK (status IN ('submitted', 'reviewing', 'interview', 'offered', 'placed', 'rejected', 'withdrawn')),
    application_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_status_change TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    recruiter_notes TEXT,
    candidate_notes TEXT,
    source VARCHAR(50) NOT NULL DEFAULT 'direct',
    referral_id UUID REFERENCES users(id),
    match_score DECIMAL(5, 2),
    interview_date TIMESTAMP WITH TIME ZONE,
    offer_details JSONB,
    rejection_reason VARCHAR(255),
    external_id VARCHAR(100),
    metadata JSONB,
    UNIQUE(job_id, candidate_id)
);

CREATE INDEX idx_applications_job ON applications(job_id);
CREATE INDEX idx_applications_candidate ON applications(candidate_id);
CREATE INDEX idx_applications_status ON applications(status);
CREATE INDEX idx_applications_date ON applications(application_date);
CREATE INDEX idx_applications_referral ON applications(referral_id);
```

### Licenses Table

```sql
CREATE TABLE licenses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id),
    license_type VARCHAR(100) NOT NULL,
    license_number VARCHAR(100) NOT NULL,
    state VARCHAR(2) NOT NULL,
    issue_date DATE NOT NULL,
    expiration_date DATE NOT NULL,
    status VARCHAR(50) NOT NULL CHECK (status IN ('active', 'expired', 'pending', 'verified')),
    verification_date TIMESTAMP WITH TIME ZONE,
    verification_method VARCHAR(50),
    document_url VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    external_id VARCHAR(100),
    metadata JSONB,
    UNIQUE(user_id, license_type, state)
);

CREATE INDEX idx_licenses_user ON licenses(user_id);
CREATE INDEX idx_licenses_state ON licenses(state);
CREATE INDEX idx_licenses_expiration ON licenses(expiration_date);
CREATE INDEX idx_licenses_status ON licenses(status);
```

### Certifications Table

```sql
CREATE TABLE certifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id),
    certification_name VARCHAR(100) NOT NULL,
    issuing_organization VARCHAR(255) NOT NULL,
    issue_date DATE NOT NULL,
    expiration_date DATE,
    credential_id VARCHAR(100),
    document_url VARCHAR(255),
    status VARCHAR(50) NOT NULL CHECK (status IN ('active', 'expired', 'pending', 'verified')),
    verification_date TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    metadata JSONB,
    UNIQUE(user_id, certification_name, issuing_organization)
);

CREATE INDEX idx_certifications_user ON certifications(user_id);
CREATE INDEX idx_certifications_name ON certifications(certification_name);
CREATE INDEX idx_certifications_expiration ON certifications(expiration_date);
CREATE INDEX idx_certifications_status ON certifications(status);
```

### Work Experience Table

```sql
CREATE TABLE work_experiences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id),
    employer VARCHAR(255) NOT NULL,
    position VARCHAR(255) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE,
    is_current BOOLEAN DEFAULT FALSE,
    city VARCHAR(100),
    state VARCHAR(2),
    responsibilities TEXT,
    specialty VARCHAR(100),
    facility_type VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    metadata JSONB
);

CREATE INDEX idx_work_experiences_user ON work_experiences(user_id);
CREATE INDEX idx_work_experiences_specialty ON work_experiences(specialty);
CREATE INDEX idx_work_experiences_dates ON work_experiences(start_date, end_date);
```

### Referrals Table

```sql
CREATE TABLE referrals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    referrer_id UUID NOT NULL REFERENCES users(id),
    referred_email VARCHAR(255) NOT NULL,
    referred_name VARCHAR(255),
    referred_phone VARCHAR(20),
    status VARCHAR(50) NOT NULL CHECK (status IN ('invited', 'registered', 'applied', 'placed')),
    invitation_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    registration_date TIMESTAMP WITH TIME ZONE,
    referred_user_id UUID REFERENCES users(id),
    job_id UUID REFERENCES jobs(id),
    application_id UUID REFERENCES applications(id),
    bonus_amount DECIMAL(10, 2),
    bonus_status VARCHAR(50) CHECK (bonus_status IN ('pending', 'approved', 'paid', 'denied')),
    bonus_paid_date TIMESTAMP WITH TIME ZONE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    metadata JSONB,
    UNIQUE(referrer_id, referred_email)
);

CREATE INDEX idx_referrals_referrer ON referrals(referrer_id);
CREATE INDEX idx_referrals_referred_user ON referrals(referred_user_id);
CREATE INDEX idx_referrals_status ON referrals(status);
CREATE INDEX idx_referrals_bonus_status ON referrals(bonus_status);
```

### Cities Table

```sql
CREATE TABLE cities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    state VARCHAR(2) NOT NULL,
    state_name VARCHAR(100) NOT NULL,
    zip_codes VARCHAR(10)[],
    coordinates POINT,
    population INTEGER,
    cost_of_living_index DECIMAL(5, 2),
    housing_cost_index DECIMAL(5, 2),
    healthcare_facilities_count INTEGER,
    top_employers TEXT[],
    climate_description TEXT,
    public_transport_rating INTEGER,
    walkability_score INTEGER,
    crime_rate_index DECIMAL(5, 2),
    has_city_guide BOOLEAN DEFAULT FALSE,
    city_guide_url VARCHAR(255),
    featured_image_url VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    metadata JSONB,
    UNIQUE(name, state)
);

CREATE INDEX idx_cities_location ON cities(state, name);
CREATE INDEX idx_cities_guide ON cities(has_city_guide) WHERE has_city_guide = TRUE;
```

### Specialties Table

```sql
CREATE TABLE specialties (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) UNIQUE NOT NULL,
    category VARCHAR(100) NOT NULL,
    description TEXT,
    required_certifications VARCHAR(100)[],
    average_pay_rate DECIMAL(10, 2),
    demand_level INTEGER CHECK (demand_level BETWEEN 1 AND 10),
    featured_image_url VARCHAR(255),
    has_specialty_guide BOOLEAN DEFAULT FALSE,
    specialty_guide_url VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    metadata JSONB
);

CREATE INDEX idx_specialties_category ON specialties(category);
CREATE INDEX idx_specialties_demand ON specialties(demand_level);
CREATE INDEX idx_specialties_guide ON specialties(has_specialty_guide) WHERE has_specialty_guide = TRUE;
```

### Notifications Table

```sql
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id),
    type VARCHAR(50) NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    action_url VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    read_at TIMESTAMP WITH TIME ZONE,
    expires_at TIMESTAMP WITH TIME ZONE,
    metadata JSONB
);

CREATE INDEX idx_notifications_user ON notifications(user_id);
CREATE INDEX idx_notifications_read ON notifications(is_read);
CREATE INDEX idx_notifications_type ON notifications(type);
CREATE INDEX idx_notifications_created ON notifications(created_at);
```

### Job Alerts Table

```sql
CREATE TABLE job_alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id),
    name VARCHAR(100) NOT NULL,
    specialties VARCHAR(100)[],
    states VARCHAR(2)[],
    cities VARCHAR(100)[],
    min_pay_rate DECIMAL(10, 2),
    shift_types VARCHAR(50)[],
    frequency VARCHAR(20) NOT NULL CHECK (frequency IN ('daily', 'weekly', 'instant')),
    is_active BOOLEAN DEFAULT TRUE,
    last_sent_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    metadata JSONB
);

CREATE INDEX idx_job_alerts_user ON job_alerts(user_id);
CREATE INDEX idx_job_alerts_active ON job_alerts(is_active);
CREATE INDEX idx_job_alerts_frequency ON job_alerts(frequency);
```

### Content Table

```sql
CREATE TABLE content (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    type VARCHAR(50) NOT NULL CHECK (type IN ('city_guide', 'specialty_guide', 'blog', 'faq', 'testimonial', 'page')),
    title VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    summary TEXT,
    content_json JSONB NOT NULL,
    author_id UUID REFERENCES users(id),
    published_at TIMESTAMP WITH TIME ZONE,
    is_published BOOLEAN DEFAULT FALSE,
    featured_image_url VARCHAR(255),
    seo_title VARCHAR(255),
    seo_description VARCHAR(500),
    seo_keywords VARCHAR(255)[],
    related_city_id UUID REFERENCES cities(id),
    related_specialty_id UUID REFERENCES specialties(id),
    view_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    metadata JSONB
);

CREATE INDEX idx_content_type ON content(type);
CREATE INDEX idx_content_slug ON content(slug);
CREATE INDEX idx_content_published ON content(is_published, published_at);
CREATE INDEX idx_content_city ON content(related_city_id);
CREATE INDEX idx_content_specialty ON content(related_specialty_id);
```

### Analytics Events Table

```sql
CREATE TABLE analytics_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_type VARCHAR(50) NOT NULL,
    user_id UUID REFERENCES users(id),
    session_id VARCHAR(100),
    job_id UUID REFERENCES jobs(id),
    application_id UUID REFERENCES applications(id),
    content_id UUID REFERENCES content(id),
    referral_id UUID REFERENCES referrals(id),
    page_url VARCHAR(255),
    referrer_url VARCHAR(255),
    user_agent VARCHAR(255),
    ip_address VARCHAR(45),
    device_type VARCHAR(50),
    event_data JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_analytics_events_type ON analytics_events(event_type);
CREATE INDEX idx_analytics_events_user ON analytics_events(user_id);
CREATE INDEX idx_analytics_events_job ON analytics_events(job_id);
CREATE INDEX idx_analytics_events_created ON analytics_events(created_at);
CREATE INDEX idx_analytics_events_session ON analytics_events(session_id);
```

### User Journey Table

```sql
CREATE TABLE user_journeys (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id),
    current_stage VARCHAR(50) NOT NULL,
    journey_data JSONB NOT NULL,
    started_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT TRUE,
    metadata JSONB
);

CREATE INDEX idx_user_journeys_user ON user_journeys(user_id);
CREATE INDEX idx_user_journeys_stage ON user_journeys(current_stage);
CREATE INDEX idx_user_journeys_active ON user_journeys(is_active);
```

## MongoDB Collections

### Resumes Collection

```javascript
{
  _id: ObjectId,
  userId: UUID,  // Reference to users table
  originalFilename: String,
  fileUrl: String,
  fileType: String,
  uploadDate: Date,
  parsedData: {
    contactInfo: {
      name: String,
      email: String,
      phone: String,
      address: String,
      city: String,
      state: String,
      zipCode: String
    },
    education: [{
      institution: String,
      degree: String,
      field: String,
      startDate: Date,
      endDate: Date,
      gpa: Number
    }],
    workExperience: [{
      employer: String,
      position: String,
      startDate: Date,
      endDate: Date,
      isCurrent: Boolean,
      location: String,
      responsibilities: String,
      skills: [String]
    }],
    skills: [String],
    certifications: [{
      name: String,
      issuer: String,
      date: Date,
      expirationDate: Date
    }],
    licenses: [{
      type: String,
      number: String,
      state: String,
      expirationDate: Date
    }]
  },
  rawText: String,  // Full text of resume
  confidence: Number,  // Confidence score of parsing
  parseDate: Date,
  metadata: Object
}
```

### Chat Conversations Collection

```javascript
{
  _id: ObjectId,
  userId: UUID,  // Reference to users table
  sessionId: String,
  startTime: Date,
  endTime: Date,
  messages: [{
    role: String,  // 'user' or 'assistant'
    content: String,
    timestamp: Date,
    intent: String,  // Classified intent
    entities: [{
      type: String,  // 'specialty', 'location', 'pay_rate', etc.
      value: String,
      confidence: Number
    }]
  }],
  jobSearchParams: {
    specialties: [String],
    locations: [String],
    payRange: {
      min: Number,
      max: Number
    },
    shiftTypes: [String],
    startDate: Date
  },
  actions: [{
    type: String,  // 'job_search', 'application_start', 'question_answered', etc.
    timestamp: Date,
    details: Object
  }],
  feedback: {
    rating: Number,
    comments: String,
    timestamp: Date
  },
  metadata: Object
}
```

### Content Blocks Collection

```javascript
{
  _id: ObjectId,
  contentId: UUID,  // Reference to content table
  type: String,  // 'text', 'image', 'video', 'quote', 'list', 'table', etc.
  order: Number,
  data: {
    // Different structure based on type
    // For text:
    text: String,
    format: String,  // 'paragraph', 'heading', etc.
    
    // For image:
    url: String,
    alt: String,
    caption: String,
    
    // For video:
    videoUrl: String,
    thumbnail: String,
    
    // For list:
    items: [String],
    listType: String,  // 'bullet', 'numbered'
    
    // For table:
    headers: [String],
    rows: [[String]]
  },
  metadata: Object,
  createdAt: Date,
  updatedAt: Date
}
```

### AI Insights Collection

```javascript
{
  _id: ObjectId,
  userId: UUID,  // Reference to users table
  type: String,  // 'job_recommendation', 'skill_gap', 'career_path', etc.
  generatedDate: Date,
  expiryDate: Date,
  isViewed: Boolean,
  insights: [{
    title: String,
    description: String,
    confidence: Number,
    actionable: Boolean,
    actionUrl: String,
    relatedEntities: [{
      type: String,  // 'job', 'skill', 'certification', etc.
      id: String,
      name: String
    }]
  }],
  feedbackProvided: Boolean,
  feedback: {
    helpful: Boolean,
    comments: String,
    timestamp: Date
  },
  metadata: Object
}
```

### City Guides Collection

```javascript
{
  _id: ObjectId,
  cityId: UUID,  // Reference to cities table
  sections: [{
    title: String,
    type: String,  // 'overview', 'housing', 'activities', 'healthcare', 'transportation', etc.
    content: String,
    imageUrls: [String],
    order: Number
  }],
  highlights: [{
    title: String,
    description: String,
    imageUrl: String,
    websiteUrl: String,
    address: String,
    category: String  // 'restaurant', 'attraction', 'hospital', etc.
  }],
  housingOptions: [{
    type: String,  // 'apartment', 'extended_stay', 'house', etc.
    averagePrice: Number,
    description: String,
    websites: [String],
    neighborhoods: [String]
  }],
  transportationOptions: [{
    type: String,  // 'bus', 'subway', 'rideshare', etc.
    description: String,
    websiteUrl: String,
    appUrl: String
  }],
  healthcareFacilities: [{
    name: String,
    type: String,  // 'hospital', 'clinic', etc.
    address: String,
    websiteUrl: String,
    specialties: [String]
  }],
  createdAt: Date,
  updatedAt: Date,
  lastGeneratedBy: String,  // 'ai' or 'human'
  metadata: Object
}
```

## Database Relationships

### One-to-Many Relationships
- User → Applications
- User → Licenses
- User → Certifications
- User → Work Experiences
- User → Notifications
- User → Job Alerts
- Job → Applications
- Recruiter (User) → Jobs
- User → Referrals (as referrer)

### Many-to-One Relationships
- Applications → Job
- Applications → User (candidate)
- Licenses → User
- Certifications → User
- Work Experiences → User
- Notifications → User
- Job Alerts → User
- Jobs → User (recruiter)

### One-to-One Relationships
- User → Resume
- User → User Journey
- City → City Guide
- Specialty → Specialty Guide

## Indexing Strategy

### Performance Indexes
- Indexes on frequently queried columns (user_id, job_id, etc.)
- Composite indexes for common query patterns (state + city, specialty + status, etc.)
- Partial indexes for filtered queries (is_featured = TRUE, has_city_guide = TRUE, etc.)

### Full-Text Search Indexes
- PostgreSQL full-text search indexes on job titles, descriptions
- MongoDB text indexes on resume content and chat conversations

## Data Migration Strategy

### Initial Data Import
1. Import existing job data from LaborEdge API
2. Import existing user data from current system
3. Generate city and specialty reference data
4. Create initial content for high-priority cities and specialties

### Ongoing Synchronization
1. Scheduled jobs for LaborEdge API synchronization
2. Real-time webhooks for critical updates
3. Batch processing for analytics and insights generation

## Data Backup and Recovery

### Backup Strategy
1. Daily full backups of PostgreSQL databases
2. Continuous incremental backups throughout the day
3. Weekly full backups of MongoDB collections
4. Geo-redundant backup storage

### Recovery Procedures
1. Point-in-time recovery capability for PostgreSQL
2. Automated recovery testing on weekly basis
3. Documented recovery procedures for different failure scenarios

## Data Security

### Encryption
1. Encryption at rest for all databases
2. TLS encryption for data in transit
3. Encrypted backup storage

### Access Control
1. Role-based access control for database users
2. Least privilege principle for service accounts
3. Audit logging for all database operations

### Compliance
1. HIPAA compliance for healthcare worker data
2. GDPR compliance for personal information
3. Regular security audits and penetration testing