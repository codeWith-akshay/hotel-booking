// ==========================================
// BOOKINGS REDUX SLICE
// ==========================================
// Redux Toolkit slice for managing hotel bookings state
// Includes synchronous reducers and async thunks for server operations

import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit'
import type {
  Booking,
  CreateBookingPayload,
  UpdateBookingPayload,
  CancelBookingPayload,
  BookingFilters,
  BookingSortOptions,
  PaginatedBookingsResponse,
  BookingStats,
} from '@/types/booking.types'

// ==========================================
// STATE INTERFACE
// ==========================================

/**
 * Bookings slice state structure
 */
export interface BookingsState {
  // Data
  bookings: Booking[]              // Array of all bookings
  selectedBooking: Booking | null  // Currently selected booking (for details view)
  
  // Loading states
  loading: boolean                 // General loading state
  fetchLoading: boolean           // Loading when fetching bookings
  createLoading: boolean          // Loading when creating booking
  updateLoading: boolean          // Loading when updating booking
  deleteLoading: boolean          // Loading when deleting booking
  
  // Error states
  error: string | null            // General error message
  fetchError: string | null       // Error when fetching
  createError: string | null      // Error when creating
  updateError: string | null      // Error when updating
  deleteError: string | null      // Error when deleting
  
  // Pagination
  currentPage: number
  pageSize: number
  totalPages: number
  totalCount: number
  
  // Filters & Sort
  filters: BookingFilters
  sortOptions: BookingSortOptions
  
  // Statistics
  stats: BookingStats | null
  statsLoading: boolean
  
  // UI state
  isFilterPanelOpen: boolean
  selectedBookingIds: string[]    // For bulk operations
}

/**
 * Initial state
 */
const initialState: BookingsState = {
  // Data
  bookings: [],
  selectedBooking: null,
  
  // Loading states
  loading: false,
  fetchLoading: false,
  createLoading: false,
  updateLoading: false,
  deleteLoading: false,
  
  // Error states
  error: null,
  fetchError: null,
  createError: null,
  updateError: null,
  deleteError: null,
  
  // Pagination
  currentPage: 1,
  pageSize: 10,
  totalPages: 0,
  totalCount: 0,
  
  // Filters & Sort
  filters: {},
  sortOptions: {
    field: 'checkInDate',
    order: 'desc',
  },
  
  // Statistics
  stats: null,
  statsLoading: false,
  
  // UI state
  isFilterPanelOpen: false,
  selectedBookingIds: [],
}

// ==========================================
// ASYNC THUNKS
// ==========================================
// Async thunks handle server communication
// They dispatch actions automatically (pending, fulfilled, rejected)

/**
 * Fetch bookings from server
 * 
 * @example
 * dispatch(fetchBookings({ page: 1, pageSize: 10 }))
 */
export const fetchBookings = createAsyncThunk(
  'bookings/fetchBookings',
  async (
    params: {
      page?: number
      pageSize?: number
      filters?: BookingFilters
      sortOptions?: BookingSortOptions
    } = {},
    { rejectWithValue }
  ) => {
    try {
      // Import server action dynamically to avoid SSR issues
      const { getBookingsAction } = await import('@/actions/bookings/bookings.action')
      
      const response = await getBookingsAction({
        page: params.page || 1,
        pageSize: params.pageSize || 10,
        ...(params.filters && { filters: params.filters }),
        ...(params.sortOptions && { sortOptions: params.sortOptions }),
      })

      if (!response.success || !response.data) {
        return rejectWithValue(response.error || 'Failed to fetch bookings')
      }

      return response.data
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch bookings')
    }
  }
)

/**
 * Fetch single booking by ID
 * 
 * @example
 * dispatch(fetchBookingById('booking-123'))
 */
export const fetchBookingById = createAsyncThunk(
  'bookings/fetchBookingById',
  async (bookingId: string, { rejectWithValue }) => {
    try {
      const { getBookingByIdAction } = await import('@/actions/bookings/bookings.action')
      
      const response = await getBookingByIdAction(bookingId)

      if (!response.success || !response.data) {
        return rejectWithValue(response.error || 'Failed to fetch booking')
      }

      return response.data
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch booking')
    }
  }
)

/**
 * Create new booking
 * 
 * @example
 * dispatch(createBooking({ roomId: '123', checkInDate: '2024-01-01', ... }))
 */
export const createBooking = createAsyncThunk(
  'bookings/createBooking',
  async (payload: CreateBookingPayload, { rejectWithValue }) => {
    try {
      const { createBookingAction } = await import('@/actions/bookings/bookings.action')
      
      const response = await createBookingAction(payload)

      if (!response.success || !response.data) {
        return rejectWithValue(response.error || 'Failed to create booking')
      }

      return response.data
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to create booking')
    }
  }
)

/**
 * Update existing booking
 * 
 * @example
 * dispatch(updateBooking({ id: '123', status: BookingStatus.CONFIRMED }))
 */
export const updateBooking = createAsyncThunk(
  'bookings/updateBooking',
  async (payload: UpdateBookingPayload, { rejectWithValue }) => {
    try {
      const { updateBookingAction } = await import('@/actions/bookings/bookings.action')
      
      const response = await updateBookingAction(payload)

      if (!response.success || !response.data) {
        return rejectWithValue(response.error || 'Failed to update booking')
      }

      return response.data
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to update booking')
    }
  }
)

/**
 * Cancel booking
 * 
 * @example
 * dispatch(cancelBooking({ id: '123', reason: 'Guest requested' }))
 */
export const cancelBooking = createAsyncThunk(
  'bookings/cancelBooking',
  async (payload: CancelBookingPayload, { rejectWithValue }) => {
    try {
      const { cancelBookingAction } = await import('@/actions/bookings/bookings.action')
      
      const response = await cancelBookingAction(payload)

      if (!response.success || !response.data) {
        return rejectWithValue(response.error || 'Failed to cancel booking')
      }

      return response.data
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to cancel booking')
    }
  }
)

/**
 * Delete booking (hard delete)
 * 
 * @example
 * dispatch(deleteBooking('booking-123'))
 */
export const deleteBooking = createAsyncThunk(
  'bookings/deleteBooking',
  async (bookingId: string, { rejectWithValue }) => {
    try {
      const { deleteBookingAction } = await import('@/actions/bookings/bookings.action')
      
      const response = await deleteBookingAction(bookingId)

      if (!response.success) {
        return rejectWithValue(response.error || 'Failed to delete booking')
      }

      return { id: bookingId }
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to delete booking')
    }
  }
)

/**
 * Fetch booking statistics
 * 
 * @example
 * dispatch(fetchBookingStats())
 */
export const fetchBookingStats = createAsyncThunk(
  'bookings/fetchBookingStats',
  async (_, { rejectWithValue }) => {
    try {
      const { getBookingStatsAction } = await import('@/actions/bookings/bookings.action')
      
      const response = await getBookingStatsAction()

      if (!response.success || !response.data) {
        return rejectWithValue(response.error || 'Failed to fetch statistics')
      }

      return response.data
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch statistics')
    }
  }
)

// ==========================================
// SLICE DEFINITION
// ==========================================

/**
 * Bookings slice
 * Contains reducers for synchronous state updates and extra reducers for async thunks
 */
const bookingsSlice = createSlice({
  name: 'bookings',
  initialState,
  
  // ==========================================
  // SYNCHRONOUS REDUCERS
  // ==========================================
  // These update state immediately without server calls
  
  reducers: {
    /**
     * Set bookings array directly
     * Useful when you have data from SSR or other sources
     */
    setBookings: (state, action: PayloadAction<Booking[]>) => {
      state.bookings = action.payload
      state.totalCount = action.payload.length
      state.error = null
    },

    /**
     * Add a booking to the list (optimistic update)
     * Useful for real-time updates or optimistic UI
     */
    addBooking: (state, action: PayloadAction<Booking>) => {
      state.bookings.unshift(action.payload) // Add to beginning
      state.totalCount += 1
    },

    /**
     * Update a booking in the list (optimistic update)
     */
    updateBookingInList: (state, action: PayloadAction<Booking>) => {
      const index = state.bookings.findIndex((b) => b.id === action.payload.id)
      if (index !== -1) {
        state.bookings[index] = action.payload
      }
      
      // Also update selected booking if it's the same one
      if (state.selectedBooking?.id === action.payload.id) {
        state.selectedBooking = action.payload
      }
    },

    /**
     * Remove a booking from the list (optimistic update)
     */
    removeBooking: (state, action: PayloadAction<string>) => {
      state.bookings = state.bookings.filter((b) => b.id !== action.payload)
      state.totalCount -= 1
      
      // Clear selected booking if it's the deleted one
      if (state.selectedBooking?.id === action.payload) {
        state.selectedBooking = null
      }
    },

    /**
     * Set selected booking (for details view)
     */
    setSelectedBooking: (state, action: PayloadAction<Booking | null>) => {
      state.selectedBooking = action.payload
    },

    /**
     * Clear selected booking
     */
    clearSelectedBooking: (state) => {
      state.selectedBooking = null
    },

    /**
     * Set filters
     */
    setFilters: (state, action: PayloadAction<BookingFilters>) => {
      state.filters = action.payload
      state.currentPage = 1 // Reset to first page when filters change
    },

    /**
     * Clear filters
     */
    clearFilters: (state) => {
      state.filters = {}
      state.currentPage = 1
    },

    /**
     * Set sort options
     */
    setSortOptions: (state, action: PayloadAction<BookingSortOptions>) => {
      state.sortOptions = action.payload
    },

    /**
     * Set current page
     */
    setCurrentPage: (state, action: PayloadAction<number>) => {
      state.currentPage = action.payload
    },

    /**
     * Set page size
     */
    setPageSize: (state, action: PayloadAction<number>) => {
      state.pageSize = action.payload
      state.currentPage = 1 // Reset to first page when page size changes
    },

    /**
     * Toggle filter panel
     */
    toggleFilterPanel: (state) => {
      state.isFilterPanelOpen = !state.isFilterPanelOpen
    },

    /**
     * Select booking for bulk operations
     */
    selectBooking: (state, action: PayloadAction<string>) => {
      if (!state.selectedBookingIds.includes(action.payload)) {
        state.selectedBookingIds.push(action.payload)
      }
    },

    /**
     * Deselect booking
     */
    deselectBooking: (state, action: PayloadAction<string>) => {
      state.selectedBookingIds = state.selectedBookingIds.filter((id) => id !== action.payload)
    },

    /**
     * Select all bookings
     */
    selectAllBookings: (state) => {
      state.selectedBookingIds = state.bookings.map((b) => b.id)
    },

    /**
     * Deselect all bookings
     */
    deselectAllBookings: (state) => {
      state.selectedBookingIds = []
    },

    /**
     * Clear all errors
     */
    clearErrors: (state) => {
      state.error = null
      state.fetchError = null
      state.createError = null
      state.updateError = null
      state.deleteError = null
    },

    /**
     * Reset bookings state to initial
     */
    resetBookingsState: () => initialState,
  },

  // ==========================================
  // ASYNC REDUCERS (Extra Reducers)
  // ==========================================
  // These handle async thunk lifecycle (pending, fulfilled, rejected)
  
  extraReducers: (builder) => {
    // ==========================================
    // FETCH BOOKINGS
    // ==========================================
    
    builder
      .addCase(fetchBookings.pending, (state) => {
        state.fetchLoading = true
        state.loading = true
        state.fetchError = null
        state.error = null
      })
      .addCase(fetchBookings.fulfilled, (state, action: PayloadAction<PaginatedBookingsResponse>) => {
        state.fetchLoading = false
        state.loading = false
        state.bookings = action.payload.bookings
        state.totalCount = action.payload.total
        state.currentPage = action.payload.page
        state.pageSize = action.payload.pageSize
        state.totalPages = action.payload.totalPages
        state.fetchError = null
        state.error = null
      })
      .addCase(fetchBookings.rejected, (state, action) => {
        state.fetchLoading = false
        state.loading = false
        state.fetchError = action.payload as string
        state.error = action.payload as string
      })

    // ==========================================
    // FETCH BOOKING BY ID
    // ==========================================
    
    builder
      .addCase(fetchBookingById.pending, (state) => {
        state.fetchLoading = true
        state.loading = true
        state.fetchError = null
      })
      .addCase(fetchBookingById.fulfilled, (state, action: PayloadAction<Booking>) => {
        state.fetchLoading = false
        state.loading = false
        state.selectedBooking = action.payload
        state.fetchError = null
      })
      .addCase(fetchBookingById.rejected, (state, action) => {
        state.fetchLoading = false
        state.loading = false
        state.fetchError = action.payload as string
        state.error = action.payload as string
      })

    // ==========================================
    // CREATE BOOKING
    // ==========================================
    
    builder
      .addCase(createBooking.pending, (state) => {
        state.createLoading = true
        state.loading = true
        state.createError = null
        state.error = null
      })
      .addCase(createBooking.fulfilled, (state, action: PayloadAction<Booking>) => {
        state.createLoading = false
        state.loading = false
        // Add new booking to the beginning of the list
        state.bookings.unshift(action.payload)
        state.totalCount += 1
        state.createError = null
        state.error = null
      })
      .addCase(createBooking.rejected, (state, action) => {
        state.createLoading = false
        state.loading = false
        state.createError = action.payload as string
        state.error = action.payload as string
      })

    // ==========================================
    // UPDATE BOOKING
    // ==========================================
    
    builder
      .addCase(updateBooking.pending, (state) => {
        state.updateLoading = true
        state.loading = true
        state.updateError = null
        state.error = null
      })
      .addCase(updateBooking.fulfilled, (state, action: PayloadAction<Booking>) => {
        state.updateLoading = false
        state.loading = false
        
        // Update booking in list
        const index = state.bookings.findIndex((b) => b.id === action.payload.id)
        if (index !== -1) {
          state.bookings[index] = action.payload
        }
        
        // Update selected booking
        if (state.selectedBooking?.id === action.payload.id) {
          state.selectedBooking = action.payload
        }
        
        state.updateError = null
        state.error = null
      })
      .addCase(updateBooking.rejected, (state, action) => {
        state.updateLoading = false
        state.loading = false
        state.updateError = action.payload as string
        state.error = action.payload as string
      })

    // ==========================================
    // CANCEL BOOKING
    // ==========================================
    
    builder
      .addCase(cancelBooking.pending, (state) => {
        state.updateLoading = true
        state.loading = true
        state.updateError = null
      })
      .addCase(cancelBooking.fulfilled, (state, action: PayloadAction<Booking>) => {
        state.updateLoading = false
        state.loading = false
        
        // Update booking in list
        const index = state.bookings.findIndex((b) => b.id === action.payload.id)
        if (index !== -1) {
          state.bookings[index] = action.payload
        }
        
        // Update selected booking
        if (state.selectedBooking?.id === action.payload.id) {
          state.selectedBooking = action.payload
        }
        
        state.updateError = null
      })
      .addCase(cancelBooking.rejected, (state, action) => {
        state.updateLoading = false
        state.loading = false
        state.updateError = action.payload as string
        state.error = action.payload as string
      })

    // ==========================================
    // DELETE BOOKING
    // ==========================================
    
    builder
      .addCase(deleteBooking.pending, (state) => {
        state.deleteLoading = true
        state.loading = true
        state.deleteError = null
        state.error = null
      })
      .addCase(deleteBooking.fulfilled, (state, action: PayloadAction<{ id: string }>) => {
        state.deleteLoading = false
        state.loading = false
        
        // Remove booking from list
        state.bookings = state.bookings.filter((b) => b.id !== action.payload.id)
        state.totalCount -= 1
        
        // Clear selected booking if deleted
        if (state.selectedBooking?.id === action.payload.id) {
          state.selectedBooking = null
        }
        
        state.deleteError = null
        state.error = null
      })
      .addCase(deleteBooking.rejected, (state, action) => {
        state.deleteLoading = false
        state.loading = false
        state.deleteError = action.payload as string
        state.error = action.payload as string
      })

    // ==========================================
    // FETCH STATISTICS
    // ==========================================
    
    builder
      .addCase(fetchBookingStats.pending, (state) => {
        state.statsLoading = true
      })
      .addCase(fetchBookingStats.fulfilled, (state, action: PayloadAction<BookingStats>) => {
        state.statsLoading = false
        state.stats = action.payload
      })
      .addCase(fetchBookingStats.rejected, (state) => {
        state.statsLoading = false
      })
  },
})

// ==========================================
// EXPORTS
// ==========================================

// Export actions
export const {
  setBookings,
  addBooking,
  updateBookingInList,
  removeBooking,
  setSelectedBooking,
  clearSelectedBooking,
  setFilters,
  clearFilters,
  setSortOptions,
  setCurrentPage,
  setPageSize,
  toggleFilterPanel,
  selectBooking,
  deselectBooking,
  selectAllBookings,
  deselectAllBookings,
  clearErrors,
  resetBookingsState,
} = bookingsSlice.actions

// Export reducer
export default bookingsSlice.reducer

// Export state type
export type { BookingsState } from './bookingsSlice'
