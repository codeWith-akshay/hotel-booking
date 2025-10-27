# 🧪 Staging Environment - Pre-Production Test Plan

**Environment**: Staging (Vercel Preview)  
**Application**: Hotel Booking System  
**Test Date**: October 24, 2025  
**Tester**: QA Team / DevOps  
**Staging URL**: https://hotel-booking-staging.vercel.app

---

## 📋 Test Scope

This comprehensive test plan covers all critical user flows and features before production deployment.

---

## 🎯 Test Categories

### 1. Authentication & Authorization (OTP Flow)
### 2. Room Booking & Payment Processing
### 3. Invoice Generation & Download
### 4. Admin Dashboard Operations
### 5. Mobile Responsiveness
### 6. Accessibility Compliance
### 7. Performance & Load Testing
### 8. Security & Data Privacy

---

## 1️⃣ Authentication & Authorization Tests

### Test 1.1: User Signup (OTP Flow)

**Test Steps:**
1. Navigate to `/signup`
2. Enter phone number: `+1234567890`
3. Click "Send OTP"
4. Check for OTP delivery (console/email/SMS based on config)
5. Enter received OTP
6. Complete registration with name, email
7. Verify redirect to dashboard/home

**Expected Results:**
- ✅ OTP sent successfully
- ✅ OTP validation works correctly
- ✅ User account created in database
- ✅ User logged in after signup
- ✅ Session token created

**Test Data:**
- Phone: `+1234567890`
- Name: `Test User`
- Email: `testuser@staging.test`

**Edge Cases:**
- [ ] Invalid OTP (should show error)
- [ ] Expired OTP (should prompt resend)
- [ ] Duplicate phone number (should show error)
- [ ] Rate limiting (max 5 OTP requests per 15 min)

---

### Test 1.2: User Login (OTP Flow)

**Test Steps:**
1. Navigate to `/login`
2. Enter registered phone number
3. Request OTP
4. Enter OTP
5. Verify successful login

**Expected Results:**
- ✅ OTP sent to registered user
- ✅ Correct OTP allows login
- ✅ Session created
- ✅ Redirect to appropriate dashboard (member/admin)

**Edge Cases:**
- [ ] Non-existent phone number (should show error)
- [ ] Wrong OTP entered 3 times (should lock temporarily)
- [ ] Login from multiple devices (session handling)

---

### Test 1.3: Admin Login

**Test Steps:**
1. Login with admin credentials
2. Verify admin role
3. Check admin dashboard access

**Test Data:**
- Phone: `+1234567890` (admin account)
- Or Email: `admin@staging.test`

**Expected Results:**
- ✅ Admin can access `/admin` routes
- ✅ Admin menu items visible
- ✅ Member features also accessible

---

### Test 1.4: Session Management

**Test Steps:**
1. Login successfully
2. Check session persistence (refresh page)
3. Logout
4. Verify session cleared
5. Try accessing protected route (should redirect to login)

**Expected Results:**
- ✅ Session persists across page refreshes
- ✅ Logout clears session properly
- ✅ Protected routes require authentication

---

## 2️⃣ Room Booking & Payment Tests

### Test 2.1: Browse Available Rooms

**Test Steps:**
1. Navigate to `/rooms`
2. View room types and availability
3. Select check-in and check-out dates
4. Filter by room type, capacity, amenities
5. Verify pricing displayed correctly

**Expected Results:**
- ✅ All active room types displayed
- ✅ Availability calendar functional
- ✅ Pricing accurate (base + extras)
- ✅ Room details and images visible

---

### Test 2.2: Online Payment Booking (Stripe)

**Test Steps:**
1. Select a room type
2. Choose dates (e.g., 2 nights)
3. Add guest details
4. Select "Pay Online" option
5. Enter Stripe test card: `4242 4242 4242 4242`
6. Complete payment
7. Verify booking confirmation

**Test Data:**
- Card: `4242 4242 4242 4242` (Success)
- Expiry: Any future date (e.g., `12/26`)
- CVC: Any 3 digits (e.g., `123`)
- ZIP: Any 5 digits (e.g., `12345`)

**Expected Results:**
- ✅ Stripe checkout loads correctly
- ✅ Payment processes successfully
- ✅ Booking status: "CONFIRMED"
- ✅ Payment status: "PAID"
- ✅ Confirmation email sent
- ✅ Booking appears in user dashboard
- ✅ Room availability updated

**Edge Cases:**
- [ ] Declined card (`4000 0000 0000 0002`)
- [ ] Insufficient funds card (`4000 0000 0000 9995`)
- [ ] 3D Secure required (`4000 0025 0000 3155`)
- [ ] Payment timeout
- [ ] Double-booking prevention

---

### Test 2.3: Offline Payment Booking

**Test Steps:**
1. Select a room type
2. Choose dates
3. Add guest details
4. Select "Pay at Hotel" option
5. Submit booking
6. Verify booking created

**Expected Results:**
- ✅ Booking status: "PENDING" or "CONFIRMED"
- ✅ Payment status: "PENDING"
- ✅ Booking appears in user dashboard
- ✅ Admin notified of pending payment
- ✅ Room temporarily held (based on policy)

**Edge Cases:**
- [ ] Booking expiration if payment not received within X hours
- [ ] Admin can manually mark as paid

---

### Test 2.4: Group Booking

**Test Steps:**
1. Select multiple rooms or large capacity room
2. Enter group size (> 5 guests)
3. Complete booking (online or offline)
4. Verify group booking discount applied (if configured)

**Expected Results:**
- ✅ Group booking created successfully
- ✅ Multiple room allocation if needed
- ✅ Correct total pricing
- ✅ Group booking flag set in database

---

### Test 2.5: Special Days & Dynamic Pricing

**Test Steps:**
1. Book a room during special day (e.g., holiday, weekend)
2. Verify pricing reflects special day markup
3. Book regular day and compare pricing

**Expected Results:**
- ✅ Special day pricing applied automatically
- ✅ User sees breakdown: base price + special day charge
- ✅ Total calculated correctly

---

### Test 2.6: Booking Cancellation (User)

**Test Steps:**
1. Navigate to user dashboard
2. Find active booking
3. Click "Cancel Booking"
4. Confirm cancellation
5. Verify refund initiated (if paid online)

**Expected Results:**
- ✅ Booking status: "CANCELLED"
- ✅ Refund initiated for online payments
- ✅ Room availability restored
- ✅ Cancellation email sent

---

## 3️⃣ Invoice Generation & Download Tests

### Test 3.1: Auto-Invoice Generation

**Test Steps:**
1. Complete a booking (online or offline)
2. Navigate to booking details
3. Verify invoice auto-generated
4. Check invoice contains:
   - Booking reference number
   - Guest details
   - Room details
   - Check-in/out dates
   - Pricing breakdown
   - Payment status
   - Hotel branding/logo

**Expected Results:**
- ✅ Invoice generated immediately after booking
- ✅ All details accurate
- ✅ Professional formatting

---

### Test 3.2: Invoice PDF Download

**Test Steps:**
1. Navigate to booking details
2. Click "Download Invoice" button
3. Verify PDF downloads
4. Open PDF and check formatting

**Expected Results:**
- ✅ PDF downloads successfully
- ✅ PDF is readable and well-formatted
- ✅ All booking details present
- ✅ File name: `invoice-[booking-ref].pdf`

**Edge Cases:**
- [ ] Invoice download on mobile
- [ ] Invoice re-download (should be same invoice)
- [ ] Invoice for cancelled booking (should show cancelled status)

---

### Test 3.3: Invoice Email Delivery

**Test Steps:**
1. Complete booking
2. Check email (if email service configured)
3. Verify invoice attached to confirmation email

**Expected Results:**
- ✅ Invoice PDF attached to email
- ✅ Email sent to guest email address

---

## 4️⃣ Admin Dashboard Tests

### Test 4.1: View All Bookings

**Test Steps:**
1. Login as admin
2. Navigate to `/admin/bookings`
3. View all bookings (confirmed, pending, cancelled)
4. Filter by status, date, room type

**Expected Results:**
- ✅ All bookings visible
- ✅ Filters work correctly
- ✅ Booking details accessible
- ✅ Pagination works (if many bookings)

---

### Test 4.2: Approve Pending Booking

**Test Steps:**
1. Navigate to pending bookings
2. Select a pending (offline payment) booking
3. Click "Approve Booking"
4. Verify status changes to "CONFIRMED"

**Expected Results:**
- ✅ Booking status: "PENDING" → "CONFIRMED"
- ✅ Confirmation email sent to guest
- ✅ Room availability locked for dates

---

### Test 4.3: Cancel Booking (Admin Action)

**Test Steps:**
1. Navigate to bookings list
2. Select an active booking
3. Click "Cancel Booking"
4. Enter cancellation reason
5. Confirm cancellation

**Expected Results:**
- ✅ Booking status: "CANCELLED"
- ✅ Refund initiated (if applicable)
- ✅ Cancellation reason recorded
- ✅ Guest notified via email
- ✅ Room availability restored

---

### Test 4.4: Mark Payment as Received (Offline)

**Test Steps:**
1. Find offline payment booking
2. Click "Mark as Paid"
3. Enter payment details (amount, method)
4. Confirm

**Expected Results:**
- ✅ Payment status: "PENDING" → "PAID"
- ✅ Payment details recorded
- ✅ Receipt generated
- ✅ Guest notified

---

### Test 4.5: View Reports & Analytics

**Test Steps:**
1. Navigate to `/admin/reports`
2. View revenue reports
3. View occupancy rates
4. View booking trends
5. Export reports (if feature exists)

**Expected Results:**
- ✅ Charts and graphs render correctly
- ✅ Data accurate and up-to-date
- ✅ Date range filters work
- ✅ Export functionality works

---

### Test 4.6: Room Inventory Management

**Test Steps:**
1. Navigate to `/admin/rooms`
2. View all room types
3. Edit room details (price, description, amenities)
4. Add new room type
5. Deactivate/activate room type

**Expected Results:**
- ✅ CRUD operations work correctly
- ✅ Changes reflect immediately on public site
- ✅ Validation works (required fields)
- ✅ Images upload and display correctly

---

### Test 4.7: User Management

**Test Steps:**
1. Navigate to `/admin/users`
2. View all users
3. View user booking history
4. Change user role (member ↔ admin)
5. Deactivate user account

**Expected Results:**
- ✅ User list displays correctly
- ✅ Role changes take effect immediately
- ✅ Deactivated users cannot login
- ✅ User details editable

---

## 5️⃣ Mobile Responsiveness Tests

**Devices to Test:**
- Mobile: iPhone 12/13 (390x844)
- Mobile: Samsung Galaxy S21 (360x800)
- Tablet: iPad (768x1024)
- Tablet: iPad Pro (1024x1366)

### Test 5.1: Mobile Navigation

**Test Steps:**
1. Open site on mobile device
2. Test hamburger menu
3. Navigate between pages
4. Test all buttons and links

**Expected Results:**
- ✅ Menu opens and closes smoothly
- ✅ All links functional
- ✅ No horizontal scrolling
- ✅ Touch targets at least 44x44px

---

### Test 5.2: Mobile Booking Flow

**Test Steps:**
1. Complete entire booking flow on mobile
2. Test date picker on mobile
3. Enter payment details on mobile
4. Submit booking

**Expected Results:**
- ✅ All forms usable on mobile
- ✅ Date picker works on touch devices
- ✅ Payment form responsive
- ✅ No layout breaking

---

### Test 5.3: Mobile Admin Dashboard

**Test Steps:**
1. Login as admin on mobile
2. Navigate admin sections
3. Perform admin actions

**Expected Results:**
- ✅ Admin tables responsive
- ✅ Actions accessible on mobile
- ✅ No cut-off content

---

## 6️⃣ Accessibility Tests

### Test 6.1: Keyboard Navigation

**Test Steps:**
1. Navigate entire site using TAB key only
2. Test form submission with ENTER
3. Test dropdown menus with arrow keys
4. Verify focus indicators visible

**Expected Results:**
- ✅ All interactive elements accessible via keyboard
- ✅ Logical tab order
- ✅ Clear focus indicators
- ✅ No keyboard traps

---

### Test 6.2: Screen Reader Compatibility

**Tools:** NVDA (Windows), VoiceOver (Mac/iOS), TalkBack (Android)

**Test Steps:**
1. Enable screen reader
2. Navigate homepage
3. Complete booking flow
4. Verify announcements clear and helpful

**Expected Results:**
- ✅ All images have alt text
- ✅ Form labels associated correctly
- ✅ ARIA labels present where needed
- ✅ Headings structured properly (h1, h2, h3)
- ✅ Error messages announced

---

### Test 6.3: Color Contrast

**Tools:** WAVE, Lighthouse, axe DevTools

**Test Steps:**
1. Run automated accessibility audit
2. Check all text has minimum 4.5:1 contrast ratio
3. Test in high contrast mode

**Expected Results:**
- ✅ All text readable
- ✅ WCAG AA compliance minimum
- ✅ No color-only information indicators

---

### Test 6.4: Font Scaling

**Test Steps:**
1. Zoom browser to 200%
2. Test all pages
3. Verify no content cut off

**Expected Results:**
- ✅ Text scales properly
- ✅ Layout remains usable
- ✅ No horizontal scroll at 200% zoom

---

## 7️⃣ Performance Tests

### Test 7.1: Page Load Speed

**Tools:** Lighthouse, WebPageTest

**Test Steps:**
1. Run Lighthouse audit
2. Check Core Web Vitals:
   - LCP (Largest Contentful Paint) < 2.5s
   - FID (First Input Delay) < 100ms
   - CLS (Cumulative Layout Shift) < 0.1

**Expected Results:**
- ✅ Performance score > 90
- ✅ All metrics in "good" range

---

### Test 7.2: API Response Times

**Test Steps:**
1. Open browser DevTools Network tab
2. Load various pages
3. Check API response times

**Expected Results:**
- ✅ GET requests < 200ms
- ✅ POST requests < 500ms
- ✅ Database queries optimized

---

### Test 7.3: Concurrent Bookings (Race Condition)

**Test Steps:**
1. Open same room booking page in 2 tabs
2. Select same dates in both
3. Submit both simultaneously
4. Verify only one succeeds

**Expected Results:**
- ✅ No double-booking
- ✅ Second request shows "Room unavailable"
- ✅ Database transaction handling correct

---

## 8️⃣ Security Tests

### Test 8.1: Authentication Security

**Test Steps:**
- [ ] Try accessing admin routes without login (should redirect)
- [ ] Try accessing other user's bookings (should deny)
- [ ] Test OTP expiration (should reject after 10 minutes)
- [ ] Test rate limiting on OTP requests

**Expected Results:**
- ✅ All protected routes secured
- ✅ No unauthorized access
- ✅ Rate limiting active

---

### Test 8.2: Payment Security

**Test Steps:**
- [ ] Verify Stripe keys are test mode
- [ ] Check webhook signature validation
- [ ] Attempt payment manipulation (should fail)

**Expected Results:**
- ✅ Only test payments processed
- ✅ Webhook signatures validated
- ✅ Payment amounts cannot be manipulated client-side

---

### Test 8.3: Data Validation

**Test Steps:**
- [ ] Submit forms with XSS payloads: `<script>alert('XSS')</script>`
- [ ] Submit SQL injection attempts: `' OR '1'='1`
- [ ] Test API endpoints with invalid data

**Expected Results:**
- ✅ Input sanitized
- ✅ XSS prevented
- ✅ SQL injection prevented
- ✅ Proper error messages (no sensitive data leaked)

---

## 9️⃣ Edge Cases & Error Handling

### Test 9.1: Network Errors

**Test Steps:**
1. Simulate slow network (throttling)
2. Simulate offline mode
3. Submit form and disconnect before response

**Expected Results:**
- ✅ Loading states shown
- ✅ Timeout errors handled gracefully
- ✅ Retry mechanisms work

---

### Test 9.2: Database Errors

**Test Steps:**
1. Temporarily disconnect database (if possible in staging)
2. Trigger database-dependent actions

**Expected Results:**
- ✅ Graceful error messages
- ✅ No application crash
- ✅ Errors logged properly

---

### Test 9.3: Invalid URLs

**Test Steps:**
1. Navigate to `/nonexistent-page`
2. Try invalid booking ID: `/booking/invalid-id`

**Expected Results:**
- ✅ 404 page shown
- ✅ User can navigate back to home
- ✅ Invalid IDs return proper error

---

## 🔟 Cross-Browser Testing

**Browsers to Test:**
- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Edge (latest)
- [ ] Mobile Safari (iOS)
- [ ] Mobile Chrome (Android)

**Test Focus:**
- Visual consistency
- Form functionality
- Payment processing
- Date pickers

---

## 📊 Test Execution Tracking

### Quick Checklist

- [ ] **Authentication**: Signup, Login, Logout, Session
- [ ] **Bookings**: Online payment, Offline payment, Cancellation
- [ ] **Invoices**: Generation, Download, Email delivery
- [ ] **Admin**: Approve, Cancel, Reports, User mgmt
- [ ] **Mobile**: iPhone, Android, iPad
- [ ] **Accessibility**: Keyboard, Screen reader, Contrast
- [ ] **Performance**: Load speed, API times, Concurrency
- [ ] **Security**: Auth protection, Payment security, Input validation
- [ ] **Cross-browser**: Chrome, Firefox, Safari, Edge

---

## 🐛 Bug Report Template

When a test fails, document using this template:

```markdown
### Bug #[NUMBER]: [Short Title]

**Severity**: Critical | High | Medium | Low
**Component**: Auth | Booking | Payment | Admin | UI | etc.
**Environment**: Staging
**URL**: [Page where bug found]

**Steps to Reproduce**:
1. 
2. 
3. 

**Expected Result**:
[What should happen]

**Actual Result**:
[What actually happened]

**Screenshots/Logs**:
[Attach if applicable]

**Browser/Device**:
[e.g., Chrome 120 on Windows 11]

**Assigned To**: [Developer name]
**Status**: Open | In Progress | Fixed | Verified
```

---

## ✅ Test Sign-Off

**Test Completion Criteria:**
- All critical tests passed
- No critical or high severity bugs open
- Performance metrics met
- Accessibility score > 90
- Mobile experience verified
- Cross-browser compatibility confirmed

**Sign-Off:**
- Tester: _________________ Date: _______
- Reviewer: _________________ Date: _______
- Product Owner: _________________ Date: _______

---

**Next Steps After Testing:**
1. Generate test report (see STAGING_TEST_REPORT.md)
2. Fix all critical bugs
3. Re-test fixed bugs
4. Obtain stakeholder approval
5. Deploy to production

---

**Document Version**: 1.0.0  
**Last Updated**: October 24, 2025  
**Created By**: DevOps/QA Team
