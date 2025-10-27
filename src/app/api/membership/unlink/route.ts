import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/middleware/auth.utils'
import { prisma } from '@/lib/prisma'
import { ircaService } from '@/lib/services/irca.service'

/**
 * Unlink Membership API Endpoint
 * 
 * Allows users to unlink their IRCA membership ID from their profile
 * Clears cached membership data
 * 
 * POST /api/membership/unlink
 */

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

    // Get current user data
    const currentUser = await prisma.user.findUnique({
      where: {
        id: user.userId,
      },
      select: {
        id: true,
        ircaMembershipId: true,
      },
    })

    if (!currentUser) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      )
    }

    if (!currentUser.ircaMembershipId) {
      return NextResponse.json(
        {
          success: false,
          error: 'No membership linked to this account',
        },
        { status: 400 }
      )
    }

    // Clear cached membership data
    ircaService.clearCache(currentUser.ircaMembershipId)

    // Update user profile to remove membership ID
    const updatedUser = await prisma.user.update({
      where: {
        id: user.userId,
      },
      data: {
        ircaMembershipId: null,
      },
      select: {
        id: true,
        name: true,
        email: true,
        ircaMembershipId: true,
      },
    })

    console.log(
      `[API] Unlinked membership ${currentUser.ircaMembershipId} from user ${user.userId}`
    )

    return NextResponse.json({
      success: true,
      data: {
        user: updatedUser,
      },
      message: 'Membership unlinked successfully',
    })
  } catch (error) {
    console.error('[API] Unlink membership error:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'An unexpected error occurred. Please try again.',
      },
      { status: 500 }
    )
  }
}
