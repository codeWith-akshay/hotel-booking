// ==========================================
// TEST API ROUTE - Protected Endpoint
// ==========================================
// Test middleware authentication for MEMBER role

import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/middleware/auth.utils'

/**
 * GET /api/user/profile
 * Protected endpoint - requires MEMBER role or higher
 * Returns current user information
 */
export async function GET() {
  try {
    // Get authenticated user from middleware context
    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          error: 'Unauthorized',
          message: 'Authentication required',
        },
        { status: 401 }
      )
    }

    // Return user profile
    return NextResponse.json({
      success: true,
      data: {
        userId: user.userId,
        phone: user.phone,
        name: user.name,
        role: user.role,
      },
      message: 'Profile retrieved successfully',
    })
  } catch (error) {
    console.error('Profile endpoint error:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        message: 'Failed to retrieve profile',
      },
      { status: 500 }
    )
  }
}
