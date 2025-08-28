#!/bin/bash
# Comprehensive Database Maintenance Script for Excel Medical Staffing Platform
# This script performs routine maintenance tasks on PostgreSQL and MongoDB databases

# Exit on error
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
LOG_DIR="${LOG_ROOT_DIR:-/var/log/excel-medical}/maintenance"
MAINTENANCE_LOG="$LOG_DIR/db_maintenance_${TIMESTAMP}.log"
ALERT_EMAIL="${ALERT_EMAIL:-admin@excelmedicalstaffing.com}"
SLACK_WEBHOOK_URL="${SLACK_WEBHOOK_URL:-}"
POSTGRES_DB="${POSTGRES_DB:-excel_medical}"
POSTGRES_USER="${POSTGRES_USER:-postgres}"
POSTGRES_HOST="${POSTGRES_HOST:-localhost}"
POSTGRES_PORT="${POSTGRES_PORT:-5432}"
MONGO_URI="${MONGO_URI:-mongodb://localhost:27017/excel_medical}"
MONGO_DB="${MONGO_DB:-excel_medical}"
MAX_RETRIES=3
RETRY_DELAY=60 # seconds

# Data retention configuration
RETENTION_DAYS_AUDIT_LOGS=365
RETENTION_DAYS_APPLICATION_LOGS=90
RETENTION_DAYS_MONITORING_LOGS=30
RETENTION_DAYS_PAGE_VIEWS=180
RETENTION_DAYS_JOB_VIEWS=180
RETENTION_DAYS_USER_SEARCHES=90
RETENTION_DAYS_CHAT_CONVERSATIONS=180

# Create log directory if it doesn't exist
mkdir -p "$LOG_DIR"
touch "$MAINTENANCE_LOG"

# Function to log messages
log() {
  local level="$1"
  local message="$2"
  local timestamp=$(date +"%Y-%m-%d %H:%M:%S")
  echo "[$timestamp] [$level] $message" | tee -a "$MAINTENANCE_LOG"
}

# Function to send notifications
send_notification() {
  local subject="$1"
  local message="$2"
  local status="$3" # success, warning, error, info
  
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
      info) color="#0000FF" ;; # Blue
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

log "INFO" "Starting database maintenance tasks"

# PostgreSQL maintenance
postgres_maintenance() {
  log "INFO" "Starting PostgreSQL maintenance tasks"
  
  # Set PostgreSQL environment variables
  export PGHOST="$POSTGRES_HOST"
  export PGPORT="$POSTGRES_PORT"
  export PGUSER="$POSTGRES_USER"
  export PGPASSWORD="$POSTGRES_PASSWORD"
  export PGDATABASE="$POSTGRES_DB"
  
  # Check PostgreSQL connection
  if ! pg_isready -h "$PGHOST" -p "$PGPORT" -U "$PGUSER"; then
    log "ERROR" "Cannot connect to PostgreSQL"
    send_notification "PostgreSQL Maintenance Failed" "Cannot connect to PostgreSQL database at $PGHOST:$PGPORT" "error"
    return 1
  fi
  
  log "INFO" "Connected to PostgreSQL database: $PGDATABASE"
  
  # 1. VACUUM ANALYZE to reclaim space and update statistics
  log "INFO" "Running VACUUM ANALYZE..."
  if retry_command "psql -c 'VACUUM ANALYZE;'"; then
    log "INFO" "VACUUM ANALYZE completed successfully"
  else
    log "ERROR" "VACUUM ANALYZE failed"
    send_notification "PostgreSQL Maintenance Error" "VACUUM ANALYZE operation failed" "error"
  fi
  
  # 2. REINDEX to rebuild indexes
  log "INFO" "Running REINDEX DATABASE..."
  if retry_command "psql -c 'REINDEX DATABASE $PGDATABASE;'"; then
    log "INFO" "REINDEX completed successfully"
  else
    log "ERROR" "REINDEX failed"
    send_notification "PostgreSQL Maintenance Error" "REINDEX operation failed" "error"
  fi
  
  # 3. Identify and fix bloated tables
  log "INFO" "Checking for bloated tables..."
  BLOATED_TABLES=$(psql -t -c "
    SELECT schemaname || '.' || tablename as table_name,
           pg_size_pretty(pg_total_relation_size(schemaname || '.' || tablename)) as total_size,
           round(n_dead_tup::numeric / greatest(n_live_tup, 1), 4) as dead_ratio
    FROM pg_stat_user_tables
    WHERE n_dead_tup > 10000 AND round(n_dead_tup::numeric / greatest(n_live_tup, 1), 4) > 0.1
    ORDER BY dead_ratio DESC;
  ")
  
  if [ -n "$BLOATED_TABLES" ]; then
    log "INFO" "Found bloated tables:"
    log "INFO" "$BLOATED_TABLES"
    
    # VACUUM FULL on bloated tables
    log "INFO" "Running VACUUM FULL on bloated tables..."
    echo "$BLOATED_TABLES" | while read -r line; do
      if [ -n "$line" ]; then
        TABLE_NAME=$(echo "$line" | awk '{print $1}')
        log "INFO" "VACUUM FULL on $TABLE_NAME"
        if retry_command "psql -c 'VACUUM FULL $TABLE_NAME;'"; then
          log "INFO" "VACUUM FULL on $TABLE_NAME completed successfully"
        else
          log "ERROR" "VACUUM FULL on $TABLE_NAME failed"
          send_notification "PostgreSQL Maintenance Error" "VACUUM FULL on $TABLE_NAME failed" "error"
        fi
      fi
    done
    log "INFO" "VACUUM FULL completed on bloated tables"
  else
    log "INFO" "No significantly bloated tables found"
  fi
  
  # 4. Identify and fix unused indexes
  log "INFO" "Checking for unused indexes..."
  UNUSED_INDEXES=$(psql -t -c "
    SELECT schemaname || '.' || relname || '.' || indexrelname as index_name,
           pg_size_pretty(pg_relation_size(i.indexrelid)) as index_size
    FROM pg_stat_user_indexes ui
    JOIN pg_index i ON ui.indexrelid = i.indexrelid
    WHERE NOT indisunique AND idx_scan = 0 AND pg_relation_size(i.indexrelid) > 1048576
    ORDER BY pg_relation_size(i.indexrelid) DESC;
  ")
  
  if [ -n "$UNUSED_INDEXES" ]; then
    log "INFO" "Found unused indexes:"
    log "INFO" "$UNUSED_INDEXES"
    send_notification "PostgreSQL Unused Indexes" "The following indexes are not being used and consuming space:\n\n$UNUSED_INDEXES" "info"
    
    # We don't automatically drop indexes, just report them
    log "INFO" "Consider dropping these unused indexes manually after review"
  else
    log "INFO" "No significant unused indexes found"
  fi
  
  # 5. Update database statistics
  log "INFO" "Updating database statistics..."
  if retry_command "psql -c 'ANALYZE;'"; then
    log "INFO" "Statistics update completed successfully"
  else
    log "ERROR" "Statistics update failed"
    send_notification "PostgreSQL Maintenance Error" "ANALYZE operation failed" "error"
  fi
  
  # 6. Apply data retention policies
  log "INFO" "Applying data retention policies..."
  
  # Audit logs retention
  log "INFO" "Purging audit logs older than $RETENTION_DAYS_AUDIT_LOGS days..."
  if retry_command "psql -c &quot;DELETE FROM application_status_history WHERE created_at < NOW() - INTERVAL '$RETENTION_DAYS_AUDIT_LOGS days';&quot;"; then
    log "INFO" "Audit logs purged successfully"
  else
    log "ERROR" "Failed to purge audit logs"
    send_notification "PostgreSQL Maintenance Error" "Failed to purge audit logs" "error"
  fi
  
  # Page views retention
  log "INFO" "Purging page views older than $RETENTION_DAYS_PAGE_VIEWS days..."
  if retry_command "psql -c &quot;DELETE FROM page_views WHERE created_at < NOW() - INTERVAL '$RETENTION_DAYS_PAGE_VIEWS days';&quot;"; then
    log "INFO" "Page views purged successfully"
  else
    log "ERROR" "Failed to purge page views"
    send_notification "PostgreSQL Maintenance Error" "Failed to purge page views" "error"
  fi
  
  # Job views retention
  log "INFO" "Purging job views older than $RETENTION_DAYS_JOB_VIEWS days..."
  if retry_command "psql -c &quot;DELETE FROM job_views WHERE created_at < NOW() - INTERVAL '$RETENTION_DAYS_JOB_VIEWS days';&quot;"; then
    log "INFO" "Job views purged successfully"
  else
    log "ERROR" "Failed to purge job views"
    send_notification "PostgreSQL Maintenance Error" "Failed to purge job views" "error"
  fi
  
  # User searches retention
  log "INFO" "Purging user searches older than $RETENTION_DAYS_USER_SEARCHES days..."
  if retry_command "psql -c &quot;DELETE FROM user_searches WHERE created_at < NOW() - INTERVAL '$RETENTION_DAYS_USER_SEARCHES days';&quot;"; then
    log "INFO" "User searches purged successfully"
  else
    log "ERROR" "Failed to purge user searches"
    send_notification "PostgreSQL Maintenance Error" "Failed to purge user searches" "error"
  fi
  
  # 7. Check for long-running queries and terminate if necessary
  log "INFO" "Checking for long-running queries..."
  LONG_QUERIES=$(psql -t -c "
    SELECT pid, now() - query_start as duration, query 
    FROM pg_stat_activity 
    WHERE state = 'active' AND now() - query_start > '1 hour'::interval 
    ORDER BY duration DESC;
  ")
  
  if [ -n "$LONG_QUERIES" ]; then
    log "WARNING" "Found long-running queries (>1 hour):"
    log "WARNING" "$LONG_QUERIES"
    send_notification "PostgreSQL Long-Running Queries" "The following queries have been running for more than 1 hour:\n\n$LONG_QUERIES" "warning"
    
    # We don't automatically terminate queries, just report them
    log "INFO" "Consider terminating these queries manually if necessary"
  else
    log "INFO" "No extremely long-running queries found"
  fi
  
  log "INFO" "PostgreSQL maintenance tasks completed"
  return 0
}

# MongoDB maintenance
mongo_maintenance() {
  log "INFO" "Starting MongoDB maintenance tasks"
  
  # Check if MONGO_URI is set
  if [ -z "$MONGO_URI" ]; then
    log "ERROR" "MONGO_URI environment variable not set"
    return 1
  fi
  
  # Check MongoDB connection
  if ! mongosh --quiet --eval "db.adminCommand('ping')" "$MONGO_URI" > /dev/null; then
    log "ERROR" "Cannot connect to MongoDB"
    send_notification "MongoDB Maintenance Failed" "Cannot connect to MongoDB database" "error"
    return 1
  fi
  
  log "INFO" "Connected to MongoDB database"
  
  # 1. Get database stats before maintenance
  log "INFO" "Getting database stats before maintenance..."
  DB_STATS_BEFORE=$(mongosh --quiet --eval "JSON.stringify(db.stats())" "$MONGO_URI")
  DB_SIZE_BEFORE=$(echo "$DB_STATS_BEFORE" | jq -r '.dataSize')
  DB_SIZE_MB_BEFORE=$(echo "scale=2; $DB_SIZE_BEFORE / 1024 / 1024" | bc)
  log "INFO" "Database size before maintenance: $DB_SIZE_MB_BEFORE MB"
  
  # 2. Get collection names
  log "INFO" "Getting collection names..."
  COLLECTIONS=$(mongosh --quiet --eval "JSON.stringify(db.getCollectionNames())" "$MONGO_URI")
  
  # 3. Repair and compact collections
  log "INFO" "Repairing and compacting collections..."
  echo "$COLLECTIONS" | jq -r '.[]' | while read -r COLLECTION; do
    if [ -n "$COLLECTION" ]; then
      log "INFO" "Validating collection: $COLLECTION"
      VALIDATION=$(mongosh --quiet --eval "JSON.stringify(db.runCommand({validate: '$COLLECTION'}))" "$MONGO_URI")
      VALID=$(echo "$VALIDATION" | jq -r '.valid')
      
      if [ "$VALID" == "true" ]; then
        log "INFO" "Collection $COLLECTION is valid"
      else
        log "WARNING" "Collection $COLLECTION needs repair"
        if retry_command "mongosh --quiet --eval &quot;db.$COLLECTION.repairCollection()&quot; &quot;$MONGO_URI&quot; > /dev/null"; then
          log "INFO" "Repaired collection: $COLLECTION"
        else
          log "ERROR" "Failed to repair collection: $COLLECTION"
          send_notification "MongoDB Maintenance Error" "Failed to repair collection: $COLLECTION" "error"
        fi
      fi
      
      # Compact collection
      log "INFO" "Compacting collection: $COLLECTION"
      if retry_command "mongosh --quiet --eval &quot;db.runCommand({compact: '$COLLECTION'})&quot; &quot;$MONGO_URI&quot; > /dev/null"; then
        log "INFO" "Compacted collection: $COLLECTION"
      else
        log "ERROR" "Failed to compact collection: $COLLECTION"
        send_notification "MongoDB Maintenance Error" "Failed to compact collection: $COLLECTION" "error"
      fi
    fi
  done
  
  # 4. Check and rebuild indexes
  log "INFO" "Checking and rebuilding indexes..."
  echo "$COLLECTIONS" | jq -r '.[]' | while read -r COLLECTION; do
    if [ -n "$COLLECTION" ]; then
      log "INFO" "Checking indexes for collection: $COLLECTION"
      INDEXES=$(mongosh --quiet --eval "JSON.stringify(db.$COLLECTION.getIndexes())" "$MONGO_URI")
      INDEX_COUNT=$(echo "$INDEXES" | jq -r 'length')
      
      log "INFO" "Collection $COLLECTION has $INDEX_COUNT indexes"
      
      # Rebuild indexes if there are any
      if [ "$INDEX_COUNT" -gt 0 ]; then
        log "INFO" "Rebuilding indexes for collection: $COLLECTION"
        if retry_command "mongosh --quiet --eval &quot;db.$COLLECTION.reIndex()&quot; &quot;$MONGO_URI&quot; > /dev/null"; then
          log "INFO" "Rebuilt indexes for collection: $COLLECTION"
        else
          log "ERROR" "Failed to rebuild indexes for collection: $COLLECTION"
          send_notification "MongoDB Maintenance Error" "Failed to rebuild indexes for collection: $COLLECTION" "error"
        fi
      fi
    fi
  done
  
  # 5. Apply data retention policies
  log "INFO" "Applying data retention policies..."
  
  # Chat conversations retention
  log "INFO" "Purging chat conversations older than $RETENTION_DAYS_CHAT_CONVERSATIONS days..."
  if retry_command "mongosh --quiet --eval &quot;db.chat_conversations.deleteMany({last_activity: {\\\$lt: new Date(new Date().setDate(new Date().getDate() - $RETENTION_DAYS_CHAT_CONVERSATIONS))}})&quot; &quot;$MONGO_URI&quot; > /dev/null"; then
    log "INFO" "Old chat conversations purged successfully"
  else
    log "ERROR" "Failed to purge old chat conversations"
    send_notification "MongoDB Maintenance Error" "Failed to purge old chat conversations" "error"
  fi
  
  # Analytics events retention
  log "INFO" "Purging analytics events older than $RETENTION_DAYS_MONITORING_LOGS days..."
  if retry_command "mongosh --quiet --eval &quot;db.analytics_events.deleteMany({timestamp: {\\\$lt: new Date(new Date().setDate(new Date().getDate() - $RETENTION_DAYS_MONITORING_LOGS))}})&quot; &quot;$MONGO_URI&quot; > /dev/null"; then
    log "INFO" "Old analytics events purged successfully"
  else
    log "ERROR" "Failed to purge old analytics events"
    send_notification "MongoDB Maintenance Error" "Failed to purge old analytics events" "error"
  fi
  
  # 6. Get database stats after maintenance
  log "INFO" "Getting database stats after maintenance..."
  DB_STATS_AFTER=$(mongosh --quiet --eval "JSON.stringify(db.stats())" "$MONGO_URI")
  DB_SIZE_AFTER=$(echo "$DB_STATS_AFTER" | jq -r '.dataSize')
  DB_SIZE_MB_AFTER=$(echo "scale=2; $DB_SIZE_AFTER / 1024 / 1024" | bc)
  log "INFO" "Database size after maintenance: $DB_SIZE_MB_AFTER MB"
  
  # Calculate space saved
  SPACE_SAVED_MB=$(echo "scale=2; $DB_SIZE_MB_BEFORE - $DB_SIZE_MB_AFTER" | bc)
  SPACE_SAVED_PERCENT=$(echo "scale=2; ($DB_SIZE_MB_BEFORE - $DB_SIZE_MB_AFTER) * 100 / $DB_SIZE_MB_BEFORE" | bc)
  
  log "INFO" "Space saved: $SPACE_SAVED_MB MB ($SPACE_SAVED_PERCENT%)"
  
  log "INFO" "MongoDB maintenance tasks completed"
  return 0
}

# Generate maintenance report
generate_report() {
  local report_file="$LOG_DIR/maintenance_report_${TIMESTAMP}.txt"
  
  log "INFO" "Generating maintenance report"
  
  echo "Excel Medical Staffing Database Maintenance Report" > "$report_file"
  echo "=================================================" >> "$report_file"
  echo "" >> "$report_file"
  echo "Report Date: $(date)" >> "$report_file"
  echo "" >> "$report_file"
  
  echo "PostgreSQL Maintenance:" >> "$report_file"
  echo "---------------------" >> "$report_file"
  echo "Database: $POSTGRES_DB" >> "$report_file"
  echo "Host: $POSTGRES_HOST:$POSTGRES_PORT" >> "$report_file"
  echo "Operations Performed:" >> "$report_file"
  echo "- VACUUM ANALYZE" >> "$report_file"
  echo "- REINDEX DATABASE" >> "$report_file"
  echo "- Bloated Tables Check and Repair" >> "$report_file"
  echo "- Unused Indexes Check" >> "$report_file"
  echo "- Statistics Update" >> "$report_file"
  echo "- Data Retention Policy Enforcement" >> "$report_file"
  echo "" >> "$report_file"
  
  echo "MongoDB Maintenance:" >> "$report_file"
  echo "-------------------" >> "$report_file"
  echo "Database: $MONGO_DB" >> "$report_file"
  echo "Operations Performed:" >> "$report_file"
  echo "- Collection Validation and Repair" >> "$report_file"
  echo "- Collection Compaction" >> "$report_file"
  echo "- Index Rebuilding" >> "$report_file"
  echo "- Data Retention Policy Enforcement" >> "$report_file"
  echo "Space Saved: $SPACE_SAVED_MB MB ($SPACE_SAVED_PERCENT%)" >> "$report_file"
  echo "" >> "$report_file"
  
  echo "Data Retention Policies Applied:" >> "$report_file"
  echo "-----------------------------" >> "$report_file"
  echo "- Audit Logs: $RETENTION_DAYS_AUDIT_LOGS days" >> "$report_file"
  echo "- Page Views: $RETENTION_DAYS_PAGE_VIEWS days" >> "$report_file"
  echo "- Job Views: $RETENTION_DAYS_JOB_VIEWS days" >> "$report_file"
  echo "- User Searches: $RETENTION_DAYS_USER_SEARCHES days" >> "$report_file"
  echo "- Chat Conversations: $RETENTION_DAYS_CHAT_CONVERSATIONS days" >> "$report_file"
  echo "- Analytics Events: $RETENTION_DAYS_MONITORING_LOGS days" >> "$report_file"
  echo "" >> "$report_file"
  
  echo "Maintenance Log: $MAINTENANCE_LOG" >> "$report_file"
  
  log "INFO" "Maintenance report generated: $report_file"
  
  # Send report via email
  if [ -n "$ALERT_EMAIL" ]; then
    cat "$report_file" | mail -s "Database Maintenance Report - $(date +"%Y-%m-%d")" "$ALERT_EMAIL"
    log "INFO" "Maintenance report sent via email"
  fi
  
  return 0
}

# Main execution
main() {
  log "INFO" "Starting database maintenance process"
  
  # Record start time
  start_time=$(date +%s)
  
  # Run PostgreSQL maintenance
  postgres_maintenance
  
  # Run MongoDB maintenance
  mongo_maintenance
  
  # Generate maintenance report
  generate_report
  
  # Record end time and calculate duration
  end_time=$(date +%s)
  duration=$((end_time - start_time))
  
  log "INFO" "Database maintenance process completed in $duration seconds"
  
  # Send completion notification
  send_notification "Database Maintenance Completed" "Database maintenance tasks have been completed successfully.\n\nDuration: $duration seconds\nReport: $LOG_DIR/maintenance_report_${TIMESTAMP}.txt" "success"
}

# Run main function
main

exit 0