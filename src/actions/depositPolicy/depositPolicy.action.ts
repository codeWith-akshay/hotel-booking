// ==========================================
// DEPOSIT POLICY SERVER ACTIONS (Day 12)
// ==========================================
// CRUD operations for managing deposit policies
// SuperAdmin-only functionality

'use server'

import { prisma } from '@/lib/prisma'
import {
  createDepositPolicySchema,
  updateDepositPolicySchema,
  depositPolicyIdSchema,
  listDepositPoliciesSchema,
  type CreateDepositPolicyInput,
  type UpdateDepositPolicyInput,
  type DepositPolicyIdInput,
  type ListDepositPoliciesInput,
  type DepositPolicyResponse,
} from '@/lib/validation/depositPolicy.validation'
import { requireAuth } from '@/lib/auth'
import { RoleName } from '@prisma/client'

// ==========================================
// CREATE DEPOSIT POLICY
// ==========================================

/**
 * Create a new deposit policy
 * @requires SuperAdmin role
 * @param input - Deposit policy data
 * @returns Created deposit policy or error
 */
export async function createDepositPolicy(input: CreateDepositPolicyInput): Promise<{
  success: boolean
  data?: DepositPolicyResponse
  error?: string
}> {
  try {
    // Validate authentication and authorization
    const user = await requireAuth()
    if (user.role.name !== RoleName.SUPERADMIN) {
      return {
        success: false,
        error: 'Unauthorized. SuperAdmin access required.',
      }
    }

    // Validate input
    const validatedInput = createDepositPolicySchema.parse(input)

    // Check for overlapping policies
    const overlapping = await prisma.depositPolicy.findFirst({
      where: {
        active: true,
        OR: [
          {
            // New policy min is within existing range
            minRooms: {
              lte: validatedInput.minRooms,
            },
            maxRooms: {
              gte: validatedInput.minRooms,
            },
          },
          {
            // New policy max is within existing range
            minRooms: {
              lte: validatedInput.maxRooms,
            },
            maxRooms: {
              gte: validatedInput.maxRooms,
            },
          },
          {
            // Existing policy is completely within new range
            minRooms: {
              gte: validatedInput.minRooms,
            },
            maxRooms: {
              lte: validatedInput.maxRooms,
            },
          },
        ],
      },
    })

    if (overlapping) {
      return {
        success: false,
        error: `Overlapping policy exists: ${overlapping.minRooms}-${overlapping.maxRooms} rooms. Please adjust the range or deactivate the existing policy.`,
      }
    }

    // Create deposit policy
    const policy = await prisma.depositPolicy.create({
      data: {
        minRooms: validatedInput.minRooms,
        maxRooms: validatedInput.maxRooms,
        type: validatedInput.type,
        value: validatedInput.value,
        active: validatedInput.active,
      },
    })

    console.log(`✅ Deposit policy created: ${policy.id} (${policy.minRooms}-${policy.maxRooms} rooms)`)

    return {
      success: true,
      data: policy,
    }
  } catch (error) {
    console.error('❌ Error creating deposit policy:', error)

    if (error instanceof Error) {
      return {
        success: false,
        error: error.message,
      }
    }

    return {
      success: false,
      error: 'Failed to create deposit policy. Please try again.',
    }
  }
}

// ==========================================
// UPDATE DEPOSIT POLICY
// ==========================================

/**
 * Update an existing deposit policy
 * @requires SuperAdmin role
 * @param input - Updated deposit policy data
 * @returns Updated deposit policy or error
 */
export async function updateDepositPolicy(input: UpdateDepositPolicyInput): Promise<{
  success: boolean
  data?: DepositPolicyResponse
  error?: string
}> {
  try {
    // Validate authentication and authorization
    const user = await requireAuth()
    if (user.role.name !== RoleName.SUPERADMIN) {
      return {
        success: false,
        error: 'Unauthorized. SuperAdmin access required.',
      }
    }

    // Validate input
    const validatedInput = updateDepositPolicySchema.parse(input)

    // Check if policy exists
    const existing = await prisma.depositPolicy.findUnique({
      where: { id: validatedInput.id },
    })

    if (!existing) {
      return {
        success: false,
        error: 'Deposit policy not found',
      }
    }

    // Check for overlapping policies (excluding current policy)
    if (validatedInput.minRooms !== undefined || validatedInput.maxRooms !== undefined) {
      const minRooms = validatedInput.minRooms ?? existing.minRooms
      const maxRooms = validatedInput.maxRooms ?? existing.maxRooms

      const overlapping = await prisma.depositPolicy.findFirst({
        where: {
          id: {
            not: validatedInput.id,
          },
          active: true,
          OR: [
            {
              minRooms: { lte: minRooms },
              maxRooms: { gte: minRooms },
            },
            {
              minRooms: { lte: maxRooms },
              maxRooms: { gte: maxRooms },
            },
            {
              minRooms: { gte: minRooms },
              maxRooms: { lte: maxRooms },
            },
          ],
        },
      })

      if (overlapping) {
        return {
          success: false,
          error: `Overlapping policy exists: ${overlapping.minRooms}-${overlapping.maxRooms} rooms`,
        }
      }
    }

    // Update deposit policy
    const { id, ...updateData } = validatedInput
    const policy = await prisma.depositPolicy.update({
      where: { id },
      data: updateData,
    })

    console.log(`✅ Deposit policy updated: ${policy.id}`)

    return {
      success: true,
      data: policy,
    }
  } catch (error) {
    console.error('❌ Error updating deposit policy:', error)

    if (error instanceof Error) {
      return {
        success: false,
        error: error.message,
      }
    }

    return {
      success: false,
      error: 'Failed to update deposit policy. Please try again.',
    }
  }
}

// ==========================================
// DELETE DEPOSIT POLICY
// ==========================================

/**
 * Delete a deposit policy
 * @requires SuperAdmin role
 * @param input - Policy ID
 * @returns Success status or error
 */
export async function deleteDepositPolicy(input: DepositPolicyIdInput): Promise<{
  success: boolean
  error?: string
}> {
  try {
    // Validate authentication and authorization
    const user = await requireAuth()
    if (user.role.name !== RoleName.SUPERADMIN) {
      return {
        success: false,
        error: 'Unauthorized. SuperAdmin access required.',
      }
    }

    // Validate input
    const validatedInput = depositPolicyIdSchema.parse(input)

    // Check if policy exists
    const existing = await prisma.depositPolicy.findUnique({
      where: { id: validatedInput.id },
    })

    if (!existing) {
      return {
        success: false,
        error: 'Deposit policy not found',
      }
    }

    // Delete deposit policy
    await prisma.depositPolicy.delete({
      where: { id: validatedInput.id },
    })

    console.log(`✅ Deposit policy deleted: ${validatedInput.id}`)

    return {
      success: true,
    }
  } catch (error) {
    console.error('❌ Error deleting deposit policy:', error)

    if (error instanceof Error) {
      return {
        success: false,
        error: error.message,
      }
    }

    return {
      success: false,
      error: 'Failed to delete deposit policy. Please try again.',
    }
  }
}

// ==========================================
// GET DEPOSIT POLICY
// ==========================================

/**
 * Get a single deposit policy by ID
 * @requires SuperAdmin role
 * @param input - Policy ID
 * @returns Deposit policy or error
 */
export async function getDepositPolicy(input: DepositPolicyIdInput): Promise<{
  success: boolean
  data?: DepositPolicyResponse
  error?: string
}> {
  try {
    // Validate authentication and authorization
    const user = await requireAuth()
    if (user.role.name !== RoleName.SUPERADMIN) {
      return {
        success: false,
        error: 'Unauthorized. SuperAdmin access required.',
      }
    }

    // Validate input
    const validatedInput = depositPolicyIdSchema.parse(input)

    // Get deposit policy
    const policy = await prisma.depositPolicy.findUnique({
      where: { id: validatedInput.id },
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
    console.error('❌ Error fetching deposit policy:', error)

    if (error instanceof Error) {
      return {
        success: false,
        error: error.message,
      }
    }

    return {
      success: false,
      error: 'Failed to fetch deposit policy. Please try again.',
    }
  }
}

// ==========================================
// LIST DEPOSIT POLICIES
// ==========================================

/**
 * List all deposit policies
 * @requires SuperAdmin role
 * @param input - Filter options
 * @returns Array of deposit policies or error
 */
export async function listDepositPolicies(input?: ListDepositPoliciesInput): Promise<{
  success: boolean
  data?: DepositPolicyResponse[]
  error?: string
}> {
  try {
    // Validate authentication and authorization
    const user = await requireAuth()
    if (user.role.name !== RoleName.SUPERADMIN) {
      return {
        success: false,
        error: 'Unauthorized. SuperAdmin access required.',
      }
    }

    // Validate input
    const validatedInput = input ? listDepositPoliciesSchema.parse(input) : { activeOnly: false }

    // Build query
    const where = validatedInput.activeOnly ? { active: true } : {}

    // Get deposit policies
    const policies = await prisma.depositPolicy.findMany({
      where,
      orderBy: {
        minRooms: 'asc',
      },
    })

    return {
      success: true,
      data: policies,
    }
  } catch (error) {
    console.error('❌ Error listing deposit policies:', error)

    if (error instanceof Error) {
      return {
        success: false,
        error: error.message,
      }
    }

    return {
      success: false,
      error: 'Failed to list deposit policies. Please try again.',
    }
  }
}

// ==========================================
// TOGGLE POLICY STATUS
// ==========================================

/**
 * Toggle active status of a deposit policy
 * @requires SuperAdmin role
 * @param input - Policy ID
 * @returns Updated deposit policy or error
 */
export async function toggleDepositPolicyStatus(input: DepositPolicyIdInput): Promise<{
  success: boolean
  data?: DepositPolicyResponse
  error?: string
}> {
  try {
    // Validate authentication and authorization
    const user = await requireAuth()
    if (user.role.name !== RoleName.SUPERADMIN) {
      return {
        success: false,
        error: 'Unauthorized. SuperAdmin access required.',
      }
    }

    // Validate input
    const validatedInput = depositPolicyIdSchema.parse(input)

    // Get current policy
    const existing = await prisma.depositPolicy.findUnique({
      where: { id: validatedInput.id },
    })

    if (!existing) {
      return {
        success: false,
        error: 'Deposit policy not found',
      }
    }

    // Toggle status
    const policy = await prisma.depositPolicy.update({
      where: { id: validatedInput.id },
      data: {
        active: !existing.active,
      },
    })

    console.log(
      `✅ Deposit policy status toggled: ${policy.id} (${policy.active ? 'active' : 'inactive'})`
    )

    return {
      success: true,
      data: policy,
    }
  } catch (error) {
    console.error('❌ Error toggling deposit policy status:', error)

    if (error instanceof Error) {
      return {
        success: false,
        error: error.message,
      }
    }

    return {
      success: false,
      error: 'Failed to toggle deposit policy status. Please try again.',
    }
  }
}
