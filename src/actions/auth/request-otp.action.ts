'use server'

import { prisma } from '@/lib/prisma'
import {
  requestOTPWithFullPhoneSchema,
  type OTPRequestResponse,
  type OTPErrorResponse,
} from '@/lib/validation/otp.schemas'
import {
  generateOTP,
  hashOTP,
  getOTPExpiration,
  checkOTPRateLimit,
  sendOTPSMS,
  storeOTP,
} from '@/lib/otp/otp.service'

// ==========================================
// TYPE DEFINITIONS
// ==========================================

type RequestOTPResponse = OTPRequestResponse | OTPErrorResponse

// ==========================================
// REQUEST OTP SERVER ACTION
// ==========================================

/**
 * Server Action: Request OTP for phone number authentication
 * 
 * Flow:
 * 1. Validate input (phone number format)
 * 2. Check rate limiting (3 requests per 15 minutes)
 * 3. Find or create user by phone number
 * 4. Generate 6-digit OTP
 * 5. Hash OTP using bcrypt
 * 6. Store hashed OTP in database with 5-minute expiration
 * 7. Send OTP via SMS (mock in development)
 * 8. Return success/failure response
 * 
 * @param {string} phone - Phone number in international format (e.g., +11234567890)
 * @returns {Promise<RequestOTPResponse>} Success or error response
 */
export async function requestOTP(
  phone: string
): Promise<RequestOTPResponse> {
  try {
    // ==========================================
    // STEP 1: Validate Input
    // ==========================================
    const validationResult = requestOTPWithFullPhoneSchema.safeParse({ phone })

    if (!validationResult.success) {
      return {
        success: false,
        error: 'Validation failed',
        code: 'INVALID_PHONE',
        message: 'Invalid phone number format. Use international format (e.g., +11234567890)',
      }
    }

    const validatedPhone = validationResult.data.phone

    console.log(`📞 OTP Request initiated for: ${validatedPhone}`)

    // ==========================================
    // STEP 2: Check Rate Limiting
    // ==========================================
    const rateLimitResult = await checkOTPRateLimit(validatedPhone)

    if (!rateLimitResult.allowed) {
      console.log(`⏱️  Rate limit exceeded for: ${validatedPhone}`)
      return {
        success: false,
        error: 'Rate limit exceeded',
        code: 'RATE_LIMIT_EXCEEDED',
        message:
          rateLimitResult.message ||
          'Too many OTP requests. Please try again later.',
      }
    }

    console.log(
      `✅ Rate limit check passed. Remaining: ${rateLimitResult.remainingRequests}`
    )

    // ==========================================
    // STEP 3: Find or Create User
    // ==========================================
    let user = await prisma.user.findUnique({
      where: { phone: validatedPhone },
      include: { role: true },
    })

    // If user doesn't exist, create a new user with MEMBER role
    if (!user) {
      console.log(`👤 Creating new user for: ${validatedPhone}`)

      // Find MEMBER role
      const memberRole = await prisma.role.findUnique({
        where: { name: 'MEMBER' },
      })

      if (!memberRole) {
        console.error('❌ MEMBER role not found in database')
        return {
          success: false,
          error: 'System configuration error',
          code: 'INTERNAL_ERROR',
          message: 'Unable to process request. Please contact support.',
        }
      }

      // Create new user
      user = await prisma.user.create({
        data: {
          phone: validatedPhone,
          name: `User ${validatedPhone.slice(-4)}`, // Temporary name
          email: null,
          roleId: memberRole.id,
          profileCompleted: false, // Explicitly set to false for new users
        },
        include: { role: true },
      })

      console.log(`✅ New user created: ${user.id}`)
    } else {
      console.log(`✅ Existing user found: ${user.id}`)
    }

    // ==========================================
    // STEP 4: Generate OTP
    // ==========================================
    const otp = generateOTP()
    console.log(`🔐 OTP generated (length: ${otp.length})`)

    // ==========================================
    // STEP 5: Hash OTP
    // ==========================================
    const hashedOTP = await hashOTP(otp)
    console.log(`🔒 OTP hashed securely`)

    // ==========================================
    // STEP 6: Store OTP in Database
    // ==========================================
    const OTP_EXPIRY_MINUTES = 5
    const expiresAt = getOTPExpiration(OTP_EXPIRY_MINUTES)

    await storeOTP(user.id, hashedOTP, expiresAt)
    console.log(`💾 OTP stored in database (expires: ${expiresAt.toISOString()})`)

    // ==========================================
    // STEP 7: Send OTP via SMS
    // ==========================================
    const smsResult = await sendOTPSMS(validatedPhone, otp)

    if (!smsResult.success) {
      console.error(`❌ SMS sending failed:`, smsResult.error)
      // Note: OTP is still stored in DB, user might retry
      return {
        success: false,
        error: 'SMS delivery failed',
        code: 'INTERNAL_ERROR',
        message: 'Failed to send OTP. Please try again.',
      }
    }

    console.log(`✅ OTP sent successfully (Message ID: ${smsResult.messageId})`)

    // ==========================================
    // STEP 8: Return Success Response
    // ==========================================
    const response: any = {
      success: true,
      message: 'OTP sent successfully',
      data: {
        phone: validatedPhone,
        expiresIn: OTP_EXPIRY_MINUTES * 60, // seconds
        expiresAt: expiresAt.toISOString(),
      },
    }

    // In development mode, include OTP for testing
    if (process.env.NODE_ENV === 'development') {
      response.data.otp = otp
      console.log(`🔓 DEV MODE - OTP: ${otp}`)
    }

    return response
  } catch (error) {
    // ==========================================
    // ERROR HANDLING
    // ==========================================
    console.error('❌ Error in requestOTP:', error)

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

      // Unique constraint violations
      if (error.message.includes('Unique constraint')) {
        return {
          success: false,
          error: 'Duplicate entry',
          code: 'INTERNAL_ERROR',
          message: 'An error occurred. Please try again.',
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
// HELPER: Get OTP Status (for debugging)
// ==========================================

/**
 * Get OTP status for a phone number (development/debugging only)
 * DO NOT expose this in production
 * 
 * @param {string} phone - Phone number
 * @returns {Promise<object>} OTP status information
 */
export async function getOTPStatus(phone: string) {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('This function is not available in production')
  }

  try {
    const user = await prisma.user.findUnique({
      where: { phone },
      include: {
        otps: {
          orderBy: { createdAt: 'desc' },
          take: 5,
        },
      },
    })

    if (!user) {
      return { exists: false, message: 'User not found' }
    }

    const activeOTPs = user.otps.filter((otp) => otp.expiresAt > new Date())

    return {
      exists: true,
      userId: user.id,
      phone: user.phone,
      totalOTPs: user.otps.length,
      activeOTPs: activeOTPs.length,
      latestOTP: user.otps[0]
        ? {
            createdAt: user.otps[0].createdAt,
            expiresAt: user.otps[0].expiresAt,
            expired: user.otps[0].expiresAt < new Date(),
          }
        : null,
    }
  } catch (error) {
    console.error('Error getting OTP status:', error)
    throw error
  }
}
