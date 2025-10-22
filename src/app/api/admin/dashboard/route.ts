// ==========================================
// TEST API ROUTE - Admin Protected Endpoint
// ==========================================
// Test middleware authorization for ADMIN role

import { NextResponse } from 'next/server'
import { requireRole } from '@/lib/middleware/auth.utils'

/**
 * GET /api/admin/dashboard
 * Protected endpoint - requires ADMIN or SUPERADMIN role
 * Returns admin dashboard statistics
 */
export async function GET() {
  try {
    // Require ADMIN or SUPERADMIN role
    const user = await requireRole(['ADMIN', 'SUPERADMIN'])

    // Mock admin statistics
    const stats = {
      totalUsers: 150,
      activeUsers: 120,
      totalBookings: 450,
      revenue: 125000,
    }

    return NextResponse.json({
      success: true,
      data: {
        admin: {
          userId: user.userId,
          name: user.name,
          role: user.role,
        },
        statistics: stats,
      },
      message: 'Admin dashboard data retrieved successfully',
    })
  } catch (error) {
    console.error('Admin dashboard error:', error)

    // Check if it's an authorization error
    if (error instanceof Error && error.message.includes('permissions')) {
      return NextResponse.json(
        {
          success: false,
          error: 'Forbidden',
          message: error.message,
        },
        { status: 403 }
      )
    }

    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        message: 'Failed to retrieve admin dashboard',
      },
      { status: 500 }
    )
  }
}

/**
 * POST /api/admin/dashboard
 * Protected endpoint - requires SUPERADMIN role only
 * Performs admin action (example: reset statistics)
 */
export async function POST() {
  try {
    // Require SUPERADMIN role only
    const user = await requireRole('SUPERADMIN')

    // Perform admin action (mock)
    console.log(`SUPERADMIN ${user.name} reset statistics`)

    return NextResponse.json({
      success: true,
      data: {
        message: 'Statistics reset successfully',
        performedBy: user.name,
        role: user.role,
      },
    })
  } catch (error) {
    console.error('Admin action error:', error)

    if (error instanceof Error && error.message.includes('permissions')) {
      return NextResponse.json(
        {
          success: false,
          error: 'Forbidden',
          message: 'Only SUPERADMIN can perform this action',
        },
        { status: 403 }
      )
    }

    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        message: 'Failed to perform admin action',
      },
      { status: 500 }
    )
  }
}
