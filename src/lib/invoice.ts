// ==========================================
// INVOICE GENERATOR (STUB)
// ==========================================
// Placeholder invoice generation functions
// TODO: Integrate real PDF generator (pdfkit, puppeteer, or @react-pdf/renderer)

import type { Payment, Booking, User, RoomType } from '@prisma/client'

// ==========================================
// TYPES
// ==========================================

/**
 * Invoice data structure
 */
export interface InvoiceData {
  invoiceNumber: string
  paymentId: string
  bookingId: string
  issueDate: Date
  dueDate: Date
  
  // Customer information
  customer: {
    name: string
    email: string | null
    phone: string
    address?: string
  }
  
  // Hotel information
  hotel: {
    name: string
    address: string
    phone: string
    email: string
    taxId?: string
  }
  
  // Booking details
  booking: {
    roomType: string
    checkIn: Date
    checkOut: Date
    nights: number
    guests: number
  }
  
  // Payment details
  payment: {
    amount: number
    currency: string
    method: string
    transactionId: string
    paidAt: Date
  }
  
  // Line items
  lineItems: Array<{
    description: string
    quantity: number
    unitPrice: number
    total: number
  }>
  
  // Totals
  subtotal: number
  tax: number
  taxRate: number
  total: number
  
  // Additional info
  notes?: string
  termsAndConditions?: string
}

/**
 * Extended payment type with relations
 */
type PaymentWithRelations = Payment & {
  booking: (Booking & {
    roomType: RoomType
    user: User
  }) | null
  user: User
}

// ==========================================
// INVOICE GENERATION FUNCTIONS
// ==========================================

/**
 * Generate invoice number
 * Format: INV-YYYYMMDD-XXXXX
 * 
 * @param paymentId - Payment ID
 * @returns Invoice number string
 */
export function generateInvoiceNumber(paymentId: string): string {
  const date = new Date()
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const shortId = paymentId.slice(-8).toUpperCase()
  
  return `INV-${year}${month}${day}-${shortId}`
}

/**
 * Calculate number of nights between dates
 * 
 * @param startDate - Check-in date
 * @param endDate - Check-out date
 * @returns Number of nights
 */
function calculateNights(startDate: Date, endDate: Date): number {
  const diffTime = Math.abs(endDate.getTime() - startDate.getTime())
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
}

/**
 * Prepare invoice data from payment and booking
 * 
 * @param payment - Payment record with relations
 * @returns Structured invoice data
 */
export function prepareInvoiceData(
  payment: PaymentWithRelations
): InvoiceData {
  if (!payment.booking) {
    throw new Error('Cannot generate invoice for payment without booking')
  }

  const { booking, user } = payment
  const nights = calculateNights(booking.startDate, booking.endDate)
  const pricePerNight = booking.roomType.pricePerNight
  
  // Calculate tax (example: 10% tax rate)
  const TAX_RATE = 0.10
  const subtotal = payment.amount
  const taxAmount = Math.round(subtotal * TAX_RATE)
  const totalWithoutTax = subtotal - taxAmount

  return {
    invoiceNumber: generateInvoiceNumber(payment.id),
    paymentId: payment.id,
    bookingId: booking.id,
    issueDate: payment.paidAt || payment.createdAt,
    dueDate: payment.paidAt || payment.createdAt,
    
    customer: {
      name: user.name,
      email: user.email,
      phone: user.phone,
    },
    
    hotel: {
      name: 'Hotel Booking System',
      address: '123 Hotel Street, City, State 12345',
      phone: '+1 (555) 123-4567',
      email: 'info@hotelbooking.com',
      taxId: 'TAX-123456789',
    },
    
    booking: {
      roomType: booking.roomType.name,
      checkIn: booking.startDate,
      checkOut: booking.endDate,
      nights,
      guests: 2, // TODO: Get from booking metadata
    },
    
    payment: {
      amount: payment.amount,
      currency: payment.currency,
      method: payment.provider,
      transactionId: payment.providerPaymentId || payment.id,
      paidAt: payment.paidAt || payment.createdAt,
    },
    
    lineItems: [
      {
        description: `${booking.roomType.name} - ${nights} night(s)`,
        quantity: nights,
        unitPrice: pricePerNight,
        total: pricePerNight * nights,
      },
    ],
    
    subtotal: totalWithoutTax,
    tax: taxAmount,
    taxRate: TAX_RATE,
    total: subtotal,
    
    notes: 'Thank you for your business!',
    termsAndConditions: 'Cancellation policy: Full refund if cancelled 48 hours before check-in.',
  }
}

/**
 * Generate invoice PDF (STUB)
 * 
 * TODO: Replace with real PDF generation using one of:
 * 1. pdfkit - Low-level PDF generation
 * 2. puppeteer - HTML to PDF conversion
 * 3. @react-pdf/renderer - React components to PDF
 * 4. jsPDF - Client-side PDF generation
 * 
 * @example Using pdfkit:
 * ```ts
 * import PDFDocument from 'pdfkit'
 * 
 * const doc = new PDFDocument()
 * const chunks: Buffer[] = []
 * 
 * doc.on('data', (chunk) => chunks.push(chunk))
 * doc.on('end', () => resolve(Buffer.concat(chunks)))
 * 
 * doc.fontSize(20).text('INVOICE', { align: 'center' })
 * doc.fontSize(12).text(`Invoice #: ${data.invoiceNumber}`)
 * // ... add more content
 * doc.end()
 * ```
 * 
 * @example Using puppeteer:
 * ```ts
 * import puppeteer from 'puppeteer'
 * 
 * const browser = await puppeteer.launch()
 * const page = await browser.newPage()
 * await page.setContent(htmlTemplate)
 * const pdf = await page.pdf({ format: 'A4' })
 * await browser.close()
 * return pdf
 * ```
 * 
 * @param payment - Payment with relations
 * @returns PDF buffer (placeholder for now)
 */
export async function generateInvoicePDF(
  payment: PaymentWithRelations
): Promise<Buffer> {
  const data = prepareInvoiceData(payment)
  
  // PLACEHOLDER: Return a simple text buffer
  // In production, this should return an actual PDF
  const invoiceText = `
=====================================
           INVOICE
=====================================

Invoice Number: ${data.invoiceNumber}
Issue Date: ${data.issueDate.toLocaleDateString()}
Payment ID: ${data.paymentId}

-------------------------------------
CUSTOMER INFORMATION
-------------------------------------
Name: ${data.customer.name}
Email: ${data.customer.email || 'N/A'}
Phone: ${data.customer.phone}

-------------------------------------
BOOKING DETAILS
-------------------------------------
Room Type: ${data.booking.roomType}
Check-in: ${data.booking.checkIn.toLocaleDateString()}
Check-out: ${data.booking.checkOut.toLocaleDateString()}
Nights: ${data.booking.nights}

-------------------------------------
PAYMENT DETAILS
-------------------------------------
${data.lineItems.map(item => 
  `${item.description} x${item.quantity} @ ${formatCurrency(item.unitPrice, data.payment.currency)}`
).join('\n')}

Subtotal: ${formatCurrency(data.subtotal, data.payment.currency)}
Tax (${data.taxRate * 100}%): ${formatCurrency(data.tax, data.payment.currency)}
-------------------------------------
TOTAL: ${formatCurrency(data.total, data.payment.currency)}
-------------------------------------

Payment Method: ${data.payment.method.toUpperCase()}
Transaction ID: ${data.payment.transactionId}
Paid on: ${data.payment.paidAt.toLocaleDateString()}

${data.notes}

${data.termsAndConditions}

=====================================
      ${data.hotel.name}
   ${data.hotel.address}
   ${data.hotel.phone}
   ${data.hotel.email}
=====================================
`

  // TODO: Replace with actual PDF generation
  return Buffer.from(invoiceText, 'utf-8')
}

/**
 * Save invoice to storage
 * 
 * TODO: Implement storage integration
 * Options:
 * 1. Local filesystem (for development)
 * 2. AWS S3 / Google Cloud Storage
 * 3. Cloudinary
 * 4. Vercel Blob Storage
 * 
 * @param pdfBuffer - PDF buffer
 * @param invoiceNumber - Invoice number
 * @returns Path or URL to saved invoice
 */
export async function saveInvoice(
  pdfBuffer: Buffer,
  invoiceNumber: string
): Promise<string> {
  // PLACEHOLDER: Return a mock path
  // In production, upload to storage and return URL
  
  // Example for local filesystem:
  // const fs = require('fs').promises
  // const path = require('path')
  // const filePath = path.join(process.cwd(), 'invoices', `${invoiceNumber}.pdf`)
  // await fs.writeFile(filePath, pdfBuffer)
  // return filePath
  
  // Example for S3:
  // const s3 = new AWS.S3()
  // const params = {
  //   Bucket: 'hotel-invoices',
  //   Key: `invoices/${invoiceNumber}.pdf`,
  //   Body: pdfBuffer,
  //   ContentType: 'application/pdf',
  // }
  // const result = await s3.upload(params).promise()
  // return result.Location
  
  return `/invoices/${invoiceNumber}.pdf`
}

/**
 * Generate and save invoice
 * Main function to call after successful payment
 * 
 * @param payment - Payment with relations
 * @returns Invoice path/URL
 */
export async function generateAndSaveInvoice(
  payment: PaymentWithRelations
): Promise<string> {
  try {
    console.log(`Generating invoice for payment ${payment.id}...`)
    
    // Generate PDF
    const pdfBuffer = await generateInvoicePDF(payment)
    
    // Generate invoice number
    const invoiceNumber = generateInvoiceNumber(payment.id)
    
    // Save to storage
    const invoicePath = await saveInvoice(pdfBuffer, invoiceNumber)
    
    console.log(`Invoice generated successfully: ${invoicePath}`)
    
    // Send email notification
    if (payment.booking?.user?.email) {
      const invoiceData = prepareInvoiceData(payment)
      await sendInvoiceEmail(
        payment.booking.user.email,
        invoicePath,
        invoiceData
      ).catch((err) => {
        console.error('Failed to send invoice email:', err)
        // Don't throw - email failure shouldn't block invoice generation
      })
    }
    
    return invoicePath
  } catch (error) {
    console.error('Error generating invoice:', error)
    throw new Error('Failed to generate invoice')
  }
}

/**
 * Send invoice email (STUB - Ready for SendGrid/Postmark integration)
 * 
 * TODO: Integrate email service provider:
 * 
 * SendGrid Example:
 * ```
 * import sgMail from '@sendgrid/mail'
 * sgMail.setApiKey(process.env.SENDGRID_API_KEY!)
 * await sgMail.send({
 *   to: email,
 *   from: 'noreply@hotelbooking.com',
 *   subject: `Invoice ${invoiceData.invoiceNumber}`,
 *   html: emailTemplate,
 *   attachments: [{ content: base64PDF, filename: 'invoice.pdf' }]
 * })
 * ```
 * 
 * Postmark Example:
 * ```
 * import { ServerClient } from 'postmark'
 * const client = new ServerClient(process.env.POSTMARK_API_KEY!)
 * await client.sendEmailWithTemplate({
 *   From: 'noreply@hotelbooking.com',
 *   To: email,
 *   TemplateId: 12345,
 *   TemplateModel: { invoiceNumber, ... },
 *   Attachments: [{ Name: 'invoice.pdf', Content: base64PDF }]
 * })
 * ```
 * 
 * @param email - Recipient email address
 * @param invoicePath - Path to generated invoice PDF
 * @param invoiceData - Invoice data for email template
 */
export async function sendInvoiceEmail(
  email: string,
  invoicePath: string,
  invoiceData: InvoiceData
): Promise<void> {
  console.log(`📧 [EMAIL STUB] Sending invoice to ${email}`)
  console.log(`   Invoice: ${invoiceData.invoiceNumber}`)
  console.log(`   Amount: ${formatCurrency(invoiceData.payment.amount, invoiceData.payment.currency)}`)
  console.log(`   Path: ${invoicePath}`)
  console.log(`   Guest: ${invoiceData.customer.name}`)
  console.log(`   Check-in: ${invoiceData.booking.checkIn.toISOString()}`)
  console.log(`   Check-out: ${invoiceData.booking.checkOut.toISOString()}`)
  
  // In production, replace this with actual email service call
  console.log('✅ [EMAIL STUB] Email logged (not sent - stub mode)')
}

// ==========================================
// HELPER FUNCTIONS
// ==========================================

/**
 * Format currency amount
 * 
 * @param amount - Amount in smallest unit (cents)
 * @param currency - Currency code
 * @returns Formatted string
 */
function formatCurrency(amount: number, currency: string): string {
  const zeroDecimalCurrencies = ['JPY', 'KRW', 'VND']
  const divisor = zeroDecimalCurrencies.includes(currency.toUpperCase()) ? 1 : 100
  
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency.toUpperCase(),
  }).format(amount / divisor)
}

// ==========================================
// EXPORTS
// ==========================================

export default {
  generateInvoicePDF,
  generateAndSaveInvoice,
  generateInvoiceNumber,
  prepareInvoiceData,
  saveInvoice,
  sendInvoiceEmail,
}
