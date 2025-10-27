// ==========================================
// BOOKING CONFIRMATION API ROUTE
// ==========================================
// Manual booking confirmation endpoint
// Used for testing and admin manual confirmations

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/middleware/auth.utils'
import { sendBookingConfirmationNotifications } from '@/lib/notifications'

// ==========================================
// POST /api/bookings/confirm
// ==========================================

/**
 * Confirm a booking and send notifications
 * 
 * This endpoint can be used for:
 * 1. Manual admin confirmations
 * 2. Testing notification system
 * 3. Re-sending notifications
 * 
 * Access: ADMIN, SUPERADMIN only
 * 
 * Request body:
 * {
 *   bookingId: string
 * }
 * 
 * Response:
 * {
 *   success: true,
 *   booking: {...},
 *   notifications: {
 *     whatsapp: {...},
 *     email: {...}
 *   },
 *   message: "Booking confirmed. WhatsApp and email sent (mock)."
 * }
 */
export async function POST(req: NextRequest) {
  try {
    // ==========================================
    // 1. AUTHENTICATION & AUTHORIZATION
    // ==========================================
    const user = await requireAuth()

    if (user.role !== 'ADMIN' && user.role !== 'SUPERADMIN') {
      return NextResponse.json(
        {
          success: false,
          error: 'Admin access required',
        },
        { status: 403 }
      )
    }

    // ==========================================
    // 2. PARSE REQUEST BODY
    // ==========================================
    const body = await req.json()
    const { bookingId } = body

    if (!bookingId) {
      return NextResponse.json(
        {
          success: false,
          error: 'Booking ID is required',
        },
        { status: 400 }
      )
    }

    // ==========================================
    // 3. FETCH BOOKING WITH RELATIONS
    // ==========================================
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        user: true,
        roomType: true,
        payments: {
          where: {
            status: 'SUCCEEDED',
          },
          orderBy: {
            paidAt: 'desc',
          },
          take: 1,
        },
      },
    })

    if (!booking) {
      return NextResponse.json(
        {
          success: false,
          error: 'Booking not found',
        },
        { status: 404 }
      )
    }

    // Check if booking already confirmed
    if (booking.status === 'CONFIRMED') {
      // Re-send notifications for confirmed booking
      console.log('📧 Re-sending notifications for confirmed booking:', bookingId)
    } else if (booking.status !== 'PROVISIONAL') {
      return NextResponse.json(
        {
          success: false,
          error: `Cannot confirm booking with status: ${booking.status}`,
        },
        { status: 400 }
      )
    }

    // Check if payment exists
    const payment = booking.payments[0]
    if (!payment) {
      return NextResponse.json(
        {
          success: false,
          error: 'No successful payment found for this booking',
        },
        { status: 400 }
      )
    }

    // ==========================================
    // 4. UPDATE BOOKING STATUS (if needed)
    // ==========================================
    if (booking.status !== 'CONFIRMED') {
      await prisma.$transaction(async (tx) => {
        // Update booking status
        await tx.booking.update({
          where: { id: bookingId },
          data: {
            status: 'CONFIRMED',
          },
        })

        console.log(`✅ Booking status updated to CONFIRMED: ${bookingId}`)

        // Decrement inventory (if not already done)
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

          if (inventory && inventory.availableRooms > 0) {
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
          } else if (!inventory) {
            await tx.roomInventory.create({
              data: {
                roomTypeId: booking.roomTypeId,
                date,
                availableRooms: Math.max(0, booking.roomType.totalRooms - 1),
              },
            })
          }
        }

        console.log(`✅ Inventory updated for ${dates.length} dates`)
      })
    }

    // ==========================================
    // 5. SEND NOTIFICATIONS
    // ==========================================
    console.log('� Sending booking confirmation notifications...')

    const notificationResult = await sendBookingConfirmationNotifications({
      customerName: booking.user.name,
      customerPhone: booking.user.phone,
      customerEmail: booking.user.email,
      hotelName: 'Grand Hotel', // TODO: Get from configuration
      roomType: booking.roomType.name,
      startDate: booking.startDate,
      endDate: booking.endDate,
      bookingId: booking.id,
      totalAmount: payment.amount,
      currency: payment.currency || 'INR',
    })

    console.log('✅ Booking confirmed successfully')
    console.log('📱 WhatsApp sent (mock):', notificationResult.whatsapp.success)
    console.log('📧 Email sent (mock):', notificationResult.email.success)

    // ==========================================
    // 6. RETURN SUCCESS RESPONSE
    // ==========================================
    return NextResponse.json(
      {
        success: true,
        booking: {
          id: booking.id,
          status: booking.status,
          startDate: booking.startDate,
          endDate: booking.endDate,
          roomType: booking.roomType.name,
          customer: booking.user.name,
        },
        notifications: notificationResult,
        message: 'Booking confirmed. WhatsApp and email sent (mock).',
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('❌ Error confirming booking:', error)

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to confirm booking',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

// ==========================================
// GET /api/bookings/confirm
// ==========================================

/**
 * Test endpoint - returns API info
 */
export async function GET() {
  return NextResponse.json(
    {
      message: 'Booking Confirmation API',
      methods: ['POST'],
      description: 'Use POST to confirm a booking and send notifications',
      requiredRole: 'ADMIN or SUPERADMIN',
      body: {
        bookingId: 'string (required)',
      },
    },
    { status: 200 }
  )
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
