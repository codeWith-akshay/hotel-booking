/**
 * Admin Booking Management Validation (Day 15)
 * 
 * Zod validation schemas for admin dashboard operations:
 * - Fetching bookings with filters
 * - Marking offline payments
 * - Overriding booking status
 * - Audit logging
 */

import { z } from 'zod'
import { BookingStatus, PaymentStatus } from '@prisma/client'

// ==========================================
// FETCH BOOKINGS SCHEMAS
// ==========================================

/**
 * Filter schema for booking search
 */
export const BookingFiltersSchema = z.object({
  // Date range filters
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  
  // Member search (name, phone, or email)
  memberSearch: z.string().trim().min(1).max(100).optional(),
  
  // Booking status filter
  status: z.nativeEnum(BookingStatus).optional(),
  
  // Payment status filter
  paymentStatus: z.enum(['PAID', 'PENDING', 'PARTIAL', 'OFFLINE']).optional(),
  
  // Room type filter
  roomTypeId: z.string().cuid().optional(),
  
  // Pagination
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(20),
  
  // Sorting
  sortBy: z.enum(['createdAt', 'startDate', 'endDate', 'totalPrice', 'status']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
})

export type BookingFilters = z.infer<typeof BookingFiltersSchema>

/**
 * Request schema for fetching admin bookings
 */
export const FetchAdminBookingsRequestSchema = z.object({
  filters: BookingFiltersSchema,
  includeUser: z.boolean().default(true),
  includeRoomType: z.boolean().default(true),
  includePayments: z.boolean().default(true),
})

export type FetchAdminBookingsRequest = z.infer<typeof FetchAdminBookingsRequestSchema>

// ==========================================
// OFFLINE PAYMENT SCHEMAS
// ==========================================

/**
 * Payment method for offline payments
 */
export const OfflinePaymentMethodSchema = z.enum([
  'CASH',
  'BANK_TRANSFER',
  'CHEQUE',
  'CARD_TERMINAL',
  'OTHER',
])

export type OfflinePaymentMethod = z.infer<typeof OfflinePaymentMethodSchema>

/**
 * Request schema for marking offline payment
 */
export const MarkOfflinePaymentRequestSchema = z.object({
  bookingId: z.string().cuid({
    message: 'Valid booking ID required',
  }),
  
  adminId: z.string().cuid({
    message: 'Valid admin ID required',
  }),
  
  amount: z.number().int().positive({
    message: 'Payment amount must be a positive integer (in cents)',
  }),
  
  method: OfflinePaymentMethodSchema,
  
  transactionReference: z.string().trim().min(1).max(200).optional(),
  
  notes: z.string().trim().max(500).optional(),
  
  receiptNumber: z.string().trim().max(100).optional(),
  
  // Optional: auto-confirm booking if full payment
  autoConfirm: z.boolean().default(true),
})

export type MarkOfflinePaymentRequest = z.infer<typeof MarkOfflinePaymentRequestSchema>

/**
 * Response schema for offline payment
 */
export const MarkOfflinePaymentResponseSchema = z.union([
  z.object({
    success: z.literal(true),
    message: z.string(),
    payment: z.object({
      id: z.string(),
      amount: z.number(),
      method: OfflinePaymentMethodSchema,
      status: z.nativeEnum(PaymentStatus),
      createdAt: z.date(),
    }),
    booking: z.object({
      id: z.string(),
      status: z.nativeEnum(BookingStatus),
      totalPrice: z.number(),
      paidAmount: z.number(),
    }),
    auditLog: z.object({
      id: z.string(),
      action: z.string(),
      createdAt: z.date(),
    }),
  }),
  z.object({
    success: z.literal(false),
    error: z.enum([
      'BOOKING_NOT_FOUND',
      'INVALID_AMOUNT',
      'ALREADY_PAID',
      'UNAUTHORIZED',
      'INTERNAL_ERROR',
    ]),
    message: z.string(),
  }),
])

export type MarkOfflinePaymentResponse = z.infer<typeof MarkOfflinePaymentResponseSchema>

// ==========================================
// BOOKING OVERRIDE SCHEMAS
// ==========================================

/**
 * Override action types
 */
export const OverrideActionSchema = z.enum([
  'FORCE_CONFIRM',   // Force confirm a provisional booking
  'FORCE_CANCEL',    // Force cancel any booking
  'MODIFY_DATES',    // Change booking dates
  'MODIFY_ROOMS',    // Change number of rooms
  'WAIVE_DEPOSIT',   // Waive deposit requirement
])

export type OverrideAction = z.infer<typeof OverrideActionSchema>

/**
 * Request schema for booking override
 */
export const OverrideBookingRequestSchema = z.object({
  bookingId: z.string().cuid({
    message: 'Valid booking ID required',
  }),
  
  adminId: z.string().cuid({
    message: 'Valid admin ID required',
  }),
  
  action: OverrideActionSchema,
  
  reason: z.string().trim().min(10, {
    message: 'Reason must be at least 10 characters',
  }).max(500, {
    message: 'Reason must not exceed 500 characters',
  }),
  
  // Optional new values for modifications
  newStatus: z.nativeEnum(BookingStatus).optional(),
  newStartDate: z.string().datetime().optional(),
  newEndDate: z.string().datetime().optional(),
  newRoomsBooked: z.number().int().min(1).max(50).optional(),
  
  // Optional: send notification to user
  notifyUser: z.boolean().default(true),
})

export type OverrideBookingRequest = z.infer<typeof OverrideBookingRequestSchema>

/**
 * Response schema for booking override
 */
export const OverrideBookingResponseSchema = z.union([
  z.object({
    success: z.literal(true),
    message: z.string(),
    booking: z.object({
      id: z.string(),
      status: z.nativeEnum(BookingStatus),
      startDate: z.date(),
      endDate: z.date(),
      roomsBooked: z.number(),
      totalPrice: z.number(),
    }),
    auditLog: z.object({
      id: z.string(),
      action: z.string(),
      reason: z.string(),
      createdAt: z.date(),
    }),
  }),
  z.object({
    success: z.literal(false),
    error: z.enum([
      'BOOKING_NOT_FOUND',
      'INVALID_ACTION',
      'INVALID_DATES',
      'NO_AVAILABILITY',
      'UNAUTHORIZED',
      'INTERNAL_ERROR',
    ]),
    message: z.string(),
  }),
])

export type OverrideBookingResponse = z.infer<typeof OverrideBookingResponseSchema>

// ==========================================
// INVOICE GENERATION SCHEMAS (response)
// ==========================================

/**
 * Response schema for invoice generation
 * (Request schema is defined in invoice.validation.ts to avoid duplicate exports)
 */
export const GenerateInvoiceResponseSchema = z.union([
  z.object({
    success: z.literal(true),
    message: z.string(),
    invoice: z.object({
      id: z.string(),
      invoiceNumber: z.string(),
      filePath: z.string(),
      downloadUrl: z.string(),
      generatedAt: z.date(),
    }),
  }),
  z.object({
    success: z.literal(false),
    error: z.enum([
      'BOOKING_NOT_FOUND',
      'PAYMENT_NOT_COMPLETE',
      'GENERATION_FAILED',
      'UNAUTHORIZED',
    ]),
    message: z.string(),
  }),
])

export type GenerateInvoiceResponse = z.infer<typeof GenerateInvoiceResponseSchema>

// ==========================================
// AUDIT LOG SCHEMAS
// ==========================================

/**
 * Audit log entry schema
 */
export const AuditLogEntrySchema = z.object({
  id: z.string(),
  bookingId: z.string(),
  adminId: z.string(),
  action: z.string(),
  reason: z.string().nullable(),
  metadata: z.record(z.string(), z.unknown()).nullable(),
  ipAddress: z.string().nullable(),
  createdAt: z.date(),
  
  // Relations
  admin: z.object({
    id: z.string(),
    name: z.string(),
    email: z.string().nullable(),
  }).optional(),
  
  booking: z.object({
    id: z.string(),
    userId: z.string(),
    status: z.nativeEnum(BookingStatus),
  }).optional(),
})

export type AuditLogEntry = z.infer<typeof AuditLogEntrySchema>

/**
 * Request schema for fetching audit logs
 */
export const FetchAuditLogsRequestSchema = z.object({
  bookingId: z.string().cuid().optional(),
  adminId: z.string().cuid().optional(),
  action: z.string().optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(50),
})

export type FetchAuditLogsRequest = z.infer<typeof FetchAuditLogsRequestSchema>

// ==========================================
// VALIDATION HELPERS
// ==========================================

/**
 * Validate booking can be modified
 */
export function validateBookingModification(
  currentStatus: BookingStatus,
  action: OverrideAction
): { allowed: boolean; message?: string } {
  // Cannot modify cancelled bookings
  if (currentStatus === 'CANCELLED') {
    return {
      allowed: false,
      message: 'Cannot modify cancelled bookings',
    }
  }
  
  // Force confirm only for provisional bookings
  if (action === 'FORCE_CONFIRM' && currentStatus === 'CONFIRMED') {
    return {
      allowed: false,
      message: 'Booking is already confirmed',
    }
  }
  
  return { allowed: true }
}

/**
 * Validate payment amount against booking total
 */
export function validatePaymentAmount(
  paymentAmount: number,
  totalPrice: number,
  paidAmount: number
): { valid: boolean; message?: string } {
  const remainingAmount = totalPrice - paidAmount
  
  if (paymentAmount <= 0) {
    return {
      valid: false,
      message: 'Payment amount must be positive',
    }
  }
  
  if (paymentAmount > remainingAmount) {
    return {
      valid: false,
      message: `Payment amount exceeds remaining balance ($${remainingAmount / 100})`,
    }
  }
  
  return { valid: true }
}

/**
 * Validate date range for modifications
 */
export function validateDateRange(
  startDate: Date,
  endDate: Date
): { valid: boolean; message?: string } {
  const now = new Date()
  
  if (startDate >= endDate) {
    return {
      valid: false,
      message: 'Check-in date must be before check-out date',
    }
  }
  
  if (startDate < now) {
    return {
      valid: false,
      message: 'Check-in date cannot be in the past',
    }
  }
  
  const maxDaysInAdvance = 365
  const maxDate = new Date()
  maxDate.setDate(maxDate.getDate() + maxDaysInAdvance)
  
  if (startDate > maxDate) {
    return {
      valid: false,
      message: `Bookings cannot be made more than ${maxDaysInAdvance} days in advance`,
    }
  }
  
  return { valid: true }
}

/**
 * Calculate total paid amount from payments
 */
export function calculateTotalPaid(
  payments: Array<{ amount: number; status: PaymentStatus }>
): number {
  return payments
    .filter(p => p.status === 'SUCCEEDED')
    .reduce((sum, p) => sum + p.amount, 0)
}

/**
 * Determine payment status based on amounts
 */
export function determinePaymentStatus(
  totalPrice: number,
  paidAmount: number
): 'PAID' | 'PARTIAL' | 'PENDING' {
  if (paidAmount >= totalPrice) return 'PAID'
  if (paidAmount > 0) return 'PARTIAL'
  return 'PENDING'
}

/**
 * Generate invoice number
 */
export function generateInvoiceNumber(bookingId: string): string {
  const date = new Date()
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const shortId = bookingId.slice(-8).toUpperCase()
  
  return `INV-${year}${month}-${shortId}`
}

/**
 * Validate admin has permission for action
 */
export function validateAdminPermission(
  adminRole: string,
  action: OverrideAction | 'OFFLINE_PAYMENT' | 'GENERATE_INVOICE'
): { allowed: boolean; message?: string } {
  const superAdminActions: Array<typeof action> = [
    'FORCE_CANCEL',
    'MODIFY_DATES',
    'MODIFY_ROOMS',
    'WAIVE_DEPOSIT',
  ]
  
  // SuperAdmin can do everything
  if (adminRole === 'SUPERADMIN') {
    return { allowed: true }
  }
  
  // Admin can do basic actions
  if (adminRole === 'ADMIN') {
    if (superAdminActions.includes(action as any)) {
      return {
        allowed: false,
        message: 'This action requires SuperAdmin role',
      }
    }
    return { allowed: true }
  }
  
  return {
    allowed: false,
    message: 'Insufficient permissions',
  }
}
