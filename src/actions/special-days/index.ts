// ==========================================
// SPECIAL DAY SERVER ACTIONS (DAY 12)
// ==========================================
// Server actions for managing special day rules
// Admin/SuperAdmin operations

'use server'

import { prisma } from '@/lib/prisma'
import {
  CreateSpecialDaySchema,
  UpdateSpecialDaySchema,
  SpecialDayIdSchema,
  SpecialDayQuerySchema,
  type CreateSpecialDayInput,
  type UpdateSpecialDayInput,
  type SpecialDayQuery,
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
// CREATE SPECIAL DAY
// ==========================================

/**
 * Create a new special day rule
 * Admin/SuperAdmin only
 */
export async function createSpecialDay(input: CreateSpecialDayInput): Promise<ActionResult> {
  try {
    // Validate input
    const validatedInput = CreateSpecialDaySchema.parse(input)

    // Check if room type exists (if specified)
    if (validatedInput.roomTypeId) {
      const roomType = await prisma.roomType.findUnique({
        where: { id: validatedInput.roomTypeId },
      })

      if (!roomType) {
        return {
          success: false,
          error: 'Room type not found',
        }
      }
    }

    // Check for duplicate special day rule
    const roomTypeIdValue = (validatedInput.roomTypeId || null) as string | null
    
    const existing = await prisma.specialDay.findUnique({
      where: {
        date_roomTypeId: {
          date: validatedInput.date,
          roomTypeId: roomTypeIdValue as never,
        },
      },
    })

    if (existing) {
      return {
        success: false,
        error: `A special day rule already exists for this date${
          validatedInput.roomTypeId ? ' and room type' : ''
        }`,
      }
    }

    // Create special day
    const specialDay = await prisma.specialDay.create({
      data: {
        date: validatedInput.date,
        roomTypeId: roomTypeIdValue,
        ruleType: validatedInput.ruleType,
        rateType: validatedInput.rateType || null,
        rateValue: validatedInput.rateValue || null,
        description: validatedInput.description || null,
        active: validatedInput.active,
      },
      include: {
        roomType: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    })

    revalidatePath('/admin/special-days')
    revalidatePath('/superadmin/special-days')

    return {
      success: true,
      data: specialDay,
    }
  } catch (error) {
    console.error('Error creating special day:', error)

    if (error instanceof Error) {
      return {
        success: false,
        error: error.message,
      }
    }

    return {
      success: false,
      error: 'Failed to create special day',
    }
  }
}

// ==========================================
// GET SPECIAL DAYS
// ==========================================

/**
 * Get special days with optional filters
 */
export async function getSpecialDays(query: SpecialDayQuery = {}): Promise<ActionResult> {
  try {
    const validatedQuery = SpecialDayQuerySchema.parse(query)

    const specialDays = await prisma.specialDay.findMany({
      where: {
        ...(validatedQuery.startDate && { date: { gte: validatedQuery.startDate } }),
        ...(validatedQuery.endDate && { date: { lte: validatedQuery.endDate } }),
        ...(validatedQuery.roomTypeId && { roomTypeId: validatedQuery.roomTypeId }),
        ...(validatedQuery.ruleType && { ruleType: validatedQuery.ruleType }),
        ...(validatedQuery.active !== undefined && { active: validatedQuery.active }),
      },
      include: {
        roomType: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: [{ date: 'asc' }, { createdAt: 'desc' }],
    })

    return {
      success: true,
      data: specialDays,
    }
  } catch (error) {
    console.error('Error getting special days:', error)

    return {
      success: false,
      error: 'Failed to fetch special days',
    }
  }
}

// ==========================================
// GET SPECIAL DAY BY ID
// ==========================================

/**
 * Get a single special day by ID
 */
export async function getSpecialDayById(id: string): Promise<ActionResult> {
  try {
    const { id: validatedId } = SpecialDayIdSchema.parse({ id })

    const specialDay = await prisma.specialDay.findUnique({
      where: { id: validatedId },
      include: {
        roomType: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    })

    if (!specialDay) {
      return {
        success: false,
        error: 'Special day not found',
      }
    }

    return {
      success: true,
      data: specialDay,
    }
  } catch (error) {
    console.error('Error getting special day:', error)

    return {
      success: false,
      error: 'Failed to fetch special day',
    }
  }
}

// ==========================================
// UPDATE SPECIAL DAY
// ==========================================

/**
 * Update an existing special day
 * Admin/SuperAdmin only
 */
export async function updateSpecialDay(
  id: string,
  input: UpdateSpecialDayInput
): Promise<ActionResult> {
  try {
    // Validate ID
    const { id: validatedId } = SpecialDayIdSchema.parse({ id })

    // Validate input
    const validatedInput = UpdateSpecialDaySchema.parse(input)

    // Check if special day exists
    const existingSpecialDay = await prisma.specialDay.findUnique({
      where: { id: validatedId },
    })

    if (!existingSpecialDay) {
      return {
        success: false,
        error: 'Special day not found',
      }
    }

    // Check if room type exists (if being updated)
    if (validatedInput.roomTypeId !== undefined && validatedInput.roomTypeId !== null) {
      const roomType = await prisma.roomType.findUnique({
        where: { id: validatedInput.roomTypeId },
      })

      if (!roomType) {
        return {
          success: false,
          error: 'Room type not found',
        }
      }
    }

    // Prepare update data
    const updateData: Record<string, unknown> = {}

    if (validatedInput.date !== undefined) updateData.date = validatedInput.date
    if (validatedInput.roomTypeId !== undefined) updateData.roomTypeId = validatedInput.roomTypeId
    if (validatedInput.ruleType !== undefined) updateData.ruleType = validatedInput.ruleType
    if (validatedInput.rateType !== undefined) updateData.rateType = validatedInput.rateType
    if (validatedInput.rateValue !== undefined) updateData.rateValue = validatedInput.rateValue
    if (validatedInput.description !== undefined)
      updateData.description = validatedInput.description
    if (validatedInput.active !== undefined) updateData.active = validatedInput.active

    // Update special day
    const specialDay = await prisma.specialDay.update({
      where: { id: validatedId },
      data: updateData,
      include: {
        roomType: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    })

    revalidatePath('/admin/special-days')
    revalidatePath('/superadmin/special-days')

    return {
      success: true,
      data: specialDay,
    }
  } catch (error) {
    console.error('Error updating special day:', error)

    if (error instanceof Error) {
      return {
        success: false,
        error: error.message,
      }
    }

    return {
      success: false,
      error: 'Failed to update special day',
    }
  }
}

// ==========================================
// DELETE SPECIAL DAY
// ==========================================

/**
 * Delete a special day (soft delete by setting active to false)
 * Admin/SuperAdmin only
 */
export async function deleteSpecialDay(id: string): Promise<ActionResult> {
  try {
    const { id: validatedId } = SpecialDayIdSchema.parse({ id })

    // Soft delete: set active to false
    const specialDay = await prisma.specialDay.update({
      where: { id: validatedId },
      data: { active: false },
    })

    revalidatePath('/admin/special-days')
    revalidatePath('/superadmin/special-days')

    return {
      success: true,
      data: specialDay,
    }
  } catch (error) {
    console.error('Error deleting special day:', error)

    return {
      success: false,
      error: 'Failed to delete special day',
    }
  }
}

// ==========================================
// GET SPECIAL DAYS FOR DATE RANGE
// ==========================================

/**
 * Get special days that apply to a date range
 * Used for booking validation and price calculation
 */
export async function getSpecialDaysForDateRange(
  startDate: Date,
  endDate: Date,
  roomTypeId?: string
): Promise<ActionResult> {
  try {
    // Get special days that apply to this date range
    // Include both global rules (roomTypeId = null) and room-specific rules
    const specialDays = await prisma.specialDay.findMany({
      where: {
        active: true,
        date: {
          gte: startDate,
          lte: endDate,
        },
        OR: [{ roomTypeId: null }, ...(roomTypeId ? [{ roomTypeId }] : [])],
      },
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
      data: specialDays,
    }
  } catch (error) {
    console.error('Error getting special days for date range:', error)

    return {
      success: false,
      error: 'Failed to fetch special days',
    }
  }
}

// ==========================================
// CHECK IF DATES ARE BLOCKED
// ==========================================

/**
 * Check if any dates in a range are blocked
 * Returns the first blocked date found, or null if none are blocked
 */
export async function checkBlockedDates(
  startDate: Date,
  endDate: Date,
  roomTypeId?: string
): Promise<ActionResult> {
  try {
    const blockedDay = await prisma.specialDay.findFirst({
      where: {
        active: true,
        ruleType: 'blocked',
        date: {
          gte: startDate,
          lte: endDate,
        },
        OR: [{ roomTypeId: null }, ...(roomTypeId ? [{ roomTypeId }] : [])],
      },
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

    if (blockedDay) {
      return {
        success: false,
        error: `Booking not allowed: ${
          blockedDay.description || 'This date is blocked'
        } (${blockedDay.date.toLocaleDateString()})`,
        data: blockedDay,
      }
    }

    return {
      success: true,
      data: null,
    }
  } catch (error) {
    console.error('Error checking blocked dates:', error)

    return {
      success: false,
      error: 'Failed to check date availability',
    }
  }
}
