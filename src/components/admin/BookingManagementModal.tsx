/**
 * Booking Management Modal
 * Handles check-in, check-out, and payment operations for admin
 */

'use client'

import React, { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
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
} from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import { format } from 'date-fns'
import { toast } from 'sonner'

// ==========================================
// TYPES
// ==========================================

interface BookingManagementModalProps {
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
// MAIN COMPONENT
// ==========================================

export default function BookingManagementModal({
  isOpen,
  onClose,
  bookingId,
  initialMode = 'details',
  onSuccess,
}: BookingManagementModalProps) {
  const [mode, setMode] = useState<'check-in' | 'check-out' | 'payment' | 'details'>(initialMode)
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

  // Fetch booking details when modal opens
  React.useEffect(() => {
    if (isOpen && bookingId) {
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

  const handleRecordPayment = async () => {
    if (!paymentAmount || parseFloat(paymentAmount) <= 0) {
      toast.error('Please enter a valid payment amount')
      return
    }

    if (!receivedBy.trim()) {
      toast.error('Please enter who received the payment')
      return
    }

    setLoading(true)
    try {
      const result = await recordOfflinePayment({
        bookingId,
        amount: parseFloat(paymentAmount) * 100, // Convert to cents
        paymentMethod,
        referenceNumber: referenceNumber || undefined,
        notes: paymentNotes || undefined,
        receivedBy,
      })

      if (result.success) {
        toast.success(result.message || 'Payment recorded successfully')
        await loadBookingDetails()
        onSuccess?.()
        // Reset form
        setPaymentAmount('')
        setReferenceNumber('')
        setPaymentNotes('')
        setReceivedBy('')
      } else {
        toast.error(result.error || 'Failed to record payment')
      }
    } catch (error) {
      console.error('Payment recording error:', error)
      toast.error('An error occurred while recording payment')
    } finally {
      setLoading(false)
    }
  }

  const renderContent = () => {
    if (loadingDetails) {
      return (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading booking details...</p>
          </div>
        </div>
      )
    }

    if (!bookingDetails) {
      return (
        <div className="flex items-center justify-center py-12">
          <div className="text-center text-gray-500">
            <AlertCircle className="h-12 w-12 mx-auto mb-4" />
            <p>Booking details not available</p>
          </div>
        </div>
      )
    }

    switch (mode) {
      case 'check-in':
        return renderCheckInForm()
      case 'check-out':
        return renderCheckOutForm()
      case 'payment':
        return renderPaymentForm()
      default:
        return renderDetailsView()
    }
  }

  const renderDetailsView = () => {
    if (!bookingDetails) return null

    return (
      <div className="space-y-6">
        {/* Booking Summary */}
        <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-600">Booking ID</p>
              <p className="font-semibold text-gray-900">{bookingDetails.id}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Status</p>
              <Badge className={`
                ${bookingDetails.status === 'CONFIRMED' ? 'bg-green-100 text-green-800' : ''}
                ${bookingDetails.status === 'PROVISIONAL' ? 'bg-yellow-100 text-yellow-800' : ''}
                ${bookingDetails.status === 'CANCELLED' ? 'bg-red-100 text-red-800' : ''}
              `}>
                {bookingDetails.status}
              </Badge>
            </div>
          </div>
        </div>

        {/* Guest Information */}
        <div>
          <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <User className="h-5 w-5 text-blue-600" />
            Guest Information
          </h4>
          <div className="bg-gray-50 rounded-lg p-4 space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-600">Name:</span>
              <span className="font-medium">{bookingDetails.user.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Phone:</span>
              <span className="font-medium">{bookingDetails.user.phone}</span>
            </div>
            {bookingDetails.user.email && (
              <div className="flex justify-between">
                <span className="text-gray-600">Email:</span>
                <span className="font-medium">{bookingDetails.user.email}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-gray-600">VIP Status:</span>
              <Badge>{bookingDetails.user.vipStatus}</Badge>
            </div>
          </div>
        </div>

        {/* Room Information */}
        <div>
          <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <Hotel className="h-5 w-5 text-purple-600" />
            Room Information
          </h4>
          <div className="bg-gray-50 rounded-lg p-4 space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-600">Room Type:</span>
              <span className="font-medium">{bookingDetails.roomType.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Rooms Booked:</span>
              <span className="font-medium">{bookingDetails.roomsBooked}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Check-in:</span>
              <span className="font-medium">{format(new Date(bookingDetails.startDate), 'MMM dd, yyyy')}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Check-out:</span>
              <span className="font-medium">{format(new Date(bookingDetails.endDate), 'MMM dd, yyyy')}</span>
            </div>
          </div>
        </div>

        {/* Payment Summary */}
        <div>
          <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-green-600" />
            Payment Summary
          </h4>
          <div className="bg-gray-50 rounded-lg p-4 space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-600">Total Amount:</span>
              <span className="font-semibold text-gray-900">
                {formatCurrency(bookingDetails.paymentSummary.totalAmount)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Total Paid:</span>
              <span className="font-semibold text-green-600">
                {formatCurrency(bookingDetails.paymentSummary.totalPaid)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Remaining:</span>
              <span className="font-semibold text-red-600">
                {formatCurrency(bookingDetails.paymentSummary.remaining)}
              </span>
            </div>
            <div className="pt-2 border-t">
              <Badge className={bookingDetails.paymentSummary.fullyPaid ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}>
                {bookingDetails.paymentSummary.fullyPaid ? 'Fully Paid' : 'Payment Pending'}
              </Badge>
            </div>
          </div>
        </div>

        {/* Payment History */}
        {bookingDetails.payments.length > 0 && (
          <div>
            <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <FileText className="h-5 w-5 text-blue-600" />
              Payment History
            </h4>
            <div className="space-y-2">
              {bookingDetails.payments.map((payment) => (
                <div key={payment.id} className="bg-gray-50 rounded-lg p-3 flex justify-between items-center">
                  <div>
                    <p className="font-medium">{formatCurrency(payment.amount)}</p>
                    <p className="text-xs text-gray-600">
                      {payment.provider} - {format(new Date(payment.createdAt), 'MMM dd, yyyy HH:mm')}
                    </p>
                  </div>
                  <Badge className={payment.status === 'SUCCEEDED' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}>
                    {payment.status}
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3 pt-4 border-t">
          {bookingDetails.status === 'PROVISIONAL' && (
            <Button
              onClick={() => setMode('check-in')}
              className="flex-1 bg-green-600 hover:bg-green-700"
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              Check In
            </Button>
          )}
          {bookingDetails.status === 'CONFIRMED' && (
            <Button
              onClick={() => setMode('check-out')}
              className="flex-1 bg-blue-600 hover:bg-blue-700"
            >
              <XCircle className="h-4 w-4 mr-2" />
              Check Out
            </Button>
          )}
          {!bookingDetails.paymentSummary.fullyPaid && bookingDetails.status !== 'CANCELLED' && (
            <Button
              onClick={() => setMode('payment')}
              className="flex-1 bg-purple-600 hover:bg-purple-700"
            >
              <CreditCard className="h-4 w-4 mr-2" />
              Record Payment
            </Button>
          )}
        </div>
      </div>
    )
  }

  const renderCheckInForm = () => {
    if (!bookingDetails) return null

    return (
      <div className="space-y-4">
        <div className="bg-green-50 rounded-lg p-4 border border-green-200">
          <h4 className="font-semibold text-green-900 mb-2 flex items-center gap-2">
            <CheckCircle className="h-5 w-5" />
            Check-In Process
          </h4>
          <p className="text-sm text-green-700">
            Guest: <span className="font-semibold">{bookingDetails.user.name}</span>
          </p>
          <p className="text-sm text-green-700">
            Room: <span className="font-semibold">{bookingDetails.roomType.name}</span>
          </p>
        </div>

        {!bookingDetails.paymentSummary.fullyPaid && (
          <div className="bg-yellow-50 rounded-lg p-3 border border-yellow-200">
            <p className="text-sm text-yellow-800 flex items-center gap-2">
              <AlertCircle className="h-4 w-4" />
              Payment pending: {formatCurrency(bookingDetails.paymentSummary.remaining)}
            </p>
          </div>
        )}

        <div>
          <Label htmlFor="checkInNotes">Notes (Optional)</Label>
          <Textarea
            id="checkInNotes"
            value={checkInNotes}
            onChange={(e) => setCheckInNotes(e.target.value)}
            placeholder="Add any notes about the check-in..."
            rows={3}
          />
        </div>

        <div className="flex gap-3 pt-4">
          <Button
            variant="outline"
            onClick={() => setMode('details')}
            className="flex-1"
          >
            Back
          </Button>
          <Button
            onClick={handleCheckIn}
            disabled={loading}
            className="flex-1 bg-green-600 hover:bg-green-700"
          >
            {loading ? 'Processing...' : 'Confirm Check-In'}
          </Button>
        </div>
      </div>
    )
  }

  const renderCheckOutForm = () => {
    if (!bookingDetails) return null

    const additionalAmount = additionalCharges ? parseFloat(additionalCharges) : 0
    const discountAmount = discounts ? parseFloat(discounts) : 0
    const finalAmount = (bookingDetails.totalPrice / 100) + additionalAmount - discountAmount

    return (
      <div className="space-y-4">
        <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
          <h4 className="font-semibold text-blue-900 mb-2 flex items-center gap-2">
            <XCircle className="h-5 w-5" />
            Check-Out Process
          </h4>
          <p className="text-sm text-blue-700">
            Guest: <span className="font-semibold">{bookingDetails.user.name}</span>
          </p>
          <p className="text-sm text-blue-700">
            Room: <span className="font-semibold">{bookingDetails.roomType.name}</span>
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="additionalCharges">Additional Charges ($)</Label>
            <Input
              id="additionalCharges"
              type="number"
              step="0.01"
              value={additionalCharges}
              onChange={(e) => setAdditionalCharges(e.target.value)}
              placeholder="0.00"
            />
          </div>
          <div>
            <Label htmlFor="discounts">Discounts ($)</Label>
            <Input
              id="discounts"
              type="number"
              step="0.01"
              value={discounts}
              onChange={(e) => setDiscounts(e.target.value)}
              placeholder="0.00"
            />
          </div>
        </div>

        <div className="bg-gray-100 rounded-lg p-4">
          <div className="flex justify-between mb-2">
            <span className="text-gray-600">Original Amount:</span>
            <span className="font-medium">{formatCurrency(bookingDetails.totalPrice)}</span>
          </div>
          {additionalAmount > 0 && (
            <div className="flex justify-between mb-2 text-sm">
              <span className="text-gray-600">+ Additional Charges:</span>
              <span className="font-medium text-green-600">+${additionalAmount.toFixed(2)}</span>
            </div>
          )}
          {discountAmount > 0 && (
            <div className="flex justify-between mb-2 text-sm">
              <span className="text-gray-600">- Discounts:</span>
              <span className="font-medium text-red-600">-${discountAmount.toFixed(2)}</span>
            </div>
          )}
          <div className="flex justify-between pt-2 border-t border-gray-300">
            <span className="font-semibold">Final Amount:</span>
            <span className="font-semibold text-lg">${finalAmount.toFixed(2)}</span>
          </div>
        </div>

        {(bookingDetails.paymentSummary.totalPaid / 100) < finalAmount && (
          <div className="bg-yellow-50 rounded-lg p-3 border border-yellow-200">
            <p className="text-sm text-yellow-800 flex items-center gap-2">
              <AlertCircle className="h-4 w-4" />
              Payment pending: ${(finalAmount - (bookingDetails.paymentSummary.totalPaid / 100)).toFixed(2)}
            </p>
          </div>
        )}

        <div>
          <Label htmlFor="checkOutNotes">Notes (Optional)</Label>
          <Textarea
            id="checkOutNotes"
            value={checkOutNotes}
            onChange={(e) => setCheckOutNotes(e.target.value)}
            placeholder="Add any notes about the check-out..."
            rows={3}
          />
        </div>

        <div className="flex gap-3 pt-4">
          <Button
            variant="outline"
            onClick={() => setMode('details')}
            className="flex-1"
          >
            Back
          </Button>
          <Button
            onClick={handleCheckOut}
            disabled={loading}
            className="flex-1 bg-blue-600 hover:bg-blue-700"
          >
            {loading ? 'Processing...' : 'Confirm Check-Out'}
          </Button>
        </div>
      </div>
    )
  }

  const renderPaymentForm = () => {
    if (!bookingDetails) return null

    return (
      <div className="space-y-4">
        <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
          <h4 className="font-semibold text-purple-900 mb-2 flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Record Offline Payment
          </h4>
          <div className="text-sm text-purple-700 space-y-1">
            <p>Total Amount: <span className="font-semibold">{formatCurrency(bookingDetails.paymentSummary.totalAmount)}</span></p>
            <p>Already Paid: <span className="font-semibold">{formatCurrency(bookingDetails.paymentSummary.totalPaid)}</span></p>
            <p>Remaining: <span className="font-semibold text-lg">{formatCurrency(bookingDetails.paymentSummary.remaining)}</span></p>
          </div>
        </div>

        <div>
          <Label htmlFor="paymentAmount">Payment Amount ($) *</Label>
          <Input
            id="paymentAmount"
            type="number"
            step="0.01"
            value={paymentAmount}
            onChange={(e) => setPaymentAmount(e.target.value)}
            placeholder="0.00"
            max={(bookingDetails.paymentSummary.remaining / 100).toString()}
          />
          <p className="text-xs text-gray-500 mt-1">
            Maximum: {formatCurrency(bookingDetails.paymentSummary.remaining)}
          </p>
        </div>

        <div>
          <Label htmlFor="paymentMethod">Payment Method *</Label>
          <select
            id="paymentMethod"
            value={paymentMethod}
            onChange={(e) => setPaymentMethod(e.target.value as any)}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <option value="CASH">Cash</option>
            <option value="CARD">Card (POS)</option>
            <option value="BANK_TRANSFER">Bank Transfer</option>
            <option value="CHEQUE">Cheque</option>
            <option value="OTHER">Other</option>
          </select>
        </div>

        <div>
          <Label htmlFor="referenceNumber">Reference Number</Label>
          <Input
            id="referenceNumber"
            value={referenceNumber}
            onChange={(e) => setReferenceNumber(e.target.value)}
            placeholder="Transaction ID, Receipt #, etc."
          />
        </div>

        <div>
          <Label htmlFor="receivedBy">Received By *</Label>
          <Input
            id="receivedBy"
            value={receivedBy}
            onChange={(e) => setReceivedBy(e.target.value)}
            placeholder="Staff member name"
          />
        </div>

        <div>
          <Label htmlFor="paymentNotes">Notes (Optional)</Label>
          <Textarea
            id="paymentNotes"
            value={paymentNotes}
            onChange={(e) => setPaymentNotes(e.target.value)}
            placeholder="Additional payment details..."
            rows={2}
          />
        </div>

        <div className="flex gap-3 pt-4">
          <Button
            variant="outline"
            onClick={() => setMode('details')}
            className="flex-1"
          >
            Back
          </Button>
          <Button
            onClick={handleRecordPayment}
            disabled={loading}
            className="flex-1 bg-purple-600 hover:bg-purple-700"
          >
            {loading ? 'Recording...' : 'Record Payment'}
          </Button>
        </div>
      </div>
    )
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">
            {mode === 'check-in' && 'Check-In Guest'}
            {mode === 'check-out' && 'Check-Out Guest'}
            {mode === 'payment' && 'Record Payment'}
            {mode === 'details' && 'Booking Details'}
          </DialogTitle>
          <DialogDescription>
            {mode === 'check-in' && 'Process guest check-in and assign room'}
            {mode === 'check-out' && 'Process guest check-out and finalize charges'}
            {mode === 'payment' && 'Record offline payment for this booking'}
            {mode === 'details' && 'View and manage booking information'}
          </DialogDescription>
        </DialogHeader>

        {renderContent()}
      </DialogContent>
    </Dialog>
  )
}
