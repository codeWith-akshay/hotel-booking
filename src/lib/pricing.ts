// ==========================================
// PRICE CALCULATION WITH SPECIAL DAYS (DAY 12)
// ==========================================
// Utility functions for calculating booking prices with special day rates
// Handles multipliers, fixed rates, and blocked dates

import { prisma } from '@/lib/prisma'
import { getSpecialDaysForDateRange } from '@/actions/special-days'
import { eachDayOfInterval, isSameDay } from 'date-fns'

// ==========================================
// TYPES
// ==========================================

interface SpecialDayAdjustment {
  date: Date
  originalPrice: number
  adjustedPrice: number
  ruleType: string
  rateType: string | null
  rateValue: number | null
  description: string | null
}

interface PriceCalculationResult {
  success: boolean
  basePrice: number
  specialDayAdjustments: SpecialDayAdjustment[]
  totalPrice: number
  nights: number
  roomsBooked: number
  error?: string
}

// ==========================================
// GENERATE DATE RANGE
// ==========================================

/**
 * Generate array of dates between start and end (inclusive)
 */
function generateDateRange(startDate: Date, endDate: Date): Date[] {
  try {
    return eachDayOfInterval({ start: startDate, end: endDate })
  } catch (error) {
    console.error('Error generating date range:', error)
    return []
  }
}

// ==========================================
// CALCULATE PRICE WITH SPECIAL DAYS
// ==========================================

/**
 * Calculate booking price with special day rates applied
 * 
 * @param roomTypeId - Room type ID
 * @param startDate - Check-in date
 * @param endDate - Check-out date (exclusive - not charged)
 * @param roomsBooked - Number of rooms (default: 1)
 * @returns Price calculation result with breakdown
 */
export async function calculatePriceWithSpecialDays(
  roomTypeId: string,
  startDate: Date,
  endDate: Date,
  roomsBooked: number = 1
): Promise<PriceCalculationResult> {
  try {
    // Validate dates
    if (endDate <= startDate) {
      return {
        success: false,
        basePrice: 0,
        specialDayAdjustments: [],
        totalPrice: 0,
        nights: 0,
        roomsBooked,
        error: 'End date must be after start date',
      }
    }

    // Get room type with base price
    const roomType = await prisma.roomType.findUnique({
      where: { id: roomTypeId },
      select: {
        id: true,
        name: true,
        pricePerNight: true,
      },
    })

    if (!roomType) {
      return {
        success: false,
        basePrice: 0,
        specialDayAdjustments: [],
        totalPrice: 0,
        nights: 0,
        roomsBooked,
        error: 'Room type not found',
      }
    }

    // Get special days for this date range
    const specialDaysResult = await getSpecialDaysForDateRange(startDate, endDate, roomTypeId)

    if (!specialDaysResult.success) {
      return {
        success: false,
        basePrice: 0,
        specialDayAdjustments: [],
        totalPrice: 0,
        nights: 0,
        roomsBooked,
        error: specialDaysResult.error || 'Failed to fetch special days',
      }
    }

    const specialDays = (specialDaysResult.data || []) as Array<{
      id: string
      date: Date
      roomTypeId: string | null
      ruleType: string
      rateType: string | null
      rateValue: number | null
      description: string | null
      active: boolean
    }>

    // Generate all nights (check-out date is exclusive)
    const nights = generateDateRange(startDate, new Date(endDate.getTime() - 1))
    const numberOfNights = nights.length

    // Base price per night (in cents)
    const basePricePerNight = roomType.pricePerNight

    // Calculate price for each night
    let totalPrice = 0
    const adjustments: SpecialDayAdjustment[] = []

    for (const night of nights) {
      // Find special day rule for this date
      // Prioritize room-specific rules over global rules
      const applicableRule = specialDays.find((sd) => {
        const isSameDate = isSameDay(new Date(sd.date), night)
        return isSameDate && sd.ruleType === 'special_rate'
      })

      let nightPrice = basePricePerNight

      if (applicableRule && applicableRule.rateType && applicableRule.rateValue) {
        // Apply special rate
        if (applicableRule.rateType === 'multiplier') {
          nightPrice = Math.round(basePricePerNight * applicableRule.rateValue)
        } else if (applicableRule.rateType === 'fixed') {
          nightPrice = Math.round(applicableRule.rateValue)
        }

        // Record adjustment
        adjustments.push({
          date: night,
          originalPrice: basePricePerNight,
          adjustedPrice: nightPrice,
          ruleType: applicableRule.ruleType,
          rateType: applicableRule.rateType,
          rateValue: applicableRule.rateValue,
          description: applicableRule.description,
        })
      }

      totalPrice += nightPrice
    }

    // Multiply by number of rooms
    totalPrice = totalPrice * roomsBooked

    const basePrice = basePricePerNight * numberOfNights * roomsBooked

    return {
      success: true,
      basePrice,
      specialDayAdjustments: adjustments,
      totalPrice,
      nights: numberOfNights,
      roomsBooked,
    }
  } catch (error) {
    console.error('Error calculating price with special days:', error)

    return {
      success: false,
      basePrice: 0,
      specialDayAdjustments: [],
      totalPrice: 0,
      nights: 0,
      roomsBooked,
      error: error instanceof Error ? error.message : 'Failed to calculate price',
    }
  }
}

// ==========================================
// CALCULATE SIMPLE PRICE (NO SPECIAL DAYS)
// ==========================================

/**
 * Calculate basic booking price without special day adjustments
 * Used as fallback or for quick estimates
 */
export async function calculateSimplePrice(
  roomTypeId: string,
  startDate: Date,
  endDate: Date,
  roomsBooked: number = 1
): Promise<{ success: boolean; totalPrice: number; nights: number; error?: string }> {
  try {
    if (endDate <= startDate) {
      return {
        success: false,
        totalPrice: 0,
        nights: 0,
        error: 'End date must be after start date',
      }
    }

    const roomType = await prisma.roomType.findUnique({
      where: { id: roomTypeId },
      select: { pricePerNight: true },
    })

    if (!roomType) {
      return {
        success: false,
        totalPrice: 0,
        nights: 0,
        error: 'Room type not found',
      }
    }

    const nights = generateDateRange(startDate, new Date(endDate.getTime() - 1))
    const totalPrice = roomType.pricePerNight * nights.length * roomsBooked

    return {
      success: true,
      totalPrice,
      nights: nights.length,
    }
  } catch (error) {
    console.error('Error calculating simple price:', error)

    return {
      success: false,
      totalPrice: 0,
      nights: 0,
      error: 'Failed to calculate price',
    }
  }
}

// ==========================================
// GET PRICE BREAKDOWN
// ==========================================

/**
 * Get detailed price breakdown with special day information
 * Useful for displaying pricing details to users
 */
export async function getPriceBreakdown(
  roomTypeId: string,
  startDate: Date,
  endDate: Date,
  roomsBooked: number = 1
) {
  const calculation = await calculatePriceWithSpecialDays(
    roomTypeId,
    startDate,
    endDate,
    roomsBooked
  )

  if (!calculation.success) {
    return calculation
  }

  // Calculate savings or additional cost
  const difference = calculation.totalPrice - calculation.basePrice

  return {
    ...calculation,
    difference,
    percentageChange: calculation.basePrice > 0 ? (difference / calculation.basePrice) * 100 : 0,
    hasSpecialRates: calculation.specialDayAdjustments.length > 0,
  }
}

// ==========================================
// EXPORT TYPES
// ==========================================

export type { SpecialDayAdjustment, PriceCalculationResult }
