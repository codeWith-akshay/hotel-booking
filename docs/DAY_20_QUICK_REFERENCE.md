# 🔒 DAY 20 SECURITY - QUICK REFERENCE

## 🚀 Quick Start

### 1. Authenticate User
```typescript
import { getCurrentUser } from '@/lib/middleware/auth.utils'

const user = await getCurrentUser()
if (!user) {
  // User not authenticated
  return { error: 'Please log in' }
}
```

### 2. Check Roles (RBAC)
```typescript
import { requireRole, requireAuth } from '@/lib/rbac'

// Any authenticated user
await requireAuth({ user })

// Specific role required
await requireRole({ user }, ['ADMIN', 'SUPERADMIN'])

// Owner or Admin
await requireOwnerOrAdmin({ user }, resourceOwnerId)
```

### 3. Validate Input
```typescript
import { validateOrThrow, CommonSchemas } from '@/lib/validation'
import { z } from 'zod'

const schema = z.object({
  phone: CommonSchemas.phone,
  email: CommonSchemas.email,
})

const data = validateOrThrow(schema, rawInput)
```

### 4. Rate Limiting
```typescript
import { getRateLimiter, RATE_LIMIT_PRESETS } from '@/lib/rateLimiter'

const limiter = getRateLimiter()
const result = await limiter.checkLimit(key, RATE_LIMIT_PRESETS.API_GENERAL)

if (!result.allowed) {
  return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 })
}
```

### 5. Audit Logging
```typescript
import { logAdminAction, logSecurityEvent } from '@/lib/audit'

// Admin actions
await logAdminAction({
  adminId: user.userId,
  action: 'OVERRIDE_CONFIRM',
  targetType: 'BOOKING',
  targetId: bookingId,
  reason: 'Customer paid cash',
})

// Security events
await logSecurityEvent({
  eventType: 'RATE_LIMIT_EXCEEDED',
  ip: clientIp,
  severity: 'MEDIUM',
  message: 'Too many login attempts',
})
```

### 6. Error Handling
```typescript
import { sanitizeError } from '@/lib/errorHandling'

try {
  // Your code
} catch (error) {
  return sanitizeError(error)
}
```

---

## 📦 Common Patterns

### Secure Server Action Template
```typescript
'use server'

import { getCurrentUser } from '@/lib/middleware/auth.utils'
import { requireRole } from '@/lib/rbac'
import { validateOrThrow } from '@/lib/validation'
import { sanitizeError } from '@/lib/errorHandling'
import { z } from 'zod'

const MySchema = z.object({
  // Define schema
})

export async function myAction(rawInput: unknown) {
  try {
    const input = validateOrThrow(MySchema, rawInput)
    const user = await getCurrentUser()
    await requireRole({ user }, ['ADMIN'])
    
    // Your business logic
    
    return { success: true, data: result }
  } catch (error) {
    return sanitizeError(error)
  }
}
```

### Secure API Route Template
```typescript
import { NextRequest, NextResponse } from 'next/server'
import { getRateLimiter, getClientIP } from '@/lib/rateLimiter'
import { validateOrThrow } from '@/lib/validation'
import { sanitizeError } from '@/lib/errorHandling'

export async function POST(request: NextRequest) {
  try {
    // Rate limit
    const limiter = getRateLimiter()
    const ip = getClientIP(request)
    const rateCheck = await limiter.checkLimit(ip, {
      maxRequests: 10,
      windowSeconds: 60,
    })
    
    if (!rateCheck.allowed) {
      return NextResponse.json({ error: 'Rate limit' }, { status: 429 })
    }
    
    // Validate
    const body = await request.json()
    const data = validateOrThrow(MySchema, body)
    
    // Process
    const result = await processData(data)
    
    return NextResponse.json({ success: true, data: result })
  } catch (error) {
    const sanitized = sanitizeError(error)
    return NextResponse.json(sanitized, { status: 400 })
  }
}
```

---

## 🔐 Security Checklist (Before Merge)

- [ ] Input validated with Zod
- [ ] User authenticated (if needed)
- [ ] RBAC checked (if protected)
- [ ] Rate limiting added (if public)
- [ ] Admin actions logged
- [ ] Errors sanitized
- [ ] Tests written
- [ ] Documentation updated

---

## 📊 Available Schemas

### Common Validators
```typescript
import { CommonSchemas } from '@/lib/validation'

CommonSchemas.phone        // +1234567890
CommonSchemas.email        // user@example.com
CommonSchemas.uuid         // UUID v4
CommonSchemas.cuid         // Prisma CUID
CommonSchemas.otpCode      // 6 digits
CommonSchemas.dateString   // ISO 8601
CommonSchemas.amount       // Non-negative integer
CommonSchemas.url          // Valid URL
```

### Rate Limit Presets
```typescript
import { RATE_LIMIT_PRESETS } from '@/lib/rateLimiter'

RATE_LIMIT_PRESETS.OTP_REQUEST_PHONE    // 3/5min
RATE_LIMIT_PRESETS.OTP_REQUEST_IP       // 10/15min
RATE_LIMIT_PRESETS.OTP_VERIFY_PHONE     // 5/10min
RATE_LIMIT_PRESETS.OTP_VERIFY_IP        // 15/10min
RATE_LIMIT_PRESETS.API_GENERAL          // 100/min
RATE_LIMIT_PRESETS.API_STRICT           // 10/min
RATE_LIMIT_PRESETS.LOGIN_ATTEMPTS       // 5/15min
```

---

## 🛠️ Utility Scripts

```bash
# View audit logs
pnpm security:audit-logs
pnpm security:audit-logs --admin-only
pnpm security:audit-logs --security-only

# Cleanup expired tokens (run daily/weekly)
pnpm security:cleanup-tokens

# Security scan
pnpm security:scan
pnpm security:check  # Scan + lint + typecheck
```

---

## 🧪 Testing

### Manual Tests
```bash
# Rate limit test
for i in {1..5}; do
  curl -X POST http://localhost:3000/api/auth/request-otp \
    -H "Content-Type: application/json" \
    -d '{"phone": "+1234567890"}'
done

# RBAC test (should fail)
curl -X GET http://localhost:3000/api/admin/rooms \
  -H "Authorization: Bearer <member_token>"

# Security headers
curl -I http://localhost:3000/
```

### Automated Tests
See `docs/DAY_20_TESTING_GUIDE.md` for comprehensive test suite.

---

## 🚨 Production Deployment

### Required Environment Variables
```bash
JWT_ACCESS_SECRET=<strong-secret-32+ chars>
JWT_REFRESH_SECRET=<different-strong-secret>
REDIS_URL=<production-redis-url>
DATABASE_URL=<production-db-url>
SENTRY_DSN=<sentry-dsn>
```

### Pre-Deployment Checklist
1. [ ] Run database migration: `pnpm prisma migrate deploy`
2. [ ] Switch rate limiter to Redis
3. [ ] Set strong JWT secrets
4. [ ] Enable HSTS in production
5. [ ] Harden CSP (remove unsafe-*)
6. [ ] Configure error tracking (Sentry)
7. [ ] Set up security alerts
8. [ ] Run all tests from testing guide

Full checklist: `docs/SECURITY_CHECKLIST.md`

---

## 📚 Documentation Files

- `docs/DAY_20_SUMMARY.md` - Complete implementation overview
- `docs/DAY_20_TESTING_GUIDE.md` - Comprehensive test suite
- `docs/SECURITY_CHECKLIST.md` - Production deployment guide
- `src/actions/secure-example.ts` - Server action examples

---

## 🔗 Key Files

**Security Libraries:**
- `src/lib/rbac.ts` - RBAC enforcement
- `src/lib/rateLimiter.ts` - Rate limiting
- `src/lib/csrf.ts` - CSRF protection
- `src/lib/auth/session.ts` - Token management
- `src/lib/audit.ts` - Audit logging
- `src/lib/errorHandling.ts` - Error sanitization
- `src/lib/validation/index.ts` - Zod validation

**Hardened Routes:**
- `src/app/api/auth/request-otp/route.ts`
- `src/app/api/auth/verify-otp/route.ts`

**Utility Scripts:**
- `scripts/view-audit-logs.ts`
- `scripts/cleanup-expired-tokens.ts`

---

## 💡 Pro Tips

1. **Always validate input** - Even from trusted sources
2. **Log admin actions** - Required for compliance
3. **Use transactions** - For multi-step operations
4. **Monitor metrics** - Rate limits, failed logins, RBAC violations
5. **Test in production-like env** - Redis, real secrets
6. **Keep docs updated** - Security evolves
7. **Regular audits** - Weekly review of security events
8. **Rotate secrets** - Quarterly recommended

---

## 🆘 Troubleshooting

### Rate Limiter Not Working
- Check Redis connection
- Verify `initRateLimiter()` called on startup
- Check rate limit config values

### RBAC Always Denying
- Verify user role in database
- Check role hierarchy (MEMBER < ADMIN < SUPERADMIN)
- Confirm `getCurrentUser()` returns user

### Audit Logs Not Appearing
- Run migration: `pnpm prisma migrate deploy`
- Check database tables exist
- Verify `logAdminAction()` called with correct params

### Tokens Not Rotating
- Check `refresh_tokens` table exists
- Verify refresh token in HTTP-only cookie
- Check token hasn't expired

---

**Need Help?** Check inline code comments or full documentation in `docs/` folder.

**Found a Security Issue?** Follow responsible disclosure process - report privately to security team.
