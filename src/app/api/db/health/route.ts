/**
 * Database Health Check API Route
 * 
 * Returns database connection status and latency
 * 
 * Endpoint: GET /api/db/health
 * 
 * Response:
 * {
 *   status: 'healthy' | 'unhealthy',
 *   timestamp: string,
 *   database: {
 *     connected: boolean,
 *     latency: number (ms),
 *     version?: string
 *   },
 *   migrations: {
 *     pending: number,
 *     applied: number
 *   }
 * }
 */

import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'
export const revalidate = 0

interface HealthCheckResponse {
  status: 'healthy' | 'unhealthy' | 'degraded'
  timestamp: string
  database: {
    connected: boolean
    latency: number
    version?: string
    provider?: string
  }
  migrations?: {
    status: string
    pending?: number
    applied?: number
  }
  error?: string
}

export async function GET() {
  const timestamp = new Date().toISOString()
  
  try {
    // Test database connection with latency measurement
    const startTime = Date.now()
    
    // Simple query to test connection
    await prisma.$queryRaw`SELECT 1`
    
    const latency = Date.now() - startTime
    
    // Get database version (works for PostgreSQL and SQLite)
    let version: string | undefined
    let provider: string | undefined
    
    try {
      // Try PostgreSQL version query
      const result = await prisma.$queryRaw<Array<{ version: string }>>`SELECT version()`
      version = result[0]?.version
      provider = 'PostgreSQL'
    } catch {
      try {
        // Try SQLite version query
        const result = await prisma.$queryRaw<Array<{ version: string }>>`SELECT sqlite_version() as version`
        version = result[0]?.version
        provider = 'SQLite'
      } catch {
        // Version query not supported
        provider = 'Unknown'
      }
    }
    
    // Check migration status (optional - requires file system access)
    let migrationStatus = 'unknown'
    let pendingMigrations = 0
    let appliedMigrations = 0
    
    try {
      // This is a simple check - in production, you might want to query _prisma_migrations table
      const migrations = await prisma.$queryRaw<Array<{ migration_name: string; finished_at: Date | null }>>`
        SELECT migration_name, finished_at 
        FROM _prisma_migrations 
        ORDER BY finished_at DESC
      `
      
      appliedMigrations = migrations.filter(m => m.finished_at !== null).length
      pendingMigrations = migrations.filter(m => m.finished_at === null).length
      
      migrationStatus = pendingMigrations === 0 ? 'up-to-date' : 'pending'
    } catch {
      // _prisma_migrations table might not exist or accessible
      migrationStatus = 'unknown'
    }
    
    // Determine overall health status
    let status: 'healthy' | 'unhealthy' | 'degraded' = 'healthy'
    
    if (latency > 1000) {
      status = 'degraded' // Slow but working
    }
    
    if (pendingMigrations > 0) {
      status = 'degraded' // Pending migrations
    }
    
    const response: HealthCheckResponse = {
      status,
      timestamp,
      database: {
        connected: true,
        latency,
        version,
        provider,
      },
      migrations: {
        status: migrationStatus,
        pending: pendingMigrations,
        applied: appliedMigrations,
      },
    }
    
    return NextResponse.json(response, {
      status: status === 'healthy' ? 200 : 503,
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate',
        'Content-Type': 'application/json',
      },
    })
    
  } catch (error) {
    // Database connection failed
    const response: HealthCheckResponse = {
      status: 'unhealthy',
      timestamp,
      database: {
        connected: false,
        latency: -1,
      },
      error: error instanceof Error ? error.message : 'Unknown database error',
    }
    
    return NextResponse.json(response, {
      status: 503,
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate',
        'Content-Type': 'application/json',
      },
    })
  }
}
