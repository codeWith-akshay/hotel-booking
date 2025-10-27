// ==========================================
// BOOKING RULES MANAGEMENT ACTIONS (SuperAdmin)
// ==========================================
// Server actions for managing booking rules (3-2-1 rule editor)

'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { GuestType } from '@prisma/client'
import { createAuditLog } from '@/lib/services/audit.service'
import { AuditAction, AuditTargetType } from '@/lib/services/audit.service'

// ==========================================
// TYPES
// ==========================================

export interface BookingRule {
  id: string
  guestType: GuestType
  maxDaysAdvance: number
  minDaysNotice: number
  createdAt: Date
  updatedAt: Date
}

export interface BookingRuleInput {
  guestType: GuestType
  maxDaysAdvance: number
  minDaysNotice: number
}

export interface ActionResult<T = void> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

// ==========================================
// GET ALL BOOKING RULES
// ==========================================

export async function getBookingRules(): Promise<ActionResult<BookingRule[]>> {
  try {
    const rules = await prisma.bookingRules.findMany({
      orderBy: {
        guestType: 'asc',
      },
    })

    return {
      success: true,
      data: rules,
    }
  } catch (error) {
    console.error('Error fetching booking rules:', error)
    return {
      success: false,
      error: 'Failed to fetch booking rules',
    }
  }
}

// ==========================================
// GET SINGLE BOOKING RULE
// ==========================================

export async function getBookingRuleByGuestType(
  guestType: GuestType
): Promise<ActionResult<BookingRule>> {
  try {
    const rule = await prisma.bookingRules.findUnique({
      where: { guestType },
    })

    if (!rule) {
      return {
        success: false,
        error: `No booking rule found for guest type: ${guestType}`,
      }
    }

    return {
      success: true,
      data: rule,
    }
  } catch (error) {
    console.error('Error fetching booking rule:', error)
    return {
      success: false,
      error: 'Failed to fetch booking rule',
    }
  }
}

// ==========================================
// CREATE OR UPDATE BOOKING RULE
// ==========================================

export async function upsertBookingRule(
  input: BookingRuleInput,
  adminId?: string
): Promise<ActionResult<BookingRule>> {
  try {
    // Validation
    if (input.maxDaysAdvance < 1 || input.maxDaysAdvance > 365) {
      return {
        success: false,
        error: 'Max days advance must be between 1 and 365',
      }
    }

    if (input.minDaysNotice < 0 || input.minDaysNotice > 30) {
      return {
        success: false,
        error: 'Min days notice must be between 0 and 30',
      }
    }

    if (input.minDaysNotice >= input.maxDaysAdvance) {
      return {
        success: false,
        error: 'Min days notice must be less than max days advance',
      }
    }

    // Check if rule exists
    const existingRule = await prisma.bookingRules.findUnique({
      where: { guestType: input.guestType },
    })

    const rule = await prisma.bookingRules.upsert({
      where: { guestType: input.guestType },
      update: {
        maxDaysAdvance: input.maxDaysAdvance,
        minDaysNotice: input.minDaysNotice,
      },
      create: {
        guestType: input.guestType,
        maxDaysAdvance: input.maxDaysAdvance,
        minDaysNotice: input.minDaysNotice,
      },
    })

    // Audit logging
    if (adminId) {
      await createAuditLog({
        adminId,
        adminRole: 'SUPERADMIN',
        action: existingRule ? AuditAction.UPDATE : AuditAction.CREATE,
        targetType: AuditTargetType.SYSTEM,
        targetId: rule.id,
        changes: {
          before: existingRule || null,
          after: rule,
        },
        reason: `${existingRule ? 'Updated' : 'Created'} booking rule for ${input.guestType}`,
        metadata: {
          guestType: input.guestType,
          operation: existingRule ? 'update' : 'create',
        },
      })
    }

    // Revalidate relevant pages
    revalidatePath('/superadmin/dashboard')
    revalidatePath('/booking')

    return {
      success: true,
      data: rule,
      message: `Booking rule for ${input.guestType} ${existingRule ? 'updated' : 'created'} successfully`,
    }
  } catch (error) {
    console.error('Error upserting booking rule:', error)
    return {
      success: false,
      error: 'Failed to save booking rule',
    }
  }
}

// ==========================================
// DELETE BOOKING RULE
// ==========================================

export async function deleteBookingRule(
  guestType: GuestType,
  adminId?: string
): Promise<ActionResult> {
  try {
    const existingRule = await prisma.bookingRules.findUnique({
      where: { guestType },
    })

    if (!existingRule) {
      return {
        success: false,
        error: `No booking rule found for guest type: ${guestType}`,
      }
    }

    await prisma.bookingRules.delete({
      where: { guestType },
    })

    // Audit logging
    if (adminId) {
      await createAuditLog({
        adminId,
        adminRole: 'SUPERADMIN',
        action: AuditAction.DELETE,
        targetType: AuditTargetType.SYSTEM,
        targetId: existingRule.id,
        changes: {
          before: existingRule,
          after: null,
        },
        reason: `Deleted booking rule for ${guestType}`,
        metadata: {
          guestType,
        },
      })
    }

    // Revalidate relevant pages
    revalidatePath('/superadmin/dashboard')
    revalidatePath('/booking')

    return {
      success: true,
      message: `Booking rule for ${guestType} deleted successfully`,
    }
  } catch (error) {
    console.error('Error deleting booking rule:', error)
    return {
      success: false,
      error: 'Failed to delete booking rule',
    }
  }
}

// ==========================================
// BULK UPDATE BOOKING RULES (3-2-1 Preset)
// ==========================================

export async function applyDefaultBookingRules(
  adminId?: string
): Promise<ActionResult> {
  try {
    // Default 3-2-1 rule:
    // VIP: 3 days advance, 0 days notice
    // REGULAR: 2 days advance, 1 day notice
    // CORPORATE: 1 day advance, 0 days notice (flexible for business)
    
    const defaultRules = [
      { guestType: GuestType.VIP, maxDaysAdvance: 90, minDaysNotice: 0 },
      { guestType: GuestType.REGULAR, maxDaysAdvance: 60, minDaysNotice: 1 },
      { guestType: GuestType.CORPORATE, maxDaysAdvance: 30, minDaysNotice: 0 },
    ]

    const results = await Promise.all(
      defaultRules.map((rule) =>
        prisma.bookingRules.upsert({
          where: { guestType: rule.guestType },
          update: {
            maxDaysAdvance: rule.maxDaysAdvance,
            minDaysNotice: rule.minDaysNotice,
          },
          create: rule,
        })
      )
    )

    // Audit logging
    if (adminId) {
      await createAuditLog({
        adminId,
        adminRole: 'SUPERADMIN',
        action: AuditAction.SYSTEM_SETTINGS_UPDATE,
        targetType: AuditTargetType.SYSTEM,
        targetId: 'booking-rules-bulk',
        changes: {
          before: null,
          after: results,
        },
        reason: 'Applied default booking rules (3-2-1 preset)',
        metadata: {
          rulesCount: defaultRules.length,
          rules: defaultRules,
        },
      })
    }

    // Revalidate relevant pages
    revalidatePath('/superadmin/dashboard')
    revalidatePath('/booking')

    return {
      success: true,
      message: `Default booking rules applied successfully (${defaultRules.length} rules)`,
    }
  } catch (error) {
    console.error('Error applying default booking rules:', error)
    return {
      success: false,
      error: 'Failed to apply default booking rules',
    }
  }
}

// ==========================================
// GET BOOKING RULE DESCRIPTION
// ==========================================

export function getBookingRuleDescription(rule: BookingRule): string {
  const descriptions = {
    [GuestType.VIP]: `VIP guests can book ${rule.maxDaysAdvance} days in advance with ${rule.minDaysNotice} day(s) notice`,
    [GuestType.REGULAR]: `Regular guests can book ${rule.maxDaysAdvance} days in advance with ${rule.minDaysNotice} day(s) notice`,
    [GuestType.CORPORATE]: `Corporate guests can book ${rule.maxDaysAdvance} days in advance with ${rule.minDaysNotice} day(s) notice`,
  }

  return descriptions[rule.guestType] || `${rule.maxDaysAdvance} days advance, ${rule.minDaysNotice} days notice`
}
