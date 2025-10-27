/**
 * Admin Dashboard Actions
 * Server actions for admin dashboard statistics and data
 */

'use server'

import { prisma } from '@/lib/prisma'
import { BookingStatus, PaymentStatus } from '@prisma/client'
import { startOfDay, endOfDay, subDays, startOfMonth, endOfMonth } from 'date-fns'

export interface DashboardStats {
  totalBookings: number
  todayCheckIns: number
  todayCheckOuts: number
  occupancyRate: number
  pendingBookings: number
  revenue: number
  avgBookingValue: number
  cancelledToday: number
  totalRooms: number
  bookedRooms: number
}

export interface RecentBooking {
  id: string
  bookingNumber: string
  guestName: string
  guestPhone: string
  guestEmail: string | null
  roomType: string
  checkIn: Date
  checkOut: Date
  guests: number
  status: BookingStatus
  paymentStatus: PaymentStatus
  amount: number
  createdAt: Date
  nights: number
  hasCheckedIn: boolean
  hasCheckedOut: boolean
  checkInTime?: Date
  checkOutTime?: Date
  lastPaymentDate?: Date
}

/**
 * Get admin dashboard statistics
 */
export async function getAdminDashboardStats(): Promise<{
  success: boolean
  data?: DashboardStats
  error?: string
}> {
  try {
    const today = new Date()
    const todayStart = startOfDay(today)
    const todayEnd = endOfDay(today)

    // Get total bookings count
    const totalBookings = await prisma.booking.count({
      where: {
        status: {
          not: BookingStatus.CANCELLED,
        },
      },
    })

    // Get today's check-ins
    const todayCheckIns = await prisma.booking.count({
      where: {
        startDate: {
          gte: todayStart,
          lte: todayEnd,
        },
        status: {
          in: [BookingStatus.CONFIRMED, BookingStatus.PROVISIONAL],
        },
      },
    })

    // Get today's check-outs
    const todayCheckOuts = await prisma.booking.count({
      where: {
        endDate: {
          gte: todayStart,
          lte: todayEnd,
        },
        status: {
          not: BookingStatus.CANCELLED,
        },
      },
    })

    // Get pending bookings
    const pendingBookings = await prisma.booking.count({
      where: {
        status: BookingStatus.PROVISIONAL,
      },
    })

    // Get cancelled today
    const cancelledToday = await prisma.booking.count({
      where: {
        status: BookingStatus.CANCELLED,
        updatedAt: {
          gte: todayStart,
          lte: todayEnd,
        },
      },
    })

    // Calculate revenue (this month)
    const monthStart = startOfMonth(today)
    const monthEnd = endOfMonth(today)
    
    const revenueResult = await prisma.booking.aggregate({
      where: {
        status: {
          not: BookingStatus.CANCELLED,
        },
        createdAt: {
          gte: monthStart,
          lte: monthEnd,
        },
      },
      _sum: {
        totalPrice: true,
      },
      _avg: {
        totalPrice: true,
      },
    })

    const revenue = revenueResult._sum.totalPrice || 0
    const avgBookingValue = revenueResult._avg.totalPrice || 0

    // Calculate occupancy rate
    const totalRoomsCount = await prisma.roomType.aggregate({
      _sum: {
        totalRooms: true,
      },
    })

    const totalRooms = totalRoomsCount._sum.totalRooms || 0

    // Get bookings for today
    const todayBookingsCount = await prisma.booking.aggregate({
      where: {
        startDate: {
          lte: todayEnd,
        },
        endDate: {
          gte: todayStart,
        },
        status: {
          not: BookingStatus.CANCELLED,
        },
      },
      _sum: {
        roomsBooked: true,
      },
    })

    const bookedRooms = todayBookingsCount._sum.roomsBooked || 0
    const occupancyRate = totalRooms > 0 ? (bookedRooms / totalRooms) * 100 : 0

    return {
      success: true,
      data: {
        totalBookings,
        todayCheckIns,
        todayCheckOuts,
        occupancyRate: Math.round(occupancyRate * 10) / 10,
        pendingBookings,
        revenue: Math.round(revenue),
        avgBookingValue: Math.round(avgBookingValue),
        cancelledToday,
        totalRooms,
        bookedRooms,
      },
    }
  } catch (error) {
    console.error('[getAdminDashboardStats] Error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch dashboard stats',
    }
  }
}

/**
 * Get recent bookings for admin dashboard with advanced filtering and analytics
 */
export async function getRecentBookings(
  limit = 10,
  filters?: {
    status?: BookingStatus[]
    paymentStatus?: PaymentStatus[]
    searchTerm?: string
    dateFrom?: Date
    dateTo?: Date
    sortBy?: 'createdAt' | 'startDate' | 'totalPrice'
    sortOrder?: 'asc' | 'desc'
  }
): Promise<{
  success: boolean
  data?: RecentBooking[]
  meta?: {
    total: number
    hasCheckedIn: number
    hasCheckedOut: number
    pendingCheckIn: number
  }
  error?: string
}> {
  try {
    // Build where clause with advanced filters
    const where: any = {}

    if (filters?.status && filters.status.length > 0) {
      where.status = { in: filters.status }
    }

    if (filters?.searchTerm) {
      where.OR = [
        { id: { contains: filters.searchTerm, mode: 'insensitive' } },
        { user: { name: { contains: filters.searchTerm, mode: 'insensitive' } } },
        { user: { email: { contains: filters.searchTerm, mode: 'insensitive' } } },
        { user: { phone: { contains: filters.searchTerm, mode: 'insensitive' } } },
      ]
    }

    if (filters?.dateFrom || filters?.dateTo) {
      where.startDate = {}
      if (filters.dateFrom) where.startDate.gte = filters.dateFrom
      if (filters.dateTo) where.startDate.lte = filters.dateTo
    }

    const bookings = await prisma.booking.findMany({
      where,
      take: limit,
      orderBy: {
        [filters?.sortBy || 'createdAt']: filters?.sortOrder || 'desc',
      },
      include: {
        user: {
          select: {
            name: true,
            phone: true,
            email: true,
          },
        },
        roomType: {
          select: {
            name: true,
          },
        },
        payments: {
          select: {
            status: true,
            amount: true,
            createdAt: true,
          },
        },
        auditLogs: {
          select: {
            action: true,
            createdAt: true,
            metadata: true,
          },
          orderBy: {
            createdAt: 'desc',
          },
        },
      },
    })

    // Get analytics metadata
    const [totalCount, checkedInCount, checkedOutCount] = await Promise.all([
      prisma.booking.count({ where }),
      prisma.bookingAuditLog.count({
        where: { action: 'CHECK_IN' },
      }),
      prisma.bookingAuditLog.count({
        where: { action: 'CHECK_OUT' },
      }),
    ])

    const formattedBookings: RecentBooking[] = await Promise.all(
      bookings.map(async (booking) => {
        // Calculate payment status
        const totalPaid = booking.payments
          .filter((p) => p.status === PaymentStatus.SUCCEEDED)
          .reduce((sum, p) => sum + p.amount, 0)

        let paymentStatus: PaymentStatus
        if (totalPaid >= booking.totalPrice) {
          paymentStatus = PaymentStatus.SUCCEEDED
        } else if (totalPaid > 0) {
          paymentStatus = PaymentStatus.PENDING // Partial - using PENDING for partial payments
        } else {
          paymentStatus = PaymentStatus.PENDING
        }

        // Analyze check-in/check-out status from audit logs
        const checkInLog = booking.auditLogs.find((log) => log.action === 'CHECK_IN')
        const checkOutLog = booking.auditLogs.find((log) => log.action === 'CHECK_OUT')

        // Calculate nights stayed
        const nights = Math.ceil(
          (new Date(booking.endDate).getTime() - new Date(booking.startDate).getTime()) /
            (1000 * 60 * 60 * 24)
        )

        return {
          id: booking.id,
          bookingNumber: booking.id.substring(0, 8).toUpperCase(),
          guestName: booking.user.name,
          guestPhone: booking.user.phone,
          guestEmail: booking.user.email,
          roomType: booking.roomType.name,
          checkIn: booking.startDate,
          checkOut: booking.endDate,
          guests: booking.roomsBooked,
          status: booking.status,
          paymentStatus,
          amount: booking.totalPrice,
          createdAt: booking.createdAt,
          nights,
          hasCheckedIn: !!checkInLog,
          hasCheckedOut: !!checkOutLog,
          checkInTime: checkInLog?.createdAt,
          checkOutTime: checkOutLog?.createdAt,
          lastPaymentDate: booking.payments[0]?.createdAt,
        }
      })
    )

    // Apply payment status filter after formatting (since it's calculated)
    let filteredBookings = formattedBookings
    if (filters?.paymentStatus && filters.paymentStatus.length > 0) {
      filteredBookings = formattedBookings.filter((b) =>
        filters.paymentStatus!.includes(b.paymentStatus)
      )
    }

    return {
      success: true,
      data: filteredBookings,
      meta: {
        total: totalCount,
        hasCheckedIn: checkedInCount,
        hasCheckedOut: checkedOutCount,
        pendingCheckIn: totalCount - checkedInCount,
      },
    }
  } catch (error) {
    console.error('[getRecentBookings] Error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch recent bookings',
    }
  }
}

/**
 * Get revenue data for charts (last 7 days)
 */
export async function getRevenueData(days = 7): Promise<{
  success: boolean
  data?: Array<{
    date: string
    totalRevenue: number
    paidRevenue: number
    pendingRevenue: number
    bookingCount: number
  }>
  error?: string
}> {
  try {
    const today = new Date()
    const startDate = subDays(today, days - 1)

    const dailyData = []

    for (let i = 0; i < days; i++) {
      const currentDate = subDays(today, days - 1 - i)
      const dayStart = startOfDay(currentDate)
      const dayEnd = endOfDay(currentDate)

      const bookings = await prisma.booking.findMany({
        where: {
          createdAt: {
            gte: dayStart,
            lte: dayEnd,
          },
          status: {
            not: BookingStatus.CANCELLED,
          },
        },
        include: {
          payments: {
            where: {
              status: PaymentStatus.SUCCEEDED,
            },
          },
        },
      })

      const totalRevenue = bookings.reduce((sum, b) => sum + b.totalPrice, 0)
      const paidRevenue = bookings.reduce((sum, b) => {
        const paid = b.payments.reduce((pSum, p) => pSum + p.amount, 0)
        return sum + paid
      }, 0)

      dailyData.push({
        date: currentDate.toISOString().split('T')[0] || '',
        totalRevenue,
        paidRevenue,
        pendingRevenue: totalRevenue - paidRevenue,
        bookingCount: bookings.length,
      })
    }

    return {
      success: true,
      data: dailyData,
    }
  } catch (error) {
    console.error('[getRevenueData] Error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch revenue data',
    }
  }
}
