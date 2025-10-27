/**
 * Concurrency & Idempotency Validation Schemas (Day 13)
 * 
 * Zod schemas for concurrency-safe booking operations including:
 * - Idempotency key validation
 * - Concurrent booking request schemas
 * - Error response types for concurrency failures
 * - Inventory locking validation
 */

import { z } from 'zod'
import { BookingStatus } from '@prisma/client'

// ==========================================
// ERROR TYPES
// ==========================================

/**
 * Concurrency-specific error codes
 */
export const ConcurrencyErrorCode = z.enum([
  'INSUFFICIENT_INVENTORY',
  'CONCURRENCY_ABORT',
  'IDEMPOTENCY_CONFLICT',
  'INVENTORY_LOCKED',
  'TRANSACTION_TIMEOUT',
  'INVALID_DATE_RANGE',
  'ROOM_TYPE_NOT_FOUND',
])

export type ConcurrencyErrorCode = z.infer<typeof ConcurrencyErrorCode>

/**
 * Detailed error response for concurrency failures
 */
export const ConcurrencyErrorResponseSchema = z.object({
  success: z.literal(false),
  error: ConcurrencyErrorCode,
  message: z.string(),
  details: z.object({
    roomTypeId: z.string().optional(),
    requestedRooms: z.number().optional(),
    availableRooms: z.number().optional(),
    conflictDate: z.coerce.date().optional(),
    idempotencyKey: z.string().optional(),
    existingBookingId: z.string().optional(),
  }).optional(),
})

export type ConcurrencyErrorResponse = z.infer<typeof ConcurrencyErrorResponseSchema>

// ==========================================
// IDEMPOTENCY KEY SCHEMAS
// ==========================================

/**
 * Parameters used to generate idempotency key
 */
export const IdempotencyParamsSchema = z.object({
  userId: z.string().min(1),
  roomTypeId: z.string().min(1),
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),
  roomsBooked: z.number().int().positive().default(1),
})

export type IdempotencyParams = z.infer<typeof IdempotencyParamsSchema>

/**
 * Idempotency key metadata
 */
export const IdempotencyMetadataSchema = z.object({
  userId: z.string(),
  roomTypeId: z.string(),
  startDate: z.string(), // ISO string
  endDate: z.string(),   // ISO string
  roomsBooked: z.number(),
  requestedAt: z.string(), // ISO string
  clientIp: z.string().optional(),
  userAgent: z.string().optional(),
})

export type IdempotencyMetadata = z.infer<typeof IdempotencyMetadataSchema>

/**
 * Create idempotency key input
 */
export const CreateIdempotencyKeySchema = z.object({
  key: z.string().min(1),
  bookingId: z.string().min(1),
  metadata: z.string().optional(), // JSON stringified metadata
})

export type CreateIdempotencyKeyInput = z.infer<typeof CreateIdempotencyKeySchema>

// ==========================================
// BOOKING REQUEST SCHEMAS
// ==========================================

/**
 * Concurrent booking creation request with idempotency support
 */
export const ConcurrentBookingRequestSchema = z.object({
  userId: z.string().min(1),
  roomTypeId: z.string().min(1),
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),
  roomsBooked: z.number().int().positive().default(1),
  idempotencyKey: z.string().optional(), // Optional client-provided key
})

export type ConcurrentBookingRequest = z.infer<typeof ConcurrentBookingRequestSchema>

/**
 * Successful booking creation response
 */
export const BookingCreationSuccessSchema = z.object({
  success: z.literal(true),
  bookingId: z.string(),
  status: z.nativeEnum(BookingStatus),
  totalPrice: z.number(),
  roomsBooked: z.number(),
  depositRequired: z.boolean(),
  depositAmount: z.number().optional(),
  idempotencyKey: z.string(),
  isFromCache: z.boolean().default(false), // True if returned from existing idempotency key
})

export type BookingCreationSuccess = z.infer<typeof BookingCreationSuccessSchema>

/**
 * Combined response type (success or error)
 */
export const BookingCreationResponseSchema = z.union([
  BookingCreationSuccessSchema,
  ConcurrencyErrorResponseSchema,
])

export type BookingCreationResponse = z.infer<typeof BookingCreationResponseSchema>

// ==========================================
// INVENTORY LOCKING SCHEMAS
// ==========================================

/**
 * Locked inventory record (result from SELECT FOR UPDATE)
 */
export const LockedInventoryRecordSchema = z.object({
  id: z.string(),
  roomTypeId: z.string(),
  date: z.coerce.date(),
  availableRooms: z.number().int().nonnegative(),
})

export type LockedInventoryRecord = z.infer<typeof LockedInventoryRecordSchema>

/**
 * Inventory validation result
 */
export const InventoryValidationResultSchema = z.object({
  isValid: z.boolean(),
  insufficientDates: z.array(z.coerce.date()),
  lockedRecords: z.array(LockedInventoryRecordSchema),
})

export type InventoryValidationResult = z.infer<typeof InventoryValidationResultSchema>

// ==========================================
// CONCURRENCY TEST SCHEMAS
// ==========================================

/**
 * Concurrency test configuration
 */
export const ConcurrencyTestConfigSchema = z.object({
  totalRequests: z.number().int().positive(),
  simultaneousRequests: z.number().int().positive(),
  roomTypeId: z.string(),
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),
  roomsPerRequest: z.number().int().positive().default(1),
  expectedSuccesses: z.number().int().nonnegative(),
})

export type ConcurrencyTestConfig = z.infer<typeof ConcurrencyTestConfigSchema>

/**
 * Test result for a single request
 */
export const TestRequestResultSchema = z.object({
  requestId: z.number(),
  success: z.boolean(),
  bookingId: z.string().optional(),
  error: z.string().optional(),
  errorCode: ConcurrencyErrorCode.optional(),
  duration: z.number(), // milliseconds
  timestamp: z.string(), // ISO string
})

export type TestRequestResult = z.infer<typeof TestRequestResultSchema>

/**
 * Complete test run results
 */
export const ConcurrencyTestResultSchema = z.object({
  config: ConcurrencyTestConfigSchema,
  results: z.array(TestRequestResultSchema),
  summary: z.object({
    totalRequests: z.number(),
    successCount: z.number(),
    failureCount: z.number(),
    duplicateCount: z.number(), // Requests that returned existing bookings via idempotency
    averageDuration: z.number(),
    minDuration: z.number(),
    maxDuration: z.number(),
    inventoryNeverNegative: z.boolean(),
    noOverbooking: z.boolean(),
  }),
  timestamp: z.string(),
})

export type ConcurrencyTestResult = z.infer<typeof ConcurrencyTestResultSchema>
