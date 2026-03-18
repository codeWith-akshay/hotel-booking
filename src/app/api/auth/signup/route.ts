/**
 * Signup API Route
 * 
 * POST /api/auth/signup
 * 
 * Creates a new user account with email/password authentication.
 * Returns JWT tokens and sets HTTP-only cookies on success.
 * 
 * @module signup.route
 */

import { NextRequest, NextResponse } from 'next/server'
import { signupUserAction } from '@/actions/auth/signup.action'

/**
 * POST /api/auth/signup
 * 
 * Register a new user account
 * 
 * Request Body:
 * {
 *   "name": "John Doe",
 *   "email": "john@example.com",
 *   "password": "SecurePass123!",
 *   "confirmPassword": "SecurePass123!"
 * }
 * 
 * Success Response (201):
 * {
 *   "success": true,
 *   "message": "Account created successfully",
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
 * - 400: Validation error or email already exists
 * - 500: Internal server error
 */
export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body = await request.json()

    // Call signup action
    const result = await signupUserAction(body)

    // Return appropriate status code
    if (result.success) {
      return NextResponse.json(result, { status: 201 })
    }

    // Map error codes to HTTP status codes
    const errorStatusMap: Record<string, number> = {
      VALIDATION_ERROR: 400,
      EMAIL_EXISTS: 409,
      ROLE_NOT_FOUND: 500,
      DB_CONNECTION_ERROR: 503,
      INTERNAL_ERROR: 500,
    }

    const statusCode = errorStatusMap[result.code] || 400

    return NextResponse.json(result, { status: statusCode })
  } catch (error) {
    console.error('❌ Unexpected error in signup route:', error)

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
