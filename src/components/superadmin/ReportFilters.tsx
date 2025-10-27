/**
 * Report Filters Component (Day 17)
 * 
 * Date range picker and room type filter for reports
 */

'use client'

import { useState, useEffect } from 'react'
import { Calendar, Filter, X } from 'lucide-react'

interface ReportFiltersProps {
  startDate: string
  endDate: string
  roomTypeId?: string | undefined
  onStartDateChange: (date: string) => void
  onEndDateChange: (date: string) => void
  onRoomTypeChange: (roomTypeId: string | undefined) => void
  onApply: () => void
  onReset: () => void
}

export function ReportFilters({
  startDate,
  endDate,
  roomTypeId,
  onStartDateChange,
  onEndDateChange,
  onRoomTypeChange,
  onApply,
  onReset,
}: ReportFiltersProps) {
  const [roomTypes, setRoomTypes] = useState<Array<{ id: string; name: string }>>([])
  const [loading, setLoading] = useState(false)

  // Fetch room types
  useEffect(() => {
    const fetchRoomTypes = async () => {
      try {
        const response = await fetch('/api/rooms')
        const data = await response.json()
        if (data.success && data.roomTypes) {
          setRoomTypes(data.roomTypes)
        }
      } catch (error) {
        console.error('Error fetching room types:', error)
      }
    }

    fetchRoomTypes()
  }, [])

  // Quick date range presets
  const applyPreset = (days: number) => {
    const end = new Date()
    const start = new Date()
    start.setDate(start.getDate() - days)

    const endDateStr = end.toISOString().split('T')[0]
    const startDateStr = start.toISOString().split('T')[0]
    if (endDateStr && startDateStr) {
      onEndDateChange(endDateStr)
      onStartDateChange(startDateStr)
    }
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
      <div className="flex items-center gap-2 mb-4">
        <Filter className="w-5 h-5 text-indigo-600" />
        <h3 className="text-lg font-semibold text-gray-900">Filters</h3>
      </div>

      <div className="space-y-4">
        {/* Date Range */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Start Date
            </label>
            <div className="relative">
              <input
                type="date"
                value={startDate}
                onChange={(e) => onStartDateChange(e.target.value)}
                max={endDate}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
              <Calendar className="absolute right-3 top-2.5 w-5 h-5 text-gray-400 pointer-events-none" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              End Date
            </label>
            <div className="relative">
              <input
                type="date"
                value={endDate}
                onChange={(e) => onEndDateChange(e.target.value)}
                min={startDate}
                max={new Date().toISOString().split('T')[0]}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
              <Calendar className="absolute right-3 top-2.5 w-5 h-5 text-gray-400 pointer-events-none" />
            </div>
          </div>
        </div>

        {/* Quick Presets */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Quick Presets
          </label>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => applyPreset(7)}
              className="px-3 py-1.5 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md transition-colors"
            >
              Last 7 Days
            </button>
            <button
              onClick={() => applyPreset(30)}
              className="px-3 py-1.5 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md transition-colors"
            >
              Last 30 Days
            </button>
            <button
              onClick={() => applyPreset(90)}
              className="px-3 py-1.5 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md transition-colors"
            >
              Last 90 Days
            </button>
            <button
              onClick={() => applyPreset(365)}
              className="px-3 py-1.5 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md transition-colors"
            >
              Last Year
            </button>
          </div>
        </div>

        {/* Room Type Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Room Type (Optional)
          </label>
          <div className="flex gap-2">
            <select
              value={roomTypeId || ''}
              onChange={(e) => onRoomTypeChange(e.target.value || undefined)}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="">All Room Types</option>
              {roomTypes.map((rt) => (
                <option key={rt.id} value={rt.id}>
                  {rt.name}
                </option>
              ))}
            </select>
            {roomTypeId && (
              <button
                onClick={() => onRoomTypeChange(undefined)}
                className="px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-md transition-colors"
                title="Clear room type filter"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 pt-2">
          <button
            onClick={onApply}
            disabled={loading}
            className="flex-1 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-medium rounded-lg transition-colors"
          >
            Apply Filters
          </button>
          <button
            onClick={onReset}
            className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-lg transition-colors"
          >
            Reset
          </button>
        </div>
      </div>
    </div>
  )
}
