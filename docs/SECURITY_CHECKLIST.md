# 🔒 SECURITY CHECKLIST - Production Deployment

## ✅ Pre-Deployment Security Checklist

### 1. Authentication & Session Management

- [ ] **JWT Secrets Changed**
  - [ ] `JWT_ACCESS_SECRET` set to cryptographically strong value (min 32 chars)
  - [ ] `JWT_REFRESH_SECRET` set to different strong value
  - [ ] Secrets stored in environment variables, NOT in code
  - [ ] Secrets rotated regularly (quarterly recommended)

- [ ] **Session Security**
  - [ ] HTTP-only cookies enabled for refresh tokens
  - [ ] Secure flag enabled (HTTPS only)
  - [ ] SameSite=Strict for sensitive cookies
  - [ ] Access tokens short-lived (15 min max)
  - [ ] Refresh tokens long-lived (7 days) with rotation
  - [ ] Refresh token storage uses hashing (SHA-256)

- [ ] **Token Management**
  - [ ] Refresh token rotation implemented and tested
  - [ ] Token blacklist/revocation working
  - [ ] Logout invalidates all tokens
  - [ ] "Logout all devices" implemented for security incidents

### 2. Rate Limiting & Brute-Force Protection

- [ ] **Redis Setup**
  - [ ] Redis instance provisioned for production
  - [ ] Rate limiter switched from in-memory to Redis
  - [ ] Redis connection pooling configured
  - [ ] Redis failover/backup configured

- [ ] **Rate Limits Configured**
  - [ ] OTP request: 3 per 5 min per phone
  - [ ] OTP request: 10 per 15 min per IP
  - [ ] OTP verify: 5 per 10 min per phone
  - [ ] OTP verify: 15 per 10 min per IP
  - [ ] General API: 100 req/min per user
  - [ ] Admin API: 10 req/min for sensitive ops

- [ ] **Brute-Force Protection**
  - [ ] Account locking after 5 failed OTP attempts
  - [ ] Lock duration: 10 minutes minimum
  - [ ] Unlock mechanism implemented (admin or time-based)
  - [ ] Failed attempts logged to security_events table

### 3. CSRF Protection

- [ ] **CSRF Implementation**
  - [ ] CSRF tokens generated for all sessions
  - [ ] Double-submit cookie pattern implemented
  - [ ] All POST/PUT/DELETE/PATCH endpoints protected
  - [ ] Exempt paths configured (webhooks, public APIs)
  - [ ] Origin validation enabled

- [ ] **CSRF Testing**
  - [ ] Tested missing CSRF token (should reject)
  - [ ] Tested invalid CSRF token (should reject)
  - [ ] Tested valid CSRF token (should accept)
  - [ ] Tested cross-origin requests (should reject)

### 4. RBAC (Role-Based Access Control)

- [ ] **RBAC Enforcement**
  - [ ] All server actions have `requireRole()` at top
  - [ ] All API routes check RBAC before processing
  - [ ] Role hierarchy properly implemented
  - [ ] Admin overrides require audit logging

- [ ] **RBAC Testing**
  - [ ] Member cannot access Admin endpoints
  - [ ] Admin cannot access SuperAdmin endpoints
  - [ ] Owner-or-Admin pattern works correctly
  - [ ] RBAC errors logged to security_events

### 5. Input Validation

- [ ] **Zod Validation**
  - [ ] All server actions validate input
  - [ ] All API routes validate input
  - [ ] Client-side forms use Zod schemas
  - [ ] Custom error messages user-friendly

- [ ] **Validation Coverage**
  - [ ] Phone number format validated
  - [ ] Email format validated
  - [ ] OTP format (6 digits) validated
  - [ ] Dates validated (ISO 8601)
  - [ ] IDs validated (CUID/UUID)
  - [ ] Amounts validated (non-negative integers)

### 6. Security Headers

- [ ] **Headers Configured**
  - [ ] Content-Security-Policy (CSP) set
  - [ ] X-Frame-Options: DENY
  - [ ] X-Content-Type-Options: nosniff
  - [ ] Referrer-Policy: strict-origin-when-cross-origin
  - [ ] Strict-Transport-Security (HSTS) enabled
  - [ ] X-XSS-Protection enabled
  - [ ] Permissions-Policy configured

- [ ] **CSP Hardening**
  - [ ] Removed 'unsafe-inline' for scripts
  - [ ] Removed 'unsafe-eval'
  - [ ] Allowlisted specific external domains only
  - [ ] Tested app still works with strict CSP
  - [ ] CSP violation reporting configured

### 7. Audit Logging

- [ ] **Admin Audit Logs**
  - [ ] All admin actions logged to admin_audit_logs
  - [ ] Logs include: adminId, action, target, changes, reason
  - [ ] Audit logs immutable (no DELETE permission)
  - [ ] Audit log queries tested and performant
  - [ ] Retention policy defined (e.g., 7 years)

- [ ] **Security Event Logs**
  - [ ] Failed login attempts logged
  - [ ] Rate limit violations logged
  - [ ] RBAC violations logged
  - [ ] CSRF violations logged
  - [ ] Suspicious activity logged
  - [ ] High-severity events trigger alerts

- [ ] **OTP Attempt Tracking**
  - [ ] All OTP requests logged
  - [ ] All OTP verifications logged
  - [ ] Failed attempts tracked per phone
  - [ ] Brute-force patterns detected

### 8. Error Handling

- [ ] **Error Sanitization**
  - [ ] No stack traces in production responses
  - [ ] No file paths leaked
  - [ ] No SQL queries leaked
  - [ ] No environment variables leaked
  - [ ] Generic error messages for users

- [ ] **Error Tracking**
  - [ ] Sentry/DataDog/Rollbar configured
  - [ ] Errors include context (userId, requestId)
  - [ ] Error alerts configured for critical errors
  - [ ] Error dashboard monitored

### 9. Database Security

- [ ] **Prisma Schema**
  - [ ] RefreshToken model created
  - [ ] OtpAttempt model created
  - [ ] SecurityEvent model created
  - [ ] AdminAuditLog model created
  - [ ] Indexes on security-related columns

- [ ] **Database Access**
  - [ ] Database credentials in secrets manager
  - [ ] Database firewall rules configured
  - [ ] SSL/TLS connections enforced
  - [ ] Backup and restore tested
  - [ ] Database audit logging enabled (if available)

### 10. Infrastructure Security

- [ ] **HTTPS/TLS**
  - [ ] Valid SSL/TLS certificate installed
  - [ ] HTTPS enforced (HTTP redirects to HTTPS)
  - [ ] TLS 1.2+ only (disable older versions)
  - [ ] Certificate auto-renewal configured

- [ ] **Secrets Management**
  - [ ] All secrets in environment variables
  - [ ] Secrets stored in vault (AWS Secrets Manager, Azure Key Vault, etc.)
  - [ ] No secrets in source code or logs
  - [ ] Secrets rotation procedure documented

- [ ] **Network Security**
  - [ ] Firewall rules configured (whitelist approach)
  - [ ] DDoS protection enabled (Cloudflare, AWS Shield)
  - [ ] WAF (Web Application Firewall) configured
  - [ ] API gateway rate limiting configured

### 11. Monitoring & Alerting

- [ ] **Security Monitoring**
  - [ ] SIEM integration configured (Splunk, ELK, etc.)
  - [ ] Real-time alerts for critical events
  - [ ] Dashboard for security metrics
  - [ ] Regular security report generation

- [ ] **Alert Channels**
  - [ ] Slack/Teams channel for security alerts
  - [ ] PagerDuty for critical incidents
  - [ ] Email alerts for admin actions
  - [ ] SMS alerts for production incidents

- [ ] **Metrics Tracked**
  - [ ] Failed login attempts per hour
  - [ ] Rate limit violations per hour
  - [ ] RBAC violations per day
  - [ ] Admin actions per day
  - [ ] Security events by severity

### 12. Dependency Security

- [ ] **Vulnerability Scanning**
  - [ ] `pnpm audit` run and issues resolved
  - [ ] Snyk or similar tool integrated
  - [ ] Automated dependency updates (Dependabot)
  - [ ] CI/CD pipeline includes security scan

- [ ] **Package Security**
  - [ ] Lock file (pnpm-lock.yaml) committed
  - [ ] Only trusted packages used
  - [ ] Unused dependencies removed
  - [ ] License compliance checked

### 13. Compliance & Standards

- [ ] **OWASP Top 10**
  - [ ] A01: Broken Access Control ✅ (RBAC implemented)
  - [ ] A02: Cryptographic Failures ✅ (HTTPS, hashing)
  - [ ] A03: Injection ✅ (Parameterized queries)
  - [ ] A04: Insecure Design ✅ (Security by design)
  - [ ] A05: Security Misconfiguration ✅ (Headers, CSP)
  - [ ] A06: Vulnerable Components ✅ (Dependency scanning)
  - [ ] A07: Authentication Failures ✅ (JWT, rate limiting)
  - [ ] A08: Software/Data Integrity ✅ (Audit logs)
  - [ ] A09: Security Logging Failures ✅ (Comprehensive logging)
  - [ ] A10: SSRF ✅ (Input validation, allowlists)

- [ ] **Regulatory Compliance**
  - [ ] GDPR: Right to erasure implemented
  - [ ] GDPR: Data export implemented
  - [ ] GDPR: Privacy policy updated
  - [ ] PCI-DSS: If handling cards (use Stripe, not store cards)
  - [ ] HIPAA: If health data (N/A for hotel booking)

### 14. Incident Response

- [ ] **Incident Response Plan**
  - [ ] Security incident procedures documented
  - [ ] Incident response team identified
  - [ ] Communication plan defined
  - [ ] Post-incident review process

- [ ] **Breach Detection**
  - [ ] Anomaly detection configured
  - [ ] Unusual login patterns monitored
  - [ ] Data exfiltration detection
  - [ ] Insider threat monitoring

### 15. Testing & Verification

- [ ] **Security Testing**
  - [ ] All manual tests from DAY_20_TESTING_GUIDE.md passed
  - [ ] Automated security tests passing
  - [ ] Penetration testing completed
  - [ ] Security code review completed

- [ ] **Load Testing**
  - [ ] Rate limiters tested under load
  - [ ] Redis performance verified
  - [ ] Database query performance verified
  - [ ] No performance degradation under security controls

---

## 🚀 Deployment Steps

### Phase 1: Pre-Deployment (1-2 days before)

1. **Environment Setup**
   ```bash
   # Set production environment variables
   JWT_ACCESS_SECRET=<generate-strong-secret>
   JWT_REFRESH_SECRET=<generate-strong-secret>
   REDIS_URL=<production-redis-url>
   DATABASE_URL=<production-database-url>
   SENTRY_DSN=<sentry-dsn>
   ```

2. **Database Migration**
   ```bash
   # Run migrations for new security tables
   pnpm prisma migrate deploy
   
   # Verify tables created
   # - refresh_tokens
   # - otp_attempts
   # - security_events
   # - admin_audit_logs
   ```

3. **Redis Setup**
   ```bash
   # Test Redis connection
   redis-cli -h <production-redis-host> ping
   
   # Configure Redis persistence (if not already)
   # Enable AOF (Append-Only File) for durability
   ```

### Phase 2: Deployment

1. **Deploy Application**
   ```bash
   # Build production bundle
   pnpm build
   
   # Deploy to hosting (Vercel, AWS, etc.)
   # Ensure all environment variables are set
   ```

2. **Verify Deployment**
   - [ ] Health check endpoint responds
   - [ ] Database connection working
   - [ ] Redis connection working
   - [ ] Security headers present in responses

### Phase 3: Post-Deployment

1. **Smoke Tests**
   - [ ] Login flow works end-to-end
   - [ ] Rate limiting functional
   - [ ] RBAC enforcement working
   - [ ] Audit logs being written

2. **Monitoring Setup**
   - [ ] Confirm logs flowing to SIEM
   - [ ] Verify alerts are configured
   - [ ] Check dashboard is updating

3. **Documentation**
   - [ ] Update runbook with security procedures
   - [ ] Document incident response contacts
   - [ ] Share security metrics dashboard link

---

## 📊 Security Metrics to Track

### Daily Metrics
- Failed login attempts
- Rate limit violations
- RBAC violations
- Admin actions

### Weekly Metrics
- Security events by severity
- Average response time (ensure security doesn't slow app)
- Dependency vulnerabilities found/fixed

### Monthly Metrics
- Security incidents (total and by type)
- Penetration test results
- Compliance audit status

---

## 🔧 Maintenance Tasks

### Weekly
- [ ] Review security event logs
- [ ] Check for dependency updates
- [ ] Review admin audit logs

### Monthly
- [ ] Rotate JWT secrets (optional, recommended quarterly)
- [ ] Review and update CSP rules
- [ ] Security training for team
- [ ] Review incident response plan

### Quarterly
- [ ] Penetration testing
- [ ] Security code review
- [ ] Compliance audit
- [ ] Rotate all production secrets

---

## 📞 Emergency Contacts

| Role | Name | Contact | Escalation |
|------|------|---------|------------|
| Security Lead | [Name] | [Email/Phone] | - |
| DevOps Lead | [Name] | [Email/Phone] | Security Lead |
| CTO/Engineering Lead | [Name] | [Email/Phone] | CEO |

---

## 🆘 Incident Response Quick Reference

### If Rate Limiting Fails
1. Check Redis connection
2. Verify Redis persistence
3. Check application logs for rate limiter errors
4. Fallback: Increase rate limits temporarily via config

### If Authentication Breach Suspected
1. Rotate all JWT secrets immediately
2. Invalidate all refresh tokens in database
3. Force all users to re-login
4. Review audit logs for suspicious activity
5. Notify affected users

### If DDoS Attack
1. Enable Cloudflare "Under Attack" mode
2. Adjust rate limits more aggressively
3. Block suspicious IPs via firewall
4. Scale infrastructure if needed

---

## ✅ Final Sign-Off

**Security Review Completed By:** _____________________ Date: _______

**Approved for Production By:** _____________________ Date: _______

**Deployment Completed By:** _____________________ Date: _______

---

_This checklist should be reviewed and updated quarterly or after any security incident._
