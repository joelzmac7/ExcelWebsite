#!/bin/bash
# Comprehensive Database Backup Script for Excel Medical Staffing Platform
# This script creates backups of PostgreSQL and MongoDB databases with verification and notifications

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
BACKUP_DATE=$(date +"%Y-%m-%d")
BACKUP_SUBDIR="$BACKUP_DIR/$BACKUP_DATE"
POSTGRES_BACKUP_FILE="$BACKUP_SUBDIR/postgres_${TIMESTAMP}.sql.gz"
MONGO_BACKUP_DIR="$BACKUP_SUBDIR/mongo_${TIMESTAMP}"
LOG_FILE="$BACKUP_SUBDIR/backup_${TIMESTAMP}.log"
RETENTION_DAYS=${BACKUP_RETENTION_DAYS:-7}
VERIFICATION_DIR="$BACKUP_SUBDIR/verification"
SLACK_WEBHOOK_URL="${SLACK_WEBHOOK_URL:-}"
ALERT_EMAIL="${ALERT_EMAIL:-admin@excelmedicalstaffing.com}"
MAX_RETRIES=3
RETRY_DELAY=60 # seconds

# Create backup directory structure
mkdir -p "$BACKUP_SUBDIR"
mkdir -p "$VERIFICATION_DIR"
touch "$LOG_FILE"

# Function to log messages
log() {
  local level="$1"
  local message="$2"
  local timestamp=$(date +"%Y-%m-%d %H:%M:%S")
  echo "[$timestamp] [$level] $message" | tee -a "$LOG_FILE"
}

# Function to send notifications
send_notification() {
  local subject="$1"
  local message="$2"
  local status="$3" # success, warning, error
  
  # Send email notification
  if [ -n "$ALERT_EMAIL" ]; then
    echo -e "$message" | mail -s "[$status] $subject" "$ALERT_EMAIL"
    log "INFO" "Email notification sent to $ALERT_EMAIL"
  fi
  
  # Send Slack notification if webhook URL is configured
  if [ -n "$SLACK_WEBHOOK_URL" ]; then
    local color
    case $status in
      success) color="#36a64f" ;; # Green
      warning) color="#ffcc00" ;; # Yellow
      error) color="#ff0000" ;; # Red
      *) color="#808080" ;; # Gray
    esac
    
    curl -s -X POST -H 'Content-type: application/json' \
      --data "{&quot;attachments&quot;:[{&quot;color&quot;:&quot;$color&quot;,&quot;title&quot;:&quot;$subject&quot;,&quot;text&quot;:&quot;$message&quot;}]}" \
      "$SLACK_WEBHOOK_URL"
    log "INFO" "Slack notification sent"
  fi
}

# Function to execute command with retries
retry_command() {
  local cmd="$1"
  local retries=0
  local success=false
  
  while [ $retries -lt $MAX_RETRIES ] && [ "$success" = false ]; do
    if eval "$cmd"; then
      success=true
    else
      retries=$((retries + 1))
      log "WARNING" "Command failed, retry $retries of $MAX_RETRIES in $RETRY_DELAY seconds"
      sleep $RETRY_DELAY
    fi
  done
  
  if [ "$success" = false ]; then
    log "ERROR" "Command failed after $MAX_RETRIES retries: $cmd"
    return 1
  fi
  
  return 0
}

# Backup PostgreSQL database
backup_postgres() {
  log "INFO" "Starting PostgreSQL backup..."
  
  # Check if POSTGRES_PASSWORD is set
  if [ -z "$POSTGRES_PASSWORD" ]; then
    log "ERROR" "POSTGRES_PASSWORD environment variable not set"
    return 1
  fi
  
  # Set PostgreSQL environment variables
  export PGHOST="${POSTGRES_HOST:-localhost}"
  export PGPORT="${POSTGRES_PORT:-5432}"
  export PGUSER="${POSTGRES_USER:-postgres}"
  export PGPASSWORD="$POSTGRES_PASSWORD"
  export PGDATABASE="${POSTGRES_DB:-excel_medical}"
  
  # Create PostgreSQL backup with retry
  log "INFO" "Creating PostgreSQL backup for database $PGDATABASE on $PGHOST:$PGPORT"
  if retry_command "pg_dump -Fc | gzip > &quot;$POSTGRES_BACKUP_FILE&quot;"; then
    log "INFO" "PostgreSQL backup completed successfully: $POSTGRES_BACKUP_FILE"
    log "INFO" "Backup size: $(du -h "$POSTGRES_BACKUP_FILE" | cut -f1)"
    
    # Verify backup integrity
    log "INFO" "Verifying PostgreSQL backup integrity..."
    if gunzip -c "$POSTGRES_BACKUP_FILE" | pg_restore -l > "$VERIFICATION_DIR/postgres_backup_verify.txt"; then
      log "INFO" "PostgreSQL backup verification successful"
    else
      log "ERROR" "PostgreSQL backup verification failed"
      send_notification "PostgreSQL Backup Verification Failed" "The backup file appears to be corrupted or incomplete." "error"
      return 1
    fi
  else
    log "ERROR" "PostgreSQL backup failed after multiple attempts"
    send_notification "PostgreSQL Backup Failed" "Failed to create PostgreSQL backup after $MAX_RETRIES attempts." "error"
    return 1
  fi
  
  return 0
}

# Backup MongoDB database
backup_mongo() {
  log "INFO" "Starting MongoDB backup..."
  
  # Check if MONGO_URI is set
  if [ -z "$MONGO_URI" ]; then
    log "ERROR" "MONGO_URI environment variable not set"
    return 1
  fi
  
  # Create MongoDB backup directory
  mkdir -p "$MONGO_BACKUP_DIR"
  
  # Create MongoDB backup with retry
  log "INFO" "Creating MongoDB backup using URI: $MONGO_URI"
  if retry_command "mongodump --uri=&quot;$MONGO_URI&quot; --out=&quot;$MONGO_BACKUP_DIR&quot;"; then
    # Compress MongoDB backup
    tar -czf "${MONGO_BACKUP_DIR}.tar.gz" -C "$BACKUP_SUBDIR" "mongo_${TIMESTAMP}"
    rm -rf "$MONGO_BACKUP_DIR"
    
    log "INFO" "MongoDB backup completed successfully: ${MONGO_BACKUP_DIR}.tar.gz"
    log "INFO" "Backup size: $(du -h "${MONGO_BACKUP_DIR}.tar.gz" | cut -f1)"
    
    # Verify backup integrity
    log "INFO" "Verifying MongoDB backup integrity..."
    if tar -tzf "${MONGO_BACKUP_DIR}.tar.gz" > "$VERIFICATION_DIR/mongo_backup_verify.txt"; then
      log "INFO" "MongoDB backup verification successful"
    else
      log "ERROR" "MongoDB backup verification failed"
      send_notification "MongoDB Backup Verification Failed" "The backup file appears to be corrupted or incomplete." "error"
      return 1
    fi
  else
    log "ERROR" "MongoDB backup failed after multiple attempts"
    send_notification "MongoDB Backup Failed" "Failed to create MongoDB backup after $MAX_RETRIES attempts." "error"
    return 1
  fi
  
  return 0
}

# Clean up old backups based on retention policy
cleanup_old_backups() {
  log "INFO" "Cleaning up backups older than $RETENTION_DAYS days..."
  
  # Find and delete old backup directories
  find "$BACKUP_DIR" -type d -name "20*-*-*" -mtime +$RETENTION_DAYS -exec rm -rf {} \;
  
  log "INFO" "Backup cleanup completed"
}

# Upload backups to S3 (if configured)
upload_to_s3() {
  if [ -n "$S3_BACKUP_BUCKET" ]; then
    log "INFO" "Uploading backups to S3 bucket: $S3_BACKUP_BUCKET"
    
    # Check if AWS CLI is installed
    if ! command -v aws &> /dev/null; then
      log "ERROR" "AWS CLI not installed"
      return 1
    fi
    
    # Create S3 directory structure with date
    S3_PREFIX="backups/$(date +"%Y/%m/%d")"
    
    # Upload PostgreSQL backup
    log "INFO" "Uploading PostgreSQL backup to S3..."
    if retry_command "aws s3 cp &quot;$POSTGRES_BACKUP_FILE&quot; &quot;s3://$S3_BACKUP_BUCKET/$S3_PREFIX/postgres/&quot;"; then
      log "INFO" "PostgreSQL backup uploaded to S3 successfully"
    else
      log "ERROR" "Failed to upload PostgreSQL backup to S3"
      send_notification "S3 Upload Failed" "Failed to upload PostgreSQL backup to S3." "warning"
    fi
    
    # Upload MongoDB backup
    log "INFO" "Uploading MongoDB backup to S3..."
    if retry_command "aws s3 cp &quot;${MONGO_BACKUP_DIR}.tar.gz&quot; &quot;s3://$S3_BACKUP_BUCKET/$S3_PREFIX/mongo/&quot;"; then
      log "INFO" "MongoDB backup uploaded to S3 successfully"
    else
      log "ERROR" "Failed to upload MongoDB backup to S3"
      send_notification "S3 Upload Failed" "Failed to upload MongoDB backup to S3." "warning"
    fi
    
    # Upload log file
    aws s3 cp "$LOG_FILE" "s3://$S3_BACKUP_BUCKET/$S3_PREFIX/logs/"
    
    log "INFO" "S3 upload completed"
  else
    log "INFO" "S3 backup not configured, skipping upload"
  fi
}

# Create backup summary
create_backup_summary() {
  local summary_file="$BACKUP_SUBDIR/backup_summary.txt"
  
  log "INFO" "Creating backup summary..."
  
  echo "Excel Medical Staffing Database Backup Summary" > "$summary_file"
  echo "=============================================" >> "$summary_file"
  echo "" >> "$summary_file"
  echo "Backup Date: $(date)" >> "$summary_file"
  echo "Backup Directory: $BACKUP_SUBDIR" >> "$summary_file"
  echo "" >> "$summary_file"
  echo "PostgreSQL Backup:" >> "$summary_file"
  echo "  File: $POSTGRES_BACKUP_FILE" >> "$summary_file"
  echo "  Size: $(du -h "$POSTGRES_BACKUP_FILE" | cut -f1)" >> "$summary_file"
  echo "  Database: $PGDATABASE" >> "$summary_file"
  echo "  Host: $PGHOST:$PGPORT" >> "$summary_file"
  echo "" >> "$summary_file"
  echo "MongoDB Backup:" >> "$summary_file"
  echo "  File: ${MONGO_BACKUP_DIR}.tar.gz" >> "$summary_file"
  echo "  Size: $(du -h "${MONGO_BACKUP_DIR}.tar.gz" | cut -f1)" >> "$summary_file"
  echo "" >> "$summary_file"
  echo "Retention Policy: $RETENTION_DAYS days" >> "$summary_file"
  echo "" >> "$summary_file"
  if [ -n "$S3_BACKUP_BUCKET" ]; then
    echo "S3 Backup Location: s3://$S3_BACKUP_BUCKET/$S3_PREFIX/" >> "$summary_file"
  else
    echo "S3 Backup: Not configured" >> "$summary_file"
  fi
  echo "" >> "$summary_file"
  echo "Backup Log: $LOG_FILE" >> "$summary_file"
  
  log "INFO" "Backup summary created: $summary_file"
}

# Main execution
main() {
  log "INFO" "Starting database backup process"
  
  # Record start time
  start_time=$(date +%s)
  
  # Backup PostgreSQL
  if backup_postgres; then
    log "INFO" "PostgreSQL backup completed successfully"
  else
    log "ERROR" "PostgreSQL backup failed"
    send_notification "Database Backup Partially Failed" "PostgreSQL backup failed. Check logs for details: $LOG_FILE" "error"
  fi
  
  # Backup MongoDB
  if backup_mongo; then
    log "INFO" "MongoDB backup completed successfully"
  else
    log "ERROR" "MongoDB backup failed"
    send_notification "Database Backup Partially Failed" "MongoDB backup failed. Check logs for details: $LOG_FILE" "error"
  fi
  
  # Clean up old backups
  cleanup_old_backups
  
  # Upload to S3 if configured
  upload_to_s3
  
  # Create backup summary
  create_backup_summary
  
  # Record end time and calculate duration
  end_time=$(date +%s)
  duration=$((end_time - start_time))
  
  # Log completion
  log "INFO" "Backup process completed in $duration seconds"
  
  # Send success notification
  send_notification "Database Backup Completed" "Database backup completed successfully.\n\nPostgreSQL: $(du -h "$POSTGRES_BACKUP_FILE" | cut -f1)\nMongoDB: $(du -h "${MONGO_BACKUP_DIR}.tar.gz" | cut -f1)\n\nBackup Location: $BACKUP_SUBDIR\nDuration: $duration seconds" "success"
}

# Run main function
main

exit 0