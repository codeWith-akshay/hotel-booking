# Staging Environment Test Plan

## Test Environment
- **URL**: https://hotel-booking-staging.vercel.app
- **Database**: PostgreSQL (Staging)
- **Payment**: Stripe Test Mode
- **Environment**: `.env.staging`

---

## Test Execution Summary

**Test Date**: [To be filled]  
**Tester**: [To be filled]  
**Build Version**: [To be filled]  
**Duration**: [To be filled]

---

## 1. Authentication & User Management

### 1.1 Signup Flow with OTP

**Test Steps**:
1. Navigate to `/signup` or click "Sign Up"
2. Enter valid phone number
3. Request OTP
4. Enter correct OTP code
5. Complete registration form
6. Submit and verify account creation

**Expected Results**:
- [ ] Phone number input accepts valid formats
- [ ] OTP sent successfully (check logs/email)
- [ ] OTP validation works correctly
- [ ] Account created in database
- [ ] User redirected to dashboard/home
- [ ] Session created successfully

**Test Data**:
- Valid phone: +1234567890
- Test cards: 4242 4242 4242 4242

**Status**: ⏳ Pending | ✅ Pass | ❌ Fail  
**Bugs Found**: [List any bugs]

---

### 1.2 Login Flow with OTP

**Test Steps**:
1. Navigate to `/login`
2. Enter registered phone number
3. Request OTP
4. Enter correct OTP
5. Verify login success

**Expected Results**:
- [ ] Existing user identified
- [ ] OTP sent to registered phone
- [ ] OTP validation successful
- [ ] User logged in and redirected
- [ ] Session persists across page refresh

**Status**: ⏳ Pending | ✅ Pass | ❌ Fail  
**Bugs Found**: [List any bugs]

---

### 1.3 OTP Error Handling

**Test Cases**:
- [ ] Invalid OTP code → Shows error message
- [ ] Expired OTP → Shows expired message
- [ ] Too many attempts → Rate limiting works
- [ ] Invalid phone number → Validation error

**Status**: ⏳ Pending | ✅ Pass | ❌ Fail

---

## 2. Room Booking Flow

### 2.1 Browse and Search Rooms

**Test Steps**:
1. Navigate to booking page
2. Select check-in/check-out dates
3. Choose number of guests
4. View available room types
5. Filter/sort results

**Expected Results**:
- [ ] Date picker works correctly
- [ ] Available rooms shown based on dates
- [ ] Room details displayed properly
- [ ] Pricing calculated correctly
- [ ] Images load properly

**Status**: ⏳ Pending | ✅ Pass | ❌ Fail

---

### 2.2 Create Booking - Online Payment

**Test Steps**:
1. Select room type
2. Choose dates and room quantity
3. Fill guest details
4. Select "Online Payment"
5. Enter Stripe test card: 4242 4242 4242 4242
6. Complete payment
7. Verify booking confirmation

**Expected Results**:
- [ ] Room selection works
- [ ] Date validation (no past dates)
- [ ] Price calculation correct
- [ ] Guest details form validates
- [ ] Stripe payment form loads
- [ ] Payment processes successfully
- [ ] Booking created in database
- [ ] Confirmation email/notification sent
- [ ] Booking appears in user dashboard

**Test Cards**:
- Success: 4242 4242 4242 4242
- Decline: 4000 0000 0000 0002
- 3D Secure: 4000 0025 0000 3155

**Status**: ⏳ Pending | ✅ Pass | ❌ Fail  
**Bugs Found**: [List any bugs]

---

### 2.3 Create Booking - Offline Payment

**Test Steps**:
1. Select room type
2. Choose dates
3. Fill guest details
4. Select "Offline Payment" (Pay at Hotel)
5. Submit booking
6. Verify booking created with PENDING_PAYMENT status

**Expected Results**:
- [ ] Offline payment option available
- [ ] Booking created without payment
- [ ] Status set to PENDING_PAYMENT
- [ ] Confirmation message shown
- [ ] Booking appears in dashboard
- [ ] Admin can see pending payment

**Status**: ⏳ Pending | ✅ Pass | ❌ Fail

---

### 2.4 Booking Validations

**Test Cases**:
- [ ] Past dates rejected
- [ ] Check-out before check-in rejected
- [ ] Insufficient rooms shows error
- [ ] Required fields validated
- [ ] Duplicate booking prevention (idempotency)
- [ ] Concurrent booking handling

**Status**: ⏳ Pending | ✅ Pass | ❌ Fail

---

## 3. Payment Processing

### 3.1 Online Payment Success Flow

**Test Steps**:
1. Create booking with online payment
2. Use success test card
3. Complete payment
4. Verify payment status

**Expected Results**:
- [ ] Payment intent created
- [ ] Stripe redirect works
- [ ] Payment confirmed
- [ ] Booking status updated to CONFIRMED
- [ ] Payment record created
- [ ] Webhook processed correctly

**Status**: ⏳ Pending | ✅ Pass | ❌ Fail

---

### 3.2 Online Payment Failure Flow

**Test Steps**:
1. Create booking
2. Use declined test card: 4000 0000 0000 0002
3. Attempt payment
4. Verify error handling

**Expected Results**:
- [ ] Payment declined
- [ ] Error message shown to user
- [ ] Booking status remains PENDING
- [ ] User can retry payment
- [ ] No duplicate charges

**Status**: ⏳ Pending | ✅ Pass | ❌ Fail

---

### 3.3 Payment Webhook Processing

**Test Steps**:
1. Trigger payment events via Stripe
2. Check webhook endpoint logs
3. Verify database updates

**Expected Results**:
- [ ] Webhook endpoint responds 200
- [ ] Signature verification works
- [ ] Payment status updated
- [ ] Booking status updated
- [ ] Notifications sent

**Status**: ⏳ Pending | ✅ Pass | ❌ Fail

---

## 4. Invoice Generation & Download

### 4.1 Automatic Invoice Generation

**Test Steps**:
1. Complete a successful booking
2. Check if invoice is auto-generated
3. Verify invoice details

**Expected Results**:
- [ ] Invoice created automatically
- [ ] Invoice number generated
- [ ] All booking details included
- [ ] Payment information correct
- [ ] Total amount matches booking

**Status**: ⏳ Pending | ✅ Pass | ❌ Fail

---

### 4.2 Invoice Download (PDF)

**Test Steps**:
1. Navigate to booking details
2. Click "Download Invoice"
3. Verify PDF generation and download

**Expected Results**:
- [ ] Download button visible
- [ ] PDF generates successfully
- [ ] PDF opens/downloads correctly
- [ ] PDF contains all required info:
  - [ ] Invoice number
  - [ ] Booking dates
  - [ ] Room details
  - [ ] Guest information
  - [ ] Payment details
  - [ ] Total amount
  - [ ] Hotel logo/branding

**Status**: ⏳ Pending | ✅ Pass | ❌ Fail  
**Bugs Found**: [List any bugs]

---

### 4.3 Invoice Viewing

**Test Steps**:
1. View invoice in browser
2. Check formatting and layout
3. Verify all sections present

**Expected Results**:
- [ ] Invoice displays correctly
- [ ] Professional layout
- [ ] All sections visible
- [ ] Print-friendly format

**Status**: ⏳ Pending | ✅ Pass | ❌ Fail

---

## 5. Admin Dashboard

### 5.1 Admin Login & Access

**Test Steps**:
1. Login as admin user
2. Access admin dashboard
3. Verify admin-only features visible

**Expected Results**:
- [ ] Admin can login
- [ ] Admin dashboard accessible
- [ ] Regular users cannot access admin routes
- [ ] Proper RBAC enforcement

**Status**: ⏳ Pending | ✅ Pass | ❌ Fail

---

### 5.2 View All Bookings

**Test Steps**:
1. Navigate to admin bookings page
2. View list of all bookings
3. Filter by status, date, user

**Expected Results**:
- [ ] All bookings displayed
- [ ] Pagination works
- [ ] Filters work correctly
- [ ] Search functionality works
- [ ] Sorting works

**Status**: ⏳ Pending | ✅ Pass | ❌ Fail

---

### 5.3 Approve Booking

**Test Steps**:
1. Find PENDING booking
2. Click "Approve"
3. Confirm action
4. Verify status change

**Expected Results**:
- [ ] Approve button visible for pending bookings
- [ ] Confirmation dialog shown
- [ ] Booking status updated to CONFIRMED
- [ ] User notified of approval
- [ ] Audit log created
- [ ] Invoice generated (if not already)

**Status**: ⏳ Pending | ✅ Pass | ❌ Fail  
**Bugs Found**: [List any bugs]

---

### 5.4 Cancel Booking

**Test Steps**:
1. Select active booking
2. Click "Cancel"
3. Enter cancellation reason
4. Confirm cancellation
5. Verify cancellation processed

**Expected Results**:
- [ ] Cancel button available
- [ ] Reason field required
- [ ] Booking status updated to CANCELLED
- [ ] Refund initiated (if applicable)
- [ ] Room inventory updated
- [ ] User notified
- [ ] Audit log created

**Status**: ⏳ Pending | ✅ Pass | ❌ Fail  
**Bugs Found**: [List any bugs]

---

### 5.5 Manage Room Inventory

**Test Steps**:
1. Navigate to room management
2. View room inventory
3. Update availability
4. Add/edit room types

**Expected Results**:
- [ ] Inventory displayed correctly
- [ ] Can modify room availability
- [ ] Changes saved to database
- [ ] Real-time updates work

**Status**: ⏳ Pending | ✅ Pass | ❌ Fail

---

### 5.6 View Reports

**Test Steps**:
1. Access reports section
2. View occupancy reports
3. View revenue reports
4. Export data

**Expected Results**:
- [ ] Reports load correctly
- [ ] Data accurate
- [ ] Date filters work
- [ ] Export functionality works
- [ ] Charts/graphs display properly

**Status**: ⏳ Pending | ✅ Pass | ❌ Fail

---

## 6. Mobile Responsiveness

### 6.1 Mobile Layout Testing

**Devices to Test**:
- [ ] iPhone 12/13/14 (390x844)
- [ ] iPhone SE (375x667)
- [ ] Samsung Galaxy S21 (360x800)
- [ ] iPad (768x1024)
- [ ] iPad Pro (1024x1366)

**Test Steps**:
1. Open site on mobile device/emulator
2. Navigate through all pages
3. Test all interactive elements
4. Check form inputs

**Expected Results**:
- [ ] Layout adapts to screen size
- [ ] No horizontal scrolling
- [ ] Touch targets adequate size (44x44px minimum)
- [ ] Text readable without zooming
- [ ] Images scale properly
- [ ] Navigation menu works (hamburger)
- [ ] Forms usable on mobile
- [ ] Buttons easily tappable
- [ ] Modal dialogs work correctly

**Status**: ⏳ Pending | ✅ Pass | ❌ Fail  
**Bugs Found**: [List any bugs]

---

### 6.2 Tablet Testing

**Test Steps**:
1. Test on iPad/Android tablet
2. Check landscape and portrait modes
3. Verify layout optimization

**Expected Results**:
- [ ] Proper layout for tablet sizes
- [ ] Both orientations work
- [ ] Content properly spaced

**Status**: ⏳ Pending | ✅ Pass | ❌ Fail

---

### 6.3 Touch Interactions

**Test Cases**:
- [ ] Date picker works with touch
- [ ] Dropdowns work on mobile
- [ ] Swipe gestures (if applicable)
- [ ] Pinch to zoom disabled where needed
- [ ] Long press behaviors

**Status**: ⏳ Pending | ✅ Pass | ❌ Fail

---

## 7. Accessibility (WCAG 2.1 AA)

### 7.1 Keyboard Navigation

**Test Steps**:
1. Navigate site using only keyboard
2. Test Tab/Shift+Tab navigation
3. Test Enter/Space for activation
4. Test Escape to close modals

**Expected Results**:
- [ ] All interactive elements focusable
- [ ] Focus order logical
- [ ] Focus indicators visible
- [ ] No keyboard traps
- [ ] Skip to main content link works

**Status**: ⏳ Pending | ✅ Pass | ❌ Fail

---

### 7.2 Screen Reader Testing

**Tools**: NVDA (Windows), VoiceOver (Mac), TalkBack (Android)

**Test Steps**:
1. Enable screen reader
2. Navigate through site
3. Test form completion
4. Test booking process

**Expected Results**:
- [ ] Page title announced
- [ ] Headings properly structured (H1-H6)
- [ ] Links have descriptive text
- [ ] Images have alt text
- [ ] Form labels associated with inputs
- [ ] Error messages announced
- [ ] Dynamic content changes announced
- [ ] ARIA labels used correctly

**Status**: ⏳ Pending | ✅ Pass | ❌ Fail  
**Bugs Found**: [List any bugs]

---

### 7.3 Color Contrast

**Test Steps**:
1. Use browser color contrast checker
2. Check all text/background combinations
3. Verify WCAG AA compliance (4.5:1)

**Expected Results**:
- [ ] All text meets 4.5:1 ratio
- [ ] Large text meets 3:1 ratio
- [ ] Links distinguishable from text
- [ ] Focus indicators meet 3:1 ratio

**Tools**: 
- Chrome DevTools Lighthouse
- WAVE browser extension
- Contrast Checker

**Status**: ⏳ Pending | ✅ Pass | ❌ Fail

---

### 7.4 Forms Accessibility

**Test Cases**:
- [ ] All inputs have labels
- [ ] Required fields marked
- [ ] Error messages associated with fields
- [ ] Instructions provided
- [ ] Autocomplete attributes set

**Status**: ⏳ Pending | ✅ Pass | ❌ Fail

---

## 8. Performance Testing

### 8.1 Page Load Speed

**Test Steps**:
1. Open Chrome DevTools → Lighthouse
2. Run performance audit
3. Check Core Web Vitals

**Target Metrics**:
- [ ] First Contentful Paint < 1.8s
- [ ] Largest Contentful Paint < 2.5s
- [ ] Total Blocking Time < 200ms
- [ ] Cumulative Layout Shift < 0.1
- [ ] Time to Interactive < 3.8s

**Status**: ⏳ Pending | ✅ Pass | ❌ Fail

---

### 8.2 API Response Times

**Test Endpoints**:
- [ ] `/api/db/health` < 100ms
- [ ] `/api/rooms` < 500ms
- [ ] `/api/bookings` < 1000ms
- [ ] `/api/payments` < 1500ms

**Status**: ⏳ Pending | ✅ Pass | ❌ Fail

---

## 9. Security Testing

### 9.1 Authentication & Authorization

**Test Cases**:
- [ ] Unauthenticated users cannot access protected routes
- [ ] Regular users cannot access admin routes
- [ ] JWT tokens expire correctly
- [ ] Session management secure
- [ ] CSRF protection works

**Status**: ⏳ Pending | ✅ Pass | ❌ Fail

---

### 9.2 Input Validation

**Test Cases**:
- [ ] SQL injection attempts blocked
- [ ] XSS attempts sanitized
- [ ] File upload restrictions work
- [ ] Rate limiting enforced

**Status**: ⏳ Pending | ✅ Pass | ❌ Fail

---

## 10. Cross-Browser Testing

**Browsers to Test**:
- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Edge (latest)
- [ ] Mobile Safari (iOS)
- [ ] Chrome Mobile (Android)

**Status**: ⏳ Pending | ✅ Pass | ❌ Fail

---

## Test Summary

### Overall Results

**Total Tests**: [Count]  
**Passed**: [Count] ✅  
**Failed**: [Count] ❌  
**Pending**: [Count] ⏳

**Pass Rate**: [Percentage]%

### Critical Bugs Found

1. [Bug #1 - Description]
2. [Bug #2 - Description]
3. [Bug #3 - Description]

### Non-Critical Bugs

1. [Bug #1 - Description]
2. [Bug #2 - Description]

### Recommendations

1. [Recommendation #1]
2. [Recommendation #2]
3. [Recommendation #3]

---

## Sign-Off

**Tested By**: ________________  
**Date**: ________________  
**Approved By**: ________________  
**Date**: ________________

---

**Next Steps**:
1. Fix critical bugs
2. Retest failed scenarios
3. Deploy to production

---

**Document Version**: 1.0  
**Last Updated**: October 24, 2024
