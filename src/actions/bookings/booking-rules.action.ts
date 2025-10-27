// ==========================================
// BOOKING RULES SERVER ACTIONS
// ==========================================
// Server actions for managing booking rules and policies
// Features: Guest type management, "3-2-1 rule" configuration

'use server'

import { prisma } from '@/lib/prisma'
import {
  CreateBookingRulesSchema,
  UpdateBookingRulesSchema,
  GetBookingRulesSchema,
} from '@/lib/validation/booking.validation'
import type {
  BookingRulesResponse,
  GetBookingRulesResponse,
  BookingRulesWithMetadata,
} from '@/types/prisma-booking.types'
import { GuestType, Prisma } from '@prisma/client'

// ==========================================
// CREATE BOOKING RULES
// ==========================================

/**
 * Create new booking rules for a guest type
 * 
 * @param input - Booking rules creation data
 * @returns Server action response with created rules
 */
export async function createBookingRules(
  input: unknown
): Promise<BookingRulesResponse> {
  try {
    // ==========================================
    // INPUT VALIDATION
    // ==========================================
    const validation = CreateBookingRulesSchema.safeParse(input)

    if (!validation.success) {
      const errors = validation.error.issues.map((err) => err.message).join(', ')
      return {
        success: false,
        message: `Validation failed: ${errors}`,
        error: errors,
      }
    }

    const { guestType, maxDaysAdvance, minDaysNotice } = validation.data

    // ==========================================
    // CREATE RULES
    // ==========================================
    const rules = await prisma.bookingRules.create({
      data: {
        guestType,
        maxDaysAdvance,
        minDaysNotice,
      },
    })

    // Get applicable user count
    const applicableUserCount = await getApplicableUserCount(guestType)

    const rulesWithMetadata: BookingRulesWithMetadata = {
      ...rules,
      isActive: true,
      applicableUserCount,
    }

    return {
      success: true,
      message: `Booking rules created for ${guestType} guests`,
      data: rulesWithMetadata,
    }
  } catch (error) {
    console.error('Error creating booking rules:', error)
    
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2002') {
        return {
          success: false,
          message: 'Booking rules already exist for this guest type',
          error: 'Duplicate guest type',
        }
      }
      
      return {
        success: false,
        message: 'Database error while creating booking rules',
        error: `Prisma error: ${error.code} - ${error.message}`,
      }
    }

    return {
      success: false,
      message: 'Failed to create booking rules',
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    }
  }
}

// ==========================================
// UPDATE BOOKING RULES
// ==========================================

/**
 * Update existing booking rules
 * 
 * @param input - Booking rules update data
 * @returns Server action response with updated rules
 */
export async function updateBookingRules(
  input: unknown
): Promise<BookingRulesResponse> {
  try {
    // ==========================================
    // INPUT VALIDATION
    // ==========================================
    const validation = UpdateBookingRulesSchema.safeParse(input)

    if (!validation.success) {
      const errors = validation.error.issues.map((err) => err.message).join(', ')
      return {
        success: false,
        message: `Validation failed: ${errors}`,
        error: errors,
      }
    }

    const { id, ...updateData } = validation.data

    // ==========================================
    // UPDATE RULES
    // ==========================================
    const updateFields: Record<string, unknown> = {};
    if (updateData.guestType !== undefined) updateFields.guestType = updateData.guestType;
    if (updateData.maxDaysAdvance !== undefined) updateFields.maxDaysAdvance = updateData.maxDaysAdvance;
    if (updateData.minDaysNotice !== undefined) updateFields.minDaysNotice = updateData.minDaysNotice;

    const rules = await prisma.bookingRules.update({
      where: { id },
      data: updateFields,
    })

    // Get applicable user count
    const applicableUserCount = await getApplicableUserCount(rules.guestType)

    const rulesWithMetadata: BookingRulesWithMetadata = {
      ...rules,
      isActive: true,
      applicableUserCount,
    }

    return {
      success: true,
      message: `Booking rules updated for ${rules.guestType} guests`,
      data: rulesWithMetadata,
    }
  } catch (error) {
    console.error('Error updating booking rules:', error)
    
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2025') {
        return {
          success: false,
          message: 'Booking rules not found',
          error: 'Invalid booking rules ID',
        }
      }
      
      return {
        success: false,
        message: 'Database error while updating booking rules',
        error: `Prisma error: ${error.code} - ${error.message}`,
      }
    }

    return {
      success: false,
      message: 'Failed to update booking rules',
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    }
  }
}

// ==========================================
// GET BOOKING RULES
// ==========================================

/**
 * Get booking rules (all or filtered by guest type)
 * 
 * @param input - Booking rules query parameters
 * @returns Server action response with booking rules
 */
export async function getBookingRules(
  input: unknown = {}
): Promise<GetBookingRulesResponse> {
  try {
    // ==========================================
    // INPUT VALIDATION
    // ==========================================
    const validation = GetBookingRulesSchema.safeParse(input)

    if (!validation.success) {
      const errors = validation.error.issues.map((err) => err.message).join(', ')
      return {
        success: false,
        message: `Validation failed: ${errors}`,
        error: errors,
      }
    }

    const { guestType } = validation.data

    // ==========================================
    // QUERY RULES
    // ==========================================
    const where = guestType ? { guestType } : {}
    
    const rules = await prisma.bookingRules.findMany({
      where,
      orderBy: { guestType: 'asc' },
    })

    // ==========================================
    // ADD METADATA
    // ==========================================
    const rulesWithMetadata: BookingRulesWithMetadata[] = await Promise.all(
      rules.map(async (rule) => {
        const applicableUserCount = await getApplicableUserCount(rule.guestType)
        
        return {
          ...rule,
          isActive: true,
          applicableUserCount,
        }
      })
    )

    return {
      success: true,
      message: `Retrieved ${rules.length} booking rule(s)`,
      data: rulesWithMetadata,
    }
  } catch (error) {
    console.error('Error getting booking rules:', error)
    
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      return {
        success: false,
        message: 'Database error while retrieving booking rules',
        error: `Prisma error: ${error.code} - ${error.message}`,
      }
    }

    return {
      success: false,
      message: 'Failed to retrieve booking rules',
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    }
  }
}

// ==========================================
// DELETE BOOKING RULES
// ==========================================

/**
 * Delete booking rules by ID
 * 
 * @param id - Booking rules ID to delete
 * @returns Server action response
 */
export async function deleteBookingRules(
  id: string
): Promise<BookingRulesResponse> {
  try {
    if (!id || typeof id !== 'string') {
      return {
        success: false,
        message: 'Invalid booking rules ID',
        error: 'ID is required',
      }
    }

    // ==========================================
    // DELETE RULES
    // ==========================================
    const deletedRules = await prisma.bookingRules.delete({
      where: { id },
    })

    const rulesWithMetadata: BookingRulesWithMetadata = {
      ...deletedRules,
      isActive: false,
      applicableUserCount: 0,
    }

    return {
      success: true,
      message: `Booking rules deleted for ${deletedRules.guestType} guests`,
      data: rulesWithMetadata,
    }
  } catch (error) {
    console.error('Error deleting booking rules:', error)
    
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2025') {
        return {
          success: false,
          message: 'Booking rules not found',
          error: 'Invalid booking rules ID',
        }
      }
      
      return {
        success: false,
        message: 'Database error while deleting booking rules',
        error: `Prisma error: ${error.code} - ${error.message}`,
      }
    }

    return {
      success: false,
      message: 'Failed to delete booking rules',
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    }
  }
}

// ==========================================
// HELPER FUNCTIONS
// ==========================================

/**
 * Get count of users applicable to a guest type
 */
async function getApplicableUserCount(guestType: GuestType): Promise<number> {
  try {
    switch (guestType) {
      case GuestType.VIP:
        // Count admins and superadmins
        return await prisma.user.count({
          where: {
            role: {
              name: {
                in: ['ADMIN', 'SUPERADMIN']
              }
            }
          }
        })
      
      case GuestType.CORPORATE:
        // Count users with IRCA membership
        return await prisma.user.count({
          where: {
            ircaMembershipId: {
              not: null
            }
          }
        })
      
      case GuestType.REGULAR:
        // Count regular members (not admin, no IRCA membership)
        return await prisma.user.count({
          where: {
            AND: [
              {
                role: {
                  name: 'MEMBER'
                }
              },
              {
                ircaMembershipId: null
              }
            ]
          }
        })
      
      default:
        return 0
    }
  } catch (error) {
    console.error('Error getting applicable user count:', error)
    return 0
  }
}