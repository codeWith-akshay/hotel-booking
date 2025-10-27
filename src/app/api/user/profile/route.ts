// ==========================================
// USER PROFILE API ROUTE - Protected Endpoint
// ==========================================
// Returns complete user profile with role information

import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { verifyAccessToken } from '@/lib/auth/jwt.service'
import { getUserProfile } from '@/actions/auth/verify-otp.action'

/**
 * GET /api/user/profile
 * Protected endpoint - requires authentication
 * Returns complete user profile including role information
 */
export async function GET() {
  try {
    // Get JWT from cookies
    const cookieStore = await cookies()
    const authCookie = cookieStore.get('auth-session')
    
    if (!authCookie || !authCookie.value) {
      console.log('❌ Profile API: No auth cookie found')
      return NextResponse.json(
        {
          success: false,
          error: 'Unauthorized',
          message: 'Authentication required',
        },
        { status: 401 }
      )
    }

    // Verify JWT token
    const decoded = verifyAccessToken(authCookie.value)
    
    if (!decoded || !decoded.userId) {
      console.log('❌ Profile API: Invalid or expired token')
      return NextResponse.json(
        {
          success: false,
          error: 'Unauthorized',
          message: 'Invalid or expired authentication token',
        },
        { status: 401 }
      )
    }

    console.log('✅ Profile API: Token verified for user:', decoded.userId)

    // Fetch complete user profile from database
    const userProfile = await getUserProfile(decoded.userId)

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
      profileCompleted: (userProfile as any).profileCompleted,
    })

    // Return complete user profile
    return NextResponse.json({
      success: true,
      data: {
        id: userProfile.id,
        phone: userProfile.phone,
        name: userProfile.name,
        email: userProfile.email,
        address: (userProfile as any).address,
        profileCompleted: (userProfile as any).profileCompleted ?? false,
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
