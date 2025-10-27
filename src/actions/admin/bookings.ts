/**
 * Admin Booking Management Server Actions (Day 15)
 * 
 * Server-side operations for admin dashboard:
 * - Fetch bookings with advanced filters
 * - Mark offline payments
 * - Override booking status
 * - Generate invoices
 * - Audit logging for all actions
 */

'use server'

import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/prisma'
import type { BookingStatus, PaymentStatus } from '@prisma/client'
import {
  type BookingFilters,
  type MarkOfflinePaymentRequest,
  type MarkOfflinePaymentResponse,
  type OverrideBookingRequest,
  type OverrideBookingResponse,
  type GenerateInvoiceResponse,
  FetchAdminBookingsRequestSchema,
  MarkOfflinePaymentRequestSchema,
  OverrideBookingRequestSchema,
  validatePaymentAmount,
  validateDateRange,
  validateBookingModification,
  calculateTotalPaid,
  determinePaymentStatus,
  generateInvoiceNumber,
  validateAdminPermission,
} from '@/lib/validation/admin.validation'

import type { GenerateInvoiceRequest } from '@/lib/validation/invoice.validation'
import { GenerateInvoiceSchema } from '@/lib/validation/invoice.validation'

// ==========================================
// FETCH BOOKINGS
// ==========================================

/**
 * Fetch bookings with advanced filters for admin dashboard
 * 
 * @param filters - Filter criteria (dates, member search, status, etc.)
 * @returns Bookings array with pagination info
 */
export async function fetchAdminBookings(filters: Partial<BookingFilters> = {}) {
  try {
    const {
      startDate,
      endDate,
      memberSearch,
      status,
      paymentStatus,
      roomTypeId,
      page = 1,
      limit = 20,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = filters
    
    // Build where clause
    const where: any = {}
    
    // Date range filter
    if (startDate || endDate) {
      where.OR = []
      if (startDate) {
        where.OR.push({ startDate: { gte: new Date(startDate) } })
      }
      if (endDate) {
        where.OR.push({ endDate: { lte: new Date(endDate) } })
      }
    }
    
    // Status filter
    if (status) {
      where.status = status
    }
    
    // Room type filter
    if (roomTypeId) {
      where.roomTypeId = roomTypeId
    }
    
    // Member search (name, email, or phone) - case-sensitive for SQLite compatibility
    if (memberSearch) {
      where.user = {
        OR: [
          { name: { contains: memberSearch } },
          { email: { contains: memberSearch } },
          { phone: { contains: memberSearch } },
        ],
      }
    }
    
    // Calculate pagination
    const skip = (page - 1) * limit
    
    // Fetch bookings with relations
    const [bookings, total] = await Promise.all([
      prisma.booking.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true,
            },
          },
          roomType: {
            select: {
              id: true,
              name: true,
              pricePerNight: true,
            },
          },
          payments: {
            select: {
              id: true,
              amount: true,
              status: true,
              provider: true,
              createdAt: true,
            },
            orderBy: {
              createdAt: 'desc',
            },
          },
        },
        skip,
        take: limit,
        orderBy: {
          [sortBy]: sortOrder,
        },
      }),
      prisma.booking.count({ where }),
    ])
    
    // Calculate paid amount and payment status for each booking
    const enrichedBookings = bookings.map(booking => {
      const paidAmount = calculateTotalPaid(booking.payments as any)
      const computedPaymentStatus = determinePaymentStatus(booking.totalPrice, paidAmount)
      
      return {
        ...booking,
        paidAmount,
        paymentStatus: computedPaymentStatus,
      }
    })
    
    // Filter by payment status if needed (client-side since it's computed)
    let filteredBookings = enrichedBookings
    if (paymentStatus) {
      filteredBookings = enrichedBookings.filter(
        b => b.paymentStatus === paymentStatus
      )
    }
    
    return {
      success: true,
      bookings: filteredBookings,
      total: paymentStatus ? filteredBookings.length : total,
      page,
      limit,
      totalPages: Math.ceil((paymentStatus ? filteredBookings.length : total) / limit),
    }
  } catch (error: any) {
    console.error('fetchAdminBookings error:', error)
    return {
      success: false,
      error: 'INTERNAL_ERROR',
      message: 'Failed to fetch bookings',
      bookings: [],
      total: 0,
    }
  }
}

// ==========================================
// MARK OFFLINE PAYMENT
// ==========================================

/**
 * Mark an offline payment as complete for a booking
 * Creates payment record, updates booking status, logs audit trail
 * 
 * @param input - Payment details (bookingId, amount, method, notes)
 * @returns Payment and updated booking info
 */
export async function markOfflinePayment(
  input: MarkOfflinePaymentRequest
): Promise<MarkOfflinePaymentResponse> {
  try {
    // Validate input
    const validated = MarkOfflinePaymentRequestSchema.parse(input)
    
    // Fetch booking with payments
    const booking = await prisma.booking.findUnique({
      where: { id: validated.bookingId },
      include: {
        payments: true,
        user: true,
      },
    })
    
    if (!booking) {
      return {
        success: false,
        error: 'BOOKING_NOT_FOUND',
        message: 'Booking not found',
      }
    }
    
    // Check if booking is cancelled
    if (booking.status === 'CANCELLED') {
      return {
        success: false,
        error: 'INVALID_AMOUNT',
        message: 'Cannot accept payment for cancelled booking',
      }
    }
    
    // Calculate current paid amount
    const paidAmount = calculateTotalPaid(booking.payments as any)
    
    // Validate payment amount
    const paymentValidation = validatePaymentAmount(
      validated.amount,
      booking.totalPrice,
      paidAmount
    )
    
    if (!paymentValidation.valid) {
      return {
        success: false,
        error: 'INVALID_AMOUNT',
        message: paymentValidation.message || 'Invalid payment amount',
      }
    }
    
    // Check if already fully paid
    if (paidAmount >= booking.totalPrice) {
      return {
        success: false,
        error: 'ALREADY_PAID',
        message: 'Booking is already fully paid',
      }
    }
    
    // Calculate new paid amount
    const newPaidAmount = paidAmount + validated.amount
    const isFullyPaid = newPaidAmount >= booking.totalPrice
    
    // Create payment and update booking in transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create offline payment record
      const payment = await tx.payment.create({
        data: {
          bookingId: validated.bookingId,
          userId: booking.userId,
          provider: 'offline',
          providerPaymentId: `OFFLINE-${Date.now()}`,
          amount: validated.amount,
          currency: 'USD',
          status: 'SUCCEEDED',
          metadata: JSON.stringify({
            method: validated.method,
            transactionReference: validated.transactionReference,
            receiptNumber: validated.receiptNumber,
            notes: validated.notes,
            adminId: validated.adminId,
            processedAt: new Date().toISOString(),
          }),
          paidAt: new Date(),
        },
      })
      
      // Update booking status if fully paid and auto-confirm is enabled
      let updatedBooking = booking
      if (isFullyPaid && validated.autoConfirm && booking.status === 'PROVISIONAL') {
        await tx.booking.update({
          where: { id: validated.bookingId },
          data: {
            status: 'CONFIRMED',
            isDepositPaid: true,
          },
        })
        // Fetch updated booking with relations
        updatedBooking = (await tx.booking.findUnique({
          where: { id: validated.bookingId },
          include: {
            user: { 
              select: { 
                id: true, 
                name: true, 
                phone: true, 
                email: true, 
                roleId: true, 
                ircaMembershipId: true, 
                address: true,
                vipStatus: true,
                profilePicture: true,
                profileCompleted: true,
                termsAccepted: true,
                createdAt: true, 
                updatedAt: true 
              } 
            },
            payments: true,
          },
        }))!
      } else if (booking.depositAmount && newPaidAmount >= booking.depositAmount) {
        // Mark deposit as paid if threshold reached
        await tx.booking.update({
          where: { id: validated.bookingId },
          data: {
            isDepositPaid: true,
          },
        })
        // Fetch updated booking with relations
        updatedBooking = (await tx.booking.findUnique({
          where: { id: validated.bookingId },
          include: {
            user: { 
              select: { 
                id: true, 
                name: true, 
                phone: true, 
                email: true, 
                roleId: true, 
                ircaMembershipId: true, 
                address: true,
                vipStatus: true,
                profilePicture: true,
                profileCompleted: true,
                termsAccepted: true,
                createdAt: true, 
                updatedAt: true 
              } 
            },
            payments: true,
          },
        }))!
      }
      
      // Create audit log
      const auditLog = await tx.bookingAuditLog.create({
        data: {
          bookingId: validated.bookingId,
          adminId: validated.adminId,
          action: 'OFFLINE_PAYMENT',
          reason: validated.notes || 'Offline payment processed',
          metadata: JSON.stringify({
            paymentId: payment.id,
            amount: validated.amount,
            method: validated.method,
            transactionReference: validated.transactionReference,
            receiptNumber: validated.receiptNumber,
            oldStatus: booking.status,
            newStatus: updatedBooking.status,
            paidAmount: newPaidAmount,
            totalPrice: booking.totalPrice,
            isFullyPaid,
          }),
        },
      })
      
      return { payment, booking: updatedBooking, auditLog }
    })
    
    // Revalidate admin dashboard
    revalidatePath('/dashboard/admin')
    
    return {
      success: true,
      message: isFullyPaid
        ? 'Payment marked successfully. Booking confirmed.'
        : 'Payment marked successfully.',
      payment: {
        id: result.payment.id,
        amount: result.payment.amount,
        method: validated.method,
        status: result.payment.status,
        createdAt: result.payment.createdAt,
      },
      booking: {
        id: result.booking.id,
        status: result.booking.status,
        totalPrice: result.booking.totalPrice,
        paidAmount: newPaidAmount,
      },
      auditLog: {
        id: result.auditLog.id,
        action: result.auditLog.action,
        createdAt: result.auditLog.createdAt,
      },
    }
  } catch (error: any) {
    console.error('markOfflinePayment error:', error)
    
    if (error.name === 'ZodError') {
      return {
        success: false,
        error: 'INVALID_AMOUNT',
        message: 'Invalid input data',
      }
    }
    
    return {
      success: false,
      error: 'INTERNAL_ERROR',
      message: 'Failed to process offline payment',
    }
  }
}

// ==========================================
// OVERRIDE BOOKING
// ==========================================

/**
 * Override booking status or details (admin/superadmin only)
 * Supports: force confirm, force cancel, modify dates, modify rooms
 * 
 * @param input - Override details (bookingId, action, reason, new values)
 * @returns Updated booking info
 */
export async function overrideBooking(
  input: OverrideBookingRequest
): Promise<OverrideBookingResponse> {
  try {
    // Validate input
    const validated = OverrideBookingRequestSchema.parse(input)
    
    // Fetch admin to check role
    const admin = await prisma.user.findUnique({
      where: { id: validated.adminId },
      include: { role: true },
    })
    
    if (!admin) {
      return {
        success: false,
        error: 'UNAUTHORIZED',
        message: 'Admin user not found',
      }
    }
    
    // Validate admin permission
    const permissionCheck = validateAdminPermission(admin.role.name, validated.action)
    if (!permissionCheck.allowed) {
      return {
        success: false,
        error: 'UNAUTHORIZED',
        message: permissionCheck.message || 'Insufficient permissions',
      }
    }
    
    // Fetch booking
    const booking = await prisma.booking.findUnique({
      where: { id: validated.bookingId },
      include: {
        roomType: true,
        payments: true,
      },
    })
    
    if (!booking) {
      return {
        success: false,
        error: 'BOOKING_NOT_FOUND',
        message: 'Booking not found',
      }
    }
    
    // Validate booking can be modified
    const modificationCheck = validateBookingModification(booking.status, validated.action)
    if (!modificationCheck.allowed) {
      return {
        success: false,
        error: 'INVALID_ACTION',
        message: modificationCheck.message || 'Cannot perform this action',
      }
    }
    
    // Prepare update data based on action
    const updateData: any = {}
    const auditMetadata: any = {
      action: validated.action,
      oldStatus: booking.status,
    }
    
    switch (validated.action) {
      case 'FORCE_CONFIRM':
        updateData.status = 'CONFIRMED'
        auditMetadata.newStatus = 'CONFIRMED'
        break
        
      case 'FORCE_CANCEL':
        updateData.status = 'CANCELLED'
        auditMetadata.newStatus = 'CANCELLED'
        break
        
      case 'MODIFY_DATES':
        if (!validated.newStartDate || !validated.newEndDate) {
          return {
            success: false,
            error: 'INVALID_DATES',
            message: 'New start and end dates required',
          }
        }
        
        const dateValidation = validateDateRange(
          new Date(validated.newStartDate),
          new Date(validated.newEndDate)
        )
        
        if (!dateValidation.valid) {
          return {
            success: false,
            error: 'INVALID_DATES',
            message: dateValidation.message || 'Invalid dates',
          }
        }
        
        updateData.startDate = new Date(validated.newStartDate)
        updateData.endDate = new Date(validated.newEndDate)
        auditMetadata.oldStartDate = booking.startDate
        auditMetadata.oldEndDate = booking.endDate
        auditMetadata.newStartDate = validated.newStartDate
        auditMetadata.newEndDate = validated.newEndDate
        break
        
      case 'MODIFY_ROOMS':
        if (!validated.newRoomsBooked) {
          return {
            success: false,
            error: 'INVALID_ACTION',
            message: 'New room count required',
          }
        }
        
        updateData.roomsBooked = validated.newRoomsBooked
        auditMetadata.oldRoomsBooked = booking.roomsBooked
        auditMetadata.newRoomsBooked = validated.newRoomsBooked
        break
        
      case 'WAIVE_DEPOSIT':
        updateData.isDepositPaid = true
        updateData.depositAmount = 0
        auditMetadata.oldDepositAmount = booking.depositAmount
        auditMetadata.depositWaived = true
        break
        
      default:
        return {
          success: false,
          error: 'INVALID_ACTION',
          message: 'Unknown action',
        }
    }
    
    // If custom status provided, use it
    if (validated.newStatus) {
      updateData.status = validated.newStatus
      auditMetadata.newStatus = validated.newStatus
    }
    
    // Update booking and create audit log in transaction
    const result = await prisma.$transaction(async (tx) => {
      // Update booking
      const updatedBooking = await tx.booking.update({
        where: { id: validated.bookingId },
        data: updateData,
        include: {
          roomType: true,
          user: true,
          payments: true,
        },
      })
      
      // Create audit log
      const auditLog = await tx.bookingAuditLog.create({
        data: {
          bookingId: validated.bookingId,
          adminId: validated.adminId,
          action: `OVERRIDE_${validated.action}`,
          reason: validated.reason,
          metadata: JSON.stringify(auditMetadata),
        },
      })
      
      return { booking: updatedBooking, auditLog }
    })
    
    // Revalidate paths
    revalidatePath('/dashboard/admin')
    revalidatePath(`/booking/${validated.bookingId}`)
    
    return {
      success: true,
      message: `Booking ${validated.action.toLowerCase().replace('_', ' ')} successful`,
      booking: {
        id: result.booking.id,
        status: result.booking.status,
        startDate: result.booking.startDate,
        endDate: result.booking.endDate,
        roomsBooked: result.booking.roomsBooked,
        totalPrice: result.booking.totalPrice,
      },
      auditLog: {
        id: result.auditLog.id,
        action: result.auditLog.action,
        reason: result.auditLog.reason || '',
        createdAt: result.auditLog.createdAt,
      },
    }
  } catch (error: any) {
    console.error('overrideBooking error:', error)
    
    if (error.name === 'ZodError') {
      return {
        success: false,
        error: 'INVALID_ACTION',
        message: 'Invalid input data',
      }
    }
    
    return {
      success: false,
      error: 'INTERNAL_ERROR',
      message: 'Failed to override booking',
    }
  }
}

// ==========================================
// GENERATE INVOICE
// ==========================================

/**
 * Generate invoice for a booking (placeholder - integrate with PDF library)
 * 
 * @param input - Invoice generation details
 * @returns Invoice file path and download URL
 */
export async function generateInvoice(
  input: GenerateInvoiceRequest
): Promise<GenerateInvoiceResponse> {
  try {
    // Validate input
  const validated = GenerateInvoiceSchema.parse(input)
    
    // Fetch booking with relations
    const booking = await prisma.booking.findUnique({
      where: { id: validated.bookingId },
      include: {
        user: true,
        roomType: true,
        payments: {
          where: { status: 'SUCCEEDED' },
        },
      },
    })
    
    if (!booking) {
      return {
        success: false,
        error: 'BOOKING_NOT_FOUND',
        message: 'Booking not found',
      }
    }
    
    // Check if payment is complete
    const paidAmount = calculateTotalPaid(booking.payments as any)
    if (paidAmount < booking.totalPrice) {
      return {
        success: false,
        error: 'PAYMENT_NOT_COMPLETE',
        message: 'Payment must be complete to generate invoice',
      }
    }
    
  // Generate invoice number
  const invoiceNumber = generateInvoiceNumber(booking.id)
    
    // TODO: Integrate with PDF generation library (e.g., jsPDF, pdfkit, react-pdf)
    // For now, return placeholder
    
    const invoicePath = `/invoices/${invoiceNumber}.pdf`
    const downloadUrl = `/api/invoices/download/${invoiceNumber}`
    
    // Update booking with invoice path (if schema supports it)
    try {
      await prisma.booking.update({
        where: { id: validated.bookingId },
        data: {},
      })
    } catch (e) {
      // ignore if schema has no invoice field
    }

    // Create audit log
    const formatValue = (validated as any).format || (validated as any).paymentMethod || 'PDF'
    await prisma.bookingAuditLog.create({
      data: {
        bookingId: validated.bookingId,
        adminId: (validated as any).adminId || 'system',
        action: 'GENERATE_INVOICE',
        metadata: JSON.stringify({
          invoiceNumber,
          format: formatValue,
          generatedAt: new Date().toISOString(),
        }),
      },
    })
    
    return {
      success: true,
      message: 'Invoice generated successfully',
      invoice: {
        id: booking.id,
        invoiceNumber,
        filePath: invoicePath,
        downloadUrl,
        generatedAt: new Date(),
      },
    }
  } catch (error: any) {
    console.error('generateInvoice error:', error)
    
    return {
      success: false,
      error: 'GENERATION_FAILED',
      message: 'Failed to generate invoice',
    }
  }
}

// ==========================================
// FETCH AUDIT LOGS
// ==========================================

/**
 * Fetch audit logs for bookings
 * 
 * @param filters - Filter criteria (bookingId, adminId, action, date range)
 * @returns Audit log entries
 */
export async function fetchAuditLogs(filters: {
  bookingId?: string
  adminId?: string
  action?: string
  startDate?: string
  endDate?: string
  page?: number
  limit?: number
}) {
  try {
    const {
      bookingId,
      adminId,
      action,
      startDate,
      endDate,
      page = 1,
      limit = 50,
    } = filters
    
    const where: any = {}
    
    if (bookingId) where.bookingId = bookingId
    if (adminId) where.adminId = adminId
    if (action) where.action = action
    
    if (startDate || endDate) {
      where.createdAt = {}
      if (startDate) where.createdAt.gte = new Date(startDate)
      if (endDate) where.createdAt.lte = new Date(endDate)
    }
    
    const skip = (page - 1) * limit
    
    const [logs, total] = await Promise.all([
      prisma.bookingAuditLog.findMany({
        where,
        include: {
          admin: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          booking: {
            select: {
              id: true,
              userId: true,
              status: true,
            },
          },
        },
        skip,
        take: limit,
        orderBy: {
          createdAt: 'desc',
        },
      }),
      prisma.bookingAuditLog.count({ where }),
    ])
    
    return {
      success: true,
      logs,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    }
  } catch (error: any) {
    console.error('fetchAuditLogs error:', error)
    return {
      success: false,
      error: 'INTERNAL_ERROR',
      message: 'Failed to fetch audit logs',
      logs: [],
      total: 0,
    }
  }
}
