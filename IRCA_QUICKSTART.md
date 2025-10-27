# IRCA Integration - Quick Start Guide

## 🚀 Getting Started in 5 Minutes

Complete guide to set up and test the IRCA membership verification system.

---

## Step 1: Configure Environment Variables

Add the following to your `.env.local` file:

```bash
# Required - IRCA API Configuration
NEXT_PUBLIC_IRCA_API_URL=https://api.irca.org
IRCA_API_KEY=your-irca-api-key-here

# Optional - Use defaults if not specified
IRCA_API_TIMEOUT=10000              # 10 seconds
IRCA_API_RETRY_ATTEMPTS=3           # 3 retries
IRCA_API_RETRY_DELAY=1000           # 1 second
IRCA_API_CACHE_ENABLED=true         # Enable cache
IRCA_API_CACHE_DURATION=300000      # 5 minutes
```

**Get your IRCA API key:**
1. Contact IRCA support at `api-support@irca.org`
2. Request API credentials for your hotel
3. Copy the API key to `.env.local`

---

## Step 2: Test API Configuration

```typescript
// Test if IRCA service is configured
import { ircaService } from '@/lib/services/irca.service'

console.log('IRCA Configured:', ircaService.isConfigured())
// Should return: true
```

If it returns `false`, check:
- ✅ `.env.local` file exists
- ✅ `NEXT_PUBLIC_IRCA_API_URL` is set
- ✅ `IRCA_API_KEY` is set
- ✅ Restart development server

---

## Step 3: API Endpoints

### Link Membership

```http
POST /api/membership/link
Content-Type: application/json
Authorization: Bearer <user-session-token>

{
  "membershipId": "IRCA-2024-001"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "user-123",
      "name": "John Doe",
      "email": "john@example.com",
      "ircaMembershipId": "IRCA-2024-001"
    },
    "membership": {
      "membershipId": "IRCA-2024-001",
      "status": "active",
      "level": "Premium",
      "memberSince": "2024-01-01T00:00:00.000Z",
      "expiresAt": "2025-01-01T00:00:00.000Z",
      "duesAmount": 500,
      "duesPaid": true
    }
  },
  "message": "Membership linked successfully"
}
```

**Error Responses:**
- `401` - Unauthorized (not logged in)
- `400` - Invalid membership ID format
- `404` - Membership ID not found
- `409` - Membership already linked to another account
- `503` - IRCA API unavailable
- `504` - Verification timeout

### Unlink Membership

```http
POST /api/membership/unlink
Authorization: Bearer <user-session-token>
```

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "user-123",
      "name": "John Doe",
      "email": "john@example.com",
      "ircaMembershipId": null
    }
  },
  "message": "Membership unlinked successfully"
}
```

### Verify Membership

```http
GET /api/membership/verify?membershipId=IRCA-2024-001
Authorization: Bearer <user-session-token>
```

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "membership": {
      "membershipId": "IRCA-2024-001",
      "status": "active",
      "level": "Premium",
      ...
    },
    "isValid": true,
    "daysUntilExpiry": 365
  }
}
```

---

## Step 4: Use in Your Code

### Check Membership in Server Actions

```typescript
'use server'

import { ircaService } from '@/lib/services/irca.service'
import { getCurrentUser } from '@/lib/middleware/auth.utils'
import { prisma } from '@/lib/prisma'

export async function verifyUserMembership() {
  const user = await getCurrentUser()
  if (!user) {
    return { success: false, error: 'Unauthorized' }
  }

  // Get user's membership ID
  const userData = await prisma.user.findUnique({
    where: { id: user.userId },
    select: { ircaMembershipId: true },
  })

  if (!userData?.ircaMembershipId) {
    return { success: false, error: 'No membership linked' }
  }

  // Verify with IRCA (uses cache if available)
  const result = await ircaService.checkMembership(userData.ircaMembershipId)

  if (result.success && result.data) {
    return {
      success: true,
      data: {
        membership: result.data,
        isValid: ircaService.isMembershipValid(result.data),
      },
    }
  }

  return { success: false, error: result.message }
}
```

### Display Membership in UI

```tsx
'use client'

import { useState, useEffect } from 'react'
import { ircaService } from '@/lib/services/irca.service'

export function MembershipBadge({ membership }: { membership: IRCAMembershipData }) {
  const badge = ircaService.getStatusBadge(membership.status)
  const levelInfo = ircaService.getLevelDetails(membership.level)
  const daysUntilExpiry = ircaService.getDaysUntilExpiry(membership)

  return (
    <div className="membership-badge">
      <span 
        className={`status-badge status-${badge.color}`}
      >
        {badge.label}
      </span>
      <div className="membership-info">
        <h3>{levelInfo.name} Member</h3>
        <p>Annual Fee: ₹{levelInfo.annualFee}</p>
        {daysUntilExpiry !== null && (
          <p>
            {daysUntilExpiry > 0 
              ? `Expires in ${daysUntilExpiry} days` 
              : 'Expired'}
          </p>
        )}
      </div>
    </div>
  )
}
```

---

## Step 5: Test with cURL

### Test Link Membership
```bash
curl -X POST http://localhost:3000/api/membership/link \
  -H "Content-Type: application/json" \
  -H "Cookie: your-session-cookie" \
  -d '{"membershipId":"IRCA-2024-001"}'
```

### Test Verify Membership
```bash
curl -X GET "http://localhost:3000/api/membership/verify?membershipId=IRCA-2024-001" \
  -H "Cookie: your-session-cookie"
```

### Test Unlink Membership
```bash
curl -X POST http://localhost:3000/api/membership/unlink \
  -H "Cookie: your-session-cookie"
```

---

## Troubleshooting

### Error: "IRCA service is not properly configured"

**Solution:**
1. Check `.env.local` has `NEXT_PUBLIC_IRCA_API_URL` and `IRCA_API_KEY`
2. Restart development server: `npm run dev`
3. Verify environment variables are loaded:
   ```typescript
   console.log(process.env.NEXT_PUBLIC_IRCA_API_URL)
   console.log(process.env.IRCA_API_KEY ? 'Set' : 'Not set')
   ```

### Error: "Membership ID not found"

**Causes:**
- Invalid membership ID format
- Membership doesn't exist in IRCA system
- Typo in membership ID

**Solution:**
- Verify ID format: Letters, numbers, and hyphens only
- Check with IRCA admin if ID is registered
- Test with a known valid ID

### Error: "Verification timed out"

**Causes:**
- Slow network connection
- IRCA API is down
- Timeout too short

**Solution:**
1. Increase timeout in `.env.local`:
   ```bash
   IRCA_API_TIMEOUT=30000  # 30 seconds
   ```
2. Check IRCA API status manually:
   ```bash
   curl https://api.irca.org/health
   ```
3. Try again later if IRCA is down

### Error: "This membership ID is already linked"

**Cause:** Membership ID is linked to another user account

**Solution:**
1. User must unlink from other account first
2. Or contact support to manually unlink
3. Check database:
   ```sql
   SELECT * FROM User WHERE ircaMembershipId = 'IRCA-2024-001';
   ```

---

## Performance Tips

### 1. Cache Hit Rate
Monitor cache effectiveness:
```typescript
// Check cache before manual verification
const cached = await ircaService.checkMembership(id) // Uses cache
const fresh = await ircaService.checkMembership(id, true) // Bypasses cache

console.log('Same data:', cached.data === fresh.data)
```

### 2. Batch Verification
Verify multiple memberships efficiently:
```typescript
const membershipIds = ['IRCA-001', 'IRCA-002', 'IRCA-003']
const results = await ircaService.checkMultipleMemberships(membershipIds)

results.forEach(({ membershipId, result }) => {
  if (result.success) {
    console.log(`${membershipId}: ${result.data.status}`)
  } else {
    console.error(`${membershipId}: ${result.error}`)
  }
})
```

### 3. Clear Cache When Needed
```typescript
// Clear specific membership cache
ircaService.clearCache('IRCA-2024-001')

// Clear all cached memberships
ircaService.clearCache()
```

---

## Next Steps

1. **Test in Staging**: Deploy to staging environment and test with real IRCA API
2. **Monitor Errors**: Set up Sentry or similar to track API failures
3. **Add Analytics**: Track cache hit rate and API response times
4. **User Feedback**: Add loading states and clear error messages
5. **Admin Tools**: Build admin panel to view membership stats

---

## Useful Commands

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Test TypeScript compilation
npx tsc --noEmit

# Check for linting errors
npm run lint

# Run tests (if available)
npm test
```

---

## API Reference

### IRCAMembershipData Type
```typescript
interface IRCAMembershipData {
  membershipId: string
  status: 'active' | 'expired' | 'pending' | 'suspended' | 'cancelled'
  level: 'Basic' | 'Standard' | 'Premium' | 'Corporate' | 'Lifetime'
  memberSince: string       // ISO date
  expiresAt: string | null  // ISO date or null for lifetime
  duesAmount: number        // Annual fee
  duesPaid: boolean         // Payment status
  benefits: string[]        // List of benefits
  lastVerified: string      // ISO date (added by system)
}
```

### IRCAResponse Type
```typescript
interface IRCAResponse {
  success: boolean
  data: IRCAMembershipData | null
  error?: string
  message?: string
}
```

---

## Support

- **IRCA API Issues**: api-support@irca.org
- **Integration Help**: Check `IRCA_INTEGRATION_SUMMARY.md`
- **Bug Reports**: Create GitHub issue with `[IRCA]` prefix

---

**Status**: ✅ Ready for Production  
**Last Updated**: January 2025  
**Version**: 1.0.0
