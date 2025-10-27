# Day 13: Concurrency Safety Testing Guide

## Quick Start

### Prerequisites

Ensure your database is seeded with test data:

```bash
npx prisma migrate dev
npx prisma db seed
```

### Run Concurrency Tests

```bash
# Using pnpm (recommended)
pnpm tsx scripts/test-concurrency.ts

# Using npm
npm run tsx scripts/test-concurrency.ts

# Using npx
npx tsx scripts/test-concurrency.ts
```

## What the Tests Do

### Test Scenario 1: Concurrent Request Collision
- **Fires**: 20 simultaneous booking requests for the same dates
- **Available**: 10 rooms
- **Expected**: Exactly 10 succeed, 10 fail with `INSUFFICIENT_INVENTORY`
- **Verifies**: No overbooking, inventory never goes negative

### Test Scenario 2: Idempotency Check
- **Fires**: 5 identical requests simultaneously
- **Expected**: All return the same booking ID (only 1 booking created)
- **Verifies**: Duplicate requests are handled correctly via idempotency keys

### Test Scenario 3: High Concurrency Stress Test
- **Fires**: 50 requests in batches of 10
- **Expected**: System handles load without deadlocks or timeouts
- **Verifies**: Performance under realistic concurrent load

## Expected Output

```
████████████████████████████████████████████████████████████████████████████████
   CONCURRENCY TEST SUITE - Day 13
████████████████████████████████████████████████████████████████████████████████

📦 Setting Up Test Data
✅ Created 20 test users
✅ Test room type: Concurrency Test Room (10 rooms)
✅ Created inventory for 7 days

🧪 Scenario 1: Concurrent Requests for Same Dates
📊 Results:
   Successful bookings: 10
   Failed bookings: 10
   Inventory never negative: ✅

🧪 Scenario 2: Idempotency Test (Duplicate Requests)
📊 Results:
   Unique booking IDs: 1
   Idempotency working: ✅

🧪 Scenario 3: High Concurrency Stress Test
📊 Results:
   Total requests: 50
   Average request duration: 87.23ms

📋 Test Suite Summary
🎉 ALL TESTS PASSED! Concurrency safety verified. ✅
```

## Troubleshooting

### Test Fails: Overbooking Detected

**Symptom**: Test reports more bookings succeeded than available rooms

**Fix**:
```bash
# Reset database and re-run
npx prisma migrate reset
pnpm tsx scripts/test-concurrency.ts
```

### Test Fails: Transaction Timeout

**Symptom**: Tests fail with `TRANSACTION_TIMEOUT` errors

**Fix**:
1. Check database connection pool size (increase if needed)
2. Ensure database is not under heavy load
3. Increase timeout in code (see `concurrent-booking.action.ts`)

### Test Fails: TypeScript Errors

**Symptom**: `tsx` command fails with compilation errors

**Fix**:
```bash
# Regenerate Prisma Client
npx prisma generate

# Check for TypeScript errors
pnpm tsc --noEmit
```

## Manual Testing

You can also test individual functions:

```typescript
import { createConcurrentBooking } from '@/actions/bookings/concurrent-booking.action'

// Single booking
const result = await createConcurrentBooking({
  userId: 'your-user-id',
  roomTypeId: 'your-room-type-id',
  startDate: new Date('2024-01-15'),
  endDate: new Date('2024-01-20'),
  roomsBooked: 2,
})

console.log(result)
```

## Performance Benchmarks

Typical results on development machine:

| Metric | Value |
|--------|-------|
| Concurrent requests | 20 simultaneous |
| Average duration | 50-150ms |
| Throughput | 10-20 bookings/sec |
| Success rate | 100% (within limits) |

## CI/CD Integration

Add to your CI pipeline:

```yaml
# .github/workflows/test.yml
- name: Run Concurrency Tests
  run: pnpm tsx scripts/test-concurrency.ts
```

## Documentation

- **Full Documentation**: `docs/DAY_13_CONCURRENCY_SAFETY.md`
- **Implementation Summary**: `docs/DAY_13_IMPLEMENTATION_SUMMARY.md`
- **Source Code**: `src/actions/bookings/concurrent-booking.action.ts`

## Need Help?

1. Check error messages in test output
2. Review documentation for error code meanings
3. Verify database is seeded correctly
4. Check that migrations are applied

---

**Last Updated**: Day 13 Implementation  
**Test Coverage**: 3/3 scenarios
