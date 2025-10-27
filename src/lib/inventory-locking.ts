/**
 * Inventory Locking Utilities (Day 13)
 * 
 * Provides concurrency-safe inventory management using row-level locks.
 * Implements SELECT ... FOR UPDATE pattern to prevent race conditions.
 * 
 * Key Features:
 * - Row-level locking with SELECT FOR UPDATE
 * - Transaction-safe inventory validation
 * - Atomic inventory updates
 * - Deadlock prevention strategies
 * - SQLite and PostgreSQL compatibility
 */

import { PrismaClient, Prisma } from '@prisma/client'
import { eachDayOfInterval, format } from 'date-fns'
import {
  ConcurrencyErrorResponse,
  LockedInventoryRecord,
  InventoryValidationResult,
} from '@/lib/validation/concurrency.validation'

// Type for Prisma transaction client
type PrismaTransaction = Omit<
  PrismaClient,
  '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'
>

/**
 * Lock inventory records for a date range using SELECT FOR UPDATE
 * 
 * @param tx - Prisma transaction client
 * @param roomTypeId - Room type ID to lock
 * @param dates - Array of dates to lock (sorted chronologically)
 * @returns Array of locked inventory records
 * 
 * NOTE: This query holds row-level locks until the transaction commits or rolls back.
 * Other concurrent transactions will wait at this query until locks are released.
 */
export async function lockInventoryForDates(
  tx: PrismaTransaction,
  roomTypeId: string,
  dates: Date[]
): Promise<LockedInventoryRecord[]> {
  // SQLite doesn't support SELECT FOR UPDATE natively
  // For SQLite, we use BEGIN IMMEDIATE transaction (set at transaction level)
  // For PostgreSQL, we use SELECT ... FOR UPDATE
  
  // Determine database provider
  const provider = process.env.DATABASE_URL?.includes('postgresql') ? 'postgresql' : 'sqlite'
  
  if (provider === 'postgresql') {
    // PostgreSQL: Use proper SELECT FOR UPDATE
    const lockedRecords = await tx.$queryRaw<LockedInventoryRecord[]>`
      SELECT id, "roomTypeId", date, "availableRooms"
      FROM "room_inventory"
      WHERE "roomTypeId" = ${roomTypeId}
        AND date IN (${Prisma.join(dates.map(d => d.toISOString()))})
      ORDER BY date ASC
      FOR UPDATE
    `
    
    return lockedRecords
  } else {
    // SQLite: Use regular SELECT (transaction isolation handles locking)
    // SQLite transactions are serialized by default with BEGIN IMMEDIATE
    const formattedDates = dates.map(d => d.toISOString())
    
    const lockedRecords = await tx.roomInventory.findMany({
      where: {
        roomTypeId,
        date: {
          in: dates,
        },
      },
      select: {
        id: true,
        roomTypeId: true,
        date: true,
        availableRooms: true,
      },
      orderBy: {
        date: 'asc',
      },
    })
    
    return lockedRecords
  }
}

/**
 * Validate that sufficient inventory exists for all dates
 * 
 * @param lockedRecords - Locked inventory records from lockInventoryForDates
 * @param requestedRooms - Number of rooms requested
 * @param dates - All dates in the requested range
 * @returns Validation result with insufficient dates if any
 */
export function validateLockedInventory(
  lockedRecords: LockedInventoryRecord[],
  requestedRooms: number,
  dates: Date[]
): InventoryValidationResult {
  const insufficientDates: Date[] = []
  
  // Check if we have a locked record for each requested date
  const lockedDateMap = new Map(
    lockedRecords.map(record => [
      format(new Date(record.date), 'yyyy-MM-dd'),
      record
    ])
  )
  
  for (const date of dates) {
    const dateKey = format(date, 'yyyy-MM-dd')
    const record = lockedDateMap.get(dateKey)
    
    if (!record) {
      // Missing inventory record for this date
      insufficientDates.push(date)
    } else if (record.availableRooms < requestedRooms) {
      // Insufficient rooms on this date
      insufficientDates.push(date)
    }
  }
  
  return {
    isValid: insufficientDates.length === 0,
    insufficientDates,
    lockedRecords,
  }
}

/**
 * Update inventory by decrementing available rooms for all dates
 * 
 * @param tx - Prisma transaction client
 * @param lockedRecords - Locked inventory records to update
 * @param roomsToDecrement - Number of rooms to subtract from each record
 * 
 * NOTE: This should only be called after validateLockedInventory confirms sufficient inventory
 */
export async function decrementLockedInventory(
  tx: PrismaTransaction,
  lockedRecords: LockedInventoryRecord[],
  roomsToDecrement: number
): Promise<void> {
  // Update all inventory records atomically
  await Promise.all(
    lockedRecords.map(record =>
      tx.roomInventory.update({
        where: { id: record.id },
        data: {
          availableRooms: {
            decrement: roomsToDecrement,
          },
        },
      })
    )
  )
}

/**
 * Restore inventory by incrementing available rooms (for cancellations)
 * 
 * @param tx - Prisma transaction client
 * @param roomTypeId - Room type ID
 * @param dates - Dates to restore inventory for
 * @param roomsToIncrement - Number of rooms to add back
 */
export async function incrementInventory(
  tx: PrismaTransaction,
  roomTypeId: string,
  dates: Date[],
  roomsToIncrement: number
): Promise<void> {
  await Promise.all(
    dates.map(date =>
      tx.roomInventory.updateMany({
        where: {
          roomTypeId,
          date,
        },
        data: {
          availableRooms: {
            increment: roomsToIncrement,
          },
        },
      })
    )
  )
}

/**
 * Generate date range for inventory operations
 * 
 * @param startDate - Check-in date
 * @param endDate - Check-out date
 * @returns Array of dates (excludes check-out date, includes check-in date)
 */
export function getBookingDateRange(startDate: Date, endDate: Date): Date[] {
  // Generate all dates from startDate to endDate (inclusive of start, exclusive of end)
  const allDates = eachDayOfInterval({ start: startDate, end: endDate })
  
  // Remove the last date (check-out date) as guests check out on that day
  allDates.pop()
  
  return allDates
}

/**
 * Create a detailed error response for insufficient inventory
 * 
 * @param roomTypeId - Room type ID
 * @param requestedRooms - Number of rooms requested
 * @param conflictDate - First date with insufficient inventory
 * @param availableRooms - Number of available rooms on conflict date
 * @returns Formatted error response
 */
export function createInsufficientInventoryError(
  roomTypeId: string,
  requestedRooms: number,
  conflictDate: Date,
  availableRooms: number
): ConcurrencyErrorResponse {
  return {
    success: false,
    error: 'INSUFFICIENT_INVENTORY',
    message: `Insufficient inventory: requested ${requestedRooms} rooms but only ${availableRooms} available on ${format(conflictDate, 'yyyy-MM-dd')}`,
    details: {
      roomTypeId,
      requestedRooms,
      availableRooms,
      conflictDate,
    },
  }
}

/**
 * Create a detailed error response for concurrency conflicts
 * 
 * @param message - Error message
 * @param details - Additional error details
 * @returns Formatted error response
 */
export function createConcurrencyError(
  message: string,
  details?: ConcurrencyErrorResponse['details']
): ConcurrencyErrorResponse {
  return {
    success: false,
    error: 'CONCURRENCY_ABORT',
    message,
    details,
  }
}

/**
 * Create a detailed error response for idempotency conflicts
 * 
 * @param existingBookingId - ID of the existing booking
 * @param idempotencyKey - The conflicting idempotency key
 * @returns Formatted error response
 */
export function createIdempotencyConflictError(
  existingBookingId: string,
  idempotencyKey: string
): ConcurrencyErrorResponse {
  return {
    success: false,
    error: 'IDEMPOTENCY_CONFLICT',
    message: 'A booking with this idempotency key already exists',
    details: {
      existingBookingId,
      idempotencyKey,
    },
  }
}

/**
 * Verify inventory never drops below zero (for testing/validation)
 * 
 * @param tx - Prisma transaction client
 * @param roomTypeId - Room type ID to check
 * @returns True if all inventory records are non-negative, false otherwise
 */
export async function verifyInventoryIntegrity(
  tx: PrismaTransaction,
  roomTypeId: string
): Promise<boolean> {
  const negativeInventory = await tx.roomInventory.findFirst({
    where: {
      roomTypeId,
      availableRooms: {
        lt: 0,
      },
    },
  })
  
  return negativeInventory === null
}

/**
 * Get current inventory snapshot for a date range (non-locking read)
 * 
 * @param prisma - Prisma client (not transaction)
 * @param roomTypeId - Room type ID
 * @param dates - Dates to check
 * @returns Map of date string to available rooms
 */
export async function getInventorySnapshot(
  prisma: PrismaClient,
  roomTypeId: string,
  dates: Date[]
): Promise<Map<string, number>> {
  const records = await prisma.roomInventory.findMany({
    where: {
      roomTypeId,
      date: {
        in: dates,
      },
    },
    select: {
      date: true,
      availableRooms: true,
    },
  })
  
  return new Map(
    records.map(record => [
      format(new Date(record.date), 'yyyy-MM-dd'),
      record.availableRooms,
    ])
  )
}
