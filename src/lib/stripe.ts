// ==========================================
// STRIPE CLIENT WRAPPER
// ==========================================
// Stripe SDK configuration and helper functions
// Handles Stripe API initialization and common operations

import Stripe from 'stripe'

// ==========================================
// ENVIRONMENT VARIABLES VALIDATION
// ==========================================

// Make Stripe optional for build - only validate at runtime
const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY || ''
const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET

if (!STRIPE_SECRET_KEY && process.env.NODE_ENV === 'production') {
  console.warn(
    'WARNING: STRIPE_SECRET_KEY is not defined. ' +
    'Payment features will not work until this is configured.'
  )
}

// Optional but recommended for production
if (!STRIPE_WEBHOOK_SECRET && process.env.NODE_ENV === 'production') {
  console.warn(
    'WARNING: STRIPE_WEBHOOK_SECRET is not defined. ' +
    'Webhook signature verification will fail in production.'
  )
}

// ==========================================
// STRIPE CLIENT INITIALIZATION
// ==========================================

/**
 * Stripe client instance
 * Initialized with secret key from environment
 * Uses latest API version
 * Returns null if STRIPE_SECRET_KEY is not configured
 */
export const stripe = STRIPE_SECRET_KEY 
  ? new Stripe(STRIPE_SECRET_KEY, {
      apiVersion: '2025-09-30.clover', // Use latest stable version
      typescript: true,
    })
  : null

// ==========================================
// STRIPE CONFIGURATION CONSTANTS
// ==========================================

/**
 * Webhook secret for signature verification
 */
export const STRIPE_WEBHOOK_SECRET_KEY = STRIPE_WEBHOOK_SECRET || ''

/**
 * Publishable key for frontend (public, safe to expose)
 */
export const STRIPE_PUBLISHABLE_KEY = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || ''

/**
 * Base URL for redirects (from env or default)
 */
export const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

/**
 * Default payment success URL
 */
export const DEFAULT_SUCCESS_URL = `${BASE_URL}/payments/success`

/**
 * Default payment cancel URL
 */
export const DEFAULT_CANCEL_URL = `${BASE_URL}/booking`

// ==========================================
// HELPER FUNCTIONS
// ==========================================

/**
 * Ensures Stripe is configured
 * Throws error if stripe client is not initialized
 */
function ensureStripeConfigured(): Stripe {
  if (!stripe) {
    throw new Error(
      'Stripe is not configured. Please set STRIPE_SECRET_KEY environment variable.'
    )
  }
  return stripe
}

/**
 * Create a Stripe Checkout Session
 * Used for hosted payment page flow
 * 
 * @param params - Session parameters
 * @returns Stripe Checkout Session
 * 
 * @example
 * ```ts
 * const session = await createCheckoutSession({
 *   amount: 15000, // $150.00 in cents
 *   currency: 'usd',
 *   customerEmail: 'user@example.com',
 *   metadata: { bookingId: 'xxx', paymentId: 'yyy' },
 * })
 * ```
 */
export async function createCheckoutSession(params: {
  amount: number
  currency: string
  customerEmail?: string
  customerName?: string
  metadata: Record<string, string>
  successUrl?: string
  cancelUrl?: string
  idempotencyKey?: string
}) {
  const {
    amount,
    currency,
    customerEmail,
    customerName,
    metadata,
    successUrl = DEFAULT_SUCCESS_URL,
    cancelUrl = DEFAULT_CANCEL_URL,
    idempotencyKey,
  } = params

  try {
    const stripeClient = ensureStripeConfigured()
    const sessionParams: any = {
      mode: 'payment',
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: currency.toLowerCase(),
            product_data: {
              name: 'Hotel Room Booking',
              description: `Booking ID: ${metadata.bookingId}`,
            },
            unit_amount: amount,
          },
          quantity: 1,
        },
      ],
      metadata,
      success_url: `${successUrl}?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: cancelUrl,
      // Allow promotion codes (optional)
      allow_promotion_codes: true,
      // Expire after 30 minutes
      expires_at: Math.floor(Date.now() / 1000) + 30 * 60,
    }

    // Add customer_email only if provided
    if (customerEmail) {
      sessionParams.customer_email = customerEmail
    }

    const session = await stripeClient.checkout.sessions.create(
      sessionParams,
      idempotencyKey ? { idempotencyKey } : undefined
    )

    return session
  } catch (error) {
    console.error('Error creating Stripe Checkout Session:', error)
    throw error
  }
}

/**
 * Create a Payment Intent
 * Used for direct card payment flow (requires frontend integration)
 * 
 * @param params - Payment Intent parameters
 * @returns Stripe Payment Intent
 * 
 * NOTE: For Razorpay, use:
 * ```ts
 * const order = await razorpay.orders.create({
 *   amount: amount,
 *   currency: currency,
 *   receipt: `receipt_${bookingId}`,
 *   notes: metadata
 * })
 * ```
 */
export async function createPaymentIntent(params: {
  amount: number
  currency: string
  customerId?: string
  metadata: Record<string, string>
  idempotencyKey?: string
}) {
  const { amount, currency, customerId, metadata, idempotencyKey } = params

  try {
    const stripeClient = ensureStripeConfigured()
    const intentParams: any = {
      amount,
      currency: currency.toLowerCase(),
      metadata,
      automatic_payment_methods: {
        enabled: true,
      },
    }

    // Add customer only if provided
    if (customerId) {
      intentParams.customer = customerId
    }

    const paymentIntent = await stripeClient.paymentIntents.create(
      intentParams,
      idempotencyKey ? { idempotencyKey } : undefined
    )

    return paymentIntent
  } catch (error) {
    console.error('Error creating Stripe Payment Intent:', error)
    throw error
  }
}

/**
 * Retrieve a Checkout Session by ID
 * Used to verify payment after redirect
 * 
 * @param sessionId - Stripe Checkout Session ID
 * @returns Checkout Session with payment details
 */
export async function retrieveCheckoutSession(sessionId: string) {
  try {
    const stripeClient = ensureStripeConfigured()
    const session = await stripeClient.checkout.sessions.retrieve(sessionId, {
      expand: ['payment_intent', 'customer'],
    })

    return session
  } catch (error) {
    console.error('Error retrieving Stripe Checkout Session:', error)
    throw error
  }
}

/**
 * Retrieve a Payment Intent by ID
 * 
 * @param paymentIntentId - Stripe Payment Intent ID
 * @returns Payment Intent
 */
export async function retrievePaymentIntent(paymentIntentId: string) {
  try {
    const stripeClient = ensureStripeConfigured()
    const paymentIntent = await stripeClient.paymentIntents.retrieve(paymentIntentId)
    return paymentIntent
  } catch (error) {
    console.error('Error retrieving Payment Intent:', error)
    throw error
  }
}

/**
 * Process a refund
 * 
 * @param params - Refund parameters
 * @returns Stripe Refund
 * 
 * NOTE: For Razorpay, use:
 * ```ts
 * const refund = await razorpay.payments.refund(paymentId, {
 *   amount: amount,
 *   notes: { reason: reason }
 * })
 * ```
 */
export async function createRefund(params: {
  paymentIntentId: string
  amount?: number // Partial refund if specified
  reason?: string
  metadata?: Record<string, string>
}) {
  const { paymentIntentId, amount, reason, metadata } = params

  try {
    const stripeClient = ensureStripeConfigured()
    const refundParams: any = {
      payment_intent: paymentIntentId,
    }

    // Add optional params only if provided
    if (amount) refundParams.amount = amount
    if (reason) refundParams.reason = reason
    if (metadata) refundParams.metadata = metadata

    const refund = await stripeClient.refunds.create(refundParams)

    return refund
  } catch (error) {
    console.error('Error creating refund:', error)
    throw error
  }
}

/**
 * Verify webhook signature
 * CRITICAL: Always verify webhook signatures in production
 * 
 * @param payload - Raw request body
 * @param signature - Stripe-Signature header value
 * @returns Verified Stripe event
 * @throws Error if signature is invalid
 * 
 * NOTE: For Razorpay webhook verification:
 * ```ts
 * const crypto = require('crypto')
 * const expectedSignature = crypto
 *   .createHmac('sha256', webhookSecret)
 *   .update(JSON.stringify(body))
 *   .digest('hex')
 * 
 * if (expectedSignature === receivedSignature) {
 *   // Valid webhook
 * }
 * ```
 */
export function verifyWebhookSignature(
  payload: string | Buffer,
  signature: string
): Stripe.Event {
  const stripeClient = ensureStripeConfigured()
  
  if (!STRIPE_WEBHOOK_SECRET_KEY) {
    throw new Error('STRIPE_WEBHOOK_SECRET is not configured')
  }

  try {
    const event = stripeClient.webhooks.constructEvent(
      payload,
      signature,
      STRIPE_WEBHOOK_SECRET_KEY
    )

    return event
  } catch (error) {
    console.error('Webhook signature verification failed:', error)
    throw new Error('Invalid webhook signature')
  }
}

/**
 * Create or retrieve a Stripe Customer
 * Useful for repeat customers
 * 
 * @param params - Customer parameters
 * @returns Stripe Customer
 */
export async function getOrCreateCustomer(params: {
  email: string
  name?: string
  phone?: string
  metadata?: Record<string, string>
}) {
  const { email, name, phone, metadata } = params

  try {
    const stripeClient = ensureStripeConfigured()
    
    // Try to find existing customer by email
    const existingCustomers = await stripeClient.customers.list({
      email,
      limit: 1,
    })

    if (existingCustomers.data.length > 0) {
      return existingCustomers.data[0]
    }

    // Create new customer
    const customerParams: any = {
      email,
    }

    // Add optional params only if provided
    if (name) customerParams.name = name
    if (phone) customerParams.phone = phone
    if (metadata) customerParams.metadata = metadata

    const customer = await stripeClient.customers.create(customerParams)

    return customer
  } catch (error) {
    console.error('Error getting/creating customer:', error)
    throw error
  }
}

/**
 * Generate idempotency key for Stripe requests
 * Prevents duplicate charges if request is retried
 * 
 * @param parts - Parts to include in the key
 * @returns Idempotency key string
 */
export function generateIdempotencyKey(...parts: string[]): string {
  return `payment_${parts.join('_')}_${Date.now()}`
}

// ==========================================
// TEST MODE HELPERS
// ==========================================

/**
 * Check if Stripe is in test mode
 */
export function isTestMode(): boolean {
  return process.env.STRIPE_SECRET_KEY?.startsWith('sk_test_') || false
}

/**
 * Get test card numbers for testing
 * https://stripe.com/docs/testing#cards
 */
export const TEST_CARDS = {
  SUCCESS: '4242424242424242',
  DECLINED: '4000000000000002',
  INSUFFICIENT_FUNDS: '4000000000009995',
  EXPIRED_CARD: '4000000000000069',
  INCORRECT_CVC: '4000000000000127',
  PROCESSING_ERROR: '4000000000000119',
  REQUIRES_AUTHENTICATION: '4000002500003155', // 3D Secure
}

/**
 * Log Stripe configuration status (for debugging)
 */
export function logStripeConfig() {
  console.log('Stripe Configuration:')
  console.log('- Test Mode:', isTestMode())
  console.log('- Webhook Secret Configured:', !!STRIPE_WEBHOOK_SECRET_KEY)
  console.log('- Publishable Key Configured:', !!STRIPE_PUBLISHABLE_KEY)
  console.log('- Base URL:', BASE_URL)
}

// ==========================================
// EXPORTS
// ==========================================

export default stripe
