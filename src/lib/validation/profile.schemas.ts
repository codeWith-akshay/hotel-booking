// ==========================================
// PROFILE VALIDATION SCHEMAS
// ==========================================
// Zod schemas for profile and IRCA membership validation
// Production-ready with comprehensive validation rules

import { z } from 'zod'

// ==========================================
// PROFILE SCHEMAS
// ==========================================

/**
 * Profile update schema
 * Validates user profile information updates
 */
export const ProfileUpdateSchema = z.object({
  name: z
    .string()
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name must be less than 100 characters')
    .regex(/^[a-zA-Z\s'-]+$/, 'Name can only contain letters, spaces, hyphens, and apostrophes')
    .trim(),
  
  email: z
    .string()
    .email('Please enter a valid email address')
    .max(255, 'Email must be less than 255 characters')
    .toLowerCase()
    .trim()
    .optional()
    .nullable(),
  
  phone: z
    .string()
    .regex(/^\+?[1-9]\d{9,14}$/, 'Please enter a valid phone number (10-15 digits)')
    .trim(),
})

/**
 * Full profile schema (includes read-only fields)
 * Used for fetching and displaying complete profile data
 */
export const ProfileSchema = ProfileUpdateSchema.extend({
  id: z.string().cuid(),
  roleId: z.string().cuid(),
  role: z.enum(['MEMBER', 'ADMIN', 'SUPERADMIN']),
  ircaMembershipId: z.string().optional().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
})

// ==========================================
// IRCA MEMBERSHIP SCHEMAS
// ==========================================

/**
 * IRCA membership status enum
 */
export const IRCAStatusEnum = z.enum([
  'active',
  'expired',
  'pending',
  'suspended',
  'cancelled',
])

/**
 * IRCA membership level enum
 */
export const IRCALevelEnum = z.enum([
  'Basic',
  'Standard',
  'Premium',
  'Corporate',
  'Lifetime',
])

/**
 * IRCA membership check request schema
 */
export const IRCACheckRequestSchema = z.object({
  membershipId: z
    .string()
    .min(5, 'Membership ID must be at least 5 characters')
    .max(50, 'Membership ID must be less than 50 characters')
    .regex(/^[A-Z0-9-]+$/, 'Membership ID can only contain uppercase letters, numbers, and hyphens')
    .trim(),
})

/**
 * IRCA membership response schema
 * Mock response that matches expected real API structure
 */
export const IRCAResponseSchema = z.object({
  success: z.boolean(),
  data: z.object({
    membershipId: z.string(),
    status: IRCAStatusEnum,
    level: IRCALevelEnum,
    memberSince: z.string().datetime(),
    expiresAt: z.string().datetime().nullable(),
    dues: z.number().nonnegative(),
    duesPaid: z.boolean(),
    benefits: z.array(z.string()),
    lastVerified: z.string().datetime(),
  }).nullable(),
  error: z.string().optional(),
  message: z.string().optional(),
})

/**
 * IRCA membership update schema
 */
export const IRCAMembershipUpdateSchema = z.object({
  ircaMembershipId: z
    .string()
    .min(5, 'Membership ID must be at least 5 characters')
    .max(50, 'Membership ID must be less than 50 characters')
    .regex(/^[A-Z0-9-]+$/, 'Membership ID can only contain uppercase letters, numbers, and hyphens')
    .trim()
    .optional()
    .nullable(),
})

// ==========================================
// TYPESCRIPT TYPE INFERENCE
// ==========================================

/**
 * Type for profile update data
 */
export type ProfileUpdateData = z.infer<typeof ProfileUpdateSchema>

/**
 * Type for complete profile data
 */
export type ProfileData = z.infer<typeof ProfileSchema>

/**
 * Type for IRCA membership status
 */
export type IRCAStatus = z.infer<typeof IRCAStatusEnum>

/**
 * Type for IRCA membership level
 */
export type IRCALevel = z.infer<typeof IRCALevelEnum>

/**
 * Type for IRCA check request
 */
export type IRCACheckRequest = z.infer<typeof IRCACheckRequestSchema>

/**
 * Type for IRCA membership response
 */
export type IRCAResponse = z.infer<typeof IRCAResponseSchema>

/**
 * Type for IRCA membership data
 */
export type IRCAMembershipData = NonNullable<IRCAResponse['data']>

/**
 * Type for IRCA membership update
 */
export type IRCAMembershipUpdate = z.infer<typeof IRCAMembershipUpdateSchema>

// ==========================================
// VALIDATION HELPERS
// ==========================================

/**
 * Safe parse profile update data
 * Returns validated data or error messages
 */
export function validateProfileUpdate(data: unknown) {
  return ProfileUpdateSchema.safeParse(data)
}

/**
 * Safe parse IRCA check request
 * Returns validated data or error messages
 */
export function validateIRCACheckRequest(data: unknown) {
  return IRCACheckRequestSchema.safeParse(data)
}

/**
 * Safe parse IRCA response
 * Returns validated data or error messages
 */
export function validateIRCAResponse(data: unknown) {
  return IRCAResponseSchema.safeParse(data)
}

// ==========================================
// FIELD VALIDATORS
// ==========================================

/**
 * Validate single field from profile update schema
 */
export function validateField(field: keyof ProfileUpdateData, value: unknown) {
  try {
    const fieldSchema = ProfileUpdateSchema.shape[field]
    fieldSchema.parse(value)
    return { success: true, error: null }
  } catch (error) {
    if (error instanceof z.ZodError) {
      const firstError = error.issues[0]
      return { success: false, error: firstError?.message || 'Validation failed' }
    }
    return { success: false, error: 'Validation failed' }
  }
}
