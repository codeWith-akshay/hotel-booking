/**
 * Profile Completion Check Utilities
 * 
 * Helper functions to check and enforce profile completion requirements
 * for users after OTP login.
 * 
 * Security Features:
 * - Client-side checks for UX
 * - Server-side enforcement via middleware
 * - Prevents bypassing profile setup
 */

import { prisma } from '@/lib/prisma'

// ==========================================
// TYPE DEFINITIONS
// ==========================================

export interface ProfileCheckResult {
  completed: boolean
  userId: string
  redirectTo?: string
  message?: string
}

// ==========================================
// SERVER-SIDE CHECKS
// ==========================================

/**
 * Check if a user has completed their profile
 * Server-side database check
 * 
 * @param {string} userId - User ID to check
 * @returns {Promise<boolean>} True if profile is completed
 * 
 * @example
 * const isComplete = await isProfileCompleted(userId)
 * if (!isComplete) {
 *   redirect('/profile/setup')
 * }
 */
export async function isProfileCompleted(userId: string): Promise<boolean> {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        profileCompleted: true,
      },
    })

    return user?.profileCompleted ?? false
  } catch (error) {
    console.error('Error checking profile completion:', error)
    return false
  }
}

/**
 * Get detailed profile completion status
 * Returns information about missing fields
 * 
 * @param {string} userId - User ID to check
 * @returns {Promise<ProfileCheckResult>} Detailed status
 * 
 * @example
 * const status = await getProfileCompletionStatus(userId)
 * if (!status.completed) {
 *   return redirect(status.redirectTo!)
 * }
 */
export async function getProfileCompletionStatus(
  userId: string
): Promise<ProfileCheckResult> {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        profileCompleted: true,
        name: true,
        email: true,
        address: true,
      },
    })

    if (!user) {
      return {
        completed: false,
        userId,
        redirectTo: '/login',
        message: 'User not found',
      }
    }

    // Check if profile is marked as completed
    if (user.profileCompleted) {
      return {
        completed: true,
        userId: user.id,
      }
    }

    // Profile not completed
    return {
      completed: false,
      userId: user.id,
      redirectTo: '/profile/setup',
      message: 'Please complete your profile to continue',
    }
  } catch (error) {
    console.error('Error getting profile status:', error)
    return {
      completed: false,
      userId,
      redirectTo: '/profile/setup',
      message: 'Error checking profile status',
    }
  }
}

/**
 * Require profile completion for a route
 * Throws error if profile not completed
 * 
 * @param {string} userId - User ID to check
 * @throws {Error} If profile is not completed
 * 
 * @example
 * // In a server component or API route:
 * await requireProfileCompletion(userId)
 * // Continues only if profile is completed
 */
export async function requireProfileCompletion(userId: string): Promise<void> {
  const status = await getProfileCompletionStatus(userId)

  if (!status.completed) {
    throw new Error('PROFILE_INCOMPLETE')
  }
}

// ==========================================
// CLIENT-SIDE UTILITIES
// ==========================================

/**
 * Check if profile is completed from JWT payload
 * Client-side check based on token data
 * 
 * @param {any} user - User object from JWT/session
 * @returns {boolean} True if profile is completed
 * 
 * @example
 * const user = useSessionStore().user
 * if (!isProfileCompletedFromToken(user)) {
 *   router.push('/profile/setup')
 * }
 */
export function isProfileCompletedFromToken(user: any): boolean {
  return user?.profileCompleted === true
}

/**
 * Check if current route requires profile completion
 * Helper for client-side routing logic
 * 
 * @param {string} pathname - Current route pathname
 * @returns {boolean} True if route requires completed profile
 * 
 * @example
 * if (requiresProfileCompletion(pathname) && !user.profileCompleted) {
 *   router.push('/profile/setup')
 * }
 */
export function requiresProfileCompletion(pathname: string): boolean {
  // Routes that require profile completion
  const protectedRoutes = [
    '/dashboard',
    '/admin',
    '/superadmin',
    '/bookings',
    '/profile', // User's own profile page (not setup)
  ]

  // Check if pathname starts with any protected route
  return protectedRoutes.some((route) => pathname.startsWith(route))
}

/**
 * Get profile setup URL with return path
 * Generates setup URL with query params
 * 
 * @param {string} returnPath - Path to return to after setup
 * @returns {string} Profile setup URL with return path
 * 
 * @example
 * const setupUrl = getProfileSetupUrl('/dashboard')
 * router.push(setupUrl)
 * // Redirects to: /profile/setup?returnTo=/dashboard
 */
export function getProfileSetupUrl(returnPath?: string): string {
  const baseUrl = '/profile/setup'
  
  if (returnPath) {
    const url = new URL(baseUrl, window.location.origin)
    url.searchParams.set('returnTo', returnPath)
    url.searchParams.set('message', 'Please complete your profile to continue')
    return url.pathname + url.search
  }

  return baseUrl
}

// ==========================================
// VALIDATION HELPERS
// ==========================================

/**
 * Check if all required profile fields are filled
 * Used for manual validation
 * 
 * @param {object} user - User object to validate
 * @returns {boolean} True if all required fields are present
 * 
 * @example
 * if (hasRequiredProfileFields(user)) {
 *   // Allow access
 * }
 */
export function hasRequiredProfileFields(user: {
  name?: string | null
  email?: string | null
  address?: string | null
}): boolean {
  return !!(
    user.name &&
    user.name.trim().length > 0 &&
    user.email &&
    user.email.trim().length > 0 &&
    user.address &&
    user.address.trim().length > 0
  )
}

/**
 * Get list of missing profile fields
 * For showing specific requirements to user
 * 
 * @param {object} user - User object to check
 * @returns {string[]} Array of missing field names
 * 
 * @example
 * const missing = getMissingProfileFields(user)
 * if (missing.length > 0) {
 *   console.log(`Please complete: ${missing.join(', ')}`)
 * }
 */
export function getMissingProfileFields(user: {
  name?: string | null
  email?: string | null
  address?: string | null
}): string[] {
  const missing: string[] = []

  if (!user.name || user.name.trim().length === 0) {
    missing.push('Full Name')
  }

  if (!user.email || user.email.trim().length === 0) {
    missing.push('Email Address')
  }

  if (!user.address || user.address.trim().length === 0) {
    missing.push('Address')
  }

  return missing
}
