# 🧪 Testing Scenario: Dashboard Access Without Profile Completion

## What Happens When User Visits Dashboard Without Completing Profile?

### ✅ Expected Behavior (Now Implemented)

When a user with `profileCompleted: false` tries to visit `/dashboard`:

```
1. User enters URL: http://localhost:3000/dashboard
2. Middleware intercepts the request
3. Checks JWT token → User authenticated ✅
4. Checks profileCompleted field → false ❌
5. Redirects to: /profile/setup?message=Please complete your profile to continue&returnTo=/dashboard
6. User sees profile setup form
7. User cannot access dashboard until profile is completed
```

### 🔒 Security Check Flow

```javascript
// Middleware Logic (lines 457-475)

const profileCompleted = (user as any).profileCompleted ?? false  // Gets from JWT

// Check if trying to access protected route
const requiresProfileCompletion = pathname.startsWith('/dashboard') || 
                                   pathname.startsWith('/admin') || 
                                   pathname.startsWith('/superadmin')

// Allow /profile/setup itself
const isProfileSetupRoute = pathname === '/profile/setup'

// If incomplete profile + protected route + not setup page = REDIRECT
if (requiresProfileCompletion && !profileCompleted && !isProfileSetupRoute) {
  // ❌ BLOCKED - Redirect to /profile/setup
  return NextResponse.redirect('/profile/setup?returnTo=/dashboard')
}

// ✅ ALLOWED - Continue to dashboard
```

---

## 🧪 Manual Testing Steps

### Test 1: New User Without Profile
```bash
1. Clear browser cookies (or use incognito)
2. Go to: http://localhost:3000/login
3. Login with phone + OTP
4. Try to visit: http://localhost:3000/dashboard
   
Expected Result:
✅ Automatically redirected to /profile/setup
✅ Cannot access /dashboard
✅ See message: "Please complete your profile to continue"
```

### Test 2: Try to Bypass Profile Setup
```bash
1. Login as new user (redirected to /profile/setup)
2. Manually type in URL: http://localhost:3000/dashboard
3. Press Enter

Expected Result:
✅ Immediately redirected back to /profile/setup
✅ Cannot bypass security
✅ returnTo parameter preserved
```

### Test 3: After Completing Profile
```bash
1. Fill out profile form (name, email, address)
2. Click "Complete Profile & Continue to Dashboard"
3. Form submits to /api/user/update-profile
4. Database updates: profileCompleted = true
5. New JWT tokens generated with profileCompleted: true
6. Cookies updated

Expected Result:
✅ Redirected to /dashboard
✅ Dashboard accessible
✅ Future visits don't require profile setup
```

---

## 🔍 Debugging: Check User Status

### Method 1: Check Database
```sql
-- Run in your database
SELECT 
  id, 
  phone, 
  name, 
  email, 
  profileCompleted 
FROM users 
WHERE phone = '+1234567890';  -- Your test phone
```

### Method 2: Decode JWT Token
```javascript
// In browser console (while logged in):
const cookies = document.cookie
  .split('; ')
  .find(row => row.startsWith('auth-session='))
  ?.split('=')[1];

console.log('JWT Token:', cookies);

// Copy token and paste at https://jwt.io
// Look for "profileCompleted" field in payload
```

### Method 3: Check Middleware Logs
```bash
# In your terminal running npm run dev
# Look for these messages:

# When profile incomplete:
[Middleware] ⚠️  Profile incomplete for user abc123. Redirecting to /profile/setup

# When profile complete:
[Middleware] ✅ Access granted: MEMBER → /dashboard
```

---

## 🛡️ What's Protected?

The middleware protects these routes:

- ✅ `/dashboard` - Member dashboard
- ✅ `/dashboard/*` - All dashboard sub-pages
- ✅ `/admin` - Admin panel
- ✅ `/admin/*` - All admin sub-pages
- ✅ `/superadmin` - Super admin panel
- ✅ `/superadmin/*` - All super admin sub-pages

### What's NOT Protected (Allowed without profile):

- ✅ `/` - Home page
- ✅ `/login` - Login page
- ✅ `/verify-otp` - OTP verification
- ✅ `/profile/setup` - Profile setup page itself
- ✅ `/api/auth/*` - Authentication APIs
- ✅ `/api/user/update-profile` - Profile update API

---

## 🐛 Troubleshooting

### Issue: User can access dashboard without profile

**Check these:**
1. Is middleware running?
   ```bash
   # Check middleware.ts is in root folder
   ls middleware.ts
   ```

2. Is JWT token correct?
   ```javascript
   // Decode token and check profileCompleted field
   ```

3. Is database updated?
   ```sql
   SELECT profileCompleted FROM users WHERE id = 'user_id';
   ```

### Issue: Stuck in redirect loop

**Possible causes:**
1. Profile form not submitting correctly
2. Database not updating
3. JWT tokens not regenerating

**Fix:**
```bash
# Check API endpoint is working
curl -X POST http://localhost:3000/api/user/update-profile \
  -H "Cookie: auth-session=YOUR_JWT" \
  -H "Content-Type: application/json" \
  -d '{"fullName":"Test","email":"test@test.com","address":"123 St","vipStatus":"Regular"}'
```

---

## ✅ Current Status

**Implementation**: ✅ COMPLETE
**Security**: ✅ ENFORCED
**Bypass Prevention**: ✅ ACTIVE

### What Happens Now:

1. **New User Login** → Redirected to `/profile/setup` ✅
2. **Try to visit `/dashboard`** → Blocked and redirected back ✅
3. **Complete profile** → Database updated + New tokens ✅
4. **Access dashboard** → Allowed ✅
5. **Future logins** → Direct access (no setup needed) ✅

---

## 🚀 Quick Test Command

Run this in your browser console after logging in as a new user:

```javascript
// Test 1: Check current profile status
fetch('/api/user/profile')
  .then(r => r.json())
  .then(data => {
    console.log('Profile Completed:', data.profileCompleted);
  });

// Test 2: Try to access dashboard
window.location.href = '/dashboard';
// Should redirect to /profile/setup if incomplete
```

---

**Summary**: The middleware now correctly blocks access to `/dashboard` for users with incomplete profiles and redirects them to `/profile/setup`. There is no way to bypass this security check.
