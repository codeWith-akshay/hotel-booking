/**
 * RBAC Protected API Route Example
 * =================================
 * Template for implementing role-based access control and audit logging
 * 
 * This example demonstrates:
 * - Authentication and role verification
 * - Permission checking
 * - Audit logging for admin actions
 * - Error handling with proper status codes
 * 
 * Copy this template for new API routes that need RBAC
 * 
 * @route POST /api/admin/bookings/override
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import {
  requireAuth,
  requireAdmin,
  logAction,
  getAuditContext,
} from '@/lib/utils/api-request'
import {
  requirePermission,
  checkResourcePermission,
} from '@/lib/auth/permissions'
import {
  AuditAction,
  AuditTargetType,
} from '@/lib/services/audit.service'

/**
 * Override booking status (Admin/SuperAdmin only)
 * 
 * @requires ADMIN or SUPERADMIN role
 * @requires bookings:override permission
 * @audit Logs all override actions
 */
export async function POST(request: NextRequest) {
  try {
    // ==========================================
    // STEP 1: Authentication & Role Check
    // ==========================================
    
    // Get authenticated user (throws if not authenticated)
    const user = await requireAuth()
    
    // Check if user is admin/superadmin (throws if not)
    await requireAdmin()
    
    console.log(`[API] Admin override request from: ${user.name} (${user.role})`)

    // ==========================================
    // STEP 2: Parse Request Body
    // ==========================================
    
    const body = await request.json()
    const { bookingId, newStatus, reason } = body

    // Validate required fields
    if (!bookingId || !newStatus || !reason) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required fields',
          message: 'bookingId, newStatus, and reason are required',
        },
        { status: 400 }
      )
    }

    // ==========================================
    // STEP 3: Permission Check
    // ==========================================
    
    // Check specific permission
    await requirePermission(
      {
        id: user.id,
        role: user.role,
        email: user.email,
        phone: user.phone,
      },
      'bookings:override',
      true // Log permission check
    )

    // ==========================================
    // STEP 4: Fetch Current Resource State
    // ==========================================
    
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        user: { select: { name: true, email: true, phone: true } },
        roomType: { select: { name: true } },
      },
    })

    if (!booking) {
      return NextResponse.json(
        {
          success: false,
          error: 'Booking not found',
          message: `No booking found with ID: ${bookingId}`,
        },
        { status: 404 }
      )
    }

    // Store before state for audit log
    const beforeState = {
      status: booking.status,
      totalPrice: booking.totalPrice,
      updatedAt: booking.updatedAt,
    }

    // ==========================================
    // STEP 5: Perform Action
    // ==========================================
    
    const updatedBooking = await prisma.booking.update({
      where: { id: bookingId },
      data: {
        status: newStatus,
        updatedAt: new Date(),
      },
    })

    // Store after state for audit log
    const afterState = {
      status: updatedBooking.status,
      totalPrice: updatedBooking.totalPrice,
      updatedAt: updatedBooking.updatedAt,
    }

    // ==========================================
    // STEP 6: Audit Logging
    // ==========================================
    
    await logAction(
      AuditAction.BOOKING_OVERRIDE_CONFIRM,
      AuditTargetType.BOOKING,
      bookingId,
      {
        reason,
        changes: {
          before: beforeState,
          after: afterState,
        },
        metadata: {
          customerName: booking.user.name,
          roomType: booking.roomType.name,
          adminName: user.name,
          adminRole: user.role,
        },
      }
    )

    console.log(`[API] ✅ Booking ${bookingId} status overridden by ${user.name} (${user.role})`)

    // ==========================================
    // STEP 7: Return Success Response
    // ==========================================
    
    return NextResponse.json({
      success: true,
      message: 'Booking status overridden successfully',
      data: {
        booking: updatedBooking,
        changes: {
          before: beforeState,
          after: afterState,
        },
      },
    })

  } catch (error) {
    // ==========================================
    // ERROR HANDLING
    // ==========================================
    
    console.error('[API] Error overriding booking:', error)

    // Handle specific error types
    if (error instanceof Error) {
      // Authentication/Authorization errors
      if (
        error.message === 'Authentication required' ||
        error.message.includes('Forbidden')
      ) {
        return NextResponse.json(
          {
            success: false,
            error: 'Unauthorized',
            message: error.message,
          },
          { status: error.message === 'Authentication required' ? 401 : 403 }
        )
      }

      // Permission errors
      if (error.message.includes('Permission denied')) {
        return NextResponse.json(
          {
            success: false,
            error: 'Forbidden',
            message: error.message,
          },
          { status: 403 }
        )
      }
    }

    // Generic error response
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

// ==========================================
// SIMPLIFIED VERSION (for less critical routes)
// ==========================================

/**
 * Simplified version without detailed permission checks
 * Use for routes that only need basic role checking
 */
export async function GET_SIMPLIFIED(request: NextRequest) {
  try {
    // Quick auth + role check
    const user = await requireAuth()
    await requireAdmin()

    // Your logic here
    const data = await prisma.booking.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' },
    })

    // Auto-log if audit required (admin/superadmin)
    // This is automatically handled by middleware flag

    return NextResponse.json({
      success: true,
      data,
    })
  } catch (error) {
    console.error('[API] Error:', error)
    
    if (error instanceof Error && error.message.includes('required')) {
      return NextResponse.json(
        { error: error.message },
        { status: error.message === 'Authentication required' ? 401 : 403 }
      )
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
