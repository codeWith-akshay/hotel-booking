/**
 * Login API Route
 * 
 * POST /api/auth/login
 * 
 * Authenticates user with email/password.
 * Returns JWT tokens and sets HTTP-only cookies on success.
 * 
 * @module login.route
 */

import { NextRequest, NextResponse } from 'next/server'
import { loginUserAction } from '@/actions/auth/login.action'

/**
 * POST /api/auth/login
 * 
 * Authenticate user with email and password
 * 
 * Request Body:
 * {
 *   "email": "john@example.com",
 *   "password": "SecurePass123!"
 * }
 * 
 * Success Response (200):
 * {
 *   "success": true,
 *   "message": "Login successful",
 *   "data": {
 *     "userId": "cuid",
 *     "email": "john@example.com",
 *     "name": "John Doe",
 *     "role": "MEMBER",
 *     "token": "jwt_token"
 *   }
 * }
 * 
 * Error Responses:
 * - 400: Validation error
 * - 401: Invalid credentials
 * - 500: Internal server error
 */
export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body = await request.json()

    // Call login action
    const result = await loginUserAction(body)

    // Return appropriate status code
    if (result.success) {
      return NextResponse.json(result, { status: 200 })
    }

    // Map error codes to HTTP status codes
    const errorStatusMap: Record<string, number> = {
      VALIDATION_ERROR: 400,
      INVALID_CREDENTIALS: 401,
      DB_CONNECTION_ERROR: 503,
      INTERNAL_ERROR: 500,
    }

    const statusCode = errorStatusMap[result.code] || 400

    return NextResponse.json(result, { status: statusCode })
  } catch (error) {
    console.error('❌ Unexpected error in login route:', error)

    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        code: 'INTERNAL_ERROR',
        message: 'An unexpected error occurred. Please try again later.',
      },
      { status: 500 }
    )
  }
}

/**
 * OPTIONS handler for CORS preflight requests
 */
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  })
}
