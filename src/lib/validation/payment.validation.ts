// ==========================================
// PAYMENT VALIDATION SCHEMAS
// ==========================================
// Zod schemas for payment operations and validation

import { z } from 'zod'

// ==========================================
// ENUMS
// ==========================================

export const PaymentStatusSchema = z.enum([
  'PENDING',
  'SUCCEEDED',
  'FAILED',
  'REFUNDED',
  'CANCELLED'
] as const)

export const PaymentProviderSchema = z.enum([
  'stripe',
  'razorpay',
  'payu',
  'offline'
] as const)

// ==========================================
// PAYMENT CREATION SCHEMAS
// ==========================================

/**
 * Schema for creating a payment session
 * Used when user proceeds to payment for a provisional booking
 */
export const CreatePaymentSessionSchema = z.object({
  bookingId: z.string().cuid('Invalid booking ID'),
  // Amount is optional - server will calculate from booking
  // If provided, server will validate it matches the booking total
  amount: z.number().int().positive().optional(),
  currency: z.string().length(3).default('USD'),
  // Success and cancel URLs for redirect after payment
  successUrl: z.string().url().optional(),
  cancelUrl: z.string().url().optional(),
})

/**
 * Input type for creating payment session
 */
export type CreatePaymentSessionInput = z.infer<typeof CreatePaymentSessionSchema>

/**
 * Response type for payment session creation
 */
export const PaymentSessionResponseSchema = z.object({
  success: z.boolean(),
  message: z.string().optional(),
  error: z.string().optional(),
  data: z.object({
    sessionId: z.string(),
    paymentId: z.string(), // Our internal payment record ID
    url: z.string().url(), // Stripe Checkout URL
    // For direct PaymentIntent flow (alternative to Checkout)
    clientSecret: z.string().optional(),
  }).optional(),
})

export type PaymentSessionResponse = z.infer<typeof PaymentSessionResponseSchema>

// ==========================================
// ADMIN OFFLINE PAYMENT SCHEMAS
// ==========================================

/**
 * Schema for admin to record offline payment
 * Used when payment is made via cash, bank transfer, etc.
 */
export const CreateOfflinePaymentSchema = z.object({
  bookingId: z.string().cuid('Invalid booking ID'),
  amount: z.number().int().positive('Amount must be positive'),
  currency: z.string().length(3).default('USD'),
  paymentMethod: z.string().default('offline'),
  referenceNumber: z.string().optional(),
  notes: z.string().max(500).optional(),
  // Allow admin to specify payment date
  paidAt: z.date().optional(),
})

/**
 * Input type for offline payment
 */
export type CreateOfflinePaymentInput = z.infer<typeof CreateOfflinePaymentSchema>

// ==========================================
// WEBHOOK SCHEMAS
// ==========================================

/**
 * Schema for Stripe webhook event
 * Used for logging and basic validation
 */
export const StripeWebhookEventSchema = z.object({
  id: z.string(),
  type: z.string(),
  data: z.object({
    object: z.any(),
  }),
  created: z.number(),
})

/**
 * Metadata attached to Stripe sessions/intents
 */
export const StripeMetadataSchema = z.object({
  paymentId: z.string().cuid(),
  bookingId: z.string().cuid(),
  userId: z.string().cuid(),
})

export type StripeMetadata = z.infer<typeof StripeMetadataSchema>

// ==========================================
// PAYMENT QUERY SCHEMAS
// ==========================================

/**
 * Schema for fetching payment by ID
 */
export const GetPaymentByIdSchema = z.object({
  id: z.string().cuid('Invalid payment ID'),
})

export type GetPaymentByIdInput = z.infer<typeof GetPaymentByIdSchema>

/**
 * Schema for fetching payments by booking
 */
export const GetPaymentsByBookingSchema = z.object({
  bookingId: z.string().cuid('Invalid booking ID'),
})

export type GetPaymentsByBookingInput = z.infer<typeof GetPaymentsByBookingSchema>

/**
 * Schema for fetching user payments
 */
export const GetUserPaymentsSchema = z.object({
  userId: z.string().cuid('Invalid user ID').optional(),
  status: PaymentStatusSchema.optional(),
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(20),
  sortBy: z.enum(['createdAt', 'paidAt', 'amount']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
})

export type GetUserPaymentsInput = z.infer<typeof GetUserPaymentsSchema>

// ==========================================
// REFUND SCHEMAS
// ==========================================

/**
 * Schema for processing refund
 */
export const ProcessRefundSchema = z.object({
  paymentId: z.string().cuid('Invalid payment ID'),
  amount: z.number().int().positive().optional(), // Partial refund if specified
  reason: z.string().max(500).optional(),
})

export type ProcessRefundInput = z.infer<typeof ProcessRefundSchema>

// ==========================================
// PAYMENT RESPONSE TYPES
// ==========================================

/**
 * Payment with related data for API responses
 */
export const PaymentWithDetailsSchema = z.object({
  id: z.string(),
  bookingId: z.string().nullable(),
  userId: z.string(),
  provider: z.string(),
  providerPaymentId: z.string().nullable(),
  amount: z.number(),
  currency: z.string(),
  status: PaymentStatusSchema,
  metadata: z.string().nullable(),
  invoicePath: z.string().nullable(),
  errorMessage: z.string().nullable(),
  paidAt: z.date().nullable(),
  refundedAt: z.date().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
  // Related data
  booking: z.object({
    id: z.string(),
    startDate: z.date(),
    endDate: z.date(),
    status: z.enum(['PROVISIONAL', 'CONFIRMED', 'CANCELLED']),
    roomType: z.object({
      id: z.string(),
      name: z.string(),
    }),
  }).nullable().optional(),
  user: z.object({
    id: z.string(),
    name: z.string(),
    email: z.string().nullable(),
    phone: z.string(),
  }).optional(),
})

export type PaymentWithDetails = z.infer<typeof PaymentWithDetailsSchema>

// ==========================================
// RAZORPAY / PAYU SCHEMAS (for reference)
// ==========================================

/**
 * NOTE: For Razorpay integration
 * - Use similar CreatePaymentSessionSchema
 * - Razorpay returns order_id instead of session_id
 * - Verification uses HMAC signature: razorpay_order_id + "|" + razorpay_payment_id
 * - Webhook signature verification: crypto.createHmac('sha256', secret).update(body).digest('hex')
 */

/**
 * NOTE: For PayU integration
 * - Similar flow but uses different parameter names
 * - Hash calculation: sha512(key|txnid|amount|productinfo|firstname|email|udf1|...|salt)
 * - Webhook verification uses similar hash mechanism
 * - Store hash in metadata for verification
 */

// ==========================================
// HELPER FUNCTIONS
// ==========================================

/**
 * Validate currency code
 */
export function isValidCurrency(code: string): boolean {
  const validCurrencies = ['USD', 'INR', 'EUR', 'GBP', 'CAD', 'AUD']
  return validCurrencies.includes(code.toUpperCase())
}

/**
 * Convert amount to smallest currency unit
 * USD: dollars to cents (*100)
 * INR: rupees to paise (*100)
 */
export function toSmallestUnit(amount: number, currency: string): number {
  // Most currencies use 2 decimal places
  // JPY, KRW don't use decimals (multiply by 1)
  const zeroDecimalCurrencies = ['JPY', 'KRW', 'VND']
  
  if (zeroDecimalCurrencies.includes(currency.toUpperCase())) {
    return Math.round(amount)
  }
  
  return Math.round(amount * 100)
}

/**
 * Convert from smallest currency unit to major unit
 */
export function fromSmallestUnit(amount: number, currency: string): number {
  const zeroDecimalCurrencies = ['JPY', 'KRW', 'VND']
  
  if (zeroDecimalCurrencies.includes(currency.toUpperCase())) {
    return amount
  }
  
  return amount / 100
}
