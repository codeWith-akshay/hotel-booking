// ==========================================
// DEPOSIT POLICY SERVER ACTIONS (DAY 12)
// ==========================================
// Server actions for managing deposit policies
// SuperAdmin-only operations

'use server'

import { prisma } from '@/lib/prisma'
import {
  CreateDepositPolicySchema,
  UpdateDepositPolicySchema,
  DepositPolicyIdSchema,
  DepositPolicyQuerySchema,
  type CreateDepositPolicyInput,
  type UpdateDepositPolicyInput,
  type DepositPolicyQuery,
} from '@/lib/validation/group-booking.validation'
import { revalidatePath } from 'next/cache'

// ==========================================
// TYPES
// ==========================================

interface ActionResult<T = unknown> {
  success: boolean
  data?: T
  error?: string
}

// ==========================================
// CREATE DEPOSIT POLICY
// ==========================================

/**
 * Create a new deposit policy
 * SuperAdmin only
 */
export async function createDepositPolicy(
  input: CreateDepositPolicyInput
): Promise<ActionResult> {
  try {
    // Validate input
    const validatedInput = CreateDepositPolicySchema.parse(input)

    // Validate room range
    if (validatedInput.minRooms > validatedInput.maxRooms) {
      return {
        success: false,
        error: 'Minimum rooms cannot be greater than maximum rooms',
      }
    }

    // Validate percentage value
    if (validatedInput.type === 'percent' && validatedInput.value > 100) {
      return {
        success: false,
        error: 'Percentage value cannot exceed 100',
      }
    }

    // Check for overlapping policies
    const overlapping = await prisma.depositPolicy.findFirst({
      where: {
        active: true,
        OR: [
          {
            AND: [
              { minRooms: { lte: validatedInput.minRooms } },
              { maxRooms: { gte: validatedInput.minRooms } },
            ],
          },
          {
            AND: [
              { minRooms: { lte: validatedInput.maxRooms } },
              { maxRooms: { gte: validatedInput.maxRooms } },
            ],
          },
          {
            AND: [
              { minRooms: { gte: validatedInput.minRooms } },
              { maxRooms: { lte: validatedInput.maxRooms } },
            ],
          },
        ],
      },
    })

    if (overlapping) {
      return {
        success: false,
        error: `Policy overlaps with existing policy for ${overlapping.minRooms}-${overlapping.maxRooms} rooms`,
      }
    }

    // Create deposit policy
    const policy = await prisma.depositPolicy.create({
      data: {
        minRooms: validatedInput.minRooms,
        maxRooms: validatedInput.maxRooms,
        type: validatedInput.type,
        value: validatedInput.value,
        description: validatedInput.description ?? null,
        active: validatedInput.active,
      },
    })

    revalidatePath('/admin/deposit-policies')
    revalidatePath('/superadmin/deposit-policies')

    return {
      success: true,
      data: policy,
    }
  } catch (error) {
    console.error('Error creating deposit policy:', error)

    if (error instanceof Error) {
      return {
        success: false,
        error: error.message,
      }
    }

    return {
      success: false,
      error: 'Failed to create deposit policy',
    }
  }
}

// ==========================================
// GET DEPOSIT POLICIES
// ==========================================

/**
 * Get all deposit policies with optional filters
 */
export async function getDepositPolicies(
  query: DepositPolicyQuery = {}
): Promise<ActionResult> {
  try {
    const validatedQuery = DepositPolicyQuerySchema.parse(query)

    const policies = await prisma.depositPolicy.findMany({
      where: {
        ...(validatedQuery.active !== undefined && { active: validatedQuery.active }),
        ...(validatedQuery.minRooms !== undefined && {
          minRooms: { gte: validatedQuery.minRooms },
        }),
        ...(validatedQuery.maxRooms !== undefined && {
          maxRooms: { lte: validatedQuery.maxRooms },
        }),
      },
      orderBy: [{ minRooms: 'asc' }, { createdAt: 'desc' }],
    })

    return {
      success: true,
      data: policies,
    }
  } catch (error) {
    console.error('Error getting deposit policies:', error)

    return {
      success: false,
      error: 'Failed to fetch deposit policies',
    }
  }
}

// ==========================================
// GET DEPOSIT POLICY BY ID
// ==========================================

/**
 * Get a single deposit policy by ID
 */
export async function getDepositPolicyById(id: string): Promise<ActionResult> {
  try {
    const { id: validatedId } = DepositPolicyIdSchema.parse({ id })

    const policy = await prisma.depositPolicy.findUnique({
      where: { id: validatedId },
    })

    if (!policy) {
      return {
        success: false,
        error: 'Deposit policy not found',
      }
    }

    return {
      success: true,
      data: policy,
    }
  } catch (error) {
    console.error('Error getting deposit policy:', error)

    return {
      success: false,
      error: 'Failed to fetch deposit policy',
    }
  }
}

// ==========================================
// UPDATE DEPOSIT POLICY
// ==========================================

/**
 * Update an existing deposit policy
 * SuperAdmin only
 */
export async function updateDepositPolicy(
  id: string,
  input: UpdateDepositPolicyInput
): Promise<ActionResult> {
  try {
    // Validate ID
    const { id: validatedId } = DepositPolicyIdSchema.parse({ id })

    // Validate input
    const validatedInput = UpdateDepositPolicySchema.parse(input)

    // Check if policy exists
    const existingPolicy = await prisma.depositPolicy.findUnique({
      where: { id: validatedId },
    })

    if (!existingPolicy) {
      return {
        success: false,
        error: 'Deposit policy not found',
      }
    }

    // Prepare update data
    const updateData: Record<string, unknown> = {}

    if (validatedInput.minRooms !== undefined) updateData.minRooms = validatedInput.minRooms
    if (validatedInput.maxRooms !== undefined) updateData.maxRooms = validatedInput.maxRooms
    if (validatedInput.type !== undefined) updateData.type = validatedInput.type
    if (validatedInput.value !== undefined) updateData.value = validatedInput.value
    if (validatedInput.description !== undefined)
      updateData.description = validatedInput.description
    if (validatedInput.active !== undefined) updateData.active = validatedInput.active

    // Validate room range if both are being updated
    const finalMinRooms = validatedInput.minRooms ?? existingPolicy.minRooms
    const finalMaxRooms = validatedInput.maxRooms ?? existingPolicy.maxRooms

    if (finalMinRooms > finalMaxRooms) {
      return {
        success: false,
        error: 'Minimum rooms cannot be greater than maximum rooms',
      }
    }

    // Validate percentage if type is percent
    const finalType = validatedInput.type ?? existingPolicy.type
    const finalValue = validatedInput.value ?? existingPolicy.value

    if (finalType === 'percent' && finalValue > 100) {
      return {
        success: false,
        error: 'Percentage value cannot exceed 100',
      }
    }

    // Update policy
    const policy = await prisma.depositPolicy.update({
      where: { id: validatedId },
      data: updateData,
    })

    revalidatePath('/admin/deposit-policies')
    revalidatePath('/superadmin/deposit-policies')

    return {
      success: true,
      data: policy,
    }
  } catch (error) {
    console.error('Error updating deposit policy:', error)

    if (error instanceof Error) {
      return {
        success: false,
        error: error.message,
      }
    }

    return {
      success: false,
      error: 'Failed to update deposit policy',
    }
  }
}

// ==========================================
// DELETE DEPOSIT POLICY
// ==========================================

/**
 * Delete a deposit policy (soft delete by setting active to false)
 * SuperAdmin only
 */
export async function deleteDepositPolicy(id: string): Promise<ActionResult> {
  try {
    const { id: validatedId } = DepositPolicyIdSchema.parse({ id })

    // Soft delete: set active to false
    const policy = await prisma.depositPolicy.update({
      where: { id: validatedId },
      data: { active: false },
    })

    revalidatePath('/admin/deposit-policies')
    revalidatePath('/superadmin/deposit-policies')

    return {
      success: true,
      data: policy,
    }
  } catch (error) {
    console.error('Error deleting deposit policy:', error)

    return {
      success: false,
      error: 'Failed to delete deposit policy',
    }
  }
}

// ==========================================
// GET APPLICABLE DEPOSIT POLICY
// ==========================================

/**
 * Get the applicable deposit policy for a given number of rooms
 * Returns the matching active policy or null if no deposit required
 */
export async function getApplicableDepositPolicy(
  roomsBooked: number
): Promise<ActionResult> {
  try {
    const policy = await prisma.depositPolicy.findFirst({
      where: {
        active: true,
        minRooms: { lte: roomsBooked },
        maxRooms: { gte: roomsBooked },
      },
      orderBy: { createdAt: 'desc' },
    })

    return {
      success: true,
      data: policy,
    }
  } catch (error) {
    console.error('Error getting applicable deposit policy:', error)

    return {
      success: false,
      error: 'Failed to check deposit requirements',
    }
  }
}

// ==========================================
// CALCULATE DEPOSIT AMOUNT
// ==========================================

/**
 * Calculate the required deposit amount for a booking
 * Returns { required: boolean, amount: number, policy?: DepositPolicy }
 */
export async function calculateDepositAmount(
  roomsBooked: number,
  totalPrice: number
): Promise<ActionResult> {
  try {
    const policyResult = await getApplicableDepositPolicy(roomsBooked)

    if (!policyResult.success) {
      return policyResult
    }

    const policy = policyResult.data as {
      id: string
      minRooms: number
      maxRooms: number
      type: string
      value: number
      description: string | null
      active: boolean
    } | null

    // No policy applies - no deposit required
    if (!policy) {
      return {
        success: true,
        data: {
          required: false,
          amount: 0,
          reason: 'No deposit required for this booking size',
        },
      }
    }

    // Calculate deposit amount based on policy type
    let depositAmount = 0

    if (policy.type === 'percent') {
      depositAmount = Math.round((totalPrice * policy.value) / 100)
    } else if (policy.type === 'fixed') {
      depositAmount = Math.round(policy.value)
    }

    return {
      success: true,
      data: {
        required: true,
        amount: depositAmount,
        policy,
        reason: policy.description || `Deposit required for ${roomsBooked} rooms`,
      },
    }
  } catch (error) {
    console.error('Error calculating deposit amount:', error)

    return {
      success: false,
      error: 'Failed to calculate deposit amount',
    }
  }
}
