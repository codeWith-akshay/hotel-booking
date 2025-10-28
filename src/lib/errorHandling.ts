// ==========================================
// ERROR SANITIZATION & HANDLING
// ==========================================
// Production-ready error handling that prevents information leakage
//
// Features:
// - Remove stack traces from responses
// - Sanitize error messages
// - Log full errors server-side
// - Consistent error format
// - Integration with error tracking (Sentry, etc.)
//
// Security:
// - Never expose internal errors to clients
// - No database/file path leakage
// - No sensitive data in error responses
//
// @see https://owasp.org/www-community/Improper_Error_Handling

// ==========================================
// TYPE DEFINITIONS
// ==========================================

/**
 * Standardized error response format
 */
export interface ErrorResponse {
  success: false
  error: string
  code: string
  message?: string
  details?: any
}

/**
 * Internal error with context
 */
export interface InternalError {
  originalError: any
  context?: Record<string, any>
  userId?: string
  requestId?: string
}

// ==========================================
// ERROR CODES
// ==========================================

/**
 * Standard error codes
 */
export const ERROR_CODES = {
  // Authentication & Authorization
  AUTHENTICATION_REQUIRED: 'AUTHENTICATION_REQUIRED',
  INVALID_CREDENTIALS: 'INVALID_CREDENTIALS',
  INSUFFICIENT_PERMISSIONS: 'INSUFFICIENT_PERMISSIONS',
  RBAC_VIOLATION: 'RBAC_VIOLATION',

  // Validation
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  INVALID_INPUT: 'INVALID_INPUT',
  MISSING_REQUIRED_FIELD: 'MISSING_REQUIRED_FIELD',

  // Rate Limiting & Security
  RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',
  CSRF_VALIDATION_FAILED: 'CSRF_VALIDATION_FAILED',
  ACCOUNT_LOCKED: 'ACCOUNT_LOCKED',

  // Resources
  NOT_FOUND: 'NOT_FOUND',
  ALREADY_EXISTS: 'ALREADY_EXISTS',
  CONFLICT: 'CONFLICT',

  // Business Logic
  BUSINESS_RULE_VIOLATION: 'BUSINESS_RULE_VIOLATION',
  INVALID_STATE: 'INVALID_STATE',
  OPERATION_NOT_ALLOWED: 'OPERATION_NOT_ALLOWED',

  // System
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  SERVICE_UNAVAILABLE: 'SERVICE_UNAVAILABLE',
  DATABASE_ERROR: 'DATABASE_ERROR',
} as const

/**
 * HTTP status codes for error types
 */
const ERROR_STATUS_MAP: Record<string, number> = {
  AUTHENTICATION_REQUIRED: 401,
  INVALID_CREDENTIALS: 401,
  INSUFFICIENT_PERMISSIONS: 403,
  RBAC_VIOLATION: 403,
  VALIDATION_ERROR: 400,
  INVALID_INPUT: 400,
  MISSING_REQUIRED_FIELD: 400,
  RATE_LIMIT_EXCEEDED: 429,
  CSRF_VALIDATION_FAILED: 403,
  ACCOUNT_LOCKED: 423,
  NOT_FOUND: 404,
  ALREADY_EXISTS: 409,
  CONFLICT: 409,
  BUSINESS_RULE_VIOLATION: 422,
  INVALID_STATE: 422,
  OPERATION_NOT_ALLOWED: 403,
  INTERNAL_ERROR: 500,
  SERVICE_UNAVAILABLE: 503,
  DATABASE_ERROR: 500,
}

// ==========================================
// ERROR SANITIZATION
// ==========================================

/**
 * Sanitize error for client response
 * Removes stack traces, internal paths, and sensitive info
 * 
 * @param {any} error - Original error
 * @param {string} fallbackCode - Error code if not determined
 * @returns {ErrorResponse} Sanitized error response
 * 
 * @example
 * ```typescript
 * try {
 *   await riskyOperation()
 * } catch (error) {
 *   return NextResponse.json(
 *     sanitizeError(error),
 *     { status: 500 }
 *   )
 * }
 * ```
 */
export function sanitizeError(
  error: any,
  fallbackCode: string = ERROR_CODES.INTERNAL_ERROR
): ErrorResponse {
  // Log full error server-side (with stack trace)
  logErrorToServer(error)

  // Handle known error types
  if (error.code && typeof error.code === 'string') {
    return {
      success: false,
      error: sanitizeMessage(error.message || 'An error occurred'),
      code: error.code,
      message: error.message,
      details: sanitizeDetails(error.details),
    }
  }

  // Handle Prisma errors
  if (error.name === 'PrismaClientKnownRequestError') {
    return sanitizePrismaError(error)
  }

  // Handle Zod validation errors
  if (error.name === 'ZodError') {
    return {
      success: false,
      error: 'Validation failed',
      code: ERROR_CODES.VALIDATION_ERROR,
      details: error.errors?.map((e: any) => ({
        field: e.path.join('.'),
        message: e.message,
      })),
    }
  }

  // Handle RBAC errors
  if (error.name === 'RBACError') {
    return {
      success: false,
      error: sanitizeMessage(error.message),
      code: error.code,
    }
  }

  // Handle CSRF errors
  if (error.name === 'CSRFError') {
    return {
      success: false,
      error: sanitizeMessage(error.message),
      code: error.code,
    }
  }

  // Generic error fallback
  return {
    success: false,
    error: 'An unexpected error occurred. Please try again later.',
    code: fallbackCode,
  }
}

/**
 * Sanitize error message
 * Remove file paths, SQL queries, and other sensitive info
 * 
 * @param {string} message - Original error message
 * @returns {string} Sanitized message
 */
function sanitizeMessage(message: string): string {
  if (!message) {
    return 'An error occurred'
  }

  // Remove file paths (Windows and Unix)
  let sanitized = message.replace(/[A-Z]:\\[^\s]+/g, '[path]')
  sanitized = sanitized.replace(/\/[^\s]+\.(ts|js|tsx|jsx)/g, '[path]')

  // Remove SQL queries
  sanitized = sanitized.replace(/SELECT.*FROM/gi, '[SQL query]')
  sanitized = sanitized.replace(/INSERT INTO.*VALUES/gi, '[SQL query]')
  sanitized = sanitized.replace(/UPDATE.*SET/gi, '[SQL query]')
  sanitized = sanitized.replace(/DELETE FROM/gi, '[SQL query]')

  // Remove stack trace indicators
  const firstLine = sanitized.split('\n')[0]
  sanitized = firstLine || sanitized // Take only first line

  // Limit length
  if (sanitized.length > 200) {
    sanitized = sanitized.substring(0, 200) + '...'
  }

  return sanitized
}

/**
 * Sanitize error details
 * Remove sensitive fields
 */
function sanitizeDetails(details: any): any {
  if (!details || typeof details !== 'object') {
    return undefined
  }

  // Remove sensitive fields
  const sensitiveFields = ['password', 'token', 'secret', 'apiKey', 'privateKey']
  const sanitized = { ...details }

  for (const field of sensitiveFields) {
    if (field in sanitized) {
      delete sanitized[field]
    }
  }

  return sanitized
}

/**
 * Sanitize Prisma errors
 * Convert Prisma error codes to user-friendly messages
 */
function sanitizePrismaError(error: any): ErrorResponse {
  const code = error.code

  // Prisma error code mappings
  switch (code) {
    case 'P2002': // Unique constraint violation
      return {
        success: false,
        error: 'A record with this information already exists',
        code: ERROR_CODES.ALREADY_EXISTS,
      }

    case 'P2025': // Record not found
      return {
        success: false,
        error: 'The requested resource was not found',
        code: ERROR_CODES.NOT_FOUND,
      }

    case 'P2003': // Foreign key constraint violation
      return {
        success: false,
        error: 'This operation would violate data integrity',
        code: ERROR_CODES.CONFLICT,
      }

    case 'P2014': // Relation violation
      return {
        success: false,
        error: 'Cannot delete record due to existing relationships',
        code: ERROR_CODES.CONFLICT,
      }

    default:
      return {
        success: false,
        error: 'A database error occurred',
        code: ERROR_CODES.DATABASE_ERROR,
      }
  }
}

// ==========================================
// ERROR LOGGING
// ==========================================

/**
 * Log error to server (with full details)
 * In production: Send to error tracking service (Sentry, DataDog, etc.)
 * 
 * @param {any} error - Error to log
 * @param {Record<string, any>} context - Additional context
 */
function logErrorToServer(error: any, context?: Record<string, any>): void {
  // Development: Log to console
  if (process.env.NODE_ENV === 'development') {
    console.error('❌ Error occurred:', error)
    if (context) {
      console.error('Context:', context)
    }
    return
  }

  // Production: Send to error tracking
  // TODO: Integrate with Sentry/DataDog
  // Example Sentry:
  // Sentry.captureException(error, {
  //   extra: context,
  //   tags: {
  //     errorCode: error.code,
  //     errorName: error.name,
  //   }
  // })

  // Structured logging for production
  const errorLog = {
    timestamp: new Date().toISOString(),
    error: {
      name: error.name,
      message: error.message,
      code: error.code,
      stack: error.stack,
    },
    context,
  }

  // In production, send to logging service (CloudWatch, Datadog, etc.)
  console.error(JSON.stringify(errorLog))
}

/**
 * Get HTTP status code for error
 * 
 * @param {string} errorCode - Error code
 * @returns {number} HTTP status code
 */
export function getStatusCodeForError(errorCode: string): number {
  return ERROR_STATUS_MAP[errorCode] || 500
}

// ==========================================
// ERROR RESPONSE BUILDERS
// ==========================================

/**
 * Create authentication error response
 */
export function authenticationError(message?: string): ErrorResponse {
  return {
    success: false,
    error: message || 'Authentication required',
    code: ERROR_CODES.AUTHENTICATION_REQUIRED,
  }
}

/**
 * Create authorization error response
 */
export function authorizationError(message?: string): ErrorResponse {
  return {
    success: false,
    error: message || 'Insufficient permissions',
    code: ERROR_CODES.INSUFFICIENT_PERMISSIONS,
  }
}

/**
 * Create validation error response
 */
export function validationError(message: string, details?: any): ErrorResponse {
  return {
    success: false,
    error: message,
    code: ERROR_CODES.VALIDATION_ERROR,
    details: sanitizeDetails(details),
  }
}

/**
 * Create not found error response
 */
export function notFoundError(resource?: string): ErrorResponse {
  return {
    success: false,
    error: resource ? `${resource} not found` : 'Resource not found',
    code: ERROR_CODES.NOT_FOUND,
  }
}

/**
 * Create rate limit error response
 */
export function rateLimitError(retryAfterSeconds?: number): ErrorResponse {
  return {
    success: false,
    error: 'Rate limit exceeded',
    code: ERROR_CODES.RATE_LIMIT_EXCEEDED,
    message: retryAfterSeconds
      ? `Too many requests. Try again in ${retryAfterSeconds} seconds.`
      : 'Too many requests. Please try again later.',
  }
}

/**
 * Create internal error response
 */
export function internalError(): ErrorResponse {
  return {
    success: false,
    error: 'An internal error occurred',
    code: ERROR_CODES.INTERNAL_ERROR,
  }
}

// ==========================================
// ERROR BOUNDARY HELPERS
// ==========================================

/**
 * Wrap async function with error handling
 * Catches errors and returns sanitized response
 * 
 * @param {Function} fn - Async function to wrap
 * @returns {Function} Wrapped function
 * 
 * @example
 * ```typescript
 * export const POST = withErrorHandling(async (request: Request) => {
 *   const body = await request.json()
 *   const result = await processData(body)
 *   return NextResponse.json(result)
 * })
 * ```
 */
export function withErrorHandling<T extends (...args: any[]) => Promise<any>>(
  fn: T
): (...args: Parameters<T>) => Promise<ReturnType<T>> {
  return async (...args: Parameters<T>) => {
    try {
      return await fn(...args)
    } catch (error) {
      const sanitized = sanitizeError(error)
      const statusCode = getStatusCodeForError(sanitized.code)

      // Assume NextResponse available in context
      const { NextResponse } = await import('next/server')
      return NextResponse.json(sanitized, { status: statusCode })
    }
  }
}

/**
 * Check if error should be reported to tracking
 * Don't report expected errors (validation, not found, etc.)
 * 
 * @param {string} errorCode - Error code
 * @returns {boolean} True if should report
 */
export function shouldReportError(errorCode: string): boolean {
  const ignoredCodes: string[] = [
    ERROR_CODES.VALIDATION_ERROR,
    ERROR_CODES.NOT_FOUND,
    ERROR_CODES.AUTHENTICATION_REQUIRED,
    ERROR_CODES.RATE_LIMIT_EXCEEDED,
  ]

  return !ignoredCodes.includes(errorCode)
}
