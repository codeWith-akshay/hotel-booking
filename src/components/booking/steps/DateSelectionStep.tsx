// ==========================================
// DATE SELECTION STEP - Calendar Date Picker
// ==========================================
// Allows users to select check-in and check-out dates

'use client'

import { useState, useEffect } from 'react'
import { Calendar, CalendarDays, Clock } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { useDateSelection } from '@/store/bookingUIStore'
import { format, addDays, isBefore, isAfter, isToday } from 'date-fns'

// ==========================================
// DATE SELECTION STEP COMPONENT
// ==========================================

export function DateSelectionStep() {
  const { startDate, endDate, nights, setDates } = useDateSelection()
  
  // Local state for date picker - ensure dates are Date objects
  const [selectedStartDate, setSelectedStartDate] = useState<Date | null>(
    startDate ? (startDate instanceof Date ? startDate : new Date(startDate)) : null
  )
  const [selectedEndDate, setSelectedEndDate] = useState<Date | null>(
    endDate ? (endDate instanceof Date ? endDate : new Date(endDate)) : null
  )
  const [isSelectingEndDate, setIsSelectingEndDate] = useState(false)

  // Update local state when store changes
  useEffect(() => {
    setSelectedStartDate(startDate ? (startDate instanceof Date ? startDate : new Date(startDate)) : null)
    setSelectedEndDate(endDate ? (endDate instanceof Date ? endDate : new Date(endDate)) : null)
  }, [startDate, endDate])

  // ==========================================
  // DATE VALIDATION
  // ==========================================

  const minDate = new Date()
  const maxDate = addDays(new Date(), 365) // 1 year ahead

  const isDateDisabled = (date: Date): boolean => {
    // Disable past dates
    if (isBefore(date, minDate)) return true
    
    // Disable dates too far in future
    if (isAfter(date, maxDate)) return true
    
    // If selecting end date, disable dates before start date
    if (isSelectingEndDate && selectedStartDate) {
      return isBefore(date, selectedStartDate) || date.getTime() === selectedStartDate.getTime()
    }
    
    return false
  }

  // ==========================================
  // DATE SELECTION HANDLERS
  // ==========================================

  const handleDateSelect = (date: Date) => {
    if (isDateDisabled(date)) return

    if (!selectedStartDate || isSelectingEndDate) {
      if (!selectedStartDate) {
        // Select start date
        setSelectedStartDate(date)
        setIsSelectingEndDate(true)
      } else {
        // Select end date
        setSelectedEndDate(date)
        setIsSelectingEndDate(false)
        // Update store with both dates
        setDates(selectedStartDate, date)
      }
    } else {
      // Replace start date and clear end date
      setSelectedStartDate(date)
      setSelectedEndDate(null)
      setIsSelectingEndDate(true)
      setDates(date, null)
    }
  }

  const handleQuickSelect = (daysAhead: number) => {
    const start = new Date()
    const end = addDays(start, daysAhead)
    
    setSelectedStartDate(start)
    setSelectedEndDate(end)
    setIsSelectingEndDate(false)
    setDates(start, end)
  }

  const clearDates = () => {
    setSelectedStartDate(null)
    setSelectedEndDate(null)
    setIsSelectingEndDate(false)
    setDates(null, null)
  }

  // ==========================================
  // CALCULATE NIGHTS
  // ==========================================

  const calculatedNights = selectedStartDate && selectedEndDate
    ? Math.ceil(
        (new Date(selectedEndDate).getTime() - new Date(selectedStartDate).getTime()) / (1000 * 60 * 60 * 24)
      )
    : 0

  return (
    <div className="space-y-6">
      
      {/* ==========================================
          STEP HEADER
          ========================================== */}
      <div className="text-center">
        <h2 className="text-2xl font-semibold text-gray-900 mb-2">
          When would you like to stay?
        </h2>
        <p className="text-gray-600">
          Select your check-in and check-out dates to see available rooms and pricing.
        </p>
      </div>

      {/* ==========================================
          QUICK SELECT OPTIONS
          ========================================== */}
      <Card className="p-4 bg-gray-50">
        <h3 className="text-sm font-medium text-gray-700 mb-3">Quick Select</h3>
        <div className="flex flex-wrap gap-2">
          {[
            { days: 1, label: 'Tonight' },
            { days: 2, label: '2 Nights' },
            { days: 3, label: 'Weekend' },
            { days: 7, label: 'Week' },
          ].map(({ days, label }) => (
            <Button
              key={days}
              variant="outline"
              size="sm"
              onClick={() => handleQuickSelect(days)}
              className="text-xs"
            >
              {label}
            </Button>
          ))}
          <Button
            variant="outline"
            size="sm"
            onClick={clearDates}
            className="text-xs text-gray-500"
          >
            Clear
          </Button>
        </div>
      </Card>

      {/* ==========================================
          DATE INPUT CARDS WITH NATIVE DATE PICKERS
          ========================================== */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Check-in Date */}
        <Card className="p-6 border-2 border-gray-200 hover:border-blue-300 transition-colors">
          <div className="text-center">
            <Calendar className="h-8 w-8 text-blue-500 mx-auto mb-3" />
            <Label htmlFor="checkin" className="text-sm font-medium text-gray-700 block mb-3">
              Check-in Date
            </Label>
            
            <input
              id="checkin"
              type="date"
              min={format(minDate, 'yyyy-MM-dd')}
              max={format(maxDate, 'yyyy-MM-dd')}
              value={selectedStartDate ? format(selectedStartDate, 'yyyy-MM-dd') : ''}
              onChange={(e) => {
                if (e.target.value) {
                  const date = new Date(e.target.value)
                  setSelectedStartDate(date)
                  setSelectedEndDate(null)
                  setIsSelectingEndDate(true)
                  setDates(date, null)
                }
              }}
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all text-center font-semibold text-gray-900 cursor-pointer hover:border-blue-400"
            />
            
            {selectedStartDate && (
              <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                <p className="text-sm font-semibold text-blue-900">
                  {format(selectedStartDate, 'EEEE, MMMM d, yyyy')}
                </p>
              </div>
            )}
          </div>
        </Card>

        {/* Check-out Date */}
        <Card className={`p-6 border-2 transition-colors ${
          selectedStartDate 
            ? 'border-gray-200 hover:border-blue-300' 
            : 'border-gray-100 bg-gray-50 opacity-60 cursor-not-allowed'
        }`}>
          <div className="text-center">
            <CalendarDays className="h-8 w-8 text-blue-500 mx-auto mb-3" />
            <Label htmlFor="checkout" className="text-sm font-medium text-gray-700 block mb-3">
              Check-out Date
            </Label>
            
            <input
              id="checkout"
              type="date"
              min={selectedStartDate ? format(addDays(selectedStartDate, 1), 'yyyy-MM-dd') : format(minDate, 'yyyy-MM-dd')}
              max={format(maxDate, 'yyyy-MM-dd')}
              value={selectedEndDate ? format(selectedEndDate, 'yyyy-MM-dd') : ''}
              onChange={(e) => {
                if (e.target.value && selectedStartDate) {
                  const date = new Date(e.target.value)
                  setSelectedEndDate(date)
                  setIsSelectingEndDate(false)
                  setDates(selectedStartDate, date)
                }
              }}
              disabled={!selectedStartDate}
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all text-center font-semibold text-gray-900 cursor-pointer hover:border-blue-400 disabled:opacity-50 disabled:cursor-not-allowed"
            />
            
            {selectedEndDate ? (
              <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                <p className="text-sm font-semibold text-blue-900">
                  {format(selectedEndDate, 'EEEE, MMMM d, yyyy')}
                </p>
              </div>
            ) : (
              <p className="mt-3 text-xs text-gray-500">
                {selectedStartDate ? 'Select your departure date' : 'Select check-in first'}
              </p>
            )}
          </div>
        </Card>
      </div>

      {/* ==========================================
          BOOKING SUMMARY
          ========================================== */}
      {selectedStartDate && selectedEndDate && calculatedNights > 0 && (
        <Card className="p-6 bg-linear-to-br from-blue-50 to-purple-50 border-2 border-blue-200 shadow-lg">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-blue-500 rounded-full">
                <Clock className="h-6 w-6 text-white" />
              </div>
              <div>
                <p className="text-2xl font-bold text-blue-900">
                  {calculatedNights} {calculatedNights === 1 ? 'Night' : 'Nights'}
                </p>
                <p className="text-sm text-blue-700">
                  {format(selectedStartDate, 'MMM d')} - {format(selectedEndDate, 'MMM d, yyyy')}
                </p>
              </div>
            </div>
            
            <div className="flex flex-col items-center md:items-end">
              <p className="text-xs text-gray-600 mb-1">Estimated Total</p>
              <p className="text-3xl font-bold text-purple-600">--</p>
              <p className="text-xs text-gray-500">Price calculated after room selection</p>
            </div>
          </div>
        </Card>
      )}

      {/* Help Text */}
      <div className="text-center">
        <p className="text-sm text-gray-500">
          💡 <strong>Tip:</strong> You can select dates directly using the date pickers above or use Quick Select buttons for common stay lengths.
        </p>
      </div>
    </div>
  )
}