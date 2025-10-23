// ==========================================
// TEXTAREA COMPONENT
// ==========================================
// Reusable form textarea component

'use client'

import { TextareaHTMLAttributes, forwardRef } from 'react'
import { cn } from '@/lib/utils'

// ==========================================
// TYPE DEFINITIONS
// ==========================================

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: string | undefined
}

// ==========================================
// TEXTAREA COMPONENT
// ==========================================

/**
 * Textarea Component
 * Reusable form textarea with error state
 * 
 * @example
 * ```tsx
 * <Textarea
 *   placeholder="Enter description"
 *   rows={4}
 *   error={errors.description?.message}
 * />
 * ```
 */
const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, error, ...props }, ref) => {
    return (
      <div className="w-full">
        <textarea
          className={cn(
            'flex min-h-[80px] w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm',
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

Textarea.displayName = 'Textarea'

export { Textarea }
export type { TextareaProps }
