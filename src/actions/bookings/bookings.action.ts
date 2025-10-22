'use server'

// ==========================================
// BOOKINGS SERVER ACTIONS
// ==========================================
// Next.js Server Actions for booking operations
// These run on the server and can access the database

import {
  type Booking,
  type CreateBookingPayload,
  type UpdateBookingPayload,
  type CancelBookingPayload,
  type BookingFilters,
  type BookingSortOptions,
  type PaginatedBookingsResponse,
  type BookingStats,
  BookingStatus,
  PaymentStatus,
  RoomType,
  type FetchBookingsResponse,
  type CreateBookingResponse,
  type UpdateBookingResponse,
  type DeleteBookingResponse,
  type BookingStatsResponse,
} from '@/types/booking.types'

// Note: These are placeholder implementations
// Replace with actual Prisma database calls when Booking model is added to schema

// ==========================================
// MOCK DATA (Remove when implementing real database)
// ==========================================

/**
 * Mock bookings data for development
 * Replace this with actual Prisma queries
 */
const mockBookings: Booking[] = [
  {
    id: '1',
    bookingNumber: 'BK-2024-001',
    guestId: 'guest-1',
    guest: {
      id: 'guest-1',
      name: 'John Doe',
      email: 'john@example.com',
      phone: '+1234567890',
    },
    roomId: 'room-101',
    room: {
      id: 'room-101',
      roomNumber: '101',
      type: RoomType.DELUXE,
      floor: 1,
      pricePerNight: 150,
      maxOccupancy: 2,
      amenities: ['WiFi', 'TV', 'Mini Bar'],
      isAvailable: true,
    },
    checkInDate: '2024-11-01',
    checkOutDate: '2024-11-03',
    numberOfNights: 2,
    numberOfGuests: 2,
    numberOfAdults: 2,
    numberOfChildren: 0,
    roomRate: 150,
    totalAmount: 300,
    taxAmount: 30,
    discount: 0,
    finalAmount: 330,
    status: 'CONFIRMED' as BookingStatus,
    paymentStatus: 'PAID' as PaymentStatus,
    createdBy: 'user-1',
    createdAt: '2024-10-20T10:00:00Z',
    updatedAt: '2024-10-20T10:00:00Z',
  },
  {
    id: '2',
    bookingNumber: 'BK-2024-002',
    guestId: 'guest-2',
    guest: {
      id: 'guest-2',
      name: 'Jane Smith',
      email: 'jane@example.com',
      phone: '+1234567891',
    },
    roomId: 'room-102',
    room: {
      id: 'room-102',
      roomNumber: '102',
      type: RoomType.SUITE,
      floor: 1,
      pricePerNight: 250,
      maxOccupancy: 4,
      amenities: ['WiFi', 'TV', 'Mini Bar', 'Jacuzzi'],
      isAvailable: true,
    },
    checkInDate: '2024-11-05',
    checkOutDate: '2024-11-07',
    numberOfNights: 2,
    numberOfGuests: 3,
    numberOfAdults: 2,
    numberOfChildren: 1,
    roomRate: 250,
    totalAmount: 500,
    taxAmount: 50,
    discount: 50,
    finalAmount: 500,
    status: 'PENDING' as BookingStatus,
    paymentStatus: 'PENDING' as PaymentStatus,
    createdBy: 'user-1',
    createdAt: '2024-10-21T14:30:00Z',
    updatedAt: '2024-10-21T14:30:00Z',
  },
]

// ==========================================
// HELPER FUNCTIONS
// ==========================================

/**
 * Calculate number of nights between dates
 */
function calculateNights(checkIn: string, checkOut: string): number {
  const start = new Date(checkIn)
  const end = new Date(checkOut)
  const diff = end.getTime() - start.getTime()
  return Math.ceil(diff / (1000 * 60 * 60 * 24))
}

/**
 * Generate booking number
 */
function generateBookingNumber(): string {
  const year = new Date().getFullYear()
  const random = Math.floor(Math.random() * 100000)
    .toString()
    .padStart(6, '0')
  return `BK-${year}-${random}`
}

/**
 * Calculate booking amounts
 */
function calculateAmounts(roomRate: number, nights: number) {
  const totalAmount = roomRate * nights
  const taxAmount = totalAmount * 0.1 // 10% tax
  const discount = 0
  const finalAmount = totalAmount + taxAmount - discount

  return {
    totalAmount,
    taxAmount,
    discount,
    finalAmount,
  }
}

// ==========================================
// FETCH BOOKINGS
// ==========================================

/**
 * Get paginated bookings with filters and sorting
 * 
 * @example
 * const result = await getBookingsAction({ page: 1, pageSize: 10 })
 */
export async function getBookingsAction(params: {
  page?: number
  pageSize?: number
  filters?: BookingFilters
  sortOptions?: BookingSortOptions
}): Promise<FetchBookingsResponse> {
  try {
    const { page = 1, pageSize = 10, filters = {}, sortOptions } = params

    // TODO: Replace with actual Prisma query
    // Example Prisma query:
    // const bookings = await prisma.booking.findMany({
    //   where: {
    //     status: filters.status,
    //     guestId: filters.guestId,
    //     // ... more filters
    //   },
    //   include: {
    //     guest: true,
    //     room: true,
    //     payment: true,
    //   },
    //   orderBy: {
    //     [sortOptions?.field || 'checkInDate']: sortOptions?.order || 'desc',
    //   },
    //   skip: (page - 1) * pageSize,
    //   take: pageSize,
    // })

    // Mock implementation
    let filteredBookings = [...mockBookings]

    // Apply status filter
    if (filters.status) {
      const statuses = Array.isArray(filters.status) ? filters.status : [filters.status]
      filteredBookings = filteredBookings.filter((b) => statuses.includes(b.status))
    }

    // Apply guest filter
    if (filters.guestId) {
      filteredBookings = filteredBookings.filter((b) => b.guestId === filters.guestId)
    }

    // Apply search filter
    if (filters.search) {
      const query = filters.search.toLowerCase()
      filteredBookings = filteredBookings.filter(
        (b) =>
          b.bookingNumber.toLowerCase().includes(query) ||
          b.guest.name.toLowerCase().includes(query)
      )
    }

    // Apply sorting
    if (sortOptions) {
      filteredBookings.sort((a, b) => {
        const aValue = a[sortOptions.field]
        const bValue = b[sortOptions.field]
        
        if (typeof aValue === 'string' && typeof bValue === 'string') {
          return sortOptions.order === 'asc'
            ? aValue.localeCompare(bValue)
            : bValue.localeCompare(aValue)
        }
        
        if (typeof aValue === 'number' && typeof bValue === 'number') {
          return sortOptions.order === 'asc' ? aValue - bValue : bValue - aValue
        }
        
        return 0
      })
    }

    // Pagination
    const total = filteredBookings.length
    const totalPages = Math.ceil(total / pageSize)
    const startIndex = (page - 1) * pageSize
    const paginatedBookings = filteredBookings.slice(startIndex, startIndex + pageSize)

    const response: PaginatedBookingsResponse = {
      bookings: paginatedBookings,
      total,
      page,
      pageSize,
      totalPages,
    }

    return {
      success: true,
      data: response,
    }
  } catch (error: any) {
    console.error('[getBookingsAction] Error:', error)
    return {
      success: false,
      error: error.message || 'Failed to fetch bookings',
    }
  }
}

/**
 * Get single booking by ID
 */
export async function getBookingByIdAction(bookingId: string): Promise<CreateBookingResponse> {
  try {
    // TODO: Replace with Prisma query
    // const booking = await prisma.booking.findUnique({
    //   where: { id: bookingId },
    //   include: { guest: true, room: true, payment: true },
    // })

    const booking = mockBookings.find((b) => b.id === bookingId)

    if (!booking) {
      return {
        success: false,
        error: 'Booking not found',
      }
    }

    return {
      success: true,
      data: booking,
    }
  } catch (error: any) {
    console.error('[getBookingByIdAction] Error:', error)
    return {
      success: false,
      error: error.message || 'Failed to fetch booking',
    }
  }
}

// ==========================================
// CREATE BOOKING
// ==========================================

/**
 * Create new booking
 */
export async function createBookingAction(
  payload: CreateBookingPayload
): Promise<CreateBookingResponse> {
  try {
    // TODO: Replace with Prisma transaction
    // const booking = await prisma.booking.create({
    //   data: {
    //     bookingNumber: generateBookingNumber(),
    //     guestId: payload.guestId,
    //     roomId: payload.roomId,
    //     checkInDate: payload.checkInDate,
    //     checkOutDate: payload.checkOutDate,
    //     // ... more fields
    //   },
    //   include: { guest: true, room: true },
    // })

    // Mock implementation
    const nights = calculateNights(payload.checkInDate, payload.checkOutDate)
    const roomRate = 150 // TODO: Get from room
    const amounts = calculateAmounts(roomRate, nights)

    const newBooking: Booking = {
      id: `booking-${Date.now()}`,
      bookingNumber: generateBookingNumber(),
      guestId: payload.guestId || 'temp-guest',
      guest: {
        id: payload.guestId || 'temp-guest',
        name: 'New Guest',
        email: 'guest@example.com',
        phone: '+1234567890',
      },
      roomId: payload.roomId,
      room: {
        id: payload.roomId,
        roomNumber: '103',
        type: RoomType.DOUBLE,
        floor: 1,
        pricePerNight: roomRate,
        maxOccupancy: 2,
        amenities: ['WiFi', 'TV'],
        isAvailable: true,
      },
      checkInDate: payload.checkInDate,
      checkOutDate: payload.checkOutDate,
      numberOfNights: nights,
      numberOfGuests: payload.numberOfGuests,
      numberOfAdults: payload.numberOfAdults,
      numberOfChildren: payload.numberOfChildren,
      roomRate,
      ...amounts,
      status: BookingStatus.PENDING,
      paymentStatus: PaymentStatus.PENDING,
      createdBy: 'current-user', // TODO: Get from session
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    } as Booking

    // Add to mock data
    mockBookings.push(newBooking)

    return {
      success: true,
      data: newBooking,
      message: 'Booking created successfully',
    }
  } catch (error: any) {
    console.error('[createBookingAction] Error:', error)
    return {
      success: false,
      error: error.message || 'Failed to create booking',
    }
  }
}

// ==========================================
// UPDATE BOOKING
// ==========================================

/**
 * Update existing booking
 */
export async function updateBookingAction(
  payload: UpdateBookingPayload
): Promise<UpdateBookingResponse> {
  try {
    // TODO: Replace with Prisma update
    // const booking = await prisma.booking.update({
    //   where: { id: payload.id },
    //   data: { ...payload },
    //   include: { guest: true, room: true },
    // })

    const index = mockBookings.findIndex((b) => b.id === payload.id)
    
    if (index === -1) {
      return {
        success: false,
        error: 'Booking not found',
      }
    }

    const existing = mockBookings[index]

    // Update fields - merge with existing booking
    const updatedBooking = {
      ...existing,
      ...(payload.roomId !== undefined && { roomId: payload.roomId }),
      ...(payload.checkInDate !== undefined && { checkInDate: payload.checkInDate }),
      ...(payload.checkOutDate !== undefined && { checkOutDate: payload.checkOutDate }),
      ...(payload.numberOfGuests !== undefined && { numberOfGuests: payload.numberOfGuests }),
      ...(payload.numberOfAdults !== undefined && { numberOfAdults: payload.numberOfAdults }),
      ...(payload.numberOfChildren !== undefined && { numberOfChildren: payload.numberOfChildren }),
      ...(payload.status !== undefined && { status: payload.status }),
      ...(payload.paymentStatus !== undefined && { paymentStatus: payload.paymentStatus }),
      ...(payload.specialRequests !== undefined && { specialRequests: payload.specialRequests }),
      ...(payload.notes !== undefined && { notes: payload.notes }),
      updatedAt: new Date().toISOString(),
    } as Booking

    // Recalculate amounts if dates changed
    if (payload.checkInDate || payload.checkOutDate) {
      const nights = calculateNights(
        updatedBooking.checkInDate,
        updatedBooking.checkOutDate
      )
      const amounts = calculateAmounts(updatedBooking.roomRate, nights)
      Object.assign(updatedBooking, { numberOfNights: nights, ...amounts })
    }

    mockBookings[index] = updatedBooking

    return {
      success: true,
      data: updatedBooking,
      message: 'Booking updated successfully',
    }
  } catch (error: any) {
    console.error('[updateBookingAction] Error:', error)
    return {
      success: false,
      error: error.message || 'Failed to update booking',
    }
  }
}

// ==========================================
// CANCEL BOOKING
// ==========================================

/**
 * Cancel booking
 */
export async function cancelBookingAction(
  payload: CancelBookingPayload
): Promise<UpdateBookingResponse> {
  try {
    // TODO: Replace with Prisma transaction (update booking + handle refund)
    const index = mockBookings.findIndex((b) => b.id === payload.id)
    
    if (index === -1) {
      return {
        success: false,
        error: 'Booking not found',
      }
    }

    const cancelledBooking = {
      ...mockBookings[index],
      status: BookingStatus.CANCELLED,
      cancelledAt: new Date().toISOString(),
      cancelledBy: 'current-user',
      cancellationReason: payload.reason,
      updatedAt: new Date().toISOString(),
    } as Booking

    mockBookings[index] = cancelledBooking

    return {
      success: true,
      data: cancelledBooking,
      message: 'Booking cancelled successfully',
    }
  } catch (error: any) {
    console.error('[cancelBookingAction] Error:', error)
    return {
      success: false,
      error: error.message || 'Failed to cancel booking',
    }
  }
}

// ==========================================
// DELETE BOOKING
// ==========================================

/**
 * Delete booking (hard delete)
 */
export async function deleteBookingAction(bookingId: string): Promise<DeleteBookingResponse> {
  try {
    // TODO: Replace with Prisma delete
    // await prisma.booking.delete({ where: { id: bookingId } })

    const index = mockBookings.findIndex((b) => b.id === bookingId)
    
    if (index === -1) {
      return {
        success: false,
        error: 'Booking not found',
      }
    }

    mockBookings.splice(index, 1)

    return {
      success: true,
      data: { id: bookingId },
      message: 'Booking deleted successfully',
    }
  } catch (error: any) {
    console.error('[deleteBookingAction] Error:', error)
    return {
      success: false,
      error: error.message || 'Failed to delete booking',
    }
  }
}

// ==========================================
// STATISTICS
// ==========================================

/**
 * Get booking statistics
 */
export async function getBookingStatsAction(): Promise<BookingStatsResponse> {
  try {
    // TODO: Replace with Prisma aggregation queries
    const stats: BookingStats = {
      total: mockBookings.length,
      pending: mockBookings.filter((b) => b.status === 'PENDING').length,
      confirmed: mockBookings.filter((b) => b.status === 'CONFIRMED').length,
      checkedIn: mockBookings.filter((b) => b.status === 'CHECKED_IN').length,
      checkedOut: mockBookings.filter((b) => b.status === 'CHECKED_OUT').length,
      cancelled: mockBookings.filter((b) => b.status === 'CANCELLED').length,
      noShow: mockBookings.filter((b) => b.status === 'NO_SHOW').length,
      totalRevenue: mockBookings.reduce((sum, b) => sum + b.finalAmount, 0),
      pendingPayments: mockBookings
        .filter((b) => b.paymentStatus === 'PENDING')
        .reduce((sum, b) => sum + b.finalAmount, 0),
      occupancyRate: 75, // TODO: Calculate from actual room data
      totalRooms: 50,
      occupiedRooms: 38,
      availableRooms: 12,
    }

    return {
      success: true,
      data: stats,
    }
  } catch (error: any) {
    console.error('[getBookingStatsAction] Error:', error)
    return {
      success: false,
      error: error.message || 'Failed to fetch statistics',
    }
  }
}
