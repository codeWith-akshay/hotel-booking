/**
 * Optimized Database Query Helpers
 * 
 * Collection of optimized query patterns to prevent N+1 queries
 * and improve database performance.
 * 
 * Key optimizations:
 * - Use `include` strategically to fetch related data in single query
 * - Use `select` to fetch only needed fields
 * - Leverage composite indexes
 * - Batch queries when possible
 * - Use aggregate functions in database instead of JS
 */

import { prisma } from '@/lib/prisma'
import { Prisma, BookingStatus } from '@prisma/client'

// ==========================================
// ROOM TYPE QUERIES
// ==========================================

/**
 * Fetch all room types with inventory count (optimized)
 * Uses single query instead of N+1
 */
export async function getRoomTypesWithInventory(date?: Date) {
  return await prisma.roomType.findMany({
    select: {
      id: true,
      name: true,
      description: true,
      pricePerNight: true,
      totalRooms: true,
      createdAt: true,
      updatedAt: true,
      // Efficiently fetch today's inventory
      ...(date && {
        inventory: {
          where: { date },
          select: {
            availableRooms: true,
            date: true,
          },
          take: 1,
        },
      }),
    },
    orderBy: { name: 'asc' },
  })
}

/**
 * Fetch single room type with full inventory in date range
 */
export async function getRoomTypeWithInventory(
  roomTypeId: string,
  startDate: Date,
  endDate: Date
) {
  return await prisma.roomType.findUnique({
    where: { id: roomTypeId },
    include: {
      inventory: {
        where: {
          date: {
            gte: startDate,
            lte: endDate,
          },
        },
        orderBy: { date: 'asc' },
      },
    },
  })
}

// ==========================================
// BOOKING QUERIES
// ==========================================

/**
 * Fetch user's bookings with room type info (optimized, prevents N+1)
 */
export async function getUserBookingsWithRoomType(
  userId: string,
  options?: {
    status?: BookingStatus
    limit?: number
    includePayments?: boolean
  }
) {
  return await prisma.booking.findMany({
    where: {
      userId,
      ...(options?.status && { status: options.status }),
    },
    select: {
      id: true,
      startDate: true,
      endDate: true,
      status: true,
      totalPrice: true,
      roomsBooked: true,
      depositAmount: true,
      isDepositPaid: true,
      createdAt: true,
      updatedAt: true,
      // Fetch related room type in single query
      roomType: {
        select: {
          id: true,
          name: true,
          description: true,
          pricePerNight: true,
        },
      },
      // Conditionally include payments
      ...(options?.includePayments && {
        payments: {
          select: {
            id: true,
            amount: true,
            status: true,
            provider: true,
            paidAt: true,
          },
          orderBy: { createdAt: 'desc' },
        },
      }),
    },
    orderBy: { createdAt: 'desc' },
    ...(options?.limit && { take: options.limit }),
  })
}

/**
 * Fetch bookings for date range with user and room info (admin view)
 */
export async function getBookingsForDateRange(
  startDate: Date,
  endDate: Date,
  options?: {
    roomTypeId?: string
    status?: BookingStatus
    includeUser?: boolean
  }
) {
  return await prisma.booking.findMany({
    where: {
      AND: [
        {
          startDate: { lte: endDate },
          endDate: { gte: startDate },
        },
        ...(options?.roomTypeId ? [{ roomTypeId: options.roomTypeId }] : []),
        ...(options?.status ? [{ status: options.status }] : []),
      ],
    },
    select: {
      id: true,
      startDate: true,
      endDate: true,
      status: true,
      totalPrice: true,
      roomsBooked: true,
      createdAt: true,
      roomType: {
        select: {
          id: true,
          name: true,
          pricePerNight: true,
        },
      },
      ...(options?.includeUser && {
        user: {
          select: {
            id: true,
            name: true,
            phone: true,
            email: true,
          },
        },
      }),
    },
    orderBy: { startDate: 'asc' },
  })
}

/**
 * Get booking with all related data (full details)
 */
export async function getBookingDetails(bookingId: string) {
  return await prisma.booking.findUnique({
    where: { id: bookingId },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          phone: true,
          email: true,
          ircaMembershipId: true,
        },
      },
      roomType: true,
      payments: {
        orderBy: { createdAt: 'desc' },
      },
      invoice: true,
      auditLogs: {
        include: {
          admin: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      },
    },
  })
}

// ==========================================
// AVAILABILITY QUERIES (HIGHLY OPTIMIZED)
// ==========================================

/**
 * Check availability for specific room type and date range
 * Uses composite index [roomTypeId, date, availableRooms]
 */
export async function checkRoomAvailability(
  roomTypeId: string,
  startDate: Date,
  endDate: Date,
  roomsNeeded: number = 1
): Promise<{ available: boolean; minAvailable: number }> {
  // Get inventory for all dates in range (single query with index)
  const inventory = await prisma.roomInventory.findMany({
    where: {
      roomTypeId,
      date: {
        gte: startDate,
        lt: endDate, // Exclude checkout date
      },
    },
    select: {
      date: true,
      availableRooms: true,
    },
    orderBy: { date: 'asc' },
  })

  if (inventory.length === 0) {
    return { available: false, minAvailable: 0 }
  }

  // Find minimum available rooms across all dates
  const minAvailable = Math.min(...inventory.map(inv => inv.availableRooms))
  
  return {
    available: minAvailable >= roomsNeeded,
    minAvailable,
  }
}

/**
 * Get availability for all room types in date range
 * Optimized with single query and aggregation
 */
export async function getAllRoomAvailability(
  startDate: Date,
  endDate: Date
) {
  // Get all room types
  const roomTypes = await prisma.roomType.findMany({
    select: {
      id: true,
      name: true,
      description: true,
      pricePerNight: true,
      totalRooms: true,
    },
  })

  // Get inventory for all room types in one query
  const inventory = await prisma.roomInventory.findMany({
    where: {
      date: {
        gte: startDate,
        lt: endDate,
      },
    },
    select: {
      roomTypeId: true,
      date: true,
      availableRooms: true,
    },
  })

  // Group by room type and find minimum
  const availabilityMap = new Map<string, number>()
  
  for (const inv of inventory) {
    const current = availabilityMap.get(inv.roomTypeId) ?? Infinity
    availabilityMap.set(inv.roomTypeId, Math.min(current, inv.availableRooms))
  }

  // Combine data
  return roomTypes.map(roomType => ({
    ...roomType,
    minAvailableRooms: availabilityMap.get(roomType.id) ?? 0,
    isAvailable: (availabilityMap.get(roomType.id) ?? 0) > 0,
  }))
}

// ==========================================
// AGGREGATE QUERIES (REPORTS)
// ==========================================

/**
 * Get booking statistics for date range (single aggregation query)
 */
export async function getBookingStatistics(
  startDate: Date,
  endDate: Date,
  roomTypeId?: string
) {
  // Use aggregate to calculate stats in database
  const stats = await prisma.booking.aggregate({
    where: {
      createdAt: {
        gte: startDate,
        lte: endDate,
      },
      ...(roomTypeId && { roomTypeId }),
    },
    _count: {
      id: true,
    },
    _sum: {
      totalPrice: true,
      roomsBooked: true,
    },
    _avg: {
      totalPrice: true,
    },
  })

  // Get status breakdown in single query
  const statusBreakdown = await prisma.booking.groupBy({
    by: ['status'],
    where: {
      createdAt: {
        gte: startDate,
        lte: endDate,
      },
      ...(roomTypeId && { roomTypeId }),
    },
    _count: {
      id: true,
    },
  })

  return {
    totalBookings: stats._count.id,
    totalRevenue: stats._sum.totalPrice ?? 0,
    totalRoomsBooked: stats._sum.roomsBooked ?? 0,
    averageBookingValue: stats._avg.totalPrice ?? 0,
    statusBreakdown: statusBreakdown.reduce((acc, item) => {
      acc[item.status] = item._count.id
      return acc
    }, {} as Record<string, number>),
  }
}

/**
 * Get occupancy rate for date range (optimized calculation)
 */
export async function getOccupancyRate(
  startDate: Date,
  endDate: Date,
  roomTypeId?: string
) {
  // Get total capacity (room-nights)
  const roomTypes = await prisma.roomType.findMany({
    where: roomTypeId ? { id: roomTypeId } : undefined,
    select: {
      id: true,
      name: true,
      totalRooms: true,
    },
  })

  // Calculate date range length
  const daysDiff = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))
  
  const totalCapacity = roomTypes.reduce(
    (sum, rt) => sum + (rt.totalRooms * daysDiff),
    0
  )

  // Get booked room-nights using aggregation
  const bookings = await prisma.booking.findMany({
    where: {
      startDate: { lte: endDate },
      endDate: { gte: startDate },
      status: { in: ['CONFIRMED', 'PROVISIONAL'] },
      ...(roomTypeId && { roomTypeId }),
    },
    select: {
      startDate: true,
      endDate: true,
      roomsBooked: true,
    },
  })

  // Calculate booked room-nights
  let bookedRoomNights = 0
  for (const booking of bookings) {
    const bookingStart = booking.startDate < startDate ? startDate : booking.startDate
    const bookingEnd = booking.endDate > endDate ? endDate : booking.endDate
    const nights = Math.ceil((bookingEnd.getTime() - bookingStart.getTime()) / (1000 * 60 * 60 * 24))
    bookedRoomNights += nights * booking.roomsBooked
  }

  const occupancyRate = totalCapacity > 0 ? (bookedRoomNights / totalCapacity) * 100 : 0

  return {
    totalCapacity,
    bookedRoomNights,
    occupancyRate: Number(occupancyRate.toFixed(2)),
    roomTypes: roomTypes.length,
  }
}

// ==========================================
// PAYMENT QUERIES
// ==========================================

/**
 * Get payment summary for user (optimized)
 */
export async function getUserPaymentSummary(userId: string) {
  const summary = await prisma.payment.aggregate({
    where: { userId },
    _count: { id: true },
    _sum: { amount: true },
  })

  const statusBreakdown = await prisma.payment.groupBy({
    by: ['status'],
    where: { userId },
    _count: { id: true },
    _sum: { amount: true },
  })

  return {
    totalPayments: summary._count.id,
    totalAmount: summary._sum.amount ?? 0,
    byStatus: statusBreakdown.reduce((acc, item) => {
      acc[item.status] = {
        count: item._count.id,
        amount: item._sum.amount ?? 0,
      }
      return acc
    }, {} as Record<string, { count: number; amount: number }>),
  }
}

// ==========================================
// BATCH OPERATIONS
// ==========================================

/**
 * Batch fetch multiple bookings by IDs (single query)
 */
export async function getBookingsByIds(bookingIds: string[]) {
  return await prisma.booking.findMany({
    where: {
      id: { in: bookingIds },
    },
    include: {
      roomType: {
        select: {
          id: true,
          name: true,
        },
      },
      user: {
        select: {
          id: true,
          name: true,
          phone: true,
        },
      },
    },
  })
}

/**
 * Batch check availability for multiple room types
 */
export async function batchCheckAvailability(
  checks: Array<{
    roomTypeId: string
    startDate: Date
    endDate: Date
    roomsNeeded: number
  }>
) {
  // Collect all unique date ranges
  const allDates = checks.flatMap(check => [check.startDate, check.endDate])
  const minDate = new Date(Math.min(...allDates.map(d => d.getTime())))
  const maxDate = new Date(Math.max(...allDates.map(d => d.getTime())))

  // Fetch all inventory in one query
  const inventory = await prisma.roomInventory.findMany({
    where: {
      date: {
        gte: minDate,
        lt: maxDate,
      },
      roomTypeId: {
        in: checks.map(c => c.roomTypeId),
      },
    },
    select: {
      roomTypeId: true,
      date: true,
      availableRooms: true,
    },
  })

  // Group by room type and date
  const inventoryMap = new Map<string, Map<string, number>>()
  
  for (const inv of inventory) {
    if (!inventoryMap.has(inv.roomTypeId)) {
      inventoryMap.set(inv.roomTypeId, new Map())
    }
    const dateKey = inv.date.toISOString().split('T')[0]
    inventoryMap.get(inv.roomTypeId)!.set(dateKey, inv.availableRooms)
  }

  // Check each request
  return checks.map(check => {
    const roomInventory = inventoryMap.get(check.roomTypeId)
    if (!roomInventory) {
      return { ...check, available: false, minAvailable: 0 }
    }

    // Check all dates in range
    let minAvailable = Infinity
    const currentDate = new Date(check.startDate)
    
    while (currentDate < check.endDate) {
      const dateKey = currentDate.toISOString().split('T')[0]
      const available = roomInventory.get(dateKey) ?? 0
      minAvailable = Math.min(minAvailable, available)
      currentDate.setDate(currentDate.getDate() + 1)
    }

    return {
      ...check,
      available: minAvailable >= check.roomsNeeded,
      minAvailable: minAvailable === Infinity ? 0 : minAvailable,
    }
  })
}
