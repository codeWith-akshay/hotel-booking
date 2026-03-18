// ==========================================
// BOOKING STEP INDICATOR - Progress Visualization
// ==========================================
// Visual progress indicator showing current step and completion status
// PERF: Optimized with React.memo and useCallback to prevent re-renders

'use client'

import { memo, useCallback, useMemo } from 'react'
import { Check, Calendar, Users, Bed, CreditCard } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useBookingStore, BookingStep } from '@/store/bookingUIStore'

// ==========================================
// STEP CONFIGURATION - Static, no re-computation needed
// ==========================================

const steps = [
  {
    id: BookingStep.DATES,
    label: 'Dates',
    icon: Calendar,
    shortLabel: 'Select Dates',
  },
  {
    id: BookingStep.GUESTS,
    label: 'Guests',
    icon: Users,
    shortLabel: 'Guest Info',
  },
  {
    id: BookingStep.ROOMS,
    label: 'Rooms',
    icon: Bed,
    shortLabel: 'Choose Rooms',
  },
  {
    id: BookingStep.SUMMARY,
    label: 'Summary',
    icon: CreditCard,
    shortLabel: 'Review & Pay',
  },
] as const

// ==========================================
// MEMOIZED STEP ITEM COMPONENT
// ==========================================

interface StepItemProps {
  step: typeof steps[number]
  index: number
  isActive: boolean
  isCompleted: boolean
  isAccessible: boolean
  isLast: boolean
  onStepClick: (stepId: BookingStep) => void
}

const StepItem = memo(function StepItem({
  step,
  index,
  isActive,
  isCompleted,
  isAccessible,
  isLast,
  onStepClick,
}: StepItemProps) {
  const IconComponent = step.icon
  
  const handleClick = useCallback(() => {
    if (isAccessible) {
      onStepClick(step.id)
    }
  }, [isAccessible, onStepClick, step.id])

  return (
    <div className="flex items-center">
      {/* Step Circle */}
      <button
        onClick={handleClick}
        disabled={!isAccessible}
        className={cn(
          'flex items-center justify-center w-12 h-12 rounded-full transition-all duration-300',
          'border-2 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500',
          {
            'bg-green-500 border-green-500 text-white hover:bg-green-600': isCompleted,
            'bg-blue-500 border-blue-500 text-white ring-2 ring-blue-200': isActive,
            'bg-white border-gray-300 text-gray-500 hover:border-blue-300 hover:text-blue-500': 
              !isActive && !isCompleted && isAccessible,
            'bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed': !isAccessible,
          }
        )}
      >
        {isCompleted ? (
          <Check className="h-6 w-6" />
        ) : (
          <IconComponent className="h-6 w-6" />
        )}
      </button>

      {/* Step Label */}
      <div className="ml-3 mr-8">
        <p className={cn(
          'text-sm font-medium transition-colors duration-300',
          {
            'text-green-600': isCompleted,
            'text-blue-600': isActive,
            'text-gray-500': !isActive && !isCompleted && isAccessible,
            'text-gray-400': !isAccessible,
          }
        )}>
          {step.label}
        </p>
        <p className="text-xs text-gray-500">
          {step.shortLabel}
        </p>
      </div>

      {/* Connecting Line */}
      {!isLast && (
        <div className={cn(
          'h-0.5 w-16 transition-colors duration-300',
          {
            'bg-green-500': isCompleted,
            'bg-blue-500': isActive,
            'bg-gray-300': !isCompleted && !isActive,
          }
        )} />
      )}
    </div>
  )
})

// ==========================================
// STEP INDICATOR COMPONENT - Optimized
// ==========================================

export const BookingStepIndicator = memo(function BookingStepIndicator() {
  const { currentStep, isStepValid, goToStep } = useBookingStore()
  
  const currentStepIndex = useMemo(
    () => steps.findIndex(step => step.id === currentStep),
    [currentStep]
  )

  const handleStepClick = useCallback((stepId: BookingStep) => {
    goToStep(stepId)
  }, [goToStep])

  // Memoize step accessibility calculations
  const stepStates = useMemo(() => {
    return steps.map((step, index) => ({
      isActive: step.id === currentStep,
      isCompleted: index < currentStepIndex,
      isAccessible: index <= currentStepIndex || isStepValid(steps[index - 1]?.id as BookingStep),
    }))
  }, [currentStep, currentStepIndex, isStepValid])

  // Memoize progress percentage for mobile
  const progressPercent = useMemo(
    () => ((currentStepIndex + 1) / steps.length) * 100,
    [currentStepIndex]
  )

  return (
    <div className="mb-8">
      {/* ==========================================
          DESKTOP STEP INDICATOR
          ========================================== */}
      <div className="hidden md:flex items-center justify-center space-x-4">
        {steps.map((step, index) => (
          <StepItem
            key={step.id}
            step={step}
            index={index}
            isActive={stepStates[index].isActive}
            isCompleted={stepStates[index].isCompleted}
            isAccessible={stepStates[index].isAccessible}
            isLast={index === steps.length - 1}
            onStepClick={handleStepClick}
          />
        ))}
      </div>

      {/* ==========================================
          MOBILE STEP INDICATOR
          ========================================== */}
      <div className="md:hidden">
        {/* Progress Bar */}
        <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
          <div 
            className="bg-blue-500 h-2 rounded-full transition-all duration-500 ease-out"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        {/* Current Step Info */}
        <div className="text-center">
          <div className="flex items-center justify-center mb-2">
            <div className={cn(
              'flex items-center justify-center w-10 h-10 rounded-full',
              'bg-blue-500 text-white'
            )}>
              {(() => {
                const currentStepData = steps[currentStepIndex]
                if (!currentStepData) return null
                const IconComponent = currentStepData.icon
                return <IconComponent className="h-5 w-5" />
              })()}
            </div>
          </div>
          
          <p className="text-sm font-medium text-gray-900">
            Step {currentStepIndex + 1} of {steps.length}
          </p>
          <p className="text-xs text-gray-500">
            {steps[currentStepIndex]?.shortLabel || 'Loading...'}
          </p>
        </div>

        {/* Step Navigation Dots */}
        <div className="flex justify-center space-x-2 mt-4">
          {steps.map((_, index) => (
            <button
              key={index}
              onClick={() => {
                const targetStep = steps[index]
                if (!targetStep) return
                if (stepStates[index].isAccessible) {
                  handleStepClick(targetStep.id)
                }
              }}
              className={cn(
                'w-2 h-2 rounded-full transition-all duration-300',
                {
                  'bg-blue-500': index === currentStepIndex,
                  'bg-green-500': index < currentStepIndex,
                  'bg-gray-300': index > currentStepIndex,
                }
              )}
            />
          ))}
        </div>
      </div>
    </div>
  )
})