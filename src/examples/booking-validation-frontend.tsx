// ==========================================
// BOOKING RULES VALIDATION - FRONTEND GUIDE
// ==========================================
// Quick reference for integrating booking validation in the UI

import { createBookingAction } from '@/actions/bookings/bookings.action'
import React, { useState } from 'react'
// Stubbed references for type safety
const toast = { error: (msg: string) => {}, success: (msg: string) => {}, warning: (msg: string) => {} }
const router = { push: (url: string) => {} }
const currentUser = { id: 'user_1' }
const selectedRoomType = { id: 'room_1' }
const userGuestType: 'REGULAR' | 'VIP' | 'CORPORATE' = 'REGULAR'
const calculateTotalPrice = (formData: any) => 1000
const Tooltip = ({ content }: { content: string }) => <span title={content}></span>
const showDepositPaymentModal = (props: any) => {}
type BookingFormData = {
  checkInDate: string
  checkOutDate: string
  numberOfRooms: number
  guests: number
  adults: number
  children: number
}
const getUserGuestType = () => userGuestType

/**
 * Example: Create booking with validation
 */
async function handleBookingSubmit(formData: BookingFormData) {
  const result = await createBookingAction({
    guestId: currentUser.id,
    roomId: selectedRoomType.id,
    checkInDate: formData.checkInDate,
    checkOutDate: formData.checkOutDate,
    numberOfGuests: formData.guests,
    numberOfAdults: formData.adults,
    numberOfChildren: formData.children,
    roomsBooked: formData.numberOfRooms, // Important for group booking detection
  })

  if (!result.success) {
    // Display validation errors
    if (result.validationErrors && result.validationErrors.length > 0) {
      // These are blocking errors - booking cannot proceed
      result.validationErrors.forEach(error => {
        toast.error(error)
      })
    } else {
      // Generic error
      toast.error(result.error || 'Failed to create booking')
    }
    return
  }

  // Success - Check for warnings
  if (result.warnings && result.warnings.length > 0) {
    result.warnings.forEach(warning => {
      toast.warning(warning)
    })
  }

  // Check if deposit is required
  const booking = result.data
  if (booking.depositRequired && booking.depositAmount) {
    // Show deposit payment modal
    showDepositPaymentModal({
      bookingId: booking.id,
      depositAmount: booking.depositAmount,
      totalAmount: booking.finalAmount,
      onComplete: () => {
        router.push(`/bookings/${booking.id}`)
      }
    })
  } else {
    // Regular booking - proceed to confirmation
    toast.success(result.message)
    router.push(`/bookings/${booking.id}`)
  }
}

/**
 * Example: Pre-validate dates before allowing form submission
 */
async function validateDatesPreview(
  roomTypeId: string,
  startDate: Date,
  endDate: Date,
  numberOfRooms: number
) {
  // You can create a separate validation-only endpoint
  // Or handle client-side checks for basic validation
  
  const now = new Date()
  const daysInAdvance = Math.ceil((startDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
  
  // Get user's guest type (from context/store)
  const guestType = getUserGuestType()
  
  // Show warnings based on guest type
  const rules = {
    REGULAR: { max: 90, min: 3 },
    VIP: { max: 365, min: 2 },
    CORPORATE: { max: 180, min: 1 },
  }
  
  const rule = rules[guestType]
  
  if (daysInAdvance > rule.max) {
    return {
      valid: false,
      message: `${guestType} guests can only book up to ${rule.max} days in advance`
    }
  }
  
  if (daysInAdvance < rule.min) {
    return {
      valid: false,
      message: `${guestType} guests must book at least ${rule.min} day(s) in advance`
    }
  }
  
  // Check for group booking
  if (numberOfRooms >= 10 && numberOfRooms <= 19) {
    return {
      valid: true,
      warning: `Group booking (${numberOfRooms} rooms) - 30% deposit required`
    }
  }
  
  return { valid: true }
}

/**
 * Example: Display guest type info in booking form
 */
function GuestTypeInfoBanner({ guestType }: { guestType: 'REGULAR' | 'VIP' | 'CORPORATE' }) {
  const info = {
    REGULAR: {
      icon: '👤',
      color: 'blue',
      text: 'Regular Guest - Book 3-90 days in advance'
    },
    VIP: {
      icon: '⭐',
      color: 'purple',
      text: 'VIP Guest - Book 2-365 days in advance'
    },
    CORPORATE: {
      icon: '🏢',
      color: 'green',
      text: 'Corporate Guest - Book 1-180 days in advance'
    }
  }
  
  const { icon, color, text } = info[guestType]
  
  return (
    <div className={`p-4 rounded-lg bg-${color}-50 border border-${color}-200`}>
      <p className="text-sm font-medium">
        {icon} {text}
      </p>
    </div>
  )
}

/**
 * Example: Group booking deposit notice
 */
function GroupBookingNotice({ numberOfRooms, totalPrice }: { numberOfRooms: number, totalPrice: number }) {
  if (numberOfRooms < 10 || numberOfRooms > 19) return null
  
  const depositAmount = totalPrice * 0.30
  
  return (
    <div className="p-4 rounded-lg bg-yellow-50 border border-yellow-200">
      <div className="flex items-start gap-3">
        <span className="text-2xl">💰</span>
        <div>
          <h4 className="font-semibold text-yellow-900">Group Booking Deposit Required</h4>
          <p className="text-sm text-yellow-700 mt-1">
            This booking requires {numberOfRooms} rooms. A 30% deposit of{' '}
            <strong>${(depositAmount / 100).toFixed(2)}</strong> must be paid before confirmation.
          </p>
        </div>
      </div>
    </div>
  )
}

/**
 * Example: Special day calendar indicator
 */
async function getSpecialDaysForMonth(year: number, month: number) {
  // Fetch special days from API
  const response = await fetch(`/api/special-days?year=${year}&month=${month}`)
  const specialDays = await response.json()
  
  return specialDays.map((day: any) => ({
    date: new Date(day.date),
    type: day.ruleType, // 'blocked' or 'special_rate'
    description: day.description,
    isBlocked: day.ruleType === 'blocked',
    hasSpecialRate: day.ruleType === 'special_rate',
  }))
}

/**
 * Example: Calendar day renderer with special day indicators
 */
function CalendarDay({ date, specialDays }: { date: Date, specialDays: any[] }) {
  const specialDay = specialDays.find(sd => 
    sd.date.toDateString() === date.toDateString()
  )
  
  if (!specialDay) {
    return <div className="calendar-day">{date.getDate()}</div>
  }
  
  if (specialDay.isBlocked) {
    return (
      <div className="calendar-day blocked relative">
        <span className="line-through text-gray-400">{date.getDate()}</span>
        <span className="absolute top-0 right-0 text-xs">🚫</span>
        <Tooltip content={specialDay.description} />
      </div>
    )
  }
  
  if (specialDay.hasSpecialRate) {
    return (
      <div className="calendar-day special-rate relative">
        <span className="text-purple-600 font-semibold">{date.getDate()}</span>
        <span className="absolute top-0 right-0 text-xs">💎</span>
        <Tooltip content={specialDay.description} />
      </div>
    )
  }
  
  return <div className="calendar-day">{date.getDate()}</div>
}

/**
 * Example: Validation error display
 */
function ValidationErrorAlert({ errors }: { errors: string[] }) {
  if (errors.length === 0) return null
  
  return (
    <div className="rounded-lg bg-red-50 border border-red-200 p-4">
      <div className="flex items-start gap-3">
        <span className="text-2xl">⚠️</span>
        <div className="flex-1">
          <h4 className="font-semibold text-red-900">Cannot Create Booking</h4>
          <ul className="mt-2 space-y-1">
            {errors.map((error, index) => (
              <li key={index} className="text-sm text-red-700">
                • {error}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  )
}

/**
 * Example: Complete booking form with validation
 */
function BookingForm() {
  const [formData, setFormData] = useState<BookingFormData>({
    checkInDate: '',
    checkOutDate: '',
    numberOfRooms: 1,
    guests: 2,
    adults: 2,
    children: 0,
  })
  const [validationErrors, setValidationErrors] = useState<string[]>([])
  const [warnings, setWarnings] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setValidationErrors([])
    setWarnings([])
    
    const result = await createBookingAction({
      guestId: currentUser.id,
      roomId: selectedRoomType.id,
      checkInDate: formData.checkInDate,
      checkOutDate: formData.checkOutDate,
      numberOfGuests: formData.guests,
      numberOfAdults: formData.adults,
      numberOfChildren: formData.children,
      roomsBooked: formData.numberOfRooms,
    })
    
    setLoading(false)
    
    if (!result.success) {
      if (result.validationErrors) {
        setValidationErrors(result.validationErrors)
      } else {
        toast.error(result.error || 'Failed to create booking')
      }
      return
    }
    
    if (result.warnings) {
      setWarnings(result.warnings)
    }
    
    // Handle success
    toast.success(result.message)
    
    // Check for deposit requirement
    if (result.data.depositRequired) {
      router.push(`/bookings/${result.data.id}/deposit`)
    } else {
      router.push(`/bookings/${result.data.id}`)
    }
  }
  
  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <GuestTypeInfoBanner guestType={userGuestType} />
      
      {validationErrors.length > 0 && (
        <ValidationErrorAlert errors={validationErrors} />
      )}
      
      {warnings.length > 0 && (
        <div className="rounded-lg bg-yellow-50 border border-yellow-200 p-4">
          {warnings.map((warning: string, idx: number) => (
            <p key={idx} className="text-sm text-yellow-800">{warning}</p>
          ))}
        </div>
      )}
      
      {/* Form fields */}
      <div>
        <label>Check-in Date</label>
        <input
          type="date"
          value={formData.checkInDate}
          onChange={(e) => setFormData({ ...formData, checkInDate: e.target.value })}
          min={new Date().toISOString().split('T')[0]}
          required
        />
      </div>
      
      <div>
        <label>Number of Rooms</label>
        <input
          type="number"
          value={formData.numberOfRooms}
          onChange={(e) => setFormData({ ...formData, numberOfRooms: parseInt(e.target.value) })}
          min={1}
          max={50}
          required
        />
      </div>
      
      {formData.numberOfRooms >= 10 && formData.numberOfRooms <= 19 && (
        <GroupBookingNotice 
          numberOfRooms={formData.numberOfRooms}
          totalPrice={calculateTotalPrice(formData)}
        />
      )}
      
      <button
        type="submit"
        disabled={loading}
        className="w-full btn btn-primary"
      >
        {loading ? 'Creating Booking...' : 'Create Booking'}
      </button>
    </form>
  )
}

export {
  handleBookingSubmit,
  validateDatesPreview,
  GuestTypeInfoBanner,
  GroupBookingNotice,
  getSpecialDaysForMonth,
  CalendarDay,
  ValidationErrorAlert,
  BookingForm,
}
