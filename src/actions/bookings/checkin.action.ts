/**
 * Check-In Server Action
 * Handles guest check-in and sends notifications to admin/super admin
 */

'use server'

import { prisma } from '@/lib/prisma'
import { sendCheckInNotifications } from '@/lib/services/notification.service'
import { BookingStatus } from '@prisma/client'
import { z } from 'zod'

// ==========================================
// VALIDATION SCHEMAS
// ==========================================

const CheckInSchema = z.object({
  bookingId: z.string().cuid(),
  adminId: z.string().cuid(),
  roomNumber: z.string().optional(),
})

export type CheckInInput = z.infer<typeof CheckInSchema>

export interface CheckInResponse {
  success: boolean
  message?: string
  error?: string
  data?: {
    bookingId: string
    status: BookingStatus
    checkedInAt: Date
  }
}

// ==========================================
// CHECK-IN ACTION
// ==========================================

/**
 * Check in a guest
 * 
 * Updates booking status to CHECKED_IN and sends real-time notifications
 * to all admin and super admin users
 * 
 * @param input - Check-in data
 * @returns Response with check-in status
 */
export async function checkInGuest(input: CheckInInput): Promise<CheckInResponse> {
  try {
    // Validate input
    const validation = CheckInSchema.safeParse(input)
    
    if (!validation.success) {
      const errors = validation.error.issues.map((err) => err.message).join(', ')
      return {
        success: false,
        error: `Validation failed: ${errors}`,
      }
    }

    const { bookingId, adminId, roomNumber } = validation.data

    // Verify admin permissions
    const admin = await prisma.user.findFirst({
      where: {
        id: adminId,
        role: {
          name: {
            in: ['ADMIN', 'SUPERADMIN'],
          },
        },
      },
      select: {
        id: true,
        name: true,
      },
    })

    if (!admin) {
      return {
        success: false,
        error: 'Unauthorized: Admin privileges required',
      }
    }

    // Get booking details
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            phone: true,
            email: true,
          },
        },
        roomType: {
          select: {
            name: true,
          },
        },
      },
    })

    if (!booking) {
      return {
        success: false,
        error: 'Booking not found',
      }
    }

    // Check if booking can be checked in
    if (booking.status !== BookingStatus.CONFIRMED) {
      return {
        success: false,
        error: `Cannot check in booking with status: ${booking.status}. Only CONFIRMED bookings can be checked in.`,
      }
    }

    // Update booking status to CHECKED_IN
    const checkedInAt = new Date()
    const updatedBooking = await prisma.booking.update({
      where: { id: bookingId },
      data: {
        status: BookingStatus.CHECKED_IN,
      },
    })

    // Send notifications to all admins and super admins
    const notificationResult = await sendCheckInNotifications({
      bookingId: booking.id,
      guestName: booking.user.name,
      roomNumber: roomNumber,
      checkInTime: checkedInAt,
      performedBy: admin.name,
    })

    console.log(`[checkInGuest] Notifications sent: ${notificationResult.notificationsSent}/${notificationResult.totalAdmins}`)

    return {
      success: true,
      message: `Guest ${booking.user.name} checked in successfully. Notifications sent to ${notificationResult.notificationsSent} admin(s).`,
      data: {
        bookingId: updatedBooking.id,
        status: updatedBooking.status,
        checkedInAt,
      },
    }
  } catch (error) {
    console.error('[checkInGuest] Error:', error)
    return {
      success: false,
      error: 'Failed to check in guest',
    }
  }
}

/**
 * Check out a guest
 * 
 * Updates booking status to CHECKED_OUT
 * 
 * @param bookingId - Booking ID
 * @param adminId - Admin performing check-out
 * @returns Response with check-out status
 */
export async function checkOutGuest(
  bookingId: string,
  adminId: string
): Promise<CheckInResponse> {
  try {
    // Verify admin permissions
    const admin = await prisma.user.findFirst({
      where: {
        id: adminId,
        role: {
          name: {
            in: ['ADMIN', 'SUPERADMIN'],
          },
        },
      },
    })

    if (!admin) {
      return {
        success: false,
        error: 'Unauthorized: Admin privileges required',
      }
    }

    // Get booking
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        user: {
          select: {
            name: true,
          },
        },
      },
    })

    if (!booking) {
      return {
        success: false,
        error: 'Booking not found',
      }
    }

    // Check if booking can be checked out
    if (booking.status !== BookingStatus.CHECKED_IN) {
      return {
        success: false,
        error: `Cannot check out booking with status: ${booking.status}. Only CHECKED_IN bookings can be checked out.`,
      }
    }

    // Update booking status to CHECKED_OUT
    const checkedOutAt = new Date()
    const updatedBooking = await prisma.booking.update({
      where: { id: bookingId },
      data: {
        status: BookingStatus.CHECKED_OUT,
      },
    })

    return {
      success: true,
      message: `Guest ${booking.user.name} checked out successfully.`,
      data: {
        bookingId: updatedBooking.id,
        status: updatedBooking.status,
        checkedInAt: checkedOutAt,
      },
    }
  } catch (error) {
    console.error('[checkOutGuest] Error:', error)
    return {
      success: false,
      error: 'Failed to check out guest',
    }
  }
}
