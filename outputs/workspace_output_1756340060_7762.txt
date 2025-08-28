#!/bin/bash
# Database Maintenance Script for Excel Medical Staffing Platform
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
LOG_DIR="${LOG_ROOT_DIR:-/var/log/excel-medical}"
MAINTENANCE_LOG="$LOG_DIR/db_maintenance_${TIMESTAMP}.log"
ALERT_EMAIL="${ALERT_EMAIL:-admin@excelmedicalstaffing.com}"

# Create log directory if it doesn't exist
mkdir -p "$LOG_DIR"

# Function to log messages
log() {
  echo "[$(date +"%Y-%m-%d %H:%M:%S")] $1" | tee -a "$MAINTENANCE_LOG"
}

# Function to send alerts
send_alert() {
  local subject="$1"
  local message="$2"
  local severity="$3" # info, warning, error
  
  echo -e "$message" | mail -s "[$severity] $subject" "$ALERT_EMAIL"
  log "Alert sent: $subject ($severity)"
}

log "Starting database maintenance tasks"

# PostgreSQL maintenance
postgres_maintenance() {
  log "Starting PostgreSQL maintenance tasks"
  
  # Set PostgreSQL environment variables
  export PGHOST="${POSTGRES_HOST:-localhost}"
  export PGPORT="${POSTGRES_PORT:-5432}"
  export PGUSER="${POSTGRES_USER:-postgres}"
  export PGPASSWORD="$POSTGRES_PASSWORD"
  export PGDATABASE="${POSTGRES_DB:-excel_medical}"
  
  # Check PostgreSQL connection
  if ! pg_isready -h "$PGHOST" -p "$PGPORT" -U "$PGUSER"; then
    log "ERROR: Cannot connect to PostgreSQL"
    send_alert "PostgreSQL Maintenance Failed" "Cannot connect to PostgreSQL database at $PGHOST:$PGPORT" "error"
    return 1
  fi
  
  log "Connected to PostgreSQL database: $PGDATABASE"
  
  # 1. VACUUM ANALYZE to reclaim space and update statistics
  log "Running VACUUM ANALYZE..."
  psql -c "VACUUM ANALYZE;" > /dev/null
  log "VACUUM ANALYZE completed"
  
  # 2. REINDEX to rebuild indexes
  log "Running REINDEX DATABASE..."
  psql -c "REINDEX DATABASE $PGDATABASE;" > /dev/null
  log "REINDEX completed"
  
  # 3. Identify and fix bloated tables
  log "Checking for bloated tables..."
  BLOATED_TABLES=$(psql -t -c "
    SELECT schemaname || '.' || tablename as table_name,
           pg_size_pretty(pg_total_relation_size(schemaname || '.' || tablename)) as total_size,
           round(n_dead_tup::numeric / greatest(n_live_tup, 1), 4) as dead_ratio
    FROM pg_stat_user_tables
    WHERE n_dead_tup > 10000 AND round(n_dead_tup::numeric / greatest(n_live_tup, 1), 4) > 0.1
    ORDER BY dead_ratio DESC;
  ")
  
  if [ -n "$BLOATED_TABLES" ]; then
    log "Found bloated tables:"
    log "$BLOATED_TABLES"
    
    # VACUUM FULL on bloated tables
    log "Running VACUUM FULL on bloated tables..."
    echo "$BLOATED_TABLES" | while read -r line; do
      if [ -n "$line" ]; then
        TABLE_NAME=$(echo "$line" | awk '{print $1}')
        log "VACUUM FULL on $TABLE_NAME"
        psql -c "VACUUM FULL $TABLE_NAME;" > /dev/null
      fi
    done
    log "VACUUM FULL completed on bloated tables"
  else
    log "No significantly bloated tables found"
  fi
  
  # 4. Identify and fix unused indexes
  log "Checking for unused indexes..."
  UNUSED_INDEXES=$(psql -t -c "
    SELECT schemaname || '.' || relname || '.' || indexrelname as index_name,
           pg_size_pretty(pg_relation_size(i.indexrelid)) as index_size
    FROM pg_stat_user_indexes ui
    JOIN pg_index i ON ui.indexrelid = i.indexrelid
    WHERE NOT indisunique AND idx_scan = 0 AND pg_relation_size(i.indexrelid) > 1048576
    ORDER BY pg_relation_size(i.indexrelid) DESC;
  ")
  
  if [ -n "$UNUSED_INDEXES" ]; then
    log "Found unused indexes:"
    log "$UNUSED_INDEXES"
    send_alert "PostgreSQL Unused Indexes" "The following indexes are not being used and consuming space:\n\n$UNUSED_INDEXES" "info"
  else
    log "No significant unused indexes found"
  fi
  
  # 5. Update database statistics
  log "Updating database statistics..."
  psql -c "ANALYZE;" > /dev/null
  log "Statistics update completed"
  
  log "PostgreSQL maintenance tasks completed"
}

# MongoDB maintenance
mongo_maintenance() {
  log "Starting MongoDB maintenance tasks"
  
  # Check if MONGO_URI is set
  if [ -z "$MONGO_URI" ]; then
    log "Error: MONGO_URI environment variable not set"
    return 1
  }
  
  # Check MongoDB connection
  if ! mongosh --quiet --eval "db.adminCommand('ping')" "$MONGO_URI" > /dev/null; then
    log "ERROR: Cannot connect to MongoDB"
    send_alert "MongoDB Maintenance Failed" "Cannot connect to MongoDB database" "error"
    return 1
  fi
  
  log "Connected to MongoDB database"
  
  # 1. Get database stats before maintenance
  log "Getting database stats before maintenance..."
  DB_STATS_BEFORE=$(mongosh --quiet --eval "JSON.stringify(db.stats())" "$MONGO_URI")
  DB_SIZE_BEFORE=$(echo "$DB_STATS_BEFORE" | jq -r '.dataSize')
  DB_SIZE_MB_BEFORE=$(echo "scale=2; $DB_SIZE_BEFORE / 1024 / 1024" | bc)
  log "Database size before maintenance: $DB_SIZE_MB_BEFORE MB"
  
  # 2. Get collection names
  log "Getting collection names..."
  COLLECTIONS=$(mongosh --quiet --eval "JSON.stringify(db.getCollectionNames())" "$MONGO_URI")
  
  # 3. Repair and compact collections
  log "Repairing and compacting collections..."
  echo "$COLLECTIONS" | jq -r '.[]' | while read -r COLLECTION; do
    if [ -n "$COLLECTION" ]; then
      log "Validating collection: $COLLECTION"
      VALIDATION=$(mongosh --quiet --eval "JSON.stringify(db.runCommand({validate: '$COLLECTION'}))" "$MONGO_URI")
      VALID=$(echo "$VALIDATION" | jq -r '.valid')
      
      if [ "$VALID" == "true" ]; then
        log "Collection $COLLECTION is valid"
      else
        log "Collection $COLLECTION needs repair"
        mongosh --quiet --eval "db.$COLLECTION.repairCollection()" "$MONGO_URI" > /dev/null
        log "Repaired collection: $COLLECTION"
      fi
      
      # Compact collection
      log "Compacting collection: $COLLECTION"
      mongosh --quiet --eval "db.runCommand({compact: '$COLLECTION'})" "$MONGO_URI" > /dev/null
      log "Compacted collection: $COLLECTION"
    fi
  done
  
  # 4. Check and rebuild indexes
  log "Checking and rebuilding indexes..."
  echo "$COLLECTIONS" | jq -r '.[]' | while read -r COLLECTION; do
    if [ -n "$COLLECTION" ]; then
      log "Checking indexes for collection: $COLLECTION"
      INDEXES=$(mongosh --quiet --eval "JSON.stringify(db.$COLLECTION.getIndexes())" "$MONGO_URI")
      INDEX_COUNT=$(echo "$INDEXES" | jq -r 'length')
      
      log "Collection $COLLECTION has $INDEX_COUNT indexes"
      
      # Rebuild indexes if there are any
      if [ "$INDEX_COUNT" -gt 0 ]; then
        log "Rebuilding indexes for collection: $COLLECTION"
        mongosh --quiet --eval "db.$COLLECTION.reIndex()" "$MONGO_URI" > /dev/null
        log "Rebuilt indexes for collection: $COLLECTION"
      fi
    fi
  done
  
  # 5. Get database stats after maintenance
  log "Getting database stats after maintenance..."
  DB_STATS_AFTER=$(mongosh --quiet --eval "JSON.stringify(db.stats())" "$MONGO_URI")
  DB_SIZE_AFTER=$(echo "$DB_STATS_AFTER" | jq -r '.dataSize')
  DB_SIZE_MB_AFTER=$(echo "scale=2; $DB_SIZE_AFTER / 1024 / 1024" | bc)
  log "Database size after maintenance: $DB_SIZE_MB_AFTER MB"
  
  # Calculate space saved
  SPACE_SAVED_MB=$(echo "scale=2; $DB_SIZE_MB_BEFORE - $DB_SIZE_MB_AFTER" | bc)
  SPACE_SAVED_PERCENT=$(echo "scale=2; ($DB_SIZE_MB_BEFORE - $DB_SIZE_MB_AFTER) * 100 / $DB_SIZE_MB_BEFORE" | bc)
  
  log "Space saved: $SPACE_SAVED_MB MB ($SPACE_SAVED_PERCENT%)"
  
  log "MongoDB maintenance tasks completed"
}

# Main execution
main() {
  log "Starting database maintenance process"
  
  # Run PostgreSQL maintenance
  postgres_maintenance
  
  # Run MongoDB maintenance
  mongo_maintenance
  
  log "Database maintenance process completed successfully"
  
  # Send completion notification
  send_alert "Database Maintenance Completed" "Database maintenance tasks have been completed successfully.\n\nCheck the log file for details: $MAINTENANCE_LOG" "info"
}

# Run main function
main

exit 0