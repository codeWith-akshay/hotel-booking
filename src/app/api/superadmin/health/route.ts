/**
 * SuperAdmin System Health API
 * 
 * GET /api/superadmin/health
 * Fetches system health metrics including database status, API performance, and server metrics
 * 
 * @access SUPERADMIN only
 */

import { NextResponse } from 'next/server'
import { requireRole } from '@/lib/middleware/auth.utils'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    // Require SUPERADMIN role
    await requireRole('SUPERADMIN')

    // Check database health
    const startTime = Date.now()
    let databaseStatus: 'HEALTHY' | 'WARNING' | 'CRITICAL' = 'HEALTHY'
    let apiResponseTime = 0

    try {
      // Simple database query to check connection
      await prisma.$queryRaw`SELECT 1`
      apiResponseTime = Date.now() - startTime

      // Determine database status based on response time
      if (apiResponseTime > 1000) {
        databaseStatus = 'CRITICAL'
      } else if (apiResponseTime > 500) {
        databaseStatus = 'WARNING'
      } else {
        databaseStatus = 'HEALTHY'
      }
    } catch (error) {
      console.error('[Health Check] Database error:', error)
      databaseStatus = 'CRITICAL'
      apiResponseTime = Date.now() - startTime
    }

    // Calculate error rate from recent logs
    // In production, integrate with error tracking service like Sentry
    const errorRate = 0.03 // Mock: 0.03% error rate

    // Get server load
    // In production, integrate with system monitoring tools
    const serverLoad = 34.5 // Mock: 34.5% CPU usage

    return NextResponse.json({
      success: true,
      data: {
        databaseStatus,
        apiResponseTime,
        errorRate,
        serverLoad,
        timestamp: new Date().toISOString(),
      }
    })
  } catch (error) {
    console.error('[SuperAdmin Health] Error:', error)
    
    if (error instanceof Error && error.message.includes('permissions')) {
      return NextResponse.json(
        {
          success: false,
          error: 'Forbidden',
          message: 'SUPERADMIN permission required',
        },
        { status: 403 }
      )
    }

    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
      },
      { status: 500 }
    )
  }
}
