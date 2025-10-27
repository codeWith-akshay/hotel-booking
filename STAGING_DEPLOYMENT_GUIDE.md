# 🚀 Staging Deployment Guide - Hotel Booking Application

## Pre-Deployment Checklist

### ✅ Required Services Setup

Before deploying to Vercel staging, ensure you have:

1. **PostgreSQL Database** (Production-ready)
   - [ ] Neon, Supabase, or Vercel Postgres account created
   - [ ] Database created: `hotel_booking_staging`
   - [ ] Connection string ready
   - [ ] SSL mode enabled

2. **Stripe Account** (Test Mode)
   - [ ] Stripe account created
   - [ ] Test mode API keys generated
   - [ ] Webhook endpoint configured (will be set after deployment)

3. **Vercel Account**
   - [ ] Vercel account created
   - [ ] Vercel CLI installed (`npm install -g vercel`)
   - [ ] Logged in to Vercel CLI (`vercel login`)

---

## 📋 Step-by-Step Deployment

### Step 1: Configure Environment Variables

**IMPORTANT**: Update the following placeholder values in `.env.staging`:

```bash
# Required Updates:
DATABASE_URL="postgresql://user:password@host:5432/hotel_booking_staging"
# ↑ Replace with your actual PostgreSQL connection string

STRIPE_SECRET_KEY="sk_test_your_stripe_secret_key_here"
# ↑ Replace with your Stripe test secret key

NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_test_your_stripe_publishable_key_here"
# ↑ Replace with your Stripe test publishable key

NEXTAUTH_SECRET="your-staging-secret-here-generate-with-openssl"
# ↑ Generate with: openssl rand -base64 32
```

### Step 2: Login to Vercel

```bash
vercel login
```

### Step 3: Link Project to Vercel (First Time Only)

```bash
vercel link
```

Follow the prompts:
- Setup and deploy? **No** (we'll configure first)
- Which scope? Select your account
- Link to existing project? **No** (create new)
- Project name? `hotel-booking-staging`
- Directory? `./` (current directory)

### Step 4: Add Environment Variables to Vercel

**Option A: Via Vercel CLI**

```bash
# Add each variable from .env.staging
vercel env add DATABASE_URL
# Paste the value when prompted
# Select environment: Preview

vercel env add STRIPE_SECRET_KEY
# Paste the value when prompted
# Select environment: Preview

vercel env add STRIPE_WEBHOOK_SECRET
# Paste the value when prompted
# Select environment: Preview

vercel env add NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
# Paste the value when prompted
# Select environment: Preview

vercel env add NEXTAUTH_SECRET
# Paste the value when prompted
# Select environment: Preview

vercel env add NEXTAUTH_URL
# Paste: https://hotel-booking-staging.vercel.app
# Select environment: Preview

vercel env add NEXT_PUBLIC_BASE_URL
# Paste: https://hotel-booking-staging.vercel.app
# Select environment: Preview
```

**Option B: Via Vercel Dashboard** (Recommended for bulk import)

1. Go to https://vercel.com/dashboard
2. Select your project
3. Go to Settings → Environment Variables
4. Copy all variables from `.env.staging`
5. Set Environment: **Preview** (for staging)
6. Save

### Step 5: Deploy to Staging

```bash
# Deploy to staging (preview environment)
vercel --prod=false

# Or for production-like staging with custom domain
vercel --prod
```

The deployment will:
1. Install dependencies with pnpm
2. Run database migrations (`pnpm db:migrate:deploy`)
3. Build the Next.js application
4. Deploy to Vercel

**Expected Output:**
```
✅ Preview: https://hotel-booking-staging-xxxxx.vercel.app
```

### Step 6: Configure Stripe Webhook

After deployment, set up the Stripe webhook:

1. Go to https://dashboard.stripe.com/test/webhooks
2. Click "Add endpoint"
3. Endpoint URL: `https://your-staging-url.vercel.app/api/webhooks/stripe`
4. Select events:
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
   - `checkout.session.completed`
5. Copy the "Signing secret"
6. Update in Vercel:
   ```bash
   vercel env add STRIPE_WEBHOOK_SECRET
   # Paste the signing secret
   # Select environment: Preview
   ```
7. Redeploy: `vercel --force`

### Step 7: Run Database Migrations

After first deployment, run migrations:

```bash
# SSH into Vercel (if needed) or run locally targeting staging DB
DATABASE_URL="your-staging-db-url" pnpm prisma migrate deploy
```

Or trigger via Vercel build (migrations run automatically in build script).

### Step 8: Seed Test Data (Optional)

```bash
DATABASE_URL="your-staging-db-url" pnpm db:seed
```

---

## 🔍 Post-Deployment Verification

### Health Checks

1. **Application Health**
   ```bash
   curl https://your-staging-url.vercel.app/api/health
   ```

2. **Database Health**
   ```bash
   curl https://your-staging-url.vercel.app/api/db/health
   ```

3. **Stripe Integration**
   ```bash
   curl https://your-staging-url.vercel.app/api/stripe/config
   ```

### Quick Smoke Test

1. Visit: `https://your-staging-url.vercel.app`
2. Check homepage loads
3. Navigate to /signup
4. Navigate to /login
5. Navigate to /rooms (public view)

---

## 🐛 Troubleshooting

### Build Failures

**Error: DATABASE_URL not found**
```bash
# Ensure DATABASE_URL is set in Vercel environment variables
vercel env ls
```

**Error: Prisma client not generated**
```bash
# This should auto-run via postinstall script
# Check package.json: "postinstall": "prisma generate"
```

**Error: Node version mismatch**
```bash
# Ensure package.json has:
# "engines": { "node": ">=20.0.0" }
```

### Runtime Errors

**Error: Can't connect to database**
- Check DATABASE_URL is correct
- Verify database allows connections from Vercel IPs (usually 0.0.0.0/0 for managed DBs)
- Check SSL mode is enabled in connection string

**Error: Stripe payments failing**
- Verify webhook secret is correct
- Check Stripe webhook is pointing to correct URL
- Ensure using TEST mode keys for staging

### Vercel Logs

View real-time logs:
```bash
vercel logs https://your-staging-url.vercel.app --follow
```

---

## 🔐 Security Checklist

- [ ] All sensitive values in Vercel environment variables (not in code)
- [ ] `.env.staging` added to `.gitignore`
- [ ] Using TEST mode Stripe keys (not production)
- [ ] CORS origins configured correctly
- [ ] Rate limiting enabled
- [ ] Database uses SSL connection
- [ ] NEXTAUTH_SECRET is unique and secure

---

## 📊 Monitoring Setup

1. **Vercel Analytics** (Auto-enabled)
   - View at: https://vercel.com/dashboard → Your Project → Analytics

2. **Vercel Logs**
   - View at: https://vercel.com/dashboard → Your Project → Logs

3. **Sentry** (Optional)
   - Add SENTRY_DSN to environment variables
   - Deploy will auto-configure error tracking

---

## 🚦 Next Steps

After successful deployment:

1. ✅ Run comprehensive testing (see STAGING_TEST_PLAN.md)
2. ✅ Monitor logs for any errors
3. ✅ Test critical user flows
4. ✅ Verify payment processing
5. ✅ Test mobile responsiveness
6. ✅ Run accessibility audit
7. ✅ Generate test report
8. ✅ Fix critical bugs
9. ✅ Prepare for production deployment

---

## 📞 Quick Commands Reference

```bash
# Deploy to staging
vercel --prod=false

# View logs
vercel logs --follow

# List environment variables
vercel env ls

# Remove deployment
vercel remove [deployment-url]

# View project info
vercel inspect

# Force rebuild
vercel --force

# Deploy to production (after staging tests pass)
vercel --prod
```

---

## 📝 Environment Variables Summary

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | ✅ | PostgreSQL connection string |
| `DIRECT_URL` | ✅ | Direct database URL for migrations |
| `STRIPE_SECRET_KEY` | ✅ | Stripe test secret key |
| `STRIPE_WEBHOOK_SECRET` | ✅ | Stripe webhook signing secret |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | ✅ | Stripe test publishable key |
| `NEXTAUTH_SECRET` | ✅ | NextAuth.js secret (32+ chars) |
| `NEXTAUTH_URL` | ✅ | Your staging URL |
| `NEXT_PUBLIC_BASE_URL` | ✅ | Your staging URL |
| `NEXT_PUBLIC_API_URL` | ✅ | API URL (usually same as base) |
| `REDIS_URL` | ⚠️ | Optional: Redis cache |
| `EMAIL_API_KEY` | ⚠️ | Optional: Email service |
| `SENTRY_DSN` | ⚠️ | Optional: Error tracking |

---

**Last Updated**: October 24, 2025  
**Version**: 1.0.0  
**Deployment Target**: Vercel Preview (Staging)
