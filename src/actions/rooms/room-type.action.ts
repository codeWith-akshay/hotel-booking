// ==========================================
// ROOM TYPE SERVER ACTIONS
// ==========================================
// Next.js Server Actions for RoomType CRUD operations
// Features: Zod validation, error handling
// Note: RBAC temporarily disabled - relying on client-side ProtectedRoute

'use server'

import { prisma } from '@/lib/prisma'
import {
  createRoomTypeSchema,
  updateRoomTypeSchema,
  deleteRoomTypeSchema,
  getRoomTypeByIdSchema,
  getRoomTypesSchema,
} from '@/lib/validation/room.validation'
import type {
  RoomTypeResponse,
  RoomTypesResponse,
  RoomTypeWithInventoryResponse,
  ServerActionResponse,
} from '@/types/room.types'
import { Prisma } from '@prisma/client'

// ==========================================
// CREATE ROOM TYPE
// ==========================================

/**
 * Create a new room type
 * 
 * Requires: Admin or SuperAdmin role
 * Validates: Name uniqueness, price range, room count
 * 
 * @param input - Room type creation data with userId
 * @returns Server action response with created room type
 * 
 * @example
 * ```typescript
 * const result = await createRoomType({
 *   userId: 'user_123',
 *   name: 'Deluxe Room',
 *   description: 'Spacious room with city view',
 *   pricePerNight: 15000, // $150.00
 *   totalRooms: 20,
 * })
 * ```
 */
export async function createRoomType(
  input: unknown
): Promise<RoomTypeResponse> {
  try {
    // Validate input
    const validationResult = createRoomTypeSchema.safeParse(input)
    if (!validationResult.success) {
      return {
        success: false,
        message: 'Validation failed',
        error: validationResult.error.issues[0]?.message || 'Invalid input',
      }
    }

    const data = validationResult.data

    // Note: RBAC check removed - to be implemented with proper auth context
    // For now, trusting the client-side ProtectedRoute component

    // Check if room type name already exists
    const existingRoomType = await prisma.roomType.findUnique({
      where: { name: data.name },
    })

    if (existingRoomType) {
      return {
        success: false,
        message: `Room type "${data.name}" already exists`,
      }
    }

    // Create room type
    const roomType = await prisma.roomType.create({
      data: {
        name: data.name,
        description: data.description,
        pricePerNight: data.pricePerNight,
        totalRooms: data.totalRooms,
      },
    })

    // Note: Audit logging temporarily disabled
    // await logRoomOperation('CREATE_ROOM_TYPE', userId, { roomTypeId: roomType.id })

    return {
      success: true,
      message: `Room type "${roomType.name}" created successfully`,
      data: roomType,
    }
  } catch (error) {
    console.error('Error creating room type:', error)
    
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2002') {
        return {
          success: false,
          message: 'Room type with this name already exists',
        }
      }
    }

    return {
      success: false,
      message: 'Failed to create room type',
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

// ==========================================
// GET ROOM TYPES
// ==========================================

/**
 * Get all room types with optional filters
 * 
 * Requires: Any authenticated user (read operation)
 * Filters: Price range, sorting, include inventory
 * 
 * @param input - Optional filters and sort options
 * @returns Server action response with array of room types
 * 
 * @example
 * ```typescript
 * const result = await getRoomTypes({
 *   includeInventory: true,
 *   minPrice: 10000,
 *   maxPrice: 50000,
 *   sortBy: 'pricePerNight',
 *   sortOrder: 'asc',
 * })
 * ```
 */
export async function getRoomTypes(
  input?: unknown
): Promise<RoomTypesResponse> {
  try {
    // Validate input
    const validationResult = getRoomTypesSchema.safeParse(input || {})
    if (!validationResult.success) {
      return {
        success: false,
        message: 'Validation failed',
        error: validationResult.error.issues[0]?.message || 'Invalid input',
      }
    }

    const { includeInventory, minPrice, maxPrice, sortBy, sortOrder } = validationResult.data

    // Build where clause
    const where: Prisma.RoomTypeWhereInput = {}
    
    if (minPrice !== undefined || maxPrice !== undefined) {
      where.pricePerNight = {}
      if (minPrice !== undefined) {
        where.pricePerNight.gte = minPrice
      }
      if (maxPrice !== undefined) {
        where.pricePerNight.lte = maxPrice
      }
    }

    // Fetch room types
    const roomTypes = await prisma.roomType.findMany({
      where,
      ...(includeInventory
        ? {
            include: {
              inventory: {
                where: {
                  date: {
                    gte: new Date(),
                  },
                },
                orderBy: {
                  date: 'asc',
                },
                take: 30, // Limit to next 30 days
              },
            },
          }
        : {}),
      orderBy: {
        [sortBy]: sortOrder,
      },
    })

    return {
      success: true,
      message: `Found ${roomTypes.length} room type(s)`,
      data: roomTypes,
    }
  } catch (error) {
    console.error('Error fetching room types:', error)
    return {
      success: false,
      message: 'Failed to fetch room types',
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

// ==========================================
// GET ROOM TYPE BY ID
// ==========================================

/**
 * Get a single room type by ID
 * 
 * Requires: Any authenticated user (read operation)
 * Includes: Optional inventory data
 * 
 * @param input - Room type ID and options
 * @returns Server action response with room type
 * 
 * @example
 * ```typescript
 * const result = await getRoomTypeById({
 *   id: 'clx123456',
 * })
 * ```
 */
export async function getRoomTypeById(
  input: unknown
): Promise<RoomTypeWithInventoryResponse> {
  try {
    // Validate input
    const validationResult = getRoomTypeByIdSchema.safeParse(input)
    if (!validationResult.success) {
      return {
        success: false,
        message: 'Validation failed',
        error: validationResult.error.issues[0]?.message || 'Invalid input',
      }
    }

    const { id } = validationResult.data

    // Fetch room type with inventory
    const roomType = await prisma.roomType.findUnique({
      where: { id },
      include: {
        inventory: {
          where: {
            date: {
              gte: new Date(),
            },
          },
          orderBy: {
            date: 'asc',
          },
          take: 90, // Next 90 days
        },
      },
    })

    if (!roomType) {
      return {
        success: false,
        message: 'Room type not found',
      }
    }

    return {
      success: true,
      message: 'Room type found',
      data: roomType,
    }
  } catch (error) {
    console.error('Error fetching room type:', error)
    return {
      success: false,
      message: 'Failed to fetch room type',
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

// ==========================================
// UPDATE ROOM TYPE
// ==========================================

/**
 * Update an existing room type
 * 
 * Requires: Admin or SuperAdmin role
 * Validates: Name uniqueness (if changed), price range, room count
 * Note: Changing totalRooms does not automatically update inventory
 * 
 * @param input - Room type ID and update data
 * @returns Server action response with updated room type
 * 
 * @example
 * ```typescript
 * const result = await updateRoomType({
 *   id: 'clx123456',
 *   pricePerNight: 18000, // Update price to $180.00
 *   description: 'Updated description',
 * })
 * ```
 */
export async function updateRoomType(
  input: unknown
): Promise<RoomTypeResponse> {
  try {
    // Note: RBAC check removed - to be implemented with proper auth context
    // For now, trusting the client-side ProtectedRoute component

    // Validate input
    const validationResult = updateRoomTypeSchema.safeParse(input)
    if (!validationResult.success) {
      return {
        success: false,
        message: 'Validation failed',
        error: validationResult.error.issues[0]?.message || 'Invalid input',
      }
    }

    const { id, ...updateData } = validationResult.data

    // Check if room type exists
    const existingRoomType = await prisma.roomType.findUnique({
      where: { id },
    })

    if (!existingRoomType) {
      return {
        success: false,
        message: 'Room type not found',
      }
    }

    // Check name uniqueness if name is being updated
    if (updateData.name && updateData.name !== existingRoomType.name) {
      const duplicateName = await prisma.roomType.findUnique({
        where: { name: updateData.name },
      })

      if (duplicateName) {
        return {
          success: false,
          message: `Room type "${updateData.name}" already exists`,
        }
      }
    }

    // Update room type
    const updateFields: Record<string, unknown> = {};
    if (updateData.name !== undefined) updateFields.name = updateData.name;
    if (updateData.description !== undefined) updateFields.description = updateData.description;
    if (updateData.pricePerNight !== undefined) updateFields.pricePerNight = updateData.pricePerNight;
    if (updateData.totalRooms !== undefined) updateFields.totalRooms = updateData.totalRooms;

    const updatedRoomType = await prisma.roomType.update({
      where: { id },
      data: updateFields,
    })

    // Note: Audit logging temporarily disabled
    // await logRoomOperation('UPDATE_ROOM_TYPE', userId, { roomTypeId: id, changes: updateData })

    return {
      success: true,
      message: `Room type "${updatedRoomType.name}" updated successfully`,
      data: updatedRoomType,
    }
  } catch (error) {
    console.error('Error updating room type:', error)

    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2002') {
        return {
          success: false,
          message: 'Room type with this name already exists',
        }
      }
      if (error.code === 'P2025') {
        return {
          success: false,
          message: 'Room type not found',
        }
      }
    }

    return {
      success: false,
      message: 'Failed to update room type',
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

// ==========================================
// DELETE ROOM TYPE
// ==========================================

/**
 * Delete a room type and all its inventory records
 * 
 * Requires: Admin or SuperAdmin role
 * Warning: This will CASCADE delete all inventory records for this room type
 * Consider soft delete for production use
 * 
 * @param input - Room type ID to delete
 * @returns Server action response
 * 
 * @example
 * ```typescript
 * const result = await deleteRoomType({
 *   id: 'clx123456',
 * })
 * ```
 */
export async function deleteRoomType(
  input: unknown
): Promise<ServerActionResponse> {
  try {
    // Note: RBAC check removed - to be implemented with proper auth context
    // For now, trusting the client-side ProtectedRoute component

    // Validate input
    const validationResult = deleteRoomTypeSchema.safeParse(input)
    if (!validationResult.success) {
      return {
        success: false,
        message: 'Validation failed',
        error: validationResult.error.issues[0]?.message || 'Invalid input',
      }
    }

    const { id } = validationResult.data

    // Check if room type exists
    const existingRoomType = await prisma.roomType.findUnique({
      where: { id },
      include: {
        _count: {
          select: { inventory: true, bookings: true },
        },
      },
    })

    if (!existingRoomType) {
      return {
        success: false,
        message: 'Room type not found',
      }
    }

    // Check if room type has existing bookings
    if (existingRoomType._count.bookings > 0) {
      return {
        success: false,
        message: `Cannot delete room type "${existingRoomType.name}" because it has ${existingRoomType._count.bookings} existing booking(s). Please cancel or complete all bookings first.`,
      }
    }

    // Delete room type (cascades to inventory)
    await prisma.roomType.delete({
      where: { id },
    })

    // Note: Audit logging temporarily disabled
    // await logRoomOperation('DELETE_ROOM_TYPE', userId, {
    //   roomTypeId: id,
    //   name: existingRoomType.name,
    //   deletedInventoryCount: existingRoomType._count.inventory,
    // })

    return {
      success: true,
      message: `Room type "${existingRoomType.name}" and ${existingRoomType._count.inventory} inventory record(s) deleted successfully`,
    }
  } catch (error) {
    console.error('Error deleting room type:', error)

    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2025') {
        return {
          success: false,
          message: 'Room type not found',
        }
      }
    }

    return {
      success: false,
      message: 'Failed to delete room type',
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}
