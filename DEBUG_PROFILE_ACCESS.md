# 🐛 Debug Guide: Dashboard Access Without Profile

## Problem
Users can access `/dashboard` without completing their profile.

## 🔍 Debugging Steps

### Step 1: Check Middleware is Running

Open your terminal and watch for middleware logs when you visit `/dashboard`:

```bash
# Start dev server with verbose logging
npm run dev

# You should see logs like:
# [Middleware] 🔍 Profile check for /dashboard:
# [Middleware] ⚠️  Profile incomplete for user abc123
```

**If you DON'T see these logs:**
- Middleware is not running
- Check that `middleware.ts` is in the **root** folder (not in `src/`)
- Restart your dev server

### Step 2: Check JWT Token Contains profileCompleted

In your browser console (while logged in):

```javascript
// Get the JWT token
const token = document.cookie
  .split('; ')
  .find(row => row.startsWith('auth-session='))
  ?.split('=')[1];

console.log('JWT Token:', token);

// Copy the token and paste it at https://jwt.io
// Look for "profileCompleted" field in the PAYLOAD section
```

**Expected payload:**
```json
{
  "userId": "...",
  "phone": "+1234567890",
  "name": "...",
  "role": "MEMBER",
  "roleId": "...",
  "profileCompleted": false,  // ⬅️ Should be false for new users
  "iat": 1234567890,
  "exp": 1234567890
}
```

**If `profileCompleted` is missing:**
- The JWT was generated before the fix
- User needs to login again to get new token
- Or manually update database and regenerate token

### Step 3: Check Database Value

Run this in your database:

```sql
-- Check your test user
SELECT id, phone, name, profileCompleted 
FROM users 
WHERE phone = '+YOUR_TEST_PHONE';

-- Expected: profileCompleted should be false (not NULL)
```

**If `profileCompleted` is `NULL`:**
```sql
-- Fix it
UPDATE users 
SET profileCompleted = false 
WHERE profileCompleted IS NULL;
```

### Step 4: Test the Full Flow

```bash
# 1. Clear all cookies (or use incognito window)

# 2. Go to login page
http://localhost:3000/login

# 3. Login with NEW phone number

# 4. After OTP verification, check terminal logs:
# Should see: [Middleware] 🔍 Profile check for /dashboard:

# 5. Try to visit dashboard:
http://localhost:3000/dashboard

# 6. Check terminal again - should see:
# [Middleware] ⚠️  Profile incomplete for user...
# [Middleware] 📊 Details: { requiresProfileCompletion: true, profileCompleted: false, ... }
```

### Step 5: Check Middleware Execution Order

Add this temporary debug code to see middleware execution:

In `middleware.ts`, add at the very top of the middleware function:

```typescript
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  
  console.log('🔵 MIDDLEWARE HIT:', pathname)  // ⬅️ Add this
  
  // ... rest of code
}
```

**You should see this log for EVERY request.**

If you DON'T see it:
- Middleware matcher is not matching your route
- Check the `config.matcher` at the bottom of `middleware.ts`

### Step 6: Verify Route Protection

Check that `/dashboard` is in the PROTECTED_ROUTES:

```typescript
// In middleware.ts, find this:
const PROTECTED_ROUTES: RouteConfig[] = [
  {
    path: '/dashboard',  // ⬅️ Should be here
    roles: ['MEMBER', 'ADMIN', 'SUPERADMIN'],
    requiresAuth: true,
    redirectTo: '/login',
  },
  // ...
]
```

## 🎯 Common Issues & Solutions

### Issue 1: Old JWT Token

**Symptom:** Token doesn't have `profileCompleted` field

**Solution:**
```javascript
// Force logout and login again
fetch('/api/auth/logout', { method: 'POST' })
  .then(() => window.location.href = '/login')
```

### Issue 2: Database Has NULL Values

**Symptom:** `profileCompleted` is `NULL` in database

**Solution:**
```sql
-- Run this SQL
UPDATE users 
SET profileCompleted = false 
WHERE profileCompleted IS NULL;
```

### Issue 3: Middleware Not Running

**Symptom:** No logs in terminal when visiting `/dashboard`

**Solution:**
1. Check `middleware.ts` is in **root folder** (same level as `package.json`)
2. Restart dev server: `npm run dev`
3. Clear Next.js cache: `rm -rf .next` then `npm run dev`

### Issue 4: Client Component Bypassing

**Symptom:** Dashboard loads before redirect

**Solution:**
This is normal - middleware redirect happens at the HTTP level.
The client component might briefly appear, but the redirect should happen within milliseconds.

### Issue 5: Cached Response

**Symptom:** Seems like middleware isn't running, but worked before

**Solution:**
```bash
# Clear browser cache
# Or use incognito/private mode
# Or hard refresh: Ctrl+Shift+R (Cmd+Shift+R on Mac)
```

## 🧪 Quick Test Script

Run this in browser console to test:

```javascript
// Test 1: Check if authenticated
fetch('/api/user/profile')
  .then(r => r.json())
  .then(data => {
    console.log('✅ User Profile:', data);
    console.log('📊 Profile Completed:', data.profileCompleted);
  })
  .catch(err => console.log('❌ Not authenticated:', err));

// Test 2: Try to access dashboard (will redirect if profile incomplete)
console.log('🔍 Attempting to access dashboard...');
window.location.href = '/dashboard';

// You should be redirected to /profile/setup if profile is incomplete
```

## 🔧 Manual Fix for Testing

If you need to reset a user for testing:

```sql
-- Reset user profile to test flow again
UPDATE users 
SET 
  profileCompleted = false,
  name = CONCAT('User ', SUBSTRING(phone, -4)),
  email = NULL,
  address = NULL
WHERE phone = '+YOUR_TEST_PHONE';
```

Then logout and login again to get new JWT token.

## ✅ Expected Behavior Checklist

When visiting `/dashboard` with incomplete profile:

- [ ] Terminal shows: `[Middleware] 🔍 Profile check for /dashboard:`
- [ ] Terminal shows: `[Middleware] ⚠️  Profile incomplete...`
- [ ] Browser redirects to `/profile/setup`
- [ ] URL shows: `/profile/setup?message=Please complete your profile to continue&returnTo=/dashboard`
- [ ] Cannot access `/dashboard` by typing URL directly
- [ ] After completing profile, can access `/dashboard`

## 🆘 Still Not Working?

If you've tried everything above and it still doesn't work:

1. **Clear everything:**
   ```bash
   # Stop server
   # Delete .next folder
   rm -rf .next
   # Delete node_modules (if desperate)
   rm -rf node_modules
   npm install
   # Start fresh
   npm run dev
   ```

2. **Check Next.js version:**
   ```bash
   npm list next
   # Should be 13.0.0 or higher for middleware support
   ```

3. **Verify middleware file location:**
   ```bash
   # Should be in root, not in src/
   ls middleware.ts
   # Should show: middleware.ts
   ```

4. **Check for errors in terminal:**
   - Look for any TypeScript errors
   - Look for middleware compilation errors

5. **Test with curl:**
   ```bash
   # Get your JWT token from browser
   curl -v http://localhost:3000/dashboard \
     -H "Cookie: auth-session=YOUR_JWT_TOKEN"
   
   # Should return 307 redirect to /profile/setup
   ```

## 📝 Report Issue

If still not working, provide these details:

1. Terminal logs when accessing `/dashboard`
2. JWT token payload (use jwt.io)
3. Database value of `profileCompleted` for test user
4. Next.js version: `npm list next`
5. Middleware file location: `ls -la middleware.ts`
6. Any errors in browser console
7. Any errors in terminal

---

**Next Step:** Run through Step 1-6 above and report what you find!
