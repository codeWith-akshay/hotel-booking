// ==========================================
// BOOKING HEADER - Page Title & Navigation
// ==========================================
// Displays booking page title, description, and navigation breadcrumbs

'use client'

import Link from 'next/link'
import { ArrowLeft, Calendar, Users, Bed, CreditCard } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useBookingContext } from './BookingProvider'
import { BookingStep } from '@/store/bookingUIStore'

// ==========================================
// STEP METADATA
// ==========================================

const stepMetadata = {
  [BookingStep.DATES]: {
    icon: Calendar,
    title: 'Select Your Dates',
    description: 'Choose your check-in and check-out dates to begin your booking.',
  },
  [BookingStep.GUESTS]: {
    icon: Users,
    title: 'Guest Information',
    description: 'Tell us about your party size and guest preferences.',
  },
  [BookingStep.ROOMS]: {
    icon: Bed,
    title: 'Choose Your Rooms',
    description: 'Select from our available room types and quantities.',
  },
  [BookingStep.SUMMARY]: {
    icon: CreditCard,
    title: 'Review & Confirm',
    description: 'Review your booking details and complete your reservation.',
  },
}

// ==========================================
// BOOKING HEADER COMPONENT
// ==========================================

export function BookingHeader() {
  const { currentStep } = useBookingContext()
  const metadata = stepMetadata[currentStep]
  const IconComponent = metadata.icon

  return (
    <header className="text-center mb-10 relative">
      {/* ==========================================
          NAVIGATION BREADCRUMB WITH GRADIENT
          ========================================== */}
      <div className="flex items-center justify-between mb-8 p-4 bg-white/80 backdrop-blur-sm rounded-xl shadow-lg border border-blue-100">
        <Link href="/dashboard" className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            className="text-gray-700 hover:text-blue-600 hover:bg-blue-50 transition-all duration-200 font-medium"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back to Dashboard
          </Button>
        </Link>
        
        <div className="flex items-center gap-2 px-4 py-2 bg-linear-to-r from-blue-500 to-purple-600 rounded-full shadow-md">
          <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
          <span className="text-sm font-semibold text-white">
            Step {Object.values(BookingStep).indexOf(currentStep) + 1} of {Object.values(BookingStep).length}
          </span>
        </div>
      </div>

      {/* ==========================================
          STEP ICON & TITLE WITH ANIMATION
          ========================================== */}
      <div className="flex flex-col md:flex-row items-center justify-center mb-6 gap-6">
        {/* Animated Icon */}
        <div className="relative">
          <div className="absolute inset-0 bg-blue-400 rounded-full blur-xl opacity-30 animate-pulse"></div>
          <div className="relative p-5 bg-linear-to-br from-blue-500 to-purple-600 rounded-2xl shadow-xl transform hover:scale-110 transition-transform duration-300">
            <IconComponent className="h-10 w-10 text-white" />
          </div>
        </div>

        {/* Title and Description */}
        <div className="text-center md:text-left">
          <h1 className="text-4xl md:text-5xl font-black text-gray-900 mb-3 tracking-tight">
            <span className="bg-linear-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
              {metadata.title}
            </span>
          </h1>
          <p className="text-lg md:text-xl text-gray-600 max-w-2xl">
            {metadata.description}
          </p>
        </div>
      </div>

      {/* ==========================================
          HOTEL BRANDING WITH BADGE
          ========================================== */}
      <div className="flex items-center justify-center gap-3 mb-4">
        <div className="px-6 py-3 bg-white rounded-full shadow-lg border-2 border-blue-200 hover:border-blue-400 transition-all duration-300 hover:shadow-xl">
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
            <p className="text-sm font-semibold text-gray-700">
              Booking your stay at <span className="text-blue-600 font-bold">Luxury Hotel ★★★★★</span>
            </p>
          </div>
        </div>
      </div>

      {/* Progress  Bar */}
      <div className="max-w-md mx-auto">
        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
          <div 
            className="h-full bg-linear-to-r from-blue-500 to-purple-600 rounded-full transition-all duration-500 ease-out"
            style={{ 
              width: `${((Object.values(BookingStep).indexOf(currentStep) + 1) / Object.values(BookingStep).length) * 100}%` 
            }}
          ></div>
        </div>
        <p className="text-xs text-gray-500 mt-2">
          {Math.round(((Object.values(BookingStep).indexOf(currentStep) + 1) / Object.values(BookingStep).length) * 100)}% Complete
        </p>
      </div>
    </header>
  )
}