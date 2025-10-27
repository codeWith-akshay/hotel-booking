import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/middleware/auth.utils'
import { ircaService } from '@/lib/services/irca.service'
import { z } from 'zod'

/**
 * Verify Membership API Endpoint
 * 
 * Verifies an IRCA membership ID without linking it to the profile
 * Useful for checking membership before linking
 * 
 * GET /api/membership/verify?membershipId=XXXX
 */

const VerifyQuerySchema = z.object({
  membershipId: z
    .string()
    .min(1, 'Membership ID is required')
    .max(50, 'Membership ID too long')
    .regex(/^[A-Z0-9-]+$/, 'Invalid membership ID format'),
})

export async function GET(req: NextRequest) {
  try {
    // Authenticate user
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Parse query parameters
    const { searchParams } = new URL(req.url)
    const membershipId = searchParams.get('membershipId')

    const validation = VerifyQuerySchema.safeParse({ membershipId })

    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: validation.error.issues[0]?.message || 'Invalid input',
        },
        { status: 400 }
      )
    }

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

    // Verify membership with IRCA API
    try {
      const membershipResponse = await ircaService.checkMembership(
        validation.data.membershipId,
        true // Force refresh for verification
      )

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

      // Check if membership is valid
      const isValid = ircaService.isMembershipValid(membershipResponse.data)
      const daysUntilExpiry = ircaService.getDaysUntilExpiry(membershipResponse.data)

      return NextResponse.json({
        success: true,
        data: {
          membership: membershipResponse.data,
          isValid,
          daysUntilExpiry,
        },
      })
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
  } catch (error) {
    console.error('[API] Verify membership error:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'An unexpected error occurred. Please try again.',
      },
      { status: 500 }
    )
  }
}
