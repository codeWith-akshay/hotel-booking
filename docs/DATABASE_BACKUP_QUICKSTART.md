# Database Backup & Migration Quick Reference

## Quick Commands

### Backups

```bash
# Create PostgreSQL backup
pnpm run backup:pg

# Create pre-migration backup
pnpm run backup:pre-migration

# Monitor backups
pnpm run backup:monitor

# Verify backup integrity
pnpm run backup:verify
```

### Migrations

```bash
# Check migration status
pnpm run db:migrate:status

# Deploy migrations (production)
pnpm run db:migrate:deploy

# Create new migration (development)
pnpm prisma migrate dev --name your_migration_name

# Reset database (development only!)
pnpm run db:reset
```

### Database Health

```bash
# Check database health
pnpm run db:health

# Or via curl
curl http://localhost:3000/api/db/health
```

## Backup Strategy

| Type | Frequency | Retention | Time (UTC) |
|------|-----------|-----------|------------|
| Daily | Every day | 7 days | 2:00 AM |
| Weekly | Sundays | 4 weeks | 3:00 AM |
| Monthly | 1st of month | 6 months | 4:00 AM |

## Cloud Storage Options

### AWS S3
```bash
# Setup
aws s3 mb s3://my-hotel-backups

# Upload
aws s3 cp backups/hotel_db_2024-10-24.dump s3://my-hotel-backups/

# List
aws s3 ls s3://my-hotel-backups/backups/daily/
```

### Google Cloud Storage
```bash
# Setup
gcloud storage buckets create gs://my-hotel-backups

# Upload
gsutil cp backups/hotel_db_2024-10-24.dump gs://my-hotel-backups/

# List
gsutil ls gs://my-hotel-backups/backups/daily/
```

### Supabase Storage
- Create bucket via dashboard
- Use Supabase CLI or API for uploads

## Restore Procedures

```bash
# 1. Download backup (if from cloud)
aws s3 cp s3://my-hotel-backups/backups/daily/hotel_db_2024-10-24.dump ./

# 2. Drop existing database (CAUTION!)
dropdb hotel_db

# 3. Create new database
createdb hotel_db

# 4. Restore from backup
pg_restore -h localhost -U postgres -d hotel_db hotel_db_2024-10-24.dump
```

## Before Production Deployment

1. ✅ Create backup: `pnpm run backup:pg`
2. ✅ Check migrations: `pnpm run db:migrate:status`
3. ✅ Check health: `pnpm run db:health`
4. ✅ Test in staging first
5. ✅ Have rollback plan ready

## GitHub Actions

```bash
# Trigger manual backup
gh workflow run database-backup.yml

# View workflow runs
gh run list --workflow=database-backup.yml

# View logs
gh run view --log
```

## Environment Variables

Required for backups:
- `DATABASE_URL`: PostgreSQL connection string
- `AWS_S3_BUCKET`: S3 bucket name (if using AWS)
- `AWS_ACCESS_KEY_ID`: AWS access key (if using AWS)
- `AWS_SECRET_ACCESS_KEY`: AWS secret key (if using AWS)
- `GCS_BUCKET`: GCS bucket name (if using GCS)

See `.env.backup.example` for full configuration.

## Documentation

- **Full Backup Guide**: `docs/DATABASE_BACKUP_GUIDE.md`
- **Schema Changelog**: `prisma/SCHEMA_CHANGELOG.md`
- **Database Strategy**: `docs/DATABASE_BACKUP_STRATEGY.md`

## Health Check Response

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

## Emergency Rollback

If deployment fails:

```bash
# 1. Restore from backup
pg_restore -h localhost -U postgres -d hotel_db backup.dump

# 2. Mark migration as rolled back
pnpm prisma migrate resolve --rolled-back migration_name

# 3. Check status
pnpm run db:migrate:status

# 4. Redeploy previous version
```

## Support

- Check workflow logs: GitHub Actions → Database Backup
- Review backup logs: `cat backups/*.meta.json`
- Test connectivity: `pnpm run db:health`
- Contact: DevOps team

---

**Last Updated**: October 24, 2024
