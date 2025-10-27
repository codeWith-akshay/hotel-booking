/**
 * Booking Slice (Day 15)
 * 
 * Redux Toolkit slice for admin booking management
 * Handles: bookings list, filters, pagination, sorting, async operations
 */

import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit'
import type { RootState } from '../store'
import type { BookingFilters } from '@/lib/validation/admin.validation'
import type { BookingStatus, PaymentStatus } from '@prisma/client'

// ==========================================
// TYPES
// ==========================================

export interface BookingListItem {
  id: string
  userId: string
  roomTypeId: string
  startDate: string
  endDate: string
  status: BookingStatus
  totalPrice: number
  roomsBooked: number
  depositAmount: number | null
  isDepositPaid: boolean
  createdAt: string
  updatedAt: string
  
  // Relations
  user?: {
    id: string
    name: string
    email: string | null
    phone: string
  }
  
  roomType?: {
    id: string
    name: string
    pricePerNight: number
  }
  
  payments?: Array<{
    id: string
    amount: number
    status: PaymentStatus
    provider: string
    createdAt: string
  }>
  
  // Computed
  paidAmount?: number
  paymentStatus?: 'PAID' | 'PARTIAL' | 'PENDING' | 'OFFLINE'
}

export interface BookingState {
  // Data
  bookings: BookingListItem[]
  selectedBooking: BookingListItem | null
  
  // Filters
  filters: BookingFilters
  
  // Pagination
  currentPage: number
  totalPages: number
  totalCount: number
  pageSize: number
  
  // UI state
  loading: boolean
  error: string | null
  
  // Selection
  selectedIds: string[]
  
  // Last refresh
  lastFetched: number | null
}

// ==========================================
// INITIAL STATE
// ==========================================

const initialState: BookingState = {
  bookings: [],
  selectedBooking: null,
  
  filters: {
    page: 1,
    limit: 20,
    sortBy: 'createdAt',
    sortOrder: 'desc',
  },
  
  currentPage: 1,
  totalPages: 1,
  totalCount: 0,
  pageSize: 20,
  
  loading: false,
  error: null,
  
  selectedIds: [],
  
  lastFetched: null,
}

// ==========================================
// ASYNC THUNKS
// ==========================================

/**
 * Fetch bookings from API with filters
 */
export const fetchBookings = createAsyncThunk(
  'bookings/fetchBookings',
  async (filters: Partial<BookingFilters> = {}, { rejectWithValue }) => {
    try {
      const params = new URLSearchParams()
      
      // Add all filter params
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          params.append(key, String(value))
        }
      })
      
      const response = await fetch(`/api/admin/bookings?${params.toString()}`)
      
      if (!response.ok) {
        const error = await response.json()
        return rejectWithValue(error.message || 'Failed to fetch bookings')
      }
      
      const data = await response.json()
      return data
    } catch (error: any) {
      return rejectWithValue(error.message || 'Network error')
    }
  }
)

/**
 * Mark offline payment for a booking
 */
export const markOfflinePayment = createAsyncThunk(
  'bookings/markOfflinePayment',
  async (
    payload: {
      bookingId: string
      adminId: string
      amount: number
      method: string
      notes?: string
    },
    { rejectWithValue }
  ) => {
    try {
      const response = await fetch('/api/admin/bookings/offline-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      
      if (!response.ok) {
        const error = await response.json()
        return rejectWithValue(error.message || 'Failed to mark payment')
      }
      
      const data = await response.json()
      return data
    } catch (error: any) {
      return rejectWithValue(error.message || 'Network error')
    }
  }
)

/**
 * Override booking status or details
 */
export const overrideBooking = createAsyncThunk(
  'bookings/overrideBooking',
  async (
    payload: {
      bookingId: string
      adminId: string
      action: string
      reason: string
      newStatus?: BookingStatus
      newStartDate?: string
      newEndDate?: string
      newRoomsBooked?: number
    },
    { rejectWithValue }
  ) => {
    try {
      const response = await fetch('/api/admin/bookings/override', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      
      if (!response.ok) {
        const error = await response.json()
        return rejectWithValue(error.message || 'Failed to override booking')
      }
      
      const data = await response.json()
      return data
    } catch (error: any) {
      return rejectWithValue(error.message || 'Network error')
    }
  }
)

/**
 * Generate invoice for a booking
 */
export const generateInvoice = createAsyncThunk(
  'bookings/generateInvoice',
  async (
    payload: {
      bookingId: string
      adminId: string
      format?: 'PDF' | 'HTML'
    },
    { rejectWithValue }
  ) => {
    try {
      const response = await fetch('/api/admin/bookings/generate-invoice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      
      if (!response.ok) {
        const error = await response.json()
        return rejectWithValue(error.message || 'Failed to generate invoice')
      }
      
      const data = await response.json()
      return data
    } catch (error: any) {
      return rejectWithValue(error.message || 'Network error')
    }
  }
)

// ==========================================
// SLICE
// ==========================================

const bookingSlice = createSlice({
  name: 'bookings',
  initialState,
  reducers: {
    // Filter actions
    setFilters: (state, action: PayloadAction<Partial<BookingFilters>>) => {
      state.filters = {
        ...state.filters,
        ...action.payload,
      }
      // Reset to page 1 when filters change
      if (action.payload.page === undefined) {
        state.filters.page = 1
        state.currentPage = 1
      }
    },
    
    resetFilters: (state) => {
      state.filters = initialState.filters
      state.currentPage = 1
    },
    
    // Pagination actions
    setPage: (state, action: PayloadAction<number>) => {
      state.currentPage = action.payload
      state.filters.page = action.payload
    },
    
    setPageSize: (state, action: PayloadAction<number>) => {
      state.pageSize = action.payload
      state.filters.limit = action.payload
      state.currentPage = 1
      state.filters.page = 1
    },
    
    // Selection actions
    selectBooking: (state, action: PayloadAction<BookingListItem | null>) => {
      state.selectedBooking = action.payload
    },
    
    toggleSelectId: (state, action: PayloadAction<string>) => {
      const id = action.payload
      const index = state.selectedIds.indexOf(id)
      
      if (index >= 0) {
        state.selectedIds.splice(index, 1)
      } else {
        state.selectedIds.push(id)
      }
    },
    
    selectAllIds: (state) => {
      state.selectedIds = state.bookings.map(b => b.id)
    },
    
    clearSelection: (state) => {
      state.selectedIds = []
      state.selectedBooking = null
    },
    
    // Update booking in list
    updateBookingInList: (state, action: PayloadAction<BookingListItem>) => {
      const index = state.bookings.findIndex(b => b.id === action.payload.id)
      if (index >= 0) {
        state.bookings[index] = action.payload
      }
    },
    
    // Clear error
    clearError: (state) => {
      state.error = null
    },
  },
  extraReducers: (builder) => {
    // Fetch bookings
    builder.addCase(fetchBookings.pending, (state) => {
      state.loading = true
      state.error = null
    })
    builder.addCase(fetchBookings.fulfilled, (state, action) => {
      state.loading = false
      state.bookings = action.payload.bookings || []
      state.totalCount = action.payload.total || 0
      state.totalPages = Math.ceil(state.totalCount / state.pageSize)
      state.lastFetched = Date.now()
    })
    builder.addCase(fetchBookings.rejected, (state, action) => {
      state.loading = false
      state.error = action.payload as string || 'Failed to fetch bookings'
    })
    
    // Mark offline payment
    builder.addCase(markOfflinePayment.pending, (state) => {
      state.loading = true
      state.error = null
    })
    builder.addCase(markOfflinePayment.fulfilled, (state, action) => {
      state.loading = false
      
      // Update booking in list
      if (action.payload.success && action.payload.booking) {
        const index = state.bookings.findIndex(b => b.id === action.payload.booking.id)
        if (index >= 0) {
          state.bookings[index] = {
            ...state.bookings[index],
            ...action.payload.booking,
          }
        }
      }
    })
    builder.addCase(markOfflinePayment.rejected, (state, action) => {
      state.loading = false
      state.error = action.payload as string || 'Failed to mark payment'
    })
    
    // Override booking
    builder.addCase(overrideBooking.pending, (state) => {
      state.loading = true
      state.error = null
    })
    builder.addCase(overrideBooking.fulfilled, (state, action) => {
      state.loading = false
      
      // Update booking in list
      if (action.payload.success && action.payload.booking) {
        const index = state.bookings.findIndex(b => b.id === action.payload.booking.id)
        if (index >= 0) {
          state.bookings[index] = {
            ...state.bookings[index],
            ...action.payload.booking,
          }
        }
      }
    })
    builder.addCase(overrideBooking.rejected, (state, action) => {
      state.loading = false
      state.error = action.payload as string || 'Failed to override booking'
    })
    
    // Generate invoice
    builder.addCase(generateInvoice.pending, (state) => {
      state.loading = true
      state.error = null
    })
    builder.addCase(generateInvoice.fulfilled, (state) => {
      state.loading = false
    })
    builder.addCase(generateInvoice.rejected, (state, action) => {
      state.loading = false
      state.error = action.payload as string || 'Failed to generate invoice'
    })
  },
})

// ==========================================
// ACTIONS
// ==========================================

export const {
  setFilters,
  resetFilters,
  setPage,
  setPageSize,
  selectBooking,
  toggleSelectId,
  selectAllIds,
  clearSelection,
  updateBookingInList,
  clearError,
} = bookingSlice.actions

// ==========================================
// SELECTORS
// ==========================================

export const selectBookings = (state: RootState) => state.adminBookings.bookings
export const selectSelectedBooking = (state: RootState) => state.adminBookings.selectedBooking
export const selectFilters = (state: RootState) => state.adminBookings.filters
export const selectPagination = (state: RootState) => ({
  currentPage: state.adminBookings.currentPage,
  totalPages: state.adminBookings.totalPages,
  totalCount: state.adminBookings.totalCount,
  pageSize: state.adminBookings.pageSize,
})
export const selectLoading = (state: RootState) => state.adminBookings.loading
export const selectError = (state: RootState) => state.adminBookings.error
export const selectSelectedIds = (state: RootState) => state.adminBookings.selectedIds
export const selectLastFetched = (state: RootState) => state.adminBookings.lastFetched

/**
 * Selector for filtered bookings (client-side filtering if needed)
 */
export const selectFilteredBookings = (state: RootState) => {
  return state.adminBookings.bookings
}

/**
 * Selector for selected bookings
 */
export const selectSelectedBookings = (state: RootState) => {
  const { bookings, selectedIds } = state.adminBookings
  return bookings.filter(b => selectedIds.includes(b.id))
}

/**
 * Selector for bookings by status
 */
export const selectBookingsByStatus = (status: BookingStatus) => (state: RootState) => {
  return state.adminBookings.bookings.filter(b => b.status === status)
}

/**
 * Selector for booking stats
 */
export const selectBookingStats = (state: RootState) => {
  const { bookings } = state.adminBookings
  
  return {
    total: bookings.length,
    confirmed: bookings.filter(b => b.status === 'CONFIRMED').length,
    provisional: bookings.filter(b => b.status === 'PROVISIONAL').length,
    cancelled: bookings.filter(b => b.status === 'CANCELLED').length,
    totalRevenue: bookings
      .filter(b => b.status !== 'CANCELLED')
      .reduce((sum, b) => sum + b.totalPrice, 0),
    paidRevenue: bookings
      .reduce((sum, b) => sum + (b.paidAmount || 0), 0),
  }
}

// ==========================================
// REDUCER
// ==========================================

export default bookingSlice.reducer
