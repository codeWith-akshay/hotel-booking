/**
 * Idempotency Key Utilities (Day 13)
 * 
 * Provides idempotency key generation and management for preventing duplicate bookings.
 * Uses cryptographic hashing to create deterministic keys from request parameters.
 * 
 * Key Features:
 * - Deterministic key generation from booking parameters
 * - Idempotency key storage and retrieval
 * - Duplicate request detection
 * - Request metadata tracking
 */

import crypto from 'crypto'
import { PrismaClient } from '@prisma/client'
import {
  IdempotencyParams,
  IdempotencyMetadata,
  CreateIdempotencyKeyInput,
} from '@/lib/validation/concurrency.validation'

/**
 * Generate a deterministic idempotency key from booking parameters
 * 
 * Uses SHA-256 hash to create a unique key from:
 * - userId
 * - roomTypeId
 * - startDate (ISO string)
 * - endDate (ISO string)
 * - roomsBooked
 * 
 * The same parameters will always generate the same key, ensuring idempotency.
 * 
 * @param params - Booking parameters to hash
 * @returns 64-character hex string (SHA-256 hash)
 */
export function generateIdempotencyKey(params: IdempotencyParams): string {
  const { userId, roomTypeId, startDate, endDate, roomsBooked } = params
  
  // Create deterministic string from parameters
  const dataString = [
    userId,
    roomTypeId,
    startDate.toISOString(),
    endDate.toISOString(),
    roomsBooked.toString(),
  ].join('|')
  
  // Hash with SHA-256 for consistency
  const hash = crypto
    .createHash('sha256')
    .update(dataString)
    .digest('hex')
  
  return hash
}

/**
 * Create idempotency metadata for auditing
 * 
 * @param params - Booking parameters
 * @param additionalData - Optional additional metadata (IP, user agent, etc.)
 * @returns Metadata object
 */
export function createIdempotencyMetadata(
  params: IdempotencyParams,
  additionalData?: {
    clientIp?: string
    userAgent?: string
  }
): IdempotencyMetadata {
  return {
    userId: params.userId,
    roomTypeId: params.roomTypeId,
    startDate: params.startDate.toISOString(),
    endDate: params.endDate.toISOString(),
    roomsBooked: params.roomsBooked,
    requestedAt: new Date().toISOString(),
    clientIp: additionalData?.clientIp,
    userAgent: additionalData?.userAgent,
  }
}

/**
 * Check if an idempotency key already exists
 * 
 * @param prisma - Prisma client (or transaction)
 * @param key - Idempotency key to check
 * @returns IdempotencyKey record if exists, null otherwise
 */
export async function findExistingIdempotencyKey(
  prisma: PrismaClient | any, // Allow transaction client
  key: string
) {
  return await prisma.idempotencyKey.findUnique({
    where: { key },
    include: {
      booking: {
        include: {
          roomType: true,
        },
      },
    },
  })
}

/**
 * Create a new idempotency key record
 * 
 * This should be called within the same transaction that creates the booking.
 * 
 * @param tx - Prisma transaction client
 * @param input - Idempotency key creation data
 * @returns Created IdempotencyKey record
 */
export async function createIdempotencyKey(
  tx: any, // Prisma transaction client
  input: CreateIdempotencyKeyInput
) {
  return await tx.idempotencyKey.create({
    data: {
      key: input.key,
      bookingId: input.bookingId,
      metadata: input.metadata,
    },
  })
}

/**
 * Delete an idempotency key (for cleanup/testing)
 * 
 * @param prisma - Prisma client
 * @param key - Idempotency key to delete
 */
export async function deleteIdempotencyKey(
  prisma: PrismaClient,
  key: string
): Promise<void> {
  await prisma.idempotencyKey.delete({
    where: { key },
  }).catch(() => {
    // Ignore if key doesn't exist
  })
}

/**
 * Clean up old idempotency keys (older than specified days)
 * 
 * Idempotency keys are typically only needed for a short period (e.g., 24-72 hours)
 * to prevent duplicate submissions. Older keys can be safely deleted.
 * 
 * @param prisma - Prisma client
 * @param daysOld - Delete keys older than this many days (default: 7)
 * @returns Number of keys deleted
 */
export async function cleanupOldIdempotencyKeys(
  prisma: PrismaClient,
  daysOld: number = 7
): Promise<number> {
  const cutoffDate = new Date()
  cutoffDate.setDate(cutoffDate.getDate() - daysOld)
  
  const result = await prisma.idempotencyKey.deleteMany({
    where: {
      createdAt: {
        lt: cutoffDate,
      },
    },
  })
  
  return result.count
}

/**
 * Validate that client-provided idempotency key matches expected format
 * 
 * @param key - Client-provided idempotency key
 * @returns True if valid, false otherwise
 */
export function isValidIdempotencyKeyFormat(key: string): boolean {
  // SHA-256 hex string should be exactly 64 characters
  return /^[a-f0-9]{64}$/i.test(key)
}

/**
 * Get or generate idempotency key from request
 * 
 * If client provides a key, validate and use it.
 * Otherwise, generate a deterministic key from parameters.
 * 
 * @param params - Booking parameters
 * @param clientKey - Optional client-provided idempotency key
 * @returns Idempotency key to use
 */
export function getOrGenerateIdempotencyKey(
  params: IdempotencyParams,
  clientKey?: string
): string {
  if (clientKey && isValidIdempotencyKeyFormat(clientKey)) {
    return clientKey
  }
  
  return generateIdempotencyKey(params)
}
