/**
 * API Request Utilities
 * ====================
 * Helper functions for extracting user context and audit info from API requests
 * 
 * These utilities work with data injected by middleware:
 * - User authentication context (ID, role, email, phone)
 * - Audit tracking info (IP, user agent, timestamp)
 * - RBAC enforcement flags
 * 
 * @module lib/utils/api-request
 */

import { headers } from 'next/headers'
import type { RoleName } from '@prisma/client'
import { createAuditLog, AuditAction, AuditTargetType } from '@/lib/services/audit.service'
import type { UserContext } from '@/lib/auth/permissions'

// ==========================================
// TYPES
// ==========================================

/**
 * User context extracted from request headers
 */
export interface RequestUser {
  id: string
  role: RoleName
  phone: string
  name: string
  email?: string
}

/**
 * Audit context extracted from request headers
 */
export interface AuditContext {
  ipAddress: string
  userAgent: string
  route: string
  method: string
  timestamp: string
  required: boolean
}

// ==========================================
// USER CONTEXT FUNCTIONS
// ==========================================

/**
 * Get authenticated user from request headers
 * Headers are injected by middleware after JWT verification
 * 
 * @returns User context or null if not authenticated
 * 
 * @example
 * export async function POST(request: Request) {
 *   const user = await getRequestUser()
 *   if (!user) {
 *     return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
 *   }
 *   // ... use user.id, user.role, etc.
 * }
 */
export async function getRequestUser(): Promise<RequestUser | null> {
  const headersList = await headers()
  
  const userId = headersList.get('x-user-id')
  const userRole = headersList.get('x-user-role') as RoleName | null
  const userPhone = headersList.get('x-user-phone')
  const userName = headersList.get('x-user-name')
  const userEmail = headersList.get('x-user-email')

  if (!userId || !userRole || !userPhone || !userName) {
    return null
  }

  return {
    id: userId,
    role: userRole,
    phone: userPhone,
    name: userName,
    email: userEmail || undefined,
  }
}

/**
 * Get authenticated user or throw error
 * Use when authentication is required
 * 
 * @throws Error if user not authenticated
 * 
 * @example
 * export async function POST(request: Request) {
 *   const user = await requireAuth()
 *   // user is guaranteed to be defined here
 * }
 */
export async function requireAuth(): Promise<RequestUser> {
  const user = await getRequestUser()
  
  if (!user) {
    throw new Error('Authentication required')
  }

  return user
}

/**
 * Get user as UserContext (for permission checks)
 */
export async function getUserContext(): Promise<UserContext | null> {
  const user = await getRequestUser()
  
  if (!user) {
    return null
  }

  return {
    id: user.id,
    role: user.role,
    phone: user.phone,
    email: user.email,
  }
}

/**
 * Require user context or throw
 */
export async function requireUserContext(): Promise<UserContext> {
  const context = await getUserContext()
  
  if (!context) {
    throw new Error('Authentication required')
  }

  return context
}

// ==========================================
// ROLE CHECKING FUNCTIONS
// ==========================================

/**
 * Check if authenticated user has required role
 * 
 * @param requiredRoles - Array of allowed roles
 * @returns True if user has any of the required roles
 * 
 * @example
 * if (!await hasRole(['ADMIN', 'SUPERADMIN'])) {
 *   return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
 * }
 */
export async function hasRole(requiredRoles: RoleName[]): Promise<boolean> {
  const user = await getRequestUser()
  
  if (!user) {
    return false
  }

  return requiredRoles.includes(user.role)
}

/**
 * Require specific role or throw
 * 
 * @throws Error if user doesn't have required role
 */
export async function requireRole(requiredRoles: RoleName[]): Promise<void> {
  const user = await getRequestUser()
  
  if (!user) {
    throw new Error('Authentication required')
  }

  if (!requiredRoles.includes(user.role)) {
    throw new Error(`Forbidden - requires role: ${requiredRoles.join(' or ')}`)
  }
}

/**
 * Check if user is admin or superadmin
 */
export async function isAdmin(): Promise<boolean> {
  return hasRole(['ADMIN', 'SUPERADMIN'])
}

/**
 * Check if user is superadmin
 */
export async function isSuperAdmin(): Promise<boolean> {
  return hasRole(['SUPERADMIN'])
}

/**
 * Require admin role
 */
export async function requireAdmin(): Promise<void> {
  await requireRole(['ADMIN', 'SUPERADMIN'])
}

/**
 * Require superadmin role
 */
export async function requireSuperAdmin(): Promise<void> {
  await requireRole(['SUPERADMIN'])
}

// ==========================================
// AUDIT CONTEXT FUNCTIONS
// ==========================================

/**
 * Get audit context from request headers
 * 
 * @returns Audit context or null if not available
 */
export async function getAuditContext(): Promise<AuditContext | null> {
  const headersList = await headers()
  
  const ipAddress = headersList.get('x-audit-ip')
  const userAgent = headersList.get('x-audit-user-agent')
  const route = headersList.get('x-audit-route')
  const method = headersList.get('x-audit-method')
  const timestamp = headersList.get('x-audit-timestamp')
  const required = headersList.get('x-audit-required') === 'true'

  if (!ipAddress || !userAgent || !route || !method || !timestamp) {
    return null
  }

  return {
    ipAddress,
    userAgent,
    route,
    method,
    timestamp,
    required,
  }
}

/**
 * Check if audit logging is required for this request
 * Admin and SuperAdmin actions should always be audited
 */
export async function isAuditRequired(): Promise<boolean> {
  const context = await getAuditContext()
  return context?.required || false
}

// ==========================================
// AUDIT LOGGING HELPERS
// ==========================================

/**
 * Log an action with full context
 * Automatically includes user and audit context
 * 
 * @param action - Action performed
 * @param targetType - Type of resource
 * @param targetId - ID of resource (optional)
 * @param options - Additional audit options
 * 
 * @example
 * await logAction(
 *   AuditAction.BOOKING_UPDATE,
 *   AuditTargetType.BOOKING,
 *   booking.id,
 *   {
 *     reason: 'Admin override',
 *     changes: { before: oldBooking, after: newBooking }
 *   }
 * )
 */
export async function logAction(
  action: AuditAction | string,
  targetType: AuditTargetType | string,
  targetId?: string,
  options?: {
    reason?: string
    changes?: { before?: any; after?: any }
    metadata?: Record<string, any>
  }
) {
  const user = await getRequestUser()
  const auditContext = await getAuditContext()

  if (!user) {
    console.warn('[API] Cannot log action: No authenticated user')
    return null
  }

  return createAuditLog({
    adminId: user.id,
    adminRole: user.role,
    action,
    targetType,
    targetId,
    reason: options?.reason,
    changes: options?.changes,
    metadata: options?.metadata,
    ipAddress: auditContext?.ipAddress,
    userAgent: auditContext?.userAgent,
    requestUrl: auditContext?.route,
    requestMethod: auditContext?.method,
  })
}

/**
 * Auto-log action if audit is required
 * Only logs for ADMIN and SUPERADMIN actions
 */
export async function autoLogAction(
  action: AuditAction | string,
  targetType: AuditTargetType | string,
  targetId?: string,
  options?: {
    reason?: string
    changes?: { before?: any; after?: any }
    metadata?: Record<string, any>
  }
) {
  const required = await isAuditRequired()
  
  if (!required) {
    return null
  }

  return logAction(action, targetType, targetId, options)
}

// ==========================================
// REQUEST INFO UTILITIES
// ==========================================

/**
 * Get client IP address from headers
 */
export async function getClientIp(): Promise<string> {
  const context = await getAuditContext()
  return context?.ipAddress || 'unknown'
}

/**
 * Get user agent from headers
 */
export async function getUserAgent(): Promise<string> {
  const context = await getAuditContext()
  return context?.userAgent || 'unknown'
}

/**
 * Get full request context for logging
 */
export async function getRequestContext() {
  const user = await getRequestUser()
  const audit = await getAuditContext()

  return {
    user: user ? {
      id: user.id,
      role: user.role,
      name: user.name,
    } : null,
    audit: audit ? {
      ip: audit.ipAddress,
      userAgent: audit.userAgent,
      route: audit.route,
      method: audit.method,
    } : null,
  }
}
