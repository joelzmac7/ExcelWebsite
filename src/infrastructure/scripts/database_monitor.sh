#!/bin/bash
# Comprehensive Database Monitoring Script for Excel Medical Staffing Platform
# This script monitors PostgreSQL and MongoDB database performance and health with alerting

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
LOG_DIR="${LOG_ROOT_DIR:-/var/log/excel-medical}/monitoring"
LOG_FILE="$LOG_DIR/db_monitor_${TIMESTAMP}.log"
METRICS_DIR="$LOG_DIR/metrics"
ALERT_EMAIL="${ALERT_EMAIL:-admin@excelmedicalstaffing.com}"
SLACK_WEBHOOK_URL="${SLACK_WEBHOOK_URL:-}"
POSTGRES_DB="${POSTGRES_DB:-excel_medical}"
POSTGRES_USER="${POSTGRES_USER:-postgres}"
POSTGRES_HOST="${POSTGRES_HOST:-localhost}"
POSTGRES_PORT="${POSTGRES_PORT:-5432}"
MONGO_URI="${MONGO_URI:-mongodb://localhost:27017/excel_medical}"
MONGO_DB="${MONGO_DB:-excel_medical}"

# Alert thresholds
PG_MAX_CONNECTIONS=100
PG_LONG_QUERY_SECONDS=30
PG_BLOAT_THRESHOLD=50
PG_IDLE_TRANSACTION_MINUTES=10
MONGO_MAX_CONNECTIONS=100
MONGO_LONG_OP_SECONDS=30
CPU_THRESHOLD=85
MEMORY_THRESHOLD=85
DISK_THRESHOLD=80

# Create log directories
mkdir -p "$LOG_DIR"
mkdir -p "$METRICS_DIR"
touch "$LOG_FILE"

# Function to log messages
log() {
  local level="$1"
  local message="$2"
  local timestamp=$(date +"%Y-%m-%d %H:%M:%S")
  echo "[$timestamp] [$level] $message" | tee -a "$LOG_FILE"
}

# Function to send alerts
send_alert() {
  local subject="$1"
  local message="$2"
  local severity="$3" # critical, warning, info
  
  # Send email alert
  if [ -n "$ALERT_EMAIL" ]; then
    echo -e "$message" | mail -s "[$severity] $subject" "$ALERT_EMAIL"
    log "INFO" "Email alert sent to $ALERT_EMAIL: $subject ($severity)"
  fi
  
  # Send Slack alert
  if [ -n "$SLACK_WEBHOOK_URL" ]; then
    local color
    case $severity in
      critical) color="#FF0000" ;; # Red
      warning) color="#FFA500" ;; # Orange
      info) color="#0000FF" ;; # Blue
      success) color="#36a64f" ;; # Green
      *) color="#808080" ;; # Gray
    esac
    
    curl -s -X POST -H 'Content-type: application/json' \
      --data "{&quot;attachments&quot;:[{&quot;color&quot;:&quot;$color&quot;,&quot;title&quot;:&quot;$subject&quot;,&quot;text&quot;:&quot;$message&quot;}]}" \
      "$SLACK_WEBHOOK_URL"
    log "INFO" "Slack alert sent: $subject ($severity)"
  fi
}

# Function to save metric to file
save_metric() {
  local metric_name="$1"
  local metric_value="$2"
  local timestamp=$(date +"%Y-%m-%d %H:%M:%S")
  
  echo "$timestamp,$metric_value" >> "$METRICS_DIR/${metric_name}.csv"
}

# Function to check if metric exceeds threshold
check_threshold() {
  local metric_name="$1"
  local current_value="$2"
  local threshold="$3"
  local comparison="$4" # gt (greater than) or lt (less than)
  local alert_subject="$5"
  local alert_message="$6"
  local severity="$7"
  
  local exceeded=false
  
  if [ "$comparison" = "gt" ] && [ $(echo "$current_value > $threshold" | bc -l) -eq 1 ]; then
    exceeded=true
  elif [ "$comparison" = "lt" ] && [ $(echo "$current_value < $threshold" | bc -l) -eq 1 ]; then
    exceeded=true
  fi
  
  if [ "$exceeded" = true ]; then
    log "WARNING" "$metric_name exceeds threshold: $current_value (threshold: $threshold)"
    send_alert "$alert_subject" "$alert_message" "$severity"
    return 0
  fi
  
  return 1
}

log "INFO" "Starting database monitoring"

# PostgreSQL Monitoring
monitor_postgres() {
  log "INFO" "Monitoring PostgreSQL database"
  
  # Set PostgreSQL environment variables
  export PGHOST="$POSTGRES_HOST"
  export PGPORT="$POSTGRES_PORT"
  export PGUSER="$POSTGRES_USER"
  export PGPASSWORD="$POSTGRES_PASSWORD"
  export PGDATABASE="$POSTGRES_DB"
  
  # Check PostgreSQL connection
  if ! pg_isready -h "$PGHOST" -p "$PGPORT" -U "$PGUSER"; then
    log "ERROR" "PostgreSQL database is not available"
    send_alert "PostgreSQL Connection Failure" "PostgreSQL database $POSTGRES_DB is not available at $PGHOST:$PGPORT" "critical"
    return 1
  fi
  
  log "INFO" "PostgreSQL connection successful"
  
  # Check PostgreSQL statistics
  log "INFO" "Collecting PostgreSQL statistics"
  
  # Database size
  DB_SIZE=$(psql -t -c "SELECT pg_size_pretty(pg_database_size('$POSTGRES_DB'));" | xargs)
  DB_SIZE_BYTES=$(psql -t -c "SELECT pg_database_size('$POSTGRES_DB');" | xargs)
  log "INFO" "PostgreSQL database size: $DB_SIZE"
  save_metric "postgres_db_size" "$DB_SIZE_BYTES"
  
  # Connection count
  CONN_COUNT=$(psql -t -c "SELECT count(*) FROM pg_stat_activity WHERE datname = '$POSTGRES_DB';" | xargs)
  log "INFO" "PostgreSQL active connections: $CONN_COUNT"
  save_metric "postgres_connections" "$CONN_COUNT"
  
  # Check if connection count is too high
  check_threshold "postgres_connections" "$CONN_COUNT" "$PG_MAX_CONNECTIONS" "gt" \
    "High PostgreSQL Connection Count" \
    "PostgreSQL database has $CONN_COUNT active connections (threshold: $PG_MAX_CONNECTIONS)" \
    "warning"
  
  # Long-running queries
  LONG_QUERIES=$(psql -t -c "
    SELECT pid, now() - query_start as duration, query 
    FROM pg_stat_activity 
    WHERE state = 'active' AND now() - query_start > '$PG_LONG_QUERY_SECONDS seconds'::interval 
    ORDER BY duration DESC;
  ")
  
  if [ -n "$LONG_QUERIES" ]; then
    log "WARNING" "Long-running PostgreSQL queries detected:"
    log "INFO" "$LONG_QUERIES"
    send_alert "Long-running PostgreSQL Queries" "The following queries have been running for more than $PG_LONG_QUERY_SECONDS seconds:\n\n$LONG_QUERIES" "warning"
  else
    log "INFO" "No long-running PostgreSQL queries detected"
  fi
  
  # Idle transactions
  IDLE_TRANSACTIONS=$(psql -t -c "
    SELECT pid, now() - state_change as idle_duration, query
    FROM pg_stat_activity
    WHERE state = 'idle in transaction' AND now() - state_change > '$PG_IDLE_TRANSACTION_MINUTES minutes'::interval
    ORDER BY idle_duration DESC;
  ")
  
  if [ -n "$IDLE_TRANSACTIONS" ]; then
    log "WARNING" "Idle transactions detected:"
    log "INFO" "$IDLE_TRANSACTIONS"
    send_alert "PostgreSQL Idle Transactions" "The following transactions have been idle for more than $PG_IDLE_TRANSACTION_MINUTES minutes:\n\n$IDLE_TRANSACTIONS" "warning"
  else
    log "INFO" "No long-running idle transactions detected"
  fi
  
  # Table bloat check
  TABLE_BLOAT=$(psql -t -c "
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
    WHERE bloat_ratio > $PG_BLOAT_THRESHOLD
    ORDER BY bloat_ratio DESC
    LIMIT 10;
  ")
  
  if [ -n "$TABLE_BLOAT" ]; then
    log "WARNING" "Tables with high bloat detected:"
    log "INFO" "$TABLE_BLOAT"
    send_alert "PostgreSQL Table Bloat" "The following tables have high bloat ratio (>$PG_BLOAT_THRESHOLD%):\n\n$TABLE_BLOAT" "warning"
  else
    log "INFO" "No tables with high bloat detected"
  fi
  
  # Index usage check
  UNUSED_INDEXES=$(psql -t -c "
    SELECT schemaname, relname as table_name, indexrelname as index_name,
           pg_size_pretty(pg_relation_size(i.indexrelid)) as index_size
    FROM pg_stat_user_indexes ui
    JOIN pg_index i ON ui.indexrelid = i.indexrelid
    WHERE NOT indisunique AND idx_scan = 0 AND pg_relation_size(i.indexrelid) > 1048576
    ORDER BY pg_relation_size(i.indexrelid) DESC
    LIMIT 10;
  ")
  
  if [ -n "$UNUSED_INDEXES" ]; then
    log "WARNING" "Unused indexes detected:"
    log "INFO" "$UNUSED_INDEXES"
    send_alert "PostgreSQL Unused Indexes" "The following indexes are not being used but consuming space:\n\n$UNUSED_INDEXES" "info"
  else
    log "INFO" "No significant unused indexes detected"
  fi
  
  # Cache hit ratio
  CACHE_HIT_RATIO=$(psql -t -c "
    SELECT round(sum(heap_blks_hit) * 100 / (sum(heap_blks_hit) + sum(heap_blks_read)), 2)
    FROM pg_statio_user_tables;
  " | xargs)
  
  log "INFO" "PostgreSQL cache hit ratio: $CACHE_HIT_RATIO%"
  save_metric "postgres_cache_hit_ratio" "$CACHE_HIT_RATIO"
  
  # Check if cache hit ratio is too low
  if [ $(echo "$CACHE_HIT_RATIO < 90" | bc -l) -eq 1 ]; then
    send_alert "Low PostgreSQL Cache Hit Ratio" "PostgreSQL cache hit ratio is $CACHE_HIT_RATIO% (should be >90%)" "warning"
  fi
  
  # Transaction wraparound check
  TX_WRAPAROUND=$(psql -t -c "
    SELECT datname, age(datfrozenxid) as xid_age
    FROM pg_database
    WHERE datname = '$POSTGRES_DB';
  " | xargs)
  
  TX_AGE=$(echo "$TX_WRAPAROUND" | awk '{print $2}')
  log "INFO" "PostgreSQL transaction age: $TX_AGE"
  save_metric "postgres_tx_age" "$TX_AGE"
  
  # Check if transaction age is getting high (2 billion is the wraparound point)
  if [ "$TX_AGE" -gt 1000000000 ]; then
    send_alert "High PostgreSQL Transaction Age" "PostgreSQL transaction age is $TX_AGE, approaching wraparound limit" "warning"
  fi
  
  return 0
}

# MongoDB Monitoring
monitor_mongo() {
  log "INFO" "Monitoring MongoDB database"
  
  # Check MongoDB connection
  if ! mongosh --quiet --eval "db.adminCommand('ping')" "$MONGO_URI" > /dev/null; then
    log "ERROR" "MongoDB database is not available"
    send_alert "MongoDB Connection Failure" "MongoDB database is not available at $MONGO_URI" "critical"
    return 1
  fi
  
  log "INFO" "MongoDB connection successful"
  
  # Check MongoDB statistics
  log "INFO" "Collecting MongoDB statistics"
  
  # Database stats
  DB_STATS=$(mongosh --quiet --eval "JSON.stringify(db.getSiblingDB('$MONGO_DB').stats())" "$MONGO_URI")
  DB_SIZE=$(echo $DB_STATS | jq -r '.dataSize')
  DB_SIZE_MB=$(echo "scale=2; $DB_SIZE / 1024 / 1024" | bc)
  STORAGE_SIZE=$(echo $DB_STATS | jq -r '.storageSize')
  STORAGE_SIZE_MB=$(echo "scale=2; $STORAGE_SIZE / 1024 / 1024" | bc)
  
  log "INFO" "MongoDB database size: $DB_SIZE_MB MB"
  log "INFO" "MongoDB storage size: $STORAGE_SIZE_MB MB"
  save_metric "mongo_db_size" "$DB_SIZE"
  save_metric "mongo_storage_size" "$STORAGE_SIZE"
  
  # Connection count
  CONN_COUNT=$(mongosh --quiet --eval "db.serverStatus().connections.current" "$MONGO_URI")
  log "INFO" "MongoDB active connections: $CONN_COUNT"
  save_metric "mongo_connections" "$CONN_COUNT"
  
  # Check if connection count is too high
  check_threshold "mongo_connections" "$CONN_COUNT" "$MONGO_MAX_CONNECTIONS" "gt" \
    "High MongoDB Connection Count" \
    "MongoDB database has $CONN_COUNT active connections (threshold: $MONGO_MAX_CONNECTIONS)" \
    "warning"
  
  # Long-running operations
  LONG_OPS=$(mongosh --quiet --eval "JSON.stringify(db.currentOp({'secs_running': {\$gt: $MONGO_LONG_OP_SECONDS}, 'ns': {\$ne: ''}}))" "$MONGO_URI")
  
  if [ "$LONG_OPS" != "{}" ] && [ "$LONG_OPS" != "[]" ]; then
    log "WARNING" "Long-running MongoDB operations detected:"
    log "INFO" "$LONG_OPS"
    send_alert "Long-running MongoDB Operations" "The following operations have been running for more than $MONGO_LONG_OP_SECONDS seconds:\n\n$LONG_OPS" "warning"
  else
    log "INFO" "No long-running MongoDB operations detected"
  fi
  
  # Collection stats
  COLLECTIONS=$(mongosh --quiet --eval "JSON.stringify(db.getSiblingDB('$MONGO_DB').getCollectionNames())" "$MONGO_URI")
  
  for COLLECTION in $(echo $COLLECTIONS | jq -r '.[]'); do
    COLL_STATS=$(mongosh --quiet --eval "JSON.stringify(db.getSiblingDB('$MONGO_DB').$COLLECTION.stats())" "$MONGO_URI")
    COLL_SIZE=$(echo $COLL_STATS | jq -r '.size')
    COLL_SIZE_MB=$(echo "scale=2; $COLL_SIZE / 1024 / 1024" | bc)
    COLL_COUNT=$(echo $COLL_STATS | jq -r '.count')
    
    log "INFO" "Collection $COLLECTION: $COLL_COUNT documents, $COLL_SIZE_MB MB"
    save_metric "mongo_collection_${COLLECTION}_size" "$COLL_SIZE"
    save_metric "mongo_collection_${COLLECTION}_count" "$COLL_COUNT"
    
    # Check if collection is very large
    if [ $(echo "$COLL_SIZE_MB > 1000" | bc -l) -eq 1 ]; then
      send_alert "Large MongoDB Collection" "Collection $COLLECTION is very large: $COLL_SIZE_MB MB with $COLL_COUNT documents" "info"
    fi
  done
  
  # Index stats
  for COLLECTION in $(echo $COLLECTIONS | jq -r '.[]'); do
    INDEX_STATS=$(mongosh --quiet --eval "JSON.stringify(db.getSiblingDB('$MONGO_DB').$COLLECTION.getIndexes())" "$MONGO_URI")
    INDEX_COUNT=$(echo $INDEX_STATS | jq -r 'length')
    
    log "INFO" "Collection $COLLECTION has $INDEX_COUNT indexes"
    save_metric "mongo_collection_${COLLECTION}_indexes" "$INDEX_COUNT"
    
    # Check if collection has too many indexes
    if [ $INDEX_COUNT -gt 10 ]; then
      send_alert "Many MongoDB Indexes" "Collection $COLLECTION has $INDEX_COUNT indexes" "info"
    fi
  done
  
  # Replica set status (if applicable)
  RS_STATUS=$(mongosh --quiet --eval "try { JSON.stringify(rs.status()) } catch(e) { 'not_replica_set' }" "$MONGO_URI")
  
  if [ "$RS_STATUS" != "not_replica_set" ]; then
    RS_STATE=$(echo $RS_STATUS | jq -r '.myState')
    log "INFO" "MongoDB replica set state: $RS_STATE"
    save_metric "mongo_replica_state" "$RS_STATE"
    
    # Check if this node is not primary (1 = primary)
    if [ "$RS_STATE" != "1" ]; then
      send_alert "MongoDB Replica Set Status" "This MongoDB node is not in PRIMARY state (current state: $RS_STATE)" "info"
    fi
  fi
  
  return 0
}

# System resource monitoring
monitor_system_resources() {
  log "INFO" "Monitoring system resources"
  
  # CPU usage
  CPU_USAGE=$(top -bn1 | grep "Cpu(s)" | sed "s/.*, *\([0-9.]*\)%* id.*/\1/" | awk '{print 100 - $1}')
  log "INFO" "CPU usage: $CPU_USAGE%"
  save_metric "system_cpu_usage" "$CPU_USAGE"
  
  # Memory usage
  MEM_INFO=$(free -m)
  MEM_TOTAL=$(echo "$MEM_INFO" | awk 'NR==2{print $2}')
  MEM_USED=$(echo "$MEM_INFO" | awk 'NR==2{print $3}')
  MEM_USAGE=$(echo "scale=2; $MEM_USED * 100 / $MEM_TOTAL" | bc)
  log "INFO" "Memory usage: $MEM_USAGE% ($MEM_USED MB / $MEM_TOTAL MB)"
  save_metric "system_memory_usage" "$MEM_USAGE"
  save_metric "system_memory_used" "$MEM_USED"
  save_metric "system_memory_total" "$MEM_TOTAL"
  
  # Disk usage
  DISK_INFO=$(df -h | grep '/dev/sda1')
  DISK_USAGE=$(echo "$DISK_INFO" | awk '{print $5}' | sed 's/%//')
  DISK_USED=$(echo "$DISK_INFO" | awk '{print $3}')
  DISK_TOTAL=$(echo "$DISK_INFO" | awk '{print $2}')
  log "INFO" "Disk usage: $DISK_USAGE% ($DISK_USED / $DISK_TOTAL)"
  save_metric "system_disk_usage" "$DISK_USAGE"
  
  # Check if resources are running low
  check_threshold "system_cpu_usage" "$CPU_USAGE" "$CPU_THRESHOLD" "gt" \
    "High CPU Usage" \
    "CPU usage is at $CPU_USAGE% (threshold: $CPU_THRESHOLD%)" \
    "warning"
  
  check_threshold "system_memory_usage" "$MEM_USAGE" "$MEMORY_THRESHOLD" "gt" \
    "High Memory Usage" \
    "Memory usage is at $MEM_USAGE% (threshold: $MEMORY_THRESHOLD%)" \
    "warning"
  
  check_threshold "system_disk_usage" "$DISK_USAGE" "$DISK_THRESHOLD" "gt" \
    "High Disk Usage" \
    "Disk usage is at $DISK_USAGE% (threshold: $DISK_THRESHOLD%)" \
    "warning"
  
  # Check for system load
  LOAD_AVG=$(cat /proc/loadavg | awk '{print $1,$2,$3}')
  CPU_CORES=$(nproc)
  LOAD_1=$(echo "$LOAD_AVG" | awk '{print $1}')
  LOAD_5=$(echo "$LOAD_AVG" | awk '{print $2}')
  LOAD_15=$(echo "$LOAD_AVG" | awk '{print $3}')
  
  log "INFO" "System load average: $LOAD_AVG (cores: $CPU_CORES)"
  save_metric "system_load_1" "$LOAD_1"
  save_metric "system_load_5" "$LOAD_5"
  save_metric "system_load_15" "$LOAD_15"
  
  # Check if load is too high compared to CPU cores
  if [ $(echo "$LOAD_5 > $CPU_CORES * 1.5" | bc -l) -eq 1 ]; then
    send_alert "High System Load" "System load average (5m) is $LOAD_5 with $CPU_CORES CPU cores" "warning"
  fi
  
  return 0
}

# Generate monitoring report
generate_report() {
  local report_file="$LOG_DIR/monitoring_report_${TIMESTAMP}.txt"
  
  log "INFO" "Generating monitoring report"
  
  echo "Excel Medical Staffing Database Monitoring Report" > "$report_file"
  echo "=================================================" >> "$report_file"
  echo "" >> "$report_file"
  echo "Report Date: $(date)" >> "$report_file"
  echo "" >> "$report_file"
  
  echo "PostgreSQL Database:" >> "$report_file"
  echo "-------------------" >> "$report_file"
  echo "Database: $POSTGRES_DB" >> "$report_file"
  echo "Host: $POSTGRES_HOST:$POSTGRES_PORT" >> "$report_file"
  echo "Size: $DB_SIZE" >> "$report_file"
  echo "Active Connections: $CONN_COUNT" >> "$report_file"
  echo "Cache Hit Ratio: $CACHE_HIT_RATIO%" >> "$report_file"
  echo "Transaction Age: $TX_AGE" >> "$report_file"
  echo "" >> "$report_file"
  
  echo "MongoDB Database:" >> "$report_file"
  echo "----------------" >> "$report_file"
  echo "Database: $MONGO_DB" >> "$report_file"
  echo "Data Size: $DB_SIZE_MB MB" >> "$report_file"
  echo "Storage Size: $STORAGE_SIZE_MB MB" >> "$report_file"
  echo "Active Connections: $CONN_COUNT" >> "$report_file"
  echo "" >> "$report_file"
  
  echo "System Resources:" >> "$report_file"
  echo "----------------" >> "$report_file"
  echo "CPU Usage: $CPU_USAGE%" >> "$report_file"
  echo "Memory Usage: $MEM_USAGE% ($MEM_USED MB / $MEM_TOTAL MB)" >> "$report_file"
  echo "Disk Usage: $DISK_USAGE% ($DISK_USED / $DISK_TOTAL)" >> "$report_file"
  echo "Load Average: $LOAD_AVG (cores: $CPU_CORES)" >> "$report_file"
  echo "" >> "$report_file"
  
  echo "Monitoring Log: $LOG_FILE" >> "$report_file"
  
  log "INFO" "Monitoring report generated: $report_file"
  
  # Send report via email
  if [ -n "$ALERT_EMAIL" ]; then
    cat "$report_file" | mail -s "Database Monitoring Report - $(date +"%Y-%m-%d")" "$ALERT_EMAIL"
    log "INFO" "Monitoring report sent via email"
  fi
  
  return 0
}

# Main execution
main() {
  log "INFO" "Starting database monitoring process"
  
  # Record start time
  start_time=$(date +%s)
  
  # Monitor PostgreSQL
  monitor_postgres
  
  # Monitor MongoDB
  monitor_mongo
  
  # Monitor system resources
  monitor_system_resources
  
  # Generate monitoring report
  generate_report
  
  # Record end time and calculate duration
  end_time=$(date +%s)
  duration=$((end_time - start_time))
  
  # Log completion
  log "INFO" "Monitoring process completed in $duration seconds"
  
  # Send success notification
  send_alert "Database Monitoring Completed" "Database monitoring completed successfully.\n\nDuration: $duration seconds\nReport: $LOG_DIR/monitoring_report_${TIMESTAMP}.txt" "success"
}

# Run main function
main

exit 0