// ==========================================
// BOOKING STORE - Zustand State Management
// ==========================================
// Manages booking-related state including selected room type,
// date range, and calendar availability data

import { create } from 'zustand'
import { devtools, persist } from 'zustand/middleware'
import type { RoomAvailabilityByDate } from '@/types/room.types'

// ==========================================
// TYPES
// ==========================================

/**
 * Date range for booking
 */
export interface DateRange {
  from: Date
  to: Date | null
}

/**
 * Booking store state
 */
interface BookingState {
  // ==========================================
  // STATE
  // ==========================================
  
  /** Currently selected room type ID */
  selectedRoomTypeId: string | null
  
  /** Selected date range for booking */
  dateRange: DateRange
  
  /** Cached availability data for the selected room type */
  availabilityData: RoomAvailabilityByDate[] | null
  
  /** Loading state for availability fetch */
  isLoadingAvailability: boolean
  
  /** Error message if availability fetch fails */
  availabilityError: string | null
  
  /** Number of guests */
  guestCount: number
  
  /** Number of rooms to book */
  roomCount: number
  
  // ==========================================
  // ACTIONS
  // ==========================================
  
  /**
   * Set the selected room type
   * Clears availability data when room type changes
   */
  setRoomType: (roomTypeId: string | null) => void
  
  /**
   * Update the date range
   */
  setDateRange: (range: DateRange) => void
  
  /**
   * Set check-in date
   */
  setCheckIn: (date: Date) => void
  
  /**
   * Set check-out date
   */
  setCheckOut: (date: Date | null) => void
  
  /**
   * Update availability data
   */
  setAvailabilityData: (data: RoomAvailabilityByDate[]) => void
  
  /**
   * Set loading state for availability
   */
  setLoadingAvailability: (isLoading: boolean) => void
  
  /**
   * Set availability error
   */
  setAvailabilityError: (error: string | null) => void
  
  /**
   * Set number of guests
   */
  setGuestCount: (count: number) => void
  
  /**
   * Set number of rooms
   */
  setRoomCount: (count: number) => void
  
  /**
   * Reset booking state to initial values
   */
  resetBooking: () => void
  
  /**
   * Clear only the date range
   */
  clearDates: () => void
  
  /**
   * Clear availability cache
   */
  clearAvailability: () => void
}

// ==========================================
// INITIAL STATE
// ==========================================

const initialState = {
  selectedRoomTypeId: null,
  dateRange: {
    from: new Date(),
    to: null,
  },
  availabilityData: null,
  isLoadingAvailability: false,
  availabilityError: null,
  guestCount: 1,
  roomCount: 1,
}

// ==========================================
// STORE
// ==========================================

/**
 * Booking store using Zustand
 * 
 * Features:
 * - DevTools integration for debugging
 * - Persist selected room type and date range to localStorage
 * - Type-safe actions and state
 * 
 * @example
 * ```tsx
 * import { useBookingStore } from '@/store/booking.store'
 * 
 * function BookingForm() {
 *   const { selectedRoomTypeId, dateRange, setRoomType, setDateRange } = useBookingStore()
 *   
 *   return (
 *     <div>
 *       <RoomTypeSelector 
 *         value={selectedRoomTypeId} 
 *         onChange={setRoomType} 
 *       />
 *       <EnhancedBookingCalendar
 *         roomTypeId={selectedRoomTypeId}
 *         selectedRange={dateRange}
 *         onSelect={setDateRange}
 *       />
 *     </div>
 *   )
 * }
 * ```
 */
export const useBookingStore = create<BookingState>()(
  devtools(
    persist(
      (set) => ({
        // Initial state
        ...initialState,

        // Actions
        setRoomType: (roomTypeId) =>
          set(
            (state) => ({
              selectedRoomTypeId: roomTypeId,
              // Clear availability when room type changes
              availabilityData: null,
              availabilityError: null,
            }),
            false,
            'setRoomType'
          ),

        setDateRange: (range) =>
          set(
            { dateRange: range },
            false,
            'setDateRange'
          ),

        setCheckIn: (date) =>
          set(
            (state) => ({
              dateRange: {
                ...state.dateRange,
                from: date,
              },
            }),
            false,
            'setCheckIn'
          ),

        setCheckOut: (date) =>
          set(
            (state) => ({
              dateRange: {
                ...state.dateRange,
                to: date,
              },
            }),
            false,
            'setCheckOut'
          ),

        setAvailabilityData: (data) =>
          set(
            {
              availabilityData: data,
              availabilityError: null,
              isLoadingAvailability: false,
            },
            false,
            'setAvailabilityData'
          ),

        setLoadingAvailability: (isLoading) =>
          set(
            { isLoadingAvailability: isLoading },
            false,
            'setLoadingAvailability'
          ),

        setAvailabilityError: (error) =>
          set(
            {
              availabilityError: error,
              isLoadingAvailability: false,
            },
            false,
            'setAvailabilityError'
          ),

        setGuestCount: (count) =>
          set(
            { guestCount: Math.max(1, count) },
            false,
            'setGuestCount'
          ),

        setRoomCount: (count) =>
          set(
            { roomCount: Math.max(1, count) },
            false,
            'setRoomCount'
          ),

        resetBooking: () =>
          set(
            initialState,
            false,
            'resetBooking'
          ),

        clearDates: () =>
          set(
            {
              dateRange: {
                from: new Date(),
                to: null,
              },
            },
            false,
            'clearDates'
          ),

        clearAvailability: () =>
          set(
            {
              availabilityData: null,
              availabilityError: null,
              isLoadingAvailability: false,
            },
            false,
            'clearAvailability'
          ),
      }),
      {
        name: 'booking-storage',
        // Only persist selected room type and date range
        partialize: (state) => ({
          selectedRoomTypeId: state.selectedRoomTypeId,
          dateRange: state.dateRange,
          guestCount: state.guestCount,
          roomCount: state.roomCount,
        }),
      }
    ),
    {
      name: 'BookingStore',
    }
  )
)

// ==========================================
// SELECTORS
// ==========================================

/**
 * Selector hooks for common derived state
 */

/**
 * Check if a date range is fully selected
 */
export const useIsDateRangeComplete = () =>
  useBookingStore((state) => state.dateRange.from !== null && state.dateRange.to !== null)

/**
 * Calculate number of nights
 */
export const useNightCount = () =>
  useBookingStore((state) => {
    const { from, to } = state.dateRange
    if (!from || !to) return 0
    return Math.ceil((to.getTime() - from.getTime()) / (1000 * 60 * 60 * 24))
  })

/**
 * Check if booking is ready to submit
 */
export const useIsBookingReady = () =>
  useBookingStore((state) => {
    return (
      state.selectedRoomTypeId !== null &&
      state.dateRange.from !== null &&
      state.dateRange.to !== null &&
      state.guestCount > 0 &&
      state.roomCount > 0
    )
  })

/**
 * Get availability for a specific date
 */
export const useAvailabilityForDate = (dateString: string) =>
  useBookingStore((state) => {
    if (!state.availabilityData) return null
    return state.availabilityData.find((item) => item.date === dateString)
  })
