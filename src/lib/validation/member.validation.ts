/**
 * Member Dashboard Validation Schemas (Day 14)
 * 
 * Zod schemas for member dashboard operations including:
 * - Fetching bookings
 * - Canceling bookings
 * - Joining waitlist
 * - Filtering bookings
 */

import { z } from 'zod'
import { BookingStatus, PaymentStatus } from '@prisma/client'

// ==========================================
// REQUEST SCHEMAS
// ==========================================

/**
 * Fetch bookings request schema
 */
export const FetchBookingsRequestSchema = z.object({
  userId: z.string().min(1, 'User ID is required'),
  filter: z.enum(['all', 'upcoming', 'past', 'cancelled', 'waitlisted']).optional(),
  limit: z.number().int().positive().optional(),
  offset: z.number().int().nonnegative().optional(),
})

export type FetchBookingsRequest = z.infer<typeof FetchBookingsRequestSchema>

/**
 * Cancel booking request schema
 */
export const CancelBookingRequestSchema = z.object({
  bookingId: z.string().min(1, 'Booking ID is required'),
  userId: z.string().min(1, 'User ID is required'),
  reason: z.string().optional(),
})

export type CancelBookingRequest = z.infer<typeof CancelBookingRequestSchema>

/**
 * Join waitlist request schema
 */
export const JoinWaitlistRequestSchema = z.object({
  userId: z.string().min(1, 'User ID is required'),
  roomTypeId: z.string().min(1, 'Room type ID is required'),
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),
  guests: z.number().int().positive().default(1),
  notes: z.string().optional(),
})

export type JoinWaitlistRequest = z.infer<typeof JoinWaitlistRequestSchema>

/**
 * Download invoice request schema
 */
export const DownloadInvoiceRequestSchema = z.object({
  bookingId: z.string().min(1, 'Booking ID is required'),
  userId: z.string().min(1, 'User ID is required'),
})

export type DownloadInvoiceRequest = z.infer<typeof DownloadInvoiceRequestSchema>

// ==========================================
// RESPONSE SCHEMAS
// ==========================================

/**
 * Room type response schema
 */
export const RoomTypeResponseSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  pricePerNight: z.number(),
  totalRooms: z.number(),
})

export type RoomTypeResponse = z.infer<typeof RoomTypeResponseSchema>

/**
 * Payment response schema
 */
export const PaymentResponseSchema = z.object({
  id: z.string(),
  amount: z.number(),
  currency: z.string(),
  status: z.nativeEnum(PaymentStatus),
  provider: z.string(),
  invoicePath: z.string().nullable(),
  paidAt: z.coerce.date().nullable(),
  createdAt: z.coerce.date(),
})

export type PaymentResponse = z.infer<typeof PaymentResponseSchema>

/**
 * Booking response schema
 */
export const BookingResponseSchema = z.object({
  id: z.string(),
  userId: z.string(),
  roomTypeId: z.string(),
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),
  status: z.nativeEnum(BookingStatus),
  totalPrice: z.number(),
  roomsBooked: z.number(),
  depositAmount: z.number().nullable(),
  isDepositPaid: z.boolean(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
  roomType: RoomTypeResponseSchema,
  payments: z.array(PaymentResponseSchema),
})

export type BookingResponse = z.infer<typeof BookingResponseSchema>

/**
 * Fetch bookings success response
 */
export const FetchBookingsSuccessSchema = z.object({
  success: z.literal(true),
  bookings: z.array(BookingResponseSchema),
  total: z.number(),
  message: z.string().optional(),
})

export type FetchBookingsSuccess = z.infer<typeof FetchBookingsSuccessSchema>

/**
 * Cancel booking success response
 */
export const CancelBookingSuccessSchema = z.object({
  success: z.literal(true),
  booking: BookingResponseSchema,
  refundAmount: z.number().optional(),
  message: z.string(),
})

export type CancelBookingSuccess = z.infer<typeof CancelBookingSuccessSchema>

/**
 * Join waitlist success response
 */
export const JoinWaitlistSuccessSchema = z.object({
  success: z.literal(true),
  waitlistId: z.string(),
  position: z.number().optional(),
  message: z.string(),
})

export type JoinWaitlistSuccess = z.infer<typeof JoinWaitlistSuccessSchema>

/**
 * Error response schema
 */
export const ErrorResponseSchema = z.object({
  success: z.literal(false),
  error: z.string(),
  message: z.string(),
  details: z.record(z.string(), z.unknown()).optional(),
})

export type ErrorResponse = z.infer<typeof ErrorResponseSchema>

/**
 * Combined response types
 */
export const FetchBookingsResponseSchema = z.union([
  FetchBookingsSuccessSchema,
  ErrorResponseSchema,
])

export type FetchBookingsResponse = z.infer<typeof FetchBookingsResponseSchema>

export const CancelBookingResponseSchema = z.union([
  CancelBookingSuccessSchema,
  ErrorResponseSchema,
])

export type CancelBookingResponse = z.infer<typeof CancelBookingResponseSchema>

export const JoinWaitlistResponseSchema = z.union([
  JoinWaitlistSuccessSchema,
  ErrorResponseSchema,
])

export type JoinWaitlistResponse = z.infer<typeof JoinWaitlistResponseSchema>

// ==========================================
// VALIDATION HELPERS
// ==========================================

/**
 * Validate that user owns the booking
 */
export function validateBookingOwnership(
  booking: { userId: string },
  userId: string
): boolean {
  return booking.userId === userId
}

/**
 * Validate cancellation deadline
 */
export function validateCancellationDeadline(
  startDate: Date,
  hoursBeforeStart: number = 24
): { valid: boolean; message?: string } {
  const now = new Date()
  const deadline = new Date(startDate)
  deadline.setHours(deadline.getHours() - hoursBeforeStart)
  
  if (now > deadline) {
    return {
      valid: false,
      message: `Cancellation deadline has passed. You must cancel at least ${hoursBeforeStart} hours before check-in.`,
    }
  }
  
  if (now > startDate) {
    return {
      valid: false,
      message: 'Cannot cancel a booking that has already started.',
    }
  }
  
  return { valid: true }
}

/**
 * Validate that booking can be cancelled
 */
export function validateCancellation(booking: {
  status: BookingStatus
  startDate: Date
}): { valid: boolean; message?: string } {
  // Check if already cancelled
  if (booking.status === BookingStatus.CANCELLED) {
    return {
      valid: false,
      message: 'Booking is already cancelled.',
    }
  }
  
  // Check cancellation deadline
  return validateCancellationDeadline(booking.startDate)
}

/**
 * Calculate refund amount based on cancellation policy
 */
export function calculateRefund(
  totalPrice: number,
  startDate: Date,
  depositAmount: number | null
): number {
  const now = new Date()
  const hoursUntilStart = (startDate.getTime() - now.getTime()) / (1000 * 60 * 60)
  
  // More than 7 days: 100% refund
  if (hoursUntilStart > 168) {
    return totalPrice
  }
  
  // 3-7 days: 75% refund
  if (hoursUntilStart > 72) {
    return Math.floor(totalPrice * 0.75)
  }
  
  // 1-3 days: 50% refund
  if (hoursUntilStart > 24) {
    return Math.floor(totalPrice * 0.5)
  }
  
  // Less than 24 hours: deposit only (non-refundable)
  return 0
}
