/**
 * Reports Validation Schemas (Day 17)
 * 
 * Zod schemas for SuperAdmin reporting and export functionality
 */

import { z } from 'zod'

// ==========================================
// ENUMS
// ==========================================

/**
 * Report export format options
 */
export const ExportFormatEnum = z.enum(['csv', 'pdf'])
export type ExportFormat = z.infer<typeof ExportFormatEnum>

/**
 * Report type for filtering
 */
export const ReportTypeEnum = z.enum(['occupancy', 'revenue', 'bookings', 'waitlist', 'all'])
export type ReportType = z.infer<typeof ReportTypeEnum>

// ==========================================
// FILTER SCHEMAS
// ==========================================

/**
 * Date range filter for reports
 */
export const DateRangeFilterSchema = z.object({
  startDate: z.string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format (YYYY-MM-DD)')
    .describe('Start date for report range'),
  endDate: z.string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format (YYYY-MM-DD)')
    .describe('End date for report range'),
  roomTypeId: z.string().cuid().optional()
    .describe('Optional room type filter'),
}).refine(data => {
  const start = new Date(data.startDate)
  const end = new Date(data.endDate)
  return start <= end
}, {
  message: 'Start date must be before or equal to end date',
})

export type DateRangeFilter = z.infer<typeof DateRangeFilterSchema>

/**
 * Report request with admin validation
 */
export const ReportRequestSchema = z.object({
  startDate: z.string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format (YYYY-MM-DD)')
    .describe('Start date for report range'),
  endDate: z.string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format (YYYY-MM-DD)')
    .describe('End date for report range'),
  roomTypeId: z.string().cuid().optional()
    .describe('Optional room type filter'),
  adminId: z.string().cuid()
    .describe('SuperAdmin user ID for RBAC'),
}).refine(data => {
  const start = new Date(data.startDate)
  const end = new Date(data.endDate)
  return start <= end
}, {
  message: 'Start date must be before or equal to end date',
})

export type ReportRequest = z.infer<typeof ReportRequestSchema>

// ==========================================
// REPORT DATA SCHEMAS
// ==========================================

/**
 * Daily occupancy data point
 */
export const OccupancyDataSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  totalRooms: z.number().int().min(0)
    .describe('Total rooms available'),
  bookedRooms: z.number().int().min(0)
    .describe('Number of rooms booked'),
  occupancyRate: z.number().min(0).max(100)
    .describe('Occupancy percentage'),
  roomTypeBreakdown: z.array(z.object({
    roomTypeId: z.string().cuid(),
    roomTypeName: z.string(),
    available: z.number().int().min(0),
    booked: z.number().int().min(0),
  })).optional(),
})

export type OccupancyData = z.infer<typeof OccupancyDataSchema>

/**
 * Daily revenue data point
 */
export const RevenueDataSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  totalRevenue: z.number().min(0)
    .describe('Total revenue in cents'),
  paidRevenue: z.number().min(0)
    .describe('Paid revenue in cents'),
  pendingRevenue: z.number().min(0)
    .describe('Pending revenue in cents'),
  bookingCount: z.number().int().min(0)
    .describe('Number of bookings'),
  averageBookingValue: z.number().min(0)
    .describe('Average booking value in cents'),
  roomTypeBreakdown: z.array(z.object({
    roomTypeId: z.string().cuid(),
    roomTypeName: z.string(),
    revenue: z.number().min(0),
    bookings: z.number().int().min(0),
  })).optional(),
})

export type RevenueData = z.infer<typeof RevenueDataSchema>

/**
 * Booking status count
 */
export const BookingStatusCountSchema = z.object({
  status: z.enum(['PROVISIONAL', 'CONFIRMED', 'CANCELLED', 'COMPLETED']),
  count: z.number().int().min(0),
  totalValue: z.number().min(0)
    .describe('Total booking value in cents'),
  paidAmount: z.number().min(0)
    .describe('Total paid amount in cents'),
})

export type BookingStatusCount = z.infer<typeof BookingStatusCountSchema>

/**
 * Waitlist statistics
 */
export const WaitlistStatsSchema = z.object({
  totalWaitlisted: z.number().int().min(0)
    .describe('Total waitlist entries'),
  uniqueUsers: z.number().int().min(0)
    .describe('Unique users on waitlist'),
  pendingNotifications: z.number().int().min(0)
    .describe('Pending notifications to send'),
  averageWaitTime: z.number().min(0)
    .describe('Average wait time in hours'),
  byRoomType: z.array(z.object({
    roomTypeId: z.string().cuid(),
    roomTypeName: z.string(),
    count: z.number().int().min(0),
  })),
  byDateRange: z.array(z.object({
    startDate: z.string(),
    endDate: z.string(),
    count: z.number().int().min(0),
  })),
})

export type WaitlistStats = z.infer<typeof WaitlistStatsSchema>

// ==========================================
// RESPONSE SCHEMAS
// ==========================================

/**
 * Occupancy report response
 */
export const OccupancyReportResponseSchema = z.object({
  success: z.boolean(),
  data: z.array(OccupancyDataSchema).optional(),
  summary: z.object({
    averageOccupancy: z.number().min(0).max(100),
    peakOccupancyDate: z.string().optional(),
    lowestOccupancyDate: z.string().optional(),
    totalRoomNights: z.number().int().min(0),
  }).optional(),
  error: z.string().optional(),
})

export type OccupancyReportResponse = z.infer<typeof OccupancyReportResponseSchema>

/**
 * Revenue report response
 */
export const RevenueReportResponseSchema = z.object({
  success: z.boolean(),
  data: z.array(RevenueDataSchema).optional(),
  summary: z.object({
    totalRevenue: z.number().min(0),
    totalPaid: z.number().min(0),
    totalPending: z.number().min(0),
    averageDailyRevenue: z.number().min(0),
    peakRevenueDate: z.string().optional(),
  }).optional(),
  error: z.string().optional(),
})

export type RevenueReportResponse = z.infer<typeof RevenueReportResponseSchema>

/**
 * Booking status report response
 */
export const BookingStatusReportResponseSchema = z.object({
  success: z.boolean(),
  data: z.array(BookingStatusCountSchema).optional(),
  summary: z.object({
    totalBookings: z.number().int().min(0),
    totalValue: z.number().min(0),
    totalPaid: z.number().min(0),
    confirmedRate: z.number().min(0).max(100),
    cancellationRate: z.number().min(0).max(100),
  }).optional(),
  error: z.string().optional(),
})

export type BookingStatusReportResponse = z.infer<typeof BookingStatusReportResponseSchema>

/**
 * Waitlist report response
 */
export const WaitlistReportResponseSchema = z.object({
  success: z.boolean(),
  data: WaitlistStatsSchema.optional(),
  error: z.string().optional(),
})

export type WaitlistReportResponse = z.infer<typeof WaitlistReportResponseSchema>

// ==========================================
// EXPORT SCHEMAS
// ==========================================

/**
 * Export request schema
 */
export const ExportRequestSchema = z.object({
  adminId: z.string().cuid(),
  format: ExportFormatEnum,
  reportType: ReportTypeEnum,
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  roomTypeId: z.string().cuid().optional(),
  includeCharts: z.boolean().optional().default(false)
    .describe('Include charts in PDF export (not supported for CSV)'),
})

export type ExportRequest = z.infer<typeof ExportRequestSchema>

/**
 * Export response schema
 */
export const ExportResponseSchema = z.object({
  success: z.boolean(),
  filename: z.string().optional()
    .describe('Generated filename'),
  data: z.string().optional()
    .describe('Base64 encoded data or download URL'),
  contentType: z.string().optional()
    .describe('MIME type'),
  error: z.string().optional(),
})

export type ExportResponse = z.infer<typeof ExportResponseSchema>

// ==========================================
// HELPER FUNCTIONS
// ==========================================

/**
 * Validate date range constraints
 */
export function validateDateRange(startDate: string, endDate: string): {
  valid: boolean
  errors: string[]
} {
  const errors: string[] = []
  const start = new Date(startDate)
  const end = new Date(endDate)
  const now = new Date()

  if (isNaN(start.getTime())) {
    errors.push('Invalid start date')
  }

  if (isNaN(end.getTime())) {
    errors.push('Invalid end date')
  }

  if (start > end) {
    errors.push('Start date must be before or equal to end date')
  }

  if (start > now) {
    errors.push('Start date cannot be in the future')
  }

  // Max range: 1 year
  const daysDiff = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))
  if (daysDiff > 365) {
    errors.push('Date range cannot exceed 365 days')
  }

  return {
    valid: errors.length === 0,
    errors,
  }
}

/**
 * Calculate date range array
 */
export function getDateRangeArray(startDate: string, endDate: string): string[] {
  const dates: string[] = []
  const start = new Date(startDate)
  const end = new Date(endDate)

  const current = new Date(start)
  while (current <= end) {
    const dateStr = current.toISOString().split('T')[0]
    if (dateStr) dates.push(dateStr)
    current.setDate(current.getDate() + 1)
  }

  return dates
}

/**
 * Format currency for reports
 */
export function formatCurrency(cents: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(cents / 100)
}

/**
 * Format percentage for reports
 */
export function formatPercentage(value: number): string {
  return `${value.toFixed(2)}%`
}

/**
 * Calculate occupancy rate
 */
export function calculateOccupancyRate(booked: number, total: number): number {
  if (total === 0) return 0
  return Math.round((booked / total) * 100 * 100) / 100
}
