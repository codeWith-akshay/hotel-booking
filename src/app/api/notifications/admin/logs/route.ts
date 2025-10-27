/**
 * Admin Notifications Logs API
 * Fetch notification logs with filters and statistics
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { NotificationType, NotificationChannel, NotificationStatus } from '@prisma/client'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const page = parseInt(searchParams.get('page') || '1')
    const type = searchParams.get('type') as NotificationType | null
    const channel = searchParams.get('channel') as NotificationChannel | null
    const status = searchParams.get('status') as NotificationStatus | null

    const limit = 50
    const skip = (page - 1) * limit

    // Build where clause
    const where: any = {}
    if (type) where.type = type
    if (channel) where.channel = channel
    if (status) where.status = status

    // Fetch notifications and stats in parallel
    const [notifications, total, stats] = await Promise.all([
      prisma.notification.findMany({
        where,
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
        take: limit,
        skip,
      }),
      prisma.notification.count({ where }),
      getNotificationStats(),
    ])

    return NextResponse.json({
      notifications,
      total,
      pages: Math.ceil(total / limit),
      stats,
    })
  } catch (error) {
    console.error('Failed to fetch notification logs:', error)
    return NextResponse.json(
      { error: 'Failed to fetch notification logs' },
      { status: 500 }
    )
  }
}

// Get notification statistics
async function getNotificationStats() {
  const [total, pending, sent, failed, byType, byChannel] = await Promise.all([
    prisma.notification.count(),
    prisma.notification.count({ where: { status: 'PENDING' } }),
    prisma.notification.count({ where: { status: 'SENT' } }),
    prisma.notification.count({ where: { status: 'FAILED' } }),
    prisma.notification.groupBy({
      by: ['type'],
      _count: true,
    }),
    prisma.notification.groupBy({
      by: ['channel'],
      _count: true,
    }),
  ])

  return { total, pending, sent, failed, byType, byChannel }
}
