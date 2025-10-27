/**
 * RBAC Audit Logging Service
 * =========================
 * Comprehensive audit trail for all admin and superadmin actions
 * 
 * Features:
 * - Log all create, update, delete operations
 * - Track permission checks and access denials
 * - Record IP addresses and user agents
 * - Store before/after state for changes
 * - Query and export audit logs
 * 
 * @module lib/services/audit.service
 */

import { prisma } from '@/lib/prisma'
import type { RoleName } from '@prisma/client'

// ==========================================
// TYPES
// ==========================================

/**
 * Audit action types
 */
export enum AuditAction {
  // Authentication & Authorization
  LOGIN = 'LOGIN',
  LOGOUT = 'LOGOUT',
  ACCESS_GRANTED = 'ACCESS_GRANTED',
  ACCESS_DENIED = 'ACCESS_DENIED',
  PERMISSION_CHECK = 'PERMISSION_CHECK',
  
  // Generic CRUD
  CREATE = 'CREATE',
  UPDATE = 'UPDATE',
  DELETE = 'DELETE',
  
  // User Management
  USER_CREATE = 'USER_CREATE',
  USER_UPDATE = 'USER_UPDATE',
  USER_DELETE = 'USER_DELETE',
  USER_ROLE_CHANGE = 'USER_ROLE_CHANGE',
  USER_STATUS_CHANGE = 'USER_STATUS_CHANGE',
  
  // Booking Management
  BOOKING_CREATE = 'BOOKING_CREATE',
  BOOKING_UPDATE = 'BOOKING_UPDATE',
  BOOKING_DELETE = 'BOOKING_DELETE',
  BOOKING_OVERRIDE_CONFIRM = 'BOOKING_OVERRIDE_CONFIRM',
  BOOKING_OVERRIDE_CANCEL = 'BOOKING_OVERRIDE_CANCEL',
  BOOKING_STATUS_CHANGE = 'BOOKING_STATUS_CHANGE',
  BOOKING_FORCE_CHECKIN = 'BOOKING_FORCE_CHECKIN',
  BOOKING_FORCE_CHECKOUT = 'BOOKING_FORCE_CHECKOUT',
  
  // Room Management
  ROOM_CREATE = 'ROOM_CREATE',
  ROOM_UPDATE = 'ROOM_UPDATE',
  ROOM_DELETE = 'ROOM_DELETE',
  ROOM_TYPE_CREATE = 'ROOM_TYPE_CREATE',
  ROOM_TYPE_UPDATE = 'ROOM_TYPE_UPDATE',
  ROOM_TYPE_DELETE = 'ROOM_TYPE_DELETE',
  ROOM_STATUS_CHANGE = 'ROOM_STATUS_CHANGE',
  
  // Payment Management
  PAYMENT_CREATE = 'PAYMENT_CREATE',
  PAYMENT_UPDATE = 'PAYMENT_UPDATE',
  PAYMENT_DELETE = 'PAYMENT_DELETE',
  PAYMENT_REFUND = 'PAYMENT_REFUND',
  PAYMENT_OVERRIDE = 'PAYMENT_OVERRIDE',
  
  // Inventory Management
  INVENTORY_UPDATE = 'INVENTORY_UPDATE',
  INVENTORY_OVERRIDE = 'INVENTORY_OVERRIDE',
  INVENTORY_BULK_UPDATE = 'INVENTORY_BULK_UPDATE',
  
  // Notification Management
  NOTIFICATION_SEND = 'NOTIFICATION_SEND',
  NOTIFICATION_BROADCAST = 'NOTIFICATION_BROADCAST',
  NOTIFICATION_DELETE = 'NOTIFICATION_DELETE',
  
  // Report & Analytics
  REPORT_GENERATE = 'REPORT_GENERATE',
  REPORT_EXPORT = 'REPORT_EXPORT',
  DATA_EXPORT = 'DATA_EXPORT',
  
  // System Management
  SYSTEM_SETTINGS_UPDATE = 'SYSTEM_SETTINGS_UPDATE',
  SYSTEM_CONFIG_CHANGE = 'SYSTEM_CONFIG_CHANGE',
  DATABASE_BACKUP = 'DATABASE_BACKUP',
  DATABASE_RESTORE = 'DATABASE_RESTORE',
  SYSTEM_MAINTENANCE = 'SYSTEM_MAINTENANCE',
}

/**
 * Resource types that can be audited
 */
export enum AuditTargetType {
  USER = 'USER',
  BOOKING = 'BOOKING',
  ROOM = 'ROOM',
  ROOM_TYPE = 'ROOM_TYPE',
  PAYMENT = 'PAYMENT',
  INVENTORY = 'INVENTORY',
  NOTIFICATION = 'NOTIFICATION',
  REPORT = 'REPORT',
  SYSTEM = 'SYSTEM',
  API_ROUTE = 'API_ROUTE',
  PAGE_ROUTE = 'PAGE_ROUTE',
}

/**
 * Audit log entry data
 */
export interface AuditLogData {
  /** Admin/SuperAdmin user ID performing the action */
  adminId: string
  
  /** Admin role (ADMIN or SUPERADMIN) */
  adminRole: RoleName
  
  /** Action performed */
  action: AuditAction | string
  
  /** Type of resource being acted upon */
  targetType: AuditTargetType | string
  
  /** ID of the target resource (optional for system-wide actions) */
  targetId?: string
  
  /** Changes made (before/after values) */
  changes?: {
    before?: any
    after?: any
  }
  
  /** Reason for the action (required for overrides) */
  reason?: string
  
  /** Additional metadata */
  metadata?: Record<string, any>
  
  /** IP address of the admin */
  ipAddress?: string
  
  /** User agent string */
  userAgent?: string
  
  /** Request URL */
  requestUrl?: string
  
  /** HTTP method */
  requestMethod?: string
}

/**
 * Audit log query filters
 */
export interface AuditLogFilters {
  adminId?: string
  action?: AuditAction | string
  targetType?: AuditTargetType | string
  targetId?: string
  startDate?: Date
  endDate?: Date
  limit?: number
  offset?: number
}

// ==========================================
// AUDIT LOGGING FUNCTIONS
// ==========================================

/**
 * Create an audit log entry
 * 
 * @param data - Audit log data
 * @returns Created audit log
 * 
 * @example
 * await createAuditLog({
 *   adminId: user.id,
 *   adminRole: user.role,
 *   action: AuditAction.BOOKING_OVERRIDE_CONFIRM,
 *   targetType: AuditTargetType.BOOKING,
 *   targetId: booking.id,
 *   reason: 'Customer special request',
 *   changes: { before: { status: 'PENDING' }, after: { status: 'CONFIRMED' } },
 *   ipAddress: req.ip,
 *   userAgent: req.headers['user-agent']
 * })
 */
export async function createAuditLog(data: AuditLogData) {
  try {
    const auditLog = await prisma.adminAuditLog.create({
      data: {
        adminId: data.adminId,
        action: data.action,
        targetType: data.targetType,
        targetId: data.targetId || 'N/A',
        changes: data.changes ? JSON.stringify(data.changes) : null,
        reason: data.reason || 'No reason provided',
        adminIp: data.ipAddress || null,
        metadata: data.metadata ? JSON.stringify({
          ...data.metadata,
          adminRole: data.adminRole,
          userAgent: data.userAgent,
          requestUrl: data.requestUrl,
          requestMethod: data.requestMethod,
        }) : JSON.stringify({
          adminRole: data.adminRole,
          userAgent: data.userAgent,
          requestUrl: data.requestUrl,
          requestMethod: data.requestMethod,
        }),
      },
    })

    console.log(`[Audit] ✅ Logged: ${data.action} by ${data.adminId} on ${data.targetType}:${data.targetId || 'N/A'}`)
    
    return auditLog
  } catch (error) {
    console.error('[Audit] ❌ Failed to create audit log:', error)
    // Don't throw - audit logging failures shouldn't break the main operation
    return null
  }
}

/**
 * Log access granted event
 */
export async function logAccessGranted(
  adminId: string,
  adminRole: RoleName,
  resourcePath: string,
  ipAddress?: string,
  userAgent?: string
) {
  return createAuditLog({
    adminId,
    adminRole,
    action: AuditAction.ACCESS_GRANTED,
    targetType: AuditTargetType.API_ROUTE,
    targetId: resourcePath,
    reason: 'Access granted based on role permissions',
    ipAddress,
    userAgent,
    requestUrl: resourcePath,
  })
}

/**
 * Log access denied event
 */
export async function logAccessDenied(
  adminId: string,
  adminRole: RoleName,
  resourcePath: string,
  requiredRoles: RoleName[],
  ipAddress?: string,
  userAgent?: string
) {
  return createAuditLog({
    adminId,
    adminRole,
    action: AuditAction.ACCESS_DENIED,
    targetType: AuditTargetType.API_ROUTE,
    targetId: resourcePath,
    reason: `Access denied - requires roles: ${requiredRoles.join(', ')}`,
    metadata: {
      userRole: adminRole,
      requiredRoles,
    },
    ipAddress,
    userAgent,
    requestUrl: resourcePath,
  })
}

/**
 * Log permission check
 */
export async function logPermissionCheck(
  adminId: string,
  adminRole: RoleName,
  permission: string,
  granted: boolean,
  resourcePath?: string
) {
  return createAuditLog({
    adminId,
    adminRole,
    action: AuditAction.PERMISSION_CHECK,
    targetType: AuditTargetType.SYSTEM,
    reason: `Permission check: ${permission} - ${granted ? 'GRANTED' : 'DENIED'}`,
    metadata: {
      permission,
      granted,
      resourcePath,
    },
  })
}

// ==========================================
// AUDIT LOG QUERIES
// ==========================================

/**
 * Get audit logs with filters
 */
export async function getAuditLogs(filters: AuditLogFilters = {}) {
  const where: any = {}
  
  if (filters.adminId) where.adminId = filters.adminId
  if (filters.action) where.action = filters.action
  if (filters.targetType) where.targetType = filters.targetType
  if (filters.targetId) where.targetId = filters.targetId
  
  if (filters.startDate || filters.endDate) {
    where.createdAt = {}
    if (filters.startDate) where.createdAt.gte = filters.startDate
    if (filters.endDate) where.createdAt.lte = filters.endDate
  }

  const logs = await prisma.adminAuditLog.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    take: filters.limit || 100,
    skip: filters.offset || 0,
  })

  return logs.map(log => ({
    ...log,
    changes: log.changes ? JSON.parse(log.changes) : null,
    metadata: log.metadata ? JSON.parse(log.metadata) : null,
  }))
}

/**
 * Get audit log statistics
 */
export async function getAuditLogStats(adminId?: string) {
  const where = adminId ? { adminId } : {}

  const [total, byAction, byTargetType, recentDenials] = await Promise.all([
    prisma.adminAuditLog.count({ where }),
    
    prisma.adminAuditLog.groupBy({
      by: ['action'],
      where,
      _count: true,
      orderBy: { _count: { action: 'desc' } },
      take: 10,
    }),
    
    prisma.adminAuditLog.groupBy({
      by: ['targetType'],
      where,
      _count: true,
      orderBy: { _count: { targetType: 'desc' } },
    }),
    
    prisma.adminAuditLog.findMany({
      where: {
        ...where,
        action: AuditAction.ACCESS_DENIED,
      },
      orderBy: { createdAt: 'desc' },
      take: 10,
    }),
  ])

  return {
    total,
    byAction,
    byTargetType,
    recentDenials: recentDenials.map(log => ({
      ...log,
      metadata: log.metadata ? JSON.parse(log.metadata) : null,
    })),
  }
}

/**
 * Get user activity timeline
 */
export async function getUserAuditTimeline(adminId: string, limit = 50) {
  return getAuditLogs({
    adminId,
    limit,
  })
}

/**
 * Get resource audit history
 */
export async function getResourceAuditHistory(
  targetType: AuditTargetType | string,
  targetId: string,
  limit = 50
) {
  return getAuditLogs({
    targetType,
    targetId,
    limit,
  })
}

/**
 * Export audit logs to CSV format
 */
export async function exportAuditLogsToCsv(filters: AuditLogFilters = {}) {
  const logs = await getAuditLogs({ ...filters, limit: 10000 })
  
  const headers = [
    'Timestamp',
    'Admin ID',
    'Admin Role',
    'Action',
    'Target Type',
    'Target ID',
    'Reason',
    'IP Address',
    'Changes',
  ]
  
  const rows = logs.map(log => [
    log.createdAt.toISOString(),
    log.adminId,
    log.metadata?.adminRole || 'N/A',
    log.action,
    log.targetType,
    log.targetId,
    log.reason,
    log.adminIp || 'N/A',
    log.changes ? JSON.stringify(log.changes) : 'N/A',
  ])
  
  const csv = [headers, ...rows]
    .map(row => row.map(cell => `"${cell}"`).join(','))
    .join('\n')
  
  return csv
}

// ==========================================
// UTILITY FUNCTIONS
// ==========================================

/**
 * Clean up old audit logs (retention policy)
 * Default: Keep logs for 90 days
 */
export async function cleanupOldAuditLogs(retentionDays = 90) {
  const cutoffDate = new Date()
  cutoffDate.setDate(cutoffDate.getDate() - retentionDays)

  const deleted = await prisma.adminAuditLog.deleteMany({
    where: {
      createdAt: {
        lt: cutoffDate,
      },
    },
  })

  console.log(`[Audit] 🗑️ Cleaned up ${deleted.count} audit logs older than ${retentionDays} days`)
  
  return deleted.count
}
