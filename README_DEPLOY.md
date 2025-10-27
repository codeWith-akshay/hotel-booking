# Production Deployment Guide

## Hotel Booking System - Next.js 16

Complete guide for deploying the Hotel Booking application to production on Vercel.

---

## 📋 Pre-Deployment Checklist

### ✅ Code Quality
- [x] All TypeScript compilation errors resolved
- [x] Zod v4 API migrations complete
- [x] Deprecated Tailwind classes updated
- [x] Zero linting errors
- [x] Production build successful

### ✅ Backend Enhancements
- [x] Room availability API endpoint (`/api/rooms/availability`)
- [x] Email delivery stub for invoices (SendGrid/Postmark ready)
- [x] Cron job for booking reminders (`/api/cron/booking-reminders`)
- [x] Vercel cron configuration added

### ✅ Security
- [x] Environment variables properly configured
- [x] JWT secrets set
- [x] Stripe webhook secrets configured
- [x] CORS headers configured
- [x] Rate limiting in place

---

## 🚀 Quick Start Deployment

### Step 1: Environment Variables

Create a `.env.production` file with the following required variables:

```bash
# Database
DATABASE_URL="postgresql://user:password@host:5432/dbname"

# Authentication
JWT_ACCESS_SECRET="your-super-secret-jwt-key-change-this-in-production"
JWT_REFRESH_SECRET="your-refresh-secret-change-this-in-production"
OTP_SECRET="your-otp-secret-key"

# Stripe Payment
STRIPE_SECRET_KEY="sk_live_..."
STRIPE_PUBLISHABLE_KEY="pk_live_..."
STRIPE_WEBHOOK_SECRET="whsec_..."
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_live_..."

# Email (Optional - for invoice delivery)
SENDGRID_API_KEY="SG...."
# OR
POSTMARK_API_KEY="..."

# WhatsApp (Optional)
WHATSAPP_API_KEY="stub-for-now"
WHATSAPP_PHONE_NUMBER_ID="stub-for-now"

# Cron Job Security
CRON_SECRET="your-cron-secret-key-for-vercel"

# App Configuration
NEXT_PUBLIC_APP_URL="https://your-domain.vercel.app"
NODE_ENV="production"
```

### Step 2: Install Dependencies

```bash
cd c:\Users\aksha\Desktop\hotel-booking
pnpm install --frozen-lockfile
```

### Step 3: Generate Prisma Client

```bash
pnpm prisma generate
```

### Step 4: Run Database Migrations

```bash
# For new production database
pnpm prisma migrate deploy

# For development database sync
pnpm prisma db push
```

### Step 5: Seed Database (First Deployment Only)

```bash
pnpm prisma db seed
```

This creates:
- Default roles (MEMBER, ADMIN, SUPERADMIN)
- Admin user account
- Sample room types
- Booking rules and special days

### Step 6: Build for Production

```bash
pnpm build
```

Expected output:
```
✓ Compiled successfully
✓ Linting and checking validity of types
✓ Collecting page data
✓ Generating static pages (X/X)
✓ Finalizing page optimization

Route (app)                              Size     First Load JS
┌ ○ /                                    ...
├ ○ /dashboard                           ...
├ ○ /admin                               ...
└ ○ /api/...                             ...
```

### Step 7: Deploy to Vercel

#### Option A: Vercel CLI

```bash
# Install Vercel CLI (if not installed)
pnpm add -g vercel

# Login to Vercel
vercel login

# Deploy to production
vercel --prod
```

#### Option B: GitHub Integration

1. Push code to GitHub:
```bash
git add .
git commit -m "Production deployment ready"
git push origin main
```

2. Connect repository in Vercel dashboard:
   - Go to https://vercel.com/new
   - Import your GitHub repository
   - Configure environment variables
   - Deploy

---

## 🔧 Vercel Configuration

The `vercel.json` file includes:

### Cron Jobs

```json
{
  "crons": [
    {
      "path": "/api/cron/send-notifications",
      "schedule": "*/5 * * * *"
    },
    {
      "path": "/api/cron/cleanup-expired-tokens",
      "schedule": "0 2 * * *"
    },
    {
      "path": "/api/cron/booking-reminders",
      "schedule": "0 9 * * *"
    }
  ]
}
```

**Cron Schedule Explanation:**
- `*/5 * * * *` = Every 5 minutes (notifications)
- `0 2 * * *` = Daily at 2:00 AM (token cleanup)
- `0 9 * * *` = Daily at 9:00 AM (booking reminders)

### Environment Variables in Vercel

Add these in Vercel Dashboard → Settings → Environment Variables:

1. **Production Variables:**
   - `DATABASE_URL`
   - `JWT_ACCESS_SECRET`
   - `STRIPE_SECRET_KEY`
   - `STRIPE_WEBHOOK_SECRET`
   - `CRON_SECRET`
   
2. **Public Variables:**
   - `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
   - `NEXT_PUBLIC_APP_URL`

---

## 🧪 Post-Deployment Testing

### 1. Health Check

```bash
curl https://your-domain.vercel.app/api/health
```

Expected response:
```json
{
  "status": "ok",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

### 2. Room Availability API

```bash
curl "https://your-domain.vercel.app/api/rooms/availability?roomType=Deluxe&startDate=2024-12-25T00:00:00Z&endDate=2024-12-26T00:00:00Z"
```

Expected response:
```json
{
  "success": true,
  "data": {
    "roomTypeId": "...",
    "roomTypeName": "Deluxe",
    "totalRooms": 10,
    "bookedRooms": 3,
    "availableCount": 7,
    "dateRange": {
      "startDate": "2024-12-25T00:00:00.000Z",
      "endDate": "2024-12-26T00:00:00.000Z"
    }
  }
}
```

### 3. Authentication Flow

1. Login: `POST /api/auth/login`
2. Verify OTP: `POST /api/auth/verify-otp`
3. Check session: `GET /api/auth/me`

### 4. Booking Flow

1. Check availability
2. Create booking: `POST /api/bookings`
3. Process payment: `POST /api/payments/create-stripe-intent`
4. Confirm booking after payment

### 5. Admin Dashboard

Navigate to: `https://your-domain.vercel.app/admin`
- Login with admin credentials
- Verify booking management
- Test invoice generation

### 6. Cron Job (Manual Test)

```bash
curl https://your-domain.vercel.app/api/cron/booking-reminders \
  -H "Authorization: Bearer YOUR_CRON_SECRET"
```

---

## 🔒 Security Checklist

- [x] Environment variables set in Vercel (not in code)
- [x] CORS configured for production domain only
- [x] Rate limiting enabled on API routes
- [x] JWT secrets are strong and unique
- [x] Stripe webhook signatures verified
- [x] Cron jobs protected with secret
- [x] SQL injection prevention (Prisma ORM)
- [x] XSS protection (React sanitization)

---

## 📊 Performance Optimization

### Next.js Features Used:
- **App Router** for optimal routing
- **Server Components** for reduced client bundle
- **API Routes** for backend logic
- **Middleware** for authentication
- **Image Optimization** (Next.js `<Image />`)

### Database Optimization:
- Indexed queries on frequently accessed fields
- Prisma query optimization
- Connection pooling enabled

### Monitoring:
- Vercel Analytics enabled
- Error tracking via console logs
- Performance metrics in Vercel dashboard

---

## 🐛 Troubleshooting

### Build Fails

**Error:** TypeScript compilation error
**Solution:** Run `pnpm build` locally first, fix all errors

**Error:** Prisma client not generated
**Solution:** Ensure `prisma generate` runs in `prebuild` script

### Runtime Errors

**Error:** Database connection timeout
**Solution:** Check `DATABASE_URL` in Vercel environment variables

**Error:** Stripe webhook failing
**Solution:** Update webhook endpoint in Stripe Dashboard to production URL

**Error:** Cron jobs not running
**Solution:** Verify `vercel.json` cron configuration, check Vercel logs

### Payment Issues

**Error:** Stripe payment fails
**Solution:**
1. Verify `STRIPE_SECRET_KEY` is correct (live key, not test)
2. Check webhook secret matches Stripe dashboard
3. Ensure webhook endpoint is accessible: `/api/webhooks/stripe`

---

## 📱 Mobile Responsiveness

Tested viewports:
- ✅ Mobile: 375px - 414px
- ✅ Tablet: 768px - 1024px
- ✅ Desktop: 1440px+

---

## 🎯 Production Checklist

### Before Go-Live:
- [ ] Database backups configured
- [ ] Error monitoring setup (Sentry/LogRocket)
- [ ] Load testing completed
- [ ] SSL certificate active (auto via Vercel)
- [ ] Custom domain configured
- [ ] Email templates finalized
- [ ] SMS provider configured (optional)
- [ ] Legal pages added (Terms, Privacy)

### After Go-Live:
- [ ] Monitor Vercel logs for errors
- [ ] Check database connection pool
- [ ] Verify cron jobs running
- [ ] Test full booking flow
- [ ] Confirm payment processing
- [ ] Check invoice generation
- [ ] Test email delivery

---

## 📞 Support & Maintenance

### Regular Maintenance:
- Weekly: Check error logs
- Monthly: Review database size
- Quarterly: Update dependencies
- Annually: Renew SSL certificates (auto)

### Emergency Contacts:
- Database: [Your DB Provider]
- Payments: Stripe Support
- Hosting: Vercel Support
- DNS: [Your DNS Provider]

---

## 📚 Additional Resources

- [Next.js Deployment Docs](https://nextjs.org/docs/deployment)
- [Vercel Platform Docs](https://vercel.com/docs)
- [Prisma Production Guide](https://www.prisma.io/docs/guides/deployment)
- [Stripe Integration](https://stripe.com/docs/payments/accept-a-payment)

---

## ✨ Success Criteria

Your deployment is successful when:
- ✅ Build completes with zero errors
- ✅ All pages load without 500 errors
- ✅ Authentication flow works end-to-end
- ✅ Bookings can be created and confirmed
- ✅ Payments process successfully
- ✅ Invoices generate and download
- ✅ Admin dashboard is accessible
- ✅ Cron jobs run on schedule
- ✅ Mobile UI is responsive
- ✅ Performance metrics are green

---

**Last Updated:** $(date)
**Version:** 1.0.0
**Status:** Production Ready ✅
