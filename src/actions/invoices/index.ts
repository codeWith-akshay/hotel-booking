/**
 * Invoice Server Actions Module
 * Day 18: Automatic Invoice & Receipt Generation System
 * 
 * Provides server-side actions for invoice management with RBAC enforcement:
 * - Automatic invoice generation on booking confirmation
 * - Manual invoice generation for offline payments (Admin only)
 * - Invoice retrieval with authorization
 * - PDF download with RBAC checks
 * - Invoice listing and statistics
 * 
 * All functions include proper error handling, logging, and validation.
 * 
 * @module invoices
 */

'use server';

import { prisma } from '@/lib/prisma';
import { PaymentStatus, RoleName } from '@prisma/client';
import {
  GenerateInvoiceSchema,
  GetInvoiceByBookingSchema,
  GetInvoiceByIdSchema,
  DownloadInvoiceSchema,
  ListInvoicesSchema,
  UpdateInvoiceSchema,
  validateInvoiceEligibility,
  type GenerateInvoiceRequest,
  type GetInvoiceByBookingRequest,
  type GetInvoiceByIdRequest,
  type DownloadInvoiceRequest,
  type ListInvoicesQuery,
  type UpdateInvoiceRequest,
} from '@/lib/validation/invoice.validation';
import {
  generateInvoiceNumber,
  formatCurrency,
  getInvoicePath,
  type InvoiceData,
} from '@/lib/utils/invoiceUtils';
import { generateInvoicePDF } from '@/lib/utils/pdfGenerator';
import { z } from 'zod';

/**
 * Response type for server actions
 */
type ActionResponse<T = unknown> = {
  success: boolean;
  data?: T;
  error?: string;
};

/**
 * Verify user authentication and get user details
 * Used as a helper for all RBAC checks
 */
async function getCurrentUser(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      role: true,
    },
  });

  if (!user) {
    throw new Error('User not found or not authenticated');
  }

  return user;
}

/**
 * Verify user has required role(s)
 * Throws error if user doesn't have permission
 */
async function verifyRole(userId: string, allowedRoles: RoleName[]) {
  const user = await getCurrentUser(userId);

  if (!allowedRoles.includes(user.role.name)) {
    throw new Error(`Unauthorized: Requires ${allowedRoles.join(' or ')} role`);
  }

  return user;
}

/**
 * Generates an invoice for a booking
 * Automatically triggered on booking confirmation or manual for offline payments
 * 
 * Flow:
 * 1. Validate request and check eligibility
 * 2. Fetch booking and related data
 * 3. Generate unique invoice number
 * 4. Create PDF invoice
 * 5. Save invoice to database
 * 6. Return invoice details
 * 
 * @param request - Invoice generation request
 * @returns ActionResponse with invoice data
 */
export async function generateInvoice(
  request: GenerateInvoiceRequest
): Promise<ActionResponse> {
  try {
    // Validate input
    const validated = GenerateInvoiceSchema.parse(request);

    // Fetch booking with related data
    const booking = await prisma.booking.findUnique({
      where: { id: validated.bookingId },
      include: {
        user: true,
        roomType: true,
        payments: {
          where: { status: 'SUCCEEDED' },
          orderBy: { paidAt: 'desc' },
          take: 1,
        },
        invoice: true, // Check if invoice already exists
      },
    });

    if (!booking) {
      return {
        success: false,
        error: 'Booking not found',
      };
    }

    // Check if invoice already exists
    if (booking.invoice) {
      return {
        success: true,
        data: booking.invoice,
      };
    }

    // Validate booking status and payment status
    const payment = booking.payments[0];
    if (!payment) {
      return {
        success: false,
        error: 'No successful payment found for this booking',
      };
    }

    const eligibility = validateInvoiceEligibility(booking.status, payment.status);
    if (!eligibility.valid) {
      return {
        success: false,
        error: eligibility.error,
      };
    }

    // Generate unique invoice number
    const invoiceNumber = await generateInvoiceNumber();

    // Calculate number of nights
    const checkInDate = new Date(booking.startDate);
    const checkOutDate = new Date(booking.endDate);
    const numberOfNights = Math.ceil(
      (checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 60 * 60 * 24)
    );

    // Prepare invoice data for PDF generation
    const invoiceData: InvoiceData = {
      invoiceNumber,
      issuedAt: new Date(),
      bookingId: booking.id,
      userId: booking.userId,
      userName: booking.user.name,
      userEmail: booking.user.email || undefined,
      userPhone: booking.user.phone,
      roomTypeName: booking.roomType.name,
      checkInDate,
      checkOutDate,
      numberOfNights,
      roomsBooked: booking.roomsBooked,
      pricePerNight: booking.roomType.pricePerNight,
      totalAmount: booking.totalPrice,
      paymentMethod: validated.paymentMethod,
      paymentStatus: payment.status,
      currency: payment.currency,
    };

    // Generate PDF invoice
    let pdfPath: string | null = null;
    try {
      const filePath = await generateInvoicePDF(invoiceData);
      // Convert absolute path to relative URL path for serving
      pdfPath = getInvoicePath(invoiceNumber);
    } catch (pdfError) {
      console.error('Error generating PDF:', pdfError);
      // Continue without PDF - can be regenerated later
    }

    // Create invoice record in database
    const invoice = await prisma.invoice.create({
      data: {
        bookingId: booking.id,
        userId: booking.userId,
        amount: booking.totalPrice,
        paymentMethod: validated.paymentMethod,
        paymentStatus: payment.status,
        invoiceNumber,
        pdfUrl: pdfPath,
        currency: payment.currency,
        issuedAt: new Date(),
      },
      include: {
        booking: {
          include: {
            roomType: true,
          },
        },
        user: true,
      },
    });

    return {
      success: true,
      data: invoice,
    };
  } catch (error) {
    console.error('Error in generateInvoice:', error);

    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: `Validation error: ${error.issues.map((e: z.ZodIssue) => e.message).join(', ')}`,
      };
    }

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to generate invoice',
    };
  }
}

/**
 * Triggers invoice generation automatically on booking confirmation
 * Called from booking confirmation workflow (payment success or admin offline payment)
 * 
 * @param bookingId - ID of the confirmed booking
 * @param paymentMethod - Payment method used ('online', 'offline', etc.)
 * @returns ActionResponse with invoice data
 */
export async function triggerInvoiceOnBookingConfirmation(
  bookingId: string,
  paymentMethod: 'online' | 'offline' | 'stripe' | 'razorpay' | 'cash' | 'bank_transfer' = 'online'
): Promise<ActionResponse> {
  try {
    // Verify booking exists and is confirmed
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        invoice: true,
      },
    });

    if (!booking) {
      return {
        success: false,
        error: 'Booking not found',
      };
    }

    // Skip if invoice already exists
    if (booking.invoice) {
      return {
        success: true,
        data: booking.invoice,
      };
    }

    // Generate invoice
    return await generateInvoice({
      bookingId,
      paymentMethod,
    });
  } catch (error) {
    console.error('Error in triggerInvoiceOnBookingConfirmation:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to trigger invoice generation',
    };
  }
}

/**
 * Retrieves invoice details by booking ID
 * Includes authorization check - users can only view their own invoices
 * Admins and SuperAdmins can view all invoices
 * 
 * @param request - Get invoice request with bookingId and userId for auth
 * @returns ActionResponse with invoice data
 */
export async function getInvoiceByBookingId(
  request: GetInvoiceByBookingRequest & { userId: string }
): Promise<ActionResponse> {
  try {
    // Validate input
    const validated = GetInvoiceByBookingSchema.parse(request);

    // Get current user for authorization
    const user = await getCurrentUser(request.userId);

    // Fetch invoice
    const invoice = await prisma.invoice.findUnique({
      where: { bookingId: validated.bookingId },
      include: {
        booking: {
          include: {
            roomType: true,
          },
        },
        user: true,
      },
    });

    if (!invoice) {
      return {
        success: false,
        error: 'Invoice not found',
      };
    }

    // Authorization check: user must own the invoice or be admin/superadmin
    const isOwner = invoice.userId === user.id;
    const isAdmin = ['ADMIN', 'SUPERADMIN'].includes(user.role.name);

    if (!isOwner && !isAdmin) {
      return {
        success: false,
        error: 'Unauthorized: You do not have permission to view this invoice',
      };
    }

    return {
      success: true,
      data: invoice,
    };
  } catch (error) {
    console.error('Error in getInvoiceByBookingId:', error);

    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: `Validation error: ${error.issues.map((e: z.ZodIssue) => e.message).join(', ')}`,
      };
    }

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to retrieve invoice',
    };
  }
}

/**
 * Retrieves invoice details by invoice ID
 * Includes authorization check
 * 
 * @param request - Get invoice request with invoiceId and userId for auth
 * @returns ActionResponse with invoice data
 */
export async function getInvoiceById(
  request: GetInvoiceByIdRequest & { userId: string }
): Promise<ActionResponse> {
  try {
    // Validate input
    const validated = GetInvoiceByIdSchema.parse(request);

    // Get current user for authorization
    const user = await getCurrentUser(request.userId);

    // Fetch invoice
    const invoice = await prisma.invoice.findUnique({
      where: { id: validated.invoiceId },
      include: {
        booking: {
          include: {
            roomType: true,
          },
        },
        user: true,
      },
    });

    if (!invoice) {
      return {
        success: false,
        error: 'Invoice not found',
      };
    }

    // Authorization check
    const isOwner = invoice.userId === user.id;
    const isAdmin = ['ADMIN', 'SUPERADMIN'].includes(user.role.name);

    if (!isOwner && !isAdmin) {
      return {
        success: false,
        error: 'Unauthorized: You do not have permission to view this invoice',
      };
    }

    return {
      success: true,
      data: invoice,
    };
  } catch (error) {
    console.error('Error in getInvoiceById:', error);

    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: `Validation error: ${error.issues.map((e: z.ZodIssue) => e.message).join(', ')}`,
      };
    }

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to retrieve invoice',
    };
  }
}

/**
 * Downloads invoice PDF with authorization
 * Returns the PDF URL if authorized
 * 
 * @param request - Download request with invoiceId and userId
 * @returns ActionResponse with PDF URL
 */
export async function downloadInvoice(
  request: DownloadInvoiceRequest
): Promise<ActionResponse> {
  try {
    // Validate input
    const validated = DownloadInvoiceSchema.parse(request);

    // Get invoice with authorization check
    const invoiceResponse = await getInvoiceById({
      invoiceId: validated.invoiceId,
      userId: validated.userId,
    });

    if (!invoiceResponse.success || !invoiceResponse.data) {
      return invoiceResponse;
    }

    const invoice = invoiceResponse.data as any;

    // Check if PDF exists
    if (!invoice.pdfUrl) {
      return {
        success: false,
        error: 'PDF not available for this invoice. Please contact support.',
      };
    }

    return {
      success: true,
      data: {
        pdfUrl: invoice.pdfUrl,
        invoiceNumber: invoice.invoiceNumber,
      },
    };
  } catch (error) {
    console.error('Error in downloadInvoice:', error);

    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: `Validation error: ${error.issues.map((e: z.ZodIssue) => e.message).join(', ')}`,
      };
    }

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to download invoice',
    };
  }
}

/**
 * Lists invoices with filtering and pagination
 * Members see only their invoices
 * Admins/SuperAdmins see all invoices (with optional user filter)
 * 
 * @param query - List invoices query with filters and pagination
 * @param userId - Current user ID for authorization
 * @returns ActionResponse with paginated invoice list
 */
export async function listInvoices(
  query: ListInvoicesQuery,
  userId: string
): Promise<ActionResponse> {
  try {
    // Validate input
    const validated = ListInvoicesSchema.parse(query);

    // Get current user for authorization
    const user = await getCurrentUser(userId);

    const isAdmin = ['ADMIN', 'SUPERADMIN'].includes(user.role.name);

    // Build where clause
    const where: any = {};

    // Members can only see their own invoices
    if (!isAdmin) {
      where.userId = user.id;
    } else if (validated.userId) {
      // Admins can filter by specific user
      where.userId = validated.userId;
    }

    if (validated.paymentStatus) {
      where.paymentStatus = validated.paymentStatus;
    }

    if (validated.startDate || validated.endDate) {
      where.issuedAt = {};
      if (validated.startDate) {
        where.issuedAt.gte = new Date(validated.startDate);
      }
      if (validated.endDate) {
        where.issuedAt.lte = new Date(validated.endDate);
      }
    }

    // Calculate pagination
    const skip = (validated.page - 1) * validated.limit;

    // Fetch invoices
    const [invoices, total] = await Promise.all([
      prisma.invoice.findMany({
        where,
        include: {
          booking: {
            include: {
              roomType: true,
            },
          },
          user: true,
        },
        orderBy: {
          [validated.sortBy]: validated.sortOrder,
        },
        skip,
        take: validated.limit,
      }),
      prisma.invoice.count({ where }),
    ]);

    return {
      success: true,
      data: {
        invoices,
        pagination: {
          total,
          page: validated.page,
          limit: validated.limit,
          totalPages: Math.ceil(total / validated.limit),
        },
      },
    };
  } catch (error) {
    console.error('Error in listInvoices:', error);

    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: `Validation error: ${error.issues.map((e: z.ZodIssue) => e.message).join(', ')}`,
      };
    }

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to list invoices',
    };
  }
}

/**
 * Updates invoice details (Admin/SuperAdmin only)
 * Limited fields can be updated for audit compliance
 * Used for status changes like refunds
 * 
 * @param request - Update invoice request
 * @returns ActionResponse with updated invoice
 */
export async function updateInvoice(
  request: UpdateInvoiceRequest
): Promise<ActionResponse> {
  try {
    // Validate input
    const validated = UpdateInvoiceSchema.parse(request);

    // Verify admin role
    await verifyRole(validated.adminId, ['ADMIN', 'SUPERADMIN']);

    // Fetch invoice
    const invoice = await prisma.invoice.findUnique({
      where: { id: validated.invoiceId },
    });

    if (!invoice) {
      return {
        success: false,
        error: 'Invoice not found',
      };
    }

    // Update invoice
    const updatedInvoice = await prisma.invoice.update({
      where: { id: validated.invoiceId },
      data: {
        ...(validated.paymentStatus && { paymentStatus: validated.paymentStatus }),
        updatedAt: new Date(),
      },
      include: {
        booking: {
          include: {
            roomType: true,
          },
        },
        user: true,
      },
    });

    return {
      success: true,
      data: updatedInvoice,
    };
  } catch (error) {
    console.error('Error in updateInvoice:', error);

    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: `Validation error: ${error.issues.map((e: z.ZodIssue) => e.message).join(', ')}`,
      };
    }

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update invoice',
    };
  }
}

/**
 * Gets invoice statistics for admin dashboard
 * SuperAdmin only
 * 
 * @param startDate - Optional start date filter
 * @param endDate - Optional end date filter
 * @param adminId - Admin user ID for authorization
 * @returns ActionResponse with statistics
 */
export async function getInvoiceStatistics(
  startDate: string | undefined,
  endDate: string | undefined,
  adminId: string
): Promise<ActionResponse> {
  try {
    // Verify SuperAdmin role
    await verifyRole(adminId, ['SUPERADMIN']);

    // Build where clause
    const where: any = {};
    if (startDate || endDate) {
      where.issuedAt = {};
      if (startDate) {
        where.issuedAt.gte = new Date(startDate);
      }
      if (endDate) {
        where.issuedAt.lte = new Date(endDate);
      }
    }

    // Aggregate statistics
    const [
      totalInvoices,
      totalRevenue,
      paidInvoices,
      pendingInvoices,
      refundedInvoices,
    ] = await Promise.all([
      prisma.invoice.count({ where }),
      prisma.invoice.aggregate({
        where: { ...where, paymentStatus: 'SUCCEEDED' },
        _sum: { amount: true },
      }),
      prisma.invoice.count({
        where: { ...where, paymentStatus: 'SUCCEEDED' },
      }),
      prisma.invoice.count({
        where: { ...where, paymentStatus: 'PENDING' },
      }),
      prisma.invoice.count({
        where: { ...where, paymentStatus: 'REFUNDED' },
      }),
    ]);

    return {
      success: true,
      data: {
        totalInvoices,
        totalRevenue: totalRevenue._sum.amount || 0,
        paidInvoices,
        pendingInvoices,
        refundedInvoices,
        averageInvoiceAmount:
          paidInvoices > 0
            ? Math.round((totalRevenue._sum.amount || 0) / paidInvoices)
            : 0,
      },
    };
  } catch (error) {
    console.error('Error in getInvoiceStatistics:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get invoice statistics',
    };
  }
}
