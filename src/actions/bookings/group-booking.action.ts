// ==========================================
// GROUP BOOKING SERVER ACTION (DAY 12)
// ==========================================
// Enhanced booking creation with group booking, deposits, and special day support

'use server'

import { prisma } from '@/lib/prisma'
import { validateGroupBooking } from '@/lib/group-booking-validation'
import { calculatePriceWithSpecialDays } from '@/lib/pricing'
import { revalidatePath } from 'next/cache'
import { eachDayOfInterval } from 'date-fns'

// ==========================================
// TYPES
// ==========================================

interface CreateGroupBookingInput {
  userId: string
  roomTypeId: string
  startDate: Date
  endDate: Date
  roomsBooked: number
  isDepositPaid?: boolean
}

interface CreateGroupBookingResult {
  success: boolean
  data?: {
    booking: {
      id: string
      userId: string
      roomTypeId: string
      startDate: Date
      endDate: Date
      roomsBooked: number
      status: string
      totalPrice: number
      depositAmount: number | null
      isDepositPaid: boolean
      createdAt: Date
    }
    requiresDeposit: boolean
    depositAmount?: number
  }
  error?: string
}

// ==========================================
// CREATE GROUP BOOKING
// ==========================================

/**
 * Create a booking with group booking and deposit support
 * 
 * Features:
 * - Validates room availability
 * - Checks for blocked dates
 * - Calculates price with special day rates
 * - Determines deposit requirements
 * - Creates booking with atomic transaction
 * - Updates inventory
 */
export async function createGroupBooking(
  input: CreateGroupBookingInput
): Promise<CreateGroupBookingResult> {
  try {
    const { userId, roomTypeId, startDate, endDate, roomsBooked, isDepositPaid = false } = input

    // ==========================================
    // 1. VALIDATE USER
    // ==========================================
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true },
    })

    if (!user) {
      return {
        success: false,
        error: 'User not found',
      }
    }

    // ==========================================
    // 2. VALIDATE BOOKING
    // ==========================================
    const validation = await validateGroupBooking({
      userId,
      roomTypeId,
      startDate,
      endDate,
      roomsBooked,
    })

    if (!validation.success) {
      return {
        success: false,
        error: validation.error || 'Booking validation failed',
      }
    }

    const {
      isGroupBooking,
      requiresDeposit,
      depositAmount,
      totalPrice,
    } = validation.data!

    // ==========================================
    // 3. CHECK DEPOSIT PAYMENT (if required)
    // ==========================================
    if (requiresDeposit && !isDepositPaid) {
      return {
        success: false,
        error: `This is a group booking requiring a deposit of ₹${(depositAmount! / 100).toFixed(2)}. Please complete deposit payment first.`,
      }
    }

    // ==========================================
    // 4. CREATE BOOKING WITH TRANSACTION
    // ==========================================
    const booking = await prisma.$transaction(async (tx) => {
      // Create booking
      const newBooking = await tx.booking.create({
        data: {
          userId,
          roomTypeId,
          startDate,
          endDate,
          roomsBooked,
          status: isDepositPaid || !requiresDeposit ? 'CONFIRMED' : 'PROVISIONAL',
          totalPrice,
          depositAmount: requiresDeposit && depositAmount ? depositAmount : null,
          isDepositPaid: requiresDeposit ? isDepositPaid : false,
        },
      })

      // Update inventory (decrement available rooms for each night)
      const nights = eachDayOfInterval({
        start: startDate,
        end: new Date(endDate.getTime() - 1),
      })

      for (const night of nights) {
        const inventory = await tx.roomInventory.findUnique({
          where: {
            roomTypeId_date: {
              roomTypeId,
              date: night,
            },
          },
        })

        if (inventory) {
          // Update existing inventory
          await tx.roomInventory.update({
            where: {
              roomTypeId_date: {
                roomTypeId,
                date: night,
              },
            },
            data: {
              availableRooms: {
                decrement: roomsBooked,
              },
            },
          })
        } else {
          // Create new inventory record
          const roomType = await tx.roomType.findUnique({
            where: { id: roomTypeId },
            select: { totalRooms: true },
          })

          if (roomType) {
            await tx.roomInventory.create({
              data: {
                roomTypeId,
                date: night,
                availableRooms: Math.max(0, roomType.totalRooms - roomsBooked),
              },
            })
          }
        }
      }

      return newBooking
    })

    // Revalidate relevant paths
    revalidatePath('/bookings')
    revalidatePath('/admin/bookings')
    revalidatePath(`/bookings/${booking.id}`)

    console.log(`✅ Group booking created: ${booking.id}`)
    console.log(`   User: ${user.name}`)
    console.log(`   Rooms: ${roomsBooked}`)
    console.log(`   Dates: ${startDate.toLocaleDateString()} - ${endDate.toLocaleDateString()}`)
    console.log(`   Total: ₹${(totalPrice / 100).toFixed(2)}`)
    if (requiresDeposit) {
      console.log(`   Deposit: ₹${(depositAmount! / 100).toFixed(2)} (Paid: ${isDepositPaid})`)
    }

    const responseData: CreateGroupBookingResult['data'] = {
      booking,
      requiresDeposit,
    }

    if (requiresDeposit && depositAmount) {
      responseData.depositAmount = depositAmount
    }

    return {
      success: true,
      data: responseData,
    }
  } catch (error) {
    console.error('Error creating group booking:', error)

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create booking',
    }
  }
}

// ==========================================
// UPDATE DEPOSIT PAYMENT STATUS
// ==========================================

/**
 * Mark deposit as paid for a booking
 * Used after successful payment processing
 */
export async function markDepositAsPaid(
  bookingId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      select: {
        id: true,
        depositAmount: true,
        isDepositPaid: true,
        status: true,
      },
    })

    if (!booking) {
      return {
        success: false,
        error: 'Booking not found',
      }
    }

    if (!booking.depositAmount) {
      return {
        success: false,
        error: 'No deposit required for this booking',
      }
    }

    if (booking.isDepositPaid) {
      return {
        success: false,
        error: 'Deposit already marked as paid',
      }
    }

    // Update booking status
    await prisma.booking.update({
      where: { id: bookingId },
      data: {
        isDepositPaid: true,
        status: 'CONFIRMED', // Upgrade to confirmed when deposit is paid
      },
    })

    revalidatePath('/bookings')
    revalidatePath('/admin/bookings')
    revalidatePath(`/bookings/${bookingId}`)

    console.log(`✅ Deposit marked as paid for booking: ${bookingId}`)

    return {
      success: true,
    }
  } catch (error) {
    console.error('Error marking deposit as paid:', error)

    return {
      success: false,
      error: 'Failed to update deposit status',
    }
  }
}

// ==========================================
// GET BOOKING QUOTE
// ==========================================

/**
 * Get a price quote for a group booking without creating it
 * Includes deposit requirements and special day pricing
 */
export async function getGroupBookingQuote(input: {
  roomTypeId: string
  startDate: Date
  endDate: Date
  roomsBooked: number
}): Promise<{
  success: boolean
  data?: {
    totalPrice: number
    priceBreakdown: unknown
    requiresDeposit: boolean
    depositAmount?: number
    depositPolicy?: unknown
    isGroupBooking: boolean
  }
  error?: string
}> {
  try {
    const { roomTypeId, startDate, endDate, roomsBooked } = input

    // Get price calculation
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

    // Validate booking (includes deposit check)
    const validation = await validateGroupBooking({
      userId: 'temp', // Temporary - just for validation
      roomTypeId,
      startDate,
      endDate,
      roomsBooked,
    })

    if (!validation.success) {
      return {
        success: false,
        error: validation.error || 'Validation failed',
      }
    }

    const {
      isGroupBooking,
      requiresDeposit,
      depositAmount,
      depositPolicy,
    } = validation.data!

    const quoteData: {
      totalPrice: number
      priceBreakdown: unknown
      requiresDeposit: boolean
      depositAmount?: number
      depositPolicy?: unknown
      isGroupBooking: boolean
    } = {
      totalPrice: priceCalculation.totalPrice,
      priceBreakdown: priceCalculation,
      requiresDeposit,
      isGroupBooking,
    }

    if (requiresDeposit && depositAmount) {
      quoteData.depositAmount = depositAmount
      quoteData.depositPolicy = depositPolicy
    }

    return {
      success: true,
      data: quoteData,
    }
  } catch (error) {
    console.error('Error getting booking quote:', error)

    return {
      success: false,
      error: 'Failed to get booking quote',
    }
  }
}

// ==========================================
// CANCEL GROUP BOOKING
// ==========================================

/**
 * Cancel a group booking and restore inventory
 * Handles deposit refund logic
 */
export async function cancelGroupBooking(bookingId: string): Promise<{
  success: boolean
  data?: {
    booking: unknown
    refundAmount?: number
  }
  error?: string
}> {
  try {
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        roomType: {
          select: {
            id: true,
            totalRooms: true,
          },
        },
      },
    })

    if (!booking) {
      return {
        success: false,
        error: 'Booking not found',
      }
    }

    if (booking.status === 'CANCELLED') {
      return {
        success: false,
        error: 'Booking already cancelled',
      }
    }

    // Cancel booking and restore inventory
    const result = await prisma.$transaction(async (tx) => {
      // Update booking status
      const cancelledBooking = await tx.booking.update({
        where: { id: bookingId },
        data: {
          status: 'CANCELLED',
        },
      })

      // Restore inventory
      const nights = eachDayOfInterval({
        start: booking.startDate,
        end: new Date(booking.endDate.getTime() - 1),
      })

      for (const night of nights) {
        const inventory = await tx.roomInventory.findUnique({
          where: {
            roomTypeId_date: {
              roomTypeId: booking.roomTypeId,
              date: night,
            },
          },
        })

        if (inventory) {
          await tx.roomInventory.update({
            where: {
              roomTypeId_date: {
                roomTypeId: booking.roomTypeId,
                date: night,
              },
            },
            data: {
              availableRooms: {
                increment: booking.roomsBooked,
              },
            },
          })
        }
      }

      return cancelledBooking
    })

    revalidatePath('/bookings')
    revalidatePath('/admin/bookings')
    revalidatePath(`/bookings/${bookingId}`)

    console.log(`✅ Group booking cancelled: ${bookingId}`)

    // Calculate refund amount (if deposit was paid)
    const cancelData: { booking: unknown; refundAmount?: number } = {
      booking: result,
    }

    if (booking.isDepositPaid && booking.depositAmount) {
      cancelData.refundAmount = booking.depositAmount
    }

    return {
      success: true,
      data: cancelData,
    }
  } catch (error) {
    console.error('Error cancelling group booking:', error)

    return {
      success: false,
      error: 'Failed to cancel booking',
    }
  }
}

// ==========================================
// EXPORT TYPES
// ==========================================

export type { CreateGroupBookingInput, CreateGroupBookingResult }
