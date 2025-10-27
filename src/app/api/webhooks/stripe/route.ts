// ==========================================
// STRIPE WEBHOOK HANDLER
// ==========================================
// Receives and processes Stripe webhook events
// CRITICAL: Verifies webhook signatures for security

import { NextRequest, NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { prisma } from '@/lib/prisma'
import { verifyWebhookSignature, retrieveCheckoutSession } from '@/lib/stripe'
import { generateAndSaveInvoice } from '@/lib/invoice'
import { sendBookingConfirmationNotifications } from '@/lib/notifications'
import { sendPaymentSuccess, sendPaymentFailure } from '@/lib/services/notification-trigger.service'
import type Stripe from 'stripe'

// ==========================================
// CONFIGURATION
// ==========================================

// Disable body parsing - we need raw body for signature verification
export const runtime = 'nodejs'

// ==========================================
// WEBHOOK HANDLER
// ==========================================

/**
 * POST /api/webhooks/stripe
 * 
 * Handles Stripe webhook events
 * 
 * Events handled:
 * - checkout.session.completed: Payment successful via Checkout
 * - payment_intent.succeeded: Payment successful via PaymentIntent
 * - payment_intent.payment_failed: Payment failed
 * - charge.refunded: Refund processed
 * 
 * Flow for successful payment:
 * 1. Verify webhook signature
 * 2. Extract payment metadata
 * 3. Find payment record in DB
 * 4. In a transaction:
 *    - Update payment status to SUCCEEDED
 *    - Update booking status to CONFIRMED
 *    - Decrement room inventory for booking dates
 *    - Generate invoice
 *    - Send confirmation email (TODO)
 * 5. Return 200 OK to Stripe
 * 
 * IMPORTANT: This must be an API route, not a server action
 * Stripe requires a public HTTP endpoint for webhooks
 */
export async function POST(req: NextRequest) {
  try {
    // ==========================================
    // 1. GET RAW BODY AND SIGNATURE
    // ==========================================
    const body = await req.text()
    const headersList = await headers()
    const signature = headersList.get('stripe-signature')

    if (!signature) {
      console.error('Missing Stripe signature')
      return NextResponse.json(
        { error: 'Missing signature' },
        { status: 400 }
      )
    }

    // ==========================================
    // 2. VERIFY WEBHOOK SIGNATURE
    // ==========================================
    let event: Stripe.Event
    
    try {
      event = verifyWebhookSignature(body, signature)
      console.log(`✅ Webhook verified: ${event.type}`)
    } catch (error) {
      console.error('❌ Webhook signature verification failed:', error)
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 400 }
      )
    }

    // ==========================================
    // 3. HANDLE EVENT BY TYPE
    // ==========================================
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutSessionCompleted(event)
        break

      case 'payment_intent.succeeded':
        await handlePaymentIntentSucceeded(event)
        break

      case 'payment_intent.payment_failed':
        await handlePaymentIntentFailed(event)
        break

      case 'charge.refunded':
        await handleChargeRefunded(event)
        break

      default:
        console.log(`Unhandled event type: ${event.type}`)
    }

    // ==========================================
    // 4. RETURN SUCCESS
    // ==========================================
    return NextResponse.json({ received: true }, { status: 200 })

  } catch (error) {
    console.error('Error processing webhook:', error)
    
    // Still return 200 to prevent Stripe from retrying
    // Log error for investigation
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    )
  }
}

// ==========================================
// EVENT HANDLERS
// ==========================================

/**
 * Handle successful Checkout Session
 * This is the main payment success event for Checkout flow
 */
async function handleCheckoutSessionCompleted(event: Stripe.Event) {
  const session = event.data.object as Stripe.Checkout.Session

  console.log(`Processing checkout.session.completed: ${session.id}`)

  // Extract metadata
  const metadata = session.metadata
  if (!metadata?.paymentId || !metadata?.bookingId) {
    console.error('Missing metadata in checkout session')
    return
  }

  const { paymentId, bookingId, userId } = metadata

  try {
    // Find payment record
    const payment = await prisma.payment.findUnique({
      where: { id: paymentId },
      include: {
        booking: {
          include: {
            roomType: true,
            user: true,
          },
        },
      },
    })

    if (!payment) {
      console.error(`Payment not found: ${paymentId}`)
      return
    }

    // Check if already processed (idempotency)
    if (payment.status === 'SUCCEEDED') {
      console.log(`Payment already processed: ${paymentId}`)
      return
    }

    if (!payment.booking) {
      console.error(`Booking not found for payment: ${paymentId}`)
      return
    }

    // ==========================================
    // ATOMIC TRANSACTION: Confirm booking + payment
    // ==========================================
    await prisma.$transaction(async (tx) => {
      // 1. Update payment status
      await tx.payment.update({
        where: { id: paymentId },
        data: {
          status: 'SUCCEEDED',
          paidAt: new Date(),
          metadata: JSON.stringify({
            ...JSON.parse(payment.metadata || '{}'),
            stripeSessionId: session.id,
            stripePaymentIntentId: session.payment_intent,
            amountReceived: session.amount_total,
          }),
        },
      })

      console.log(`✅ Payment marked as SUCCEEDED: ${paymentId}`)

      // 2. Update booking status
      await tx.booking.update({
        where: { id: bookingId },
        data: {
          status: 'CONFIRMED',
        },
      })

      console.log(`✅ Booking confirmed: ${bookingId}`)

      // 3. Decrement inventory for booking dates
      if (!payment.booking) {
        throw new Error('Booking data not found')
      }
      
      const { startDate, endDate, roomTypeId } = payment.booking
      const dates = generateDateRange(startDate, endDate)

      for (const date of dates) {
        // Find or create inventory record for this date
        const inventory = await tx.roomInventory.findUnique({
          where: {
            roomTypeId_date: {
              roomTypeId: roomTypeId,
              date,
            },
          },
        })

        if (inventory) {
          // Decrement available rooms
          await tx.roomInventory.update({
            where: {
              roomTypeId_date: {
                roomTypeId: roomTypeId,
                date,
              },
            },
            data: {
              availableRooms: {
                decrement: 1,
              },
            },
          })
        } else {
          // Create inventory record with total - 1
          await tx.roomInventory.create({
            data: {
              roomTypeId: roomTypeId,
              date,
              availableRooms: payment.booking.roomType.totalRooms - 1,
            },
          })
        }
      }

      console.log(`✅ Inventory updated for ${dates.length} dates`)
    })

    // ==========================================
    // POST-TRANSACTION: Generate invoice & send notifications
    // ==========================================
    try {
      // Generate invoice (this is a stub for now)
      const invoicePath = await generateAndSaveInvoice(payment as any)

      // Update payment with invoice path
      await prisma.payment.update({
        where: { id: paymentId },
        data: {
          invoicePath,
        },
      })

      console.log(`✅ Invoice generated: ${invoicePath}`)

      // Send payment success notification
      await sendPaymentSuccess(paymentId)

      console.log('✅ Payment success notification sent')

    } catch (error) {
      console.error('Error in post-confirmation tasks:', error)
      // Don't fail the webhook - these are non-critical
    }

  } catch (error) {
    console.error('Error processing checkout session:', error)
    throw error // Re-throw to trigger webhook retry
  }
}

/**
 * Handle successful PaymentIntent
 * Used when using PaymentIntent flow instead of Checkout
 */
async function handlePaymentIntentSucceeded(event: Stripe.Event) {
  const paymentIntent = event.data.object as Stripe.PaymentIntent

  console.log(`Processing payment_intent.succeeded: ${paymentIntent.id}`)

  // Similar logic to checkout session
  const metadata = paymentIntent.metadata
  
  if (!metadata?.paymentId) {
    console.error('Missing payment ID in PaymentIntent metadata')
    return
  }

  // Find payment by provider payment ID
  const payment = await prisma.payment.findFirst({
    where: {
      providerPaymentId: paymentIntent.id,
    },
  })

  if (!payment) {
    console.error(`Payment not found for PaymentIntent: ${paymentIntent.id}`)
    return
  }

  // Check if already processed
  if (payment.status === 'SUCCEEDED') {
    console.log(`Payment already processed: ${payment.id}`)
    return
  }

  // Update payment status
  await prisma.payment.update({
    where: { id: payment.id },
    data: {
      status: 'SUCCEEDED',
      paidAt: new Date(),
    },
  })

  console.log(`✅ Payment marked as SUCCEEDED: ${payment.id}`)

  // TODO: Implement full booking confirmation flow like in checkout session
}

/**
 * Handle failed payment
 */
async function handlePaymentIntentFailed(event: Stripe.Event) {
  const paymentIntent = event.data.object as Stripe.PaymentIntent

  console.log(`Processing payment_intent.payment_failed: ${paymentIntent.id}`)

  // Find payment
  const payment = await prisma.payment.findFirst({
    where: {
      providerPaymentId: paymentIntent.id,
    },
  })

  if (!payment) {
    console.error(`Payment not found for PaymentIntent: ${paymentIntent.id}`)
    return
  }

  // Update payment status
  await prisma.payment.update({
    where: { id: payment.id },
    data: {
      status: 'FAILED',
      errorMessage: paymentIntent.last_payment_error?.message || 'Payment failed',
    },
  })

  console.log(`❌ Payment marked as FAILED: ${payment.id}`)

  // Send payment failure notification
  await sendPaymentFailure(payment.id)

  console.log('❌ Payment failure notification sent')
}

/**
 * Handle refund
 */
async function handleChargeRefunded(event: Stripe.Event) {
  const charge = event.data.object as Stripe.Charge

  console.log(`Processing charge.refunded: ${charge.id}`)

  // Find payment by payment intent
  const payment = await prisma.payment.findFirst({
    where: {
      providerPaymentId: charge.payment_intent as string,
    },
  })

  if (!payment) {
    console.error(`Payment not found for charge: ${charge.id}`)
    return
  }

  // Update payment status
  await prisma.payment.update({
    where: { id: payment.id },
    data: {
      status: 'REFUNDED',
      refundedAt: new Date(),
      metadata: JSON.stringify({
        ...JSON.parse(payment.metadata || '{}'),
        refundAmount: charge.amount_refunded,
        refunds: charge.refunds,
      }),
    },
  })

  console.log(`✅ Payment marked as REFUNDED: ${payment.id}`)

  // TODO: Handle inventory restoration and booking cancellation
}

// ==========================================
// HELPER FUNCTIONS
// ==========================================

/**
 * Generate array of dates between start and end (inclusive of start, exclusive of end)
 * Used for inventory management
 * 
 * @param startDate - Start date
 * @param endDate - End date
 * @returns Array of dates
 */
function generateDateRange(startDate: Date, endDate: Date): Date[] {
  const dates: Date[] = []
  const current = new Date(startDate)
  current.setHours(0, 0, 0, 0)
  
  const end = new Date(endDate)
  end.setHours(0, 0, 0, 0)

  while (current < end) {
    dates.push(new Date(current))
    current.setDate(current.getDate() + 1)
  }

  return dates
}

// ==========================================
// EXPORTS
// ==========================================

export const GET = async () => {
  return NextResponse.json(
    { message: 'Stripe webhook endpoint. POST only.' },
    { status: 405 }
  )
}
