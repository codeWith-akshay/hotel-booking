/**
 * Password Utility Service
 * 
 * Provides secure password hashing and verification using bcrypt
 * with industry-standard salt rounds and best practices.
 * 
 * Key Features:
 * - Password hashing with bcrypt (10 salt rounds)
 * - Password verification
 * - Password strength validation
 * - Security logging
 * 
 * @module password.service
 */

import * as bcrypt from 'bcryptjs'

// ==========================================
// CONSTANTS
// ==========================================

/**
 * Number of salt rounds for bcrypt hashing
 * 10 rounds provides good security/performance balance
 * Each increment doubles the time required
 */
const SALT_ROUNDS = 10

/**
 * Minimum password length requirement
 */
const MIN_PASSWORD_LENGTH = 8

/**
 * Maximum password length to prevent DOS attacks
 */
const MAX_PASSWORD_LENGTH = 128

// ==========================================
// PASSWORD HASHING
// ==========================================

/**
 * Hash a plain-text password using bcrypt
 * 
 * @param {string} plainPassword - The plain-text password to hash
 * @returns {Promise<string>} The hashed password
 * @throws {Error} If password is invalid or hashing fails
 * 
 * @example
 * const hashed = await hashPassword('MySecurePass123!')
 * // Returns: '$2a$10$...'
 */
export async function hashPassword(plainPassword: string): Promise<string> {
  try {
    // Validate password
    if (!plainPassword || typeof plainPassword !== 'string') {
      throw new Error('Password must be a non-empty string')
    }

    if (plainPassword.length < MIN_PASSWORD_LENGTH) {
      throw new Error(`Password must be at least ${MIN_PASSWORD_LENGTH} characters`)
    }

    if (plainPassword.length > MAX_PASSWORD_LENGTH) {
      throw new Error(`Password must not exceed ${MAX_PASSWORD_LENGTH} characters`)
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(plainPassword, SALT_ROUNDS)
    
    console.log('🔐 Password hashed successfully')
    
    return hashedPassword
  } catch (error) {
    console.error('❌ Error hashing password:', error)
    throw error
  }
}

/**
 * Verify a plain-text password against a hashed password
 * 
 * @param {string} plainPassword - The plain-text password to verify
 * @param {string} hashedPassword - The hashed password to compare against
 * @returns {Promise<boolean>} True if passwords match, false otherwise
 * 
 * @example
 * const isValid = await verifyPassword('MySecurePass123!', hashedPassword)
 * // Returns: true or false
 */
export async function verifyPassword(
  plainPassword: string,
  hashedPassword: string
): Promise<boolean> {
  try {
    // Validate inputs
    if (!plainPassword || !hashedPassword) {
      console.log('❌ Invalid password or hash provided')
      return false
    }

    if (typeof plainPassword !== 'string' || typeof hashedPassword !== 'string') {
      console.log('❌ Password and hash must be strings')
      return false
    }

    // Verify password
    const isMatch = await bcrypt.compare(plainPassword, hashedPassword)
    
    if (isMatch) {
      console.log('✅ Password verification successful')
    } else {
      console.log('❌ Password verification failed')
    }
    
    return isMatch
  } catch (error) {
    console.error('❌ Error verifying password:', error)
    return false
  }
}

// ==========================================
// PASSWORD VALIDATION
// ==========================================

/**
 * Validate password strength and requirements
 * 
 * Requirements:
 * - At least 8 characters
 * - At least one uppercase letter
 * - At least one lowercase letter
 * - At least one number
 * - At least one special character
 * 
 * @param {string} password - The password to validate
 * @returns {{ valid: boolean; errors: string[] }} Validation result
 * 
 * @example
 * const result = validatePasswordStrength('weak')
 * // Returns: { valid: false, errors: ['Password must be at least 8 characters', ...] }
 */
export function validatePasswordStrength(password: string): {
  valid: boolean
  errors: string[]
} {
  const errors: string[] = []

  if (!password || typeof password !== 'string') {
    errors.push('Password is required')
    return { valid: false, errors }
  }

  // Length check
  if (password.length < MIN_PASSWORD_LENGTH) {
    errors.push(`Password must be at least ${MIN_PASSWORD_LENGTH} characters`)
  }

  if (password.length > MAX_PASSWORD_LENGTH) {
    errors.push(`Password must not exceed ${MAX_PASSWORD_LENGTH} characters`)
  }

  // Uppercase check
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter')
  }

  // Lowercase check
  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter')
  }

  // Number check
  if (!/[0-9]/.test(password)) {
    errors.push('Password must contain at least one number')
  }

  // Special character check
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    errors.push('Password must contain at least one special character')
  }

  return {
    valid: errors.length === 0,
    errors,
  }
}

/**
 * Check if password meets minimum requirements (relaxed version)
 * Only checks length, useful for less critical applications
 * 
 * @param {string} password - The password to check
 * @returns {boolean} True if meets minimum requirements
 */
export function meetsMinimumRequirements(password: string): boolean {
  return (
    typeof password === 'string' &&
    password.length >= MIN_PASSWORD_LENGTH &&
    password.length <= MAX_PASSWORD_LENGTH
  )
}

// ==========================================
// PASSWORD UTILITIES
// ==========================================

/**
 * Generate a temporary password for admin-created users
 * Not cryptographically secure - should be changed on first login
 * 
 * @param {number} length - Length of password to generate (default: 12)
 * @returns {string} Generated temporary password
 * 
 * @example
 * const tempPassword = generateTemporaryPassword()
 * // Returns: 'Abc123!def45'
 */
export function generateTemporaryPassword(length: number = 12): string {
  const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
  const lowercase = 'abcdefghijklmnopqrstuvwxyz'
  const numbers = '0123456789'
  const special = '!@#$%^&*'
  const all = uppercase + lowercase + numbers + special

  let password = ''
  
  // Ensure at least one of each type
  password += uppercase[Math.floor(Math.random() * uppercase.length)]
  password += lowercase[Math.floor(Math.random() * lowercase.length)]
  password += numbers[Math.floor(Math.random() * numbers.length)]
  password += special[Math.floor(Math.random() * special.length)]

  // Fill remaining length with random characters
  for (let i = password.length; i < length; i++) {
    password += all[Math.floor(Math.random() * all.length)]
  }

  // Shuffle password
  return password
    .split('')
    .sort(() => Math.random() - 0.5)
    .join('')
}
