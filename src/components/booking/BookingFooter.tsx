// ==========================================
// BOOKING FOOTER - Navigation Controls
// ==========================================
// Provides navigation buttons and booking actions

'use client'

import { ArrowLeft, ArrowRight, CreditCard } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useBookingStore, BookingStep } from '@/store/bookingUIStore'
import { useBookingContext } from './BookingProvider'

// ==========================================
// BOOKING FOOTER COMPONENT
// ==========================================

export function BookingFooter() {
  const { 
    currentStep, 
    nextStep, 
    previousStep, 
    isStepValid,
    resetBooking 
  } = useBookingStore()
  
  const { canProceed, canGoBack, isLoading } = useBookingContext()

  // ==========================================
  // STEP-SPECIFIC ACTIONS
  // ==========================================

  const handleNext = () => {
    if (currentStep === BookingStep.SUMMARY) {
      // Handle booking confirmation
      handleBookingConfirmation()
    } else {
      nextStep()
    }
  }

  const handleBookingConfirmation = async () => {
    try {
      // TODO: Implement booking confirmation logic
      console.log('Confirming booking...')
      // This will integrate with the booking actions we created in Day 7
    } catch (error) {
      console.error('Booking confirmation failed:', error)
    }
  }

  // ==========================================
  // BUTTON CONFIGURATIONS
  // ==========================================

  const getNextButtonConfig = () => {
    switch (currentStep) {
      case BookingStep.DATES:
        return {
          text: 'Continue to Guest Info',
          icon: ArrowRight,
          disabled: !isStepValid(currentStep) || isLoading,
        }
      case BookingStep.GUESTS:
        return {
          text: 'Continue to Room Selection',
          icon: ArrowRight,
          disabled: !isStepValid(currentStep) || isLoading,
        }
      case BookingStep.ROOMS:
        return {
          text: 'Review Booking',
          icon: ArrowRight,
          disabled: !isStepValid(currentStep) || isLoading,
        }
      case BookingStep.SUMMARY:
        return {
          text: 'Confirm Booking',
          icon: CreditCard,
          disabled: !isStepValid(currentStep) || isLoading,
          variant: 'default' as const,
        }
      default:
        return {
          text: 'Continue',
          icon: ArrowRight,
          disabled: true,
        }
    }
  }

  const nextButtonConfig = getNextButtonConfig()
  const NextIcon = nextButtonConfig.icon

  return (
    <footer className="mt-8 pt-6 border-t border-gray-200">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
        
        {/* ==========================================
            LEFT SIDE - Back Button & Reset
            ========================================== */}
        <div className="flex items-center gap-3">
          {canGoBack && (
            <Button
              variant="outline"
              onClick={previousStep}
              disabled={isLoading}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
          )}
          
          {currentStep !== BookingStep.DATES && (
            <Button
              variant="ghost"
              size="sm"
              onClick={resetBooking}
              disabled={isLoading}
              className="text-gray-500 hover:text-gray-700"
            >
              Start Over
            </Button>
          )}
        </div>

        {/* ==========================================
            RIGHT SIDE - Continue/Confirm Button
            ========================================== */}
        <div className="flex items-center gap-3">
          <Button
            onClick={handleNext}
            disabled={nextButtonConfig.disabled}
            variant={nextButtonConfig.variant || 'default'}
            size="lg"
            className="flex items-center gap-2 min-w-[180px]"
          >
            {isLoading ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            ) : (
              <NextIcon className="h-4 w-4" />
            )}
            {nextButtonConfig.text}
          </Button>
        </div>
      </div>

      {/* ==========================================
          STEP VALIDATION MESSAGE
          ========================================== */}
      {!isStepValid(currentStep) && (
        <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
          <p className="text-sm text-amber-800">
            {getValidationMessage(currentStep)}
          </p>
        </div>
      )}

      {/* ==========================================
          BOOKING SECURITY NOTE
          ========================================== */}
      {currentStep === BookingStep.SUMMARY && (
        <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-xs text-green-800 text-center">
            🔒 Your booking is secure and encrypted. We do not store payment information.
          </p>
        </div>
      )}
    </footer>
  )
}

// ==========================================
// VALIDATION MESSAGES
// ==========================================

function getValidationMessage(step: BookingStep): string {
  switch (step) {
    case BookingStep.DATES:
      return 'Please select both check-in and check-out dates to continue.'
    case BookingStep.GUESTS:
      return 'Please specify at least 1 adult guest to continue.'
    case BookingStep.ROOMS:
      return 'Please select at least one room to continue.'
    case BookingStep.SUMMARY:
      return 'Please review all booking details before confirming.'
    default:
      return 'Please complete the required information to continue.'
  }
}