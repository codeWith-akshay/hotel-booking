/**
 * Booking Table Component (Day 15)
 * 
 * Responsive table for admin dashboard
 * Desktop: full table, Mobile: card layout
 */

'use client'

import { useState } from 'react'
import { format } from 'date-fns'
import {
  MoreVertical,
  DollarSign,
  Calendar,
  User,
  Home,
  CreditCard,
  FileText,
  Ban,
  CheckCircle,
} from 'lucide-react'
import type { BookingListItem } from '@/redux/slices/bookingSlice'
import { BookingStatus } from '@prisma/client'

interface BookingTableProps {
  bookings: BookingListItem[]
  loading?: boolean
  onMarkPayment: (booking: BookingListItem) => void
  onOverride: (booking: BookingListItem) => void
  onGenerateInvoice: (booking: BookingListItem) => void
  onViewDetails: (booking: BookingListItem) => void
}

export function BookingTable({
  bookings,
  loading = false,
  onMarkPayment,
  onOverride,
  onGenerateInvoice,
  onViewDetails,
}: BookingTableProps) {
  const [openMenu, setOpenMenu] = useState<string | null>(null)
  
  if (loading) {
    return <BookingTableSkeleton />
  }
  
  if (bookings.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
        <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">No bookings found</h3>
        <p className="text-gray-500">Try adjusting your filters to see more results.</p>
      </div>
    )
  }
  
  return (
    <>
      {/* Desktop Table */}
      <div className="hidden lg:block bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Booking ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Member
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Room Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Dates
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Payment
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {bookings.map((booking) => (
                <tr
                  key={booking.id}
                  className="hover:bg-gray-50 transition-colors cursor-pointer"
                  onClick={() => onViewDetails(booking)}
                >
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {booking.id.slice(0, 8)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm">
                      <div className="font-medium text-gray-900">{booking.user?.name}</div>
                      <div className="text-gray-500">{booking.user?.phone}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {booking.roomType?.name} × {booking.roomsBooked}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <div>{format(new Date(booking.startDate), 'MMM dd')}</div>
                    <div>{format(new Date(booking.endDate), 'MMM dd, yyyy')}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <StatusBadge status={booking.status} />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <PaymentStatusBadge
                      status={booking.paymentStatus || 'PENDING'}
                      paid={booking.paidAmount || 0}
                      total={booking.totalPrice}
                    />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <div className="font-medium text-gray-900">
                      ${(booking.totalPrice / 100).toFixed(2)}
                    </div>
                    {booking.paidAmount && booking.paidAmount > 0 && (
                      <div className="text-xs text-green-600">
                        ${(booking.paidAmount / 100).toFixed(2)} paid
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <ActionMenu
                      booking={booking}
                      isOpen={openMenu === booking.id}
                      onToggle={() => setOpenMenu(openMenu === booking.id ? null : booking.id)}
                      onMarkPayment={onMarkPayment}
                      onOverride={onOverride}
                      onGenerateInvoice={onGenerateInvoice}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      
      {/* Mobile Card Layout */}
      <div className="lg:hidden space-y-4">
        {bookings.map((booking) => (
          <BookingCard
            key={booking.id}
            booking={booking}
            onMarkPayment={onMarkPayment}
            onOverride={onOverride}
            onGenerateInvoice={onGenerateInvoice}
            onViewDetails={onViewDetails}
          />
        ))}
      </div>
    </>
  )
}

// Status badge component
function StatusBadge({ status }: { status: BookingStatus }) {
  const styles = {
    CONFIRMED: 'bg-green-100 text-green-800',
    PROVISIONAL: 'bg-yellow-100 text-yellow-800',
    CANCELLED: 'bg-red-100 text-red-800',
  }
  
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${styles[status]}`}>
      {status}
    </span>
  )
}

// Payment status badge component
function PaymentStatusBadge({
  status,
  paid,
  total,
}: {
  status: string
  paid: number
  total: number
}) {
  const styles = {
    PAID: 'bg-green-100 text-green-800',
    PARTIAL: 'bg-blue-100 text-blue-800',
    PENDING: 'bg-gray-100 text-gray-800',
    OFFLINE: 'bg-purple-100 text-purple-800',
  }
  
  const percentage = total > 0 ? Math.round((paid / total) * 100) : 0
  
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${styles[status as keyof typeof styles] || styles.PENDING}`}>
      {status} {status === 'PARTIAL' && `(${percentage}%)`}
    </span>
  )
}

// Action menu component
function ActionMenu({
  booking,
  isOpen,
  onToggle,
  onMarkPayment,
  onOverride,
  onGenerateInvoice,
}: {
  booking: BookingListItem
  isOpen: boolean
  onToggle: () => void
  onMarkPayment: (booking: BookingListItem) => void
  onOverride: (booking: BookingListItem) => void
  onGenerateInvoice: (booking: BookingListItem) => void
}) {
  const canMarkPayment = booking.status !== 'CANCELLED' && booking.paymentStatus !== 'PAID'
  const canOverride = true // Admins can always override
  const canGenerateInvoice = booking.paymentStatus === 'PAID'
  
  return (
    <div className="relative">
      <button
        onClick={(e) => {
          e.stopPropagation()
          onToggle()
        }}
        className="p-1 hover:bg-gray-100 rounded transition-colors"
      >
        <MoreVertical className="w-5 h-5 text-gray-500" />
      </button>
      
      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-10"
            onClick={(e) => {
              e.stopPropagation()
              onToggle()
            }}
          />
          
          {/* Menu */}
          <div className="absolute right-0 mt-2 w-56 rounded-lg shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-20">
            <div className="py-1">
              {canMarkPayment && (
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    onMarkPayment(booking)
                    onToggle()
                  }}
                  className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                >
                  <DollarSign className="w-4 h-4" />
                  Mark Offline Payment
                </button>
              )}
              
              {canOverride && (
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    onOverride(booking)
                    onToggle()
                  }}
                  className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                >
                  <CheckCircle className="w-4 h-4" />
                  Override Booking
                </button>
              )}
              
              {canGenerateInvoice && (
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    onGenerateInvoice(booking)
                    onToggle()
                  }}
                  className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                >
                  <FileText className="w-4 h-4" />
                  Generate Invoice
                </button>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}

// Mobile card component
function BookingCard({
  booking,
  onMarkPayment,
  onOverride,
  onGenerateInvoice,
  onViewDetails,
}: {
  booking: BookingListItem
  onMarkPayment: (booking: BookingListItem) => void
  onOverride: (booking: BookingListItem) => void
  onGenerateInvoice: (booking: BookingListItem) => void
  onViewDetails: (booking: BookingListItem) => void
}) {
  return (
    <div
      onClick={() => onViewDetails(booking)}
      className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 space-y-3 cursor-pointer hover:shadow-md transition-shadow"
    >
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-gray-900">
            ID: {booking.id.slice(0, 8)}
          </p>
          <p className="text-xs text-gray-500 mt-0.5">
            {booking.user?.name}
          </p>
        </div>
        <div className="flex flex-col items-end gap-1">
          <StatusBadge status={booking.status} />
          <PaymentStatusBadge
            status={booking.paymentStatus || 'PENDING'}
            paid={booking.paidAmount || 0}
            total={booking.totalPrice}
          />
        </div>
      </div>
      
      {/* Details */}
      <div className="space-y-2 text-sm">
        <div className="flex items-center gap-2 text-gray-700">
          <Home className="w-4 h-4 text-gray-400 shrink-0" />
          <span>{booking.roomType?.name} × {booking.roomsBooked}</span>
        </div>
        
        <div className="flex items-center gap-2 text-gray-700">
          <Calendar className="w-4 h-4 text-gray-400 shrink-0" />
          <span>
            {format(new Date(booking.startDate), 'MMM dd')} -{' '}
            {format(new Date(booking.endDate), 'MMM dd, yyyy')}
          </span>
        </div>
        
        <div className="flex items-center gap-2 text-gray-700">
          <CreditCard className="w-4 h-4 text-gray-400 shrink-0" />
          <span className="font-medium">${(booking.totalPrice / 100).toFixed(2)}</span>
          {booking.paidAmount && booking.paidAmount > 0 && (
            <span className="text-xs text-green-600">
              (${(booking.paidAmount / 100).toFixed(2)} paid)
            </span>
          )}
        </div>
      </div>
      
      {/* Actions */}
      <div className="flex gap-2 pt-2 border-t border-gray-200">
        {booking.status !== 'CANCELLED' && booking.paymentStatus !== 'PAID' && (
          <button
            onClick={(e) => {
              e.stopPropagation()
              onMarkPayment(booking)
            }}
            className="flex-1 px-3 py-1.5 text-sm font-medium text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
          >
            Mark Payment
          </button>
        )}
        
        <button
          onClick={(e) => {
            e.stopPropagation()
            onOverride(booking)
          }}
          className="flex-1 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
        >
          Override
        </button>
        
        {booking.paymentStatus === 'PAID' && (
          <button
            onClick={(e) => {
              e.stopPropagation()
              onGenerateInvoice(booking)
            }}
            className="flex-1 px-3 py-1.5 text-sm font-medium text-green-600 hover:bg-green-50 rounded-lg transition-colors"
          >
            Invoice
          </button>
        )}
      </div>
    </div>
  )
}

// Loading skeleton
function BookingTableSkeleton() {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="space-y-4">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="flex items-center gap-4">
            <div className="h-12 w-24 bg-gray-200 rounded animate-pulse" />
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-gray-200 rounded w-3/4 animate-pulse" />
              <div className="h-3 bg-gray-200 rounded w-1/2 animate-pulse" />
            </div>
            <div className="h-6 w-20 bg-gray-200 rounded animate-pulse" />
          </div>
        ))}
      </div>
    </div>
  )
}
