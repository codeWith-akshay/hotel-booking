// ==========================================
// BOOKING VALIDATION SCHEMAS
// ==========================================
// Zod schemas for booking-related operations
// Provides type-safe validation for booking creation, updates, and queries

import { z } from 'zod'
import { BookingStatus, GuestType } from '@prisma/client'

// ==========================================
// BASE SCHEMAS
// ==========================================

/**
 * Schema for booking input validation
 * Used for creating provisional bookings
 */
export const BookingInputSchema = z.object({
  userId: z.string().cuid('Invalid user ID format'),
  roomTypeId: z.string().cuid('Invalid room type ID format'),
  startDate: z.date(),
  endDate: z.date(),
}).refine(
  (data) => data.endDate > data.startDate,
  {
    message: 'End date must be after start date',
    path: ['endDate'],
  }
).refine(
  (data) => {
    const diffTime = data.endDate.getTime() - data.startDate.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays <= 30; // Maximum 30 nights per booking
  },
  {
    message: 'Booking cannot exceed 30 nights',
    path: ['endDate'],
  }
);

/**
 * Schema for booking confirmation
 */
export const ConfirmBookingSchema = z.object({
  bookingId: z.string().cuid('Invalid booking ID format'),
  userId: z.string().cuid('Invalid user ID format'),
});

/**
 * Schema for booking cancellation
 */
export const CancelBookingSchema = z.object({
  bookingId: z.string().cuid('Invalid booking ID format'),
  userId: z.string().cuid('Invalid user ID format'),
  reason: z.string().optional(),
});

/**
 * Schema for booking status update (admin only)
 */
export const UpdateBookingStatusSchema = z.object({
  bookingId: z.string().cuid('Invalid booking ID format'),
  status: z.nativeEnum(BookingStatus),
  adminUserId: z.string().cuid('Invalid admin user ID format'),
});

/**
 * Schema for getting user bookings
 */
export const GetUserBookingsSchema = z.object({
  userId: z.string().cuid('Invalid user ID format'),
  status: z.nativeEnum(BookingStatus).optional(),
  page: z.number().int().min(1).default(1),
  pageSize: z.number().int().min(1).max(100).default(10),
});

/**
 * Schema for getting bookings by date range (admin)
 */
export const GetBookingsByDateRangeSchema = z.object({
  startDate: z.date(),
  endDate: z.date(),
  roomTypeId: z.string().cuid('Invalid room type ID format').optional(),
  status: z.nativeEnum(BookingStatus).optional(),
  page: z.number().int().min(1).default(1),
  pageSize: z.number().int().min(1).max(100).default(10),
}).refine(
  (data) => data.endDate >= data.startDate,
  {
    message: 'End date must be on or after start date',
    path: ['endDate'],
  }
);

/**
 * Schema for checking room availability
 */
export const CheckAvailabilitySchema = z.object({
  roomTypeId: z.string().cuid('Invalid room type ID format'),
  startDate: z.date(),
  endDate: z.date(),
}).refine(
  (data) => data.endDate > data.startDate,
  {
    message: 'End date must be after start date',
    path: ['endDate'],
  }
);

// ==========================================
// BOOKING RULES SCHEMAS
// ==========================================

/**
 * Schema for creating booking rules
 */
export const CreateBookingRulesSchema = z.object({
  guestType: z.nativeEnum(GuestType),
  maxDaysAdvance: z.number().int().min(1).max(365),
  minDaysNotice: z.number().int().min(0).max(30),
}).refine(
  (data) => data.maxDaysAdvance > data.minDaysNotice,
  {
    message: 'Maximum advance days must be greater than minimum notice days',
    path: ['maxDaysAdvance'],
  }
);

/**
 * Schema for updating booking rules
 */
export const UpdateBookingRulesSchema = z.object({
  id: z.string().cuid('Invalid booking rules ID format'),
  guestType: z.nativeEnum(GuestType).optional(),
  maxDaysAdvance: z.number().int().min(1).max(365).optional(),
  minDaysNotice: z.number().int().min(0).max(30).optional(),
});

/**
 * Schema for getting booking rules
 */
export const GetBookingRulesSchema = z.object({
  guestType: z.nativeEnum(GuestType).optional(),
});

// ==========================================
// TYPE EXPORTS
// ==========================================

export type BookingInput = z.infer<typeof BookingInputSchema>
export type ConfirmBookingInput = z.infer<typeof ConfirmBookingSchema>
export type CancelBookingInput = z.infer<typeof CancelBookingSchema>
export type UpdateBookingStatusInput = z.infer<typeof UpdateBookingStatusSchema>
export type GetUserBookingsInput = z.infer<typeof GetUserBookingsSchema>
export type GetBookingsByDateRangeInput = z.infer<typeof GetBookingsByDateRangeSchema>
export type CheckAvailabilityInput = z.infer<typeof CheckAvailabilitySchema>
export type CreateBookingRulesInput = z.infer<typeof CreateBookingRulesSchema>
export type UpdateBookingRulesInput = z.infer<typeof UpdateBookingRulesSchema>
export type GetBookingRulesInput = z.infer<typeof GetBookingRulesSchema>

// ==========================================
// VALIDATION HELPERS
// ==========================================

/**
 * Validates booking date constraints based on guest type rules
 */
export const validateBookingDates = (
  startDate: Date,
  endDate: Date,
  maxDaysAdvance: number,
  minDaysNotice: number
) => {
  const now = new Date();
  const timeDiffStart = startDate.getTime() - now.getTime();
  const timeDiffEnd = endDate.getTime() - now.getTime();
  
  const daysFromNowStart = Math.ceil(timeDiffStart / (1000 * 60 * 60 * 24));
  const daysFromNowEnd = Math.ceil(timeDiffEnd / (1000 * 60 * 60 * 24));
  
  // Check minimum notice
  if (daysFromNowStart < minDaysNotice) {
    return {
      valid: false,
      error: `Booking requires at least ${minDaysNotice} day(s) advance notice`,
    };
  }
  
  // Check maximum advance booking
  if (daysFromNowStart > maxDaysAdvance) {
    return {
      valid: false,
      error: `Cannot book more than ${maxDaysAdvance} days in advance`,
    };
  }
  
  if (daysFromNowEnd > maxDaysAdvance) {
    return {
      valid: false,
      error: `Cannot book more than ${maxDaysAdvance} days in advance`,
    };
  }
  
  return { valid: true };
};

/**
 * Calculates total price for a booking
 */
export const calculateBookingPrice = (
  startDate: Date,
  endDate: Date,
  pricePerNight: number
): number => {
  const timeDiff = endDate.getTime() - startDate.getTime();
  const nights = Math.ceil(timeDiff / (1000 * 60 * 60 * 24));
  return nights * pricePerNight;
};