/**
 * Enhanced Profile Validation Helpers
 * 
 * Validates actual profile fields instead of just relying on profileCompleted flag.
 * Checks for: fullName (name), address, phoneNumber (phone)
 */

import { prisma } from '@/lib/prisma'

// ==========================================
// TYPE DEFINITIONS
// ==========================================

export interface ProfileValidationResult {
  isComplete: boolean
  missingFields: string[]
  userId: string
}

export interface UserProfileData {
  id: string
  phone: string
  name: string
  email: string | null
  address: string | null
  profileCompleted: boolean
}

// ==========================================
// PROFILE VALIDATION LOGIC
// ==========================================

/**
 * Check if user profile has all required fields
 * Required fields: name (fullName), address, phone
 * 
 * @param user - User object with profile fields
 * @returns boolean - true if all required fields are present
 */
export function hasCompleteProfile(user: {
  name?: string | null
  address?: string | null
  phone?: string | null
  email?: string | null
}): boolean {
  // Check all required fields
  const hasName = Boolean(user.name && user.name.trim().length > 0)
  const hasAddress = Boolean(user.address && user.address.trim().length > 0)
  const hasPhone = Boolean(user.phone && user.phone.trim().length > 0)
  
  // Optional: You can also require email
  // const hasEmail = Boolean(user.email && user.email.trim().length > 0)
  
  return hasName && hasAddress && hasPhone
}

/**
 * Get detailed profile validation status
 * Returns which fields are missing
 * 
 * @param user - User object with profile fields
 * @returns ProfileValidationResult with missing fields
 */
export function validateProfile(user: {
  id: string
  name?: string | null
  address?: string | null
  phone?: string | null
  email?: string | null
}): ProfileValidationResult {
  const missingFields: string[] = []
  
  if (!user.name || user.name.trim().length === 0) {
    missingFields.push('Full Name')
  }
  
  if (!user.address || user.address.trim().length === 0) {
    missingFields.push('Address')
  }
  
  if (!user.phone || user.phone.trim().length === 0) {
    missingFields.push('Phone Number')
  }
  
  // Optional: Add email check if required
  // if (!user.email || user.email.trim().length === 0) {
  //   missingFields.push('Email')
  // }
  
  return {
    isComplete: missingFields.length === 0,
    missingFields,
    userId: user.id,
  }
}

// ==========================================
// SERVER-SIDE CHECKS (with Database)
// ==========================================

/**
 * Validate user profile from database
 * Checks actual field values, not just profileCompleted flag
 * 
 * @param userId - User ID to validate
 * @returns ProfileValidationResult
 */
export async function validateUserProfileFromDB(
  userId: string
): Promise<ProfileValidationResult> {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        phone: true,
        name: true,
        email: true,
        address: true,
        profileCompleted: true,
      },
    })

    if (!user) {
      return {
        isComplete: false,
        missingFields: ['User not found'],
        userId,
      }
    }

    return validateProfile(user)
  } catch (error) {
    console.error('Error validating user profile:', error)
    return {
      isComplete: false,
      missingFields: ['Database error'],
      userId,
    }
  }
}

/**
 * Check if user should be redirected to profile setup
 * Returns true if profile is incomplete
 * 
 * @param userId - User ID to check
 * @returns boolean - true if needs to complete profile
 */
export async function needsProfileSetup(userId: string): Promise<boolean> {
  const validation = await validateUserProfileFromDB(userId)
  return !validation.isComplete
}

// ==========================================
// JWT/TOKEN BASED CHECKS (no DB query)
// ==========================================

/**
 * Validate profile from JWT token payload
 * Fast check without database query
 * Use this in middleware for performance
 * 
 * @param tokenPayload - JWT payload with user data
 * @returns boolean - true if profile is complete
 */
export function validateProfileFromToken(tokenPayload: {
  name?: string | null
  phone?: string | null
  email?: string | null
  profileCompleted?: boolean
}): boolean {
  // Primary check: Use profileCompleted flag if available and true
  if (tokenPayload.profileCompleted === true) {
    return true
  }
  
  // Secondary check: Validate actual fields
  // Note: JWT doesn't contain 'address', so we rely on profileCompleted flag
  // If profileCompleted is false or undefined, profile is incomplete
  return false
}

/**
 * Enhanced token validation with field checks
 * Checks if token has minimum required fields
 * 
 * @param tokenPayload - JWT payload
 * @returns boolean
 */
export function hasMinimumTokenFields(tokenPayload: {
  userId?: string
  phone?: string
  name?: string
  role?: string
}): boolean {
  return Boolean(
    tokenPayload.userId &&
    tokenPayload.phone &&
    tokenPayload.name &&
    tokenPayload.role
  )
}

// ==========================================
// PROFILE UPDATE HELPERS
// ==========================================

/**
 * Update profile and mark as completed
 * Validates all fields before marking as complete
 * 
 * @param userId - User ID
 * @param profileData - Profile data to update
 * @returns Updated user or null
 */
export async function updateUserProfile(
  userId: string,
  profileData: {
    name: string
    email?: string | null
    address: string
  }
) {
  try {
    // Validate the data first
    const validation = validateProfile({
      id: userId,
      name: profileData.name,
      address: profileData.address,
      phone: 'existing', // Assume phone exists from OTP
      email: profileData.email ?? null,
    })

    if (!validation.isComplete) {
      throw new Error(`Missing fields: ${validation.missingFields.join(', ')}`)
    }

    // Update in database
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        name: profileData.name,
        email: profileData.email ?? null,
        address: profileData.address,
        profileCompleted: true, // Mark as complete only if fields are valid
        updatedAt: new Date(),
      },
      select: {
        id: true,
        phone: true,
        name: true,
        email: true,
        address: true,
        profileCompleted: true,
        roleId: true,
        role: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    })

    return updatedUser
  } catch (error) {
    console.error('Error updating user profile:', error)
    return null
  }
}

// ==========================================
// MIGRATION HELPER
// ==========================================

/**
 * Sync profileCompleted flag with actual field values
 * Run this to fix any inconsistencies
 * 
 * @param userId - User ID to sync
 */
export async function syncProfileCompletedFlag(userId: string): Promise<void> {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        phone: true,
        name: true,
        email: true,
        address: true,
        profileCompleted: true,
      },
    })

    if (!user) return

    const validation = validateProfile(user)
    
    // Update flag only if it doesn't match actual state
    if (user.profileCompleted !== validation.isComplete) {
      await prisma.user.update({
        where: { id: userId },
        data: { profileCompleted: validation.isComplete },
      })
      
      console.log(
        `✅ Synced profileCompleted for user ${userId}: ${validation.isComplete}`
      )
    }
  } catch (error) {
    console.error('Error syncing profile flag:', error)
  }
}

/**
 * Bulk sync all users' profileCompleted flags
 * Run this once to ensure database consistency
 */
export async function syncAllProfileFlags(): Promise<void> {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        phone: true,
        name: true,
        email: true,
        address: true,
        profileCompleted: true,
      },
    })

    console.log(`🔄 Syncing ${users.length} users...`)

    let updated = 0
    for (const user of users) {
      const validation = validateProfile(user)
      
      if (user.profileCompleted !== validation.isComplete) {
        await prisma.user.update({
          where: { id: user.id },
          data: { profileCompleted: validation.isComplete },
        })
        updated++
      }
    }

    console.log(`✅ Synced ${updated} users with inconsistent flags`)
  } catch (error) {
    console.error('Error in bulk sync:', error)
  }
}
