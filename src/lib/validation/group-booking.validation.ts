// ==========================================
// GROUP BOOKING, DEPOSIT, & SPECIAL DAY VALIDATIONS (DAY 12)
// ==========================================
// Zod schemas for validating group bookings, deposit policies, and special day rules
// Used by server actions and API routes

import { z } from 'zod'

// ==========================================
// DEPOSIT POLICY SCHEMAS
// ==========================================

/**
 * Deposit type enum
 */
export const DepositTypeSchema = z.enum(['percent', 'fixed'])

/**
 * Create deposit policy schema
 */
export const CreateDepositPolicySchema = z.object({
  minRooms: z
    .number()
    .int()
    .min(1, 'Minimum rooms must be at least 1')
    .max(100, 'Minimum rooms cannot exceed 100'),
  maxRooms: z
    .number()
    .int()
    .min(1, 'Maximum rooms must be at least 1')
    .max(100, 'Maximum rooms cannot exceed 100'),
  type: DepositTypeSchema,
  value: z.number().positive('Deposit value must be positive'),
  description: z.string().optional(),
  active: z.boolean().default(true),
}).refine(
  (data) => {
    if (data.type === 'percent' && data.value > 100) {
      return false
    }
    return true
  },
  {
    message: 'Percentage value cannot exceed 100',
    path: ['value'],
  }
)

/**
 * Update deposit policy schema
 */
export const UpdateDepositPolicySchema = z.object({
  minRooms: z.number().int().min(1).max(100).optional(),
  maxRooms: z.number().int().min(1).max(100).optional(),
  type: DepositTypeSchema.optional(),
  value: z.number().positive().optional(),
  description: z.string().optional(),
  active: z.boolean().optional(),
})

/**
 * Deposit policy ID schema
 */
export const DepositPolicyIdSchema = z.object({
  id: z.string().cuid('Invalid deposit policy ID format'),
})

/**
 * Deposit policy query schema
 */
export const DepositPolicyQuerySchema = z.object({
  active: z.boolean().optional(),
  minRooms: z.number().int().optional(),
  maxRooms: z.number().int().optional(),
})

// ==========================================
// SPECIAL DAY SCHEMAS
// ==========================================

/**
 * Special day rule type enum
 */
export const SpecialDayRuleTypeSchema = z.enum(['blocked', 'special_rate'])

/**
 * Special day rate type enum
 */
export const SpecialDayRateTypeSchema = z.enum(['multiplier', 'fixed'])

/**
 * Create special day schema
 */
export const CreateSpecialDaySchema = z
  .object({
    date: z.coerce.date(),
    roomTypeId: z.string().cuid('Invalid room type ID').optional(),
    ruleType: SpecialDayRuleTypeSchema,
    rateType: SpecialDayRateTypeSchema.optional(),
    rateValue: z.number().positive('Rate value must be positive').optional(),
    description: z.string().max(500, 'Description too long').optional(),
    active: z.boolean().default(true),
  })
  .refine(
    (data) => {
      // If ruleType is 'special_rate', rateType and rateValue are required
      if (data.ruleType === 'special_rate') {
        return data.rateType && data.rateValue !== undefined
      }
      return true
    },
    {
      message: 'Rate type and rate value are required for special_rate rules',
      path: ['rateType'],
    }
  )
  .refine(
    (data) => {
      // If rateType is 'multiplier', value should be reasonable (0.1 to 10)
      if (data.rateType === 'multiplier' && data.rateValue) {
        return data.rateValue >= 0.1 && data.rateValue <= 10
      }
      return true
    },
    {
      message: 'Multiplier must be between 0.1 and 10',
      path: ['rateValue'],
    }
  )

/**
 * Update special day schema
 */
export const UpdateSpecialDaySchema = z
  .object({
    date: z.coerce.date().optional(),
    roomTypeId: z.string().cuid().optional().nullable(),
    ruleType: SpecialDayRuleTypeSchema.optional(),
    rateType: SpecialDayRateTypeSchema.optional().nullable(),
    rateValue: z.number().positive().optional().nullable(),
    description: z.string().max(500).optional().nullable(),
    active: z.boolean().optional(),
  })
  .refine(
    (data) => {
      if (data.ruleType === 'special_rate') {
        return data.rateType !== null && data.rateValue !== null && data.rateValue !== undefined
      }
      return true
    },
    {
      message: 'Rate type and rate value are required for special_rate rules',
      path: ['rateType'],
    }
  )

/**
 * Special day ID schema
 */
export const SpecialDayIdSchema = z.object({
  id: z.string().cuid('Invalid special day ID format'),
})

/**
 * Special day query schema
 */
export const SpecialDayQuerySchema = z.object({
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
  roomTypeId: z.string().cuid().optional(),
  ruleType: SpecialDayRuleTypeSchema.optional(),
  active: z.boolean().optional(),
})

// ==========================================
// GROUP BOOKING SCHEMAS
// ==========================================

/**
 * Group booking validation schema
 */
export const GroupBookingSchema = z.object({
  userId: z.string().cuid('Invalid user ID'),
  roomTypeId: z.string().cuid('Invalid room type ID'),
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),
  roomsBooked: z
    .number()
    .int()
    .min(1, 'Must book at least 1 room')
    .max(100, 'Cannot book more than 100 rooms'),
  depositAmount: z.number().int().nonnegative().optional(),
  isDepositPaid: z.boolean().default(false),
})

/**
 * Validate group booking dates
 */
export const ValidateGroupBookingDatesSchema = z
  .object({
    startDate: z.coerce.date(),
    endDate: z.coerce.date(),
  })
  .refine((data) => data.endDate > data.startDate, {
    message: 'End date must be after start date',
    path: ['endDate'],
  })

/**
 * Deposit calculation request schema
 */
export const CalculateDepositSchema = z.object({
  roomsBooked: z.number().int().min(1).max(100),
  totalPrice: z.number().int().positive(),
})

/**
 * Price calculation with special days schema
 */
export const CalculatePriceWithSpecialDaysSchema = z.object({
  roomTypeId: z.string().cuid(),
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),
  roomsBooked: z.number().int().min(1).default(1),
})

// ==========================================
// RESPONSE SCHEMAS
// ==========================================

/**
 * Deposit policy response schema
 */
export const DepositPolicyResponseSchema = z.object({
  id: z.string(),
  minRooms: z.number(),
  maxRooms: z.number(),
  type: DepositTypeSchema,
  value: z.number(),
  description: z.string().nullable(),
  active: z.boolean(),
  createdAt: z.date(),
  updatedAt: z.date(),
})

/**
 * Special day response schema
 */
export const SpecialDayResponseSchema = z.object({
  id: z.string(),
  date: z.date(),
  roomTypeId: z.string().nullable(),
  ruleType: SpecialDayRuleTypeSchema,
  rateType: SpecialDayRateTypeSchema.nullable(),
  rateValue: z.number().nullable(),
  description: z.string().nullable(),
  active: z.boolean(),
  createdAt: z.date(),
  updatedAt: z.date(),
})

/**
 * Deposit calculation response schema
 */
export const DepositCalculationResponseSchema = z.object({
  required: z.boolean(),
  amount: z.number().int().nonnegative(),
  policy: DepositPolicyResponseSchema.optional(),
  reason: z.string(),
})

/**
 * Price calculation response schema
 */
export const PriceCalculationResponseSchema = z.object({
  basePrice: z.number().int(),
  specialDayAdjustments: z.array(
    z.object({
      date: z.date(),
      originalPrice: z.number(),
      adjustedPrice: z.number(),
      ruleType: z.string(),
      description: z.string().nullable(),
    })
  ),
  totalPrice: z.number().int(),
  nights: z.number().int(),
  roomsBooked: z.number().int(),
})

// ==========================================
// TYPE EXPORTS
// ==========================================

export type DepositType = z.infer<typeof DepositTypeSchema>
export type CreateDepositPolicyInput = z.infer<typeof CreateDepositPolicySchema>
export type UpdateDepositPolicyInput = z.infer<typeof UpdateDepositPolicySchema>
export type DepositPolicyQuery = z.infer<typeof DepositPolicyQuerySchema>

export type SpecialDayRuleType = z.infer<typeof SpecialDayRuleTypeSchema>
export type SpecialDayRateType = z.infer<typeof SpecialDayRateTypeSchema>
export type CreateSpecialDayInput = z.infer<typeof CreateSpecialDaySchema>
export type UpdateSpecialDayInput = z.infer<typeof UpdateSpecialDaySchema>
export type SpecialDayQuery = z.infer<typeof SpecialDayQuerySchema>

export type GroupBookingInput = z.infer<typeof GroupBookingSchema>
export type CalculateDepositInput = z.infer<typeof CalculateDepositSchema>
export type CalculatePriceWithSpecialDaysInput = z.infer<typeof CalculatePriceWithSpecialDaysSchema>

export type DepositPolicyResponse = z.infer<typeof DepositPolicyResponseSchema>
export type SpecialDayResponse = z.infer<typeof SpecialDayResponseSchema>
export type DepositCalculationResponse = z.infer<typeof DepositCalculationResponseSchema>
export type PriceCalculationResponse = z.infer<typeof PriceCalculationResponseSchema>
