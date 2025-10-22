// ==========================================
// ROOM TYPES AND INTERFACES
// ==========================================
// TypeScript types for room management operations
// Used across server actions, components, and API routes

import type { RoomType, RoomInventory } from '@prisma/client'

// ==========================================
// SERVER ACTION RESPONSE TYPES
// ==========================================

/**
 * Generic server action response structure
 * Provides consistent response format across all actions
 */
export interface ServerActionResponse<T = unknown> {
  /** Indicates if the operation was successful */
  success: boolean
  /** Human-readable message describing the result */
  message: string
  /** Optional data payload returned from the operation */
  data?: T
  /** Optional error details for debugging */
  error?: string
}

/**
 * Validation error structure
 * Used when Zod validation fails
 */
export interface ValidationError {
  field: string
  message: string
}

/**
 * Error response with validation details
 */
export interface ValidationErrorResponse extends ServerActionResponse {
  success: false
  errors?: ValidationError[]
}

// ==========================================
// ROOM TYPE TYPES
// ==========================================

/**
 * Room type with optional inventory relation
 * Used when fetching room types with their inventory
 */
export type RoomTypeWithInventory = RoomType & {
  inventory?: RoomInventory[]
}

/**
 * Room type with inventory count
 * Useful for displaying summary information
 */
export type RoomTypeWithCount = RoomType & {
  inventoryCount: number
}

/**
 * Response for single room type operations
 */
export type RoomTypeResponse = ServerActionResponse<RoomType>

/**
 * Response for multiple room types operations
 */
export type RoomTypesResponse = ServerActionResponse<RoomType[]>

/**
 * Response for room type with inventory
 */
export type RoomTypeWithInventoryResponse = ServerActionResponse<RoomTypeWithInventory>

// ==========================================
// ROOM INVENTORY TYPES
// ==========================================

/**
 * Room inventory with room type relation
 * Used when fetching inventory with room type details
 */
export type RoomInventoryWithType = RoomInventory & {
  roomType: RoomType
}

/**
 * Inventory summary for a date range
 * Used for availability reports
 */
export interface InventorySummary {
  roomTypeId: string
  roomTypeName: string
  totalDays: number
  totalAvailableRooms: number
  averageAvailability: number
  minAvailability: number
  maxAvailability: number
}

/**
 * Availability check result
 * Returned when checking if rooms are available for booking
 */
export interface AvailabilityResult {
  isAvailable: boolean
  roomTypeId: string
  checkInDate: Date
  checkOutDate: Date
  requiredRooms: number
  minAvailability: number
  inventory: RoomInventory[]
  unavailableDates?: Date[]
}

/**
 * Response for single inventory operations
 */
export type RoomInventoryResponse = ServerActionResponse<RoomInventory>

/**
 * Response for multiple inventory operations
 */
export type RoomInventoriesResponse = ServerActionResponse<RoomInventory[]>

/**
 * Response for inventory with room type
 */
export type RoomInventoryWithTypeResponse = ServerActionResponse<RoomInventoryWithType>

/**
 * Response for availability check
 */
export type AvailabilityResponse = ServerActionResponse<AvailabilityResult>

/**
 * Response for bulk inventory creation
 */
export interface BulkInventoryResult {
  created: number
  updated: number
  total: number
  records: RoomInventory[]
}

export type BulkInventoryResponse = ServerActionResponse<BulkInventoryResult>

// ==========================================
// FILTER AND SORT TYPES
// ==========================================

/**
 * Sort options for room types
 */
export type RoomTypeSortField = 'name' | 'pricePerNight' | 'totalRooms' | 'createdAt'

/**
 * Sort options for inventory
 */
export type InventorySortField = 'date' | 'availableRooms' | 'createdAt'

/**
 * Sort order
 */
export type SortOrder = 'asc' | 'desc'

/**
 * Room type filters
 */
export interface RoomTypeFilters {
  includeInventory?: boolean
  minPrice?: number
  maxPrice?: number
  sortBy?: RoomTypeSortField
  sortOrder?: SortOrder
}

/**
 * Inventory filters
 */
export interface InventoryFilters {
  startDate?: Date
  endDate?: Date
  sortBy?: InventorySortField
  sortOrder?: SortOrder
}

// ==========================================
// BOOKING TYPES (for future use)
// ==========================================

/**
 * Booking request information
 * Used when creating a booking from inventory
 */
export interface BookingRequest {
  roomTypeId: string
  checkInDate: Date
  checkOutDate: Date
  roomCount: number
  guestId: string
  totalPrice?: number
}

/**
 * Room availability for a specific date
 */
export interface DailyAvailability {
  date: Date
  availableRooms: number
  totalRooms: number
  occupancyRate: number
}

// ==========================================
// UTILITY TYPES
// ==========================================

/**
 * Omit Prisma's managed fields for create operations
 */
export type RoomTypeCreateInput = Omit<RoomType, 'id' | 'createdAt' | 'updatedAt'>

/**
 * Omit Prisma's managed fields for inventory create operations
 */
export type RoomInventoryCreateInput = Omit<RoomInventory, 'id' | 'createdAt' | 'updatedAt'>

/**
 * Partial update for room type (all fields optional)
 */
export type RoomTypeUpdateInput = Partial<RoomTypeCreateInput> & { id: string }

/**
 * Partial update for inventory (all fields optional)
 */
export type RoomInventoryUpdateInput = Partial<RoomInventoryCreateInput> & { id: string }

// ==========================================
// PRICE FORMATTING UTILITIES
// ==========================================

/**
 * Price display format
 * Converts cents to dollars for display
 */
export interface PriceDisplay {
  cents: number
  dollars: number
  formatted: string // e.g., "$150.00"
}

/**
 * Helper type for price range queries
 */
export interface PriceRange {
  min: number
  max: number
}

// ==========================================
// PERMISSION TYPES
// ==========================================

/**
 * Required permissions for room operations
 */
export type RoomPermission =
  | 'room:create'
  | 'room:read'
  | 'room:update'
  | 'room:delete'
  | 'inventory:create'
  | 'inventory:read'
  | 'inventory:update'
  | 'inventory:delete'

/**
 * User role types
 */
export type UserRole = 'MEMBER' | 'ADMIN' | 'SUPERADMIN'

/**
 * User session information
 */
export interface UserSession {
  userId: string
  role: UserRole
  permissions: string[]
}
