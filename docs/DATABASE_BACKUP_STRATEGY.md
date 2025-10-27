# Database Backup & Recovery Strategy

## Overview

This document outlines the backup strategy for the hotel booking system database. While the current setup uses SQLite for development, the strategies here are designed to scale to PostgreSQL for production.

## 🎯 Backup Objectives

- **Recovery Point Objective (RPO)**: Maximum 15 minutes of data loss
- **Recovery Time Objective (RTO)**: Maximum 1 hour to restore service
- **Retention Period**: 
  - Daily backups: 30 days
  - Weekly backups: 3 months
  - Monthly backups: 1 year

## 📦 Backup Types

### 1. Automated Daily Backups

**Frequency**: Every day at 2:00 AM UTC

**Method**: Full database dump

**Storage**: 
- Primary: Local encrypted storage
- Secondary: Cloud storage (AWS S3 / Azure Blob / Google Cloud Storage)

**Implementation** (PostgreSQL):

```bash
#!/bin/bash
# backup-daily.sh

DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/var/backups/hotel-booking"
DB_NAME="hotel_booking"
DB_USER="postgres"
RETENTION_DAYS=30

# Create backup directory
mkdir -p $BACKUP_DIR

# Perform backup
pg_dump -U $DB_USER -F c -b -v -f "$BACKUP_DIR/backup_$DATE.dump" $DB_NAME

# Compress backup
gzip "$BACKUP_DIR/backup_$DATE.dump"

# Encrypt backup (using GPG)
gpg --encrypt --recipient backup@yourhotel.com "$BACKUP_DIR/backup_$DATE.dump.gz"

# Upload to S3 (if configured)
if [ -n "$AWS_S3_BUCKET" ]; then
    aws s3 cp "$BACKUP_DIR/backup_$DATE.dump.gz.gpg" "s3://$AWS_S3_BUCKET/daily/"
fi

# Clean up old backups (local)
find $BACKUP_DIR -name "backup_*.dump.gz.gpg" -mtime +$RETENTION_DAYS -delete

# Log backup completion
echo "$(date): Backup completed - backup_$DATE.dump.gz.gpg" >> $BACKUP_DIR/backup.log
```

**Cron Job**:
```bash
# Add to crontab: crontab -e
0 2 * * * /path/to/backup-daily.sh
```

---

### 2. Continuous Point-in-Time Recovery (PITR)

**Frequency**: Continuous (transaction log archiving)

**Method**: Write-Ahead Log (WAL) archiving (PostgreSQL)

**Configuration** (`postgresql.conf`):

```ini
# Enable WAL archiving
wal_level = replica
archive_mode = on
archive_command = 'test ! -f /var/lib/postgresql/wal_archive/%f && cp %p /var/lib/postgresql/wal_archive/%f'
archive_timeout = 300  # Force WAL switch every 5 minutes
```

**Benefits**:
- Recover to any point in time within retention window
- Minimal data loss (RPO < 5 minutes)

---

### 3. Incremental Backups

**Frequency**: Every 6 hours

**Method**: pg_basebackup with incremental mode (PostgreSQL 17+)

```bash
#!/bin/bash
# backup-incremental.sh

TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/var/backups/hotel-booking/incremental"

pg_basebackup -D "$BACKUP_DIR/incr_$TIMESTAMP" \
  -F tar \
  -z \
  -P \
  --checkpoint=fast \
  --wal-method=stream
```

---

### 4. Pre-Migration Backups

**When**: Before any schema migration or major deployment

**Method**: Manual full backup with verification

```bash
# Run before migration
pnpm run backup:pre-migration

# Verify backup
pnpm run backup:verify
```

**Script** (`scripts/backup-pre-migration.js`):

```javascript
// scripts/backup-pre-migration.js
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
const backupDir = path.join(__dirname, '../backups/pre-migration');
const backupFile = path.join(backupDir, `migration-backup-${timestamp}.dump`);

// Create backup directory
fs.mkdirSync(backupDir, { recursive: true });

try {
  console.log('🔄 Creating pre-migration backup...');
  
  // SQLite backup
  const dbPath = process.env.DATABASE_URL?.replace('file:', '') || './prisma/dev.db';
  fs.copyFileSync(dbPath, `${backupFile}.db`);
  
  console.log(`✅ Backup created: ${backupFile}.db`);
  
  // Verify backup
  const stats = fs.statSync(`${backupFile}.db`);
  console.log(`📊 Backup size: ${(stats.size / 1024 / 1024).toFixed(2)} MB`);
  
  // Create metadata
  const metadata = {
    timestamp: new Date().toISOString(),
    schemaVersion: execSync('npx prisma migrate status', { encoding: 'utf8' }),
    dbSize: stats.size,
  };
  
  fs.writeFileSync(
    `${backupFile}.meta.json`,
    JSON.stringify(metadata, null, 2)
  );
  
  console.log('✅ Pre-migration backup complete!');
} catch (error) {
  console.error('❌ Backup failed:', error.message);
  process.exit(1);
}
```

---

## 🔄 Backup Automation with GitHub Actions

**File**: `.github/workflows/database-backup.yml`

```yaml
name: Database Backup

on:
  schedule:
    # Daily at 2 AM UTC
    - cron: '0 2 * * *'
  workflow_dispatch: # Manual trigger

jobs:
  backup:
    runs-on: ubuntu-latest
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v4
      
      - name: Set up PostgreSQL client
        run: |
          sudo apt-get update
          sudo apt-get install -y postgresql-client
      
      - name: Create backup
        env:
          DATABASE_URL: ${{ secrets.DATABASE_URL }}
        run: |
          TIMESTAMP=$(date +%Y%m%d_%H%M%S)
          pg_dump $DATABASE_URL -F c -f backup_$TIMESTAMP.dump
          gzip backup_$TIMESTAMP.dump
      
      - name: Upload to S3
        env:
          AWS_ACCESS_KEY_ID: ${{ secrets.AWS_ACCESS_KEY_ID }}
          AWS_SECRET_ACCESS_KEY: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          AWS_S3_BUCKET: ${{ secrets.AWS_S3_BUCKET }}
        run: |
          aws s3 cp backup_*.dump.gz s3://$AWS_S3_BUCKET/backups/daily/
      
      - name: Cleanup old backups
        run: |
          # Keep only last 30 days
          aws s3 ls s3://$AWS_S3_BUCKET/backups/daily/ \
            | awk '{print $4}' \
            | sort -r \
            | tail -n +31 \
            | xargs -I {} aws s3 rm s3://$AWS_S3_BUCKET/backups/daily/{}
      
      - name: Notify on failure
        if: failure()
        uses: 8398a7/action-slack@v3
        with:
          status: ${{ job.status }}
          text: 'Database backup failed!'
          webhook_url: ${{ secrets.SLACK_WEBHOOK }}
```

---

## 🔐 Backup Security

### Encryption

All backups must be encrypted at rest:

```bash
# Encrypt backup
gpg --encrypt --recipient backup@yourhotel.com backup.dump

# Decrypt for restore
gpg --decrypt backup.dump.gpg > backup.dump
```

### Access Control

- Backup files: Read-only for backup user, no public access
- S3 bucket: Private, with IAM role-based access
- Encryption keys: Stored in secure vault (AWS Secrets Manager / Azure Key Vault)

### Backup Verification

**Automated Testing** (`scripts/verify-backup.sh`):

```bash
#!/bin/bash
# verify-backup.sh - Test backup integrity

BACKUP_FILE=$1

if [ -z "$BACKUP_FILE" ]; then
    echo "Usage: $0 <backup-file>"
    exit 1
fi

# Create temporary database
TEST_DB="backup_verify_$(date +%s)"

# Restore backup to test database
pg_restore -U postgres -d $TEST_DB -c $BACKUP_FILE

# Run integrity checks
psql -U postgres -d $TEST_DB -c "
    SELECT 'Users: ' || COUNT(*) FROM users;
    SELECT 'Bookings: ' || COUNT(*) FROM bookings;
    SELECT 'Inventory: ' || COUNT(*) FROM room_inventory;
"

# Cleanup
dropdb $TEST_DB

echo "✅ Backup verification complete"
```

---

## 🔧 Restore Procedures

### Full Database Restore

**From daily backup**:

```bash
#!/bin/bash
# restore-full.sh

BACKUP_FILE=$1
DB_NAME="hotel_booking"

# Stop application
systemctl stop hotel-booking-app

# Drop existing database (CAREFUL!)
dropdb $DB_NAME

# Create fresh database
createdb $DB_NAME

# Restore from backup
pg_restore -U postgres -d $DB_NAME -v $BACKUP_FILE

# Verify restoration
psql -U postgres -d $DB_NAME -c "SELECT COUNT(*) FROM users;"

# Restart application
systemctl start hotel-booking-app

echo "✅ Database restored successfully"
```

### Point-in-Time Recovery

**Restore to specific timestamp**:

```bash
#!/bin/bash
# restore-pitr.sh

TARGET_TIME="2024-10-24 14:30:00"
BASE_BACKUP="/var/backups/hotel-booking/base"
WAL_ARCHIVE="/var/lib/postgresql/wal_archive"

# Stop PostgreSQL
systemctl stop postgresql

# Restore base backup
rm -rf /var/lib/postgresql/data/*
tar -xzf $BASE_BACKUP/base.tar.gz -C /var/lib/postgresql/data/

# Configure recovery
cat > /var/lib/postgresql/data/recovery.conf <<EOF
restore_command = 'cp $WAL_ARCHIVE/%f %p'
recovery_target_time = '$TARGET_TIME'
recovery_target_action = 'promote'
EOF

# Start PostgreSQL (triggers recovery)
systemctl start postgresql

echo "✅ Point-in-time recovery initiated to $TARGET_TIME"
```

---

## 📊 Monitoring & Alerts

### Backup Health Monitoring

**Metrics to track**:
- Backup completion time
- Backup file size
- Backup success/failure rate
- Time since last successful backup

**Monitoring Script** (`scripts/monitor-backups.js`):

```javascript
// scripts/monitor-backups.js
const fs = require('fs');
const path = require('path');
const { sendAlert } = require('./alerts');

const BACKUP_DIR = '/var/backups/hotel-booking';
const MAX_AGE_HOURS = 26; // Alert if backup older than 26 hours

async function checkBackupHealth() {
  try {
    // Find latest backup
    const files = fs.readdirSync(BACKUP_DIR)
      .filter(f => f.endsWith('.dump.gz.gpg'))
      .map(f => ({
        name: f,
        mtime: fs.statSync(path.join(BACKUP_DIR, f)).mtime,
        size: fs.statSync(path.join(BACKUP_DIR, f)).size,
      }))
      .sort((a, b) => b.mtime - a.mtime);

    if (files.length === 0) {
      await sendAlert('CRITICAL', 'No backups found!');
      return;
    }

    const latestBackup = files[0];
    const ageHours = (Date.now() - latestBackup.mtime) / (1000 * 60 * 60);

    if (ageHours > MAX_AGE_HOURS) {
      await sendAlert(
        'CRITICAL',
        `Last backup is ${ageHours.toFixed(1)} hours old (${latestBackup.name})`
      );
    }

    // Check backup size (should be > 1MB for production)
    if (latestBackup.size < 1024 * 1024) {
      await sendAlert(
        'WARNING',
        `Backup size suspiciously small: ${(latestBackup.size / 1024).toFixed(0)} KB`
      );
    }

    console.log('✅ Backup health check passed');
    console.log(`Latest backup: ${latestBackup.name}`);
    console.log(`Age: ${ageHours.toFixed(1)} hours`);
    console.log(`Size: ${(latestBackup.size / 1024 / 1024).toFixed(2)} MB`);
  } catch (error) {
    await sendAlert('CRITICAL', `Backup health check failed: ${error.message}`);
  }
}

checkBackupHealth();
```

**Cron Job** (runs every hour):
```bash
0 * * * * /usr/bin/node /path/to/monitor-backups.js
```

---

## 🧪 Disaster Recovery Testing

### Quarterly DR Drills

**Schedule**: First Monday of each quarter

**Procedure**:

1. **Select random backup** from previous week
2. **Restore to staging environment**
3. **Verify data integrity**:
   - Run test suite against restored database
   - Check critical data counts
   - Verify recent bookings exist
4. **Measure recovery time**
5. **Document results**

**Test Script** (`scripts/dr-drill.sh`):

```bash
#!/bin/bash
# dr-drill.sh - Disaster Recovery Drill

echo "🚨 Starting Disaster Recovery Drill"

# Select random backup from last week
BACKUP=$(find /var/backups/hotel-booking -name "backup_*.dump.gz" -mtime -7 | shuf -n 1)

if [ -z "$BACKUP" ]; then
    echo "❌ No recent backups found!"
    exit 1
fi

echo "📦 Selected backup: $BACKUP"

# Restore to test database
START_TIME=$(date +%s)

createdb dr_test_$(date +%s)
gunzip -c $BACKUP | pg_restore -d dr_test -v

END_TIME=$(date +%s)
DURATION=$((END_TIME - START_TIME))

echo "⏱️  Restore completed in $DURATION seconds"

# Run integrity checks
psql -d dr_test -c "
    SELECT 'Users: ' || COUNT(*) FROM users;
    SELECT 'Bookings: ' || COUNT(*) FROM bookings;
    SELECT 'Last booking date: ' || MAX(created_at) FROM bookings;
"

# Cleanup
dropdb dr_test

echo "✅ DR Drill completed successfully"
echo "📊 Recovery Time: $DURATION seconds"
```

---

## 📋 Backup Checklist

### Daily Tasks
- [ ] Verify automated backup completed
- [ ] Check backup file size is reasonable
- [ ] Confirm S3 upload succeeded

### Weekly Tasks
- [ ] Test restore from latest backup
- [ ] Review backup logs for errors
- [ ] Verify retention policy is working

### Monthly Tasks
- [ ] Full restore test to staging
- [ ] Review and update backup strategy
- [ ] Audit backup security settings

### Quarterly Tasks
- [ ] Disaster recovery drill
- [ ] Update DR documentation
- [ ] Review and test recovery time objectives

---

## 🔗 Related Scripts

Add these scripts to `package.json`:

```json
{
  "scripts": {
    "backup:create": "node scripts/backup-create.js",
    "backup:verify": "bash scripts/verify-backup.sh",
    "backup:restore": "bash scripts/restore-full.sh",
    "backup:pre-migration": "node scripts/backup-pre-migration.js",
    "backup:monitor": "node scripts/monitor-backups.js"
  }
}
```

---

## 🚀 Production Deployment Recommendations

### PostgreSQL Managed Services

For production, use managed database services with built-in backup:

#### AWS RDS
- Automated daily backups (retained 7-35 days)
- Point-in-time recovery (5-minute RPO)
- Multi-AZ deployment for high availability

```bash
# AWS CLI backup command
aws rds create-db-snapshot \
  --db-instance-identifier hotel-booking-prod \
  --db-snapshot-identifier manual-backup-$(date +%Y%m%d)
```

#### Azure Database for PostgreSQL
- Automated backups with 7-35 day retention
- Geo-redundant backup storage
- Point-in-time restore

#### Heroku Postgres
- Continuous protection with PGBackups
- One-click rollback

```bash
# Heroku backup
heroku pg:backups:capture --app hotel-booking-prod
heroku pg:backups:download --app hotel-booking-prod
```

---

## 📞 Emergency Contacts

In case of data loss or corruption:

1. **DBA**: [Your DBA contact]
2. **DevOps Lead**: [DevOps contact]
3. **Cloud Provider Support**: [Support number]
4. **Backup Vendor**: [Vendor contact]

---

## 📚 Additional Resources

- [PostgreSQL Backup & Restore Documentation](https://www.postgresql.org/docs/current/backup.html)
- [AWS RDS Backup Documentation](https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/CHAP_CommonTasks.BackupRestore.html)
- [Prisma Migrate Documentation](https://www.prisma.io/docs/concepts/components/prisma-migrate)
