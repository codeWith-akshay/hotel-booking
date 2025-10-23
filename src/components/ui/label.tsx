// ==========================================
// LABEL COMPONENT
// ==========================================
// Form label component

'use client'

import { LabelHTMLAttributes, forwardRef } from 'react'
import { cn } from '@/lib/utils'

// ==========================================
// TYPE DEFINITIONS
// ==========================================

interface LabelProps extends LabelHTMLAttributes<HTMLLabelElement> {
  required?: boolean
}

// ==========================================
// LABEL COMPONENT
// ==========================================

/**
 * Label Component
 * Form label with optional required indicator
 * 
 * @example
 * ```tsx
 * <Label htmlFor="name" required>Name</Label>
 * ```
 */
const Label = forwardRef<HTMLLabelElement, LabelProps>(
  ({ className, required, children, ...props }, ref) => {
    return (
      <label
        ref={ref}
        className={cn(
          'text-sm font-medium leading-none text-gray-900',
          'peer-disabled:cursor-not-allowed peer-disabled:opacity-70',
          className
        )}
        {...props}
      >
        {children}
        {required && <span className="ml-1 text-red-600">*</span>}
      </label>
    )
  }
)

Label.displayName = 'Label'

export { Label }
export type { LabelProps }
