import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number | string) {
  const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(numAmount)
}

export function formatDate(date: Date | string) {
  const dateObj = typeof date === 'string' ? new Date(date) : date
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(dateObj)
}

export function generateId() {
  return Math.random().toString(36).substring(2) + Date.now().toString(36)
}

/**
 * Format phone number for display
 * Converts +14155551234 to +1 (415) 555-1234
 */
export function formatPhoneNumber(phone: string): string {
  // Remove all non-digit characters except +
  const cleaned = phone.replace(/[^\d+]/g, '')
  
  // Check if it starts with +1 (US/Canada)
  if (cleaned.startsWith('+1')) {
    const match = cleaned.match(/^\+1(\d{3})(\d{3})(\d{4})$/)
    if (match) {
      return `+1 (${match[1]}) ${match[2]}-${match[3]}`
    }
  }
  
  // Return original if format doesn't match
  return phone
}

/**
 * Validate phone number format (E.164)
 */
export function isValidPhoneNumber(phone: string): boolean {
  const phoneRegex = /^\+[1-9]\d{1,14}$/
  return phoneRegex.test(phone)
}

/**
 * Validate OTP format (6 digits)
 */
export function isValidOTP(otp: string): boolean {
  const otpRegex = /^\d{6}$/
  return otpRegex.test(otp)
}

/**
 * Format time remaining (seconds to MM:SS)
 */
export function formatTimeRemaining(seconds: number): string {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

/**
 * Get time until expiration in seconds
 */
export function getSecondsUntilExpiry(expiresAt: string): number {
  const now = Date.now()
  const expiry = new Date(expiresAt).getTime()
  const diff = Math.max(0, Math.floor((expiry - now) / 1000))
  return diff
}