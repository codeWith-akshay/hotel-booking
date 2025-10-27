/**
 * Client-Safe Invoice Utilities
 * Safe for use in client components - no Node.js dependencies
 */

import { PaymentStatus } from '@prisma/client'

// ==========================================
// CURRENCY FORMATTING
// ==========================================

/**
 * Format currency amount for display
 * Converts cents to dollars/cents format with currency symbol
 *
 * @param amountInCents - Amount in cents (e.g., 15000 = $150.00)
 * @param currency - Currency code (USD, EUR, INR, etc.)
 * @returns Formatted currency string
 *
 * @example
 * formatCurrency(15000, 'USD') // Returns: "$150.00"
 * formatCurrency(500000, 'INR') // Returns: "₹5,000.00"
 */
export function formatCurrency(amountInCents: number, currency: string = 'USD'): string {
  const amount = amountInCents / 100

  // Currency symbols
  const symbols: Record<string, string> = {
    USD: '$',
    EUR: '€',
    GBP: '£',
    INR: '₹',
    JPY: '¥',
    AUD: 'A$',
    CAD: 'C$',
    CHF: 'CHF',
    CNY: '¥',
    SEK: 'kr',
    NZD: 'NZ$',
  }

  const symbol = symbols[currency] || currency
  const formatter = new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })

  return `${symbol}${formatter.format(amount)}`
}

// ==========================================
// DATE FORMATTING
// ==========================================

/**
 * Format date for invoice display
 * Returns date in "January 23, 2025" format
 *
 * @param date - Date to format
 * @returns Formatted date string
 *
 * @example
 * formatInvoiceDate(new Date('2025-01-23')) // Returns: "January 23, 2025"
 */
export function formatInvoiceDate(date: Date): string {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(date)
}

// ==========================================
// PAYMENT STATUS HELPERS
// ==========================================

/**
 * Get human-readable payment status label
 *
 * @param status - Payment status enum value
 * @returns Human-readable status label
 *
 * @example
 * getPaymentStatusLabel('SUCCEEDED') // Returns: "Paid"
 * getPaymentStatusLabel('PENDING') // Returns: "Pending"
 */
export function getPaymentStatusLabel(status: PaymentStatus): string {
  const labels: Record<PaymentStatus, string> = {
    SUCCEEDED: 'Paid',
    PENDING: 'Pending',
    FAILED: 'Failed',
    CANCELLED: 'Cancelled',
    REFUNDED: 'Refunded',
  }

  return labels[status] || status
}

/**
 * Get Tailwind CSS color class for payment status
 *
 * @param status - Payment status enum value
 * @returns Tailwind CSS color class
 *
 * @example
 * getPaymentStatusColor('SUCCEEDED') // Returns: "text-green-600"
 * getPaymentStatusColor('FAILED') // Returns: "text-red-600"
 */
export function getPaymentStatusColor(status: PaymentStatus): string {
  const colors: Record<PaymentStatus, string> = {
    SUCCEEDED: 'text-green-600',
    PENDING: 'text-yellow-600',
    FAILED: 'text-red-600',
    CANCELLED: 'text-gray-600',
    REFUNDED: 'text-blue-600',
  }

  return colors[status] || 'text-gray-600'
}