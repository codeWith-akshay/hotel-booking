/**
 * Offline Booking Modal
 * For admin/superAdmin to create walk-in customer bookings without customer login
 * Handles customer registration, booking creation, and optional immediate check-in
 */

'use client'

import React, { useState, useEffect } from 'react'
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
  createOfflineBooking,
  quickCheckIn,
  getAvailableRoomTypes,
  validateCustomerPhone,
} from '@/actions/admin/offline-booking.action'
import {
  User,
  Hotel,
  Calendar,
  DollarSign,
  CreditCard,
  CheckCircle,
  AlertCircle,
  Phone,
  Mail,
  MapPin,
  FileText,
  UserPlus,
  LogIn,
} from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import { format } from 'date-fns'
import { toast } from 'sonner'
import { VipStatus } from '@prisma/client'

// ==========================================
// TYPES
// ==========================================

interface OfflineBookingModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess?: () => void
  quickCheckInMode?: boolean // If true, auto check-in after booking
}

interface RoomTypeOption {
  id: string
  name: string
  description: string
  pricePerNight: number
  totalRooms: number
  totalPrice: number
  nights: number
}

// ==========================================
// MAIN COMPONENT
// ==========================================

export default function OfflineBookingModal({
  isOpen,
  onClose,
  onSuccess,
  quickCheckInMode = false,
}: OfflineBookingModalProps) {
  // UI State
  const [step, setStep] = useState<'customer' | 'booking' | 'payment' | 'review'>(
    'customer'
  )
  const [loading, setLoading] = useState(false)
  const [loadingRooms, setLoadingRooms] = useState(false)

  // Customer Data
  const [customerPhone, setCustomerPhone] = useState('')
  const [customerName, setCustomerName] = useState('')
  const [customerEmail, setCustomerEmail] = useState('')
  const [customerAddress, setCustomerAddress] = useState('')
  const [idType, setIdType] = useState('')
  const [idNumber, setIdNumber] = useState('')
  const [vipStatus, setVipStatus] = useState<VipStatus>(VipStatus.NONE)
  const [ircaMembershipId, setIrcaMembershipId] = useState('')
  const [existingCustomer, setExistingCustomer] = useState(false)

  // Booking Data
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [roomsBooked, setRoomsBooked] = useState('1')
  const [selectedRoomType, setSelectedRoomType] = useState('')
  const [availableRooms, setAvailableRooms] = useState<RoomTypeOption[]>([])
  const [specialRequests, setSpecialRequests] = useState('')
  const [bookingNotes, setBookingNotes] = useState('')

  // Payment Data
  const [paymentAmount, setPaymentAmount] = useState('')
  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'CARD' | 'BANK_TRANSFER' | 'CHEQUE' | 'OTHER'>('CASH')
  const [referenceNumber, setReferenceNumber] = useState('')
  const [paymentNotes, setPaymentNotes] = useState('')

  // Calculate total price
  const selectedRoom = availableRooms.find(r => r.id === selectedRoomType)
  const totalBookingPrice = selectedRoom?.totalPrice || 0

  // Reset form when modal opens/closes
  useEffect(() => {
    if (!isOpen) {
      resetForm()
    }
  }, [isOpen])

  const resetForm = () => {
    setStep('customer')
    setCustomerPhone('')
    setCustomerName('')
    setCustomerEmail('')
    setCustomerAddress('')
    setIdType('')
    setIdNumber('')
    setVipStatus(VipStatus.NONE)
    setIrcaMembershipId('')
    setExistingCustomer(false)
    setStartDate('')
    setEndDate('')
    setRoomsBooked('1')
    setSelectedRoomType('')
    setAvailableRooms([])
    setSpecialRequests('')
    setBookingNotes('')
    setPaymentAmount('')
    setPaymentMethod('CASH')
    setReferenceNumber('')
    setPaymentNotes('')
  }

  // Validate customer phone and auto-fill if exists
  const handlePhoneValidation = async () => {
    if (customerPhone.length < 10) {
      toast.error('Please enter a valid phone number')
      return
    }

    setLoading(true)
    try {
      const result = await validateCustomerPhone(customerPhone)
      
      if (result.success && result.data?.exists && result.data.customer) {
        const customer = result.data.customer
        setCustomerName(customer.name)
        setCustomerEmail(customer.email || '')
        setCustomerAddress(customer.address || '')
        setVipStatus(customer.vipStatus)
        setIrcaMembershipId(customer.ircaMembershipId || '')
        setExistingCustomer(true)
        toast.success('Existing customer found - details loaded')
      } else {
        setExistingCustomer(false)
        toast.info('New customer - please fill in details')
      }
    } catch (error) {
      console.error('Phone validation error:', error)
      toast.error('Failed to validate phone number')
    } finally {
      setLoading(false)
    }
  }

  // Search for available rooms
  const searchAvailableRooms = async () => {
    if (!startDate || !endDate) {
      toast.error('Please select check-in and check-out dates')
      return
    }

    const rooms = parseInt(roomsBooked)
    if (isNaN(rooms) || rooms < 1) {
      toast.error('Please enter a valid number of rooms')
      return
    }

    setLoadingRooms(true)
    try {
      const result = await getAvailableRoomTypes(startDate, endDate, rooms)
      
      if (result.success && result.data) {
        setAvailableRooms(result.data)
        
        if (result.data.length === 0) {
          toast.warning('No rooms available for selected dates')
        } else {
          toast.success(`Found ${result.data.length} available room type(s)`)
        }
      } else {
        toast.error(result.error || 'Failed to search rooms')
        setAvailableRooms([])
      }
    } catch (error) {
      console.error('Room search error:', error)
      toast.error('Failed to search available rooms')
    } finally {
      setLoadingRooms(false)
    }
  }

  // Handle form submission
  const handleSubmit = async () => {
    // Validate customer info
    if (!customerPhone || !customerName) {
      toast.error('Customer phone and name are required')
      return
    }

    // Validate booking info
    if (!startDate || !endDate || !selectedRoomType) {
      toast.error('Please complete booking details')
      return
    }

    const rooms = parseInt(roomsBooked)
    if (isNaN(rooms) || rooms < 1) {
      toast.error('Please enter a valid number of rooms')
      return
    }

    // Validate payment if provided
    const payment = paymentAmount ? parseFloat(paymentAmount) : 0
    if (payment < 0) {
      toast.error('Invalid payment amount')
      return
    }

    setLoading(true)
    try {
      const payload = {
        customer: {
          name: customerName,
          phone: customerPhone,
          email: customerEmail || undefined,
          address: customerAddress || undefined,
          idType: idType || undefined,
          idNumber: idNumber || undefined,
          vipStatus,
          ircaMembershipId: ircaMembershipId || undefined,
        },
        roomTypeId: selectedRoomType,
        startDate,
        endDate,
        roomsBooked: rooms,
        paymentAmount: payment > 0 ? Math.round(payment * 100) : undefined, // Convert to cents
        paymentMethod: payment > 0 ? paymentMethod : undefined,
        referenceNumber: referenceNumber || undefined,
        paymentNotes: paymentNotes || undefined,
        notes: bookingNotes || undefined,
        specialRequests: specialRequests || undefined,
        autoCheckIn: quickCheckInMode,
      }

      const result = quickCheckInMode 
        ? await quickCheckIn(payload)
        : await createOfflineBooking(payload)

      if (result.success && result.data) {
        toast.success(result.message || 'Booking created successfully')
        onSuccess?.()
        onClose()
      } else {
        toast.error(result.error || 'Failed to create booking')
      }
    } catch (error) {
      console.error('Booking submission error:', error)
      toast.error('An error occurred while creating booking')
    } finally {
      setLoading(false)
    }
  }

  // Step navigation
  const goToNextStep = () => {
    if (step === 'customer') {
      if (!customerPhone || !customerName) {
        toast.error('Please complete customer information')
        return
      }
      setStep('booking')
    } else if (step === 'booking') {
      if (!startDate || !endDate) {
        toast.error('Please select check-in and check-out dates')
        return
      }
      if (!selectedRoomType) {
        toast.error('Please search for rooms and select a room type')
        return
      }
      setStep('payment')
    } else if (step === 'payment') {
      setStep('review')
    }
  }

  const goToPreviousStep = () => {
    if (step === 'review') setStep('payment')
    else if (step === 'payment') setStep('booking')
    else if (step === 'booking') setStep('customer')
  }

  // ==========================================
  // RENDER STEP CONTENT
  // ==========================================

  const renderCustomerStep = () => (
    <div className="space-y-4">
      <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
        <div className="flex items-center gap-2 mb-2">
          <UserPlus className="h-5 w-5 text-blue-600" />
          <h3 className="font-semibold text-blue-900">Customer Information</h3>
        </div>
        <p className="text-sm text-blue-700">
          {existingCustomer 
            ? 'Existing customer found - details loaded automatically'
            : 'Enter customer details to create new or find existing customer'}
        </p>
      </div>

      <div className="space-y-4">
        {/* Phone Number */}
        <div>
          <Label htmlFor="phone" className="flex items-center gap-2">
            <Phone className="h-4 w-4" />
            Phone Number *
          </Label>
          <div className="flex gap-2">
            <Input
              id="phone"
              type="tel"
              value={customerPhone}
              onChange={(e) => setCustomerPhone(e.target.value)}
              placeholder="Enter phone number"
              className="flex-1"
              maxLength={15}
            />
            <Button
              onClick={handlePhoneValidation}
              disabled={loading || customerPhone.length < 10}
              variant="outline"
            >
              {loading ? 'Checking...' : 'Verify'}
            </Button>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Enter phone to check if customer already exists
          </p>
        </div>

        {/* Name */}
        <div>
          <Label htmlFor="name" className="flex items-center gap-2">
            <User className="h-4 w-4" />
            Full Name *
          </Label>
          <Input
            id="name"
            value={customerName}
            onChange={(e) => setCustomerName(e.target.value)}
            placeholder="Enter full name"
          />
        </div>

        {/* Email */}
        <div>
          <Label htmlFor="email" className="flex items-center gap-2">
            <Mail className="h-4 w-4" />
            Email (Optional)
          </Label>
          <Input
            id="email"
            type="email"
            value={customerEmail}
            onChange={(e) => setCustomerEmail(e.target.value)}
            placeholder="customer@example.com"
          />
        </div>

        {/* Address */}
        <div>
          <Label htmlFor="address" className="flex items-center gap-2">
            <MapPin className="h-4 w-4" />
            Address (Optional)
          </Label>
          <Textarea
            id="address"
            value={customerAddress}
            onChange={(e) => setCustomerAddress(e.target.value)}
            placeholder="Enter customer address"
            rows={2}
          />
        </div>

        {/* ID Type & Number */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="idType">ID Type (Optional)</Label>
            <select
              id="idType"
              value={idType}
              onChange={(e) => setIdType(e.target.value)}
              className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
            >
              <option value="">Select ID type</option>
              <option value="Passport">Passport</option>
              <option value="Driver License">Driver License</option>
              <option value="Aadhar">Aadhar Card</option>
              <option value="PAN">PAN Card</option>
              <option value="Other">Other</option>
            </select>
          </div>
          <div>
            <Label htmlFor="idNumber">ID Number</Label>
            <Input
              id="idNumber"
              value={idNumber}
              onChange={(e) => setIdNumber(e.target.value)}
              placeholder="Enter ID number"
            />
          </div>
        </div>

        {/* VIP Status */}
        <div>
          <Label htmlFor="vipStatus">VIP Status</Label>
          <select
            id="vipStatus"
            value={vipStatus}
            onChange={(e) => setVipStatus(e.target.value as VipStatus)}
            className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
          >
            <option value={VipStatus.NONE}>Regular Customer</option>
            <option value={VipStatus.VIP}>VIP</option>
            <option value={VipStatus.STAFF}>Staff</option>
          </select>
        </div>

        {/* IRCA Membership */}
        <div>
          <Label htmlFor="membership">IRCA Membership ID (Optional)</Label>
          <Input
            id="membership"
            value={ircaMembershipId}
            onChange={(e) => setIrcaMembershipId(e.target.value)}
            placeholder="Enter membership ID"
          />
        </div>
      </div>
    </div>
  )

  const renderBookingStep = () => (
    <div className="space-y-4">
      <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
        <div className="flex items-center gap-2 mb-2">
          <Hotel className="h-5 w-5 text-purple-600" />
          <h3 className="font-semibold text-purple-900">Booking Details</h3>
        </div>
        <p className="text-sm text-purple-700">
          Select check-in/out dates and search for available rooms
        </p>
      </div>

      <div className="space-y-4">
        {/* Dates */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="startDate" className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Check-In Date *
            </Label>
            <Input
              id="startDate"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              min={new Date().toISOString().split('T')[0]}
            />
          </div>
          <div>
            <Label htmlFor="endDate" className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Check-Out Date *
            </Label>
            <Input
              id="endDate"
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              min={startDate || new Date().toISOString().split('T')[0]}
            />
          </div>
        </div>

        {/* Number of Rooms */}
        <div>
          <Label htmlFor="roomsBooked">Number of Rooms *</Label>
          <Input
            id="roomsBooked"
            type="number"
            min="1"
            value={roomsBooked}
            onChange={(e) => setRoomsBooked(e.target.value)}
            placeholder="1"
          />
        </div>

        {/* Search Button */}
        <Button
          onClick={searchAvailableRooms}
          disabled={loadingRooms || !startDate || !endDate}
          className="w-full"
        >
          {loadingRooms ? 'Searching...' : 'Search Available Rooms'}
        </Button>

        {/* No rooms message */}
        {!loadingRooms && availableRooms.length === 0 && startDate && endDate && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-center">
            <AlertCircle className="h-6 w-6 text-yellow-600 mx-auto mb-2" />
            <p className="text-sm text-yellow-800">
              No rooms available for the selected dates. Please try different dates or run the database seed script.
            </p>
          </div>
        )}

        {/* Available Rooms */}
        {availableRooms.length > 0 && (
          <div className="space-y-2">
            <Label>Select Room Type *</Label>
            {!selectedRoomType && (
              <p className="text-sm text-gray-500">Click on a room to select it</p>
            )}
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {availableRooms.map((room) => (
                <div
                  key={room.id}
                  onClick={() => setSelectedRoomType(room.id)}
                  className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                    selectedRoomType === room.id
                      ? 'border-blue-500 bg-blue-50 shadow-md'
                      : 'border-gray-200 hover:border-blue-300 hover:shadow'
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-semibold">{room.name}</h4>
                        {selectedRoomType === room.id && (
                          <CheckCircle className="h-5 w-5 text-blue-600" />
                        )}
                      </div>
                      <p className="text-sm text-gray-600 line-clamp-2">{room.description}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        {formatCurrency(room.pricePerNight)} × {room.nights} night(s) × {roomsBooked} room(s)
                      </p>
                    </div>
                    <div className="text-right ml-4">
                      <p className="font-bold text-lg text-blue-600">
                        {formatCurrency(room.totalPrice)}
                      </p>
                      <Badge variant="outline" className="mt-1">
                        {room.totalRooms} available
                      </Badge>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Special Requests */}
        <div>
          <Label htmlFor="specialRequests">Special Requests (Optional)</Label>
          <Textarea
            id="specialRequests"
            value={specialRequests}
            onChange={(e) => setSpecialRequests(e.target.value)}
            placeholder="e.g., Early check-in, extra bed, high floor preference..."
            rows={2}
          />
        </div>

        {/* Booking Notes */}
        <div>
          <Label htmlFor="bookingNotes">Admin Notes (Optional)</Label>
          <Textarea
            id="bookingNotes"
            value={bookingNotes}
            onChange={(e) => setBookingNotes(e.target.value)}
            placeholder="Internal notes for this booking..."
            rows={2}
          />
        </div>

        {/* Booking Summary Status */}
        {selectedRoomType && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-3">
            <div className="flex items-center gap-2 text-green-800">
              <CheckCircle className="h-5 w-5" />
              <span className="font-medium">Room selected! Click "Next" to proceed to payment.</span>
            </div>
          </div>
        )}
      </div>
    </div>
  )

  const renderPaymentStep = () => (
    <div className="space-y-4">
      <div className="bg-green-50 rounded-lg p-4 border border-green-200">
        <div className="flex items-center gap-2 mb-2">
          <DollarSign className="h-5 w-5 text-green-600" />
          <h3 className="font-semibold text-green-900">Payment Information</h3>
        </div>
        <p className="text-sm text-green-700">
          Record payment received or skip to collect payment later
        </p>
      </div>

      {/* Total Amount Display */}
      <div className="bg-gray-50 rounded-lg p-4 border">
        <div className="flex justify-between items-center">
          <span className="text-gray-600">Total Booking Amount:</span>
          <span className="font-bold text-xl">{formatCurrency(totalBookingPrice)}</span>
        </div>
      </div>

      <div className="space-y-4">
        {/* Payment Amount */}
        <div>
          <Label htmlFor="paymentAmount">Payment Amount (Optional)</Label>
          <Input
            id="paymentAmount"
            type="number"
            step="0.01"
            min="0"
            max={totalBookingPrice / 100}
            value={paymentAmount}
            onChange={(e) => setPaymentAmount(e.target.value)}
            placeholder="0.00"
          />
          <p className="text-xs text-gray-500 mt-1">
            Leave empty if payment will be collected later
          </p>
        </div>

        {/* Payment Method */}
        {paymentAmount && parseFloat(paymentAmount) > 0 && (
          <>
            <div>
              <Label htmlFor="paymentMethod" className="flex items-center gap-2">
                <CreditCard className="h-4 w-4" />
                Payment Method *
              </Label>
              <select
                id="paymentMethod"
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value as any)}
                className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
              >
                <option value="CASH">💵 Cash</option>
                <option value="CARD">💳 Card (POS)</option>
                <option value="BANK_TRANSFER">🏦 Bank Transfer</option>
                <option value="CHEQUE">📄 Cheque</option>
                <option value="OTHER">🔄 Other</option>
              </select>
            </div>

            {/* Reference Number */}
            <div>
              <Label htmlFor="referenceNumber">Reference/Receipt Number (Optional)</Label>
              <Input
                id="referenceNumber"
                value={referenceNumber}
                onChange={(e) => setReferenceNumber(e.target.value)}
                placeholder="e.g., RCPT-2024-001"
              />
            </div>

            {/* Payment Notes */}
            <div>
              <Label htmlFor="paymentNotes">Payment Notes (Optional)</Label>
              <Textarea
                id="paymentNotes"
                value={paymentNotes}
                onChange={(e) => setPaymentNotes(e.target.value)}
                placeholder="Any additional payment details..."
                rows={2}
              />
            </div>

            {/* Payment Status Preview */}
            <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
              <p className="text-sm text-blue-700">
                {parseFloat(paymentAmount) >= totalBookingPrice / 100 ? (
                  <span className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4" />
                    Booking will be fully paid and confirmed
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <AlertCircle className="h-4 w-4" />
                    Partial payment - Remaining: {formatCurrency(totalBookingPrice - (parseFloat(paymentAmount) * 100))}
                  </span>
                )}
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  )

  const renderReviewStep = () => (
    <div className="space-y-4">
      <div className="bg-yellow-50 rounded-lg p-4 border border-yellow-200">
        <div className="flex items-center gap-2 mb-2">
          <FileText className="h-5 w-5 text-yellow-600" />
          <h3 className="font-semibold text-yellow-900">Review & Confirm</h3>
        </div>
        <p className="text-sm text-yellow-700">
          Please review all details before creating the booking
        </p>
      </div>

      {/* Customer Summary */}
      <div className="border rounded-lg p-4">
        <h4 className="font-semibold mb-2 flex items-center gap-2">
          <User className="h-4 w-4" />
          Customer Details
        </h4>
        <div className="space-y-1 text-sm">
          <p><strong>Name:</strong> {customerName}</p>
          <p><strong>Phone:</strong> {customerPhone}</p>
          {customerEmail && <p><strong>Email:</strong> {customerEmail}</p>}
          {idType && <p><strong>ID:</strong> {idType} - {idNumber}</p>}
          <Badge>{vipStatus}</Badge>
        </div>
      </div>

      {/* Booking Summary */}
      <div className="border rounded-lg p-4">
        <h4 className="font-semibold mb-2 flex items-center gap-2">
          <Hotel className="h-4 w-4" />
          Booking Details
        </h4>
        <div className="space-y-1 text-sm">
          <p><strong>Room Type:</strong> {selectedRoom?.name}</p>
          <p><strong>Rooms:</strong> {roomsBooked}</p>
          <p><strong>Check-In:</strong> {startDate}</p>
          <p><strong>Check-Out:</strong> {endDate}</p>
          <p><strong>Nights:</strong> {selectedRoom?.nights}</p>
          <p className="text-lg font-bold pt-2">
            Total: {formatCurrency(totalBookingPrice)}
          </p>
        </div>
      </div>

      {/* Payment Summary */}
      {paymentAmount && parseFloat(paymentAmount) > 0 && (
        <div className="border rounded-lg p-4">
          <h4 className="font-semibold mb-2 flex items-center gap-2">
            <CreditCard className="h-4 w-4" />
            Payment Details
          </h4>
          <div className="space-y-1 text-sm">
            <p><strong>Amount:</strong> {formatCurrency(parseFloat(paymentAmount) * 100)}</p>
            <p><strong>Method:</strong> {paymentMethod}</p>
            {referenceNumber && <p><strong>Reference:</strong> {referenceNumber}</p>}
            <Badge className={
              parseFloat(paymentAmount) >= totalBookingPrice / 100
                ? 'bg-green-100 text-green-800'
                : 'bg-yellow-100 text-yellow-800'
            }>
              {parseFloat(paymentAmount) >= totalBookingPrice / 100 ? 'Fully Paid' : 'Partial Payment'}
            </Badge>
          </div>
        </div>
      )}

      {/* Quick Check-In Warning */}
      {quickCheckInMode && (
        <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
          <div className="flex items-center gap-2">
            <LogIn className="h-5 w-5 text-blue-600" />
            <p className="text-sm text-blue-700 font-medium">
              Customer will be automatically checked in after booking creation
            </p>
          </div>
        </div>
      )}
    </div>
  )

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {quickCheckInMode ? (
              <>
                <LogIn className="h-5 w-5" />
                Quick Check-In (Walk-in Customer)
              </>
            ) : (
              <>
                <UserPlus className="h-5 w-5" />
                Create Offline Booking
              </>
            )}
          </DialogTitle>
          <DialogDescription>
            {quickCheckInMode
              ? 'Register walk-in customer and check them in immediately'
              : 'Create booking for walk-in customer without requiring online registration'}
          </DialogDescription>
        </DialogHeader>

        {/* Step Indicator */}
        <div className="flex justify-between mb-6">
          {['customer', 'booking', 'payment', 'review'].map((s, i) => (
            <div
              key={s}
              className={`flex-1 text-center ${
                step === s
                  ? 'text-blue-600 font-semibold'
                  : i < ['customer', 'booking', 'payment', 'review'].indexOf(step)
                  ? 'text-green-600'
                  : 'text-gray-400'
              }`}
            >
              <div className={`w-8 h-8 mx-auto rounded-full flex items-center justify-center border-2 ${
                step === s
                  ? 'border-blue-600 bg-blue-50'
                  : i < ['customer', 'booking', 'payment', 'review'].indexOf(step)
                  ? 'border-green-600 bg-green-50'
                  : 'border-gray-300'
              }`}>
                {i < ['customer', 'booking', 'payment', 'review'].indexOf(step) ? (
                  <CheckCircle className="h-5 w-5" />
                ) : (
                  i + 1
                )}
              </div>
              <p className="text-xs mt-1 capitalize">{s}</p>
            </div>
          ))}
        </div>

        {/* Step Content */}
        <div className="min-h-[400px]">
          {step === 'customer' && renderCustomerStep()}
          {step === 'booking' && renderBookingStep()}
          {step === 'payment' && renderPaymentStep()}
          {step === 'review' && renderReviewStep()}
        </div>

        {/* Footer Buttons */}
        <DialogFooter className="flex justify-between">
          <div className="flex gap-2">
            {step !== 'customer' && (
              <Button variant="outline" onClick={goToPreviousStep} disabled={loading}>
                Previous
              </Button>
            )}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose} disabled={loading}>
              Cancel
            </Button>
            {step !== 'review' ? (
              <Button onClick={goToNextStep} disabled={loading}>
                Next
              </Button>
            ) : (
              <Button onClick={handleSubmit} disabled={loading}>
                {loading ? 'Creating...' : quickCheckInMode ? 'Check In Now' : 'Create Booking'}
              </Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
