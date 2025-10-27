# Database Management - Complete Setup

## 🎉 Overview

This hotel booking application now has a complete database backup and migration management system with:

- ✅ **Automated PostgreSQL backups** (daily, weekly, monthly)
- ✅ **Cloud storage integration** (AWS S3, Google Cloud Storage, Supabase)
- ✅ **Retention policy** (7 daily, 4 weekly, 6 monthly)
- ✅ **Automatic migration deployment** before builds
- ✅ **Database health check API** endpoint
- ✅ **Comprehensive documentation**

---

## 📖 Quick Links

| Document | Purpose |
|----------|---------|
| [**DATABASE_BACKUP_QUICKSTART.md**](./DATABASE_BACKUP_QUICKSTART.md) | Quick command reference |
| [**DATABASE_BACKUP_GUIDE.md**](./DATABASE_BACKUP_GUIDE.md) | Complete backup & restore guide |
| [**DATABASE_BACKUP_IMPLEMENTATION.md**](./DATABASE_BACKUP_IMPLEMENTATION.md) | Implementation details |
| [**../prisma/SCHEMA_CHANGELOG.md**](../prisma/SCHEMA_CHANGELOG.md) | Migration tracking |
| [**../.env.backup.example**](../.env.backup.example) | Configuration template |

---

## ⚡ Quick Start

### Create a Backup

```bash
# PostgreSQL backup (recommended)
pnpm run backup:pg

# Pre-migration backup
pnpm run backup:pre-migration
```

### Check Database Health

```bash
# Via npm script
pnpm run db:health

# Via API
curl http://localhost:3000/api/db/health
```

### Run Migrations

```bash
# Check status
pnpm run db:migrate:status

# Deploy migrations
pnpm run db:migrate:deploy

# Create new migration (dev)
pnpm prisma migrate dev --name your_migration_name
```

---

## 🤖 Automated Processes

### Backup Schedule (GitHub Actions)

| Type | When | Retention | Workflow |
|------|------|-----------|----------|
| Daily | 2:00 AM UTC | 7 days | `.github/workflows/database-backup.yml` |
| Weekly | Sundays 3:00 AM | 4 weeks | Same workflow |
| Monthly | 1st day 4:00 AM | 6 months | Same workflow |

### Deployment Process

When you push to `main` or deploy manually:

1. ✅ Checkout code
2. ✅ Install dependencies
3. ✅ Generate Prisma client
4. ✅ **Create pre-migration backup**
5. ✅ **Run database migrations**
6. ✅ **Verify migration status**
7. ✅ Build application
8. ✅ Deploy to production

See: `.github/workflows/deploy.yml`

---

## ☁️ Cloud Storage Setup

### AWS S3 (Recommended)

```bash
# 1. Create bucket
aws s3 mb s3://my-hotel-backups --region us-east-1

# 2. Add GitHub Secrets
# - AWS_ACCESS_KEY_ID
# - AWS_SECRET_ACCESS_KEY
# - AWS_S3_BUCKET
# - AWS_REGION

# 3. Test
pnpm run backup:pg
aws s3 ls s3://my-hotel-backups/backups/
```

### Google Cloud Storage

```bash
# 1. Create bucket
gcloud storage buckets create gs://my-hotel-backups

# 2. Create service account
gcloud iam service-accounts create backup-uploader

# 3. Add GitHub Secrets
# - GCS_BUCKET
# - GCS_SERVICE_ACCOUNT_KEY (base64 encoded)

# 4. Test
pnpm run backup:pg
gsutil ls gs://my-hotel-backups/backups/
```

See [DATABASE_BACKUP_GUIDE.md](./DATABASE_BACKUP_GUIDE.md) for detailed setup.

---

## 🛠️ Available Scripts

### Backup Commands

```bash
pnpm run backup:pg                 # Create PostgreSQL backup
pnpm run backup:create             # Create SQLite backup (legacy)
pnpm run backup:pre-migration      # Create backup before migration
pnpm run backup:verify             # Verify backup integrity
pnpm run backup:restore            # Restore from backup
pnpm run backup:monitor            # Monitor backups
```

### Database Commands

```bash
pnpm run db:health                 # Check database health
pnpm run db:migrate:status         # Check migration status
pnpm run db:migrate:deploy         # Deploy migrations (prod)
pnpm run db:migrate                # Create migration (dev)
pnpm run db:generate               # Generate Prisma client
pnpm run db:studio                 # Open Prisma Studio
pnpm run db:seed                   # Seed database
pnpm run db:reset                  # Reset database (dev only!)
```

---

## 🏥 Health Check API

### Endpoint

```
GET /api/db/health
```

### Response

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

### Status Codes

- **200**: Healthy (latency < 100ms, no pending migrations)
- **207**: Degraded (latency 100-1000ms or pending migrations)
- **503**: Unhealthy (database disconnected)

---

## 🔄 Migration Workflow

### Development

```bash
# 1. Modify prisma/schema.prisma
# 2. Create migration
pnpm prisma migrate dev --name add_new_field

# 3. Test migration
pnpm run db:health

# 4. Update changelog
# Edit prisma/SCHEMA_CHANGELOG.md

# 5. Commit
git add .
git commit -m "feat: add new field to user table"
git push
```

### Production (Automatic)

Push to `main` triggers deployment:
1. Pre-migration backup created
2. `pnpm prisma migrate deploy` runs
3. Migration status verified
4. Application builds and deploys

---

## 📋 Pre-Deployment Checklist

Before deploying to production:

- [ ] Backup created: `pnpm run backup:pg`
- [ ] Migrations tested in development
- [ ] Health check passes: `pnpm run db:health`
- [ ] Schema changelog updated
- [ ] Cloud storage configured (optional)
- [ ] GitHub secrets set
- [ ] Rollback plan ready

---

## 🚨 Emergency Procedures

### Rollback After Failed Migration

```bash
# 1. Restore from backup
pg_restore -h HOST -U USER -d hotel_db backup.dump

# 2. Mark migration as rolled back
pnpm prisma migrate resolve --rolled-back migration_name

# 3. Verify status
pnpm run db:migrate:status
```

### Database Connection Issues

```bash
# 1. Check health
pnpm run db:health

# 2. Test connection directly
psql $DATABASE_URL -c "SELECT 1"

# 3. Check logs
# View application logs for errors
```

---

## 📊 Monitoring

### GitHub Actions

```bash
# List backup workflow runs
gh run list --workflow=database-backup.yml

# View latest run
gh run view --log

# Trigger manual backup
gh workflow run database-backup.yml
```

### Local Monitoring

```bash
# Check backup files
ls -lh backups/

# View backup metadata
cat backups/*.meta.json

# Check cloud storage
aws s3 ls s3://my-hotel-backups/backups/ --recursive
```

---

## 🔐 Security Best Practices

1. **Never commit credentials** - Use `.env.local`, add to `.gitignore`
2. **Rotate credentials regularly** - Change passwords/keys quarterly
3. **Use least-privilege IAM** - Grant minimal required permissions
4. **Enable encryption at rest** - For cloud storage buckets
5. **Enable MFA** - For cloud provider accounts
6. **Secure backup access** - Restrict who can download backups
7. **Monitor access logs** - Review cloud storage access regularly

---

## 📞 Support & Troubleshooting

### Check Documentation

1. [DATABASE_BACKUP_QUICKSTART.md](./DATABASE_BACKUP_QUICKSTART.md) - Quick reference
2. [DATABASE_BACKUP_GUIDE.md](./DATABASE_BACKUP_GUIDE.md) - Comprehensive guide
3. [prisma/SCHEMA_CHANGELOG.md](../prisma/SCHEMA_CHANGELOG.md) - Migration history

### Common Issues

**Q: Backup fails with authentication error**  
A: Check `DATABASE_URL` is correctly set

**Q: Cloud upload not working**  
A: Verify GitHub Secrets are set correctly

**Q: Migration hangs**  
A: Check for long-running transactions, kill blocking queries

**Q: Health check returns 503**  
A: Database may be down or unreachable, check connection

### Get Help

- Check workflow logs: GitHub Actions → Database Backup
- Review backup logs: `cat backups/*.meta.json`
- Test connectivity: `pnpm run db:health`
- Contact DevOps team

---

## ✅ Implementation Status

- ✅ PostgreSQL backup scripts (TypeScript & Shell)
- ✅ Automated backup workflow (GitHub Actions)
- ✅ Cloud storage integration (AWS S3, GCS, Supabase)
- ✅ Retention policy enforcement (7 daily, 4 weekly, 6 monthly)
- ✅ Pre-migration backup in deployment
- ✅ Automatic migration deployment
- ✅ Database health check API
- ✅ Comprehensive documentation
- ✅ Schema changelog with best practices
- ✅ Configuration examples
- ✅ Quick reference guides

**Status**: Production-Ready ✨

---

**Last Updated**: October 24, 2024
