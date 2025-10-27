/**
 * Session Store (Day 14 - Member Dashboard)
 * 
 * Zustand store for managing user session state and member bookings.
 * Handles current user info, bookings list, loading states, and filters.
 * 
 * Features:
 * - Current user session data
 * - Bookings list with filtering
 * - Loading and error states
 * - Actions for fetching and updating bookings
 */

import { create } from 'zustand'
import { devtools, persist } from 'zustand/middleware'
import { BookingStatus, PaymentStatus } from '@prisma/client'

// ==========================================
// TYPES
// ==========================================

export interface User {
  id: string
  name: string
  email: string | null
  phone: string
  roleId: string
  roleName: string
}

export interface RoomType {
  id: string
  name: string
  description: string
  pricePerNight: number
  totalRooms: number
}

export interface Payment {
  id: string
  amount: number
  currency: string
  status: PaymentStatus
  provider: string
  invoicePath: string | null
  paidAt: Date | null
  createdAt: Date
}

export interface Booking {
  id: string
  userId: string
  roomTypeId: string
  startDate: Date
  endDate: Date
  status: BookingStatus
  totalPrice: number
  roomsBooked: number
  depositAmount: number | null
  isDepositPaid: boolean
  createdAt: Date
  updatedAt: Date
  roomType: RoomType
  payments: Payment[]
}

export type BookingFilter = 'all' | 'upcoming' | 'past' | 'cancelled' | 'waitlisted'

interface SessionState {
  // User session
  user: User | null
  isAuthenticated: boolean
  
  // Bookings data
  bookings: Booking[]
  filteredBookings: Booking[]
  currentFilter: BookingFilter
  
  // UI state
  isLoading: boolean
  error: string | null
  
  // Actions
  setUser: (user: User | null) => void
  setBookings: (bookings: Booking[]) => void
  addBooking: (booking: Booking) => void
  updateBooking: (bookingId: string, updates: Partial<Booking>) => void
  removeBooking: (bookingId: string) => void
  setFilter: (filter: BookingFilter) => void
  setLoading: (isLoading: boolean) => void
  setError: (error: string | null) => void
  clearSession: () => void
}

// ==========================================
// HELPER FUNCTIONS
// ==========================================

/**
 * Filter bookings based on selected filter type
 */
function filterBookings(bookings: Booking[], filter: BookingFilter): Booking[] {
  const now = new Date()
  
  switch (filter) {
    case 'upcoming':
      return bookings.filter(
        b => b.status !== BookingStatus.CANCELLED && new Date(b.startDate) > now
      )
    
    case 'past':
      return bookings.filter(
        b => b.status !== BookingStatus.CANCELLED && new Date(b.endDate) < now
      )
    
    case 'cancelled':
      return bookings.filter(b => b.status === BookingStatus.CANCELLED)
    
    case 'waitlisted':
      // Note: Waitlist entries are in a separate table, this is a placeholder
      return bookings.filter(b => b.status === BookingStatus.PROVISIONAL)
    
    case 'all':
    default:
      return bookings
  }
}

/**
 * Calculate payment status for a booking
 */
export function getPaymentStatus(booking: Booking): 'PAID' | 'PENDING' | 'PARTIAL' {
  const successfulPayments = booking.payments.filter(
    p => p.status === PaymentStatus.SUCCEEDED
  )
  
  const totalPaid = successfulPayments.reduce((sum, p) => sum + p.amount, 0)
  
  if (totalPaid >= booking.totalPrice) {
    return 'PAID'
  } else if (totalPaid > 0) {
    return 'PARTIAL'
  }
  
  return 'PENDING'
}

/**
 * Check if booking can be cancelled
 */
export function canCancelBooking(booking: Booking): boolean {
  // Cannot cancel if already cancelled
  if (booking.status === BookingStatus.CANCELLED) {
    return false
  }
  
  // Cannot cancel if past start date
  if (new Date(booking.startDate) < new Date()) {
    return false
  }
  
  // Add cancellation deadline logic here (e.g., 24 hours before)
  const cancellationDeadline = new Date(booking.startDate)
  cancellationDeadline.setHours(cancellationDeadline.getHours() - 24)
  
  if (new Date() > cancellationDeadline) {
    return false
  }
  
  return true
}

/**
 * Calculate nights from booking dates
 */
export function calculateNights(startDate: Date, endDate: Date): number {
  const start = new Date(startDate)
  const end = new Date(endDate)
  const diffTime = Math.abs(end.getTime() - start.getTime())
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  return diffDays
}

// ==========================================
// STORE
// ==========================================

export const useSessionStore = create<SessionState>()(
  devtools(
    persist(
      (set, get) => ({
        // Initial state
        user: null,
        isAuthenticated: false,
        bookings: [],
        filteredBookings: [],
        currentFilter: 'all',
        isLoading: false,
        error: null,
        
        // User actions
        setUser: (user) =>
          set({
            user,
            isAuthenticated: user !== null,
          }),
        
        // Booking actions
        setBookings: (bookings) =>
          set((state) => ({
            bookings,
            filteredBookings: filterBookings(bookings, state.currentFilter),
          })),
        
        addBooking: (booking) =>
          set((state) => {
            const updatedBookings = [booking, ...state.bookings]
            return {
              bookings: updatedBookings,
              filteredBookings: filterBookings(updatedBookings, state.currentFilter),
            }
          }),
        
        updateBooking: (bookingId, updates) =>
          set((state) => {
            const updatedBookings = state.bookings.map((b) =>
              b.id === bookingId ? { ...b, ...updates } : b
            )
            return {
              bookings: updatedBookings,
              filteredBookings: filterBookings(updatedBookings, state.currentFilter),
            }
          }),
        
        removeBooking: (bookingId) =>
          set((state) => {
            const updatedBookings = state.bookings.filter((b) => b.id !== bookingId)
            return {
              bookings: updatedBookings,
              filteredBookings: filterBookings(updatedBookings, state.currentFilter),
            }
          }),
        
        // Filter actions
        setFilter: (filter) =>
          set((state) => ({
            currentFilter: filter,
            filteredBookings: filterBookings(state.bookings, filter),
          })),
        
        // UI state actions
        setLoading: (isLoading) => set({ isLoading }),
        
        setError: (error) => set({ error }),
        
        // Clear session
        clearSession: () =>
          set({
            user: null,
            isAuthenticated: false,
            bookings: [],
            filteredBookings: [],
            currentFilter: 'all',
            error: null,
          }),
      }),
      {
        name: 'member-session-storage',
        partialize: (state) => ({
          user: state.user,
          isAuthenticated: state.isAuthenticated,
        }),
      }
    ),
    { name: 'SessionStore' }
  )
)
