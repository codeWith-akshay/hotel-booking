'use client'

// ==========================================
// REDUX TOOLKIT USAGE EXAMPLES
// ==========================================
// Comprehensive examples showing Redux Toolkit patterns

import React, { useEffect, useState } from 'react'
import { useAppDispatch, useAppSelector } from '@/redux/store'
import {
  // Async thunks
  fetchBookings,
  fetchBookingById,
  createBooking,
  updateBooking,
  cancelBooking,
  deleteBooking,
  fetchBookingStats,
  // Sync actions
  setFilters,
  clearFilters,
  setSortOptions,
  setCurrentPage,
  setPageSize,
  selectBooking,
  deselectBooking,
  selectAllBookings,
  deselectAllBookings,
  clearErrors,
} from '@/redux/slices/bookingsSlice'
import {
  // Selectors
  selectBookings,
  selectSelectedBooking,
  selectLoading,
  selectError,
  selectActiveBookings,
  selectCompletedBookings,
  selectTotalRevenue,
  selectPaginationInfo,
  selectBookingById,
  selectStatusCounts,
} from '@/redux/selectors/bookingsSelectors'
import { BookingStatus, PaymentStatus } from '@/types/booking.types'

// ==========================================
// EXAMPLE 1: Fetch Bookings List
// ==========================================

export function Example1_FetchBookings() {
  const dispatch = useAppDispatch()
  
  // Select data from store
  const bookings = useAppSelector(selectBookings)
  const loading = useAppSelector(selectLoading)
  const error = useAppSelector(selectError)

  useEffect(() => {
    // Fetch bookings on component mount
    dispatch(fetchBookings({ page: 1, pageSize: 10 }))
  }, [dispatch])

  if (loading) return <div>Loading bookings...</div>
  if (error) return <div>Error: {error}</div>

  return (
    <div className="rounded-lg border p-4">
      <h3 className="mb-2 font-bold">Example 1: Fetch Bookings</h3>
      <p className="mb-2">Found {bookings.length} bookings</p>
      
      <div className="space-y-2">
        {bookings.map((booking) => (
          <div key={booking.id} className="rounded bg-gray-100 p-2">
            <p className="font-semibold">{booking.bookingNumber}</p>
            <p className="text-sm">Guest: {booking.guest.name}</p>
            <p className="text-sm">Room: {booking.room.roomNumber}</p>
            <p className="text-sm">Status: {booking.status}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

// ==========================================
// EXAMPLE 2: Create New Booking
// ==========================================

export function Example2_CreateBooking() {
  const dispatch = useAppDispatch()
  const loading = useAppSelector((state) => state.bookings.createLoading)
  const error = useAppSelector((state) => state.bookings.createError)

  const handleCreate = async () => {
    try {
      const result = await dispatch(
        createBooking({
          roomId: 'room-101',
          checkInDate: '2024-12-01',
          checkOutDate: '2024-12-03',
          numberOfGuests: 2,
          numberOfAdults: 2,
          numberOfChildren: 0,
          specialRequests: 'Late check-in please',
        })
      ).unwrap() // .unwrap() throws error if rejected

      console.log('Booking created:', result)
      alert('Booking created successfully!')
    } catch (err: any) {
      console.error('Failed to create booking:', err)
      alert(`Error: ${err}`)
    }
  }

  return (
    <div className="rounded-lg border p-4">
      <h3 className="mb-2 font-bold">Example 2: Create Booking</h3>
      
      <button
        onClick={handleCreate}
        disabled={loading}
        className="rounded bg-blue-500 px-4 py-2 text-white disabled:opacity-50"
      >
        {loading ? 'Creating...' : 'Create Booking'}
      </button>

      {error && <p className="mt-2 text-sm text-red-600">Error: {error}</p>}
    </div>
  )
}

// ==========================================
// EXAMPLE 3: Update Booking Status
// ==========================================

export function Example3_UpdateBooking() {
  const dispatch = useAppDispatch()
  const bookings = useAppSelector(selectBookings)
  const loading = useAppSelector((state) => state.bookings.updateLoading)

  const handleConfirm = async (bookingId: string) => {
    try {
      await dispatch(
        updateBooking({
          id: bookingId,
          status: BookingStatus.CONFIRMED,
          paymentStatus: PaymentStatus.PAID,
        })
      ).unwrap()

      alert('Booking confirmed!')
    } catch (err: any) {
      alert(`Error: ${err}`)
    }
  }

  const handleCheckIn = async (bookingId: string) => {
    try {
      await dispatch(
        updateBooking({
          id: bookingId,
          status: BookingStatus.CHECKED_IN,
        })
      ).unwrap()

      alert('Checked in!')
    } catch (err: any) {
      alert(`Error: ${err}`)
    }
  }

  return (
    <div className="rounded-lg border p-4">
      <h3 className="mb-2 font-bold">Example 3: Update Booking</h3>
      
      <div className="space-y-2">
        {bookings.slice(0, 3).map((booking) => (
          <div key={booking.id} className="flex items-center justify-between rounded bg-gray-100 p-2">
            <div>
              <p className="font-semibold">{booking.bookingNumber}</p>
              <p className="text-sm">Status: {booking.status}</p>
            </div>
            
            <div className="flex gap-2">
              {booking.status === BookingStatus.PENDING && (
                <button
                  onClick={() => handleConfirm(booking.id)}
                  disabled={loading}
                  className="rounded bg-green-500 px-2 py-1 text-sm text-white"
                >
                  Confirm
                </button>
              )}
              
              {booking.status === BookingStatus.CONFIRMED && (
                <button
                  onClick={() => handleCheckIn(booking.id)}
                  disabled={loading}
                  className="rounded bg-blue-500 px-2 py-1 text-sm text-white"
                >
                  Check In
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ==========================================
// EXAMPLE 4: Cancel Booking
// ==========================================

export function Example4_CancelBooking() {
  const dispatch = useAppDispatch()
  const bookings = useAppSelector(selectActiveBookings) // Only active bookings
  const loading = useAppSelector((state) => state.bookings.updateLoading)

  const handleCancel = async (bookingId: string) => {
    if (!confirm('Are you sure you want to cancel this booking?')) return

    try {
      await dispatch(
        cancelBooking({
          id: bookingId,
          reason: 'Cancelled by user',
        })
      ).unwrap()

      alert('Booking cancelled!')
    } catch (err: any) {
      alert(`Error: ${err}`)
    }
  }

  return (
    <div className="rounded-lg border p-4">
      <h3 className="mb-2 font-bold">Example 4: Cancel Booking</h3>
      
      <div className="space-y-2">
        {bookings.slice(0, 3).map((booking) => (
          <div key={booking.id} className="flex items-center justify-between rounded bg-gray-100 p-2">
            <div>
              <p className="font-semibold">{booking.bookingNumber}</p>
              <p className="text-sm">{booking.guest.name}</p>
            </div>
            
            <button
              onClick={() => handleCancel(booking.id)}
              disabled={loading}
              className="rounded bg-red-500 px-2 py-1 text-sm text-white"
            >
              Cancel
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}

// ==========================================
// EXAMPLE 5: Memoized Selectors
// ==========================================

export function Example5_MemoizedSelectors() {
  // These selectors are memoized - they only recompute when dependencies change
  const activeBookings = useAppSelector(selectActiveBookings)
  const completedBookings = useAppSelector(selectCompletedBookings)
  const totalRevenue = useAppSelector(selectTotalRevenue)
  const statusCounts = useAppSelector(selectStatusCounts)

  return (
    <div className="rounded-lg border p-4">
      <h3 className="mb-2 font-bold">Example 5: Memoized Selectors</h3>
      
      <div className="grid grid-cols-2 gap-2">
        <div className="rounded bg-blue-100 p-2">
          <p className="text-sm font-semibold">Active</p>
          <p className="text-2xl">{activeBookings.length}</p>
        </div>
        
        <div className="rounded bg-gray-100 p-2">
          <p className="text-sm font-semibold">Completed</p>
          <p className="text-2xl">{completedBookings.length}</p>
        </div>
        
        <div className="col-span-2 rounded bg-green-100 p-2">
          <p className="text-sm font-semibold">Total Revenue</p>
          <p className="text-2xl">${totalRevenue.toFixed(2)}</p>
        </div>
      </div>

      <div className="mt-4">
        <p className="mb-2 text-sm font-semibold">Status Breakdown:</p>
        <div className="space-y-1 text-sm">
          <p>Pending: {statusCounts.PENDING}</p>
          <p>Confirmed: {statusCounts.CONFIRMED}</p>
          <p>Checked In: {statusCounts.CHECKED_IN}</p>
          <p>Checked Out: {statusCounts.CHECKED_OUT}</p>
          <p>Cancelled: {statusCounts.CANCELLED}</p>
        </div>
      </div>
    </div>
  )
}

// ==========================================
// EXAMPLE 6: Filtering & Sorting
// ==========================================

export function Example6_FilteringAndSorting() {
  const dispatch = useAppDispatch()
  const bookings = useAppSelector(selectBookings)
  const filters = useAppSelector((state) => state.bookings.filters)

  const handleFilter = (status: BookingStatus) => {
    dispatch(setFilters({ status }))
    dispatch(fetchBookings({ filters: { status } }))
  }

  const handleClearFilters = () => {
    dispatch(clearFilters())
    dispatch(fetchBookings({}))
  }

  const handleSort = (field: 'checkInDate' | 'totalAmount') => {
    dispatch(setSortOptions({ field, order: 'desc' }))
    dispatch(fetchBookings({ sortOptions: { field, order: 'desc' } }))
  }

  return (
    <div className="rounded-lg border p-4">
      <h3 className="mb-2 font-bold">Example 6: Filtering & Sorting</h3>
      
      <div className="mb-4 flex flex-wrap gap-2">
        <button
          onClick={() => handleFilter(BookingStatus.PENDING)}
          className="rounded bg-yellow-500 px-2 py-1 text-sm text-white"
        >
          Pending
        </button>
        <button
          onClick={() => handleFilter(BookingStatus.CONFIRMED)}
          className="rounded bg-blue-500 px-2 py-1 text-sm text-white"
        >
          Confirmed
        </button>
        <button
          onClick={() => handleFilter(BookingStatus.CHECKED_IN)}
          className="rounded bg-green-500 px-2 py-1 text-sm text-white"
        >
          Checked In
        </button>
        <button
          onClick={handleClearFilters}
          className="rounded bg-gray-500 px-2 py-1 text-sm text-white"
        >
          Clear
        </button>
      </div>

      <div className="mb-4 flex gap-2">
        <button
          onClick={() => handleSort('checkInDate')}
          className="rounded bg-purple-500 px-2 py-1 text-sm text-white"
        >
          Sort by Date
        </button>
        <button
          onClick={() => handleSort('totalAmount')}
          className="rounded bg-purple-500 px-2 py-1 text-sm text-white"
        >
          Sort by Amount
        </button>
      </div>

      <p className="text-sm text-gray-600">
        {filters.status ? `Filtered by: ${filters.status}` : 'No filters'}
      </p>
      <p className="text-sm text-gray-600">{bookings.length} results</p>
    </div>
  )
}

// ==========================================
// EXAMPLE 7: Pagination
// ==========================================

export function Example7_Pagination() {
  const dispatch = useAppDispatch()
  const paginationInfo = useAppSelector(selectPaginationInfo)
  const loading = useAppSelector(selectLoading)

  const handlePageChange = (page: number) => {
    dispatch(setCurrentPage(page))
    dispatch(fetchBookings({ page }))
  }

  const handlePageSizeChange = (size: number) => {
    dispatch(setPageSize(size))
    dispatch(fetchBookings({ pageSize: size, page: 1 }))
  }

  return (
    <div className="rounded-lg border p-4">
      <h3 className="mb-2 font-bold">Example 7: Pagination</h3>
      
      <div className="mb-4">
        <p className="text-sm">
          Showing {paginationInfo.startIndex}-{paginationInfo.endIndex} of {paginationInfo.totalCount}
        </p>
      </div>

      <div className="mb-4 flex gap-2">
        <button
          onClick={() => handlePageChange(paginationInfo.currentPage - 1)}
          disabled={paginationInfo.currentPage === 1 || loading}
          className="rounded bg-blue-500 px-3 py-1 text-white disabled:opacity-50"
        >
          Previous
        </button>
        
        <span className="flex items-center px-2">
          Page {paginationInfo.currentPage} of {paginationInfo.totalPages}
        </span>
        
        <button
          onClick={() => handlePageChange(paginationInfo.currentPage + 1)}
          disabled={paginationInfo.currentPage >= paginationInfo.totalPages || loading}
          className="rounded bg-blue-500 px-3 py-1 text-white disabled:opacity-50"
        >
          Next
        </button>
      </div>

      <div className="flex gap-2">
        <span className="text-sm">Per page:</span>
        {[10, 20, 50].map((size) => (
          <button
            key={size}
            onClick={() => handlePageSizeChange(size)}
            className={`rounded px-2 py-1 text-sm ${
              paginationInfo.pageSize === size
                ? 'bg-blue-500 text-white'
                : 'bg-gray-200'
            }`}
          >
            {size}
          </button>
        ))}
      </div>
    </div>
  )
}

// ==========================================
// EXAMPLE 8: Bulk Operations
// ==========================================

export function Example8_BulkOperations() {
  const dispatch = useAppDispatch()
  const bookings = useAppSelector(selectBookings)
  const selectedIds = useAppSelector((state) => state.bookings.selectedBookingIds)

  const handleSelect = (id: string) => {
    if (selectedIds.includes(id)) {
      dispatch(deselectBooking(id))
    } else {
      dispatch(selectBooking(id))
    }
  }

  const handleSelectAll = () => {
    if (selectedIds.length === bookings.length) {
      dispatch(deselectAllBookings())
    } else {
      dispatch(selectAllBookings())
    }
  }

  const handleBulkCancel = async () => {
    if (!confirm(`Cancel ${selectedIds.length} bookings?`)) return

    for (const id of selectedIds) {
      await dispatch(cancelBooking({ id, reason: 'Bulk cancel' }))
    }

    dispatch(deselectAllBookings())
    alert('Bookings cancelled!')
  }

  return (
    <div className="rounded-lg border p-4">
      <h3 className="mb-2 font-bold">Example 8: Bulk Operations</h3>
      
      <div className="mb-4 flex gap-2">
        <button
          onClick={handleSelectAll}
          className="rounded bg-gray-500 px-2 py-1 text-sm text-white"
        >
          {selectedIds.length === bookings.length ? 'Deselect All' : 'Select All'}
        </button>
        
        {selectedIds.length > 0 && (
          <button
            onClick={handleBulkCancel}
            className="rounded bg-red-500 px-2 py-1 text-sm text-white"
          >
            Cancel Selected ({selectedIds.length})
          </button>
        )}
      </div>

      <div className="space-y-2">
        {bookings.slice(0, 5).map((booking) => (
          <div
            key={booking.id}
            className={`flex items-center gap-2 rounded p-2 ${
              selectedIds.includes(booking.id) ? 'bg-blue-100' : 'bg-gray-100'
            }`}
          >
            <input
              type="checkbox"
              checked={selectedIds.includes(booking.id)}
              onChange={() => handleSelect(booking.id)}
            />
            <div className="flex-1">
              <p className="font-semibold">{booking.bookingNumber}</p>
              <p className="text-sm">{booking.guest.name}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ==========================================
// EXAMPLE 9: Statistics Dashboard
// ==========================================

export function Example9_Statistics() {
  const dispatch = useAppDispatch()
  const stats = useAppSelector(selectStats)
  const loading = useAppSelector(selectStatsLoading)

  useEffect(() => {
    dispatch(fetchBookingStats())
  }, [dispatch])

  if (loading) return <div>Loading statistics...</div>
  if (!stats) return <div>No statistics available</div>

  return (
    <div className="rounded-lg border p-4">
      <h3 className="mb-2 font-bold">Example 9: Statistics</h3>
      
      <div className="grid grid-cols-3 gap-2">
        <div className="rounded bg-blue-100 p-2 text-center">
          <p className="text-2xl font-bold">{stats.total}</p>
          <p className="text-sm">Total</p>
        </div>
        <div className="rounded bg-green-100 p-2 text-center">
          <p className="text-2xl font-bold">{stats.confirmed}</p>
          <p className="text-sm">Confirmed</p>
        </div>
        <div className="rounded bg-yellow-100 p-2 text-center">
          <p className="text-2xl font-bold">{stats.pending}</p>
          <p className="text-sm">Pending</p>
        </div>
        <div className="col-span-3 rounded bg-purple-100 p-2">
          <p className="text-2xl font-bold">${stats.totalRevenue.toFixed(2)}</p>
          <p className="text-sm">Total Revenue</p>
        </div>
        <div className="col-span-3 rounded bg-orange-100 p-2">
          <p className="text-2xl font-bold">{stats.occupancyRate}%</p>
          <p className="text-sm">Occupancy Rate</p>
        </div>
      </div>
    </div>
  )
}

// ==========================================
// DEMO PAGE
// ==========================================

export default function ReduxExamplesPage() {
  return (
    <div className="min-h-screen bg-white p-8 dark:bg-gray-900">
      <div className="mx-auto max-w-6xl">
        <h1 className="mb-6 text-3xl font-bold">Redux Toolkit Examples</h1>
        
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Example1_FetchBookings />
          <Example2_CreateBooking />
          <Example3_UpdateBooking />
          <Example4_CancelBooking />
          <Example5_MemoizedSelectors />
          <Example6_FilteringAndSorting />
          <Example7_Pagination />
          <Example8_BulkOperations />
          <Example9_Statistics />
        </div>
      </div>
    </div>
  )
}
