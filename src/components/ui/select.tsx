// ==========================================
// SELECT COMPONENT
// ==========================================
// Reusable dropdown select component

'use client'

import { SelectHTMLAttributes, forwardRef } from 'react'
import { cn } from '@/lib/utils'

// ==========================================
// TYPE DEFINITIONS
// ==========================================

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  error?: string | undefined
  label?: string
  options: Array<{ value: string; label: string }>
}

// ==========================================
// SELECT COMPONENT
// ==========================================

/**
 * Select Component
 * Reusable dropdown with error state
 * 
 * @example
 * ```tsx
 * <Select
 *   label="Room Type"
 *   options={[
 *     { value: 'room1', label: 'Deluxe Room' },
 *     { value: 'room2', label: 'Suite' }
 *   ]}
 *   value={selectedRoom}
 *   onChange={(e) => setSelectedRoom(e.target.value)}
 * />
 * ```
 */
const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, label, error, options, ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label className="block text-sm font-medium text-gray-900 mb-2">
            {label}
          </label>
        )}
        <select
          ref={ref}
          className={cn(
            'flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm',
            'focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2',
            'disabled:cursor-not-allowed disabled:opacity-50',
            error && 'border-red-500 focus:ring-red-600',
            className
          )}
          {...props}
        >
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        {error && (
          <p className="mt-1 text-sm text-red-600">{error}</p>
        )}
      </div>
    )
  }
)

Select.displayName = 'Select'

export { Select }
export type { SelectProps }
