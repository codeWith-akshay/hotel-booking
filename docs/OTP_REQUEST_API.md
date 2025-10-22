# OTP Request API Documentation

## Overview
Complete implementation of OTP (One-Time Password) request functionality for phone-based authentication.

## Architecture

### Files Created
```
src/
├── lib/
│   └── otp/
│       ├── otp.service.ts              # Core OTP utilities
│       └── __tests__/
│           └── request-otp.test.ts     # Integration tests
├── actions/
│   └── auth/
│       └── request-otp.action.ts       # Server action
└── app/
    └── api/
        └── auth/
            └── request-otp/
                └── route.ts            # API route handler
```

## API Endpoint

### POST /api/auth/request-otp

**Request Body:**
```json
{
  "phone": "+11234567890"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "OTP sent successfully",
  "data": {
    "phone": "+11234567890",
    "expiresIn": 300,
    "expiresAt": "2025-10-22T06:35:00.000Z"
  }
}
```

**Error Responses:**

*Invalid Phone (400):*
```json
{
  "success": false,
  "error": "Validation failed",
  "code": "INVALID_PHONE",
  "message": "Invalid phone number format..."
}
```

*Rate Limit Exceeded (429):*
```json
{
  "success": false,
  "error": "Rate limit exceeded",
  "code": "RATE_LIMIT_EXCEEDED",
  "message": "Too many OTP requests. Please try again..."
}
```

*Internal Error (500):*
```json
{
  "success": false,
  "error": "Internal server error",
  "code": "INTERNAL_ERROR",
  "message": "An unexpected error occurred..."
}
```

## Features Implemented

### ✅ 1. OTP Generation
- Random 6-digit numeric code
- Cryptographically secure generation
- Function: `generateOTP(): string`

### ✅ 2. Secure OTP Storage
- Bcrypt hashing (10 rounds)
- Never stores plain-text OTPs
- 5-minute expiration
- Auto-cleanup of expired OTPs
- Function: `hashOTP(otp: string): Promise<string>`

### ✅ 3. Rate Limiting
- **Limit:** 3 requests per 15 minutes per phone
- **Window:** Rolling 15-minute window
- **Tracking:** Per-phone-number basis
- **Response:** Returns remaining requests and reset time
- Function: `checkOTPRateLimit(phone: string): Promise<RateLimitResult>`

### ✅ 4. User Management
- Auto-creates user if phone doesn't exist
- Assigns MEMBER role to new users
- Temporary name: "User {last4digits}"
- Email field optional (null initially)

### ✅ 5. Mock SMS Service
- Development-friendly console logging
- Simulates network delay (500ms)
- 99% success rate simulation
- Returns mock message ID
- **Production:** Ready for Twilio/AWS SNS integration
- Function: `sendOTPSMS(phone: string, otp: string): Promise<SMSResult>`

### ✅ 6. Error Handling
- Comprehensive try-catch blocks
- Specific error codes for each scenario
- Detailed error messages
- Proper HTTP status codes
- Console logging for debugging

### ✅ 7. TypeScript Types
- Full type safety
- Zod schema validation
- Inferred types from schemas
- Documented interfaces

## Flow Diagram

```
┌─────────────────────────────────────────────────────────┐
│  1. Client sends POST /api/auth/request-otp             │
│     { phone: "+11234567890" }                           │
└──────────────────┬──────────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────────┐
│  2. Validate phone number (Zod schema)                  │
│     ✓ International format (+1...)                      │
│     ✓ Length (10-16 chars)                              │
└──────────────────┬──────────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────────┐
│  3. Check rate limit                                    │
│     ✓ Max 3 requests per 15 min                         │
│     ✗ Return 429 if exceeded                            │
└──────────────────┬──────────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────────┐
│  4. Find or create user                                 │
│     • Search by phone                                   │
│     • Create with MEMBER role if not exists             │
└──────────────────┬──────────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────────┐
│  5. Generate OTP                                        │
│     • Random 6-digit code                               │
│     • Example: 539297                                   │
└──────────────────┬──────────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────────┐
│  6. Hash OTP                                            │
│     • bcrypt with 10 salt rounds                        │
│     • Store hash, never plain text                      │
└──────────────────┬──────────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────────┐
│  7. Store in database                                   │
│     • userId, otpHash, expiresAt                        │
│     • Delete old expired OTPs                           │
└──────────────────┬──────────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────────┐
│  8. Send SMS                                            │
│     • Mock service in development                       │
│     • Logs to console                                   │
│     • Returns message ID                                │
└──────────────────┬──────────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────────┐
│  9. Return response                                     │
│     { success: true, data: { phone, expiresIn, ...} }   │
└─────────────────────────────────────────────────────────┘
```

## Configuration

### OTP Settings
```typescript
OTP_EXPIRY_MINUTES = 5        // OTP valid for 5 minutes
OTP_LENGTH = 6                // 6-digit code
BCRYPT_ROUNDS = 10            // Hash rounds for OTP
```

### Rate Limit Settings
```typescript
RATE_LIMIT_WINDOW = 15        // minutes
MAX_REQUESTS = 3              // requests per window
```

## Usage Examples

### 1. Using Server Action (Recommended)
```typescript
import { requestOTP } from '@/actions/auth/request-otp.action'

const result = await requestOTP('+11234567890')

if (result.success) {
  console.log('OTP sent!', result.data)
} else {
  console.error('Error:', result.message)
}
```

### 2. Using API Route
```typescript
const response = await fetch('/api/auth/request-otp', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ phone: '+11234567890' }),
})

const result = await response.json()
```

### 3. Using from React Component
```typescript
'use client'

import { requestOTP } from '@/actions/auth/request-otp.action'
import { useState } from 'react'

export function OTPRequestForm() {
  const [phone, setPhone] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    const result = await requestOTP(phone)
    
    if (result.success) {
      alert('OTP sent! Check your phone.')
    } else {
      alert(result.message)
    }

    setLoading(false)
  }

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="tel"
        value={phone}
        onChange={(e) => setPhone(e.target.value)}
        placeholder="+11234567890"
      />
      <button disabled={loading}>
        {loading ? 'Sending...' : 'Send OTP'}
      </button>
    </form>
  )
}
```

## Production Deployment

### 1. SMS Provider Integration

Replace mock SMS service with real provider:

**Twilio Example:**
```typescript
import twilio from 'twilio'

const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
)

export async function sendOTPSMS(phone: string, otp: string) {
  const message = await client.messages.create({
    body: `Your verification code is ${otp}. Valid for 5 minutes.`,
    from: process.env.TWILIO_PHONE_NUMBER,
    to: phone,
  })

  return {
    success: true,
    messageId: message.sid,
  }
}
```

### 2. Environment Variables
```env
# SMS Provider (Twilio)
TWILIO_ACCOUNT_SID=your_account_sid
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_PHONE_NUMBER=+1234567890

# Database
DATABASE_URL=your_production_database_url

# App
NODE_ENV=production
```

### 3. OTP Cleanup Cron Job

Set up periodic cleanup of expired OTPs:

```typescript
import { cleanupExpiredOTPs } from '@/lib/otp/otp.service'

// Run every hour
export async function cleanupJob() {
  const deleted = await cleanupExpiredOTPs()
  console.log(`Cleaned up ${deleted} expired OTPs`)
}
```

## Security Considerations

✅ **Implemented:**
- OTPs are hashed before storage (bcrypt)
- Rate limiting prevents abuse
- Short expiration time (5 minutes)
- Phone number validation
- Secure random OTP generation

⚠️ **Recommendations:**
- Use HTTPS in production
- Implement IP-based rate limiting
- Add CAPTCHA for repeated failures
- Monitor for suspicious patterns
- Log all OTP attempts
- Implement account lockout after X failed attempts

## Testing

Run tests:
```bash
npx tsx src/lib/otp/__tests__/request-otp.test.ts
```

Tests cover:
- ✅ Valid OTP request
- ✅ Invalid phone number rejection
- ✅ Rate limiting enforcement
- ✅ User creation
- ✅ OTP storage and expiration
- ✅ SMS sending (mock)

## Troubleshooting

### OTP not received
- Check phone number format (+1...)
- Verify SMS service is working
- Check rate limiting hasn't been exceeded
- Review server logs

### Rate limit errors
- Wait 15 minutes from first request
- Check database for OTP records
- Use `getOTPStatus()` helper (dev only)

### Database errors
- Verify DATABASE_URL is correct
- Check Prisma schema is migrated
- Ensure roles are seeded

## Next Steps

After implementing OTP request:
1. ✅ Implement verify OTP endpoint
2. ✅ Add OTP resend functionality
3. ✅ Create authentication UI components
4. ✅ Implement session management
5. ✅ Add refresh token mechanism
