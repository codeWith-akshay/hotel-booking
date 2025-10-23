// ==========================================
// DIALOG (MODAL) COMPONENT
// ==========================================
// Modal dialog component with overlay

'use client'

import { ReactNode, useEffect, useRef } from 'react'
import { cn } from '@/lib/utils'

// ==========================================
// TYPE DEFINITIONS
// ==========================================

interface DialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  children: ReactNode
}

interface DialogContentProps {
  children: ReactNode
  className?: string
}

interface DialogHeaderProps {
  children: ReactNode
  className?: string
}

interface DialogTitleProps {
  children: ReactNode
  className?: string
}

interface DialogDescriptionProps {
  children: ReactNode
  className?: string
}

// ==========================================
// DIALOG ROOT COMPONENT
// ==========================================

/**
 * Dialog Root Component
 * Controls open/close state
 * 
 * @example
 * ```tsx
 * <Dialog open={isOpen} onOpenChange={setIsOpen}>
 *   <DialogContent>...</DialogContent>
 * </Dialog>
 * ```
 */
export function Dialog({ open, onOpenChange, children }: DialogProps) {
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }

    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [open])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black/50 transition-opacity"
        onClick={() => onOpenChange(false)}
      />
      {/* Content */}
      {children}
    </div>
  )
}

// ==========================================
// DIALOG CONTENT COMPONENT
// ==========================================

/**
 * Dialog Content Component
 * Contains the actual dialog content
 */
export function DialogContent({ children, className }: DialogContentProps) {
  const contentRef = useRef<HTMLDivElement>(null)

  return (
    <div
      ref={contentRef}
      className={cn(
        'relative z-50 w-full max-w-lg rounded-lg bg-white p-6 shadow-xl',
        'max-h-[90vh] overflow-y-auto',
        'animate-in fade-in-0 zoom-in-95',
        className
      )}
    >
      {children}
    </div>
  )
}

// ==========================================
// DIALOG HEADER COMPONENT
// ==========================================

/**
 * Dialog Header Component
 * Contains title and description
 */
export function DialogHeader({ children, className }: DialogHeaderProps) {
  return (
    <div className={cn('flex flex-col space-y-1.5 text-center sm:text-left mb-4', className)}>
      {children}
    </div>
  )
}

// ==========================================
// DIALOG TITLE COMPONENT
// ==========================================

/**
 * Dialog Title Component
 * Main heading for the dialog
 */
export function DialogTitle({ children, className }: DialogTitleProps) {
  return (
    <h2 className={cn('text-lg font-semibold leading-none tracking-tight', className)}>
      {children}
    </h2>
  )
}

// ==========================================
// DIALOG DESCRIPTION COMPONENT
// ==========================================

/**
 * Dialog Description Component
 * Subtitle/description for the dialog
 */
export function DialogDescription({ children, className }: DialogDescriptionProps) {
  return (
    <p className={cn('text-sm text-gray-600', className)}>
      {children}
    </p>
  )
}

// ==========================================
// DIALOG FOOTER COMPONENT
// ==========================================

interface DialogFooterProps {
  children: ReactNode
  className?: string
}

/**
 * Dialog Footer Component
 * Contains action buttons
 */
export function DialogFooter({ children, className }: DialogFooterProps) {
  return (
    <div className={cn('flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2 mt-6', className)}>
      {children}
    </div>
  )
}
