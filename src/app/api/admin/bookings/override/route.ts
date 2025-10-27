/**
 * Admin Override Booking API Route (Day 15)
 * POST /api/admin/bookings/override - Override booking status/details
 * 
 * RBAC: Requires ADMIN or SUPERADMIN role
 * Permission: bookings:override
 * Audit: All override actions are logged
 */

import { NextRequest, NextResponse } from 'next/server'
import { overrideBooking } from '@/actions/admin/bookings'
import { OverrideBookingRequestSchema } from '@/lib/validation/admin.validation'
import {
  requireAuth,
  requireAdmin,
  logAction,
} from '@/lib/utils/api-request'
import { AuditAction, AuditTargetType } from '@/lib/services/audit.service'

export async function POST(request: NextRequest) {
  try {
    // ==========================================
    // RBAC: Authentication & Authorization
    // ==========================================
    const user = await requireAuth()
    await requireAdmin()
    
    console.log(`[API] Booking override request from: ${user.name} (${user.role})`)
    
    // ==========================================
    // Parse & Validate Request
    // ==========================================
    const body = await request.json()
    
    // Validate input
    const validated = OverrideBookingRequestSchema.parse(body)
    
    // ==========================================
    // Execute Action
    // ==========================================
    // Override booking (this function should be updated to accept user context)
    const result = await overrideBooking(validated)
    
    if (!result.success) {
      const statusCode =
        result.error === 'BOOKING_NOT_FOUND' ? 404
        : result.error === 'UNAUTHORIZED' ? 403
        : result.error === 'INVALID_ACTION' ? 400
        : result.error === 'INVALID_DATES' ? 400
        : result.error === 'NO_AVAILABILITY' ? 409
        : 500
      
      return NextResponse.json(result, { status: statusCode })
    }
    
    // ==========================================
    // Audit Logging
    // ==========================================
    await logAction(
      AuditAction.BOOKING_OVERRIDE_CONFIRM,
      AuditTargetType.BOOKING,
      validated.bookingId,
      {
        reason: validated.reason || 'Admin override',
        changes: {
          before: validated, // Original request
          after: result.booking, // Updated booking
        },
        metadata: {
          action: validated.action,
          adminName: user.name,
          adminRole: user.role,
        },
      }
    )
    
    console.log(`[API] ✅ Booking ${validated.bookingId} overridden by ${user.name}`)
    
    return NextResponse.json(result, { status: 200 })
    
  } catch (error: any) {
    console.error('POST /api/admin/bookings/override error:', error)
    
    // Handle RBAC errors
    if (error instanceof Error) {
      if (error.message === 'Authentication required') {
        return NextResponse.json(
          {
            success: false,
            error: 'UNAUTHORIZED',
            message: 'Authentication required',
          },
          { status: 401 }
        )
      }
      
      if (error.message.includes('Forbidden') || error.message.includes('Admin access required')) {
        return NextResponse.json(
          {
            success: false,
            error: 'FORBIDDEN',
            message: 'Admin access required',
          },
          { status: 403 }
        )
      }
    }
    
    // Handle validation errors
    if (error.name === 'ZodError') {
      return NextResponse.json(
        {
          success: false,
          error: 'VALIDATION_ERROR',
          message: 'Invalid request data',
          details: error.errors,
        },
        { status: 400 }
      )
    }
    
    return NextResponse.json(
      {
        success: false,
        error: 'INTERNAL_ERROR',
        message: 'Failed to override booking',
      },
      { status: 500 }
    )
  }
}
