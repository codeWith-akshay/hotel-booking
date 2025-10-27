/**
 * Toast Notification Component (Day 14)
 * 
 * Simple toast notifications for success/error messages.
 */

'use client'

import { useEffect, useState } from 'react'
import { X, CheckCircle, XCircle, AlertCircle, Info } from 'lucide-react'
import { cn } from '@/lib/utils'

export type ToastType = 'success' | 'error' | 'warning' | 'info'

interface ToastProps {
  message: string
  type?: ToastType
  duration?: number
  onClose?: () => void
}

export function Toast({ message, type = 'info', duration = 5000, onClose }: ToastProps) {
  const [isVisible, setIsVisible] = useState(true)
  
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false)
      setTimeout(() => onClose?.(), 300) // Wait for fade out animation
    }, duration)
    
    return () => clearTimeout(timer)
  }, [duration, onClose])
  
  const handleClose = () => {
    setIsVisible(false)
    setTimeout(() => onClose?.(), 300)
  }
  
  const typeConfig = {
    success: {
      icon: CheckCircle,
      colors: 'bg-green-50 border-green-200 text-green-800',
      iconColor: 'text-green-600',
    },
    error: {
      icon: XCircle,
      colors: 'bg-red-50 border-red-200 text-red-800',
      iconColor: 'text-red-600',
    },
    warning: {
      icon: AlertCircle,
      colors: 'bg-yellow-50 border-yellow-200 text-yellow-800',
      iconColor: 'text-yellow-600',
    },
    info: {
      icon: Info,
      colors: 'bg-blue-50 border-blue-200 text-blue-800',
      iconColor: 'text-blue-600',
    },
  }
  
  const config = typeConfig[type]
  const Icon = config.icon
  
  return (
    <div
      className={cn(
        'flex items-center gap-3 p-4 rounded-lg border shadow-lg max-w-md transition-all duration-300',
        config.colors,
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2'
      )}
    >
      <Icon className={cn('w-5 h-5 shrink-0', config.iconColor)} />
      <p className="text-sm font-medium flex-1">{message}</p>
      <button
        onClick={handleClose}
        className="shrink-0 text-gray-400 hover:text-gray-600 transition-colors"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  )
}

/**
 * Toast Container for managing multiple toasts
 */
interface ToastContainerProps {
  toasts: Array<{ id: string; message: string; type: ToastType }>
  onRemove: (id: string) => void
}

export function ToastContainer({ toasts, onRemove }: ToastContainerProps) {
  return (
    <div className="fixed top-4 right-4 z-50 space-y-3">
      {toasts.map((toast) => (
        <Toast
          key={toast.id}
          message={toast.message}
          type={toast.type}
          onClose={() => onRemove(toast.id)}
        />
      ))}
    </div>
  )
}

/**
 * Custom hook for managing toasts
 */
export function useToast() {
  const [toasts, setToasts] = useState<Array<{ id: string; message: string; type: ToastType }>>([])
  
  const addToast = (message: string, type: ToastType = 'info') => {
    const id = Math.random().toString(36).substr(2, 9)
    setToasts((prev) => [...prev, { id, message, type }])
  }
  
  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id))
  }
  
  return {
    toasts,
    addToast,
    removeToast,
    success: (message: string) => addToast(message, 'success'),
    error: (message: string) => addToast(message, 'error'),
    warning: (message: string) => addToast(message, 'warning'),
    info: (message: string) => addToast(message, 'info'),
  }
}
