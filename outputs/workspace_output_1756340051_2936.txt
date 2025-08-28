#!/bin/bash
# Database Monitoring Script for Excel Medical Staffing Platform
# This script monitors PostgreSQL and MongoDB database performance and health

# Configuration
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
LOG_DIR="/var/log/excel-medical/db-monitoring"
POSTGRES_DB="excel_medical"
POSTGRES_USER="postgres"
MONGO_DB="excel_medical"
ALERT_EMAIL="admin@excelmedicalstaffing.com"
SLACK_WEBHOOK_URL="https://hooks.slack.com/services/TXXXXXXXX/BXXXXXXXX/XXXXXXXXXXXXXXXXXXXXXXXX"

# Create log directory if it doesn't exist
mkdir -p $LOG_DIR

# Log file
LOG_FILE="$LOG_DIR/db_monitor_$TIMESTAMP.log"

# Function to log messages
log() {
  echo "[$(date +"%Y-%m-%d %H:%M:%S")] $1" | tee -a $LOG_FILE
}

# Function to send alerts
send_alert() {
  local subject="$1"
  local message="$2"
  local severity="$3" # critical, warning, info
  
  # Send email alert
  echo -e "$message" | mail -s "[${severity^^}] $subject" "$ALERT_EMAIL"
  
  # Send Slack alert
  local color
  case $severity in
    critical) color="#FF0000" ;; # Red
    warning) color="#FFA500" ;; # Orange
    info) color="#0000FF" ;; # Blue
    *) color="#808080" ;; # Gray
  esac
  
  curl -s -X POST -H 'Content-type: application/json' \
    --data "{&quot;text&quot;:&quot;*[$severity] $subject*\n$message&quot;, &quot;color&quot;:&quot;$color&quot;}" \
    $SLACK_WEBHOOK_URL
}

log "Starting database monitoring"

# PostgreSQL Monitoring
log "Monitoring PostgreSQL database"

# Check PostgreSQL connection
if ! pg_isready -d $POSTGRES_DB -U $POSTGRES_USER; then
  log "ERROR: PostgreSQL database is not available"
  send_alert "PostgreSQL Connection Failure" "PostgreSQL database $POSTGRES_DB is not available" "critical"
else
  log "PostgreSQL connection successful"
  
  # Check PostgreSQL statistics
  log "Collecting PostgreSQL statistics"
  
  # Database size
  DB_SIZE=$(psql -U $POSTGRES_USER -d $POSTGRES_DB -t -c "SELECT pg_size_pretty(pg_database_size('$POSTGRES_DB'));")
  log "PostgreSQL database size: $DB_SIZE"
  
  # Connection count
  CONN_COUNT=$(psql -U $POSTGRES_USER -d $POSTGRES_DB -t -c "SELECT count(*) FROM pg_stat_activity WHERE datname = '$POSTGRES_DB';")
  log "PostgreSQL active connections: $CONN_COUNT"
  
  # Check if connection count is too high (adjust threshold as needed)
  if [ $CONN_COUNT -gt 100 ]; then
    send_alert "High PostgreSQL Connection Count" "PostgreSQL database has $CONN_COUNT active connections" "warning"
  fi
  
  # Long-running queries
  LONG_QUERIES=$(psql -U $POSTGRES_USER -d $POSTGRES_DB -t -c "
    SELECT pid, now() - query_start as duration, query 
    FROM pg_stat_activity 
    WHERE state = 'active' AND now() - query_start > '30 seconds'::interval 
    ORDER BY duration DESC;
  ")
  
  if [ -n "$LONG_QUERIES" ]; then
    log "WARNING: Long-running PostgreSQL queries detected:"
    log "$LONG_QUERIES"
    send_alert "Long-running PostgreSQL Queries" "The following queries have been running for more than 30 seconds:\n\n$LONG_QUERIES" "warning"
  else
    log "No long-running PostgreSQL queries detected"
  fi
  
  # Table bloat check
  TABLE_BLOAT=$(psql -U $POSTGRES_USER -d $POSTGRES_DB -t -c "
    SELECT schemaname, tablename, pg_size_pretty(bloat_size) as bloat_size,
           round(bloat_ratio::numeric, 2) as bloat_ratio
    FROM (
      SELECT schemaname, tablename,
             pg_table_size(schemaname || '.' || tablename) as table_size,
             (pg_table_size(schemaname || '.' || tablename) - 
              pg_relation_size(schemaname || '.' || tablename)) as bloat_size,
             100 * (pg_table_size(schemaname || '.' || tablename) - 
                    pg_relation_size(schemaname || '.' || tablename)) / 
                   greatest(pg_table_size(schemaname || '.' || tablename), 1) as bloat_ratio
      FROM pg_tables
      WHERE schemaname NOT IN ('pg_catalog', 'information_schema')
    ) t
    WHERE bloat_ratio > 50
    ORDER BY bloat_ratio DESC
    LIMIT 10;
  ")
  
  if [ -n "$TABLE_BLOAT" ]; then
    log "WARNING: Tables with high bloat detected:"
    log "$TABLE_BLOAT"
    send_alert "PostgreSQL Table Bloat" "The following tables have high bloat ratio:\n\n$TABLE_BLOAT" "warning"
  else
    log "No tables with high bloat detected"
  fi
  
  # Index usage check
  UNUSED_INDEXES=$(psql -U $POSTGRES_USER -d $POSTGRES_DB -t -c "
    SELECT schemaname, relname as table_name, indexrelname as index_name,
           pg_size_pretty(pg_relation_size(i.indexrelid)) as index_size
    FROM pg_stat_user_indexes ui
    JOIN pg_index i ON ui.indexrelid = i.indexrelid
    WHERE NOT indisunique AND idx_scan = 0
    ORDER BY pg_relation_size(i.indexrelid) DESC
    LIMIT 10;
  ")
  
  if [ -n "$UNUSED_INDEXES" ]; then
    log "WARNING: Unused indexes detected:"
    log "$UNUSED_INDEXES"
    send_alert "PostgreSQL Unused Indexes" "The following indexes are not being used:\n\n$UNUSED_INDEXES" "info"
  else
    log "No unused indexes detected"
  fi
fi

# MongoDB Monitoring
log "Monitoring MongoDB database"

# Check MongoDB connection
if ! mongosh --quiet --eval "db.adminCommand('ping')" > /dev/null; then
  log "ERROR: MongoDB database is not available"
  send_alert "MongoDB Connection Failure" "MongoDB database is not available" "critical"
else
  log "MongoDB connection successful"
  
  # Check MongoDB statistics
  log "Collecting MongoDB statistics"
  
  # Database stats
  DB_STATS=$(mongosh --quiet --eval "JSON.stringify(db.getSiblingDB('$MONGO_DB').stats())")
  DB_SIZE=$(echo $DB_STATS | jq -r '.dataSize / 1024 / 1024 | floor | tostring + " MB"')
  STORAGE_SIZE=$(echo $DB_STATS | jq -r '.storageSize / 1024 / 1024 | floor | tostring + " MB"')
  
  log "MongoDB database size: $DB_SIZE"
  log "MongoDB storage size: $STORAGE_SIZE"
  
  # Connection count
  CONN_COUNT=$(mongosh --quiet --eval "db.serverStatus().connections.current")
  log "MongoDB active connections: $CONN_COUNT"
  
  # Check if connection count is too high (adjust threshold as needed)
  if [ $CONN_COUNT -gt 100 ]; then
    send_alert "High MongoDB Connection Count" "MongoDB database has $CONN_COUNT active connections" "warning"
  fi
  
  # Long-running operations
  LONG_OPS=$(mongosh --quiet --eval "JSON.stringify(db.currentOp({'secs_running': {\$gt: 30}, 'ns': {\$ne: ''}}))")
  
  if [ "$LONG_OPS" != "{}" ] && [ "$LONG_OPS" != "[]" ]; then
    log "WARNING: Long-running MongoDB operations detected:"
    log "$LONG_OPS"
    send_alert "Long-running MongoDB Operations" "The following operations have been running for more than 30 seconds:\n\n$LONG_OPS" "warning"
  else
    log "No long-running MongoDB operations detected"
  fi
  
  # Collection stats
  COLLECTIONS=$(mongosh --quiet --eval "JSON.stringify(db.getSiblingDB('$MONGO_DB').getCollectionNames())")
  
  for COLLECTION in $(echo $COLLECTIONS | jq -r '.[]'); do
    COLL_STATS=$(mongosh --quiet --eval "JSON.stringify(db.getSiblingDB('$MONGO_DB').$COLLECTION.stats())")
    COLL_SIZE=$(echo $COLL_STATS | jq -r '.size / 1024 / 1024 | floor | tostring + " MB"')
    COLL_COUNT=$(echo $COLL_STATS | jq -r '.count')
    
    log "Collection $COLLECTION: $COLL_COUNT documents, $COLL_SIZE"
    
    # Check if collection is very large (adjust threshold as needed)
    if [ $(echo $COLL_STATS | jq -r '.size / 1024 / 1024 | floor') -gt 1000 ]; then
      send_alert "Large MongoDB Collection" "Collection $COLLECTION is very large: $COLL_SIZE with $COLL_COUNT documents" "info"
    fi
  done
  
  # Index stats
  for COLLECTION in $(echo $COLLECTIONS | jq -r '.[]'); do
    INDEX_STATS=$(mongosh --quiet --eval "JSON.stringify(db.getSiblingDB('$MONGO_DB').$COLLECTION.getIndexes())")
    INDEX_COUNT=$(echo $INDEX_STATS | jq -r 'length')
    
    log "Collection $COLLECTION has $INDEX_COUNT indexes"
    
    # Check if collection has too many indexes (adjust threshold as needed)
    if [ $INDEX_COUNT -gt 10 ]; then
      send_alert "Many MongoDB Indexes" "Collection $COLLECTION has $INDEX_COUNT indexes" "info"
    fi
  done
fi

# System resource monitoring for database servers
log "Monitoring system resources"

# CPU usage
CPU_USAGE=$(top -bn1 | grep "Cpu(s)" | sed "s/.*, *\([0-9.]*\)%* id.*/\1/" | awk '{print 100 - $1"%"}')
log "CPU usage: $CPU_USAGE"

# Memory usage
MEM_USAGE=$(free -m | awk 'NR==2{printf "%.2f%%", $3*100/$2}')
log "Memory usage: $MEM_USAGE"

# Disk usage
DISK_USAGE=$(df -h | grep '/dev/sda1' | awk '{print $5}')
log "Disk usage: $DISK_USAGE"

# Check if resources are running low
DISK_USAGE_NUM=$(echo $DISK_USAGE | sed 's/%//')
if [ $DISK_USAGE_NUM -gt 85 ]; then
  send_alert "High Disk Usage" "Disk usage is at $DISK_USAGE" "warning"
fi

MEM_USAGE_NUM=$(echo $MEM_USAGE | sed 's/%//')
if [ $(echo "$MEM_USAGE_NUM > 90" | bc) -eq 1 ]; then
  send_alert "High Memory Usage" "Memory usage is at $MEM_USAGE" "warning"
fi

CPU_USAGE_NUM=$(echo $CPU_USAGE | sed 's/%//')
if [ $(echo "$CPU_USAGE_NUM > 90" | bc) -eq 1 ]; then
  send_alert "High CPU Usage" "CPU usage is at $CPU_USAGE" "warning"
fi

log "Database monitoring completed"

# Generate summary report
SUMMARY="Database Monitoring Summary - $(date +"%Y-%m-%d %H:%M:%S")

PostgreSQL:
- Database Size: $DB_SIZE
- Active Connections: $CONN_COUNT

MongoDB:
- Database Size: $DB_SIZE
- Storage Size: $STORAGE_SIZE
- Active Connections: $CONN_COUNT

System Resources:
- CPU Usage: $CPU_USAGE
- Memory Usage: $MEM_USAGE
- Disk Usage: $DISK_USAGE
"

log "$SUMMARY"

# Save summary to a separate file
echo "$SUMMARY" > "$LOG_DIR/db_monitor_summary_$TIMESTAMP.txt"

exit 0