// ==========================================
// ROOM & INVENTORY ZOD VALIDATION SCHEMAS
// ==========================================
// Centralized validation schemas for Room Type and Inventory forms

import { z } from 'zod'

// ==========================================
// ROOM TYPE SCHEMAS
// ==========================================

/**
 * Room Type Creation/Update Schema
 * Used for validating room type form data
 */
export const RoomTypeSchema = z.object({
  /**
   * Room type name (e.g., "Deluxe Suite", "Standard Room")
   * Minimum 2 characters to ensure meaningful names
   */
  name: z
    .string()
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name must not exceed 100 characters')
    .trim(),

  /**
   * Detailed description of the room type
   * Optional field for additional information about amenities, size, etc.
   */
  description: z
    .string()
    .max(1000, 'Description must not exceed 1000 characters')
    .trim()
    .optional()
    .or(z.literal('')),

  /**
   * Price per night in the currency unit (e.g., dollars, euros)
   * Must be at least 1 to ensure valid pricing
   */
  pricePerNight: z
    .number()
    .min(1, 'Price must be at least 1')
    .max(999999, 'Price must not exceed 999,999')
    .positive('Price must be positive'),

  /**
   * Total number of rooms available for this room type
   * Must be at least 1 room
   */
  totalRooms: z
    .number()
    .int('Total rooms must be a whole number')
    .min(1, 'Must have at least 1 room')
    .max(1000, 'Total rooms must not exceed 1000')
    .positive('Total rooms must be positive'),
})

/**
 * TypeScript type inferred from RoomTypeSchema
 * Use this type for type-safe form data
 */
export type RoomTypeFormData = z.infer<typeof RoomTypeSchema>

// ==========================================
// ROOM INVENTORY SCHEMAS
// ==========================================

/**
 * Single Inventory Record Schema
 * Used for creating or updating a single date's inventory
 */
export const InventorySchema = z.object({
  /**
   * ID of the room type this inventory belongs to
   * Must be a valid UUID or database ID
   */
  roomTypeId: z
    .string()
    .min(1, 'Room type ID is required')
    .uuid('Invalid room type ID format'),

  /**
   * Date for this inventory record (ISO format: YYYY-MM-DD)
   * Must be a valid date string
   */
  date: z
    .string()
    .min(1, 'Date is required')
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format')
    .refine(
      (dateStr) => {
        const date = new Date(dateStr)
        return !isNaN(date.getTime())
      },
      { message: 'Invalid date' }
    ),

  /**
   * Number of rooms available for booking on this date
   * Must be non-negative (0 = fully booked)
   */
  availableRooms: z
    .number()
    .int('Available rooms must be a whole number')
    .min(0, 'Available rooms cannot be negative')
    .nonnegative('Available rooms must be non-negative'),
})

/**
 * TypeScript type inferred from InventorySchema
 */
export type InventoryFormData = z.infer<typeof InventorySchema>

/**
 * Bulk Inventory Creation Schema
 * Used for creating inventory records across a date range
 */
export const BulkInventorySchema = z
  .object({
    /**
     * ID of the room type to create inventory for
     */
    roomTypeId: z
      .string()
      .min(1, 'Room type ID is required')
      .uuid('Invalid room type ID format'),

    /**
     * Start date of the range (ISO format: YYYY-MM-DD)
     * Inclusive - inventory will be created for this date
     */
    startDate: z
      .string()
      .min(1, 'Start date is required')
      .regex(/^\d{4}-\d{2}-\d{2}$/, 'Start date must be in YYYY-MM-DD format'),

    /**
     * End date of the range (ISO format: YYYY-MM-DD)
     * Exclusive - inventory will be created up to but not including this date
     */
    endDate: z
      .string()
      .min(1, 'End date is required')
      .regex(/^\d{4}-\d{2}-\d{2}$/, 'End date must be in YYYY-MM-DD format'),

    /**
     * Number of rooms available for each date in the range
     * Optional - if not provided, defaults to totalRooms of the room type
     */
    availableRooms: z
      .number()
      .int('Available rooms must be a whole number')
      .min(0, 'Available rooms cannot be negative')
      .optional(),
  })
  .refine(
    (data) => {
      // Validate that end date is after start date
      const start = new Date(data.startDate)
      const end = new Date(data.endDate)
      return end > start
    },
    {
      message: 'End date must be after start date',
      path: ['endDate'],
    }
  )

/**
 * TypeScript type inferred from BulkInventorySchema
 */
export type BulkInventoryFormData = z.infer<typeof BulkInventorySchema>

// ==========================================
// VALIDATION HELPER FUNCTIONS
// ==========================================

/**
 * Validate room type form data
 */
export function validateRoomType(data: unknown) {
  return RoomTypeSchema.safeParse(data)
}

/**
 * Validate inventory form data
 */
export function validateInventory(data: unknown) {
  return InventorySchema.safeParse(data)
}

/**
 * Validate bulk inventory form data
 */
export function validateBulkInventory(data: unknown) {
  return BulkInventorySchema.safeParse(data)
}

/**
 * Create inventory schema with max rooms validation
 */
export function createInventoryWithMaxRoomsSchema(totalRooms: number) {
  return InventorySchema.extend({
    availableRooms: z
      .number()
      .int()
      .min(0)
      .max(totalRooms, `Available rooms cannot exceed ${totalRooms}`),
  })
}

/**
 * Create bulk inventory schema with max rooms validation
 */
export function createBulkInventoryWithMaxRoomsSchema(totalRooms: number) {
  return BulkInventorySchema.extend({
    availableRooms: z
      .number()
      .int()
      .min(0)
      .max(totalRooms, `Available rooms cannot exceed ${totalRooms}`)
      .optional(),
  })
}

export default {
  RoomTypeSchema,
  InventorySchema,
  BulkInventorySchema,
  validateRoomType,
  validateInventory,
  validateBulkInventory,
}
