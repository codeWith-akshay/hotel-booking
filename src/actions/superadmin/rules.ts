/**
 * SuperAdmin Rules Server Actions
 * 
 * Server-side operations for managing booking rules, deposit policies, and special days.
 * All operations enforce SuperAdmin RBAC.
 * 
 * Operations:
 * - Fetch/update booking rules (3-2-1 windows)
 * - Fetch/update deposit policies
 * - Fetch/upsert/delete special days
 */

'use server'

import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/prisma'
import {
  BookingRule,
  BookingRulesResponse,
  UpdateBookingRulesRequest,
  UpdateBookingRulesRequestSchema,
  DepositPolicy,
  DepositPolicyResponse,
  UpdateDepositPoliciesRequest,
  UpdateDepositPoliciesRequestSchema,
  SpecialDay,
  SpecialDayResponse,
  UpsertSpecialDayRequest,
  UpsertSpecialDayRequestSchema,
  DeleteSpecialDayRequest,
  DeleteSpecialDayRequestSchema,
  FetchSpecialDaysQuery,
  FetchSpecialDaysQuerySchema,
  validateBookingRuleConstraints,
  validateDepositPolicyRanges,
  validateSuperAdminRole,
} from '@/lib/validation/superadmin.validation'

// ==========================================
// BOOKING RULES ACTIONS
// ==========================================

/**
 * Fetch all booking rules (3-2-1 windows)
 * 
 * @returns Array of booking rules or error
 */
export async function fetchBookingRules(): Promise<BookingRulesResponse> {
  try {
    const rules = await prisma.bookingRules.findMany({
      orderBy: { guestType: 'asc' },
    })

    return {
      success: true,
      message: 'Booking rules fetched successfully',
      rules: rules as BookingRule[],
    }
  } catch (error) {
    console.error('[fetchBookingRules] Error:', error)
    return {
      success: false,
      error: 'Failed to fetch booking rules',
    }
  }
}

/**
 * Update booking rules (3-2-1 windows)
 * Validates SuperAdmin permission and rule constraints
 * 
 * @param request - Rules to update with admin ID
 * @returns Updated rules or error
 */
export async function updateBookingRules(
  request: UpdateBookingRulesRequest
): Promise<BookingRulesResponse> {
  try {
    // Validate request
    const validation = UpdateBookingRulesRequestSchema.safeParse(request)
    if (!validation.success) {
      return {
        success: false,
        error: validation.error.issues[0]?.message || 'Validation failed',
      }
    }

    const { rules, adminId } = validation.data

    // Verify SuperAdmin permission
    const admin = await prisma.user.findUnique({
      where: { id: adminId },
      include: { role: true },
    })

    if (!admin || !validateSuperAdminRole(admin.role.name)) {
      return {
        success: false,
        error: 'Unauthorized: SuperAdmin permission required',
      }
    }

    // Validate rule constraints
    const constraintCheck = validateBookingRuleConstraints(rules)
    if (!constraintCheck.valid) {
      return {
        success: false,
        error: constraintCheck.errors.join(', '),
      }
    }

    // Update rules in transaction
    const updatedRules = await prisma.$transaction(async (tx) => {
      const results: BookingRule[] = []

      for (const rule of rules) {
        const updated = await tx.bookingRules.upsert({
          where: { guestType: rule.guestType },
          update: {
            maxDaysAdvance: rule.maxDaysAdvance,
            minDaysNotice: rule.minDaysNotice,
          },
          create: {
            guestType: rule.guestType,
            maxDaysAdvance: rule.maxDaysAdvance,
            minDaysNotice: rule.minDaysNotice,
          },
        })

        results.push(updated as BookingRule)
      }

      return results
    })

    // Revalidate paths
    revalidatePath('/dashboard/superadmin')
    revalidatePath('/api/superadmin/rules')

    return {
      success: true,
      message: 'Booking rules updated successfully',
      rules: updatedRules,
    }
  } catch (error) {
    console.error('[updateBookingRules] Error:', error)
    return {
      success: false,
      error: 'Failed to update booking rules',
    }
  }
}

// ==========================================
// DEPOSIT POLICY ACTIONS
// ==========================================

/**
 * Fetch all deposit policies
 * 
 * @returns Array of deposit policies or error
 */
export async function fetchDepositPolicies(): Promise<DepositPolicyResponse> {
  try {
    const policies = await prisma.depositPolicy.findMany({
      orderBy: { minRooms: 'asc' },
    })

    return {
      success: true,
      message: 'Deposit policies fetched successfully',
      policies: policies as DepositPolicy[],
    }
  } catch (error) {
    console.error('[fetchDepositPolicies] Error:', error)
    return {
      success: false,
      error: 'Failed to fetch deposit policies',
    }
  }
}

/**
 * Update deposit policies
 * Validates SuperAdmin permission and policy ranges
 * 
 * @param request - Policies to update with admin ID
 * @returns Updated policies or error
 */
export async function updateDepositPolicies(
  request: UpdateDepositPoliciesRequest
): Promise<DepositPolicyResponse> {
  try {
    // Validate request
    const validation = UpdateDepositPoliciesRequestSchema.safeParse(request)
    if (!validation.success) {
      return {
        success: false,
        error: validation.error.issues[0]?.message || 'Validation failed',
      }
    }

    const { policies, adminId } = validation.data

    // Verify SuperAdmin permission
    const admin = await prisma.user.findUnique({
      where: { id: adminId },
      include: { role: true },
    })

    if (!admin || !validateSuperAdminRole(admin.role.name)) {
      return {
        success: false,
        error: 'Unauthorized: SuperAdmin permission required',
      }
    }

    // Validate policy ranges
    const rangeCheck = validateDepositPolicyRanges(policies)
    if (!rangeCheck.valid) {
      return {
        success: false,
        error: rangeCheck.errors.join(', '),
      }
    }

    // Update policies in transaction
    const updatedPolicies = await prisma.$transaction(async (tx) => {
      // Delete existing policies
      await tx.depositPolicy.deleteMany({})

      // Create new policies
      const results: DepositPolicy[] = []

      for (const policy of policies) {
        const created = await tx.depositPolicy.create({
          data: {
            minRooms: policy.minRooms,
            maxRooms: policy.maxRooms,
            type: policy.type,
            value: policy.value,
            active: policy.active ?? true,
            description: policy.description || null,
          },
        })

        results.push(created as DepositPolicy)
      }

      return results
    })

    // Revalidate paths
    revalidatePath('/dashboard/superadmin')
    revalidatePath('/api/superadmin/deposit-policies')

    return {
      success: true,
      message: 'Deposit policies updated successfully',
      policies: updatedPolicies,
    }
  } catch (error) {
    console.error('[updateDepositPolicies] Error:', error)
    return {
      success: false,
      error: 'Failed to update deposit policies',
    }
  }
}

// ==========================================
// SPECIAL DAY ACTIONS
// ==========================================

/**
 * Fetch special days with optional filters
 * 
 * @param query - Optional filters (date range, room type, rule type)
 * @returns Array of special days or error
 */
export async function fetchSpecialDays(
  query: FetchSpecialDaysQuery = {}
): Promise<SpecialDayResponse> {
  try {
    // Validate query parameters
    const validation = FetchSpecialDaysQuerySchema.safeParse(query)
    if (!validation.success) {
      return {
        success: false,
        error: validation.error.issues[0]?.message || 'Validation failed',
      }
    }

    const { startDate, endDate, roomTypeId, ruleType, active } = validation.data

    // Build where clause
    const where: any = {}

    if (startDate || endDate) {
      where.date = {}
      if (startDate) where.date.gte = new Date(startDate)
      if (endDate) where.date.lte = new Date(endDate)
    }

    if (roomTypeId) where.roomTypeId = roomTypeId
    if (ruleType) where.ruleType = ruleType
    if (active !== undefined) where.active = active

    const specialDays = await prisma.specialDay.findMany({
      where,
      include: {
        roomType: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: { date: 'asc' },
    })

    return {
      success: true,
      message: 'Special days fetched successfully',
      specialDays: specialDays.map(sd => ({
        ...sd,
        roomTypeId: sd.roomTypeId ?? undefined,
        rateType: sd.rateType ?? undefined,
        rateValue: sd.rateValue ?? undefined,
        description: sd.description ?? undefined,
      })) as SpecialDay[],
    }
  } catch (error) {
    console.error('[fetchSpecialDays] Error:', error)
    return {
      success: false,
      error: 'Failed to fetch special days',
    }
  }
}

/**
 * Create or update special day
 * Validates SuperAdmin permission
 * 
 * @param request - Special day data with admin ID
 * @returns Created/updated special day or error
 */
export async function upsertSpecialDay(
  request: UpsertSpecialDayRequest
): Promise<SpecialDayResponse> {
  try {
    // Validate request
    const validation = UpsertSpecialDayRequestSchema.safeParse(request)
    if (!validation.success) {
      return {
        success: false,
        error: validation.error.issues[0]?.message || 'Validation failed',
      }
    }

    const { specialDay, adminId } = validation.data

    // Verify SuperAdmin permission
    const admin = await prisma.user.findUnique({
      where: { id: adminId },
      include: { role: true },
    })

    if (!admin || !validateSuperAdminRole(admin.role.name)) {
      return {
        success: false,
        error: 'Unauthorized: SuperAdmin permission required',
      }
    }

    // Check if room type exists (if specified)
    if (specialDay.roomTypeId) {
      const roomType = await prisma.roomType.findUnique({
        where: { id: specialDay.roomTypeId },
      })

      if (!roomType) {
        return {
          success: false,
          error: 'Room type not found',
        }
      }
    }

    // Upsert special day
    const dateStr = specialDay.date instanceof Date 
      ? specialDay.date.toISOString() 
      : new Date(specialDay.date).toISOString()

    const result = specialDay.id
      ? await prisma.specialDay.update({
          where: { id: specialDay.id },
          data: {
            date: new Date(dateStr),
            roomTypeId: specialDay.roomTypeId ?? null,
            ruleType: specialDay.ruleType,
            rateType: specialDay.rateType ?? null,
            rateValue: specialDay.rateValue ?? null,
            description: specialDay.description ?? null,
            active: specialDay.active ?? true,
          },
        })
      : await prisma.specialDay.create({
          data: {
            date: new Date(dateStr),
            roomTypeId: specialDay.roomTypeId ?? null,
            ruleType: specialDay.ruleType,
            rateType: specialDay.rateType ?? null,
            rateValue: specialDay.rateValue ?? null,
            description: specialDay.description ?? null,
            active: specialDay.active ?? true,
          },
        })

    // Revalidate paths
    revalidatePath('/dashboard/superadmin')
    revalidatePath('/api/superadmin/special-days')

    return {
      success: true,
      message: `Special day ${specialDay.id ? 'updated' : 'created'} successfully`,
      specialDay: {
        ...result,
        roomTypeId: result.roomTypeId ?? undefined,
        rateType: result.rateType ?? undefined,
        rateValue: result.rateValue ?? undefined,
        description: result.description ?? undefined,
      } as SpecialDay,
    }
  } catch (error) {
    console.error('[upsertSpecialDay] Error:', error)
    return {
      success: false,
      error: 'Failed to save special day',
    }
  }
}

/**
 * Delete special day
 * Validates SuperAdmin permission
 * 
 * @param request - Special day ID with admin ID
 * @returns Success message or error
 */
export async function deleteSpecialDay(
  request: DeleteSpecialDayRequest
): Promise<SpecialDayResponse> {
  try {
    // Validate request
    const validation = DeleteSpecialDayRequestSchema.safeParse(request)
  if (!validation.success) {
    return {
      success: false,
      error: validation.error.issues[0]?.message || 'Validation failed',
    }
  }

  const { id, adminId } = validation.data    // Verify SuperAdmin permission
    const admin = await prisma.user.findUnique({
      where: { id: adminId },
      include: { role: true },
    })

    if (!admin || !validateSuperAdminRole(admin.role.name)) {
      return {
        success: false,
        error: 'Unauthorized: SuperAdmin permission required',
      }
    }

    // Check if special day exists
    const specialDay = await prisma.specialDay.findUnique({
      where: { id },
    })

    if (!specialDay) {
      return {
        success: false,
        error: 'Special day not found',
      }
    }

    // Delete special day
    await prisma.specialDay.delete({
      where: { id },
    })

    // Revalidate paths
    revalidatePath('/dashboard/superadmin')
    revalidatePath('/api/superadmin/special-days')

    return {
      success: true,
      message: 'Special day deleted successfully',
    }
  } catch (error) {
    console.error('[deleteSpecialDay] Error:', error)
    return {
      success: false,
      error: 'Failed to delete special day',
    }
  }
}
