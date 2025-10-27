/**
 * Booking Reminders Cron Job
 * 
 * GET /api/cron/booking-reminders
 * 
 * Purpose:
 * Sends reminders to guests about upcoming bookings (24 hours before check-in)
 * 
 * Schedule:
 * Run daily at 9:00 AM (configured in vercel.json or cron provider)
 * 
 * Vercel Cron Configuration:
 * Add to vercel.json:
 * ```json
 * {
 *   "crons": [
 *     {
 *       "path": "/api/cron/booking-reminders",
 *       "schedule": "0 9 * * *"
 *     }
 *   ]
 * }
 * ```
 * 
 * Alternative: Use external cron services (cron-job.org, EasyCron, etc.)
 * 
 * Security:
 * - Add Authorization header check
 * - Use Vercel Cron Secret: process.env.CRON_SECRET
 * - Verify origin/IP allowlist
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { BookingStatus } from '@prisma/client'

export async function GET(request: NextRequest) {
  try {
    // Security: Verify cron secret (optional but recommended)
    const authHeader = request.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      console.warn('⚠️ [CRON] Unauthorized access attempt')
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    console.log('🔔 [CRON] Starting booking reminders job...')

    // Calculate 24-hour window for upcoming check-ins
    const now = new Date()
    const tomorrow = new Date(now)
    tomorrow.setHours(now.getHours() + 24)

    const dayAfterTomorrow = new Date(now)
    dayAfterTomorrow.setHours(now.getHours() + 48)

    // Find confirmed bookings checking in within 24-48 hours
    const upcomingBookings = await prisma.booking.findMany({
      where: {
        status: BookingStatus.CONFIRMED,
        startDate: {
          gte: tomorrow,
          lt: dayAfterTomorrow,
        },
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
        roomType: {
          select: {
            name: true,
            description: true,
          },
        },
      },
      orderBy: {
        startDate: 'asc',
      },
    })

    console.log(`📊 [CRON] Found ${upcomingBookings.length} bookings requiring reminders`)

    // Process each booking
    const reminders = []
    for (const booking of upcomingBookings) {
      const reminderData = {
        bookingId: booking.id,
        userId: booking.userId,
        guestName: booking.user.name,
        guestEmail: booking.user.email,
        guestPhone: booking.user.phone,
        roomType: booking.roomType.name,
        checkIn: booking.startDate.toISOString(),
        checkOut: booking.endDate.toISOString(),
        roomsBooked: booking.roomsBooked,
      }

      // TODO: Send actual notification
      // Options:
      // 1. Email via SendGrid/Postmark
      // 2. SMS via Twilio
      // 3. WhatsApp via WhatsApp Business API
      // 4. Push notification via FCM
      // 5. In-app notification

      console.log(`📧 [CRON STUB] Would send reminder to ${booking.user.name}:`)
      console.log(`   Booking ID: ${booking.id}`)
      console.log(`   Check-in: ${booking.startDate.toISOString()}`)
      console.log(`   Room: ${booking.roomType.name}`)
      console.log(`   Rooms: ${booking.roomsBooked}`)

      // Example email content:
      // Subject: Reminder: Your booking starts tomorrow!
      // Body:
      // Hi ${guestName},
      // 
      // This is a friendly reminder that your stay at our hotel begins tomorrow!
      // 
      // Check-in: ${checkIn} (3:00 PM)
      // Check-out: ${checkOut} (11:00 AM)
      // Room Type: ${roomType}
      // Number of Rooms: ${roomsBooked}
      // 
      // Looking forward to welcoming you!

      reminders.push(reminderData)
    }

    console.log(`✅ [CRON] Booking reminders job completed. Processed ${reminders.length} reminders.`)

    return NextResponse.json({
      success: true,
      message: 'Booking reminders processed',
      data: {
        processedAt: now.toISOString(),
        totalBookings: upcomingBookings.length,
        reminders: reminders,
      },
    })
  } catch (error) {
    console.error('❌ [CRON] Error in booking reminders job:', error)

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to process booking reminders',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

/**
 * Alternative: Manual trigger for testing
 * You can call this endpoint directly in development:
 * 
 * curl http://localhost:3000/api/cron/booking-reminders \
 *   -H "Authorization: Bearer YOUR_CRON_SECRET"
 * 
 * For production testing on Vercel:
 * 
 * curl https://your-domain.vercel.app/api/cron/booking-reminders \
 *   -H "Authorization: Bearer YOUR_CRON_SECRET"
 */
