/**
 * Concurrency-Safe Booking Actions (Day 13)
 * 
 * Server actions for creating bookings with complete concurrency safety.
 * Implements row-level locking and idempotency to prevent overbooking.
 * 
 * Key Features:
 * - SELECT FOR UPDATE row-level locks
 * - Idempotency key support (prevents duplicate bookings)
 * - Transaction-safe inventory updates
 * - Atomic booking creation
 * - Graceful error handling with detailed error codes
 * 
 * Flow:
 * 1. Check idempotency key for duplicate requests
 * 2. Start transaction with row-level locks
 * 3. Lock inventory records for all dates
 * 4. Validate sufficient inventory
 * 5. Create booking and decrement inventory atomically
 * 6. Store idempotency key
 * 7. Commit transaction
 */

'use server'

import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/prisma'
import { BookingStatus, Prisma } from '@prisma/client'
import {
  ConcurrentBookingRequest,
  ConcurrentBookingRequestSchema,
  BookingCreationResponse,
  IdempotencyParamsSchema,
} from '@/lib/validation/concurrency.validation'
import {
  lockInventoryForDates,
  validateLockedInventory,
  decrementLockedInventory,
  getBookingDateRange,
  createInsufficientInventoryError,
  createConcurrencyError,
} from '@/lib/inventory-locking'
import {
  generateIdempotencyKey,
  createIdempotencyMetadata,
  findExistingIdempotencyKey,
  createIdempotencyKey,
  getOrGenerateIdempotencyKey,
} from '@/lib/idempotency'

/**
 * Create a provisional booking with full concurrency safety
 * 
 * This action uses row-level locks (SELECT FOR UPDATE) to ensure that
 * concurrent requests cannot overbook inventory. It also uses idempotency
 * keys to prevent duplicate bookings from repeated client requests.
 * 
 * @param input - Booking request with optional idempotency key
 * @returns Success response with booking ID or error response
 * 
 * @example
 * ```ts
 * const result = await createConcurrentBooking({
 *   userId: 'user-123',
 *   roomTypeId: 'room-type-456',
 *   startDate: new Date('2024-01-15'),
 *   endDate: new Date('2024-01-20'),
 *   roomsBooked: 2,
 * })
 * 
 * if (result.success) {
 *   console.log('Booking created:', result.bookingId)
 * } else {
 *   console.error('Booking failed:', result.error, result.message)
 * }
 * ```
 */
export async function createConcurrentBooking(
  input: ConcurrentBookingRequest
): Promise<BookingCreationResponse> {
  try {
    // 1. Validate input
    const validatedInput = ConcurrentBookingRequestSchema.parse(input)
    const { userId, roomTypeId, startDate, endDate, roomsBooked } = validatedInput
    
    // 2. Validate date range
    if (startDate >= endDate) {
      return {
        success: false,
        error: 'INVALID_DATE_RANGE',
        message: 'Start date must be before end date',
        details: {
          roomTypeId,
        },
      }
    }
    
    // 3. Generate or use provided idempotency key
    const idempotencyParams = IdempotencyParamsSchema.parse({
      userId,
      roomTypeId,
      startDate,
      endDate,
      roomsBooked,
    })
    
    const idempotencyKey = getOrGenerateIdempotencyKey(
      idempotencyParams,
      validatedInput.idempotencyKey
    )
    
    // 4. Check if this request has already been processed (idempotency check)
    const existingKey = await findExistingIdempotencyKey(prisma, idempotencyKey)
    
    if (existingKey) {
      // Return the existing booking (idempotent response)
      return {
        success: true,
        bookingId: existingKey.booking.id,
        status: existingKey.booking.status,
        totalPrice: existingKey.booking.totalPrice,
        roomsBooked: existingKey.booking.roomsBooked,
        depositRequired: existingKey.booking.depositAmount !== null,
        depositAmount: existingKey.booking.depositAmount ?? undefined,
        idempotencyKey,
        isFromCache: true,
      }
    }
    
    // 5. Verify room type exists
    const roomType = await prisma.roomType.findUnique({
      where: { id: roomTypeId },
    })
    
    if (!roomType) {
      return {
        success: false,
        error: 'ROOM_TYPE_NOT_FOUND',
        message: `Room type with ID ${roomTypeId} not found`,
        details: {
          roomTypeId,
        },
      }
    }
    
    // 6. Calculate date range (excludes checkout date)
    const dates = getBookingDateRange(startDate, endDate)
    
    if (dates.length === 0) {
      return {
        success: false,
        error: 'INVALID_DATE_RANGE',
        message: 'Booking must span at least one night',
      }
    }
    
    // 7. Calculate total price (simple calculation for now)
    const nights = dates.length
    const totalPrice = roomType.pricePerNight * nights * roomsBooked
    
    // 8. Execute transaction with row-level locks
    try {
      const booking = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
        // 8a. Lock inventory records for all dates (SELECT FOR UPDATE)
        const lockedRecords = await lockInventoryForDates(tx, roomTypeId, dates)
        
        // 8b. Validate that we have sufficient inventory
        const validation = validateLockedInventory(lockedRecords, roomsBooked, dates)
        
        if (!validation.isValid) {
          // Find the first date with insufficient inventory
          const firstInsufficientDate = validation.insufficientDates[0]
          if (!firstInsufficientDate) {
            throw createConcurrencyError('Validation failed but no insufficient dates found')
          }
          
          const insufficientRecord = lockedRecords.find(
            record => new Date(record.date).toDateString() === firstInsufficientDate.toDateString()
          )
          
          throw createInsufficientInventoryError(
            roomTypeId,
            roomsBooked,
            firstInsufficientDate,
            insufficientRecord?.availableRooms ?? 0
          )
        }
        
        // 8c. Create booking (provisional status)
        const newBooking = await tx.booking.create({
          data: {
            userId,
            roomTypeId,
            startDate,
            endDate,
            status: BookingStatus.PROVISIONAL,
            totalPrice,
            roomsBooked,
          },
        })
        
        // 8d. Decrement inventory atomically
        await decrementLockedInventory(tx, validation.lockedRecords, roomsBooked)
        
        // 8e. Create idempotency key record
        const metadata = createIdempotencyMetadata(idempotencyParams)
        await createIdempotencyKey(tx, {
          key: idempotencyKey,
          bookingId: newBooking.id,
          metadata: JSON.stringify(metadata),
        })
        
        return newBooking
      }, {
        // Transaction options
        maxWait: 5000, // Maximum time to wait for a transaction slot (5 seconds)
        timeout: 10000, // Maximum time for transaction to complete (10 seconds)
      })
      
      // 9. Revalidate booking pages
      revalidatePath('/bookings')
      revalidatePath(`/bookings/${booking.id}`)
      
      // 10. Return success response
      return {
        success: true,
        bookingId: booking.id,
        status: booking.status,
        totalPrice: booking.totalPrice,
        roomsBooked: booking.roomsBooked,
        depositRequired: false, // Can be extended with deposit logic from Day 12
        idempotencyKey,
        isFromCache: false,
      }
      
    } catch (transactionError: any) {
      // Handle transaction-specific errors
      
      // Check if it's our custom insufficient inventory error
      if (transactionError.success === false) {
        return transactionError as BookingCreationResponse
      }
      
      // Handle Prisma transaction timeout
      if (transactionError.code === 'P2024') {
        return createConcurrencyError(
          'Transaction timeout: too many concurrent requests. Please try again.',
          { roomTypeId }
        )
      }
      
      // Handle deadlock or serialization failure
      if (transactionError.code === 'P2034' || transactionError.code === '40001') {
        return createConcurrencyError(
          'Concurrency conflict detected. Please try again.',
          { roomTypeId }
        )
      }
      
      // Generic transaction error
      console.error('Transaction error:', transactionError)
      return createConcurrencyError(
        'Failed to create booking due to concurrent requests. Please try again.',
        { roomTypeId }
      )
    }
    
  } catch (error: any) {
    console.error('Booking creation error:', error)
    
    // Handle validation errors
    if (error.name === 'ZodError') {
      return {
        success: false,
        error: 'INVALID_DATE_RANGE',
        message: 'Invalid booking parameters',
      }
    }
    
    // Generic error
    return {
      success: false,
      error: 'CONCURRENCY_ABORT',
      message: error.message || 'Failed to create booking',
    }
  }
}

/**
 * Cancel a booking and restore inventory atomically
 * 
 * @param bookingId - ID of booking to cancel
 * @param userId - ID of user requesting cancellation (for authorization)
 * @returns Success or error response
 */
export async function cancelConcurrentBooking(
  bookingId: string,
  userId: string
): Promise<{ success: boolean; message: string }> {
  try {
    await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      // 1. Find booking
      const booking = await tx.booking.findUnique({
        where: { id: bookingId },
      })
      
      if (!booking) {
        throw new Error('Booking not found')
      }
      
      // 2. Authorization check
      if (booking.userId !== userId) {
        throw new Error('Unauthorized: cannot cancel another user\'s booking')
      }
      
      // 3. Check if already cancelled
      if (booking.status === BookingStatus.CANCELLED) {
        throw new Error('Booking is already cancelled')
      }
      
      // 4. Update booking status
      await tx.booking.update({
        where: { id: bookingId },
        data: { status: BookingStatus.CANCELLED },
      })
      
      // 5. Restore inventory
      const dates = getBookingDateRange(booking.startDate, booking.endDate)
      await Promise.all(
        dates.map(date =>
          tx.roomInventory.updateMany({
            where: {
              roomTypeId: booking.roomTypeId,
              date,
            },
            data: {
              availableRooms: {
                increment: booking.roomsBooked,
              },
            },
          })
        )
      )
    })
    
    // Revalidate
    revalidatePath('/bookings')
    revalidatePath(`/bookings/${bookingId}`)
    
    return {
      success: true,
      message: 'Booking cancelled successfully and inventory restored',
    }
    
  } catch (error: any) {
    console.error('Cancellation error:', error)
    return {
      success: false,
      message: error.message || 'Failed to cancel booking',
    }
  }
}

/**
 * Get booking details with idempotency information
 * 
 * @param bookingId - Booking ID to retrieve
 * @returns Booking with idempotency key if exists
 */
export async function getBookingWithIdempotency(bookingId: string) {
  return await prisma.booking.findUnique({
    where: { id: bookingId },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
        },
      },
      roomType: true,
      idempotencyKey: true,
    },
  })
}
