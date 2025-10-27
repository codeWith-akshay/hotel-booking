import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/middleware/auth.utils'
import { prisma } from '@/lib/prisma'
import { ircaService } from '@/lib/services/irca.service'
import { z } from 'zod'

/**
 * Link Membership API Endpoint
 * 
 * Allows users to link their IRCA membership ID to their profile
 * Verifies membership with IRCA API before linking
 * 
 * POST /api/membership/link
 * Body: { membershipId: string }
 */

const LinkMembershipSchema = z.object({
  membershipId: z
    .string()
    .min(1, 'Membership ID is required')
    .max(50, 'Membership ID too long')
    .regex(/^[A-Z0-9-]+$/, 'Invalid membership ID format'),
})

export async function POST(req: NextRequest) {
  try {
    // Authenticate user
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Parse request body
    const body = await req.json()
    const validation = LinkMembershipSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: validation.error.issues[0]?.message || 'Invalid input',
        },
        { status: 400 }
      )
    }

    const { membershipId } = validation.data

    // Check if IRCA API is configured
    if (!ircaService.isConfigured()) {
      return NextResponse.json(
        {
          success: false,
          error:
            'Membership verification is temporarily unavailable. Please try again later.',
        },
        { status: 503 }
      )
    }

    // Check if membership ID is already linked to another user
    const existingLink = await prisma.user.findFirst({
      where: {
        ircaMembershipId: membershipId,
        NOT: {
          id: user.userId,
        },
      },
    })

    if (existingLink) {
      return NextResponse.json(
        {
          success: false,
          error: 'This membership ID is already linked to another account',
        },
        { status: 409 }
      )
    }

    // Verify membership with IRCA API
    let membershipResponse
    try {
      membershipResponse = await ircaService.checkMembership(membershipId, true) // Force refresh
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error'

      // Parse error type
      if (errorMessage.includes('NOT_FOUND')) {
        return NextResponse.json(
          {
            success: false,
            error: 'Membership ID not found. Please check and try again.',
          },
          { status: 404 }
        )
      }

      if (errorMessage.includes('TIMEOUT')) {
        return NextResponse.json(
          {
            success: false,
            error:
              'Verification timed out. Please check your connection and try again.',
          },
          { status: 504 }
        )
      }

      if (errorMessage.includes('UNAUTHORIZED')) {
        return NextResponse.json(
          {
            success: false,
            error:
              'Membership verification is temporarily unavailable. Please try again later.',
          },
          { status: 503 }
        )
      }

      console.error('[API] Membership verification error:', error)
      return NextResponse.json(
        {
          success: false,
          error:
            'Failed to verify membership. Please try again later or contact support.',
        },
        { status: 500 }
      )
    }

    // Check if verification succeeded
    if (!membershipResponse.success || !membershipResponse.data) {
      return NextResponse.json(
        {
          success: false,
          error: membershipResponse.message || 'Failed to verify membership',
        },
        { status: 400 }
      )
    }

    // Update user profile with membership ID
    const updatedUser = await prisma.user.update({
      where: {
        id: user.userId,
      },
      data: {
        ircaMembershipId: membershipId,
      },
      select: {
        id: true,
        name: true,
        email: true,
        ircaMembershipId: true,
      },
    })

    console.log(
      `[API] Linked membership ${membershipId} to user ${user.userId}`
    )

    return NextResponse.json({
      success: true,
      data: {
        user: updatedUser,
        membership: membershipResponse.data,
      },
      message: 'Membership linked successfully',
    })
  } catch (error) {
    console.error('[API] Link membership error:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'An unexpected error occurred. Please try again.',
      },
      { status: 500 }
    )
  }
}
