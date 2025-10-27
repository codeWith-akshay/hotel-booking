// ==========================================
// CENTRALIZED ZOD VALIDATION
// ==========================================
// Production-ready validation patterns and utilities
//
// Features:
// - Centralized schema exports
// - Type-safe validation helpers
// - Sanitized error responses
// - Consistent error format across app
// - Integration with server actions
//
// Usage:
// - Import schemas from this file
// - Use `validateOrThrow()` for validation
// - Use `validateSafe()` for non-throwing validation
//
// @see https://zod.dev

import { z, ZodSchema, ZodError, ZodTypeAny, ZodObject } from 'zod'

// ==========================================
// RE-EXPORT EXISTING SCHEMAS
// ==========================================

// OTP Schemas
export * from './otp.schemas'

// Booking Schemas
export * from './booking.validation'

// Admin Schemas
export * from './admin.validation'

// Room Schemas (if exists)
// export * from './room.validation'

// Invoice Schemas
export * from './invoice.validation'

// ==========================================
// COMMON VALIDATION SCHEMAS
// ==========================================

/**
 * Common field validators used across the app
 */
export const CommonSchemas = {
  /** Phone number (international format) */
  phone: z.string().regex(/^\+?[1-9]\d{1,14}$/, {
    message: 'Invalid phone number format. Use international format (e.g., +1234567890)',
  }),

  /** Email address */
  email: z.string().email({ message: 'Invalid email address' }),

  /** UUID v4 */
  uuid: z.string().uuid({ message: 'Invalid UUID format' }),

  /** CUID (Prisma default) */
  cuid: z.string().cuid({ message: 'Invalid ID format' }),

  /** Positive integer */
  positiveInt: z.number().int().positive({ message: 'Must be a positive integer' }),

  /** Non-negative integer (including zero) */
  nonNegativeInt: z.number().int().nonnegative({ message: 'Must be zero or positive' }),

  /** Date string (ISO 8601) */
  dateString: z.string().datetime({ message: 'Invalid date format. Use ISO 8601' }),

  /** Pagination limit */
  limit: z.number().int().min(1).max(100).default(20),

  /** Pagination offset */
  offset: z.number().int().nonnegative().default(0),

  /** OTP code (6 digits) */
  otpCode: z.string().regex(/^\d{6}$/, { message: 'OTP must be 6 digits' }),

  /** Strong password */
  password: z
    .string()
    .min(8, { message: 'Password must be at least 8 characters' })
    .regex(/[A-Z]/, { message: 'Password must contain at least one uppercase letter' })
    .regex(/[a-z]/, { message: 'Password must contain at least one lowercase letter' })
    .regex(/[0-9]/, { message: 'Password must contain at least one number' }),

  /** Non-empty string */
  nonEmptyString: z.string().min(1, { message: 'Field cannot be empty' }),

  /** URL */
  url: z.string().url({ message: 'Invalid URL format' }),

  /** Amount in smallest currency unit (cents) */
  amount: z.number().int().nonnegative({ message: 'Amount must be non-negative' }),
} as const

// ==========================================
// VALIDATION ERROR TYPES
// ==========================================

/**
 * Standardized validation error response
 */
export interface ValidationErrorResponse {
  success: false
  error: string
  code: 'VALIDATION_ERROR'
  details: Array<{
    field: string
    message: string
  }>
}

/**
 * Validation error class
 */
export class ValidationError extends Error {
  code: string
  statusCode: number
  details: Array<{ field: string; message: string }>

  constructor(
    message: string,
    details: Array<{ field: string; message: string }>,
    code: string = 'VALIDATION_ERROR'
  ) {
    super(message)
    this.name = 'ValidationError'
    this.code = code
    this.statusCode = 400
    this.details = details

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, ValidationError)
    }
  }
}

// ==========================================
// VALIDATION HELPERS
// ==========================================

/**
 * Validate data against schema or throw ValidationError
 * Use this in server actions and API routes
 * 
 * @param {ZodSchema} schema - Zod schema to validate against
 * @param {unknown} data - Data to validate
 * @returns {T} Validated and typed data
 * @throws {ValidationError} If validation fails
 * 
 * @example
 * ```typescript
 * export async function createBooking(rawData: unknown) {
 *   const data = validateOrThrow(BookingCreateSchema, rawData)
 *   
 *   // `data` is now typed and validated
 *   await prisma.booking.create({ data })
 * }
 * ```
 */
export function validateOrThrow<T>(schema: ZodSchema<T>, data: unknown): T {
  try {
    return schema.parse(data)
  } catch (error) {
    if (error instanceof ZodError) {
      // Zod v4 exposes issues instead of errors
      const issues = (error as any).issues || error.issues || []
      const details = issues.map((err: any) => ({
        field: Array.isArray(err.path) ? err.path.join('.') : String(err.path || ''),
        message: err.message,
      }))

      throw new ValidationError('Validation failed', details)
    }

    // Re-throw unexpected errors
    throw error
  }
}

/**
 * Validate data against schema without throwing
 * Returns result object with success/error
 * 
 * @param {ZodSchema} schema - Zod schema to validate against
 * @param {unknown} data - Data to validate
 * @returns {object} Validation result with success flag
 * 
 * @example
 * ```typescript
 * const result = validateSafe(BookingSchema, inputData)
 * 
 * if (!result.success) {
 *   return { error: result.error, details: result.details }
 * }
 * 
 * const validData = result.data
 * ```
 */
export function validateSafe<T>(
  schema: ZodSchema<T>,
  data: unknown
):
  | { success: true; data: T }
  | { success: false; error: string; details: Array<{ field: string; message: string }> } {
  const result = schema.safeParse(data)

  if (result.success) {
    return { success: true, data: result.data }
  }

  // Zod v4: use .issues
  const issues = (result.error as any).issues || result.error.issues || []
  const details = issues.map((err: any) => ({
    field: Array.isArray(err.path) ? err.path.join('.') : String(err.path || ''),
    message: err.message,
  }))

  return {
    success: false,
    error: 'Validation failed',
    details,
  }
}

/**
 * Validate partial data (useful for updates)
 * Converts schema to partial and validates
 * 
 * @param {ZodSchema} schema - Zod schema to validate against
 * @param {unknown} data - Partial data to validate
 * @returns {Partial<T>} Validated partial data
 * 
 * @example
 * ```typescript
 * const updates = validatePartial(UserSchema, {
 *   name: 'New Name',
 *   // email not provided - that's OK
 * })
 * ```
 */
export function validatePartial<T>(schema: ZodSchema<T>, data: unknown): Partial<T> {
  // Work with Zod v4: only ZodObject supports .partial()
  const anySchema = schema as unknown as ZodTypeAny
  if (anySchema instanceof ZodObject) {
    const partialSchema = (anySchema as ZodObject<any>).partial()
    return validateOrThrow(partialSchema as unknown as ZodSchema<Partial<T>>, data)
  }

  // Fallback: try to validate with the original schema (best-effort)
  return validateOrThrow(schema as unknown as ZodSchema<Partial<T>>, data)
}

/**
 * Sanitize validation error for API response
 * Removes stack traces and sensitive info
 * 
 * @param {ValidationError | ZodError} error - Validation error
 * @returns {ValidationErrorResponse} Sanitized error response
 */
export function sanitizeValidationError(
  error: ValidationError | ZodError
): ValidationErrorResponse {
  if (error instanceof ValidationError) {
    return {
      success: false,
      error: error.message,
      code: 'VALIDATION_ERROR',
      details: error.details,
    }
  }

  if (error instanceof ZodError) {
    const issues = (error as any).issues || error.issues || []
    const details = issues.map((err: any) => ({
      field: Array.isArray(err.path) ? err.path.join('.') : String(err.path || ''),
      message: err.message,
    }))

    return {
      success: false,
      error: 'Validation failed',
      code: 'VALIDATION_ERROR',
      details,
    }
  }

  // Fallback for unexpected errors
  return {
    success: false,
    error: 'An unexpected validation error occurred',
    code: 'VALIDATION_ERROR',
    details: [],
  }
}

/**
 * Check if error is a validation error
 * 
 * @param {any} error - Error to check
 * @returns {boolean} True if validation error
 */
export function isValidationError(error: any): error is ValidationError | ZodError {
  return error instanceof ValidationError || error instanceof ZodError
}

// ==========================================
// SECURITY-SPECIFIC SCHEMAS
// ==========================================

/**
 * CSRF Token Schema
 */
export const CSRFTokenSchema = z.object({
  csrfToken: z.string().min(1, { message: 'CSRF token is required' }),
})

/**
 * Rate Limit Info Schema
 */
export const RateLimitInfoSchema = z.object({
  remaining: z.number().int().nonnegative(),
  resetAt: z.number().int().positive(),
  allowed: z.boolean(),
})

/**
 * OTP Attempt Schema (for rate limiting)
 */
export const OTPAttemptSchema = z.object({
  phone: CommonSchemas.phone,
  ip: z.string().regex(/^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$|^(([0-9a-fA-F]{1,4}:){7,7}[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,7}:|([0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,5}(:[0-9a-fA-F]{1,4}){1,2}|([0-9a-fA-F]{1,4}:){1,4}(:[0-9a-fA-F]{1,4}){1,3}|([0-9a-fA-F]{1,4}:){1,3}(:[0-9a-fA-F]{1,4}){1,4}|([0-9a-fA-F]{1,4}:){1,2}(:[0-9a-fA-F]{1,4}){1,5}|[0-9a-fA-F]{1,4}:((:[0-9a-fA-F]{1,4}){1,6})|:((:[0-9a-fA-F]{1,4}){1,7}|:)|fe80:(:[0-9a-fA-F]{0,4}){0,4}%[0-9a-zA-Z]{1,}|::(ffff(:0{1,4}){0,1}:){0,1}((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])|([0-9a-fA-F]{1,4}:){1,4}:((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9]))$/, 'Invalid IP address'),
  attemptedAt: CommonSchemas.dateString,
  success: z.boolean(),
})

/**
 * Security Event Schema
 */
export const SecurityEventSchema = z.object({
  eventType: z.enum([
    'OTP_REQUEST',
    'OTP_VERIFY_SUCCESS',
    'OTP_VERIFY_FAILED',
    'RATE_LIMIT_EXCEEDED',
    'CSRF_VIOLATION',
    'RBAC_VIOLATION',
    'INVALID_TOKEN',
    'SUSPICIOUS_ACTIVITY',
  ]),
  userId: CommonSchemas.cuid.optional(),
  ip: z.string(),
  userAgent: z.string().optional(),
  metadata: z.record(z.string(), z.any()).optional(),
  severity: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).default('MEDIUM'),
})

/**
 * Admin Audit Log Schema
 */
export const AdminAuditLogSchema = z.object({
  adminId: CommonSchemas.cuid,
  action: z.enum([
    'OVERRIDE_CONFIRM',
    'OVERRIDE_CANCEL',
    'FORCE_DELETE',
    'FORCE_UPDATE',
    'PERMISSION_GRANT',
    'PERMISSION_REVOKE',
    'USER_IMPERSONATE',
    'DATA_EXPORT',
    'SYSTEM_CONFIG_CHANGE',
  ]),
  targetType: z.enum(['BOOKING', 'USER', 'ROOM', 'PAYMENT', 'SYSTEM']),
  targetId: z.string(),
  changes: z.record(z.string(), z.any()).optional(),
  reason: z.string().min(10, { message: 'Reason must be at least 10 characters' }),
  metadata: z.record(z.string(), z.any()).optional(),
})

// ==========================================
// EXAMPLE USAGE PATTERNS
// ==========================================

/**
 * Example: Validating server action input
 * 
 * ```typescript
 * 'use server'
 * 
 * import { validateOrThrow, BookingCreateSchema } from '@/lib/validation'
 * 
 * export async function createBooking(rawInput: unknown) {
 *   // Validate input
 *   const input = validateOrThrow(BookingCreateSchema, rawInput)
 *   
 *   // Check RBAC
 *   const user = await getCurrentUser()
 *   await requireRole({ user }, ['MEMBER', 'ADMIN', 'SUPERADMIN'])
 *   
 *   // Business logic
 *   const booking = await prisma.booking.create({ data: input })
 *   
 *   return { success: true, data: booking }
 * }
 * ```
 */

/**
 * Example: Validating API route input with error handling
 * 
 * ```typescript
 * export async function POST(request: Request) {
 *   try {
 *     const body = await request.json()
 *     
 *     // Validate input
 *     const data = validateOrThrow(MySchema, body)
 *     
 *     // Process data
 *     const result = await processData(data)
 *     
 *     return NextResponse.json({ success: true, data: result })
 *   } catch (error) {
 *     if (isValidationError(error)) {
 *       return NextResponse.json(
 *         sanitizeValidationError(error),
 *         { status: 400 }
 *       )
 *     }
 *     
 *     // Handle other errors
 *     throw error
 *   }
 * }
 * ```
 */
