/**
 * User Profile Update Validation Schema
 * 
 * Validates user profile update data for the /profile/setup page
 * Ensures all required fields are present and properly formatted
 */

import { z } from 'zod'

/**
 * VIP Status Enum
 * Simplified to VIP or Regular for user selection
 */
export const UserVipStatusEnum = z.enum(['VIP', 'Regular'], {
  message: 'Please select either VIP or Regular status',
})

export type UserVipStatusType = z.infer<typeof UserVipStatusEnum>

/**
 * User Profile Update Schema
 * Used for validating profile setup/update form data
 */
export const UpdateUserProfileSchema = z.object({
  fullName: z
    .string()
    .min(2, { message: 'Full name must be at least 2 characters' })
    .max(100, { message: 'Full name must not exceed 100 characters' })
    .regex(/^[a-zA-Z\s'-]+$/, {
      message: 'Name can only contain letters, spaces, hyphens, and apostrophes',
    })
    .trim(),

  email: z
    .string()
    .email({ message: 'Please enter a valid email address' })
    .toLowerCase()
    .trim(),

  address: z
    .string()
    .min(10, { message: 'Address must be at least 10 characters' })
    .max(500, { message: 'Address must not exceed 500 characters' })
    .trim(),

  vipStatus: UserVipStatusEnum,

  phoneNumber: z
    .string()
    .regex(/^\+?[1-9]\d{1,14}$/, {
      message: 'Invalid phone number format',
    })
    .optional(), // Optional since it's readonly and pre-filled
})

export type UpdateUserProfileInput = z.infer<typeof UpdateUserProfileSchema>

/**
 * Profile Update Response Schema
 */
export const ProfileUpdateResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  user: z
    .object({
      id: z.string(),
      phone: z.string(),
      name: z.string(),
      email: z.string().nullable(),
      address: z.string().nullable(),
      vipStatus: z.string(),
      profileCompleted: z.boolean(),
    })
    .optional(),
})

export type ProfileUpdateResponse = z.infer<typeof ProfileUpdateResponseSchema>
