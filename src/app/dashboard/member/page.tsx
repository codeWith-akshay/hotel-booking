/**
 * Member Dashboard Page (Day 14)
 * 
 * Main dashboard for members to view and manage their bookings.
 * Features:
 * - View all bookings with filters
 * - Cancel bookings
 * - Join waitlist
 * - Download invoices
 * - Responsive design (mobile cards, desktop table)
 */

'use client'

import { useEffect, useState } from 'react'
import { Filter, Plus } from 'lucide-react'
import { useSessionStore, BookingFilter } from '@/store/sessionStore'
import { BookingCard, BookingCardSkeleton } from '@/components/dashboard/BookingCard'
import { ConfirmModal } from '@/components/dashboard/ConfirmModal'
import { ToastContainer, useToast } from '@/components/dashboard/Toast'
import {
  fetchMemberBookings,
  cancelMemberBooking,
  joinMemberWaitlist,
} from '@/actions/member/bookings'
import { cn } from '@/lib/utils'

export default function MemberDashboardPage() {
  const { user, bookings, filteredBookings, currentFilter, isLoading, setBookings, setFilter, setLoading } = useSessionStore()
  const { toasts, removeToast, success, error } = useToast()
  
  const [cancelModal, setCancelModal] = useState<{ isOpen: boolean; bookingId: string | null }>({
    isOpen: false,
    bookingId: null,
  })
  const [waitlistModal, setWaitlistModal] = useState<{
    isOpen: boolean
    roomTypeId: string | null
    startDate: Date | null
    endDate: Date | null
  }>({
    isOpen: false,
    roomTypeId: null,
    startDate: null,
    endDate: null,
  })
  const [isCanceling, setIsCanceling] = useState(false)
  const [isJoiningWaitlist, setIsJoiningWaitlist] = useState(false)
  
  // Load bookings on mount
  useEffect(() => {
    loadBookings()
  }, [currentFilter])
  
  async function loadBookings() {
    if (!user) {
      error('Please log in to view your bookings')
      return
    }
    
    setLoading(true)
    
    try {
      const result = await fetchMemberBookings({
        userId: user.id,
        filter: currentFilter,
      })
      
      if (result.success) {
        setBookings(result.bookings as any)
      } else {
        error(result.message)
      }
    } catch (err) {
      error('Failed to load bookings')
    } finally {
      setLoading(false)
    }
  }
  
  async function handleCancelBooking() {
    if (!cancelModal.bookingId || !user) return
    
    setIsCanceling(true)
    
    try {
      const result = await cancelMemberBooking({
        bookingId: cancelModal.bookingId,
        userId: user.id,
      })
      
      if (result.success) {
        success(result.message)
        await loadBookings() // Reload bookings
        setCancelModal({ isOpen: false, bookingId: null })
      } else {
        error(result.message)
      }
    } catch (err) {
      error('Failed to cancel booking')
    } finally {
      setIsCanceling(false)
    }
  }
  
  async function handleJoinWaitlist() {
    if (!waitlistModal.roomTypeId || !waitlistModal.startDate || !waitlistModal.endDate || !user) return
    
    setIsJoiningWaitlist(true)
    
    try {
      const result = await joinMemberWaitlist({
        userId: user.id,
        roomTypeId: waitlistModal.roomTypeId,
        startDate: waitlistModal.startDate,
        endDate: waitlistModal.endDate,
        guests: 1,
      })
      
      if (result.success) {
        success(result.message)
        setWaitlistModal({ isOpen: false, roomTypeId: null, startDate: null, endDate: null })
      } else {
        error(result.message)
      }
    } catch (err) {
      error('Failed to join waitlist')
    } finally {
      setIsJoiningWaitlist(false)
    }
  }
  
  function handleDownloadInvoice(bookingId: string) {
    // Placeholder for invoice download
    success('Invoice download will be implemented soon')
  }
  
  const filterOptions: { value: BookingFilter; label: string }[] = [
    { value: 'all', label: 'All Bookings' },
    { value: 'upcoming', label: 'Upcoming' },
    { value: 'past', label: 'Past' },
    { value: 'cancelled', label: 'Cancelled' },
    { value: 'waitlisted', label: 'Waitlisted' },
  ]
  
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Toast Notifications */}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
      
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">My Bookings</h1>
              <p className="text-sm text-gray-600 mt-1">
                Manage your hotel reservations
              </p>
            </div>
            
            <button
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 transition-colors"
              onClick={() => {
                // Navigate to booking page
                success('Booking page navigation will be implemented')
              }}
            >
              <Plus className="w-4 h-4" />
              New Booking
            </button>
          </div>
        </div>
      </div>
      
      {/* Filter Tabs */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2 overflow-x-auto">
            <Filter className="w-4 h-4 text-gray-400 shrink-0" />
            {filterOptions.map((option) => (
              <button
                key={option.value}
                onClick={() => setFilter(option.value)}
                className={cn(
                  'px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap',
                  currentFilter === option.value
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300'
                )}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
      </div>
      
      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {isLoading ? (
          // Loading skeletons
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[...Array(6)].map((_, i) => (
              <BookingCardSkeleton key={i} />
            ))}
          </div>
        ) : filteredBookings.length === 0 ? (
          // Empty state
          <div className="text-center py-12">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-4">
              <Filter className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No bookings found
            </h3>
            <p className="text-sm text-gray-600 mb-6">
              {currentFilter === 'all'
                ? 'You haven\'t made any bookings yet.'
                : `You don't have any ${currentFilter} bookings.`}
            </p>
            <button
              className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 transition-colors"
              onClick={() => success('Booking page navigation will be implemented')}
            >
              <Plus className="w-4 h-4" />
              Make Your First Booking
            </button>
          </div>
        ) : (
          // Booking cards
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {filteredBookings.map((booking) => (
              <BookingCard
                key={booking.id}
                booking={booking}
                onCancel={(bookingId) => setCancelModal({ isOpen: true, bookingId })}
                onJoinWaitlist={(roomTypeId, startDate, endDate) =>
                  setWaitlistModal({ isOpen: true, roomTypeId, startDate, endDate })
                }
                onDownloadInvoice={handleDownloadInvoice}
              />
            ))}
          </div>
        )}
        
        {/* Summary */}
        {!isLoading && filteredBookings.length > 0 && (
          <div className="mt-8 text-center text-sm text-gray-600">
            Showing {filteredBookings.length} of {bookings.length} total booking{bookings.length === 1 ? '' : 's'}
          </div>
        )}
      </div>
      
      {/* Cancel Confirmation Modal */}
      <ConfirmModal
        isOpen={cancelModal.isOpen}
        onClose={() => setCancelModal({ isOpen: false, bookingId: null })}
        onConfirm={handleCancelBooking}
        title="Cancel Booking"
        message="Are you sure you want to cancel this booking? This action cannot be undone. Refund amount will be calculated based on our cancellation policy."
        confirmText="Yes, Cancel Booking"
        cancelText="Keep Booking"
        variant="danger"
        isLoading={isCanceling}
      />
      
      {/* Waitlist Confirmation Modal */}
      <ConfirmModal
        isOpen={waitlistModal.isOpen}
        onClose={() => setWaitlistModal({ isOpen: false, roomTypeId: null, startDate: null, endDate: null })}
        onConfirm={handleJoinWaitlist}
        title="Join Waitlist"
        message="Would you like to join the waitlist for these dates? We'll notify you if a room becomes available."
        confirmText="Join Waitlist"
        cancelText="Cancel"
        variant="info"
        isLoading={isJoiningWaitlist}
      />
    </div>
  )
}
