import { z } from 'zod'

// ==========================================
// PHONE NUMBER VALIDATION
// ==========================================

/**
 * Regex for international phone number validation
 * Supports formats: +1234567890, +1-234-567-8900, etc.
 * Must start with + and country code
 */
const PHONE_REGEX = /^\+[1-9]\d{1,14}$/

/**
 * Regex for phone number without country code
 * Supports formats: 1234567890, 123-456-7890, etc.
 */
const PHONE_NUMBER_REGEX = /^\d{10,15}$/

/**
 * Country code regex (1-3 digits)
 */
const COUNTRY_CODE_REGEX = /^\+?[1-9]\d{0,2}$/

// ==========================================
// OTP VALIDATION
// ==========================================

/**
 * OTP must be exactly 6 digits
 */
const OTP_REGEX = /^\d{6}$/

/**
 * OTP length constraints
 */
const OTP_LENGTH = 6

// ==========================================
// REQUEST OTP SCHEMA
// ==========================================

/**
 * Schema for requesting an OTP
 * Validates phone number with optional country code
 */
export const requestOTPSchema = z
  .object({
    phone: z
      .string({ message: 'Phone number is required' })
      .min(10, 'Phone number must be at least 10 digits')
      .max(15, 'Phone number must not exceed 15 digits')
      .regex(
        PHONE_NUMBER_REGEX,
        'Phone number must contain only digits and be 10-15 characters long'
      )
      .transform((val) => val.replace(/\D/g, '')), // Remove non-digits

    countryCode: z
      .string()
      .regex(COUNTRY_CODE_REGEX, 'Invalid country code format')
      .optional()
      .default('+1'), // Default to US country code
  })
  .transform((data) => ({
    // Combine country code and phone into international format
    phone: `${data.countryCode}${data.phone}`,
    countryCode: data.countryCode,
    rawPhone: data.phone,
  }))

/**
 * Alternative schema for phone with country code already included
 */
export const requestOTPWithFullPhoneSchema = z.object({
  phone: z
    .string({ message: 'Phone number is required' })
    .regex(
      PHONE_REGEX,
      'Phone number must be in international format (e.g., +1234567890)'
    )
    .min(10, 'Phone number is too short')
    .max(16, 'Phone number is too long'),
})

// ==========================================
// VERIFY OTP SCHEMA
// ==========================================

/**
 * Schema for verifying an OTP
 * Validates phone number and OTP code
 */
export const verifyOTPSchema = z.object({
  phone: z
    .string({ message: 'Phone number is required' })
    .regex(
      PHONE_REGEX,
      'Phone number must be in international format (e.g., +1234567890)'
    )
    .min(10, 'Phone number is too short')
    .max(16, 'Phone number is too long'),

  otp: z
    .string({ message: 'OTP is required' })
    .length(OTP_LENGTH, `OTP must be exactly ${OTP_LENGTH} digits`)
    .regex(OTP_REGEX, 'OTP must contain only digits')
    .transform((val) => val.trim()),
})

// ==========================================
// RESEND OTP SCHEMA
// ==========================================

/**
 * Schema for resending an OTP
 * Same as requestOTP but can include reason
 */
export const resendOTPSchema = z.object({
  phone: z
    .string({ message: 'Phone number is required' })
    .regex(
      PHONE_REGEX,
      'Phone number must be in international format (e.g., +1234567890)'
    ),

  reason: z
    .enum(['expired', 'not_received', 'user_requested'])
    .optional(),
})

// ==========================================
// TYPESCRIPT TYPES (Inferred from Zod)
// ==========================================

/**
 * Input type for requesting OTP (before transformation)
 */
export type RequestOTPInput = z.input<typeof requestOTPSchema>

/**
 * Output type for requesting OTP (after transformation)
 */
export type RequestOTPOutput = z.output<typeof requestOTPSchema>

/**
 * Type for requesting OTP with full phone number
 */
export type RequestOTPWithFullPhone = z.infer<
  typeof requestOTPWithFullPhoneSchema
>

/**
 * Type for verifying OTP
 */
export type VerifyOTPInput = z.infer<typeof verifyOTPSchema>

/**
 * Type for resending OTP
 */
export type ResendOTPInput = z.infer<typeof resendOTPSchema>

// ==========================================
// RESPONSE SCHEMAS
// ==========================================

/**
 * Schema for successful OTP request response
 */
export const otpRequestResponseSchema = z.object({
  success: z.literal(true),
  message: z.string(),
  data: z.object({
    phone: z.string(),
    expiresIn: z.number(), // Seconds until expiration
    expiresAt: z.string().datetime(), // ISO timestamp
  }),
})

/**
 * Schema for successful OTP verification response
 */
export const otpVerifyResponseSchema = z.object({
  success: z.literal(true),
  message: z.string(),
  data: z.object({
    userId: z.string(),
    phone: z.string(),
    token: z.string().optional(), // JWT or session token
  }),
})

/**
 * Schema for OTP error response
 */
export const otpErrorResponseSchema = z.object({
  success: z.literal(false),
  error: z.string(),
  code: z.enum([
    'INVALID_PHONE',
    'INVALID_OTP',
    'OTP_EXPIRED',
    'OTP_NOT_FOUND',
    'TOO_MANY_ATTEMPTS',
    'RATE_LIMIT_EXCEEDED',
    'USER_NOT_FOUND',
    'INTERNAL_ERROR',
  ]),
  message: z.string(),
})

/**
 * Response types
 */
export type OTPRequestResponse = z.infer<typeof otpRequestResponseSchema>
export type OTPVerifyResponse = z.infer<typeof otpVerifyResponseSchema>
export type OTPErrorResponse = z.infer<typeof otpErrorResponseSchema>

// ==========================================
// UTILITY FUNCTIONS
// ==========================================

/**
 * Validate phone number format
 */
export function isValidPhone(phone: string): boolean {
  return PHONE_REGEX.test(phone)
}

/**
 * Validate OTP format
 */
export function isValidOTP(otp: string): boolean {
  return OTP_REGEX.test(otp)
}

/**
 * Format phone number to international format
 */
export function formatPhoneNumber(
  phone: string,
  countryCode: string = '+1'
): string {
  const cleaned = phone.replace(/\D/g, '')
  return `${countryCode}${cleaned}`
}

/**
 * Extract country code from phone number
 */
export function extractCountryCode(phone: string): {
  countryCode: string
  number: string
} {
  const match = phone.match(/^(\+\d{1,3})(\d+)$/)
  if (!match) {
    return { countryCode: '', number: phone }
  }
  return {
    countryCode: match[1] || '',
    number: match[2] || '',
  }
}

// ==========================================
// CONSTANTS
// ==========================================

export const OTP_CONFIG = {
  LENGTH: OTP_LENGTH,
  EXPIRY_MINUTES: 10,
  MAX_ATTEMPTS: 5,
  RATE_LIMIT_WINDOW_MINUTES: 15,
  MAX_REQUESTS_PER_WINDOW: 3,
} as const

export type OTPConfig = typeof OTP_CONFIG
