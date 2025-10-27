/**
 * SpecialDaysCalendar Component
 * 
 * Interactive calendar for managing special days (blocked dates, special rates).
 * Features:
 * - Month view with date navigation
 * - Color-coded special days (red=blocked, yellow=special rate)
 * - Click date to add/edit special day rule
 * - Modal for editing special day details
 */

'use client'

import { useState, useEffect } from 'react'
import { useAppDispatch, useAppSelector } from '@/redux/hooks'
import {
  fetchSpecialDays,
  upsertSpecialDay,
  deleteSpecialDay,
  selectSpecialDays,
  selectSpecialDaysLoading,
  selectSpecialDaysError,
  setSelectedDate,
  setSelectedSpecialDay,
} from '@/redux/slices/superAdminSlice'
import { SpecialDay } from '@/lib/validation/superadmin.validation'
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  X,
  Save,
  Trash2,
  AlertCircle,
  Ban,
  TrendingUp,
} from 'lucide-react'

interface SpecialDaysCalendarProps {
  adminId: string
  roomTypes?: Array<{ id: string; name: string }>
}

export default function SpecialDaysCalendar({ adminId, roomTypes = [] }: SpecialDaysCalendarProps) {
  const dispatch = useAppDispatch()

  const specialDays = useAppSelector(selectSpecialDays)
  const loading = useAppSelector(selectSpecialDaysLoading)
  const error = useAppSelector(selectSpecialDaysError)

  const [currentDate, setCurrentDate] = useState(new Date())
  const [showModal, setShowModal] = useState(false)
  const [editingSpecialDay, setEditingSpecialDay] = useState<SpecialDay | null>(null)

  // Load special days for current month
  useEffect(() => {
    const startDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1)
    const endDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0)

    dispatch(
      fetchSpecialDays({
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
      })
    )
  }, [dispatch, currentDate])

  // Navigation
  const goToPreviousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))
  }

  const goToNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))
  }

  const goToToday = () => {
    setCurrentDate(new Date())
  }

  // Handle date click
  const handleDateClick = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0]
    const existing = specialDays.find((sd: SpecialDay) => {
      const sdDate = new Date(sd.date).toISOString().split('T')[0]
      return sdDate === dateStr
    })

    if (existing) {
      setEditingSpecialDay(existing)
    } else {
      setEditingSpecialDay({
        date: date,
        ruleType: 'blocked',
        active: true,
      } as SpecialDay)
    }

    setShowModal(true)
  }

  // Close modal
  const handleCloseModal = () => {
    setShowModal(false)
    setEditingSpecialDay(null)
  }

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      {/* Header */}
      <div className="bg-linear-to-r from-indigo-600 to-blue-600 p-6 text-white">
        <div className="flex items-center gap-3">
          <CalendarIcon className="w-8 h-8" />
          <div>
            <h2 className="text-2xl font-bold">Special Days Calendar</h2>
            <p className="text-indigo-100">Manage blocked dates and special rates</p>
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="m-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
          <span className="text-red-800">{error}</span>
        </div>
      )}

      {/* Legend */}
      <div className="p-6 pb-4 border-b border-gray-200">
        <div className="flex items-center gap-6 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-red-500 rounded"></div>
            <span className="text-gray-700">Blocked (No Bookings)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-yellow-500 rounded"></div>
            <span className="text-gray-700">Special Rate</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 border-2 border-blue-500 rounded"></div>
            <span className="text-gray-700">Today</span>
          </div>
        </div>
      </div>

      {/* Calendar */}
      <div className="p-6">
        <CalendarView
          currentDate={currentDate}
          specialDays={specialDays}
          onDateClick={handleDateClick}
          onPreviousMonth={goToPreviousMonth}
          onNextMonth={goToNextMonth}
          onToday={goToToday}
          loading={loading}
        />
      </div>

      {/* Modal */}
      {showModal && editingSpecialDay && (
        <SpecialDayModal
          specialDay={editingSpecialDay}
          adminId={adminId}
          roomTypes={roomTypes}
          onClose={handleCloseModal}
        />
      )}
    </div>
  )
}

// ==========================================
// CALENDAR VIEW
// ==========================================

interface CalendarViewProps {
  currentDate: Date
  specialDays: SpecialDay[]
  onDateClick: (date: Date) => void
  onPreviousMonth: () => void
  onNextMonth: () => void
  onToday: () => void
  loading: boolean
}

function CalendarView({
  currentDate,
  specialDays,
  onDateClick,
  onPreviousMonth,
  onNextMonth,
  onToday,
  loading,
}: CalendarViewProps) {
  const monthName = currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })

  // Generate calendar days
  const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate()
  const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay()

  const days: (Date | null)[] = []

  // Add empty cells for days before month starts
  for (let i = 0; i < firstDayOfMonth; i++) {
    days.push(null)
  }

  // Add days of month
  for (let i = 1; i <= daysInMonth; i++) {
    days.push(new Date(currentDate.getFullYear(), currentDate.getMonth(), i))
  }

  // Get special day for date
  const getSpecialDay = (date: Date | null): SpecialDay | undefined => {
    if (!date) return undefined
    const dateStr = date.toISOString().split('T')[0]
    return specialDays.find((sd: SpecialDay) => {
      const sdDate = new Date(sd.date).toISOString().split('T')[0]
      return sdDate === dateStr
    })
  }

  // Check if date is today
  const isToday = (date: Date | null): boolean => {
    if (!date) return false
    const today = new Date()
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    )
  }

  return (
    <div>
      {/* Calendar Header */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-semibold text-gray-900">{monthName}</h3>

        <div className="flex items-center gap-2">
          <button
            onClick={onToday}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Today
          </button>

          <div className="flex items-center gap-1 border border-gray-300 rounded-lg">
            <button
              onClick={onPreviousMonth}
              className="p-2 hover:bg-gray-50 rounded-l-lg transition-colors"
            >
              <ChevronLeft className="w-5 h-5 text-gray-600" />
            </button>
            <button
              onClick={onNextMonth}
              className="p-2 hover:bg-gray-50 rounded-r-lg transition-colors"
            >
              <ChevronRight className="w-5 h-5 text-gray-600" />
            </button>
          </div>
        </div>
      </div>

      {/* Weekday Headers */}
      <div className="grid grid-cols-7 gap-2 mb-2">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
          <div key={day} className="text-center text-sm font-medium text-gray-600 py-2">
            {day}
          </div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-2">
        {days.map((date, index) => {
          if (!date) {
            return <div key={`empty-${index}`} className="aspect-square" />
          }

          const specialDay = getSpecialDay(date)
          const today = isToday(date)

          return (
            <button
              key={index}
              onClick={() => onDateClick(date)}
              disabled={loading}
              className={`
                aspect-square p-2 rounded-lg text-sm font-medium transition-all
                ${today ? 'ring-2 ring-blue-500' : ''}
                ${specialDay && specialDay.ruleType === 'blocked'
                  ? 'bg-red-500 text-white hover:bg-red-600'
                  : specialDay && specialDay.ruleType === 'special_rate'
                  ? 'bg-yellow-400 text-gray-900 hover:bg-yellow-500'
                  : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                }
                ${loading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
              `}
            >
              <div className="flex flex-col items-center justify-center h-full">
                <span>{date.getDate()}</span>
                {specialDay && (
                  <div className="mt-1 w-1 h-1 rounded-full bg-current"></div>
                )}
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}

// ==========================================
// SPECIAL DAY MODAL
// ==========================================

interface SpecialDayModalProps {
  specialDay: SpecialDay
  adminId: string
  roomTypes: Array<{ id: string; name: string }>
  onClose: () => void
}

function SpecialDayModal({ specialDay: initialData, adminId, roomTypes, onClose }: SpecialDayModalProps) {
  const dispatch = useAppDispatch()

  const [formData, setFormData] = useState<SpecialDay>(initialData)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const isEditing = !!initialData.id

  // Handle field change
  const handleChange = (field: keyof SpecialDay, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  // Handle save
  const handleSave = async () => {
    setSaving(true)
    setError(null)

    try {
      // Convert Date to ISO string for Redux serialization
      const serializedFormData = {
        ...formData,
        date: formData.date instanceof Date ? formData.date.toISOString() : formData.date,
      } as any // Cast to any since we're converting Date to string for serialization
      
      const result = await dispatch(upsertSpecialDay({ specialDay: serializedFormData, adminId }))

      if (result.meta.requestStatus === 'fulfilled') {
        onClose()
      } else {
        setError('Failed to save special day')
      }
    } catch (err) {
      setError('An error occurred')
    } finally {
      setSaving(false)
    }
  }

  // Handle delete
  const handleDelete = async () => {
    if (!formData.id) return
    if (!confirm('Are you sure you want to delete this special day?')) return

    setSaving(true)
    setError(null)

    try {
      const result = await dispatch(deleteSpecialDay({ id: formData.id, adminId }))

      if (result.meta.requestStatus === 'fulfilled') {
        onClose()
      } else {
        setError('Failed to delete special day')
      }
    } catch (err) {
      setError('An error occurred')
    } finally {
      setSaving(false)
    }
  }

  const dateStr = new Date(formData.date).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={onClose}>
      <div
        className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              {isEditing ? 'Edit Special Day' : 'Add Special Day'}
            </h3>
            <p className="text-sm text-gray-600 mt-1">{dateStr}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <X className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        {/* Error */}
        {error && (
          <div className="m-6 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
            <span className="text-sm text-red-800">{error}</span>
          </div>
        )}

        {/* Form */}
        <div className="p-6 space-y-5">
          {/* Rule Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Rule Type</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => handleChange('ruleType', 'blocked')}
                className={`p-3 border-2 rounded-lg transition-all ${
                  formData.ruleType === 'blocked'
                    ? 'border-red-500 bg-red-50 text-red-700'
                    : 'border-gray-300 text-gray-700 hover:border-gray-400'
                }`}
              >
                <Ban className="w-5 h-5 mx-auto mb-1" />
                <div className="text-sm font-medium">Blocked</div>
              </button>
              <button
                onClick={() => handleChange('ruleType', 'special_rate')}
                className={`p-3 border-2 rounded-lg transition-all ${
                  formData.ruleType === 'special_rate'
                    ? 'border-yellow-500 bg-yellow-50 text-yellow-700'
                    : 'border-gray-300 text-gray-700 hover:border-gray-400'
                }`}
              >
                <TrendingUp className="w-5 h-5 mx-auto mb-1" />
                <div className="text-sm font-medium">Special Rate</div>
              </button>
            </div>
          </div>

          {/* Special Rate Fields */}
          {formData.ruleType === 'special_rate' && (
            <>
              {/* Rate Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Rate Type</label>
                <select
                  value={formData.rateType || 'multiplier'}
                  onChange={(e) => handleChange('rateType', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                >
                  <option value="multiplier">Multiplier (e.g., 1.5x)</option>
                  <option value="fixed">Fixed Price</option>
                </select>
              </div>

              {/* Rate Value */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {formData.rateType === 'multiplier' ? 'Multiplier' : 'Fixed Price ($)'}
                </label>
                <input
                  type="number"
                  step={formData.rateType === 'multiplier' ? '0.1' : '1'}
                  min="0"
                  value={formData.rateValue || ''}
                  onChange={(e) => handleChange('rateValue', parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder={formData.rateType === 'multiplier' ? '1.5' : '200'}
                />
              </div>
            </>
          )}

          {/* Room Type */}
          {roomTypes.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Room Type (Optional)
              </label>
              <select
                value={formData.roomTypeId || ''}
                onChange={(e) => handleChange('roomTypeId', e.target.value || null)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              >
                <option value="">All Room Types</option>
                {roomTypes.map((rt) => (
                  <option key={rt.id} value={rt.id}>
                    {rt.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
            <textarea
              value={formData.description || ''}
              onChange={(e) => handleChange('description', e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
              placeholder="e.g., Christmas holiday premium rates"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-gray-200">
          {isEditing ? (
            <button
              onClick={handleDelete}
              disabled={saving}
              className="flex items-center gap-2 px-4 py-2 text-red-700 bg-red-50 rounded-lg hover:bg-red-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              Delete
            </button>
          ) : (
            <div />
          )}

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              disabled={saving}
              className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Save className="w-4 h-4" />
              {saving ? 'Saving...' : 'Save'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
