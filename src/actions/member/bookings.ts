/**
 * Member Booking Server Actions (Day 14)
 * 
 * Server actions for member dashboard operations:
 * - Fetch user bookings
 * - Cancel bookings with validation
 * - Join waitlist
 * - Download invoice
 * 
 * All actions include authorization checks and business rule validation.
 */

'use server'

import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/prisma'
import { BookingStatus, WaitlistStatus, GuestType } from '@prisma/client'
import {
  FetchBookingsRequest,
  FetchBookingsRequestSchema,
  FetchBookingsResponse,
  CancelBookingRequest,
  CancelBookingRequestSchema,
  CancelBookingResponse,
  JoinWaitlistRequest,
  JoinWaitlistRequestSchema,
  JoinWaitlistResponse,
  validateBookingOwnership,
  validateCancellation,
  calculateRefund,
} from '@/lib/validation/member.validation'
import { incrementInventory, getBookingDateRange } from '@/lib/inventory-locking'

/**
 * Fetch all bookings for a user
 * 
 * @param input - User ID and optional filters
 * @returns List of bookings with room type and payment info
 * 
 * @example
 * ```ts
 * const result = await fetchMemberBookings({ userId: 'user-123' })
 * if (result.success) {
 *   console.log('Bookings:', result.bookings)
 * }
 * ```
 */
export async function fetchMemberBookings(
  input: FetchBookingsRequest
): Promise<FetchBookingsResponse> {
  try {
    // Validate input
    const validated = FetchBookingsRequestSchema.parse(input)
    const { userId, filter = 'all', limit, offset } = validated
    
    // Build where clause based on filter
    const now = new Date()
    const whereClause: any = { userId }
    
    switch (filter) {
      case 'upcoming':
        whereClause.status = { not: BookingStatus.CANCELLED }
        whereClause.startDate = { gt: now }
        break
      
      case 'past':
        whereClause.status = { not: BookingStatus.CANCELLED }
        whereClause.endDate = { lt: now }
        break
      
      case 'cancelled':
        whereClause.status = BookingStatus.CANCELLED
        break
      
      case 'waitlisted':
        whereClause.status = BookingStatus.PROVISIONAL
        break
      
      case 'all':
      default:
        // No additional filters
        break
    }
    
    // Fetch bookings with related data
    const queryOptions: any = {
      where: whereClause,
      include: {
        roomType: true,
        payments: {
          orderBy: {
            createdAt: 'desc',
          },
        },
      },
      orderBy: {
        startDate: 'desc',
      },
    }
    
    if (limit !== undefined) {
      queryOptions.take = limit
    }
    
    if (offset !== undefined) {
      queryOptions.skip = offset
    }
    
    const bookings = await prisma.booking.findMany(queryOptions)
    
    // Count total
    const total = await prisma.booking.count({ where: whereClause })
    
    return {
      success: true,
      bookings: bookings as any,
      total,
      message: `Found ${bookings.length} booking(s)`,
    }
    
  } catch (error: any) {
    console.error('Error fetching bookings:', error)
    
    if (error.name === 'ZodError') {
      return {
        success: false,
        error: 'VALIDATION_ERROR',
        message: 'Invalid request parameters',
        details: { errors: error.errors },
      }
    }
    
    return {
      success: false,
      error: 'FETCH_ERROR',
      message: 'Failed to fetch bookings',
    }
  }
}

/**
 * Cancel a booking with refund calculation
 * 
 * Validates:
 * - User owns the booking
 * - Booking status allows cancellation
 * - Cancellation deadline not passed
 * 
 * @param input - Booking ID, user ID, and optional reason
 * @returns Updated booking with refund amount
 * 
 * @example
 * ```ts
 * const result = await cancelMemberBooking({
 *   bookingId: 'booking-123',
 *   userId: 'user-123',
 *   reason: 'Change of plans'
 * })
 * 
 * if (result.success) {
 *   console.log('Refund amount:', result.refundAmount)
 * }
 * ```
 */
export async function cancelMemberBooking(
  input: CancelBookingRequest
): Promise<CancelBookingResponse> {
  try {
    // Validate input
    const validated = CancelBookingRequestSchema.parse(input)
    const { bookingId, userId, reason } = validated
    
    // Fetch booking
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        roomType: true,
        payments: true,
      },
    })
    
    if (!booking) {
      return {
        success: false,
        error: 'NOT_FOUND',
        message: 'Booking not found',
      }
    }
    
    // Validate ownership
    if (!validateBookingOwnership(booking, userId)) {
      return {
        success: false,
        error: 'UNAUTHORIZED',
        message: 'You do not have permission to cancel this booking',
      }
    }
    
    // Validate cancellation rules
    const cancellationValidation = validateCancellation({
      status: booking.status,
      startDate: booking.startDate,
    })
    
    if (!cancellationValidation.valid) {
      return {
        success: false,
        error: 'CANCELLATION_NOT_ALLOWED',
        message: cancellationValidation.message || 'Cannot cancel this booking',
      }
    }
    
    // Calculate refund
    const refundAmount = calculateRefund(
      booking.totalPrice,
      booking.startDate,
      booking.depositAmount
    )
    
    // Update booking and restore inventory in transaction
    const updatedBooking = await prisma.$transaction(async (tx) => {
      // Update booking status
      const updated = await tx.booking.update({
        where: { id: bookingId },
        data: {
          status: BookingStatus.CANCELLED,
        },
        include: {
          roomType: true,
          payments: true,
        },
      })
      
      // Restore inventory
      const dates = getBookingDateRange(booking.startDate, booking.endDate)
      await incrementInventory(tx, booking.roomTypeId, dates, booking.roomsBooked)
      
      // Create refund payment record if applicable
      if (refundAmount > 0) {
        await tx.payment.create({
          data: {
            bookingId: booking.id,
            userId: booking.userId,
            provider: 'refund',
            amount: refundAmount,
            currency: 'USD',
            status: 'SUCCEEDED',
            metadata: JSON.stringify({
              reason: reason || 'Booking cancelled',
              originalAmount: booking.totalPrice,
              refundPercentage: Math.round((refundAmount / booking.totalPrice) * 100),
            }),
            paidAt: new Date(),
          },
        })
      }
      
      return updated
    })
    
    // Revalidate booking pages
    revalidatePath('/dashboard/member')
    revalidatePath(`/bookings/${bookingId}`)
    
    return {
      success: true,
      booking: updatedBooking,
      refundAmount,
      message: refundAmount > 0
        ? `Booking cancelled successfully. Refund of $${(refundAmount / 100).toFixed(2)} will be processed.`
        : 'Booking cancelled successfully.',
    }
    
  } catch (error: any) {
    console.error('Error cancelling booking:', error)
    
    if (error.name === 'ZodError') {
      return {
        success: false,
        error: 'VALIDATION_ERROR',
        message: 'Invalid request parameters',
      }
    }
    
    return {
      success: false,
      error: 'CANCELLATION_ERROR',
      message: error.message || 'Failed to cancel booking',
    }
  }
}

/**
 * Join waitlist for unavailable dates
 * 
 * @param input - User ID, room type, dates, guests
 * @returns Waitlist entry ID and position
 * 
 * @example
 * ```ts
 * const result = await joinMemberWaitlist({
 *   userId: 'user-123',
 *   roomTypeId: 'room-type-456',
 *   startDate: new Date('2024-01-15'),
 *   endDate: new Date('2024-01-20'),
 *   guests: 2
 * })
 * 
 * if (result.success) {
 *   console.log('Waitlist position:', result.position)
 * }
 * ```
 */
export async function joinMemberWaitlist(
  input: JoinWaitlistRequest
): Promise<JoinWaitlistResponse> {
  try {
    // Validate input
    const validated = JoinWaitlistRequestSchema.parse(input)
    const { userId, roomTypeId, startDate, endDate, guests, notes } = validated
    
    // Validate dates
    if (startDate >= endDate) {
      return {
        success: false,
        error: 'INVALID_DATES',
        message: 'End date must be after start date',
      }
    }
    
    // Check if room type exists
    const roomType = await prisma.roomType.findUnique({
      where: { id: roomTypeId },
    })
    
    if (!roomType) {
      return {
        success: false,
        error: 'ROOM_TYPE_NOT_FOUND',
        message: 'Room type not found',
      }
    }
    
    // Check if user already on waitlist for these dates
    const existingWaitlist = await prisma.waitlist.findFirst({
      where: {
        userId,
        roomTypeId,
        startDate,
        endDate,
        status: { in: [WaitlistStatus.PENDING, WaitlistStatus.NOTIFIED] },
      },
    })
    
    if (existingWaitlist) {
      return {
        success: false,
        error: 'ALREADY_ON_WAITLIST',
        message: 'You are already on the waitlist for these dates',
      }
    }
    
    // Calculate expiry (7 days from now)
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + 7)
    
    // Create waitlist entry
    const waitlistEntry = await prisma.waitlist.create({
      data: {
        userId,
        roomTypeId,
        startDate,
        endDate,
        guests,
        guestType: GuestType.REGULAR, // Default, can be customized
        notes: notes ?? null,
        status: WaitlistStatus.PENDING,
        expiresAt,
      },
    })
    
    // Calculate position in waitlist
    const position = await prisma.waitlist.count({
      where: {
        roomTypeId,
        startDate,
        status: WaitlistStatus.PENDING,
        createdAt: {
          lte: waitlistEntry.createdAt,
        },
      },
    })
    
    // Revalidate
    revalidatePath('/dashboard/member')
    
    return {
      success: true,
      waitlistId: waitlistEntry.id,
      position,
      message: `You have been added to the waitlist at position #${position}. You will be notified if a room becomes available.`,
    }
    
  } catch (error: any) {
    console.error('Error joining waitlist:', error)
    
    if (error.name === 'ZodError') {
      return {
        success: false,
        error: 'VALIDATION_ERROR',
        message: 'Invalid request parameters',
      }
    }
    
    return {
      success: false,
      error: 'WAITLIST_ERROR',
      message: error.message || 'Failed to join waitlist',
    }
  }
}

/**
 * Get booking details by ID
 * 
 * @param bookingId - Booking ID
 * @param userId - User ID for authorization
 * @returns Booking with full details
 */
export async function getMemberBooking(bookingId: string, userId: string) {
  try {
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        roomType: true,
        payments: {
          orderBy: {
            createdAt: 'desc',
          },
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
      },
    })
    
    if (!booking) {
      return {
        success: false,
        error: 'NOT_FOUND',
        message: 'Booking not found',
      }
    }
    
    // Validate ownership
    if (!validateBookingOwnership(booking, userId)) {
      return {
        success: false,
        error: 'UNAUTHORIZED',
        message: 'You do not have permission to view this booking',
      }
    }
    
    return {
      success: true,
      booking,
    }
    
  } catch (error: any) {
    console.error('Error fetching booking:', error)
    return {
      success: false,
      error: 'FETCH_ERROR',
      message: 'Failed to fetch booking details',
    }
  }
}
