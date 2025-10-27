/**
 * Enhanced Booking Management Modal - Professional Grade
 * Advanced features: Timeline view, audit logs, payment history, document management
 */

'use client'

import React, { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import {
  processCheckIn,
  processCheckOut,
  recordOfflinePayment,
  getBookingDetails,
} from '@/actions/admin/check-in-out.action'
import {
  CheckCircle,
  XCircle,
  DollarSign,
  Calendar,
  User,
  Hotel,
  CreditCard,
  AlertCircle,
  Clock,
  FileText,
  Download,
  Mail,
  Phone,
  MapPin,
  Sparkles,
  TrendingUp,
  History,
  Receipt,
  UserCheck,
  LogIn,
  LogOut,
  Wallet,
  Activity,
  Info,
  Tag,
  Shield,
} from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import { format, differenceInDays, differenceInHours } from 'date-fns'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

// ==========================================
// TYPES
// ==========================================

interface EnhancedBookingManagementModalProps {
  isOpen: boolean
  onClose: () => void
  bookingId: string
  initialMode?: 'check-in' | 'check-out' | 'payment' | 'details'
  onSuccess?: () => void
}

interface BookingDetails {
  id: string
  userId: string
  roomTypeId: string
  startDate: Date
  endDate: Date
  status: string
  totalPrice: number
  roomsBooked: number
  user: {
    id: string
    name: string
    email: string | null
    phone: string
    vipStatus: string
  }
  roomType: {
    id: string
    name: string
    description: string
    pricePerNight: number
    totalRooms: number
  }
  payments: Array<{
    id: string
    amount: number
    status: string
    provider: string
    paidAt: Date | null
    createdAt: Date
  }>
  paymentSummary: {
    totalAmount: number
    totalPaid: number
    remaining: number
    fullyPaid: boolean
  }
  auditLogs?: Array<{
    id: string
    action: string
    details: string
    createdAt: Date
    admin: {
      name: string
      email: string | null
    }
  }>
}

// ==========================================
// SUB-COMPONENTS
// ==========================================

const StatusBadge = ({ status }: { status: string }) => {
  const variants: Record<string, { color: string; icon: React.ReactNode; label: string }> = {
    PROVISIONAL: { 
      color: 'bg-amber-100 text-amber-800 border-amber-200', 
      icon: <Clock className="h-3 w-3" />, 
      label: 'Provisional' 
    },
    CONFIRMED: { 
      color: 'bg-blue-100 text-blue-800 border-blue-200', 
      icon: <CheckCircle className="h-3 w-3" />, 
      label: 'Confirmed' 
    },
    CANCELLED: { 
      color: 'bg-red-100 text-red-800 border-red-200', 
      icon: <XCircle className="h-3 w-3" />, 
      label: 'Cancelled' 
    },
  }

  const variant = variants[status] || { 
    color: 'bg-gray-100 text-gray-800 border-gray-200', 
    icon: <Info className="h-3 w-3" />, 
    label: status 
  }

  return (
    <Badge className={cn('border flex items-center gap-1.5 px-3 py-1', variant.color)}>
      {variant.icon}
      <span className="font-semibold">{variant.label}</span>
    </Badge>
  )
}

const PaymentStatusBadge = ({ status }: { status: string }) => {
  const variants: Record<string, { color: string; icon: React.ReactNode; label: string }> = {
    PENDING: { 
      color: 'bg-yellow-100 text-yellow-800 border-yellow-200', 
      icon: <Clock className="h-3 w-3" />, 
      label: 'Pending' 
    },
    SUCCEEDED: { 
      color: 'bg-green-100 text-green-800 border-green-200', 
      icon: <CheckCircle className="h-3 w-3" />, 
      label: 'Paid' 
    },
    FAILED: { 
      color: 'bg-red-100 text-red-800 border-red-200', 
      icon: <XCircle className="h-3 w-3" />, 
      label: 'Failed' 
    },
    REFUNDED: { 
      color: 'bg-purple-100 text-purple-800 border-purple-200', 
      icon: <Activity className="h-3 w-3" />, 
      label: 'Refunded' 
    },
  }

  const variant = variants[status] || { 
    color: 'bg-gray-100 text-gray-800 border-gray-200', 
    icon: <Info className="h-3 w-3" />, 
    label: status 
  }

  return (
    <Badge className={cn('border flex items-center gap-1.5 px-3 py-1', variant.color)}>
      {variant.icon}
      <span className="font-semibold">{variant.label}</span>
    </Badge>
  )
}

const TimelineItem = ({ 
  icon, 
  title, 
  description, 
  time, 
  isLast = false,
  variant = 'default' 
}: { 
  icon: React.ReactNode
  title: string
  description: string
  time: string
  isLast?: boolean
  variant?: 'default' | 'success' | 'warning' | 'error'
}) => {
  const variantStyles = {
    default: 'bg-blue-100 text-blue-600',
    success: 'bg-green-100 text-green-600',
    warning: 'bg-amber-100 text-amber-600',
    error: 'bg-red-100 text-red-600',
  }

  return (
    <div className="flex gap-4 pb-6 relative">
      {!isLast && (
        <div className="absolute left-5 top-11 w-0.5 h-full bg-gray-200" />
      )}
      <div className={cn('h-10 w-10 rounded-full flex items-center justify-center shrink-0 z-10', variantStyles[variant])}>
        {icon}
      </div>
      <div className="flex-1 pt-1">
        <div className="flex items-start justify-between">
          <div>
            <h4 className="font-semibold text-gray-900">{title}</h4>
            <p className="text-sm text-gray-600 mt-0.5">{description}</p>
          </div>
          <span className="text-xs text-gray-500 whitespace-nowrap">{time}</span>
        </div>
      </div>
    </div>
  )
}

// ==========================================
// MAIN COMPONENT
// ==========================================

export default function EnhancedBookingManagementModal({
  isOpen,
  onClose,
  bookingId,
  initialMode = 'details',
  onSuccess,
}: EnhancedBookingManagementModalProps) {
  const [activeTab, setActiveTab] = useState<string>('overview')
  const [loading, setLoading] = useState(false)
  const [bookingDetails, setBookingDetails] = useState<BookingDetails | null>(null)
  const [loadingDetails, setLoadingDetails] = useState(false)

  // Check-in form state
  const [checkInNotes, setCheckInNotes] = useState('')

  // Check-out form state
  const [checkOutNotes, setCheckOutNotes] = useState('')
  const [additionalCharges, setAdditionalCharges] = useState('')
  const [discounts, setDiscounts] = useState('')

  // Payment form state
  const [paymentAmount, setPaymentAmount] = useState('')
  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'CARD' | 'BANK_TRANSFER' | 'CHEQUE' | 'OTHER'>('CASH')
  const [referenceNumber, setReferenceNumber] = useState('')
  const [paymentNotes, setPaymentNotes] = useState('')
  const [receivedBy, setReceivedBy] = useState('')

  // Update active tab when initialMode changes
  useEffect(() => {
    console.log('[BookingModal] initialMode changed:', initialMode)
    if (initialMode === 'check-in') setActiveTab('check-in')
    else if (initialMode === 'check-out') setActiveTab('check-out')
    else if (initialMode === 'payment') setActiveTab('payment')
    else if (initialMode === 'details') setActiveTab('overview')
    else setActiveTab('overview')
  }, [initialMode])

  // Fetch booking details when modal opens
  useEffect(() => {
    if (isOpen && bookingId) {
      console.log('[BookingModal] Modal opened for booking:', bookingId, 'mode:', initialMode)
      loadBookingDetails()
    }
  }, [isOpen, bookingId])

  const loadBookingDetails = async () => {
    setLoadingDetails(true)
    try {
      const result = await getBookingDetails(bookingId)
      if (result.success && result.data) {
        setBookingDetails(result.data)
      } else {
        toast.error(result.error || 'Failed to load booking details')
      }
    } catch (error) {
      console.error('Error loading booking:', error)
      toast.error('Failed to load booking details')
    } finally {
      setLoadingDetails(false)
    }
  }

  const handleCheckIn = async () => {
    setLoading(true)
    try {
      const result = await processCheckIn({
        bookingId,
        notes: checkInNotes,
        actualCheckInTime: new Date(),
      })

      if (result.success) {
        toast.success(result.message || 'Check-in processed successfully')
        await loadBookingDetails()
        onSuccess?.()
        setCheckInNotes('')
        setActiveTab('overview')
      } else {
        toast.error(result.error || 'Failed to process check-in')
      }
    } catch (error) {
      console.error('Check-in error:', error)
      toast.error('An error occurred during check-in')
    } finally {
      setLoading(false)
    }
  }

  const handleCheckOut = async () => {
    setLoading(true)
    try {
      const result = await processCheckOut({
        bookingId,
        notes: checkOutNotes,
        actualCheckOutTime: new Date(),
        additionalCharges: additionalCharges ? parseFloat(additionalCharges) * 100 : undefined,
        discounts: discounts ? parseFloat(discounts) * 100 : undefined,
      })

      if (result.success) {
        toast.success(result.message || 'Check-out processed successfully')
        await loadBookingDetails()
        onSuccess?.()
        setCheckOutNotes('')
        setAdditionalCharges('')
        setDiscounts('')
        setActiveTab('overview')
      } else {
        toast.error(result.error || 'Failed to process check-out')
      }
    } catch (error) {
      console.error('Check-out error:', error)
      toast.error('An error occurred during check-out')
    } finally {
      setLoading(false)
    }
  }

  const handlePayment = async () => {
    console.log('[Payment] Starting payment process...')
    console.log('[Payment] Amount:', paymentAmount)
    console.log('[Payment] Received By:', receivedBy)
    
    if (!paymentAmount || parseFloat(paymentAmount) <= 0) {
      toast.error('Please enter a valid payment amount')
      return
    }

    if (!receivedBy) {
      toast.error('Please enter who received the payment')
      return
    }

    setLoading(true)
    try {
      // Convert to cents and round to avoid floating-point issues
      const amountInCents = Math.round(parseFloat(paymentAmount) * 100)
      
      const payload = {
        bookingId,
        amount: amountInCents,
        paymentMethod: paymentMethod,
        referenceNumber: referenceNumber || undefined,
        notes: paymentNotes || undefined,
        receivedBy: receivedBy,
      }
      
      console.log('[Payment] Sending payload:', payload)
      console.log('[Payment] Amount in cents:', amountInCents)
      const result = await recordOfflinePayment(payload)
      console.log('[Payment] Result:', result)

      if (result.success) {
        toast.success(result.message || 'Payment recorded successfully')
        await loadBookingDetails()
        onSuccess?.()
        setPaymentAmount('')
        setReferenceNumber('')
        setPaymentNotes('')
        setReceivedBy('')
        setActiveTab('overview')
      } else {
        console.error('[Payment] Error:', result.error)
        toast.error(result.error || 'Failed to record payment')
      }
    } catch (error) {
      console.error('[Payment] Exception:', error)
      toast.error('An error occurred while recording payment')
    } finally {
      setLoading(false)
    }
  }

  if (loadingDetails) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  if (!bookingDetails) {
    return null
  }

  const nights = differenceInDays(
    new Date(bookingDetails.endDate),
    new Date(bookingDetails.startDate)
  )

  const checkInLog = bookingDetails.auditLogs?.find(log => log.action === 'CHECK_IN')
  const checkOutLog = bookingDetails.auditLogs?.find(log => log.action === 'CHECK_OUT')
  const hasCheckedIn = !!checkInLog
  const hasCheckedOut = !!checkOutLog

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] p-0 flex flex-col overflow-hidden">
        {/* Header Section - Enhanced with gradient */}
        <div className="bg-linear-to-r from-blue-600 via-purple-600 to-pink-600 p-6 text-white shrink-0">
          <DialogHeader>
            <div className="flex items-start justify-between">
              <div>
                <DialogTitle className="text-2xl font-bold mb-2">
                  Booking #{bookingDetails.id.substring(0, 8).toUpperCase()}
                </DialogTitle>
                <div className="flex items-center gap-3 flex-wrap">
                    <StatusBadge status={bookingDetails.status} />
                    <PaymentStatusBadge 
                      status={bookingDetails.paymentSummary.fullyPaid ? 'SUCCEEDED' : 'PENDING'} 
                    />
                    {hasCheckedIn && (
                      <Badge className="bg-green-500/20 text-white border-green-400">
                        <UserCheck className="h-3 w-3 mr-1" />
                        Checked In
                      </Badge>
                    )}
                    {hasCheckedOut && (
                      <Badge className="bg-blue-500/20 text-white border-blue-400">
                        <LogOut className="h-3 w-3 mr-1" />
                        Checked Out
                      </Badge>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm opacity-90">Total Amount</div>
                  <div className="text-3xl font-bold">
                    {formatCurrency(bookingDetails.totalPrice / 100)}
                  </div>
                  {!bookingDetails.paymentSummary.fullyPaid && (
                    <div className="text-sm mt-1">
                      <span className="opacity-90">Paid: </span>
                      <span className="font-semibold">
                        {formatCurrency(bookingDetails.paymentSummary.totalPaid / 100)}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </DialogHeader>

            {/* Quick Stats Row */}
            <div className="grid grid-cols-4 gap-4 mt-6">
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3">
                <div className="flex items-center gap-2 text-white/80 text-sm mb-1">
                  <Calendar className="h-4 w-4" />
                  <span>Check-In</span>
                </div>
                <div className="text-lg font-semibold">
                  {format(new Date(bookingDetails.startDate), 'MMM dd, yyyy')}
                </div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3">
                <div className="flex items-center gap-2 text-white/80 text-sm mb-1">
                  <Calendar className="h-4 w-4" />
                  <span>Check-Out</span>
                </div>
                <div className="text-lg font-semibold">
                  {format(new Date(bookingDetails.endDate), 'MMM dd, yyyy')}
                </div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3">
                <div className="flex items-center gap-2 text-white/80 text-sm mb-1">
                  <Hotel className="h-4 w-4" />
                  <span>Nights</span>
                </div>
                <div className="text-lg font-semibold">{nights}</div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3">
                <div className="flex items-center gap-2 text-white/80 text-sm mb-1">
                  <User className="h-4 w-4" />
                  <span>Rooms</span>
                </div>
                <div className="text-lg font-semibold">{bookingDetails.roomsBooked}</div>
              </div>
            </div>
          </div>

          {/* Tabs Navigation */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col min-h-0">
            <TabsList className="w-full justify-start rounded-none border-b bg-gray-50/50 px-6 shrink-0">
              <TabsTrigger value="overview" className="gap-2">
                <Info className="h-4 w-4" />
                Overview
              </TabsTrigger>
              <TabsTrigger value="timeline" className="gap-2">
                <Activity className="h-4 w-4" />
                Timeline
              </TabsTrigger>
              <TabsTrigger value="payment" className="gap-2">
                <Receipt className="h-4 w-4" />
                Payments
              </TabsTrigger>
              {bookingDetails.status === 'PROVISIONAL' && !hasCheckedIn && (
                <TabsTrigger value="check-in" className="gap-2 text-green-600">
                  <LogIn className="h-4 w-4" />
                  Check-In
                </TabsTrigger>
              )}
              {bookingDetails.status === 'CONFIRMED' && hasCheckedIn && !hasCheckedOut && (
                <TabsTrigger value="check-out" className="gap-2 text-blue-600">
                  <LogOut className="h-4 w-4" />
                  Check-Out
                </TabsTrigger>
              )}
            </TabsList>

            {/* Tab Content - Scrollable */}
            <div className="flex-1 overflow-y-auto p-6">
              {/* Overview Tab */}
              <TabsContent value="overview" className="mt-0 space-y-6 h-full">
                <div className="grid grid-cols-2 gap-6">
                  {/* Guest Information */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <User className="h-5 w-5 text-blue-600" />
                        Guest Information
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <Label className="text-sm text-gray-500">Guest Name</Label>
                        <div className="flex items-center gap-2 mt-1">
                          <div className="h-10 w-10 rounded-full bg-linear-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold">
                            {bookingDetails.user.name.charAt(0)}
                          </div>
                          <div>
                            <p className="font-semibold text-gray-900">{bookingDetails.user.name}</p>
                            {bookingDetails.user.vipStatus !== 'NONE' && (
                              <Badge variant="outline" className="text-xs">
                                <Sparkles className="h-3 w-3 mr-1" />
                                {bookingDetails.user.vipStatus}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                      <Separator />
                      <div>
                        <Label className="text-sm text-gray-500">Contact Details</Label>
                        <div className="space-y-2 mt-2">
                          <div className="flex items-center gap-2 text-sm">
                            <Phone className="h-4 w-4 text-gray-400" />
                            <span>{bookingDetails.user.phone}</span>
                          </div>
                          {bookingDetails.user.email && (
                            <div className="flex items-center gap-2 text-sm">
                              <Mail className="h-4 w-4 text-gray-400" />
                              <span>{bookingDetails.user.email}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Room Information */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Hotel className="h-5 w-5 text-purple-600" />
                        Room Information
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <Label className="text-sm text-gray-500">Room Type</Label>
                        <p className="font-semibold text-gray-900 mt-1">
                          {bookingDetails.roomType.name}
                        </p>
                        <p className="text-sm text-gray-600 mt-1">
                          {bookingDetails.roomType.description}
                        </p>
                      </div>
                      <Separator />
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label className="text-sm text-gray-500">Price per Night</Label>
                          <p className="font-semibold text-gray-900 mt-1">
                            {formatCurrency(bookingDetails.roomType.pricePerNight)}
                          </p>
                        </div>
                        <div>
                          <Label className="text-sm text-gray-500">Rooms Booked</Label>
                          <p className="font-semibold text-gray-900 mt-1">
                            {bookingDetails.roomsBooked}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Payment Summary */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <DollarSign className="h-5 w-5 text-green-600" />
                      Payment Summary
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Total Amount</span>
                        <span className="font-semibold text-lg">
                          {formatCurrency(bookingDetails.paymentSummary.totalAmount / 100)}
                        </span>
                      </div>
                      <div className="flex justify-between items-center text-green-600">
                        <span>Amount Paid</span>
                        <span className="font-semibold">
                          {formatCurrency(bookingDetails.paymentSummary.totalPaid / 100)}
                        </span>
                      </div>
                      {bookingDetails.paymentSummary.remaining > 0 && (
                        <>
                          <Separator />
                          <div className="flex justify-between items-center text-amber-600">
                            <span className="font-medium">Balance Due</span>
                            <span className="font-bold text-xl">
                              {formatCurrency(bookingDetails.paymentSummary.remaining / 100)}
                            </span>
                          </div>
                        </>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Quick Actions */}
                <div className="flex gap-3">
                  {bookingDetails.status === 'PROVISIONAL' && !hasCheckedIn && (
                    <Button 
                      onClick={() => setActiveTab('check-in')}
                      className="flex-1 bg-linear-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800"
                    >
                      <LogIn className="h-4 w-4 mr-2" />
                      Check-In Guest
                    </Button>
                  )}
                  {bookingDetails.status === 'CONFIRMED' && hasCheckedIn && !hasCheckedOut && (
                    <Button 
                      onClick={() => setActiveTab('check-out')}
                      className="flex-1 bg-linear-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800"
                    >
                      <LogOut className="h-4 w-4 mr-2" />
                      Check-Out Guest
                    </Button>
                  )}
                  {!bookingDetails.paymentSummary.fullyPaid && (
                    <Button 
                      onClick={() => setActiveTab('payment')}
                      variant="outline"
                      className="flex-1 border-2"
                    >
                      <Wallet className="h-4 w-4 mr-2" />
                      Record Payment
                    </Button>
                  )}
                </div>
              </TabsContent>

              {/* Timeline Tab */}
              <TabsContent value="timeline" className="mt-0 h-full">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <History className="h-5 w-5 text-blue-600" />
                      Activity Timeline
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {bookingDetails.auditLogs && bookingDetails.auditLogs.length > 0 ? (
                      <div className="space-y-0">
                        {bookingDetails.auditLogs.map((log, index) => {
                          const metadata = log.details ? JSON.parse(log.details) : {}
                          
                          let icon = <Activity className="h-5 w-5" />
                          let variant: 'default' | 'success' | 'warning' | 'error' = 'default'
                          
                          if (log.action === 'CHECK_IN') {
                            icon = <LogIn className="h-5 w-5" />
                            variant = 'success'
                          } else if (log.action === 'CHECK_OUT') {
                            icon = <LogOut className="h-5 w-5" />
                            variant = 'default'
                          } else if (log.action === 'PAYMENT_RECORDED') {
                            icon = <DollarSign className="h-5 w-5" />
                            variant = 'success'
                          } else if (log.action === 'CANCELLED') {
                            icon = <XCircle className="h-5 w-5" />
                            variant = 'error'
                          }

                          return (
                            <TimelineItem
                              key={log.id}
                              icon={icon}
                              title={log.action.replace(/_/g, ' ')}
                              description={`By ${log.admin.name}`}
                              time={format(new Date(log.createdAt), 'MMM dd, yyyy HH:mm')}
                              isLast={index === bookingDetails.auditLogs!.length - 1}
                              variant={variant}
                            />
                          )
                        })}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-gray-500">
                        <History className="h-12 w-12 mx-auto mb-3 text-gray-400" />
                        <p>No activity recorded yet</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Payment Tab */}
              <TabsContent value="payment" className="mt-0 space-y-6 h-full">
                {/* Payment History */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Receipt className="h-5 w-5 text-green-600" />
                      Payment History
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {bookingDetails.payments.length > 0 ? (
                      <div className="space-y-3">
                        {bookingDetails.payments.map((payment) => (
                          <div
                            key={payment.id}
                            className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                          >
                            <div className="flex items-center gap-3">
                              <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
                                <CreditCard className="h-5 w-5 text-green-600" />
                              </div>
                              <div>
                                <p className="font-semibold text-gray-900">
                                  {formatCurrency(payment.amount / 100)}
                                </p>
                                <p className="text-sm text-gray-600">
                                  {format(new Date(payment.createdAt), 'MMM dd, yyyy HH:mm')}
                                </p>
                              </div>
                            </div>
                            <PaymentStatusBadge status={payment.status} />
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-gray-500">
                        <Receipt className="h-12 w-12 mx-auto mb-3 text-gray-400" />
                        <p>No payments recorded yet</p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Record New Payment */}
                {!bookingDetails.paymentSummary.fullyPaid && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Wallet className="h-5 w-5 text-blue-600" />
                        Record New Payment
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label>Amount *</Label>
                          <div className="flex gap-2">
                            <Input
                              type="number"
                              step="0.01"
                              placeholder="0.00"
                              value={paymentAmount}
                              onChange={(e) => setPaymentAmount(e.target.value)}
                              className="mt-1.5 flex-1"
                            />
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => setPaymentAmount((bookingDetails.paymentSummary.remaining / 100).toFixed(2))}
                              className="mt-1.5 shrink-0"
                              title="Fill remaining amount"
                            >
                              Full
                            </Button>
                          </div>
                          <p className="text-xs text-gray-500 mt-1">
                            Remaining: {formatCurrency(bookingDetails.paymentSummary.remaining / 100)}
                          </p>
                        </div>
                        <div>
                          <Label>Payment Method *</Label>
                          <select
                            value={paymentMethod}
                            onChange={(e) => setPaymentMethod(e.target.value as any)}
                            className="w-full mt-1.5 px-3 py-2 border border-gray-300 rounded-md"
                          >
                            <option value="CASH">Cash</option>
                            <option value="CARD">Card</option>
                            <option value="BANK_TRANSFER">Bank Transfer</option>
                            <option value="CHEQUE">Cheque</option>
                            <option value="OTHER">Other</option>
                          </select>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label>Reference Number</Label>
                          <Input
                            placeholder="Transaction ID, Receipt #"
                            value={referenceNumber}
                            onChange={(e) => setReferenceNumber(e.target.value)}
                            className="mt-1.5"
                          />
                        </div>
                        <div>
                          <Label>Received By *</Label>
                          <Input
                            placeholder="Staff name"
                            value={receivedBy}
                            onChange={(e) => setReceivedBy(e.target.value)}
                            className="mt-1.5"
                            required
                          />
                        </div>
                      </div>
                      <div>
                        <Label>Notes</Label>
                        <Textarea
                          placeholder="Additional payment notes..."
                          value={paymentNotes}
                          onChange={(e) => setPaymentNotes(e.target.value)}
                          className="mt-1.5"
                          rows={3}
                        />
                      </div>
                      <Button
                        onClick={handlePayment}
                        disabled={loading}
                        className="w-full bg-linear-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800"
                      >
                        {loading ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                            Processing...
                          </>
                        ) : (
                          <>
                            <CheckCircle className="h-4 w-4 mr-2" />
                            Record Payment
                          </>
                        )}
                      </Button>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              {/* Check-In Tab */}
              {bookingDetails.status === 'PROVISIONAL' && !hasCheckedIn && (
                <TabsContent value="check-in" className="mt-0 h-full">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <LogIn className="h-5 w-5 text-green-600" />
                        Check-In Guest
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <div className="flex gap-3">
                          <Info className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
                          <div className="text-sm text-blue-800">
                            <p className="font-semibold mb-1">Check-in Details</p>
                            <p>Guest: <strong>{bookingDetails.user.name}</strong></p>
                            <p>Room: <strong>{bookingDetails.roomType.name}</strong></p>
                            <p>Duration: <strong>{nights} nights</strong></p>
                          </div>
                        </div>
                      </div>

                      <div>
                        <Label>Check-In Notes</Label>
                        <Textarea
                          placeholder="Any special requests, room preferences, or observations..."
                          value={checkInNotes}
                          onChange={(e) => setCheckInNotes(e.target.value)}
                          className="mt-1.5"
                          rows={4}
                        />
                      </div>

                      <Button
                        onClick={handleCheckIn}
                        disabled={loading}
                        className="w-full bg-linear-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 h-12"
                      >
                        {loading ? (
                          <>
                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2" />
                            Processing Check-In...
                          </>
                        ) : (
                          <>
                            <UserCheck className="h-5 w-5 mr-2" />
                            Confirm Check-In
                          </>
                        )}
                      </Button>
                    </CardContent>
                  </Card>
                </TabsContent>
              )}

              {/* Check-Out Tab */}
              {bookingDetails.status === 'CONFIRMED' && hasCheckedIn && !hasCheckedOut && (
                <TabsContent value="check-out" className="mt-0 space-y-6 h-full">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <LogOut className="h-5 w-5 text-blue-600" />
                        Check-Out Guest
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <div className="flex gap-3">
                          <Info className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
                          <div className="text-sm text-blue-800">
                            <p className="font-semibold mb-1">Check-out Summary</p>
                            <p>Guest: <strong>{bookingDetails.user.name}</strong></p>
                            <p>Nights Stayed: <strong>{nights}</strong></p>
                            <p>Base Amount: <strong>{formatCurrency(bookingDetails.totalPrice)}</strong></p>
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label>Additional Charges</Label>
                          <Input
                            type="number"
                            step="0.01"
                            placeholder="0.00"
                            value={additionalCharges}
                            onChange={(e) => setAdditionalCharges(e.target.value)}
                            className="mt-1.5"
                          />
                          <p className="text-xs text-gray-500 mt-1">
                            Room service, minibar, damages, etc.
                          </p>
                        </div>
                        <div>
                          <Label>Discounts</Label>
                          <Input
                            type="number"
                            step="0.01"
                            placeholder="0.00"
                            value={discounts}
                            onChange={(e) => setDiscounts(e.target.value)}
                            className="mt-1.5"
                          />
                          <p className="text-xs text-gray-500 mt-1">
                            Promo codes, loyalty points, etc.
                          </p>
                        </div>
                      </div>

                      {(additionalCharges || discounts) && (
                        <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                          <div className="flex justify-between text-sm">
                            <span>Base Amount</span>
                            <span>{formatCurrency(bookingDetails.totalPrice)}</span>
                          </div>
                          {additionalCharges && (
                            <div className="flex justify-between text-sm text-red-600">
                              <span>+ Additional Charges</span>
                              <span>+{formatCurrency(parseFloat(additionalCharges) * 100)}</span>
                            </div>
                          )}
                          {discounts && (
                            <div className="flex justify-between text-sm text-green-600">
                              <span>- Discounts</span>
                              <span>-{formatCurrency(parseFloat(discounts) * 100)}</span>
                            </div>
                          )}
                          <Separator />
                          <div className="flex justify-between font-semibold text-lg">
                            <span>Final Amount</span>
                            <span>
                              {formatCurrency(
                                bookingDetails.totalPrice +
                                (additionalCharges ? parseFloat(additionalCharges) * 100 : 0) -
                                (discounts ? parseFloat(discounts) * 100 : 0)
                              )}
                            </span>
                          </div>
                        </div>
                      )}

                      <div>
                        <Label>Check-Out Notes</Label>
                        <Textarea
                          placeholder="Room condition, feedback, issues..."
                          value={checkOutNotes}
                          onChange={(e) => setCheckOutNotes(e.target.value)}
                          className="mt-1.5"
                          rows={4}
                        />
                      </div>

                      <Button
                        onClick={handleCheckOut}
                        disabled={loading}
                        className="w-full bg-linear-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 h-12"
                      >
                        {loading ? (
                          <>
                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2" />
                            Processing Check-Out...
                          </>
                        ) : (
                          <>
                            <CheckCircle className="h-5 w-5 mr-2" />
                            Confirm Check-Out
                          </>
                        )}
                      </Button>
                    </CardContent>
                  </Card>
                </TabsContent>
              )}
            </div>
          </Tabs>
      </DialogContent>
    </Dialog>
  )
}
