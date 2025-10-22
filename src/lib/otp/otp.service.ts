import { prisma } from '@/lib/prisma'
import * as bcrypt from 'bcryptjs'

// ==========================================
// OTP GENERATION & UTILITIES
// ==========================================

/**
 * Generate a random 6-digit OTP
 * @returns {string} 6-digit OTP as string
 */
export function generateOTP(): string {
  const otp = Math.floor(100000 + Math.random() * 900000).toString()
  return otp
}

/**
 * Hash OTP using bcrypt for secure storage
 * @param {string} otp - Plain text OTP
 * @returns {Promise<string>} Hashed OTP
 */
export async function hashOTP(otp: string): Promise<string> {
  const saltRounds = 10
  return await bcrypt.hash(otp, saltRounds)
}

/**
 * Verify OTP against stored hash
 * @param {string} plainOTP - Plain text OTP from user
 * @param {string} hashedOTP - Hashed OTP from database
 * @returns {Promise<boolean>} True if OTP matches
 */
export async function verifyOTP(
  plainOTP: string,
  hashedOTP: string
): Promise<boolean> {
  return await bcrypt.compare(plainOTP, hashedOTP)
}

/**
 * Calculate OTP expiration time
 * @param {number} minutes - Minutes until expiration
 * @returns {Date} Expiration date
 */
export function getOTPExpiration(minutes: number = 5): Date {
  return new Date(Date.now() + minutes * 60 * 1000)
}

// ==========================================
// RATE LIMITING
// ==========================================

interface RateLimitResult {
  allowed: boolean
  remainingRequests: number
  resetTime: Date
  message?: string
}

/**
 * Check rate limit for OTP requests per phone number
 * Limits: 3 requests per 15 minutes per phone number
 * 
 * @param {string} phone - Phone number to check
 * @returns {Promise<RateLimitResult>} Rate limit status
 */
export async function checkOTPRateLimit(
  phone: string
): Promise<RateLimitResult> {
  const RATE_LIMIT_WINDOW = 15 // minutes
  const MAX_REQUESTS = 3

  const windowStart = new Date(Date.now() - RATE_LIMIT_WINDOW * 60 * 1000)

  try {
    // Find user by phone
    const user = await prisma.user.findUnique({
      where: { phone },
      include: {
        otps: {
          where: {
            createdAt: {
              gte: windowStart,
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
        },
      },
    })

    // If user doesn't exist, allow the request (will be handled later)
    if (!user) {
      return {
        allowed: true,
        remainingRequests: MAX_REQUESTS,
        resetTime: new Date(Date.now() + RATE_LIMIT_WINDOW * 60 * 1000),
      }
    }

    const requestCount = user.otps.length

    if (requestCount >= MAX_REQUESTS) {
      const oldestRequest = user.otps[user.otps.length - 1]
      if (!oldestRequest) {
        return {
          allowed: true,
          remainingRequests: MAX_REQUESTS,
          resetTime: new Date(Date.now() + RATE_LIMIT_WINDOW * 60 * 1000),
        }
      }
      
      const resetTime = new Date(
        oldestRequest.createdAt.getTime() + RATE_LIMIT_WINDOW * 60 * 1000
      )

      return {
        allowed: false,
        remainingRequests: 0,
        resetTime,
        message: `Too many OTP requests. Please try again after ${resetTime.toLocaleTimeString()}`,
      }
    }

    return {
      allowed: true,
      remainingRequests: MAX_REQUESTS - requestCount,
      resetTime: new Date(Date.now() + RATE_LIMIT_WINDOW * 60 * 1000),
    }
  } catch (error) {
    console.error('Rate limit check error:', error)
    // On error, allow the request to prevent blocking legitimate users
    return {
      allowed: true,
      remainingRequests: MAX_REQUESTS,
      resetTime: new Date(Date.now() + RATE_LIMIT_WINDOW * 60 * 1000),
    }
  }
}

// ==========================================
// MOCK SMS SERVICE
// ==========================================

interface SMSResult {
  success: boolean
  messageId?: string
  error?: string
}

/**
 * Mock SMS service for development
 * In production, replace with actual SMS provider (Twilio, AWS SNS, etc.)
 * 
 * @param {string} phone - Recipient phone number
 * @param {string} otp - OTP code to send
 * @returns {Promise<SMSResult>} SMS sending result
 */
export async function sendOTPSMS(
  phone: string,
  otp: string
): Promise<SMSResult> {
  // Simulate network delay
  await new Promise((resolve) => setTimeout(resolve, 500))

  // Log OTP to console in development
  if (process.env.NODE_ENV === 'development') {
    console.log('📱 [MOCK SMS SERVICE]')
    console.log(`   To: ${phone}`)
    console.log(`   OTP: ${otp}`)
    console.log(`   Message: Your verification code is ${otp}. Valid for 5 minutes.`)
    console.log('   ' + '─'.repeat(60))
  }

  // Simulate 99% success rate
  const isSuccess = Math.random() > 0.01

  if (isSuccess) {
    return {
      success: true,
      messageId: `mock_sms_${Date.now()}_${Math.random().toString(36).substring(7)}`,
    }
  } else {
    return {
      success: false,
      error: 'SMS delivery failed (simulated error)',
    }
  }
}

/**
 * Production SMS service integration (placeholder)
 * Uncomment and configure when ready for production
 */
/*
import twilio from 'twilio'

const twilioClient = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
)

export async function sendOTPSMS(
  phone: string,
  otp: string
): Promise<SMSResult> {
  try {
    const message = await twilioClient.messages.create({
      body: `Your verification code is ${otp}. Valid for 5 minutes.`,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: phone,
    })

    return {
      success: true,
      messageId: message.sid,
    }
  } catch (error: any) {
    console.error('Twilio SMS error:', error)
    return {
      success: false,
      error: error.message || 'Failed to send SMS',
    }
  }
}
*/

// ==========================================
// DATABASE OPERATIONS
// ==========================================

/**
 * Store OTP in database with expiration
 * Deletes any existing non-expired OTPs for the user
 * 
 * @param {string} userId - User ID
 * @param {string} hashedOTP - Hashed OTP
 * @param {Date} expiresAt - Expiration date
 * @returns {Promise<void>}
 */
export async function storeOTP(
  userId: string,
  hashedOTP: string,
  expiresAt: Date
): Promise<void> {
  try {
    // Delete expired OTPs for this user
    await prisma.oTP.deleteMany({
      where: {
        userId,
        expiresAt: {
          lt: new Date(),
        },
      },
    })

    // Store new OTP
    await prisma.oTP.create({
      data: {
        userId,
        otpHash: hashedOTP,
        expiresAt,
      },
    })
  } catch (error) {
    console.error('Error storing OTP:', error)
    throw new Error('Failed to store OTP')
  }
}

/**
 * Clean up expired OTPs from database
 * Should be run periodically (e.g., via cron job)
 * 
 * @returns {Promise<number>} Number of deleted OTPs
 */
export async function cleanupExpiredOTPs(): Promise<number> {
  try {
    const result = await prisma.oTP.deleteMany({
      where: {
        expiresAt: {
          lt: new Date(),
        },
      },
    })

    if (result.count > 0) {
      console.log(`🧹 Cleaned up ${result.count} expired OTPs`)
    }

    return result.count
  } catch (error) {
    console.error('Error cleaning up expired OTPs:', error)
    return 0
  }
}
