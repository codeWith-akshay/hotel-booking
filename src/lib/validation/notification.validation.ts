/**
 * Day 19: Notification Validation Schemas
 * Zod schemas for notification CRUD operations with RBAC and scheduling validation
 */

import { z } from 'zod';
import { NotificationType, NotificationChannel, NotificationStatus } from '@prisma/client';

// ===========================
// Base Notification Schemas
// ===========================

export const notificationTypeSchema = z.nativeEnum(NotificationType, {
  message: 'Invalid notification type',
});

export const notificationChannelSchema = z.nativeEnum(NotificationChannel, {
  message: 'Invalid notification channel',
});

export const notificationStatusSchema = z.nativeEnum(NotificationStatus, {
  message: 'Invalid notification status',
});

// ===========================
// Create Notification Schema
// ===========================

export const createNotificationSchema = z.object({
  userId: z.string().cuid('Invalid user ID format'),
  bookingId: z.string().cuid('Invalid booking ID format').optional(),
  type: notificationTypeSchema,
  channel: notificationChannelSchema,
  message: z.string().min(1, 'Message is required').max(5000, 'Message too long (max 5000 characters)'),
  subject: z.string().min(1).max(200, 'Subject too long (max 200 characters)').optional(),
  scheduledAt: z.coerce
    .date()
    .refine((date) => date > new Date(), {
      message: 'Scheduled time must be in the future',
    })
    .optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

export type CreateNotificationInput = z.infer<typeof createNotificationSchema>;

// ===========================
// Send Notification Schema
// ===========================

export const sendNotificationSchema = z.object({
  notificationId: z.string().cuid('Invalid notification ID format'),
  requestUserId: z.string().cuid('Invalid user ID format'), // For RBAC checks
});

export type SendNotificationInput = z.infer<typeof sendNotificationSchema>;

// ===========================
// Schedule Notification Schema
// ===========================

export const scheduleNotificationSchema = z.object({
  userId: z.string().cuid('Invalid user ID format'),
  bookingId: z.string().cuid('Invalid booking ID format').optional(),
  type: notificationTypeSchema,
  channel: notificationChannelSchema,
  message: z.string().min(1, 'Message is required').max(5000, 'Message too long'),
  subject: z.string().min(1).max(200).optional(),
  scheduledAt: z.coerce.date().refine((date) => date > new Date(), {
    message: 'Scheduled time must be in the future',
  }),
  metadata: z.record(z.string(), z.unknown()).optional(),
  requestUserId: z.string().cuid('Invalid request user ID format'), // For RBAC
});

export type ScheduleNotificationInput = z.infer<typeof scheduleNotificationSchema>;

// ===========================
// List Notifications Schema
// ===========================

export const listNotificationsSchema = z.object({
  userId: z.string().cuid('Invalid user ID format').optional(), // If provided, filter by user
  requestUserId: z.string().cuid('Invalid request user ID format'), // For RBAC
  type: notificationTypeSchema.optional(),
  channel: notificationChannelSchema.optional(),
  status: notificationStatusSchema.optional(),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  sortBy: z.enum(['createdAt', 'scheduledAt', 'sentAt', 'type']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export type ListNotificationsInput = z.infer<typeof listNotificationsSchema>;

// ===========================
// Broadcast Notification Schema
// ===========================

export const broadcastNotificationSchema = z.object({
  adminId: z.string().cuid('Invalid admin ID format'), // Must be SuperAdmin
  recipientIds: z
    .array(z.string().cuid('Invalid recipient ID format'))
    .min(1, 'At least one recipient is required')
    .max(1000, 'Too many recipients (max 1000 per broadcast)')
    .optional(), // If not provided, send to all users
  channel: notificationChannelSchema,
  message: z.string().min(1, 'Message is required').max(5000, 'Message too long'),
  subject: z.string().min(1).max(200).optional(),
  scheduledAt: z.coerce
    .date()
    .refine((date) => date > new Date(), {
      message: 'Scheduled time must be in the future',
    })
    .optional(), // If not provided, send immediately
  filterByRole: z.enum(['SUPERADMIN', 'ADMIN', 'MEMBER']).optional(), // Target specific role
  metadata: z.record(z.string(), z.unknown()).optional(),
});

export type BroadcastNotificationInput = z.infer<typeof broadcastNotificationSchema>;

// ===========================
// Cancel Notification Schema
// ===========================

export const cancelNotificationSchema = z.object({
  notificationId: z.string().cuid('Invalid notification ID format'),
  requestUserId: z.string().cuid('Invalid user ID format'), // For RBAC
});

export type CancelNotificationInput = z.infer<typeof cancelNotificationSchema>;

// ===========================
// Retry Notification Schema
// ===========================

export const retryNotificationSchema = z.object({
  notificationId: z.string().cuid('Invalid notification ID format'),
  requestUserId: z.string().cuid('Invalid user ID format'), // For RBAC
});

export type RetryNotificationInput = z.infer<typeof retryNotificationSchema>;

// ===========================
// Mark Notification As Read Schema
// ===========================

export const markNotificationAsReadSchema = z.object({
  notificationId: z.string().cuid('Invalid notification ID format'),
  userId: z.string().cuid('Invalid user ID format'), // Must match notification.userId
});

export type MarkNotificationAsReadInput = z.infer<typeof markNotificationAsReadSchema>;

// ===========================
// Get Notification By ID Schema
// ===========================

export const getNotificationByIdSchema = z.object({
  notificationId: z.string().cuid('Invalid notification ID format'),
  requestUserId: z.string().cuid('Invalid user ID format'), // For RBAC
});

export type GetNotificationByIdInput = z.infer<typeof getNotificationByIdSchema>;

// ===========================
// Bulk Send Notifications Schema
// ===========================

export const bulkSendNotificationsSchema = z.object({
  notifications: z
    .array(createNotificationSchema)
    .min(1, 'At least one notification is required')
    .max(100, 'Too many notifications (max 100 per batch)'),
  requestUserId: z.string().cuid('Invalid user ID format'), // For RBAC
});

export type BulkSendNotificationsInput = z.infer<typeof bulkSendNotificationsSchema>;

// ===========================
// Notification Statistics Schema
// ===========================

export const notificationStatsSchema = z.object({
  requestUserId: z.string().cuid('Invalid user ID format'), // For RBAC (admin only)
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
  type: notificationTypeSchema.optional(),
  channel: notificationChannelSchema.optional(),
});

export type NotificationStatsInput = z.infer<typeof notificationStatsSchema>;

// ===========================
// Helper Functions
// ===========================

/**
 * Validate notification type
 */
export function validateNotificationType(type: string): boolean {
  return Object.values(NotificationType).includes(type as NotificationType);
}

/**
 * Validate notification channel
 */
export function validateNotificationChannel(channel: string): boolean {
  return Object.values(NotificationChannel).includes(channel as NotificationChannel);
}

/**
 * Validate schedule time (must be in future)
 */
export function validateScheduleTime(scheduledAt: Date): { valid: boolean; error?: string } {
  const now = new Date();
  if (scheduledAt <= now) {
    return {
      valid: false,
      error: 'Scheduled time must be in the future',
    };
  }

  // Don't allow scheduling more than 1 year in advance
  const oneYearFromNow = new Date();
  oneYearFromNow.setFullYear(oneYearFromNow.getFullYear() + 1);

  if (scheduledAt > oneYearFromNow) {
    return {
      valid: false,
      error: 'Cannot schedule more than 1 year in advance',
    };
  }

  return { valid: true };
}

/**
 * Validate date range
 */
export function validateDateRange(
  startDate?: Date,
  endDate?: Date
): { valid: boolean; error?: string } {
  if (!startDate || !endDate) {
    return { valid: true }; // Optional dates
  }

  if (startDate > endDate) {
    return {
      valid: false,
      error: 'Start date must be before end date',
    };
  }

  // Don't allow ranges longer than 1 year
  const oneYearInMs = 365 * 24 * 60 * 60 * 1000;
  if (endDate.getTime() - startDate.getTime() > oneYearInMs) {
    return {
      valid: false,
      error: 'Date range cannot exceed 1 year',
    };
  }

  return { valid: true };
}

/**
 * Format Zod validation errors for user-friendly display
 */
export function formatValidationError(error: z.ZodError): string[] {
  return error.issues.map((err: z.ZodIssue) => {
    const path = err.path.join('.');
    return path ? `${path}: ${err.message}` : err.message;
  });
}

/**
 * Validate notification message based on channel
 */
export function validateMessageForChannel(
  channel: NotificationChannel,
  message: string
): { valid: boolean; error?: string } {
  switch (channel) {
    case 'SMS':
      if (message.length > 160) {
        return {
          valid: false,
          error: 'SMS message must be 160 characters or less',
        };
      }
      break;
    case 'WHATSAPP':
      if (message.length > 4096) {
        return {
          valid: false,
          error: 'WhatsApp message must be 4096 characters or less',
        };
      }
      break;
    case 'EMAIL':
      if (message.length > 100000) {
        return {
          valid: false,
          error: 'Email message must be 100,000 characters or less',
        };
      }
      break;
    case 'IN_APP':
      if (message.length > 1000) {
        return {
          valid: false,
          error: 'In-app notification must be 1000 characters or less',
        };
      }
      break;
  }

  return { valid: true };
}

/**
 * Validate recipient count for broadcast
 */
export function validateRecipientCount(count: number): { valid: boolean; error?: string } {
  if (count < 1) {
    return {
      valid: false,
      error: 'At least one recipient is required',
    };
  }

  if (count > 1000) {
    return {
      valid: false,
      error: 'Too many recipients (max 1000 per broadcast)',
    };
  }

  return { valid: true };
}

/**
 * Safe parse with custom error handling
 */
export function safeParse<T extends z.ZodTypeAny>(
  schema: T,
  data: unknown
): { success: true; data: z.infer<T> } | { success: false; errors: string[] } {
  const result = schema.safeParse(data);

  if (result.success) {
    return { success: true, data: result.data };
  }

  return {
    success: false,
    errors: formatValidationError(result.error),
  };
}

// ===========================
// Export All Schemas
// ===========================

export const notificationSchemas = {
  create: createNotificationSchema,
  send: sendNotificationSchema,
  schedule: scheduleNotificationSchema,
  list: listNotificationsSchema,
  broadcast: broadcastNotificationSchema,
  cancel: cancelNotificationSchema,
  retry: retryNotificationSchema,
  markAsRead: markNotificationAsReadSchema,
  getById: getNotificationByIdSchema,
  bulkSend: bulkSendNotificationsSchema,
  stats: notificationStatsSchema,
};
