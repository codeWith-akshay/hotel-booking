/**
 * SuperAdmin System Statistics API
 * 
 * GET /api/superadmin/stats
 * Fetches system-wide statistics including users, bookings, revenue, and system metrics
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

    // Fetch user statistics
    const [
      totalUsers,
      totalAdmins,
      totalMembers,
      recentUsers,
    ] = await Promise.all([
      // Total users count
      prisma.user.count(),
      
      // Total admins count (ADMIN + SUPERADMIN)
      prisma.user.count({
        where: {
          role: {
            name: {
              in: ['ADMIN', 'SUPERADMIN']
            }
          }
        }
      }),
      
      // Total members count
      prisma.user.count({
        where: {
          role: {
            name: 'MEMBER'
          }
        }
      }),
      
      // Users created in last 30 days (as proxy for active users)
      prisma.user.count({
        where: {
          updatedAt: {
            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
          }
        }
      }),
    ])

    // Fetch booking statistics
    const [
      totalBookings,
      bookingsWithPayments,
    ] = await Promise.all([
      prisma.booking.count(),
      
      prisma.booking.findMany({
        include: {
          payments: {
            where: {
              status: 'SUCCEEDED'
            }
          }
        }
      }),
    ])

    // Calculate total revenue from successful payments
    const totalRevenue = bookingsWithPayments.reduce((sum, booking) => {
      const paidAmount = booking.payments.reduce((pSum, payment) => pSum + payment.amount, 0)
      return sum + paidAmount
    }, 0)

    // Get active sessions count (users with recent activity - using updatedAt)
    const activeSessionsCount = await prisma.user.count({
      where: {
        updatedAt: {
          gte: new Date(Date.now() - 60 * 60 * 1000) // Last 1 hour
        }
      }
    })

    // Calculate system uptime (mock - would need actual system monitoring)
    // In production, integrate with monitoring service
    const systemUptime = 99.97

    return NextResponse.json({
      success: true,
      data: {
        totalUsers,
        totalAdmins,
        totalMembers,
        activeUsers: recentUsers,
        totalBookings,
        totalRevenue,
        systemUptime,
        activeSessionsCount,
      }
    })
  } catch (error) {
    console.error('[SuperAdmin Stats] Error:', error)
    
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
