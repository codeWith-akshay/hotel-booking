// ==========================================
// BOOKING TYPES
// ==========================================
// TypeScript interfaces for hotel booking system

// ==========================================
// ENUMS
// ==========================================

/**
 * Booking status enum
 * Tracks the lifecycle of a booking from pending to completed/cancelled
 */
export enum BookingStatus {
  PENDING = 'PENDING',           // Awaiting confirmation
  CONFIRMED = 'CONFIRMED',       // Booking confirmed
  CHECKED_IN = 'CHECKED_IN',     // Guest has checked in
  CHECKED_OUT = 'CHECKED_OUT',   // Guest has checked out
  CANCELLED = 'CANCELLED',       // Booking cancelled
  NO_SHOW = 'NO_SHOW',           // Guest didn't show up
}

/**
 * Payment status enum
 */
export enum PaymentStatus {
  PENDING = 'PENDING',           // Payment not received
  PAID = 'PAID',                 // Fully paid
  PARTIAL = 'PARTIAL',           // Partially paid
  REFUNDED = 'REFUNDED',         // Payment refunded
  FAILED = 'FAILED',             // Payment failed
}

/**
 * Room type enum
 */
export enum RoomType {
  SINGLE = 'SINGLE',             // Single occupancy
  DOUBLE = 'DOUBLE',             // Double occupancy
  SUITE = 'SUITE',               // Suite room
  DELUXE = 'DELUXE',             // Deluxe room
  PENTHOUSE = 'PENTHOUSE',       // Penthouse
}

// ==========================================
// CORE INTERFACES
// ==========================================

/**
 * Guest information
 */
export interface Guest {
  id: string
  name: string
  email: string
  phone: string
  address?: string
  idType?: string                 // e.g., "Passport", "Driver's License"
  idNumber?: string
}

/**
 * Room information
 */
export interface Room {
  id: string
  roomNumber: string
  type: RoomType
  floor: number
  pricePerNight: number
  maxOccupancy: number
  amenities: string[]             // e.g., ["WiFi", "TV", "Mini Bar"]
  isAvailable: boolean
}

/**
 * Payment information
 */
export interface Payment {
  id: string
  amount: number
  status: PaymentStatus
  method: string                  // e.g., "Credit Card", "Cash", "UPI"
  transactionId?: string
  paidAt?: string                 // ISO date string
  refundAmount?: number
  refundedAt?: string             // ISO date string
}

/**
 * Main booking interface
 * Represents a complete hotel booking with all related information
 */
export interface Booking {
  // Core fields
  id: string
  bookingNumber: string           // e.g., "BK-2024-001234"
  
  // Guest information
  guestId: string
  guest: Guest
  
  // Room information
  roomId: string
  room: Room
  
  // Booking dates
  checkInDate: string             // ISO date string (YYYY-MM-DD)
  checkOutDate: string            // ISO date string (YYYY-MM-DD)
  numberOfNights: number
  
  // Guest details
  numberOfGuests: number
  numberOfAdults: number
  numberOfChildren: number
  
  // Pricing
  roomRate: number                // Rate per night
  totalAmount: number             // Total booking amount
  taxAmount: number               // Tax amount
  discount: number                // Discount amount
  finalAmount: number             // Final amount after tax and discount
  
  // Status
  status: BookingStatus
  paymentStatus: PaymentStatus
  
  // Payment
  payment?: Payment
  
  // Additional information
  specialRequests?: string
  notes?: string                  // Internal notes
  
  // Audit fields
  createdBy: string               // User ID who created the booking
  createdAt: string               // ISO date string
  updatedAt: string               // ISO date string
  cancelledAt?: string            // ISO date string
  cancelledBy?: string            // User ID who cancelled
  cancellationReason?: string
}

// ==========================================
// DTO TYPES (Data Transfer Objects)
// ==========================================

/**
 * Create booking payload
 * Used when creating a new booking
 */
export interface CreateBookingPayload {
  // Guest info (can be existing guest ID or new guest data)
  guestId?: string
  guestData?: Omit<Guest, 'id'>
  
  // Booking details
  roomId: string
  checkInDate: string
  checkOutDate: string
  numberOfGuests: number
  numberOfAdults: number
  numberOfChildren: number
  
  // Optional
  specialRequests?: string
  notes?: string
  
  // Payment
  paymentMethod?: string
  advancePayment?: number
}

/**
 * Update booking payload
 * Used when updating an existing booking
 */
export interface UpdateBookingPayload {
  id: string
  
  // Updatable fields
  roomId?: string
  checkInDate?: string
  checkOutDate?: string
  numberOfGuests?: number
  numberOfAdults?: number
  numberOfChildren?: number
  status?: BookingStatus
  paymentStatus?: PaymentStatus
  specialRequests?: string
  notes?: string
}

/**
 * Cancel booking payload
 */
export interface CancelBookingPayload {
  id: string
  reason?: string
  refundAmount?: number
}

/**
 * Booking filter options
 * Used for filtering bookings list
 */
export interface BookingFilters {
  status?: BookingStatus | BookingStatus[]
  paymentStatus?: PaymentStatus | PaymentStatus[]
  roomType?: RoomType | RoomType[]
  guestId?: string
  roomId?: string
  checkInDateFrom?: string
  checkInDateTo?: string
  checkOutDateFrom?: string
  checkOutDateTo?: string
  search?: string                 // Search in guest name, booking number
}

/**
 * Booking sort options
 */
export interface BookingSortOptions {
  field: 'checkInDate' | 'checkOutDate' | 'createdAt' | 'totalAmount' | 'bookingNumber'
  order: 'asc' | 'desc'
}

/**
 * Paginated bookings response
 */
export interface PaginatedBookingsResponse {
  bookings: Booking[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

// ==========================================
// STATISTICS TYPES
// ==========================================

/**
 * Booking statistics
 * Used for dashboard and analytics
 */
export interface BookingStats {
  total: number
  pending: number
  confirmed: number
  checkedIn: number
  checkedOut: number
  cancelled: number
  noShow: number
  
  // Revenue stats
  totalRevenue: number
  pendingPayments: number
  
  // Occupancy stats
  occupancyRate: number           // Percentage
  totalRooms: number
  occupiedRooms: number
  availableRooms: number
}

/**
 * Daily booking summary
 */
export interface DailyBookingSummary {
  date: string                    // ISO date string
  checkIns: number
  checkOuts: number
  currentOccupancy: number
  revenue: number
}

// ==========================================
// VALIDATION SCHEMAS (ZOD)
// ==========================================
// Note: These are type definitions. Actual Zod schemas are in validation files

/**
 * Booking validation errors
 */
export interface BookingValidationError {
  field: string
  message: string
}

// ==========================================
// API RESPONSE TYPES
// ==========================================

/**
 * Generic API response
 */
export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  errors?: BookingValidationError[]
  message?: string
}

/**
 * Booking API responses
 */
export type FetchBookingsResponse = ApiResponse<PaginatedBookingsResponse>
export type CreateBookingResponse = ApiResponse<Booking>
export type UpdateBookingResponse = ApiResponse<Booking>
export type DeleteBookingResponse = ApiResponse<{ id: string }>
export type BookingStatsResponse = ApiResponse<BookingStats>

// ==========================================
// UTILITY TYPES
// ==========================================

/**
 * Partial booking (for updates)
 */
export type PartialBooking = Partial<Booking> & { id: string }

/**
 * Booking without relations (flat structure)
 */
export type BookingFlat = Omit<Booking, 'guest' | 'room' | 'payment'> & {
  guestName: string
  guestEmail: string
  guestPhone: string
  roomNumber: string
  roomType: RoomType
}

/**
 * Booking summary (minimal info for lists)
 */
export interface BookingSummary {
  id: string
  bookingNumber: string
  guestName: string
  roomNumber: string
  checkInDate: string
  checkOutDate: string
  status: BookingStatus
  totalAmount: number
}

// ==========================================
// HELPER TYPE GUARDS
// ==========================================

/**
 * Check if booking is active (can be checked in)
 */
export function isActiveBooking(booking: Booking): boolean {
  return [BookingStatus.CONFIRMED, BookingStatus.PENDING].includes(booking.status)
}

/**
 * Check if booking is completed
 */
export function isCompletedBooking(booking: Booking): boolean {
  return [BookingStatus.CHECKED_OUT, BookingStatus.CANCELLED, BookingStatus.NO_SHOW].includes(
    booking.status
  )
}

/**
 * Check if booking can be cancelled
 */
export function isCancellableBooking(booking: Booking): boolean {
  return [BookingStatus.PENDING, BookingStatus.CONFIRMED].includes(booking.status)
}

/**
 * Check if booking is paid
 */
export function isPaidBooking(booking: Booking): boolean {
  return booking.paymentStatus === PaymentStatus.PAID
}

/**
 * Check if payment is pending
 */
export function hasPaymentPending(booking: Booking): boolean {
  return [PaymentStatus.PENDING, PaymentStatus.PARTIAL].includes(booking.paymentStatus)
}

// ==========================================
// CONSTANTS
// ==========================================

/**
 * Booking status labels
 */
export const BOOKING_STATUS_LABELS: Record<BookingStatus, string> = {
  [BookingStatus.PENDING]: 'Pending',
  [BookingStatus.CONFIRMED]: 'Confirmed',
  [BookingStatus.CHECKED_IN]: 'Checked In',
  [BookingStatus.CHECKED_OUT]: 'Checked Out',
  [BookingStatus.CANCELLED]: 'Cancelled',
  [BookingStatus.NO_SHOW]: 'No Show',
}

/**
 * Payment status labels
 */
export const PAYMENT_STATUS_LABELS: Record<PaymentStatus, string> = {
  [PaymentStatus.PENDING]: 'Pending',
  [PaymentStatus.PAID]: 'Paid',
  [PaymentStatus.PARTIAL]: 'Partial',
  [PaymentStatus.REFUNDED]: 'Refunded',
  [PaymentStatus.FAILED]: 'Failed',
}

/**
 * Room type labels
 */
export const ROOM_TYPE_LABELS: Record<RoomType, string> = {
  [RoomType.SINGLE]: 'Single Room',
  [RoomType.DOUBLE]: 'Double Room',
  [RoomType.SUITE]: 'Suite',
  [RoomType.DELUXE]: 'Deluxe Room',
  [RoomType.PENTHOUSE]: 'Penthouse',
}

/**
 * Status colors for UI
 */
export const BOOKING_STATUS_COLORS: Record<BookingStatus, string> = {
  [BookingStatus.PENDING]: 'yellow',
  [BookingStatus.CONFIRMED]: 'blue',
  [BookingStatus.CHECKED_IN]: 'green',
  [BookingStatus.CHECKED_OUT]: 'gray',
  [BookingStatus.CANCELLED]: 'red',
  [BookingStatus.NO_SHOW]: 'orange',
}

/**
 * Payment status colors for UI
 */
export const PAYMENT_STATUS_COLORS: Record<PaymentStatus, string> = {
  [PaymentStatus.PENDING]: 'yellow',
  [PaymentStatus.PAID]: 'green',
  [PaymentStatus.PARTIAL]: 'orange',
  [PaymentStatus.REFUNDED]: 'blue',
  [PaymentStatus.FAILED]: 'red',
}
