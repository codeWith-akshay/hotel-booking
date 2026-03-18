/**
 * Signup Server Action
 * 
 * Handles user registration with email/password authentication.
 * Creates new user accounts with proper validation, password hashing,
 * and automatic MEMBER role assignment.
 * 
 * @module signup.action
 */

'use server'

import { prisma } from '@/lib/prisma'
import { hashPassword } from '@/lib/auth/password.service'
import { generateTokenPair, setSessionCookie, setRefreshTokenCookie, type JWTPayload } from '@/lib/auth/jwt.service'
import { signupSchema, type AuthResponse } from '@/lib/validation/auth.schemas'
import { RoleName } from '@prisma/client'

// ==========================================
// SIGNUP ACTION
// ==========================================

/**
 * Register a new user with email and password
 * 
 * Flow:
 * 1. Validate input (name, email, password, confirmPassword)
 * 2. Check if email already exists
 * 3. Hash password securely
 * 4. Get MEMBER role from database
 * 5. Create user in database
 * 6. Generate JWT tokens
 * 7. Set HTTP-only cookies
 * 8. Return success response with user data
 * 
 * @param {object} data - Signup data
 * @param {string} data.name - User's full name
 * @param {string} data.email - User's email address
 * @param {string} data.password - User's password
 * @param {string} data.confirmPassword - Password confirmation
 * @returns {Promise<AuthResponse>} Success with user data and token, or error
 * 
 * @example
 * const result = await signupUserAction({
 *   name: 'John Doe',
 *   email: 'john@example.com',
 *   password: 'SecurePass123!',
 *   confirmPassword: 'SecurePass123!'
 * })
 */
export async function signupUserAction(data: {
  name: string
  email: string
  password: string
  confirmPassword: string
}): Promise<AuthResponse> {
  try {
    console.log('📝 Signup request initiated for:', data.email)

    // ==========================================
    // STEP 1: Validate Input
    // ==========================================
    const validationResult = signupSchema.safeParse(data)

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

    const { name, email, password } = validationResult.data

    // ==========================================
    // STEP 2: Check if Email Already Exists
    // ==========================================
    const existingUser = await prisma.user.findUnique({
      where: { email },
      select: { id: true, email: true },
    })

    if (existingUser) {
      console.log('❌ Email already registered:', email)
      return {
        success: false,
        error: 'Email already exists',
        code: 'EMAIL_EXISTS',
        message: 'An account with this email already exists. Please login instead.',
      }
    }

    // ==========================================
    // STEP 3: Hash Password
    // ==========================================
    console.log('🔐 Hashing password...')
    const hashedPassword = await hashPassword(password)

    // ==========================================
    // STEP 4: Get MEMBER Role
    // ==========================================
    const memberRole = await prisma.role.findUnique({
      where: { name: RoleName.MEMBER },
      select: { id: true, name: true },
    })

    if (!memberRole) {
      console.error('❌ MEMBER role not found in database')
      return {
        success: false,
        error: 'System configuration error',
        code: 'ROLE_NOT_FOUND',
        message: 'User role not configured. Please contact support.',
      }
    }

    // ==========================================
    // STEP 5: Create User in Database
    // ==========================================
    console.log('💾 Creating user in database...')
    
    const newUser = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        roleId: memberRole.id,
        profileCompleted: true,
      },
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

    console.log('✅ User created successfully:', {
      id: newUser.id,
      email: newUser.email,
      name: newUser.name,
      role: newUser.role.name,
    })

    // ==========================================
    // STEP 6: Prepare JWT Payload
    // ==========================================
    const jwtPayload: JWTPayload = {
      userId: newUser.id,
      phone: newUser.phone || '',
      email: newUser.email,
      name: newUser.name,
      role: newUser.role.name,
      roleId: newUser.roleId,
      profileCompleted: newUser.profileCompleted,
    }

    // ==========================================
    // STEP 7: Generate Tokens
    // ==========================================
    console.log('🎫 Generating JWT tokens...')
    const tokens = generateTokenPair(jwtPayload)

    // ==========================================
    // STEP 8: Set HTTP-Only Cookies
    // ==========================================
    await setSessionCookie(tokens.accessToken)
    await setRefreshTokenCookie(tokens.refreshToken)

    console.log('🍪 Session cookies set for user:', newUser.id)

    // ==========================================
    // STEP 9: Return Success Response
    // ==========================================
    return {
      success: true,
      message: 'Account created successfully. You are now logged in.',
      data: {
        userId: newUser.id,
        email: newUser.email,
        name: newUser.name,
        role: newUser.role.name,
        token: tokens.accessToken,
      },
    }
  } catch (error) {
    // ==========================================
    // ERROR HANDLING
    // ==========================================
    console.error('❌ Error in signupUserAction:', error)

    // Database connection errors
    if (error instanceof Error && error.message.includes('connect')) {
      return {
        success: false,
        error: 'Database connection error',
        code: 'DB_CONNECTION_ERROR',
        message: 'Unable to connect to database. Please try again later.',
      }
    }

    // Unique constraint violation (race condition on email)
    if (error instanceof Error && error.message.includes('Unique constraint')) {
      return {
        success: false,
        error: 'Email already exists',
        code: 'EMAIL_EXISTS',
        message: 'An account with this email already exists.',
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
