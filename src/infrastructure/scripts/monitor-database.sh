#!/bin/bash
# Database Monitoring Script for Excel Medical Staffing Platform
# This script monitors PostgreSQL and MongoDB performance metrics

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
LOG_DIR="${LOG_ROOT_DIR:-/var/log/excel-medical}"
METRICS_DIR="${METRICS_DIR:-/var/metrics/excel-medical}"
ALERT_THRESHOLD_CPU=80  # CPU usage percentage threshold for alerts
ALERT_THRESHOLD_MEM=80  # Memory usage percentage threshold for alerts
ALERT_THRESHOLD_DISK=85 # Disk usage percentage threshold for alerts
ALERT_EMAIL="${ALERT_EMAIL:-admin@excelmedicalstaffing.com}"
RETENTION_DAYS=${METRICS_RETENTION_DAYS:-30}

# Create directories if they don't exist
mkdir -p "$LOG_DIR"
mkdir -p "$METRICS_DIR"

# Log file
LOG_FILE="$LOG_DIR/db_monitor_${TIMESTAMP}.log"
METRICS_FILE="$METRICS_DIR/db_metrics_${TIMESTAMP}.json"

# Function to log messages
log() {
  echo "[$(date +"%Y-%m-%d %H:%M:%S")] $1" | tee -a "$LOG_FILE"
}

log "Starting database monitoring"

# Function to send alerts
send_alert() {
  local subject="$1"
  local message="$2"
  
  echo "$message" | mail -s "$subject" "$ALERT_EMAIL"
  log "Alert sent: $subject"
}

# Monitor PostgreSQL
monitor_postgres() {
  log "Monitoring PostgreSQL..."
  
  # Set PostgreSQL environment variables
  export PGHOST="${POSTGRES_HOST:-localhost}"
  export PGPORT="${POSTGRES_PORT:-5432}"
  export PGUSER="${POSTGRES_USER:-postgres}"
  export PGPASSWORD="$POSTGRES_PASSWORD"
  export PGDATABASE="${POSTGRES_DB:-excel_medical}"
  
  # Check PostgreSQL connection
  if ! pg_isready -h "$PGHOST" -p "$PGPORT" -U "$PGUSER"; then
    log "ERROR: Cannot connect to PostgreSQL"
    send_alert "PostgreSQL Connection Failure" "Cannot connect to PostgreSQL database at $PGHOST:$PGPORT"
    return 1
  fi
  
  # Get PostgreSQL version
  PG_VERSION=$(psql -t -c "SELECT version();" | tr -d ' ')
  log "PostgreSQL version: $PG_VERSION"
  
  # Get PostgreSQL metrics
  log "Collecting PostgreSQL metrics..."
  
  # Database size
  DB_SIZE=$(psql -t -c "SELECT pg_size_pretty(pg_database_size('$PGDATABASE'));" | tr -d ' ')
  log "Database size: $DB_SIZE"
  
  # Connection count
  CONN_COUNT=$(psql -t -c "SELECT count(*) FROM pg_stat_activity;" | tr -d ' ')
  log "Active connections: $CONN_COUNT"
  
  # Table counts
  TABLE_COUNT=$(psql -t -c "SELECT count(*) FROM information_schema.tables WHERE table_schema='public';" | tr -d ' ')
  log "Table count: $TABLE_COUNT"
  
  # Slow queries
  SLOW_QUERIES=$(psql -t -c "SELECT count(*) FROM pg_stat_activity WHERE state='active' AND (now() - query_start) > interval '30 seconds';" | tr -d ' ')
  log "Slow queries (>30s): $SLOW_QUERIES"
  
  # Cache hit ratio
  CACHE_HIT_RATIO=$(psql -t -c "SELECT round(sum(heap_blks_hit) * 100 / (sum(heap_blks_hit) + sum(heap_blks_read)), 2) FROM pg_statio_user_tables;" | tr -d ' ')
  log "Cache hit ratio: $CACHE_HIT_RATIO%"
  
  # Index usage
  INDEX_USAGE=$(psql -t -c "SELECT round(sum(idx_scan) * 100 / (sum(idx_scan) + sum(seq_scan)), 2) FROM pg_stat_user_tables WHERE (idx_scan + seq_scan) > 0;" | tr -d ' ')
  log "Index usage: $INDEX_USAGE%"
  
  # Check for bloat
  TABLE_BLOAT=$(psql -t -c "SELECT count(*) FROM pg_stat_user_tables WHERE n_dead_tup > 10000;" | tr -d ' ')
  log "Tables with significant bloat: $TABLE_BLOAT"
  
  # Save PostgreSQL metrics to JSON
  cat >> "$METRICS_FILE" << EOF
{
  "timestamp": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")",
  "postgresql": {
    "version": "$PG_VERSION",
    "database_size": "$DB_SIZE",
    "active_connections": $CONN_COUNT,
    "table_count": $TABLE_COUNT,
    "slow_queries": $SLOW_QUERIES,
    "cache_hit_ratio": $CACHE_HIT_RATIO,
    "index_usage": $INDEX_USAGE,
    "tables_with_bloat": $TABLE_BLOAT
  },
EOF
  
  # Check for issues and send alerts
  if [ "$SLOW_QUERIES" -gt 5 ]; then
    send_alert "PostgreSQL Slow Queries Alert" "There are $SLOW_QUERIES queries running for more than 30 seconds."
  fi
  
  if (( $(echo "$CACHE_HIT_RATIO < 90" | bc -l) )); then
    send_alert "PostgreSQL Cache Hit Ratio Alert" "Cache hit ratio is below 90%: $CACHE_HIT_RATIO%"
  fi
  
  if [ "$TABLE_BLOAT" -gt 5 ]; then
    send_alert "PostgreSQL Table Bloat Alert" "There are $TABLE_BLOAT tables with significant bloat."
  fi
  
  log "PostgreSQL monitoring completed"
}

# Monitor MongoDB
monitor_mongo() {
  log "Monitoring MongoDB..."
  
  # Check if MONGO_URI is set
  if [ -z "$MONGO_URI" ]; then
    log "Error: MONGO_URI environment variable not set"
    return 1
  fi
  
  # Check MongoDB connection
  if ! mongosh --quiet --eval "db.adminCommand('ping')" "$MONGO_URI"; then
    log "ERROR: Cannot connect to MongoDB"
    send_alert "MongoDB Connection Failure" "Cannot connect to MongoDB database"
    return 1
  fi
  
  # Get MongoDB version
  MONGO_VERSION=$(mongosh --quiet --eval "db.version()" "$MONGO_URI")
  log "MongoDB version: $MONGO_VERSION"
  
  # Get MongoDB metrics
  log "Collecting MongoDB metrics..."
  
  # Server status
  SERVER_STATUS=$(mongosh --quiet --eval "JSON.stringify(db.serverStatus())" "$MONGO_URI")
  
  # Extract key metrics
  CONNECTIONS=$(echo "$SERVER_STATUS" | jq -r '.connections.current')
  log "Active connections: $CONNECTIONS"
  
  OPERATIONS=$(echo "$SERVER_STATUS" | jq -r '.opcounters')
  log "Operations: $OPERATIONS"
  
  # Database stats
  DB_STATS=$(mongosh --quiet --eval "JSON.stringify(db.stats())" "$MONGO_URI")
  DB_SIZE=$(echo "$DB_STATS" | jq -r '.dataSize')
  DB_SIZE_MB=$(echo "scale=2; $DB_SIZE / 1024 / 1024" | bc)
  log "Database size: $DB_SIZE_MB MB"
  
  COLLECTIONS=$(echo "$DB_STATS" | jq -r '.collections')
  log "Collections: $COLLECTIONS"
  
  # Check for slow operations
  SLOW_OPS=$(mongosh --quiet --eval "db.currentOp().inprog.filter(op => op.secs_running > 30).length" "$MONGO_URI")
  log "Slow operations (>30s): $SLOW_OPS"
  
  # Save MongoDB metrics to JSON
  cat >> "$METRICS_FILE" << EOF
  "mongodb": {
    "version": "$MONGO_VERSION",
    "active_connections": $CONNECTIONS,
    "database_size_mb": $DB_SIZE_MB,
    "collections": $COLLECTIONS,
    "slow_operations": $SLOW_OPS,
    "operations": $OPERATIONS
  },
EOF
  
  # Check for issues and send alerts
  if [ "$SLOW_OPS" -gt 5 ]; then
    send_alert "MongoDB Slow Operations Alert" "There are $SLOW_OPS operations running for more than 30 seconds."
  fi
  
  if [ "$CONNECTIONS" -gt 100 ]; then
    send_alert "MongoDB Connections Alert" "There are $CONNECTIONS active connections."
  fi
  
  log "MongoDB monitoring completed"
}

# Monitor system resources
monitor_system() {
  log "Monitoring system resources..."
  
  # CPU usage
  CPU_USAGE=$(top -bn1 | grep "Cpu(s)" | awk '{print $2 + $4}')
  log "CPU usage: $CPU_USAGE%"
  
  # Memory usage
  MEM_TOTAL=$(free -m | awk '/Mem:/ {print $2}')
  MEM_USED=$(free -m | awk '/Mem:/ {print $3}')
  MEM_USAGE=$(echo "scale=2; $MEM_USED * 100 / $MEM_TOTAL" | bc)
  log "Memory usage: $MEM_USAGE% ($MEM_USED MB / $MEM_TOTAL MB)"
  
  # Disk usage
  DISK_USAGE=$(df -h | grep '/dev/sda1' | awk '{print $5}' | tr -d '%')
  log "Disk usage: $DISK_USAGE%"
  
  # Save system metrics to JSON
  cat >> "$METRICS_FILE" << EOF
  "system": {
    "cpu_usage": $CPU_USAGE,
    "memory_usage_percent": $MEM_USAGE,
    "memory_used_mb": $MEM_USED,
    "memory_total_mb": $MEM_TOTAL,
    "disk_usage_percent": $DISK_USAGE
  }
}
EOF
  
  # Check for issues and send alerts
  if (( $(echo "$CPU_USAGE > $ALERT_THRESHOLD_CPU" | bc -l) )); then
    send_alert "High CPU Usage Alert" "CPU usage is at $CPU_USAGE%, which exceeds the threshold of $ALERT_THRESHOLD_CPU%."
  fi
  
  if (( $(echo "$MEM_USAGE > $ALERT_THRESHOLD_MEM" | bc -l) )); then
    send_alert "High Memory Usage Alert" "Memory usage is at $MEM_USAGE%, which exceeds the threshold of $ALERT_THRESHOLD_MEM%."
  fi
  
  if [ "$DISK_USAGE" -gt "$ALERT_THRESHOLD_DISK" ]; then
    send_alert "High Disk Usage Alert" "Disk usage is at $DISK_USAGE%, which exceeds the threshold of $ALERT_THRESHOLD_DISK%."
  fi
  
  log "System monitoring completed"
}

# Clean up old log and metrics files
cleanup_old_files() {
  log "Cleaning up files older than $RETENTION_DAYS days..."
  
  find "$LOG_DIR" -name "db_monitor_*.log" -type f -mtime +$RETENTION_DAYS -delete
  find "$METRICS_DIR" -name "db_metrics_*.json" -type f -mtime +$RETENTION_DAYS -delete
  
  log "Cleanup completed"
}

# Main execution
main() {
  # Monitor PostgreSQL
  monitor_postgres
  
  # Monitor MongoDB
  monitor_mongo
  
  # Monitor system resources
  monitor_system
  
  # Clean up old files
  cleanup_old_files
  
  log "Monitoring completed successfully"
}

# Run main function
main

exit 0