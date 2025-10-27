/**
 * Notification Trigger Service
 * Handles triggering notifications for various events
 */

import { prisma } from '@/lib/prisma'
import { NotificationType, NotificationChannel } from '@prisma/client'
import { createNotification, type NotificationPayload } from './notification.service'
import { sendNotification } from './notification-sender.service'

// ==========================================
// HELPER FUNCTIONS
// ==========================================

/**
 * Create and send notification immediately
 */
async function createAndSendNotification(payload: NotificationPayload) {
  const result = await createNotification(payload)
  if (result.success && result.notification) {
    // Send immediately in background (don't wait)
    sendNotification(result.notification.id).catch(error => {
      console.error(`[createAndSendNotification] Failed to send notification ${result.notification.id}:`, error)
    })
  }
  return result
}

// ==========================================
// BOOKING CONFIRMATION
// ==========================================

/**
 * Send booking confirmation notification
 */
export async function sendBookingConfirmation(bookingId: string) {
  try {
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        user: true,
        roomType: true,
      },
    })

    if (!booking) {
      return { success: false, error: 'Booking not found' }
    }

    const user = booking.user
    const checkIn = new Date(booking.startDate).toLocaleDateString()
    const checkOut = new Date(booking.endDate).toLocaleDateString()

    // Email notification
    if (user.email) {
      await createAndSendNotification({
        userId: user.id,
        type: 'BOOKING_CONFIRMATION',
        channel: 'EMAIL',
        subject: 'Booking Confirmed - Hotel Booking',
        message: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #2563eb;">Booking Confirmed!</h2>
            <p>Dear ${user.name},</p>
            <p>Your booking has been confirmed. Here are the details:</p>
            <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <p><strong>Room Type:</strong> ${booking.roomType.name}</p>
              <p><strong>Check-in:</strong> ${checkIn}</p>
              <p><strong>Check-out:</strong> ${checkOut}</p>
              <p><strong>Rooms:</strong> ${booking.roomsBooked}</p>
              <p><strong>Total Amount:</strong> $${(booking.totalPrice / 100).toFixed(2)}</p>
              <p><strong>Booking ID:</strong> ${booking.id}</p>
            </div>
            <p>We look forward to welcoming you!</p>
            <p>Best regards,<br>Hotel Booking Team</p>
          </div>
        `,
        metadata: {
          bookingId,
          event: 'booking_confirmed',
        },
      })
    }

    // WhatsApp notification
    if (user.phone) {
      await createAndSendNotification({
        userId: user.id,
        type: 'BOOKING_CONFIRMATION',
        channel: 'WHATSAPP',
        message: `✅ Booking Confirmed!\n\nDear ${user.name},\n\nYour booking for ${booking.roomType.name} has been confirmed.\n\n📅 Check-in: ${checkIn}\n📅 Check-out: ${checkOut}\n🏨 Rooms: ${booking.roomsBooked}\n💰 Total: $${(booking.totalPrice / 100).toFixed(2)}\n\nBooking ID: ${booking.id}\n\nWe look forward to your stay!`,
        metadata: {
          bookingId,
          event: 'booking_confirmed',
        },
      })
    }

    return { success: true }
  } catch (error) {
    console.error('[sendBookingConfirmation] Error:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
  }
}

// ==========================================
// PAYMENT SUCCESS/FAILURE
// ==========================================

/**
 * Send payment success notification
 */
export async function sendPaymentSuccess(paymentId: string) {
  try {
    const payment = await prisma.payment.findUnique({
      where: { id: paymentId },
      include: {
        user: true,
        booking: {
          include: {
            roomType: true,
          },
        },
      },
    })

    if (!payment) {
      return { success: false, error: 'Payment not found' }
    }

    const user = payment.user
    const amount = `$${(payment.amount / 100).toFixed(2)}`

    // Email notification
    if (user.email) {
      await createAndSendNotification({
        userId: user.id,
        type: 'PAYMENT_REMINDER', // Using existing type
        channel: 'EMAIL',
        subject: 'Payment Successful - Hotel Booking',
        message: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #16a34a;">Payment Successful!</h2>
            <p>Dear ${user.name},</p>
            <p>Your payment has been processed successfully.</p>
            <div style="background: #f0fdf4; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <p><strong>Amount:</strong> ${amount}</p>
              <p><strong>Payment ID:</strong> ${payment.id}</p>
              <p><strong>Method:</strong> ${payment.provider}</p>
              ${payment.booking ? `<p><strong>Booking ID:</strong> ${payment.booking.id}</p>` : ''}
            </div>
            <p>Thank you for your payment!</p>
            <p>Best regards,<br>Hotel Booking Team</p>
          </div>
        `,
        metadata: {
          paymentId,
          event: 'payment_success',
        },
      })
    }

    // WhatsApp notification
    if (user.phone) {
      await createAndSendNotification({
        userId: user.id,
        type: 'PAYMENT_REMINDER',
        channel: 'WHATSAPP',
        message: `💳 Payment Successful!\n\nDear ${user.name},\n\nYour payment of ${amount} has been processed successfully.\n\nPayment ID: ${payment.id}\nMethod: ${payment.provider}\n${payment.booking ? `Booking ID: ${payment.booking.id}` : ''}\n\nThank you!`,
        metadata: {
          paymentId,
          event: 'payment_success',
        },
      })
    }

    return { success: true }
  } catch (error) {
    console.error('[sendPaymentSuccess] Error:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
  }
}

/**
 * Send payment failure notification
 */
export async function sendPaymentFailure(paymentId: string) {
  try {
    const payment = await prisma.payment.findUnique({
      where: { id: paymentId },
      include: {
        user: true,
        booking: true,
      },
    })

    if (!payment) {
      return { success: false, error: 'Payment not found' }
    }

    const user = payment.user
    const amount = `$${(payment.amount / 100).toFixed(2)}`

    // Email notification
    if (user.email) {
      await createAndSendNotification({
        userId: user.id,
        type: 'PAYMENT_REMINDER',
        channel: 'EMAIL',
        subject: 'Payment Failed - Hotel Booking',
        message: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #dc2626;">Payment Failed</h2>
            <p>Dear ${user.name},</p>
            <p>Unfortunately, your payment could not be processed.</p>
            <div style="background: #fef2f2; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <p><strong>Amount:</strong> ${amount}</p>
              <p><strong>Payment ID:</strong> ${payment.id}</p>
              <p><strong>Reason:</strong> ${payment.errorMessage || 'Unknown error'}</p>
            </div>
            <p>Please try again or contact support.</p>
            <p>Best regards,<br>Hotel Booking Team</p>
          </div>
        `,
        metadata: {
          paymentId,
          event: 'payment_failed',
        },
      })
    }

    // WhatsApp notification
    if (user.phone) {
      await createAndSendNotification({
        userId: user.id,
        type: 'PAYMENT_REMINDER',
        channel: 'WHATSAPP',
        message: `❌ Payment Failed\n\nDear ${user.name},\n\nYour payment of ${amount} could not be processed.\n\nPayment ID: ${payment.id}\nReason: ${payment.errorMessage || 'Unknown error'}\n\nPlease try again or contact support.`,
        metadata: {
          paymentId,
          event: 'payment_failed',
        },
      })
    }

    return { success: true }
  } catch (error) {
    console.error('[sendPaymentFailure] Error:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
  }
}

// ==========================================
// CHECK-IN REMINDER
// ==========================================

/**
 * Send check-in reminder (24 hours before)
 */
export async function sendCheckInReminder(bookingId: string) {
  try {
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        user: true,
        roomType: true,
      },
    })

    if (!booking) {
      return { success: false, error: 'Booking not found' }
    }

    const user = booking.user
    const checkIn = new Date(booking.startDate).toLocaleDateString()
    const checkInTime = new Date(booking.startDate).toLocaleTimeString()

    // Email notification
    if (user.email) {
      await createAndSendNotification({
        userId: user.id,
        type: 'BOOKING_REMINDER',
        channel: 'EMAIL',
        subject: 'Check-in Reminder - Tomorrow',
        message: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #2563eb;">Check-in Reminder</h2>
            <p>Dear ${user.name},</p>
            <p>This is a friendly reminder that your check-in is tomorrow.</p>
            <div style="background: #eff6ff; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <p><strong>Room Type:</strong> ${booking.roomType.name}</p>
              <p><strong>Check-in Date:</strong> ${checkIn}</p>
              <p><strong>Check-in Time:</strong> ${checkInTime}</p>
              <p><strong>Rooms:</strong> ${booking.roomsBooked}</p>
              <p><strong>Booking ID:</strong> ${booking.id}</p>
            </div>
            <p>Please arrive on time. We look forward to welcoming you!</p>
            <p>Best regards,<br>Hotel Booking Team</p>
          </div>
        `,
        metadata: {
          bookingId,
          event: 'checkin_reminder',
        },
      })
    }

    // WhatsApp notification
    if (user.phone) {
      await createAndSendNotification({
        userId: user.id,
        type: 'BOOKING_REMINDER',
        channel: 'WHATSAPP',
        message: `🔔 Check-in Reminder\n\nDear ${user.name},\n\nYour check-in is tomorrow!\n\n🏨 Room: ${booking.roomType.name}\n📅 Date: ${checkIn}\n⏰ Time: ${checkInTime}\n🏠 Rooms: ${booking.roomsBooked}\n\nBooking ID: ${booking.id}\n\nPlease arrive on time. See you soon!`,
        metadata: {
          bookingId,
          event: 'checkin_reminder',
        },
      })
    }

    return { success: true }
  } catch (error) {
    console.error('[sendCheckInReminder] Error:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
  }
}

// ==========================================
// WAITLIST CONFIRMATION
// ==========================================

/**
 * Send waitlist confirmation notification
 */
export async function sendWaitlistConfirmation(waitlistId: string) {
  try {
    const waitlist = await prisma.waitlist.findUnique({
      where: { id: waitlistId },
      include: {
        user: true,
        roomType: true,
      },
    })

    if (!waitlist) {
      return { success: false, error: 'Waitlist entry not found' }
    }

    const user = waitlist.user
    const startDate = new Date(waitlist.startDate).toLocaleDateString()
    const endDate = new Date(waitlist.endDate).toLocaleDateString()

    // Email notification
    if (user.email) {
      await createAndSendNotification({
        userId: user.id,
        type: 'WAITLIST_ALERT',
        channel: 'EMAIL',
        subject: 'Added to Waitlist - Hotel Booking',
        message: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #f59e0b;">Waitlist Confirmation</h2>
            <p>Dear ${user.name},</p>
            <p>You have been added to the waitlist for your requested dates.</p>
            <div style="background: #fffbeb; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <p><strong>Room Type:</strong> ${waitlist.roomType?.name || 'Any available room'}</p>
              <p><strong>Check-in:</strong> ${startDate}</p>
              <p><strong>Check-out:</strong> ${endDate}</p>
              <p><strong>Guests:</strong> ${waitlist.guests}</p>
              <p><strong>Waitlist ID:</strong> ${waitlist.id}</p>
            </div>
            <p>We will notify you as soon as a room becomes available.</p>
            <p>Best regards,<br>Hotel Booking Team</p>
          </div>
        `,
        metadata: {
          waitlistId,
          event: 'waitlist_added',
        },
      })
    }

    // WhatsApp notification
    if (user.phone) {
      await createAndSendNotification({
        userId: user.id,
        type: 'WAITLIST_ALERT',
        channel: 'WHATSAPP',
        message: `📋 Waitlist Confirmation\n\nDear ${user.name},\n\nYou have been added to the waitlist.\n\n🏨 Room: ${waitlist.roomType?.name || 'Any available'}\n📅 Check-in: ${startDate}\n📅 Check-out: ${endDate}\n👥 Guests: ${waitlist.guests}\n\nWaitlist ID: ${waitlist.id}\n\nWe'll notify you when a room becomes available!`,
        metadata: {
          waitlistId,
          event: 'waitlist_added',
        },
      })
    }

    return { success: true }
  } catch (error) {
    console.error('[sendWaitlistConfirmation] Error:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
  }
}