/**
 * Complete Profile API Route
 * 
 * POST /api/user/complete-profile
 * 
 * Updates user profile with complete information after first OTP login.
 * Requires JWT authentication and MEMBER role.
 * 
 * Request Body:
 * - fullName: string (required, min 3 chars)
 * - email: string (required, valid email)
 * - address: string (required)
 * - vipStatus: 'NONE' | 'VIP' | 'STAFF' (default: 'NONE')
 * - profilePicture: string (optional, URL)
 * - termsAccepted: boolean (required, must be true)
 * 
 * Response:
 * - 200: Profile updated successfully with user object
 * - 400: Validation error
 * - 401: Unauthorized (missing or invalid JWT)
 * - 403: Forbidden (not MEMBER role)
 * - 409: Conflict (email already taken)
 * - 500: Internal server error
 */

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { CompleteProfileSchema } from '@/lib/validation/profile.validation'
import { verifyAccessToken } from '@/lib/auth/jwt.service'

export async function POST(request: NextRequest) {
  try {
    // ==========================================
    // 1. AUTHENTICATE USER
    // ==========================================
    
    const authHeader = request.headers.get('authorization')
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        {
          success: false,
          error: 'Unauthorized',
          message: 'Missing or invalid authentication token',
        },
        { status: 401 }
      )
    }

    const token = authHeader.substring(7) // Remove 'Bearer ' prefix
    
    const decoded = verifyAccessToken(token)
    
    if (!decoded || !decoded.userId) {
      return NextResponse.json(
        {
          success: false,
          error: 'Unauthorized',
          message: 'Invalid token payload',
        },
        { status: 401 }
      )
    }

    // ==========================================
    // 2. VERIFY USER EXISTS AND ROLE
    // ==========================================
    
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      include: {
        role: true,
      },
    })

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          error: 'Not Found',
          message: 'User not found',
        },
        { status: 404 }
      )
    }

    // Check if user is MEMBER role
    if (user.role.name !== 'MEMBER') {
      return NextResponse.json(
        {
          success: false,
          error: 'Forbidden',
          message: 'This endpoint is only accessible to MEMBER users',
        },
        { status: 403 }
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
          message: 'Invalid JSON in request body',
        },
        { status: 400 }
      )
    }

    // Validate with Zod schema
    const validation = CompleteProfileSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Validation Error',
          message: 'Invalid input data',
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
    
    if (data.email && data.email !== user.email) {
      const emailExists = await prisma.user.findUnique({
        where: { email: data.email },
      })

      if (emailExists && emailExists.id !== user.id) {
        return NextResponse.json(
          {
            success: false,
            error: 'Conflict',
            message: 'Email address is already registered to another account',
            field: 'email',
          },
          { status: 409 }
        )
      }
    }

    // ==========================================
    // 5. UPDATE USER PROFILE
    // ==========================================
    
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        name: data.fullName,
        email: data.email,
        address: data.address,
        vipStatus: data.vipStatus,
        profilePicture: data.profilePicture || null,
        termsAccepted: data.termsAccepted,
        profileCompleted: true,
        updatedAt: new Date(),
      },
      select: {
        id: true,
        phone: true,
        name: true,
        email: true,
        address: true,
        vipStatus: true,
        profilePicture: true,
        profileCompleted: true,
        termsAccepted: true,
        roleId: true,
        createdAt: true,
        updatedAt: true,
        role: {
          select: {
            name: true,
          },
        },
      },
    })

    // ==========================================
    // 6. LOG PROFILE COMPLETION
    // ==========================================
    
    console.log(`✅ Profile completed for user ${updatedUser.id} (${updatedUser.phone})`)

    // ==========================================
    // 7. RETURN SUCCESS RESPONSE
    // ==========================================
    
    return NextResponse.json(
      {
        success: true,
        message: 'Profile completed successfully',
        user: {
          id: updatedUser.id,
          phone: updatedUser.phone,
          name: updatedUser.name,
          email: updatedUser.email,
          address: updatedUser.address,
          vipStatus: updatedUser.vipStatus,
          profilePicture: updatedUser.profilePicture,
          profileCompleted: updatedUser.profileCompleted,
          termsAccepted: updatedUser.termsAccepted,
          roleName: updatedUser.role.name,
        },
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('❌ [Complete Profile API] Error:', error)

    return NextResponse.json(
      {
        success: false,
        error: 'Internal Server Error',
        message: 'An unexpected error occurred while updating profile',
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
