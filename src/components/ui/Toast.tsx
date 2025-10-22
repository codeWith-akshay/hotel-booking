// ==========================================
// TOAST NOTIFICATION COMPONENT
// ==========================================
// Simple toast notification for success/error messages
// Production-ready with animations and auto-dismiss

'use client'

import { useEffect } from 'react'

// ==========================================
// TYPE DEFINITIONS
// ==========================================

interface ToastProps {
  message: string
  type?: 'success' | 'error' | 'info'
  onClose: () => void
  duration?: number
}

// ==========================================
// TOAST COMPONENT
// ==========================================

/**
 * Toast Notification Component
 * Displays temporary success/error/info messages
 * 
 * @example
 * ```tsx
 * <Toast
 *   message="Profile updated successfully"
 *   type="success"
 *   onClose={() => setMessage(null)}
 * />
 * ```
 */
export function Toast({ message, type = 'info', onClose, duration = 5000 }: ToastProps) {
  // Auto-dismiss after duration
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose()
    }, duration)

    return () => clearTimeout(timer)
  }, [duration, onClose])

  // Get colors based on type
  const colors = {
    success: 'bg-green-50 border-green-500 text-green-800',
    error: 'bg-red-50 border-red-500 text-red-800',
    info: 'bg-blue-50 border-blue-500 text-blue-800',
  }

  const icons = {
    success: '✓',
    error: '✕',
    info: 'i',
  }

  return (
    <div
      className={`
        fixed top-4 right-4 z-50 max-w-md w-full
        ${colors[type]}
        border-l-4 rounded-lg shadow-lg p-4
        animate-in slide-in-from-top-2 fade-in duration-300
      `}
      role="alert"
    >
      <div className="flex items-start gap-3">
        <span className="text-xl font-bold shrink-0">{icons[type]}</span>
        
        <p className="flex-1 text-sm font-medium">{message}</p>

        <button
          onClick={onClose}
          className="shrink-0 hover:opacity-70 transition-opacity text-lg font-bold"
          aria-label="Close notification"
        >
          ×
        </button>
      </div>
    </div>
  )
}
