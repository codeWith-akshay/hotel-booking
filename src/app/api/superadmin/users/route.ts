/**
 * SuperAdmin Users Management API
 * 
 * GET /api/superadmin/users
 * Fetches all users in the system with detailed information
 * 
 * @access SUPERADMIN only
 */

import { NextResponse } from 'next/server'
import { requireRole } from '@/lib/middleware/auth.utils'
import { prisma } from '@/lib/prisma'

export async function GET(request: Request) {
  try {
    // Require SUPERADMIN role
    await requireRole('SUPERADMIN')

    // Get query parameters for filtering
    const { searchParams } = new URL(request.url)
    const roleFilter = searchParams.get('role') // 'ADMIN', 'MEMBER', 'SUPERADMIN', or null for all

    // Map plural forms to singular enum values
    const roleMapping: Record<string, string> = {
      'ADMINS': 'ADMIN',
      'MEMBERS': 'MEMBER',
      'SUPERADMINS': 'SUPERADMIN',
      'ADMIN': 'ADMIN',
      'MEMBER': 'MEMBER',
      'SUPERADMIN': 'SUPERADMIN',
    }

    const normalizedRole = roleFilter ? roleMapping[roleFilter] || roleFilter : null

    // Build where clause
    const where: any = {}
    if (normalizedRole) {
      where.role = {
        name: normalizedRole
      }
    }

    // Fetch all users with role and booking information
    const users = await prisma.user.findMany({
      where,
      include: {
        role: true,
        bookings: {
          select: {
            id: true,
            status: true,
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    // Transform data to match frontend interface
    const transformedUsers = users.map(user => ({
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role?.name as 'MEMBER' | 'ADMIN' | 'SUPERADMIN' || 'UNKNOWN',
      status: 'ACTIVE' as 'ACTIVE' | 'INACTIVE' | 'SUSPENDED', // Default to ACTIVE since User model doesn't have status field
      totalBookings: user.bookings.length,
      lastLogin: user.updatedAt, // Using updatedAt as proxy for last activity
      createdAt: user.createdAt,
    }))

    return NextResponse.json({
      success: true,
      data: transformedUsers,
      total: transformedUsers.length,
    })
  } catch (error) {
    console.error('[SuperAdmin Users] Error:', error)
    
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
