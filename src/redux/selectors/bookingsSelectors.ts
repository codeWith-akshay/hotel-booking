// ==========================================
// BOOKINGS SELECTORS
// ==========================================
// Memoized selectors for efficient state access
// Use these instead of direct state access for better performance

import { createSelector } from '@reduxjs/toolkit'
import type { RootState } from '../store'
import type { Booking, BookingStatus, PaymentStatus } from '@/types/booking.types'
import {
  isActiveBooking,
  isCompletedBooking,
  isCancellableBooking,
  isPaidBooking,
  hasPaymentPending,
} from '@/types/booking.types'

// ==========================================
// BASE SELECTORS
// ==========================================
// These directly access state slices

/**
 * Select entire bookings state
 */
export const selectBookingsState = (state: RootState) => state.bookings

/**
 * Select bookings array
 */
export const selectBookings = (state: RootState) => state.bookings.bookings

/**
 * Select selected booking
 */
export const selectSelectedBooking = (state: RootState) => state.bookings.selectedBooking

/**
 * Select loading states
 */
export const selectLoading = (state: RootState) => state.bookings.loading
export const selectFetchLoading = (state: RootState) => state.bookings.fetchLoading
export const selectCreateLoading = (state: RootState) => state.bookings.createLoading
export const selectUpdateLoading = (state: RootState) => state.bookings.updateLoading
export const selectDeleteLoading = (state: RootState) => state.bookings.deleteLoading

/**
 * Select error states
 */
export const selectError = (state: RootState) => state.bookings.error
export const selectFetchError = (state: RootState) => state.bookings.fetchError
export const selectCreateError = (state: RootState) => state.bookings.createError
export const selectUpdateError = (state: RootState) => state.bookings.updateError
export const selectDeleteError = (state: RootState) => state.bookings.deleteError

/**
 * Select pagination
 */
export const selectCurrentPage = (state: RootState) => state.bookings.currentPage
export const selectPageSize = (state: RootState) => state.bookings.pageSize
export const selectTotalPages = (state: RootState) => state.bookings.totalPages
export const selectTotalCount = (state: RootState) => state.bookings.totalCount

/**
 * Select filters and sort
 */
export const selectFilters = (state: RootState) => state.bookings.filters
export const selectSortOptions = (state: RootState) => state.bookings.sortOptions

/**
 * Select statistics
 */
export const selectStats = (state: RootState) => state.bookings.stats
export const selectStatsLoading = (state: RootState) => state.bookings.statsLoading

/**
 * Select UI state
 */
export const selectIsFilterPanelOpen = (state: RootState) => state.bookings.isFilterPanelOpen
export const selectSelectedBookingIds = (state: RootState) => state.bookings.selectedBookingIds

// ==========================================
// MEMOIZED SELECTORS
// ==========================================
// These use createSelector for memoization and derived data

/**
 * Select booking by ID
 * Memoized - only recomputes when bookings array or ID changes
 * 
 * @example
 * const booking = useAppSelector((state) => selectBookingById(state, bookingId))
 */
export const selectBookingById = createSelector(
  [selectBookings, (_state: RootState, bookingId: string) => bookingId],
  (bookings, bookingId) => bookings.find((b) => b.id === bookingId) || null
)

/**
 * Select bookings count
 * Memoized - only recomputes when bookings array changes
 */
export const selectBookingsCount = createSelector(
  [selectBookings],
  (bookings) => bookings.length
)

/**
 * Select if there are any bookings
 */
export const selectHasBookings = createSelector(
  [selectBookings],
  (bookings) => bookings.length > 0
)

/**
 * Select if list is empty and not loading
 */
export const selectIsEmpty = createSelector(
  [selectBookings, selectLoading],
  (bookings, loading) => bookings.length === 0 && !loading
)

// ==========================================
// FILTERED SELECTORS
// ==========================================

/**
 * Select active bookings (pending or confirmed)
 */
export const selectActiveBookings = createSelector(
  [selectBookings],
  (bookings) => bookings.filter(isActiveBooking)
)

/**
 * Select completed bookings (checked out, cancelled, no show)
 */
export const selectCompletedBookings = createSelector(
  [selectBookings],
  (bookings) => bookings.filter(isCompletedBooking)
)

/**
 * Select cancellable bookings
 */
export const selectCancellableBookings = createSelector(
  [selectBookings],
  (bookings) => bookings.filter(isCancellableBooking)
)

/**
 * Select bookings with pending payment
 */
export const selectBookingsWithPendingPayment = createSelector(
  [selectBookings],
  (bookings) => bookings.filter(hasPaymentPending)
)

/**
 * Select paid bookings
 */
export const selectPaidBookings = createSelector(
  [selectBookings],
  (bookings) => bookings.filter(isPaidBooking)
)

/**
 * Select bookings by status
 */
export const selectBookingsByStatus = createSelector(
  [selectBookings, (_state: RootState, status: BookingStatus) => status],
  (bookings, status) => bookings.filter((b) => b.status === status)
)

/**
 * Select bookings by payment status
 */
export const selectBookingsByPaymentStatus = createSelector(
  [selectBookings, (_state: RootState, paymentStatus: PaymentStatus) => paymentStatus],
  (bookings, paymentStatus) => bookings.filter((b) => b.paymentStatus === paymentStatus)
)

/**
 * Select bookings by guest ID
 */
export const selectBookingsByGuestId = createSelector(
  [selectBookings, (_state: RootState, guestId: string) => guestId],
  (bookings, guestId) => bookings.filter((b) => b.guestId === guestId)
)

/**
 * Select bookings by room ID
 */
export const selectBookingsByRoomId = createSelector(
  [selectBookings, (_state: RootState, roomId: string) => roomId],
  (bookings, roomId) => bookings.filter((b) => b.roomId === roomId)
)

/**
 * Select bookings by date range (check-in date)
 */
export const selectBookingsByDateRange = createSelector(
  [
    selectBookings,
    (_state: RootState, startDate: string, _endDate: string) => startDate,
    (_state: RootState, _startDate: string, endDate: string) => endDate,
  ],
  (bookings, startDate, endDate) =>
    bookings.filter(
      (b) => b.checkInDate >= startDate && b.checkInDate <= endDate
    )
)

/**
 * Select today's check-ins
 */
export const selectTodaysCheckIns = createSelector(
  [selectBookings],
  (bookings) => {
    const today = new Date().toISOString().split('T')[0]
    return bookings.filter((b) => b.checkInDate === today)
  }
)

/**
 * Select today's check-outs
 */
export const selectTodaysCheckOuts = createSelector(
  [selectBookings],
  (bookings) => {
    const today = new Date().toISOString().split('T')[0]
    return bookings.filter((b) => b.checkOutDate === today)
  }
)

// ==========================================
// COMPUTED SELECTORS
// ==========================================

/**
 * Calculate total revenue from all bookings
 */
export const selectTotalRevenue = createSelector(
  [selectBookings],
  (bookings) =>
    bookings.reduce((total, booking) => total + booking.finalAmount, 0)
)

/**
 * Calculate pending revenue (unpaid bookings)
 */
export const selectPendingRevenue = createSelector(
  [selectBookingsWithPendingPayment],
  (bookings) =>
    bookings.reduce((total, booking) => total + booking.finalAmount, 0)
)

/**
 * Calculate collected revenue (paid bookings)
 */
export const selectCollectedRevenue = createSelector(
  [selectPaidBookings],
  (bookings) =>
    bookings.reduce((total, booking) => total + booking.finalAmount, 0)
)

/**
 * Get bookings grouped by status
 */
export const selectBookingsGroupedByStatus = createSelector(
  [selectBookings],
  (bookings) => {
    const grouped: Record<BookingStatus, Booking[]> = {
      PENDING: [],
      CONFIRMED: [],
      CHECKED_IN: [],
      CHECKED_OUT: [],
      CANCELLED: [],
      NO_SHOW: [],
    }

    bookings.forEach((booking) => {
      grouped[booking.status].push(booking)
    })

    return grouped
  }
)

/**
 * Get status counts
 */
export const selectStatusCounts = createSelector(
  [selectBookings],
  (bookings) => {
    const counts: Record<BookingStatus, number> = {
      PENDING: 0,
      CONFIRMED: 0,
      CHECKED_IN: 0,
      CHECKED_OUT: 0,
      CANCELLED: 0,
      NO_SHOW: 0,
    }

    bookings.forEach((booking) => {
      counts[booking.status] += 1
    })

    return counts
  }
)

/**
 * Get payment status counts
 */
export const selectPaymentStatusCounts = createSelector(
  [selectBookings],
  (bookings) => {
    const counts: Record<PaymentStatus, number> = {
      PENDING: 0,
      PAID: 0,
      PARTIAL: 0,
      REFUNDED: 0,
      FAILED: 0,
    }

    bookings.forEach((booking) => {
      counts[booking.paymentStatus] += 1
    })

    return counts
  }
)

/**
 * Calculate average booking value
 */
export const selectAverageBookingValue = createSelector(
  [selectBookings],
  (bookings) => {
    if (bookings.length === 0) return 0
    const total = bookings.reduce((sum, b) => sum + b.finalAmount, 0)
    return total / bookings.length
  }
)

/**
 * Get selected bookings (for bulk operations)
 */
export const selectSelectedBookingsData = createSelector(
  [selectBookings, selectSelectedBookingIds],
  (bookings, selectedIds) =>
    bookings.filter((b) => selectedIds.includes(b.id))
)

/**
 * Check if all bookings are selected
 */
export const selectAreAllBookingsSelected = createSelector(
  [selectBookings, selectSelectedBookingIds],
  (bookings, selectedIds) =>
    bookings.length > 0 && bookings.length === selectedIds.length
)

/**
 * Check if some bookings are selected (but not all)
 */
export const selectAreSomeBookingsSelected = createSelector(
  [selectBookings, selectSelectedBookingIds],
  (bookings, selectedIds) =>
    selectedIds.length > 0 && selectedIds.length < bookings.length
)

// ==========================================
// PAGINATION SELECTORS
// ==========================================

/**
 * Check if there's a next page
 */
export const selectHasNextPage = createSelector(
  [selectCurrentPage, selectTotalPages],
  (currentPage, totalPages) => currentPage < totalPages
)

/**
 * Check if there's a previous page
 */
export const selectHasPreviousPage = createSelector(
  [selectCurrentPage],
  (currentPage) => currentPage > 1
)

/**
 * Get pagination info
 */
export const selectPaginationInfo = createSelector(
  [selectCurrentPage, selectPageSize, selectTotalPages, selectTotalCount],
  (currentPage, pageSize, totalPages, totalCount) => ({
    currentPage,
    pageSize,
    totalPages,
    totalCount,
    startIndex: (currentPage - 1) * pageSize + 1,
    endIndex: Math.min(currentPage * pageSize, totalCount),
  })
)

// ==========================================
// SEARCH SELECTOR
// ==========================================

/**
 * Search bookings by query string
 * Searches in: booking number, guest name, guest email, room number
 */
export const selectSearchedBookings = createSelector(
  [selectBookings, (_state: RootState, query: string) => query],
  (bookings, query) => {
    if (!query || query.trim() === '') return bookings

    const lowerQuery = query.toLowerCase().trim()

    return bookings.filter(
      (booking) =>
        booking.bookingNumber.toLowerCase().includes(lowerQuery) ||
        booking.guest.name.toLowerCase().includes(lowerQuery) ||
        booking.guest.email?.toLowerCase().includes(lowerQuery) ||
        booking.room.roomNumber.toLowerCase().includes(lowerQuery)
    )
  }
)

// ==========================================
// EXPORTS
// ==========================================

/**
 * Export all selectors as a single object
 * Useful for importing multiple selectors at once
 */
export const bookingsSelectors = {
  // Base
  selectBookingsState,
  selectBookings,
  selectSelectedBooking,
  selectLoading,
  selectError,
  
  // Filtered
  selectActiveBookings,
  selectCompletedBookings,
  selectCancellableBookings,
  selectBookingsWithPendingPayment,
  selectPaidBookings,
  
  // Computed
  selectTotalRevenue,
  selectPendingRevenue,
  selectCollectedRevenue,
  selectBookingsGroupedByStatus,
  selectStatusCounts,
  selectPaymentStatusCounts,
  selectAverageBookingValue,
  
  // Pagination
  selectCurrentPage,
  selectPageSize,
  selectTotalPages,
  selectTotalCount,
  selectHasNextPage,
  selectHasPreviousPage,
  selectPaginationInfo,
  
  // UI
  selectIsFilterPanelOpen,
  selectSelectedBookingIds,
  selectSelectedBookingsData,
  selectAreAllBookingsSelected,
  selectAreSomeBookingsSelected,
  
  // Stats
  selectStats,
  selectStatsLoading,
}
