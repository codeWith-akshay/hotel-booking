import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

/**
 * Tailwind class merge helper
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Format currency value
 */
export function formatCurrency(amount: number | string) {
  const numAmount =
    typeof amount === 'string' ? parseFloat(amount) : amount

  if (Number.isNaN(numAmount)) return '$0.00'

  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(numAmount)
}

/**
 * Format date to readable string
 */
export function formatDate(date: Date | string) {
  const dateObj =
    typeof date === 'string' ? new Date(date) : date

  if (isNaN(dateObj.getTime())) return ''

  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(dateObj)
}

/**
 * Generate random unique ID
 */
export function generateId() {
  return (
    Math.random().toString(36).substring(2) +
    Date.now().toString(36)
  )
}

/**
 * Format phone number for display
 * Safe for undefined / null
 * Examples:
 * +14155551234 → +1 (415) 555-1234
 * +919876543210 → +91 98765 43210
 */
export function formatPhoneNumber(phone?: string | null): string {
  if (!phone || typeof phone !== 'string') return ''

  const cleaned = phone.replace(/[^\d+]/g, '')

  // 🇺🇸 US / Canada
  if (cleaned.startsWith('+1')) {
    const match = cleaned.match(/^(\+1)(\d{3})(\d{3})(\d{4})$/)
    if (match) {
      return `${match[1]} (${match[2]}) ${match[3]}-${match[4]}`
    }
  }

  // 🇮🇳 India
  if (cleaned.startsWith('+91')) {
    const match = cleaned.match(/^(\+91)(\d{5})(\d{5})$/)
    if (match) {
      return `${match[1]} ${match[2]} ${match[3]}`
    }
  }

  return cleaned
}

/**
 * Validate phone number (E.164 format)
 */
export function isValidPhoneNumber(phone?: string | null): boolean {
  if (!phone) return false
  const phoneRegex = /^\+[1-9]\d{1,14}$/
  return phoneRegex.test(phone)
}

/**
 * Validate OTP format (6 digits)
 */
export function isValidOTP(otp?: string | null): boolean {
  if (!otp) return false
  const otpRegex = /^\d{6}$/
  return otpRegex.test(otp)
}

/**
 * Format time remaining (seconds → MM:SS)
 */
export function formatTimeRemaining(seconds: number): string {
  if (seconds <= 0) return '0:00'
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

/**
 * Get time until expiry in seconds
 */
export function getSecondsUntilExpiry(
  expiresAt?: string | null
): number {
  if (!expiresAt) return 0

  const expiry = new Date(expiresAt).getTime()
  if (isNaN(expiry)) return 0

  const diff = Math.floor((expiry - Date.now()) / 1000)
  return Math.max(0, diff)
}
