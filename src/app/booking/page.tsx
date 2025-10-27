// ==========================================
// BOOKING PAGE - Main UI Layout
// ==========================================
// Multi-step booking interface with step navigation and responsive design
// Features: Date selection, guest info, room selection, and booking summary

import { Suspense } from 'react'
import { Metadata } from 'next'
import { BookingStepIndicator } from '@/components/booking/BookingStepIndicator'
import { BookingHeader } from '@/components/booking/BookingHeader'
import { BookingContent } from '@/components/booking/BookingContent'
import { BookingFooter } from '@/components/booking/BookingFooter'
import { BookingProvider } from '@/components/booking/BookingProvider'
import { BookingSummaryCard } from '@/components/booking/BookingSummaryCard'
import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { useBookingStore } from '@/store/bookingUIStore'

// ==========================================
// METADATA
// ==========================================

export const metadata: Metadata = {
  title: 'Book Your Stay | Hotel Booking',
  description: 'Complete your hotel reservation with our easy-to-use booking system. Select dates, guests, and rooms.',
  keywords: ['hotel booking', 'reservations', 'accommodation', 'stay'],
}

// ==========================================
// LOADING COMPONENT
// ==========================================

function BookingPageSkeleton() {
  return (
    <div className="min-h-screen bg-linear-to-br from-blue-50 via-white to-purple-50">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Header Skeleton */}
        <div className="text-center mb-8">
          <Skeleton className="h-10 w-64 mx-auto mb-4" />
          <Skeleton className="h-6 w-96 mx-auto" />
        </div>

        {/* Step Indicator Skeleton */}
        <div className="mb-8">
          <div className="flex justify-center space-x-4">
            {[1, 2, 3, 4].map((step) => (
              <div key={step} className="flex items-center">
                <Skeleton className="h-10 w-10 rounded-full" />
                {step < 4 && <Skeleton className="h-1 w-16 ml-4" />}
              </div>
            ))}
          </div>
        </div>

        {/* Content Skeleton */}
        <Card className="p-8 mb-6">
          <Skeleton className="h-8 w-48 mb-6" />
          <div className="space-y-4">
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
          </div>
        </Card>

        {/* Footer Skeleton */}
        <div className="flex justify-between">
          <Skeleton className="h-10 w-24" />
          <Skeleton className="h-10 w-24" />
        </div>
      </div>
    </div>
  )
}

// ==========================================
// MAIN BOOKING PAGE
// ==========================================

export default function BookingPage() {
  return (
    <BookingProvider>
      {/* Animated Background with Gradient */}
      <div className="min-h-screen bg-linear-to-br from-blue-50 via-purple-50 to-pink-50 relative overflow-hidden">
        {/* Animated Background Shapes */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-0 right-0 w-96 h-96 bg-blue-400/10 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-purple-400/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
          <div className="absolute top-1/2 left-1/2 w-96 h-96 bg-pink-400/10 rounded-full blur-3xl animate-pulse delay-2000"></div>
        </div>

        <div className="container mx-auto px-4 py-8 max-w-7xl relative z-10">
          
          {/* ==========================================
              BOOKING HEADER WITH ANIMATION
              ========================================== */}
          <div className="animate-fade-in-down">
            <BookingHeader />
          </div>
          
          {/* ==========================================
              STEP INDICATOR WITH SLIDE ANIMATION
              ========================================== */}
          <Suspense fallback={
            <div className="mb-8">
              <div className="flex justify-center space-x-4">
                {[1, 2, 3, 4].map((step) => (
                  <div key={step} className="flex items-center">
                    <Skeleton className="h-12 w-12 rounded-full" />
                    {step < 4 && <Skeleton className="h-1 w-20 ml-4" />}
                  </div>
                ))}
              </div>
            </div>
          }>
            <div className="animate-fade-in">
              <BookingStepIndicator />
            </div>
          </Suspense>
          
          {/* ==========================================
              MAIN BOOKING CONTENT - RESPONSIVE GRID
              ========================================== */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
            
            {/* Main Content Area - Takes 2 columns on large screens */}
            <div className="lg:col-span-2 animate-slide-in-left">
              <Suspense fallback={
                <Card className="p-8 mb-6 shadow-2xl">
                  <Skeleton className="h-8 w-48 mb-6" />
                  <div className="space-y-4">
                    <Skeleton className="h-24 w-full rounded-lg" />
                    <Skeleton className="h-24 w-full rounded-lg" />
                    <Skeleton className="h-24 w-full rounded-lg" />
                  </div>
                </Card>
              }>
                <BookingContent />
              </Suspense>
            </div>
            
            {/* Sidebar - Booking Summary with Sticky Position */}
            <div className="lg:col-span-1 animate-slide-in-right">
              <div className="sticky top-8">
                <Suspense fallback={
                  <Card className="p-6 shadow-xl backdrop-blur-sm bg-white/90">
                    <Skeleton className="h-6 w-32 mb-4" />
                    <div className="space-y-3">
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-3/4" />
                      <Skeleton className="h-4 w-1/2" />
                      <div className="border-t pt-3 mt-4">
                        <Skeleton className="h-6 w-24" />
                      </div>
                    </div>
                  </Card>
                }>
                  <BookingSummaryCard />
                </Suspense>
              </div>
            </div>
          </div>
          
          {/* ==========================================
              BOOKING FOOTER
              ==========================================
              Navigation buttons and actions */}
          <Suspense fallback={
            <div className="flex justify-between mt-8">
              <Skeleton className="h-10 w-24" />
              <Skeleton className="h-10 w-24" />
            </div>
          }>
            <BookingFooter />
          </Suspense>
        </div>
      </div>
    </BookingProvider>
  )
}