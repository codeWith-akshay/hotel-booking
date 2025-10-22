// ==========================================
// MIDDLEWARE UTILITIES
// ==========================================
// Helper functions to access authenticated user context
// in API routes and server components

import { headers } from 'next/headers'
import type { RoleName } from '@prisma/client'

/**
 * User context from middleware
 * Available in protected routes after authentication
 */
export interface UserContext {
  userId: string
  phone: string
  name: string
  role: RoleName
}

/**
 * Get authenticated user context from middleware headers
 * Use this in API route handlers and server components
 * 
 * @returns {Promise<UserContext | null>} User context or null if not authenticated
 * 
 * @example
 * ```typescript
 * // API Route Handler
 * export async function GET(request: Request) {
 *   const user = await getCurrentUser()
 *   
 *   if (!user) {
 *     return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
 *   }
 *   
 *   return NextResponse.json({ userId: user.userId, name: user.name })
 * }
 * ```
 * 
 * @example
 * ```typescript
 * // Server Component
 * export default async function DashboardPage() {
 *   const user = await getCurrentUser()
 *   
 *   if (!user) {
 *     redirect('/login')
 *   }
 *   
 *   return <div>Welcome, {user.name}!</div>
 * }
 * ```
 */
export async function getCurrentUser(): Promise<UserContext | null> {
  try {
    const headersList = await headers()
    
    const userId = headersList.get('x-user-id')
    const phone = headersList.get('x-user-phone')
    const name = headersList.get('x-user-name')
    const role = headersList.get('x-user-role') as RoleName | null

    if (!userId || !phone || !name || !role) {
      return null
    }

    return {
      userId,
      phone,
      name,
      role,
    }
  } catch (error) {
    console.error('Failed to get current user:', error)
    return null
  }
}

/**
 * Require authenticated user (throws if not authenticated)
 * Use this when authentication is mandatory
 * 
 * @returns {Promise<UserContext>} User context
 * @throws {Error} If user is not authenticated
 * 
 * @example
 * ```typescript
 * export async function GET(request: Request) {
 *   try {
 *     const user = await requireAuth()
 *     return NextResponse.json({ userId: user.userId })
 *   } catch (error) {
 *     return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
 *   }
 * }
 * ```
 */
export async function requireAuth(): Promise<UserContext> {
  const user = await getCurrentUser()
  
  if (!user) {
    throw new Error('Authentication required')
  }
  
  return user
}

/**
 * Check if user has specific role
 * 
 * @param {RoleName | RoleName[]} requiredRole - Required role(s)
 * @returns {Promise<boolean>} True if user has required role
 * 
 * @example
 * ```typescript
 * export async function DELETE(request: Request) {
 *   const isAdmin = await hasRole('ADMIN')
 *   
 *   if (!isAdmin) {
 *     return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
 *   }
 *   
 *   // Delete operation
 * }
 * ```
 */
export async function hasRole(
  requiredRole: RoleName | RoleName[]
): Promise<boolean> {
  const user = await getCurrentUser()
  
  if (!user) {
    return false
  }
  
  const roles = Array.isArray(requiredRole) ? requiredRole : [requiredRole]
  return roles.includes(user.role)
}

/**
 * Require specific role (throws if user doesn't have role)
 * 
 * @param {RoleName | RoleName[]} requiredRole - Required role(s)
 * @returns {Promise<UserContext>} User context
 * @throws {Error} If user doesn't have required role
 * 
 * @example
 * ```typescript
 * export async function POST(request: Request) {
 *   try {
 *     const user = await requireRole(['ADMIN', 'SUPERADMIN'])
 *     // Admin operation
 *   } catch (error) {
 *     return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
 *   }
 * }
 * ```
 */
export async function requireRole(
  requiredRole: RoleName | RoleName[]
): Promise<UserContext> {
  const user = await requireAuth()
  const roles = Array.isArray(requiredRole) ? requiredRole : [requiredRole]
  
  if (!roles.includes(user.role)) {
    throw new Error(
      `Insufficient permissions. Required role: ${roles.join(' or ')}`
    )
  }
  
  return user
}

/**
 * Check if user is admin (ADMIN or SUPERADMIN)
 * 
 * @returns {Promise<boolean>} True if user is admin
 */
export async function isAdmin(): Promise<boolean> {
  return hasRole(['ADMIN', 'SUPERADMIN'])
}

/**
 * Check if user is superadmin
 * 
 * @returns {Promise<boolean>} True if user is superadmin
 */
export async function isSuperAdmin(): Promise<boolean> {
  return hasRole('SUPERADMIN')
}

/**
 * Get user ID (shorthand for getCurrentUser().userId)
 * 
 * @returns {Promise<string | null>} User ID or null
 */
export async function getUserId(): Promise<string | null> {
  const user = await getCurrentUser()
  return user?.userId || null
}
