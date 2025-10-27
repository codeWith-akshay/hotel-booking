/**
 * Update User Profile API Route
 * 
 * POST /api/user/update-profile
 * 
 * Updates user profile information after initial signup/login.
 * Requires JWT authentication via HTTP-only cookie.
 * Marks profile as complete after successful update.
 * 
 * Request Body:
 * - fullName: string (required)
 * - email: string (required, valid email)
 * - address: string (required)
 * - vipStatus: "VIP" | "Regular" (required)
 * 
 * Response:
 * - 200: Profile updated successfully
 * - 400: Validation error
 * - 401: Unauthorized (missing or invalid JWT)
 * - 409: Conflict (email already taken)
 * - 500: Internal server error
 */

import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { prisma } from '@/lib/prisma'
import { UpdateUserProfileSchema } from '@/lib/validation/user-profile.validation'
import { verifyAccessToken, generateTokenPair, setSessionCookie, setRefreshTokenCookie, type JWTPayload } from '@/lib/auth/jwt.service'
import type { VipStatus } from '@prisma/client'

export async function POST(request: NextRequest) {
  try {
    // ==========================================
    // 1. AUTHENTICATE USER VIA JWT COOKIE
    // ==========================================
    
    const cookieStore = await cookies()
    const authCookie = cookieStore.get('auth-session')
    
    if (!authCookie || !authCookie.value) {
      return NextResponse.json(
        {
          success: false,
          error: 'Unauthorized',
          message: 'Authentication required. Please log in.',
        },
        { status: 401 }
      )
    }

    // Verify JWT token
    const decoded = verifyAccessToken(authCookie.value)
    
    if (!decoded || !decoded.userId) {
      return NextResponse.json(
        {
          success: false,
          error: 'Unauthorized',
          message: 'Invalid or expired authentication token.',
        },
        { status: 401 }
      )
    }

    const userId = decoded.userId

    // ==========================================
    // 2. VERIFY USER EXISTS
    // ==========================================
    
    const existingUser = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        phone: true,
        email: true,
        profileCompleted: true,
      },
    })

    if (!existingUser) {
      return NextResponse.json(
        {
          success: false,
          error: 'Not Found',
          message: 'User not found.',
        },
        { status: 404 }
      )
    }

    // ==========================================
    // 3. PARSE AND VALIDATE REQUEST BODY
    // ==========================================
    
    let body
    try {
      body = await request.json()
    } catch (error) {
      return NextResponse.json(
        {
          success: false,
          error: 'Bad Request',
          message: 'Invalid JSON in request body.',
        },
        { status: 400 }
      )
    }

    // Validate with Zod schema
    const validation = UpdateUserProfileSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Validation Error',
          message: 'Invalid input data. Please check your fields.',
          issues: validation.error.issues.map((issue) => ({
            field: issue.path.join('.'),
            message: issue.message,
          })),
        },
        { status: 400 }
      )
    }

    const data = validation.data

    // ==========================================
    // 4. CHECK EMAIL AVAILABILITY
    // ==========================================
    
    if (data.email && data.email !== existingUser.email) {
      const emailExists = await prisma.user.findUnique({
        where: { email: data.email },
        select: { id: true },
      })

      if (emailExists && emailExists.id !== userId) {
        return NextResponse.json(
          {
            success: false,
            error: 'Conflict',
            message: 'This email address is already registered to another account.',
            field: 'email',
          },
          { status: 409 }
        )
      }
    }

    // ==========================================
    // 5. MAP VIP STATUS TO PRISMA ENUM
    // ==========================================
    
    // Map user-friendly status to Prisma enum
    const prismaVipStatus: VipStatus = data.vipStatus === 'VIP' ? 'VIP' : 'NONE'

    // ==========================================
    // 6. UPDATE USER PROFILE IN DATABASE
    // ==========================================
    
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        name: data.fullName,
        email: data.email,
        address: data.address,
        vipStatus: prismaVipStatus,
        profileCompleted: true, // Mark profile as complete
        updatedAt: new Date(),
      },
      select: {
        id: true,
        phone: true,
        name: true,
        email: true,
        address: true,
        vipStatus: true,
        profileCompleted: true,
        roleId: true,
        role: {
          select: {
            id: true,
            name: true,
          },
        },
        createdAt: true,
        updatedAt: true,
      },
    })

    // ==========================================
    // 7. REGENERATE JWT TOKENS WITH UPDATED PROFILE STATUS
    // ==========================================
    
    // Create new JWT payload with updated profile information
    const jwtPayload: JWTPayload = {
      userId: updatedUser.id,
      phone: updatedUser.phone,
      email: updatedUser.email,
      name: updatedUser.name,
      role: updatedUser.role.name,
      roleId: updatedUser.roleId,
      profileCompleted: true, // Now true after profile completion
    }

    // Generate new tokens
    const tokens = generateTokenPair(jwtPayload)

    // Set new HTTP-only cookies with updated tokens
    await setSessionCookie(tokens.accessToken)
    await setRefreshTokenCookie(tokens.refreshToken)

    console.log(`✅ Profile updated and new tokens generated for user ${updatedUser.id} (${updatedUser.phone})`)

    // ==========================================
    // 8. LOG SUCCESS AND RETURN RESPONSE
    // ==========================================
    // ==========================================
    // 8. LOG SUCCESS AND RETURN RESPONSE
    // ==========================================
    
    console.log(`✅ Profile updated for user ${updatedUser.id} (${updatedUser.phone})`)

    return NextResponse.json(
      {
        success: true,
        message: 'Profile updated successfully!',
        user: {
          id: updatedUser.id,
          phone: updatedUser.phone,
          name: updatedUser.name,
          email: updatedUser.email,
          address: updatedUser.address,
          vipStatus: updatedUser.vipStatus === 'VIP' ? 'VIP' : 'Regular',
          profileCompleted: updatedUser.profileCompleted,
          roleName: updatedUser.role.name,
        },
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('❌ [Update Profile API] Error:', error)

    return NextResponse.json(
      {
        success: false,
        error: 'Internal Server Error',
        message: 'An unexpected error occurred while updating your profile.',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

/**
 * GET method not supported
 */
export async function GET() {
  return NextResponse.json(
    {
      success: false,
      error: 'Method Not Allowed',
      message: 'GET method is not supported for this endpoint. Use POST instead.',
    },
    { status: 405 }
  )
}
