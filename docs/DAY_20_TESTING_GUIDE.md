# ==========================================
# DAY 20 SECURITY TESTING GUIDE
# ==========================================
# Comprehensive testing plan for security features

## Prerequisites

```bash
# Ensure development server is running
pnpm dev

# Or for testing against production
# Set BASE_URL environment variable
export BASE_URL=http://localhost:3000
```

## 1. Rate Limiting Tests

### Test OTP Request Rate Limit (Per Phone)

```bash
# Should succeed (attempt 1)
curl -X POST http://localhost:3000/api/auth/request-otp \
  -H "Content-Type: application/json" \
  -d '{"phone": "+14155551234"}'

# Should succeed (attempt 2)
curl -X POST http://localhost:3000/api/auth/request-otp \
  -H "Content-Type: application/json" \
  -d '{"phone": "+14155551234"}'

# Should succeed (attempt 3)
curl -X POST http://localhost:3000/api/auth/request-otp \
  -H "Content-Type: application/json" \
  -d '{"phone": "+14155551234"}'

# Should fail with 429 (attempt 4 - exceeds limit of 3 per 5 min)
curl -X POST http://localhost:3000/api/auth/request-otp \
  -H "Content-Type: application/json" \
  -d '{"phone": "+14155551234"}' \
  -w "\nHTTP Status: %{http_code}\n"
```

**Expected Result:** 4th request returns 429 with rate limit message

### Test OTP Verify Rate Limit (Per IP)

```bash
# Run rapid-fire OTP verification attempts (should hit IP rate limit)
for i in {1..20}; do
  echo "Attempt $i:"
  curl -X POST http://localhost:3000/api/auth/verify-otp \
    -H "Content-Type: application/json" \
    -d '{"phone": "+14155551234", "otp": "123456"}' \
    -w "\nHTTP Status: %{http_code}\n"
  sleep 0.5
done
```

**Expected Result:** After 15 attempts, should return 429

---

## 2. OTP Brute-Force Protection

### Test Account Lockout

```bash
# Make 6 failed OTP verification attempts (limit is 5 in 10 min)
for i in {1..6}; do
  echo "Failed attempt $i:"
  curl -X POST http://localhost:3000/api/auth/verify-otp \
    -H "Content-Type: application/json" \
    -d "{\"phone\": \"+14155556789\", \"otp\": \"99999$i\"}" \
    -w "\nHTTP Status: %{http_code}\n"
  sleep 1
done

# 7th attempt should return 423 (Locked)
curl -X POST http://localhost:3000/api/auth/verify-otp \
  -H "Content-Type: application/json" \
  -d '{"phone": "+14155556789", "otp": "123456"}' \
  -w "\nHTTP Status: %{http_code}\n"
```

**Expected Result:** After 5 failed attempts, returns 423 with "Account temporarily locked" message

---

## 3. RBAC (Role-Based Access Control) Tests

### Test Member Access to Admin Endpoint

```bash
# Login as Member first (replace with actual OTP flow)
# Then try to access admin-only endpoint

# Get member token (mock for testing)
MEMBER_TOKEN="<member_jwt_token>"

# Try to access admin endpoint - should fail with 403
curl -X GET http://localhost:3000/api/admin/rooms \
  -H "Authorization: Bearer $MEMBER_TOKEN" \
  -w "\nHTTP Status: %{http_code}\n"
```

**Expected Result:** 403 Forbidden with RBAC error

### Test Admin Access to Admin Endpoint

```bash
# Get admin token
ADMIN_TOKEN="<admin_jwt_token>"

# Should succeed with 200
curl -X GET http://localhost:3000/api/admin/rooms \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -w "\nHTTP Status: %{http_code}\n"
```

**Expected Result:** 200 OK with data

---

## 4. CSRF Protection Tests

### Test Missing CSRF Token

```bash
# Try POST without CSRF token - should fail
curl -X POST http://localhost:3000/api/bookings \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{"roomTypeId": "123", "checkIn": "2025-01-01"}' \
  -w "\nHTTP Status: %{http_code}\n"
```

**Expected Result:** 403 with CSRF error (if CSRF is enforced on this endpoint)

### Test Valid CSRF Token

```bash
# Get CSRF token first (from cookie or endpoint)
# Then include in request

CSRF_TOKEN="<csrf_token_from_cookie>"

curl -X POST http://localhost:3000/api/bookings \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -H "X-CSRF-Token: $CSRF_TOKEN" \
  -d '{"roomTypeId": "123", "checkIn": "2025-01-01", "csrfToken": "'$CSRF_TOKEN'"}' \
  -w "\nHTTP Status: %{http_code}\n"
```

**Expected Result:** 200 OK (or appropriate response based on business logic)

---

## 5. Refresh Token Rotation Tests

### Test Token Refresh

```bash
# Request refresh token
curl -X POST http://localhost:3000/api/auth/refresh \
  -H "Content-Type: application/json" \
  -b "refresh-token=<refresh_token>" \
  -c cookies.txt \
  -w "\nHTTP Status: %{http_code}\n"

# Verify new tokens in response and cookies
cat cookies.txt
```

**Expected Result:** New access and refresh tokens issued

### Test Refresh Token Reuse (Should Fail)

```bash
# Use the same refresh token again - should fail
curl -X POST http://localhost:3000/api/auth/refresh \
  -H "Content-Type: application/json" \
  -b "refresh-token=<old_refresh_token>" \
  -w "\nHTTP Status: %{http_code}\n"
```

**Expected Result:** 401 Unauthorized (token already used/rotated)

---

## 6. Input Validation Tests

### Test Invalid Phone Format

```bash
# Invalid phone (no country code)
curl -X POST http://localhost:3000/api/auth/request-otp \
  -H "Content-Type: application/json" \
  -d '{"phone": "1234567890"}' \
  -w "\nHTTP Status: %{http_code}\n"

# Invalid phone (letters)
curl -X POST http://localhost:3000/api/auth/request-otp \
  -H "Content-Type: application/json" \
  -d '{"phone": "+1-abc-def-ghij"}' \
  -w "\nHTTP Status: %{http_code}\n"
```

**Expected Result:** 400 with validation error

### Test Invalid OTP Format

```bash
# OTP too short
curl -X POST http://localhost:3000/api/auth/verify-otp \
  -H "Content-Type: application/json" \
  -d '{"phone": "+14155551234", "otp": "123"}' \
  -w "\nHTTP Status: %{http_code}\n"

# OTP with letters
curl -X POST http://localhost:3000/api/auth/verify-otp \
  -H "Content-Type: application/json" \
  -d '{"phone": "+14155551234", "otp": "12345a"}' \
  -w "\nHTTP Status: %{http_code}\n"
```

**Expected Result:** 400 with validation error

---

## 7. Security Headers Tests

### Test Security Headers Present

```bash
# Check all security headers
curl -I http://localhost:3000/

# Should see:
# Content-Security-Policy: ...
# X-Frame-Options: DENY
# X-Content-Type-Options: nosniff
# Referrer-Policy: strict-origin-when-cross-origin
# Strict-Transport-Security: ... (production only)
```

**Expected Result:** All security headers present in response

---

## 8. Error Handling Tests

### Test Error Sanitization (No Stack Traces)

```bash
# Trigger an internal error (e.g., invalid database query)
# Verify response doesn't contain:
# - Stack traces
# - File paths
# - Database queries
# - Environment variables

curl -X POST http://localhost:3000/api/test-error \
  -H "Content-Type: application/json" \
  -d '{"trigger": "error"}'
```

**Expected Result:** Generic error message without sensitive details

---

## 9. Audit Logging Tests

### Verify Admin Actions are Logged

```bash
# Perform admin action (e.g., override booking confirmation)
# Then check database for audit log entry

# Example query (SQLite):
sqlite3 prisma/dev.db "SELECT * FROM admin_audit_logs ORDER BY created_at DESC LIMIT 5;"
```

**Expected Result:** Admin action recorded with all details (admin ID, action, target, reason, timestamp)

### Verify Security Events are Logged

```bash
# Check security_events table after rate limit or failed OTP
sqlite3 prisma/dev.db "SELECT * FROM security_events ORDER BY occurred_at DESC LIMIT 10;"
```

**Expected Result:** Security events logged with proper severity and metadata

---

## 10. Automated Test Suite

### Run TypeScript Tests

```typescript
// Create test file: src/tests/security.test.ts

import { describe, it, expect } from 'vitest'
import { getRateLimiter, RATE_LIMIT_PRESETS } from '@/lib/rateLimiter'
import { validateOrThrow, CommonSchemas } from '@/lib/validation'
import { requireRole, hasRole } from '@/lib/rbac'

describe('Rate Limiter', () => {
  it('should allow requests within limit', async () => {
    const limiter = getRateLimiter()
    const result = await limiter.checkLimit('test-key', {
      maxRequests: 5,
      windowSeconds: 60,
    })
    expect(result.allowed).toBe(true)
  })

  it('should block requests exceeding limit', async () => {
    const limiter = getRateLimiter()
    const config = { maxRequests: 2, windowSeconds: 60 }

    // Make 3 requests
    await limiter.checkLimit('test-key-2', config)
    await limiter.checkLimit('test-key-2', config)
    const result = await limiter.checkLimit('test-key-2', config)

    expect(result.allowed).toBe(false)
  })
})

describe('Input Validation', () => {
  it('should validate correct phone format', () => {
    expect(() => validateOrThrow(CommonSchemas.phone, '+14155551234')).not.toThrow()
  })

  it('should reject invalid phone format', () => {
    expect(() => validateOrThrow(CommonSchemas.phone, '1234567890')).toThrow()
  })

  it('should validate 6-digit OTP', () => {
    expect(() => validateOrThrow(CommonSchemas.otpCode, '123456')).not.toThrow()
  })

  it('should reject invalid OTP', () => {
    expect(() => validateOrThrow(CommonSchemas.otpCode, '12345')).toThrow()
    expect(() => validateOrThrow(CommonSchemas.otpCode, '12345a')).toThrow()
  })
})
```

```bash
# Run tests
pnpm test src/tests/security.test.ts
```

---

## 11. Production Readiness Checklist

Before deploying to production:

- [ ] Replace in-memory rate limiter with Redis
- [ ] Set proper JWT secrets (not defaults)
- [ ] Enable HTTPS and set Strict-Transport-Security
- [ ] Configure CSP to remove 'unsafe-inline' and 'unsafe-eval'
- [ ] Set up error tracking (Sentry, DataDog)
- [ ] Configure SIEM for security event monitoring
- [ ] Set up alerts for high-severity security events
- [ ] Test refresh token rotation in production environment
- [ ] Verify audit logs are being written
- [ ] Test CSRF protection on all state-changing endpoints
- [ ] Run vulnerability scan (npm audit, Snyk)
- [ ] Review and test RBAC for all endpoints
- [ ] Set up monitoring for rate limit metrics
- [ ] Document incident response procedures

---

## Postman Collection

Import this collection for easier testing:

```json
{
  "info": {
    "name": "Hotel Booking - Security Tests",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  "item": [
    {
      "name": "OTP Request - Rate Limit Test",
      "request": {
        "method": "POST",
        "header": [{"key": "Content-Type", "value": "application/json"}],
        "body": {
          "mode": "raw",
          "raw": "{\"phone\": \"+14155551234\"}"
        },
        "url": "{{baseUrl}}/api/auth/request-otp"
      }
    },
    {
      "name": "OTP Verify - Brute Force Test",
      "request": {
        "method": "POST",
        "header": [{"key": "Content-Type", "value": "application/json"}],
        "body": {
          "mode": "raw",
          "raw": "{\"phone\": \"+14155551234\", \"otp\": \"999999\"}"
        },
        "url": "{{baseUrl}}/api/auth/verify-otp"
      }
    },
    {
      "name": "Admin Endpoint - RBAC Test",
      "request": {
        "method": "GET",
        "header": [{"key": "Authorization", "value": "Bearer {{accessToken}}"}],
        "url": "{{baseUrl}}/api/admin/rooms"
      }
    }
  ],
  "variable": [
    {"key": "baseUrl", "value": "http://localhost:3000"}
  ]
}
```

Save as `security-tests.postman_collection.json` and import into Postman.
