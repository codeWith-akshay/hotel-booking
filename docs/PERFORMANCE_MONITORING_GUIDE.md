# Performance Monitoring Guide

## Overview

The hotel booking application now includes comprehensive performance monitoring to detect and optimize slow database queries.

---

## 🚀 Quick Start

### Run Performance Check

```bash
# Run comprehensive performance test
pnpm run perf:check
```

This will:
- Execute test queries against your database
- Track query execution times
- Detect slow queries (>= 100ms)
- Generate a detailed performance report
- Save report to `performance-reports/` directory

---

## 📊 Performance Report Output

### Console Output Example

```
╔════════════════════════════════════════════════════════════╗
║           DATABASE PERFORMANCE REPORT                     ║
╚════════════════════════════════════════════════════════════╝

📊 Summary
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   Total Queries: 42
   Slow Queries (>= 100ms): 3
   Average Query Time: 45.23ms
   Test Duration: 1892ms
   Timestamp: 2024-10-24T10:30:00.000Z

⚠️  Slow Queries Detected
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   ⚠️  Booking.findMany
      Count: 5 | Slow: 2
      Avg: 125.50ms | Max: 156.30ms
      Min: 23.10ms

   ⚠️  Payment.groupBy
      Count: 3 | Slow: 1
      Avg: 89.20ms | Max: 142.50ms
      Min: 45.60ms

📈 Query Statistics
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   ✅ User.findMany
      Executions: 10 | Slow: 0
      Total: 245.50ms | Avg: 24.55ms
      Min: 18.20ms | Max: 35.80ms

💡 Recommendations
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   ⚠️  3 slow queries detected
   • Consider adding indexes for frequently queried fields
   • Review and optimize slow queries
   • Implement caching for hot endpoints
   • Use select to fetch only required fields
   • Consider pagination for large result sets

✨ Performance Optimization Tips:
   • Add composite indexes for multi-field WHERE clauses
   • Use include sparingly, prefer select for specific fields
   • Implement Redis caching for frequently accessed data
   • Use transactions for bulk operations
   • Monitor query performance in production

💾 Report saved to: performance-reports/performance-report-1729766400000.json
```

---

## 🔧 Using Performance Monitoring in Your Code

### Method 1: Prisma Client Extension (Recommended)

Add this to your `lib/prisma.ts` file:

```typescript
import { PrismaClient } from '@prisma/client'

const prismaClientSingleton = () => {
  const client = new PrismaClient()
  
  // Add performance monitoring in development
  if (process.env.NODE_ENV === 'development') {
    return client.$extends({
      query: {
        $allModels: {
          async $allOperations({ model, operation, args, query }) {
            const start = Date.now()
            const result = await query(args)
            const duration = Date.now() - start

            // Log slow queries
            if (duration >= 100) {
              console.warn(`⚠️  Slow Query [${duration}ms]: ${model}.${operation}`)
              console.warn('Args:', JSON.stringify(args, null, 2))
            }

            return result
          }
        }
      }
    })
  }
  
  return client
}

declare global {
  var prisma: undefined | ReturnType<typeof prismaClientSingleton>
}

export const prisma = globalThis.prisma ?? prismaClientSingleton()

if (process.env.NODE_ENV !== 'production') globalThis.prisma = prisma
```

### Method 2: Performance Monitoring Class

Use the exported class for custom monitoring:

```typescript
import { PerformanceMonitor } from '@/scripts/performance-check'

const monitor = new PerformanceMonitor()

// Track queries manually
monitor.trackQuery('User', 'findMany', 45)
monitor.trackQuery('Booking', 'create', 120)

// Generate report
monitor.printReport()
await monitor.saveReport('my-custom-report.json')
```

---

## 📋 Performance Thresholds

### Query Performance Guidelines

| Speed | Time | Status | Action |
|-------|------|--------|--------|
| **Excellent** | < 50ms | ✅ | No action needed |
| **Good** | 50-100ms | ✅ | Monitor |
| **Slow** | 100-500ms | ⚠️ | Optimize |
| **Critical** | > 500ms | ❌ | Immediate action |

### Slow Query Threshold

The default threshold is **100ms**. Queries exceeding this are:
- Logged to console with warning
- Tracked in performance statistics
- Highlighted in reports

---

## 🎯 Optimization Strategies

### For Slow Queries

1. **Add Indexes**
   ```prisma
   model Booking {
     // Add composite index
     @@index([status, startDate, endDate])
   }
   ```

2. **Use Select Instead of Include**
   ```typescript
   // ❌ Slow - fetches all relations
   const booking = await prisma.booking.findMany({
     include: {
       user: true,
       roomType: true,
       payments: true
     }
   })

   // ✅ Fast - fetch only needed fields
   const booking = await prisma.booking.findMany({
     select: {
       id: true,
       status: true,
       user: {
         select: { name: true, email: true }
       }
     }
   })
   ```

3. **Implement Pagination**
   ```typescript
   // ❌ Slow - fetch all records
   const bookings = await prisma.booking.findMany()

   // ✅ Fast - paginate results
   const bookings = await prisma.booking.findMany({
     take: 20,
     skip: page * 20,
     orderBy: { createdAt: 'desc' }
   })
   ```

4. **Use Caching**
   ```typescript
   import { redis } from '@/lib/redis'

   async function getRoomAvailability(roomTypeId: string, date: Date) {
     const cacheKey = `room:${roomTypeId}:${date.toISOString()}`
     
     // Check cache first
     const cached = await redis.get(cacheKey)
     if (cached) return JSON.parse(cached)
     
     // Query database
     const availability = await prisma.roomInventory.findFirst({
       where: { roomTypeId, date }
     })
     
     // Cache for 15 minutes
     await redis.set(cacheKey, JSON.stringify(availability), 'EX', 900)
     
     return availability
   }
   ```

---

## 📊 Monitoring in Production

### Environment-Specific Monitoring

```typescript
// Only log slow queries in development/staging
if (process.env.NODE_ENV !== 'production' || process.env.ENABLE_QUERY_LOGGING === 'true') {
  if (duration >= 100) {
    console.warn(`⚠️  Slow Query [${duration}ms]: ${model}.${operation}`)
  }
}

// Always track metrics for production monitoring
await trackMetric('database.query.duration', duration, {
  model,
  operation,
  slow: duration >= 100
})
```

### Integration with Monitoring Services

```typescript
// Example: Send to monitoring service
import { captureException } from '@sentry/nextjs'

if (duration >= 100) {
  captureException(new Error('Slow query detected'), {
    extra: {
      model,
      operation,
      duration,
      args
    }
  })
}
```

---

## 🔍 Performance Report Files

Reports are saved to `performance-reports/` directory:

```json
{
  "timestamp": "2024-10-24T10:30:00.000Z",
  "duration": 1892,
  "totalQueries": 42,
  "slowQueries": 3,
  "avgQueryTime": 45.23,
  "queries": [
    {
      "key": "Booking.findMany",
      "model": "Booking",
      "action": "findMany",
      "count": 5,
      "totalTime": 627.50,
      "avgTime": 125.50,
      "minTime": 23.10,
      "maxTime": 156.30,
      "slowQueries": 2
    }
  ]
}
```

---

## 🛠️ Available Commands

```bash
# Run comprehensive performance check
pnpm run perf:check

# Check database health
pnpm run db:health

# Other performance tools
pnpm run perf:check-indexes    # Analyze index usage
pnpm run perf:analyze-queries  # Review slow queries
pnpm run perf:cache-stats      # Check caching effectiveness
```

---

## 📚 Related Documentation

- [PERFORMANCE_CHECKLIST.md](../PERFORMANCE_CHECKLIST.md) - Complete optimization checklist
- [BACKEND_OPTIMIZATION_SUMMARY.md](./BACKEND_OPTIMIZATION_SUMMARY.md) - Optimization details
- [DATABASE_BACKUP_GUIDE.md](./DATABASE_BACKUP_GUIDE.md) - Backup procedures
- [prisma/SCHEMA_CHANGELOG.md](../prisma/SCHEMA_CHANGELOG.md) - Schema changes

---

## ✅ Best Practices

1. **Run performance checks regularly** during development
2. **Monitor slow queries** and optimize immediately
3. **Use indexes strategically** for frequently queried fields
4. **Implement caching** for hot endpoints
5. **Review performance reports** weekly
6. **Keep queries simple** and focused
7. **Use pagination** for large result sets
8. **Test with production-like data** volumes

---

**Last Updated**: October 24, 2024
