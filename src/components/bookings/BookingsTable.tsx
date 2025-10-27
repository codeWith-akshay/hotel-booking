/**
 * Reusable Bookings Table Component
 * Professional UI inspired by Admin Dashboard Recent Bookings
 * Features: Search, Filters, Sorting, Status badges, Actions
 */

'use client'

import React, { useState } from 'react'
import { 
  Search, 
  Filter, 
  Calendar,
  Hotel,
  User,
  DollarSign,
  Clock,
  Eye,
  CreditCard,
  CheckCircle,
  XCircle,
  AlertCircle,
  ArrowUpDown,
  Download,
  Mail,
  Phone,
  MapPin,
  Sparkles
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { formatCurrency } from '@/lib/utils'
import { format } from 'date-fns'
import type { BookingStatus, PaymentStatus } from '@prisma/client'
import { cn } from '@/lib/utils'

// ==========================================
// TYPES
// ==========================================

export interface BookingTableData {
  id: string
  bookingId: string
  roomTypeName: string
  roomNumber?: string
  userName: string
  userEmail?: string
  userPhone?: string
  startDate: Date | string
  endDate: Date | string
  nights: number
  totalPrice: number
  status: BookingStatus
  paymentStatus?: PaymentStatus
  createdAt: Date | string
  hasCheckedIn?: boolean
  hasCheckedOut?: boolean
  checkInTime?: Date | string | null
  checkOutTime?: Date | string | null
}

export interface BookingsTableProps {
  bookings: BookingTableData[]
  loading?: boolean
  onViewDetails?: (bookingId: string) => void
  onRecordPayment?: (bookingId: string) => void
  onCheckIn?: (bookingId: string) => void
  onCheckOut?: (bookingId: string) => void
  showActions?: boolean
  showSearch?: boolean
  showFilters?: boolean
  title?: string
  description?: string
  emptyMessage?: string
  emptyAction?: {
    label: string
    onClick: () => void
  }
}

// ==========================================
// STATUS BADGE COMPONENTS
// ==========================================

const StatusBadge = ({ status }: { status: BookingStatus }) => {
  const variants: Record<BookingStatus, { 
    color: string
    icon: React.ReactNode
    label: string 
  }> = {
    PROVISIONAL: { 
      color: 'bg-gradient-to-r from-yellow-500 to-amber-500 text-white', 
      icon: <Clock className="h-3 w-3" />,
      label: 'Provisional' 
    },
    CONFIRMED: { 
      color: 'bg-gradient-to-r from-blue-500 to-blue-600 text-white', 
      icon: <CheckCircle className="h-3 w-3" />,
      label: 'Confirmed' 
    },
    CANCELLED: { 
      color: 'bg-gradient-to-r from-red-500 to-red-600 text-white', 
      icon: <XCircle className="h-3 w-3" />,
      label: 'Cancelled' 
    },
    CHECKED_IN: { 
      color: 'bg-gradient-to-r from-green-500 to-green-600 text-white', 
      icon: <CheckCircle className="h-3 w-3" />,
      label: 'Checked In' 
    },
    CHECKED_OUT: { 
      color: 'bg-gradient-to-r from-purple-500 to-purple-600 text-white', 
      icon: <CheckCircle className="h-3 w-3" />,
      label: 'Checked Out' 
    },
    COMPLETED: { 
      color: 'bg-gradient-to-r from-gray-500 to-gray-600 text-white', 
      icon: <CheckCircle className="h-3 w-3" />,
      label: 'Completed' 
    }
  }

  const variant = variants[status] || { 
    color: 'bg-gradient-to-r from-gray-500 to-gray-600 text-white', 
    icon: <AlertCircle className="h-3 w-3" />,
    label: status 
  }
  
  return (
    <Badge className={`${variant.color} border-0 flex items-center gap-1 px-2 py-1`}>
      {variant.icon}
      <span className="text-xs font-semibold">{variant.label}</span>
    </Badge>
  )
}

const PaymentBadge = ({ status }: { status: PaymentStatus }) => {
  const variants: Record<PaymentStatus, { 
    color: string
    icon: React.ReactNode
    label: string 
  }> = {
    PENDING: { 
      color: 'bg-yellow-100 text-yellow-800 border-yellow-300', 
      icon: <Clock className="h-3 w-3" />,
      label: 'Pending' 
    },
    SUCCEEDED: { 
      color: 'bg-green-100 text-green-800 border-green-300', 
      icon: <CheckCircle className="h-3 w-3" />,
      label: 'Paid' 
    },
    FAILED: { 
      color: 'bg-red-100 text-red-800 border-red-300', 
      icon: <XCircle className="h-3 w-3" />,
      label: 'Failed' 
    },
    REFUNDED: { 
      color: 'bg-purple-100 text-purple-800 border-purple-300', 
      icon: <DollarSign className="h-3 w-3" />,
      label: 'Refunded' 
    },
    CANCELLED: { 
      color: 'bg-gray-100 text-gray-800 border-gray-300', 
      icon: <XCircle className="h-3 w-3" />,
      label: 'Cancelled' 
    }
  }

  const variant = variants[status] || { 
    color: 'bg-gray-100 text-gray-800 border-gray-300', 
    icon: <AlertCircle className="h-3 w-3" />,
    label: status 
  }
  
  return (
    <Badge variant="outline" className={`${variant.color} flex items-center gap-1 px-2 py-1`}>
      {variant.icon}
      <span className="text-xs font-medium">{variant.label}</span>
    </Badge>
  )
}

// ==========================================
// MAIN COMPONENT
// ==========================================

export default function BookingsTable({
  bookings,
  loading = false,
  onViewDetails,
  onRecordPayment,
  onCheckIn,
  onCheckOut,
  showActions = true,
  showSearch = true,
  showFilters = true,
  title = 'My Bookings',
  description = 'View and manage your hotel reservations',
  emptyMessage = 'No bookings found',
  emptyAction
}: BookingsTableProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('ALL')
  const [paymentFilter, setPaymentFilter] = useState<string>('ALL')
  const [sortBy, setSortBy] = useState<'date' | 'price'>('date')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')

  // Filter and sort bookings
  const filteredBookings = bookings
    .filter(booking => {
      const matchesSearch = searchTerm === '' || 
        booking.bookingId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        booking.roomTypeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        booking.userName.toLowerCase().includes(searchTerm.toLowerCase())
      
      const matchesStatus = statusFilter === 'ALL' || booking.status === statusFilter
      const matchesPayment = paymentFilter === 'ALL' || booking.paymentStatus === paymentFilter

      return matchesSearch && matchesStatus && matchesPayment
    })
    .sort((a, b) => {
      if (sortBy === 'date') {
        const dateA = new Date(a.startDate).getTime()
        const dateB = new Date(b.startDate).getTime()
        return sortOrder === 'asc' ? dateA - dateB : dateB - dateA
      } else {
        return sortOrder === 'asc' 
          ? a.totalPrice - b.totalPrice 
          : b.totalPrice - a.totalPrice
      }
    })

  const toggleSort = (field: 'date' | 'price') => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortBy(field)
      setSortOrder('desc')
    }
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-gray-50 via-blue-50/30 to-purple-50/20">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-linear-to-br from-blue-500 to-purple-600 rounded-lg">
              <Hotel className="h-6 w-6 text-white" />
            </div>
            <h1 className="text-4xl font-bold bg-linear-to-r from-gray-900 via-blue-800 to-purple-800 bg-clip-text text-transparent">
              {title}
            </h1>
          </div>
          <p className="text-gray-600 text-lg">{description}</p>
        </div>

        {/* Search and Filters */}
        {(showSearch || showFilters) && (
          <Card className="mb-6 border-0 shadow-xl bg-white/80 backdrop-blur-sm">
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                {/* Search */}
                {showSearch && (
                  <div className="md:col-span-5">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                      <Input
                        placeholder="Search by booking ID, room, or guest name..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10 h-11 border-gray-200 focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                )}

                {/* Filters */}
                {showFilters && (
                  <>
                    <div className="md:col-span-3">
                      <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="w-full h-11 px-3 border border-gray-200 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="ALL">All Status</option>
                        <option value="PROVISIONAL">Provisional</option>
                        <option value="CONFIRMED">Confirmed</option>
                        <option value="CANCELLED">Cancelled</option>
                      </select>
                    </div>

                    <div className="md:col-span-3">
                      <select
                        value={paymentFilter}
                        onChange={(e) => setPaymentFilter(e.target.value)}
                        className="w-full h-11 px-3 border border-gray-200 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="ALL">All Payments</option>
                        <option value="PENDING">Pending</option>
                        <option value="SUCCEEDED">Paid</option>
                        <option value="FAILED">Failed</option>
                      </select>
                    </div>
                  </>
                )}

                {/* Sort Button */}
                <div className="md:col-span-1">
                  <Button
                    variant="outline"
                    onClick={() => toggleSort(sortBy)}
                    className="w-full h-11"
                    title={`Sort by ${sortBy} ${sortOrder}`}
                  >
                    <ArrowUpDown className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Active Filters Info */}
              {(statusFilter !== 'ALL' || paymentFilter !== 'ALL' || searchTerm) && (
                <div className="mt-4 flex items-center gap-2 text-sm text-gray-600">
                  <Filter className="h-4 w-4" />
                  <span>
                    Showing {filteredBookings.length} of {bookings.length} bookings
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setSearchTerm('')
                      setStatusFilter('ALL')
                      setPaymentFilter('ALL')
                    }}
                    className="h-7 text-xs"
                  >
                    Clear filters
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-20">
            <div className="relative">
              <div className="animate-spin rounded-full h-16 w-16 border-4 border-gray-200"></div>
              <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-500 border-t-transparent absolute top-0"></div>
            </div>
          </div>
        )}

        {/* Empty State */}
        {!loading && filteredBookings.length === 0 && (
          <Card className="border-0 shadow-xl">
            <CardContent className="py-20">
              <div className="text-center">
                <div className="flex justify-center mb-6">
                  <div className="p-4 bg-linear-to-br from-blue-100 to-purple-100 rounded-full">
                    <Hotel className="h-12 w-12 text-gray-400" />
                  </div>
                </div>
                <h3 className="text-2xl font-semibold text-gray-900 mb-2">
                  {emptyMessage}
                </h3>
                <p className="text-gray-500 mb-6">
                  {searchTerm || statusFilter !== 'ALL' || paymentFilter !== 'ALL'
                    ? 'Try adjusting your filters or search criteria'
                    : 'Start by making your first reservation'}
                </p>
                {emptyAction && (
                  <Button
                    onClick={emptyAction.onClick}
                    className="bg-linear-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-3 h-auto"
                  >
                    <Sparkles className="h-4 w-4 mr-2" />
                    {emptyAction.label}
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Bookings Grid */}
        {!loading && filteredBookings.length > 0 && (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredBookings.map((booking) => (
              <Card 
                key={booking.id}
                className="group border-0 shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 bg-white overflow-hidden"
              >
                {/* Gradient Header */}
                <div className="h-2 bg-linear-to-r from-blue-500 via-purple-500 to-pink-500" />
                
                <CardContent className="p-6">
                  {/* Header with Status */}
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Hotel className="h-4 w-4 text-blue-600" />
                        <h3 className="font-bold text-lg text-gray-900 group-hover:text-blue-600 transition-colors">
                          {booking.roomTypeName}
                        </h3>
                      </div>
                      <p className="text-sm text-gray-500 font-mono">
                        #{booking.bookingId}
                      </p>
                    </div>
                    <StatusBadge status={booking.status} />
                  </div>

                  {/* Guest Info */}
                  <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-2 mb-1">
                      <User className="h-4 w-4 text-gray-400" />
                      <span className="font-medium text-sm text-gray-900">
                        {booking.userName}
                      </span>
                    </div>
                    {booking.userEmail && (
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <Mail className="h-3 w-3" />
                        <span>{booking.userEmail}</span>
                      </div>
                    )}
                  </div>

                  {/* Dates */}
                  <div className="space-y-2 mb-4">
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-gray-600 flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        Check-in
                      </span>
                      <span className="font-semibold text-gray-900">
                        {format(new Date(booking.startDate), 'MMM dd, yyyy')}
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-gray-600 flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        Check-out
                      </span>
                      <span className="font-semibold text-gray-900">
                        {format(new Date(booking.endDate), 'MMM dd, yyyy')}
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-sm pt-2 border-t border-gray-100">
                      <span className="text-gray-600 flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        Duration
                      </span>
                      <span className="font-semibold text-blue-600">
                        {booking.nights} {booking.nights === 1 ? 'night' : 'nights'}
                      </span>
                    </div>
                  </div>

                  {/* Check-in/Check-out Status */}
                  {(booking.hasCheckedIn || booking.hasCheckedOut) && (
                    <div className="mb-4 space-y-1">
                      {booking.hasCheckedIn && (
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-green-600 flex items-center gap-1">
                            <CheckCircle className="h-3 w-3" />
                            Checked In
                          </span>
                          {booking.checkInTime && (
                            <span className="text-gray-500">
                              {format(new Date(booking.checkInTime), 'MMM dd, HH:mm')}
                            </span>
                          )}
                        </div>
                      )}
                      {booking.hasCheckedOut && (
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-blue-600 flex items-center gap-1">
                            <CheckCircle className="h-3 w-3" />
                            Checked Out
                          </span>
                          {booking.checkOutTime && (
                            <span className="text-gray-500">
                              {format(new Date(booking.checkOutTime), 'MMM dd, HH:mm')}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Payment Info */}
                  <div className="mb-4 p-3 bg-linear-to-br from-blue-50 to-purple-50 rounded-lg">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium text-gray-700">Total Amount</span>
                      <span className="text-2xl font-bold bg-linear-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                        {formatCurrency(booking.totalPrice / 100)}
                      </span>
                    </div>
                    {booking.paymentStatus && (
                      <div className="flex justify-end">
                        <PaymentBadge status={booking.paymentStatus} />
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  {showActions && (
                    <div className="flex gap-2">
                      {onViewDetails && (
                        <Button
                          variant="outline"
                          className="flex-1 group/btn"
                          onClick={() => onViewDetails(booking.id)}
                        >
                          <Eye className="h-4 w-4 mr-2 group-hover/btn:scale-110 transition-transform" />
                          View
                        </Button>
                      )}
                      {onRecordPayment && booking.paymentStatus !== 'SUCCEEDED' && (
                        <Button
                          className="flex-1 bg-linear-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
                          onClick={() => onRecordPayment(booking.id)}
                        >
                          <CreditCard className="h-4 w-4 mr-2" />
                          Pay
                        </Button>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Results Summary */}
        {!loading && filteredBookings.length > 0 && (
          <div className="mt-6 text-center text-sm text-gray-600">
            Showing {filteredBookings.length} {filteredBookings.length === 1 ? 'booking' : 'bookings'}
            {filteredBookings.length !== bookings.length && ` of ${bookings.length} total`}
          </div>
        )}
      </div>
    </div>
  )
}
