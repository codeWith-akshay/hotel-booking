/**
 * Role-Based Access Control (RBAC) Utilities
 * 
 * Provides middleware and helper functions for protecting routes
 * and checking user permissions based on roles.
 * 
 * @module rbac.utils
 */

import { RoleName } from '@prisma/client'
import { verifyAccessToken, type DecodedToken } from '@/lib/auth/jwt.service'
import { cookies } from 'next/headers'

// ==========================================
// TYPE DEFINITIONS
// ==========================================

/**
 * Authorization result
 */
export interface AuthCheck {
  authorized: boolean
  user?: DecodedToken
  error?: string
}

// ==========================================
// ROLE HIERARCHY
// ==========================================

/**
 * Role hierarchy (higher number = more privileges)
 */
const ROLE_HIERARCHY: Record<RoleName, number> = {
  [RoleName.MEMBER]: 1,
  [RoleName.ADMIN]: 2,
  [RoleName.SUPERADMIN]: 3,
}

/**
 * Check if a role has higher or equal privileges than required role
 * 
 * @param {string} userRole - User's current role
 * @param {RoleName} requiredRole - Required role for access
 * @returns {boolean} True if user has sufficient privileges
 * 
 * @example
 * hasRoleAccess('ADMIN', RoleName.MEMBER) // true
 * hasRoleAccess('MEMBER', RoleName.ADMIN) // false
 */
export function hasRoleAccess(userRole: string, requiredRole: RoleName): boolean {
  const userLevel = ROLE_HIERARCHY[userRole as RoleName] || 0
  const requiredLevel = ROLE_HIERARCHY[requiredRole] || 0
  
  return userLevel >= requiredLevel
}

// ==========================================
// AUTHENTICATION CHECKS
// ==========================================

/**
 * Check if user is authenticated
 * Verifies JWT token from HTTP-only cookie
 * 
 * @returns {Promise<AuthCheck>} Auth check result
 * 
 * @example
 * const { authorized, user } = await isAuthenticated()
 * if (!authorized) {
 *   return redirect('/login')
 * }
 */
export async function isAuthenticated(): Promise<AuthCheck> {
  try {
    const cookieStore = await cookies()
    const authCookie = cookieStore.get('auth-session')

    if (!authCookie || !authCookie.value) {
      return {
        authorized: false,
        error: 'No authentication token found',
      }
    }

    const decoded = verifyAccessToken(authCookie.value)

    if (!decoded) {
      return {
        authorized: false,
        error: 'Invalid or expired token',
      }
    }

    return {
      authorized: true,
      user: decoded,
    }
  } catch (error) {
    console.error('Error checking authentication:', error)
    return {
      authorized: false,
      error: 'Authentication check failed',
    }
  }
}

/**
 * Check if user has required role
 * 
 * @param {RoleName} requiredRole - Minimum required role
 * @returns {Promise<AuthCheck>} Auth check result
 * 
 * @example
 * const { authorized, user } = await hasRole(RoleName.ADMIN)
 * if (!authorized) {
 *   return new Response('Forbidden', { status: 403 })
 * }
 */
export async function hasRole(requiredRole: RoleName): Promise<AuthCheck> {
  const authCheck = await isAuthenticated()

  if (!authCheck.authorized || !authCheck.user) {
    return authCheck
  }

  const userRole = authCheck.user.role

  if (!hasRoleAccess(userRole, requiredRole)) {
    return {
      authorized: false,
      user: authCheck.user,
      error: 'Insufficient privileges',
    }
  }

  return {
    authorized: true,
    user: authCheck.user,
  }
}

/**
 * Check if user has one of the specified roles
 * 
 * @param {RoleName[]} allowedRoles - Array of allowed roles
 * @returns {Promise<AuthCheck>} Auth check result
 * 
 * @example
 * const { authorized } = await hasAnyRole([RoleName.ADMIN, RoleName.SUPERADMIN])
 */
export async function hasAnyRole(allowedRoles: RoleName[]): Promise<AuthCheck> {
  const authCheck = await isAuthenticated()

  if (!authCheck.authorized || !authCheck.user) {
    return authCheck
  }

  const userRole = authCheck.user.role as RoleName

  if (!allowedRoles.includes(userRole)) {
    return {
      authorized: false,
      user: authCheck.user,
      error: 'Insufficient privileges',
    }
  }

  return {
    authorized: true,
    user: authCheck.user,
  }
}

// ==========================================
// ROLE CHECKS
// ==========================================

/**
 * Check if user is a member (any authenticated user)
 */
export async function isMember(): Promise<AuthCheck> {
  return hasRole(RoleName.MEMBER)
}

/**
 * Check if user is an admin
 */
export async function isAdmin(): Promise<AuthCheck> {
  return hasRole(RoleName.ADMIN)
}

/**
 * Check if user is a superadmin
 */
export async function isSuperAdmin(): Promise<AuthCheck> {
  return hasRole(RoleName.SUPERADMIN)
}

// ==========================================
// MIDDLEWARE HELPERS
// ==========================================

/**
 * Create unauthorized response
 * 
 * @param {string} message - Error message
 * @returns {Response} 401 response
 */
export function unauthorizedResponse(message: string = 'Authentication required'): Response {
  return new Response(
    JSON.stringify({
      success: false,
      error: 'Unauthorized',
      message,
    }),
    {
      status: 401,
      headers: {
        'Content-Type': 'application/json',
      },
    }
  )
}

/**
 * Create forbidden response
 * 
 * @param {string} message - Error message
 * @returns {Response} 403 response
 */
export function forbiddenResponse(message: string = 'Insufficient privileges'): Response {
  return new Response(
    JSON.stringify({
      success: false,
      error: 'Forbidden',
      message,
    }),
    {
      status: 403,
      headers: {
        'Content-Type': 'application/json',
      },
    }
  )
}

// ==========================================
// API ROUTE PROTECTION
// ==========================================

/**
 * Protect API route with authentication and role check
 * 
 * @param {Function} handler - API route handler
 * @param {RoleName} requiredRole - Minimum required role
 * @returns {Function} Protected handler
 * 
 * @example
 * export const GET = protectRoute(
 *   async (request, { user }) => {
 *     // user is guaranteed to be authenticated and have required role
 *     return NextResponse.json({ data: 'protected data' })
 *   },
 *   RoleName.ADMIN
 * )
 */
export function protectRoute(
  handler: (request: Request, context: { user: DecodedToken }, ...args: any[]) => Promise<Response>,
  requiredRole: RoleName = RoleName.MEMBER
) {
  return async (request: Request, ...args: any[]): Promise<Response> => {
    const authCheck = await hasRole(requiredRole)

    if (!authCheck.authorized) {
      if (!authCheck.user) {
        return unauthorizedResponse(authCheck.error)
      }
      return forbiddenResponse(authCheck.error)
    }

    return handler(request, { user: authCheck.user! }, ...args)
  }
}
