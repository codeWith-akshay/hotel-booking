// ==========================================
// BOOKING RULES VALIDATOR
// ==========================================
// Comprehensive validation for booking rules:
// - 3-2-1 booking rule (guest type based)
// - Group booking deposit requirements (10-19 rooms)
// - Special day restrictions (holidays/blackout days)

import { prisma } from '@/lib/prisma'
import { GuestType } from '@prisma/client'
import { differenceInDays, startOfDay, isSameDay } from 'date-fns'

// ==========================================
// TYPE DEFINITIONS
// ==========================================

export interface BookingValidationResult {
  isValid: boolean
  errors: string[]
  warnings: string[]
  requiresDeposit?: boolean
  depositAmount?: number
}

export interface BookingRulesCheck {
  isWithinAdvanceWindow: boolean
  hasMinimumNotice: boolean
  maxDaysAdvance: number
  minDaysNotice: number
  daysInAdvance: number
}

export interface GroupBookingCheck {
  isGroupBooking: boolean
  requiresDeposit: boolean
  depositAmount: number
  depositPercentage: number
}

export interface SpecialDayCheck {
  hasBlockedDays: boolean
  blockedDates: Date[]
  specialRateDays: Date[]
  adjustedPrice?: number
}

// ==========================================
// CONSTANTS
// ==========================================

// Group booking thresholds
const GROUP_BOOKING_MIN_ROOMS = 10
const GROUP_BOOKING_MAX_ROOMS = 19
const GROUP_BOOKING_DEPOSIT_PERCENTAGE = 0.30 // 30% deposit

// Default booking rules (fallback if not in database)
const DEFAULT_BOOKING_RULES = {
  [GuestType.REGULAR]: { maxDaysAdvance: 90, minDaysNotice: 3 },
  [GuestType.VIP]: { maxDaysAdvance: 365, minDaysNotice: 2 },
  [GuestType.CORPORATE]: { maxDaysAdvance: 180, minDaysNotice: 1 },
}

// ==========================================
// MAIN VALIDATION FUNCTION
// ==========================================

/**
 * Validate all booking rules before creating a booking
 * 
 * @param userId - User ID making the booking
 * @param roomTypeId - Room type being booked
 * @param startDate - Check-in date
 * @param endDate - Check-out date
 * @param roomsBooked - Number of rooms (default 1)
 * @returns Comprehensive validation result
 */
export async function validateBookingRules(
  userId: string,
  roomTypeId: string,
  startDate: Date,
  endDate: Date,
  roomsBooked: number = 1
): Promise<BookingValidationResult> {
  const errors: string[] = []
  const warnings: string[] = []
  let requiresDeposit = false
  let depositAmount = 0

  try {
    // ==========================================
    // 1. VALIDATE DATES
    // ==========================================
    const dateValidation = validateDates(startDate, endDate)
    if (!dateValidation.isValid) {
      errors.push(...dateValidation.errors)
      return { isValid: false, errors, warnings }
    }

    // ==========================================
    // 2. GET USER'S GUEST TYPE
    // ==========================================
    const guestType = await getUserGuestType(userId)

    // ==========================================
    // 3. VALIDATE 3-2-1 BOOKING RULE
    // ==========================================
    const rulesCheck = await validate321Rule(guestType, startDate)
    if (!rulesCheck.isWithinAdvanceWindow) {
      errors.push(
        `Booking too far in advance. ${guestType} guests can book up to ${rulesCheck.maxDaysAdvance} days ahead. ` +
        `You are trying to book ${rulesCheck.daysInAdvance} days in advance.`
      )
    }
    if (!rulesCheck.hasMinimumNotice) {
      errors.push(
        `Insufficient notice period. ${guestType} guests require at least ${rulesCheck.minDaysNotice} day(s) advance notice for bookings.`
      )
    }

    // ==========================================
    // 4. VALIDATE GROUP BOOKING REQUIREMENTS
    // ==========================================
    const groupCheck = await validateGroupBooking(roomTypeId, startDate, endDate, roomsBooked)
    if (groupCheck.isGroupBooking) {
      if (groupCheck.requiresDeposit) {
        requiresDeposit = true
        depositAmount = groupCheck.depositAmount
        warnings.push(
          `This is a group booking (${roomsBooked} rooms). A ${groupCheck.depositPercentage * 100}% deposit of $${(depositAmount / 100).toFixed(2)} is required before confirmation.`
        )
      }
    }

    // ==========================================
    // 5. VALIDATE SPECIAL DAY RESTRICTIONS
    // ==========================================
    const specialDayCheck = await validateSpecialDays(roomTypeId, startDate, endDate)
    if (specialDayCheck.hasBlockedDays) {
      const blockedDatesStr = specialDayCheck.blockedDates
        .map(date => date.toLocaleDateString())
        .join(', ')
      errors.push(
        `Bookings are not allowed on the following date(s): ${blockedDatesStr}. ` +
        `These are special days (holidays/maintenance/blackout periods).`
      )
    }

    if (specialDayCheck.specialRateDays.length > 0) {
      const specialRateDatesStr = specialDayCheck.specialRateDays
        .map(date => date.toLocaleDateString())
        .join(', ')
      warnings.push(
        `Special rates apply on: ${specialRateDatesStr}. Final price may differ from standard rates.`
      )
    }

    // ==========================================
    // 6. RETURN VALIDATION RESULT
    // ==========================================
    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      requiresDeposit,
      depositAmount,
    }
  } catch (error) {
    console.error('[validateBookingRules] Error:', error)
    return {
      isValid: false,
      errors: ['An error occurred while validating booking rules. Please try again.'],
      warnings,
    }
  }
}

// ==========================================
// HELPER FUNCTIONS
// ==========================================

/**
 * Validate basic date logic
 */
function validateDates(startDate: Date, endDate: Date): { isValid: boolean; errors: string[] } {
  const errors: string[] = []
  const now = startOfDay(new Date())
  const start = startOfDay(startDate)
  const end = startOfDay(endDate)

  if (start < now) {
    errors.push('Check-in date cannot be in the past.')
  }

  if (end <= start) {
    errors.push('Check-out date must be after check-in date.')
  }

  const nights = differenceInDays(end, start)
  if (nights < 1) {
    errors.push('Booking must be for at least 1 night.')
  }

  if (nights > 365) {
    errors.push('Booking cannot exceed 365 nights.')
  }

  return { isValid: errors.length === 0, errors }
}

/**
 * Get user's guest type based on role and membership
 */
async function getUserGuestType(userId: string): Promise<GuestType> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      role: true,
    },
  })

  if (!user) {
    return GuestType.REGULAR
  }

  // Admins and SuperAdmins are VIP
  if (user.role.name === 'ADMIN' || user.role.name === 'SUPERADMIN') {
    return GuestType.VIP
  }

  // Users with IRCA membership are corporate
  if (user.ircaMembershipId) {
    return GuestType.CORPORATE
  }

  return GuestType.REGULAR
}

/**
 * Validate 3-2-1 booking rule based on guest type
 * 
 * The "3-2-1 rule":
 * - REGULAR: 3 days advance notice, 90 days max advance
 * - VIP: 2 days advance notice, 365 days max advance
 * - CORPORATE: 1 day advance notice, 180 days max advance
 */
async function validate321Rule(
  guestType: GuestType,
  startDate: Date
): Promise<BookingRulesCheck> {
  // Fetch rules from database
  const rules = await prisma.bookingRules.findUnique({
    where: { guestType },
  })

  // Use database rules or fallback to defaults
  const maxDaysAdvance = rules?.maxDaysAdvance ?? DEFAULT_BOOKING_RULES[guestType].maxDaysAdvance
  const minDaysNotice = rules?.minDaysNotice ?? DEFAULT_BOOKING_RULES[guestType].minDaysNotice

  const now = startOfDay(new Date())
  const start = startOfDay(startDate)
  const daysInAdvance = differenceInDays(start, now)

  return {
    isWithinAdvanceWindow: daysInAdvance <= maxDaysAdvance,
    hasMinimumNotice: daysInAdvance >= minDaysNotice,
    maxDaysAdvance,
    minDaysNotice,
    daysInAdvance,
  }
}

/**
 * Validate group booking requirements
 * 
 * Group bookings (10-19 rooms) require a 30% deposit before confirmation
 */
async function validateGroupBooking(
  roomTypeId: string,
  startDate: Date,
  endDate: Date,
  roomsBooked: number
): Promise<GroupBookingCheck> {
  const isGroupBooking = roomsBooked >= GROUP_BOOKING_MIN_ROOMS && roomsBooked <= GROUP_BOOKING_MAX_ROOMS

  if (!isGroupBooking) {
    return {
      isGroupBooking: false,
      requiresDeposit: false,
      depositAmount: 0,
      depositPercentage: 0,
    }
  }

  // Calculate total booking price
  const roomType = await prisma.roomType.findUnique({
    where: { id: roomTypeId },
    select: { pricePerNight: true },
  })

  if (!roomType) {
    return {
      isGroupBooking: true,
      requiresDeposit: false,
      depositAmount: 0,
      depositPercentage: 0,
    }
  }

  const nights = differenceInDays(startOfDay(endDate), startOfDay(startDate))
  const totalPrice = roomType.pricePerNight * nights * roomsBooked
  const depositAmount = Math.round(totalPrice * GROUP_BOOKING_DEPOSIT_PERCENTAGE)

  return {
    isGroupBooking: true,
    requiresDeposit: true,
    depositAmount,
    depositPercentage: GROUP_BOOKING_DEPOSIT_PERCENTAGE,
  }
}

/**
 * Validate special day restrictions
 * 
 * Checks for:
 * - Blocked days (no bookings allowed)
 * - Special rate days (custom pricing applies)
 */
async function validateSpecialDays(
  roomTypeId: string,
  startDate: Date,
  endDate: Date
): Promise<SpecialDayCheck> {
  // Get all special days that overlap with the booking period
  const specialDays = await prisma.specialDay.findMany({
    where: {
      active: true,
      date: {
        gte: startOfDay(startDate),
        lt: startOfDay(endDate),
      },
      OR: [
        { roomTypeId: roomTypeId },
        { roomTypeId: null }, // Applies to all room types
      ],
    },
  })

  const blockedDates: Date[] = []
  const specialRateDays: Date[] = []

  for (const specialDay of specialDays) {
    if (specialDay.ruleType === 'blocked') {
      blockedDates.push(specialDay.date)
    } else if (specialDay.ruleType === 'special_rate') {
      specialRateDays.push(specialDay.date)
    }
  }

  return {
    hasBlockedDays: blockedDates.length > 0,
    blockedDates,
    specialRateDays,
  }
}

// ==========================================
// UTILITY FUNCTIONS
// ==========================================

/**
 * Calculate deposit amount for a booking
 */
export function calculateDepositAmount(totalPrice: number): number {
  return Math.round(totalPrice * GROUP_BOOKING_DEPOSIT_PERCENTAGE)
}

/**
 * Check if booking requires deposit
 */
export function requiresDeposit(roomsBooked: number): boolean {
  return roomsBooked >= GROUP_BOOKING_MIN_ROOMS && roomsBooked <= GROUP_BOOKING_MAX_ROOMS
}

/**
 * Get booking rules for a guest type
 */
export async function getBookingRulesForGuestType(
  guestType: GuestType
): Promise<{ maxDaysAdvance: number; minDaysNotice: number }> {
  const rules = await prisma.bookingRules.findUnique({
    where: { guestType },
  })

  return {
    maxDaysAdvance: rules?.maxDaysAdvance ?? DEFAULT_BOOKING_RULES[guestType].maxDaysAdvance,
    minDaysNotice: rules?.minDaysNotice ?? DEFAULT_BOOKING_RULES[guestType].minDaysNotice,
  }
}

/**
 * Check if a specific date is blocked
 */
export async function isDateBlocked(
  date: Date,
  roomTypeId?: string
): Promise<boolean> {
  const specialDay = await prisma.specialDay.findFirst({
    where: {
      active: true,
      ruleType: 'blocked',
      date: startOfDay(date),
      OR: [
        { roomTypeId: roomTypeId },
        { roomTypeId: null },
      ],
    },
  })

  return specialDay !== null
}
