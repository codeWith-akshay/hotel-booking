// ==========================================
// CSRF (Cross-Site Request Forgery) Protection
// ==========================================
// Production-ready CSRF protection for server actions and API routes
//
// Strategy: Double-Submit Cookie Pattern
// - Generate random CSRF token
// - Store in secure, SameSite cookie
// - Require token in request header/body
// - Verify tokens match
//
// Features:
// - Automatic token generation
// - Secure cookie storage (HttpOnly, SameSite=Strict)
// - Origin validation
// - Request method filtering (POST, PUT, DELETE, PATCH)
// - Integration with Next.js middleware
//
// @see https://owasp.org/www-community/attacks/csrf
// @see https://cheatsheetseries.owasp.org/cheatsheets/Cross-Site_Request_Forgery_Prevention_Cheat_Sheet.html

import { cookies } from 'next/headers'
import { randomBytes } from 'crypto'

// ==========================================
// CONFIGURATION
// ==========================================

const CSRF_TOKEN_COOKIE_NAME = 'csrf-token'
const CSRF_TOKEN_HEADER_NAME = 'x-csrf-token'
const CSRF_TOKEN_BODY_FIELD = 'csrfToken'
const CSRF_TOKEN_LENGTH = 32 // bytes

const CSRF_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict' as const,
  path: '/',
  maxAge: 60 * 60 * 24, // 24 hours
}

/**
 * HTTP methods that require CSRF protection
 */
const PROTECTED_METHODS = ['POST', 'PUT', 'DELETE', 'PATCH']

/**
 * Paths that are exempt from CSRF checks
 * Useful for public APIs, webhooks, etc.
 */
const CSRF_EXEMPT_PATHS = [
  '/api/auth/request-otp', // Allow OTP requests without CSRF (initial entry point)
  '/api/webhooks', // Webhook endpoints use signature verification instead
]

// ==========================================
// TYPE DEFINITIONS
// ==========================================

export interface CSRFValidationResult {
  valid: boolean
  error?: string
  code?: string
}

export interface CSRFTokenInfo {
  token: string
  createdAt: number
}

// ==========================================
// CSRF ERRORS
// ==========================================

export class CSRFError extends Error {
  code: string
  statusCode: number

  constructor(message: string, code: string = 'CSRF_VALIDATION_FAILED') {
    super(message)
    this.name = 'CSRFError'
    this.code = code
    this.statusCode = 403

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, CSRFError)
    }
  }
}

// ==========================================
// TOKEN GENERATION
// ==========================================

/**
 * Generate cryptographically secure CSRF token
 * 
 * @returns {string} Base64-encoded random token
 */
export function generateCSRFToken(): string {
  const token = randomBytes(CSRF_TOKEN_LENGTH).toString('base64url')
  return token
}

/**
 * Set CSRF token cookie
 * Creates new token if one doesn't exist
 * 
 * @returns {Promise<string>} The CSRF token
 */
export async function setCSRFCookie(): Promise<string> {
  const cookieStore = await cookies()
  
  // Check if token already exists
  let token = cookieStore.get(CSRF_TOKEN_COOKIE_NAME)?.value

  if (!token) {
    // Generate new token
    token = generateCSRFToken()
    
    cookieStore.set(CSRF_TOKEN_COOKIE_NAME, token, CSRF_COOKIE_OPTIONS)
  }

  return token
}

/**
 * Get CSRF token from cookie
 * 
 * @returns {Promise<string | null>} CSRF token or null if not set
 */
export async function getCSRFTokenFromCookie(): Promise<string | null> {
  const cookieStore = await cookies()
  return cookieStore.get(CSRF_TOKEN_COOKIE_NAME)?.value || null
}

/**
 * Get or create CSRF token
 * Use this in pages/components to include token in forms
 * 
 * @returns {Promise<string>} CSRF token
 */
export async function getCSRFToken(): Promise<string> {
  return await setCSRFCookie()
}

/**
 * Delete CSRF token cookie
 */
export async function clearCSRFToken(): Promise<void> {
  const cookieStore = await cookies()
  cookieStore.delete(CSRF_TOKEN_COOKIE_NAME)
}

// ==========================================
// TOKEN VERIFICATION
// ==========================================

/**
 * Extract CSRF token from request
 * Checks header first, then body
 * 
 * @param {Request} request - HTTP request
 * @param {any} body - Parsed request body (optional)
 * @returns {string | null} CSRF token from request
 */
export function extractCSRFTokenFromRequest(request: Request, body?: any): string | null {
  // Check header
  const headerToken = request.headers.get(CSRF_TOKEN_HEADER_NAME)
  if (headerToken) {
    return headerToken
  }

  // Check body
  if (body && typeof body === 'object' && CSRF_TOKEN_BODY_FIELD in body) {
    return body[CSRF_TOKEN_BODY_FIELD]
  }

  return null
}

/**
 * Verify CSRF token matches cookie
 * 
 * @param {string} tokenFromRequest - Token from request header/body
 * @param {string} tokenFromCookie - Token from cookie
 * @returns {boolean} True if tokens match
 */
export function verifyCSRFToken(tokenFromRequest: string, tokenFromCookie: string): boolean {
  // Use constant-time comparison to prevent timing attacks
  if (!tokenFromRequest || !tokenFromCookie) {
    return false
  }

  if (tokenFromRequest.length !== tokenFromCookie.length) {
    return false
  }

  // Constant-time string comparison
  let result = 0
  for (let i = 0; i < tokenFromRequest.length; i++) {
    result |= tokenFromRequest.charCodeAt(i) ^ tokenFromCookie.charCodeAt(i)
  }

  return result === 0
}

/**
 * Check if path is exempt from CSRF protection
 * 
 * @param {string} pathname - Request pathname
 * @returns {boolean} True if path is exempt
 */
export function isCSRFExemptPath(pathname: string): boolean {
  return CSRF_EXEMPT_PATHS.some((exemptPath) => pathname.startsWith(exemptPath))
}

/**
 * Check if request method requires CSRF protection
 * 
 * @param {string} method - HTTP method
 * @returns {boolean} True if method requires protection
 */
export function requiresCSRFProtection(method: string): boolean {
  return PROTECTED_METHODS.includes(method.toUpperCase())
}

// ==========================================
// ORIGIN VALIDATION
// ==========================================

/**
 * Validate request origin matches host
 * Additional protection against CSRF attacks
 * 
 * @param {Request} request - HTTP request
 * @returns {boolean} True if origin is valid
 */
export function validateOrigin(request: Request): boolean {
  const origin = request.headers.get('origin')
  const referer = request.headers.get('referer')
  const host = request.headers.get('host')

  if (!host) {
    return false
  }

  // If origin header exists, validate it
  if (origin) {
    try {
      const originUrl = new URL(origin)
      return originUrl.host === host
    } catch {
      return false
    }
  }

  // If referer exists, validate it
  if (referer) {
    try {
      const refererUrl = new URL(referer)
      return refererUrl.host === host
    } catch {
      return false
    }
  }

  // For same-site requests without origin/referer (e.g., from server actions)
  // Allow if no origin/referer header (Next.js server actions)
  return true
}

// ==========================================
// COMPREHENSIVE CSRF VALIDATION
// ==========================================

/**
 * Validate CSRF token for incoming request
 * Checks token, origin, and method
 * 
 * @param {Request} request - HTTP request
 * @param {any} body - Parsed request body (optional)
 * @returns {Promise<CSRFValidationResult>} Validation result
 * 
 * @example
 * ```typescript
 * // API Route
 * export async function POST(request: Request) {
 *   const body = await request.json()
 *   const csrfResult = await validateCSRF(request, body)
 *   
 *   if (!csrfResult.valid) {
 *     return NextResponse.json(
 *       { error: csrfResult.error, code: csrfResult.code },
 *       { status: 403 }
 *     )
 *   }
 *   
 *   // Proceed with protected action
 * }
 * ```
 */
export async function validateCSRF(
  request: Request,
  body?: any
): Promise<CSRFValidationResult> {
  const method = request.method.toUpperCase()
  const pathname = new URL(request.url).pathname

  // Skip CSRF check for safe methods
  if (!requiresCSRFProtection(method)) {
    return { valid: true }
  }

  // Skip CSRF check for exempt paths
  if (isCSRFExemptPath(pathname)) {
    return { valid: true }
  }

  // Validate origin
  if (!validateOrigin(request)) {
    console.warn('🔒 CSRF: Invalid origin', {
      origin: request.headers.get('origin'),
      referer: request.headers.get('referer'),
      host: request.headers.get('host'),
      path: pathname,
    })

    return {
      valid: false,
      error: 'Invalid request origin',
      code: 'INVALID_ORIGIN',
    }
  }

  // Get tokens
  const cookieToken = await getCSRFTokenFromCookie()
  const requestToken = extractCSRFTokenFromRequest(request, body)

  // Check if cookie token exists
  if (!cookieToken) {
    console.warn('🔒 CSRF: Missing cookie token', { path: pathname })

    return {
      valid: false,
      error: 'CSRF token missing. Please refresh the page.',
      code: 'CSRF_TOKEN_MISSING',
    }
  }

  // Check if request token exists
  if (!requestToken) {
    console.warn('🔒 CSRF: Missing request token', { path: pathname })

    return {
      valid: false,
      error: 'CSRF token required in request',
      code: 'CSRF_TOKEN_REQUIRED',
    }
  }

  // Verify tokens match
  if (!verifyCSRFToken(requestToken, cookieToken)) {
    console.warn('🔒 CSRF: Token mismatch', { path: pathname })

    return {
      valid: false,
      error: 'Invalid CSRF token',
      code: 'CSRF_TOKEN_INVALID',
    }
  }

  return { valid: true }
}

/**
 * Require valid CSRF token or throw error
 * Use in server actions and API routes
 * 
 * @param {Request} request - HTTP request
 * @param {any} body - Parsed request body (optional)
 * @throws {CSRFError} If CSRF validation fails
 * 
 * @example
 * ```typescript
 * export async function POST(request: Request) {
 *   const body = await request.json()
 *   await requireCSRF(request, body)
 *   
 *   // Proceed with protected action
 * }
 * ```
 */
export async function requireCSRF(request: Request, body?: any): Promise<void> {
  const result = await validateCSRF(request, body)

  if (!result.valid) {
    throw new CSRFError(result.error || 'CSRF validation failed', result.code)
  }
}

// ==========================================
// UTILITY FUNCTIONS
// ==========================================

/**
 * Create CSRF error response
 * 
 * @param {CSRFError} error - CSRF error
 * @returns {object} Error response object
 */
export function csrfErrorToResponse(error: CSRFError) {
  return {
    success: false,
    error: error.message,
    code: error.code,
    statusCode: error.statusCode,
  }
}

/**
 * Check if error is a CSRF error
 * 
 * @param {any} error - Error to check
 * @returns {boolean} True if error is CSRFError
 */
export function isCSRFError(error: any): error is CSRFError {
  return error instanceof CSRFError
}

/**
 * Get CSRF token for inclusion in client-side requests
 * Call this from server components to pass to client
 * 
 * @returns {Promise<string>} CSRF token for client use
 */
export async function getCSRFTokenForClient(): Promise<string> {
  return await getCSRFToken()
}
