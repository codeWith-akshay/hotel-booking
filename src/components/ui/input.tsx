// ==========================================
// INPUT COMPONENT
// ==========================================
// Reusable form input component

'use client'

import { InputHTMLAttributes, forwardRef } from 'react'
import { cn } from '@/lib/utils'

// ==========================================
// TYPE DEFINITIONS
// ==========================================

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  error?: string | undefined
}

// ==========================================
// INPUT COMPONENT
// ==========================================

/**
 * Input Component
 * Reusable form input with error state
 * 
 * @example
 * ```tsx
 * <Input
 *   type="text"
 *   placeholder="Enter name"
 *   error={errors.name?.message}
 * />
 * ```
 */
const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, type = 'text', error, ...props }, ref) => {
    return (
      <div className="w-full">
        <input
          type={type}
          className={cn(
            'flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm',
            'placeholder:text-gray-400',
            'focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2',
            'disabled:cursor-not-allowed disabled:opacity-50',
            error && 'border-red-500 focus:ring-red-600',
            className
          )}
          ref={ref}
          {...props}
        />
        {error && (
          <p className="mt-1 text-sm text-red-600">{error}</p>
        )}
      </div>
    )
  }
)

Input.displayName = 'Input'

export { Input }
export type { InputProps }
