# OTP Authentication Flow

Complete OTP-based phone authentication system with JWT token management for the hotel booking application.

## 📋 Overview

This authentication system implements a secure, production-ready OTP (One-Time Password) flow using:
- **Phone-based authentication** - Users login with phone number
- **6-digit OTP codes** - Sent via SMS (mock service in development)
- **JWT tokens** - Access (15min) + Refresh (7 days) tokens
- **HTTP-only cookies** - Secure session management
- **Rate limiting** - 3 requests per 15 minutes
- **Auto-cleanup** - Expired OTPs automatically deleted

---

## 🏗️ Architecture

### **Database Schema** (`prisma/schema.prisma`)

```prisma
model User {
  id        String   @id @default(uuid())
  phone     String   @unique
  name      String
  email     String?  @unique
  roleId    String
  role      Role     @relation(...)
  otps      OTP[]
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

model OTP {
  id        String   @id @default(uuid())
  userId    String
  user      User     @relation(...)
  otpHash   String   // Bcrypt hashed OTP
  expiresAt DateTime // 5 minutes expiry
  createdAt DateTime @default(now())
}

model Role {
  id          String   @id @default(uuid())
  name        RoleEnum @unique
  permissions Json
  users       User[]
}
```

### **Key Services**

| Service | File | Purpose |
|---------|------|---------|
| **OTP Service** | `src/lib/otp/otp.service.ts` | Generate, hash, verify OTPs; Rate limiting; Mock SMS |
| **JWT Service** | `src/lib/auth/jwt.service.ts` | Token generation, verification, cookie management |
| **Validation** | `src/lib/validation/otp.schemas.ts` | Zod schemas for request/verify OTP |

---

## 🔐 Authentication Flow

### **Step 1: Request OTP**

**Endpoint:** `POST /api/auth/request-otp`

**Request:**
```json
{
  "phone": "+14155551234"
}
```

**Flow:**
1. ✅ Validate phone number (international format)
2. ✅ Check rate limit (3 requests per 15min)
3. ✅ Find or create user with MEMBER role
4. ✅ Generate random 6-digit OTP
5. ✅ Hash OTP with bcrypt (10 rounds)
6. ✅ Store OTP in database (5min expiry)
7. ✅ Send OTP via SMS (mock service logs to console)
8. ✅ Return success response

**Success Response (200):**
```json
{
  "success": true,
  "message": "OTP sent successfully to +14155551234",
  "data": {
    "expiresIn": 300,
    "expiresAt": "2024-01-15T10:05:00.000Z"
  }
}
```

**Error Response (429 - Rate Limited):**
```json
{
  "success": false,
  "error": "Rate limit exceeded",
  "code": "RATE_LIMIT_EXCEEDED",
  "message": "Too many OTP requests. Please try again in 13 minutes."
}
```

---

### **Step 2: Verify OTP**

**Endpoint:** `POST /api/auth/verify-otp`

**Request:**
```json
{
  "phone": "+14155551234",
  "otp": "123456"
}
```

**Flow:**
1. ✅ Validate phone number and OTP format
2. ✅ Find user by phone number
3. ✅ Retrieve latest valid OTP from database
4. ✅ Verify OTP hash with bcrypt
5. ✅ Check OTP expiration (5 minutes)
6. ✅ Delete used OTP (one-time use)
7. ✅ Generate JWT token pair (access + refresh)
8. ✅ Set HTTP-only session cookies
9. ✅ Return user info + tokens

**Success Response (200):**
```json
{
  "success": true,
  "message": "OTP verified successfully",
  "data": {
    "userId": "uuid-here",
    "phone": "+14155551234",
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

**Cookies Set:**
- `auth-session`: Access token (15 minutes, HTTP-only, Secure)
- `refresh-token`: Refresh token (7 days, HTTP-only, Secure)

**Error Response (400 - Invalid OTP):**
```json
{
  "success": false,
  "error": "Invalid OTP",
  "code": "INVALID_OTP",
  "message": "The OTP you entered is incorrect. Please try again."
}
```

**Error Response (404 - User Not Found):**
```json
{
  "success": false,
  "error": "User not found",
  "code": "USER_NOT_FOUND",
  "message": "No account found with this phone number. Please request a new OTP."
}
```

---

## 🔑 JWT Token Structure

### **Access Token** (15 minutes)

```json
{
  "userId": "uuid",
  "phone": "+14155551234",
  "email": "user@example.com",
  "name": "John Doe",
  "role": "MEMBER",
  "roleId": "role-uuid",
  "iat": 1705315200,
  "exp": 1705316100
}
```

### **Refresh Token** (7 days)

```json
{
  "userId": "uuid",
  "phone": "+14155551234",
  "iat": 1705315200,
  "exp": 1705920000
}
```

---

## 🛡️ Security Features

### **Rate Limiting**
- ✅ 3 OTP requests per phone number per 15 minutes
- ✅ Based on database OTP creation timestamps
- ✅ Prevents brute force attacks

### **OTP Security**
- ✅ 6-digit random numeric code
- ✅ Bcrypt hashing (10 rounds) before storage
- ✅ 5-minute expiration window
- ✅ One-time use (deleted after verification)
- ✅ Auto-cleanup of expired OTPs

### **JWT Security**
- ✅ HS256 algorithm (HMAC SHA-256)
- ✅ Separate secrets for access/refresh tokens
- ✅ Short-lived access tokens (15 minutes)
- ✅ HTTP-only cookies (XSS protection)
- ✅ Secure flag in production
- ✅ SameSite: lax (CSRF protection)

### **Validation**
- ✅ Zod schema validation for all inputs
- ✅ International phone number format (E.164)
- ✅ 6-digit OTP regex validation
- ✅ TypeScript strict mode

---

## 📦 Environment Variables

```env
# JWT Secrets (REQUIRED in production)
JWT_ACCESS_SECRET=your-super-secret-access-key-min-32-chars
JWT_REFRESH_SECRET=your-super-secret-refresh-key-min-32-chars

# Database
DATABASE_URL=postgresql://user:pass@host:5432/db

# SMS Service (Optional - for production)
TWILIO_ACCOUNT_SID=your-twilio-account-sid
TWILIO_AUTH_TOKEN=your-twilio-auth-token
TWILIO_PHONE_NUMBER=+1234567890
```

⚠️ **Security Warning:** The JWT service validates that production secrets are at least 32 characters long.

---

## 🧪 Testing the Flow

### **1. Request OTP**

```bash
curl -X POST http://localhost:3000/api/auth/request-otp \
  -H "Content-Type: application/json" \
  -d '{"phone": "+14155551234"}'
```

**Expected Console Output:**
```
📱 [MOCK SMS] Sending OTP to +14155551234
Your verification code is: 123456
Valid for 5 minutes.
```

### **2. Verify OTP**

```bash
curl -X POST http://localhost:3000/api/auth/verify-otp \
  -H "Content-Type: application/json" \
  -d '{
    "phone": "+14155551234",
    "otp": "123456"
  }'
```

**Expected Console Output:**
```
🔐 OTP Verification initiated for: +14155551234
✅ OTP verified successfully for user: uuid
🗑️  OTP deleted after successful verification
🎫 Tokens generated for user: uuid
🍪 Session cookies set for user: uuid
```

### **3. Access Protected Routes**

```bash
curl -X GET http://localhost:3000/api/protected \
  -H "Cookie: auth-session=<access_token>"
```

Or use Bearer token:

```bash
curl -X GET http://localhost:3000/api/protected \
  -H "Authorization: Bearer <access_token>"
```

---

## 📝 Error Codes Reference

| Code | Status | Description |
|------|--------|-------------|
| `INVALID_PHONE` | 400 | Invalid phone format or missing phone |
| `INVALID_OTP` | 400 | Incorrect OTP code |
| `RATE_LIMIT_EXCEEDED` | 429 | Too many OTP requests (3 per 15min) |
| `USER_NOT_FOUND` | 404 | No account found for phone number |
| `OTP_NOT_FOUND` | 404 | OTP expired or doesn't exist |
| `OTP_EXPIRED` | 410 | OTP has expired (5min window) |
| `INTERNAL_ERROR` | 500 | Server/database error |

---

## 🔄 Auto-User Creation

When a user requests an OTP for the first time:
- ✅ New user automatically created with MEMBER role
- ✅ Phone number set as primary identifier
- ✅ Name defaults to "Guest User" (can be updated later)
- ✅ Email optional (can be added post-verification)

---

## 🎯 Next Steps

### **Step 6: Session Middleware**
- Create middleware to verify JWT tokens
- Protect authenticated routes
- Add role-based access control (RBAC)

### **Step 7: Token Refresh Endpoint**
- `POST /api/auth/refresh-token`
- Exchange refresh token for new access token
- Rotate refresh tokens for security

### **Step 8: Logout Endpoint**
- `POST /api/auth/logout`
- Clear HTTP-only cookies
- Optionally blacklist tokens

### **Step 9: User Profile Management**
- Get user profile endpoint
- Update user info (name, email)
- Change phone number flow

---

## 📚 Additional Resources

### **File Structure**
```
src/
├── actions/auth/
│   ├── request-otp.action.ts    # Request OTP server action
│   └── verify-otp.action.ts     # Verify OTP server action
├── app/api/auth/
│   ├── request-otp/route.ts     # Request OTP API route
│   └── verify-otp/route.ts      # Verify OTP API route
├── lib/
│   ├── auth/
│   │   └── jwt.service.ts       # JWT utilities
│   ├── otp/
│   │   └── otp.service.ts       # OTP utilities
│   └── validation/
│       └── otp.schemas.ts       # Zod schemas
└── prisma/
    ├── schema.prisma            # Database schema
    └── seed.ts                  # Seed roles + admin users
```

### **Dependencies**
- `next@16.0.0` - React framework with App Router
- `prisma@6.17.1` - ORM for PostgreSQL
- `zod@4.1.12` - Schema validation
- `bcryptjs@3.0.2` - Password/OTP hashing
- `jsonwebtoken@9.0.2` - JWT token generation
- `@types/jsonwebtoken@9.0.7` - TypeScript types

---

## 🐛 Troubleshooting

### **"Rate limit exceeded" error**
- Wait 15 minutes or delete OTPs from database:
  ```sql
  DELETE FROM "OTP" WHERE "userId" = 'your-user-id';
  ```

### **"Invalid OTP" error**
- Check console logs for the mock OTP code
- Ensure OTP hasn't expired (5 minutes)
- Verify phone number matches exactly

### **"User not found" error**
- First request OTP to auto-create user
- Then verify OTP with the generated code

### **JWT verification fails**
- Check `JWT_ACCESS_SECRET` environment variable
- Ensure secret is at least 32 characters
- Verify token hasn't expired (15 minutes)

---

## ✅ Implementation Status

- ✅ **Step 1**: Prisma schema (User, Role, OTP)
- ✅ **Step 2**: Seed roles and admin users
- ✅ **Step 3**: Zod validation schemas
- ✅ **Step 4**: OTP request API
- ✅ **Step 5**: OTP verification API
- ⏳ **Step 6**: Session middleware
- ⏳ **Step 7**: Token refresh endpoint
- ⏳ **Step 8**: Logout endpoint
- ⏳ **Step 9**: User profile management

---

Built with ❤️ for secure, production-ready authentication.
