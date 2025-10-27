/**
 * Admin Check-in/Check-out Actions
 * Server actions for manual room check-in, check-out, and offline payment processing
 */

'use server'

import { prisma } from '@/lib/prisma'
import { BookingStatus, PaymentStatus, RoleName } from '@prisma/client'
import { revalidatePath } from 'next/cache'
import { getCurrentUser } from '@/lib/middleware/auth.utils'

// ==========================================
// TYPES
// ==========================================

export interface CheckInPayload {
  bookingId: string
  notes?: string
  actualCheckInTime?: Date
}

export interface CheckOutPayload {
  bookingId: string
  notes?: string
  actualCheckOutTime?: Date
  additionalCharges?: number
  discounts?: number
}

export interface OfflinePaymentPayload {
  bookingId: string
  amount: number
  paymentMethod: 'CASH' | 'CARD' | 'BANK_TRANSFER' | 'CHEQUE' | 'OTHER'
  referenceNumber?: string
  notes?: string
  receivedBy: string
}

export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

// ==========================================
// AUTHORIZATION HELPER
// ==========================================

async function requireAdminAuth() {
  const userContext = await getCurrentUser()
  
  if (!userContext) {
    throw new Error('Unauthorized: Please login')
  }

  const user = await prisma.user.findUnique({
    where: { id: userContext.userId },
    include: { role: true }
  })

  if (!user || (user.role.name !== RoleName.ADMIN && user.role.name !== RoleName.SUPERADMIN)) {
    throw new Error('Unauthorized: Admin or Super Admin access required')
  }

  return user
}

// ==========================================
// CHECK-IN ACTION
// ==========================================

/**
 * Process manual check-in for a booking
 * Only Admin and Super Admin can perform check-in
 */
export async function processCheckIn(
  payload: CheckInPayload
): Promise<ApiResponse> {
  try {
    const admin = await requireAdminAuth()

    // Get booking with details
    const booking = await prisma.booking.findUnique({
      where: { id: payload.bookingId },
      include: {
        user: true,
        roomType: true,
        payments: true
      }
    })

    if (!booking) {
      return {
        success: false,
        error: 'Booking not found'
      }
    }

    // Validate booking status
    if (booking.status === BookingStatus.CANCELLED) {
      return {
        success: false,
        error: 'Cannot check-in: Booking is cancelled'
      }
    }

    // Check if already checked in or out
    if (booking.status === BookingStatus.CONFIRMED) {
      // Already checked out
      return {
        success: false,
        error: 'Cannot check-in: Booking already completed'
      }
    }

    // Validate check-in date
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const startDate = new Date(booking.startDate)
    startDate.setHours(0, 0, 0, 0)

    if (startDate > today) {
      return {
        success: false,
        error: 'Cannot check-in: Check-in date is in the future'
      }
    }

    // Check payment status (optional - can allow check-in with pending payment)
    const totalPaid = booking.payments
      .filter(p => p.status === PaymentStatus.SUCCEEDED)
      .reduce((sum, p) => sum + p.amount, 0)

    const paymentComplete = totalPaid >= booking.totalPrice

    // Update booking status
    const updatedBooking = await prisma.$transaction(async (tx) => {
      // Update booking
      const updated = await tx.booking.update({
        where: { id: payload.bookingId },
        data: {
          status: BookingStatus.CONFIRMED, // Using CONFIRMED as checked-in
          updatedAt: new Date()
        },
        include: {
          user: true,
          roomType: true
        }
      })

      // Create audit log
      await tx.bookingAuditLog.create({
        data: {
          bookingId: payload.bookingId,
          adminId: admin.id,
          action: 'CHECK_IN',
          metadata: JSON.stringify({
            notes: payload.notes,
            actualCheckInTime: payload.actualCheckInTime || new Date(),
            paymentComplete,
            performedBy: admin.name
          })
        }
      })

      return updated
    })

    revalidatePath('/admin/dashboard')
    revalidatePath('/admin/bookings')

    return {
      success: true,
      data: updatedBooking,
      message: 'Check-in processed successfully'
    }
  } catch (error) {
    console.error('Check-in error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to process check-in'
    }
  }
}

// ==========================================
// CHECK-OUT ACTION
// ==========================================

/**
 * Process manual check-out for a booking
 * Only Admin and Super Admin can perform check-out
 */
export async function processCheckOut(
  payload: CheckOutPayload
): Promise<ApiResponse> {
  try {
    const admin = await requireAdminAuth()

    // Get booking with details
    const booking = await prisma.booking.findUnique({
      where: { id: payload.bookingId },
      include: {
        user: true,
        roomType: true,
        payments: true
      }
    })

    if (!booking) {
      return {
        success: false,
        error: 'Booking not found'
      }
    }

    // Validate booking status
    if (booking.status === BookingStatus.CANCELLED) {
      return {
        success: false,
        error: 'Cannot check-out: Booking is cancelled'
      }
    }

    if (booking.status === BookingStatus.PROVISIONAL) {
      return {
        success: false,
        error: 'Cannot check-out: Guest has not checked in yet'
      }
    }

    // Calculate final amount with additional charges/discounts
    let finalAmount = booking.totalPrice
    if (payload.additionalCharges) {
      finalAmount += payload.additionalCharges
    }
    if (payload.discounts) {
      finalAmount -= payload.discounts
    }

    // Check payment status
    const totalPaid = booking.payments
      .filter(p => p.status === PaymentStatus.SUCCEEDED)
      .reduce((sum, p) => sum + p.amount, 0)

    const paymentPending = finalAmount > totalPaid

    // Update booking and restore inventory
    const updatedBooking = await prisma.$transaction(async (tx) => {
      // Update booking to completed (mark with special note in metadata)
      // Note: CONFIRMED status is used for active stays
      // After checkout, we keep CONFIRMED but add checkout timestamp
      const updated = await tx.booking.update({
        where: { id: payload.bookingId },
        data: {
          status: BookingStatus.CONFIRMED, // Remains CONFIRMED (represents completed booking)
          totalPrice: finalAmount,
          updatedAt: new Date()
        },
        include: {
          user: true,
          roomType: true
        }
      })

      // Note: Room inventory was already decremented during booking creation
      // We DO NOT restore inventory here because:
      // 1. The inventory was decremented for the booking period (startDate to endDate)
      // 2. After checkout, those dates have passed
      // 3. Inventory auto-resets for future dates via the daily inventory management
      
      // Create audit log
      await tx.bookingAuditLog.create({
        data: {
          bookingId: payload.bookingId,
          adminId: admin.id,
          action: 'CHECK_OUT',
          metadata: JSON.stringify({
            notes: payload.notes,
            actualCheckOutTime: payload.actualCheckOutTime || new Date(),
            additionalCharges: payload.additionalCharges,
            discounts: payload.discounts,
            finalAmount,
            paymentPending,
            performedBy: admin.name,
            checkOutDate: new Date().toISOString()
          })
        }
      })

      return updated
    })

    revalidatePath('/admin/dashboard')
    revalidatePath('/admin/bookings')

    return {
      success: true,
      data: {
        booking: updatedBooking,
        finalAmount,
        paymentPending
      },
      message: paymentPending 
        ? 'Check-out processed - Payment pending' 
        : 'Check-out processed successfully'
    }
  } catch (error) {
    console.error('Check-out error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to process check-out'
    }
  }
}

// ==========================================
// OFFLINE PAYMENT ACTION
// ==========================================

/**
 * Record offline payment for a booking
 * Supports cash, card, bank transfer, etc.
 */
export async function recordOfflinePayment(
  payload: OfflinePaymentPayload
): Promise<ApiResponse> {
  try {
    const admin = await requireAdminAuth()

    // Get booking with details
    const booking = await prisma.booking.findUnique({
      where: { id: payload.bookingId },
      include: {
        user: true,
        roomType: true,
        payments: true
      }
    })

    if (!booking) {
      return {
        success: false,
        error: 'Booking not found'
      }
    }

    // Validate payment amount
    if (payload.amount <= 0) {
      return {
        success: false,
        error: 'Invalid payment amount'
      }
    }

    // Calculate total paid so far
    const totalPaid = booking.payments
      .filter(p => p.status === PaymentStatus.SUCCEEDED)
      .reduce((sum, p) => sum + p.amount, 0)

    const remainingAmount = booking.totalPrice - totalPaid

    // Allow 10 cents tolerance for floating-point precision issues and rounding
    // This handles cases where check-out adjustments cause small discrepancies
    const tolerance = 10 // cents
    if (payload.amount > remainingAmount + tolerance) {
      return {
        success: false,
        error: `Payment amount $${(payload.amount / 100).toFixed(2)} exceeds remaining balance $${(remainingAmount / 100).toFixed(2)}. Please adjust the payment amount.`
      }
    }

    // If payment is within tolerance but slightly over, adjust to exact remaining amount
    const actualPaymentAmount = Math.min(payload.amount, remainingAmount)

    // Create payment record
    const payment = await prisma.$transaction(async (tx) => {
      // Create payment with actual adjusted amount
      const newPayment = await tx.payment.create({
        data: {
          bookingId: payload.bookingId,
          userId: booking.userId,
          provider: 'offline',
          amount: actualPaymentAmount,
          currency: 'USD',
          status: PaymentStatus.SUCCEEDED,
          paidAt: new Date(),
          metadata: JSON.stringify({
            paymentMethod: payload.paymentMethod,
            referenceNumber: payload.referenceNumber,
            notes: payload.notes,
            receivedBy: payload.receivedBy,
            recordedBy: admin.name,
            recordedAt: new Date(),
            requestedAmount: payload.amount,
            actualAmount: actualPaymentAmount,
            adjusted: payload.amount !== actualPaymentAmount
          })
        }
      })

      // Update booking if fully paid
      const newTotalPaid = totalPaid + actualPaymentAmount
      if (newTotalPaid >= booking.totalPrice && booking.status === BookingStatus.PROVISIONAL) {
        await tx.booking.update({
          where: { id: payload.bookingId },
          data: {
            status: BookingStatus.CONFIRMED
          }
        })
      }

      // Create audit log
      await tx.bookingAuditLog.create({
        data: {
          bookingId: payload.bookingId,
          adminId: admin.id,
          action: 'OFFLINE_PAYMENT',
          metadata: JSON.stringify({
            amount: actualPaymentAmount,
            requestedAmount: payload.amount,
            paymentMethod: payload.paymentMethod,
            referenceNumber: payload.referenceNumber,
            notes: payload.notes,
            receivedBy: payload.receivedBy,
            totalPaidAfter: newTotalPaid,
            remainingAfter: booking.totalPrice - newTotalPaid,
            recordedBy: admin.name
          })
        }
      })

      return newPayment
    })

    revalidatePath('/admin/dashboard')
    revalidatePath('/admin/bookings')

    const wasAdjusted = payload.amount !== actualPaymentAmount
    const successMessage = wasAdjusted
      ? `Payment recorded successfully. Amount adjusted to $${(actualPaymentAmount / 100).toFixed(2)} to match remaining balance.`
      : 'Offline payment recorded successfully'

    return {
      success: true,
      data: {
        payment,
        totalPaid: totalPaid + actualPaymentAmount,
        remaining: booking.totalPrice - (totalPaid + actualPaymentAmount),
        fullyPaid: (totalPaid + actualPaymentAmount) >= booking.totalPrice,
        adjusted: wasAdjusted,
        requestedAmount: payload.amount,
        actualAmount: actualPaymentAmount
      },
      message: successMessage
    }
  } catch (error) {
    console.error('Offline payment error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to record payment'
    }
  }
}

// ==========================================
// GET BOOKING DETAILS ACTION
// ==========================================

/**
 * Get detailed booking information for admin operations
 */
export async function getBookingDetails(
  bookingId: string
): Promise<ApiResponse> {
  try {
    await requireAdminAuth()

    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            vipStatus: true
          }
        },
        roomType: true,
        payments: {
          orderBy: {
            createdAt: 'desc'
          }
        },
        auditLogs: {
          include: {
            admin: {
              select: {
                name: true,
                email: true
              }
            }
          },
          orderBy: {
            createdAt: 'desc'
          }
        }
      }
    })

    if (!booking) {
      return {
        success: false,
        error: 'Booking not found'
      }
    }

    // Calculate payment summary
    const totalPaid = booking.payments
      .filter(p => p.status === PaymentStatus.SUCCEEDED)
      .reduce((sum, p) => sum + p.amount, 0)

    const paymentSummary = {
      totalAmount: booking.totalPrice,
      totalPaid,
      remaining: booking.totalPrice - totalPaid,
      fullyPaid: totalPaid >= booking.totalPrice,
      payments: booking.payments
    }

    return {
      success: true,
      data: {
        ...booking,
        paymentSummary
      }
    }
  } catch (error) {
    console.error('Get booking details error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch booking details'
    }
  }
}

// ==========================================
// UPDATE BOOKING STATUS ACTION
// ==========================================

/**
 * Update booking status manually
 * For cancellations, special cases, etc.
 */
export async function updateBookingStatus(
  bookingId: string,
  status: BookingStatus,
  notes?: string
): Promise<ApiResponse> {
  try {
    const admin = await requireAdminAuth()

    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        roomType: true
      }
    })

    if (!booking) {
      return {
        success: false,
        error: 'Booking not found'
      }
    }

    // Update booking and handle inventory
    const updatedBooking = await prisma.$transaction(async (tx) => {
      // Update booking status
      const updated = await tx.booking.update({
        where: { id: bookingId },
        data: {
          status,
          updatedAt: new Date()
        },
        include: {
          user: true,
          roomType: true
        }
      })

      // If cancelling, restore inventory
      if (status === BookingStatus.CANCELLED && booking.status !== BookingStatus.CANCELLED) {
        const startDate = new Date(booking.startDate)
        const endDate = new Date(booking.endDate)
        const dates = []
        
        for (let d = new Date(startDate); d < endDate; d.setDate(d.getDate() + 1)) {
          dates.push(new Date(d))
        }

        for (const date of dates) {
          await tx.roomInventory.updateMany({
            where: {
              roomTypeId: booking.roomTypeId,
              date: date
            },
            data: {
              availableRooms: {
                increment: booking.roomsBooked
              }
            }
          })
        }
      }

      // Create audit log
      await tx.bookingAuditLog.create({
        data: {
          bookingId,
          adminId: admin.id,
          action: 'STATUS_UPDATE',
          metadata: JSON.stringify({
            oldStatus: booking.status,
            newStatus: status,
            notes,
            updatedBy: admin.name,
            updatedAt: new Date()
          })
        }
      })

      return updated
    })

    revalidatePath('/admin/dashboard')
    revalidatePath('/admin/bookings')

    return {
      success: true,
      data: updatedBooking,
      message: 'Booking status updated successfully'
    }
  } catch (error) {
    console.error('Update booking status error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update booking status'
    }
  }
}
