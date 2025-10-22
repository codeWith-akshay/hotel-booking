// ==========================================
// ROOM INVENTORY SERVER ACTIONS
// ==========================================
// Next.js Server Actions for RoomInventory CRUD operations
// Features: Zod validation, RBAC, availability checking, bulk operations

'use server'

import { prisma } from '@/lib/prisma'
import {
  createInventorySchema,
  createBulkInventorySchema,
  updateInventorySchema,
  updateInventoryByDateSchema,
  deleteInventorySchema,
  getInventoryByRoomTypeSchema,
  checkAvailabilitySchema,
} from '@/lib/validation/room.validation'
import {
  canManageInventory,
  logRoomOperation,
} from '@/lib/auth/room-rbac'
import type {
  RoomInventoryResponse,
  RoomInventoriesResponse,
  BulkInventoryResponse,
  AvailabilityResponse,
  ServerActionResponse,
} from '@/types/room.types'
import { Prisma } from '@prisma/client'

// ==========================================
// CREATE INVENTORY
// ==========================================

/**
 * Create a single inventory record for a specific date
 * 
 * Requires: Admin or SuperAdmin role
 * Validates: Room type exists, date is future, available rooms <= totalRooms
 * 
 * @param input - Inventory creation data
 * @returns Server action response with created inventory
 * 
 * @example
 * ```typescript
 * const result = await createInventory({
 *   roomTypeId: 'clx123456',
 *   date: new Date('2025-10-25'),
 *   availableRooms: 20,
 * })
 * ```
 */
export async function createInventory(
  input: unknown
): Promise<RoomInventoryResponse> {
  try {
    // Check authorization
    const { authorized, session, message } = await canManageInventory('create')
    if (!authorized || !session) {
      return {
        success: false,
        message: message || 'Unauthorized',
      }
    }

    // Validate input
    const validationResult = createInventorySchema.safeParse(input)
    if (!validationResult.success) {
      return {
        success: false,
        message: 'Validation failed',
        error: validationResult.error.errors[0]?.message || 'Invalid input',
      }
    }

    const data = validationResult.data

    // Check if room type exists
    const roomType = await prisma.roomType.findUnique({
      where: { id: data.roomTypeId },
    })

    if (!roomType) {
      return {
        success: false,
        message: 'Room type not found',
      }
    }

    // Validate available rooms doesn't exceed total
    if (data.availableRooms > roomType.totalRooms) {
      return {
        success: false,
        message: `Available rooms (${data.availableRooms}) cannot exceed total rooms (${roomType.totalRooms})`,
      }
    }

    // Normalize date (remove time component)
    const normalizedDate = new Date(data.date)
    normalizedDate.setHours(0, 0, 0, 0)

    // Check if inventory already exists for this date
    const existingInventory = await prisma.roomInventory.findUnique({
      where: {
        roomTypeId_date: {
          roomTypeId: data.roomTypeId,
          date: normalizedDate,
        },
      },
    })

    if (existingInventory) {
      return {
        success: false,
        message: `Inventory already exists for ${normalizedDate.toISOString().split('T')[0]}`,
      }
    }

    // Create inventory
    const inventory = await prisma.roomInventory.create({
      data: {
        roomTypeId: data.roomTypeId,
        availableRooms: data.availableRooms,
        date: normalizedDate,
      },
    })

    // Log operation
    await logRoomOperation('CREATE_INVENTORY', session.userId, {
      inventoryId: inventory.id,
      roomTypeId: data.roomTypeId,
      date: normalizedDate,
    })

    return {
      success: true,
      message: 'Inventory created successfully',
      data: inventory,
    }
  } catch (error) {
    console.error('Error creating inventory:', error)

    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2002') {
        return {
          success: false,
          message: 'Inventory already exists for this date',
        }
      }
    }

    return {
      success: false,
      message: 'Failed to create inventory',
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

// ==========================================
// CREATE BULK INVENTORY
// ==========================================

/**
 * Create inventory records for a date range
 * Useful for initializing inventory for multiple days
 * 
 * Requires: Admin or SuperAdmin role
 * Creates: One record per day in the date range
 * 
 * @param input - Bulk inventory creation data
 * @returns Server action response with creation summary
 * 
 * @example
 * ```typescript
 * const result = await createBulkInventory({
 *   roomTypeId: 'clx123456',
 *   startDate: new Date('2025-10-25'),
 *   endDate: new Date('2025-11-25'),
 *   availableRooms: 20, // Optional, defaults to totalRooms
 * })
 * ```
 */
export async function createBulkInventory(
  input: unknown
): Promise<BulkInventoryResponse> {
  try {
    // Check authorization
    const { authorized, session, message } = await canManageInventory('create')
    if (!authorized || !session) {
      return {
        success: false,
        message: message || 'Unauthorized',
      }
    }

    // Validate input
    const validationResult = createBulkInventorySchema.safeParse(input)
    if (!validationResult.success) {
      return {
        success: false,
        message: 'Validation failed',
        error: validationResult.error.errors[0]?.message || 'Invalid input',
      }
    }

    const data = validationResult.data

    // Check if room type exists
    const roomType = await prisma.roomType.findUnique({
      where: { id: data.roomTypeId },
    })

    if (!roomType) {
      return {
        success: false,
        message: 'Room type not found',
      }
    }

    // Determine available rooms (use totalRooms if not specified)
    const availableRooms = data.availableRooms ?? roomType.totalRooms

    // Validate available rooms
    if (availableRooms > roomType.totalRooms) {
      return {
        success: false,
        message: `Available rooms (${availableRooms}) cannot exceed total rooms (${roomType.totalRooms})`,
      }
    }

    // Generate array of dates
    const dates: Date[] = []
    const currentDate = new Date(data.startDate)
    currentDate.setHours(0, 0, 0, 0)
    const endDate = new Date(data.endDate)
    endDate.setHours(0, 0, 0, 0)

    while (currentDate < endDate) {
      dates.push(new Date(currentDate))
      currentDate.setDate(currentDate.getDate() + 1)
    }

    // Create or update inventory records
    let created = 0
    let updated = 0
    const records = []

    for (const date of dates) {
      const inventory = await prisma.roomInventory.upsert({
        where: {
          roomTypeId_date: {
            roomTypeId: data.roomTypeId,
            date,
          },
        },
        update: {
          availableRooms,
        },
        create: {
          roomTypeId: data.roomTypeId,
          date,
          availableRooms,
        },
      })

      records.push(inventory)
      
      // Check if it was created or updated (simple heuristic)
      if (inventory.createdAt.getTime() === inventory.updatedAt.getTime()) {
        created++
      } else {
        updated++
      }
    }

    // Log operation
    await logRoomOperation('CREATE_BULK_INVENTORY', session.userId, {
      roomTypeId: data.roomTypeId,
      startDate: data.startDate,
      endDate: data.endDate,
      totalRecords: records.length,
    })

    return {
      success: true,
      message: `Bulk inventory created: ${created} new, ${updated} updated`,
      data: {
        created,
        updated,
        total: records.length,
        records,
      },
    }
  } catch (error) {
    console.error('Error creating bulk inventory:', error)
    return {
      success: false,
      message: 'Failed to create bulk inventory',
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

// ==========================================
// GET INVENTORY BY ROOM TYPE
// ==========================================

/**
 * Get inventory records for a specific room type
 * 
 * Requires: Any authenticated user (read operation)
 * Filters: Date range, sorting
 * 
 * @param input - Room type ID and optional filters
 * @returns Server action response with inventory array
 * 
 * @example
 * ```typescript
 * const result = await getInventoryByRoomType({
 *   roomTypeId: 'clx123456',
 *   startDate: new Date('2025-10-25'),
 *   endDate: new Date('2025-11-25'),
 *   sortBy: 'date',
 *   sortOrder: 'asc',
 * })
 * ```
 */
export async function getInventoryByRoomType(
  input: unknown
): Promise<RoomInventoriesResponse> {
  try {
    // Validate input
    const validationResult = getInventoryByRoomTypeSchema.safeParse(input)
    if (!validationResult.success) {
      return {
        success: false,
        message: 'Validation failed',
        error: validationResult.error.errors[0]?.message || 'Invalid input',
      }
    }

    const { roomTypeId, startDate, endDate, sortBy, sortOrder } = validationResult.data

    // Build where clause
    const where: Prisma.RoomInventoryWhereInput = {
      roomTypeId,
    }

    if (startDate || endDate) {
      where.date = {}
      if (startDate) {
        where.date.gte = startDate
      }
      if (endDate) {
        where.date.lt = endDate
      }
    }

    // Fetch inventory
    const inventory = await prisma.roomInventory.findMany({
      where,
      orderBy: {
        [sortBy]: sortOrder,
      },
    })

    return {
      success: true,
      message: `Found ${inventory.length} inventory record(s)`,
      data: inventory,
    }
  } catch (error) {
    console.error('Error fetching inventory:', error)
    return {
      success: false,
      message: 'Failed to fetch inventory',
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

// ==========================================
// UPDATE INVENTORY
// ==========================================

/**
 * Update an existing inventory record by ID
 * 
 * Requires: Admin or SuperAdmin role
 * Validates: Available rooms <= totalRooms
 * 
 * @param input - Inventory ID and update data
 * @returns Server action response with updated inventory
 * 
 * @example
 * ```typescript
 * const result = await updateInventory({
 *   id: 'clx789012',
 *   availableRooms: 15,
 * })
 * ```
 */
export async function updateInventory(
  input: unknown
): Promise<RoomInventoryResponse> {
  try {
    // Check authorization
    const { authorized, session, message } = await canManageInventory('update')
    if (!authorized || !session) {
      return {
        success: false,
        message: message || 'Unauthorized',
      }
    }

    // Validate input
    const validationResult = updateInventorySchema.safeParse(input)
    if (!validationResult.success) {
      return {
        success: false,
        message: 'Validation failed',
        error: validationResult.error.errors[0]?.message || 'Invalid input',
      }
    }

    const { id, availableRooms } = validationResult.data

    // Check if inventory exists
    const existingInventory = await prisma.roomInventory.findUnique({
      where: { id },
      include: {
        roomType: true,
      },
    })

    if (!existingInventory) {
      return {
        success: false,
        message: 'Inventory record not found',
      }
    }

    // Validate available rooms
    if (availableRooms > existingInventory.roomType.totalRooms) {
      return {
        success: false,
        message: `Available rooms (${availableRooms}) cannot exceed total rooms (${existingInventory.roomType.totalRooms})`,
      }
    }

    // Update inventory
    const updatedInventory = await prisma.roomInventory.update({
      where: { id },
      data: { availableRooms },
    })

    // Log operation
    await logRoomOperation('UPDATE_INVENTORY', session.userId, {
      inventoryId: id,
      roomTypeId: existingInventory.roomTypeId,
      oldAvailability: existingInventory.availableRooms,
      newAvailability: availableRooms,
    })

    return {
      success: true,
      message: 'Inventory updated successfully',
      data: updatedInventory,
    }
  } catch (error) {
    console.error('Error updating inventory:', error)

    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2025') {
        return {
          success: false,
          message: 'Inventory record not found',
        }
      }
    }

    return {
      success: false,
      message: 'Failed to update inventory',
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

// ==========================================
// UPDATE INVENTORY BY DATE
// ==========================================

/**
 * Update inventory by room type and date
 * Alternative to updating by inventory ID
 * 
 * Requires: Admin or SuperAdmin role
 * 
 * @param input - Room type ID, date, and new availability
 * @returns Server action response with updated inventory
 * 
 * @example
 * ```typescript
 * const result = await updateInventoryByDate({
 *   roomTypeId: 'clx123456',
 *   date: new Date('2025-10-25'),
 *   availableRooms: 15,
 * })
 * ```
 */
export async function updateInventoryByDate(
  input: unknown
): Promise<RoomInventoryResponse> {
  try {
    // Check authorization
    const { authorized, session, message } = await canManageInventory('update')
    if (!authorized || !session) {
      return {
        success: false,
        message: message || 'Unauthorized',
      }
    }

    // Validate input
    const validationResult = updateInventoryByDateSchema.safeParse(input)
    if (!validationResult.success) {
      return {
        success: false,
        message: 'Validation failed',
        error: validationResult.error.errors[0]?.message || 'Invalid input',
      }
    }

    const { roomTypeId, date, availableRooms } = validationResult.data

    // Normalize date
    const normalizedDate = new Date(date)
    normalizedDate.setHours(0, 0, 0, 0)

    // Check if room type exists
    const roomType = await prisma.roomType.findUnique({
      where: { id: roomTypeId },
    })

    if (!roomType) {
      return {
        success: false,
        message: 'Room type not found',
      }
    }

    // Validate available rooms
    if (availableRooms > roomType.totalRooms) {
      return {
        success: false,
        message: `Available rooms (${availableRooms}) cannot exceed total rooms (${roomType.totalRooms})`,
      }
    }

    // Update or create inventory
    const inventory = await prisma.roomInventory.upsert({
      where: {
        roomTypeId_date: {
          roomTypeId,
          date: normalizedDate,
        },
      },
      update: {
        availableRooms,
      },
      create: {
        roomTypeId,
        date: normalizedDate,
        availableRooms,
      },
    })

    // Log operation
    await logRoomOperation('UPDATE_INVENTORY_BY_DATE', session.userId, {
      roomTypeId,
      date: normalizedDate,
      availableRooms,
    })

    return {
      success: true,
      message: 'Inventory updated successfully',
      data: inventory,
    }
  } catch (error) {
    console.error('Error updating inventory by date:', error)
    return {
      success: false,
      message: 'Failed to update inventory',
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

// ==========================================
// DELETE INVENTORY
// ==========================================

/**
 * Delete an inventory record
 * 
 * Requires: Admin or SuperAdmin role
 * Warning: This permanently deletes the inventory record
 * 
 * @param input - Inventory ID to delete
 * @returns Server action response
 * 
 * @example
 * ```typescript
 * const result = await deleteInventory({
 *   id: 'clx789012',
 * })
 * ```
 */
export async function deleteInventory(
  input: unknown
): Promise<ServerActionResponse> {
  try {
    // Check authorization
    const { authorized, session, message } = await canManageInventory('delete')
    if (!authorized || !session) {
      return {
        success: false,
        message: message || 'Unauthorized',
      }
    }

    // Validate input
    const validationResult = deleteInventorySchema.safeParse(input)
    if (!validationResult.success) {
      return {
        success: false,
        message: 'Validation failed',
        error: validationResult.error.errors[0]?.message || 'Invalid input',
      }
    }

    const { id } = validationResult.data

    // Check if inventory exists
    const existingInventory = await prisma.roomInventory.findUnique({
      where: { id },
    })

    if (!existingInventory) {
      return {
        success: false,
        message: 'Inventory record not found',
      }
    }

    // Delete inventory
    await prisma.roomInventory.delete({
      where: { id },
    })

    // Log operation
    await logRoomOperation('DELETE_INVENTORY', session.userId, {
      inventoryId: id,
      roomTypeId: existingInventory.roomTypeId,
      date: existingInventory.date,
    })

    return {
      success: true,
      message: 'Inventory deleted successfully',
    }
  } catch (error) {
    console.error('Error deleting inventory:', error)

    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2025') {
        return {
          success: false,
          message: 'Inventory record not found',
        }
      }
    }

    return {
      success: false,
      message: 'Failed to delete inventory',
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

// ==========================================
// CHECK AVAILABILITY
// ==========================================

/**
 * Check if rooms are available for a date range
 * Used before creating bookings
 * 
 * Requires: Any authenticated user (read operation)
 * Returns: Availability status and inventory details
 * 
 * @param input - Room type ID, check-in/out dates, required rooms
 * @returns Server action response with availability result
 * 
 * @example
 * ```typescript
 * const result = await checkAvailability({
 *   roomTypeId: 'clx123456',
 *   checkInDate: new Date('2025-10-25'),
 *   checkOutDate: new Date('2025-10-28'),
 *   requiredRooms: 2,
 * })
 * ```
 */
export async function checkAvailability(
  input: unknown
): Promise<AvailabilityResponse> {
  try {
    // Validate input
    const validationResult = checkAvailabilitySchema.safeParse(input)
    if (!validationResult.success) {
      return {
        success: false,
        message: 'Validation failed',
        error: validationResult.error.errors[0]?.message || 'Invalid input',
      }
    }

    const { roomTypeId, checkInDate, checkOutDate, requiredRooms } = validationResult.data

    // Normalize dates
    const normalizedCheckIn = new Date(checkInDate)
    normalizedCheckIn.setHours(0, 0, 0, 0)
    const normalizedCheckOut = new Date(checkOutDate)
    normalizedCheckOut.setHours(0, 0, 0, 0)

    // Fetch inventory for date range
    const inventory = await prisma.roomInventory.findMany({
      where: {
        roomTypeId,
        date: {
          gte: normalizedCheckIn,
          lt: normalizedCheckOut,
        },
      },
      orderBy: {
        date: 'asc',
      },
    })

    // Check if all dates have sufficient availability
    const unavailableDates: Date[] = []
    let minAvailability = Infinity

    inventory.forEach((inv) => {
      if (inv.availableRooms < requiredRooms) {
        unavailableDates.push(inv.date)
      }
      minAvailability = Math.min(minAvailability, inv.availableRooms)
    })

    const isAvailable = unavailableDates.length === 0 && inventory.length > 0

    return {
      success: true,
      message: isAvailable
        ? 'Rooms available for selected dates'
        : 'Insufficient availability for selected dates',
      data: {
        isAvailable,
        roomTypeId,
        checkInDate: normalizedCheckIn,
        checkOutDate: normalizedCheckOut,
        requiredRooms,
        minAvailability: minAvailability === Infinity ? 0 : minAvailability,
        inventory,
        ...(unavailableDates.length > 0 && { unavailableDates }),
      },
    }
  } catch (error) {
    console.error('Error checking availability:', error)
    return {
      success: false,
      message: 'Failed to check availability',
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}
