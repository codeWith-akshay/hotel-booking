// ==========================================
// ROOM TYPE VALIDATION SCHEMAS
// ==========================================
// Zod validation schemas for RoomType and RoomInventory operations
// Used in server actions for input validation and type safety

import { z } from 'zod'

// ==========================================
// ROOM TYPE SCHEMAS
// ==========================================

/**
 * Schema for creating a new room type
 * Validates all required fields for room type creation
 */
export const createRoomTypeSchema = z.object({
  name: z
    .string()
    .min(1, 'Room type name is required')
    .max(100, 'Room type name must be 100 characters or less')
    .trim(),
  description: z
    .string()
    .min(10, 'Description must be at least 10 characters')
    .max(2000, 'Description must be 2000 characters or less')
    .trim(),
  pricePerNight: z
    .number()
    .int('Price must be an integer')
    .positive('Price must be positive')
    .min(1000, 'Minimum price is $10.00 (1000 cents)')
    .max(10000000, 'Maximum price is $100,000.00 (10000000 cents)'),
  totalRooms: z
    .number()
    .int('Total rooms must be an integer')
    .positive('Total rooms must be positive')
    .min(1, 'Must have at least 1 room')
    .max(1000, 'Cannot exceed 1000 rooms'),
})

/**
 * Schema for updating an existing room type
 * All fields are optional for partial updates
 */
export const updateRoomTypeSchema = z.object({
  id: z.string().cuid('Invalid room type ID'),
  name: z
    .string()
    .min(1, 'Room type name is required')
    .max(100, 'Room type name must be 100 characters or less')
    .trim()
    .optional(),
  description: z
    .string()
    .min(10, 'Description must be at least 10 characters')
    .max(2000, 'Description must be 2000 characters or less')
    .trim()
    .optional(),
  pricePerNight: z
    .number()
    .int('Price must be an integer')
    .positive('Price must be positive')
    .min(1000, 'Minimum price is $10.00 (1000 cents)')
    .max(10000000, 'Maximum price is $100,000.00 (10000000 cents)')
    .optional(),
  totalRooms: z
    .number()
    .int('Total rooms must be an integer')
    .positive('Total rooms must be positive')
    .min(1, 'Must have at least 1 room')
    .max(1000, 'Cannot exceed 1000 rooms')
    .optional(),
})

/**
 * Schema for deleting a room type
 * Requires only the room type ID
 */
export const deleteRoomTypeSchema = z.object({
  id: z.string().cuid('Invalid room type ID'),
})

/**
 * Schema for fetching a single room type by ID
 */
export const getRoomTypeByIdSchema = z.object({
  id: z.string().cuid('Invalid room type ID'),
})

/**
 * Schema for fetching room types with optional filters
 */
export const getRoomTypesSchema = z.object({
  includeInventory: z.boolean().optional().default(false),
  minPrice: z.number().int().positive().optional(),
  maxPrice: z.number().int().positive().optional(),
  sortBy: z.enum(['name', 'pricePerNight', 'totalRooms', 'createdAt']).optional().default('name'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('asc'),
})

// ==========================================
// ROOM INVENTORY SCHEMAS
// ==========================================

/**
 * Schema for creating a new inventory record
 * Validates room type, date, and available rooms
 */
export const createInventorySchema = z.object({
  roomTypeId: z.string().cuid('Invalid room type ID'),
  availableRooms: z
    .number()
    .int('Available rooms must be an integer')
    .min(0, 'Available rooms cannot be negative')
    .max(1000, 'Available rooms cannot exceed 1000'),
  date: z
    .date()
    .refine(
      (date) => {
        const today = new Date()
        today.setHours(0, 0, 0, 0)
        return date >= today
      },
      'Date must be today or in the future'
    ),
})

/**
 * Schema for bulk creating inventory records
 * Useful for initializing inventory for multiple dates
 */
export const createBulkInventorySchema = z.object({
  roomTypeId: z.string().cuid('Invalid room type ID'),
  startDate: z.date(),
  endDate: z.date(),
  availableRooms: z
    .number()
    .int('Available rooms must be an integer')
    .min(0, 'Available rooms cannot be negative')
    .max(1000, 'Available rooms cannot exceed 1000')
    .optional(), // If not provided, uses room type's totalRooms
}).refine(
  (data) => data.endDate > data.startDate,
  'End date must be after start date'
)

/**
 * Schema for updating an existing inventory record
 */
export const updateInventorySchema = z.object({
  id: z.string().cuid('Invalid inventory ID'),
  availableRooms: z
    .number()
    .int('Available rooms must be an integer')
    .min(0, 'Available rooms cannot be negative')
    .max(1000, 'Available rooms cannot exceed 1000'),
})

/**
 * Schema for updating inventory by room type and date
 * Alternative to updating by inventory ID
 */
export const updateInventoryByDateSchema = z.object({
  roomTypeId: z.string().cuid('Invalid room type ID'),
  date: z.date(),
  availableRooms: z
    .number()
    .int('Available rooms must be an integer')
    .min(0, 'Available rooms cannot be negative')
    .max(1000, 'Available rooms cannot exceed 1000'),
})

/**
 * Schema for deleting an inventory record
 */
export const deleteInventorySchema = z.object({
  id: z.string().cuid('Invalid inventory ID'),
})

/**
 * Schema for fetching inventory by room type
 */
export const getInventoryByRoomTypeSchema = z.object({
  roomTypeId: z.string().cuid('Invalid room type ID'),
  startDate: z.date().optional(),
  endDate: z.date().optional(),
  sortBy: z.enum(['date', 'availableRooms', 'createdAt']).optional().default('date'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('asc'),
}).refine(
  (data) => {
    if (data.startDate && data.endDate) {
      return data.endDate > data.startDate
    }
    return true
  },
  'End date must be after start date'
)

/**
 * Schema for checking availability across multiple dates
 */
export const checkAvailabilitySchema = z.object({
  roomTypeId: z.string().cuid('Invalid room type ID'),
  checkInDate: z.date(),
  checkOutDate: z.date(),
  requiredRooms: z.number().int().positive().min(1).default(1),
}).refine(
  (data) => data.checkOutDate > data.checkInDate,
  'Check-out date must be after check-in date'
)

/**
 * Schema for getting room availability by date range
 */
export const getRoomAvailabilitySchema = z.object({
  roomTypeId: z.string().cuid('Invalid room type ID'),
  from: z.date(),
  to: z.date(),
}).refine(
  (data) => data.to >= data.from,
  {
    message: 'End date must be on or after start date',
    path: ['to'],
  }
)

// ==========================================
// TYPE EXPORTS
// ==========================================

// Export TypeScript types from Zod schemas
export type CreateRoomTypeInput = z.infer<typeof createRoomTypeSchema>
export type UpdateRoomTypeInput = z.infer<typeof updateRoomTypeSchema>
export type DeleteRoomTypeInput = z.infer<typeof deleteRoomTypeSchema>
export type GetRoomTypeByIdInput = z.infer<typeof getRoomTypeByIdSchema>
export type GetRoomTypesInput = z.infer<typeof getRoomTypesSchema>

export type CreateInventoryInput = z.infer<typeof createInventorySchema>
export type CreateBulkInventoryInput = z.infer<typeof createBulkInventorySchema>
export type UpdateInventoryInput = z.infer<typeof updateInventorySchema>
export type UpdateInventoryByDateInput = z.infer<typeof updateInventoryByDateSchema>
export type DeleteInventoryInput = z.infer<typeof deleteInventorySchema>
export type GetInventoryByRoomTypeInput = z.infer<typeof getInventoryByRoomTypeSchema>
export type CheckAvailabilityInput = z.infer<typeof checkAvailabilitySchema>
export type GetRoomAvailabilityInput = z.infer<typeof getRoomAvailabilitySchema>
