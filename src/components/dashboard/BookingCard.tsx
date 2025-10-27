/**
 * Booking Card Component (Day 14)
 * 
 * Responsive card displaying booking information with actions.
 * Optimized for mobile-first design.
 */

'use client'

import { format } from 'date-fns'
import { Calendar, MapPin, Users, CreditCard, FileText, XCircle } from 'lucide-react'
import { Booking } from '@/store/sessionStore'
import { StatusBadgeWithIcon } from './StatusBadge'
import { getPaymentStatus, canCancelBooking, calculateNights } from '@/store/sessionStore'
import { cn } from '@/lib/utils'

interface BookingCardProps {
  booking: Booking
  onCancel?: (bookingId: string) => void
  onJoinWaitlist?: (roomTypeId: string, startDate: Date, endDate: Date) => void
  onDownloadInvoice?: (bookingId: string) => void
  className?: string
}

export function BookingCard({
  booking,
  onCancel,
  onJoinWaitlist,
  onDownloadInvoice,
  className,
}: BookingCardProps) {
  const paymentStatus = getPaymentStatus(booking)
  const canCancel = canCancelBooking(booking)
  const nights = calculateNights(booking.startDate, booking.endDate)
  
  const hasInvoice = booking.payments.some(p => p.invoicePath !== null)
  
  return (
    <div
      className={cn(
        'bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow',
        className
      )}
    >
      {/* Header */}
      <div className="p-4 border-b border-gray-100">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-semibold text-gray-900 truncate">
              {booking.roomType.name}
            </h3>
            <p className="text-sm text-gray-500 mt-0.5">
              Booking #{booking.id.slice(0, 8)}
            </p>
          </div>
          <div className="flex flex-col items-end gap-2">
            <StatusBadgeWithIcon status={booking.status} />
            <StatusBadgeWithIcon status={paymentStatus} />
          </div>
        </div>
      </div>
      
      {/* Content */}
      <div className="p-4 space-y-3">
        {/* Dates */}
        <div className="flex items-center gap-2 text-sm">
          <Calendar className="w-4 h-4 text-gray-400 shrink-0" />
          <span className="text-gray-700">
            {format(new Date(booking.startDate), 'MMM dd, yyyy')} -{' '}
            {format(new Date(booking.endDate), 'MMM dd, yyyy')}
          </span>
          <span className="text-gray-500">({nights} {nights === 1 ? 'night' : 'nights'})</span>
        </div>
        
        {/* Rooms */}
        <div className="flex items-center gap-2 text-sm">
          <Users className="w-4 h-4 text-gray-400 shrink-0" />
          <span className="text-gray-700">
            {booking.roomsBooked} {booking.roomsBooked === 1 ? 'room' : 'rooms'}
          </span>
        </div>
        
        {/* Price */}
        <div className="flex items-center gap-2 text-sm">
          <CreditCard className="w-4 h-4 text-gray-400 shrink-0" />
          <span className="text-gray-700">
            Total: <span className="font-semibold">${(booking.totalPrice / 100).toFixed(2)}</span>
          </span>
          {booking.depositAmount && (
            <span className="text-gray-500">
              (Deposit: ${(booking.depositAmount / 100).toFixed(2)}
              {booking.isDepositPaid ? ' ✓' : ' pending'})
            </span>
          )}
        </div>
        
        {/* Room Description (truncated) */}
        {booking.roomType.description && (
          <p className="text-sm text-gray-600 line-clamp-2 pt-2 border-t border-gray-100">
            {booking.roomType.description}
          </p>
        )}
      </div>
      
      {/* Actions */}
      <div className="p-4 border-t border-gray-100 bg-gray-50 flex flex-wrap gap-2">
        {canCancel && onCancel && (
          <button
            onClick={() => onCancel(booking.id)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-red-700 bg-red-50 border border-red-200 rounded-md hover:bg-red-100 transition-colors"
          >
            <XCircle className="w-4 h-4" />
            Cancel Booking
          </button>
        )}
        
        {hasInvoice && onDownloadInvoice && (
          <button
            onClick={() => onDownloadInvoice(booking.id)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-blue-700 bg-blue-50 border border-blue-200 rounded-md hover:bg-blue-100 transition-colors"
          >
            <FileText className="w-4 h-4" />
            Download Invoice
          </button>
        )}
        
        {booking.status === 'PROVISIONAL' && onJoinWaitlist && (
          <button
            onClick={() => onJoinWaitlist(booking.roomTypeId, booking.startDate, booking.endDate)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-purple-700 bg-purple-50 border border-purple-200 rounded-md hover:bg-purple-100 transition-colors"
          >
            <MapPin className="w-4 h-4" />
            Join Waitlist
          </button>
        )}
      </div>
    </div>
  )
}

/**
 * Booking Card Skeleton for loading state
 */
export function BookingCardSkeleton() {
  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm animate-pulse">
      <div className="p-4 border-b border-gray-100">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <div className="h-6 bg-gray-200 rounded w-48 mb-2" />
            <div className="h-4 bg-gray-200 rounded w-32" />
          </div>
          <div className="flex flex-col gap-2">
            <div className="h-6 bg-gray-200 rounded w-24" />
            <div className="h-6 bg-gray-200 rounded w-20" />
          </div>
        </div>
      </div>
      
      <div className="p-4 space-y-3">
        <div className="h-4 bg-gray-200 rounded w-full" />
        <div className="h-4 bg-gray-200 rounded w-32" />
        <div className="h-4 bg-gray-200 rounded w-40" />
        <div className="h-4 bg-gray-200 rounded w-full" />
      </div>
      
      <div className="p-4 border-t border-gray-100 bg-gray-50">
        <div className="h-8 bg-gray-200 rounded w-32" />
      </div>
    </div>
  )
}
