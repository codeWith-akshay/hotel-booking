// ==========================================
// RBAC (Role-Based Access Control) Utilities
// ==========================================
// Production-ready RBAC enforcement for server actions and API routes
//
// Features:
// - Hierarchical role validation
// - Type-safe role checking
// - Detailed error messages with audit trail
// - Integration with middleware user context
//
// Usage:
// - Call `requireRole()` at the top of protected server actions
// - Use `hasRole()` for conditional logic
// - Use `hasAnyRole()` for multiple role checks
//
// @see docs/RBAC_IMPLEMENTATION.md

import { RoleName } from '@prisma/client'
import { UserContext } from './middleware/auth.utils'

// ==========================================
// TYPE DEFINITIONS
// ==========================================

/**
 * Legacy interface - kept for backward compatibility
 * @deprecated Use UserContext from middleware/auth.utils instead
 */
export interface UserWithRoles {
  id: string
  email: string
  firstName: string
  lastName: string
  roles: RoleName[]
}

/**
 * RBAC Error thrown when authorization fails
 */
export class RBACError extends Error {
  code: string
  statusCode: number
  requiredRoles: RoleName[]
  userRole?: RoleName
  userId?: string

  constructor(
    message: string,
    code: string,
    requiredRoles: RoleName[],
    userRole?: RoleName,
    userId?: string
  ) {
    super(message)
    this.name = 'RBACError'
    this.code = code
    this.statusCode = 403
    this.requiredRoles = requiredRoles
    this.userRole = userRole
    this.userId = userId

    // Maintain proper stack trace for debugging (V8 only)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, RBACError)
    }
  }
}

/**
 * Context for RBAC checks
 * Typically extracted from middleware headers
 */
export interface RBACContext {
  user: UserContext | null
}

/**
 * Role hierarchy levels (higher = more privileged)
 */
const ROLE_HIERARCHY: Record<RoleName, number> = {
  MEMBER: 1,
  ADMIN: 2,
  SUPERADMIN: 3,
}

// ==========================================
// LEGACY FUNCTIONS (Backward Compatibility)
// ==========================================

/**
 * @deprecated Use hasRoleInContext instead
 */
export function hasRole(user: UserWithRoles, role: RoleName): boolean {
  return user.roles.includes(role)
}

/**
 * @deprecated Use hasAnyRoleInContext instead
 */
export function hasAnyRole(user: UserWithRoles, roles: RoleName[]): boolean {
  return roles.some(role => user.roles.includes(role))
}

export function canAccessAdminPanel(user: UserWithRoles): boolean {
  return hasAnyRole(user, [RoleName.ADMIN, RoleName.SUPERADMIN])
}

export function canAccessSuperAdminPanel(user: UserWithRoles): boolean {
  return hasRole(user, RoleName.SUPERADMIN)
}

export function canManageBookings(user: UserWithRoles): boolean {
  return hasAnyRole(user, [RoleName.ADMIN, RoleName.SUPERADMIN])
}

export function canManageUsers(user: UserWithRoles): boolean {
  return hasRole(user, RoleName.SUPERADMIN)
}

// ==========================================
// CORE RBAC FUNCTIONS (New Pattern)
// ==========================================

/**
 * Check if user has a specific role or higher in hierarchy
 * 
 * @param {RBACContext} ctx - Context containing user information
 * @param {RoleName} role - Required role
 * @returns {boolean} True if user has required role or higher
 * 
 * @example
 * ```typescript
 * const ctx = { user: await getCurrentUser() }
 * if (hasRoleInContext(ctx, 'ADMIN')) {
 *   // User is ADMIN or SUPERADMIN
 * }
 * ```
 */
export function hasRoleInContext(ctx: RBACContext, role: RoleName): boolean {
  if (!ctx.user) {
    return false
  }

  const userLevel = ROLE_HIERARCHY[ctx.user.role]
  const requiredLevel = ROLE_HIERARCHY[role]

  return userLevel >= requiredLevel
}

/**
 * Check if user has ANY of the specified roles
 * 
 * @param {RBACContext} ctx - Context containing user information
 * @param {RoleName[]} roles - Array of acceptable roles
 * @returns {boolean} True if user has any of the roles
 * 
 * @example
 * ```typescript
 * if (hasAnyRoleInContext(ctx, ['ADMIN', 'SUPERADMIN'])) {
 *   // User has admin privileges
 * }
 * ```
 */
export function hasAnyRoleInContext(ctx: RBACContext, roles: RoleName[]): boolean {
  if (!ctx.user) {
    return false
  }

  return roles.some((role) => {
    const userLevel = ROLE_HIERARCHY[ctx.user!.role]
    const roleLevel = ROLE_HIERARCHY[role]
    return userLevel >= roleLevel
  })
}

/**
 * Check if user has EXACT role (not hierarchical)
 * 
 * @param {RBACContext} ctx - Context containing user information
 * @param {RoleName} role - Exact role required
 * @returns {boolean} True if user has exact role
 * 
 * @example
 * ```typescript
 * // Only for SUPERADMIN, not ADMIN
 * if (hasExactRole(ctx, 'SUPERADMIN')) {
 *   // Superadmin-only logic
 * }
 * ```
 */
export function hasExactRole(ctx: RBACContext, role: RoleName): boolean {
  if (!ctx.user) {
    return false
  }

  return ctx.user.role === role
}

/**
 * Require user to have specific role or throw RBACError
 * Use this at the top of protected server actions
 * 
 * @param {RBACContext} ctx - Context containing user information
 * @param {RoleName[]} allowedRoles - Array of roles that have access
 * @throws {RBACError} If user doesn't have required role
 * 
 * @example
 * ```typescript
 * // Server Action
 * export async function deleteUser(userId: string) {
 *   const user = await getCurrentUser()
 *   await requireRole({ user }, ['ADMIN', 'SUPERADMIN'])
 *   
 *   // Protected logic here
 *   await prisma.user.delete({ where: { id: userId } })
 * }
 * ```
 */
export async function requireRole(
  ctx: RBACContext,
  allowedRoles: RoleName[]
): Promise<void> {
  // Check if user is authenticated
  if (!ctx.user) {
    throw new RBACError(
      'Authentication required. Please log in to access this resource.',
      'AUTHENTICATION_REQUIRED',
      allowedRoles
    )
  }

  // Check if user has required role
  const hasAccess = hasAnyRoleInContext(ctx, allowedRoles)

  if (!hasAccess) {
    // Log security event (production: send to SIEM/audit system)
    console.warn('🔒 RBAC Authorization Failed:', {
      userId: ctx.user.userId,
      userRole: ctx.user.role,
      requiredRoles: allowedRoles,
      timestamp: new Date().toISOString(),
    })

    throw new RBACError(
      `Access denied. Required role: ${allowedRoles.join(' or ')}. Your role: ${ctx.user.role}`,
      'INSUFFICIENT_PERMISSIONS',
      allowedRoles,
      ctx.user.role,
      ctx.user.userId
    )
  }

  // Success - log for audit trail (optional in production)
  if (process.env.NODE_ENV === 'development') {
    console.log('✅ RBAC Check Passed:', {
      userId: ctx.user.userId,
      userRole: ctx.user.role,
      requiredRoles: allowedRoles,
    })
  }
}

/**
 * Require authentication (any authenticated user)
 * Use when endpoint requires login but no specific role
 * 
 * @param {RBACContext} ctx - Context containing user information
 * @throws {RBACError} If user is not authenticated
 * 
 * @example
 * ```typescript
 * export async function getProfile() {
 *   const user = await getCurrentUser()
 *   await requireAuth({ user })
 *   
 *   // Any authenticated user can access
 *   return getUserProfile(user.userId)
 * }
 * ```
 */
export async function requireAuth(ctx: RBACContext): Promise<void> {
  if (!ctx.user) {
    throw new RBACError(
      'Authentication required. Please log in to access this resource.',
      'AUTHENTICATION_REQUIRED',
      []
    )
  }
}

/**
 * Require user to be owner of resource OR have admin role
 * Common pattern for user-owned resources
 * 
 * @param {RBACContext} ctx - Context containing user information
 * @param {string} resourceOwnerId - ID of the resource owner
 * @param {RoleName[]} adminRoles - Admin roles that can override ownership (default: ADMIN, SUPERADMIN)
 * @throws {RBACError} If user is neither owner nor admin
 * 
 * @example
 * ```typescript
 * export async function updateBooking(bookingId: string, updates: any) {
 *   const user = await getCurrentUser()
 *   const booking = await getBooking(bookingId)
 *   
 *   await requireOwnerOrAdmin({ user }, booking.userId, ['ADMIN', 'SUPERADMIN'])
 *   
 *   // User can update their own booking OR admin can update any booking
 *   await updateBookingInDB(bookingId, updates)
 * }
 * ```
 */
export async function requireOwnerOrAdmin(
  ctx: RBACContext,
  resourceOwnerId: string,
  adminRoles: RoleName[] = ['ADMIN', 'SUPERADMIN']
): Promise<void> {
  // Check authentication
  if (!ctx.user) {
    throw new RBACError(
      'Authentication required. Please log in to access this resource.',
      'AUTHENTICATION_REQUIRED',
      adminRoles
    )
  }

  // Check if user is owner
  const isOwner = ctx.user.userId === resourceOwnerId

  // Check if user has admin role
  const isAdmin = hasAnyRoleInContext(ctx, adminRoles)

  if (!isOwner && !isAdmin) {
    console.warn('🔒 Ownership/Admin Check Failed:', {
      userId: ctx.user.userId,
      userRole: ctx.user.role,
      resourceOwnerId,
      requiredAdminRoles: adminRoles,
      timestamp: new Date().toISOString(),
    })

    throw new RBACError(
      'Access denied. You can only access your own resources or need admin privileges.',
      'INSUFFICIENT_PERMISSIONS',
      adminRoles,
      ctx.user.role,
      ctx.user.userId
    )
  }
}

// ==========================================
// UTILITY FUNCTIONS
// ==========================================

/**
 * Get role display name for UI
 * 
 * @param {RoleName} role - Role enum value
 * @returns {string} Human-readable role name
 */
export function getRoleDisplayName(role: RoleName): string {
  const displayNames: Record<RoleName, string> = {
    MEMBER: 'Member',
    ADMIN: 'Administrator',
    SUPERADMIN: 'Super Administrator',
  }

  return displayNames[role] || role
}

/**
 * Check if one role is superior to another in hierarchy
 * 
 * @param {RoleName} role1 - First role
 * @param {RoleName} role2 - Second role
 * @returns {boolean} True if role1 is superior to role2
 */
export function isSuperiorRole(role1: RoleName, role2: RoleName): boolean {
  return ROLE_HIERARCHY[role1] > ROLE_HIERARCHY[role2]
}

/**
 * Get all roles equal to or below given role
 * 
 * @param {RoleName} role - Role to check
 * @returns {RoleName[]} Array of roles at or below given role
 * 
 * @example
 * ```typescript
 * getSubordinateRoles('ADMIN') // ['MEMBER', 'ADMIN']
 * ```
 */
export function getSubordinateRoles(role: RoleName): RoleName[] {
  const level = ROLE_HIERARCHY[role]
  return Object.entries(ROLE_HIERARCHY)
    .filter(([_, roleLevel]) => roleLevel <= level)
    .map(([roleName]) => roleName as RoleName)
}

// ==========================================
// ERROR RESPONSE HELPERS
// ==========================================

/**
 * Convert RBACError to API response format
 * 
 * @param {RBACError} error - RBAC error
 * @returns {object} API response object
 */
export function rbacErrorToResponse(error: RBACError) {
  return {
    success: false,
    error: error.message,
    code: error.code,
    details: {
      requiredRoles: error.requiredRoles,
      userRole: error.userRole,
    },
  }
}

/**
 * Check if error is an RBAC error
 * 
 * @param {any} error - Error to check
 * @returns {boolean} True if error is RBACError
 */
export function isRBACError(error: any): error is RBACError {
  return error instanceof RBACError
}