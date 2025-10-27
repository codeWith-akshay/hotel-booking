// ==========================================
// BOOKING STORE - Zustand State Management
// ==========================================
// Manages booking UI state for the multi-step booking process
// Features: Date selection, guest type, room selection, and pricing

import { create } from 'zustand'
import { devtools, persist } from 'zustand/middleware'
import type { GuestType } from '@prisma/client'

// ==========================================
// TYPES
// ==========================================

/**
 * Room selection with quantity and pricing
 */
export interface RoomSelection {
  roomTypeId: string
  roomTypeName: string
  quantity: number
  pricePerNight: number
  availableRooms: number
  subtotal: number
}

/**
 * Room type with availability information
 */
export interface RoomTypeWithAvailability {
  id: string
  name: string
  description: string
  pricePerNight: number
  totalRooms: number
  availableRooms: number
  imageUrl?: string
  amenities: string[]
}

/**
 * Booking step enumeration
 */
export enum BookingStep {
  DATES = 'dates',
  GUESTS = 'guests', 
  ROOMS = 'rooms',
  SUMMARY = 'summary'
}

/**
 * Price breakdown structure
 */
export interface PriceBreakdown {
  roomsSubtotal: number
  taxesAndFees: number
  discounts: number
  totalPrice: number
  nights: number
}

// ==========================================
// STORE INTERFACE
// ==========================================

interface BookingState {
  // ==========================================
  // BOOKING FLOW STATE
  // ==========================================
  
  /** Current step in the booking process */
  currentStep: BookingStep
  
  /** Whether the booking flow is loading */
  isLoading: boolean
  
  /** Error message if any */
  error: string | null
  
  // ==========================================
  // DATE SELECTION
  // ==========================================
  
  /** Selected check-in date */
  startDate: Date | null
  
  /** Selected check-out date */
  endDate: Date | null
  
  /** Number of nights calculated */
  nights: number
  
  // ==========================================
  // GUEST INFORMATION
  // ==========================================
  
  /** Guest type for booking rules */
  guestType: GuestType
  
  /** Number of adult guests */
  adults: number
  
  /** Number of child guests */
  children: number
  
  /** Total number of guests */
  totalGuests: number
  
  // ==========================================
  // ROOM SELECTION
  // ==========================================
  
  /** Available room types with pricing */
  availableRoomTypes: RoomTypeWithAvailability[]
  
  /** Selected rooms with quantities */
  selectedRooms: RoomSelection[]
  
  /** Total number of rooms selected */
  totalRooms: number
  
  // ==========================================
  // PRICING
  // ==========================================
  
  /** Detailed price breakdown */
  priceBreakdown: PriceBreakdown
  
  /** Final total price */
  totalPrice: number
  
  // ==========================================
  // ACTIONS
  // ==========================================
  
  /**
   * Set booking dates and calculate nights
   */
  setDates: (startDate: Date | null, endDate: Date | null) => void
  
  /**
   * Set guest information
   */
  setGuestInfo: (guestType: GuestType, adults: number, children: number) => void
  
  /**
   * Set available room types from API response
   */
  setAvailableRoomTypes: (roomTypes: RoomTypeWithAvailability[]) => void
  
  /**
   * Update room selection quantity
   */
  updateRoomSelection: (roomTypeId: string, quantity: number) => void
  
  /**
   * Remove room from selection
   */
  removeRoomSelection: (roomTypeId: string) => void
  
  /**
   * Calculate total pricing and breakdown
   */
  calculatePricing: () => void
  
  /**
   * Navigate to next step
   */
  nextStep: () => void
  
  /**
   * Navigate to previous step
   */
  previousStep: () => void
  
  /**
   * Go to specific step
   */
  goToStep: (step: BookingStep) => void
  
  /**
   * Set loading state
   */
  setLoading: (loading: boolean) => void
  
  /**
   * Set error message
   */
  setError: (error: string | null) => void
  
  /**
   * Reset booking state
   */
  resetBooking: () => void
  
  /**
   * Check if current step is valid
   */
  isStepValid: (step?: BookingStep) => boolean
  
  /**
   * Get booking summary for confirmation
   */
  getBookingSummary: () => {
    dateRange: { startDate: Date; endDate: Date; nights: number }
    guestInfo: { guestType: GuestType; adults: number; children: number; totalGuests: number }
    roomSelection: RoomSelection[]
    pricing: PriceBreakdown
  }
}

// ==========================================
// INITIAL STATE
// ==========================================

const initialState = {
  // Flow state
  currentStep: BookingStep.DATES,
  isLoading: false,
  error: null,
  
  // Date selection
  startDate: null,
  endDate: null,
  nights: 0,
  
  // Guest information
  guestType: 'REGULAR' as GuestType,
  adults: 1,
  children: 0,
  totalGuests: 1,
  
  // Room selection
  availableRoomTypes: [],
  selectedRooms: [],
  totalRooms: 0,
  
  // Pricing
  priceBreakdown: {
    roomsSubtotal: 0,
    taxesAndFees: 0,
    discounts: 0,
    totalPrice: 0,
    nights: 0,
  },
  totalPrice: 0,
}

// ==========================================
// STORE IMPLEMENTATION
// ==========================================

export const useBookingStore = create<BookingState>()(
  devtools(
    persist(
      (set, get) => ({
        ...initialState,

        // ==========================================
        // DATE ACTIONS
        // ==========================================
        
        setDates: (startDate, endDate) => {
          const nights = startDate && endDate 
            ? Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))
            : 0

          set(
            (state) => ({
              ...state,
              startDate,
              endDate,
              nights,
              error: null,
            }),
            false,
            'setDates'
          )
          
          // Recalculate pricing if dates change
          get().calculatePricing()
        },

        // ==========================================
        // GUEST INFO ACTIONS  
        // ==========================================
        
        setGuestInfo: (guestType, adults, children) => {
          set(
            (state) => ({
              ...state,
              guestType,
              adults,
              children,
              totalGuests: adults + children,
              error: null,
            }),
            false,
            'setGuestInfo'
          )
        },

        // ==========================================
        // ROOM SELECTION ACTIONS
        // ==========================================
        
        setAvailableRoomTypes: (roomTypes) => {
          set(
            (state) => ({
              ...state,
              availableRoomTypes: roomTypes,
              error: null,
            }),
            false,
            'setAvailableRoomTypes'
          )
        },
        
        updateRoomSelection: (roomTypeId, quantity) => {
          set(
            (state) => {
              const roomType = state.availableRoomTypes.find(rt => rt.id === roomTypeId)
              if (!roomType) return state

              const existingSelection = state.selectedRooms.find(sr => sr.roomTypeId === roomTypeId)
              
              let newSelectedRooms: RoomSelection[]
              
              if (quantity === 0) {
                // Remove room selection
                newSelectedRooms = state.selectedRooms.filter(sr => sr.roomTypeId !== roomTypeId)
              } else if (existingSelection) {
                // Update existing selection
                newSelectedRooms = state.selectedRooms.map(sr =>
                  sr.roomTypeId === roomTypeId
                    ? {
                        ...sr,
                        quantity,
                        subtotal: quantity * sr.pricePerNight * state.nights,
                      }
                    : sr
                )
              } else {
                // Add new selection
                const newSelection: RoomSelection = {
                  roomTypeId,
                  roomTypeName: roomType.name,
                  quantity,
                  pricePerNight: roomType.pricePerNight,
                  availableRooms: roomType.availableRooms,
                  subtotal: quantity * roomType.pricePerNight * state.nights,
                }
                newSelectedRooms = [...state.selectedRooms, newSelection]
              }

              const totalRooms = newSelectedRooms.reduce((sum, sr) => sum + sr.quantity, 0)

              return {
                ...state,
                selectedRooms: newSelectedRooms,
                totalRooms,
                error: null,
              }
            },
            false,
            'updateRoomSelection'
          )
          
          // Recalculate pricing after room selection changes
          get().calculatePricing()
        },
        
        removeRoomSelection: (roomTypeId) => {
          get().updateRoomSelection(roomTypeId, 0)
        },

        // ==========================================
        // PRICING ACTIONS
        // ==========================================
        
        calculatePricing: () => {
          set(
            (state) => {
              const roomsSubtotal = state.selectedRooms.reduce((sum, sr) => sum + sr.subtotal, 0)
              const taxesAndFees = Math.round(roomsSubtotal * 0.12) // 12% taxes and fees
              const discounts = 0 // TODO: Implement discount logic
              const totalPrice = roomsSubtotal + taxesAndFees - discounts

              const priceBreakdown: PriceBreakdown = {
                roomsSubtotal,
                taxesAndFees,
                discounts,
                totalPrice,
                nights: state.nights,
              }

              return {
                ...state,
                priceBreakdown,
                totalPrice,
              }
            },
            false,
            'calculatePricing'
          )
        },

        // ==========================================
        // NAVIGATION ACTIONS
        // ==========================================
        
        nextStep: () => {
          const { currentStep } = get()
          
          const stepOrder = [BookingStep.DATES, BookingStep.GUESTS, BookingStep.ROOMS, BookingStep.SUMMARY]
          const currentIndex = stepOrder.indexOf(currentStep)
          
          if (currentIndex < stepOrder.length - 1 && currentIndex >= 0) {
            const nextStepValue = stepOrder[currentIndex + 1]
            if (nextStepValue && get().isStepValid(currentStep)) {
              set(
                (state) => ({ ...state, currentStep: nextStepValue, error: null }),
                false,
                'nextStep'
              )
            }
          }
        },
        
        previousStep: () => {
          const { currentStep } = get()
          
          const stepOrder = [BookingStep.DATES, BookingStep.GUESTS, BookingStep.ROOMS, BookingStep.SUMMARY]
          const currentIndex = stepOrder.indexOf(currentStep)
          
          if (currentIndex > 0) {
            const prevStepValue = stepOrder[currentIndex - 1]
            if (prevStepValue) {
              set(
                (state) => ({ ...state, currentStep: prevStepValue, error: null }),
                false,
                'previousStep'
              )
            }
          }
        },
        
        goToStep: (step) => {
          set(
            (state) => ({ ...state, currentStep: step, error: null }),
            false,
            'goToStep'
          )
        },

        // ==========================================
        // UTILITY ACTIONS
        // ==========================================
        
        setLoading: (loading) => {
          set(
            (state) => ({ ...state, isLoading: loading }),
            false,
            'setLoading'
          )
        },
        
        setError: (error) => {
          set(
            (state) => ({ ...state, error, isLoading: false }),
            false,
            'setError'
          )
        },
        
        resetBooking: () => {
          set(
            () => ({ ...initialState }),
            false,
            'resetBooking'
          )
        },
        
        isStepValid: (step) => {
          const state = get()
          const targetStep = step || state.currentStep
          
          switch (targetStep) {
            case BookingStep.DATES:
              return state.startDate !== null && state.endDate !== null && state.nights > 0
            
            case BookingStep.GUESTS:
              return state.adults >= 1 && state.totalGuests <= 10 // Max 10 guests
            
            case BookingStep.ROOMS:
              return state.selectedRooms.length > 0 && state.totalRooms > 0
            
            case BookingStep.SUMMARY:
              return (
                state.startDate !== null &&
                state.endDate !== null &&
                state.selectedRooms.length > 0 &&
                state.totalPrice > 0
              )
            
            default:
              return false
          }
        },
        
        getBookingSummary: () => {
          const state = get()
          
          return {
            dateRange: {
              startDate: state.startDate!,
              endDate: state.endDate!,
              nights: state.nights,
            },
            guestInfo: {
              guestType: state.guestType,
              adults: state.adults,
              children: state.children,
              totalGuests: state.totalGuests,
            },
            roomSelection: state.selectedRooms,
            pricing: state.priceBreakdown,
          }
        },
      }),
      {
        name: 'booking-store', // Unique name for localStorage
        version: 3, // Increment this to invalidate old cached data (Changed from 2 to 3 to clear stale room IDs)
        partialize: (state) => ({
          // Only persist essential state, not UI state
          startDate: state.startDate,
          endDate: state.endDate,
          guestType: state.guestType,
          adults: state.adults,
          children: state.children,
          selectedRooms: state.selectedRooms,
        }),
        migrate: (persistedState: any, version: number) => {
          // If version is less than current, clear the old data
          if (version < 3) {
            console.log('🔄 Clearing old booking data due to schema change (room type IDs updated)')
            return initialState
          }
          return persistedState
        },
      }
    ),
    {
      name: 'booking-store', // Name for Redux DevTools
    }
  )
)

// ==========================================
// HELPER HOOKS
// ==========================================

/**
 * Hook for date-related state and actions
 */
export const useDateSelection = () => {
  const { startDate, endDate, nights, setDates, isStepValid } = useBookingStore()
  
  return {
    startDate,
    endDate,
    nights,
    setDates,
    isValid: isStepValid(BookingStep.DATES),
  }
}

/**
 * Hook for guest information
 */
export const useGuestInfo = () => {
  const { guestType, adults, children, totalGuests, setGuestInfo, isStepValid } = useBookingStore()
  
  return {
    guestType,
    adults,
    children,
    totalGuests,
    setGuestInfo,
    isValid: isStepValid(BookingStep.GUESTS),
  }
}

/**
 * Hook for room selection
 */
export const useRoomSelection = () => {
  const { 
    availableRoomTypes, 
    selectedRooms, 
    totalRooms, 
    updateRoomSelection, 
    removeRoomSelection,
    setAvailableRoomTypes,
    isStepValid 
  } = useBookingStore()
  
  return {
    availableRoomTypes,
    selectedRooms,
    totalRooms,
    updateRoomSelection,
    removeRoomSelection,
    setAvailableRoomTypes,
    isValid: isStepValid(BookingStep.ROOMS),
  }
}

/**
 * Hook for pricing information
 */
export const usePricing = () => {
  const { priceBreakdown, totalPrice, calculatePricing } = useBookingStore()
  
  return {
    priceBreakdown,
    totalPrice,
    calculatePricing,
  }
}

/**
 * Hook for booking flow navigation
 */
export const useBookingFlow = () => {
  const { 
    currentStep, 
    isLoading, 
    error, 
    nextStep, 
    previousStep, 
    goToStep, 
    setLoading, 
    setError, 
    resetBooking,
    isStepValid,
    getBookingSummary 
  } = useBookingStore()
  
  return {
    currentStep,
    isLoading,
    error,
    nextStep,
    previousStep,
    goToStep,
    setLoading,
    setError,
    resetBooking,
    isStepValid,
    getBookingSummary,
  }
}