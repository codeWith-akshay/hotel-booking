/**
 * Notification Utilities Module
 * Day 19: Notifications Engine & Scheduled Reminders System
 * 
 * Provides helper functions for notification management:
 * - Message template generation
 * - Scheduling logic (24h before check-in, payment deadlines)
 * - Notification formatting
 * - Status helpers
 * - Placeholder replacement
 * 
 * @module notificationUtils
 */

import { NotificationType, NotificationChannel, NotificationStatus } from '@prisma/client';
import { addHours, addDays, subDays, isBefore, format } from 'date-fns';

/**
 * Message template type
 */
export interface MessageTemplate {
  subject?: string;
  message: string;
}

/**
 * Notification data for template rendering
 */
export interface NotificationData {
  userName: string;
  userEmail?: string;
  userPhone: string;
  bookingId?: string;
  roomTypeName?: string;
  checkInDate?: Date;
  checkOutDate?: Date;
  totalAmount?: number;
  currency?: string;
  dueDate?: Date;
  [key: string]: any;
}

/**
 * Message templates for different notification types
 * Supports placeholder replacement: {userName}, {checkInDate}, etc.
 */
export const MESSAGE_TEMPLATES: Record<NotificationType, Record<NotificationChannel, MessageTemplate>> = {
  BOOKING_REMINDER: {
    EMAIL: {
      subject: 'Reminder: Your check-in is tomorrow at {roomTypeName}',
      message: `
Dear {userName},

This is a friendly reminder that your check-in is scheduled for tomorrow.

Booking Details:
- Booking ID: {bookingId}
- Room Type: {roomTypeName}
- Check-in: {checkInDate}
- Check-out: {checkOutDate}

We look forward to welcoming you!

Best regards,
Hotel Team
      `.trim(),
    },
    WHATSAPP: {
      message: `Hi {userName}! 👋\n\nReminder: Your check-in at {roomTypeName} is tomorrow ({checkInDate}).\n\nBooking ID: {bookingId}\n\nSee you soon! 🏨`,
    },
    SMS: {
      message: 'Reminder: Check-in tomorrow at {roomTypeName}. Booking: {bookingId}. See you soon!',
    },
    IN_APP: {
      message: 'Your check-in at {roomTypeName} is scheduled for tomorrow',
    },
  },
  
  PAYMENT_REMINDER: {
    EMAIL: {
      subject: 'Payment Reminder for Booking {bookingId}',
      message: `
Dear {userName},

This is a reminder that payment for your booking is pending.

Booking Details:
- Booking ID: {bookingId}
- Room Type: {roomTypeName}
- Amount Due: {totalAmount}
- Due Date: {dueDate}

Please complete the payment to confirm your reservation.

Pay Now: {paymentLink}

Best regards,
Hotel Team
      `.trim(),
    },
    WHATSAPP: {
      message: `Hi {userName},\n\nPayment reminder for booking {bookingId}.\n\nAmount: {totalAmount}\nDue: {dueDate}\n\nPay now: {paymentLink}`,
    },
    SMS: {
      message: 'Payment due for booking {bookingId}: {totalAmount} by {dueDate}. Pay: {paymentLink}',
    },
    IN_APP: {
      message: 'Payment pending for {roomTypeName} - {totalAmount} due by {dueDate}',
    },
  },
  
  WAITLIST_ALERT: {
    EMAIL: {
      subject: 'Great News! A room is now available',
      message: `
Dear {userName},

Good news! A {roomTypeName} is now available for your requested dates.

Requested Dates:
- Check-in: {checkInDate}
- Check-out: {checkOutDate}

This room won't be available for long. Book now to secure your reservation!

Book Now: {bookingLink}

Best regards,
Hotel Team
      `.trim(),
    },
    WHATSAPP: {
      message: `Great news, {userName}! 🎉\n\nA {roomTypeName} is now available for {checkInDate} - {checkOutDate}!\n\nBook now: {bookingLink}`,
    },
    SMS: {
      message: 'Room available! {roomTypeName} for {checkInDate}-{checkOutDate}. Book: {bookingLink}',
    },
    IN_APP: {
      message: 'Room available: {roomTypeName} for your requested dates',
    },
  },
  
  BROADCAST: {
    EMAIL: {
      subject: '{broadcastSubject}',
      message: '{broadcastMessage}',
    },
    WHATSAPP: {
      message: '{broadcastMessage}',
    },
    SMS: {
      message: '{broadcastMessage}',
    },
    IN_APP: {
      message: '{broadcastMessage}',
    },
  },
  
  BOOKING_CONFIRMATION: {
    EMAIL: {
      subject: 'Booking Confirmed - {bookingId}',
      message: `
Dear {userName},

Your booking has been confirmed!

Booking Details:
- Booking ID: {bookingId}
- Room Type: {roomTypeName}
- Check-in: {checkInDate}
- Check-out: {checkOutDate}
- Total Amount: {totalAmount}

Your invoice will be sent separately.

Best regards,
Hotel Team
      `.trim(),
    },
    WHATSAPP: {
      message: `Booking confirmed! ✅\n\n{roomTypeName}\n{checkInDate} - {checkOutDate}\n\nBooking ID: {bookingId}\nTotal: {totalAmount}`,
    },
    SMS: {
      message: 'Booking confirmed: {bookingId}. {roomTypeName}, {checkInDate}. Total: {totalAmount}',
    },
    IN_APP: {
      message: 'Booking confirmed for {roomTypeName} - {checkInDate}',
    },
  },
  
  CANCELLATION_NOTICE: {
    EMAIL: {
      subject: 'Booking Cancelled - {bookingId}',
      message: `
Dear {userName},

Your booking has been cancelled.

Booking Details:
- Booking ID: {bookingId}
- Room Type: {roomTypeName}
- Original Dates: {checkInDate} - {checkOutDate}

If this was a mistake, please contact us immediately.

Best regards,
Hotel Team
      `.trim(),
    },
    WHATSAPP: {
      message: `Booking cancelled: {bookingId}\n\n{roomTypeName}\n{checkInDate} - {checkOutDate}\n\nQuestions? Contact us.`,
    },
    SMS: {
      message: 'Booking {bookingId} cancelled. Contact us if needed.',
    },
    IN_APP: {
      message: 'Booking cancelled: {bookingId}',
    },
  },
  
  INVOICE_READY: {
    EMAIL: {
      subject: 'Your Invoice is Ready - {invoiceNumber}',
      message: `
Dear {userName},

Your invoice for booking {bookingId} is now ready.

Invoice Number: {invoiceNumber}
Amount: {totalAmount}

Download your invoice: {invoiceLink}

Best regards,
Hotel Team
      `.trim(),
    },
    WHATSAPP: {
      message: `Invoice ready! 📄\n\nInvoice: {invoiceNumber}\nBooking: {bookingId}\nAmount: {totalAmount}\n\nDownload: {invoiceLink}`,
    },
    SMS: {
      message: 'Invoice {invoiceNumber} ready for booking {bookingId}. Download: {invoiceLink}',
    },
    IN_APP: {
      message: 'Invoice ready: {invoiceNumber} - {totalAmount}',
    },
  },

  CHECKIN_ALERT: {
    EMAIL: {
      subject: 'Guest Check-In Alert - {bookingId}',
      message: `
Dear {userName},

A guest has checked in.

Booking Details:
- Booking ID: {bookingId}
- Room Type: {roomTypeName}
- Check-in Time: {checkInDate}

Best regards,
Hotel Team
      `.trim(),
    },
    WHATSAPP: {
      message: `Guest checked in! ✅\n\nBooking: {bookingId}\nRoom: {roomTypeName}\nTime: {checkInDate}`,
    },
    SMS: {
      message: 'Guest checked in - Booking: {bookingId}',
    },
    IN_APP: {
      message: 'Guest checked in: {bookingId}',
    },
  },

  CHECKOUT_ALERT: {
    EMAIL: {
      subject: 'Guest Check-Out Alert - {bookingId}',
      message: `
Dear {userName},

A guest has checked out.

Booking Details:
- Booking ID: {bookingId}
- Room Type: {roomTypeName}
- Check-out Time: {checkOutDate}

Best regards,
Hotel Team
      `.trim(),
    },
    WHATSAPP: {
      message: `Guest checked out! 👋\n\nBooking: {bookingId}\nRoom: {roomTypeName}\nTime: {checkOutDate}`,
    },
    SMS: {
      message: 'Guest checked out - Booking: {bookingId}',
    },
    IN_APP: {
      message: 'Guest checked out: {bookingId}',
    },
  },
};

/**
 * Replaces placeholders in a message template with actual data
 * Supports date formatting and currency display
 * 
 * @param template - Message template with placeholders
 * @param data - Data to replace placeholders
 * @returns Rendered message
 * 
 * @example
 * const message = replacePlaceholders(
 *   'Hi {userName}, check-in is {checkInDate}',
 *   { userName: 'John', checkInDate: new Date('2025-01-23') }
 * );
 * // Returns: "Hi John, check-in is January 23, 2025"
 */
export function replacePlaceholders(template: string, data: NotificationData): string {
  let result = template;

  // Replace all placeholders
  Object.keys(data).forEach((key) => {
    const value = data[key];
    let replacement = '';

    if (value === undefined || value === null) {
      replacement = '';
    } else if (value instanceof Date) {
      // Format dates nicely
      replacement = format(value, 'MMMM d, yyyy');
    } else if (typeof value === 'number' && key.includes('Amount')) {
      // Format currency
      replacement = formatCurrency(value, data.currency || 'USD');
    } else {
      replacement = String(value);
    }

    const placeholder = new RegExp(`\\{${key}\\}`, 'g');
    result = result.replace(placeholder, replacement);
  });

  // Remove any remaining unreplaced placeholders
  result = result.replace(/\{[^}]+\}/g, '');

  return result.trim();
}

/**
 * Generates a notification message from template
 * 
 * @param type - Notification type
 * @param channel - Delivery channel
 * @param data - Notification data
 * @returns Message template with placeholders replaced
 */
export function generateMessage(
  type: NotificationType,
  channel: NotificationChannel,
  data: NotificationData
): MessageTemplate {
  const template = MESSAGE_TEMPLATES[type][channel];

  return {
    subject: template.subject ? replacePlaceholders(template.subject, data) : undefined,
    message: replacePlaceholders(template.message, data),
  };
}

/**
 * Calculates when to send a booking reminder
 * Default: 24 hours before check-in
 * 
 * @param checkInDate - Booking check-in date
 * @returns Scheduled send time
 */
export function calculateBookingReminderTime(checkInDate: Date): Date {
  return subDays(checkInDate, 1); // 24 hours before
}

/**
 * Calculates when to send a payment reminder
 * Default: 3 days before due date, then daily
 * 
 * @param dueDate - Payment due date
 * @param reminderNumber - Which reminder (1st, 2nd, 3rd)
 * @returns Scheduled send time
 */
export function calculatePaymentReminderTime(dueDate: Date, reminderNumber: number = 1): Date {
  switch (reminderNumber) {
    case 1:
      return subDays(dueDate, 3); // 3 days before
    case 2:
      return subDays(dueDate, 1); // 1 day before
    case 3:
      return dueDate; // On due date
    default:
      return subDays(dueDate, 3);
  }
}

/**
 * Checks if a notification should be sent now
 * Compares scheduledAt with current time
 * 
 * @param scheduledAt - When notification is scheduled
 * @returns True if should be sent now
 */
export function shouldSendNow(scheduledAt: Date): boolean {
  const now = new Date();
  return isBefore(scheduledAt, now) || scheduledAt.getTime() === now.getTime();
}

/**
 * Formats currency for display
 * 
 * @param amountInCents - Amount in smallest unit
 * @param currency - Currency code
 * @returns Formatted string
 */
export function formatCurrency(amountInCents: number, currency: string = 'USD'): string {
  const amount = amountInCents / 100;

  const symbols: Record<string, string> = {
    USD: '$',
    INR: '₹',
    EUR: '€',
    GBP: '£',
  };

  const symbol = symbols[currency.toUpperCase()] || currency;
  return `${symbol}${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

/**
 * Gets a human-readable label for notification type
 * 
 * @param type - NotificationType enum
 * @returns Display label
 */
export function getNotificationTypeLabel(type: NotificationType): string {
  const labels: Record<NotificationType, string> = {
    BOOKING_REMINDER: 'Booking Reminder',
    PAYMENT_REMINDER: 'Payment Reminder',
    WAITLIST_ALERT: 'Waitlist Alert',
    BROADCAST: 'Announcement',
    BOOKING_CONFIRMATION: 'Booking Confirmation',
    CANCELLATION_NOTICE: 'Cancellation Notice',
    INVOICE_READY: 'Invoice Ready',
    CHECKIN_ALERT: 'Check-In Alert',
    CHECKOUT_ALERT: 'Check-Out Alert',
  };

  return labels[type] || type;
}

/**
 * Gets icon for notification type (for UI display)
 * 
 * @param type - NotificationType enum
 * @returns Icon name (Lucide icon)
 */
export function getNotificationTypeIcon(type: NotificationType): string {
  const icons: Record<NotificationType, string> = {
    BOOKING_REMINDER: 'Calendar',
    PAYMENT_REMINDER: 'CreditCard',
    WAITLIST_ALERT: 'Bell',
    BROADCAST: 'Megaphone',
    BOOKING_CONFIRMATION: 'CheckCircle',
    CANCELLATION_NOTICE: 'XCircle',
    INVOICE_READY: 'FileText',
    CHECKIN_ALERT: 'LogIn',
    CHECKOUT_ALERT: 'LogOut',
  };

  return icons[type] || 'Bell';
}

/**
 * Gets color class for notification type (Tailwind)
 * 
 * @param type - NotificationType enum
 * @returns Color class
 */
export function getNotificationTypeColor(type: NotificationType): string {
  const colors: Record<NotificationType, string> = {
    BOOKING_REMINDER: 'text-blue-600',
    PAYMENT_REMINDER: 'text-amber-600',
    WAITLIST_ALERT: 'text-green-600',
    BROADCAST: 'text-purple-600',
    BOOKING_CONFIRMATION: 'text-green-600',
    CANCELLATION_NOTICE: 'text-red-600',
    INVOICE_READY: 'text-indigo-600',
    CHECKIN_ALERT: 'text-emerald-600',
    CHECKOUT_ALERT: 'text-teal-600',
  };

  return colors[type] || 'text-gray-600';
}

/**
 * Gets status color for notification status
 * 
 * @param status - NotificationStatus enum
 * @returns Color class
 */
export function getNotificationStatusColor(status: NotificationStatus): string {
  const colors: Record<NotificationStatus, string> = {
    PENDING: 'text-amber-600',
    SENT: 'text-green-600',
    DELIVERED: 'text-blue-600',
    FAILED: 'text-red-600',
    CANCELLED: 'text-gray-600',
  };

  return colors[status] || 'text-gray-600';
}

/**
 * Determines if a notification can be retried
 * 
 * @param status - Current status
 * @param retryCount - Number of retries attempted
 * @param maxRetries - Maximum retries allowed
 * @returns True if can retry
 */
export function canRetryNotification(
  status: NotificationStatus,
  retryCount: number,
  maxRetries: number = 3
): boolean {
  return status === 'FAILED' && retryCount < maxRetries;
}

/**
 * Calculates next retry time with exponential backoff
 * 
 * @param retryCount - Current retry attempt
 * @returns Next retry time
 */
export function calculateRetryTime(retryCount: number): Date {
  const baseDelayMinutes = 5;
  const delayMinutes = baseDelayMinutes * Math.pow(2, retryCount); // Exponential backoff
  return addHours(new Date(), delayMinutes / 60);
}

/**
 * Notification configuration constants
 */
export const NOTIFICATION_CONFIG = {
  MAX_RETRIES: 3,
  BOOKING_REMINDER_HOURS_BEFORE: 24,
  PAYMENT_REMINDER_DAYS_BEFORE: [3, 1, 0], // 3 days, 1 day, due date
  BATCH_SIZE: 50, // For cron job processing
  RATE_LIMIT_PER_MINUTE: 100, // API rate limiting
} as const;
