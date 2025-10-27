// ==========================================
// NOTIFICATION SYSTEM (MOCK STUBS)
// ==========================================
// WhatsApp and Email notification stubs for Day 11
// These are placeholders that log to console
// Ready for integration with Twilio, WhatsApp Business API, SendGrid, etc.

import { format } from 'date-fns'

// ==========================================
// TYPES
// ==========================================

export interface NotificationResult {
  success: boolean
  provider: 'whatsapp' | 'email'
  recipient: string
  message?: string
  error?: string
}

export interface WhatsAppMessageParams {
  to: string // Phone number with country code (e.g., +919876543210)
  message: string
  templateName?: string
}

export interface EmailMessageParams {
  to: string // Email address
  subject: string
  message: string // Plain text or HTML
  from?: string
  cc?: string[]
  bcc?: string[]
}

export interface BookingConfirmationData {
  customerName: string
  customerPhone: string
  customerEmail: string | null
  hotelName: string
  roomType: string
  startDate: Date
  endDate: Date
  bookingId: string
  totalAmount: number
  currency: string
}

// ==========================================
// WHATSAPP NOTIFICATION (MOCK)
// ==========================================

/**
 * Send WhatsApp message (MOCK)
 * 
 * In production, integrate with:
 * - Twilio WhatsApp API: https://www.twilio.com/whatsapp
 * - WhatsApp Business API: https://business.whatsapp.com/
 * - Gupshup: https://www.gupshup.io/
 * - Interakt: https://www.interakt.shop/
 * 
 * @param params WhatsApp message parameters
 * @returns Result with mock success
 */
export async function sendWhatsAppMessage(
  params: WhatsAppMessageParams
): Promise<NotificationResult> {
  const { to, message, templateName } = params

  try {
    // ==========================================
    // MOCK IMPLEMENTATION
    // ==========================================
    console.log('\n📱 ===== WhatsApp Message (MOCK) =====')
    console.log(`📞 To: ${to}`)
    console.log(`📋 Template: ${templateName || 'custom'}`)
    console.log(`💬 Message:\n${message}`)
    console.log('✅ WhatsApp sent (mock)')
    console.log('=====================================\n')

    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 100))

    // ==========================================
    // TODO: PRODUCTION IMPLEMENTATION
    // ==========================================
    // Example with Twilio:
    /*
    const accountSid = process.env.TWILIO_ACCOUNT_SID
    const authToken = process.env.TWILIO_AUTH_TOKEN
    const client = require('twilio')(accountSid, authToken)
    
    const result = await client.messages.create({
      from: 'whatsapp:+14155238886',
      to: `whatsapp:${to}`,
      body: message
    })
    
    return {
      success: true,
      provider: 'whatsapp',
      recipient: to,
      message: `Message sent with SID: ${result.sid}`
    }
    */

    return {
      success: true,
      provider: 'whatsapp',
      recipient: to,
      message: 'WhatsApp message sent successfully (mock)',
    }
  } catch (error) {
    console.error('❌ Error sending WhatsApp:', error)
    return {
      success: false,
      provider: 'whatsapp',
      recipient: to,
      error: error instanceof Error ? error.message : 'Failed to send WhatsApp',
    }
  }
}

// ==========================================
// EMAIL NOTIFICATION (MOCK)
// ==========================================

/**
 * Send Email (MOCK)
 * 
 * In production, integrate with:
 * - SendGrid: https://sendgrid.com/
 * - Resend: https://resend.com/
 * - AWS SES: https://aws.amazon.com/ses/
 * - Mailgun: https://www.mailgun.com/
 * - Nodemailer: https://nodemailer.com/
 * 
 * @param params Email message parameters
 * @returns Result with mock success
 */
export async function sendEmail(
  params: EmailMessageParams
): Promise<NotificationResult> {
  const { to, subject, message, from, cc, bcc } = params

  try {
    // ==========================================
    // MOCK IMPLEMENTATION
    // ==========================================
    console.log('\n📧 ===== Email Message (MOCK) =====')
    console.log(`📧 To: ${to}`)
    console.log(`📤 From: ${from || 'noreply@hotel-booking.com'}`)
    if (cc?.length) console.log(`📋 CC: ${cc.join(', ')}`)
    if (bcc?.length) console.log(`📋 BCC: ${bcc.join(', ')}`)
    console.log(`📌 Subject: ${subject}`)
    console.log(`📝 Message:\n${message}`)
    console.log('✅ Email sent (mock)')
    console.log('===================================\n')

    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 100))

    // ==========================================
    // TODO: PRODUCTION IMPLEMENTATION
    // ==========================================
    // Example with Resend:
    /*
    import { Resend } from 'resend'
    const resend = new Resend(process.env.RESEND_API_KEY)
    
    const result = await resend.emails.send({
      from: from || 'noreply@hotel-booking.com',
      to: [to],
      subject: subject,
      html: message,
    })
    
    return {
      success: true,
      provider: 'email',
      recipient: to,
      message: `Email sent with ID: ${result.id}`
    }
    */

    return {
      success: true,
      provider: 'email',
      recipient: to,
      message: 'Email sent successfully (mock)',
    }
  } catch (error) {
    console.error('❌ Error sending email:', error)
    return {
      success: false,
      provider: 'email',
      recipient: to,
      error: error instanceof Error ? error.message : 'Failed to send email',
    }
  }
}

// ==========================================
// MESSAGE TEMPLATES
// ==========================================

/**
 * Generate WhatsApp booking confirmation message
 */
export function generateWhatsAppBookingConfirmation(
  data: BookingConfirmationData
): string {
  const { customerName, hotelName, roomType, startDate, endDate, bookingId, totalAmount, currency } = data

  const checkIn = format(startDate, 'dd MMM yyyy')
  const checkOut = format(endDate, 'dd MMM yyyy')
  const amount = (totalAmount / 100).toFixed(2)

  return `✅ Hi ${customerName},

Your booking at ${hotelName} is confirmed!

🏨 Room: ${roomType}
📅 Check-in: ${checkIn}
📅 Check-out: ${checkOut}
💰 Amount Paid: ${currency} ${amount}
🔖 Booking ID: ${bookingId}

We look forward to welcoming you!

Thank you for choosing ${hotelName}! 🙏`
}

/**
 * Generate email booking confirmation (plain text)
 */
export function generateEmailBookingConfirmation(
  data: BookingConfirmationData
): { subject: string; body: string } {
  const { customerName, hotelName, roomType, startDate, endDate, bookingId, totalAmount, currency } = data

  const checkIn = format(startDate, 'dd MMM yyyy')
  const checkOut = format(endDate, 'dd MMM yyyy')
  const amount = (totalAmount / 100).toFixed(2)

  const subject = `Booking Confirmation — ${hotelName} | ${bookingId}`

  const body = `Dear ${customerName},

Thank you for choosing ${hotelName}! We are pleased to confirm your booking.

BOOKING DETAILS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Booking ID: ${bookingId}
Room Type: ${roomType}
Check-in: ${checkIn} at 2:00 PM
Check-out: ${checkOut} at 11:00 AM
Amount Paid: ${currency} ${amount}

IMPORTANT INFORMATION
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✓ Please bring a valid government-issued ID for check-in
✓ Early check-in is subject to availability
✓ Late check-out can be arranged with the front desk
✓ Cancellation policy applies as per booking terms

CONTACT INFORMATION
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Phone: +91 1234567890
Email: reservations@hotel-booking.com
Address: ${hotelName}, Location

We look forward to welcoming you!

Best regards,
${hotelName} Team

---
This is an automated confirmation email. Please do not reply to this email.
For any queries, contact us at reservations@hotel-booking.com`

  return { subject, body }
}

/**
 * Generate HTML email booking confirmation
 * For production, use proper email templates
 */
export function generateEmailBookingConfirmationHTML(
  data: BookingConfirmationData
): { subject: string; html: string } {
  const { customerName, hotelName, roomType, startDate, endDate, bookingId, totalAmount, currency } = data

  const checkIn = format(startDate, 'dd MMM yyyy')
  const checkOut = format(endDate, 'dd MMM yyyy')
  const amount = (totalAmount / 100).toFixed(2)

  const subject = `Booking Confirmation — ${hotelName} | ${bookingId}`

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Booking Confirmation</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
    <h1 style="margin: 0; font-size: 28px;">✅ Booking Confirmed!</h1>
    <p style="margin: 10px 0 0 0; font-size: 16px;">${hotelName}</p>
  </div>
  
  <div style="background: #f9f9f9; padding: 30px; border: 1px solid #ddd; border-top: none;">
    <p style="font-size: 16px; margin-top: 0;">Dear <strong>${customerName}</strong>,</p>
    
    <p>Thank you for choosing ${hotelName}! We are pleased to confirm your booking.</p>
    
    <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #667eea;">
      <h2 style="margin-top: 0; color: #667eea; font-size: 18px;">Booking Details</h2>
      <table style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="padding: 8px 0; font-weight: bold;">Booking ID:</td>
          <td style="padding: 8px 0;">${bookingId}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; font-weight: bold;">Room Type:</td>
          <td style="padding: 8px 0;">${roomType}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; font-weight: bold;">Check-in:</td>
          <td style="padding: 8px 0;">${checkIn} at 2:00 PM</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; font-weight: bold;">Check-out:</td>
          <td style="padding: 8px 0;">${checkOut} at 11:00 AM</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; font-weight: bold;">Amount Paid:</td>
          <td style="padding: 8px 0; color: #22c55e; font-weight: bold;">${currency} ${amount}</td>
        </tr>
      </table>
    </div>
    
    <div style="background: #fffbeb; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #f59e0b;">
      <h3 style="margin-top: 0; color: #f59e0b; font-size: 16px;">Important Information</h3>
      <ul style="margin: 0; padding-left: 20px;">
        <li>Please bring a valid government-issued ID for check-in</li>
        <li>Early check-in is subject to availability</li>
        <li>Late check-out can be arranged with the front desk</li>
        <li>Cancellation policy applies as per booking terms</li>
      </ul>
    </div>
    
    <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
      <h3 style="margin-top: 0; color: #667eea; font-size: 16px;">Contact Information</h3>
      <p style="margin: 5px 0;">📞 Phone: +91 1234567890</p>
      <p style="margin: 5px 0;">📧 Email: reservations@hotel-booking.com</p>
      <p style="margin: 5px 0;">📍 Address: ${hotelName}, Location</p>
    </div>
    
    <p style="text-align: center; margin-top: 30px;">We look forward to welcoming you!</p>
    <p style="text-align: center; font-weight: bold; color: #667eea;">Best regards,<br>${hotelName} Team</p>
  </div>
  
  <div style="background: #f3f4f6; padding: 20px; text-align: center; font-size: 12px; color: #666; border-radius: 0 0 10px 10px;">
    <p style="margin: 5px 0;">This is an automated confirmation email.</p>
    <p style="margin: 5px 0;">For any queries, contact us at reservations@hotel-booking.com</p>
  </div>
</body>
</html>
  `

  return { subject, html }
}

// ==========================================
// COMBINED NOTIFICATION SENDER
// ==========================================

/**
 * Send both WhatsApp and Email notifications for booking confirmation
 * 
 * @param data Booking confirmation data
 * @returns Results for both notifications
 */
export async function sendBookingConfirmationNotifications(
  data: BookingConfirmationData
): Promise<{
  whatsapp: NotificationResult
  email: NotificationResult
}> {
  console.log('\n🔔 Sending booking confirmation notifications...')

  // Generate messages
  const whatsappMessage = generateWhatsAppBookingConfirmation(data)
  const emailData = generateEmailBookingConfirmationHTML(data)

  // Send notifications in parallel
  const [whatsappResult, emailResult] = await Promise.all([
    sendWhatsAppMessage({
      to: data.customerPhone,
      message: whatsappMessage,
      templateName: 'booking_confirmation',
    }),
    data.customerEmail
      ? sendEmail({
          to: data.customerEmail,
          subject: emailData.subject,
          message: emailData.html,
          from: 'noreply@hotel-booking.com',
        })
      : Promise.resolve({
          success: false,
          provider: 'email' as const,
          recipient: '',
          error: 'No email address provided',
        }),
  ])

  console.log('✅ Notification sending completed\n')

  return {
    whatsapp: whatsappResult,
    email: emailResult,
  }
}

// ==========================================
// EXPORTS
// ==========================================

export default {
  sendWhatsAppMessage,
  sendEmail,
  generateWhatsAppBookingConfirmation,
  generateEmailBookingConfirmation,
  generateEmailBookingConfirmationHTML,
  sendBookingConfirmationNotifications,
}
