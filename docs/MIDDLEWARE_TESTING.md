# 🔐 RBAC Middleware Testing Guide

## Overview
This guide provides comprehensive testing procedures for the Role-Based Access Control (RBAC) middleware implementation.

---

## 📋 Test Prerequisites

### 1. Environment Setup
Ensure your `.env` file has:
```env
JWT_ACCESS_SECRET=your-secret-key-here
JWT_REFRESH_SECRET=your-refresh-secret-key-here
DATABASE_URL=your-database-url
```

### 2. Start Development Server
```bash
pnpm dev
```

### 3. Seed Database with Test Users
```bash
pnpm db:seed
```

This creates test users with different roles:
- **MEMBER**: `+14155551234`
- **ADMIN**: `+14155559999` (if seeded)
- **SUPERADMIN**: `admin@example.com`

---

## 🧪 Test Scenarios

### Test 1: Unauthenticated Access (401)

**Scenario:** Access protected routes without authentication

#### Test 1.1: Browser Navigation
```bash
# Open browser
http://localhost:3000/dashboard
```

**Expected Result:**
- ✅ Redirect to `/login?returnTo=/dashboard`
- ✅ No access to dashboard

#### Test 1.2: API Route
```bash
curl -X GET http://localhost:3000/api/user/profile
```

**Expected Response:**
```json
{
  "success": false,
  "error": "Authentication required",
  "message": "No authentication token provided. Please log in.",
  "code": "UNAUTHORIZED",
  "statusCode": 401
}
```

---

### Test 2: Valid Authentication (200)

**Scenario:** Access protected routes with valid token

#### Step 1: Login and Get Token
```bash
# Request OTP
curl -X POST http://localhost:3000/api/auth/request-otp \
  -H "Content-Type: application/json" \
  -d '{"phone": "+14155551234"}'

# Check server console for OTP code (e.g., "123456")

# Verify OTP and get tokens
curl -X POST http://localhost:3000/api/auth/verify-otp \
  -H "Content-Type: application/json" \
  -d '{"phone": "+14155551234", "otp": "123456"}' \
  -c cookies.txt
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "...",
      "phone": "+14155551234",
      "name": "Test User",
      "role": "MEMBER"
    },
    "tokens": {
      "accessToken": "eyJ...",
      "refreshToken": "eyJ...",
      "expiresIn": 900,
      "tokenType": "Bearer"
    }
  }
}
```

#### Step 2: Access Protected Route with Cookie
```bash
# Access user profile (MEMBER role required)
curl -X GET http://localhost:3000/api/user/profile \
  -b cookies.txt
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "userId": "...",
    "phone": "+14155551234",
    "name": "Test User",
    "role": "MEMBER"
  },
  "message": "Profile retrieved successfully"
}
```

#### Step 3: Access with Authorization Header
```bash
# Extract access token from Step 1
ACCESS_TOKEN="eyJ..."

curl -X GET http://localhost:3000/api/user/profile \
  -H "Authorization: Bearer $ACCESS_TOKEN"
```

**Expected Response:**
```json
{
  "success": true,
  "data": { ... }
}
```

---

### Test 3: Role-Based Authorization (403)

**Scenario:** Access routes with insufficient permissions

#### Test 3.1: MEMBER tries to access ADMIN route
```bash
# Login as MEMBER
curl -X POST http://localhost:3000/api/auth/verify-otp \
  -H "Content-Type: application/json" \
  -d '{"phone": "+14155551234", "otp": "123456"}' \
  -c member-cookies.txt

# Try to access admin route
curl -X GET http://localhost:3000/api/admin/dashboard \
  -b member-cookies.txt
```

**Expected Response:**
```json
{
  "success": false,
  "error": "Insufficient permissions",
  "message": "You do not have permission to access this resource. Required role: ADMIN or SUPERADMIN",
  "code": "FORBIDDEN",
  "statusCode": 403
}
```

#### Test 3.2: Browser Navigation (MEMBER → /admin)
```bash
# Open browser after logging in as MEMBER
http://localhost:3000/admin
```

**Expected Result:**
- ✅ Redirect to `/dashboard?error=forbidden`
- ✅ No access to admin panel

---

### Test 4: ADMIN Role Access

**Scenario:** ADMIN user accessing admin routes

#### Step 1: Create Admin User (if not seeded)
```typescript
// Run in Prisma Studio or create via API
{
  phone: "+14155559999",
  name: "Admin User",
  roleId: "<admin-role-id>"
}
```

#### Step 2: Login as Admin
```bash
curl -X POST http://localhost:3000/api/auth/request-otp \
  -H "Content-Type: application/json" \
  -d '{"phone": "+14155559999"}'

# Use OTP from console
curl -X POST http://localhost:3000/api/auth/verify-otp \
  -H "Content-Type: application/json" \
  -d '{"phone": "+14155559999", "otp": "123456"}' \
  -c admin-cookies.txt
```

#### Step 3: Access Admin Route
```bash
curl -X GET http://localhost:3000/api/admin/dashboard \
  -b admin-cookies.txt
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "admin": {
      "userId": "...",
      "name": "Admin User",
      "role": "ADMIN"
    },
    "statistics": {
      "totalUsers": 150,
      "activeUsers": 120,
      "totalBookings": 450,
      "revenue": 125000
    }
  },
  "message": "Admin dashboard data retrieved successfully"
}
```

---

### Test 5: SUPERADMIN Role Access

**Scenario:** Only SUPERADMIN can perform certain actions

#### Test 5.1: ADMIN tries SUPERADMIN action
```bash
# Login as ADMIN
curl -X POST http://localhost:3000/api/admin/dashboard \
  -b admin-cookies.txt
```

**Expected Response:**
```json
{
  "success": false,
  "error": "Forbidden",
  "message": "Only SUPERADMIN can perform this action",
  "statusCode": 403
}
```

#### Test 5.2: SUPERADMIN performs action
```bash
# Login as SUPERADMIN (use email from seed)
curl -X POST http://localhost:3000/api/auth/verify-otp \
  -H "Content-Type: application/json" \
  -d '{"phone": "+14155550000", "otp": "123456"}' \
  -c superadmin-cookies.txt

# Perform SUPERADMIN action
curl -X POST http://localhost:3000/api/admin/dashboard \
  -b superadmin-cookies.txt
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "message": "Statistics reset successfully",
    "performedBy": "Super Admin",
    "role": "SUPERADMIN"
  }
}
```

---

### Test 6: Expired Token (401)

**Scenario:** Access with expired JWT token

#### Step 1: Create Expired Token (Manual Test)
```typescript
// Temporarily change ACCESS_TOKEN_EXPIRY in jwt.service.ts
const ACCESS_TOKEN_EXPIRY = '1s' // 1 second
```

#### Step 2: Login and Wait
```bash
# Login
curl -X POST http://localhost:3000/api/auth/verify-otp \
  -H "Content-Type: application/json" \
  -d '{"phone": "+14155551234", "otp": "123456"}' \
  -c cookies.txt

# Wait 2 seconds
sleep 2

# Try to access protected route
curl -X GET http://localhost:3000/api/user/profile \
  -b cookies.txt
```

**Expected Response:**
```json
{
  "success": false,
  "error": "Invalid or expired token",
  "message": "Your session has expired. Please log in again.",
  "code": "INVALID_TOKEN",
  "statusCode": 401
}
```

---

### Test 7: Invalid Token (401)

**Scenario:** Access with malformed token

```bash
curl -X GET http://localhost:3000/api/user/profile \
  -H "Authorization: Bearer invalid-token-123"
```

**Expected Response:**
```json
{
  "success": false,
  "error": "Invalid or expired token",
  "message": "Your session has expired. Please log in again.",
  "code": "INVALID_TOKEN",
  "statusCode": 401
}
```

---

### Test 8: Public Routes (No Middleware)

**Scenario:** Access public routes without authentication

```bash
# Homepage
curl -X GET http://localhost:3000/

# Login page
curl -X GET http://localhost:3000/login

# OTP request (public API)
curl -X POST http://localhost:3000/api/auth/request-otp \
  -H "Content-Type: application/json" \
  -d '{"phone": "+14155551234"}'
```

**Expected Result:**
- ✅ All requests succeed (200)
- ✅ No authentication required

---

## 🛠️ Developer Testing Tools

### Using Postman/Insomnia

#### Collection Setup
1. Create environment variables:
   - `BASE_URL`: `http://localhost:3000`
   - `ACCESS_TOKEN`: (set after login)

2. Create requests:
   - **Login**: `POST {{BASE_URL}}/api/auth/verify-otp`
   - **Profile**: `GET {{BASE_URL}}/api/user/profile`
   - **Admin**: `GET {{BASE_URL}}/api/admin/dashboard`

3. Add Authorization header:
   - Type: `Bearer Token`
   - Token: `{{ACCESS_TOKEN}}`

---

### Using Browser DevTools

1. **Login via UI:**
   - Navigate to `http://localhost:3000/login`
   - Enter phone: `+14155551234`
   - Request OTP
   - Enter OTP from server console
   - Verify successful login

2. **Check Cookies:**
   - Open DevTools → Application → Cookies
   - Verify `auth-session` cookie exists
   - Note: `HttpOnly` flag should be set

3. **Test Protected Routes:**
   - Navigate to `/dashboard` → Should load
   - Navigate to `/admin` → Should redirect to `/dashboard?error=forbidden`

4. **Test Logout:**
   - Click logout button
   - Verify redirect to `/login`
   - Verify cookies cleared
   - Try accessing `/dashboard` → Should redirect to login

---

## 📊 Middleware Logs

### Development Mode Logs

The middleware logs all access attempts in development:

```bash
[Middleware] ✅ Access granted: MEMBER → /dashboard
[Middleware] ✅ Access granted: ADMIN → /api/admin/dashboard
[Middleware] No token provided for: /api/user/profile
[Middleware] Invalid token for: /dashboard
[Middleware] Insufficient permissions for /admin. User role: MEMBER, Required: ADMIN, SUPERADMIN
```

### Monitoring Logs

```bash
# Watch logs in real-time
pnpm dev | grep Middleware
```

---

## ✅ Test Checklist

### Authentication Tests
- [ ] Access protected page without login → Redirect to login
- [ ] Access protected API without token → 401 Unauthorized
- [ ] Login with valid credentials → Receive token
- [ ] Access protected page with valid token → Success
- [ ] Access protected API with valid token → Success
- [ ] Access with expired token → 401 Token Expired
- [ ] Access with invalid token → 401 Invalid Token

### Authorization Tests
- [ ] MEMBER accesses `/dashboard` → Success
- [ ] MEMBER accesses `/admin` → 403 Forbidden
- [ ] ADMIN accesses `/dashboard` → Success
- [ ] ADMIN accesses `/admin` → Success
- [ ] ADMIN accesses `/superadmin` → 403 Forbidden
- [ ] SUPERADMIN accesses all routes → Success

### Public Routes Tests
- [ ] Access `/` without login → Success
- [ ] Access `/login` without login → Success
- [ ] Access `/api/auth/request-otp` without login → Success

### Cookie Tests
- [ ] Login sets `auth-session` cookie
- [ ] Cookie has `HttpOnly` flag
- [ ] Cookie has `SameSite=lax`
- [ ] Logout clears cookies

### Header Tests
- [ ] Authorization header with Bearer token works
- [ ] Middleware sets `x-user-id` header
- [ ] Middleware sets `x-user-role` header

---

## 🐛 Troubleshooting

### Issue: Middleware not running
**Solution:**
- Check `middleware.ts` is in root directory
- Verify `matcher` config in `middleware.ts`
- Restart dev server

### Issue: Always getting 401
**Solution:**
- Check JWT secrets in `.env`
- Verify token is not expired
- Check token format: `Bearer <token>`

### Issue: Cookies not being set
**Solution:**
- Check browser allows cookies
- Verify `httpOnly` and `secure` flags
- Check `sameSite` setting

### Issue: Role checks failing
**Solution:**
- Verify user has correct role in database
- Check role spelling matches `RoleName` enum
- Ensure JWT payload includes `role` field

---

## 📝 Quick Test Script

Create `test-middleware.sh`:

```bash
#!/bin/bash

echo "=== Testing RBAC Middleware ==="

BASE_URL="http://localhost:3000"

echo "\n1. Testing unauthenticated access..."
curl -s "$BASE_URL/api/user/profile" | jq .

echo "\n2. Requesting OTP..."
curl -s -X POST "$BASE_URL/api/auth/request-otp" \
  -H "Content-Type: application/json" \
  -d '{"phone": "+14155551234"}' | jq .

echo "\n3. Enter OTP from console and press Enter..."
read OTP

echo "\n4. Verifying OTP..."
RESPONSE=$(curl -s -X POST "$BASE_URL/api/auth/verify-otp" \
  -H "Content-Type: application/json" \
  -d "{\"phone\": \"+14155551234\", \"otp\": \"$OTP\"}" \
  -c cookies.txt)

echo "$RESPONSE" | jq .

TOKEN=$(echo "$RESPONSE" | jq -r .data.tokens.accessToken)

echo "\n5. Testing authenticated access..."
curl -s "$BASE_URL/api/user/profile" \
  -H "Authorization: Bearer $TOKEN" | jq .

echo "\n6. Testing admin access (should fail for MEMBER)..."
curl -s "$BASE_URL/api/admin/dashboard" \
  -H "Authorization: Bearer $TOKEN" | jq .

echo "\n=== Tests Complete ==="
```

Run:
```bash
chmod +x test-middleware.sh
./test-middleware.sh
```

---

## 🚀 Production Considerations

Before deploying:

1. **Set strong JWT secrets**
   ```env
   JWT_ACCESS_SECRET=<64-char-random-string>
   JWT_REFRESH_SECRET=<64-char-random-string>
   ```

2. **Enable HTTPS**
   - Middleware sets `secure: true` in production
   - Cookies only sent over HTTPS

3. **Disable debug logs**
   - Remove `console.log` statements
   - Use proper logging service

4. **Rate limiting**
   - Add rate limiting for login endpoints
   - Prevent brute force attacks

5. **Monitor failed auth attempts**
   - Log all 401/403 responses
   - Set up alerts for suspicious activity

---

*Last Updated: 2025-10-22*
*Middleware Version: 1.0.0*
