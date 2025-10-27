// ==========================================
// AUDIT LOGGING - Admin Actions & Security Events
// ==========================================
// Production-ready audit logging for compliance and security
//
// Features:
// - Admin action tracking
// - Security event logging
// - Structured logging format
// - Integration with SIEM systems (extensible)
// - Compliance-ready (SOC2, HIPAA, GDPR)
//
// Usage:
// - Call `logAdminAction()` for admin overrides
// - Call `logSecurityEvent()` for security incidents
// - Query logs for audit reports
//
// @see docs/ADMIN_AUDIT_LOGS.md

import { prisma } from '@/lib/prisma'

// ==========================================
// TYPE DEFINITIONS
// ==========================================

/**
 * Admin action types
 */
export type AdminActionType =
  | 'OVERRIDE_CONFIRM'
  | 'OVERRIDE_CANCEL'
  | 'FORCE_DELETE'
  | 'FORCE_UPDATE'
  | 'PERMISSION_GRANT'
  | 'PERMISSION_REVOKE'
  | 'USER_IMPERSONATE'
  | 'DATA_EXPORT'
  | 'SYSTEM_CONFIG_CHANGE'
  | 'MANUAL_REFUND'
  | 'FORCE_CHECKOUT'

/**
 * Target resource types
 */
export type TargetType = 'BOOKING' | 'USER' | 'ROOM' | 'PAYMENT' | 'SYSTEM' | 'INVOICE' | 'WAITLIST'

/**
 * Security event types
 */
export type SecurityEventType =
  | 'OTP_REQUEST'
  | 'OTP_VERIFY_SUCCESS'
  | 'OTP_VERIFY_FAILED'
  | 'RATE_LIMIT_EXCEEDED'
  | 'CSRF_VIOLATION'
  | 'RBAC_VIOLATION'
  | 'INVALID_TOKEN'
  | 'SUSPICIOUS_ACTIVITY'
  | 'BRUTE_FORCE_DETECTED'
  | 'ACCOUNT_LOCKED'
  | 'UNAUTHORIZED_ACCESS'

/**
 * Severity levels
 */
export type SeverityLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'

/**
 * Admin audit log entry
 */
export interface AdminAuditEntry {
  adminId: string
  action: AdminActionType
  targetType: TargetType
  targetId: string
  changes?: Record<string, any>
  reason: string
  metadata?: Record<string, any>
  adminIp?: string
}

/**
 * Security event entry
 */
export interface SecurityEventEntry {
  eventType: SecurityEventType
  userId?: string
  ip: string
  userAgent?: string
  severity?: SeverityLevel
  message: string
  metadata?: Record<string, any>
}

/**
 * OTP attempt entry
 */
export interface OTPAttemptEntry {
  phone: string
  ip: string
  attemptType: 'REQUEST' | 'VERIFY'
  success: boolean
  userAgent?: string
  metadata?: Record<string, any>
}

// ==========================================
// ADMIN AUDIT LOGGING
// ==========================================

/**
 * Log admin action for audit trail
 * Use this for all admin overrides and sensitive operations
 * 
 * @param {AdminAuditEntry} entry - Audit log entry
 * @returns {Promise<void>}
 * 
 * @example
 * ```typescript
 * await logAdminAction({
 *   adminId: user.userId,
 *   action: 'OVERRIDE_CONFIRM',
 *   targetType: 'BOOKING',
 *   targetId: bookingId,
 *   changes: {
 *     before: { status: 'PROVISIONAL' },
 *     after: { status: 'CONFIRMED' },
 *   },
 *   reason: 'Customer paid in cash, bypassing online payment',
 *   adminIp: getClientIP(request),
 * })
 * ```
 */
export async function logAdminAction(entry: AdminAuditEntry): Promise<void> {
  try {
    await prisma.$executeRaw`
      INSERT INTO admin_audit_logs (
        id, admin_id, action, target_type, target_id,
        changes, reason, metadata, admin_ip, created_at
      ) VALUES (
        ${generateId()},
        ${entry.adminId},
        ${entry.action},
        ${entry.targetType},
        ${entry.targetId},
        ${entry.changes ? JSON.stringify(entry.changes) : null},
        ${entry.reason},
        ${entry.metadata ? JSON.stringify(entry.metadata) : null},
        ${entry.adminIp || null},
        ${new Date()}
      )
    `

    console.log('📝 Admin action logged:', {
      admin: entry.adminId,
      action: entry.action,
      target: `${entry.targetType}:${entry.targetId}`,
    })

    // In production: Send to SIEM system, Slack, PagerDuty, etc.
    if (process.env.NODE_ENV === 'production' && shouldAlertOnAction(entry.action)) {
      await sendAdminActionAlert(entry)
    }
  } catch (error) {
    console.error('❌ Failed to log admin action:', error)
    // Don't throw - logging failure shouldn't break the main operation
    // But DO report to error tracking (Sentry, etc.)
    reportToErrorTracking(error, { context: 'admin_audit_log', entry })
  }
}

/**
 * Get admin audit logs for a specific target
 * 
 * @param {TargetType} targetType - Type of target
 * @param {string} targetId - ID of target
 * @returns {Promise<any[]>} Audit log entries
 */
export async function getAuditLogsForTarget(
  targetType: TargetType,
  targetId: string
): Promise<any[]> {
  try {
    const logs = await prisma.$queryRaw<any[]>`
      SELECT * FROM admin_audit_logs
      WHERE target_type = ${targetType}
      AND target_id = ${targetId}
      ORDER BY created_at DESC
    `

    return logs.map((log) => ({
      ...log,
      changes: log.changes ? JSON.parse(log.changes) : null,
      metadata: log.metadata ? JSON.parse(log.metadata) : null,
    }))
  } catch (error) {
    console.error('❌ Failed to retrieve audit logs:', error)
    return []
  }
}

/**
 * Get recent admin actions for review
 * 
 * @param {number} limit - Number of logs to retrieve
 * @returns {Promise<any[]>} Recent audit logs
 */
export async function getRecentAdminActions(limit: number = 50): Promise<any[]> {
  try {
    const logs = await prisma.$queryRaw<any[]>`
      SELECT * FROM admin_audit_logs
      ORDER BY created_at DESC
      LIMIT ${limit}
    `

    return logs.map((log) => ({
      ...log,
      changes: log.changes ? JSON.parse(log.changes) : null,
      metadata: log.metadata ? JSON.parse(log.metadata) : null,
    }))
  } catch (error) {
    console.error('❌ Failed to retrieve recent admin actions:', error)
    return []
  }
}

// ==========================================
// SECURITY EVENT LOGGING
// ==========================================

/**
 * Log security event for monitoring and alerting
 * 
 * @param {SecurityEventEntry} entry - Security event entry
 * @returns {Promise<void>}
 * 
 * @example
 * ```typescript
 * await logSecurityEvent({
 *   eventType: 'RATE_LIMIT_EXCEEDED',
 *   ip: getClientIP(request),
 *   severity: 'MEDIUM',
 *   message: `Rate limit exceeded for phone: ${phone}`,
 *   metadata: { phone, limit: 5, window: '5min' },
 * })
 * ```
 */
export async function logSecurityEvent(entry: SecurityEventEntry): Promise<void> {
  try {
    await prisma.securityEvent.create({
      data: {
        eventType: entry.eventType,
        userId: entry.userId || null,
        ip: entry.ip,
        userAgent: entry.userAgent || null,
        severity: entry.severity || 'MEDIUM',
        message: entry.message,
        metadata: entry.metadata ? JSON.stringify(entry.metadata) : null,
        occurredAt: new Date(),
      },
    })

    console.log(`🔒 Security event logged [${entry.severity}]:`, {
      type: entry.eventType,
      ip: entry.ip,
      user: entry.userId,
    })

    // Alert on high/critical severity
    if (entry.severity === 'HIGH' || entry.severity === 'CRITICAL') {
      await sendSecurityAlert(entry)
    }
  } catch (error) {
    console.error('❌ Failed to log security event:', error)
    reportToErrorTracking(error, { context: 'security_event_log', entry })
  }
}

/**
 * Get recent security events
 * 
 * @param {number} limit - Number of events to retrieve
 * @param {SecurityEventType} eventType - Optional filter by event type
 * @returns {Promise<any[]>} Recent security events
 */
export async function getRecentSecurityEvents(
  limit: number = 100,
  eventType?: SecurityEventType
): Promise<any[]> {
  try {
    let logs: any[]

    if (eventType) {
      logs = await prisma.$queryRaw<any[]>`
        SELECT * FROM security_events
        WHERE event_type = ${eventType}
        ORDER BY occurred_at DESC
        LIMIT ${limit}
      `
    } else {
      logs = await prisma.$queryRaw<any[]>`
        SELECT * FROM security_events
        ORDER BY occurred_at DESC
        LIMIT ${limit}
      `
    }

    return logs.map((log) => ({
      ...log,
      metadata: log.metadata ? JSON.parse(log.metadata) : null,
    }))
  } catch (error) {
    console.error('❌ Failed to retrieve security events:', error)
    return []
  }
}

// ==========================================
// OTP ATTEMPT TRACKING
// ==========================================

/**
 * Log OTP attempt for rate limiting and brute-force detection
 * 
 * @param {OTPAttemptEntry} entry - OTP attempt entry
 * @returns {Promise<void>}
 */
export async function logOTPAttempt(entry: OTPAttemptEntry): Promise<void> {
  try {
    // Use Prisma model instead of raw SQL for better compatibility
    await prisma.otpAttempt.create({
      data: {
        phone: entry.phone,
        ip: entry.ip,
        attemptType: entry.attemptType,
        success: entry.success,
        userAgent: entry.userAgent || null,
        metadata: entry.metadata ? JSON.stringify(entry.metadata) : null,
        attemptedAt: new Date(),
      },
    })
  } catch (error) {
    console.error('❌ Failed to log OTP attempt:', error)
  }
}

/**
 * Get failed OTP attempts in time window
 * Used for brute-force detection
 * 
 * @param {string} phone - Phone number
 * @param {number} windowMinutes - Time window in minutes
 * @returns {Promise<number>} Number of failed attempts
 */
export async function getFailedOTPAttempts(
  phone: string,
  windowMinutes: number = 10
): Promise<number> {
  try {
    const windowStart = new Date(Date.now() - windowMinutes * 60 * 1000)

    const count = await prisma.otpAttempt.count({
      where: {
        phone,
        attemptType: 'VERIFY',
        success: false,
        attemptedAt: {
          gte: windowStart,
        },
      },
    })

    return count
  } catch (error) {
    console.error('❌ Failed to get OTP attempt count:', error)
    return 0
  }
}

/**
 * Check if phone number is locked due to too many failed attempts
 * 
 * @param {string} phone - Phone number
 * @param {number} maxAttempts - Maximum allowed attempts (default: 5)
 * @param {number} windowMinutes - Time window in minutes (default: 10)
 * @returns {Promise<boolean>} True if locked
 */
export async function isPhoneLocked(
  phone: string,
  maxAttempts: number = 5,
  windowMinutes: number = 10
): Promise<boolean> {
  const attempts = await getFailedOTPAttempts(phone, windowMinutes)
  return attempts >= maxAttempts
}

// ==========================================
// HELPER FUNCTIONS
// ==========================================

/**
 * Generate unique ID for log entries
 */
function generateId(): string {
  return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

/**
 * Determine if action requires immediate alert
 */
function shouldAlertOnAction(action: AdminActionType): boolean {
  const criticalActions: AdminActionType[] = [
    'FORCE_DELETE',
    'PERMISSION_GRANT',
    'PERMISSION_REVOKE',
    'SYSTEM_CONFIG_CHANGE',
    'USER_IMPERSONATE',
  ]

  return criticalActions.includes(action)
}

/**
 * Send admin action alert (implement based on your alerting system)
 * 
 * Production: Integrate with Slack, PagerDuty, email, etc.
 */
async function sendAdminActionAlert(entry: AdminAuditEntry): Promise<void> {
  // TODO: Implement Slack/email alert
  console.warn('🚨 CRITICAL ADMIN ACTION:', entry)

  // Example Slack integration:
  // await fetch(process.env.SLACK_WEBHOOK_URL, {
  //   method: 'POST',
  //   body: JSON.stringify({
  //     text: `🚨 Admin Action: ${entry.action}`,
  //     blocks: [
  //       { type: 'section', text: { type: 'mrkdwn', text: `*Admin:* ${entry.adminId}` } },
  //       { type: 'section', text: { type: 'mrkdwn', text: `*Action:* ${entry.action}` } },
  //       { type: 'section', text: { type: 'mrkdwn', text: `*Target:* ${entry.targetType} ${entry.targetId}` } },
  //       { type: 'section', text: { type: 'mrkdwn', text: `*Reason:* ${entry.reason}` } },
  //     ]
  //   })
  // })
}

/**
 * Send security alert (implement based on your alerting system)
 */
async function sendSecurityAlert(entry: SecurityEventEntry): Promise<void> {
  console.warn('🚨 SECURITY ALERT:', entry)

  // TODO: Implement security alerting
  // Example: Send to SIEM, Slack, PagerDuty
}

/**
 * Report error to tracking system
 * 
 * Production: Integrate with Sentry, DataDog, etc.
 */
function reportToErrorTracking(error: any, context: Record<string, any>): void {
  // TODO: Implement error tracking
  // Example Sentry integration:
  // Sentry.captureException(error, { extra: context })

  console.error('Error Tracking:', error, context)
}

/**
 * Get audit summary for compliance reports
 * 
 * @param {Date} startDate - Start date for report
 * @param {Date} endDate - End date for report
 * @returns {Promise<any>} Audit summary
 */
export async function getAuditSummary(startDate: Date, endDate: Date): Promise<any> {
  try {
    const adminActions = await prisma.$queryRaw<any[]>`
      SELECT action, COUNT(*) as count
      FROM admin_audit_logs
      WHERE created_at BETWEEN ${startDate} AND ${endDate}
      GROUP BY action
    `

    const securityEvents = await prisma.$queryRaw<any[]>`
      SELECT event_type, severity, COUNT(*) as count
      FROM security_events
      WHERE occurred_at BETWEEN ${startDate} AND ${endDate}
      GROUP BY event_type, severity
    `

    return {
      period: { start: startDate, end: endDate },
      adminActions,
      securityEvents,
    }
  } catch (error) {
    console.error('❌ Failed to generate audit summary:', error)
    return null
  }
}
