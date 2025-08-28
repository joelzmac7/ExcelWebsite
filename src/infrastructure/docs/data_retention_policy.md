# Excel Medical Staffing - Data Retention Policy

## Overview

This document outlines the data retention policies for the Excel Medical Staffing AI Platform. These policies are designed to ensure compliance with data protection regulations, optimize database performance, and maintain system efficiency while preserving essential business data.

## Purpose

The purpose of this data retention policy is to:

1. Define how long different types of data should be retained in the system
2. Establish procedures for data archiving and deletion
3. Ensure compliance with relevant regulations
4. Optimize database performance and storage utilization
5. Protect sensitive user information

## Data Categories and Retention Periods

### User Data

| Data Type | Retention Period | Justification |
|-----------|------------------|---------------|
| User accounts | Indefinite while active | Required for user access |
| Inactive user accounts | 2 years after last login | Maintain relationship history |
| User profile information | Indefinite while active | Required for user identification |
| Authentication logs | 1 year | Security auditing |
| Password reset tokens | 24 hours | Security best practice |
| Session data | 30 days | Security and user experience |

### Candidate Data

| Data Type | Retention Period | Justification |
|-----------|------------------|---------------|
| Candidate profiles | Indefinite while active | Core business data |
| Resumes | Indefinite while active | Core business data |
| Licenses and certifications | Indefinite while active | Core business data |
| Application history | 5 years | Business analytics and compliance |
| Candidate journey events | 2 years | User experience optimization |
| Parsed resume data | 5 years | AI model training and analytics |

### Job Data

| Data Type | Retention Period | Justification |
|-----------|------------------|---------------|
| Active job listings | Until job is filled or removed | Core business data |
| Filled/closed job listings | 3 years | Historical reference and analytics |
| Job views | 180 days | Analytics and performance metrics |
| Job search queries | 90 days | Search optimization |
| Job matching data | 1 year | AI model training and analytics |

### Analytics and Tracking Data

| Data Type | Retention Period | Justification |
|-----------|------------------|---------------|
| Page views | 180 days | User experience analytics |
| User searches | 90 days | Search optimization |
| Analytics events | 30 days | System performance monitoring |
| Error logs | 90 days | Troubleshooting and debugging |
| Performance metrics | 1 year | System optimization |

### Communication Data

| Data Type | Retention Period | Justification |
|-----------|------------------|---------------|
| Email campaign data | 2 years | Marketing analytics |
| Chat conversations | 180 days | Customer support and AI training |
| SMS notifications | 90 days | Communication records |
| Email templates | Indefinite until replaced | Business operations |

### Content Data

| Data Type | Retention Period | Justification |
|-----------|------------------|---------------|
| Blog posts | Indefinite until removed | Marketing content |
| City guides | Indefinite until removed | Marketing content |
| Specialty pages | Indefinite until removed | Marketing content |
| AI-generated content | Indefinite until removed | Marketing content |
| Content drafts | 90 days if not published | Cleanup unused content |

### System Data

| Data Type | Retention Period | Justification |
|-----------|------------------|---------------|
| Application logs | 90 days | Troubleshooting |
| Audit logs | 1 year | Security and compliance |
| Database backups | 30 days | Disaster recovery |
| System monitoring data | 30 days | Performance analysis |

## Implementation

### Automated Retention Enforcement

The data retention policies are enforced through automated scripts that run as part of the regular database maintenance process. These scripts:

1. Identify data that has exceeded its retention period
2. Archive data that requires preservation before deletion
3. Permanently delete data that is no longer needed
4. Log all retention activities for audit purposes

### Database Scripts

The following scripts implement the data retention policies:

- `database_maintenance.sh`: Main script that orchestrates the retention policy enforcement
- PostgreSQL retention queries: Implemented within the maintenance script
- MongoDB retention queries: Implemented within the maintenance script

### Archiving Process

Before data is permanently deleted, critical business data is archived:

1. Data is exported to compressed files
2. Archives are stored in secure, long-term storage (AWS S3)
3. Archives are encrypted and access-controlled
4. Archive metadata is maintained for retrieval purposes

## Compliance Considerations

### Healthcare Data Regulations

As a healthcare staffing platform, we adhere to relevant healthcare data regulations:

- Protected Health Information (PHI) is handled according to HIPAA guidelines
- Candidate medical credentials are retained according to state licensing requirements
- Employment verification data is maintained according to legal requirements

### General Data Protection

- Personal data is processed according to applicable privacy laws
- Users have the right to request data deletion (subject to legal retention requirements)
- Data minimization principles are applied to limit collection to necessary information

## Exceptions

### Legal Holds

Data subject to legal holds will be exempt from automatic deletion until the hold is lifted.

### Regulatory Requirements

Retention periods may be extended to comply with specific regulatory or contractual obligations.

### Business Continuity

Critical business data may be retained longer if necessary for business continuity purposes.

## Monitoring and Auditing

### Retention Monitoring

- Regular audits of data retention implementation
- Verification that deletion processes are functioning correctly
- Monitoring of storage utilization and optimization

### Compliance Reporting

- Regular reports on data retention status
- Documentation of any exceptions or issues
- Audit trail of deletion activities

## Review and Updates

This data retention policy will be reviewed annually or when significant changes occur in:

- Business requirements
- Regulatory environment
- System architecture
- Data storage capabilities

## Responsibility

The following roles are responsible for data retention management:

- Database Administrator: Implementation and maintenance of retention scripts
- Data Protection Officer: Policy compliance and regulatory alignment
- IT Security Team: Secure implementation of deletion and archiving processes
- Product Management: Business requirements for data retention

## Approval

This data retention policy has been approved by:

- Chief Technology Officer
- Chief Information Security Officer
- Legal Department
- Data Protection Officer

Last Updated: August 27, 2025