// ==========================================
// ADMIN NOTIFICATIONS API
// ==========================================
// API endpoints for admin notification management

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/middleware/auth.utils'
import { sendPendingNotifications } from '@/lib/services/notification-sender.service'

// ==========================================
// GET NOTIFICATIONS LIST
// ==========================================

/**
 * GET /api/notifications/admin/list
 *
 * Get paginated list of notifications for admin dashboard
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

    // Parse query parameters
    const { searchParams } = new URL(req.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')
    const status = searchParams.get('status')
    const type = searchParams.get('type')
    const channel = searchParams.get('channel')

    // Build where clause
    const where: any = {}

    if (status) where.status = status
    if (type) where.type = type
    if (channel) where.channel = channel

    // Get total count
    const total = await prisma.notification.count({ where })

    // Get notifications with pagination
    const notifications = await prisma.notification.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    })

    // Get stats
    const [totalCount, pendingCount, sentCount, failedCount, todayCount] = await Promise.all([
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
    ])

    const stats = {
      total: totalCount,
      pending: pendingCount,
      sent: sentCount,
      failed: failedCount,
      today: todayCount,
    }

    return NextResponse.json({
      success: true,
      notifications,
      stats,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    })

  } catch (error) {
    console.error('[AdminNotificationsAPI] Error:', error)
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

// ==========================================
// PROCESS PENDING NOTIFICATIONS
// ==========================================

/**
 * POST /api/notifications/admin/process-pending
 *
 * Process all pending notifications
 * Requires SUPERADMIN role
 */
export async function POST(req: NextRequest) {
  try {
    // Authentication check
    const user = await getCurrentUser()
    if (!user || user.role !== 'SUPERADMIN') {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 403 }
      )
    }

    // Process pending notifications
    const result = await sendPendingNotifications()

    return NextResponse.json({
      success: result.success,
      message: result.success
        ? `Processed ${result.processed} notifications (${result.sent} sent, ${result.failed} failed)`
        : `Failed to process notifications: ${result.error}`,
      data: result,
    })

  } catch (error) {
    console.error('[AdminNotificationsAPI] Error:', error)
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