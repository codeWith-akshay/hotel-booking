/**
 * Authentication Validation Schemas
 * 
 * Zod schemas for validating signup and login requests
 * with proper error messages and type safety.
 * 
 * @module auth.schemas
 */

import { z } from 'zod'

// ==========================================
// REUSABLE VALIDATORS
// ==========================================

/**
 * Email validator
 */
const emailSchema = z
  .string()
  .min(1, 'Email is required')
  .email('Invalid email address')
  .max(255, 'Email must not exceed 255 characters')
  .toLowerCase()
  .trim()

/**
 * Password validator
 */
const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .max(128, 'Password must not exceed 128 characters')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number')
  .regex(
    /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/,
    'Password must contain at least one special character'
  )

/**
 * Name validator
 */
const nameSchema = z
  .string()
  .min(1, 'Name is required')
  .min(2, 'Name must be at least 2 characters')
  .max(100, 'Name must not exceed 100 characters')
  .trim()
  .regex(/^[a-zA-Z\s'-]+$/, 'Name can only contain letters, spaces, hyphens, and apostrophes')

// ==========================================
// SIGNUP SCHEMA
// ==========================================

/**
 * Signup request validation schema
 * 
 * Required fields:
 * - name: User's full name (2-100 chars)
 * - email: Valid email address
 * - password: Strong password (8+ chars with uppercase, lowercase, number, special char)
 * - confirmPassword: Must match password
 * 
 * @example
 * const data = {
 *   name: 'John Doe',
 *   email: 'john@example.com',
 *   password: 'SecurePass123!',
 *   confirmPassword: 'SecurePass123!'
 * }
 * const result = signupSchema.safeParse(data)
 */
export const signupSchema = z
  .object({
    name: nameSchema,
    email: emailSchema,
    password: passwordSchema,
    confirmPassword: z.string().min(1, 'Please confirm your password'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  })

// ==========================================
// LOGIN SCHEMA
// ==========================================

/**
 * Login request validation schema
 * 
 * Required fields:
 * - email: Valid email address
 * - password: User's password (no strength validation on login)
 * 
 * @example
 * const data = {
 *   email: 'john@example.com',
 *   password: 'SecurePass123!'
 * }
 * const result = loginSchema.safeParse(data)
 */
export const loginSchema = z.object({
  email: emailSchema,
  password: z
    .string()
    .min(1, 'Password is required')
    .max(128, 'Password must not exceed 128 characters'),
})

// ==========================================
// TYPE EXPORTS
// ==========================================

/**
 * TypeScript type for signup request
 */
export type SignupRequest = z.infer<typeof signupSchema>

/**
 * TypeScript type for login request
 */
export type LoginRequest = z.infer<typeof loginSchema>

// ==========================================
// RESPONSE TYPES
// ==========================================

/**
 * Successful authentication response
 */
export interface AuthSuccessResponse {
  success: true
  message: string
  data: {
    userId: string
    email: string
    name: string
    role: string
    token: string
  }
}

/**
 * Authentication error response
 */
export interface AuthErrorResponse {
  success: false
  error: string
  code: string
  message: string
}

/**
 * Auth response type (success or error)
 */
export type AuthResponse = AuthSuccessResponse | AuthErrorResponse
