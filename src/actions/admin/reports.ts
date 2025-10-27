'use server';

import { prisma } from '@/lib/prisma';

/**
 * Get report statistics for a date range
 */
export async function getReportStats(startDate: string, endDate: string) {
  try {
    const start = new Date(startDate);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999); // End of day

    // Fetch total bookings in date range
    const totalBookings = await prisma.booking.count({
      where: {
        createdAt: {
          gte: start,
          lte: end,
        },
      },
    });

    // Fetch total revenue (confirmed bookings)
    const revenueData = await prisma.booking.aggregate({
      where: {
        createdAt: {
          gte: start,
          lte: end,
        },
        status: 'CONFIRMED',
      },
      _sum: {
        totalPrice: true,
      },
    });

    const totalRevenue = (revenueData._sum?.totalPrice || 0) / 100; // Convert cents to dollars

    // Fetch total unique guests
    const uniqueGuests = await prisma.booking.findMany({
      where: {
        createdAt: {
          gte: start,
          lte: end,
        },
      },
      distinct: ['userId'],
      select: {
        userId: true,
      },
    });

    const totalGuests = uniqueGuests.length;

    // Calculate average occupancy
    // Get total rooms available
    const totalRooms = await prisma.roomType.aggregate({
      _sum: {
        totalRooms: true,
      },
    });

    const totalRoomCount = totalRooms._sum?.totalRooms || 1;

    // Get occupied room-nights in the date range
    const bookingsInRange = await prisma.booking.findMany({
      where: {
        OR: [
          {
            startDate: {
              gte: start,
              lte: end,
            },
          },
          {
            endDate: {
              gte: start,
              lte: end,
            },
          },
          {
            AND: [
              { startDate: { lte: start } },
              { endDate: { gte: end } },
            ],
          },
        ],
        status: 'CONFIRMED',
      },
      select: {
        startDate: true,
        endDate: true,
        roomsBooked: true,
      },
    });

    // Calculate total room-nights occupied
    let totalRoomNights = 0;
    for (const booking of bookingsInRange) {
      const checkIn = new Date(booking.startDate) > start ? new Date(booking.startDate) : start;
      const checkOut = new Date(booking.endDate) < end ? new Date(booking.endDate) : end;
      const nights = Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24));
      totalRoomNights += nights * booking.roomsBooked;
    }

    // Calculate days in range
    const daysInRange = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    const totalAvailableRoomNights = totalRoomCount * daysInRange;

    const averageOccupancy = totalAvailableRoomNights > 0 
      ? Math.round((totalRoomNights / totalAvailableRoomNights) * 100) 
      : 0;

    return {
      success: true,
      data: {
        totalBookings,
        totalRevenue,
        totalGuests,
        averageOccupancy,
      },
    };
  } catch (error) {
    console.error('[getReportStats] Error:', error);
    return {
      success: false,
      error: 'Failed to fetch report statistics',
    };
  }
}

/**
 * Get revenue breakdown by room type
 */
export async function getRevenueByRoomType(startDate: string, endDate: string) {
  try {
    const start = new Date(startDate);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);

    const revenueByType = await prisma.booking.groupBy({
      by: ['roomTypeId'],
      where: {
        createdAt: {
          gte: start,
          lte: end,
        },
        status: 'CONFIRMED',
      },
      _sum: {
        totalPrice: true,
      },
      _count: {
        _all: true,
      },
    });

    // Get room type names
    const roomTypes = await prisma.roomType.findMany({
      select: {
        id: true,
        name: true,
      },
    });

    const roomTypeMap = new Map(roomTypes.map(rt => [rt.id, rt.name]));

    const data = revenueByType.map(item => ({
      roomType: roomTypeMap.get(item.roomTypeId) || 'Unknown',
      revenue: ((item._sum?.totalPrice || 0) / 100),
      bookings: item._count?._all || 0,
    }));

    return {
      success: true,
      data,
    };
  } catch (error) {
    console.error('[getRevenueByRoomType] Error:', error);
    return {
      success: false,
      error: 'Failed to fetch revenue by room type',
    };
  }
}

/**
 * Get booking status breakdown
 */
export async function getBookingStatusBreakdown(startDate: string, endDate: string) {
  try {
    const start = new Date(startDate);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);

    const statusBreakdown = await prisma.booking.groupBy({
      by: ['status'],
      where: {
        createdAt: {
          gte: start,
          lte: end,
        },
      },
      _count: {
        _all: true,
      },
    });

    const data = statusBreakdown.map(item => ({
      status: item.status,
      count: item._count?._all || 0,
    }));

    return {
      success: true,
      data,
    };
  } catch (error) {
    console.error('[getBookingStatusBreakdown] Error:', error);
    return {
      success: false,
      error: 'Failed to fetch booking status breakdown',
    };
  }
}
