// ==========================================
// ADMIN NOTIFICATIONS STATS API
// ==========================================
// API endpoint for notification statistics

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/middleware/auth.utils'

// ==========================================
// GET NOTIFICATION STATS
// ==========================================

/**
 * GET /api/notifications/admin/stats
 *
 * Get notification statistics for admin dashboard
 * Requires SUPERADMIN role
 */
export async function GET(req: NextRequest) {
  try {
    // Authentication check
    const user = await getCurrentUser()
    if (!user || user.role !== 'SUPERADMIN') {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 403 }
      )
    }

    // Get comprehensive stats
    const [
      total,
      pending,
      sent,
      failed,
      today,
      // Type breakdown
      bookingConfirmations,
      paymentSuccess,
      paymentFailure,
      checkInReminders,
      waitlistAlerts,
      // Channel breakdown
      emailCount,
      whatsappCount,
      // Recent activity (last 7 days)
      last7Days,
    ] = await Promise.all([
      // Basic counts
      prisma.notification.count(),
      prisma.notification.count({ where: { status: 'PENDING' } }),
      prisma.notification.count({ where: { status: 'SENT' } }),
      prisma.notification.count({ where: { status: 'FAILED' } }),
      prisma.notification.count({
        where: {
          createdAt: {
            gte: new Date(new Date().setHours(0, 0, 0, 0)),
          },
        },
      }),

      // Type breakdown
      prisma.notification.count({ where: { type: 'BOOKING_CONFIRMATION' } }),
      prisma.notification.count({ where: { type: 'PAYMENT_REMINDER' } }),
      prisma.notification.count({ where: { type: 'PAYMENT_REMINDER' } }), // Note: Using same type for both success/failure
      prisma.notification.count({ where: { type: 'BOOKING_REMINDER' } }),
      prisma.notification.count({ where: { type: 'WAITLIST_ALERT' } }),

      // Channel breakdown
      prisma.notification.count({ where: { channel: 'EMAIL' } }),
      prisma.notification.count({ where: { channel: 'WHATSAPP' } }),

      // Recent activity
      prisma.notification.count({
        where: {
          createdAt: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
          },
        },
      }),
    ])

    // Calculate success rate
    const totalProcessed = sent + failed
    const successRate = totalProcessed > 0 ? Math.round((sent / totalProcessed) * 100) : 0

    // Get recent notifications (last 10)
    const recentNotifications = await prisma.notification.findMany({
      take: 10,
      include: {
        user: {
          select: {
            name: true,
            email: true,
            phone: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    const stats = {
      // Basic stats
      total,
      pending,
      sent,
      failed,
      today,
      successRate,

      // Type breakdown
      types: {
        bookingConfirmations,
        paymentNotifications: paymentSuccess + paymentFailure,
        checkInReminders,
        waitlistAlerts,
      },

      // Channel breakdown
      channels: {
        email: emailCount,
        whatsapp: whatsappCount,
      },

      // Activity
      last7Days,
      recent: recentNotifications,
    }

    return NextResponse.json({
      success: true,
      stats,
    })

  } catch (error) {
    console.error('[AdminNotificationsStatsAPI] Error:', error)
    return NextResponse.json(
      {
        success: false,
        message: 'Internal server error',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}