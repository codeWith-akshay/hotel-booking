/**
 * Login Server Action
 * 
 * Handles user authentication with email/password.
 * Verifies credentials, generates JWT tokens, and sets session cookies.
 * 
 * @module login.action
 */

'use server'

import { prisma } from '@/lib/prisma'
import { verifyPassword } from '@/lib/auth/password.service'
import { generateTokenPair, setSessionCookie, setRefreshTokenCookie, type JWTPayload } from '@/lib/auth/jwt.service'
import { loginSchema, type AuthResponse } from '@/lib/validation/auth.schemas'

// ==========================================
// LOGIN ACTION
// ==========================================

/**
 * Authenticate user with email and password
 * 
 * Flow:
 * 1. Validate input (email, password)
 * 2. Find user by email
 * 3. Verify password hash
 * 4. Generate JWT tokens
 * 5. Set HTTP-only cookies
 * 6. Return success response with user data
 * 
 * @param {object} data - Login credentials
 * @param {string} data.email - User's email address
 * @param {string} data.password - User's password
 * @returns {Promise<AuthResponse>} Success with user data and token, or error
 * 
 * @example
 * const result = await loginUserAction({
 *   email: 'john@example.com',
 *   password: 'SecurePass123!'
 * })
 */
export async function loginUserAction(data: {
  email: string
  password: string
}): Promise<AuthResponse> {
  try {
    console.log('🔐 Login request initiated for:', data.email)

    // ==========================================
    // STEP 1: Validate Input
    // ==========================================
    const validationResult = loginSchema.safeParse(data)

    if (!validationResult.success) {
      const firstError = validationResult.error.issues[0]
      const errorMessage = firstError?.message || 'Validation failed'
      console.log('❌ Validation failed:', errorMessage)
      
      return {
        success: false,
        error: 'Validation failed',
        code: 'VALIDATION_ERROR',
        message: errorMessage,
      }
    }

    const { email, password } = validationResult.data

    // ==========================================
    // STEP 2: Find User by Email
    // ==========================================
    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        role: {
          select: {
            id: true,
            name: true,
            permissions: true,
          },
        },
      },
    })

    if (!user) {
      console.log('❌ User not found:', email)
      return {
        success: false,
        error: 'Invalid credentials',
        code: 'INVALID_CREDENTIALS',
        message: 'Invalid email or password. Please try again.',
      }
    }

    // ==========================================
    // STEP 3: Verify Password
    // ==========================================
    console.log('🔓 Verifying password for user:', user.id)
    
    const isPasswordValid = await verifyPassword(password, user.password)

    if (!isPasswordValid) {
      console.log('❌ Invalid password for user:', user.id)
      return {
        success: false,
        error: 'Invalid credentials',
        code: 'INVALID_CREDENTIALS',
        message: 'Invalid email or password. Please try again.',
      }
    }

    console.log('✅ Password verified successfully for user:', user.id)

    // ==========================================
    // STEP 4: Prepare JWT Payload
    // ==========================================
    const jwtPayload: JWTPayload = {
      userId: user.id,
      phone: user.phone || '',
      email: user.email,
      name: user.name,
      role: user.role.name,
      roleId: user.roleId,
      profileCompleted: user.profileCompleted,
    }

    console.log('🎫 JWT Payload prepared:', {
      userId: user.id,
      email: user.email,
      role: user.role.name,
    })

    // ==========================================
    // STEP 5: Generate Tokens
    // ==========================================
    console.log('🎫 Generating JWT tokens...')
    const tokens = generateTokenPair(jwtPayload)

    // ==========================================
    // STEP 6: Set HTTP-Only Cookies
    // ==========================================
    await setSessionCookie(tokens.accessToken)
    await setRefreshTokenCookie(tokens.refreshToken)

    console.log('🍪 Session cookies set for user:', user.id)

    // ==========================================
    // STEP 7: Return Success Response
    // ==========================================
    return {
      success: true,
      message: 'Login successful. Welcome back!',
      data: {
        userId: user.id,
        email: user.email,
        name: user.name,
        role: user.role.name,
        token: tokens.accessToken,
      },
    }
  } catch (error) {
    // ==========================================
    // ERROR HANDLING
    // ==========================================
    console.error('❌ Error in loginUserAction:', error)

    // Database connection errors
    if (error instanceof Error && error.message.includes('connect')) {
      return {
        success: false,
        error: 'Database connection error',
        code: 'DB_CONNECTION_ERROR',
        message: 'Unable to connect to database. Please try again later.',
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
