/**
 * SuperAdmin Validation Schemas
 * 
 * Comprehensive Zod validation schemas for SuperAdmin operations:
 * - Booking rules (3-2-1 windows)
 * - Deposit policies (group booking thresholds)
 * - Special days (blocked dates, special rates)
 * - Bulk messaging (CSV upload, message templates)
 * 
 * All schemas include request/response types and helper validators
 */

import { z } from 'zod'

// ==========================================
// ENUMS & CONSTANTS
// ==========================================

export const GuestTypeEnum = z.enum(['REGULAR', 'VIP', 'CORPORATE'])
export type GuestType = z.infer<typeof GuestTypeEnum>

export const DepositTypeEnum = z.enum(['percent', 'fixed'])
export type DepositType = z.infer<typeof DepositTypeEnum>

export const SpecialDayRuleTypeEnum = z.enum(['blocked', 'special_rate'])
export type SpecialDayRuleType = z.infer<typeof SpecialDayRuleTypeEnum>

export const SpecialDayRateTypeEnum = z.enum(['multiplier', 'fixed'])
export type SpecialDayRateType = z.infer<typeof SpecialDayRateTypeEnum>

export const BulkMessageChannelEnum = z.enum(['whatsapp', 'email'])
export type BulkMessageChannel = z.infer<typeof BulkMessageChannelEnum>

export const BulkMessageStatusEnum = z.enum(['pending', 'processing', 'completed', 'failed'])
export type BulkMessageStatus = z.infer<typeof BulkMessageStatusEnum>

// ==========================================
// BOOKING RULES SCHEMAS
// ==========================================

/**
 * Schema for updating booking rules (3-2-1 rule windows)
 */
export const BookingRuleSchema = z.object({
  id: z.string().cuid().optional(),
  guestType: GuestTypeEnum,
  maxDaysAdvance: z.number().int().min(1).max(730)
    .describe('Maximum days in advance a booking can be made (1-730)'),
  minDaysNotice: z.number().int().min(0).max(30)
    .describe('Minimum days notice required for booking (0-30)'),
})

export type BookingRule = z.infer<typeof BookingRuleSchema>

/**
 * Request to update booking rules
 */
export const UpdateBookingRulesRequestSchema = z.object({
  rules: z.array(BookingRuleSchema).min(1)
    .refine((rules) => {
      const guestTypes = rules.map(r => r.guestType)
      return new Set(guestTypes).size === guestTypes.length
    }, {
      message: 'Each guest type can only appear once',
    }),
  adminId: z.string().cuid(),
})

export type UpdateBookingRulesRequest = z.infer<typeof UpdateBookingRulesRequestSchema>

/**
 * Response for booking rules operations
 */
export const BookingRulesResponseSchema = z.discriminatedUnion('success', [
  z.object({
    success: z.literal(true),
    message: z.string(),
    rules: z.array(BookingRuleSchema),
  }),
  z.object({
    success: z.literal(false),
    error: z.string(),
  }),
])

export type BookingRulesResponse = z.infer<typeof BookingRulesResponseSchema>

// ==========================================
// DEPOSIT POLICY SCHEMAS
// ==========================================

/**
 * Schema for deposit policies (group booking requirements)
 */
export const DepositPolicySchema = z.object({
  id: z.string().cuid().optional(),
  minRooms: z.number().int().min(2).max(100)
    .describe('Minimum rooms to trigger this policy'),
  maxRooms: z.number().int().min(2).max(1000)
    .describe('Maximum rooms this policy applies to'),
  type: DepositTypeEnum,
  value: z.number()
    .describe('Percentage (0-100) or fixed amount in cents'),
  active: z.boolean().default(true),
  description: z.string().optional(),
}).refine((data) => data.maxRooms >= data.minRooms, {
  message: 'maxRooms must be greater than or equal to minRooms',
  path: ['maxRooms'],
}).refine((data) => {
  if (data.type === 'percent') {
    return data.value >= 0 && data.value <= 100
  }
  return data.value >= 0
}, {
  message: 'Percent value must be 0-100, fixed value must be non-negative',
  path: ['value'],
})

export type DepositPolicy = z.infer<typeof DepositPolicySchema>

/**
 * Request to update deposit policies
 */
export const UpdateDepositPoliciesRequestSchema = z.object({
  policies: z.array(DepositPolicySchema).min(1)
    .refine((policies) => {
      // Check for overlapping room ranges
      for (let i = 0; i < policies.length; i++) {
        for (let j = i + 1; j < policies.length; j++) {
          const p1 = policies[i]!
          const p2 = policies[j]!
          const overlap = !(p1.maxRooms < p2.minRooms || p2.maxRooms < p1.minRooms)
          if (overlap) {
            return false
          }
        }
      }
      return true
    }, {
      message: 'Room ranges cannot overlap between policies',
    }),
  adminId: z.string().cuid(),
})

export type UpdateDepositPoliciesRequest = z.infer<typeof UpdateDepositPoliciesRequestSchema>

/**
 * Response for deposit policy operations
 */
export const DepositPolicyResponseSchema = z.discriminatedUnion('success', [
  z.object({
    success: z.literal(true),
    message: z.string(),
    policies: z.array(DepositPolicySchema),
  }),
  z.object({
    success: z.literal(false),
    error: z.string(),
  }),
])

export type DepositPolicyResponse = z.infer<typeof DepositPolicyResponseSchema>

// ==========================================
// SPECIAL DAY SCHEMAS
// ==========================================

/**
 * Schema for special day rules (blocked dates, special rates)
 */
export const SpecialDaySchema = z.object({
  id: z.string().cuid().optional(),
  date: z.string().datetime()
    .or(z.date())
    .transform((val) => typeof val === 'string' ? new Date(val) : val),
  roomTypeId: z.string().cuid().nullable().optional(),
  ruleType: SpecialDayRuleTypeEnum,
  rateType: SpecialDayRateTypeEnum.nullable().optional(),
  rateValue: z.number().nullable().optional(),
  description: z.string().min(1).max(500).optional(),
  active: z.boolean().default(true),
}).refine((data) => {
  if (data.ruleType === 'special_rate') {
    return data.rateType !== null && data.rateValue !== null
  }
  return true
}, {
  message: 'Special rate rules require rateType and rateValue',
  path: ['rateType'],
}).refine((data) => {
  if (data.ruleType === 'special_rate' && data.rateType === 'multiplier') {
    return data.rateValue !== null && data.rateValue !== undefined && data.rateValue > 0 && data.rateValue <= 10
  }
  return true
}, {
  message: 'Rate multiplier must be between 0 and 10',
  path: ['rateValue'],
}).refine((data) => {
  if (data.ruleType === 'special_rate' && data.rateType === 'fixed') {
    return data.rateValue !== null && data.rateValue !== undefined && data.rateValue >= 0
  }
  return true
}, {
  message: 'Fixed rate must be non-negative',
  path: ['rateValue'],
})

export type SpecialDay = z.infer<typeof SpecialDaySchema>

/**
 * Request to create/update special day
 */
export const UpsertSpecialDayRequestSchema = z.object({
  specialDay: SpecialDaySchema,
  adminId: z.string().cuid(),
})

export type UpsertSpecialDayRequest = z.infer<typeof UpsertSpecialDayRequestSchema>

/**
 * Request to delete special day
 */
export const DeleteSpecialDayRequestSchema = z.object({
  id: z.string().cuid(),
  adminId: z.string().cuid(),
})

export type DeleteSpecialDayRequest = z.infer<typeof DeleteSpecialDayRequestSchema>

/**
 * Query parameters for fetching special days
 */
export const FetchSpecialDaysQuerySchema = z.object({
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  roomTypeId: z.string().cuid().optional(),
  ruleType: SpecialDayRuleTypeEnum.optional(),
  active: z.enum(['true', 'false']).transform(val => val === 'true').optional(),
})

export type FetchSpecialDaysQuery = z.infer<typeof FetchSpecialDaysQuerySchema>

/**
 * Response for special day operations
 */
export const SpecialDayResponseSchema = z.discriminatedUnion('success', [
  z.object({
    success: z.literal(true),
    message: z.string(),
    specialDay: SpecialDaySchema.optional(),
    specialDays: z.array(SpecialDaySchema).optional(),
  }),
  z.object({
    success: z.literal(false),
    error: z.string(),
  }),
])

export type SpecialDayResponse = z.infer<typeof SpecialDayResponseSchema>

// ==========================================
// BULK MESSAGE SCHEMAS
// ==========================================

/**
 * Schema for CSV recipient row
 */
export const CsvRecipientSchema = z.object({
  name: z.string().min(1).max(100)
    .describe('Recipient name'),
  phone: z.string().regex(/^\+?[1-9]\d{9,14}$/)
    .describe('Phone number with country code (E.164 format)'),
  email: z.string().email().optional()
    .describe('Email address (required for email channel)'),
})

export type CsvRecipient = z.infer<typeof CsvRecipientSchema>

/**
 * Schema for parsed CSV data
 */
export const ParsedCsvSchema = z.object({
  recipients: z.array(CsvRecipientSchema).min(1).max(10000)
    .describe('Array of recipients (max 10,000)'),
  totalCount: z.number().int().min(1).max(10000),
  validCount: z.number().int().min(0),
  invalidCount: z.number().int().min(0),
  errors: z.array(z.object({
    row: z.number(),
    errors: z.array(z.string()),
  })).optional(),
})

export type ParsedCsv = z.infer<typeof ParsedCsvSchema>

/**
 * Schema for bulk message template with placeholders
 */
export const MessageTemplateSchema = z.string()
  .min(10, 'Message must be at least 10 characters')
  .max(1000, 'Message cannot exceed 1000 characters')
  .refine((msg) => {
    // Validate placeholders
    const placeholders = msg.match(/\{(\w+)\}/g) || []
    const validPlaceholders = ['{name}', '{phone}', '{email}']
    return placeholders.every(p => validPlaceholders.includes(p))
  }, {
    message: 'Only {name}, {phone}, {email} placeholders are allowed',
  })

export type MessageTemplate = z.infer<typeof MessageTemplateSchema>

/**
 * Request to send bulk messages
 */
export const SendBulkMessagesRequestSchema = z.object({
  adminId: z.string().cuid(),
  title: z.string().min(3).max(200)
    .describe('Campaign title for reference'),
  messageContent: MessageTemplateSchema,
  channel: BulkMessageChannelEnum,
  recipients: z.array(CsvRecipientSchema).min(1).max(10000),
}).refine((data) => {
  // If channel is email, all recipients must have email
  if (data.channel === 'email') {
    return data.recipients.every(r => r.email)
  }
  return true
}, {
  message: 'Email channel requires all recipients to have email addresses',
  path: ['recipients'],
})

export type SendBulkMessagesRequest = z.infer<typeof SendBulkMessagesRequestSchema>

/**
 * Schema for individual message send result
 */
export const MessageSendResultSchema = z.object({
  name: z.string(),
  phone: z.string(),
  email: z.string().optional(),
  status: z.enum(['success', 'failed']),
  error: z.string().optional(),
  sentAt: z.date().optional(),
})

export type MessageSendResult = z.infer<typeof MessageSendResultSchema>

/**
 * Response for bulk message operations
 */
export const BulkMessageResponseSchema = z.discriminatedUnion('success', [
  z.object({
    success: z.literal(true),
    message: z.string(),
    campaignId: z.string().cuid(),
    totalRecipients: z.number().int(),
    sentCount: z.number().int(),
    failedCount: z.number().int(),
    results: z.array(MessageSendResultSchema).optional(),
  }),
  z.object({
    success: z.literal(false),
    error: z.string(),
  }),
])

export type BulkMessageResponse = z.infer<typeof BulkMessageResponseSchema>

/**
 * Query parameters for fetching bulk message campaigns
 */
export const FetchBulkMessagesQuerySchema = z.object({
  adminId: z.string().cuid().optional(),
  channel: BulkMessageChannelEnum.optional(),
  status: BulkMessageStatusEnum.optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  page: z.string().optional().default('1').transform(Number).pipe(z.number().int().min(1)),
  limit: z.string().optional().default('20').transform(Number).pipe(z.number().int().min(1).max(100)),
})

export type FetchBulkMessagesQuery = z.infer<typeof FetchBulkMessagesQuerySchema>

// ==========================================
// HELPER VALIDATORS
// ==========================================

/**
 * Validate booking rule constraints (3-2-1 rule logic)
 */
export function validateBookingRuleConstraints(rules: BookingRule[]): {
  valid: boolean
  errors: string[]
} {
  const errors: string[] = []

  // Check each rule's constraints
  rules.forEach((rule) => {
    if (rule.minDaysNotice > rule.maxDaysAdvance) {
      errors.push(
        `${rule.guestType}: minDaysNotice cannot exceed maxDaysAdvance`
      )
    }
  })

  // VIP should have most relaxed rules
  const regular = rules.find(r => r.guestType === 'REGULAR')
  const vip = rules.find(r => r.guestType === 'VIP')

  if (regular && vip) {
    if (vip.minDaysNotice > regular.minDaysNotice) {
      errors.push('VIP minDaysNotice should be <= REGULAR minDaysNotice')
    }
    if (vip.maxDaysAdvance < regular.maxDaysAdvance) {
      errors.push('VIP maxDaysAdvance should be >= REGULAR maxDaysAdvance')
    }
  }

  return { valid: errors.length === 0, errors }
}

/**
 * Validate deposit policy room ranges don't overlap
 */
export function validateDepositPolicyRanges(policies: DepositPolicy[]): {
  valid: boolean
  errors: string[]
} {
  const errors: string[] = []
  const activePolicies = policies.filter(p => p.active)

  for (let i = 0; i < activePolicies.length; i++) {
    for (let j = i + 1; j < activePolicies.length; j++) {
      const p1 = activePolicies[i]!
      const p2 = activePolicies[j]!

      // Check for overlap: NOT (p1.max < p2.min OR p2.max < p1.min)
      const overlap = !(p1.maxRooms < p2.minRooms || p2.maxRooms < p1.minRooms)

      if (overlap) {
        errors.push(
          `Policies overlap: [${p1.minRooms}-${p1.maxRooms}] and [${p2.minRooms}-${p2.maxRooms}]`
        )
      }
    }
  }

  return { valid: errors.length === 0, errors }
}

/**
 * Parse and validate CSV file content
 */
export function parseCsvContent(csvContent: string): ParsedCsv {
  const lines = csvContent.trim().split('\n')
  
  if (lines.length === 0) {
    throw new Error('CSV file is empty')
  }

  // Parse header
  const headerLine = lines[0]
  if (!headerLine) {
    throw new Error('CSV header is missing')
  }
  
  const header = headerLine.toLowerCase().split(',').map((h: string) => h.trim())
  const nameIdx = header.findIndex((h: string) => h === 'name')
  const phoneIdx = header.findIndex((h: string) => h === 'phone')
  const emailIdx = header.findIndex((h: string) => h === 'email')

  if (nameIdx === -1 || phoneIdx === -1) {
    throw new Error('CSV must have "name" and "phone" columns')
  }

  const recipients: CsvRecipient[] = []
  const errors: { row: number; errors: string[] }[] = []

  // Parse data rows (skip header)
  for (let i = 1; i < lines.length; i++) {
    const currentLine = lines[i]
    if (!currentLine) continue // Skip undefined lines
    
    const line = currentLine.trim()
    if (!line) continue // Skip empty lines

    const values = line.split(',').map((v: string) => v.trim())
    const name = values[nameIdx] || ''
    const phone = values[phoneIdx] || ''
    const email = emailIdx !== -1 ? values[emailIdx] || '' : undefined

    // Validate row
    const result = CsvRecipientSchema.safeParse({ name, phone, email })

    if (result.success) {
      recipients.push(result.data)
    } else {
      errors.push({
        row: i + 1,
        errors: result.error.issues.map((e: any) => `${e.path.join('.')}: ${e.message}`),
      })
    }
  }

  return {
    recipients,
    totalCount: lines.length - 1, // Exclude header
    validCount: recipients.length,
    invalidCount: errors.length,
    errors: errors.length > 0 ? errors : undefined,
  }
}

/**
 * Replace placeholders in message template
 */
export function replacePlaceholders(
  template: string,
  recipient: CsvRecipient
): string {
  return template
    .replace(/\{name\}/g, recipient.name)
    .replace(/\{phone\}/g, recipient.phone)
    .replace(/\{email\}/g, recipient.email || '')
}

/**
 * Calculate deposit amount based on policy
 */
export function calculateDeposit(
  policy: DepositPolicy,
  totalPrice: number
): number {
  if (policy.type === 'percent') {
    return Math.round((totalPrice * policy.value) / 100)
  }
  return Math.round(policy.value)
}

/**
 * Calculate special day price
 */
export function calculateSpecialDayPrice(
  specialDay: SpecialDay,
  basePrice: number
): number {
  if (specialDay.ruleType === 'blocked') {
    return 0 // No booking allowed
  }

  if (specialDay.rateType === 'multiplier') {
    return Math.round(basePrice * (specialDay.rateValue || 1))
  }

  if (specialDay.rateType === 'fixed') {
    return Math.round(specialDay.rateValue || basePrice)
  }

  return basePrice
}

/**
 * Validate SuperAdmin role
 */
export function validateSuperAdminRole(userRole: string): boolean {
  return userRole === 'SUPERADMIN'
}
