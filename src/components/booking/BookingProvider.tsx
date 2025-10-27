// ==========================================
// BOOKING PROVIDER - Context & Store Integration
// ==========================================
// Provides booking state management and context to child components
// Features: Zustand store integration, error boundaries, and loading states

'use client'

import { createContext, useContext, useEffect, ReactNode } from 'react'
import { useBookingStore, BookingStep } from '@/store/bookingUIStore'
import { toast } from 'sonner'

// ==========================================
// CONTEXT TYPES
// ==========================================

interface BookingContextType {
  // Store state (read-only access)
  currentStep: BookingStep
  isLoading: boolean
  error: string | null
  
  // Helper functions
  canProceed: boolean
  canGoBack: boolean
  stepProgress: number
}

// ==========================================
// CONTEXT CREATION
// ==========================================

const BookingContext = createContext<BookingContextType | null>(null)

// ==========================================
// PROVIDER COMPONENT
// ==========================================

interface BookingProviderProps {
  children: ReactNode
}

export function BookingProvider({ children }: BookingProviderProps) {
  // Get store state and actions
  const {
    currentStep,
    isLoading,
    error,
    isStepValid,
    setError,
  } = useBookingStore()

  // ==========================================
  // ERROR HANDLING
  // ==========================================

  useEffect(() => {
    if (error) {
      toast.error(error, {
        id: 'booking-error',
        duration: 5000,
        action: {
          label: 'Dismiss',
          onClick: () => setError(null),
        },
      })
    }
  }, [error, setError])

  // ==========================================
  // STEP NAVIGATION HELPERS
  // ==========================================

  const stepOrder = [BookingStep.DATES, BookingStep.GUESTS, BookingStep.ROOMS, BookingStep.SUMMARY]
  const currentStepIndex = stepOrder.indexOf(currentStep)
  
  const canProceed = isStepValid(currentStep) && currentStepIndex < stepOrder.length - 1
  const canGoBack = currentStepIndex > 0
  const stepProgress = ((currentStepIndex + 1) / stepOrder.length) * 100

  // ==========================================
  // CONTEXT VALUE
  // ==========================================

  const contextValue: BookingContextType = {
    currentStep,
    isLoading,
    error,
    canProceed,
    canGoBack,
    stepProgress,
  }

  // ==========================================
  // RENDER
  // ==========================================

  return (
    <BookingContext.Provider value={contextValue}>
      {children}
    </BookingContext.Provider>
  )
}

// ==========================================
// CONTEXT HOOK
// ==========================================

export function useBookingContext() {
  const context = useContext(BookingContext)
  
  if (!context) {
    throw new Error('useBookingContext must be used within a BookingProvider')
  }
  
  return context
}