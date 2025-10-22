// ==========================================
// PROFILE SERVER ACTIONS
// ==========================================
// Server-side actions for profile management
// Handles fetching, updating profile, and IRCA membership checks
// Production-ready with authentication, validation, and error handling

'use server'

import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/middleware/auth.utils'
import {
  ProfileUpdateSchema,
  IRCACheckRequestSchema,
  IRCAMembershipUpdateSchema,
  type ProfileUpdateData,
  type IRCAResponse,
} from '@/lib/validation/profile.schemas'
import { ircaService } from '@/lib/services/irca.service'

// ==========================================
// TYPE DEFINITIONS
// ==========================================

interface ActionResponse<T = unknown> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

// ==========================================
// PROFILE ACTIONS
// ==========================================

/**
 * Get current user's profile
 * Fetches complete profile data including role information
 * 
 * @returns {Promise<ActionResponse>} Profile data or error
 * 
 * @example
 * ```typescript
 * const result = await getProfileAction()
 * if (result.success) {
 *   console.log(result.data)
 * }
 * ```
 */
export async function getProfileAction(): Promise<ActionResponse> {
  try {
    // Get authenticated user from middleware
    const authUser = await getCurrentUser()

    if (!authUser) {
      return {
        success: false,
        error: 'UNAUTHORIZED',
        message: 'You must be logged in to view your profile',
      }
    }

    // Fetch complete user profile from database
    const user = await prisma.user.findUnique({
      where: { id: authUser.userId },
      include: {
        role: {
          select: {
            name: true,
            permissions: true,
          },
        },
      },
    })

    if (!user) {
      return {
        success: false,
        error: 'NOT_FOUND',
        message: 'User profile not found',
      }
    }

    // Return profile data
    return {
      success: true,
      data: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        roleId: user.roleId,
        role: user.role.name,
        ircaMembershipId: user.ircaMembershipId || null,
        createdAt: user.createdAt.toISOString(),
        updatedAt: user.updatedAt.toISOString(),
      },
      message: 'Profile retrieved successfully',
    }
  } catch (error) {
    console.error('[Profile Action] Error fetching profile:', error)
    return {
      success: false,
      error: 'SERVER_ERROR',
      message: 'Failed to fetch profile. Please try again later.',
    }
  }
}

/**
 * Update current user's profile
 * Validates and updates profile information
 * 
 * @param {ProfileUpdateData} data - Profile update data
 * @returns {Promise<ActionResponse>} Updated profile or error
 * 
 * @example
 * ```typescript
 * const result = await updateProfileAction({
 *   name: 'John Doe',
 *   email: 'john@example.com',
 *   phone: '+1234567890'
 * })
 * ```
 */
export async function updateProfileAction(
  data: ProfileUpdateData
): Promise<ActionResponse> {
  try {
    // Get authenticated user
    const authUser = await getCurrentUser()

    if (!authUser) {
      return {
        success: false,
        error: 'UNAUTHORIZED',
        message: 'You must be logged in to update your profile',
      }
    }

    // Validate input data
    const validation = ProfileUpdateSchema.safeParse(data)

    if (!validation.success) {
      const firstError = validation.error.issues[0]
      return {
        success: false,
        error: 'VALIDATION_ERROR',
        message: firstError?.message || 'Invalid profile data',
      }
    }

    // Check if email is already taken by another user
    if (validation.data.email) {
      const existingUser = await prisma.user.findFirst({
        where: {
          email: validation.data.email,
          NOT: { id: authUser.userId },
        },
      })

      if (existingUser) {
        return {
          success: false,
          error: 'EMAIL_EXISTS',
          message: 'This email is already registered to another account',
        }
      }
    }

    // Check if phone is already taken by another user
    const existingPhone = await prisma.user.findFirst({
      where: {
        phone: validation.data.phone,
        NOT: { id: authUser.userId },
      },
    })

    if (existingPhone) {
      return {
        success: false,
        error: 'PHONE_EXISTS',
        message: 'This phone number is already registered to another account',
      }
    }

    // Update user profile
    const updatedUser = await prisma.user.update({
      where: { id: authUser.userId },
      data: {
        name: validation.data.name,
        email: validation.data.email ?? null,
        phone: validation.data.phone,
      },
      include: {
        role: {
          select: {
            name: true,
          },
        },
      },
    })

    // Revalidate profile page
    revalidatePath('/profile')

    return {
      success: true,
      data: {
        id: updatedUser.id,
        name: updatedUser.name,
        email: updatedUser.email,
        phone: updatedUser.phone,
        roleId: updatedUser.roleId,
        role: (updatedUser as any).role.name,
        ircaMembershipId: updatedUser.ircaMembershipId,
        updatedAt: updatedUser.updatedAt.toISOString(),
      },
      message: 'Profile updated successfully',
    }
  } catch (error) {
    console.error('[Profile Action] Error updating profile:', error)
    return {
      success: false,
      error: 'SERVER_ERROR',
      message: 'Failed to update profile. Please try again later.',
    }
  }
}

// ==========================================
// IRCA MEMBERSHIP ACTIONS
// ==========================================

/**
 * Check IRCA membership status
 * Validates membership ID and retrieves membership data
 * 
 * @param {string} membershipId - IRCA membership ID
 * @returns {Promise<IRCAResponse>} Membership data or error
 * 
 * @example
 * ```typescript
 * const result = await checkIRCAMembershipAction('IRCA-2024-001')
 * if (result.success && result.data) {
 *   console.log(`Status: ${result.data.status}`)
 * }
 * ```
 */
export async function checkIRCAMembershipAction(
  membershipId: string
): Promise<IRCAResponse> {
  try {
    // Get authenticated user
    const authUser = await getCurrentUser()

    if (!authUser) {
      return {
        success: false,
        data: null,
        error: 'UNAUTHORIZED',
        message: 'You must be logged in to check membership status',
      }
    }

    // Validate membership ID format
    const validation = IRCACheckRequestSchema.safeParse({ membershipId })

    if (!validation.success) {
      const firstError = validation.error.issues[0]
      return {
        success: false,
        data: null,
        error: 'VALIDATION_ERROR',
        message: firstError?.message || 'Invalid membership ID format',
      }
    }

    // Check membership via IRCA service
    const membershipData = await ircaService.checkMembership(membershipId)

    // Log membership check
    console.log(
      `[IRCA Action] Membership check for ${membershipId} by user ${authUser.userId}`
    )

    return membershipData
  } catch (error) {
    console.error('[IRCA Action] Error checking membership:', error)
    return {
      success: false,
      data: null,
      error: 'SERVER_ERROR',
      message: 'Failed to check membership status. Please try again later.',
    }
  }
}

/**
 * Update user's IRCA membership ID
 * Links or unlinks IRCA membership to user profile
 * 
 * @param {string | null} membershipId - IRCA membership ID or null to unlink
 * @returns {Promise<ActionResponse>} Success or error
 * 
 * @example
 * ```typescript
 * // Link membership
 * const result = await updateIRCAMembershipAction('IRCA-2024-001')
 * 
 * // Unlink membership
 * const result = await updateIRCAMembershipAction(null)
 * ```
 */
export async function updateIRCAMembershipAction(
  membershipId: string | null
): Promise<ActionResponse> {
  try {
    // Get authenticated user
    const authUser = await getCurrentUser()

    if (!authUser) {
      return {
        success: false,
        error: 'UNAUTHORIZED',
        message: 'You must be logged in to update membership',
      }
    }

    // Validate membership ID format
    const validation = IRCAMembershipUpdateSchema.safeParse({
      ircaMembershipId: membershipId,
    })

    if (!validation.success) {
      const firstError = validation.error.issues[0]
      return {
        success: false,
        error: 'VALIDATION_ERROR',
        message: firstError?.message || 'Invalid membership ID format',
      }
    }

    // If membership ID provided, verify it exists in IRCA system
    if (membershipId) {
      const membershipCheck = await ircaService.checkMembership(membershipId)

      if (!membershipCheck.success) {
        return {
          success: false,
          error: 'MEMBERSHIP_NOT_FOUND',
          message:
            membershipCheck.message ||
            'Membership ID not found in IRCA system',
        }
      }
    }

    // Update user's IRCA membership ID
    await prisma.user.update({
      where: { id: authUser.userId },
      data: {
        ircaMembershipId: membershipId,
      },
    })

    // Revalidate profile page
    revalidatePath('/profile')

    return {
      success: true,
      message: membershipId
        ? 'IRCA membership linked successfully'
        : 'IRCA membership unlinked successfully',
    }
  } catch (error) {
    console.error('[IRCA Action] Error updating membership:', error)
    return {
      success: false,
      error: 'SERVER_ERROR',
      message: 'Failed to update membership. Please try again later.',
    }
  }
}

/**
 * Get current user's IRCA membership data
 * Fetches and verifies membership if linked to profile
 * 
 * @returns {Promise<IRCAResponse>} Membership data or error
 * 
 * @example
 * ```typescript
 * const result = await getCurrentMembershipAction()
 * if (result.success && result.data) {
 *   console.log(`Level: ${result.data.level}`)
 * }
 * ```
 */
export async function getCurrentMembershipAction(): Promise<IRCAResponse> {
  try {
    // Get authenticated user
    const authUser = await getCurrentUser()

    if (!authUser) {
      return {
        success: false,
        data: null,
        error: 'UNAUTHORIZED',
        message: 'You must be logged in to view membership',
      }
    }

    // Fetch user with membership ID
    const user = await prisma.user.findUnique({
      where: { id: authUser.userId },
      select: { ircaMembershipId: true },
    })

    if (!user || !user.ircaMembershipId) {
      return {
        success: false,
        data: null,
        error: 'NO_MEMBERSHIP',
        message: 'No IRCA membership linked to your account',
      }
    }

    // Check membership status
    const membershipData = await ircaService.checkMembership(
      user.ircaMembershipId
    )

    return membershipData
  } catch (error) {
    console.error('[IRCA Action] Error fetching current membership:', error)
    return {
      success: false,
      data: null,
      error: 'SERVER_ERROR',
      message: 'Failed to fetch membership data. Please try again later.',
    }
  }
}
