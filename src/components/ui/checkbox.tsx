// ==========================================
// CHECKBOX COMPONENT
// ==========================================
// Reusable checkbox component with proper styling

'use client'

import { forwardRef } from 'react'
import { Check } from 'lucide-react'
import { cn } from '@/lib/utils'

// ==========================================
// TYPE DEFINITIONS
// ==========================================

interface CheckboxProps {
  id?: string
  checked?: boolean
  onCheckedChange?: (checked: boolean) => void
  disabled?: boolean
  required?: boolean
  className?: string
  children?: React.ReactNode
}

// ==========================================
// CHECKBOX COMPONENT
// ==========================================

const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, checked = false, onCheckedChange, disabled, required, id, ...props }, ref) => {
    return (
      <div className="flex items-center">
        <div className="relative">
          <input
            type="checkbox"
            id={id}
            ref={ref}
            checked={checked}
            onChange={(e) => onCheckedChange?.(e.target.checked)}
            disabled={disabled}
            required={required}
            className="sr-only"
            {...props}
          />
          <div
            className={cn(
              'h-4 w-4 rounded border-2 transition-colors duration-200 cursor-pointer',
              'flex items-center justify-center',
              {
                'border-blue-600 bg-blue-600': checked,
                'border-gray-300 bg-white hover:border-gray-400': !checked && !disabled,
                'border-gray-200 bg-gray-100 cursor-not-allowed': disabled,
              },
              className
            )}
            onClick={() => !disabled && onCheckedChange?.(!checked)}
          >
            {checked && (
              <Check className="h-3 w-3 text-white" strokeWidth={3} />
            )}
          </div>
        </div>
      </div>
    )
  }
)

Checkbox.displayName = 'Checkbox'

export { Checkbox }
export type { CheckboxProps }