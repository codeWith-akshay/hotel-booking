# OTP Authentication Flow - Visual Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        OTP AUTHENTICATION FLOW                              │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────┐
│   CLIENT    │
│  (Browser)  │
└──────┬──────┘
       │
       │ 1. POST /api/auth/request-otp
       │    { "phone": "+14155551234" }
       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                           REQUEST OTP FLOW                                  │
│                                                                             │
│  ┌────────────────────────────────────────────────────────────────────┐   │
│  │ 1. Validate phone (Zod schema)                                     │   │
│  │ 2. Check rate limit (3 per 15min)                                  │   │
│  │ 3. Find or create user (MEMBER role)                               │   │
│  │ 4. Generate 6-digit OTP (crypto.randomInt)                         │   │
│  │ 5. Hash OTP (bcrypt 10 rounds)                                     │   │
│  │ 6. Store in DB (5min expiry)                                       │   │
│  │ 7. Send SMS (mock service logs to console)                         │   │
│  │ 8. Return success                                                  │   │
│  └────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  Response: { "success": true, "expiresIn": 300 }                           │
│  Console: "Your verification code is: 123456"                              │
└─────────────────────────────────────────────────────────────────────────────┘
       │
       │ User receives OTP: 123456
       │
       │ 2. POST /api/auth/verify-otp
       │    { "phone": "+14155551234", "otp": "123456" }
       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                           VERIFY OTP FLOW                                   │
│                                                                             │
│  ┌────────────────────────────────────────────────────────────────────┐   │
│  │  1. Validate phone + OTP (Zod schema)                              │   │
│  │  2. Find user by phone                                             │   │
│  │  3. Get latest valid OTP (expiresAt > now)                         │   │
│  │  4. Verify OTP hash (bcrypt.compare)                               │   │
│  │  5. Check expiration (< 5 minutes)                                 │   │
│  │  6. Delete used OTP (one-time use)                                 │   │
│  │  7. Generate JWT tokens:                                           │   │
│  │     • Access token (15 minutes)                                    │   │
│  │     • Refresh token (7 days)                                       │   │
│  │  8. Set HTTP-only cookies:                                         │   │
│  │     • auth-session = access_token                                  │   │
│  │     • refresh-token = refresh_token                                │   │
│  │  9. Return user info + token                                       │   │
│  └────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  Response: { "success": true, "data": { "userId", "phone", "token" }}      │
│  Cookies: auth-session, refresh-token (HTTP-only, Secure)                  │
└─────────────────────────────────────────────────────────────────────────────┘
       │
       │ 3. Authenticated requests
       │    Cookie: auth-session=<token>
       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                         PROTECTED ROUTES                                    │
│                                                                             │
│  ┌────────────────────────────────────────────────────────────────────┐   │
│  │  1. Extract token from Cookie or Authorization header             │   │
│  │  2. Verify JWT signature (jwt.verify)                              │   │
│  │  3. Check expiration                                               │   │
│  │  4. Decode user info (userId, role, etc.)                          │   │
│  │  5. Attach user to request context                                 │   │
│  │  6. Process request                                                │   │
│  └────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  Response: Protected resource data                                         │
└─────────────────────────────────────────────────────────────────────────────┘


┌─────────────────────────────────────────────────────────────────────────────┐
│                          DATABASE SCHEMA                                    │
└─────────────────────────────────────────────────────────────────────────────┘

┌──────────────┐         ┌──────────────┐         ┌──────────────┐
│     User     │         │     Role     │         │     OTP      │
├──────────────┤         ├──────────────┤         ├──────────────┤
│ id           │────┐    │ id           │         │ id           │
│ phone*       │    │    │ name*        │         │ userId       │────┐
│ name         │    │    │ permissions  │         │ otpHash      │    │
│ email        │    └───▶│ users[]      │         │ expiresAt    │    │
│ roleId       │         │              │         │ createdAt    │    │
│ role         │         └──────────────┘         └──────────────┘    │
│ otps[]       │◀────────────────────────────────────────────────────┘
│ createdAt    │
│ updatedAt    │
└──────────────┘

Indexes:
• User.phone (unique)
• User.email (unique)
• User.roleId
• OTP.expiresAt (for cleanup)


┌─────────────────────────────────────────────────────────────────────────────┐
│                            JWT TOKEN STRUCTURE                              │
└─────────────────────────────────────────────────────────────────────────────┘

Access Token (15 minutes):
┌────────────────────────────────────────────────────────────────────────┐
│ {                                                                      │
│   "userId": "uuid",                                                    │
│   "phone": "+14155551234",                                             │
│   "email": "user@example.com",                                         │
│   "name": "John Doe",                                                  │
│   "role": "MEMBER",                                                    │
│   "roleId": "role-uuid",                                               │
│   "iat": 1705315200,                                                   │
│   "exp": 1705316100                                                    │
│ }                                                                      │
└────────────────────────────────────────────────────────────────────────┘

Refresh Token (7 days):
┌────────────────────────────────────────────────────────────────────────┐
│ {                                                                      │
│   "userId": "uuid",                                                    │
│   "phone": "+14155551234",                                             │
│   "iat": 1705315200,                                                   │
│   "exp": 1705920000                                                    │
│ }                                                                      │
└────────────────────────────────────────────────────────────────────────┘


┌─────────────────────────────────────────────────────────────────────────────┐
│                           SECURITY LAYERS                                   │
└─────────────────────────────────────────────────────────────────────────────┘

1. Rate Limiting
   └─> 3 OTP requests per phone per 15 minutes
   └─> Prevents brute force attacks

2. OTP Security
   └─> Bcrypt hashing (10 rounds)
   └─> 5-minute expiration
   └─> One-time use (deleted after verification)
   └─> 6-digit random code (1,000,000 combinations)

3. JWT Security
   └─> HS256 algorithm (HMAC SHA-256)
   └─> Separate secrets for access/refresh tokens
   └─> Short-lived access tokens (15 minutes)
   └─> Long-lived refresh tokens (7 days)

4. Cookie Security
   └─> HTTP-only (prevents XSS)
   └─> Secure flag in production (HTTPS only)
   └─> SameSite: lax (prevents CSRF)
   └─> Path: / (available to all routes)

5. Validation
   └─> Zod schema validation
   └─> International phone format (E.164)
   └─> TypeScript strict mode


┌─────────────────────────────────────────────────────────────────────────────┐
│                          ERROR HANDLING                                     │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────┬────────┬─────────────────────────────────────────┐
│ Error Code          │ Status │ Description                             │
├─────────────────────┼────────┼─────────────────────────────────────────┤
│ INVALID_PHONE       │  400   │ Invalid phone format                    │
│ INVALID_OTP         │  400   │ Wrong OTP code                          │
│ RATE_LIMIT_EXCEEDED │  429   │ Too many requests (3 per 15min)         │
│ USER_NOT_FOUND      │  404   │ No account found                        │
│ OTP_NOT_FOUND       │  404   │ OTP expired or doesn't exist            │
│ OTP_EXPIRED         │  410   │ OTP older than 5 minutes                │
│ INTERNAL_ERROR      │  500   │ Server/database error                   │
└─────────────────────┴────────┴─────────────────────────────────────────┘


┌─────────────────────────────────────────────────────────────────────────────┐
│                           FILE STRUCTURE                                    │
└─────────────────────────────────────────────────────────────────────────────┘

src/
├── actions/auth/
│   ├── request-otp.action.ts     ← Server action for OTP request
│   └── verify-otp.action.ts      ← Server action for OTP verification
│
├── app/api/auth/
│   ├── request-otp/
│   │   └── route.ts              ← API route handler
│   └── verify-otp/
│       └── route.ts              ← API route handler
│
├── lib/
│   ├── auth/
│   │   └── jwt.service.ts        ← JWT token generation & verification
│   ├── otp/
│   │   └── otp.service.ts        ← OTP generation, hashing, SMS service
│   └── validation/
│       └── otp.schemas.ts        ← Zod validation schemas
│
├── examples/
│   └── otp-auth-examples.ts      ← Testing examples
│
└── prisma/
    ├── schema.prisma             ← Database schema
    └── seed.ts                   ← Seed roles + admin users


┌─────────────────────────────────────────────────────────────────────────────┐
│                         IMPLEMENTATION STATUS                               │
└─────────────────────────────────────────────────────────────────────────────┘

✅ Step 1: Prisma schema (User, Role, OTP)
✅ Step 2: Seed roles and admin users
✅ Step 3: Zod validation schemas
✅ Step 4: OTP request API
✅ Step 5: OTP verification API
⏳ Step 6: Session middleware
⏳ Step 7: Token refresh endpoint
⏳ Step 8: Logout endpoint
⏳ Step 9: User profile management

```
