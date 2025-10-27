// ==========================================
// PRISMA BOOKING TYPES
// ==========================================
// TypeScript interfaces and types for Prisma-based booking operations
// Provides type safety for booking responses, DTOs, and server actions

import type { 
  Booking, 
  BookingStatus, 
  BookingRules, 
  GuestType, 
  User, 
  RoomType 
} from '@prisma/client'

// ==========================================
// EXTENDED BOOKING TYPES
// ==========================================

/**
 * Base server action response structure
 */
export interface ServerActionResponse<T = unknown> {
  success: boolean
  message: string
  data?: T
  error?: string
}

/**
 * Booking with related data for display
 */
export interface BookingWithDetails extends Booking {
  user: Pick<User, 'id' | 'name' | 'phone' | 'email'>
  roomType: Pick<RoomType, 'id' | 'name' | 'description' | 'pricePerNight'>
}

/**
 * Booking summary for listing views
 */
export interface BookingSummary {
  id: string
  bookingId?: string
  status: BookingStatus
  startDate: Date
  endDate: Date
  totalPrice: number
  nights: number
  userName: string
  userPhone: string
  roomTypeName: string
  roomNumber?: string
  createdAt: Date
  // paymentStatus?: PaymentStatus // Removed, not defined in @prisma/client
}

/**
 * Booking statistics for dashboard
 */
export interface BookingStats {
  totalBookings: number
  confirmedBookings: number
  provisionalBookings: number
  cancelledBookings: number
  totalRevenue: number
  averageBookingValue: number
  occupancyRate: number
}

/**
 * Room availability information
 */
export interface RoomAvailabilityInfo {
  roomTypeId: string
  roomTypeName: string
  date: Date
  availableRooms: number
  totalRooms: number
  isAvailable: boolean
  blockedByBookings: number
}

/**
 * Booking conflict information
 */
export interface BookingConflict {
  conflictType: 'OVERLAP' | 'INSUFFICIENT_INVENTORY' | 'RULES_VIOLATION'
  message: string
  conflictingBookings?: BookingSummary[]
  availableAlternatives?: RoomAvailabilityInfo[]
}

// ==========================================
// BOOKING ACTION RESPONSES
// ==========================================

/**
 * Response for booking creation
 */
export type CreateBookingResponse = ServerActionResponse<{
  booking: BookingWithDetails
  conflicts?: BookingConflict[]
}>

/**
 * Response for booking confirmation
 */
export type ConfirmBookingResponse = ServerActionResponse<{
  booking: BookingWithDetails
  inventoryUpdated: boolean
}>

/**
 * Response for booking cancellation
 */
export type CancelBookingResponse = ServerActionResponse<{
  booking: BookingWithDetails
  refundAmount?: number
  inventoryRestored: boolean
}>

/**
 * Response for booking status update
 */
export type UpdateBookingStatusResponse = ServerActionResponse<{
  booking: BookingWithDetails
  previousStatus: BookingStatus
}>

/**
 * Response for user bookings query
 */
export type GetUserBookingsResponse = ServerActionResponse<{
  bookings: BookingSummary[]
  pagination: {
    page: number
    pageSize: number
    totalCount: number
    totalPages: number
  }
}>

/**
 * Response for bookings by date range query
 */
export type GetBookingsByDateRangeResponse = ServerActionResponse<{
  bookings: BookingSummary[]
  statistics: BookingStats
  pagination: {
    page: number
    pageSize: number
    totalCount: number
    totalPages: number
  }
}>

/**
 * Response for availability check
 */
export type CheckAvailabilityResponse = ServerActionResponse<{
  isAvailable: boolean
  availableRooms: number
  conflicts?: BookingConflict[]
  suggestions?: RoomAvailabilityInfo[]
}>

// ==========================================
// BOOKING RULES TYPES
// ==========================================

/**
 * Booking rules with metadata
 */
export interface BookingRulesWithMetadata extends BookingRules {
  isActive: boolean
  applicableUserCount: number
}

/**
 * Response for booking rules operations
 */
export type BookingRulesResponse = ServerActionResponse<BookingRulesWithMetadata>

/**
 * Response for multiple booking rules
 */
export type GetBookingRulesResponse = ServerActionResponse<BookingRulesWithMetadata[]>

// ==========================================
// UTILITY TYPES
// ==========================================

/**
 * Booking date range
 */
export interface BookingDateRange {
  startDate: Date
  endDate: Date
  nights: number
}

/**
 * Booking price breakdown
 */
export interface BookingPriceBreakdown {
  basePrice: number
  nights: number
  subtotal: number
  taxes: number
  fees: number
  total: number
  currency: string
}

/**
 * Booking validation result
 */
export interface BookingValidationResult {
  isValid: boolean
  errors: string[]
  warnings: string[]
  conflicts?: BookingConflict[]
}

/**
 * Guest type with permissions
 */
export interface GuestTypeInfo {
  type: GuestType
  displayName: string
  maxDaysAdvance: number
  minDaysNotice: number
  canModifyBookings: boolean
  canCancelWithoutPenalty: boolean
}

// ==========================================
// SEARCH AND FILTER TYPES
// ==========================================

/**
 * Booking search filters
 */
export interface BookingSearchFilters {
  status?: BookingStatus
  startDate?: Date
  endDate?: Date
  roomTypeId?: string
  userId?: string
  minPrice?: number
  maxPrice?: number
  guestType?: GuestType
}

/**
 * Booking sort options
 */
export type BookingSortBy = 
  | 'createdAt'
  | 'startDate'
  | 'endDate'
  | 'totalPrice'
  | 'status'

export type BookingSortOrder = 'asc' | 'desc'

/**
 * Booking search parameters
 */
export interface BookingSearchParams extends BookingSearchFilters {
  page?: number
  pageSize?: number
  sortBy?: BookingSortBy
  sortOrder?: BookingSortOrder
  search?: string
}

// ==========================================
// WEBHOOK AND EVENT TYPES
// ==========================================

/**
 * Booking event types for webhooks/notifications
 */
export type BookingEventType =
  | 'BOOKING_CREATED'
  | 'BOOKING_CONFIRMED'
  | 'BOOKING_CANCELLED'
  | 'BOOKING_MODIFIED'
  | 'PAYMENT_RECEIVED'
  | 'CHECK_IN'
  | 'CHECK_OUT'

/**
 * Booking event payload
 */
export interface BookingEvent {
  eventType: BookingEventType
  bookingId: string
  userId: string
  timestamp: Date
  metadata: Record<string, unknown>
}