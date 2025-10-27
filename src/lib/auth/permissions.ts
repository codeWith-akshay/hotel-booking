/**
 * RBAC Permission Utilities
 * =========================
 * Fine-grained permission checking and role validation
 * 
 * Features:
 * - Role hierarchy enforcement
 * - Resource-level permissions
 * - Action-based permission checks
 * - Permission caching for performance
 * - Integration with audit logging
 * 
 * @module lib/auth/permissions
 */

import type { RoleName } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { createAuditLog, AuditAction, AuditTargetType, logPermissionCheck } from '@/lib/services/audit.service'

// ==========================================
// TYPES
// ==========================================

/**
 * Permission definition
 */
export interface Permission {
  /** Permission identifier */
  name: string
  
  /** Human-readable description */
  description: string
  
  /** Roles that have this permission */
  roles: RoleName[]
  
  /** Resource type this permission applies to */
  resource?: string
  
  /** Specific action */
  action?: 'CREATE' | 'READ' | 'UPDATE' | 'DELETE' | 'EXECUTE'
}

/**
 * User context for permission checks
 */
export interface UserContext {
  id: string
  role: RoleName
  email?: string | null
  phone?: string
}

/**
 * Permission check result
 */
export interface PermissionCheckResult {
  granted: boolean
  reason?: string
  requiredRole?: RoleName[]
}

// ==========================================
// ROLE HIERARCHY
// ==========================================

/**
 * Role hierarchy (higher number = more privileges)
 */
const ROLE_HIERARCHY: Record<RoleName, number> = {
  MEMBER: 1,
  ADMIN: 2,
  SUPERADMIN: 3,
}

/**
 * Check if user's role is higher or equal to required role
 */
export function hasRoleLevel(userRole: RoleName, requiredRole: RoleName): boolean {
  return ROLE_HIERARCHY[userRole] >= ROLE_HIERARCHY[requiredRole]
}

/**
 * Check if user has any of the required roles
 */
export function hasAnyRole(userRole: RoleName, requiredRoles: RoleName[]): boolean {
  return requiredRoles.includes(userRole)
}

/**
 * Check if user has all required roles (typically just one)
 */
export function hasAllRoles(userRole: RoleName, requiredRoles: RoleName[]): boolean {
  // In this system, a user can only have one role, so this checks if their role is in the list
  return requiredRoles.includes(userRole)
}

// ==========================================
// PERMISSION DEFINITIONS
// ==========================================

/**
 * All system permissions
 */
export const PERMISSIONS: Record<string, Permission> = {
  // User Management
  'users:create': {
    name: 'users:create',
    description: 'Create new users',
    roles: ['ADMIN', 'SUPERADMIN'],
    resource: 'USER',
    action: 'CREATE',
  },
  'users:read': {
    name: 'users:read',
    description: 'View user information',
    roles: ['ADMIN', 'SUPERADMIN'],
    resource: 'USER',
    action: 'READ',
  },
  'users:update': {
    name: 'users:update',
    description: 'Update user information',
    roles: ['ADMIN', 'SUPERADMIN'],
    resource: 'USER',
    action: 'UPDATE',
  },
  'users:delete': {
    name: 'users:delete',
    description: 'Delete users',
    roles: ['SUPERADMIN'],
    resource: 'USER',
    action: 'DELETE',
  },
  'users:change-role': {
    name: 'users:change-role',
    description: 'Change user roles',
    roles: ['SUPERADMIN'],
    resource: 'USER',
    action: 'UPDATE',
  },

  // Booking Management
  'bookings:create': {
    name: 'bookings:create',
    description: 'Create bookings',
    roles: ['MEMBER', 'ADMIN', 'SUPERADMIN'],
    resource: 'BOOKING',
    action: 'CREATE',
  },
  'bookings:read': {
    name: 'bookings:read',
    description: 'View bookings',
    roles: ['MEMBER', 'ADMIN', 'SUPERADMIN'],
    resource: 'BOOKING',
    action: 'READ',
  },
  'bookings:read-all': {
    name: 'bookings:read-all',
    description: 'View all bookings (not just own)',
    roles: ['ADMIN', 'SUPERADMIN'],
    resource: 'BOOKING',
    action: 'READ',
  },
  'bookings:update': {
    name: 'bookings:update',
    description: 'Update bookings',
    roles: ['ADMIN', 'SUPERADMIN'],
    resource: 'BOOKING',
    action: 'UPDATE',
  },
  'bookings:delete': {
    name: 'bookings:delete',
    description: 'Delete bookings',
    roles: ['ADMIN', 'SUPERADMIN'],
    resource: 'BOOKING',
    action: 'DELETE',
  },
  'bookings:override': {
    name: 'bookings:override',
    description: 'Override booking rules and restrictions',
    roles: ['ADMIN', 'SUPERADMIN'],
    resource: 'BOOKING',
    action: 'EXECUTE',
  },
  'bookings:force-checkin': {
    name: 'bookings:force-checkin',
    description: 'Force check-in regardless of rules',
    roles: ['ADMIN', 'SUPERADMIN'],
    resource: 'BOOKING',
    action: 'EXECUTE',
  },
  'bookings:force-checkout': {
    name: 'bookings:force-checkout',
    description: 'Force check-out',
    roles: ['ADMIN', 'SUPERADMIN'],
    resource: 'BOOKING',
    action: 'EXECUTE',
  },

  // Room Management
  'rooms:create': {
    name: 'rooms:create',
    description: 'Create rooms',
    roles: ['ADMIN', 'SUPERADMIN'],
    resource: 'ROOM',
    action: 'CREATE',
  },
  'rooms:read': {
    name: 'rooms:read',
    description: 'View room information',
    roles: ['MEMBER', 'ADMIN', 'SUPERADMIN'],
    resource: 'ROOM',
    action: 'READ',
  },
  'rooms:update': {
    name: 'rooms:update',
    description: 'Update room information',
    roles: ['ADMIN', 'SUPERADMIN'],
    resource: 'ROOM',
    action: 'UPDATE',
  },
  'rooms:delete': {
    name: 'rooms:delete',
    description: 'Delete rooms',
    roles: ['SUPERADMIN'],
    resource: 'ROOM',
    action: 'DELETE',
  },
  'room-types:manage': {
    name: 'room-types:manage',
    description: 'Manage room types',
    roles: ['ADMIN', 'SUPERADMIN'],
    resource: 'ROOM_TYPE',
    action: 'UPDATE',
  },

  // Payment Management
  'payments:create': {
    name: 'payments:create',
    description: 'Process payments',
    roles: ['MEMBER', 'ADMIN', 'SUPERADMIN'],
    resource: 'PAYMENT',
    action: 'CREATE',
  },
  'payments:read': {
    name: 'payments:read',
    description: 'View payment information',
    roles: ['ADMIN', 'SUPERADMIN'],
    resource: 'PAYMENT',
    action: 'READ',
  },
  'payments:refund': {
    name: 'payments:refund',
    description: 'Process refunds',
    roles: ['ADMIN', 'SUPERADMIN'],
    resource: 'PAYMENT',
    action: 'EXECUTE',
  },
  'payments:override': {
    name: 'payments:override',
    description: 'Override payment rules',
    roles: ['SUPERADMIN'],
    resource: 'PAYMENT',
    action: 'EXECUTE',
  },

  // Inventory Management
  'inventory:read': {
    name: 'inventory:read',
    description: 'View inventory',
    roles: ['ADMIN', 'SUPERADMIN'],
    resource: 'INVENTORY',
    action: 'READ',
  },
  'inventory:update': {
    name: 'inventory:update',
    description: 'Update inventory',
    roles: ['ADMIN', 'SUPERADMIN'],
    resource: 'INVENTORY',
    action: 'UPDATE',
  },
  'inventory:override': {
    name: 'inventory:override',
    description: 'Override inventory restrictions',
    roles: ['ADMIN', 'SUPERADMIN'],
    resource: 'INVENTORY',
    action: 'EXECUTE',
  },

  // Notification Management
  'notifications:send': {
    name: 'notifications:send',
    description: 'Send notifications',
    roles: ['ADMIN', 'SUPERADMIN'],
    resource: 'NOTIFICATION',
    action: 'CREATE',
  },
  'notifications:broadcast': {
    name: 'notifications:broadcast',
    description: 'Send broadcast notifications',
    roles: ['ADMIN', 'SUPERADMIN'],
    resource: 'NOTIFICATION',
    action: 'EXECUTE',
  },

  // Reports & Analytics
  'reports:generate': {
    name: 'reports:generate',
    description: 'Generate reports',
    roles: ['ADMIN', 'SUPERADMIN'],
    resource: 'REPORT',
    action: 'CREATE',
  },
  'reports:export': {
    name: 'reports:export',
    description: 'Export report data',
    roles: ['ADMIN', 'SUPERADMIN'],
    resource: 'REPORT',
    action: 'EXECUTE',
  },
  'data:export': {
    name: 'data:export',
    description: 'Export system data',
    roles: ['SUPERADMIN'],
    resource: 'SYSTEM',
    action: 'EXECUTE',
  },

  // System Management
  'system:settings': {
    name: 'system:settings',
    description: 'Manage system settings',
    roles: ['SUPERADMIN'],
    resource: 'SYSTEM',
    action: 'UPDATE',
  },
  'system:backup': {
    name: 'system:backup',
    description: 'Backup database',
    roles: ['SUPERADMIN'],
    resource: 'SYSTEM',
    action: 'EXECUTE',
  },
  'system:restore': {
    name: 'system:restore',
    description: 'Restore database',
    roles: ['SUPERADMIN'],
    resource: 'SYSTEM',
    action: 'EXECUTE',
  },
  'system:maintenance': {
    name: 'system:maintenance',
    description: 'Perform system maintenance',
    roles: ['SUPERADMIN'],
    resource: 'SYSTEM',
    action: 'EXECUTE',
  },
  'audit-logs:read': {
    name: 'audit-logs:read',
    description: 'View audit logs',
    roles: ['ADMIN', 'SUPERADMIN'],
    resource: 'SYSTEM',
    action: 'READ',
  },
}

// ==========================================
// PERMISSION CHECKING FUNCTIONS
// ==========================================

/**
 * Check if user has a specific permission
 * 
 * @param user - User context
 * @param permissionName - Permission to check
 * @param logCheck - Whether to log the permission check (default: false)
 * @returns Permission check result
 * 
 * @example
 * const result = await checkPermission(user, 'bookings:override')
 * if (!result.granted) {
 *   throw new Error(result.reason)
 * }
 */
export async function checkPermission(
  user: UserContext,
  permissionName: string,
  logCheck = false
): Promise<PermissionCheckResult> {
  const permission = PERMISSIONS[permissionName]
  
  if (!permission) {
    const result = {
      granted: false,
      reason: `Unknown permission: ${permissionName}`,
    }
    
    if (logCheck) {
      await logPermissionCheck(user.id, user.role, permissionName, false)
    }
    
    return result
  }

  const granted = permission.roles.includes(user.role)
  
  if (logCheck) {
    await logPermissionCheck(user.id, user.role, permissionName, granted)
  }

  return {
    granted,
    reason: granted
      ? undefined
      : `Permission denied. Required roles: ${permission.roles.join(', ')}`,
    requiredRole: permission.roles,
  }
}

/**
 * Assert user has permission (throws if not)
 * 
 * @throws Error if permission denied
 */
export async function requirePermission(
  user: UserContext,
  permissionName: string,
  logCheck = true
): Promise<void> {
  const result = await checkPermission(user, permissionName, logCheck)
  
  if (!result.granted) {
    throw new Error(result.reason || 'Permission denied')
  }
}

/**
 * Check if user can perform action on a specific resource
 * 
 * @param user - User context
 * @param resource - Resource type
 * @param action - Action to perform
 * @param resourceId - Specific resource ID (for ownership checks)
 * @returns Permission check result
 * 
 * @example
 * const canUpdate = await checkResourcePermission(user, 'BOOKING', 'UPDATE', bookingId)
 */
export async function checkResourcePermission(
  user: UserContext,
  resource: string,
  action: 'CREATE' | 'READ' | 'UPDATE' | 'DELETE' | 'EXECUTE',
  resourceId?: string
): Promise<PermissionCheckResult> {
  // Find permission for this resource and action
  const permissionKey = `${resource.toLowerCase()}s:${action.toLowerCase()}`
  const permission = PERMISSIONS[permissionKey]
  
  if (!permission) {
    // Check for general resource permissions
    const generalKey = `${resource.toLowerCase()}s:read`
    return checkPermission(user, generalKey, false)
  }

  const result = await checkPermission(user, permissionKey, false)
  
  // Additional check: MEMBERs can only access their own resources
  if (result.granted && user.role === 'MEMBER' && resourceId) {
    const canAccessOwn = await checkResourceOwnership(user.id, resource, resourceId)
    if (!canAccessOwn) {
      return {
        granted: false,
        reason: 'You can only access your own resources',
      }
    }
  }

  return result
}

/**
 * Check if user owns a specific resource
 */
async function checkResourceOwnership(
  userId: string,
  resource: string,
  resourceId: string
): Promise<boolean> {
  try {
    switch (resource) {
      case 'BOOKING': {
        const booking = await prisma.booking.findFirst({
          where: { id: resourceId, userId },
        })
        return !!booking
      }
      case 'PAYMENT': {
        const payment = await prisma.payment.findFirst({
          where: { id: resourceId, booking: { userId } },
        })
        return !!payment
      }
      default:
        return false
    }
  } catch (error) {
    console.error('[RBAC] Error checking resource ownership:', error)
    return false
  }
}

/**
 * Get all permissions for a role
 */
export function getPermissionsForRole(role: RoleName): Permission[] {
  return Object.values(PERMISSIONS).filter(p => p.roles.includes(role))
}

/**
 * Check if user is admin or superadmin
 */
export function isAdmin(role: RoleName): boolean {
  return role === 'ADMIN' || role === 'SUPERADMIN'
}

/**
 * Check if user is superadmin
 */
export function isSuperAdmin(role: RoleName): boolean {
  return role === 'SUPERADMIN'
}

/**
 * Require admin role (throws if not)
 */
export function requireAdmin(role: RoleName): void {
  if (!isAdmin(role)) {
    throw new Error('Admin access required')
  }
}

/**
 * Require superadmin role (throws if not)
 */
export function requireSuperAdmin(role: RoleName): void {
  if (!isSuperAdmin(role)) {
    throw new Error('SuperAdmin access required')
  }
}
