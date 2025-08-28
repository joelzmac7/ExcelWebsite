# Excel Medical Staffing - Database Management Guide

## Overview

This guide provides comprehensive instructions for managing the Excel Medical Staffing platform databases. It covers backup procedures, monitoring, maintenance, and data retention implementation. The platform uses PostgreSQL for structured data and MongoDB for unstructured data.

## Database Architecture

### PostgreSQL Database

- **Purpose**: Stores structured data including users, jobs, applications, facilities, and relationships
- **Version**: PostgreSQL 14.x
- **Primary Tables**: users, candidates, jobs, applications, recruiters, etc.
- **Connection Details**: Configured via environment variables

### MongoDB Database

- **Purpose**: Stores unstructured data including parsed resumes, AI-generated content, chat conversations, and analytics events
- **Version**: MongoDB 6.x
- **Primary Collections**: parsed_resumes, ai_content, chat_conversations, analytics_events
- **Connection Details**: Configured via MONGO_URI environment variable

## Environment Configuration

Database connection details and configuration parameters are stored in environment variables, typically loaded from a `.env` file. Required variables include:

```
# PostgreSQL Configuration
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_USER=postgres
POSTGRES_PASSWORD=your_password
POSTGRES_DB=excel_medical

# MongoDB Configuration
MONGO_URI=mongodb://username:password@localhost:27017/excel_medical

# Backup Configuration
BACKUP_ROOT_DIR=/var/backups/excel-medical
BACKUP_RETENTION_DAYS=7
S3_BACKUP_BUCKET=excel-medical-backups

# Logging Configuration
LOG_ROOT_DIR=/var/log/excel-medical

# Notification Configuration
ALERT_EMAIL=admin@excelmedicalstaffing.com
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/TXXXXXXXX/BXXXXXXXX/XXXXXXXXXXXXXXXXXXXXXXXX
```

## Database Backup

### Backup Script

The `database_backup.sh` script performs comprehensive backups of both PostgreSQL and MongoDB databases.

#### Features

- Creates compressed backups of PostgreSQL and MongoDB
- Verifies backup integrity
- Implements retention policies for old backups
- Uploads backups to S3 (if configured)
- Sends notifications on completion or failure
- Generates detailed logs and reports

#### Usage

```bash
# Run a manual backup
cd /workspace/src/infrastructure/scripts
./database_backup.sh

# Schedule automatic backups with cron
# Example: Run daily at 2 AM
0 2 * * * /workspace/src/infrastructure/scripts/database_backup.sh
```

#### Backup Verification

Each backup is automatically verified:
- PostgreSQL: Using `pg_restore -l` to validate the backup structure
- MongoDB: Using `tar -tzf` to verify the archive integrity

#### Backup Retention

The script automatically removes backups older than the configured retention period (default: 7 days).

#### Backup Location

Backups are stored in the following structure:
```
/var/backups/excel-medical/
└── YYYY-MM-DD/
    ├── postgres_YYYYMMDD_HHMMSS.sql.gz
    ├── mongo_YYYYMMDD_HHMMSS.tar.gz
    ├── backup_YYYYMMDD_HHMMSS.log
    ├── backup_summary.txt
    └── verification/
        ├── postgres_backup_verify.txt
        └── mongo_backup_verify.txt
```

### Restore Procedure

#### PostgreSQL Restore

```bash
# Restore PostgreSQL database
gunzip -c /var/backups/excel-medical/YYYY-MM-DD/postgres_YYYYMMDD_HHMMSS.sql.gz | \
  pg_restore -d excel_medical --clean --if-exists
```

#### MongoDB Restore

```bash
# Extract MongoDB backup
tar -xzf /var/backups/excel-medical/YYYY-MM-DD/mongo_YYYYMMDD_HHMMSS.tar.gz -C /tmp

# Restore MongoDB database
mongorestore --uri="mongodb://username:password@localhost:27017/excel_medical" \
  --drop /tmp/mongo_YYYYMMDD_HHMMSS
```

## Database Monitoring

### Monitoring Script

The `database_monitor.sh` script monitors the health and performance of PostgreSQL and MongoDB databases.

#### Features

- Checks database connectivity and availability
- Monitors key performance metrics
- Detects long-running queries and operations
- Identifies bloated tables and unused indexes
- Monitors system resources (CPU, memory, disk)
- Sends alerts when thresholds are exceeded
- Generates detailed monitoring reports

#### Usage

```bash
# Run monitoring manually
cd /workspace/src/infrastructure/scripts
./database_monitor.sh

# Schedule regular monitoring with cron
# Example: Run every 15 minutes
*/15 * * * * /workspace/src/infrastructure/scripts/database_monitor.sh
```

#### Monitored Metrics

**PostgreSQL Metrics:**
- Database size
- Active connections
- Long-running queries
- Table bloat
- Unused indexes
- Cache hit ratio
- Transaction age

**MongoDB Metrics:**
- Database size
- Storage size
- Active connections
- Long-running operations
- Collection sizes and document counts
- Index counts
- Replica set status (if applicable)

**System Metrics:**
- CPU usage
- Memory usage
- Disk usage
- System load

#### Alert Thresholds

The script sends alerts when the following thresholds are exceeded:

- PostgreSQL connections > 100
- PostgreSQL queries running > 30 seconds
- PostgreSQL table bloat > 50%
- MongoDB connections > 100
- MongoDB operations running > 30 seconds
- CPU usage > 85%
- Memory usage > 85%
- Disk usage > 80%

#### Monitoring Reports

Monitoring reports are stored in:
```
/var/log/excel-medical/monitoring/
├── db_monitor_YYYYMMDD_HHMMSS.log
├── monitoring_report_YYYYMMDD_HHMMSS.txt
└── metrics/
    ├── postgres_db_size.csv
    ├── postgres_connections.csv
    ├── mongo_db_size.csv
    └── ...
```

## Database Maintenance

### Maintenance Script

The `database_maintenance.sh` script performs routine maintenance tasks on PostgreSQL and MongoDB databases.

#### Features

- Reclaims space with VACUUM operations
- Rebuilds indexes for optimal performance
- Repairs and compacts MongoDB collections
- Enforces data retention policies
- Identifies and fixes bloated tables
- Reports unused indexes
- Generates maintenance reports

#### Usage

```bash
# Run maintenance manually
cd /workspace/src/infrastructure/scripts
./database_maintenance.sh

# Schedule regular maintenance with cron
# Example: Run weekly on Sunday at 1 AM
0 1 * * 0 /workspace/src/infrastructure/scripts/database_maintenance.sh
```

#### Maintenance Operations

**PostgreSQL Maintenance:**
- VACUUM ANALYZE to reclaim space and update statistics
- REINDEX DATABASE to rebuild indexes
- VACUUM FULL on bloated tables
- Identification of unused indexes
- Statistics update with ANALYZE
- Data retention policy enforcement

**MongoDB Maintenance:**
- Collection validation and repair
- Collection compaction
- Index rebuilding
- Data retention policy enforcement

#### Maintenance Reports

Maintenance reports are stored in:
```
/var/log/excel-medical/maintenance/
├── db_maintenance_YYYYMMDD_HHMMSS.log
└── maintenance_report_YYYYMMDD_HHMMSS.txt
```

## Data Retention Implementation

The database maintenance script implements the data retention policies defined in the Data Retention Policy document. The following data is automatically purged based on configured retention periods:

### PostgreSQL Data Retention

- Audit logs: 365 days
- Application logs: 90 days
- Page views: 180 days
- Job views: 180 days
- User searches: 90 days

### MongoDB Data Retention

- Chat conversations: 180 days
- Analytics events: 30 days

## Notification System

All database management scripts include notification capabilities:

### Email Notifications

Notifications are sent to the configured email address (`ALERT_EMAIL`) for:
- Backup completion or failure
- Monitoring alerts when thresholds are exceeded
- Maintenance completion or failure

### Slack Notifications

If a Slack webhook URL is configured (`SLACK_WEBHOOK_URL`), notifications are also sent to the configured Slack channel with appropriate color coding:
- Success: Green
- Warning: Yellow
- Error: Red
- Info: Blue

## Scheduling with Cron

Recommended cron schedule for database management tasks:

```
# Database backups: Daily at 2 AM
0 2 * * * /workspace/src/infrastructure/scripts/database_backup.sh

# Database monitoring: Every 15 minutes
*/15 * * * * /workspace/src/infrastructure/scripts/database_monitor.sh

# Database maintenance: Weekly on Sunday at 1 AM
0 1 * * 0 /workspace/src/infrastructure/scripts/database_maintenance.sh
```

## Troubleshooting

### Common Issues and Solutions

#### Backup Failures

**Issue**: PostgreSQL backup fails with permission error
**Solution**: Verify that the PostgreSQL user has sufficient privileges and the backup directory is writable

**Issue**: MongoDB backup fails with connection error
**Solution**: Check MongoDB connection string and ensure MongoDB is running

#### Monitoring Alerts

**Issue**: Frequent alerts about high PostgreSQL connections
**Solution**: Check for connection leaks in the application or increase the `max_connections` parameter

**Issue**: Alerts about table bloat
**Solution**: Run the maintenance script to VACUUM bloated tables

#### Maintenance Issues

**Issue**: VACUUM FULL taking too long
**Solution**: Schedule maintenance during off-peak hours or use regular VACUUM instead of VACUUM FULL for large tables

**Issue**: MongoDB compaction failing
**Solution**: Ensure sufficient disk space is available for the compaction operation

### Log Locations

- Backup logs: `/var/backups/excel-medical/YYYY-MM-DD/backup_YYYYMMDD_HHMMSS.log`
- Monitoring logs: `/var/log/excel-medical/monitoring/db_monitor_YYYYMMDD_HHMMSS.log`
- Maintenance logs: `/var/log/excel-medical/maintenance/db_maintenance_YYYYMMDD_HHMMSS.log`

## Best Practices

1. **Regular Testing**: Periodically test the restore process to ensure backups are valid
2. **Monitoring Review**: Review monitoring reports weekly to identify trends
3. **Maintenance Window**: Schedule maintenance during low-traffic periods
4. **Backup Verification**: Regularly verify backup integrity
5. **Alert Review**: Review and adjust alert thresholds based on system behavior
6. **Documentation Updates**: Keep this documentation updated with any changes to procedures
7. **Security**: Ensure backup files and logs are properly secured
8. **Capacity Planning**: Monitor database growth and plan for capacity increases

## Contact Information

For issues or questions regarding database management:

- Database Administrator: dba@excelmedicalstaffing.com
- IT Support: it-support@excelmedicalstaffing.com
- Emergency Contact: on-call@excelmedicalstaffing.com

## Revision History

| Date | Version | Author | Description |
|------|---------|--------|-------------|
| 2025-08-27 | 1.0 | Database Team | Initial documentation |