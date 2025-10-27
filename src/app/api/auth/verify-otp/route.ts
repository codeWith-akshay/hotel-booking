// ==========================================
// POST /api/auth/verify-otp - HARDENED VERSION
// ==========================================
// OTP verification endpoint with comprehensive security:
// - Rate limiting (per phone + per IP)
// - Brute-force protection (account locking)
// - Input validation (Zod)
// - Security event logging
// - Failed attempt tracking
// - Error sanitization

import { NextRequest, NextResponse } from 'next/server'
import { verifyOTPAction } from '@/actions/auth/verify-otp.action'
import { getRateLimiter, getClientIP, createRateLimitError, RATE_LIMIT_PRESETS } from '@/lib/rateLimiter'
import { validateOrThrow, CommonSchemas } from '@/lib/validation'
import { logSecurityEvent, logOTPAttempt, isPhoneLocked, getFailedOTPAttempts } from '@/lib/audit'
import { sanitizeError, getStatusCodeForError } from '@/lib/errorHandling'
import { z } from 'zod'

// ==========================================
// REQUEST VALIDATION SCHEMA
// ==========================================

const VerifyOTPSchema = z.object({
  phone: CommonSchemas.phone,
  otp: CommonSchemas.otpCode,
})

/**
 * POST /api/auth/verify-otp
 * 
 * Verify OTP and authenticate user
 * 
 * Security Features:
 * - Rate limited: 5 attempts per 10 min per phone
 * - Rate limited: 15 attempts per 10 min per IP
 * - Account locking after 5 failed attempts
 * - Brute-force detection and alerting
 * - All attempts logged
 * 
 * Request Body:
 * {
 *   "phone": "+14155551234",
 *   "otp": "123456"
 * }
 * 
 * Success Response (200):
 * {
 *   "success": true,
 *   "message": "OTP verified successfully",
 *   "data": {
 *     "userId": "uuid",
 *     "phone": "+14155551234",
 *     "token": "jwt_access_token"
 *   }
 * }
 * 
 * Error Responses:
 * - 400: Invalid phone/OTP format or wrong OTP
 * - 404: User not found or OTP not found
 * - 423: Account locked due to too many failed attempts
 * - 429: Rate limit exceeded
 * - 500: Internal server error
 */
export async function POST(request: NextRequest) {
  const clientIp = getClientIP(request)
  const userAgent = request.headers.get('user-agent') || undefined

  try {
    // ==========================================
    // 1. PARSE & VALIDATE INPUT
    // ==========================================
    const body = await request.json()
    const { phone, otp } = validateOrThrow(VerifyOTPSchema, body)

    // ==========================================
    // 2. CHECK IF ACCOUNT IS LOCKED
    // ==========================================
    const isLocked = await isPhoneLocked(phone, 5, 10) // 5 attempts in 10 minutes

    if (isLocked) {
      const failedCount = await getFailedOTPAttempts(phone, 10)

      // Log account locked event
      await logSecurityEvent({
        eventType: 'ACCOUNT_LOCKED',
        ip: clientIp,
        userAgent,
        severity: 'HIGH',
        message: `Account locked due to too many failed OTP attempts: ${phone}`,
        metadata: { phone, failedAttempts: failedCount },
      })

      return NextResponse.json(
        {
          success: false,
          error: 'Account temporarily locked',
          code: 'ACCOUNT_LOCKED',
          message: `Too many failed attempts. Please try again in 10 minutes.`,
        },
        { status: 423 }
      )
    }

    // ==========================================
    // 3. RATE LIMITING - Per Phone Number
    // ==========================================
    const rateLimiter = getRateLimiter()
    const phoneRateLimit = await rateLimiter.checkLimit(
      phone,
      RATE_LIMIT_PRESETS.OTP_VERIFY_PHONE
    )

    if (!phoneRateLimit.allowed) {
      await logSecurityEvent({
        eventType: 'RATE_LIMIT_EXCEEDED',
        ip: clientIp,
        userAgent,
        severity: 'MEDIUM',
        message: `OTP verification rate limit exceeded for phone: ${phone}`,
        metadata: { phone, limit: 'PHONE' },
      })

      return NextResponse.json(
        createRateLimitError(phoneRateLimit),
        { status: 429 }
      )
    }

    // ==========================================
    // 4. RATE LIMITING - Per IP Address
    // ==========================================
    const ipRateLimit = await rateLimiter.checkLimit(
      clientIp,
      RATE_LIMIT_PRESETS.OTP_VERIFY_IP
    )

    if (!ipRateLimit.allowed) {
      await logSecurityEvent({
        eventType: 'RATE_LIMIT_EXCEEDED',
        ip: clientIp,
        userAgent,
        severity: 'HIGH',
        message: `OTP verification rate limit exceeded for IP: ${clientIp}`,
        metadata: { phone, limit: 'IP', ip: clientIp },
      })

      return NextResponse.json(
        createRateLimitError(ipRateLimit),
        { status: 429 }
      )
    }

    // ==========================================
    // 5. VERIFY OTP
    // ==========================================
    const result = await verifyOTPAction(phone, otp)

    // ==========================================
    // 6. LOG ATTEMPT
    // ==========================================
    await logOTPAttempt({
      phone,
      ip: clientIp,
      attemptType: 'VERIFY',
      success: result.success,
      userAgent,
      metadata: { code: result.success ? 'SUCCESS' : (result as any).code },
    })

    // ==========================================
    // 7. LOG SECURITY EVENTS
    // ==========================================
    if (result.success) {
      // Success - log with low severity
      await logSecurityEvent({
        eventType: 'OTP_VERIFY_SUCCESS',
        userId: result.data?.userId,
        ip: clientIp,
        userAgent,
        severity: 'LOW',
        message: `OTP verified successfully for phone: ${phone}`,
        metadata: { phone },
      })

      console.log(`✅ OTP verified successfully for: ${phone}`)
    } else {
      // Failed verification - log with higher severity
      await logSecurityEvent({
        eventType: 'OTP_VERIFY_FAILED',
        ip: clientIp,
        userAgent,
        severity: 'MEDIUM',
        message: `OTP verification failed for phone: ${phone}`,
        metadata: { phone, reason: (result as any).code },
      })

      console.log(`❌ OTP verification failed for ${phone}: ${(result as any).code}`)

      // Check if approaching lockout threshold
      const recentFailures = await getFailedOTPAttempts(phone, 10)
      if (recentFailures >= 3) {
        await logSecurityEvent({
          eventType: 'SUSPICIOUS_ACTIVITY',
          ip: clientIp,
          userAgent,
          severity: 'MEDIUM',
          message: `Multiple failed OTP attempts detected: ${phone}`,
          metadata: { phone, failedCount: recentFailures },
        })
      }
    }

    // ==========================================
    // 8. RETURN RESPONSE
    // ==========================================
    if (result.success) {
      // Cookies are already set by verifyOTPAction via setSessionCookie()
      // Return success response
      return NextResponse.json(result, { status: 200 })
    }

    // Map error codes to HTTP status codes
    const errorStatusMap: Record<string, number> = {
      INVALID_PHONE: 400,
      INVALID_OTP: 400,
      VALIDATION_ERROR: 400,
      USER_NOT_FOUND: 404,
      OTP_NOT_FOUND: 404,
      OTP_EXPIRED: 410, // Gone
      INTERNAL_ERROR: 500,
    }

    const statusCode = errorStatusMap[(result as any).code] || 400

    return NextResponse.json(result, { status: statusCode })
  } catch (error) {
    // ==========================================
    // ERROR HANDLING
    // ==========================================
    
    await logSecurityEvent({
      eventType: 'SUSPICIOUS_ACTIVITY',
      ip: clientIp,
      userAgent,
      severity: 'HIGH',
      message: `Error in OTP verification endpoint: ${error instanceof Error ? error.message : 'Unknown'}`,
      metadata: { error: String(error) },
    })

    console.error('❌ Unexpected error in verify-otp route:', error)

    const sanitized = sanitizeError(error)
    const statusCode = getStatusCodeForError(sanitized.code)

    return NextResponse.json(sanitized, { status: statusCode })
  }
}


// ==========================================
// OPTIONS (CORS Preflight)
// ==========================================
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  })
}
