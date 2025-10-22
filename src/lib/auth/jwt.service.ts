import jwt from 'jsonwebtoken'
import { cookies } from 'next/headers'

// ==========================================
// JWT CONFIGURATION
// ==========================================

const JWT_ACCESS_SECRET = process.env.JWT_ACCESS_SECRET || 'your-access-secret-change-in-production'
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'your-refresh-secret-change-in-production'

const ACCESS_TOKEN_EXPIRY = '15m' // 15 minutes
const REFRESH_TOKEN_EXPIRY = '7d' // 7 days

// ==========================================
// TYPE DEFINITIONS
// ==========================================

export interface JWTPayload {
  userId: string
  phone: string
  email?: string | null
  name: string
  role: string
  roleId: string
}

export interface TokenPair {
  accessToken: string
  refreshToken: string
  expiresIn: number // seconds
  tokenType: 'Bearer'
}

export interface DecodedToken extends JWTPayload {
  iat: number
  exp: number
}

// ==========================================
// TOKEN GENERATION
// ==========================================

/**
 * Generate JWT access token
 * Short-lived token for API authentication
 * 
 * @param {JWTPayload} payload - User data to encode
 * @returns {string} Signed JWT access token
 */
export function generateAccessToken(payload: JWTPayload): string {
  return jwt.sign(payload, JWT_ACCESS_SECRET, {
    expiresIn: ACCESS_TOKEN_EXPIRY,
    algorithm: 'HS256',
  })
}

/**
 * Generate JWT refresh token
 * Long-lived token for obtaining new access tokens
 * 
 * @param {JWTPayload} payload - User data to encode
 * @returns {string} Signed JWT refresh token
 */
export function generateRefreshToken(payload: JWTPayload): string {
  return jwt.sign(
    { userId: payload.userId, phone: payload.phone },
    JWT_REFRESH_SECRET,
    {
      expiresIn: REFRESH_TOKEN_EXPIRY,
      algorithm: 'HS256',
    }
  )
}

/**
 * Generate both access and refresh tokens
 * 
 * @param {JWTPayload} payload - User data to encode
 * @returns {TokenPair} Access and refresh tokens
 */
export function generateTokenPair(payload: JWTPayload): TokenPair {
  const accessToken = generateAccessToken(payload)
  const refreshToken = generateRefreshToken(payload)

  return {
    accessToken,
    refreshToken,
    expiresIn: 15 * 60, // 15 minutes in seconds
    tokenType: 'Bearer',
  }
}

// ==========================================
// TOKEN VERIFICATION
// ==========================================

/**
 * Verify and decode access token
 * 
 * @param {string} token - JWT access token
 * @returns {DecodedToken | null} Decoded token or null if invalid
 */
export function verifyAccessToken(token: string): DecodedToken | null {
  try {
    const decoded = jwt.verify(token, JWT_ACCESS_SECRET) as DecodedToken
    return decoded
  } catch (error) {
    console.error('Access token verification failed:', error)
    return null
  }
}

/**
 * Verify and decode refresh token
 * 
 * @param {string} token - JWT refresh token
 * @returns {DecodedToken | null} Decoded token or null if invalid
 */
export function verifyRefreshToken(token: string): DecodedToken | null {
  try {
    const decoded = jwt.verify(token, JWT_REFRESH_SECRET) as DecodedToken
    return decoded
  } catch (error) {
    console.error('Refresh token verification failed:', error)
    return null
  }
}

// ==========================================
// SESSION COOKIE MANAGEMENT
// ==========================================

const COOKIE_NAME = 'auth-session'
const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  path: '/',
  maxAge: 60 * 60 * 24 * 7, // 7 days
}

/**
 * Set authentication session cookie
 * HTTP-only cookie for secure session management
 * 
 * @param {string} accessToken - JWT access token
 * @returns {Promise<void>}
 */
export async function setSessionCookie(accessToken: string): Promise<void> {
  const cookieStore = await cookies()
  cookieStore.set(COOKIE_NAME, accessToken, COOKIE_OPTIONS)
}

/**
 * Set refresh token cookie
 * HTTP-only cookie for refresh token storage
 * 
 * @param {string} refreshToken - JWT refresh token
 * @returns {Promise<void>}
 */
export async function setRefreshTokenCookie(refreshToken: string): Promise<void> {
  const cookieStore = await cookies()
  cookieStore.set('refresh-token', refreshToken, {
    ...COOKIE_OPTIONS,
    maxAge: 60 * 60 * 24 * 7, // 7 days
  })
}

/**
 * Get session cookie value
 * 
 * @returns {Promise<string | undefined>} Session token or undefined
 */
export async function getSessionCookie(): Promise<string | undefined> {
  const cookieStore = await cookies()
  return cookieStore.get(COOKIE_NAME)?.value
}

/**
 * Get refresh token cookie value
 * 
 * @returns {Promise<string | undefined>} Refresh token or undefined
 */
export async function getRefreshTokenCookie(): Promise<string | undefined> {
  const cookieStore = await cookies()
  return cookieStore.get('refresh-token')?.value
}

/**
 * Clear all authentication cookies
 * 
 * @returns {Promise<void>}
 */
export async function clearAuthCookies(): Promise<void> {
  const cookieStore = await cookies()
  cookieStore.delete(COOKIE_NAME)
  cookieStore.delete('refresh-token')
}

// ==========================================
// TOKEN UTILITIES
// ==========================================

/**
 * Extract token from Authorization header
 * 
 * @param {string} authHeader - Authorization header value
 * @returns {string | null} Token or null
 */
export function extractBearerToken(authHeader: string): string | null {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null
  }
  return authHeader.substring(7)
}

/**
 * Get time until token expiration
 * 
 * @param {DecodedToken} token - Decoded JWT token
 * @returns {number} Seconds until expiration
 */
export function getTokenTimeToExpiry(token: DecodedToken): number {
  const now = Math.floor(Date.now() / 1000)
  return Math.max(0, token.exp - now)
}

/**
 * Check if token is expired
 * 
 * @param {DecodedToken} token - Decoded JWT token
 * @returns {boolean} True if expired
 */
export function isTokenExpired(token: DecodedToken): boolean {
  const now = Math.floor(Date.now() / 1000)
  return token.exp < now
}

// ==========================================
// ENVIRONMENT VALIDATION
// ==========================================

/**
 * Validate JWT configuration on startup
 * Warns if using default secrets in production
 */
export function validateJWTConfig(): void {
  if (process.env.NODE_ENV === 'production') {
    if (!process.env.JWT_ACCESS_SECRET || !process.env.JWT_REFRESH_SECRET) {
      console.warn(
        '⚠️  WARNING: Using default JWT secrets in production. Set JWT_ACCESS_SECRET and JWT_REFRESH_SECRET environment variables!'
      )
    }
  }
}

// Run validation on module load
validateJWTConfig()
