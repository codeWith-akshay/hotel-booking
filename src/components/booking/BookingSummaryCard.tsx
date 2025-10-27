// ==========================================
// BOOKING SUMMARY CARD - DYNAMIC CLIENT COMPONENT
// ==========================================
// Real-time summary of booking details from store

'use client'

import { Card } from '@/components/ui/card'
import { useBookingStore } from '@/store/bookingUIStore'

export function BookingSummaryCard() {
  const { startDate, endDate, nights, adults, children, guestType, selectedRooms } = useBookingStore()
  
  // Format dates
  const formatDate = (date: Date | null) => {
    if (!date) return 'Not selected'
    const d = new Date(date)
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  }

  // Calculate subtotal and taxes
  const subtotal = selectedRooms.reduce((acc, room) => acc + room.subtotal, 0)
  const taxRate = 0.1 // 10% tax
  const taxes = subtotal * taxRate
  const total = subtotal + taxes

  return (
    <Card className="p-6 bg-white/95 backdrop-blur-lg shadow-2xl border-0 ring-2 ring-blue-100 hover:ring-blue-200 transition-all duration-300 hover:shadow-blue-200/50">
      {/* Header with Icon */}
      <div className="flex items-center gap-3 mb-6 pb-4 border-b-2 border-linear-to-r from-blue-500 to-purple-500">
        <div className="p-2 bg-linear-to-br from-blue-500 to-purple-600 rounded-lg">
          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
        </div>
        <h3 className="text-xl font-bold bg-linear-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
          Booking Summary
        </h3>
      </div>
      
      <div className="space-y-5">
        {/* Dates Section with Icon */}
        <div className="p-4 bg-linear-to-br from-blue-50 to-purple-50 rounded-xl border border-blue-100 hover:border-blue-200 transition-colors">
          <div className="flex items-center gap-2 mb-3">
            <div className="p-1.5 bg-blue-500 rounded-lg">
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <h4 className="text-sm font-semibold text-gray-800">Stay Dates</h4>
          </div>
          <div className="text-sm text-gray-700 space-y-2 ml-8">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Check-in:</span>
              <span className="font-semibold text-gray-900">{formatDate(startDate)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Check-out:</span>
              <span className="font-semibold text-gray-900">{formatDate(endDate)}</span>
            </div>
            <div className="flex justify-between items-center pt-2 border-t border-blue-200">
              <span className="text-gray-600">Nights:</span>
              <span className="font-bold text-blue-600">{nights || 0}</span>
            </div>
          </div>
        </div>
        
        {/* Guests Section with Icon */}
        <div className="p-4 bg-linear-to-br from-purple-50 to-pink-50 rounded-xl border border-purple-100 hover:border-purple-200 transition-colors">
          <div className="flex items-center gap-2 mb-3">
            <div className="p-1.5 bg-purple-500 rounded-lg">
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <h4 className="text-sm font-semibold text-gray-800">Guest Details</h4>
          </div>
          <div className="text-sm text-gray-700 space-y-2 ml-8">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Adults:</span>
              <span className="font-semibold text-gray-900">{adults || '--'}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Children:</span>
              <span className="font-semibold text-gray-900">{children || '--'}</span>
            </div>
            <div className="flex justify-between items-center pt-2 border-t border-purple-200">
              <span className="text-gray-600">Guest Type:</span>
              <span className="font-bold text-purple-600">
                {guestType ? guestType.charAt(0) + guestType.slice(1).toLowerCase() : 'Not selected'}
              </span>
            </div>
          </div>
        </div>
        
        {/* Rooms Section with Icon */}
        <div className="p-4 bg-linear-to-br from-green-50 to-teal-50 rounded-xl border border-green-100 hover:border-green-200 transition-colors">
          <div className="flex items-center gap-2 mb-3">
            <div className="p-1.5 bg-green-500 rounded-lg">
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
            </div>
            <h4 className="text-sm font-semibold text-gray-800">Selected Rooms</h4>
          </div>
          <div className="text-sm text-gray-600 ml-8">
            {selectedRooms.length > 0 ? (
              <div className="space-y-3">
                {selectedRooms.map((room, index) => (
                  <div key={index} className="p-3 bg-white rounded-lg border border-green-200">
                    <div className="flex justify-between items-start mb-1">
                      <span className="font-semibold text-gray-900 text-sm">{room.roomTypeName}</span>
                      <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                        x{room.quantity}
                      </span>
                    </div>
                    <div className="text-xs text-gray-600">
                      ${room.pricePerNight}/night × {nights || 0} nights
                    </div>
                    <div className="text-sm font-semibold text-green-600 mt-1">
                      ${room.subtotal.toFixed(2)}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6 bg-white/50 rounded-lg border border-dashed border-green-300">
                <svg className="w-8 h-8 text-gray-400 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                </svg>
                <p className="text-gray-500 font-medium">No rooms selected</p>
                <p className="text-xs text-gray-400 mt-1">Complete previous steps first</p>
              </div>
            )}
          </div>
        </div>
        
        {/* Pricing Section with Gradient */}
        <div className="p-5 bg-linear-to-br from-gray-900 to-gray-800 rounded-xl shadow-xl">
          <div className="flex items-center gap-2 mb-4">
            <div className="p-1.5 bg-yellow-500 rounded-lg">
              <svg className="w-4 h-4 text-gray-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h4 className="text-sm font-semibold text-white">Price Breakdown</h4>
          </div>
          <div className="text-sm space-y-3">
            <div className="flex justify-between items-center text-gray-300">
              <span>Rooms Subtotal:</span>
              <span className="font-semibold text-white">${subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center text-gray-300">
              <span>Taxes & Fees (10%):</span>
              <span className="font-semibold text-white">${taxes.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center pt-3 border-t-2 border-yellow-500/30 font-bold text-yellow-400 text-lg">
              <span>Total Amount:</span>
              <span className="text-2xl">${total.toFixed(2)}</span>
            </div>
          </div>
        </div>
      </div>
      
      {/* Trust Badge */}
      <div className="mt-6 pt-5 border-t-2 border-gray-200">
        <div className="flex items-center justify-center gap-2 text-green-600 mb-2">
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
          <span className="text-sm font-semibold">Secure Booking</span>
        </div>
        <p className="text-xs text-gray-500 text-center">
          All prices include taxes. Free cancellation available within 24 hours.
        </p>
      </div>
    </Card>
  )
}
