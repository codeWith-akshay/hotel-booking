# Day 10 — Payment Integration (Stripe Sandbox)

**Status:** ✅ Completed  
**Date:** October 23, 2024

## Overview

Implemented a complete payment integration system using Stripe in test mode. This enables users to pay for provisional bookings and automatically convert them to confirmed bookings upon successful payment.

## What Was Built

### 1. Database Layer

**File:** `prisma/schema.prisma`

Added `Payment` model with:
- Payment tracking (id, bookingId, userId, provider)
- Stripe integration (providerPaymentId, sessionId)
- Amount & currency handling
- Status management (PENDING, SUCCEEDED, FAILED, REFUNDED, CANCELLED)
- Invoice storage (invoicePath)
- Error tracking (errorMessage)
- Timestamps (paidAt, refundedAt, createdAt, updatedAt)

**Migration:** `20251023083425_add_payments`

### 2. Validation Layer

**File:** `src/lib/validation/payment.validation.ts`

Zod schemas for:
- `CreatePaymentSessionSchema` - Frontend payment initiation
- `CreateOfflinePaymentSchema` - Admin manual payments
- `StripeWebhookEventSchema` - Webhook event validation
- `GetUserPaymentsSchema` - Payment history queries
- `ProcessRefundSchema` - Refund operations

Helper functions:
- `toSmallestUnit()` - Convert currency to cents
- `fromSmallestUnit()` - Convert cents to currency

### 3. Stripe Integration

**File:** `src/lib/stripe.ts`

Functions:
- `createCheckoutSession()` - Create Stripe Checkout session with idempotency
- `createPaymentIntent()` - Create PaymentIntent for card payments
- `verifyWebhookSignature()` - Verify Stripe webhook signatures
- `createRefund()` - Process refunds
- `retrieveCheckoutSession()` - Get session details
- `generateIdempotencyKey()` - Generate unique keys for duplicate prevention

Features:
- Environment validation
- Test mode detection
- Idempotency key generation
- Comprehensive error handling

### 4. Invoice System (Stub)

**File:** `src/lib/invoice.ts`

Placeholder implementation with:
- `generateInvoicePDF()` - Returns text buffer (ready for PDF integration)
- `prepareInvoiceData()` - Structures invoice data
- `generateInvoiceNumber()` - Creates unique invoice numbers
- `saveInvoice()` - Stub for saving invoices

**Future Integration:**
- `pdfkit` - Node.js PDF generation
- `puppeteer` - HTML to PDF conversion
- `@react-pdf/renderer` - React-based PDF generation

### 5. Server Actions

#### a. Create Payment Session

**File:** `src/actions/payments/createSession.action.ts`

Features:
- User authentication & authorization
- Booking validation (exists, belongs to user, provisional status)
- Server-side amount calculation
- Payment record creation with PENDING status
- Stripe Checkout session creation
- Metadata attachment for webhook processing
- Idempotency to prevent duplicate sessions

Flow:
```
User clicks "Pay Now"
  ↓
Validate user & booking
  ↓
Calculate amount server-side
  ↓
Create Payment record (PENDING)
  ↓
Create Stripe Checkout Session
  ↓
Update Payment with providerPaymentId
  ↓
Return checkout URL
  ↓
Redirect to Stripe
```

#### b. Record Offline Payment (Admin)

**File:** `src/actions/payments/recordOfflinePayment.action.ts`

Features:
- Admin-only access (ADMIN, SUPERADMIN roles)
- Manual payment recording for cash/bank transfer
- Same confirmation flow as webhook
- Invoice generation
- Booking status update to CONFIRMED
- Inventory decrement

Use case: Admin receives cash/check payment and needs to manually confirm booking.

### 6. Webhook Handler

**File:** `src/app/api/webhooks/stripe/route.ts`

Handles Stripe events:
- `checkout.session.completed` - Payment successful (main flow)
- `payment_intent.succeeded` - PaymentIntent success
- `payment_intent.payment_failed` - Payment failure
- `charge.refunded` - Refund processed

Payment success flow (atomic transaction):
1. Verify webhook signature
2. Update Payment status to SUCCEEDED
3. Update Booking status to CONFIRMED
4. Decrement RoomInventory for all booking dates
5. Generate invoice
6. Send confirmation email (TODO)

Security:
- Signature verification required
- Idempotency checks (prevents duplicate processing)
- Returns 200 OK to prevent Stripe retries

### 7. Frontend Components

#### a. Payment Button

**File:** `src/components/booking/PaymentButton.tsx`

Features:
- Loading states
- Error handling
- Stripe redirect
- Customizable styling (variant, size)
- Optional callbacks (onSuccess, onError)

Usage:
```tsx
<PaymentButton
  bookingId="booking_123"
  amount={10000} // $100.00 in cents
  currency="USD"
  label="Pay Now"
/>
```

#### b. Payment Success Page

**File:** `src/app/payments/success/page.tsx`

Shows:
- Payment confirmation
- Booking details (room, dates, guests)
- Payment details (amount, status, date)
- Invoice download button
- Next steps (check-in time, ID requirement)
- Actions (dashboard, new booking)

URL: `/payments/success?session_id=cs_test_xxx`

#### c. Payment Cancel Page

**File:** `src/app/payments/cancel/page.tsx`

Shows:
- Cancellation message
- Booking still provisional
- Help tips
- Actions (dashboard, try again)

URL: `/payments/cancel`

## Configuration

### Environment Variables

Add to `.env`:

```env
# ==========================================
# STRIPE CONFIGURATION
# ==========================================

# Stripe Secret Key (server-side)
# Get from: https://dashboard.stripe.com/test/apikeys
STRIPE_SECRET_KEY=sk_test_xxxxxxxxxxxxxxxxxxxxx

# Stripe Webhook Secret (for signature verification)
# Get from: https://dashboard.stripe.com/test/webhooks
# Or use Stripe CLI: stripe listen --forward-to localhost:3000/api/webhooks/stripe
STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxxxxxxxxxx

# Stripe Publishable Key (client-side)
# Get from: https://dashboard.stripe.com/test/apikeys
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_xxxxxxxxxxxxxxxxxxxxx

# Payment URLs (for Stripe redirect)
# Use ngrok or similar for local testing
NEXT_PUBLIC_BASE_URL=http://localhost:3000
```

### Getting Stripe Test Keys

1. **Sign up:** https://dashboard.stripe.com/register
2. **Enable Test Mode:** Toggle in top-right corner
3. **Get API Keys:** https://dashboard.stripe.com/test/apikeys
   - Copy "Secret key" (starts with `sk_test_`)
   - Copy "Publishable key" (starts with `pk_test_`)

### Setting Up Webhooks

#### Option 1: Stripe CLI (Recommended for local dev)

```bash
# Install Stripe CLI
# https://stripe.com/docs/stripe-cli

# Login
stripe login

# Forward webhooks to local server
stripe listen --forward-to localhost:3000/api/webhooks/stripe

# Copy the webhook signing secret (starts with whsec_)
# Add to .env as STRIPE_WEBHOOK_SECRET
```

#### Option 2: Webhook Endpoint (For deployed apps)

1. Go to: https://dashboard.stripe.com/test/webhooks
2. Click "Add endpoint"
3. Enter URL: `https://your-domain.com/api/webhooks/stripe`
4. Select events:
   - `checkout.session.completed`
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
   - `charge.refunded`
5. Copy signing secret → add to `.env`

## Testing

### Test with Stripe Test Cards

Stripe provides test card numbers:

```
✅ Success: 4242 4242 4242 4242
❌ Decline: 4000 0000 0000 0002
🔐 3D Secure: 4000 0025 0000 3155
```

- Use any future expiry date (e.g., 12/34)
- Use any 3-digit CVC (e.g., 123)
- Use any 5-digit ZIP (e.g., 12345)

More test cards: https://stripe.com/docs/testing

### Testing Flow

1. **Create provisional booking:**
   ```
   User → Select room → Select dates → Book
   ```

2. **Pay for booking:**
   ```
   Dashboard → View booking → Pay Now button
   ```

3. **Complete Stripe checkout:**
   ```
   Enter test card: 4242 4242 4242 4242
   Expiry: 12/34 | CVC: 123 | ZIP: 12345
   Click "Pay"
   ```

4. **Verify webhook:**
   ```
   Check server logs for:
   ✅ Webhook verified: checkout.session.completed
   ✅ Payment marked as SUCCEEDED
   ✅ Booking confirmed
   ✅ Inventory updated
   ✅ Invoice generated
   ```

5. **Check success page:**
   ```
   Should redirect to: /payments/success?session_id=cs_test_xxx
   Shows: Booking confirmation, payment details, invoice
   ```

### Admin Offline Payment Test

```typescript
// Admin panel → Bookings → Select booking → Record Payment
{
  bookingId: "booking_123",
  amount: 10000, // $100.00 in cents
  currency: "USD",
  paymentMethod: "cash",
  referenceNumber: "CASH-2024-001",
  notes: "Paid at reception"
}
```

## API Reference

### Create Payment Session

```typescript
import { createPaymentSession } from '@/actions/payments/createSession.action'

const result = await createPaymentSession({
  bookingId: 'booking_123',
  amount: 10000, // in cents
  currency: 'USD',
})

if (result.success) {
  // Redirect to Stripe
  window.location.href = result.checkoutUrl
} else {
  // Show error
  console.error(result.error)
}
```

### Record Offline Payment (Admin)

```typescript
import { recordOfflinePayment } from '@/actions/payments/recordOfflinePayment.action'

const result = await recordOfflinePayment({
  bookingId: 'booking_123',
  amount: 10000,
  currency: 'USD',
  paymentMethod: 'cash',
  referenceNumber: 'CASH-2024-001',
  notes: 'Paid at reception',
})

if (result.success) {
  console.log('Payment recorded:', result.paymentId)
  console.log('Invoice:', result.invoicePath)
}
```

### Get Payment Status

```typescript
const payment = await prisma.payment.findUnique({
  where: { id: 'payment_123' },
  include: {
    booking: {
      include: {
        roomType: true,
        user: true,
      },
    },
  },
})

console.log(payment.status) // PENDING | SUCCEEDED | FAILED | REFUNDED | CANCELLED
```

## Security Features

1. **Webhook Signature Verification**
   - Every webhook is verified using Stripe signature
   - Prevents replay attacks and tampering

2. **Server-Side Amount Calculation**
   - Amount is recalculated on server
   - Prevents client-side manipulation

3. **Idempotency Keys**
   - Prevents duplicate payment sessions
   - Safe to retry failed requests

4. **User Authorization**
   - Users can only pay for their own bookings
   - Admins can record payments for any booking

5. **Atomic Transactions**
   - Payment + Booking + Inventory updates are atomic
   - All succeed or all fail (no partial updates)

## Database Schema

```prisma
model Payment {
  id                 String        @id @default(cuid())
  bookingId          String?
  userId             String
  provider           String        // "STRIPE" | "OFFLINE"
  providerPaymentId  String?       @unique
  amount             Int           // in smallest currency unit
  currency           String        @default("USD")
  status             PaymentStatus @default(PENDING)
  metadata           String?       // JSON
  invoicePath        String?
  errorMessage       String?
  paidAt             DateTime?
  refundedAt         DateTime?
  createdAt          DateTime      @default(now())
  updatedAt          DateTime      @updatedAt

  // Relations
  user    User     @relation(fields: [userId], references: [id])
  booking Booking? @relation(fields: [bookingId], references: [id])

  @@index([userId])
  @@index([bookingId])
  @@index([status])
  @@index([providerPaymentId])
}

enum PaymentStatus {
  PENDING    // Payment initiated but not completed
  SUCCEEDED  // Payment successful
  FAILED     // Payment failed
  REFUNDED   // Payment refunded
  CANCELLED  // Payment cancelled
}
```

## Integration with Existing System

### Booking Flow Integration

**Before:**
```
Create Booking → Status: PROVISIONAL → Wait for approval
```

**After:**
```
Create Booking → Status: PROVISIONAL
  ↓
Pay → Status: CONFIRMED → Inventory decremented
```

### Inventory Management

When payment succeeds:
1. Find or create `RoomInventory` records for each date
2. Decrement `availableRooms` by 1
3. Prevents overbooking

### Email Integration (TODO)

After successful payment, send email with:
- Booking confirmation
- Payment receipt
- Invoice attachment
- Check-in instructions

## Future Enhancements

### 1. PDF Invoice Generation

Replace text buffer with actual PDF:

```bash
npm install pdfkit
```

Update `src/lib/invoice.ts`:
```typescript
import PDFDocument from 'pdfkit'

export async function generateInvoicePDF(payment) {
  const doc = new PDFDocument()
  // Add invoice content
  doc.end()
  return doc
}
```

### 2. Payment Refunds

Add refund action:

```typescript
// src/actions/payments/processRefund.action.ts
import { createRefund } from '@/lib/stripe'

export async function processRefund(paymentId: string, amount?: number) {
  // Find payment
  // Call createRefund()
  // Update payment status
  // Restore inventory
  // Update booking status
}
```

### 3. Partial Payments

Support:
- Down payment (e.g., 25%)
- Pay remaining amount later
- Multiple payments per booking

### 4. Alternative Payment Methods

Integrate:
- Razorpay (India)
- PayU (India)
- PayPal
- Bank transfer with verification

### 5. Payment History

Add user dashboard page:
```
/dashboard/payments
- List all payments
- Filter by status
- Download invoices
- View receipts
```

### 6. Automatic Refunds

Webhook handler for cancellations:
```typescript
case 'charge.refunded':
  // Restore inventory
  // Update booking status to CANCELLED
  // Send cancellation email
```

## Troubleshooting

### Webhook not receiving events

**Check:**
1. Stripe CLI is running: `stripe listen --forward-to localhost:3000/api/webhooks/stripe`
2. Webhook secret in `.env` matches CLI output
3. Server is running on correct port
4. `/api/webhooks/stripe/route.ts` exists

### Payment succeeds but booking not confirmed

**Check:**
1. Webhook logs for errors
2. Payment metadata contains correct bookingId
3. Database transaction didn't fail
4. RoomInventory model exists

### "Invalid signature" error

**Fix:**
1. Get new webhook secret from Stripe CLI
2. Update `STRIPE_WEBHOOK_SECRET` in `.env`
3. Restart server

### Amount mismatch error

**Cause:** Client-side amount doesn't match server calculation

**Fix:**
1. Server always recalculates from `booking.totalPrice`
2. Ensure `totalPrice` is set correctly when booking is created

## Files Created/Modified

### Created (9 files):
1. `prisma/migrations/20251023083425_add_payments/migration.sql`
2. `src/lib/validation/payment.validation.ts`
3. `src/lib/stripe.ts`
4. `src/lib/invoice.ts`
5. `src/actions/payments/createSession.action.ts`
6. `src/actions/payments/recordOfflinePayment.action.ts`
7. `src/app/api/webhooks/stripe/route.ts`
8. `src/components/booking/PaymentButton.tsx`
9. `src/app/payments/success/page.tsx`
10. `src/app/payments/cancel/page.tsx`

### Modified:
1. `prisma/schema.prisma` - Added Payment model
2. `.env.example` - Add Stripe keys (pending)

## Summary

✅ **Database:** Payment model with complete relations  
✅ **Validation:** Comprehensive Zod schemas  
✅ **Stripe:** Full integration with idempotency  
✅ **Webhooks:** Secure signature verification  
✅ **Actions:** Create session + offline payment  
✅ **Frontend:** Payment button + success/cancel pages  
✅ **Security:** Server-side validation, atomic transactions  
✅ **Testing:** Ready for Stripe test cards  

🔄 **Pending:** Email notifications, PDF invoices, refund flow

---

**Next Steps:**
1. Add Stripe keys to `.env`
2. Test payment flow with test cards
3. Set up Stripe CLI for webhook testing
4. Implement email notifications
5. Add PDF invoice generation
