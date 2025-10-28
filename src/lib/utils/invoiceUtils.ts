/**
 * Invoice Utilities Module
 * Day 18: Automatic Invoice & Receipt Generation System
 * 
 * Provides helper functions for invoice generation, formatting, and management:
 * - Sequential invoice number generation with year-based format
 * - Currency formatting for international support
 * - File path management for PDF storage (local or S3)
 * - Date and time formatting for invoice display
 * - Invoice status helpers
 * 
 * @module invoiceUtils
 */

import { prisma } from '@/lib/prisma';
import { PaymentStatus } from '@prisma/client';

/**
 * Invoice number format: INV-YYYY-NNNNN
 * Example: INV-2025-00001, INV-2025-00002
 * Resets sequence at the start of each year
 */

/**
 * Generates a sequential invoice number for the current year
 * Format: INV-YYYY-NNNNN (e.g., INV-2025-00001)
 * 
 * Algorithm:
 * 1. Get the current year
 * 2. Find the highest invoice number for this year
 * 3. Increment by 1 (or start at 1 if none exist)
 * 4. Zero-pad to 5 digits
 * 
 * @returns Promise<string> - Unique invoice number
 * @example
 * const invoiceNumber = await generateInvoiceNumber();
 * // Returns: "INV-2025-00001"
 */
export async function generateInvoiceNumber(): Promise<string> {
  const currentYear = new Date().getFullYear();
  const yearPrefix = `INV-${currentYear}-`;

  // Find the last invoice number for this year
  const lastInvoice = await prisma.invoice.findFirst({
    where: {
      invoiceNumber: {
        startsWith: yearPrefix,
      },
    },
    orderBy: {
      invoiceNumber: 'desc',
    },
    select: {
      invoiceNumber: true,
    },
  });

  let nextSequence = 1;

  if (lastInvoice && lastInvoice.invoiceNumber) {
    // Extract the sequence number from the last invoice
    // Format: INV-YYYY-NNNNN -> extract NNNNN
    const parts = lastInvoice.invoiceNumber.split('-');
    const lastSequence = parseInt(parts[2] || '0', 10);
    nextSequence = lastSequence + 1;
  }

  // Zero-pad to 5 digits
  const sequenceStr = nextSequence.toString().padStart(5, '0');
  return `${yearPrefix}${sequenceStr}`;
}

/**
 * Formats currency amount with proper symbol and decimal places
 * Supports multiple currencies with appropriate symbols
 * 
 * @param amountInCents - Amount in smallest currency unit (cents/paise)
 * @param currency - Currency code (USD, INR, EUR, etc.)
 * @returns Formatted currency string
 * 
 * @example
 * formatCurrency(15000, 'USD') // Returns: "$150.00"
 * formatCurrency(500000, 'INR') // Returns: "₹5,000.00"
 */
export function formatCurrency(amountInCents: number, currency: string = 'USD'): string {
  const amount = amountInCents / 100;

  const currencySymbols: Record<string, string> = {
    USD: '$',
    INR: '₹',
    EUR: '€',
    GBP: '£',
    JPY: '¥',
  };

  const symbol = currencySymbols[currency.toUpperCase()] || currency;

  // For JPY and similar currencies with no decimal places
  const decimalPlaces = ['JPY', 'KRW'].includes(currency.toUpperCase()) ? 0 : 2;

  return `${symbol}${amount.toLocaleString('en-US', {
    minimumFractionDigits: decimalPlaces,
    maximumFractionDigits: decimalPlaces,
  })}`;
}

/**
 * Generates the file path or URL for storing invoice PDFs
 * Supports both local filesystem and S3/cloud storage
 * 
 * @param invoiceNumber - Unique invoice number
 * @param useS3 - Whether to use S3 storage (default: false for local)
 * @returns File path or S3 URL
 * 
 * @example
 * getInvoicePath('INV-2025-00001') 
 * // Returns: "/invoices/2025/INV-2025-00001.pdf"
 * 
 * getInvoicePath('INV-2025-00001', true)
 * // Returns: "https://s3.amazonaws.com/bucket-name/invoices/2025/INV-2025-00001.pdf"
 */
export function getInvoicePath(invoiceNumber: string, useS3: boolean = false): string {
  // Extract year from invoice number (format: INV-YYYY-NNNNN)
  const year = invoiceNumber.split('-')[1];
  const fileName = `${invoiceNumber}.pdf`;

  if (useS3) {
    // S3 bucket configuration (can be moved to environment variables)
    const bucketName = process.env.S3_INVOICE_BUCKET || 'hotel-booking-invoices';
    const region = process.env.S3_REGION || 'us-east-1';
    return `https://${bucketName}.s3.${region}.amazonaws.com/invoices/${year}/${fileName}`;
  }

  // Local filesystem path (public directory for Next.js static serving)
  return `/invoices/${year}/${fileName}`;
}

/**
 * Gets the absolute file system path for saving invoice PDFs locally
 * Used when writing PDF files to disk
 * 
 * @param invoiceNumber - Unique invoice number
 * @returns Absolute file system path
 * 
 * @example
 * getInvoiceFilePath('INV-2025-00001')
 * // Returns: "/path/to/project/public/invoices/2025/INV-2025-00001.pdf"
 */
export function getInvoiceFilePath(invoiceNumber: string): string {
  const year = invoiceNumber.split('-')[1];
  const fileName = `${invoiceNumber}.pdf`;
  
  // Public directory for Next.js static file serving
  // This assumes the project root is at process.cwd()
  return `${process.cwd()}/public/invoices/${year}/${fileName}`;
}

/**
 * Formats a date for invoice display
 * Format: Month DD, YYYY (e.g., "January 23, 2025")
 * 
 * @param date - Date to format
 * @returns Formatted date string
 * 
 * @example
 * formatInvoiceDate(new Date('2025-01-23'))
 * // Returns: "January 23, 2025"
 */
export function formatInvoiceDate(date: Date): string {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(date);
}

/**
 * Formats a date range for booking display on invoice
 * Format: "Mon DD - Mon DD, YYYY"
 * 
 * @param startDate - Check-in date
 * @param endDate - Check-out date
 * @returns Formatted date range string
 * 
 * @example
 * formatDateRange(new Date('2025-01-23'), new Date('2025-01-26'))
 * // Returns: "Jan 23 - Jan 26, 2025"
 */
export function formatDateRange(startDate: Date, endDate: Date): string {
  const options: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' };
  const start = new Intl.DateTimeFormat('en-US', options).format(startDate);
  const end = new Intl.DateTimeFormat('en-US', { 
    ...options, 
    year: 'numeric' 
  }).format(endDate);
  
  return `${start} - ${end}`;
}

/**
 * Calculates the number of nights between two dates
 * Used for pricing breakdown display on invoices
 * 
 * @param startDate - Check-in date
 * @param endDate - Check-out date
 * @returns Number of nights
 * 
 * @example
 * calculateNights(new Date('2025-01-23'), new Date('2025-01-26'))
 * // Returns: 3
 */
export function calculateNights(startDate: Date, endDate: Date): number {
  const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
}

/**
 * Gets a human-readable payment status label
 * Converts enum to display-friendly text
 * 
 * @param status - PaymentStatus enum value
 * @returns Display label
 * 
 * @example
 * getPaymentStatusLabel('SUCCEEDED') // Returns: "Paid"
 * getPaymentStatusLabel('PENDING') // Returns: "Pending"
 */
export function getPaymentStatusLabel(status: PaymentStatus): string {
  const statusLabels: Record<PaymentStatus, string> = {
    PENDING: 'Pending',
    SUCCEEDED: 'Paid',
    FAILED: 'Failed',
    REFUNDED: 'Refunded',
    CANCELLED: 'Cancelled',
  };

  return statusLabels[status] || status;
}

/**
 * Gets the appropriate color class for payment status display
 * Used for Tailwind CSS styling
 * 
 * @param status - PaymentStatus enum value
 * @returns Tailwind color class
 * 
 * @example
 * getPaymentStatusColor('SUCCEEDED') // Returns: "text-green-600"
 * getPaymentStatusColor('FAILED') // Returns: "text-red-600"
 */
export function getPaymentStatusColor(status: PaymentStatus): string {
  const statusColors: Record<PaymentStatus, string> = {
    PENDING: 'text-amber-600',
    SUCCEEDED: 'text-green-600',
    FAILED: 'text-red-600',
    REFUNDED: 'text-blue-600',
    CANCELLED: 'text-gray-600',
  };

  return statusColors[status] || 'text-gray-600';
}

/**
 * Validates if a payment status allows invoice generation
 * Invoices can only be generated for succeeded or offline payments
 * 
 * @param status - PaymentStatus enum value
 * @returns True if invoice can be generated
 * 
 * @example
 * canGenerateInvoice('SUCCEEDED') // Returns: true
 * canGenerateInvoice('PENDING') // Returns: false
 */
export function canGenerateInvoice(status: PaymentStatus): boolean {
  return status === 'SUCCEEDED';
}

/**
 * Ensures the invoice directory exists for the given year
 * Creates nested directories if they don't exist
 * 
 * @param year - Year for invoice storage
 * @returns Promise<void>
 */
export async function ensureInvoiceDirectory(year: string): Promise<void> {
  const fs = require('fs/promises');
  const path = require('path');
  
  const dirPath = path.join(process.cwd(), 'public', 'invoices', year);
  
  try {
    await fs.access(dirPath);
  } catch {
    // Directory doesn't exist, create it
    await fs.mkdir(dirPath, { recursive: true });
  }
}

/**
 * Type definitions for invoice data
 */
export interface InvoiceData {
  invoiceNumber: string;
  issuedAt: Date;
  bookingId: string;
  userId: string;
  userName: string;
  userEmail?: string;
  userPhone: string;
  roomTypeName: string;
  checkInDate: Date;
  checkOutDate: Date;
  numberOfNights: number;
  roomsBooked: number;
  pricePerNight: number;
  totalAmount: number;
  paymentMethod: string;
  paymentStatus: PaymentStatus;
  currency: string;
}

/**
 * Company information for invoice header
 * Can be moved to environment variables or database config
 */
export const COMPANY_INFO = {
  name: process.env.COMPANY_NAME || 'IRCA Hotel Booking System',
  address: process.env.COMPANY_ADDRESS || '123 Hotel Street, City, Country',
  phone: process.env.COMPANY_PHONE || '+1 (555) 123-4567',
  email: process.env.COMPANY_EMAIL || 'bookings@ircahotel.com',
  website: process.env.COMPANY_WEBSITE || 'www.ircahotel.com',
  taxId: process.env.COMPANY_TAX_ID || 'TAX-123456789',
};
