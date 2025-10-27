/**
 * Invoice Validation Schemas Module
 * Day 18: Automatic Invoice & Receipt Generation System
 * 
 * Provides Zod validation schemas for invoice operations:
 * - Invoice generation requests
 * - Invoice retrieval and querying
 * - Invoice download authorization
 * - Admin invoice management
 * 
 * All schemas include comprehensive validation rules, error messages,
 * and TypeScript type inference for type-safe invoice handling.
 * 
 * @module invoice.validation
 */

import { z } from 'zod';
import { PaymentStatus } from '@prisma/client';

/**
 * Payment Status Enum Schema
 * Validates payment status values from Prisma enum
 */
export const PaymentStatusEnum = z.enum([
  'PENDING',
  'SUCCEEDED',
  'FAILED',
  'REFUNDED',
  'CANCELLED',
]);

/**
 * Invoice Generation Request Schema
 * Used when manually generating an invoice for a booking
 * Typically triggered automatically, but can be manual for offline payments
 * 
 * @example
 * {
 *   bookingId: "cm1abc123xyz",
 *   paymentMethod: "offline",
 *   adminId: "cm1admin456" // Optional, required for manual generation
 * }
 */
export const GenerateInvoiceSchema = z.object({
  bookingId: z.string({
    message: 'Booking ID is required',
  }).min(1, 'Booking ID cannot be empty'),
  
  paymentMethod: z.enum(['online', 'offline', 'stripe', 'razorpay', 'cash', 'bank_transfer'], {
    message: 'Invalid payment method',
  }).default('online'),
  
  adminId: z.string().optional(),
  
  notes: z.string().max(500, 'Notes cannot exceed 500 characters').optional(),
});

export type GenerateInvoiceRequest = z.infer<typeof GenerateInvoiceSchema>;

/**
 * Get Invoice by Booking ID Schema
 * Used to retrieve invoice details for a specific booking
 * 
 * @example
 * { bookingId: "cm1abc123xyz" }
 */
export const GetInvoiceByBookingSchema = z.object({
  bookingId: z.string({
    message: 'Booking ID is required',
  }).min(1, 'Booking ID cannot be empty'),
});

export type GetInvoiceByBookingRequest = z.infer<typeof GetInvoiceByBookingSchema>;

/**
 * Get Invoice by ID Schema
 * Used to retrieve invoice details by invoice ID
 * 
 * @example
 * { invoiceId: "cm1invoice789" }
 */
export const GetInvoiceByIdSchema = z.object({
  invoiceId: z.string({
    message: 'Invoice ID is required',
  }).min(1, 'Invoice ID cannot be empty'),
});

export type GetInvoiceByIdRequest = z.infer<typeof GetInvoiceByIdSchema>;

/**
 * Download Invoice Schema
 * Used to authorize and track invoice PDF downloads
 * Includes user ID for RBAC validation
 * 
 * @example
 * {
 *   invoiceId: "cm1invoice789",
 *   userId: "cm1user456"
 * }
 */
export const DownloadInvoiceSchema = z.object({
  invoiceId: z.string({
    message: 'Invoice ID is required',
  }).min(1, 'Invoice ID cannot be empty'),
  
  userId: z.string({
    message: 'User ID is required for authorization',
  }).min(1, 'User ID cannot be empty'),
});

export type DownloadInvoiceRequest = z.infer<typeof DownloadInvoiceSchema>;

/**
 * List Invoices Query Schema
 * Used for filtering and pagination in invoice lists
 * Supports filtering by user, status, date range, and pagination
 * 
 * @example
 * {
 *   userId: "cm1user456", // Optional: filter by user
 *   paymentStatus: "SUCCEEDED",
 *   startDate: "2025-01-01",
 *   endDate: "2025-01-31",
 *   page: 1,
 *   limit: 10
 * }
 */
export const ListInvoicesSchema = z.object({
  userId: z.string().optional(),
  
  paymentStatus: PaymentStatusEnum.optional(),
  
  startDate: z.string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Start date must be in YYYY-MM-DD format')
    .optional(),
  
  endDate: z.string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'End date must be in YYYY-MM-DD format')
    .optional(),
  
  page: z.coerce.number().int().positive().default(1),
  
  limit: z.coerce.number().int().positive().max(100).default(10),
  
  sortBy: z.enum(['createdAt', 'issuedAt', 'amount', 'invoiceNumber']).default('createdAt'),
  
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
}).refine(
  (data) => {
    if (data.startDate && data.endDate) {
      return new Date(data.startDate) <= new Date(data.endDate);
    }
    return true;
  },
  {
    message: 'Start date must be before or equal to end date',
    path: ['startDate'],
  }
);

export type ListInvoicesQuery = z.infer<typeof ListInvoicesSchema>;

/**
 * Update Invoice Schema
 * Used by admins to update invoice details (e.g., after refund)
 * Limited fields can be updated for audit compliance
 * 
 * @example
 * {
 *   invoiceId: "cm1invoice789",
 *   paymentStatus: "REFUNDED",
 *   adminId: "cm1admin456",
 *   notes: "Full refund processed"
 * }
 */
export const UpdateInvoiceSchema = z.object({
  invoiceId: z.string({
    message: 'Invoice ID is required',
  }).min(1, 'Invoice ID cannot be empty'),
  
  paymentStatus: PaymentStatusEnum.optional(),
  
  adminId: z.string({
    message: 'Admin ID is required for updates',
  }).min(1, 'Admin ID cannot be empty'),
  
  notes: z.string().max(500, 'Notes cannot exceed 500 characters').optional(),
});

export type UpdateInvoiceRequest = z.infer<typeof UpdateInvoiceSchema>;

/**
 * Resend Invoice Email Schema
 * Used to resend invoice via email to customer
 * 
 * @example
 * {
 *   invoiceId: "cm1invoice789",
 *   email: "customer@example.com"
 * }
 */
export const ResendInvoiceEmailSchema = z.object({
  invoiceId: z.string({
    message: 'Invoice ID is required',
  }).min(1, 'Invoice ID cannot be empty'),
  
  email: z.string({
    message: 'Email address is required',
  }).email('Invalid email address format'),
});

export type ResendInvoiceEmailRequest = z.infer<typeof ResendInvoiceEmailSchema>;

/**
 * Invoice Statistics Query Schema
 * Used for admin dashboard analytics
 * Supports date range filtering
 * 
 * @example
 * {
 *   startDate: "2025-01-01",
 *   endDate: "2025-01-31"
 * }
 */
export const InvoiceStatsSchema = z.object({
  startDate: z.string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Start date must be in YYYY-MM-DD format')
    .optional(),
  
  endDate: z.string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'End date must be in YYYY-MM-DD format')
    .optional(),
  
  adminId: z.string({
    message: 'Admin ID is required',
  }).min(1, 'Admin ID cannot be empty'),
}).refine(
  (data) => {
    if (data.startDate && data.endDate) {
      return new Date(data.startDate) <= new Date(data.endDate);
    }
    return true;
  },
  {
    message: 'Start date must be before or equal to end date',
    path: ['startDate'],
  }
);

export type InvoiceStatsQuery = z.infer<typeof InvoiceStatsSchema>;

/**
 * Invoice Response Schema
 * Validates the structure of invoice data returned from API
 * Used for type-safe responses
 */
export const InvoiceResponseSchema = z.object({
  id: z.string(),
  bookingId: z.string(),
  userId: z.string(),
  amount: z.number().int().positive(),
  paymentMethod: z.string(),
  paymentStatus: PaymentStatusEnum,
  invoiceNumber: z.string(),
  pdfUrl: z.string().nullable(),
  currency: z.string(),
  issuedAt: z.date(),
  createdAt: z.date(),
  updatedAt: z.date(),
  
  // Related data (optional, included in expanded responses)
  booking: z.object({
    id: z.string(),
    startDate: z.date(),
    endDate: z.date(),
    roomsBooked: z.number().int(),
    totalPrice: z.number().int(),
    roomType: z.object({
      name: z.string(),
      pricePerNight: z.number().int(),
    }),
  }).optional(),
  
  user: z.object({
    id: z.string(),
    name: z.string(),
    email: z.string().nullable(),
    phone: z.string(),
  }).optional(),
});

export type InvoiceResponse = z.infer<typeof InvoiceResponseSchema>;

/**
 * Helper function to validate invoice generation eligibility
 * Checks if booking and payment status allow invoice creation
 * 
 * @param bookingStatus - Current booking status
 * @param paymentStatus - Current payment status
 * @returns Validation result with error message if invalid
 */
export function validateInvoiceEligibility(
  bookingStatus: string,
  paymentStatus: PaymentStatus
): { valid: boolean; error?: string } {
  // Only confirmed bookings can have invoices
  if (bookingStatus !== 'CONFIRMED') {
    return {
      valid: false,
      error: 'Invoice can only be generated for confirmed bookings',
    };
  }

  // Only succeeded payments can have invoices
  if (paymentStatus !== 'SUCCEEDED') {
    return {
      valid: false,
      error: 'Invoice can only be generated for successful payments',
    };
  }

  return { valid: true };
}

/**
 * Helper function to format validation errors
 * Converts Zod errors to user-friendly messages
 * 
 * @param error - Zod validation error
 * @returns Formatted error message string
 */
export function formatValidationError(error: z.ZodError): string {
  const errors = error.issues.map((err: z.ZodIssue) => {
    const path = err.path.join('.');
    return `${path}: ${err.message}`;
  });
  
  return errors.join('; ');
}

/**
 * Constants for invoice validation
 */
export const INVOICE_CONSTRAINTS = {
  MIN_AMOUNT: 0,
  MAX_AMOUNT: 1000000000, // $10,000,000 in cents
  MAX_NOTES_LENGTH: 500,
  SUPPORTED_CURRENCIES: ['USD', 'INR', 'EUR', 'GBP', 'JPY'],
  SUPPORTED_PAYMENT_METHODS: ['online', 'offline', 'stripe', 'razorpay', 'cash', 'bank_transfer'],
} as const;
