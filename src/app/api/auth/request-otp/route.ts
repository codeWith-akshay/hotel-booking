import { NextRequest, NextResponse } from 'next/server'
import { requestOTP } from '@/actions/auth/request-otp.action'

/**
 * POST /api/auth/request-otp
 * 
 * Request an OTP for phone number authentication
 * 
 * @body {string} phone - Phone number in international format
 * @returns {Response} JSON response with OTP request status
 */
export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body = await request.json()
    const { phone } = body

    // Validate phone presence
    if (!phone) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required field',
          code: 'INVALID_PHONE',
          message: 'Phone number is required',
        },
        { status: 400 }
      )
    }

    // Call server action
    const result = await requestOTP(phone)

    // Return appropriate status code
    if (result.success) {
      return NextResponse.json(result, { status: 200 })
    } else {
      // Map error codes to HTTP status codes
      const statusCode = getStatusCode(result.code)
      return NextResponse.json(result, { status: statusCode })
    }
  } catch (error) {
    console.error('API Route Error:', error)
    
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

/**
 * Map error codes to HTTP status codes
 */
function getStatusCode(code: string): number {
  const statusMap: Record<string, number> = {
    INVALID_PHONE: 400,
    RATE_LIMIT_EXCEEDED: 429,
    USER_NOT_FOUND: 404,
    INTERNAL_ERROR: 500,
  }

  return statusMap[code] || 400
}
