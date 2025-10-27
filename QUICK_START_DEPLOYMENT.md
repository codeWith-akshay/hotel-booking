# 🚀 Quick Start: Staging Deployment

## ⚡ Fast Track to Staging Deployment

### 1️⃣ Login to Vercel (REQUIRED FIRST)

```bash
vercel login
```

**You'll be prompted to:**
1. Visit the authentication URL
2. Log in with your Vercel account (or create one at https://vercel.com/signup)
3. Authorize the CLI
4. Return and press ENTER

### 2️⃣ Update Environment Variables

**CRITICAL**: Before deploying, update these values in `.env.staging`:

```bash
# Required Updates (replace placeholder values):

DATABASE_URL="postgresql://user:password@host:5432/hotel_booking_staging"
# ↑ Get from: Neon.tech, Supabase, or Vercel Postgres

STRIPE_SECRET_KEY="sk_test_your_actual_key"
# ↑ Get from: https://dashboard.stripe.com/test/apikeys

NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_test_your_actual_key"
# ↑ Get from: https://dashboard.stripe.com/test/apikeys

NEXTAUTH_SECRET="generate_with_openssl_rand_base64_32"
# ↑ Run in terminal: openssl rand -base64 32

NEXT_PUBLIC_BASE_URL="https://hotel-booking-staging.vercel.app"
# ↑ Will be updated after first deployment
```

### 3️⃣ Quick Database Setup (if needed)

**Option A: Neon (Recommended - Free tier)**
1. Go to https://neon.tech
2. Create account
3. Create database: `hotel_booking_staging`
4. Copy connection string
5. Paste into `DATABASE_URL` in `.env.staging`

**Option B: Supabase (Free tier)**
1. Go to https://supabase.com
2. Create project
3. Get connection string from Settings → Database
4. Paste into `DATABASE_URL` in `.env.staging`

**Option C: Vercel Postgres**
```bash
vercel postgres create
```

### 4️⃣ Deploy to Staging

**Option A: Automated Script (Recommended)**
```bash
node scripts/deploy-staging.js
```

**Option B: Manual Deployment**
```bash
# Install dependencies
pnpm install

# Generate Prisma client
pnpm prisma generate

# Deploy to Vercel staging
vercel --prod=false
```

### 5️⃣ Configure Stripe Webhook

After deployment:
1. Go to https://dashboard.stripe.com/test/webhooks
2. Click "Add endpoint"
3. URL: `https://your-staging-url.vercel.app/api/webhooks/stripe`
4. Select events: `payment_intent.succeeded`, `payment_intent.payment_failed`
5. Copy webhook secret
6. Add to Vercel:
   ```bash
   vercel env add STRIPE_WEBHOOK_SECRET
   # Paste the secret
   # Select: Preview
   ```
7. Redeploy:
   ```bash
   vercel --force
   ```

### 6️⃣ Run Database Migrations

```bash
# Option A: Via Vercel build (automatic)
# Migrations run automatically via package.json build script

# Option B: Manual (if needed)
DATABASE_URL="your-staging-db-url" pnpm prisma migrate deploy
```

### 7️⃣ Test the Deployment

```bash
# Check application health
curl https://your-staging-url.vercel.app/api/health

# Check database health
curl https://your-staging-url.vercel.app/api/db/health
```

**Manual Tests:**
1. Visit staging URL in browser
2. Try signup/login
3. Browse rooms
4. Create test booking
5. Verify admin access

### 8️⃣ Run Full Test Suite

Follow the comprehensive test plan:
```bash
# See: STAGING_TEST_PLAN.md
```

Document results in:
```bash
# See: STAGING_TEST_REPORT.md
```

---

## 🆘 Troubleshooting

### Issue: "vercel command not found"
```bash
npm install -g vercel
```

### Issue: "DATABASE_URL invalid"
- Ensure format: `postgresql://user:password@host:port/database`
- Check SSL mode: `?sslmode=require`
- Verify database is accessible from internet

### Issue: "Build failed: Prisma client not generated"
- Should auto-run via `postinstall` script
- Manually run: `pnpm prisma generate`

### Issue: "Payment not working"
- Verify using TEST Stripe keys (start with `sk_test_`)
- Check webhook is configured
- Check webhook secret matches

### Issue: "Can't login to Vercel"
- Try: `vercel logout` then `vercel login`
- Or authenticate via browser: https://vercel.com/login

---

## 📚 Related Documentation

- **Full Deployment Guide**: `STAGING_DEPLOYMENT_GUIDE.md`
- **Test Plan**: `STAGING_TEST_PLAN.md`
- **Test Report**: `STAGING_TEST_REPORT.md`
- **Production Checklist**: `PRODUCTION_DEPLOYMENT_CHECKLIST.md`

---

## ✅ Current Status

You are here:
- [x] Vercel CLI installed
- [ ] Logged into Vercel  ← **YOU ARE HERE**
- [ ] Environment variables configured
- [ ] Database ready
- [ ] Deployed to staging
- [ ] Tests completed
- [ ] Ready for production

---

## 🎯 Next Steps

1. **Authenticate**: Run `vercel login` and complete authentication
2. **Configure**: Update `.env.staging` with real values
3. **Deploy**: Run `node scripts/deploy-staging.js`
4. **Test**: Follow `STAGING_TEST_PLAN.md`
5. **Fix**: Address any bugs found
6. **Deploy to Production**: Follow `PRODUCTION_DEPLOYMENT_CHECKLIST.md`

---

**Need Help?**
- Vercel Docs: https://vercel.com/docs
- Stripe Test Mode: https://stripe.com/docs/testing
- Neon Database: https://neon.tech/docs
- Project README: `README.md`

---

**Time Estimate:**
- Setup: 15-30 minutes
- Deployment: 5-10 minutes
- Testing: 1-2 hours
- Bug fixes: Variable
- Production deployment: 1-2 hours

**Total**: ~3-5 hours for complete staging → production flow

