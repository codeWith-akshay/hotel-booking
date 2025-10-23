// ==========================================
// USER PROFILE API ROUTE - Protected Endpoint
// ==========================================
// Returns complete user profile with role information

import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/middleware/auth.utils'
import { getUserProfile } from '@/actions/auth/verify-otp.action'

/**
 * GET /api/user/profile
 * Protected endpoint - requires authentication
 * Returns complete user profile including role information
 */
export async function GET() {
  try {
    // Get authenticated user from middleware context
    const currentUser = await getCurrentUser()

    if (!currentUser) {
      return NextResponse.json(
        {
          success: false,
          error: 'Unauthorized',
          message: 'Authentication required',
        },
        { status: 401 }
      )
    }

    // Fetch complete user profile from database
    const userProfile = await getUserProfile(currentUser.userId)

    if (!userProfile) {
      return NextResponse.json(
        {
          success: false,
          error: 'User not found',
          message: 'User profile not found',
        },
        { status: 404 }
      )
    }

    console.log(`🔍 Profile API - User data:`, {
      id: userProfile.id,
      phone: userProfile.phone,
      roleId: userProfile.roleId,
      roleName: userProfile.role?.name,
    })

    // Return complete user profile
    return NextResponse.json({
      success: true,
      data: {
        id: userProfile.id,
        phone: userProfile.phone,
        name: userProfile.name,
        email: userProfile.email,
        role: {
          id: userProfile.role.id,
          name: userProfile.role.name,
          permissions: userProfile.role.permissions,
        },
        roleId: userProfile.roleId,
        createdAt: userProfile.createdAt,
        updatedAt: userProfile.updatedAt,
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
