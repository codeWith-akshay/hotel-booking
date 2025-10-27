// ==========================================
// BOOKING SUMMARY STEP - Final Review & Confirmation
// ==========================================
// Displays complete booking summary with pricing breakdown

'use client'

import { useState } from 'react'
import { Calendar, Users, Bed, CreditCard, CheckCircle, AlertTriangle, MapPin, Phone, Mail } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import { PaymentButton } from '@/components/booking/PaymentButton'
import { useBookingStore } from '@/store/bookingUIStore'
import { format } from 'date-fns'
import { cn } from '@/lib/utils'

// ==========================================
// BOOKING SUMMARY STEP COMPONENT
// ==========================================

export function BookingSummaryStep() {
  const { getBookingSummary } = useBookingStore()
  const summary = getBookingSummary()
  
  // Form state for booking confirmation
  const [contactInfo, setContactInfo] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    specialRequests: '',
  })
  
  const [agreements, setAgreements] = useState({
    terms: false,
    privacy: false,
    marketing: false,
  })
  
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [bookingId, setBookingId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  // ==========================================
  // FORM HANDLERS
  // ==========================================

  const handleContactChange = (field: string, value: string) => {
    setContactInfo(prev => ({ ...prev, [field]: value }))
  }

  const handleAgreementChange = (field: string, checked: boolean) => {
    setAgreements(prev => ({ ...prev, [field]: checked }))
  }

  const isFormValid = () => {
    return (
      contactInfo.firstName.trim() &&
      contactInfo.lastName.trim() &&
      contactInfo.email.trim() &&
      contactInfo.phone.trim() &&
      agreements.terms &&
      agreements.privacy
    )
  }

  const handleConfirmBooking = async () => {
    if (!isFormValid()) return
    
    setIsSubmitting(true)
    setError(null)
    
    try {
      console.log('🔍 Sending booking request...')
      console.log('📊 Booking summary data:', {
        dateRange: summary.dateRange,
        guestInfo: summary.guestInfo,
        roomSelection: summary.roomSelection,
        pricing: summary.pricing,
      })

      const bookingData = {
        startDate: summary.dateRange.startDate,
        endDate: summary.dateRange.endDate,
        roomTypeId: summary.roomSelection[0]?.roomTypeId, // Using first room (can be modified for multiple rooms)
        numberOfRooms: summary.roomSelection.reduce((acc: number, room) => acc + room.quantity, 0),
        adults: summary.guestInfo.adults,
        children: summary.guestInfo.children,
        guestType: summary.guestInfo.guestType,
        firstName: contactInfo.firstName,
        lastName: contactInfo.lastName,
        email: contactInfo.email,
        phone: contactInfo.phone,
        specialRequests: contactInfo.specialRequests,
      }

      console.log('📤 Sending booking data to API:', bookingData)
      
      // Create booking in database
      const response = await fetch('/api/bookings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // Important: Include cookies in the request
        body: JSON.stringify(bookingData),
      })

      console.log('🔍 Response status:', response.status)

      if (!response.ok) {
        const errorData = await response.json()
        
        if (response.status === 401) {
          throw new Error('Authentication failed. Your session may have expired. Please login again.')
        }
        
        if (response.status === 404) {
          if (errorData.error?.includes('Room type not found')) {
            // Clear cached booking data - the room type IDs are stale
            console.log('🧹 Clearing stale booking data from cache...')
            localStorage.removeItem('booking-store')
            sessionStorage.removeItem('booking-store')
            
            // Show available room types to help debug
            if (errorData.availableRoomTypes) {
              console.log('📦 Available room types:', errorData.availableRoomTypes)
            }
            
            throw new Error('The selected room is no longer available. Your booking data has been cleared. Please refresh the page to start a fresh booking.')
          }
        }
        
        throw new Error(errorData.error || errorData.details || 'Failed to create booking')
      }

      const data = await response.json()
      console.log('✅ Booking created:', data)
      setBookingId(data.booking.bookingId)
      
      // Booking created successfully - PaymentButton will now be shown
    } catch (err) {
      console.error('❌ Booking failed:', err)
      const errorMessage = err instanceof Error ? err.message : 'Booking failed. Please try again.'
      setError(errorMessage)
      
      // If unauthorized, redirect to login after a delay
      if (err instanceof Error && err.message.includes('Authentication')) {
        setTimeout(() => {
          window.location.href = '/login?redirect=/booking'
        }, 2000)
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-8">
      
      {/* ==========================================
          AUTHENTICATION WARNING
          ========================================== */}
      <Card className="p-4 bg-blue-50 border-blue-200">
        <div className="flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
          <div>
            <h3 className="font-semibold text-blue-900 mb-1">Login Required</h3>
            <p className="text-sm text-blue-700">
              You must be logged in to complete your booking. If you're not logged in, you'll be redirected to the login page.
            </p>
            <a href="/login?redirect=/booking" className="text-sm text-blue-600 hover:text-blue-800 underline mt-2 inline-block">
              Login Now →
            </a>
          </div>
        </div>
      </Card>
      
      {/* ==========================================
          STEP HEADER
          ========================================== */}
      <div className="text-center">
        <h2 className="text-2xl font-semibold text-gray-900 mb-2">
          Review Your Booking
        </h2>
        <p className="text-gray-600">
          Please review your booking details and provide contact information to complete your reservation.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* ==========================================
            LEFT COLUMN - BOOKING DETAILS
            ========================================== */}
        <div className="space-y-6">
          
          {/* Stay Details */}
          <Card className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <Calendar className="h-5 w-5 text-blue-600" />
              <h3 className="text-lg font-semibold text-gray-900">Stay Details</h3>
            </div>
            
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Check-in:</span>
                <span className="font-medium">
                  {format(summary.dateRange.startDate, 'EEEE, MMMM d, yyyy')}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Check-out:</span>
                <span className="font-medium">
                  {format(summary.dateRange.endDate, 'EEEE, MMMM d, yyyy')}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Duration:</span>
                <span className="font-medium">
                  {summary.dateRange.nights} night{summary.dateRange.nights !== 1 ? 's' : ''}
                </span>
              </div>
            </div>
          </Card>

          {/* Guest Information */}
          <Card className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <Users className="h-5 w-5 text-blue-600" />
              <h3 className="text-lg font-semibold text-gray-900">Guests</h3>
            </div>
            
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Adults:</span>
                <span className="font-medium">{summary.guestInfo.adults}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Children:</span>
                <span className="font-medium">{summary.guestInfo.children}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Guest Type:</span>
                <span className="font-medium">
                  {summary.guestInfo.guestType.charAt(0) + summary.guestInfo.guestType.slice(1).toLowerCase()}
                </span>
              </div>
              <div className="flex justify-between font-semibold">
                <span>Total Guests:</span>
                <span>{summary.guestInfo.totalGuests}</span>
              </div>
            </div>
          </Card>

          {/* Room Selection */}
          <Card className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <Bed className="h-5 w-5 text-blue-600" />
              <h3 className="text-lg font-semibold text-gray-900">Selected Rooms</h3>
            </div>
            
            <div className="space-y-4">
              {summary.roomSelection.map((room, index) => (
                <div
                  key={room.roomTypeId}
                  className="border-b border-gray-200 pb-4 last:border-b-0 last:pb-0"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium text-gray-900">{room.roomTypeName}</p>
                      <p className="text-sm text-gray-600">
                        {room.quantity} room{room.quantity !== 1 ? 's' : ''} × ${room.pricePerNight}/night
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">${room.subtotal.toLocaleString()}</p>
                      <p className="text-xs text-gray-500">
                        for {summary.dateRange.nights} nights
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Hotel Information */}
          <Card className="p-6 bg-gray-50">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Hotel Information</h3>
            
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <MapPin className="h-4 w-4 text-gray-600" />
                <span className="text-sm text-gray-700">
                  123 Luxury Avenue, Downtown, City 12345
                </span>
              </div>
              <div className="flex items-center gap-3">
                <Phone className="h-4 w-4 text-gray-600" />
                <span className="text-sm text-gray-700">+1 (555) 123-4567</span>
              </div>
              <div className="flex items-center gap-3">
                <Mail className="h-4 w-4 text-gray-600" />
                <span className="text-sm text-gray-700">reservations@luxuryhotel.com</span>
              </div>
            </div>
          </Card>
        </div>

        {/* ==========================================
            RIGHT COLUMN - CONTACT FORM & PRICING
            ========================================== */}
        <div className="space-y-6">
          
          {/* Contact Information Form */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Contact Information</h3>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="firstName" required>First Name</Label>
                  <Input
                    id="firstName"
                    value={contactInfo.firstName}
                    onChange={(e) => handleContactChange('firstName', e.target.value)}
                    placeholder="John"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="lastName" required>Last Name</Label>
                  <Input
                    id="lastName"
                    value={contactInfo.lastName}
                    onChange={(e) => handleContactChange('lastName', e.target.value)}
                    placeholder="Doe"
                    required
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="email" required>Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  value={contactInfo.email}
                  onChange={(e) => handleContactChange('email', e.target.value)}
                  placeholder="john.doe@example.com"
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="phone" required>Phone Number</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={contactInfo.phone}
                  onChange={(e) => handleContactChange('phone', e.target.value)}
                  placeholder="+1 (555) 123-4567"
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="specialRequests">Special Requests (Optional)</Label>
                <textarea
                  id="specialRequests"
                  className="w-full mt-1 p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  rows={3}
                  value={contactInfo.specialRequests}
                  onChange={(e) => handleContactChange('specialRequests', e.target.value)}
                  placeholder="Early check-in, room preferences, dietary restrictions, etc."
                />
              </div>
            </div>
          </Card>

          {/* Pricing Breakdown */}
          <Card className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <CreditCard className="h-5 w-5 text-blue-600" />
              <h3 className="text-lg font-semibold text-gray-900">Price Breakdown</h3>
            </div>
            
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Rooms Subtotal:</span>
                <span className="font-medium">${summary.pricing.roomsSubtotal.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Taxes & Fees:</span>
                <span className="font-medium">${summary.pricing.taxesAndFees.toLocaleString()}</span>
              </div>
              {summary.pricing.discounts > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>Discounts:</span>
                  <span>-${summary.pricing.discounts.toLocaleString()}</span>
                </div>
              )}
              <div className="border-t pt-3 mt-3">
                <div className="flex justify-between text-xl font-bold">
                  <span>Total Amount:</span>
                  <span>${summary.pricing.totalPrice.toLocaleString()}</span>
                </div>
                <p className="text-sm text-gray-500 mt-1">
                  For {summary.dateRange.nights} night{summary.dateRange.nights !== 1 ? 's' : ''}
                </p>
              </div>
            </div>
          </Card>

          {/* Terms and Agreements */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Terms & Conditions</h3>
            
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <Checkbox
                  id="terms"
                  checked={agreements.terms}
                  onCheckedChange={(checked: boolean | string) => handleAgreementChange('terms', checked as boolean)}
                  required
                />
                <Label htmlFor="terms" className="text-sm">
                  I agree to the <a href="/terms" className="text-blue-600 hover:underline">Terms of Service</a> and 
                  <a href="/terms" className="text-blue-600 hover:underline ml-1">Cancellation Policy</a>
                  <span className="text-red-600 ml-1">*</span>
                </Label>
              </div>
              
              <div className="flex items-start gap-3">
                <Checkbox
                  id="privacy"
                  checked={agreements.privacy}
                  onCheckedChange={(checked: boolean | string) => handleAgreementChange('privacy', checked as boolean)}
                  required
                />
                <Label htmlFor="privacy" className="text-sm">
                  I acknowledge the <a href="/privacy" className="text-blue-600 hover:underline">Privacy Policy</a>
                  <span className="text-red-600 ml-1">*</span>
                </Label>
              </div>
              
              <div className="flex items-start gap-3">
                <Checkbox
                  id="marketing"
                  checked={agreements.marketing}
                  onCheckedChange={(checked: boolean | string) => handleAgreementChange('marketing', checked as boolean)}
                />
                <Label htmlFor="marketing" className="text-sm">
                  I would like to receive promotional offers and updates (optional)
                </Label>
              </div>
            </div>
          </Card>

          {/* Confirmation Button */}
          <Card className="p-6 bg-blue-50 border-blue-200">
            {!bookingId ? (
              // Step 1: Create booking
              <>
                <Button
                  onClick={handleConfirmBooking}
                  disabled={!isFormValid() || isSubmitting}
                  size="lg"
                  className="w-full"
                >
                  {isSubmitting ? (
                    <div className="flex items-center gap-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Creating Booking...
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-5 w-5" />
                      Create Booking - ${summary.pricing.totalPrice.toLocaleString()}
                    </div>
                  )}
                </Button>
                
                {!isFormValid() && (
                  <div className="mt-3 flex items-center gap-2 text-sm text-amber-700">
                    <AlertTriangle className="h-4 w-4" />
                    Please complete all required fields and accept the terms
                  </div>
                )}
                
                {error && (
                  <div className="mt-3 space-y-2">
                    <div className="flex items-center gap-2 text-sm text-red-600">
                      <AlertTriangle className="h-4 w-4" />
                      {error}
                    </div>
                    {error.includes('room is no longer available') && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => window.location.reload()}
                        className="w-full"
                      >
                        Refresh Page & Start Over
                      </Button>
                    )}
                  </div>
                )}
              </>
            ) : (
              // Step 2: Process payment
              <>
                <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center gap-2 text-green-700">
                    <CheckCircle className="h-5 w-5" />
                    <span className="font-medium">Booking Created Successfully!</span>
                  </div>
                  <p className="text-sm text-green-600 mt-1 ml-7">
                    Booking ID: {bookingId}
                  </p>
                </div>
                
                <PaymentButton
                  bookingId={bookingId}
                  amount={Math.round(summary.pricing.totalPrice * 100)} // Convert to cents
                  currency="USD"
                  label={`Pay $${summary.pricing.totalPrice.toLocaleString()}`}
                  size="lg"
                  onError={(error) => setError(error)}
                />
                
                <p className="text-xs text-gray-600 text-center mt-3">
                  You will be redirected to secure payment gateway
                </p>
              </>
            )}
            
            <p className="text-xs text-gray-600 text-center mt-3">
              You will receive a confirmation email after payment
            </p>
          </Card>
        </div>
      </div>
    </div>
  )
}