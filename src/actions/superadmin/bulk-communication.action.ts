// ==========================================
// BULK COMMUNICATION ACTIONS (SuperAdmin)
// ==========================================
// Server actions for sending WhatsApp/Email to all users or filtered groups

'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { createAuditLog } from '@/lib/services/audit.service'
import { AuditAction, AuditTargetType } from '@/lib/services/audit.service'
import { GuestType, RoleName } from '@prisma/client'

// ==========================================
// TYPES
// ==========================================

export interface CommunicationFilters {
  role?: RoleName[]
  guestType?: GuestType[]
  hasBookings?: boolean
  activeUsers?: boolean // Active in last 30 days
  emailVerified?: boolean
}

export interface CommunicationMessage {
  subject?: string // For email
  message: string
  channel: 'email' | 'whatsapp' | 'both'
  template?: string // Predefined template name
}

export interface ActionResult<T = void> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

export interface CommunicationResult {
  totalRecipients: number
  successCount: number
  failureCount: number
  recipients: {
    id: string
    name: string
    email?: string | null
    phone: string
    status: 'success' | 'failed'
    error?: string
  }[]
}

// ==========================================
// MESSAGE TEMPLATES
// ==========================================

export const MESSAGE_TEMPLATES = {
  welcome: {
    subject: 'Welcome to Our Hotel!',
    message: 'Hello {name}, welcome to our hotel family! We\'re excited to have you with us.',
  },
  booking_reminder: {
    subject: 'Booking Reminder',
    message: 'Hi {name}, this is a reminder about your upcoming booking. We look forward to seeing you!',
  },
  special_offer: {
    subject: 'Exclusive Offer Just for You!',
    message: 'Dear {name}, we have a special offer exclusively for our valued guests. Book now and save up to 30%!',
  },
  system_update: {
    subject: 'Important System Update',
    message: 'Hello {name}, we\'ve made some updates to our booking system to serve you better.',
  },
  feedback_request: {
    subject: 'We Value Your Feedback',
    message: 'Hi {name}, we hope you enjoyed your stay! Please share your feedback to help us improve.',
  },
  maintenance_notice: {
    subject: 'Scheduled Maintenance Notice',
    message: 'Dear {name}, please be informed of scheduled maintenance on {date}. Service may be temporarily affected.',
  },
}

// ==========================================
// GET USERS BY FILTERS
// ==========================================

export async function getUsersByFilters(
  filters?: CommunicationFilters
): Promise<ActionResult<{ id: string; name: string; email: string | null; phone: string; role: RoleName }[]>> {
  try {
    const where: any = {}

    // Role filter
    if (filters?.role && filters.role.length > 0) {
      where.role = {
        name: {
          in: filters.role,
        },
      }
    }

    // Active users (logged in within last 30 days)
    if (filters?.activeUsers) {
      const thirtyDaysAgo = new Date()
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
      
      where.updatedAt = {
        gte: thirtyDaysAgo,
      }
    }

    // Email verified filter
    if (filters?.emailVerified !== undefined) {
      where.emailVerified = filters.emailVerified
    }

    const users = await prisma.user.findMany({
      where,
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: {
          select: {
            name: true,
          },
        },
      },
    })

    // Apply post-query filters
    let filteredUsers = users

    // Filter by guest type (requires joining with bookings)
    if (filters?.guestType && filters.guestType.length > 0) {
      const usersWithBookings = await prisma.booking.findMany({
        where: {
          userId: {
            in: users.map(u => u.id),
          },
          // Note: guestType is not directly on Booking model in current schema
          // This would need to be added or inferred from user data
        },
        select: {
          userId: true,
        },
        distinct: ['userId'],
      })

      const userIdsWithBookings = new Set(usersWithBookings.map(b => b.userId))
      filteredUsers = filteredUsers.filter(u => userIdsWithBookings.has(u.id))
    }

    // Filter by has bookings
    if (filters?.hasBookings !== undefined) {
      const usersWithBookings = await prisma.booking.findMany({
        select: {
          userId: true,
        },
        distinct: ['userId'],
      })

      const userIdsWithBookings = new Set(usersWithBookings.map(b => b.userId))
      
      if (filters.hasBookings) {
        filteredUsers = filteredUsers.filter(u => userIdsWithBookings.has(u.id))
      } else {
        filteredUsers = filteredUsers.filter(u => !userIdsWithBookings.has(u.id))
      }
    }

    return {
      success: true,
      data: filteredUsers.map(u => ({
        id: u.id,
        name: u.name || 'User',
        email: u.email,
        phone: u.phone,
        role: u.role.name,
      })),
    }
  } catch (error) {
    console.error('Error fetching users by filters:', error)
    return {
      success: false,
      error: 'Failed to fetch users',
    }
  }
}

// ==========================================
// SEND BULK COMMUNICATION
// ==========================================

export async function sendBulkCommunication(
  message: CommunicationMessage,
  filters: CommunicationFilters,
  adminId?: string
): Promise<ActionResult<CommunicationResult>> {
  try {
    // Get recipients
    const usersResult = await getUsersByFilters(filters)
    
    if (!usersResult.success || !usersResult.data) {
      return {
        success: false,
        error: 'Failed to fetch recipients',
      }
    }

    const users = usersResult.data

    if (users.length === 0) {
      return {
        success: false,
        error: 'No users match the specified filters',
      }
    }

    // Apply template if specified
    let finalMessage = message.message
    let finalSubject = message.subject || 'Message from Hotel Management'

    if (message.template && MESSAGE_TEMPLATES[message.template as keyof typeof MESSAGE_TEMPLATES]) {
      const template = MESSAGE_TEMPLATES[message.template as keyof typeof MESSAGE_TEMPLATES]
      finalSubject = message.subject || template.subject
      finalMessage = message.message || template.message
    }

    // Simulate sending messages (in production, integrate with actual services)
    const results = await Promise.allSettled(
      users.map(async (user) => {
        try {
          // Personalize message
          const personalizedMessage = finalMessage
            .replace('{name}', user.name)
            .replace('{email}', user.email || 'N/A')
            .replace('{phone}', user.phone)
            .replace('{date}', new Date().toLocaleDateString())

          const personalizedSubject = finalSubject
            .replace('{name}', user.name)

          // Send via selected channels
          if (message.channel === 'email' || message.channel === 'both') {
            if (!user.email) {
              throw new Error('No email address')
            }
            // TODO: Integrate with email service (SendGrid, AWS SES, etc.)
            console.log(`📧 Sending email to ${user.email}:`, personalizedSubject)
            await simulateEmailSend(user.email, personalizedSubject, personalizedMessage)
          }

          if (message.channel === 'whatsapp' || message.channel === 'both') {
            if (!user.phone) {
              throw new Error('No phone number')
            }
            // TODO: Integrate with WhatsApp API (Twilio, WhatsApp Business API)
            console.log(`📱 Sending WhatsApp to ${user.phone}:`, personalizedMessage)
            await simulateWhatsAppSend(user.phone, personalizedMessage)
          }

          return {
            id: user.id,
            name: user.name,
            email: user.email,
            phone: user.phone,
            status: 'success' as const,
          }
        } catch (error) {
          return {
            id: user.id,
            name: user.name,
            email: user.email,
            phone: user.phone,
            status: 'failed' as const,
            error: error instanceof Error ? error.message : 'Unknown error',
          }
        }
      })
    )

    const recipients = results.map(r => r.status === 'fulfilled' ? r.value : r.reason)
    const successCount = recipients.filter(r => r.status === 'success').length
    const failureCount = recipients.filter(r => r.status === 'failed').length

    const communicationResult: CommunicationResult = {
      totalRecipients: users.length,
      successCount,
      failureCount,
      recipients,
    }

    // Audit logging
    if (adminId) {
      await createAuditLog({
        adminId,
        adminRole: 'SUPERADMIN',
        action: AuditAction.NOTIFICATION_BROADCAST,
        targetType: AuditTargetType.NOTIFICATION,
        targetId: 'bulk-communication',
        changes: {
          before: null,
          after: communicationResult,
        },
        reason: `Sent bulk communication to ${users.length} users via ${message.channel}`,
        metadata: {
          channel: message.channel,
          template: message.template,
          filters,
          totalRecipients: users.length,
          successCount,
          failureCount,
        },
      })
    }

    // Revalidate relevant pages
    revalidatePath('/superadmin/dashboard')

    return {
      success: true,
      data: communicationResult,
      message: `Communication sent successfully to ${successCount}/${users.length} recipients`,
    }
  } catch (error) {
    console.error('Error sending bulk communication:', error)
    return {
      success: false,
      error: 'Failed to send bulk communication',
    }
  }
}

// ==========================================
// PREVIEW RECIPIENTS
// ==========================================

export async function previewRecipients(
  filters: CommunicationFilters
): Promise<ActionResult<{
  totalCount: number
  users: { id: string; name: string; email: string | null; phone: string; role: RoleName }[]
}>> {
  try {
    const result = await getUsersByFilters(filters)

    if (!result.success || !result.data) {
      return {
        success: false,
        error: 'Failed to preview recipients',
      }
    }

    return {
      success: true,
      data: {
        totalCount: result.data.length,
        users: result.data.slice(0, 10), // Show first 10 for preview
      },
    }
  } catch (error) {
    console.error('Error previewing recipients:', error)
    return {
      success: false,
      error: 'Failed to preview recipients',
    }
  }
}

// ==========================================
// SIMULATION HELPERS (Replace with real implementations)
// ==========================================

async function simulateEmailSend(
  to: string,
  subject: string,
  message: string
): Promise<void> {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 100))
  
  // In production, use actual email service:
  // await sendGrid.send({ to, subject, text: message })
  // await ses.sendEmail({ to, subject, message })
  
  console.log(`✅ Email sent to ${to}`)
}

async function simulateWhatsAppSend(
  to: string,
  message: string
): Promise<void> {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 100))
  
  // In production, use actual WhatsApp service:
  // await twilio.messages.create({ to, body: message })
  // await whatsappBusinessAPI.send({ to, message })
  
  console.log(`✅ WhatsApp sent to ${to}`)
}

// ==========================================
// GET COMMUNICATION STATISTICS
// ==========================================

export async function getCommunicationStats(): Promise<ActionResult<{
  totalUsers: number
  usersWithEmail: number
  usersWithPhone: number
  activeUsers: number
  usersByRole: { role: RoleName; count: number }[]
}>> {
  try {
    const [
      totalUsers,
      usersWithEmail,
      usersWithPhone,
      usersByRole,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { email: { not: '' } } }),
      prisma.user.count(), // All users have phone (it's required)
      prisma.user.groupBy({
        by: ['roleId'],
        _count: true,
      }),
    ])

    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
    
    const activeUsers = await prisma.user.count({
      where: {
        updatedAt: {
          gte: thirtyDaysAgo,
        },
      },
    })

    // Get role names
    const roles = await prisma.role.findMany({
      select: {
        id: true,
        name: true,
      },
    })

    const roleMap = new Map(roles.map(r => [r.id, r.name]))

    return {
      success: true,
      data: {
        totalUsers,
        usersWithEmail,
        usersWithPhone,
        activeUsers,
        usersByRole: usersByRole.map(r => ({
          role: roleMap.get(r.roleId) || 'UNKNOWN' as RoleName,
          count: r._count,
        })),
      },
    }
  } catch (error) {
    console.error('Error fetching communication stats:', error)
    return {
      success: false,
      error: 'Failed to fetch communication statistics',
    }
  }
}
