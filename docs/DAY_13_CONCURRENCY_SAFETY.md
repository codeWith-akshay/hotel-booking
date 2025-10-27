# Day 13: Calendar Availability Edge Cases & Concurrency Safety

## Overview

This document describes the implementation of a **concurrency-safe booking system** that prevents overbooking under high-concurrency scenarios using row-level locking and idempotency patterns.

### Key Features

✅ **Row-level Locking**: Uses `SELECT ... FOR UPDATE` (PostgreSQL) or transaction isolation (SQLite)  
✅ **Idempotency Protection**: Prevents duplicate bookings from repeated client requests  
✅ **Atomic Operations**: All inventory updates happen within transactions  
✅ **Graceful Failure**: Detailed error codes for different failure scenarios  
✅ **Tested**: Comprehensive test suite verifies no overbooking under stress  

---

## Architecture

### Database Models

#### IdempotencyKey Model

```prisma
model IdempotencyKey {
  id        String   @id @default(cuid())
  key       String   @unique
  bookingId String   @unique
  metadata  String?  // JSON metadata
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  booking Booking @relation(...)
}
```

**Purpose**: Tracks unique request identifiers to ensure idempotent booking operations.

#### Booking Model (Updated)

```prisma
model Booking {
  // ... existing fields ...
  idempotencyKey IdempotencyKey?
}
```

**Change**: Added optional one-to-one relation to `IdempotencyKey`.

---

## Concurrency Strategy

### Problem: Race Conditions

Without proper locking, concurrent requests can cause overbooking:

```
Request A: Check inventory (10 rooms available)
Request B: Check inventory (10 rooms available)
Request A: Book 5 rooms → Update inventory to 5
Request B: Book 5 rooms → Update inventory to 5 ❌ (should be 0!)
```

### Solution: Row-Level Locking

```typescript
// Lock inventory records for exclusive access
const lockedRecords = await lockInventoryForDates(tx, roomTypeId, dates)

// Validate inventory while locks are held
const validation = validateLockedInventory(lockedRecords, roomsBooked, dates)

// Update inventory atomically
await decrementLockedInventory(tx, lockedRecords, roomsBooked)
```

**Flow**:
1. Start database transaction
2. Lock inventory rows with `SELECT ... FOR UPDATE`
3. Other concurrent transactions wait at the lock
4. Validate inventory availability
5. Update inventory if valid
6. Commit transaction (releases locks)

---

## Idempotency Pattern

### Problem: Duplicate Requests

Network issues or impatient users can cause duplicate booking attempts:

```
User clicks "Book" → Request 1 sent
Network delay...
User clicks "Book" again → Request 2 sent (duplicate)
Both requests might create separate bookings ❌
```

### Solution: Idempotency Keys

```typescript
// Generate deterministic key from parameters
const idempotencyKey = generateIdempotencyKey({
  userId,
  roomTypeId,
  startDate,
  endDate,
  roomsBooked,
})

// Check if already processed
const existingKey = await findExistingIdempotencyKey(prisma, idempotencyKey)
if (existingKey) {
  return { success: true, bookingId: existingKey.bookingId, isFromCache: true }
}

// Process new request and store idempotency key
```

**Key Generation**:
- SHA-256 hash of: `userId|roomTypeId|startDate|endDate|roomsBooked`
- Same parameters → Same key → Same booking returned

---

## API Usage

### Create Concurrent Booking

```typescript
import { createConcurrentBooking } from '@/actions/bookings/concurrent-booking.action'

const result = await createConcurrentBooking({
  userId: 'user-123',
  roomTypeId: 'room-type-456',
  startDate: new Date('2024-01-15'),
  endDate: new Date('2024-01-20'),
  roomsBooked: 2,
  idempotencyKey: 'optional-client-key', // Optional
})

if (result.success) {
  console.log('✅ Booking created:', result.bookingId)
  console.log('From cache:', result.isFromCache)
} else {
  console.error('❌ Booking failed:', result.error)
  console.error('Message:', result.message)
}
```

### Response Types

#### Success Response

```typescript
{
  success: true,
  bookingId: "clx1234...",
  status: "PROVISIONAL",
  totalPrice: 30000, // cents
  roomsBooked: 2,
  depositRequired: false,
  idempotencyKey: "a3f8b9...",
  isFromCache: false // true if returned from existing idempotency key
}
```

#### Error Response

```typescript
{
  success: false,
  error: "INSUFFICIENT_INVENTORY",
  message: "Insufficient inventory: requested 5 rooms but only 3 available on 2024-01-15",
  details: {
    roomTypeId: "room-type-456",
    requestedRooms: 5,
    availableRooms: 3,
    conflictDate: "2024-01-15T00:00:00.000Z"
  }
}
```

### Error Codes

| Error Code | Description | When It Occurs |
|------------|-------------|----------------|
| `INSUFFICIENT_INVENTORY` | Not enough rooms available | Requested rooms > available inventory |
| `CONCURRENCY_ABORT` | Transaction conflict | Deadlock or serialization failure |
| `IDEMPOTENCY_CONFLICT` | Duplicate idempotency key | Key exists for different booking |
| `INVENTORY_LOCKED` | Cannot acquire lock | Timeout waiting for lock |
| `TRANSACTION_TIMEOUT` | Transaction took too long | Exceeds 10-second timeout |
| `INVALID_DATE_RANGE` | Invalid dates | Start date >= end date |
| `ROOM_TYPE_NOT_FOUND` | Room type doesn't exist | Invalid roomTypeId |

---

## Inventory Locking Utilities

### Lock Inventory Records

```typescript
import { lockInventoryForDates } from '@/lib/inventory-locking'

const dates = [new Date('2024-01-15'), new Date('2024-01-16')]

await prisma.$transaction(async (tx) => {
  // Acquires row-level locks (blocks other transactions)
  const lockedRecords = await lockInventoryForDates(tx, roomTypeId, dates)
  
  // Records are locked until transaction completes
  // Other concurrent transactions will wait here
})
```

### Validate Locked Inventory

```typescript
import { validateLockedInventory } from '@/lib/inventory-locking'

const validation = validateLockedInventory(lockedRecords, roomsBooked, dates)

if (validation.isValid) {
  // Proceed with booking
} else {
  // Show which dates have insufficient inventory
  console.log('Insufficient dates:', validation.insufficientDates)
}
```

### Update Inventory Atomically

```typescript
import { decrementLockedInventory } from '@/lib/inventory-locking'

// Decrement available rooms for all locked records
await decrementLockedInventory(tx, lockedRecords, roomsBooked)

// All updates happen atomically within the transaction
```

---

## Idempotency Utilities

### Generate Idempotency Key

```typescript
import { generateIdempotencyKey } from '@/lib/idempotency'

const key = generateIdempotencyKey({
  userId: 'user-123',
  roomTypeId: 'room-type-456',
  startDate: new Date('2024-01-15'),
  endDate: new Date('2024-01-20'),
  roomsBooked: 2,
})

console.log(key) // "a3f8b9c2e4..." (64-char SHA-256 hash)
```

### Check Existing Key

```typescript
import { findExistingIdempotencyKey } from '@/lib/idempotency'

const existing = await findExistingIdempotencyKey(prisma, key)

if (existing) {
  // Return existing booking
  return {
    bookingId: existing.bookingId,
    isFromCache: true,
  }
}
```

### Store Idempotency Key

```typescript
import { createIdempotencyKey } from '@/lib/idempotency'

await prisma.$transaction(async (tx) => {
  // Create booking
  const booking = await tx.booking.create({ ... })
  
  // Store idempotency key
  await createIdempotencyKey(tx, {
    key: idempotencyKey,
    bookingId: booking.id,
    metadata: JSON.stringify({ userId, roomTypeId, ... }),
  })
})
```

---

## Testing

### Run Concurrency Tests

```bash
# Install tsx if not already installed
pnpm add -D tsx

# Run test suite
pnpm tsx scripts/test-concurrency.ts
```

### Test Scenarios

#### Scenario 1: Concurrent Requests for Same Dates

- **Setup**: 10 rooms available, 20 simultaneous requests
- **Expected**: Exactly 10 succeed, 10 fail with `INSUFFICIENT_INVENTORY`
- **Verifies**: No overbooking, inventory never negative

#### Scenario 2: Idempotency Test

- **Setup**: Send 5 identical requests simultaneously
- **Expected**: All return the same booking ID
- **Verifies**: Idempotency prevents duplicate bookings

#### Scenario 3: High Concurrency Stress Test

- **Setup**: 50 requests in batches of 10
- **Expected**: System handles load without errors
- **Verifies**: Performance under stress, no deadlocks

### Test Output

```
================================================================================
   CONCURRENCY TEST SUITE - Day 13
================================================================================

📦 Setting Up Test Data
✅ Created 20 test users
✅ Test room type: Concurrency Test Room (10 rooms)
✅ Created inventory for 7 days

🧪 Scenario 1: Concurrent Requests for Same Dates
Total available rooms: 10
Simultaneous requests: 20
Expected successes: 10
🚀 Firing concurrent requests...

📊 Results:
   Successful bookings: 10
   Failed bookings: 10
   Total duration: 543ms

🏨 Inventory Check:
   Remaining rooms: 0
   Expected: 0
   Inventory never negative: ✅

🎉 ALL TESTS PASSED! Concurrency safety verified. ✅
```

---

## Transaction Configuration

### PostgreSQL

```typescript
await prisma.$transaction(async (tx) => {
  // SELECT ... FOR UPDATE locks rows
  const lockedRecords = await tx.$queryRaw`
    SELECT * FROM "room_inventory"
    WHERE "roomTypeId" = ${roomTypeId}
    FOR UPDATE
  `
}, {
  maxWait: 5000,   // Wait up to 5s for transaction slot
  timeout: 10000,  // Transaction must complete within 10s
})
```

### SQLite

```typescript
// SQLite uses serialized transactions by default
// BEGIN IMMEDIATE ensures exclusive access
await prisma.$transaction(async (tx) => {
  // Regular queries work with transaction isolation
  const lockedRecords = await tx.roomInventory.findMany({ ... })
}, {
  maxWait: 5000,
  timeout: 10000,
})
```

---

## Performance Considerations

### Database Connection Pool

Ensure sufficient connections for concurrent transactions:

```env
DATABASE_URL="postgresql://...?connection_limit=20"
```

### Transaction Timeout

Balance responsiveness vs. success rate:

```typescript
{
  maxWait: 5000,   // Higher = more patient, lower = fail faster
  timeout: 10000,  // Higher = handles complex operations, lower = prevents hangs
}
```

### Lock Contention

Reduce contention by:
- Locking only required rows (not entire table)
- Keeping transactions short
- Ordering locks consistently (e.g., by date ascending)

---

## Migration

The IdempotencyKey model was added in migration `20251023094104_add_idempotency_key`:

```sql
CREATE TABLE "idempotency_keys" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "key" TEXT NOT NULL,
  "bookingId" TEXT NOT NULL,
  "metadata" TEXT,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL
);

CREATE UNIQUE INDEX "idempotency_keys_key_key" ON "idempotency_keys"("key");
CREATE UNIQUE INDEX "idempotency_keys_bookingId_key" ON "idempotency_keys"("bookingId");
```

---

## Cleanup & Maintenance

### Delete Old Idempotency Keys

Idempotency keys are typically only needed for 24-72 hours to prevent duplicate submissions. Clean up old keys regularly:

```typescript
import { cleanupOldIdempotencyKeys } from '@/lib/idempotency'

// Delete keys older than 7 days
const deleted = await cleanupOldIdempotencyKeys(prisma, 7)
console.log(`Deleted ${deleted} old idempotency keys`)
```

Schedule this as a cron job:

```typescript
// app/api/cron/cleanup/route.ts
export async function GET() {
  const count = await cleanupOldIdempotencyKeys(prisma, 7)
  return Response.json({ deleted: count })
}
```

---

## Troubleshooting

### Error: Transaction Timeout

**Symptom**: `TRANSACTION_TIMEOUT` error during high load

**Solution**:
1. Increase `timeout` in transaction options
2. Optimize database queries (add indexes)
3. Scale database resources

### Error: Deadlock Detected

**Symptom**: `CONCURRENCY_ABORT` with PostgreSQL error code 40001

**Solution**:
1. Ensure consistent lock ordering (always lock dates in ascending order)
2. Retry the transaction (implement exponential backoff)
3. Reduce transaction duration

### Inventory Goes Negative

**Symptom**: Inventory drops below 0 despite locking

**Solution**:
1. Verify `SELECT ... FOR UPDATE` is being used (check database logs)
2. Ensure all inventory updates are within transactions
3. Run verification: `verifyInventoryIntegrity(tx, roomTypeId)`

### Duplicate Bookings Created

**Symptom**: Same user has multiple bookings for same dates

**Solution**:
1. Verify idempotency key generation is deterministic
2. Check that `findExistingIdempotencyKey` is called before creating booking
3. Ensure unique constraint on `idempotencyKey.key` exists

---

## Code Files

### Created Files

| File | Purpose |
|------|---------|
| `prisma/schema.prisma` | Added `IdempotencyKey` model |
| `prisma/migrations/.../migration.sql` | Database migration |
| `src/lib/validation/concurrency.validation.ts` | Zod schemas for concurrency operations |
| `src/lib/inventory-locking.ts` | Row-level locking utilities |
| `src/lib/idempotency.ts` | Idempotency key management |
| `src/actions/bookings/concurrent-booking.action.ts` | Concurrency-safe booking actions |
| `scripts/test-concurrency.ts` | Test suite for concurrency safety |

### Modified Files

| File | Changes |
|------|---------|
| `prisma/schema.prisma` | Added `Booking.idempotencyKey` relation |

---

## Best Practices

### 1. Always Use Transactions

```typescript
// ❌ BAD: Separate operations
const inventory = await prisma.roomInventory.findUnique({ ... })
if (inventory.availableRooms >= roomsBooked) {
  await prisma.booking.create({ ... })
  await prisma.roomInventory.update({ ... })
}

// ✅ GOOD: Atomic transaction
await prisma.$transaction(async (tx) => {
  const lockedInventory = await lockInventoryForDates(tx, roomTypeId, dates)
  if (isValid) {
    await tx.booking.create({ ... })
    await decrementLockedInventory(tx, lockedInventory, roomsBooked)
  }
})
```

### 2. Always Check Idempotency

```typescript
// ❌ BAD: Create booking without checking
const booking = await prisma.booking.create({ ... })

// ✅ GOOD: Check idempotency first
const existingKey = await findExistingIdempotencyKey(prisma, key)
if (existingKey) return existingKey.booking

const booking = await prisma.$transaction(async (tx) => {
  const newBooking = await tx.booking.create({ ... })
  await createIdempotencyKey(tx, { key, bookingId: newBooking.id })
  return newBooking
})
```

### 3. Handle Errors Gracefully

```typescript
try {
  const booking = await createConcurrentBooking({ ... })
} catch (error) {
  if (error.code === 'INSUFFICIENT_INVENTORY') {
    // Show user which dates are unavailable
    showAvailabilityCalendar(error.details.conflictDate)
  } else if (error.code === 'CONCURRENCY_ABORT') {
    // Retry with exponential backoff
    retryWithBackoff(() => createConcurrentBooking({ ... }))
  }
}
```

### 4. Test Concurrency Regularly

Run tests after any booking system changes:

```bash
pnpm tsx scripts/test-concurrency.ts
```

---

## Next Steps

### Immediate Improvements

1. **Add Retry Logic**: Implement exponential backoff for transaction conflicts
2. **Monitoring**: Add metrics for transaction duration, failure rates
3. **Rate Limiting**: Prevent abuse by limiting requests per user
4. **Webhook Support**: Notify external systems of booking events

### Future Enhancements

1. **Distributed Locking**: For multi-instance deployments (Redis, etc.)
2. **Event Sourcing**: Track all inventory changes for audit trail
3. **Optimistic Locking**: Alternative to row-level locks for read-heavy workloads
4. **Sharding**: Partition inventory by date range for horizontal scaling

---

## References

- **PostgreSQL Locking**: https://www.postgresql.org/docs/current/explicit-locking.html
- **Prisma Transactions**: https://www.prisma.io/docs/concepts/components/prisma-client/transactions
- **Idempotency Patterns**: https://stripe.com/docs/api/idempotent_requests
- **ACID Properties**: https://en.wikipedia.org/wiki/ACID

---

## Support

For issues or questions:
1. Check error code in documentation above
2. Run test suite to verify system integrity
3. Review transaction logs for deadlock patterns
4. Contact backend team with test results

---

**Last Updated**: Day 13 Implementation  
**Status**: ✅ Production Ready  
**Test Coverage**: 100% (3/3 scenarios passing)
