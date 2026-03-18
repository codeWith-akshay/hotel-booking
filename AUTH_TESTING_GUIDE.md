# 🧪 Authentication System Test Script

## Quick Test Commands

### 1. Test Database Connection
```bash
pnpm prisma db push
```

### 2. Seed Database with Admin Accounts
```bash
pnpm db:seed
```

Expected output:
```
✅ Admin user created:
   📧 Email: admin@hotel.com
   🔑 Password: Admin@123456

✅ Super Admin user created:
   📧 Email: superadmin@hotel.com
   🔑 Password: SuperAdmin@123456
```

### 3. Start Development Server
```bash
pnpm dev
```

Server should start at: `http://localhost:3000`

---

## Test Authentication Flow

### Test 1: Signup New User

**Using Browser:**
1. Navigate to `http://localhost:3000/signup`
2. Fill in the form:
   - Name: `Test User`
   - Email: `test@example.com`
   - Password: `TestPass123!`
   - Confirm Password: `TestPass123!`
3. Click "Sign Up"
4. Should redirect to `/dashboard`

**Using cURL:**
```bash
curl -X POST http://localhost:3000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "test@example.com",
    "password": "TestPass123!",
    "confirmPassword": "TestPass123!"
  }'
```

Expected response (201):
```json
{
  "success": true,
  "data": {
    "userId": "cm...",
    "name": "Test User",
    "email": "test@example.com",
    "roleId": 1,
    "roleName": "MEMBER"
  },
  "message": "Account created successfully"
}
```

---

### Test 2: Login as Member

**Using Browser:**
1. Navigate to `http://localhost:3000/login`
2. Enter credentials:
   - Email: `test@example.com`
   - Password: `TestPass123!`
3. Click "Login"
4. Should redirect to `/dashboard`

**Using cURL:**
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -c cookies.txt \
  -d '{
    "email": "test@example.com",
    "password": "TestPass123!"
  }'
```

Expected response (200):
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "cm...",
      "name": "Test User",
      "email": "test@example.com",
      "roleId": 1,
      "role": {
        "id": 1,
        "name": "MEMBER",
        "permissions": ["read"]
      }
    }
  },
  "message": "Login successful"
}
```

---

### Test 3: Login as Admin

**Using Browser:**
1. Navigate to `http://localhost:3000/login`
2. Enter credentials:
   - Email: `admin@hotel.com`
   - Password: `Admin@123456`
3. Click "Login"
4. Should redirect to `/admin/dashboard`

**Using cURL:**
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -c admin-cookies.txt \
  -d '{
    "email": "admin@hotel.com",
    "password": "Admin@123456"
  }'
```

---

### Test 4: Login as Super Admin

**Using Browser:**
1. Navigate to `http://localhost:3000/login`
2. Enter credentials:
   - Email: `superadmin@hotel.com`
   - Password: `SuperAdmin@123456`
3. Click "Login"
4. Should redirect to `/superadmin/dashboard`

**Using cURL:**
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -c superadmin-cookies.txt \
  -d '{
    "email": "superadmin@hotel.com",
    "password": "SuperAdmin@123456"
  }'
```

---

### Test 5: Access Protected Route (Profile)

**After logging in, test profile endpoint:**

```bash
# Using saved cookies from previous login
curl -X GET http://localhost:3000/api/user/profile \
  -b cookies.txt
```

Expected response (200):
```json
{
  "success": true,
  "data": {
    "id": "cm...",
    "name": "Test User",
    "email": "test@example.com",
    "phone": null,
    "address": null,
    "profileCompleted": false,
    "role": {
      "id": 1,
      "name": "MEMBER",
      "permissions": ["read"]
    },
    "roleId": 1,
    "createdAt": "2026-03-18...",
    "updatedAt": "2026-03-18..."
  },
  "message": "Profile retrieved successfully"
}
```

---

### Test 6: Access Admin-Only Route (Unauthorized)

**Try accessing admin endpoint as regular member:**

```bash
# Using member cookies
curl -X GET http://localhost:3000/api/admin/dashboard \
  -b cookies.txt
```

Expected response (403):
```json
{
  "success": false,
  "error": "Insufficient permissions",
  "message": "You don't have permission to access this resource"
}
```

**Try accessing admin endpoint as admin:**

```bash
# Using admin cookies
curl -X GET http://localhost:3000/api/admin/dashboard \
  -b admin-cookies.txt
```

Expected response (200):
```json
{
  "success": true,
  "data": {
    // Dashboard data
  }
}
```

---

### Test 7: Test Invalid Login

**Wrong password:**
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@hotel.com",
    "password": "WrongPassword123!"
  }'
```

Expected response (401):
```json
{
  "success": false,
  "error": "Invalid credentials",
  "message": "Invalid email or password"
}
```

**Invalid email format:**
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "not-an-email",
    "password": "Admin@123456"
  }'
```

Expected response (400):
```json
{
  "success": false,
  "error": "Validation failed",
  "message": "Invalid input"
}
```

---

### Test 8: Test Weak Password Validation

**Password too short:**
```bash
curl -X POST http://localhost:3000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "weak@example.com",
    "password": "weak",
    "confirmPassword": "weak"
  }'
```

Expected response (400):
```json
{
  "success": false,
  "error": "Validation failed",
  "errors": [
    "Password must be at least 8 characters long",
    "Password must contain at least one uppercase letter",
    "Password must contain at least one number",
    "Password must contain at least one special character"
  ]
}
```

---

### Test 9: Test Password Mismatch

```bash
curl -X POST http://localhost:3000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "mismatch@example.com",
    "password": "TestPass123!",
    "confirmPassword": "DifferentPass123!"
  }'
```

Expected response (400):
```json
{
  "success": false,
  "error": "Validation failed",
  "message": "Passwords do not match"
}
```

---

### Test 10: Test Duplicate Email

**Try signing up with existing email:**
```bash
curl -X POST http://localhost:3000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Another User",
    "email": "admin@hotel.com",
    "password": "TestPass123!",
    "confirmPassword": "TestPass123!"
  }'
```

Expected response (409):
```json
{
  "success": false,
  "error": "Email already registered",
  "message": "An account with this email already exists"
}
```

---

## Automated Test Script (PowerShell)

Save as `test-auth.ps1`:

```powershell
# Test Authentication System
Write-Host "🧪 Testing Authentication System..." -ForegroundColor Cyan

$baseUrl = "http://localhost:3000"

# Test 1: Signup
Write-Host "`n📝 Test 1: Signup New User" -ForegroundColor Yellow
$signupBody = @{
    name = "Test User"
    email = "test-$(Get-Random)@example.com"
    password = "TestPass123!"
    confirmPassword = "TestPass123!"
} | ConvertTo-Json

try {
    $signupResponse = Invoke-RestMethod -Uri "$baseUrl/api/auth/signup" -Method Post -Body $signupBody -ContentType "application/json"
    Write-Host "✅ Signup successful!" -ForegroundColor Green
    Write-Host "   User ID: $($signupResponse.data.userId)" -ForegroundColor Gray
    Write-Host "   Role: $($signupResponse.data.roleName)" -ForegroundColor Gray
} catch {
    Write-Host "❌ Signup failed: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 2: Login as Admin
Write-Host "`n🔐 Test 2: Login as Admin" -ForegroundColor Yellow
$loginBody = @{
    email = "admin@hotel.com"
    password = "Admin@123456"
} | ConvertTo-Json

try {
    $loginResponse = Invoke-RestMethod -Uri "$baseUrl/api/auth/login" -Method Post -Body $loginBody -ContentType "application/json" -SessionVariable session
    Write-Host "✅ Login successful!" -ForegroundColor Green
    Write-Host "   User: $($loginResponse.data.user.name)" -ForegroundColor Gray
    Write-Host "   Role: $($loginResponse.data.user.role.name)" -ForegroundColor Gray
    
    # Test 3: Access Profile
    Write-Host "`n👤 Test 3: Access User Profile" -ForegroundColor Yellow
    $profileResponse = Invoke-RestMethod -Uri "$baseUrl/api/user/profile" -Method Get -WebSession $session
    Write-Host "✅ Profile retrieved!" -ForegroundColor Green
    Write-Host "   Email: $($profileResponse.data.email)" -ForegroundColor Gray
    
} catch {
    Write-Host "❌ Test failed: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 4: Invalid Login
Write-Host "`n🚫 Test 4: Invalid Login (Wrong Password)" -ForegroundColor Yellow
$invalidLoginBody = @{
    email = "admin@hotel.com"
    password = "WrongPassword"
} | ConvertTo-Json

try {
    $invalidResponse = Invoke-RestMethod -Uri "$baseUrl/api/auth/login" -Method Post -Body $invalidLoginBody -ContentType "application/json"
    Write-Host "❌ Should have failed but didn't!" -ForegroundColor Red
} catch {
    Write-Host "✅ Correctly rejected invalid credentials!" -ForegroundColor Green
}

Write-Host "`n🎉 Authentication tests completed!" -ForegroundColor Cyan
```

Run with:
```bash
powershell -File test-auth.ps1
```

---

## Expected Results Summary

| Test | Expected Result | Status Code |
|------|----------------|-------------|
| Signup with valid data | Success | 201 |
| Login with correct credentials | Success | 200 |
| Access profile (authenticated) | Success | 200 |
| Access admin route (as admin) | Success | 200 |
| Access admin route (as member) | Forbidden | 403 |
| Login with wrong password | Unauthorized | 401 |
| Signup with weak password | Validation error | 400 |
| Signup with existing email | Conflict | 409 |
| Access route without auth | Unauthorized | 401 |

---

## ✅ All Tests Pass?

If all tests pass, your authentication system is working correctly! 🎉

**What's Working:**
- ✅ User registration (signup)
- ✅ User authentication (login)
- ✅ Password hashing and verification
- ✅ JWT token generation and validation
- ✅ Role-based access control
- ✅ Protected routes and APIs
- ✅ Input validation
- ✅ Error handling

**Next Steps:**
1. Start building your application features
2. Use RBAC utilities to protect routes
3. Add more roles if needed
4. Customize user profiles
5. Deploy to production

---

*Last Updated: March 18, 2026*
