# 🧪 Testing Guide: OTP Authentication Flow

Complete testing guide for the hotel booking OTP authentication system.

---

## 🚀 Quick Start

### **1. Start Development Server**

```bash
# Make sure database is running (Neon/PostgreSQL)
# Start Next.js dev server
npm run dev
```

**Expected Output:**
```
  ▲ Next.js 16.0.0
  - Local:        http://localhost:3000
  - Ready in 2.5s
```

### **2. Navigate to App**

Open browser: http://localhost:3000

**Expected:** Auto-redirects to `/login`

---

## ✅ Complete Flow Test

### **Test 1: Login with Phone Number**

**Steps:**
1. Navigate to http://localhost:3000/login
2. Enter phone: `+14155551234`
3. Click "Send OTP"

**Expected Results:**
- ✅ Button shows "Loading..." with spinner
- ✅ Success alert: "OTP sent to +1 (415) 555-1234!"
- ✅ Auto-redirects to `/verify-otp` after 1.5 seconds

**Server Console Output:**
```
📱 [MOCK SMS] Sending OTP to +14155551234
Your verification code is: 123456
Valid for 5 minutes.
```

**Copy the 6-digit code!**

---

### **Test 2: Verify OTP**

**Steps:**
1. On `/verify-otp` page
2. Enter the 6-digit OTP from console (e.g., `123456`)
3. Observe countdown timer (starts at 5:00)
4. Click "Verify & Sign In"

**Expected Results:**
- ✅ Each digit auto-focuses next input
- ✅ Button shows "Loading..." with spinner
- ✅ Success alert: "Login successful! Redirecting..."
- ✅ Auto-redirects to `/dashboard` after 1.5 seconds

**Browser DevTools Check (Application > Local Storage):**
```json
{
  "auth-storage": {
    "state": {
      "user": {
        "id": "uuid",
        "phone": "+14155551234",
        "name": "User",
        "role": "MEMBER"
      },
      "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "isAuthenticated": true
    }
  }
}
```

**Browser DevTools Check (Application > Cookies):**
- ✅ `auth-session` (HTTP-only)
- ✅ `refresh-token` (HTTP-only)

---

### **Test 3: Dashboard Access**

**Steps:**
1. On `/dashboard` page
2. Verify user info displayed
3. Check stats cards
4. Click "Logout"

**Expected Results:**
- ✅ Welcome message: "Welcome back, User! 👋"
- ✅ Phone number formatted: "+1 (415) 555-1234"
- ✅ Role badge: "MEMBER"
- ✅ Logout redirects to `/login`
- ✅ localStorage cleared
- ✅ Cookies cleared

---

## 🧪 Error Scenario Tests

### **Test 4: Invalid Phone Number**

**Steps:**
1. On `/login` page
2. Enter invalid phone: `123456`
3. Blur input (click outside)

**Expected:**
- ❌ Error message: "Please enter a valid phone number (e.g., +14155551234)"
- ❌ Button disabled
- ❌ Red border on input

**Valid Formats:**
- ✅ `+14155551234` (US)
- ✅ `+442071234567` (UK)
- ✅ `+919876543210` (India)

**Invalid Formats:**
- ❌ `1234567890` (missing +)
- ❌ `+1` (too short)
- ❌ `abc123` (not numeric)

---

### **Test 5: Wrong OTP Code**

**Steps:**
1. Request OTP for `+14155551234`
2. On `/verify-otp` page
3. Enter wrong OTP: `999999`
4. Click "Verify & Sign In"

**Expected:**
- ❌ Error alert: "The OTP you entered is incorrect. Please try again."
- ❌ OTP inputs cleared
- ❌ First input focused
- ❌ Status code: 400

---

### **Test 6: Expired OTP**

**Steps:**
1. Request OTP
2. Wait 5+ minutes (or manually expire in database)
3. Try to verify OTP

**Expected:**
- ⏰ Countdown shows "0:00"
- ❌ Warning: "OTP has expired. Please request a new code."
- ❌ Verify button disabled
- ✅ "Resend OTP" button enabled

---

### **Test 7: Rate Limiting**

**Steps:**
1. Request OTP for same phone 4+ times within 15 minutes
2. Check response

**Expected:**
- ❌ Error: "Too many OTP requests. Please try again in X minutes."
- ❌ Status code: 429
- ✅ Server blocks request

**Manual Reset (if needed):**
```sql
-- Connect to database
DELETE FROM "OTP" WHERE "userId" = 'your-user-id';
```

---

## 🔄 Advanced Tests

### **Test 8: OTP Paste Functionality**

**Steps:**
1. Request OTP
2. Copy OTP code: `123456`
3. On `/verify-otp` page
4. Click first input
5. Press Ctrl+V (Windows) or Cmd+V (Mac)

**Expected:**
- ✅ All 6 digits filled automatically
- ✅ Last input focused
- ✅ Ready to verify

---

### **Test 9: Backspace Navigation**

**Steps:**
1. On `/verify-otp` page
2. Enter 3 digits: `123___`
3. Press Backspace 4 times

**Expected:**
- ✅ Third digit deleted, stays on third input
- ✅ Backspace moves to second input
- ✅ Second digit deleted
- ✅ Backspace moves to first input
- ✅ First digit deleted

---

### **Test 10: Resend OTP**

**Steps:**
1. Request OTP for `+14155551234`
2. Wait 5+ minutes or let timer expire
3. Click "Resend OTP"

**Expected:**
- ✅ Button shows "Loading..."
- ✅ Success alert: "New OTP sent successfully!"
- ✅ Timer resets to 5:00
- ✅ OTP inputs cleared
- ✅ New OTP in server console

---

### **Test 11: Change Phone Number**

**Steps:**
1. On `/verify-otp` page
2. Click "Change phone number"

**Expected:**
- ✅ Redirects to `/login`
- ✅ `pendingPhone` cleared from Zustand
- ✅ Can enter new phone number

---

### **Test 12: Protected Route Access**

**Steps:**
1. Open incognito/private window
2. Navigate to http://localhost:3000/dashboard

**Expected:**
- ❌ Redirects to `/login`
- ❌ Cannot access dashboard without auth

---

### **Test 13: Session Persistence**

**Steps:**
1. Complete login flow
2. On `/dashboard` page
3. Refresh browser (F5)

**Expected:**
- ✅ Still on `/dashboard`
- ✅ User info still displayed
- ✅ localStorage preserved
- ✅ No redirect to login

---

### **Test 14: Logout Clears State**

**Steps:**
1. Login and reach dashboard
2. Open DevTools > Application > Local Storage
3. Note `auth-storage` exists
4. Click "Logout"
5. Check Local Storage again

**Expected:**
- ✅ Redirects to `/login`
- ✅ `auth-storage` cleared
- ✅ `user` is null
- ✅ `isAuthenticated` is false

---

## 📱 Mobile Responsive Tests

### **Test 15: Mobile Layout**

**Steps:**
1. Open DevTools (F12)
2. Click "Toggle Device Toolbar" (Ctrl+Shift+M)
3. Select "iPhone 12 Pro" or similar
4. Test login flow

**Expected:**
- ✅ Full-width inputs
- ✅ Touch-friendly buttons
- ✅ Readable font sizes
- ✅ Proper spacing
- ✅ No horizontal scroll

---

## 🐛 Common Issues

### **Issue: "Failed to send OTP"**

**Possible Causes:**
1. Database connection error
2. Rate limit exceeded
3. Invalid phone format

**Solutions:**
1. Check database connection in `.env`
2. Wait 15 minutes or clear OTPs manually
3. Use correct format: `+[country_code][number]`

---

### **Issue: "OTP verification fails"**

**Possible Causes:**
1. Wrong OTP code
2. OTP expired (> 5 minutes)
3. Server error

**Solutions:**
1. Check server console for correct OTP
2. Request new OTP
3. Check server logs for errors

---

### **Issue: "Dashboard redirects to login"**

**Possible Causes:**
1. Token expired
2. localStorage cleared
3. Cookies blocked

**Solutions:**
1. Re-login (tokens expire after 15 min)
2. Check localStorage in DevTools
3. Allow cookies in browser settings

---

## 🔍 Debugging Tools

### **Browser DevTools**

**Check Zustand State:**
```javascript
// In Console tab
JSON.parse(localStorage.getItem('auth-storage'))
```

**Check Cookies:**
```
Application tab > Cookies > http://localhost:3000
```

**Network Requests:**
```
Network tab > Filter: /api/auth/
```

---

### **Server Console**

**OTP Codes:**
```
📱 [MOCK SMS] Sending OTP to +14155551234
Your verification code is: 123456
```

**Verification Success:**
```
🔐 OTP Verification initiated for: +14155551234
✅ OTP verified successfully for user: uuid
🗑️  OTP deleted after successful verification
🎫 Tokens generated for user: uuid
🍪 Session cookies set for user: uuid
```

---

## ✅ Test Checklist

### **Functional Tests**
- [ ] Login with valid phone
- [ ] Verify OTP successfully
- [ ] Access dashboard
- [ ] Logout clears state
- [ ] Invalid phone shows error
- [ ] Wrong OTP shows error
- [ ] Expired OTP blocks verification
- [ ] Resend OTP works
- [ ] Change phone works
- [ ] Protected routes redirect

### **UI/UX Tests**
- [ ] Loading states show
- [ ] Success/error alerts display
- [ ] Countdown timer works
- [ ] OTP auto-focus works
- [ ] Paste OTP works
- [ ] Backspace navigation works
- [ ] Mobile responsive
- [ ] Buttons are touch-friendly

### **Security Tests**
- [ ] Rate limiting enforced
- [ ] OTP hashed in database
- [ ] JWT tokens HTTP-only
- [ ] Tokens expire correctly
- [ ] Session persists on refresh
- [ ] Logout clears tokens

---

## 🎯 Success Criteria

All tests pass when:
1. ✅ User can login with phone
2. ✅ OTP is sent and verified
3. ✅ Dashboard is accessible
4. ✅ Session persists on refresh
5. ✅ Logout clears everything
6. ✅ Errors are handled gracefully
7. ✅ Mobile responsive design works
8. ✅ No console errors

---

## 📊 Test Coverage

**Backend API:** 100%
- ✅ POST /api/auth/request-otp
- ✅ POST /api/auth/verify-otp

**Frontend Pages:** 100%
- ✅ /login
- ✅ /verify-otp
- ✅ /dashboard

**State Management:** 100%
- ✅ Zustand auth store
- ✅ Local storage persistence
- ✅ Token expiration

**UI Components:** 100%
- ✅ Button
- ✅ Input
- ✅ Alert

---

**Ready to test!** 🚀

Run through all tests to ensure the OTP authentication flow is working correctly.
