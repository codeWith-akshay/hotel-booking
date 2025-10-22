// ==========================================
// MIDDLEWARE TYPES
// ==========================================
// Type definitions for Next.js RBAC middleware

import type { RoleName } from '@prisma/client'
import type { NextRequest } from 'next/server'

/**
 * Route protection configuration
 * Defines which routes require authentication and specific roles
 */
export interface RouteConfig {
  /** Route path pattern (supports wildcards) */
  path: string
  /** Required roles to access this route */
  roles?: RoleName[]
  /** Whether authentication is required (default: true if roles specified) */
  requiresAuth?: boolean
  /** Redirect path for unauthenticated users */
  redirectTo?: string
}

/**
 * Middleware context with user information
 * Available in protected routes after successful authentication
 */
export interface MiddlewareContext {
  /** Authenticated user ID */
  userId: string
  /** User's phone number */
  phone: string
  /** User's email (optional) */
  email?: string | null
  /** User's display name */
  name: string
  /** User's role name */
  role: RoleName
  /** Role ID */
  roleId: string
  /** Token issued at (Unix timestamp) */
  iat: number
  /** Token expires at (Unix timestamp) */
  exp: number
}

/**
 * Middleware error response
 */
export interface MiddlewareErrorResponse {
  success: false
  error: string
  message: string
  code: 'UNAUTHORIZED' | 'FORBIDDEN' | 'INVALID_TOKEN' | 'TOKEN_EXPIRED'
  statusCode: 401 | 403
}

/**
 * Extended NextRequest with user context
 * Use this type in route handlers to access authenticated user info
 */
export interface AuthenticatedRequest extends NextRequest {
  user?: MiddlewareContext
}

/**
 * Route matcher function
 * Returns true if the route should be protected
 */
export type RouteMatcherFn = (pathname: string) => boolean

/**
 * Middleware configuration
 */
export interface MiddlewareConfig {
  /** Protected routes configuration */
  routes: RouteConfig[]
  /** Public routes that bypass authentication */
  publicRoutes?: string[]
  /** Default redirect path for unauthenticated users */
  defaultRedirect?: string
  /** Enable debug logging */
  debug?: boolean
}
