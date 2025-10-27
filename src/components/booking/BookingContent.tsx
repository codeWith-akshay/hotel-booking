// ==========================================
// BOOKING CONTENT - Dynamic Step Content
// ==========================================
// Renders content based on current booking step

'use client'

import { Card } from '@/components/ui/card'
import { useBookingStore, BookingStep } from '@/store/bookingUIStore'
import { DateSelectionStep } from './steps/DateSelectionStep'
import { GuestInfoStep } from './steps/GuestInfoStep'
import { RoomSelectionStep } from './steps/RoomSelectionStep'
import { BookingSummaryStep } from './steps/BookingSummaryStep'

// ==========================================
// CONTENT MAPPING
// ==========================================

const stepComponents = {
  [BookingStep.DATES]: DateSelectionStep,
  [BookingStep.GUESTS]: GuestInfoStep,
  [BookingStep.ROOMS]: RoomSelectionStep,
  [BookingStep.SUMMARY]: BookingSummaryStep,
}

// ==========================================
// BOOKING CONTENT COMPONENT
// ==========================================

export function BookingContent() {
  const { currentStep, isLoading } = useBookingStore()
  
  // Get the component for the current step
  const StepComponent = stepComponents[currentStep]
  
  if (!StepComponent) {
    return (
      <Card className="p-8 bg-white/90 backdrop-blur-sm shadow-2xl">
        <div className="text-center text-gray-500">
          <p>Invalid booking step</p>
        </div>
      </Card>
    )
  }

  return (
    <Card className="relative p-8 bg-white/95 backdrop-blur-lg shadow-2xl border-0 ring-2 ring-blue-100 hover:ring-blue-200 transition-all duration-300 overflow-hidden">
      {/* Decorative gradient overlay */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-linear-to-br from-blue-400/10 to-purple-400/10 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-0 left-0 w-64 h-64 bg-linear-to-br from-purple-400/10 to-pink-400/10 rounded-full blur-3xl pointer-events-none"></div>

      {isLoading && (
        <div className="absolute inset-0 bg-white/90 backdrop-blur-sm flex items-center justify-center z-10 rounded-lg">
          <div className="flex flex-col items-center gap-3">
            <div className="relative">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-200"></div>
              <div className="absolute top-0 left-0 animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent"></div>
            </div>
            <span className="text-sm font-medium text-gray-700">Loading...</span>
          </div>
        </div>
      )}
      
      <div className="relative z-10">
        <StepComponent />
      </div>
    </Card>
  )
}