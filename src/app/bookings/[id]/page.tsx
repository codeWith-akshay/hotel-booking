'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/auth.store'
import ProtectedRoute from '@/components/auth/ProtectedRoute'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import {
  ArrowLeft,
  Hotel,
  Calendar,
  User,
  Mail,
  Phone,
  MapPin,
  CreditCard,
  DollarSign,
  CheckCircle,
  Clock,
  XCircle,
  Download,
  Printer,
  Share2,
  Building,
  CalendarDays,
  Moon,
  AlertCircle
} from 'lucide-react'
import { format, differenceInDays } from 'date-fns'
import { formatCurrency } from '@/lib/utils'
import { toast } from 'sonner'
import { getMemberBooking } from '@/actions/member/bookings'
import type { BookingStatus } from '@prisma/client'

// Type definition for booking with details
type BookingWithDetails = {
  id: string
  bookingId?: string
  status: BookingStatus
  startDate: Date
  endDate: Date
  totalPrice: number
  guestName: string
  guestEmail: string | null
  guestPhone: string
  numberOfGuests: number
  specialRequests: string | null
  createdAt: Date
  updatedAt: Date
  roomType: {
    id: string
    name: string
    description: string
    pricePerNight: number
  }
  user: {
    id: string
    name: string
    email: string | null
    phone: string | null
  }
  payments?: Array<{
    id: string
    amount?: number
    status: string
    provider?: string
    createdAt: Date
  }>
}

// Status badge style helper
const getStatusBadge = (status: BookingStatus) => {
  const styles: Record<BookingStatus, { label: string; className: string; icon: any }> = {
    PROVISIONAL: { 
      label: 'Provisional', 
      className: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      icon: Clock
    },
    CONFIRMED: { 
      label: 'Confirmed', 
      className: 'bg-green-100 text-green-800 border-green-200',
      icon: CheckCircle
    },
    CHECKED_IN: { 
      label: 'Checked In', 
      className: 'bg-blue-100 text-blue-800 border-blue-200',
      icon: Building
    },
    CHECKED_OUT: { 
      label: 'Checked Out', 
      className: 'bg-purple-100 text-purple-800 border-purple-200',
      icon: CheckCircle
    },
    COMPLETED: { 
      label: 'Completed', 
      className: 'bg-gray-100 text-gray-800 border-gray-200',
      icon: CheckCircle
    },
    CANCELLED: { 
      label: 'Cancelled', 
      className: 'bg-red-100 text-red-800 border-red-200',
      icon: XCircle
    }
  }
  
  return styles[status] || styles.PROVISIONAL
}

export default function BookingDetailsPage() {
  const params = useParams()
  const router = useRouter()
  const { user } = useAuthStore()
  const [loading, setLoading] = useState(true)
  const [booking, setBooking] = useState<BookingWithDetails | null>(null)
  const [error, setError] = useState<string | null>(null)
  const bookingId = params.id as string

  useEffect(() => {
    const fetchBookingDetails = async () => {
      if (!user?.id) {
        setError('User not authenticated')
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        const result = await getMemberBooking(bookingId, user.id)
        
        if (result.success && result.booking) {
          setBooking(result.booking as BookingWithDetails)
          setError(null)
        } else {
          setError(result.message || 'Failed to load booking details')
          toast.error(result.message || 'Failed to load booking')
        }
      } catch (err) {
        console.error('Error fetching booking:', err)
        setError('An unexpected error occurred')
        toast.error('Failed to load booking details')
      } finally {
        setLoading(false)
      }
    }

    fetchBookingDetails()
  }, [bookingId, user?.id])

  const handlePrint = () => {
    window.print()
    toast.success('Opening print dialog...')
  }

  const handleDownload = () => {
    toast.info('Invoice download feature coming soon!')
  }

  const handleShare = () => {
    if (navigator.share && booking) {
      navigator.share({
        title: `Booking ${booking.bookingId}`,
        text: `My hotel booking at ${booking.roomType.name}`,
        url: window.location.href,
      }).catch(() => toast.error('Failed to share'))
    } else {
      navigator.clipboard.writeText(window.location.href)
      toast.success('Booking link copied to clipboard!')
    }
  }

  if (loading) {
    return (
      <ProtectedRoute>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-gray-600">Loading booking details...</p>
          </div>
        </div>
      </ProtectedRoute>
    )
  }

  if (error || !booking) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-linear-to-br from-gray-50 via-blue-50/30 to-purple-50/20">
          <div className="container mx-auto px-4 py-8">
            <Button
              variant="ghost"
              onClick={() => router.back()}
              className="mb-4"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Bookings
            </Button>
            
            <Card className="border-0 shadow-xl">
              <CardContent className="py-20">
                <div className="text-center">
                  <div className="flex justify-center mb-6">
                    <div className="p-4 bg-red-100 rounded-full">
                      <AlertCircle className="h-12 w-12 text-red-600" />
                    </div>
                  </div>
                  <h3 className="text-2xl font-semibold text-gray-900 mb-2">
                    {error || 'Booking Not Found'}
                  </h3>
                  <p className="text-gray-500 mb-6">
                    The booking you're looking for could not be found or you don't have permission to view it.
                  </p>
                  <div className="flex gap-4 justify-center">
                    <Button
                      variant="outline"
                      onClick={() => router.back()}
                    >
                      Go Back
                    </Button>
                    <Button
                      onClick={() => router.push('/bookings/my-bookings')}
                      className="bg-linear-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
                    >
                      View All Bookings
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </ProtectedRoute>
    )
  }

  const nights = differenceInDays(new Date(booking.endDate), new Date(booking.startDate))
  const statusBadge = getStatusBadge(booking.status)
  const StatusIcon = statusBadge.icon
  const totalPaid = (booking.payments || [])
    .filter(p => p.status === 'SUCCEEDED')
    .reduce((sum, p) => sum + (p.amount || 0), 0)

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-linear-to-br from-gray-50 via-blue-50/30 to-purple-50/20 print:bg-white">
        <div className="container mx-auto px-4 py-8 print:py-4">
          {/* Header */}
          <div className="mb-6 print:hidden">
            <Button
              variant="ghost"
              onClick={() => router.back()}
              className="mb-4"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Bookings
            </Button>
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-4xl font-bold bg-linear-to-r from-gray-900 via-blue-800 to-purple-800 bg-clip-text text-transparent">
                  Booking Details
                </h1>
                <p className="text-gray-600 mt-2">Booking ID: {booking.bookingId}</p>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={handlePrint}>
                  <Printer className="h-4 w-4 mr-2" />
                  Print
                </Button>
                <Button variant="outline" size="sm" onClick={handleDownload}>
                  <Download className="h-4 w-4 mr-2" />
                  Invoice
                </Button>
                <Button variant="outline" size="sm" onClick={handleShare}>
                  <Share2 className="h-4 w-4 mr-2" />
                  Share
                </Button>
              </div>
            </div>
          </div>

          {/* Print Header */}
          <div className="hidden print:block mb-6">
            <h1 className="text-3xl font-bold text-gray-900">Booking Confirmation</h1>
            <p className="text-gray-600">Booking ID: {booking.bookingId}</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Status Card */}
              <Card className="border-0 shadow-xl print:shadow-none">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-6">
                    <Badge 
                      variant="outline" 
                      className={`${statusBadge.className} flex items-center gap-2 px-4 py-2 text-sm font-semibold`}
                    >
                      <StatusIcon className="h-4 w-4" />
                      {statusBadge.label}
                    </Badge>
                    <span className="text-sm text-gray-500">
                      Booked on {format(new Date(booking.createdAt), 'MMM dd, yyyy')}
                    </span>
                  </div>

                  {/* Room Information */}
                  <div className="mb-6">
                    <div className="flex items-start gap-4">
                      <div className="p-3 bg-linear-to-br from-blue-100 to-purple-100 rounded-lg">
                        <Hotel className="h-8 w-8 text-blue-600" />
                      </div>
                      <div className="flex-1">
                        <h2 className="text-2xl font-bold text-gray-900 mb-2">
                          {booking.roomType.name}
                        </h2>
                        <p className="text-gray-600">{booking.roomType.description}</p>
                        <div className="mt-3 flex items-center gap-2 text-sm text-gray-500">
                          <DollarSign className="h-4 w-4" />
                          <span>{formatCurrency(booking.roomType.pricePerNight)} per night</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <Separator className="my-6" />

                  {/* Stay Details */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-blue-50 rounded-lg">
                        <Calendar className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-500 mb-1">Check-in</p>
                        <p className="font-semibold text-gray-900">
                          {format(new Date(booking.startDate), 'EEE, MMM dd, yyyy')}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-purple-50 rounded-lg">
                        <CalendarDays className="h-5 w-5 text-purple-600" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-500 mb-1">Check-out</p>
                        <p className="font-semibold text-gray-900">
                          {format(new Date(booking.endDate), 'EEE, MMM dd, yyyy')}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-indigo-50 rounded-lg">
                        <Moon className="h-5 w-5 text-indigo-600" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-500 mb-1">Duration</p>
                        <p className="font-semibold text-gray-900">
                          {nights} {nights === 1 ? 'Night' : 'Nights'}
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Guest Information */}
              <Card className="border-0 shadow-xl print:shadow-none">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="h-5 w-5" />
                    Guest Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-center gap-3">
                      <User className="h-5 w-5 text-gray-400" />
                      <div>
                        <p className="text-sm text-gray-500">Guest Name</p>
                        <p className="font-medium text-gray-900">{booking.guestName}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <Phone className="h-5 w-5 text-gray-400" />
                      <div>
                        <p className="text-sm text-gray-500">Phone</p>
                        <p className="font-medium text-gray-900">{booking.guestPhone}</p>
                      </div>
                    </div>

                    {booking.guestEmail && (
                      <div className="flex items-center gap-3">
                        <Mail className="h-5 w-5 text-gray-400" />
                        <div>
                          <p className="text-sm text-gray-500">Email</p>
                          <p className="font-medium text-gray-900">{booking.guestEmail}</p>
                        </div>
                      </div>
                    )}

                    <div className="flex items-center gap-3">
                      <User className="h-5 w-5 text-gray-400" />
                      <div>
                        <p className="text-sm text-gray-500">Number of Guests</p>
                        <p className="font-medium text-gray-900">
                          {booking.numberOfGuests} {booking.numberOfGuests === 1 ? 'Guest' : 'Guests'}
                        </p>
                      </div>
                    </div>
                  </div>

                  {booking.specialRequests && (
                    <>
                      <Separator />
                      <div>
                        <p className="text-sm text-gray-500 mb-2">Special Requests</p>
                        <p className="text-gray-900 bg-gray-50 p-3 rounded-lg">
                          {booking.specialRequests}
                        </p>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>

              {/* Payment History */}
              {booking.payments && booking.payments.length > 0 && (
                <Card className="border-0 shadow-xl print:shadow-none">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <CreditCard className="h-5 w-5" />
                      Payment History
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {booking.payments.map((payment) => (
                        <div 
                          key={payment.id}
                          className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                        >
                          <div>
                            <p className="font-medium text-gray-900">
                              {formatCurrency(payment.amount || 0)}
                            </p>
                            <p className="text-sm text-gray-500">
                              {format(new Date(payment.createdAt), 'MMM dd, yyyy • h:mm a')}
                            </p>
                          </div>
                          <div className="text-right">
                            <Badge 
                              variant={payment.status === 'SUCCEEDED' ? 'default' : 'secondary'}
                              className="mb-1"
                            >
                              {payment.status}
                            </Badge>
                            <p className="text-xs text-gray-500 capitalize">
                              {payment.provider ? payment.provider.replace(/_/g, ' ') : 'N/A'}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Price Summary */}
              <Card className="border-0 shadow-xl print:shadow-none sticky top-6">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <DollarSign className="h-5 w-5" />
                    Price Summary
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">
                        {formatCurrency(booking.roomType.pricePerNight)} × {nights} nights
                      </span>
                      <span className="font-medium">
                        {formatCurrency(booking.roomType.pricePerNight * nights)}
                      </span>
                    </div>
                    
                    <Separator />
                    
                    <div className="flex justify-between items-center">
                      <span className="text-lg font-semibold text-gray-900">Total</span>
                      <span className="text-2xl font-bold text-blue-600">
                        {formatCurrency(booking.totalPrice)}
                      </span>
                    </div>

                    {booking.payments && booking.payments.length > 0 && (
                      <>
                        <Separator />
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Total Paid</span>
                            <span className="font-medium text-green-600">
                              {formatCurrency(totalPaid)}
                            </span>
                          </div>
                          {totalPaid < booking.totalPrice && (
                            <div className="flex justify-between text-sm">
                              <span className="text-gray-600">Balance Due</span>
                              <span className="font-medium text-orange-600">
                                {formatCurrency(booking.totalPrice - totalPaid)}
                              </span>
                            </div>
                          )}
                        </div>
                      </>
                    )}
                  </div>

                  {booking.status === 'PROVISIONAL' && totalPaid < booking.totalPrice && (
                    <>
                      <Separator />
                      <Button 
                        className="w-full bg-linear-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white print:hidden"
                        onClick={() => router.push(`/bookings/${booking.id}/payment`)}
                      >
                        <CreditCard className="h-4 w-4 mr-2" />
                        Complete Payment
                      </Button>
                    </>
                  )}
                </CardContent>
              </Card>

              {/* Quick Actions */}
              <Card className="border-0 shadow-xl print:hidden">
                <CardHeader>
                  <CardTitle className="text-sm">Need Help?</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Button variant="outline" className="w-full justify-start" size="sm">
                    <Phone className="h-4 w-4 mr-2" />
                    Contact Support
                  </Button>
                  <Button variant="outline" className="w-full justify-start" size="sm">
                    <Mail className="h-4 w-4 mr-2" />
                    Email Confirmation
                  </Button>
                  {booking.status === 'CONFIRMED' && (
                    <Button 
                      variant="outline" 
                      className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50" 
                      size="sm"
                    >
                      <XCircle className="h-4 w-4 mr-2" />
                      Cancel Booking
                    </Button>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  )
}
