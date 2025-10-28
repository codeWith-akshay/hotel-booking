// ==========================================
// POST /api/auth/request-otp - HARDENED VERSION
// ==========================================
// OTP request endpoint with comprehensive security:
// - Rate limiting (per phone + per IP)
// - Input validation (Zod)
// - Security event logging
// - OTP attempt tracking
// - Error sanitization

import { NextRequest, NextResponse } from 'next/server'
import { requestOTP } from '@/actions/auth/request-otp.action'
import { getRateLimiter, getClientIP, createRateLimitError, RATE_LIMIT_PRESETS } from '@/lib/rateLimiter'
import { validateOrThrow, CommonSchemas } from '@/lib/validation'
import { logSecurityEvent, logOTPAttempt } from '@/lib/audit'
import { sanitizeError, getStatusCodeForError } from '@/lib/errorHandling'
import { z } from 'zod'

// ==========================================
// REQUEST VALIDATION SCHEMA
// ==========================================

const RequestOTPSchema = z.object({
  phone: CommonSchemas.phone,
})

/**
 * POST /api/auth/request-otp
 * 
 * Request an OTP for phone number authentication
 * 
 * Security Features:
 * - Rate limited: 3 requests per 5 min per phone
 * - Rate limited: 10 requests per 15 min per IP
 * - All attempts logged for security analysis
 * - Brute-force detection and alerting
 * 
 * @body {string} phone - Phone number in international format
 * @returns {Response} JSON response with OTP request status
 */
export async function POST(request: NextRequest) {
  const clientIp = getClientIP(request)
  const userAgent = request.headers.get('user-agent') || undefined

  try {
    // ==========================================
    // 1. PARSE & VALIDATE INPUT
    // ==========================================
    const body = await request.json()
    const { phone } = validateOrThrow(RequestOTPSchema, body)

    // ==========================================
    // 2. RATE LIMITING - Per Phone Number
    // ==========================================
    const rateLimiter = getRateLimiter()
    const phoneRateLimit = await rateLimiter.checkLimit(
      phone,
      RATE_LIMIT_PRESETS.OTP_REQUEST_PHONE
    )

    if (!phoneRateLimit.allowed) {
      // Log rate limit exceeded event
      await logSecurityEvent({
        eventType: 'RATE_LIMIT_EXCEEDED',
        ip: clientIp,
        userAgent,
        severity: 'MEDIUM',
        message: `OTP request rate limit exceeded for phone: ${phone}`,
        metadata: { phone, limit: 'PHONE', remaining: 0 },
      })

      return NextResponse.json(
        createRateLimitError(phoneRateLimit),
        { status: 429 }
      )
    }

    // ==========================================
    // 3. RATE LIMITING - Per IP Address
    // ==========================================
    const ipRateLimit = await rateLimiter.checkLimit(
      clientIp,
      RATE_LIMIT_PRESETS.OTP_REQUEST_IP
    )

    if (!ipRateLimit.allowed) {
      // Log rate limit exceeded event
      await logSecurityEvent({
        eventType: 'RATE_LIMIT_EXCEEDED',
        ip: clientIp,
        userAgent,
        severity: 'HIGH', // Higher severity for IP-based limits
        message: `OTP request rate limit exceeded for IP: ${clientIp}`,
        metadata: { phone, limit: 'IP', ip: clientIp },
      })

      return NextResponse.json(
        createRateLimitError(ipRateLimit),
        { status: 429 }
      )
    }

    // ==========================================
    // 4. PROCESS OTP REQUEST
    // ==========================================
    const result = await requestOTP(phone)

    // ==========================================
    // 5. LOG ATTEMPT
    // ==========================================
    await logOTPAttempt({
      phone,
      ip: clientIp,
      attemptType: 'REQUEST',
      success: result.success,
      userAgent,
      metadata: {},
    })

    // Log security event for successful request
    if (result.success) {
      await logSecurityEvent({
        eventType: 'OTP_REQUEST',
        ip: clientIp,
        userAgent,
        severity: 'LOW',
        message: `OTP requested for phone: ${phone}`,
        metadata: { phone },
      })
    }

    // ==========================================
    // 6. RETURN RESPONSE
    // ==========================================
    if (result.success) {
      return NextResponse.json(result, { status: 200 })
    } else {
      const statusCode = getStatusCode(result.code)
      return NextResponse.json(result, { status: statusCode })
    }
  } catch (error) {
    // ==========================================
    // ERROR HANDLING
    // ==========================================
    
    // Log security event for errors
    await logSecurityEvent({
      eventType: 'SUSPICIOUS_ACTIVITY',
      ip: clientIp,
      userAgent,
      severity: 'MEDIUM',
      message: `Error in OTP request endpoint: ${error instanceof Error ? error.message : 'Unknown'}`,
      metadata: { error: String(error) },
    })

    // Sanitize and return error
    const sanitized = sanitizeError(error)
    const statusCode = getStatusCodeForError(sanitized.code)

    return NextResponse.json(sanitized, { status: statusCode })
  }
}

/**
 * Map error codes to HTTP status codes
 */
function getStatusCode(code: string): number {
  const statusMap: Record<string, number> = {
    INVALID_PHONE: 400,
    VALIDATION_ERROR: 400,
    RATE_LIMIT_EXCEEDED: 429,
    USER_NOT_FOUND: 404,
    INTERNAL_ERROR: 500,
  }

  return statusMap[code] || 400
}

