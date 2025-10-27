/**
 * Check-in Reminder Scheduler
 * Scheduled job to send check-in reminders 24 hours before arrival
 */

import { prisma } from '@/lib/prisma'
import { sendCheckInReminder } from './notification-trigger.service'

// ==========================================
// SCHEDULER FUNCTION
// ==========================================

/**
 * Send check-in reminders for bookings arriving tomorrow
 * This function should be called daily (e.g., via cron job)
 */
export async function sendCheckInReminders() {
  try {
    console.log('[CheckInReminderScheduler] Starting check-in reminder job')

    // Calculate tomorrow's date
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    tomorrow.setHours(0, 0, 0, 0)

    const tomorrowEnd = new Date(tomorrow)
    tomorrowEnd.setHours(23, 59, 59, 999)

    // Find confirmed bookings starting tomorrow
    const bookingsToRemind = await prisma.booking.findMany({
      where: {
        status: 'CONFIRMED',
        startDate: {
          gte: tomorrow,
          lte: tomorrowEnd,
        },
        // Only send reminders if not already sent
        // We can add a field to track this, but for now we'll rely on notification history
      },
      include: {
        user: true,
        roomType: true,
      },
    })

    console.log(`[CheckInReminderScheduler] Found ${bookingsToRemind.length} bookings for tomorrow`)

    let successCount = 0
    let errorCount = 0

    // Send reminders for each booking
    for (const booking of bookingsToRemind) {
      try {
        // Check if reminder was already sent (optional - can be removed if not needed)
        const existingReminder = await prisma.notification.findFirst({
          where: {
            userId: booking.userId,
            type: 'BOOKING_REMINDER',
            metadata: {
              path: ['event'],
              equals: 'checkin_reminder',
            },
            createdAt: {
              gte: new Date(Date.now() - 24 * 60 * 60 * 1000), // Within last 24 hours
            },
          },
        })

        if (existingReminder) {
          console.log(`[CheckInReminderScheduler] Reminder already sent for booking ${booking.id}`)
          continue
        }

        // Send reminder
        await sendCheckInReminder(booking.id)
        successCount++

        console.log(`[CheckInReminderScheduler] Sent reminder for booking ${booking.id}`)

        // Small delay to avoid overwhelming the notification service
        await new Promise(resolve => setTimeout(resolve, 100))

      } catch (error) {
        console.error(`[CheckInReminderScheduler] Failed to send reminder for booking ${booking.id}:`, error)
        errorCount++
      }
    }

    console.log(`[CheckInReminderScheduler] Completed: ${successCount} sent, ${errorCount} failed`)

    return {
      success: true,
      sent: successCount,
      failed: errorCount,
      total: bookingsToRemind.length,
    }

  } catch (error) {
    console.error('[CheckInReminderScheduler] Error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

// ==========================================
// API ENDPOINT FOR MANUAL TRIGGERING
// ==========================================

/**
 * API endpoint to manually trigger check-in reminders
 * GET /api/scheduler/checkin-reminders
 */
export async function triggerCheckInReminders() {
  const result = await sendCheckInReminders()

  return {
    success: result.success,
    message: result.success
      ? `Check-in reminders sent: ${result.sent} successful, ${result.failed} failed`
      : `Failed to send reminders: ${result.error}`,
    data: result,
  }
}