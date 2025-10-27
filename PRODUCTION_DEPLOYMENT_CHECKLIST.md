# ✅ Production Deployment Checklist - Hotel Booking Application

**Application**: Hotel Booking System  
**Environment**: Production  
**Target Platform**: Vercel  
**Deployment Date**: _____________  
**Deployed By**: _____________

---

## Pre-Deployment Checklist

### 1. Code & Testing

- [ ] All code changes merged to `main` branch
- [ ] All unit tests passing (`pnpm test`)
- [ ] All integration tests passing
- [ ] E2E tests passing (`pnpm e2e:headless`)
- [ ] Staging environment thoroughly tested
- [ ] All critical bugs fixed
- [ ] No known high-severity bugs
- [ ] Code review completed and approved
- [ ] Security audit completed
- [ ] Performance benchmarks met

### 2. Environment Configuration

- [ ] `.env.production` file created and verified
- [ ] All production environment variables documented
- [ ] Database connection string verified (production database)
- [ ] **Production** Stripe API keys configured (NOT test keys)
- [ ] Stripe webhook created for production URL
- [ ] NEXTAUTH_SECRET generated (unique, 32+ characters)
- [ ] NEXTAUTH_URL set to production domain
- [ ] CORS origins configured correctly
- [ ] Email service configured (if applicable)
- [ ] SMS service configured (if applicable)
- [ ] Redis/caching configured (if applicable)
- [ ] File storage configured (Vercel Blob/S3)
- [ ] Sentry DSN configured for error tracking

### 3. Database

- [ ] Production database created and accessible
- [ ] Database backup strategy in place
- [ ] Database backup tested and verified
- [ ] Pre-migration backup created
- [ ] Database migrations tested on staging
- [ ] Database connection limits verified
- [ ] Database SSL enabled
- [ ] Database credentials secured
- [ ] Read replicas configured (if applicable)
- [ ] Database monitoring enabled

### 4. Vercel Project Setup

- [ ] Vercel project created
- [ ] GitHub repository connected
- [ ] Production branch configured (`main`)
- [ ] Build command verified: `pnpm run build`
- [ ] Install command verified: `pnpm install --frozen-lockfile`
- [ ] Environment variables added to Vercel (Production)
- [ ] Custom domain configured (if applicable)
- [ ] SSL certificate verified
- [ ] Cron jobs configured (if applicable)

### 5. Third-Party Services

- [ ] **Stripe**: Production mode enabled
- [ ] **Stripe**: Webhook endpoint verified
- [ ] **Stripe**: Payment methods configured
- [ ] **Stripe**: Test transactions successful
- [ ] Email service: Production credentials verified
- [ ] SMS service: Production credentials verified (if used)
- [ ] Monitoring: Sentry configured
- [ ] Analytics: Vercel Analytics enabled
- [ ] CDN: Configured and tested (if applicable)

### 6. Security

- [ ] All sensitive data in environment variables (not code)
- [ ] `.env` files in `.gitignore`
- [ ] API keys rotated from staging
- [ ] HTTPS enforced
- [ ] Security headers configured
- [ ] CORS configured correctly
- [ ] Rate limiting enabled
- [ ] SQL injection prevention verified (Prisma ORM)
- [ ] XSS prevention verified
- [ ] CSRF protection enabled
- [ ] Input validation implemented
- [ ] Authentication routes protected
- [ ] Admin routes require admin role
- [ ] Session management secure

### 7. Performance

- [ ] Lighthouse score > 90 (desktop)
- [ ] Lighthouse score > 80 (mobile)
- [ ] Core Web Vitals in "Good" range
- [ ] Database queries optimized
- [ ] Indexes created on frequently queried fields
- [ ] Caching strategy implemented
- [ ] Image optimization enabled
- [ ] Code splitting configured
- [ ] Bundle size optimized
- [ ] CDN configured (if applicable)

### 8. Monitoring & Logging

- [ ] Error tracking configured (Sentry)
- [ ] Performance monitoring enabled
- [ ] Database monitoring enabled
- [ ] Alert thresholds configured
- [ ] On-call rotation established
- [ ] Incident response plan documented
- [ ] Vercel logs accessible
- [ ] Application logs structured

### 9. Documentation

- [ ] README.md updated
- [ ] API documentation complete
- [ ] User guides created
- [ ] Admin guides created
- [ ] Deployment guide updated
- [ ] Rollback procedure documented
- [ ] Troubleshooting guide available
- [ ] Environment variables documented

### 10. Legal & Compliance

- [ ] Privacy policy published
- [ ] Terms of service published
- [ ] Cookie policy published (if applicable)
- [ ] GDPR compliance verified (if applicable)
- [ ] PCI DSS compliance verified (for payments)
- [ ] Data retention policy documented
- [ ] User data export capability implemented

---

## Deployment Steps

### Step 1: Final Staging Verification

- [ ] All staging tests passed
- [ ] Test report reviewed and approved
- [ ] Stakeholder sign-off obtained
- [ ] No critical issues outstanding

### Step 2: Database Preparation

- [ ] Create full database backup
- [ ] Store backup in secure location
- [ ] Verify backup can be restored
- [ ] Document backup timestamp: ______________

### Step 3: Environment Variables

- [ ] Add all production env vars to Vercel project
- [ ] Verify env vars in Vercel dashboard
- [ ] Double-check DATABASE_URL points to production DB
- [ ] Double-check Stripe keys are PRODUCTION keys

### Step 4: Deploy to Production

**Option A: Via Vercel Dashboard**
- [ ] Navigate to Vercel project
- [ ] Click "Deploy" on main branch
- [ ] Monitor build logs
- [ ] Verify deployment successful

**Option B: Via Vercel CLI**
```bash
# Ensure on main branch
git checkout main
git pull origin main

# Deploy to production
vercel --prod
```

- [ ] Deployment command executed
- [ ] Deployment successful
- [ ] Production URL verified: ______________

### Step 5: Database Migrations

```bash
# Run migrations on production database
DATABASE_URL="production-db-url" pnpm prisma migrate deploy
```

- [ ] Migrations executed successfully
- [ ] Database schema verified
- [ ] No migration errors

### Step 6: Stripe Webhook Configuration

- [ ] Go to https://dashboard.stripe.com/webhooks (PRODUCTION)
- [ ] Add endpoint: `https://your-production-url.com/api/webhooks/stripe`
- [ ] Select events: `payment_intent.succeeded`, `payment_intent.payment_failed`
- [ ] Copy webhook signing secret
- [ ] Add `STRIPE_WEBHOOK_SECRET` to Vercel env vars
- [ ] Redeploy if needed: `vercel --prod --force`

### Step 7: Smoke Tests

**Homepage**
- [ ] Visit production URL
- [ ] Homepage loads correctly
- [ ] No console errors
- [ ] All images load
- [ ] Navigation works

**API Health**
- [ ] `/api/health` returns 200
- [ ] `/api/db/health` returns success

**Authentication**
- [ ] Signup flow works
- [ ] OTP sent and verified
- [ ] Login flow works
- [ ] Session persists

**Booking**
- [ ] Create test booking
- [ ] Payment processes (use real card in test mode if available)
- [ ] Booking confirmation received
- [ ] Invoice generated

**Admin**
- [ ] Admin login works
- [ ] Dashboard loads
- [ ] Can view bookings
- [ ] Can approve/cancel booking

### Step 8: Monitoring Setup

- [ ] Verify error tracking active (check Sentry)
- [ ] Verify logs streaming (check Vercel logs)
- [ ] Set up alert notifications
- [ ] Test alert system (trigger test error)

---

## Post-Deployment Verification

### Functional Testing

- [ ] User signup/login tested
- [ ] Room browsing works
- [ ] Booking creation works
- [ ] Payment processing works
- [ ] Invoice generation works
- [ ] Admin dashboard accessible
- [ ] All critical features functional

### Performance Testing

- [ ] Page load times acceptable (< 3s)
- [ ] API responses fast (< 500ms)
- [ ] No timeout errors
- [ ] Database queries optimized

### Security Testing

- [ ] HTTPS enforced
- [ ] Authentication required for protected routes
- [ ] Admin routes require admin role
- [ ] Rate limiting active
- [ ] No sensitive data exposed in responses

### Monitoring

- [ ] No errors in Sentry (last 30 minutes)
- [ ] No errors in Vercel logs (last 30 minutes)
- [ ] Performance metrics normal
- [ ] Database connections normal

---

## Rollback Plan

### If Critical Issues Detected

1. **Immediate Rollback**
   ```bash
   # Via Vercel Dashboard: Instant Rollback to previous deployment
   # Via CLI:
   vercel rollback
   ```

2. **Database Rollback (if needed)**
   ```bash
   # Restore from backup
   # Document exact steps in ROLLBACK_PROCEDURE.md
   ```

3. **Notify Stakeholders**
   - [ ] Engineering team notified
   - [ ] Product team notified
   - [ ] Management notified
   - [ ] Users notified (if significant downtime)

4. **Post-Mortem**
   - [ ] Root cause analysis
   - [ ] Document lessons learned
   - [ ] Update deployment checklist

---

## Communication Plan

### Before Deployment

- [ ] Engineering team notified (deployment window)
- [ ] Support team notified (expect potential issues)
- [ ] Stakeholders notified (deployment scheduled)

### During Deployment

- [ ] Status updates in team channel (Slack/Teams)
- [ ] Monitor logs actively
- [ ] Be ready to rollback

### After Deployment

- [ ] Success notification sent
- [ ] Summary email to stakeholders
- [ ] Post-deployment report filed

---

## Success Criteria

Deployment is considered successful when:

- [ ] Application accessible via production URL
- [ ] No critical errors in logs (1 hour after deployment)
- [ ] All smoke tests passed
- [ ] Performance metrics within acceptable range
- [ ] No user complaints (first 24 hours)
- [ ] Monitoring and alerts active
- [ ] Database healthy
- [ ] Payment processing working

---

## Rollback Triggers

Initiate rollback if:

- [ ] Application not accessible (> 5 minutes)
- [ ] Critical feature broken (auth, payments, bookings)
- [ ] Database connection failures
- [ ] Payment processing failures (> 3 consecutive failures)
- [ ] Error rate > 5% of requests
- [ ] Performance degradation > 50%
- [ ] Security vulnerability discovered

---

## Post-Deployment Tasks (24-48 hours)

### Day 1
- [ ] Monitor error rates
- [ ] Monitor performance metrics
- [ ] Monitor user feedback
- [ ] Monitor payment success rate
- [ ] Review logs for anomalies
- [ ] Check database performance

### Day 2
- [ ] Generate deployment report
- [ ] Update documentation based on deployment
- [ ] Schedule post-deployment retrospective
- [ ] Archive deployment artifacts
- [ ] Update runbook if needed

---

## Team Sign-Off

### Pre-Deployment Approval

- [ ] **Tech Lead**: _________________ Date: _______
- [ ] **QA Lead**: _________________ Date: _______
- [ ] **Product Owner**: _________________ Date: _______
- [ ] **DevOps/SRE**: _________________ Date: _______

### Post-Deployment Verification

- [ ] **Engineer**: _________________ Date: _______
- [ ] **QA**: _________________ Date: _______
- [ ] **Product**: _________________ Date: _______

---

## Deployment Metadata

| Field | Value |
|-------|-------|
| **Deployment Date** | _____________ |
| **Deployment Time** | _____________ |
| **Deployed By** | _____________ |
| **Git Commit** | _____________ |
| **Production URL** | _____________ |
| **Vercel Deployment ID** | _____________ |
| **Database Backup ID** | _____________ |
| **Rollback Plan** | See ROLLBACK_PROCEDURE.md |

---

## Emergency Contacts

| Role | Name | Contact |
|------|------|---------|
| **On-Call Engineer** | ________ | ________ |
| **Tech Lead** | ________ | ________ |
| **DevOps Lead** | ________ | ________ |
| **CTO** | ________ | ________ |
| **Vercel Support** | - | support@vercel.com |
| **Database Support** | - | ________ |
| **Stripe Support** | - | https://support.stripe.com |

---

## Notes

_Use this space to document any issues, observations, or deviations from the plan during deployment_

```
[Add notes here]
```

---

**Last Updated**: October 24, 2025  
**Version**: 1.0.0  
**Next Review**: After each production deployment

