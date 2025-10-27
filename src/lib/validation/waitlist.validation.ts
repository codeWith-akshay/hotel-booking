// ==========================================
// WAITLIST VALIDATION SCHEMAS
// ==========================================
// Zod schemas for waitlist operations and validation

import { z } from 'zod'
import type { GuestType, WaitlistStatus } from '@prisma/client'

// ==========================================
// ENUMS
// ==========================================

export const WaitlistStatusSchema = z.enum([
  'PENDING',
  'NOTIFIED', 
  'CONVERTED',
  'EXPIRED'
] as const)

export const GuestTypeSchema = z.enum([
  'REGULAR',
  'VIP',
  'CORPORATE'
] as const)

// ==========================================
// WAITLIST CREATION SCHEMAS
// ==========================================

/**
 * Schema for joining the waitlist
 */
export const JoinWaitlistSchema = z.object({
  roomTypeId: z.string().optional().nullable(),
  startDate: z.date({
    message: 'Check-in date is required',
  }),
  endDate: z.date({
    message: 'Check-out date is required',
  }),
  guests: z.number()
    .int('Number of guests must be a whole number')
    .min(1, 'At least 1 guest is required')
    .max(10, 'Maximum 10 guests allowed'),
  guestType: GuestTypeSchema.default('REGULAR'),
  deposit: z.number()
    .int('Deposit must be a whole number')
    .min(0, 'Deposit cannot be negative')
    .max(100000, 'Deposit amount too large') // $1000 max
    .default(0),
  notes: z.string()
    .max(500, 'Notes cannot exceed 500 characters')
    .optional()
    .nullable(),
}).refine(
  (data) => data.endDate > data.startDate,
  {
    message: 'Check-out date must be after check-in date',
    path: ['endDate'],
  }
).refine(
  (data) => {
    const daysDiff = Math.ceil((data.endDate.getTime() - data.startDate.getTime()) / (1000 * 60 * 60 * 24))
    return daysDiff <= 30
  },
  {
    message: 'Stay duration cannot exceed 30 days',
    path: ['endDate'],
  }
).refine(
  (data) => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    return data.startDate >= today
  },
  {
    message: 'Check-in date cannot be in the past',
    path: ['startDate'],
  }
)

/**
 * Input type for joining waitlist
 */
export type JoinWaitlistInput = z.infer<typeof JoinWaitlistSchema>

/**
 * Schema for joining waitlist from form data
 */
export const JoinWaitlistFormSchema = z.object({
  roomTypeId: z.string().optional(),
  startDate: z.string().refine(
    (date) => !isNaN(Date.parse(date)),
    'Invalid check-in date format'
  ),
  endDate: z.string().refine(
    (date) => !isNaN(Date.parse(date)),
    'Invalid check-out date format'
  ),
  guests: z.string().refine(
    (val) => !isNaN(parseInt(val)) && parseInt(val) > 0,
    'Number of guests must be a positive number'
  ),
  guestType: GuestTypeSchema.default('REGULAR'),
  deposit: z.string().refine(
    (val) => !isNaN(parseFloat(val)) && parseFloat(val) >= 0,
    'Deposit must be a valid positive number'
  ).default('0'),
  notes: z.string().max(500, 'Notes cannot exceed 500 characters').optional(),
}).transform((data) => ({
  roomTypeId: data.roomTypeId || null,
  startDate: new Date(data.startDate),
  endDate: new Date(data.endDate),
  guests: parseInt(data.guests),
  guestType: data.guestType,
  deposit: Math.round(parseFloat(data.deposit) * 100), // Convert to cents
  notes: data.notes || null,
}))

/**
 * Form input type for joining waitlist
 */
export type JoinWaitlistFormInput = z.input<typeof JoinWaitlistFormSchema>

// ==========================================
// WAITLIST UPDATE SCHEMAS
// ==========================================

/**
 * Schema for updating waitlist status (admin only)
 */
export const UpdateWaitlistStatusSchema = z.object({
  id: z.string().cuid('Invalid waitlist ID'),
  status: WaitlistStatusSchema,
  notes: z.string().max(1000, 'Notes cannot exceed 1000 characters').optional(),
})

/**
 * Input type for updating waitlist status
 */
export type UpdateWaitlistStatusInput = z.infer<typeof UpdateWaitlistStatusSchema>

/**
 * Schema for notifying waitlist users
 */
export const NotifyWaitlistSchema = z.object({
  id: z.string().cuid('Invalid waitlist ID'),
  message: z.string()
    .min(10, 'Notification message must be at least 10 characters')
    .max(500, 'Notification message cannot exceed 500 characters'),
  expiresInHours: z.number()
    .int('Expiration hours must be a whole number')
    .min(1, 'Expiration must be at least 1 hour')
    .max(168, 'Expiration cannot exceed 7 days (168 hours)')
    .default(24),
})

/**
 * Input type for notifying waitlist users
 */
export type NotifyWaitlistInput = z.infer<typeof NotifyWaitlistSchema>

// ==========================================
// WAITLIST QUERY SCHEMAS
// ==========================================

/**
 * Schema for getting user's waitlist entries
 */
export const GetUserWaitlistSchema = z.object({
  userId: z.string().cuid('Invalid user ID').optional(),
  status: WaitlistStatusSchema.optional(),
  includeExpired: z.boolean().default(false),
})

/**
 * Input type for getting user waitlist
 */
export type GetUserWaitlistInput = z.infer<typeof GetUserWaitlistSchema>

/**
 * Schema for admin waitlist queries
 */
export const GetWaitlistEntriesSchema = z.object({
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(20),
  status: WaitlistStatusSchema.optional(),
  roomTypeId: z.string().cuid().optional(),
  startDate: z.date().optional(),
  endDate: z.date().optional(),
  sortBy: z.enum(['createdAt', 'startDate', 'status', 'guests']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
})

/**
 * Input type for admin waitlist queries
 */
export type GetWaitlistEntriesInput = z.infer<typeof GetWaitlistEntriesSchema>

// ==========================================
// WAITLIST AVAILABILITY SCHEMAS
// ==========================================

/**
 * Schema for checking room availability for waitlist
 */
export const CheckWaitlistAvailabilitySchema = z.object({
  startDate: z.date(),
  endDate: z.date(),
  guests: z.number().int().min(1).max(10),
  roomTypeId: z.string().cuid().optional(),
}).refine(
  (data) => data.endDate > data.startDate,
  {
    message: 'Check-out date must be after check-in date',
    path: ['endDate'],
  }
)

/**
 * Input type for checking waitlist availability
 */
export type CheckWaitlistAvailabilityInput = z.infer<typeof CheckWaitlistAvailabilitySchema>

// ==========================================
// RESPONSE SCHEMAS
// ==========================================

/**
 * Schema for waitlist entry response
 */
export const WaitlistEntrySchema = z.object({
  id: z.string(),
  userId: z.string(),
  roomTypeId: z.string().nullable(),
  startDate: z.date(),
  endDate: z.date(),
  guests: z.number(),
  guestType: GuestTypeSchema,
  deposit: z.number(),
  status: WaitlistStatusSchema,
  notes: z.string().nullable(),
  notifiedAt: z.date().nullable(),
  expiresAt: z.date().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
})

/**
 * Schema for waitlist entry with user and room type data
 */
export const WaitlistEntryWithDetailsSchema = WaitlistEntrySchema.extend({
  user: z.object({
    id: z.string(),
    name: z.string(),
    phone: z.string(),
    email: z.string().nullable(),
  }),
  roomType: z.object({
    id: z.string(),
    name: z.string(),
    description: z.string(),
    pricePerNight: z.number(),
  }).nullable(),
})

/**
 * Schema for waitlist statistics
 */
export const WaitlistStatsSchema = z.object({
  total: z.number(),
  pending: z.number(),
  notified: z.number(),
  converted: z.number(),
  expired: z.number(),
  avgWaitTime: z.number(), // in days
  conversionRate: z.number(), // percentage
})

/**
 * Type definitions for exports
 */
export type WaitlistEntry = z.infer<typeof WaitlistEntrySchema>
export type WaitlistEntryWithDetails = z.infer<typeof WaitlistEntryWithDetailsSchema>
export type WaitlistStats = z.infer<typeof WaitlistStatsSchema>

// ==========================================
// VALIDATION HELPERS
// ==========================================

/**
 * Validate if a date is within booking rules for guest type
 */
export const validateBookingWindow = (
  startDate: Date,
  guestType: GuestType,
  bookingRules: { maxDaysAdvance: number; minDaysNotice: number }
) => {
  const now = new Date()
  const daysDiff = Math.ceil((startDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
  
  if (daysDiff < bookingRules.minDaysNotice) {
    throw new Error(`${guestType} guests require at least ${bookingRules.minDaysNotice} days advance notice`)
  }
  
  if (daysDiff > bookingRules.maxDaysAdvance) {
    throw new Error(`${guestType} guests can only book up to ${bookingRules.maxDaysAdvance} days in advance`)
  }
  
  return true
}

/**
 * Calculate waitlist expiration date
 */
export const calculateWaitlistExpiration = (notifiedAt: Date, hoursToExpire: number = 24): Date => {
  const expiresAt = new Date(notifiedAt)
  expiresAt.setHours(expiresAt.getHours() + hoursToExpire)
  return expiresAt
}

/**
 * Check if waitlist entry is expired
 */
export const isWaitlistExpired = (expiresAt: Date | null): boolean => {
  if (!expiresAt) return false
  return new Date() > expiresAt
}