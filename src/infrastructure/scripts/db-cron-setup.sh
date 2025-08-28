#!/bin/bash
# Database Management Cron Setup Script for Excel Medical Staffing Platform
# This script sets up cron jobs for database backup, monitoring, and maintenance

# Exit on error
set -e

# Configuration
SCRIPTS_DIR="/workspace/src/infrastructure/scripts"
LOG_DIR="/var/log/excel-medical/cron"
BACKUP_SCRIPT="$SCRIPTS_DIR/database_backup.sh"
MONITOR_SCRIPT="$SCRIPTS_DIR/database_monitor.sh"
MAINTENANCE_SCRIPT="$SCRIPTS_DIR/database_maintenance.sh"
CRON_FILE="/etc/cron.d/excel-medical-db"

# Create log directory
mkdir -p "$LOG_DIR"

# Check if scripts exist
if [ ! -f "$BACKUP_SCRIPT" ]; then
  echo "Error: Backup script not found at $BACKUP_SCRIPT"
  exit 1
fi

if [ ! -f "$MONITOR_SCRIPT" ]; then
  echo "Error: Monitor script not found at $MONITOR_SCRIPT"
  exit 1
fi

if [ ! -f "$MAINTENANCE_SCRIPT" ]; then
  echo "Error: Maintenance script not found at $MAINTENANCE_SCRIPT"
  exit 1
fi

# Make scripts executable
chmod +x "$BACKUP_SCRIPT"
chmod +x "$MONITOR_SCRIPT"
chmod +x "$MAINTENANCE_SCRIPT"

# Create cron file
cat > "$CRON_FILE" << EOF
# Excel Medical Staffing Database Management Cron Jobs
SHELL=/bin/bash
PATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin
MAILTO=${ALERT_EMAIL:-admin@excelmedicalstaffing.com}

# Database backups: Daily at 2 AM
0 2 * * * root $BACKUP_SCRIPT >> $LOG_DIR/backup.log 2>&1

# Database monitoring: Every 15 minutes
*/15 * * * * root $MONITOR_SCRIPT >> $LOG_DIR/monitor.log 2>&1

# Database maintenance: Weekly on Sunday at 1 AM
0 1 * * 0 root $MAINTENANCE_SCRIPT >> $LOG_DIR/maintenance.log 2>&1

# Log rotation: Daily at 3 AM
0 3 * * * root find $LOG_DIR -name "*.log" -type f -mtime +7 -delete
EOF

# Set proper permissions for cron file
chmod 644 "$CRON_FILE"

# Reload cron service
if command -v systemctl &> /dev/null; then
  systemctl restart cron
elif command -v service &> /dev/null; then
  service cron restart
else
  echo "Warning: Could not restart cron service automatically"
  echo "Please restart the cron service manually"
fi

echo "Cron jobs have been set up successfully:"
echo "- Database backup: Daily at 2 AM"
echo "- Database monitoring: Every 15 minutes"
echo "- Database maintenance: Weekly on Sunday at 1 AM"
echo "- Log rotation: Daily at 3 AM"
echo ""
echo "Cron configuration file: $CRON_FILE"
echo "Cron logs directory: $LOG_DIR"

exit 0