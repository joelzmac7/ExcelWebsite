#!/bin/bash
# Database Backup Script for Excel Medical Staffing Platform
# This script creates backups of PostgreSQL and MongoDB databases

# Exit immediately if a command exits with a non-zero status
set -e

# Load environment variables
if [ -f .env ]; then
  source .env
else
  echo "Error: .env file not found"
  exit 1
fi

# Configuration
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_DIR="${BACKUP_ROOT_DIR:-/var/backups/excel-medical}"
POSTGRES_BACKUP_FILE="$BACKUP_DIR/postgres_${TIMESTAMP}.sql.gz"
MONGO_BACKUP_DIR="$BACKUP_DIR/mongo_${TIMESTAMP}"
LOG_FILE="$BACKUP_DIR/backup_${TIMESTAMP}.log"
RETENTION_DAYS=${BACKUP_RETENTION_DAYS:-7}

# Create backup directory if it doesn't exist
mkdir -p "$BACKUP_DIR"
touch "$LOG_FILE"

echo "Starting database backup at $(date)" | tee -a "$LOG_FILE"

# Function to log messages
log() {
  echo "[$(date +"%Y-%m-%d %H:%M:%S")] $1" | tee -a "$LOG_FILE"
}

# Backup PostgreSQL database
backup_postgres() {
  log "Starting PostgreSQL backup..."
  
  # Check if PGPASSWORD is set
  if [ -z "$POSTGRES_PASSWORD" ]; then
    log "Error: POSTGRES_PASSWORD environment variable not set"
    return 1
  fi
  
  # Set PostgreSQL environment variables
  export PGHOST="${POSTGRES_HOST:-localhost}"
  export PGPORT="${POSTGRES_PORT:-5432}"
  export PGUSER="${POSTGRES_USER:-postgres}"
  export PGPASSWORD="$POSTGRES_PASSWORD"
  export PGDATABASE="${POSTGRES_DB:-excel_medical}"
  
  # Create PostgreSQL backup
  pg_dump -Fc | gzip > "$POSTGRES_BACKUP_FILE"
  
  # Check if backup was successful
  if [ $? -eq 0 ]; then
    log "PostgreSQL backup completed successfully: $POSTGRES_BACKUP_FILE"
    log "Backup size: $(du -h "$POSTGRES_BACKUP_FILE" | cut -f1)"
  else
    log "Error: PostgreSQL backup failed"
    return 1
  fi
}

# Backup MongoDB database
backup_mongo() {
  log "Starting MongoDB backup..."
  
  # Check if MONGO_URI is set
  if [ -z "$MONGO_URI" ]; then
    log "Error: MONGO_URI environment variable not set"
    return 1
  fi
  
  # Create MongoDB backup directory
  mkdir -p "$MONGO_BACKUP_DIR"
  
  # Create MongoDB backup
  mongodump --uri="$MONGO_URI" --out="$MONGO_BACKUP_DIR"
  
  # Check if backup was successful
  if [ $? -eq 0 ]; then
    # Compress MongoDB backup
    tar -czf "${MONGO_BACKUP_DIR}.tar.gz" -C "$BACKUP_DIR" "mongo_${TIMESTAMP}"
    rm -rf "$MONGO_BACKUP_DIR"
    
    log "MongoDB backup completed successfully: ${MONGO_BACKUP_DIR}.tar.gz"
    log "Backup size: $(du -h "${MONGO_BACKUP_DIR}.tar.gz" | cut -f1)"
  else
    log "Error: MongoDB backup failed"
    return 1
  fi
}

# Clean up old backups
cleanup_old_backups() {
  log "Cleaning up backups older than $RETENTION_DAYS days..."
  
  find "$BACKUP_DIR" -name "postgres_*.sql.gz" -type f -mtime +$RETENTION_DAYS -delete
  find "$BACKUP_DIR" -name "mongo_*.tar.gz" -type f -mtime +$RETENTION_DAYS -delete
  find "$BACKUP_DIR" -name "backup_*.log" -type f -mtime +$RETENTION_DAYS -delete
  
  log "Cleanup completed"
}

# Upload backups to S3 (if configured)
upload_to_s3() {
  if [ -n "$S3_BACKUP_BUCKET" ]; then
    log "Uploading backups to S3 bucket: $S3_BACKUP_BUCKET"
    
    # Check if AWS CLI is installed
    if ! command -v aws &> /dev/null; then
      log "Error: AWS CLI not installed"
      return 1
    fi
    
    # Upload PostgreSQL backup
    aws s3 cp "$POSTGRES_BACKUP_FILE" "s3://$S3_BACKUP_BUCKET/postgres/"
    
    # Upload MongoDB backup
    aws s3 cp "${MONGO_BACKUP_DIR}.tar.gz" "s3://$S3_BACKUP_BUCKET/mongo/"
    
    # Upload log file
    aws s3 cp "$LOG_FILE" "s3://$S3_BACKUP_BUCKET/logs/"
    
    log "S3 upload completed"
  else
    log "S3 backup not configured, skipping upload"
  fi
}

# Main execution
main() {
  # Create backup directory structure
  mkdir -p "$BACKUP_DIR"
  
  # Backup PostgreSQL
  backup_postgres
  
  # Backup MongoDB
  backup_mongo
  
  # Clean up old backups
  cleanup_old_backups
  
  # Upload to S3 if configured
  upload_to_s3
  
  log "Backup process completed successfully"
}

# Run main function
main

exit 0