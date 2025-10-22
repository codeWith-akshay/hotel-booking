// ==========================================
// ROOM RBAC HELPER
// ==========================================
// Role-based access control for room management operations
// Ensures only Admin and SuperAdmin can perform CRUD operations

'use server'

import { cookies } from 'next/headers'
import { prisma } from '@/lib/prisma'
import type { UserRole, UserSession } from '@/types/room.types'

// ==========================================
// SESSION MANAGEMENT
// ==========================================

/**
 * Get current user session from cookies
 * Returns user information including role and permissions
 * 
 * @returns User session object or null if not authenticated
 */
export async function getCurrentUserSession(): Promise<UserSession | null> {
  try {
    const cookieStore = await cookies()
    const userId = cookieStore.get('userId')?.value

    if (!userId) {
      return null
    }

    // Fetch user with role
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        role: true,
      },
    })

    if (!user) {
      return null
    }

    // Parse permissions from role
    const permissions = Array.isArray(user.role.permissions)
      ? user.role.permissions
      : typeof user.role.permissions === 'string'
      ? JSON.parse(user.role.permissions)
      : []

    return {
      userId: user.id,
      role: user.role.name as UserRole,
      permissions,
    }
  } catch (error) {
    console.error('Error fetching user session:', error)
    return null
  }
}

// ==========================================
// AUTHORIZATION CHECKS
// ==========================================

/**
 * Check if user has required role
 * Admin and SuperAdmin are allowed for room operations
 * 
 * @param allowedRoles - Array of roles that can perform the operation
 * @returns Object with authorized status and user session
 */
export async function checkRoleAuthorization(
  allowedRoles: UserRole[] = ['ADMIN', 'SUPERADMIN']
): Promise<{ authorized: boolean; session: UserSession | null; message?: string }> {
  const session = await getCurrentUserSession()

  if (!session) {
    return {
      authorized: false,
      session: null,
      message: 'Authentication required. Please log in.',
    }
  }

  if (!allowedRoles.includes(session.role)) {
    return {
      authorized: false,
      session,
      message: `Access denied. Required role: ${allowedRoles.join(' or ')}. Your role: ${session.role}.`,
    }
  }

  return {
    authorized: true,
    session,
  }
}

/**
 * Check if user has specific permission
 * 
 * @param permission - Permission string to check
 * @param session - Optional user session (fetches if not provided)
 * @returns True if user has permission, false otherwise
 */
export async function hasPermission(
  permission: string,
  session?: UserSession | null
): Promise<boolean> {
  const userSession = session || (await getCurrentUserSession())

  if (!userSession) {
    return false
  }

  // SuperAdmin has wildcard permission
  if (userSession.role === 'SUPERADMIN') {
    return true
  }

  // Check if user has wildcard or specific permission
  return (
    userSession.permissions.includes('all:*') ||
    userSession.permissions.includes(permission)
  )
}

/**
 * Check if user has any of the specified permissions
 * 
 * @param permissions - Array of permission strings
 * @param session - Optional user session (fetches if not provided)
 * @returns True if user has at least one permission
 */
export async function hasAnyPermission(
  permissions: string[],
  session?: UserSession | null
): Promise<boolean> {
  const userSession = session || (await getCurrentUserSession())

  if (!userSession) {
    return false
  }

  // SuperAdmin has wildcard permission
  if (userSession.role === 'SUPERADMIN') {
    return true
  }

  // Check if user has any of the permissions
  return permissions.some(
    (permission) =>
      userSession.permissions.includes('all:*') ||
      userSession.permissions.includes(permission)
  )
}

/**
 * Check if user can perform room type operations
 * Requires 'room:*' permissions or Admin/SuperAdmin role
 * 
 * @param operation - Type of operation (create, read, update, delete)
 * @returns Authorization result
 */
export async function canManageRoomTypes(
  operation: 'create' | 'read' | 'update' | 'delete'
): Promise<{ authorized: boolean; session: UserSession | null; message?: string }> {
  const { authorized, session, message } = await checkRoleAuthorization([
    'ADMIN',
    'SUPERADMIN',
  ])

  if (!authorized) {
    return { authorized: false, session, ...(message && { message }) }
  }

  // Check specific permission
  const permission = `room:${operation}`
  const hasRequiredPermission = await hasPermission(permission, session)

  if (!hasRequiredPermission && operation !== 'read') {
    return {
      authorized: false,
      session,
      message: `Missing required permission: ${permission}`,
    }
  }

  return {
    authorized: true,
    session,
  }
}

/**
 * Check if user can perform inventory operations
 * Requires 'inventory:*' permissions or Admin/SuperAdmin role
 * 
 * @param operation - Type of operation (create, read, update, delete)
 * @returns Authorization result
 */
export async function canManageInventory(
  operation: 'create' | 'read' | 'update' | 'delete'
): Promise<{ authorized: boolean; session: UserSession | null; message?: string }> {
  const { authorized, session, message } = await checkRoleAuthorization([
    'ADMIN',
    'SUPERADMIN',
  ])

  if (!authorized) {
    return { authorized: false, session, ...(message && { message }) }
  }

  // Check specific permission
  const permission = `inventory:${operation}`
  const hasRequiredPermission = await hasPermission(permission, session)

  if (!hasRequiredPermission && operation !== 'read') {
    return {
      authorized: false,
      session,
      message: `Missing required permission: ${permission}`,
    }
  }

  return {
    authorized: true,
    session,
  }
}

// ==========================================
// AUTHORIZATION DECORATOR
// ==========================================

/**
 * Higher-order function to wrap server actions with authorization
 * Automatically checks user permissions before executing the action
 * 
 * @param action - The server action function to wrap
 * @param requiredRoles - Array of roles that can perform the operation
 * @returns Wrapped function with authorization check
 * 
 * @example
 * ```typescript
 * const protectedAction = withAuth(async (input) => {
 *   // Action logic here
 * }, ['ADMIN', 'SUPERADMIN'])
 * ```
 */
export function withAuth<TInput, TOutput>(
  action: (input: TInput, session: UserSession) => Promise<TOutput>,
  requiredRoles: UserRole[] = ['ADMIN', 'SUPERADMIN']
) {
  return async (input: TInput): Promise<TOutput> => {
    const { authorized, session, message } = await checkRoleAuthorization(requiredRoles)

    if (!authorized || !session) {
      return {
        success: false,
        message: message || 'Unauthorized access',
        data: null,
      } as TOutput
    }

    return action(input, session)
  }
}

// ==========================================
// AUDIT LOGGING (Optional)
// ==========================================

/**
 * Log room management operations for audit trail
 * Can be extended to store in database
 * 
 * @param action - Action performed
 * @param userId - User who performed the action
 * @param details - Additional details about the operation
 */
export async function logRoomOperation(
  action: string,
  userId: string,
  details: Record<string, unknown>
): Promise<void> {
  try {
    console.log('Room Operation:', {
      timestamp: new Date().toISOString(),
      action,
      userId,
      details,
    })

    // TODO: Store in audit log table
    // await prisma.auditLog.create({
    //   data: {
    //     action,
    //     userId,
    //     details: JSON.stringify(details),
    //     timestamp: new Date(),
    //   },
    // })
  } catch (error) {
    console.error('Error logging room operation:', error)
    // Don't throw - logging should not break the operation
  }
}
