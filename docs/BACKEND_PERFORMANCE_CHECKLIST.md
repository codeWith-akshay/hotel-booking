# Backend Performance Optimization Checklist

## 📊 Overview

This checklist ensures the hotel booking system maintains optimal database performance, query efficiency, and system reliability. Use this as a reference for development, code review, and maintenance.

---

## ✅ Database Schema Optimization

### Indexes

- [x] **Primary Keys**: All tables have indexed primary keys (auto via Prisma)
- [x] **Foreign Keys**: All foreign key columns indexed
  - `User.roleId` ✓
  - `Booking.userId`, `Booking.roomTypeId` ✓
  - `Payment.userId`, `Payment.bookingId` ✓
  - `Notification.userId`, `Notification.bookingId` ✓
  - `Waitlist.userId`, `Waitlist.roomTypeId` ✓
  
- [x] **Date Columns**: Indexed for date range queries
  - `Booking.startDate`, `Booking.endDate` ✓
  - `RoomInventory.date` ✓
  - `Waitlist.startDate`, `Waitlist.endDate` ✓
  - `Notification.scheduledAt` ✓
  
- [x] **Status Columns**: Indexed for filtering
  - `Booking.status` ✓
  - `Payment.status` ✓
  - `Waitlist.status` ✓
  - `Notification.status` ✓
  
- [x] **Composite Indexes**: Created for hot queries
  - `[status, startDate, endDate]` on Bookings ✓
  - `[userId, status, createdAt]` on Bookings ✓
  - `[roomTypeId, date, availableRooms]` on Inventory ✓
  - `[status, scheduledAt]` on Notifications ✓

### Schema Best Practices

- [x] Proper data types used (Int for prices in cents, DateTime for dates)
- [x] Constraints enforced (unique, cascading deletes where appropriate)
- [x] Enums used for fixed sets of values
- [x] JSON fields documented and minimal (avoid unstructured data)
- [x] Nullable fields properly marked (required vs optional)

---

## 🚀 Query Optimization

### Prevent N+1 Queries

- [ ] **Use `include` or `select` to fetch relations in single query**
  ```typescript
  // ❌ Bad: N+1 query
  const bookings = await prisma.booking.findMany()
  for (const booking of bookings) {
    const roomType = await prisma.roomType.findUnique({ 
      where: { id: booking.roomTypeId } 
    })
  }
  
  // ✅ Good: Single query with include
  const bookings = await prisma.booking.findMany({
    include: { roomType: true }
  })
  ```

- [ ] **Use aggregation in database, not JavaScript**
  ```typescript
  // ❌ Bad: Fetch all, calculate in JS
  const bookings = await prisma.booking.findMany()
  const total = bookings.reduce((sum, b) => sum + b.totalPrice, 0)
  
  // ✅ Good: Aggregate in database
  const { _sum } = await prisma.booking.aggregate({
    _sum: { totalPrice: true }
  })
  ```

- [ ] **Batch queries when possible**
  ```typescript
  // Use optimized query helpers from src/lib/db/optimized-queries.ts
  import { batchCheckAvailability } from '@/lib/db/optimized-queries'
  ```

### Query Performance Patterns

- [ ] **Limit result sets** with `take` for pagination
- [ ] **Select only needed fields** instead of fetching entire rows
- [ ] **Use cursor-based pagination** for large datasets
- [ ] **Filter in database**, not in application code
- [ ] **Use `findUnique` instead of `findFirst`** when possible (uses index)

### Transaction Optimization

- [ ] **Keep transactions short** - only lock what you need
- [ ] **Use row-level locks** for concurrency safety (`SELECT FOR UPDATE`)
- [ ] **Lock in consistent order** to prevent deadlocks
- [ ] **Handle transaction failures** with proper error handling

**Example from `concurrent-booking.action.ts`**:
```typescript
await prisma.$transaction(async (tx) => {
  // Lock inventory rows
  const inventoryRecords = await lockInventoryForDates(tx, roomTypeId, dates)
  
  // Validate and update atomically
  validateLockedInventory(inventoryRecords, roomsBooked)
  await decrementLockedInventory(tx, inventoryRecords, roomsBooked)
  
  // Create booking
  const booking = await tx.booking.create({ data })
})
```

---

## 💾 Caching Strategy

### Implemented Caching

- [x] **In-memory query cache** (`src/lib/cache/query-cache.ts`)
- [x] **LRU eviction** to prevent memory overflow
- [x] **TTL-based expiration**
- [x] **Cache key generators** for consistent naming
- [x] **Cache invalidation patterns** for data updates

### Cache Usage Guidelines

- [ ] **Use caching for read-heavy endpoints**
  ```typescript
  import { withCache, CacheKeys, CacheTTL } from '@/lib/cache/query-cache'
  
  // Cache room types for 1 hour
  const roomTypes = await withCache(
    CacheKeys.roomTypes(),
    async () => await prisma.roomType.findMany(),
    CacheTTL.LONG
  )
  ```

- [ ] **Invalidate cache on writes**
  ```typescript
  import { CacheInvalidation } from '@/lib/cache/query-cache'
  
  // After creating booking
  CacheInvalidation.onBookingUpdate(userId, roomTypeId)
  ```

### Cache TTL Guidelines

| Data Type | TTL | Reason |
|-----------|-----|--------|
| Room Types | 1 hour | Rarely change |
| Booking Rules | 1 hour | Configuration data |
| Room Availability | 1-5 minutes | Semi-dynamic, high read |
| User Bookings | 5 minutes | User-specific data |
| Reports | 15 minutes | Expensive queries |
| Special Days | 1 hour | Daily updates max |

### What NOT to Cache

- ❌ User authentication data (OTPs, sessions)
- ❌ Payment information
- ❌ Real-time inventory during booking flow
- ❌ Audit logs
- ❌ Data with sub-minute freshness requirements

---

## 🔍 Monitoring & Observability

### Database Monitoring

- [ ] **Monitor slow queries** (queries > 100ms)
- [ ] **Track query count per endpoint**
- [ ] **Monitor connection pool usage**
- [ ] **Alert on high query latency** (P95 > 500ms)

### Application Metrics

- [ ] **Booking creation time** (target: < 2 seconds)
- [ ] **Availability check time** (target: < 500ms)
- [ ] **Cache hit rate** (target: > 70% for hot data)
- [ ] **Database connection pool exhaustion** (alert if saturated)

### Logging Best Practices

```typescript
// Log slow queries
const start = Date.now()
const result = await prisma.booking.findMany({ /* ... */ })
const duration = Date.now() - start

if (duration > 100) {
  console.warn(`Slow query detected: ${duration}ms`, {
    query: 'booking.findMany',
    filters: { /* ... */ }
  })
}
```

---

## 🛠️ Development Best Practices

### Code Review Checklist

- [ ] **No raw SQL queries** without parameterization (SQL injection risk)
- [ ] **Proper error handling** for database operations
- [ ] **Zod validation** on all server action inputs
- [ ] **RBAC checks** before database writes
- [ ] **Audit logging** for admin actions
- [ ] **Idempotency** for critical operations (booking creation)

### Server Action Pattern

```typescript
'use server'

export async function createBooking(input: unknown): Promise<BookingResponse> {
  try {
    // 1. Validate input
    const validated = BookingSchema.parse(input)
    
    // 2. Check authorization
    const session = await getCurrentSession()
    if (!session) return { success: false, error: 'Unauthorized' }
    
    // 3. Check idempotency
    const existing = await checkIdempotency(validated)
    if (existing) return existing
    
    // 4. Perform operation in transaction
    const result = await prisma.$transaction(async (tx) => {
      // ... atomic operations
    })
    
    // 5. Invalidate cache
    CacheInvalidation.onBookingUpdate(userId, roomTypeId)
    
    // 6. Revalidate paths
    revalidatePath('/bookings')
    
    return { success: true, data: result }
  } catch (error) {
    console.error('Booking creation failed:', error)
    return { success: false, error: 'Failed to create booking' }
  }
}
```

### Testing

- [ ] **Unit tests** for business logic
- [ ] **Integration tests** for database operations
- [ ] **Load tests** for concurrent booking scenarios
- [ ] **Backup restore tests** monthly

---

## 📦 Production Deployment

### Pre-Deployment Checklist

- [ ] **Run database migrations** with backup
  ```bash
  pnpm run backup:pre-migration
  pnpm prisma migrate deploy
  ```
  
- [ ] **Verify indexes created**
  ```sql
  -- PostgreSQL: Check indexes
  SELECT tablename, indexname, indexdef 
  FROM pg_indexes 
  WHERE schemaname = 'public' 
  ORDER BY tablename, indexname;
  ```
  
- [ ] **Test connection pooling**
  - Set appropriate pool size (10-20 for small apps)
  - Configure connection timeout (5-10 seconds)
  
- [ ] **Enable query logging** (temporarily for monitoring)

### Post-Deployment Monitoring

- [ ] Monitor error rates (< 1% target)
- [ ] Check slow query logs
- [ ] Verify cache hit rates
- [ ] Review backup completion

---

## 🔄 Database Maintenance

### Daily

- [ ] Verify automated backups completed
- [ ] Check backup file size (should be consistent)
- [ ] Monitor query performance dashboard

### Weekly

- [ ] Review slow query logs
- [ ] Test backup restore
- [ ] Clean up expired cache entries (automatic)
- [ ] Review connection pool metrics

### Monthly

- [ ] **Vacuum database** (PostgreSQL - auto via autovacuum)
- [ ] **Analyze query plans** for slow endpoints
- [ ] **Review and optimize** new indexes
- [ ] **Update statistics** (PostgreSQL ANALYZE)
- [ ] **Test disaster recovery** procedure

### Quarterly

- [ ] **Capacity planning** - project growth, scale resources
- [ ] **Full DR drill** - restore to staging from backup
- [ ] **Security audit** - review access controls, encryption
- [ ] **Performance tuning** - analyze P95/P99 latencies

---

## 📈 Performance Targets

### Response Time Targets

| Endpoint | P50 | P95 | P99 |
|----------|-----|-----|-----|
| Get Room Types | < 50ms | < 100ms | < 200ms |
| Check Availability | < 100ms | < 300ms | < 500ms |
| Create Booking | < 500ms | < 2s | < 5s |
| Get User Bookings | < 100ms | < 300ms | < 500ms |
| Generate Report | < 2s | < 5s | < 10s |

### Database Metrics

- **Query latency**: P95 < 100ms
- **Connection pool usage**: < 80% peak
- **Cache hit rate**: > 70% for hot data
- **Backup completion**: < 30 minutes
- **Index usage**: > 95% of queries use indexes

---

## 🚨 Common Performance Issues & Solutions

### Issue: Slow booking creation

**Symptoms**: Booking takes > 5 seconds

**Diagnosis**:
```typescript
// Enable query logging
const result = await prisma.booking.create({
  data,
  include: { roomType: true } // Check if needed
})
```

**Solutions**:
- Remove unnecessary `include` clauses
- Ensure inventory records pre-exist for dates
- Check for lock contention (concurrent bookings)
- Verify indexes on `RoomInventory(roomTypeId, date)`

### Issue: High cache miss rate

**Symptoms**: Cache hit rate < 50%

**Solutions**:
- Increase cache TTL for stable data
- Pre-warm cache on deployment
- Review cache key generation (ensure consistency)
- Check if cache is being invalidated too frequently

### Issue: N+1 queries detected

**Symptoms**: Many individual SELECT queries for related data

**Solutions**:
- Use Prisma's `include` or `select` with relations
- Use optimized query helpers from `src/lib/db/optimized-queries.ts`
- Batch queries using `findMany` with `where: { id: { in: ids } }`

### Issue: Transaction deadlocks

**Symptoms**: Intermittent "deadlock detected" errors

**Solutions**:
- Lock rows in consistent order (e.g., sort by ID)
- Reduce transaction scope (lock less, commit faster)
- Use optimistic locking instead of pessimistic where possible
- Implement retry logic with exponential backoff

---

## 🔗 Related Resources

### Internal Documentation
- [Database Backup Strategy](./DATABASE_BACKUP_STRATEGY.md)
- [Concurrency Safety Implementation](./DAY_13_CONCURRENCY_SAFETY.md)
- [RBAC Architecture](./RBAC_ARCHITECTURE.md)

### Prisma Resources
- [Prisma Performance Best Practices](https://www.prisma.io/docs/guides/performance-and-optimization)
- [Connection Pool Guide](https://www.prisma.io/docs/guides/performance-and-optimization/connection-management)
- [Query Optimization](https://www.prisma.io/docs/guides/performance-and-optimization/query-optimization-performance)

### PostgreSQL Resources
- [PostgreSQL Performance Tuning](https://wiki.postgresql.org/wiki/Performance_Optimization)
- [Index Types & Usage](https://www.postgresql.org/docs/current/indexes-types.html)
- [EXPLAIN Query Plans](https://www.postgresql.org/docs/current/sql-explain.html)

---

## 🎯 Quick Reference Commands

### Prisma

```bash
# Generate Prisma Client with optimizations
pnpm prisma generate

# Apply migrations
pnpm prisma migrate deploy

# Check migration status
pnpm prisma migrate status

# View database in GUI
pnpm prisma studio

# Format schema
pnpm prisma format
```

### Database

```bash
# PostgreSQL: Analyze query plan
psql -d hotel_booking -c "EXPLAIN ANALYZE SELECT * FROM bookings WHERE status = 'CONFIRMED';"

# Check index usage
psql -d hotel_booking -c "SELECT * FROM pg_stat_user_indexes WHERE idx_scan = 0;"

# Check table sizes
psql -d hotel_booking -c "SELECT schemaname, tablename, pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) FROM pg_tables WHERE schemaname = 'public';"
```

### Caching

```typescript
// Check cache stats
import { queryCache } from '@/lib/cache/query-cache'
console.log(queryCache.stats())

// Clear specific cache
queryCache.delete(CacheKeys.roomTypes())

// Clear pattern
queryCache.deletePattern(/^availability:/)

// Clear all cache
queryCache.clear()
```

---

## ✅ Implementation Status

- [x] Database indexes optimized (composite indexes added)
- [x] Query caching layer implemented
- [x] Optimized query helpers created
- [x] Backup strategy documented
- [x] Performance checklist documented
- [ ] Query monitoring dashboard setup (TODO)
- [ ] Automated performance testing (TODO)
- [ ] Cache pre-warming on deployment (TODO)

---

## 📞 Support

For performance issues or questions:
- Review this checklist first
- Check slow query logs
- Profile with `EXPLAIN ANALYZE` (PostgreSQL)
- Contact DevOps team for infrastructure issues

---

**Last Updated**: October 2024  
**Maintained By**: Backend Team  
**Review Schedule**: Quarterly
