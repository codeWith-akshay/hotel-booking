// ==========================================
// SPECIAL DAYS MANAGEMENT ACTIONS (SuperAdmin)
// ==========================================
// Server actions for managing restricted dates and special pricing

'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { createAuditLog } from '@/lib/services/audit.service'
import { AuditAction, AuditTargetType } from '@/lib/services/audit.service'

// ==========================================
// TYPES
// ==========================================

export interface SpecialDay {
  id: string
  date: Date
  roomTypeId: string | null
  ruleType: string
  rateType: string | null
  rateValue: number | null
  description: string | null
  active: boolean
  createdAt: Date
  updatedAt: Date
  roomType?: {
    id: string
    name: string
  } | null
}

export interface SpecialDayInput {
  date: Date
  roomTypeId?: string | null // null = applies to all room types
  ruleType: 'blocked' | 'special_rate'
  rateType?: 'multiplier' | 'fixed'
  rateValue?: number
  description?: string
  active?: boolean
}

export interface ActionResult<T = void> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

// ==========================================
// GET ALL SPECIAL DAYS
// ==========================================

export async function getSpecialDays(
  filters?: {
    startDate?: Date
    endDate?: Date
    roomTypeId?: string
    ruleType?: 'blocked' | 'special_rate'
    activeOnly?: boolean
  }
): Promise<ActionResult<SpecialDay[]>> {
  try {
    const where: any = {}

    if (filters?.startDate || filters?.endDate) {
      where.date = {}
      if (filters.startDate) where.date.gte = filters.startDate
      if (filters.endDate) where.date.lte = filters.endDate
    }

    if (filters?.roomTypeId) {
      where.roomTypeId = filters.roomTypeId
    }

    if (filters?.ruleType) {
      where.ruleType = filters.ruleType
    }

    if (filters?.activeOnly) {
      where.active = true
    }

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
      orderBy: {
        date: 'asc',
      },
    })

    return {
      success: true,
      data: specialDays,
    }
  } catch (error) {
    console.error('Error fetching special days:', error)
    return {
      success: false,
      error: 'Failed to fetch special days',
    }
  }
}

// ==========================================
// GET SINGLE SPECIAL DAY
// ==========================================

export async function getSpecialDayById(
  id: string
): Promise<ActionResult<SpecialDay>> {
  try {
    const specialDay = await prisma.specialDay.findUnique({
      where: { id },
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
    console.error('Error fetching special day:', error)
    return {
      success: false,
      error: 'Failed to fetch special day',
    }
  }
}

// ==========================================
// CREATE SPECIAL DAY
// ==========================================

export async function createSpecialDay(
  input: SpecialDayInput,
  adminId?: string
): Promise<ActionResult<SpecialDay>> {
  try {
    // Validation
    if (input.ruleType === 'special_rate') {
      if (!input.rateType || !input.rateValue) {
        return {
          success: false,
          error: 'Rate type and value are required for special rate rules',
        }
      }

      if (input.rateType === 'multiplier' && (input.rateValue < 0.1 || input.rateValue > 10)) {
        return {
          success: false,
          error: 'Rate multiplier must be between 0.1 and 10',
        }
      }

      if (input.rateType === 'fixed' && input.rateValue < 0) {
        return {
          success: false,
          error: 'Fixed rate must be positive',
        }
      }
    }

    // Check for conflicts
    const existingRule = await prisma.specialDay.findFirst({
      where: {
        date: input.date,
        roomTypeId: input.roomTypeId || null,
      },
    })

    if (existingRule) {
      return {
        success: false,
        error: `A special day rule already exists for this date${input.roomTypeId ? ' and room type' : ''}`,
      }
    }

    const specialDay = await prisma.specialDay.create({
      data: {
        date: input.date,
        roomTypeId: input.roomTypeId || null,
        ruleType: input.ruleType,
        rateType: input.rateType || null,
        rateValue: input.rateValue || null,
        description: input.description || null,
        active: input.active ?? true,
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

    // Audit logging
    if (adminId) {
      await createAuditLog({ adminRole: 'SUPERADMIN',
        adminId,
        action: AuditAction.CREATE,
        targetType: AuditTargetType.SYSTEM,
        targetId: specialDay.id,
        changes: {
          before: null,
          after: specialDay,
        },
        reason: `Created special day rule: ${input.description || input.ruleType}`,
        metadata: {
          date: input.date.toISOString(),
          ruleType: input.ruleType,
          roomTypeId: input.roomTypeId,
        },
      })
    }

    // Revalidate relevant pages
    revalidatePath('/superadmin/dashboard')
    revalidatePath('/booking')
    revalidatePath('/admin/dashboard')

    return {
      success: true,
      data: specialDay,
      message: 'Special day created successfully',
    }
  } catch (error) {
    console.error('Error creating special day:', error)
    return {
      success: false,
      error: 'Failed to create special day',
    }
  }
}

// ==========================================
// UPDATE SPECIAL DAY
// ==========================================

export async function updateSpecialDay(
  id: string,
  input: Partial<SpecialDayInput>,
  adminId?: string
): Promise<ActionResult<SpecialDay>> {
  try {
    const existingDay = await prisma.specialDay.findUnique({
      where: { id },
    })

    if (!existingDay) {
      return {
        success: false,
        error: 'Special day not found',
      }
    }

    // Validation for special_rate
    if (input.ruleType === 'special_rate' || existingDay.ruleType === 'special_rate') {
      const rateType = input.rateType || existingDay.rateType
      const rateValue = input.rateValue ?? existingDay.rateValue

      if (!rateType || rateValue === null) {
        return {
          success: false,
          error: 'Rate type and value are required for special rate rules',
        }
      }

      if (rateType === 'multiplier' && (rateValue < 0.1 || rateValue > 10)) {
        return {
          success: false,
          error: 'Rate multiplier must be between 0.1 and 10',
        }
      }

      if (rateType === 'fixed' && rateValue < 0) {
        return {
          success: false,
          error: 'Fixed rate must be positive',
        }
      }
    }

    const updatedDay = await prisma.specialDay.update({
      where: { id },
      data: {
        ...(input.date && { date: input.date }),
        ...(input.roomTypeId !== undefined && { roomTypeId: input.roomTypeId }),
        ...(input.ruleType && { ruleType: input.ruleType }),
        ...(input.rateType !== undefined && { rateType: input.rateType }),
        ...(input.rateValue !== undefined && { rateValue: input.rateValue }),
        ...(input.description !== undefined && { description: input.description }),
        ...(input.active !== undefined && { active: input.active }),
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

    // Audit logging
    if (adminId) {
      await createAuditLog({ adminRole: 'SUPERADMIN',
        adminId,
        action: AuditAction.UPDATE,
        targetType: AuditTargetType.SYSTEM,
        targetId: id,
        changes: {
          before: existingDay,
          after: updatedDay,
        },
        reason: `Updated special day rule: ${updatedDay.description || updatedDay.ruleType}`,
        metadata: {
          specialDayId: id,
        },
      })
    }

    // Revalidate relevant pages
    revalidatePath('/superadmin/dashboard')
    revalidatePath('/booking')
    revalidatePath('/admin/dashboard')

    return {
      success: true,
      data: updatedDay,
      message: 'Special day updated successfully',
    }
  } catch (error) {
    console.error('Error updating special day:', error)
    return {
      success: false,
      error: 'Failed to update special day',
    }
  }
}

// ==========================================
// DELETE SPECIAL DAY
// ==========================================

export async function deleteSpecialDay(
  id: string,
  adminId?: string
): Promise<ActionResult> {
  try {
    const existingDay = await prisma.specialDay.findUnique({
      where: { id },
      include: {
        roomType: {
          select: {
            name: true,
          },
        },
      },
    })

    if (!existingDay) {
      return {
        success: false,
        error: 'Special day not found',
      }
    }

    await prisma.specialDay.delete({
      where: { id },
    })

    // Audit logging
    if (adminId) {
      await createAuditLog({ adminRole: 'SUPERADMIN',
        adminId,
        action: AuditAction.DELETE,
        targetType: AuditTargetType.SYSTEM,
        targetId: id,
        changes: {
          before: existingDay,
          after: null,
        },
        reason: `Deleted special day rule: ${existingDay.description || existingDay.ruleType}`,
        metadata: {
          date: existingDay.date.toISOString(),
          ruleType: existingDay.ruleType,
        },
      })
    }

    // Revalidate relevant pages
    revalidatePath('/superadmin/dashboard')
    revalidatePath('/booking')
    revalidatePath('/admin/dashboard')

    return {
      success: true,
      message: 'Special day deleted successfully',
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
// BULK CREATE SPECIAL DAYS (Date Range)
// ==========================================

export async function bulkCreateSpecialDays(
  startDate: Date,
  endDate: Date,
  input: Omit<SpecialDayInput, 'date'>,
  adminId?: string
): Promise<ActionResult<SpecialDay[]>> {
  try {
    if (startDate > endDate) {
      return {
        success: false,
        error: 'Start date must be before end date',
      }
    }

    const daysDiff = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))
    
    if (daysDiff > 365) {
      return {
        success: false,
        error: 'Cannot create special days for more than 365 days at once',
      }
    }

    const dates: Date[] = []
    const currentDate = new Date(startDate)
    
    while (currentDate <= endDate) {
      dates.push(new Date(currentDate))
      currentDate.setDate(currentDate.getDate() + 1)
    }

    const specialDays = await Promise.allSettled(
      dates.map(async (date) => {
        // Check if a rule already exists
        const existing = await prisma.specialDay.findFirst({
          where: {
            date,
            roomTypeId: input.roomTypeId ?? null,
          },
        })

        if (existing) {
          return prisma.specialDay.update({
            where: { id: existing.id },
            data: {
              ruleType: input.ruleType,
              rateType: input.rateType || null,
              rateValue: input.rateValue || null,
              description: input.description || null,
              active: input.active ?? true,
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
        } else {
          return prisma.specialDay.create({
            data: {
              date,
              roomTypeId: input.roomTypeId ?? null,
              ruleType: input.ruleType,
              rateType: input.rateType || null,
              rateValue: input.rateValue || null,
              description: input.description || null,
              active: input.active ?? true,
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
        }
      })
    )

    const successfulDays = specialDays
      .filter((r): r is PromiseFulfilledResult<any> => r.status === 'fulfilled')
      .map(r => r.value)

    // Audit logging
    if (adminId) {
      await createAuditLog({ adminRole: 'SUPERADMIN',
        adminId,
        action: AuditAction.CREATE,
        targetType: AuditTargetType.SYSTEM,
        targetId: 'bulk-special-days',
        changes: {
          before: null,
          after: { count: successfulDays.length, dates },
        },
        reason: `Bulk created ${specialDays.length} special day rules`,
        metadata: {
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
          count: specialDays.length,
          ruleType: input.ruleType,
        },
      })
    }

    // Revalidate relevant pages
    revalidatePath('/superadmin/dashboard')
    revalidatePath('/booking')

    return {
      success: true,
      data: successfulDays,
      message: `${successfulDays.length} special days created successfully`,
    }
  } catch (error) {
    console.error('Error bulk creating special days:', error)
    return {
      success: false,
      error: 'Failed to bulk create special days',
    }
  }
}

// ==========================================
// TOGGLE SPECIAL DAY ACTIVE STATUS
// ==========================================

export async function toggleSpecialDayActive(
  id: string,
  adminId?: string
): Promise<ActionResult<SpecialDay>> {
  try {
    const existingDay = await prisma.specialDay.findUnique({
      where: { id },
    })

    if (!existingDay) {
      return {
        success: false,
        error: 'Special day not found',
      }
    }

    const updatedDay = await prisma.specialDay.update({
      where: { id },
      data: {
        active: !existingDay.active,
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

    // Audit logging
    if (adminId) {
      await createAuditLog({ adminRole: 'SUPERADMIN',
        adminId,
        action: AuditAction.UPDATE,
        targetType: AuditTargetType.SYSTEM,
        targetId: id,
        changes: {
          before: { active: existingDay.active },
          after: { active: updatedDay.active },
        },
        reason: `${updatedDay.active ? 'Activated' : 'Deactivated'} special day rule`,
        metadata: {
          date: updatedDay.date.toISOString(),
        },
      })
    }

    // Revalidate relevant pages
    revalidatePath('/superadmin/dashboard')
    revalidatePath('/booking')

    return {
      success: true,
      data: updatedDay,
      message: `Special day ${updatedDay.active ? 'activated' : 'deactivated'} successfully`,
    }
  } catch (error) {
    console.error('Error toggling special day:', error)
    return {
      success: false,
      error: 'Failed to toggle special day status',
    }
  }
}
