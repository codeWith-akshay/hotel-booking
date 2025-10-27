/**
 * Performance Check Script
 * 
 * This script analyzes database query performance by:
 * - Tracking query execution times
 * - Identifying slow queries (>= 100ms)
 * - Generating a performance summary report
 * 
 * Usage: pnpm run perf:check
 */

import { PrismaClient, Prisma } from '@prisma/client'
import fs from 'fs'
import path from 'path'

interface QueryMetrics {
  model: string
  action: string
  count: number
  totalTime: number
  avgTime: number
  minTime: number
  maxTime: number
  slowQueries: number
}

interface PerformanceReport {
  timestamp: string
  duration: number
  totalQueries: number
  slowQueries: number
  avgQueryTime: number
  queries: Map<string, QueryMetrics>
}

// Colors for console output
const colors = {
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
}

function log(message: string, color: keyof typeof colors = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`)
}

class PerformanceMonitor {
  private queries: Map<string, QueryMetrics> = new Map()
  private startTime: number = Date.now()
  private slowQueryThreshold = 100 // milliseconds

  trackQuery(model: string, action: string, duration: number) {
    const key = `${model}.${action}`
    const existing = this.queries.get(key) || {
      model,
      action,
      count: 0,
      totalTime: 0,
      avgTime: 0,
      minTime: Infinity,
      maxTime: 0,
      slowQueries: 0
    }

    existing.count++
    existing.totalTime += duration
    existing.avgTime = existing.totalTime / existing.count
    existing.minTime = Math.min(existing.minTime, duration)
    existing.maxTime = Math.max(existing.maxTime, duration)
    
    if (duration >= this.slowQueryThreshold) {
      existing.slowQueries++
    }

    this.queries.set(key, existing)
  }

  getReport(): PerformanceReport {
    const totalQueries = Array.from(this.queries.values()).reduce(
      (sum, q) => sum + q.count,
      0
    )
    const slowQueries = Array.from(this.queries.values()).reduce(
      (sum, q) => sum + q.slowQueries,
      0
    )
    const totalTime = Array.from(this.queries.values()).reduce(
      (sum, q) => sum + q.totalTime,
      0
    )

    return {
      timestamp: new Date().toISOString(),
      duration: Date.now() - this.startTime,
      totalQueries,
      slowQueries,
      avgQueryTime: totalQueries > 0 ? totalTime / totalQueries : 0,
      queries: this.queries
    }
  }

  printReport() {
    const report = this.getReport()

    log('\n╔════════════════════════════════════════════════════════════╗', 'cyan')
    log('║           DATABASE PERFORMANCE REPORT                     ║', 'cyan')
    log('╚════════════════════════════════════════════════════════════╝\n', 'cyan')

    log(`📊 Summary`, 'bold')
    log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`, 'blue')
    log(`   Total Queries: ${report.totalQueries}`)
    log(`   Slow Queries (>= 100ms): ${report.slowQueries}`, report.slowQueries > 0 ? 'yellow' : 'green')
    log(`   Average Query Time: ${report.avgQueryTime.toFixed(2)}ms`)
    log(`   Test Duration: ${report.duration}ms`)
    log(`   Timestamp: ${report.timestamp}\n`)

    if (report.slowQueries > 0) {
      log(`⚠️  Slow Queries Detected`, 'yellow')
      log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`, 'yellow')
      
      const slowQueries = Array.from(report.queries.values())
        .filter(q => q.slowQueries > 0)
        .sort((a, b) => b.maxTime - a.maxTime)

      slowQueries.forEach(query => {
        log(`   ⚠️  ${query.model}.${query.action}`, 'yellow')
        log(`      Count: ${query.count} | Slow: ${query.slowQueries}`)
        log(`      Avg: ${query.avgTime.toFixed(2)}ms | Max: ${query.maxTime.toFixed(2)}ms`)
        log(`      Min: ${query.minTime.toFixed(2)}ms\n`)
      })
    }

    log(`📈 Query Statistics`, 'bold')
    log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`, 'blue')

    const sortedQueries = Array.from(report.queries.values())
      .sort((a, b) => b.totalTime - a.totalTime)
      .slice(0, 20) // Top 20 queries by total time

    sortedQueries.forEach(query => {
      const isSlow = query.slowQueries > 0
      const color = isSlow ? 'yellow' : 'green'
      
      log(`   ${isSlow ? '⚠️' : '✅'} ${query.model}.${query.action}`, color)
      log(`      Executions: ${query.count} | Slow: ${query.slowQueries}`)
      log(`      Total: ${query.totalTime.toFixed(2)}ms | Avg: ${query.avgTime.toFixed(2)}ms`)
      log(`      Min: ${query.minTime.toFixed(2)}ms | Max: ${query.maxTime.toFixed(2)}ms\n`)
    })

    log(`\n💡 Recommendations`, 'cyan')
    log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`, 'cyan')
    
    if (report.slowQueries === 0) {
      log(`   ✅ All queries are performing well!`, 'green')
    } else {
      log(`   ⚠️  ${report.slowQueries} slow queries detected`, 'yellow')
      log(`   • Consider adding indexes for frequently queried fields`)
      log(`   • Review and optimize slow queries`)
      log(`   • Implement caching for hot endpoints`)
      log(`   • Use select to fetch only required fields`)
      log(`   • Consider pagination for large result sets`)
    }
    
    log(`\n✨ Performance Optimization Tips:`, 'cyan')
    log(`   • Add composite indexes for multi-field WHERE clauses`)
    log(`   • Use include sparingly, prefer select for specific fields`)
    log(`   • Implement Redis caching for frequently accessed data`)
    log(`   • Use transactions for bulk operations`)
    log(`   • Monitor query performance in production\n`)
  }

  async saveReport(filename?: string) {
    const report = this.getReport()
    const reportsDir = path.join(process.cwd(), 'performance-reports')
    
    // Ensure reports directory exists
    if (!fs.existsSync(reportsDir)) {
      fs.mkdirSync(reportsDir, { recursive: true })
    }

    const reportFile = filename || `performance-report-${Date.now()}.json`
    const filePath = path.join(reportsDir, reportFile)

    const reportData = {
      ...report,
      queries: Array.from(report.queries.entries()).map(([key, value]) => ({
        key,
        ...value
      }))
    }

    fs.writeFileSync(filePath, JSON.stringify(reportData, null, 2))
    log(`\n💾 Report saved to: ${filePath}`, 'green')
  }
}

async function runPerformanceCheck() {
  log('\n🚀 Starting Performance Check...', 'cyan')
  log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n', 'cyan')

  const monitor = new PerformanceMonitor()
  
  // Create Prisma client with performance monitoring middleware
  const prisma = new PrismaClient()

  // Add performance monitoring middleware (Prisma 5.x uses $extends)
  const prismaWithMiddleware = prisma.$extends({
    query: {
      $allModels: {
        async $allOperations({ model, operation, args, query }) {
          const start = Date.now()
          const result = await query(args)
          const duration = Date.now() - start

          // Track the query
          monitor.trackQuery(model, operation, duration)

          // Log slow queries in real-time
          if (duration >= 100) {
            log(`⚠️  Slow Query [${duration}ms]: ${model}.${operation}`, 'yellow')
          }

          return result
        }
      }
    }
  })

  try {
    log('🔍 Running test queries...', 'blue')

    // Test various queries to check performance
    // You can customize these based on your application

    // 1. User queries
    await prismaWithMiddleware.user.findMany({ take: 10 })
    await prismaWithMiddleware.user.count()
    await prismaWithMiddleware.user.findFirst({ where: { email: { contains: '@' } } })

    // 2. Booking queries
    await prismaWithMiddleware.booking.findMany({
      take: 20,
      include: {
        user: true,
        roomType: true
      },
      orderBy: { createdAt: 'desc' }
    })

    await prismaWithMiddleware.booking.count({
      where: {
        status: 'CONFIRMED'
      }
    })

    // 3. Room inventory queries
    await prismaWithMiddleware.roomInventory.findMany({
      take: 30,
      where: {
        date: {
          gte: new Date()
        }
      }
    })

    // 4. Payment queries
    await prismaWithMiddleware.payment.findMany({
      take: 10,
      where: {
        status: 'SUCCEEDED'
      },
      orderBy: { createdAt: 'desc' }
    })

    // 5. Notification queries
    await prismaWithMiddleware.notification.count({
      where: {
        status: 'PENDING'
      }
    })

    // 6. Complex aggregate query
    await prismaWithMiddleware.booking.groupBy({
      by: ['status'],
      _count: true
    })

    log('✅ Test queries completed\n', 'green')

    // Print and save report
    monitor.printReport()
    await monitor.saveReport()

  } catch (error) {
    log(`\n❌ Error during performance check: ${error instanceof Error ? error.message : String(error)}`, 'red')
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

// Run the performance check
if (require.main === module) {
  runPerformanceCheck()
    .then(() => {
      log('✨ Performance check completed successfully!\n', 'green')
      process.exit(0)
    })
    .catch((error) => {
      log(`❌ Performance check failed: ${error}`, 'red')
      process.exit(1)
    })
}

export { runPerformanceCheck, PerformanceMonitor }
