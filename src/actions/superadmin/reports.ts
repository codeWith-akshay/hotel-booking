/**
 * Report Server Actions (Day 17)
 * 
 * Server actions for SuperAdmin reporting, analytics, and export functionality
 */

'use server'

import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/prisma'
import {
  ReportRequestSchema,
  ExportRequestSchema,
  validateDateRange,
  getDateRangeArray,
  calculateOccupancyRate,
  type OccupancyReportResponse,
  type RevenueReportResponse,
  type BookingStatusReportResponse,
  type WaitlistReportResponse,
  type ExportResponse,
  type OccupancyData,
  type RevenueData,
  type BookingStatusCount,
} from '@/lib/validation/reports.validation'
import { validateSuperAdminRole } from '@/lib/validation/superadmin.validation'

// ==========================================
// HELPER: RBAC VALIDATION
// ==========================================

async function verifySuperAdmin(adminId: string): Promise<{ valid: boolean; error?: string }> {
  const admin = await prisma.user.findUnique({
    where: { id: adminId },
    include: { role: true },
  })

  if (!admin || !validateSuperAdminRole(admin.role.name)) {
    return {
      valid: false,
      error: 'Unauthorized: SuperAdmin permission required',
    }
  }

  return { valid: true }
}

// ==========================================
// OCCUPANCY REPORT
// ==========================================

/**
 * Fetch occupancy report for date range
 * 
 * @param request - Report request with date range and optional room type filter
 * @returns Occupancy data with summary statistics
 */
export async function fetchOccupancyReport(request: {
  adminId: string
  startDate: string
  endDate: string
  roomTypeId?: string
}): Promise<OccupancyReportResponse> {
  try {
    // Validate request
    const validation = ReportRequestSchema.safeParse(request)
    if (!validation.success) {
      return {
        success: false,
        error: validation.error.issues[0]?.message || 'Validation failed',
      }
    }

    const { adminId, startDate, endDate, roomTypeId } = validation.data

    // Verify SuperAdmin permission
    const authCheck = await verifySuperAdmin(adminId)
    if (!authCheck.valid) {
      return {
        success: false,
        error: authCheck.error,
      }
    }

    // Validate date range
    const dateValidation = validateDateRange(startDate, endDate)
    if (!dateValidation.valid) {
      return {
        success: false,
        error: dateValidation.errors.join(', '),
      }
    }

    // Get date range array
    const dates = getDateRangeArray(startDate, endDate)

    // Fetch all room types with their total rooms
    const roomTypes = await prisma.roomType.findMany({
      ...(roomTypeId && { where: { id: roomTypeId } }),
      select: {
        id: true,
        name: true,
        totalRooms: true,
      },
    })

    const totalRoomsAvailable = roomTypes.reduce((sum: number, rt: any) => sum + rt.totalRooms, 0)

    // Fetch bookings for the date range
    const bookings = await prisma.booking.findMany({
      where: {
        status: { in: ['CONFIRMED', 'PROVISIONAL'] },
        OR: [
          {
            startDate: { gte: new Date(startDate), lte: new Date(endDate) },
          },
          {
            endDate: { gte: new Date(startDate), lte: new Date(endDate) },
          },
          {
            AND: [
              { startDate: { lte: new Date(startDate) } },
              { endDate: { gte: new Date(endDate) } },
            ],
          },
        ],
        ...(roomTypeId && { roomTypeId }),
      },
      select: {
        id: true,
        startDate: true,
        endDate: true,
        roomsBooked: true,
        roomTypeId: true,
        roomType: {
          select: {
            name: true,
          },
        },
      },
    })

    // Calculate occupancy for each date
    const occupancyData: OccupancyData[] = dates.map((date) => {
      const currentDate = new Date(date)

      // Count rooms booked on this date
      const bookedRooms = bookings
        .filter((b: any) => {
          const bStart = new Date(b.startDate)
          const bEnd = new Date(b.endDate)
          return currentDate >= bStart && currentDate < bEnd
        })
        .reduce((sum: number, b: any) => sum + b.roomsBooked, 0)

      // Calculate breakdown by room type
      const roomTypeBreakdown = roomTypes.map((rt: any) => {
        const roomTypeBooked = bookings
          .filter((b: any) => {
            const bStart = new Date(b.startDate)
            const bEnd = new Date(b.endDate)
            return b.roomTypeId === rt.id && currentDate >= bStart && currentDate < bEnd
          })
          .reduce((sum: number, b: any) => sum + b.roomsBooked, 0)

        return {
          roomTypeId: rt.id,
          roomTypeName: rt.name,
          available: rt.totalRooms,
          booked: roomTypeBooked,
        }
      })

      return {
        date,
        totalRooms: totalRoomsAvailable,
        bookedRooms,
        occupancyRate: calculateOccupancyRate(bookedRooms, totalRoomsAvailable),
        roomTypeBreakdown,
      }
    })

    // Calculate summary statistics
    const averageOccupancy =
      occupancyData.reduce((sum, d) => sum + d.occupancyRate, 0) / occupancyData.length

    const peakOccupancy = occupancyData.reduce((max, d) =>
      d.occupancyRate > (max?.occupancyRate || 0) ? d : max
    )

    const lowestOccupancy = occupancyData.reduce((min, d) =>
      d.occupancyRate < (min?.occupancyRate || 100) ? d : min
    )

    const totalRoomNights = occupancyData.reduce((sum, d) => sum + d.bookedRooms, 0)

    return {
      success: true,
      data: occupancyData,
      summary: {
        averageOccupancy: Math.round(averageOccupancy * 100) / 100,
        peakOccupancyDate: peakOccupancy.date,
        lowestOccupancyDate: lowestOccupancy.date,
        totalRoomNights,
      },
    }
  } catch (error) {
    console.error('[fetchOccupancyReport] Error:', error)
    return {
      success: false,
      error: 'Internal server error',
    }
  }
}

// ==========================================
// REVENUE REPORT
// ==========================================

/**
 * Fetch revenue report for date range
 * 
 * @param request - Report request with date range and optional room type filter
 * @returns Revenue data with summary statistics
 */
export async function fetchRevenueReport(request: {
  adminId: string
  startDate: string
  endDate: string
  roomTypeId?: string
}): Promise<RevenueReportResponse> {
  try {
    // Validate request
    const validation = ReportRequestSchema.safeParse(request)
    if (!validation.success) {
      return {
        success: false,
        error: validation.error.issues[0]?.message || 'Validation failed',
      }
    }

    const { adminId, startDate, endDate, roomTypeId } = validation.data

    // Verify SuperAdmin permission
    const authCheck = await verifySuperAdmin(adminId)
    if (!authCheck.valid) {
      return {
        success: false,
        error: authCheck.error,
      }
    }

    // Validate date range
    const dateValidation = validateDateRange(startDate, endDate)
    if (!dateValidation.valid) {
      return {
        success: false,
        error: dateValidation.errors.join(', '),
      }
    }

    // Get date range array
    const dates = getDateRangeArray(startDate, endDate)

    // Fetch bookings with payments for the date range
    const bookings = await prisma.booking.findMany({
      where: {
        createdAt: { gte: new Date(startDate), lte: new Date(endDate + 'T23:59:59') },
        ...(roomTypeId && { roomTypeId }),
      },
      include: {
        payments: {
          where: {
            status: { in: ['SUCCEEDED', 'PENDING'] },
          },
        },
        roomType: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    })

    // Calculate revenue for each date
    const revenueData: RevenueData[] = dates.map((date) => {
      const dateBookings = bookings.filter((b: any) => {
        const createdDate = b.createdAt.toISOString().split('T')[0]
        return createdDate === date
      })

      const totalRevenue = dateBookings.reduce((sum: number, b: any) => sum + b.totalPrice, 0)

      const paidRevenue = dateBookings.reduce((sum: number, b: any) => {
        const paid = b.payments
          .filter((p: any) => p.status === 'SUCCEEDED')
          .reduce((pSum: number, p: any) => pSum + p.amount, 0)
        return sum + paid
      }, 0)

      const pendingRevenue = totalRevenue - paidRevenue

      const bookingCount = dateBookings.length

      const averageBookingValue = bookingCount > 0 ? totalRevenue / bookingCount : 0

      // Calculate breakdown by room type
      const roomTypeMap = new Map<string, { name: string; revenue: number; bookings: number }>()
      dateBookings.forEach((b: any) => {
        const existing = roomTypeMap.get(b.roomTypeId) || {
          name: b.roomType.name,
          revenue: 0,
          bookings: 0,
        }
        existing.revenue += b.totalPrice
        existing.bookings += 1
        roomTypeMap.set(b.roomTypeId, existing)
      })

      const roomTypeBreakdown = Array.from(roomTypeMap.entries()).map(([id, data]) => ({
        roomTypeId: id,
        roomTypeName: data.name,
        revenue: data.revenue,
        bookings: data.bookings,
      }))

      return {
        date,
        totalRevenue,
        paidRevenue,
        pendingRevenue,
        bookingCount,
        averageBookingValue,
        roomTypeBreakdown,
      }
    })

    // Calculate summary statistics
    const totalRevenue = revenueData.reduce((sum, d) => sum + d.totalRevenue, 0)
    const totalPaid = revenueData.reduce((sum, d) => sum + d.paidRevenue, 0)
    const totalPending = revenueData.reduce((sum, d) => sum + d.pendingRevenue, 0)
    const averageDailyRevenue = revenueData.length > 0 ? totalRevenue / revenueData.length : 0

    const peakRevenue = revenueData.reduce((max, d) =>
      d.totalRevenue > (max?.totalRevenue || 0) ? d : max
    )

    return {
      success: true,
      data: revenueData,
      summary: {
        totalRevenue,
        totalPaid,
        totalPending,
        averageDailyRevenue: Math.round(averageDailyRevenue),
        peakRevenueDate: peakRevenue?.date,
      },
    }
  } catch (error) {
    console.error('[fetchRevenueReport] Error:', error)
    return {
      success: false,
      error: 'Internal server error',
    }
  }
}

// ==========================================
// BOOKING STATUS REPORT
// ==========================================

/**
 * Fetch booking status distribution report
 * 
 * @param request - Report request with date range and optional room type filter
 * @returns Booking counts by status with summary
 */
export async function fetchBookingStatusReport(request: {
  adminId: string
  startDate: string
  endDate: string
  roomTypeId?: string
}): Promise<BookingStatusReportResponse> {
  try {
    // Validate request
    const validation = ReportRequestSchema.safeParse(request)
    if (!validation.success) {
      return {
        success: false,
        error: validation.error.issues[0]?.message || 'Validation failed',
      }
    }

    const { adminId, startDate, endDate, roomTypeId } = validation.data

    // Verify SuperAdmin permission
    const authCheck = await verifySuperAdmin(adminId)
    if (!authCheck.valid) {
      return {
        success: false,
        error: authCheck.error,
      }
    }

    // Validate date range
    const dateValidation = validateDateRange(startDate, endDate)
    if (!dateValidation.valid) {
      return {
        success: false,
        error: dateValidation.errors.join(', '),
      }
    }

    // Fetch bookings grouped by status
    const bookings = await prisma.booking.findMany({
      where: {
        createdAt: { gte: new Date(startDate), lte: new Date(endDate + 'T23:59:59') },
        ...(roomTypeId && { roomTypeId }),
      },
      include: {
        payments: {
          where: {
            status: 'SUCCEEDED',
          },
        },
      },
    })

    // Group by status
    const statusMap = new Map<string, { count: number; totalValue: number; paidAmount: number }>()

    bookings.forEach((b: any) => {
      const status = b.status
      const existing = statusMap.get(status) || { count: 0, totalValue: 0, paidAmount: 0 }

      existing.count += 1
      existing.totalValue += b.totalPrice

      const paid = b.payments.reduce((sum: number, p: any) => sum + p.amount, 0)
      existing.paidAmount += paid

      statusMap.set(status, existing)
    })

    // Convert to array
    const data: BookingStatusCount[] = Array.from(statusMap.entries()).map(([status, counts]) => ({
      status: status as 'PROVISIONAL' | 'CONFIRMED' | 'CANCELLED' | 'COMPLETED',
      count: counts.count,
      totalValue: counts.totalValue,
      paidAmount: counts.paidAmount,
    }))

    // Calculate summary
    const totalBookings = bookings.length
    const totalValue = bookings.reduce((sum: number, b: any) => sum + b.totalPrice, 0)
    const totalPaid = bookings.reduce((sum: number, b: any) => {
      return sum + b.payments.reduce((pSum: number, p: any) => pSum + p.amount, 0)
    }, 0)

    const confirmedCount = statusMap.get('CONFIRMED')?.count || 0
    const cancelledCount = statusMap.get('CANCELLED')?.count || 0

    const confirmedRate = totalBookings > 0 ? (confirmedCount / totalBookings) * 100 : 0
    const cancellationRate = totalBookings > 0 ? (cancelledCount / totalBookings) * 100 : 0

    return {
      success: true,
      data,
      summary: {
        totalBookings,
        totalValue,
        totalPaid,
        confirmedRate: Math.round(confirmedRate * 100) / 100,
        cancellationRate: Math.round(cancellationRate * 100) / 100,
      },
    }
  } catch (error) {
    console.error('[fetchBookingStatusReport] Error:', error)
    return {
      success: false,
      error: 'Internal server error',
    }
  }
}

// ==========================================
// WAITLIST REPORT
// ==========================================

/**
 * Fetch waitlist statistics report
 * 
 * @param request - Report request with date range and optional room type filter
 * @returns Waitlist statistics
 */
export async function fetchWaitlistReport(request: {
  adminId: string
  startDate: string
  endDate: string
  roomTypeId?: string
}): Promise<WaitlistReportResponse> {
  try {
    // Validate request
    const validation = ReportRequestSchema.safeParse(request)
    if (!validation.success) {
      return {
        success: false,
        error: validation.error.issues[0]?.message || 'Validation failed',
      }
    }

    const { adminId, startDate, endDate, roomTypeId } = validation.data

    // Verify SuperAdmin permission
    const authCheck = await verifySuperAdmin(adminId)
    if (!authCheck.valid) {
      return {
        success: false,
        error: authCheck.error,
      }
    }

    // Fetch waitlist entries for the date range
    const waitlistEntries = await prisma.waitlist.findMany({
      where: {
        createdAt: { gte: new Date(startDate), lte: new Date(endDate + 'T23:59:59') },
        ...(roomTypeId && { roomTypeId }),
      },
      include: {
        roomType: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    })

    // Calculate statistics
    const totalWaitlisted = waitlistEntries.length
    const uniqueUsers = new Set(waitlistEntries.map((w: any) => w.userId)).size
    const pendingNotifications = waitlistEntries.filter((w: any) => !w.notifiedAt).length

    // Calculate average wait time (in hours)
    const completedEntries = waitlistEntries.filter((w: any) => w.notifiedAt)
    const averageWaitTime =
      completedEntries.length > 0
        ? completedEntries.reduce((sum: number, w: any) => {
            const waitTime =
              (w.notifiedAt!.getTime() - w.createdAt.getTime()) / (1000 * 60 * 60)
            return sum + waitTime
          }, 0) / completedEntries.length
        : 0

    // Group by room type
    const roomTypeMap = new Map<string, { name: string; count: number }>()
    waitlistEntries.forEach((w: any) => {
      const existing = roomTypeMap.get(w.roomTypeId) || { name: w.roomType.name, count: 0 }
      existing.count += 1
      roomTypeMap.set(w.roomTypeId, existing)
    })

    const byRoomType = Array.from(roomTypeMap.entries()).map(([id, data]) => ({
      roomTypeId: id,
      roomTypeName: data.name,
      count: data.count,
    }))

    // Group by date range (simplified - just return counts)
    const byDateRange = [
      {
        startDate,
        endDate,
        count: totalWaitlisted,
      },
    ]

    return {
      success: true,
      data: {
        totalWaitlisted,
        uniqueUsers,
        pendingNotifications,
        averageWaitTime: Math.round(averageWaitTime * 100) / 100,
        byRoomType,
        byDateRange,
      },
    }
  } catch (error) {
    console.error('[fetchWaitlistReport] Error:', error)
    return {
      success: false,
      error: 'Internal server error',
    }
  }
}

// ==========================================
// EXPORT FUNCTIONALITY
// ==========================================

/**
 * Export report as CSV or PDF
 * 
 * @param request - Export request with format and report type
 * @returns Export response with download data
 */
export async function exportReport(request: {
  adminId: string
  format: 'csv' | 'pdf'
  reportType: 'occupancy' | 'revenue' | 'bookings' | 'waitlist' | 'all'
  startDate: string
  endDate: string
  roomTypeId?: string
  includeCharts?: boolean
}): Promise<ExportResponse> {
  try {
    // Validate request
    const validation = ExportRequestSchema.safeParse(request)
    if (!validation.success) {
      return {
        success: false,
        error: validation.error.issues[0]?.message || 'Validation failed',
      }
    }

    const { adminId, format, reportType, startDate, endDate, roomTypeId, includeCharts } =
      validation.data

    // Verify SuperAdmin permission
    const authCheck = await verifySuperAdmin(adminId)
    if (!authCheck.valid) {
      return {
        success: false,
        error: authCheck.error,
      }
    }

    // Generate filename
    const timestamp = new Date().toISOString().split('T')[0]
    const filename = `${reportType}-report-${startDate}-to-${endDate}-${timestamp}.${format}`

    // CSV Export
    if (format === 'csv') {
      let csvContent = ''

      if (reportType === 'occupancy' || reportType === 'all') {
        const occupancy = await fetchOccupancyReport({ adminId, startDate, endDate, ...(roomTypeId && { roomTypeId }) })
        if (occupancy.success && occupancy.data) {
          csvContent += 'Occupancy Report\n'
          csvContent += 'Date,Total Rooms,Booked Rooms,Occupancy Rate\n'
          occupancy.data.forEach((d) => {
            csvContent += `${d.date},${d.totalRooms},${d.bookedRooms},${d.occupancyRate}%\n`
          })
          csvContent += '\n'
        }
      }

      if (reportType === 'revenue' || reportType === 'all') {
        const revenue = await fetchRevenueReport({ adminId, startDate, endDate, ...(roomTypeId && { roomTypeId }) })
        if (revenue.success && revenue.data) {
          csvContent += 'Revenue Report\n'
          csvContent +=
            'Date,Total Revenue,Paid Revenue,Pending Revenue,Booking Count,Average Booking Value\n'
          revenue.data.forEach((d) => {
            csvContent += `${d.date},${d.totalRevenue / 100},${d.paidRevenue / 100},${d.pendingRevenue / 100},${d.bookingCount},${d.averageBookingValue / 100}\n`
          })
          csvContent += '\n'
        }
      }

      if (reportType === 'bookings' || reportType === 'all') {
        const bookings = await fetchBookingStatusReport({ adminId, startDate, endDate, ...(roomTypeId && { roomTypeId }) })
        if (bookings.success && bookings.data) {
          csvContent += 'Booking Status Report\n'
          csvContent += 'Status,Count,Total Value,Paid Amount\n'
          bookings.data.forEach((d) => {
            csvContent += `${d.status},${d.count},${d.totalValue / 100},${d.paidAmount / 100}\n`
          })
          csvContent += '\n'
        }
      }

      if (reportType === 'waitlist' || reportType === 'all') {
        const waitlist = await fetchWaitlistReport({ adminId, startDate, endDate, ...(roomTypeId && { roomTypeId }) })
        if (waitlist.success && waitlist.data) {
          csvContent += 'Waitlist Report\n'
          csvContent += `Total Waitlisted,${waitlist.data.totalWaitlisted}\n`
          csvContent += `Unique Users,${waitlist.data.uniqueUsers}\n`
          csvContent += `Pending Notifications,${waitlist.data.pendingNotifications}\n`
          csvContent += `Average Wait Time (hours),${waitlist.data.averageWaitTime}\n`
          csvContent += '\n'
        }
      }

      // Convert to base64
      const base64Data = Buffer.from(csvContent).toString('base64')

      return {
        success: true,
        filename,
        data: base64Data,
        contentType: 'text/csv',
      }
    }

    // PDF Export (stub for now)
    if (format === 'pdf') {
      return {
        success: false,
        error: 'PDF export is not yet implemented. Please use CSV format.',
      }
    }

    return {
      success: false,
      error: 'Invalid export format',
    }
  } catch (error) {
    console.error('[exportReport] Error:', error)
    return {
      success: false,
      error: 'Internal server error',
    }
  }
}
