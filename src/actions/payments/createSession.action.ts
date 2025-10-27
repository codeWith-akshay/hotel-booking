// ==========================================
// PAYMENT SESSION SERVER ACTION
// ==========================================
// Creates Stripe Checkout Session for booking payments
// Handles idempotency, validation, and payment record creation

'use server'

import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/middleware/auth.utils'
import type { RoleName } from '@prisma/client'
import {
  CreatePaymentSessionSchema,
  type CreatePaymentSessionInput,
  type PaymentSessionResponse,
} from '@/lib/validation/payment.validation'
import {
  createCheckoutSession,
  generateIdempotencyKey,
  DEFAULT_SUCCESS_URL,
  DEFAULT_CANCEL_URL,
} from '@/lib/stripe'

// ==========================================
// CREATE PAYMENT SESSION
// ==========================================

/**
 * Create a Stripe Checkout Session for a booking
 * 
 * Flow:
 * 1. Validate user session and input
 * 2. Fetch booking and verify it's PROVISIONAL and belongs to user
 * 3. Calculate amount from booking (don't trust client)
 * 4. Create Payment record with PENDING status
 * 5. Create Stripe Checkout Session with metadata
 * 6. Update Payment record with session ID
 * 7. Return checkout URL to client
 * 
 * @param input - Payment session creation parameters
 * @returns Payment session response with URL
 */
export async function createPaymentSession(
  input: CreatePaymentSessionInput
): Promise<PaymentSessionResponse> {
  try {
    // ==========================================
    // 1. AUTHENTICATION - Read from cookies directly
    // ==========================================
    const { cookies } = await import('next/headers')
    const { verifyAccessToken } = await import('@/lib/auth/jwt.service')
    
    let user = await getCurrentUser()
    
    // Fallback: Read token from cookies if middleware didn't set headers
    if (!user) {
      const cookieStore = await cookies()
      const token = cookieStore.get('auth-session')?.value
      
      if (!token) {
        return {
          success: false,
          error: 'Authentication required. Please login.',
        }
      }
      
      const decoded = verifyAccessToken(token)
      
      if (!decoded || !decoded.userId || !decoded.role) {
        return {
          success: false,
          error: 'Invalid authentication token.',
        }
      }
      
      user = {
        userId: decoded.userId,
        phone: decoded.phone,
        name: decoded.name,
        role: decoded.role as RoleName,
      }
    }

    // ==========================================
    // 2. VALIDATION
    // ==========================================
    const validationResult = CreatePaymentSessionSchema.safeParse(input)
    
    if (!validationResult.success) {
      return {
        success: false,
        error: validationResult.error.issues[0]?.message || 'Invalid input',
      }
    }

    const { bookingId, currency, successUrl, cancelUrl } = validationResult.data    // ==========================================
    // 3. FETCH & VERIFY BOOKING
    // ==========================================
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        user: true,
        roomType: true,
      },
    })

    if (!booking) {
      return {
        success: false,
        error: 'Booking not found',
      }
    }

    // Check booking belongs to user
    if (booking.userId !== user.userId) {
      return {
        success: false,
        error: 'Unauthorized. This booking belongs to another user.',
      }
    }

    // Verify booking is in PROVISIONAL status
    if (booking.status !== 'PROVISIONAL') {
      return {
        success: false,
        error: `Cannot create payment for ${booking.status.toLowerCase()} booking`,
      }
    }

    // ==========================================
    // 4. CALCULATE AMOUNT (SERVER-SIDE)
    // ==========================================
    // Always compute amount from booking data, never trust client
    const amount = booking.totalPrice

    if (amount <= 0) {
      return {
        success: false,
        error: 'Invalid booking amount',
      }
    }

    // ==========================================
    // 5. CHECK FOR EXISTING PENDING PAYMENT
    // ==========================================
    // Prevent duplicate payment sessions
    const existingPayment = await prisma.payment.findFirst({
      where: {
        bookingId,
        status: 'PENDING',
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    // If there's a recent pending payment (< 30 min old), reuse it
    if (existingPayment) {
      const ageInMinutes = (Date.now() - existingPayment.createdAt.getTime()) / 1000 / 60
      
      if (ageInMinutes < 30 && existingPayment.providerPaymentId) {
        console.log(`Reusing existing payment session: ${existingPayment.id}`)
        
        // Reconstruct checkout URL from session ID
        const checkoutUrl = `https://checkout.stripe.com/c/pay/${existingPayment.providerPaymentId}`
        
        return {
          success: true,
          data: {
            sessionId: existingPayment.providerPaymentId,
            paymentId: existingPayment.id,
            url: checkoutUrl,
          },
        }
      }
    }

    // ==========================================
    // 6. CREATE PAYMENT RECORD (PENDING)
    // ==========================================
    const payment = await prisma.payment.create({
      data: {
        userId: user.userId,
        bookingId,
        provider: 'stripe',
        amount,
        currency,
        status: 'PENDING',
      },
    })

    console.log(`Created payment record: ${payment.id}`)

    // ==========================================
    // 7. CREATE STRIPE CHECKOUT SESSION
    // ==========================================
    const idempotencyKey = generateIdempotencyKey(bookingId, user.userId, payment.id)

    const stripeSession = await createCheckoutSession({
      amount,
      currency,
      ...(booking.user.email && { customerEmail: booking.user.email }),
      customerName: booking.user.name,
      metadata: {
        paymentId: payment.id,
        bookingId: booking.id,
        userId: user.userId,
        roomTypeId: booking.roomTypeId,
      },
      successUrl: successUrl || `${DEFAULT_SUCCESS_URL}?session_id={CHECKOUT_SESSION_ID}`,
      cancelUrl: cancelUrl || DEFAULT_CANCEL_URL,
      idempotencyKey,
    })

    console.log(`Created Stripe session: ${stripeSession.id}`)

    // ==========================================
    // 8. UPDATE PAYMENT WITH SESSION ID
    // ==========================================
    await prisma.payment.update({
      where: { id: payment.id },
      data: {
        providerPaymentId: stripeSession.id,
        metadata: JSON.stringify({
          stripeSessionId: stripeSession.id,
          checkoutUrl: stripeSession.url,
        }),
      },
    })

    // ==========================================
    // 9. RETURN SUCCESS RESPONSE
    // ==========================================
    return {
      success: true,
      message: 'Payment session created successfully',
      data: {
        sessionId: stripeSession.id,
        paymentId: payment.id,
        url: stripeSession.url || '',
        clientSecret: undefined, // Not using PaymentIntent flow
      },
    }

  } catch (error) {
    console.error('Error creating payment session:', error)
    
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create payment session',
    }
  }
}

// ==========================================
// GET PAYMENT STATUS
// ==========================================

/**
 * Get payment status by session ID
 * Used after user returns from Stripe Checkout
 * 
 * @param sessionId - Stripe Checkout Session ID
 * @returns Payment status
 */
export async function getPaymentStatus(sessionId: string): Promise<{
  success: boolean
  status?: string
  bookingId?: string
  error?: string
}> {
  try {
    // Authentication - Read from cookies directly
    const { cookies } = await import('next/headers')
    const { verifyAccessToken } = await import('@/lib/auth/jwt.service')
    
    let user = await getCurrentUser()
    
    // Fallback: Read token from cookies if middleware didn't set headers
    if (!user) {
      const cookieStore = await cookies()
      const token = cookieStore.get('auth-session')?.value
      
      if (!token) {
        return {
          success: false,
          error: 'Authentication required',
        }
      }
      
      const decoded = verifyAccessToken(token)
      
      if (!decoded || !decoded.userId) {
        return {
          success: false,
          error: 'Invalid authentication token',
        }
      }
      
      user = {
        userId: decoded.userId,
        phone: decoded.phone,
        name: decoded.name,
        role: decoded.role as RoleName,
      }
    }

    // Find payment by session ID
    const payment = await prisma.payment.findUnique({
      where: {
        providerPaymentId: sessionId,
      },
      include: {
        booking: true,
      },
    })

    if (!payment) {
      return {
        success: false,
        error: 'Payment not found',
      }
    }

    // Verify payment belongs to current user
    if (payment.userId !== user.userId) {
      return {
        success: false,
        error: 'Unauthorized',
      }
    }

    return {
      success: true,
      status: payment.status,
      ...(payment.bookingId && { bookingId: payment.bookingId }),
    }

  } catch (error) {
    console.error('Error getting payment status:', error)
    
    return {
      success: false,
      error: 'Failed to get payment status',
    }
  }
}

// ==========================================
// EXPORTS
// ==========================================
// Only named exports of async functions are allowed in "use server" files
