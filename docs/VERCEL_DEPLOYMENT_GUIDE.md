# Vercel Staging Deployment Guide

## Prerequisites

1. **Vercel Account**: Sign up at [vercel.com](https://vercel.com)
2. **Vercel CLI**: Install globally
   ```bash
   npm install -g vercel
   ```
3. **Database**: PostgreSQL instance (Vercel Postgres, Supabase, or Neon)
4. **Stripe Account**: Test mode credentials

---

## Step 1: Database Setup

### Option A: Vercel Postgres (Recommended)

```bash
# Install Vercel Postgres
vercel postgres create hotel-booking-staging

# Get connection string
vercel postgres connection-string hotel-booking-staging
```

### Option B: Supabase

1. Create project at [supabase.com](https://supabase.com)
2. Get connection string from Settings → Database
3. Use "Connection Pooling" URL for DATABASE_URL
4. Use "Direct Connection" URL for DIRECT_URL

### Option C: Neon

1. Create project at [neon.tech](https://neon.tech)
2. Copy connection string
3. Enable connection pooling

---

## Step 2: Configure Environment Variables

### In Vercel Dashboard:

1. Go to your project → Settings → Environment Variables
2. Add all variables from `.env.staging`
3. Set environment to **Preview** (for staging)

### Required Variables:

```env
# Database
DATABASE_URL=postgresql://...
DIRECT_URL=postgresql://...

# Stripe (Test Mode)
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...

# Auth
NEXTAUTH_SECRET=<generate-with-openssl-rand-base64-32>
NEXTAUTH_URL=https://your-staging-url.vercel.app

# URLs
NEXT_PUBLIC_BASE_URL=https://your-staging-url.vercel.app
NEXT_PUBLIC_API_URL=https://your-staging-url.vercel.app

# Environment
NODE_ENV=production
NEXT_PUBLIC_ENV=staging
```

---

## Step 3: Link Project to Vercel

```bash
# Login to Vercel
vercel login

# Link project
vercel link

# Follow prompts:
# - Set up and deploy? No (we'll configure first)
# - Link to existing project? Yes/No
# - Project name: hotel-booking
```

---

## Step 4: Deploy to Staging

### Method 1: Via CLI

```bash
# Deploy to staging (preview)
vercel --env=preview

# Or deploy specific branch
git checkout staging
git push origin staging
```

### Method 2: Via GitHub Integration

1. Connect GitHub repository in Vercel dashboard
2. Configure deployment settings:
   - **Production Branch**: `main`
   - **Preview Branches**: `staging`, `develop`
3. Push to staging branch:
   ```bash
   git checkout staging
   git add .
   git commit -m "Deploy to staging"
   git push origin staging
   ```

---

## Step 5: Run Database Migrations

### After first deployment:

```bash
# SSH into Vercel or use Vercel CLI
vercel env pull .env.production.local

# Run migrations
pnpm prisma migrate deploy

# Generate Prisma client
pnpm prisma generate

# Seed database (optional)
pnpm db:seed
```

### Or use GitHub Actions:

The deployment workflow already handles migrations automatically.

---

## Step 6: Configure Stripe Webhook

1. Go to [Stripe Dashboard](https://dashboard.stripe.com/webhooks)
2. Click "+ Add endpoint"
3. Enter endpoint URL:
   ```
   https://your-staging-url.vercel.app/api/webhooks/stripe
   ```
4. Select events:
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
   - `payment_intent.canceled`
5. Copy webhook signing secret
6. Add to Vercel environment variables as `STRIPE_WEBHOOK_SECRET`

---

## Step 7: Verify Deployment

### Check deployment status:

```bash
vercel ls
```

### Test endpoints:

```bash
# Health check
curl https://your-staging-url.vercel.app/api/db/health

# API test
curl https://your-staging-url.vercel.app/api/health
```

### View logs:

```bash
vercel logs
```

---

## Step 8: Post-Deployment Testing

Run the comprehensive test suite (see TEST_PLAN.md):

1. **Authentication**: Signup/Login with OTP
2. **Booking Flow**: Create booking with payment
3. **Invoice Generation**: Download invoice PDF
4. **Admin Actions**: Approve/cancel bookings
5. **Mobile Responsiveness**: Test on various devices
6. **Accessibility**: Run WCAG tests

---

## Common Issues & Solutions

### Issue: Build fails with Prisma error

**Solution**: Ensure Prisma client is generated during build
```json
// package.json
"postinstall": "prisma generate"
```

### Issue: Database connection timeout

**Solution**: Use connection pooling URL and set proper timeout
```env
DATABASE_URL="postgresql://...?pgbouncer=true&connection_limit=1"
```

### Issue: Environment variables not loading

**Solution**: Redeploy after adding environment variables
```bash
vercel --force
```

### Issue: Webhook signature verification fails

**Solution**: Ensure correct webhook secret and raw body parsing
- Check Stripe webhook logs
- Verify endpoint URL matches exactly
- Ensure raw body is passed to Stripe verification

---

## Monitoring & Debugging

### Vercel Dashboard

- **Deployments**: View deployment history
- **Logs**: Real-time function logs
- **Analytics**: Performance metrics
- **Speed Insights**: Core Web Vitals

### Useful Commands

```bash
# View recent logs
vercel logs --follow

# Check deployment status
vercel inspect <deployment-url>

# Roll back to previous deployment
vercel rollback

# Remove deployment
vercel remove <deployment-name>
```

---

## Staging vs Production

| Aspect | Staging | Production |
|--------|---------|------------|
| Branch | `staging` | `main` |
| Domain | `.vercel.app` subdomain | Custom domain |
| Database | Staging DB | Production DB |
| Stripe | Test mode | Live mode |
| Environment | `preview` | `production` |
| Monitoring | Basic | Full monitoring |

---

## Next Steps

1. ✅ Deploy to staging
2. ✅ Run comprehensive tests
3. ✅ Fix critical bugs
4. 🚀 Deploy to production

---

## Resources

- [Vercel Documentation](https://vercel.com/docs)
- [Next.js Deployment](https://nextjs.org/docs/deployment)
- [Prisma with Vercel](https://www.prisma.io/docs/guides/deployment/deployment-guides/deploying-to-vercel)
- [Stripe Webhooks](https://stripe.com/docs/webhooks)

---

**Last Updated**: October 24, 2024
