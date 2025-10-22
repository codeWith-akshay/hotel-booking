import { NextRequest, NextResponse } from 'next/server'
import { verifyOTPAction } from '@/actions/auth/verify-otp.action'

// ==========================================
// POST /api/auth/verify-otp
// ==========================================

/**
 * API Route: Verify OTP and authenticate user
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
 * - 500: Internal server error
 */
export async function POST(request: NextRequest) {
  try {
    // ==========================================
    // Parse Request Body
    // ==========================================
    const body = await request.json()
    const { phone, otp } = body

    // Basic validation
    if (!phone || !otp) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required fields',
          code: 'INVALID_PHONE',
          message: 'Phone number and OTP are required',
        },
        { status: 400 }
      )
    }

    // ==========================================
    // Call Server Action
    // ==========================================
    const result = await verifyOTPAction(phone, otp)

    // ==========================================
    // Handle Success
    // ==========================================
    if (result.success) {
      console.log(`✅ OTP verified successfully for: ${phone}`)
      return NextResponse.json(result, { status: 200 })
    }

    // ==========================================
    // Handle Errors with Status Codes
    // ==========================================
    const errorStatusMap: Record<string, number> = {
      INVALID_PHONE: 400,
      INVALID_OTP: 400,
      USER_NOT_FOUND: 404,
      OTP_NOT_FOUND: 404,
      OTP_EXPIRED: 410, // Gone
      INTERNAL_ERROR: 500,
    }

    const statusCode = errorStatusMap[result.code] || 400

    console.log(`❌ OTP verification failed for ${phone}: ${result.code}`)

    return NextResponse.json(result, { status: statusCode })
  } catch (error) {
    // ==========================================
    // Catch Unexpected Errors
    // ==========================================
    console.error('❌ Unexpected error in verify-otp route:', error)

    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        code: 'INTERNAL_ERROR',
        message: 'An unexpected error occurred',
      },
      { status: 500 }
    )
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
