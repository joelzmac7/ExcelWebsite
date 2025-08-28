#!/bin/bash
# Database Backup Script for Excel Medical Staffing Platform
# This script creates backups of PostgreSQL and MongoDB databases

# Configuration
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_DIR="/var/backups/excel-medical"
POSTGRES_DB="excel_medical"
POSTGRES_USER="postgres"
MONGO_DB="excel_medical"
S3_BUCKET="excel-medical-backups"
RETENTION_DAYS=30

# Create backup directory if it doesn't exist
mkdir -p $BACKUP_DIR

# Log file
LOG_FILE="$BACKUP_DIR/backup_$TIMESTAMP.log"

# Function to log messages
log() {
  echo "[$(date +"%Y-%m-%d %H:%M:%S")] $1" | tee -a $LOG_FILE
}

log "Starting database backup process"

# PostgreSQL Backup
POSTGRES_BACKUP_FILE="$BACKUP_DIR/postgres_$POSTGRES_DB_$TIMESTAMP.sql.gz"
log "Creating PostgreSQL backup: $POSTGRES_BACKUP_FILE"

if pg_dump -U $POSTGRES_USER $POSTGRES_DB | gzip > $POSTGRES_BACKUP_FILE; then
  log "PostgreSQL backup completed successfully"
  
  # Get backup size
  POSTGRES_BACKUP_SIZE=$(du -h $POSTGRES_BACKUP_FILE | cut -f1)
  log "PostgreSQL backup size: $POSTGRES_BACKUP_SIZE"
else
  log "ERROR: PostgreSQL backup failed"
  exit 1
fi

# MongoDB Backup
MONGO_BACKUP_DIR="$BACKUP_DIR/mongo_$TIMESTAMP"
MONGO_BACKUP_FILE="$BACKUP_DIR/mongo_$MONGO_DB_$TIMESTAMP.tar.gz"
log "Creating MongoDB backup: $MONGO_BACKUP_FILE"

mkdir -p $MONGO_BACKUP_DIR

if mongodump --db $MONGO_DB --out $MONGO_BACKUP_DIR; then
  log "MongoDB dump completed successfully"
  
  # Compress MongoDB backup
  if tar -czf $MONGO_BACKUP_FILE -C $MONGO_BACKUP_DIR .; then
    log "MongoDB backup compressed successfully"
    
    # Get backup size
    MONGO_BACKUP_SIZE=$(du -h $MONGO_BACKUP_FILE | cut -f1)
    log "MongoDB backup size: $MONGO_BACKUP_SIZE"
    
    # Remove temporary MongoDB dump directory
    rm -rf $MONGO_BACKUP_DIR
  else
    log "ERROR: MongoDB backup compression failed"
    exit 1
  fi
else
  log "ERROR: MongoDB backup failed"
  exit 1
fi

# Upload backups to S3
log "Uploading backups to S3 bucket: $S3_BUCKET"

if aws s3 cp $POSTGRES_BACKUP_FILE s3://$S3_BUCKET/postgres/ && \
   aws s3 cp $MONGO_BACKUP_FILE s3://$S3_BUCKET/mongo/; then
  log "Backups uploaded to S3 successfully"
else
  log "ERROR: Failed to upload backups to S3"
  exit 1
fi

# Clean up old backups (local)
log "Cleaning up local backups older than $RETENTION_DAYS days"
find $BACKUP_DIR -name "postgres_*.sql.gz" -type f -mtime +$RETENTION_DAYS -delete
find $BACKUP_DIR -name "mongo_*.tar.gz" -type f -mtime +$RETENTION_DAYS -delete

# Clean up old backups (S3)
log "Cleaning up S3 backups older than $RETENTION_DAYS days"
RETENTION_DATE=$(date -d "-$RETENTION_DAYS days" +"%Y-%m-%d")

aws s3 ls s3://$S3_BUCKET/postgres/ | while read -r line; do
  CREATE_DATE=$(echo $line | awk '{print $1}')
  FILE_NAME=$(echo $line | awk '{print $4}')
  
  if [[ "$CREATE_DATE" < "$RETENTION_DATE" ]]; then
    aws s3 rm s3://$S3_BUCKET/postgres/$FILE_NAME
    log "Removed old S3 backup: postgres/$FILE_NAME"
  fi
done

aws s3 ls s3://$S3_BUCKET/mongo/ | while read -r line; do
  CREATE_DATE=$(echo $line | awk '{print $1}')
  FILE_NAME=$(echo $line | awk '{print $4}')
  
  if [[ "$CREATE_DATE" < "$RETENTION_DATE" ]]; then
    aws s3 rm s3://$S3_BUCKET/mongo/$FILE_NAME
    log "Removed old S3 backup: mongo/$FILE_NAME"
  fi
done

log "Backup process completed successfully"

# Send notification
TOTAL_SIZE=$(du -ch $POSTGRES_BACKUP_FILE $MONGO_BACKUP_FILE | grep total | cut -f1)
SUBJECT="Excel Medical Database Backup - $TIMESTAMP"
BODY="Database backup completed successfully.\n\nPostgreSQL Backup: $POSTGRES_BACKUP_SIZE\nMongoDB Backup: $MONGO_BACKUP_SIZE\nTotal Size: $TOTAL_SIZE\n\nBackups stored in S3 bucket: $S3_BUCKET"

echo -e $BODY | mail -s "$SUBJECT" "admin@excelmedicalstaffing.com"

exit 0