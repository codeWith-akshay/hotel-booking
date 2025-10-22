'use server'

import { prisma } from '@/lib/prisma'
import {
  verifyOTPSchema,
  type OTPVerifyResponse,
  type OTPErrorResponse,
} from '@/lib/validation/otp.schemas'
import { verifyOTP } from '@/lib/otp/otp.service'
import {
  generateTokenPair,
  setSessionCookie,
  setRefreshTokenCookie,
  type JWTPayload,
} from '@/lib/auth/jwt.service'

// ==========================================
// TYPE DEFINITIONS
// ==========================================

type VerifyOTPResponse = OTPVerifyResponse | OTPErrorResponse

export interface UserWithRole {
  id: string
  phone: string
  name: string
  email: string | null
  role: {
    id: string
    name: string
    permissions: any
  }
  createdAt: Date
  updatedAt: Date
}

// ==========================================
// VERIFY OTP SERVER ACTION
// ==========================================

/**
 * Server Action: Verify OTP and authenticate user
 * 
 * Flow:
 * 1. Validate input (phone + OTP)
 * 2. Find user by phone number
 * 3. Retrieve latest valid OTP from database
 * 4. Verify OTP hash matches
 * 5. Check OTP expiration
 * 6. Create user if doesn't exist (with MEMBER role)
 * 7. Delete used OTP
 * 8. Generate JWT tokens (access + refresh)
 * 9. Set HTTP-only session cookies
 * 10. Return user info + tokens
 * 
 * @param {string} phone - Phone number in international format
 * @param {string} otp - 6-digit OTP code
 * @returns {Promise<VerifyOTPResponse>} Success with tokens or error
 */
export async function verifyOTPAction(
  phone: string,
  otp: string
): Promise<VerifyOTPResponse> {
  try {
    // ==========================================
    // STEP 1: Validate Input
    // ==========================================
    const validationResult = verifyOTPSchema.safeParse({ phone, otp })

    if (!validationResult.success) {
      return {
        success: false,
        error: 'Validation failed',
        code: 'INVALID_PHONE',
        message: 'Invalid phone number or OTP format',
      }
    }

    const { phone: validatedPhone, otp: validatedOTP } = validationResult.data

    console.log(`🔐 OTP Verification initiated for: ${validatedPhone}`)

    // ==========================================
    // STEP 2: Find User by Phone
    // ==========================================
    let user = await prisma.user.findUnique({
      where: { phone: validatedPhone },
      include: {
        role: true,
        otps: {
          where: {
            expiresAt: {
              gt: new Date(), // Only non-expired OTPs
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
          take: 1,
        },
      },
    })

    // ==========================================
    // STEP 3: Handle Non-Existent User
    // ==========================================
    if (!user) {
      console.log(`❌ User not found for phone: ${validatedPhone}`)
      return {
        success: false,
        error: 'User not found',
        code: 'USER_NOT_FOUND',
        message: 'No account found with this phone number. Please request a new OTP.',
      }
    }

    // ==========================================
    // STEP 4: Check if OTP Exists
    // ==========================================
    if (!user.otps || user.otps.length === 0) {
      console.log(`❌ No valid OTP found for user: ${user.id}`)
      return {
        success: false,
        error: 'OTP not found or expired',
        code: 'OTP_NOT_FOUND',
        message: 'OTP has expired or does not exist. Please request a new OTP.',
      }
    }

    const storedOTP = user.otps[0]
    
    // Type guard to ensure storedOTP exists
    if (!storedOTP) {
      console.log(`❌ No valid OTP found for user: ${user.id}`)
      return {
        success: false,
        error: 'OTP not found',
        code: 'OTP_NOT_FOUND',
        message: 'OTP does not exist. Please request a new OTP.',
      }
    }

    // ==========================================
    // STEP 5: Verify OTP Hash
    // ==========================================
    const isOTPValid = await verifyOTP(validatedOTP, storedOTP.otpHash)

    if (!isOTPValid) {
      console.log(`❌ Invalid OTP provided for user: ${user.id}`)
      return {
        success: false,
        error: 'Invalid OTP',
        code: 'INVALID_OTP',
        message: 'The OTP you entered is incorrect. Please try again.',
      }
    }

    console.log(`✅ OTP verified successfully for user: ${user.id}`)

    // ==========================================
    // STEP 6: Delete Used OTP
    // ==========================================
    await prisma.oTP.delete({
      where: { id: storedOTP.id },
    })

    console.log(`🗑️  OTP deleted after successful verification`)

    // Also delete any other expired OTPs for this user
    await prisma.oTP.deleteMany({
      where: {
        userId: user.id,
        expiresAt: {
          lt: new Date(),
        },
      },
    })

    // ==========================================
    // STEP 7: Prepare JWT Payload
    // ==========================================
    const jwtPayload: JWTPayload = {
      userId: user.id,
      phone: user.phone,
      email: user.email,
      name: user.name,
      role: user.role.name,
      roleId: user.roleId,
    }

    // ==========================================
    // STEP 8: Generate Tokens
    // ==========================================
    const tokens = generateTokenPair(jwtPayload)

    console.log(`🎫 Tokens generated for user: ${user.id}`)

    // ==========================================
    // STEP 9: Set HTTP-Only Cookies
    // ==========================================
    await setSessionCookie(tokens.accessToken)
    await setRefreshTokenCookie(tokens.refreshToken)

    console.log(`🍪 Session cookies set for user: ${user.id}`)

    // ==========================================
    // STEP 10: Return Success Response
    // ==========================================
    return {
      success: true,
      message: 'OTP verified successfully',
      data: {
        userId: user.id,
        phone: user.phone,
        token: tokens.accessToken, // Optional: for mobile apps
      },
    }
  } catch (error) {
    // ==========================================
    // ERROR HANDLING
    // ==========================================
    console.error('❌ Error in verifyOTPAction:', error)

    // Check for specific error types
    if (error instanceof Error) {
      // Database connection errors
      if (error.message.includes('connect')) {
        return {
          success: false,
          error: 'Database connection error',
          code: 'INTERNAL_ERROR',
          message: 'Unable to connect to database. Please try again later.',
        }
      }

      // Prisma errors
      if (error.message.includes('Prisma')) {
        return {
          success: false,
          error: 'Database error',
          code: 'INTERNAL_ERROR',
          message: 'A database error occurred. Please try again.',
        }
      }
    }

    // Generic error response
    return {
      success: false,
      error: 'Internal server error',
      code: 'INTERNAL_ERROR',
      message: 'An unexpected error occurred. Please try again later.',
    }
  }
}

// ==========================================
// HELPER: Get User Profile (Authenticated)
// ==========================================

/**
 * Get authenticated user's full profile
 * Requires valid session token
 * 
 * @param {string} userId - User ID from JWT token
 * @returns {Promise<UserWithRole | null>} User with role or null
 */
export async function getUserProfile(
  userId: string
): Promise<UserWithRole | null> {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        role: true,
      },
    })

    return user
  } catch (error) {
    console.error('Error fetching user profile:', error)
    return null
  }
}

// ==========================================
// HELPER: Update User Info
// ==========================================

/**
 * Update user information after successful OTP verification
 * Typically used to add email or update name
 * 
 * @param {string} userId - User ID
 * @param {object} data - Data to update
 * @returns {Promise<boolean>} Success status
 */
export async function updateUserInfo(
  userId: string,
  data: { name?: string; email?: string }
): Promise<boolean> {
  try {
    await prisma.user.update({
      where: { id: userId },
      data,
    })

    console.log(`✅ User info updated for: ${userId}`)
    return true
  } catch (error) {
    console.error('Error updating user info:', error)
    return false
  }
}
