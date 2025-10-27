/**
 * Booking Filters Component (Day 15)
 * 
 * Advanced filter panel for admin dashboard
 * Features: date range, member search, status, payment status, sorting
 */

'use client'

import { useState } from 'react'
import { Search, Calendar, Filter, X, ChevronDown } from 'lucide-react'
import type { BookingFilters } from '@/lib/validation/admin.validation'
import { BookingStatus } from '@prisma/client'

interface BookingFiltersProps {
  filters: BookingFilters
  onFilterChange: (filters: Partial<BookingFilters>) => void
  onReset: () => void
  totalCount?: number
}

export function BookingFilters({
  filters,
  onFilterChange,
  onReset,
  totalCount = 0,
}: BookingFiltersProps) {
  const [showAdvanced, setShowAdvanced] = useState(false)
  
  const handleInputChange = (key: keyof BookingFilters, value: any) => {
    onFilterChange({ [key]: value })
  }
  
  const hasActiveFilters = 
    filters.startDate ||
    filters.endDate ||
    filters.memberSearch ||
    filters.status ||
    filters.paymentStatus ||
    filters.roomTypeId
  
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Filter className="w-5 h-5 text-gray-600" />
          <h3 className="text-lg font-semibold text-gray-900">Filters</h3>
          {totalCount > 0 && (
            <span className="text-sm text-gray-500">
              ({totalCount} {totalCount === 1 ? 'result' : 'results'})
            </span>
          )}
        </div>
        
        {hasActiveFilters && (
          <button
            onClick={onReset}
            className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700 transition-colors"
          >
            <X className="w-4 h-4" />
            Clear all
          </button>
        )}
      </div>
      
      {/* Primary Filters */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Date Range */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            Check-in From
          </label>
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="date"
              value={filters.startDate ? filters.startDate.split('T')[0] : ''}
              onChange={(e) => {
                const date = e.target.value ? new Date(e.target.value).toISOString() : undefined
                handleInputChange('startDate', date)
              }}
              className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
            />
          </div>
        </div>
        
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            Check-out To
          </label>
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="date"
              value={filters.endDate ? filters.endDate.split('T')[0] : ''}
              onChange={(e) => {
                const date = e.target.value ? new Date(e.target.value).toISOString() : undefined
                handleInputChange('endDate', date)
              }}
              className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
            />
          </div>
        </div>
        
        {/* Member Search */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            Search Member
          </label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={filters.memberSearch || ''}
              onChange={(e) => handleInputChange('memberSearch', e.target.value || undefined)}
              placeholder="Name, email, or phone"
              className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
            />
          </div>
        </div>
        
        {/* Booking Status */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            Booking Status
          </label>
          <div className="relative">
            <select
              value={filters.status || ''}
              onChange={(e) => handleInputChange('status', e.target.value || undefined)}
              className="w-full appearance-none px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm bg-white"
            >
              <option value="">All Statuses</option>
              <option value="PROVISIONAL">Provisional</option>
              <option value="CONFIRMED">Confirmed</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          </div>
        </div>
      </div>
      
      {/* Advanced Filters Toggle */}
      <button
        onClick={() => setShowAdvanced(!showAdvanced)}
        className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 transition-colors"
      >
        <ChevronDown
          className={`w-4 h-4 transition-transform ${showAdvanced ? 'rotate-180' : ''}`}
        />
        {showAdvanced ? 'Hide' : 'Show'} advanced filters
      </button>
      
      {/* Advanced Filters */}
      {showAdvanced && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-gray-200">
          {/* Payment Status */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Payment Status
            </label>
            <div className="relative">
              <select
                value={filters.paymentStatus || ''}
                onChange={(e) => handleInputChange('paymentStatus', e.target.value || undefined)}
                className="w-full appearance-none px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm bg-white"
              >
                <option value="">All Payments</option>
                <option value="PAID">Paid</option>
                <option value="PARTIAL">Partial</option>
                <option value="PENDING">Pending</option>
                <option value="OFFLINE">Offline</option>
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            </div>
          </div>
          
          {/* Sort By */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Sort By
            </label>
            <div className="relative">
              <select
                value={filters.sortBy || 'createdAt'}
                onChange={(e) => handleInputChange('sortBy', e.target.value)}
                className="w-full appearance-none px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm bg-white"
              >
                <option value="createdAt">Created Date</option>
                <option value="startDate">Check-in Date</option>
                <option value="endDate">Check-out Date</option>
                <option value="totalPrice">Total Price</option>
                <option value="status">Status</option>
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            </div>
          </div>
          
          {/* Sort Order */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Sort Order
            </label>
            <div className="relative">
              <select
                value={filters.sortOrder || 'desc'}
                onChange={(e) => handleInputChange('sortOrder', e.target.value as 'asc' | 'desc')}
                className="w-full appearance-none px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm bg-white"
              >
                <option value="desc">Descending</option>
                <option value="asc">Ascending</option>
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            </div>
          </div>
        </div>
      )}
      
      {/* Active Filter Tags */}
      {hasActiveFilters && (
        <div className="flex flex-wrap gap-2 pt-4 border-t border-gray-200">
          {filters.startDate && (
            <FilterTag
              label={`From: ${new Date(filters.startDate).toLocaleDateString()}`}
              onRemove={() => handleInputChange('startDate', undefined)}
            />
          )}
          {filters.endDate && (
            <FilterTag
              label={`To: ${new Date(filters.endDate).toLocaleDateString()}`}
              onRemove={() => handleInputChange('endDate', undefined)}
            />
          )}
          {filters.memberSearch && (
            <FilterTag
              label={`Member: ${filters.memberSearch}`}
              onRemove={() => handleInputChange('memberSearch', undefined)}
            />
          )}
          {filters.status && (
            <FilterTag
              label={`Status: ${filters.status}`}
              onRemove={() => handleInputChange('status', undefined)}
            />
          )}
          {filters.paymentStatus && (
            <FilterTag
              label={`Payment: ${filters.paymentStatus}`}
              onRemove={() => handleInputChange('paymentStatus', undefined)}
            />
          )}
        </div>
      )}
    </div>
  )
}

// Filter tag component
function FilterTag({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <span className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-700 text-sm rounded-full">
      {label}
      <button
        onClick={onRemove}
        className="hover:bg-blue-200 rounded-full p-0.5 transition-colors"
      >
        <X className="w-3 h-3" />
      </button>
    </span>
  )
}
