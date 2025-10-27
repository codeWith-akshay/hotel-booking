/**
 * Status Badge Component (Day 14)
 * 
 * Displays booking and payment status with appropriate colors.
 * Supports booking status (PROVISIONAL, CONFIRMED, CANCELLED)
 * and payment status (PAID, PENDING, PARTIAL).
 */

import { BookingStatus } from '@prisma/client'
import { cn } from '@/lib/utils'

interface StatusBadgeProps {
  status: BookingStatus | 'PAID' | 'PENDING' | 'PARTIAL'
  className?: string
}

/**
 * Get badge variant classes based on status
 */
function getStatusVariant(status: StatusBadgeProps['status']) {
  switch (status) {
    case BookingStatus.CONFIRMED:
    case 'PAID':
      return 'bg-green-100 text-green-800 border-green-300'
    
    case BookingStatus.PROVISIONAL:
    case 'PARTIAL':
      return 'bg-yellow-100 text-yellow-800 border-yellow-300'
    
    case BookingStatus.CANCELLED:
      return 'bg-red-100 text-red-800 border-red-300'
    
    case 'PENDING':
      return 'bg-gray-100 text-gray-800 border-gray-300'
    
    default:
      return 'bg-blue-100 text-blue-800 border-blue-300'
  }
}

/**
 * Get display text for status
 */
function getStatusText(status: StatusBadgeProps['status']) {
  switch (status) {
    case BookingStatus.PROVISIONAL:
      return 'Provisional'
    case BookingStatus.CONFIRMED:
      return 'Confirmed'
    case BookingStatus.CANCELLED:
      return 'Cancelled'
    case 'PAID':
      return 'Paid'
    case 'PENDING':
      return 'Pending'
    case 'PARTIAL':
      return 'Partial Payment'
    default:
      return status
  }
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const variantClasses = getStatusVariant(status)
  const displayText = getStatusText(status)
  
  return (
    <span
      className={cn(
        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border',
        variantClasses,
        className
      )}
    >
      {displayText}
    </span>
  )
}

/**
 * Status Badge with icon
 */
export function StatusBadgeWithIcon({ status, className }: StatusBadgeProps) {
  const variantClasses = getStatusVariant(status)
  const displayText = getStatusText(status)
  
  // Simple indicator dot
  const dotColor = status === BookingStatus.CONFIRMED || status === 'PAID'
    ? 'bg-green-600'
    : status === BookingStatus.PROVISIONAL || status === 'PARTIAL'
    ? 'bg-yellow-600'
    : status === BookingStatus.CANCELLED
    ? 'bg-red-600'
    : 'bg-gray-600'
  
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border',
        variantClasses,
        className
      )}
    >
      <span className={cn('w-1.5 h-1.5 rounded-full', dotColor)} />
      {displayText}
    </span>
  )
}
