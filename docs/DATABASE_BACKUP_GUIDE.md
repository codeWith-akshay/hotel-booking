# Database Backup & Recovery Guide

## Overview

This guide covers the database backup strategy, automated backups, cloud storage integration, and recovery procedures for the hotel booking application.

## Backup Strategy

### Retention Policy

- **Daily Backups**: Keep last 7 days
- **Weekly Backups**: Keep last 4 weeks
- **Monthly Backups**: Keep last 6 months

### Backup Schedule

| Type | Frequency | Time (UTC) | Cron Expression |
|------|-----------|------------|-----------------|
| Daily | Every day | 2:00 AM | `0 2 * * *` |
| Weekly | Sundays | 3:00 AM | `0 3 * * 0` |
| Monthly | 1st of month | 4:00 AM | `0 4 1 * *` |

## Automated Backups

### GitHub Actions Workflow

Automated backups run via the `.github/workflows/database-backup.yml` workflow:

```bash
# Trigger manual backup
gh workflow run database-backup.yml
```

### Features

- ✅ Automated PostgreSQL backups using `pg_dump`
- ✅ Compression using custom format (`-Fc`)
- ✅ Cloud storage upload (AWS S3, Google Cloud Storage, Supabase)
- ✅ Automatic retention policy enforcement
- ✅ Backup integrity verification
- ✅ Slack notifications on failure
- ✅ Metadata tracking

## Manual Backup Commands

### Using npm Script (Recommended)

```bash
# Create a PostgreSQL backup
pnpm run backup:pg

# This will create a backup in ./backups/ directory
# Example: backups/hotel_db_2024-10-24.dump
```

### Using Shell Script

```bash
# For Unix/Linux/Mac
./scripts/pg-backup.sh

# Set custom backup directory
BACKUP_DIR=/path/to/backups ./scripts/pg-backup.sh
```

### Using pg_dump Directly

```bash
# Manual backup with pg_dump
pg_dump -Fc --no-acl --no-owner \
  -h localhost \
  -U postgres \
  hotel_db > backups/hotel_db_$(date +%F).dump
```

## Cloud Storage Integration

### AWS S3 Setup

#### 1. Create S3 Bucket

```bash
aws s3 mb s3://my-hotel-backups --region us-east-1
```

#### 2. Set GitHub Secrets

Add these secrets to your GitHub repository:

- `AWS_ACCESS_KEY_ID`: Your AWS access key
- `AWS_SECRET_ACCESS_KEY`: Your AWS secret key
- `AWS_S3_BUCKET`: Bucket name (e.g., `my-hotel-backups`)
- `AWS_REGION`: AWS region (e.g., `us-east-1`)

#### 3. Configure Lifecycle Policy (Optional)

Create a lifecycle policy to automatically transition old backups to cheaper storage:

```json
{
  "Rules": [
    {
      "Id": "TransitionOldBackups",
      "Status": "Enabled",
      "Transitions": [
        {
          "Days": 30,
          "StorageClass": "STANDARD_IA"
        },
        {
          "Days": 90,
          "StorageClass": "GLACIER"
        }
      ]
    }
  ]
}
```

#### 4. Upload Manual Backup to S3

```bash
# Upload a backup file
aws s3 cp backups/hotel_db_2024-10-24.dump \
  s3://my-hotel-backups/backups/manual/ \
  --storage-class STANDARD_IA

# List all backups
aws s3 ls s3://my-hotel-backups/backups/daily/
```

### Google Cloud Storage Setup

#### 1. Create GCS Bucket

```bash
gcloud storage buckets create gs://my-hotel-backups --location=us-east1
```

#### 2. Create Service Account

```bash
# Create service account
gcloud iam service-accounts create backup-uploader \
  --display-name="Backup Uploader"

# Grant storage admin permissions
gcloud projects add-iam-policy-binding PROJECT_ID \
  --member="serviceAccount:backup-uploader@PROJECT_ID.iam.gserviceaccount.com" \
  --role="roles/storage.admin"

# Create and download key
gcloud iam service-accounts keys create gcs-key.json \
  --iam-account=backup-uploader@PROJECT_ID.iam.gserviceaccount.com

# Encode key to base64 for GitHub secrets
cat gcs-key.json | base64 > gcs-key-base64.txt
```

#### 3. Set GitHub Secrets

- `GCS_BUCKET`: Bucket name (e.g., `my-hotel-backups`)
- `GCS_SERVICE_ACCOUNT_KEY`: Base64-encoded service account key

#### 4. Upload Manual Backup to GCS

```bash
# Upload a backup file
gsutil cp backups/hotel_db_2024-10-24.dump \
  gs://my-hotel-backups/backups/manual/

# List all backups
gsutil ls gs://my-hotel-backups/backups/daily/
```

### Supabase Storage Setup

#### 1. Create Storage Bucket

```bash
# Via Supabase Dashboard:
# 1. Go to Storage section
# 2. Create new bucket: "backups"
# 3. Set to private
```

#### 2. Upload via Supabase CLI

```bash
# Install Supabase CLI
npm install -g supabase

# Login
supabase login

# Upload backup
supabase storage upload backups/daily/hotel_db_2024-10-24.dump \
  --project-ref YOUR_PROJECT_REF
```

## Backup Restoration

### Restore from Local Backup

```bash
# Drop existing database (CAUTION: This deletes all data!)
dropdb hotel_db

# Create new database
createdb hotel_db

# Restore from backup
pg_restore -h localhost -U postgres -d hotel_db \
  backups/hotel_db_2024-10-24.dump

# Or use the restore script
pnpm run backup:restore
```

### Restore from AWS S3

```bash
# Download backup from S3
aws s3 cp s3://my-hotel-backups/backups/daily/hotel_db_2024-10-24.dump \
  ./restore/

# Restore database
pg_restore -h localhost -U postgres -d hotel_db \
  restore/hotel_db_2024-10-24.dump
```

### Restore from Google Cloud Storage

```bash
# Download backup from GCS
gsutil cp gs://my-hotel-backups/backups/daily/hotel_db_2024-10-24.dump \
  ./restore/

# Restore database
pg_restore -h localhost -U postgres -d hotel_db \
  restore/hotel_db_2024-10-24.dump
```

## Pre-Migration Backups

Before running database migrations, always create a backup:

```bash
# Create pre-migration backup
pnpm run backup:pre-migration

# Run migrations
pnpm run db:migrate:deploy

# Verify migration status
pnpm run db:migrate:status
```

The deployment workflow automatically creates pre-migration backups.

## Backup Verification

### Verify Backup Integrity

```bash
# List contents of backup (doesn't restore)
pg_restore -l backups/hotel_db_2024-10-24.dump

# Test restore to a temporary database
createdb hotel_db_test
pg_restore -h localhost -U postgres -d hotel_db_test \
  backups/hotel_db_2024-10-24.dump
dropdb hotel_db_test
```

### Monitor Backups

```bash
# Check backup sizes and dates
pnpm run backup:monitor

# List all local backups
ls -lh backups/

# Check S3 backups
aws s3 ls s3://my-hotel-backups/backups/ --recursive --human-readable
```

## Database Health Check

Monitor database health using the health check endpoint:

```bash
# Check database health
curl http://localhost:3000/api/db/health

# Or use the npm script
pnpm run db:health
```

### Response Format

```json
{
  "status": "healthy",
  "timestamp": "2024-10-24T10:30:00.000Z",
  "database": {
    "connected": true,
    "latency": 25,
    "version": "PostgreSQL 16.0",
    "provider": "PostgreSQL"
  },
  "migrations": {
    "status": "up-to-date",
    "pending": 0,
    "applied": 15
  }
}
```

## Troubleshooting

### Backup Fails with "Authentication Failed"

**Solution**: Check your DATABASE_URL and ensure credentials are correct:

```bash
# Test connection
psql $DATABASE_URL -c "SELECT 1"
```

### S3 Upload Fails

**Solution**: Verify AWS credentials and bucket permissions:

```bash
# Test AWS credentials
aws s3 ls

# Check bucket policy
aws s3api get-bucket-policy --bucket my-hotel-backups
```

### Backup File Too Large

**Solution**: Use compression or split the backup:

```bash
# Compressed backup (already done with -Fc)
pg_dump -Fc hotel_db > backup.dump

# Split large backup
split -b 100M backup.dump backup.dump.part-
```

### Restore Fails with "Role Does Not Exist"

**Solution**: Use `--no-owner` flag when restoring:

```bash
pg_restore --no-owner -h localhost -U postgres -d hotel_db backup.dump
```

## Best Practices

1. **Test Backups Regularly**: Periodically test restoration to ensure backups are valid
2. **Monitor Backup Size**: Track backup growth to anticipate storage needs
3. **Secure Credentials**: Never commit DATABASE_URL or cloud credentials to Git
4. **Document Changes**: Update SCHEMA_CHANGELOG.md for each migration
5. **Pre-Migration Backups**: Always backup before schema changes
6. **Off-site Storage**: Store backups in different geographic regions
7. **Encryption**: Enable encryption at rest for cloud storage
8. **Access Control**: Limit backup access to authorized personnel only

## Automation

### Cron Job (Alternative to GitHub Actions)

If you prefer running backups on your own server:

```bash
# Edit crontab
crontab -e

# Add daily backup at 2 AM
0 2 * * * cd /path/to/hotel-booking && /bin/bash scripts/pg-backup.sh

# Add weekly backup on Sundays
0 3 * * 0 cd /path/to/hotel-booking && /bin/bash scripts/pg-backup.sh && aws s3 cp backups/latest.dump s3://my-hotel-backups/backups/weekly/
```

## Recovery Time Objective (RTO)

- **Small Database (< 1 GB)**: ~5 minutes
- **Medium Database (1-10 GB)**: ~15-30 minutes
- **Large Database (> 10 GB)**: ~1-2 hours

## Support

For backup-related issues:
1. Check workflow logs: `gh run list --workflow=database-backup.yml`
2. Review local backup logs: `cat backups/*.meta.json`
3. Test database connectivity: `pnpm run db:health`
4. Contact DevOps team

---

**Last Updated**: October 24, 2024
