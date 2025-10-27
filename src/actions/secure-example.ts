// ==========================================
// EXAMPLE: Secure Server Action Pattern
// ==========================================
// This file demonstrates how to use all Day 20 security features
// in a typical server action
//
// Copy this pattern for all your server actions

'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'

// Security imports
import { getCurrentUser } from '@/lib/middleware/auth.utils'
import { requireRole, requireAuth, requireOwnerOrAdmin } from '@/lib/rbac'
import { validateOrThrow } from '@/lib/validation'
import { logAdminAction, logSecurityEvent } from '@/lib/audit'
import { sanitizeError } from '@/lib/errorHandling'

// ==========================================
// 1. DEFINE VALIDATION SCHEMA
// ==========================================

const UpdateBookingSchema = z.object({
  bookingId: z.string().cuid(),
  checkIn: z.string().datetime().optional(),
  checkOut: z.string().datetime().optional(),
  guestCount: z.number().int().positive().optional(),
  reason: z.string().min(10).optional(), // For admin overrides
})

type UpdateBookingInput = z.infer<typeof UpdateBookingSchema>

// ==========================================
// 2. SERVER ACTION WITH FULL SECURITY
// ==========================================

/**
 * Update booking (secure example)
 * 
 * Security features:
 * - Authentication required
 * - RBAC: Owner or Admin only
 * - Input validation (Zod)
 * - Audit logging for admin overrides
 * - Error sanitization
 * 
 * @param {UpdateBookingInput} rawInput - Booking update data
 * @returns {Promise<{ success: boolean; data?: any; error?: string }>}
 */
export async function updateBooking(rawInput: unknown) {
  try {
    // ==========================================
    // STEP 1: VALIDATE INPUT
    // ==========================================
    const input = validateOrThrow(UpdateBookingSchema, rawInput)

    // ==========================================
    // STEP 2: AUTHENTICATE USER
    // ==========================================
    const user = await getCurrentUser()
    await requireAuth({ user }) // Throws if not authenticated
    
    if (!user) {
      return {
        success: false,
        error: 'User not authenticated',
        code: 'AUTHENTICATION_REQUIRED',
      }
    }

    // ==========================================
    // STEP 3: FETCH RESOURCE
    // ==========================================
    const booking = await prisma.booking.findUnique({
      where: { id: input.bookingId },
      include: { user: true, roomType: true },
    })

    if (!booking) {
      return {
        success: false,
        error: 'Booking not found',
        code: 'NOT_FOUND',
      }
    }

    // ==========================================
    // STEP 4: AUTHORIZE (RBAC)
    // ==========================================
    // User must be owner OR have admin role
    await requireOwnerOrAdmin({ user }, booking.userId, ['ADMIN', 'SUPERADMIN'])

    // ==========================================
    // STEP 5: BUSINESS LOGIC VALIDATION
    // ==========================================
    // Example: Check if booking can be modified
    if (booking.status === 'CANCELLED') {
      return {
        success: false,
        error: 'Cannot modify cancelled booking',
        code: 'INVALID_STATE',
      }
    }

    // ==========================================
    // STEP 6: PERFORM UPDATE
    // ==========================================
    const updatedBooking = await prisma.booking.update({
      where: { id: input.bookingId },
      data: {
        startDate: input.checkIn ? new Date(input.checkIn) : undefined,
        endDate: input.checkOut ? new Date(input.checkOut) : undefined,
        roomsBooked: input.guestCount,
        updatedAt: new Date(),
      },
    })

    // ==========================================
    // STEP 7: AUDIT LOGGING (IF ADMIN OVERRIDE)
    // ==========================================
    const isAdminOverride = user.userId !== booking.userId

    if (isAdminOverride) {
      await logAdminAction({
        adminId: user.userId,
        action: 'FORCE_UPDATE',
        targetType: 'BOOKING',
        targetId: booking.id,
        changes: {
          before: {
            startDate: booking.startDate,
            endDate: booking.endDate,
            roomsBooked: booking.roomsBooked,
          },
          after: {
            startDate: updatedBooking.startDate,
            endDate: updatedBooking.endDate,
            roomsBooked: updatedBooking.roomsBooked,
          },
        },
        reason: input.reason || 'Admin update via API',
      })
    }

    // ==========================================
    // STEP 8: REVALIDATE & RETURN
    // ==========================================
    revalidatePath('/dashboard/bookings')

    return {
      success: true,
      data: updatedBooking,
      message: 'Booking updated successfully',
    }
  } catch (error) {
    // ==========================================
    // ERROR HANDLING
    // ==========================================
    
    // Log security-related errors
    if (error instanceof Error && error.name === 'RBACError') {
      const user = await getCurrentUser()
      await logSecurityEvent({
        eventType: 'RBAC_VIOLATION',
        userId: user?.userId,
        ip: 'N/A', // Server action doesn't have direct IP access
        severity: 'MEDIUM',
        message: `RBAC violation in updateBooking: ${error.message}`,
        metadata: { action: 'updateBooking' },
      })
    }

    // Return sanitized error
    return sanitizeError(error)
  }
}

// ==========================================
// 3. EXAMPLE: PUBLIC SERVER ACTION (NO AUTH)
// ==========================================

/**
 * Get available room types (public)
 * No authentication required, but still uses validation
 */
export async function getAvailableRoomTypes(rawInput: unknown) {
  try {
    // Still validate input even for public endpoints
    const schema = z.object({
      checkIn: z.string().datetime(),
      checkOut: z.string().datetime(),
    })

    const input = validateOrThrow(schema, rawInput)

    // Fetch available rooms
    const roomTypes = await prisma.roomType.findMany({
      where: {
        // Business logic here
      },
    })

    return {
      success: true,
      data: roomTypes,
    }
  } catch (error) {
    return sanitizeError(error)
  }
}

// ==========================================
// 4. EXAMPLE: ADMIN-ONLY SERVER ACTION
// ==========================================

/**
 * Force cancel booking (admin only)
 * Requires ADMIN or SUPERADMIN role
 */
export async function adminCancelBooking(rawInput: unknown) {
  try {
    const schema = z.object({
      bookingId: z.string().cuid(),
      reason: z.string().min(20, { message: 'Cancellation reason must be detailed (min 20 chars)' }),
    })

    const input = validateOrThrow(schema, rawInput)

    // Authenticate
    const user = await getCurrentUser()

    // Enforce admin role
    await requireRole({ user }, ['ADMIN', 'SUPERADMIN'])
    
    if (!user) {
      return { success: false, error: 'User not authenticated', code: 'AUTHENTICATION_REQUIRED' }
    }

    // Fetch booking
    const booking = await prisma.booking.findUnique({
      where: { id: input.bookingId },
    })

    if (!booking) {
      return { success: false, error: 'Booking not found', code: 'NOT_FOUND' }
    }

    // Cancel booking
    const cancelled = await prisma.booking.update({
      where: { id: input.bookingId },
      data: {
        status: 'CANCELLED',
        updatedAt: new Date(),
      },
    })

    // MANDATORY: Log admin action
    await logAdminAction({
      adminId: user.userId,
      action: 'OVERRIDE_CANCEL',
      targetType: 'BOOKING',
      targetId: booking.id,
      changes: {
        before: { status: booking.status },
        after: { status: 'CANCELLED' },
      },
      reason: input.reason,
    })

    revalidatePath('/admin/bookings')

    return {
      success: true,
      data: cancelled,
      message: 'Booking cancelled by admin',
    }
  } catch (error) {
    // Log RBAC violations
    if (error instanceof Error && error.name === 'RBACError') {
      const user = await getCurrentUser()
      await logSecurityEvent({
        eventType: 'RBAC_VIOLATION',
        userId: user?.userId,
        ip: 'N/A',
        severity: 'HIGH', // Admin endpoint violations are HIGH severity
        message: `Unauthorized admin action attempt: ${error.message}`,
        metadata: { action: 'adminCancelBooking' },
      })
    }

    return sanitizeError(error)
  }
}

// ==========================================
// 5. EXAMPLE: RATE-LIMITED SERVER ACTION
// ==========================================

/**
 * Send contact message (rate-limited)
 * Demonstrates rate limiting in server actions
 */
export async function sendContactMessage(rawInput: unknown) {
  try {
    const schema = z.object({
      email: z.string().email(),
      message: z.string().min(10),
      // Add CSRF token if called from client component
      csrfToken: z.string().optional(),
    })

    const input = validateOrThrow(schema, rawInput)

    // Rate limiting (optional - usually done at API route level)
    // For server actions, consider implementing a similar pattern
    // or use API routes for rate-limited operations

    // Send message logic here
    // TODO: Create ContactMessage model in Prisma schema if needed
    // await prisma.contactMessage.create({
    //   data: {
    //     email: input.email,
    //     message: input.message,
    //     createdAt: new Date(),
    //   },
    // })
    
    console.log('Contact message received:', { email: input.email, message: input.message })

    return {
      success: true,
      message: 'Message sent successfully',
    }
  } catch (error) {
    return sanitizeError(error)
  }
}

// ==========================================
// SECURITY BEST PRACTICES CHECKLIST
// ==========================================

/*
✅ Always validate input with Zod
✅ Always authenticate user (except public endpoints)
✅ Always check RBAC before allowing action
✅ Log all admin actions with detailed reason
✅ Log security violations (RBAC, validation)
✅ Sanitize errors before returning to client
✅ Never return stack traces or sensitive info
✅ Revalidate paths after mutations
✅ Use transactions for multi-step operations
✅ Check business logic constraints
❌ Never trust client input
❌ Never bypass RBAC checks
❌ Never expose database errors
❌ Never log sensitive data (passwords, tokens)
*/

// ==========================================
// USAGE IN CLIENT COMPONENTS
// ==========================================

/*
// Example client component using secure server action:

'use client'

import { updateBooking } from '@/actions/secure-example'
import { useState } from 'react'

export function UpdateBookingForm({ bookingId }: { bookingId: string }) {
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)

    const formData = new FormData(e.currentTarget)
    const result = await updateBooking({
      bookingId,
      checkIn: formData.get('checkIn') as string,
      guestCount: parseInt(formData.get('guestCount') as string),
    })

    if (result.success) {
      alert('Booking updated!')
    } else {
      alert(`Error: ${result.error}`)
    }

    setLoading(false)
  }

  return (
    <form onSubmit={handleSubmit}>
      <input type="datetime-local" name="checkIn" required />
      <input type="number" name="guestCount" min="1" required />
      <button type="submit" disabled={loading}>
        {loading ? 'Updating...' : 'Update Booking'}
      </button>
    </form>
  )
}
*/
