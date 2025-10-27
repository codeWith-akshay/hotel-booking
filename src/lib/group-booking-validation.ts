// ==========================================
// GROUP BOOKING VALIDATION (DAY 12)
// ==========================================
// Validation logic for group bookings with deposit requirements and special day rules

'use server'

import { checkBlockedDates } from '@/actions/special-days'
import { calculateDepositAmount } from '@/actions/deposit-policies'
import { calculatePriceWithSpecialDays } from '@/lib/pricing'
import { prisma } from '@/lib/prisma'
import { eachDayOfInterval } from 'date-fns'

// ==========================================
// TYPES
// ==========================================

interface ValidationResult {
  success: boolean
  error?: string
  data?: {
    isGroupBooking: boolean
    requiresDeposit: boolean
    depositAmount?: number
    depositPolicy?: unknown
    totalPrice: number
    priceCalculation?: unknown
    blockedDates?: unknown[]
  }
}

interface BookingValidationInput {
  roomTypeId: string
  startDate: Date
  endDate: Date
  roomsBooked: number
  userId: string
}

// ==========================================
// VALIDATE GROUP BOOKING
// ==========================================

/**
 * Comprehensive validation for group bookings
 * Checks:
 * 1. Room type exists and has capacity
 * 2. Dates are valid (not blocked by special days)
 * 3. Sufficient inventory available
 * 4. Deposit requirements
 * 5. Price calculation with special day rates
 */
export async function validateGroupBooking(
  input: BookingValidationInput
): Promise<ValidationResult> {
  try {
    const { roomTypeId, startDate, endDate, roomsBooked, userId } = input

    // ==========================================
    // 1. VALIDATE DATES
    // ==========================================
    if (endDate <= startDate) {
      return {
        success: false,
        error: 'End date must be after start date',
      }
    }

    // Check if dates are in the past
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    if (startDate < today) {
      return {
        success: false,
        error: 'Cannot book dates in the past',
      }
    }

    // ==========================================
    // 2. VALIDATE ROOM TYPE
    // ==========================================
    const roomType = await prisma.roomType.findUnique({
      where: { id: roomTypeId },
      select: {
        id: true,
        name: true,
        totalRooms: true,
        pricePerNight: true,
      },
    })

    if (!roomType) {
      return {
        success: false,
        error: 'Room type not found',
      }
    }

    // Check if enough rooms exist
    if (roomsBooked > roomType.totalRooms) {
      return {
        success: false,
        error: `Only ${roomType.totalRooms} rooms available for ${roomType.name}`,
      }
    }

    // ==========================================
    // 3. CHECK BLOCKED DATES
    // ==========================================
    const blockedResult = await checkBlockedDates(startDate, endDate, roomTypeId)

    if (!blockedResult.success && blockedResult.data) {
      return {
        success: false,
        error: blockedResult.error || 'One or more dates are blocked',
        data: {
          isGroupBooking: roomsBooked >= 10,
          requiresDeposit: false,
          totalPrice: 0,
          blockedDates: [blockedResult.data],
        },
      }
    }

    // ==========================================
    // 4. CHECK INVENTORY AVAILABILITY
    // ==========================================
    const nights = eachDayOfInterval({ start: startDate, end: new Date(endDate.getTime() - 1) })

    for (const night of nights) {
      const inventory = await prisma.roomInventory.findUnique({
        where: {
          roomTypeId_date: {
            roomTypeId,
            date: night,
          },
        },
      })

      const availableRooms = inventory?.availableRooms ?? roomType.totalRooms

      if (availableRooms < roomsBooked) {
        return {
          success: false,
          error: `Insufficient rooms available on ${night.toLocaleDateString()}. Available: ${availableRooms}, Requested: ${roomsBooked}`,
        }
      }
    }

    // ==========================================
    // 5. CALCULATE PRICE WITH SPECIAL DAYS
    // ==========================================
    const priceCalculation = await calculatePriceWithSpecialDays(
      roomTypeId,
      startDate,
      endDate,
      roomsBooked
    )

    if (!priceCalculation.success) {
      return {
        success: false,
        error: priceCalculation.error || 'Failed to calculate price',
      }
    }

    // ==========================================
    // 6. CHECK DEPOSIT REQUIREMENTS
    // ==========================================
    const isGroupBooking = roomsBooked >= 10

    let requiresDeposit = false
    let depositAmount = 0
    let depositPolicy = undefined

    if (isGroupBooking) {
      const depositResult = await calculateDepositAmount(roomsBooked, priceCalculation.totalPrice)

      if (depositResult.success && depositResult.data) {
        const depositData = depositResult.data as {
          required: boolean
          amount: number
          policy?: unknown
        }

        requiresDeposit = depositData.required
        depositAmount = depositData.amount
        depositPolicy = depositData.policy
      }
    }

    // ==========================================
    // 7. RETURN VALIDATION RESULT
    // ==========================================
    const responseData: {
      isGroupBooking: boolean
      requiresDeposit: boolean
      depositAmount?: number
      depositPolicy?: unknown
      totalPrice: number
      priceCalculation?: unknown
    } = {
      isGroupBooking,
      requiresDeposit,
      totalPrice: priceCalculation.totalPrice,
      priceCalculation,
    }

    if (requiresDeposit) {
      responseData.depositAmount = depositAmount
      responseData.depositPolicy = depositPolicy
    }

    return {
      success: true,
      data: responseData,
    }
  } catch (error) {
    console.error('Error validating group booking:', error)

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Validation failed',
    }
  }
}

// ==========================================
// CHECK INVENTORY FOR GROUP BOOKING
// ==========================================

/**
 * Quick check if enough rooms are available for a group booking
 * Does not perform full validation
 */
export async function checkGroupBookingAvailability(
  roomTypeId: string,
  startDate: Date,
  endDate: Date,
  roomsBooked: number
): Promise<{ available: boolean; unavailableDates: Date[] }> {
  try {
    const roomType = await prisma.roomType.findUnique({
      where: { id: roomTypeId },
      select: { totalRooms: true },
    })

    if (!roomType || roomsBooked > roomType.totalRooms) {
      return {
        available: false,
        unavailableDates: [],
      }
    }

    const nights = eachDayOfInterval({ start: startDate, end: new Date(endDate.getTime() - 1) })
    const unavailableDates: Date[] = []

    for (const night of nights) {
      const inventory = await prisma.roomInventory.findUnique({
        where: {
          roomTypeId_date: {
            roomTypeId,
            date: night,
          },
        },
      })

      const availableRooms = inventory?.availableRooms ?? roomType.totalRooms

      if (availableRooms < roomsBooked) {
        unavailableDates.push(night)
      }
    }

    return {
      available: unavailableDates.length === 0,
      unavailableDates,
    }
  } catch (error) {
    console.error('Error checking group booking availability:', error)
    return {
      available: false,
      unavailableDates: [],
    }
  }
}

// ==========================================
// VALIDATE DEPOSIT PAYMENT
// ==========================================

/**
 * Validate that a deposit payment meets the requirements
 */
export async function validateDepositPayment(
  bookingId: string,
  paidAmount: number
): Promise<{ valid: boolean; error?: string }> {
  try {
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      select: {
        depositAmount: true,
        isDepositPaid: true,
        roomsBooked: true,
      },
    })

    if (!booking) {
      return {
        valid: false,
        error: 'Booking not found',
      }
    }

    if (!booking.depositAmount) {
      return {
        valid: false,
        error: 'No deposit required for this booking',
      }
    }

    if (booking.isDepositPaid) {
      return {
        valid: false,
        error: 'Deposit already paid',
      }
    }

    if (paidAmount < booking.depositAmount) {
      return {
        valid: false,
        error: `Insufficient deposit amount. Required: ${booking.depositAmount}, Paid: ${paidAmount}`,
      }
    }

    return {
      valid: true,
    }
  } catch (error) {
    console.error('Error validating deposit payment:', error)
    return {
      valid: false,
      error: 'Failed to validate deposit payment',
    }
  }
}

// ==========================================
// EXPORT TYPES
// ==========================================

export type { ValidationResult, BookingValidationInput }
