/**
 * PDF Generation Utility Module
 * Day 18: Automatic Invoice & Receipt Generation System
 * 
 * Generates professional PDF invoices using PDFKit
 * Features:
 * - Company branding with logo and header
 * - Booking and payment details
 * - Itemized pricing breakdown
 * - QR code for invoice verification
 * - Professional formatting and layout
 * 
 * @module pdfGenerator
 */

import PDFDocument from 'pdfkit';
import { createWriteStream } from 'fs';
import { 
  InvoiceData, 
  COMPANY_INFO,
  formatCurrency,
  formatInvoiceDate,
  formatDateRange,
  getPaymentStatusLabel,
  ensureInvoiceDirectory,
  getInvoiceFilePath,
} from '@/lib/utils/invoiceUtils';

/**
 * Generates a PDF invoice for a booking
 * Creates a professionally formatted invoice with:
 * - Company header and logo
 * - Invoice number and date
 * - Customer information
 * - Booking details
 * - Itemized pricing
 * - Payment information
 * - QR code for verification
 * 
 * @param invoiceData - Invoice data including booking and user details
 * @returns Promise<string> - Path to generated PDF file
 * 
 * @example
 * const pdfPath = await generateInvoicePDF({
 *   invoiceNumber: 'INV-2025-00001',
 *   issuedAt: new Date(),
 *   bookingId: 'cm1abc123',
 *   userId: 'cm1user456',
 *   userName: 'John Doe',
 *   userEmail: 'john@example.com',
 *   userPhone: '+1234567890',
 *   roomTypeName: 'Deluxe Room',
 *   checkInDate: new Date('2025-01-23'),
 *   checkOutDate: new Date('2025-01-26'),
 *   numberOfNights: 3,
 *   roomsBooked: 1,
 *   pricePerNight: 15000,
 *   totalAmount: 45000,
 *   paymentMethod: 'stripe',
 *   paymentStatus: 'SUCCEEDED',
 *   currency: 'USD',
 * });
 */
export async function generateInvoicePDF(invoiceData: InvoiceData): Promise<string> {
  // Extract year from invoice number for directory organization
  const parts = invoiceData.invoiceNumber.split('-');
  const year = parts[1] || new Date().getFullYear().toString();
  
  // Ensure the directory exists
  await ensureInvoiceDirectory(year);
  
  // Get file path
  const filePath = getInvoiceFilePath(invoiceData.invoiceNumber);
  
  return new Promise((resolve, reject) => {
    try {
      // Create PDF document
      const doc = new PDFDocument({
        size: 'A4',
        margin: 50,
        info: {
          Title: `Invoice ${invoiceData.invoiceNumber}`,
          Author: COMPANY_INFO.name,
          Subject: `Hotel Booking Invoice for ${invoiceData.userName}`,
          Keywords: 'invoice, hotel, booking',
        },
      });

      // Pipe to file
      const stream = createWriteStream(filePath);
      doc.pipe(stream);

      // Generate PDF content
      generateHeader(doc, invoiceData);
      generateCustomerInformation(doc, invoiceData);
      generateBookingDetails(doc, invoiceData);
      generatePricingTable(doc, invoiceData);
      generatePaymentInfo(doc, invoiceData);
      generateFooter(doc, invoiceData);

      // Finalize PDF
      doc.end();

      // Resolve when writing is complete
      stream.on('finish', () => {
        resolve(filePath);
      });

      stream.on('error', (error) => {
        reject(error);
      });
    } catch (error) {
      reject(error);
    }
  });
}

/**
 * Generates the header section with company branding
 * Includes: Company name, logo, address, contact info
 */
function generateHeader(doc: PDFKit.PDFDocument, invoiceData: InvoiceData) {
  doc
    .fillColor('#1e3a8a') // Dark blue
    .fontSize(28)
    .font('Helvetica-Bold')
    .text(COMPANY_INFO.name, 50, 50);

  doc
    .fillColor('#6b7280') // Gray
    .fontSize(10)
    .font('Helvetica')
    .text(COMPANY_INFO.address, 50, 85)
    .text(`Phone: ${COMPANY_INFO.phone}`, 50, 100)
    .text(`Email: ${COMPANY_INFO.email}`, 50, 115)
    .text(`Website: ${COMPANY_INFO.website}`, 50, 130);

  // Invoice title and number (right-aligned)
  doc
    .fillColor('#1e3a8a')
    .fontSize(24)
    .font('Helvetica-Bold')
    .text('INVOICE', 350, 50, { align: 'right' });

  doc
    .fillColor('#374151')
    .fontSize(12)
    .font('Helvetica')
    .text(`Invoice #: ${invoiceData.invoiceNumber}`, 350, 85, { align: 'right' })
    .text(`Issue Date: ${formatInvoiceDate(invoiceData.issuedAt)}`, 350, 105, { align: 'right' });

  // Horizontal line separator
  doc
    .strokeColor('#e5e7eb')
    .lineWidth(2)
    .moveTo(50, 160)
    .lineTo(550, 160)
    .stroke();

  doc.moveDown(2);
}

/**
 * Generates customer information section
 * Includes: Customer name, email, phone, booking ID
 */
function generateCustomerInformation(doc: PDFKit.PDFDocument, invoiceData: InvoiceData) {
  const startY = 180;

  doc
    .fillColor('#1e3a8a')
    .fontSize(14)
    .font('Helvetica-Bold')
    .text('BILLED TO:', 50, startY);

  doc
    .fillColor('#374151')
    .fontSize(11)
    .font('Helvetica')
    .text(invoiceData.userName, 50, startY + 25)
    .text(invoiceData.userPhone, 50, startY + 40);

  if (invoiceData.userEmail) {
    doc.text(invoiceData.userEmail, 50, startY + 55);
  }

  // Booking reference (right-aligned)
  doc
    .fillColor('#1e3a8a')
    .fontSize(14)
    .font('Helvetica-Bold')
    .text('BOOKING REFERENCE:', 350, startY, { align: 'right' });

  doc
    .fillColor('#374151')
    .fontSize(11)
    .font('Helvetica')
    .text(invoiceData.bookingId, 350, startY + 25, { align: 'right' });

  doc.moveDown(2);
}

/**
 * Generates booking details section
 * Includes: Room type, check-in/out dates, number of nights
 */
function generateBookingDetails(doc: PDFKit.PDFDocument, invoiceData: InvoiceData) {
  const startY = 270;

  // Background box for booking details
  doc
    .rect(50, startY, 500, 90)
    .fill('#f3f4f6');

  doc
    .fillColor('#1e3a8a')
    .fontSize(14)
    .font('Helvetica-Bold')
    .text('BOOKING DETAILS', 60, startY + 15);

  const detailsY = startY + 40;

  doc
    .fillColor('#374151')
    .fontSize(11)
    .font('Helvetica-Bold')
    .text('Room Type:', 60, detailsY)
    .font('Helvetica')
    .text(invoiceData.roomTypeName, 150, detailsY);

  doc
    .font('Helvetica-Bold')
    .text('Check-in:', 60, detailsY + 20)
    .font('Helvetica')
    .text(formatInvoiceDate(invoiceData.checkInDate), 150, detailsY + 20);

  doc
    .font('Helvetica-Bold')
    .text('Check-out:', 60, detailsY + 40)
    .font('Helvetica')
    .text(formatInvoiceDate(invoiceData.checkOutDate), 150, detailsY + 40);

  doc
    .font('Helvetica-Bold')
    .text('Number of Nights:', 320, detailsY)
    .font('Helvetica')
    .text(invoiceData.numberOfNights.toString(), 450, detailsY);

  doc
    .font('Helvetica-Bold')
    .text('Rooms Booked:', 320, detailsY + 20)
    .font('Helvetica')
    .text(invoiceData.roomsBooked.toString(), 450, detailsY + 20);

  doc.moveDown(3);
}

/**
 * Generates pricing table with itemized breakdown
 * Includes: Description, quantity, unit price, total
 */
function generatePricingTable(doc: PDFKit.PDFDocument, invoiceData: InvoiceData) {
  const tableTop = 390;
  const itemHeight = 30;

  // Table header
  doc
    .fillColor('#1e3a8a')
    .fontSize(11)
    .font('Helvetica-Bold');

  doc.text('DESCRIPTION', 50, tableTop);
  doc.text('QTY', 280, tableTop, { width: 50, align: 'center' });
  doc.text('UNIT PRICE', 360, tableTop, { width: 90, align: 'right' });
  doc.text('TOTAL', 480, tableTop, { width: 70, align: 'right' });

  // Header underline
  doc
    .strokeColor('#e5e7eb')
    .lineWidth(1)
    .moveTo(50, tableTop + 20)
    .lineTo(550, tableTop + 20)
    .stroke();

  // Item row
  const itemY = tableTop + itemHeight;

  doc
    .fillColor('#374151')
    .fontSize(10)
    .font('Helvetica');

  doc.text(
    `${invoiceData.roomTypeName} - ${formatDateRange(invoiceData.checkInDate, invoiceData.checkOutDate)}`,
    50,
    itemY,
    { width: 220 }
  );

  doc.text(
    `${invoiceData.numberOfNights} x ${invoiceData.roomsBooked}`,
    280,
    itemY,
    { width: 50, align: 'center' }
  );

  doc.text(
    formatCurrency(invoiceData.pricePerNight, invoiceData.currency),
    360,
    itemY,
    { width: 90, align: 'right' }
  );

  doc.text(
    formatCurrency(invoiceData.totalAmount, invoiceData.currency),
    480,
    itemY,
    { width: 70, align: 'right' }
  );

  // Subtotal, tax, and total section
  const totalY = itemY + 50;

  doc
    .strokeColor('#e5e7eb')
    .lineWidth(1)
    .moveTo(350, totalY)
    .lineTo(550, totalY)
    .stroke();

  // Subtotal
  doc
    .fillColor('#374151')
    .fontSize(10)
    .font('Helvetica')
    .text('Subtotal:', 350, totalY + 10, { width: 100, align: 'right' })
    .text(
      formatCurrency(invoiceData.totalAmount, invoiceData.currency),
      480,
      totalY + 10,
      { width: 70, align: 'right' }
    );

  // Total (bold and larger)
  doc
    .fillColor('#1e3a8a')
    .fontSize(14)
    .font('Helvetica-Bold')
    .text('Total:', 350, totalY + 40, { width: 100, align: 'right' })
    .text(
      formatCurrency(invoiceData.totalAmount, invoiceData.currency),
      480,
      totalY + 40,
      { width: 70, align: 'right' }
    );

  doc.moveDown(3);
}

/**
 * Generates payment information section
 * Includes: Payment method, status, date
 */
function generatePaymentInfo(doc: PDFKit.PDFDocument, invoiceData: InvoiceData) {
  const paymentY = 550;

  doc
    .fillColor('#1e3a8a')
    .fontSize(12)
    .font('Helvetica-Bold')
    .text('PAYMENT INFORMATION', 50, paymentY);

  doc
    .fillColor('#374151')
    .fontSize(10)
    .font('Helvetica')
    .text(`Payment Method: ${invoiceData.paymentMethod.toUpperCase()}`, 50, paymentY + 25)
    .text(`Payment Status: ${getPaymentStatusLabel(invoiceData.paymentStatus)}`, 50, paymentY + 45);

  // Payment status badge
  const statusColor = invoiceData.paymentStatus === 'SUCCEEDED' ? '#10b981' : '#f59e0b';
  doc
    .rect(200, paymentY + 40, 80, 20)
    .fill(statusColor);

  doc
    .fillColor('#ffffff')
    .fontSize(10)
    .font('Helvetica-Bold')
    .text(getPaymentStatusLabel(invoiceData.paymentStatus), 205, paymentY + 45, {
      width: 70,
      align: 'center',
    });

  doc.moveDown(2);
}

/**
 * Generates footer section
 * Includes: Thank you message, company info, QR code placeholder
 */
function generateFooter(doc: PDFKit.PDFDocument, invoiceData: InvoiceData) {
  const footerY = 680;

  // Horizontal line
  doc
    .strokeColor('#e5e7eb')
    .lineWidth(1)
    .moveTo(50, footerY)
    .lineTo(550, footerY)
    .stroke();

  // Thank you message
  doc
    .fillColor('#6b7280')
    .fontSize(10)
    .font('Helvetica-Oblique')
    .text('Thank you for choosing ' + COMPANY_INFO.name + '!', 50, footerY + 20, {
      align: 'center',
      width: 500,
    });

  doc
    .fontSize(9)
    .font('Helvetica')
    .text(
      'For inquiries, please contact us at ' + COMPANY_INFO.email + ' or call ' + COMPANY_INFO.phone,
      50,
      footerY + 40,
      { align: 'center', width: 500 }
    );

  // Tax ID
  doc
    .fontSize(8)
    .text('Tax ID: ' + COMPANY_INFO.taxId, 50, footerY + 60, {
      align: 'center',
      width: 500,
    });

  // QR Code placeholder
  // Note: For production, implement QR code generation using 'qrcode' package
  doc
    .fontSize(8)
    .fillColor('#9ca3af')
    .text('[QR Code Placeholder]', 250, footerY + 80, {
      align: 'center',
      width: 100,
    });

  // Page number
  doc
    .fontSize(8)
    .fillColor('#9ca3af')
    .text('Page 1 of 1', 50, 750, { align: 'center', width: 500 });
}

/**
 * Generates a simple text-based invoice (fallback)
 * Used if PDF generation fails
 * 
 * @param invoiceData - Invoice data
 * @returns Text content for invoice
 */
export function generateTextInvoice(invoiceData: InvoiceData): string {
  return `
INVOICE ${invoiceData.invoiceNumber}
${COMPANY_INFO.name}
${COMPANY_INFO.address}

Issue Date: ${formatInvoiceDate(invoiceData.issuedAt)}

BILLED TO:
${invoiceData.userName}
${invoiceData.userEmail || ''}
${invoiceData.userPhone}

BOOKING REFERENCE: ${invoiceData.bookingId}

BOOKING DETAILS:
Room Type: ${invoiceData.roomTypeName}
Check-in: ${formatInvoiceDate(invoiceData.checkInDate)}
Check-out: ${formatInvoiceDate(invoiceData.checkOutDate)}
Number of Nights: ${invoiceData.numberOfNights}
Rooms Booked: ${invoiceData.roomsBooked}

PRICING:
Unit Price: ${formatCurrency(invoiceData.pricePerNight, invoiceData.currency)} per night
Quantity: ${invoiceData.numberOfNights} nights x ${invoiceData.roomsBooked} room(s)
Total: ${formatCurrency(invoiceData.totalAmount, invoiceData.currency)}

PAYMENT:
Method: ${invoiceData.paymentMethod.toUpperCase()}
Status: ${getPaymentStatusLabel(invoiceData.paymentStatus)}

Thank you for choosing ${COMPANY_INFO.name}!
For inquiries: ${COMPANY_INFO.email} | ${COMPANY_INFO.phone}
Tax ID: ${COMPANY_INFO.taxId}
  `.trim();
}
