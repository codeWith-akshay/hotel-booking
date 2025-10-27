/**
 * Super Admin Dashboard Actions
 * Server actions for system-wide statistics and user management
 */

'use server'

import { prisma } from '@/lib/prisma'
import { RoleName, BookingStatus } from '@prisma/client'
import { startOfMonth, endOfMonth, subDays } from 'date-fns'

// ==========================================
// TYPE DEFINITIONS
// ==========================================

export interface SystemStats {
  totalUsers: number
  totalAdmins: number
  totalMembers: number
  activeUsers: number
  totalBookings: number
  totalRevenue: number
  totalRoomTypes: number
  totalRooms: number
}

export interface SystemUser {
  id: string
  name: string
  email: string | null
  phone: string
  role: RoleName
  totalBookings: number
  totalSpent: number
  lastBookingDate: Date | null
  createdAt: Date
}

export interface SystemHealth {
  databaseStatus: 'HEALTHY' | 'WARNING' | 'CRITICAL'
  totalBookings: number
  totalUsers: number
  totalRoomTypes: number
  recentErrors: number
}

export interface RevenueByMonth {
  month: string
  revenue: number
  bookings: number
}

// ==========================================
// SYSTEM STATISTICS
// ==========================================

/**
 * Get system-wide statistics for super admin dashboard
 */
export async function getSystemStats(): Promise<{
  success: boolean
  data?: SystemStats
  error?: string
}> {
  try {
    const today = new Date()
    const monthStart = startOfMonth(today)
    const monthEnd = endOfMonth(today)

    // Get user counts by role
    const [totalUsers, adminUsers, memberUsers] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({
        where: {
          role: {
            name: RoleName.ADMIN,
          },
        },
      }),
      prisma.user.count({
        where: {
          role: {
            name: RoleName.MEMBER,
          },
        },
      }),
    ])

    // Get users who have made bookings in last 30 days
    const thirtyDaysAgo = subDays(today, 30)
    const activeUsers = await prisma.user.count({
      where: {
        bookings: {
          some: {
            createdAt: {
              gte: thirtyDaysAgo,
            },
          },
        },
      },
    })

    // Get total bookings
    const totalBookings = await prisma.booking.count()

    // Calculate total revenue (all-time)
    const revenueResult = await prisma.booking.aggregate({
      where: {
        status: {
          not: BookingStatus.CANCELLED,
        },
      },
      _sum: {
        totalPrice: true,
      },
    })

    const totalRevenue = revenueResult._sum.totalPrice || 0

    // Get room statistics
    const [totalRoomTypes, totalRoomsResult] = await Promise.all([
      prisma.roomType.count(),
      prisma.roomType.aggregate({
        _sum: {
          totalRooms: true,
        },
      }),
    ])

    const totalRooms = totalRoomsResult._sum.totalRooms || 0

    return {
      success: true,
      data: {
        totalUsers,
        totalAdmins: adminUsers,
        totalMembers: memberUsers,
        activeUsers,
        totalBookings,
        totalRevenue,
        totalRoomTypes,
        totalRooms,
      },
    }
  } catch (error) {
    console.error('[getSystemStats] Error:', error)
    return {
      success: false,
      error: 'Failed to fetch system statistics',
    }
  }
}

// ==========================================
// USER MANAGEMENT
// ==========================================

/**
 * Get all system users with booking statistics
 */
export async function getSystemUsers(params?: {
  role?: RoleName
  search?: string
  limit?: number
  offset?: number
}): Promise<{
  success: boolean
  data?: SystemUser[]
  total?: number
  error?: string
}> {
  try {
    const { role, search, limit = 50, offset = 0 } = params || {}

    // Build where clause
    const where: any = {}

    if (role) {
      where.role = {
        name: role,
      }
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search, mode: 'insensitive' } },
      ]
    }

    // Get users with booking aggregations
    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          createdAt: true,
          role: {
            select: {
              name: true,
            },
          },
          bookings: {
            where: {
              status: {
                not: BookingStatus.CANCELLED,
              },
            },
            select: {
              totalPrice: true,
              createdAt: true,
            },
            orderBy: {
              createdAt: 'desc',
            },
            take: 1,
          },
          _count: {
            select: {
              bookings: {
                where: {
                  status: {
                    not: BookingStatus.CANCELLED,
                  },
                },
              },
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        take: limit,
        skip: offset,
      }),
      prisma.user.count({ where }),
    ])

    // Transform data
    const systemUsers: SystemUser[] = users.map((user) => ({
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role.name,
      totalBookings: user._count.bookings,
      totalSpent: user.bookings.reduce((sum, b) => sum + b.totalPrice, 0),
      lastBookingDate: user.bookings[0]?.createdAt || null,
      createdAt: user.createdAt,
    }))

    return {
      success: true,
      data: systemUsers,
      total,
    }
  } catch (error) {
    console.error('[getSystemUsers] Error:', error)
    return {
      success: false,
      error: 'Failed to fetch system users',
    }
  }
}

// ==========================================
// SYSTEM HEALTH
// ==========================================

/**
 * Get system health metrics
 */
export async function getSystemHealth(): Promise<{
  success: boolean
  data?: SystemHealth
  error?: string
}> {
  try {
    const startTime = Date.now()

    // Perform basic database queries to check health
    const [totalBookings, totalUsers, totalRoomTypes] = await Promise.all([
      prisma.booking.count(),
      prisma.user.count(),
      prisma.roomType.count(),
    ])

    const queryTime = Date.now() - startTime

    // Determine database status based on query time
    let databaseStatus: 'HEALTHY' | 'WARNING' | 'CRITICAL' = 'HEALTHY'
    if (queryTime > 2000) {
      databaseStatus = 'CRITICAL'
    } else if (queryTime > 1000) {
      databaseStatus = 'WARNING'
    }

    // In a real system, you'd fetch actual error logs
    // For now, we'll return 0
    const recentErrors = 0

    return {
      success: true,
      data: {
        databaseStatus,
        totalBookings,
        totalUsers,
        totalRoomTypes,
        recentErrors,
      },
    }
  } catch (error) {
    console.error('[getSystemHealth] Error:', error)
    return {
      success: false,
      data: {
        databaseStatus: 'CRITICAL',
        totalBookings: 0,
        totalUsers: 0,
        totalRoomTypes: 0,
        recentErrors: 1,
      },
    }
  }
}

// ==========================================
// REVENUE ANALYTICS
// ==========================================

/**
 * Get revenue by month for the last 12 months
 */
export async function getRevenueByMonth(): Promise<{
  success: boolean
  data?: RevenueByMonth[]
  error?: string
}> {
  try {
    const today = new Date()
    const startDate = subDays(today, 365) // Last 12 months

    // Get all bookings in the last 12 months
    const bookings = await prisma.booking.findMany({
      where: {
        createdAt: {
          gte: startDate,
        },
        status: {
          not: BookingStatus.CANCELLED,
        },
      },
      select: {
        totalPrice: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: 'asc',
      },
    })

    // Group by month
    const monthlyData: { [key: string]: { revenue: number; count: number } } = {}

    bookings.forEach((booking) => {
      const monthKey = booking.createdAt.toISOString().substring(0, 7) // YYYY-MM
      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = { revenue: 0, count: 0 }
      }
      monthlyData[monthKey].revenue += booking.totalPrice
      monthlyData[monthKey].count += 1
    })

    // Convert to array
    const revenueByMonth: RevenueByMonth[] = Object.entries(monthlyData)
      .map(([month, data]) => ({
        month,
        revenue: data.revenue,
        bookings: data.count,
      }))
      .sort((a, b) => a.month.localeCompare(b.month))

    return {
      success: true,
      data: revenueByMonth,
    }
  } catch (error) {
    console.error('[getRevenueByMonth] Error:', error)
    return {
      success: false,
      error: 'Failed to fetch revenue data',
    }
  }
}

// ==========================================
// BOOKING STATISTICS
// ==========================================

/**
 * Get booking statistics by status
 */
export async function getBookingStatsByStatus(): Promise<{
  success: boolean
  data?: Array<{ status: BookingStatus; count: number; revenue: number }>
  error?: string
}> {
  try {
    const bookingsByStatus = await prisma.booking.groupBy({
      by: ['status'],
      _count: {
        _all: true,
      },
      _sum: {
        totalPrice: true,
      },
    })

    const data = bookingsByStatus.map((item) => ({
      status: item.status,
      count: item._count._all,
      revenue: item._sum.totalPrice || 0,
    }))

    return {
      success: true,
      data,
    }
  } catch (error) {
    console.error('[getBookingStatsByStatus] Error:', error)
    return {
      success: false,
      error: 'Failed to fetch booking statistics',
    }
  }
}

// ==========================================
// ROOM UTILIZATION
// ==========================================

/**
 * Get room utilization metrics
 */
export async function getRoomUtilization(): Promise<{
  success: boolean
  data?: {
    totalRoomTypes: number
    totalRooms: number
    averageOccupancy: number
    mostBookedRoomType: string | null
  }
  error?: string
}> {
  try {
    const today = new Date()

    // Get all room types with booking counts
    const roomTypes = await prisma.roomType.findMany({
      select: {
        id: true,
        name: true,
        totalRooms: true,
        bookings: {
          where: {
            status: {
              in: [BookingStatus.CONFIRMED, BookingStatus.CHECKED_IN],
            },
            startDate: {
              lte: today,
            },
            endDate: {
              gte: today,
            },
          },
          select: {
            roomsBooked: true,
          },
        },
      },
    })

    let totalRooms = 0
    let bookedRooms = 0
    let mostBookedRoomType: string | null = null
    let maxBookings = 0

    roomTypes.forEach((roomType) => {
      totalRooms += roomType.totalRooms
      const booked = roomType.bookings.reduce(
        (sum, b) => sum + b.roomsBooked,
        0
      )
      bookedRooms += booked

      if (booked > maxBookings) {
        maxBookings = booked
        mostBookedRoomType = roomType.name
      }
    })

    const averageOccupancy = totalRooms > 0 ? (bookedRooms / totalRooms) * 100 : 0

    return {
      success: true,
      data: {
        totalRoomTypes: roomTypes.length,
        totalRooms,
        averageOccupancy: Math.round(averageOccupancy * 100) / 100,
        mostBookedRoomType,
      },
    }
  } catch (error) {
    console.error('[getRoomUtilization] Error:', error)
    return {
      success: false,
      error: 'Failed to fetch room utilization',
    }
  }
}
