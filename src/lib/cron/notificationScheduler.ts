/**
 * Day 19: Notification Scheduler
 * Background cron jobs for automated booking/payment reminders
 */

import cron from 'node-cron';
import { prisma } from '@/lib/prisma';
import { processScheduledNotifications } from '@/actions/notifications';
import {
  calculateBookingReminderTime,
  calculatePaymentReminderTime,
  generateMessage,
} from '@/lib/utils/notificationUtils';
import { NotificationType, NotificationChannel, NotificationStatus, BookingStatus } from '@prisma/client';
import { addDays } from 'date-fns';

// ===========================
// Configuration
// ===========================

const CRON_CONFIG = {
  // Send pending notifications every 5 minutes
  SEND_NOTIFICATIONS: '*/5 * * * *',
  // Create booking reminders daily at 9 AM
  BOOKING_REMINDERS: '0 9 * * *',
  // Create payment reminders daily at 10 AM
  PAYMENT_REMINDERS: '0 10 * * *',
  // Cleanup old notifications weekly (Sunday at 2 AM)
  CLEANUP: '0 2 * * 0',
};

// ===========================
// Cron Job Functions
// ===========================

/**
 * Send all pending notifications that are due
 */
async function sendPendingNotifications() {
  try {
    console.log('[Cron: sendPendingNotifications] Starting...');
    const result = await processScheduledNotifications();

    if (result.success && result.data) {
      console.log(
        `[Cron: sendPendingNotifications] Processed: ${result.data.processed}, Succeeded: ${result.data.succeeded}, Failed: ${result.data.failed}`
      );
    } else {
      console.error('[Cron: sendPendingNotifications] Error:', result.error);
    }
  } catch (error) {
    console.error('[Cron: sendPendingNotifications] Unexpected error:', error);
  }
}

/**
 * Create booking reminder notifications for check-ins tomorrow
 */
async function createBookingReminders() {
  try {
    console.log('[Cron: createBookingReminders] Starting...');

    // Get tomorrow's date range (start and end of day)
    const tomorrow = addDays(new Date(), 1);
    tomorrow.setHours(0, 0, 0, 0);
    const tomorrowEnd = new Date(tomorrow);
    tomorrowEnd.setHours(23, 59, 59, 999);

    // Find all confirmed bookings with check-in tomorrow
    const bookings = await prisma.booking.findMany({
      where: {
        status: BookingStatus.CONFIRMED,
        checkInDate: {
          gte: tomorrow,
          lte: tomorrowEnd,
        },
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            phone: true,
            firstName: true,
            lastName: true,
          },
        },
        room: {
          include: {
            roomType: {
              select: {
                name: true,
              },
            },
          },
        },
      },
    });

    console.log(`[Cron: createBookingReminders] Found ${bookings.length} bookings for tomorrow`);

    let created = 0;

    for (const booking of bookings) {
      // Check if reminder already exists
      const existingReminder = await prisma.notification.findFirst({
        where: {
          userId: booking.userId,
          bookingId: booking.id,
          type: NotificationType.BOOKING_REMINDER,
        },
      });

      if (existingReminder) {
        console.log(`[Cron: createBookingReminders] Reminder already exists for booking ${booking.id}`);
        continue;
      }

      // Calculate reminder time (24 hours before check-in)
      const reminderTime = calculateBookingReminderTime(booking.checkInDate);

      // Generate message for email
      const emailMessage = generateMessage(NotificationType.BOOKING_REMINDER, NotificationChannel.EMAIL, {
        userName: `${booking.user.firstName} ${booking.user.lastName}`,
        userEmail: booking.user.email,
        bookingId: booking.id,
        roomTypeName: booking.room.roomType.name,
        checkInDate: booking.checkInDate,
        checkOutDate: booking.checkOutDate,
        totalAmount: booking.totalAmount,
      });

      // Generate message for WhatsApp (if user has phone)
      const whatsappMessage = booking.user.phone
        ? generateMessage(NotificationType.BOOKING_REMINDER, NotificationChannel.WHATSAPP, {
            userName: booking.user.firstName,
            userPhone: booking.user.phone,
            bookingId: booking.id,
            roomTypeName: booking.room.roomType.name,
            checkInDate: booking.checkInDate,
            checkOutDate: booking.checkOutDate,
          })
        : null;

      // Create email notification
      await prisma.notification.create({
        data: {
          userId: booking.userId,
          bookingId: booking.id,
          type: NotificationType.BOOKING_REMINDER,
          channel: NotificationChannel.EMAIL,
          message: emailMessage.message,
          subject: emailMessage.subject,
          scheduledAt: reminderTime,
          status: NotificationStatus.PENDING,
        },
      });
      created++;

      // Create WhatsApp notification if user has phone
      if (whatsappMessage && booking.user.phone) {
        await prisma.notification.create({
          data: {
            userId: booking.userId,
            bookingId: booking.id,
            type: NotificationType.BOOKING_REMINDER,
            channel: NotificationChannel.WHATSAPP,
            message: whatsappMessage.message,
            scheduledAt: reminderTime,
            status: NotificationStatus.PENDING,
          },
        });
        created++;
      }
    }

    console.log(`[Cron: createBookingReminders] Created ${created} reminder notifications`);
  } catch (error) {
    console.error('[Cron: createBookingReminders] Error:', error);
  }
}

/**
 * Create payment reminder notifications for unpaid bookings
 */
async function createPaymentReminders() {
  try {
    console.log('[Cron: createPaymentReminders] Starting...');

    // Find all confirmed bookings with unpaid status
    const unpaidBookings = await prisma.booking.findMany({
      where: {
        status: BookingStatus.CONFIRMED,
        paymentStatus: 'UNPAID',
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            phone: true,
            firstName: true,
            lastName: true,
          },
        },
        room: {
          include: {
            roomType: {
              select: {
                name: true,
              },
            },
          },
        },
      },
    });

    console.log(`[Cron: createPaymentReminders] Found ${unpaidBookings.length} unpaid bookings`);

    let created = 0;

    for (const booking of unpaidBookings) {
      // Assume payment is due 3 days before check-in
      const dueDate = addDays(booking.checkInDate, -3);

      // Create reminders for 3 days before, 1 day before, and on due date
      const reminderNumbers = [1, 2, 3]; // 3 days, 1 day, 0 days

      for (const reminderNumber of reminderNumbers) {
        // Check if reminder already exists
        const existingReminder = await prisma.notification.findFirst({
          where: {
            userId: booking.userId,
            bookingId: booking.id,
            type: NotificationType.PAYMENT_REMINDER,
            metadata: {
              contains: `reminderNumber\":${reminderNumber}`,
            },
          },
        });

        if (existingReminder) {
          continue;
        }

        // Calculate reminder time
        const reminderTime = calculatePaymentReminderTime(dueDate, reminderNumber);

        // Only schedule if reminder time is in the future
        if (reminderTime <= new Date()) {
          continue;
        }

        // Generate email message
        const emailMessage = generateMessage(NotificationType.PAYMENT_REMINDER, NotificationChannel.EMAIL, {
          userName: `${booking.user.firstName} ${booking.user.lastName}`,
          userEmail: booking.user.email,
          bookingId: booking.id,
          roomTypeName: booking.room.roomType.name,
          totalAmount: booking.totalAmount,
          dueDate,
          paymentLink: `${process.env.NEXT_PUBLIC_APP_URL}/booking/${booking.id}/payment`,
        });

        // Create email notification
        await prisma.notification.create({
          data: {
            userId: booking.userId,
            bookingId: booking.id,
            type: NotificationType.PAYMENT_REMINDER,
            channel: NotificationChannel.EMAIL,
            message: emailMessage.message,
            subject: emailMessage.subject,
            scheduledAt: reminderTime,
            status: NotificationStatus.PENDING,
            metadata: JSON.stringify({ reminderNumber }),
          },
        });
        created++;

        // Create WhatsApp notification if user has phone
        if (booking.user.phone) {
          const whatsappMessage = generateMessage(NotificationType.PAYMENT_REMINDER, NotificationChannel.WHATSAPP, {
            userName: booking.user.firstName,
            userPhone: booking.user.phone,
            bookingId: booking.id,
            totalAmount: booking.totalAmount,
            dueDate,
          });

          await prisma.notification.create({
            data: {
              userId: booking.userId,
              bookingId: booking.id,
              type: NotificationType.PAYMENT_REMINDER,
              channel: NotificationChannel.WHATSAPP,
              message: whatsappMessage.message,
              scheduledAt: reminderTime,
              status: NotificationStatus.PENDING,
              metadata: JSON.stringify({ reminderNumber }),
            },
          });
          created++;
        }
      }
    }

    console.log(`[Cron: createPaymentReminders] Created ${created} payment reminder notifications`);
  } catch (error) {
    console.error('[Cron: createPaymentReminders] Error:', error);
  }
}

/**
 * Cleanup old notifications (older than 90 days)
 */
async function cleanupOldNotifications() {
  try {
    console.log('[Cron: cleanupOldNotifications] Starting...');

    const ninetyDaysAgo = addDays(new Date(), -90);

    // Delete old sent/cancelled notifications
    const result = await prisma.notification.deleteMany({
      where: {
        createdAt: { lt: ninetyDaysAgo },
        status: {
          in: [NotificationStatus.SENT, NotificationStatus.CANCELLED],
        },
      },
    });

    console.log(`[Cron: cleanupOldNotifications] Deleted ${result.count} old notifications`);
  } catch (error) {
    console.error('[Cron: cleanupOldNotifications] Error:', error);
  }
}

// ===========================
// Cron Job Initialization
// ===========================

/**
 * Initialize all cron jobs
 */
export function initNotificationCronJobs() {
  console.log('[Notification Scheduler] Initializing cron jobs...');

  // Send pending notifications every 5 minutes
  cron.schedule(CRON_CONFIG.SEND_NOTIFICATIONS, sendPendingNotifications, {
    scheduled: true,
    timezone: 'UTC',
  });
  console.log(`[Notification Scheduler] Scheduled: Send pending notifications (${CRON_CONFIG.SEND_NOTIFICATIONS})`);

  // Create booking reminders daily at 9 AM
  cron.schedule(CRON_CONFIG.BOOKING_REMINDERS, createBookingReminders, {
    scheduled: true,
    timezone: 'UTC',
  });
  console.log(`[Notification Scheduler] Scheduled: Create booking reminders (${CRON_CONFIG.BOOKING_REMINDERS})`);

  // Create payment reminders daily at 10 AM
  cron.schedule(CRON_CONFIG.PAYMENT_REMINDERS, createPaymentReminders, {
    scheduled: true,
    timezone: 'UTC',
  });
  console.log(`[Notification Scheduler] Scheduled: Create payment reminders (${CRON_CONFIG.PAYMENT_REMINDERS})`);

  // Cleanup old notifications weekly (Sunday at 2 AM)
  cron.schedule(CRON_CONFIG.CLEANUP, cleanupOldNotifications, {
    scheduled: true,
    timezone: 'UTC',
  });
  console.log(`[Notification Scheduler] Scheduled: Cleanup old notifications (${CRON_CONFIG.CLEANUP})`);

  console.log('[Notification Scheduler] All cron jobs initialized successfully!');
}

/**
 * Stop all cron jobs (for graceful shutdown)
 */
export function stopNotificationCronJobs() {
  cron.getTasks().forEach((task) => {
    task.stop();
  });
  console.log('[Notification Scheduler] All cron jobs stopped');
}

// ===========================
// Manual Trigger Functions (for testing/API)
// ===========================

export {
  sendPendingNotifications as triggerSendPendingNotifications,
  createBookingReminders as triggerCreateBookingReminders,
  createPaymentReminders as triggerCreatePaymentReminders,
  cleanupOldNotifications as triggerCleanupOldNotifications,
};
