// ==========================================
// BOOKING SERVER ACTIONS
// ==========================================
// Next.js Server Actions for Booking CRUD operations
// Features: Zod validation, RBAC, availability checking, inventory management

'use server'

import { prisma } from '@/lib/prisma'
import { BookingStatus, GuestType, Prisma } from '@prisma/client'
import {
  BookingInputSchema,
  ConfirmBookingSchema,
  CancelBookingSchema,
  UpdateBookingStatusSchema,
  GetUserBookingsSchema,
  GetBookingsByDateRangeSchema,
  CheckAvailabilitySchema,
  calculateBookingPrice,
  validateBookingDates,
} from '@/lib/validation/booking.validation'
import type {
  CreateBookingResponse,
  ConfirmBookingResponse,
  CancelBookingResponse,
  UpdateBookingStatusResponse,
  GetUserBookingsResponse,
  GetBookingsByDateRangeResponse,
  CheckAvailabilityResponse,
  BookingWithDetails,
  BookingSummary,
  BookingStats,
  BookingConflict,
} from '@/types/prisma-booking.types'
import { sendBookingConfirmation } from '@/lib/services/notification-trigger.service'

// ==========================================
// HELPER FUNCTIONS
// ==========================================

/**
 * Check if dates overlap with existing bookings
 */
async function checkDateOverlap(
  roomTypeId: string,
  startDate: Date,
  endDate: Date,
  excludeBookingId?: string
): Promise<BookingConflict | null> {
  const overlappingBookings = await prisma.booking.findMany({
    where: {
      roomTypeId,
      status: {
        in: [BookingStatus.PROVISIONAL, BookingStatus.CONFIRMED]
      },
      AND: [
        {
          startDate: {
            lt: endDate
          }
        },
        {
          endDate: {
            gt: startDate
          }
        }
      ],
      ...(excludeBookingId && {
        id: {
          not: excludeBookingId
        }
      })
    },
    include: {
      user: {
        select: {
          name: true,
          phone: true
        }
      },
      roomType: {
        select: {
          name: true
        }
      }
    }
  })

  if (overlappingBookings.length > 0) {
    const conflictingBookings: BookingSummary[] = overlappingBookings.map(booking => ({
      id: booking.id,
      status: booking.status,
      startDate: booking.startDate,
      endDate: booking.endDate,
      totalPrice: booking.totalPrice,
      nights: Math.ceil((booking.endDate.getTime() - booking.startDate.getTime()) / (1000 * 60 * 60 * 24)),
      userName: booking.user.name,
      userPhone: booking.user.phone,
      roomTypeName: booking.roomType.name,
      createdAt: booking.createdAt,
    }))

    return {
      conflictType: 'OVERLAP',
      message: `Dates overlap with ${overlappingBookings.length} existing booking(s)`,
      conflictingBookings,
    }
  }

  return null
}

/**
 * Check room availability for given dates
 */
async function checkRoomAvailability(
  roomTypeId: string,
  startDate: Date,
  endDate: Date
): Promise<{ available: boolean; availableRooms: number; totalRooms: number }> {
  // Get room type info
  const roomType = await prisma.roomType.findUnique({
    where: { id: roomTypeId },
    select: { totalRooms: true }
  })

  if (!roomType) {
    return { available: false, availableRooms: 0, totalRooms: 0 }
  }

  // Check inventory for the date range
  const inventoryRecords = await prisma.roomInventory.findMany({
    where: {
      roomTypeId,
      date: {
        gte: startDate,
        lt: endDate
      }
    }
  })

  // Find minimum available rooms across the date range
  const minAvailableRooms = inventoryRecords.reduce((min, record) => 
    Math.min(min, record.availableRooms), roomType.totalRooms
  )

  return {
    available: minAvailableRooms > 0,
    availableRooms: minAvailableRooms,
    totalRooms: roomType.totalRooms
  }
}

/**
 * Get user's guest type (for booking rules)
 */
async function getUserGuestType(userId: string): Promise<GuestType> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      role: true
    }
  })

  // Simple logic: admins are VIP, members with IRCA ID are corporate, others are regular
  if (user?.role.name === 'ADMIN' || user?.role.name === 'SUPERADMIN') {
    return GuestType.VIP
  }
  
  if (user?.ircaMembershipId) {
    return GuestType.CORPORATE
  }

  return GuestType.REGULAR
}

/**
 * Get booking rules for guest type
 */
async function getBookingRulesForGuestType(guestType: GuestType) {
  return await prisma.bookingRules.findUnique({
    where: { guestType }
  })
}

/**
 * Update room inventory after booking confirmation
 */
async function updateInventoryForBooking(
  roomTypeId: string,
  startDate: Date,
  endDate: Date,
  operation: 'CONFIRM' | 'CANCEL'
): Promise<boolean> {
  try {
    const dates = []
    const current = new Date(startDate)
    
    while (current < endDate) {
      dates.push(new Date(current))
      current.setDate(current.getDate() + 1)
    }

    // Update inventory for each date
    for (const date of dates) {
      const increment = operation === 'CONFIRM' ? -1 : 1
      
      await prisma.roomInventory.upsert({
        where: {
          roomTypeId_date: {
            roomTypeId,
            date
          }
        },
        update: {
          availableRooms: {
            increment
          }
        },
        create: {
          roomTypeId,
          date,
          availableRooms: operation === 'CONFIRM' ? 0 : 1 // This should ideally come from room type
        }
      })
    }

    return true
  } catch (error) {
    console.error('Error updating inventory:', error)
    return false
  }
}

// ==========================================
// CREATE PROVISIONAL BOOKING
// ==========================================

/**
 * Create a provisional booking
 * 
 * Creates a new booking in PROVISIONAL status, which needs to be confirmed later.
 * Validates availability, business rules, and date constraints.
 * 
 * @param input - Booking creation data
 * @returns Server action response with created booking
 * 
 * @example
 * ```typescript
 * const result = await createProvisionalBooking({
 *   userId: "clx123...",
 *   roomTypeId: "clx456...",
 *   startDate: new Date("2024-01-15"),
 *   endDate: new Date("2024-01-18")
 * })
 * 
 * if (result.success) {
 *   console.log("Booking created:", result.data.booking.id)
 * }
 * ```
 */
export async function createProvisionalBooking(
  input: unknown
): Promise<CreateBookingResponse> {
  try {
    // ==========================================
    // INPUT VALIDATION
    // ==========================================
    const validation = BookingInputSchema.safeParse(input)

    if (!validation.success) {
      const errors = validation.error.issues.map((err) => err.message).join(', ')
      return {
        success: false,
        message: `Validation failed: ${errors}`,
        error: errors,
      }
    }

    const { userId, roomTypeId, startDate, endDate } = validation.data

    // ==========================================
    // USER & ROOM TYPE VALIDATION
    // ==========================================
    const [user, roomType] = await Promise.all([
      prisma.user.findUnique({
        where: { id: userId },
        include: { role: true }
      }),
      prisma.roomType.findUnique({
        where: { id: roomTypeId }
      })
    ])

    if (!user) {
      return {
        success: false,
        message: 'User not found',
        error: 'Invalid user ID',
      }
    }

    if (!roomType) {
      return {
        success: false,
        message: 'Room type not found',
        error: 'Invalid room type ID',
      }
    }

    // ==========================================
    // BUSINESS RULES VALIDATION
    // ==========================================
    const guestType = await getUserGuestType(userId)
    const bookingRules = await getBookingRulesForGuestType(guestType)

    if (bookingRules) {
      const dateValidation = validateBookingDates(
        startDate,
        endDate,
        bookingRules.maxDaysAdvance,
        bookingRules.minDaysNotice
      )

      if (!dateValidation.valid) {
        return {
          success: false,
          message: dateValidation.error!,
          error: 'Booking rules violation',
        }
      }
    }

    // ==========================================
    // AVAILABILITY CHECK
    // ==========================================
    const conflicts: BookingConflict[] = []
    
    // Check date overlap
    const overlapConflict = await checkDateOverlap(roomTypeId, startDate, endDate)
    if (overlapConflict) {
      conflicts.push(overlapConflict)
    }

    // Check room availability
    const availability = await checkRoomAvailability(roomTypeId, startDate, endDate)
    if (!availability.available) {
      conflicts.push({
        conflictType: 'INSUFFICIENT_INVENTORY',
        message: `Insufficient rooms available. Only ${availability.availableRooms} rooms available, but booking requires 1 room.`,
      })
    }

    // If there are conflicts, return them but still allow provisional booking
    // (provisional bookings can be made even with conflicts for admin review)

    // ==========================================
    // CALCULATE PRICING
    // ==========================================
    const totalPrice = calculateBookingPrice(startDate, endDate, roomType.pricePerNight)

    // ==========================================
    // CREATE BOOKING
    // ==========================================
    const booking = await prisma.booking.create({
      data: {
        userId,
        roomTypeId,
        startDate,
        endDate,
        status: BookingStatus.PROVISIONAL,
        totalPrice,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            phone: true,
            email: true,
          }
        },
        roomType: {
          select: {
            id: true,
            name: true,
            description: true,
            pricePerNight: true,
          }
        }
      }
    })

    return {
      success: true,
      message: `Provisional booking created successfully${conflicts.length > 0 ? ' (with conflicts)' : ''}`,
      data: {
        booking,
        ...(conflicts.length > 0 && { conflicts })
      },
    }
  } catch (error) {
    console.error('Error creating provisional booking:', error)
    
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      return {
        success: false,
        message: 'Database error while creating booking',
        error: `Prisma error: ${error.code} - ${error.message}`,
      }
    }

    return {
      success: false,
      message: 'Failed to create provisional booking',
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    }
  }
}

// ==========================================
// CONFIRM BOOKING
// ==========================================

/**
 * Confirm a provisional booking
 * 
 * Moves a booking from PROVISIONAL to CONFIRMED status and updates inventory.
 * Only the booking owner or admins can confirm bookings.
 * 
 * @param input - Booking confirmation data
 * @returns Server action response with confirmed booking
 */
export async function confirmBooking(
  input: unknown
): Promise<ConfirmBookingResponse> {
  try {
    // ==========================================
    // INPUT VALIDATION
    // ==========================================
    const validation = ConfirmBookingSchema.safeParse(input)

    if (!validation.success) {
      const errors = validation.error.issues.map((err) => err.message).join(', ')
      return {
        success: false,
        message: `Validation failed: ${errors}`,
        error: errors,
      }
    }

    const { bookingId, userId } = validation.data

    // ==========================================
    // BOOKING VALIDATION
    // ==========================================
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        user: {
          include: { role: true }
        },
        roomType: true
      }
    })

    if (!booking) {
      return {
        success: false,
        message: 'Booking not found',
        error: 'Invalid booking ID',
      }
    }

    // Check authorization (owner or admin)
    const requestingUser = await prisma.user.findUnique({
      where: { id: userId },
      include: { role: true }
    })

    const isOwner = booking.userId === userId
    const isAdmin = requestingUser?.role.name === 'ADMIN' || requestingUser?.role.name === 'SUPERADMIN'

    if (!isOwner && !isAdmin) {
      return {
        success: false,
        message: 'Unauthorized to confirm this booking',
        error: 'Access denied',
      }
    }

    if (booking.status !== BookingStatus.PROVISIONAL) {
      return {
        success: false,
        message: `Cannot confirm booking with status: ${booking.status}`,
        error: 'Invalid booking status',
      }
    }

    // ==========================================
    // FINAL AVAILABILITY CHECK
    // ==========================================
    const availability = await checkRoomAvailability(
      booking.roomTypeId,
      booking.startDate,
      booking.endDate
    )

    if (!availability.available) {
      return {
        success: false,
        message: 'Rooms no longer available for confirmation',
        error: 'Insufficient inventory',
      }
    }

    // ==========================================
    // CONFIRM BOOKING & UPDATE INVENTORY
    // ==========================================
    const [updatedBooking, inventoryUpdated] = await Promise.all([
      prisma.booking.update({
        where: { id: bookingId },
        data: { status: BookingStatus.CONFIRMED },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              phone: true,
              email: true,
            }
          },
          roomType: {
            select: {
              id: true,
              name: true,
              description: true,
              pricePerNight: true,
            }
          }
        }
      }),
      updateInventoryForBooking(
        booking.roomTypeId,
        booking.startDate,
        booking.endDate,
        'CONFIRM'
      )
    ])

    // Send booking confirmation notification
    // Note: This is async and doesn't block the response
    sendBookingConfirmation(updatedBooking.id).catch(error => {
      console.error('[confirmBooking] Failed to send notification:', error)
    })

    return {
      success: true,
      message: 'Booking confirmed successfully',
      data: {
        booking: updatedBooking,
        inventoryUpdated,
      },
    }
  } catch (error) {
    console.error('Error confirming booking:', error)
    
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      return {
        success: false,
        message: 'Database error while confirming booking',
        error: `Prisma error: ${error.code} - ${error.message}`,
      }
    }

    return {
      success: false,
      message: 'Failed to confirm booking',
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    }
  }
}

// ==========================================
// CANCEL BOOKING
// ==========================================

/**
 * Cancel a booking
 * 
 * Cancels a booking and restores inventory if the booking was confirmed.
 * Only the booking owner or admins can cancel bookings.
 * 
 * @param input - Booking cancellation data
 * @returns Server action response with cancelled booking
 */
export async function cancelBooking(
  input: unknown
): Promise<CancelBookingResponse> {
  try {
    // ==========================================
    // INPUT VALIDATION
    // ==========================================
    const validation = CancelBookingSchema.safeParse(input)

    if (!validation.success) {
      const errors = validation.error.issues.map((err) => err.message).join(', ')
      return {
        success: false,
        message: `Validation failed: ${errors}`,
        error: errors,
      }
    }

    const { bookingId, userId } = validation.data

    // ==========================================
    // BOOKING VALIDATION
    // ==========================================
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        user: {
          include: { role: true }
        },
        roomType: true
      }
    })

    if (!booking) {
      return {
        success: false,
        message: 'Booking not found',
        error: 'Invalid booking ID',
      }
    }

    // Check authorization
    const requestingUser = await prisma.user.findUnique({
      where: { id: userId },
      include: { role: true }
    })

    const isOwner = booking.userId === userId
    const isAdmin = requestingUser?.role.name === 'ADMIN' || requestingUser?.role.name === 'SUPERADMIN'

    if (!isOwner && !isAdmin) {
      return {
        success: false,
        message: 'Unauthorized to cancel this booking',
        error: 'Access denied',
      }
    }

    if (booking.status === BookingStatus.CANCELLED) {
      return {
        success: false,
        message: 'Booking is already cancelled',
        error: 'Invalid booking status',
      }
    }

    // ==========================================
    // CANCEL BOOKING & RESTORE INVENTORY
    // ==========================================
    const wasConfirmed = booking.status === BookingStatus.CONFIRMED
    
    const [updatedBooking, inventoryRestored] = await Promise.all([
      prisma.booking.update({
        where: { id: bookingId },
        data: { status: BookingStatus.CANCELLED },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              phone: true,
              email: true,
            }
          },
          roomType: {
            select: {
              id: true,
              name: true,
              description: true,
              pricePerNight: true,
            }
          }
        }
      }),
      wasConfirmed 
        ? updateInventoryForBooking(
            booking.roomTypeId,
            booking.startDate,
            booking.endDate,
            'CANCEL'
          )
        : Promise.resolve(true)
    ])

    return {
      success: true,
      message: 'Booking cancelled successfully',
      data: {
        booking: updatedBooking,
        inventoryRestored,
        ...(wasConfirmed && { refundAmount: booking.totalPrice })
      },
    }
  } catch (error) {
    console.error('Error cancelling booking:', error)
    
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      return {
        success: false,
        message: 'Database error while cancelling booking',
        error: `Prisma error: ${error.code} - ${error.message}`,
      }
    }

    return {
      success: false,
      message: 'Failed to cancel booking',
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    }
  }
}

// ==========================================
// GET USER BOOKINGS
// ==========================================

/**
 * Get bookings for a specific user
 * 
 * Retrieves paginated list of bookings for a user with optional status filtering.
 * 
 * @param input - User bookings query parameters
 * @returns Server action response with user bookings
 */
export async function getUserBookings(
  input: unknown
): Promise<GetUserBookingsResponse> {
  try {
    // ==========================================
    // INPUT VALIDATION
    // ==========================================
    const validation = GetUserBookingsSchema.safeParse(input)

    if (!validation.success) {
      const errors = validation.error.issues.map((err) => err.message).join(', ')
      return {
        success: false,
        message: `Validation failed: ${errors}`,
        error: errors,
      }
    }

    const { userId, status, page, pageSize } = validation.data

    // ==========================================
    // BUILD QUERY
    // ==========================================
    const where: Prisma.BookingWhereInput = {
      userId,
      ...(status && { status })
    }

    const [bookings, totalCount] = await Promise.all([
      prisma.booking.findMany({
        where,
        include: {
          user: {
            select: {
              name: true,
              phone: true,
            }
          },
          roomType: {
            select: {
              name: true,
            }
          },
          payments: {
            select: {
              status: true,
              amount: true,
            },
            orderBy: {
              createdAt: 'desc'
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.booking.count({ where })
    ])

    // ==========================================
    // FORMAT RESPONSE
    // ==========================================
        type PaymentStatusType = 'PENDING' | 'SUCCEEDED' | 'FAILED' | 'REFUNDED' | 'CANCELLED';
        const bookingSummaries: BookingSummary[] = bookings.map(booking => {
          // Calculate payment status
          const totalPaid = booking.payments
            .filter(p => p.status === 'SUCCEEDED')
            .reduce((sum, p) => sum + p.amount, 0)

          const fullyPaid = totalPaid >= booking.totalPrice
          const hasPayment = booking.payments.length > 0

          let paymentStatus: PaymentStatusType = 'PENDING';
          if (fullyPaid) {
            paymentStatus = 'SUCCEEDED';
          } else if (hasPayment) {
            const lastPayment = booking.payments[0]
            paymentStatus = lastPayment?.status as PaymentStatusType ?? 'UNPAID';
          }

          return {
            id: booking.id,
            bookingId: booking.id ?? '',
            status: booking.status,
            startDate: booking.startDate,
            endDate: booking.endDate,
            totalPrice: booking.totalPrice,
            nights: Math.ceil((booking.endDate.getTime() - booking.startDate.getTime()) / (1000 * 60 * 60 * 24)),
            userName: booking.user.name,
            userPhone: booking.user.phone,
            roomTypeName: booking.roomType.name,
            createdAt: booking.createdAt,
            paymentStatus: paymentStatus ?? 'PENDING',
          }
        })

    const totalPages = Math.ceil(totalCount / pageSize)

    return {
      success: true,
      message: `Retrieved ${bookings.length} booking(s) for user`,
      data: {
        bookings: bookingSummaries,
        pagination: {
          page,
          pageSize,
          totalCount,
          totalPages,
        }
      },
    }
  } catch (error) {
    console.error('Error getting user bookings:', error)
    
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      return {
        success: false,
        message: 'Database error while retrieving bookings',
        error: `Prisma error: ${error.code} - ${error.message}`,
      }
    }

    return {
      success: false,
      message: 'Failed to retrieve user bookings',
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    }
  }
}

// ==========================================
// CHECK AVAILABILITY
// ==========================================

/**
 * Check room availability for given dates
 * 
 * Checks if rooms are available for booking in the specified date range.
 * 
 * @param input - Availability check parameters
 * @returns Server action response with availability information
 */
export async function checkAvailability(
  input: unknown
): Promise<CheckAvailabilityResponse> {
  try {
    // ==========================================
    // INPUT VALIDATION
    // ==========================================
    const validation = CheckAvailabilitySchema.safeParse(input)

    if (!validation.success) {
      const errors = validation.error.issues.map((err) => err.message).join(', ')
      return {
        success: false,
        message: `Validation failed: ${errors}`,
        error: errors,
      }
    }

    const { roomTypeId, startDate, endDate } = validation.data

    // ==========================================
    // VERIFY ROOM TYPE EXISTS
    // ==========================================
    const roomType = await prisma.roomType.findUnique({
      where: { id: roomTypeId },
    })

    if (!roomType) {
      return {
        success: false,
        message: 'Room type not found',
        error: 'Invalid room type ID',
      }
    }

    // ==========================================
    // CHECK AVAILABILITY
    // ==========================================
    const [availability, overlapConflict] = await Promise.all([
      checkRoomAvailability(roomTypeId, startDate, endDate),
      checkDateOverlap(roomTypeId, startDate, endDate)
    ])

    const conflicts: BookingConflict[] = []
    if (overlapConflict) {
      conflicts.push(overlapConflict)
    }

    return {
      success: true,
      message: availability.available 
        ? `${availability.availableRooms} room(s) available`
        : 'No rooms available for selected dates',
      data: {
        isAvailable: availability.available,
        availableRooms: availability.availableRooms,
        ...(conflicts.length > 0 && { conflicts })
      },
    }
  } catch (error) {
    console.error('Error checking availability:', error)
    
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      return {
        success: false,
        message: 'Database error while checking availability',
        error: `Prisma error: ${error.code} - ${error.message}`,
      }
    }

    return {
      success: false,
      message: 'Failed to check availability',
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    }
  }
}