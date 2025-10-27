/**
 * Report Slice (Day 17)
 * 
 * Redux Toolkit slice for SuperAdmin reporting and analytics
 */

import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit'
import type { RootState } from '../store'
import type {
  DateRangeFilter,
  OccupancyData,
  RevenueData,
  BookingStatusCount,
  WaitlistStats,
  ExportFormat,
  ReportType,
} from '@/lib/validation/reports.validation'

// ==========================================
// TYPES
// ==========================================

interface ReportState {
  // Filters
  filters: DateRangeFilter
  
  // Occupancy Report
  occupancyData: OccupancyData[]
  occupancyLoading: boolean
  occupancyError: string | null
  occupancySummary: {
    averageOccupancy: number
    peakOccupancyDate?: string
    lowestOccupancyDate?: string
    totalRoomNights: number
  } | null
  
  // Revenue Report
  revenueData: RevenueData[]
  revenueLoading: boolean
  revenueError: string | null
  revenueSummary: {
    totalRevenue: number
    totalPaid: number
    totalPending: number
    averageDailyRevenue: number
    peakRevenueDate?: string
  } | null
  
  // Booking Status Report
  bookingStatusData: BookingStatusCount[]
  bookingStatusLoading: boolean
  bookingStatusError: string | null
  bookingStatusSummary: {
    totalBookings: number
    totalValue: number
    totalPaid: number
    confirmedRate: number
    cancellationRate: number
  } | null
  
  // Waitlist Report
  waitlistData: WaitlistStats | null
  waitlistLoading: boolean
  waitlistError: string | null
  
  // Export
  exportLoading: boolean
  exportError: string | null
  lastExportFilename: string | null
}

// ==========================================
// INITIAL STATE
// ==========================================

const getDefaultDateRange = (): DateRangeFilter => {
  const end = new Date()
  const start = new Date()
  start.setDate(start.getDate() - 30) // Last 30 days by default
  
  const startDateStr = start.toISOString().split('T')[0] || ''
  const endDateStr = end.toISOString().split('T')[0] || ''
  
  return {
    startDate: startDateStr,
    endDate: endDateStr,
  }
}

const initialState: ReportState = {
  filters: getDefaultDateRange(),
  
  occupancyData: [],
  occupancyLoading: false,
  occupancyError: null,
  occupancySummary: null,
  
  revenueData: [],
  revenueLoading: false,
  revenueError: null,
  revenueSummary: null,
  
  bookingStatusData: [],
  bookingStatusLoading: false,
  bookingStatusError: null,
  bookingStatusSummary: null,
  
  waitlistData: null,
  waitlistLoading: false,
  waitlistError: null,
  
  exportLoading: false,
  exportError: null,
  lastExportFilename: null,
}

// ==========================================
// ASYNC THUNKS
// ==========================================

/**
 * Fetch occupancy report
 */
export const fetchOccupancyReport = createAsyncThunk(
  'reports/fetchOccupancy',
  async (params: { adminId: string; startDate: string; endDate: string; roomTypeId?: string }) => {
    const query = new URLSearchParams({
      startDate: params.startDate,
      endDate: params.endDate,
      ...(params.roomTypeId && { roomTypeId: params.roomTypeId }),
    })
    
    const response = await fetch(`/api/superadmin/reports/occupancy?${query}`)
    const data = await response.json()
    
    if (!data.success) {
      throw new Error(data.error || 'Failed to fetch occupancy report')
    }
    
    return data
  }
)

/**
 * Fetch revenue report
 */
export const fetchRevenueReport = createAsyncThunk(
  'reports/fetchRevenue',
  async (params: { adminId: string; startDate: string; endDate: string; roomTypeId?: string }) => {
    const query = new URLSearchParams({
      startDate: params.startDate,
      endDate: params.endDate,
      ...(params.roomTypeId && { roomTypeId: params.roomTypeId }),
    })
    
    const response = await fetch(`/api/superadmin/reports/revenue?${query}`)
    const data = await response.json()
    
    if (!data.success) {
      throw new Error(data.error || 'Failed to fetch revenue report')
    }
    
    return data
  }
)

/**
 * Fetch booking status report
 */
export const fetchBookingStatusReport = createAsyncThunk(
  'reports/fetchBookingStatus',
  async (params: { adminId: string; startDate: string; endDate: string; roomTypeId?: string }) => {
    const query = new URLSearchParams({
      startDate: params.startDate,
      endDate: params.endDate,
      ...(params.roomTypeId && { roomTypeId: params.roomTypeId }),
    })
    
    const response = await fetch(`/api/superadmin/reports/bookings?${query}`)
    const data = await response.json()
    
    if (!data.success) {
      throw new Error(data.error || 'Failed to fetch booking status report')
    }
    
    return data
  }
)

/**
 * Fetch waitlist report
 */
export const fetchWaitlistReport = createAsyncThunk(
  'reports/fetchWaitlist',
  async (params: { adminId: string; startDate: string; endDate: string; roomTypeId?: string }) => {
    const query = new URLSearchParams({
      startDate: params.startDate,
      endDate: params.endDate,
      ...(params.roomTypeId && { roomTypeId: params.roomTypeId }),
    })
    
    const response = await fetch(`/api/superadmin/reports/waitlist?${query}`)
    const data = await response.json()
    
    if (!data.success) {
      throw new Error(data.error || 'Failed to fetch waitlist report')
    }
    
    return data
  }
)

/**
 * Fetch all reports at once
 */
export const fetchAllReports = createAsyncThunk(
  'reports/fetchAll',
  async (params: { adminId: string; startDate: string; endDate: string; roomTypeId?: string }, { dispatch }) => {
    await Promise.all([
      dispatch(fetchOccupancyReport(params)),
      dispatch(fetchRevenueReport(params)),
      dispatch(fetchBookingStatusReport(params)),
      dispatch(fetchWaitlistReport(params)),
    ])
  }
)

/**
 * Export report
 */
export const exportReport = createAsyncThunk(
  'reports/export',
  async (params: {
    adminId: string
    format: ExportFormat
    reportType: ReportType
    startDate: string
    endDate: string
    roomTypeId?: string
    includeCharts?: boolean
  }) => {
    const response = await fetch('/api/superadmin/reports/export', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    })
    
    const data = await response.json()
    
    if (!data.success) {
      throw new Error(data.error || 'Failed to export report')
    }
    
    return data
  }
)

// ==========================================
// SLICE
// ==========================================

const reportSlice = createSlice({
  name: 'reports',
  initialState,
  reducers: {
    setFilters: (state, action: PayloadAction<DateRangeFilter>) => {
      state.filters = action.payload
    },
    
    setStartDate: (state, action: PayloadAction<string>) => {
      state.filters.startDate = action.payload
    },
    
    setEndDate: (state, action: PayloadAction<string>) => {
      state.filters.endDate = action.payload
    },
    
    setRoomTypeFilter: (state, action: PayloadAction<string | undefined>) => {
      state.filters.roomTypeId = action.payload
    },
    
    resetFilters: (state) => {
      state.filters = getDefaultDateRange()
    },
    
    clearAllReports: (state) => {
      state.occupancyData = []
      state.occupancyError = null
      state.occupancySummary = null
      
      state.revenueData = []
      state.revenueError = null
      state.revenueSummary = null
      
      state.bookingStatusData = []
      state.bookingStatusError = null
      state.bookingStatusSummary = null
      
      state.waitlistData = null
      state.waitlistError = null
    },
    
    clearExportError: (state) => {
      state.exportError = null
    },
  },
  extraReducers: (builder) => {
    // Occupancy Report
    builder
      .addCase(fetchOccupancyReport.pending, (state) => {
        state.occupancyLoading = true
        state.occupancyError = null
      })
      .addCase(fetchOccupancyReport.fulfilled, (state, action) => {
        state.occupancyLoading = false
        state.occupancyData = action.payload.data || []
        state.occupancySummary = action.payload.summary || null
      })
      .addCase(fetchOccupancyReport.rejected, (state, action) => {
        state.occupancyLoading = false
        state.occupancyError = action.error.message || 'Failed to fetch occupancy report'
      })
    
    // Revenue Report
    builder
      .addCase(fetchRevenueReport.pending, (state) => {
        state.revenueLoading = true
        state.revenueError = null
      })
      .addCase(fetchRevenueReport.fulfilled, (state, action) => {
        state.revenueLoading = false
        state.revenueData = action.payload.data || []
        state.revenueSummary = action.payload.summary || null
      })
      .addCase(fetchRevenueReport.rejected, (state, action) => {
        state.revenueLoading = false
        state.revenueError = action.error.message || 'Failed to fetch revenue report'
      })
    
    // Booking Status Report
    builder
      .addCase(fetchBookingStatusReport.pending, (state) => {
        state.bookingStatusLoading = true
        state.bookingStatusError = null
      })
      .addCase(fetchBookingStatusReport.fulfilled, (state, action) => {
        state.bookingStatusLoading = false
        state.bookingStatusData = action.payload.data || []
        state.bookingStatusSummary = action.payload.summary || null
      })
      .addCase(fetchBookingStatusReport.rejected, (state, action) => {
        state.bookingStatusLoading = false
        state.bookingStatusError = action.error.message || 'Failed to fetch booking status report'
      })
    
    // Waitlist Report
    builder
      .addCase(fetchWaitlistReport.pending, (state) => {
        state.waitlistLoading = true
        state.waitlistError = null
      })
      .addCase(fetchWaitlistReport.fulfilled, (state, action) => {
        state.waitlistLoading = false
        state.waitlistData = action.payload.data || null
      })
      .addCase(fetchWaitlistReport.rejected, (state, action) => {
        state.waitlistLoading = false
        state.waitlistError = action.error.message || 'Failed to fetch waitlist report'
      })
    
    // Export
    builder
      .addCase(exportReport.pending, (state) => {
        state.exportLoading = true
        state.exportError = null
      })
      .addCase(exportReport.fulfilled, (state, action) => {
        state.exportLoading = false
        state.lastExportFilename = action.payload.filename || null
      })
      .addCase(exportReport.rejected, (state, action) => {
        state.exportLoading = false
        state.exportError = action.error.message || 'Failed to export report'
      })
  },
})

// ==========================================
// ACTIONS
// ==========================================

export const {
  setFilters,
  setStartDate,
  setEndDate,
  setRoomTypeFilter,
  resetFilters,
  clearAllReports,
  clearExportError,
} = reportSlice.actions

// ==========================================
// SELECTORS
// ==========================================

export const selectFilters = (state: RootState) => state.reports.filters
export const selectStartDate = (state: RootState) => state.reports.filters.startDate
export const selectEndDate = (state: RootState) => state.reports.filters.endDate
export const selectRoomTypeFilter = (state: RootState) => state.reports.filters.roomTypeId

// Occupancy
export const selectOccupancyData = (state: RootState) => state.reports.occupancyData
export const selectOccupancyLoading = (state: RootState) => state.reports.occupancyLoading
export const selectOccupancyError = (state: RootState) => state.reports.occupancyError
export const selectOccupancySummary = (state: RootState) => state.reports.occupancySummary

// Revenue
export const selectRevenueData = (state: RootState) => state.reports.revenueData
export const selectRevenueLoading = (state: RootState) => state.reports.revenueLoading
export const selectRevenueError = (state: RootState) => state.reports.revenueError
export const selectRevenueSummary = (state: RootState) => state.reports.revenueSummary

// Booking Status
export const selectBookingStatusData = (state: RootState) => state.reports.bookingStatusData
export const selectBookingStatusLoading = (state: RootState) => state.reports.bookingStatusLoading
export const selectBookingStatusError = (state: RootState) => state.reports.bookingStatusError
export const selectBookingStatusSummary = (state: RootState) => state.reports.bookingStatusSummary

// Waitlist
export const selectWaitlistData = (state: RootState) => state.reports.waitlistData
export const selectWaitlistLoading = (state: RootState) => state.reports.waitlistLoading
export const selectWaitlistError = (state: RootState) => state.reports.waitlistError

// Export
export const selectExportLoading = (state: RootState) => state.reports.exportLoading
export const selectExportError = (state: RootState) => state.reports.exportError
export const selectLastExportFilename = (state: RootState) => state.reports.lastExportFilename

// Combined loading state
export const selectAnyLoading = (state: RootState) =>
  state.reports.occupancyLoading ||
  state.reports.revenueLoading ||
  state.reports.bookingStatusLoading ||
  state.reports.waitlistLoading

// Combined error state
export const selectAnyError = (state: RootState) =>
  state.reports.occupancyError ||
  state.reports.revenueError ||
  state.reports.bookingStatusError ||
  state.reports.waitlistError

export default reportSlice.reducer
