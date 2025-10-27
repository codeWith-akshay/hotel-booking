// ==========================================
// WAITLIST SERVER ACTIONS
// ==========================================
// Server actions for waitlist management and operations

'use server'

import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/prisma'
import { sendWaitlistConfirmation } from '@/lib/services/notification-trigger.service'
import {
  JoinWaitlistFormSchema,
  UpdateWaitlistStatusSchema,
  NotifyWaitlistSchema,
  GetUserWaitlistSchema,
  GetWaitlistEntriesSchema,
  CheckWaitlistAvailabilitySchema,
  calculateWaitlistExpiration,
  isWaitlistExpired,
  type JoinWaitlistFormInput,
  type UpdateWaitlistStatusInput,
  type NotifyWaitlistInput,
  type GetUserWaitlistInput,
  type GetWaitlistEntriesInput,
  type CheckWaitlistAvailabilityInput,
  type WaitlistEntryWithDetails,
  type WaitlistStats,
} from '@/lib/validation/waitlist.validation'

// ==========================================
// USER WAITLIST ACTIONS
// ==========================================

/**
 * Join the waitlist for room availability
 */
export async function joinWaitlist(
  userId: string,
  input: JoinWaitlistFormInput
): Promise<{ success: boolean; data?: any; error?: string }> {
  try {
    // Validate input
    const validatedData = JoinWaitlistFormSchema.parse(input)
    
    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { role: true },
    })
    
    if (!user) {
      return { success: false, error: 'User not found' }
    }
    
    // Validate room type if specified
    if (validatedData.roomTypeId) {
      const roomType = await prisma.roomType.findUnique({
        where: { id: validatedData.roomTypeId },
      })
      
      if (!roomType) {
        return { success: false, error: 'Room type not found' }
      }
    }
    
    // Check for existing waitlist entry for same dates and room type
    const existingEntry = await prisma.waitlist.findFirst({
      where: {
        userId,
        roomTypeId: validatedData.roomTypeId,
        startDate: validatedData.startDate,
        endDate: validatedData.endDate,
        status: {
          in: ['PENDING', 'NOTIFIED']
        }
      }
    })
    
    if (existingEntry) {
      return { 
        success: false, 
        error: 'You already have a waitlist entry for these dates and room type' 
      }
    }
    
    // Create waitlist entry
    const waitlistEntry = await prisma.waitlist.create({
      data: {
        userId,
        roomTypeId: validatedData.roomTypeId,
        startDate: validatedData.startDate,
        endDate: validatedData.endDate,
        guests: validatedData.guests,
        guestType: validatedData.guestType,
        deposit: validatedData.deposit,
        notes: validatedData.notes,
        status: 'PENDING',
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            phone: true,
            email: true,
          }
        },
        roomType: {
          select: {
            id: true,
            name: true,
            description: true,
            pricePerNight: true,
          }
        }
      }
    })
    
    // Send waitlist confirmation notification
    // Note: This is async and doesn't block the response
    sendWaitlistConfirmation(waitlistEntry.id).catch(error => {
      console.error('[joinWaitlist] Failed to send notification:', error)
    })
    
    // Revalidate relevant paths
    revalidatePath('/booking')
    revalidatePath('/dashboard')
    revalidatePath(`/profile/${userId}/waitlist`)
    
    return { 
      success: true, 
      data: waitlistEntry,
    }
    
  } catch (error) {
    console.error('Error joining waitlist:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to join waitlist' 
    }
  }
}

/**
 * Get user's waitlist entries
 */
export async function getUserWaitlist(
  userId: string,
  input: GetUserWaitlistInput = { includeExpired: false }
): Promise<{ success: boolean; data?: WaitlistEntryWithDetails[]; error?: string }> {
  try {
    const validatedInput = GetUserWaitlistSchema.parse({ ...input, userId })
    
    // Build where clause
    const whereClause: any = {
      userId: validatedInput.userId || userId,
    }
    
    if (validatedInput.status) {
      whereClause.status = validatedInput.status
    }
    
    if (!validatedInput.includeExpired) {
      whereClause.OR = [
        { expiresAt: null },
        { expiresAt: { gt: new Date() } }
      ]
    }
    
    const waitlistEntries = await prisma.waitlist.findMany({
      where: whereClause,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            phone: true,
            email: true,
          }
        },
        roomType: {
          select: {
            id: true,
            name: true,
            description: true,
            pricePerNight: true,
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })
    
    return { success: true, data: waitlistEntries }
    
  } catch (error) {
    console.error('Error getting user waitlist:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to get waitlist entries' 
    }
  }
}

/**
 * Cancel waitlist entry
 */
export async function cancelWaitlistEntry(
  userId: string,
  waitlistId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // Verify the waitlist entry belongs to the user
    const waitlistEntry = await prisma.waitlist.findFirst({
      where: {
        id: waitlistId,
        userId,
        status: { in: ['PENDING', 'NOTIFIED'] }
      }
    })
    
    if (!waitlistEntry) {
      return { success: false, error: 'Waitlist entry not found or cannot be cancelled' }
    }
    
    // Update status to expired (soft delete)
    await prisma.waitlist.update({
      where: { id: waitlistId },
      data: { 
        status: 'EXPIRED',
        updatedAt: new Date()
      }
    })
    
    // Revalidate relevant paths
    revalidatePath('/dashboard')
    revalidatePath(`/profile/${userId}/waitlist`)
    
    return { success: true }
    
  } catch (error) {
    console.error('Error cancelling waitlist entry:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to cancel waitlist entry' 
    }
  }
}

// ==========================================
// ADMIN WAITLIST ACTIONS
// ==========================================

/**
 * Get all waitlist entries (admin only)
 */
export async function getWaitlistEntries(
  input: GetWaitlistEntriesInput = {
    page: 1,
    limit: 20,
    sortBy: 'createdAt',
    sortOrder: 'desc'
  }
): Promise<{ 
  success: boolean; 
  data?: { 
    entries: WaitlistEntryWithDetails[]; 
    total: number; 
    pages: number; 
  }; 
  error?: string 
}> {
  try {
    const validatedInput = GetWaitlistEntriesSchema.parse(input)
    
    // Build where clause
    const whereClause: any = {}
    
    if (validatedInput.status) {
      whereClause.status = validatedInput.status
    }
    
    if (validatedInput.roomTypeId) {
      whereClause.roomTypeId = validatedInput.roomTypeId
    }
    
    if (validatedInput.startDate) {
      whereClause.startDate = { gte: validatedInput.startDate }
    }
    
    if (validatedInput.endDate) {
      whereClause.endDate = { lte: validatedInput.endDate }
    }
    
    // Get total count
    const total = await prisma.waitlist.count({ where: whereClause })
    
    // Get paginated entries
    const entries = await prisma.waitlist.findMany({
      where: whereClause,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            phone: true,
            email: true,
          }
        },
        roomType: {
          select: {
            id: true,
            name: true,
            description: true,
            pricePerNight: true,
          }
        }
      },
      orderBy: { [validatedInput.sortBy]: validatedInput.sortOrder },
      skip: (validatedInput.page - 1) * validatedInput.limit,
      take: validatedInput.limit,
    })
    
    const pages = Math.ceil(total / validatedInput.limit)
    
    return { 
      success: true, 
      data: { entries, total, pages }
    }
    
  } catch (error) {
    console.error('Error getting waitlist entries:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to get waitlist entries' 
    }
  }
}

/**
 * Update waitlist status (admin only)
 */
export async function updateWaitlistStatus(
  input: UpdateWaitlistStatusInput
): Promise<{ success: boolean; error?: string }> {
  try {
    const validatedInput = UpdateWaitlistStatusSchema.parse(input)
    
    const updateData: any = {
      status: validatedInput.status,
      updatedAt: new Date(),
    }
    
    // Set notifiedAt when status changes to NOTIFIED
    if (validatedInput.status === 'NOTIFIED') {
      updateData.notifiedAt = new Date()
      updateData.expiresAt = calculateWaitlistExpiration(new Date(), 24)
    }
    
    // Add notes if provided
    if (validatedInput.notes) {
      updateData.notes = validatedInput.notes
    }
    
    await prisma.waitlist.update({
      where: { id: validatedInput.id },
      data: updateData
    })
    
    // Revalidate admin paths
    revalidatePath('/admin/waitlist')
    revalidatePath('/superadmin/waitlist')
    
    return { success: true }
    
  } catch (error) {
    console.error('Error updating waitlist status:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to update waitlist status' 
    }
  }
}

/**
 * Notify waitlist user about room availability (admin only)
 */
export async function notifyWaitlistUser(
  input: NotifyWaitlistInput
): Promise<{ success: boolean; error?: string }> {
  try {
    const validatedInput = NotifyWaitlistSchema.parse(input)
    
    // Get waitlist entry
    const waitlistEntry = await prisma.waitlist.findUnique({
      where: { id: validatedInput.id },
      include: {
        user: true,
        roomType: true,
      }
    })
    
    if (!waitlistEntry) {
      return { success: false, error: 'Waitlist entry not found' }
    }
    
    if (waitlistEntry.status !== 'PENDING') {
      return { success: false, error: 'Waitlist entry is not in pending status' }
    }
    
    const now = new Date()
    const expiresAt = calculateWaitlistExpiration(now, validatedInput.expiresInHours)
    
    // Update waitlist entry
    await prisma.waitlist.update({
      where: { id: validatedInput.id },
      data: {
        status: 'NOTIFIED',
        notifiedAt: now,
        expiresAt,
        notes: validatedInput.message,
        updatedAt: now,
      }
    })
    
    // TODO: Send notification (email, SMS, push notification)
    console.log(`Notifying user ${waitlistEntry.user.name} (${waitlistEntry.user.phone}):`, validatedInput.message)
    
    // Revalidate admin paths
    revalidatePath('/admin/waitlist')
    revalidatePath('/superadmin/waitlist')
    
    return { success: true }
    
  } catch (error) {
    console.error('Error notifying waitlist user:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to notify waitlist user' 
    }
  }
}

/**
 * Get waitlist statistics (admin only)
 */
export async function getWaitlistStats(): Promise<{ 
  success: boolean; 
  data?: WaitlistStats; 
  error?: string 
}> {
  try {
    const [total, pending, notified, converted, expired] = await Promise.all([
      prisma.waitlist.count(),
      prisma.waitlist.count({ where: { status: 'PENDING' } }),
      prisma.waitlist.count({ where: { status: 'NOTIFIED' } }),
      prisma.waitlist.count({ where: { status: 'CONVERTED' } }),
      prisma.waitlist.count({ where: { status: 'EXPIRED' } }),
    ])
    
    // Calculate average wait time for converted entries
    const convertedEntries = await prisma.waitlist.findMany({
      where: { status: 'CONVERTED' },
      select: { createdAt: true, updatedAt: true }
    })
    
    const avgWaitTime = convertedEntries.length > 0
      ? convertedEntries.reduce((sum, entry) => {
          const days = Math.ceil((entry.updatedAt.getTime() - entry.createdAt.getTime()) / (1000 * 60 * 60 * 24))
          return sum + days
        }, 0) / convertedEntries.length
      : 0
    
    // Calculate conversion rate
    const conversionRate = total > 0 ? (converted / total) * 100 : 0
    
    const stats: WaitlistStats = {
      total,
      pending,
      notified,
      converted,
      expired,
      avgWaitTime: Math.round(avgWaitTime * 10) / 10, // Round to 1 decimal
      conversionRate: Math.round(conversionRate * 10) / 10, // Round to 1 decimal
    }
    
    return { success: true, data: stats }
    
  } catch (error) {
    console.error('Error getting waitlist stats:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to get waitlist statistics' 
    }
  }
}

// ==========================================
// AVAILABILITY CHECK ACTIONS
// ==========================================

/**
 * Check room availability for waitlist dates
 */
export async function checkWaitlistAvailability(
  input: CheckWaitlistAvailabilityInput
): Promise<{ 
  success: boolean; 
  data?: { hasAvailability: boolean; availableRoomTypes: any[] }; 
  error?: string 
}> {
  try {
    const validatedInput = CheckWaitlistAvailabilitySchema.parse(input)
    
    // Get room types to check
    const roomTypesToCheck = validatedInput.roomTypeId
      ? [{ id: validatedInput.roomTypeId }]
      : await prisma.roomType.findMany({ select: { id: true } })
    
    const availableRoomTypes = []
    
    for (const roomType of roomTypesToCheck) {
      // Check inventory for the date range
      const startDate = validatedInput.startDate
      const endDate = validatedInput.endDate
      const dateList = []
      
      // Generate list of dates to check
      for (let date = new Date(startDate); date < endDate; date.setDate(date.getDate() + 1)) {
        dateList.push(new Date(date))
      }
      
      // Check availability for each date
      const inventoryChecks = await Promise.all(
        dateList.map(date =>
          prisma.roomInventory.findUnique({
            where: {
              roomTypeId_date: {
                roomTypeId: roomType.id,
                date,
              }
            }
          })
        )
      )
      
      // Check if all dates have sufficient availability
      const hasAvailability = inventoryChecks.every(inventory => 
        inventory && inventory.availableRooms > 0
      )
      
      if (hasAvailability) {
        const roomTypeDetails = await prisma.roomType.findUnique({
          where: { id: roomType.id }
        })
        if (roomTypeDetails) {
          availableRoomTypes.push(roomTypeDetails)
        }
      }
    }
    
    return {
      success: true,
      data: {
        hasAvailability: availableRoomTypes.length > 0,
        availableRoomTypes,
      }
    }
    
  } catch (error) {
    console.error('Error checking waitlist availability:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to check availability' 
    }
  }
}

/**
 * Process expired waitlist entries (should be run as a cron job)
 */
export async function processExpiredWaitlistEntries(): Promise<{ 
  success: boolean; 
  data?: { processed: number }; 
  error?: string 
}> {
  try {
    const now = new Date()
    
    // Find expired entries that are still NOTIFIED
    const expiredEntries = await prisma.waitlist.findMany({
      where: {
        status: 'NOTIFIED',
        expiresAt: { lte: now }
      }
    })
    
    // Update them to EXPIRED
    if (expiredEntries.length > 0) {
      await prisma.waitlist.updateMany({
        where: {
          id: { in: expiredEntries.map(entry => entry.id) }
        },
        data: {
          status: 'EXPIRED',
          updatedAt: now,
        }
      })
    }
    
    // Revalidate admin paths
    revalidatePath('/admin/waitlist')
    revalidatePath('/superadmin/waitlist')
    
    return { 
      success: true, 
      data: { processed: expiredEntries.length }
    }
    
  } catch (error) {
    console.error('Error processing expired waitlist entries:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to process expired entries' 
    }
  }
}