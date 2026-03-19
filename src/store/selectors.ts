// ==========================================
// ZUSTAND STORE SELECTORS - Performance Optimization
// ==========================================
// Use these selectors to subscribe only to specific state slices
// This prevents re-renders when unrelated state changes

import { useShallow } from 'zustand/shallow'
import { useAuthStore, type AuthState, type User } from './auth.store'
import { useBookingStore, type BookingStep, type RoomSelection, type PriceBreakdown } from './bookingUIStore'

// ==========================================
// AUTH STORE SELECTORS
// ==========================================

/**
 * Select only authentication status - for guards and redirects
 * Re-renders only when isAuthenticated changes
 */
export const useIsAuthenticated = () => 
  useAuthStore((state) => state.isAuthenticated)

/**
 * Select only user data - for displaying user info
 * Re-renders only when user object changes
 */
export const useUser = () => 
  useAuthStore((state) => state.user)

/**
 * Select user role - for role-based rendering
 */
export const useUserRole = () => 
  useAuthStore((state) => state.user?.role ?? null)

/**
 * Select hydration status - for initial loading states
 */
export const useHasHydrated = () => 
  useAuthStore((state) => state._hasHydrated)

/**
 * Select auth loading state
 */
export const useAuthLoading = () => 
  useAuthStore((state) => state.isLoading)

/**
 * Select user and auth status together - shallow comparison
 * Good for components that need both
 */
export const useAuthUser = () =>
  useAuthStore(
    useShallow((state) => ({
      user: state.user,
      isAuthenticated: state.isAuthenticated,
      hasHydrated: state._hasHydrated,
    }))
  )

/**
 * Select auth actions only - never causes re-renders
 * Actions are stable references
 */
export const useAuthActions = () =>
  useAuthStore(
    useShallow((state) => ({
      setUser: state.setUser,
      setTokens: state.setTokens,
      logout: state.logout,
      setLoading: state.setLoading,
    }))
  )

/**
 * Select token for API calls
 */
export const useAuthToken = () => 
  useAuthStore((state) => state.token)

// ==========================================
// BOOKING STORE SELECTORS
// ==========================================

/**
 * Select current booking step
 */
export const useCurrentStep = () => 
  useBookingStore((state) => state.currentStep)

/**
 * Select booking dates - shallow comparison for date objects
 */
export const useBookingDates = () =>
  useBookingStore(
    useShallow((state) => ({
      startDate: state.startDate,
      endDate: state.endDate,
      nights: state.nights,
    }))
  )

/**
 * Select guest information
 */
export const useGuestInfo = () =>
  useBookingStore(
    useShallow((state) => ({
      guestType: state.guestType,
      adults: state.adults,
      children: state.children,
      totalGuests: state.totalGuests,
    }))
  )

/**
 * Select room selections
 */
export const useSelectedRooms = () => 
  useBookingStore((state) => state.selectedRooms)

/**
 * Select available room types
 */
export const useAvailableRoomTypes = () => 
  useBookingStore((state) => state.availableRoomTypes)

/**
 * Select pricing information
 */
export const useBookingPricing = () =>
  useBookingStore(
    useShallow((state) => ({
      priceBreakdown: state.priceBreakdown,
      totalPrice: state.totalPrice,
    }))
  )

/**
 * Select booking loading/error state
 */
export const useBookingStatus = () =>
  useBookingStore(
    useShallow((state) => ({
      isLoading: state.isLoading,
      error: state.error,
    }))
  )

/**
 * Select step navigation actions - stable references
 */
export const useBookingNavigation = () =>
  useBookingStore(
    useShallow((state) => ({
      nextStep: state.nextStep,
      previousStep: state.previousStep,
      goToStep: state.goToStep,
      currentStep: state.currentStep,
      isStepValid: state.isStepValid,
    }))
  )

/**
 * Select all booking actions - stable references
 */
export const useBookingActions = () =>
  useBookingStore(
    useShallow((state) => ({
      setDates: state.setDates,
      setGuestInfo: state.setGuestInfo,
      setAvailableRoomTypes: state.setAvailableRoomTypes,
      updateRoomSelection: state.updateRoomSelection,
      removeRoomSelection: state.removeRoomSelection,
      calculatePricing: state.calculatePricing,
      resetBooking: state.resetBooking,
      setLoading: state.setLoading,
      setError: state.setError,
    }))
  )

/**
 * Compact booking summary for display components
 */
export const useBookingSummary = () =>
  useBookingStore(
    useShallow((state) => ({
      startDate: state.startDate,
      endDate: state.endDate,
      nights: state.nights,
      totalGuests: state.totalGuests,
      totalRooms: state.totalRooms,
      totalPrice: state.totalPrice,
      selectedRooms: state.selectedRooms,
    }))
  )

// ==========================================
// COMPOSITE SELECTORS
// ==========================================

/**
 * Check if booking can proceed (all required data present)
 */
export const useCanProceedToPayment = () =>
  useBookingStore((state) => {
    const hasValidDates = state.startDate && state.endDate && state.nights > 0
    const hasRooms = state.selectedRooms.length > 0 && state.totalRooms > 0
    const hasGuests = state.totalGuests > 0
    return hasValidDates && hasRooms && hasGuests
  })

/**
 * Check if user can book (authenticated member with completed profile)
 */
export const useCanBook = () => {
  const isAuthenticated = useIsAuthenticated()
  const user = useUser()
  return isAuthenticated && user?.role === 'MEMBER' && user?.profileCompleted
}
