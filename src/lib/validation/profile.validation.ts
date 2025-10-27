/**
 * Profile Setup Validation Schema
 * 
 * Validates user profile completion data including:
 * - Full name
 * - Email address
 * - Physical address
 * - VIP status
 * - Profile picture (optional)
 * - Terms acceptance
 */

import { z } from 'zod'

// VIP Status Enum
export const VipStatusEnum = z.enum(['NONE', 'VIP', 'STAFF'])

export type VipStatus = z.infer<typeof VipStatusEnum>

/**
 * Complete Profile Schema
 * Used for validating profile setup form submission
 */
export const CompleteProfileSchema = z.object({
  fullName: z
    .string()
    .min(3, { message: 'Full name must be at least 3 characters' })
    .max(100, { message: 'Full name must not exceed 100 characters' })
    .regex(/^[a-zA-Z\s'-]+$/, {
      message: 'Full name can only contain letters, spaces, hyphens, and apostrophes',
    }),

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

  vipStatus: VipStatusEnum,

  phoneNumber: z
    .string()
    .regex(/^\+?[1-9]\d{1,14}$/, {
      message: 'Invalid phone number format',
    })
    .optional(), // Optional since it's readonly and pre-filled

  profilePicture: z
    .string()
    .url({ message: 'Invalid profile picture URL' })
    .optional()
    .or(z.literal('')),

  termsAccepted: z
    .boolean()
    .refine((val) => val === true, {
      message: 'You must accept the terms and conditions',
    }),
})

export type CompleteProfileInput = z.infer<typeof CompleteProfileSchema>

/**
 * Profile Picture Upload Schema
 * Validates uploaded profile picture metadata
 */
export const ProfilePictureUploadSchema = z.object({
  fileName: z.string().min(1),
  fileSize: z.number().max(5 * 1024 * 1024, { message: 'File size must be less than 5MB' }),
  mimeType: z.enum(['image/jpeg', 'image/png', 'image/webp', 'image/jpg']),
})

export type ProfilePictureUpload = z.infer<typeof ProfilePictureUploadSchema>

/**
 * Partial Profile Update Schema
 * Used for updating individual profile fields
 */
export const UpdateProfileSchema = CompleteProfileSchema.partial().omit({
  termsAccepted: true,
})

export type UpdateProfileInput = z.infer<typeof UpdateProfileSchema>

/**
 * Profile Completion Response Schema
 */
export const ProfileCompletionResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  user: z
    .object({
      id: z.string(),
      phone: z.string(),
      name: z.string(),
      email: z.string().nullable(),
      address: z.string().nullable(),
      vipStatus: VipStatusEnum,
      profilePicture: z.string().nullable(),
      profileCompleted: z.boolean(),
      termsAccepted: z.boolean(),
    })
    .optional(),
})

export type ProfileCompletionResponse = z.infer<typeof ProfileCompletionResponseSchema>
