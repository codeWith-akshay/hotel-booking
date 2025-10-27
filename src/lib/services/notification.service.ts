/**
 * Real-time Notification Service
 * Handles creating and broadcasting notifications for check-in events
 */

import { prisma } from '@/lib/prisma'
import { NotificationType, NotificationChannel, NotificationStatus } from '@prisma/client'

// ==========================================
// TYPE DEFINITIONS
// ==========================================

export interface CheckInNotificationData {
  bookingId: string
  guestName: string
  roomNumber?: string
  checkInTime: Date
  performedBy: string
}

export interface NotificationPayload {
  userId: string
  type: NotificationType
  channel: NotificationChannel
  message: string
  subject?: string
  metadata?: Record<string, any>
}

// ==========================================
// NOTIFICATION CREATION
// ==========================================

/**
 * Create a notification in the database
 */
export async function createNotification(payload: NotificationPayload) {
  try {
    const notification = await prisma.notification.create({
      data: {
        userId: payload.userId,
        type: payload.type,
        channel: payload.channel,
        message: payload.message,
        subject: payload.subject,
        status: 'PENDING',
        metadata: payload.metadata ? JSON.stringify(payload.metadata) : null,
        scheduledAt: new Date(),
      },
    })

    return {
      success: true,
      notification,
    }
  } catch (error) {
    console.error('[createNotification] Error:', error)
    return {
      success: false,
      error: 'Failed to create notification',
    }
  }
}

/**
 * Send check-in notifications to all admins and super admins
 */
export async function sendCheckInNotifications(data: CheckInNotificationData) {
  try {
    // Get all admin and super admin users
    const adminUsers = await prisma.user.findMany({
      where: {
        role: {
          name: {
            in: ['ADMIN', 'SUPERADMIN'],
          },
        },
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: {
          select: {
            name: true,
          },
        },
      },
    })

    if (adminUsers.length === 0) {
      console.log('[sendCheckInNotifications] No admin users found')
      return {
        success: true,
        notificationsSent: 0,
      }
    }

    const { guestName, roomNumber, checkInTime, bookingId } = data

    // Create notification message
    const subject = '🔔 Guest Check-In Alert'
    const message = `${guestName} has checked in${roomNumber ? ` to Room ${roomNumber}` : ''} at ${checkInTime.toLocaleTimeString()}`

    // Create notifications for all admins
    const notificationPromises = adminUsers.map(async (admin) => {
      return createNotification({
        userId: admin.id,
        type: 'CHECKIN_ALERT',
        channel: 'IN_APP',
        subject,
        message,
        metadata: {
          bookingId,
          guestName,
          roomNumber,
          checkInTime: checkInTime.toISOString(),
          notifiedAt: new Date().toISOString(),
          priority: 'high',
        },
      })
    })

    const results = await Promise.all(notificationPromises)
    const successCount = results.filter((r) => r.success).length

    console.log(`[sendCheckInNotifications] Sent ${successCount}/${adminUsers.length} notifications`)

    return {
      success: true,
      notificationsSent: successCount,
      totalAdmins: adminUsers.length,
    }
  } catch (error) {
    console.error('[sendCheckInNotifications] Error:', error)
    return {
      success: false,
      error: 'Failed to send check-in notifications',
    }
  }
}

/**
 * Get unread notification count for a user
 */
export async function getUnreadNotificationCount(userId: string): Promise<number> {
  try {
    const count = await prisma.notification.count({
      where: {
        userId,
        status: 'PENDING', // Only count pending (unread) notifications
      },
    })

    return count
  } catch (error) {
    console.error('[getUnreadNotificationCount] Error:', error)
    return 0
  }
}

/**
 * Mark notification as read
 */
export async function markNotificationAsRead(notificationId: string, userId: string) {
  try {
    const notification = await prisma.notification.findFirst({
      where: {
        id: notificationId,
        userId,
      },
    })

    if (!notification) {
      return {
        success: false,
        error: 'Notification not found',
      }
    }

    // Update metadata to include readAt timestamp
    const metadata = notification.metadata ? JSON.parse(notification.metadata) : {}
    metadata.readAt = new Date().toISOString()

    await prisma.notification.update({
      where: {
        id: notificationId,
      },
      data: {
        status: 'DELIVERED',
        metadata: JSON.stringify(metadata),
      },
    })

    return {
      success: true,
    }
  } catch (error) {
    console.error('[markNotificationAsRead] Error:', error)
    return {
      success: false,
      error: 'Failed to mark notification as read',
    }
  }
}

/**
 * Get recent notifications for a user
 */
export async function getUserNotifications(
  userId: string,
  limit: number = 10,
  includeRead: boolean = false
) {
  try {
    const whereClause: any = {
      userId,
    }

    if (!includeRead) {
      // Only show unread (PENDING) notifications
      whereClause.status = 'PENDING'
    }

    const notifications = await prisma.notification.findMany({
      where: whereClause,
      orderBy: {
        createdAt: 'desc',
      },
      take: limit,
      select: {
        id: true,
        type: true,
        subject: true,
        message: true,
        metadata: true,
        createdAt: true,
        status: true,
      },
    })

    return {
      success: true,
      notifications: notifications.map((n) => ({
        ...n,
        metadata: n.metadata ? JSON.parse(n.metadata) : null,
      })),
    }
  } catch (error) {
    console.error('[getUserNotifications] Error:', error)
    return {
      success: false,
      error: 'Failed to fetch notifications',
      notifications: [],
    }
  }
}
