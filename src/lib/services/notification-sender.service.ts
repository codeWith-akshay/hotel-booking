/**
 * Notification Sender Service
 * Handles sending notifications via Email (NodeMailer) and WhatsApp (Twilio)
 */

import nodemailer from 'nodemailer'
import twilio from 'twilio'
import { prisma } from '@/lib/prisma'
import { NotificationChannel, NotificationStatus } from '@prisma/client'

// ==========================================
// CONFIGURATION
// ==========================================

// Email configuration
const emailTransporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

// Twilio configuration
const twilioClient = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
)

// ==========================================
// EMAIL SENDING
// ==========================================

/**
 * Send email notification
 */
export async function sendEmail(
  to: string,
  subject: string,
  html: string,
  text?: string
): Promise<{ success: boolean; error?: string; messageId?: string }> {
  try {
    if (!process.env.SMTP_USER) {
      console.warn('[sendEmail] SMTP not configured, skipping email send')
      return { success: true } // Mock success for development
    }

    const info = await emailTransporter.sendMail({
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to,
      subject,
      text,
      html,
    })

    console.log(`[sendEmail] Email sent: ${info.messageId}`)
    return { success: true, messageId: info.messageId }
  } catch (error) {
    console.error('[sendEmail] Error:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
  }
}

// ==========================================
// WHATSAPP SENDING
// ==========================================

/**
 * Send WhatsApp message
 */
export async function sendWhatsApp(
  to: string,
  message: string
): Promise<{ success: boolean; error?: string; messageSid?: string }> {
  try {
    if (!process.env.TWILIO_ACCOUNT_SID) {
      console.warn('[sendWhatsApp] Twilio not configured, skipping WhatsApp send')
      return { success: true } // Mock success for development
    }

    // Ensure phone number is in E.164 format
    const formattedTo = to.startsWith('+') ? to : `+${to}`

    const twilioMessage = await twilioClient.messages.create({
      from: `whatsapp:${process.env.TWILIO_WHATSAPP_NUMBER}`,
      to: `whatsapp:${formattedTo}`,
      body: message,
    })

    console.log(`[sendWhatsApp] WhatsApp sent: ${twilioMessage.sid}`)
    return { success: true, messageSid: twilioMessage.sid }
  } catch (error) {
    console.error('[sendWhatsApp] Error:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
  }
}

// ==========================================
// NOTIFICATION SENDING
// ==========================================

/**
 * Send notification via specified channel
 */
export async function sendNotification(
  notificationId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // Get notification details
    const notification = await prisma.notification.findUnique({
      where: { id: notificationId },
      include: { user: true },
    })

    if (!notification) {
      return { success: false, error: 'Notification not found' }
    }

    if (notification.status !== 'PENDING') {
      return { success: false, error: 'Notification already processed' }
    }

    // Get user contact info
    const user = notification.user
    let contact: string | null = null

    if (notification.channel === 'EMAIL') {
      contact = user.email
    } else if (notification.channel === 'WHATSAPP') {
      contact = user.phone
    }

    if (!contact) {
      await prisma.notification.update({
        where: { id: notificationId },
        data: { status: 'FAILED' },
      })
      return { success: false, error: 'No contact information available' }
    }

    // Send via appropriate channel
    let sendResult: { success: boolean; error?: string }

    if (notification.channel === 'EMAIL') {
      sendResult = await sendEmail(
        contact,
        notification.subject || 'Notification',
        notification.message,
        notification.message // Use message as text fallback
      )
    } else if (notification.channel === 'WHATSAPP') {
      sendResult = await sendWhatsApp(contact, notification.message)
    } else {
      // IN_APP or SMS - mark as sent immediately
      sendResult = { success: true }
    }

    // Update notification status
    const newStatus: NotificationStatus = sendResult.success ? 'SENT' : 'FAILED'
    const updateData: any = {
      status: newStatus,
    }

    if (sendResult.success) {
      updateData.sentAt = new Date()
    } else {
      updateData.errorMessage = sendResult.error
    }

    await prisma.notification.update({
      where: { id: notificationId },
      data: updateData,
    })

    return { success: sendResult.success, error: sendResult.error }
  } catch (error) {
    console.error('[sendNotification] Error:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
  }
}

// ==========================================
// BATCH SENDING
// ==========================================

/**
 * Send pending notifications in batches
 */
export async function sendPendingNotifications(batchSize: number = 10): Promise<{
  processed: number
  sent: number
  failed: number
}> {
  try {
    // Get pending notifications
    const pendingNotifications = await prisma.notification.findMany({
      where: { status: 'PENDING' },
      take: batchSize,
      orderBy: { createdAt: 'asc' },
    })

    let sent = 0
    let failed = 0

    for (const notification of pendingNotifications) {
      const result = await sendNotification(notification.id)
      if (result.success) {
        sent++
      } else {
        failed++
      }
    }

    return {
      processed: pendingNotifications.length,
      sent,
      failed,
    }
  } catch (error) {
    console.error('[sendPendingNotifications] Error:', error)
    return { processed: 0, sent: 0, failed: 0 }
  }
}