/**
 * SuperAdmin Bulk Message Server Actions
 * 
 * Server-side operations for bulk communication via WhatsApp/Email.
 * Supports CSV upload, message templating, and mock message sending.
 * 
 * Operations:
 * - Parse CSV file
 * - Send bulk messages (WhatsApp/Email mock)
 * - Fetch campaign history
 */

'use server'

import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/prisma'
import {
  SendBulkMessagesRequest,
  SendBulkMessagesRequestSchema,
  BulkMessageResponse,
  FetchBulkMessagesQuery,
  FetchBulkMessagesQuerySchema,
  MessageSendResult,
  CsvRecipient,
  parseCsvContent,
  replacePlaceholders,
  validateSuperAdminRole,
} from '@/lib/validation/superadmin.validation'

// ==========================================
// MOCK MESSAGE PROVIDERS
// ==========================================

/**
 * Mock WhatsApp message sending
 * In production, integrate with Twilio WhatsApp API, WhatsApp Business API, etc.
 */
async function sendWhatsAppMessage(
  recipient: CsvRecipient,
  message: string
): Promise<MessageSendResult> {
  // Simulate API call delay
  await new Promise(resolve => setTimeout(resolve, Math.random() * 100 + 50))

  // Simulate 95% success rate
  const success = Math.random() > 0.05

  console.log(`[WhatsApp] ${success ? '✓' : '✗'} To: ${recipient.phone}`)
  console.log(`[WhatsApp] Message: ${message.substring(0, 100)}...`)

  return {
    name: recipient.name,
    phone: recipient.phone,
    email: recipient.email,
    status: success ? 'success' : 'failed',
    error: success ? undefined : 'Failed to send WhatsApp message',
    sentAt: success ? new Date() : undefined,
  }
}

/**
 * Mock Email sending
 * In production, integrate with SendGrid, Mailgun, AWS SES, etc.
 */
async function sendEmailMessage(
  recipient: CsvRecipient,
  message: string,
  subject: string
): Promise<MessageSendResult> {
  // Simulate API call delay
  await new Promise(resolve => setTimeout(resolve, Math.random() * 100 + 50))

  // Simulate 98% success rate (email more reliable than WhatsApp)
  const success = Math.random() > 0.02

  console.log(`[Email] ${success ? '✓' : '✗'} To: ${recipient.email}`)
  console.log(`[Email] Subject: ${subject}`)
  console.log(`[Email] Message: ${message.substring(0, 100)}...`)

  return {
    name: recipient.name,
    phone: recipient.phone,
    email: recipient.email,
    status: success ? 'success' : 'failed',
    error: success ? undefined : 'Failed to send email',
    sentAt: success ? new Date() : undefined,
  }
}

// ==========================================
// BULK MESSAGE ACTIONS
// ==========================================

/**
 * Parse CSV file content
 * Validates recipient data and returns parsed results
 * 
 * @param csvContent - Raw CSV file content as string
 * @returns Parsed CSV data with validation results
 */
export async function parseCsvFile(csvContent: string) {
  try {
    const result = parseCsvContent(csvContent)
    
    return {
      success: true,
      data: result,
    }
  } catch (error: any) {
    console.error('[parseCsvFile] Error:', error)
    return {
      success: false,
      error: error.message || 'Failed to parse CSV file',
    }
  }
}

/**
 * Send bulk messages via WhatsApp or Email
 * Creates campaign record and sends messages with progress tracking
 * 
 * @param request - Bulk message request with recipients and template
 * @returns Campaign results with send statistics
 */
export async function sendBulkMessages(
  request: SendBulkMessagesRequest
): Promise<BulkMessageResponse> {
  try {
    // Validate request
    const validation = SendBulkMessagesRequestSchema.safeParse(request)
    if (!validation.success) {
      return {
        success: false,
        error: validation.error.issues[0]?.message || 'Validation failed',
      }
    }

    const { adminId, title, messageContent, channel, recipients } = validation.data

    // Verify SuperAdmin permission
    const admin = await prisma.user.findUnique({
      where: { id: adminId },
      include: { role: true },
    })

    if (!admin || !validateSuperAdminRole(admin.role.name)) {
      return {
        success: false,
        error: 'Unauthorized: SuperAdmin permission required',
      }
    }

    // Create campaign record
    const campaign = await prisma.bulkMessage.create({
      data: {
        adminId,
        title,
        messageContent,
        channel,
        totalRecipients: recipients.length,
        sentCount: 0,
        failedCount: 0,
        status: 'processing',
        recipientsData: JSON.stringify(recipients),
        startedAt: new Date(),
      },
    })

    console.log(`\n=== Bulk Message Campaign Started ===`)
    console.log(`Campaign ID: ${campaign.id}`)
    console.log(`Title: ${title}`)
    console.log(`Channel: ${channel}`)
    console.log(`Recipients: ${recipients.length}`)
    console.log(`====================================\n`)

    // Send messages in batches
    const results: MessageSendResult[] = []
    const batchSize = 10 // Process 10 messages at a time
    
    for (let i = 0; i < recipients.length; i += batchSize) {
      const batch = recipients.slice(i, i + batchSize)
      
      const batchResults = await Promise.all(
        batch.map(async (recipient) => {
          // Replace placeholders in message
          const personalizedMessage = replacePlaceholders(messageContent, recipient)
          
          // Send message via appropriate channel
          if (channel === 'whatsapp') {
            return sendWhatsAppMessage(recipient, personalizedMessage)
          } else {
            return sendEmailMessage(recipient, personalizedMessage, title)
          }
        })
      )

      results.push(...batchResults)

      // Update campaign progress
      const sentCount = results.filter(r => r.status === 'success').length
      const failedCount = results.filter(r => r.status === 'failed').length

      await prisma.bulkMessage.update({
        where: { id: campaign.id },
        data: {
          sentCount,
          failedCount,
        },
      })
    }

    // Calculate final statistics
    const sentCount = results.filter(r => r.status === 'success').length
    const failedCount = results.filter(r => r.status === 'failed').length

    // Update campaign with final results
    await prisma.bulkMessage.update({
      where: { id: campaign.id },
      data: {
        sentCount,
        failedCount,
        status: 'completed',
        recipientsData: JSON.stringify(results),
        completedAt: new Date(),
      },
    })

    console.log(`\n=== Campaign Completed ===`)
    console.log(`Campaign ID: ${campaign.id}`)
    console.log(`Total: ${recipients.length}`)
    console.log(`Sent: ${sentCount} (${((sentCount / recipients.length) * 100).toFixed(1)}%)`)
    console.log(`Failed: ${failedCount} (${((failedCount / recipients.length) * 100).toFixed(1)}%)`)
    console.log(`===========================\n`)

    // Revalidate paths
    revalidatePath('/dashboard/superadmin')
    revalidatePath('/api/superadmin/bulk-campaigns')

    return {
      success: true,
      message: `Bulk message campaign completed: ${sentCount} sent, ${failedCount} failed`,
      campaignId: campaign.id,
      totalRecipients: recipients.length,
      sentCount,
      failedCount,
      results,
    }
  } catch (error) {
    console.error('[sendBulkMessages] Error:', error)
    return {
      success: false,
      error: 'Failed to send bulk messages',
    }
  }
}

/**
 * Fetch bulk message campaign history
 * Supports filtering by admin, channel, status, date range
 * 
 * @param query - Optional filters and pagination
 * @returns Array of campaigns with metadata
 */
export async function fetchBulkCampaigns(
  query: Partial<FetchBulkMessagesQuery> = {}
): Promise<{ campaigns: any[]; total: number }> {
  try {
    // Validate query
    const validation = FetchBulkMessagesQuerySchema.safeParse(query)
    if (!validation.success) {
      throw new Error(validation.error.issues[0]?.message || 'Validation failed')
    }

    const { adminId, channel, status, startDate, endDate, page, limit } = validation.data

    // Build where clause
    const where: any = {}

    if (adminId) where.adminId = adminId
    if (channel) where.channel = channel
    if (status) where.status = status

    if (startDate || endDate) {
      where.createdAt = {}
      if (startDate) where.createdAt.gte = new Date(startDate)
      if (endDate) where.createdAt.lte = new Date(endDate)
    }

    // Fetch campaigns with pagination
    const [campaigns, total] = await Promise.all([
      prisma.bulkMessage.findMany({
        where,
        include: {
          admin: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.bulkMessage.count({ where }),
    ])

    return {
      campaigns: campaigns.map(c => ({
        id: c.id,
        title: c.title,
        messageContent: c.messageContent,
        channel: c.channel,
        totalRecipients: c.totalRecipients,
        sentCount: c.sentCount,
        failedCount: c.failedCount,
        status: c.status,
        admin: c.admin,
        createdAt: c.createdAt.toISOString(),
        startedAt: c.startedAt?.toISOString(),
        completedAt: c.completedAt?.toISOString(),
      })),
      total,
    }
  } catch (error) {
    console.error('[fetchBulkCampaigns] Error:', error)
    throw new Error('Failed to fetch bulk campaigns')
  }
}

/**
 * Get campaign details with individual message results
 * 
 * @param campaignId - Campaign ID
 * @returns Campaign details with message results
 */
export async function getCampaignDetails(campaignId: string) {
  try {
    const campaign = await prisma.bulkMessage.findUnique({
      where: { id: campaignId },
      include: {
        admin: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    })

    if (!campaign) {
      return {
        success: false,
        error: 'Campaign not found',
      }
    }

    // Parse recipients data
    let results: MessageSendResult[] = []
    try {
      results = JSON.parse(campaign.recipientsData)
    } catch (error) {
      console.error('[getCampaignDetails] Failed to parse recipients data:', error)
    }

    return {
      success: true,
      campaign: {
        id: campaign.id,
        title: campaign.title,
        messageContent: campaign.messageContent,
        channel: campaign.channel,
        totalRecipients: campaign.totalRecipients,
        sentCount: campaign.sentCount,
        failedCount: campaign.failedCount,
        status: campaign.status,
        admin: campaign.admin,
        results,
        createdAt: campaign.createdAt.toISOString(),
        startedAt: campaign.startedAt?.toISOString(),
        completedAt: campaign.completedAt?.toISOString(),
      },
    }
  } catch (error) {
    console.error('[getCampaignDetails] Error:', error)
    return {
      success: false,
      error: 'Failed to fetch campaign details',
    }
  }
}
