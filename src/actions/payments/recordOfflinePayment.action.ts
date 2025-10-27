// ==========================================
// ADMIN: RECORD OFFLINE PAYMENT
// ==========================================
// Allows admins to manually record cash/bank transfer payments

'use server'

import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/middleware/auth.utils'
import { generateAndSaveInvoice } from '@/lib/invoice'
import { sendBookingConfirmationNotifications } from '@/lib/notifications'
import { 
  CreateOfflinePaymentSchema, 
  type CreateOfflinePaymentInput 
} from '@/lib/validation/payment.validation'

// ==========================================
// TYPES
// ==========================================

export type RecordOfflinePaymentResult =
  | { success: true; paymentId: string; invoicePath: string | null }
  | { success: false; error: string; field?: string }

// ==========================================
// SERVER ACTION: RECORD OFFLINE PAYMENT
// ==========================================

/**
 * Record an offline payment (cash or bank transfer)
 * 
 * This is for admin use only. Allows recording payments made outside Stripe.
 * Triggers the same booking confirmation flow as webhook.
 * 
 * Access: ADMIN, SUPERADMIN only
 * 
 * Flow:
 * 1. Validate admin role
 * 2. Validate booking exists and is unpaid
 * 3. In a transaction:
 *    - Create payment record with SUCCEEDED status
 *    - Update booking status to CONFIRMED
 *    - Decrement room inventory
 *    - Generate invoice
 * 4. Return payment ID and invoice path
 * 
 * @param input - Payment details
 * @returns Payment ID or error
 */
export async function recordOfflinePayment(
  input: CreateOfflinePaymentInput
): Promise<RecordOfflinePaymentResult> {
  try {
    // ==========================================
    // 1. AUTHENTICATION & AUTHORIZATION
    // ==========================================
    const user = await requireAuth()

    // Check admin role
    if (user.role !== 'ADMIN' && user.role !== 'SUPERADMIN') {
      return {
        success: false,
        error: 'Admin access required. Only admins can record offline payments.',
      }
    }

    // ==========================================
    // 2. VALIDATE INPUT
    // ==========================================
    const validation = CreateOfflinePaymentSchema.safeParse(input)

    if (!validation.success) {
      const firstError = validation.error.issues[0]
      return {
        success: false,
        error: firstError?.message || 'Validation failed',
        field: firstError?.path[0] as string,
      }
    }

    const validInput = validation.data

    // ==========================================
    // 3. FETCH BOOKING
    // ==========================================
    const booking = await prisma.booking.findUnique({
      where: {
        id: validInput.bookingId,
      },
      include: {
        roomType: true,
        user: true,
        payments: true,
      },
    })

    if (!booking) {
      return {
        success: false,
        error: 'Booking not found.',
        field: 'bookingId',
      }
    }

    // Check if booking already has successful payment
    const existingPayment = booking.payments.find(
      (p) => p.status === 'SUCCEEDED'
    )

    if (existingPayment) {
      return {
        success: false,
        error: 'Booking already has a successful payment.',
        field: 'bookingId',
      }
    }

    // ==========================================
    // 4. CALCULATE AMOUNT
    // ==========================================
    // Calculate server-side to prevent tampering
    const nights = Math.ceil(
      (booking.endDate.getTime() - booking.startDate.getTime()) / (1000 * 60 * 60 * 24)
    )

    // Convert totalPrice from cents to dollars
    const calculatedAmount = booking.totalPrice / 100

    // Validate provided amount matches
    if (Math.abs(calculatedAmount - validInput.amount) > 0.01) {
      return {
        success: false,
        error: `Amount mismatch. Expected ${calculatedAmount} ${validInput.currency}, got ${validInput.amount}`,
        field: 'amount',
      }
    }

    // ==========================================
    // 5. ATOMIC TRANSACTION: Create payment + confirm booking
    // ==========================================
    let paymentId: string
    let invoicePath: string | null = null

    try {
      await prisma.$transaction(async (tx) => {
        // 1. Create payment record
        const payment = await tx.payment.create({
          data: {
            bookingId: validInput.bookingId,
            userId: booking.userId,
            provider: 'OFFLINE',
            providerPaymentId: `offline_${Date.now()}_${Math.random().toString(36).substring(7)}`,
            amount: validInput.amount,
            currency: validInput.currency,
            status: 'SUCCEEDED',
            paidAt: new Date(),
            metadata: JSON.stringify({
              method: validInput.paymentMethod,
              reference: validInput.referenceNumber,
              notes: validInput.notes,
              recordedBy: user.userId,
              recordedByName: user.name,
              recordedAt: new Date().toISOString(),
            }),
          },
        })

        paymentId = payment.id

        console.log(`✅ Offline payment created: ${paymentId}`)

        // 2. Update booking status
        await tx.booking.update({
          where: { id: validInput.bookingId },
          data: {
            status: 'CONFIRMED',
          },
        })

        console.log(`✅ Booking confirmed: ${validInput.bookingId}`)

        // 3. Decrement inventory for booking dates
        const dates = generateDateRange(booking.startDate, booking.endDate)

        for (const date of dates) {
          const inventory = await tx.roomInventory.findUnique({
            where: {
              roomTypeId_date: {
                roomTypeId: booking.roomTypeId,
                date,
              },
            },
          })

          if (inventory) {
            await tx.roomInventory.update({
              where: {
                roomTypeId_date: {
                  roomTypeId: booking.roomTypeId,
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
            await tx.roomInventory.create({
              data: {
                roomTypeId: booking.roomTypeId,
                date,
                availableRooms: booking.roomType.totalRooms - 1,
              },
            })
          }
        }

        console.log(`✅ Inventory updated for ${dates.length} dates`)
      })

      // ==========================================
      // 6. POST-TRANSACTION: Generate invoice & send notifications
      // ==========================================
      try {
        const payment = await prisma.payment.findUnique({
          where: { id: paymentId! },
          include: {
            booking: {
              include: {
                roomType: true,
                user: true,
              },
            },
          },
        })

        if (payment && payment.booking) {
          // Generate invoice
          invoicePath = await generateAndSaveInvoice(payment as any)

          await prisma.payment.update({
            where: { id: paymentId! },
            data: { invoicePath },
          })

          console.log(`✅ Invoice generated: ${invoicePath}`)

          // Send notifications
          const notifications = await sendBookingConfirmationNotifications({
            customerName: payment.booking.user.name,
            customerPhone: payment.booking.user.phone,
            customerEmail: payment.booking.user.email,
            hotelName: 'Grand Plaza Hotel', // TODO: Get from config
            roomType: payment.booking.roomType.name,
            startDate: payment.booking.startDate,
            endDate: payment.booking.endDate,
            bookingId: payment.booking.id,
            totalAmount: payment.amount,
            currency: payment.currency,
          })

          console.log('📧 Notification results:', {
            whatsapp: notifications.whatsapp.success ? 'Sent (mock)' : 'Failed',
            email: notifications.email.success ? 'Sent (mock)' : 'Failed',
          })
        }
      } catch (error) {
        console.error('Error in post-confirmation tasks:', error)
        // Don't fail the action - these are non-critical
      }

      // ==========================================
      // 7. RETURN SUCCESS
      // ==========================================
      return {
        success: true,
        paymentId: paymentId!,
        invoicePath,
      }

    } catch (error) {
      console.error('Transaction failed:', error)
      throw error
    }

  } catch (error) {
    console.error('Error recording offline payment:', error)
    return {
      success: false,
      error: 'Failed to record payment. Please try again.',
    }
  }
}

// ==========================================
// HELPER FUNCTIONS
// ==========================================

/**
 * Generate array of dates between start and end
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

export default recordOfflinePayment
