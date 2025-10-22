// ==========================================
// ROUTE PROTECTION UTILITIES
// ==========================================
// Helper functions for checking permissions and validating access

import type { User } from '@/store/auth.store'

// ==========================================
// TYPE DEFINITIONS
// ==========================================

/**
 * User role types
 */
export type Role = 'MEMBER' | 'ADMIN' | 'SUPERADMIN'

/**
 * Permission check result
 */
export interface PermissionCheckResult {
  /** Whether access is granted */
  allowed: boolean
  /** Reason for denial (if not allowed) */
  reason?: string
  /** Missing roles (if role check failed) */
  missingRoles?: Role[]
}

/**
 * Route configuration
 */
export interface RouteConfig {
  path: string
  allowedRoles: Role[]
  requiresAuth: boolean
  description?: string
}

// ==========================================
// ROLE HIERARCHY
// ==========================================

/**
 * Role hierarchy levels
 * Higher number = more permissions
 */
const ROLE_HIERARCHY: Record<Role, number> = {
  MEMBER: 1,
  ADMIN: 2,
  SUPERADMIN: 3,
}

/**
 * Get numeric level for a role
 * 
 * @param role - User role
 * @returns Numeric level (1-3)
 */
export function getRoleLevel(role: Role): number {
  return ROLE_HIERARCHY[role] || 0
}

/**
 * Check if a role has higher or equal permissions than another
 * 
 * @param userRole - User's current role
 * @param requiredRole - Required role for access
 * @returns True if user role is sufficient
 * 
 * @example
 * ```typescript
 * hasRoleLevel('ADMIN', 'MEMBER') // true
 * hasRoleLevel('MEMBER', 'ADMIN') // false
 * hasRoleLevel('SUPERADMIN', 'ADMIN') // true
 * ```
 */
export function hasRoleLevel(userRole: Role, requiredRole: Role): boolean {
  return getRoleLevel(userRole) >= getRoleLevel(requiredRole)
}

// ==========================================
// PERMISSION CHECKS
// ==========================================

/**
 * Check if user has any of the allowed roles
 * 
 * @param userRole - User's current role
 * @param allowedRoles - Array of roles that can access resource
 * @returns Permission check result
 * 
 * @example
 * ```typescript
 * checkRole('ADMIN', ['ADMIN', 'SUPERADMIN'])
 * // Returns: { allowed: true }
 * 
 * checkRole('MEMBER', ['ADMIN'])
 * // Returns: { allowed: false, reason: 'Insufficient permissions', missingRoles: ['ADMIN'] }
 * ```
 */
export function checkRole(
  userRole: Role | string,
  allowedRoles: Role[]
): PermissionCheckResult {
  // If no roles specified, allow all authenticated users
  if (!allowedRoles || allowedRoles.length === 0) {
    return { allowed: true }
  }

  // Check if user role is in allowed roles
  const hasAccess = allowedRoles.includes(userRole as Role)

  if (hasAccess) {
    return { allowed: true }
  }

  return {
    allowed: false,
    reason: 'Insufficient permissions',
    missingRoles: allowedRoles,
  }
}

/**
 * Check if user can access a specific route
 * 
 * @param user - User object (or null if not authenticated)
 * @param allowedRoles - Array of roles allowed to access route
 * @returns Permission check result
 * 
 * @example
 * ```typescript
 * checkRouteAccess(user, ['ADMIN', 'SUPERADMIN'])
 * ```
 */
export function checkRouteAccess(
  user: User | null,
  allowedRoles?: Role[]
): PermissionCheckResult {
  // Check if user is authenticated
  if (!user) {
    return {
      allowed: false,
      reason: 'Authentication required',
    }
  }

  // If no roles specified, allow all authenticated users
  if (!allowedRoles || allowedRoles.length === 0) {
    return { allowed: true }
  }

  // Check role
  return checkRole(user.role as Role, allowedRoles)
}

/**
 * Check if user has permission for a specific action
 * 
 * @param user - User object
 * @param action - Action name (e.g., 'edit:booking', 'delete:user')
 * @param resourceOwnerId - ID of resource owner (for ownership checks)
 * @returns True if user has permission
 * 
 * @example
 * ```typescript
 * // Check if user can edit their own booking
 * canPerformAction(user, 'edit:booking', booking.userId)
 * 
 * // Check if admin can delete any user
 * canPerformAction(user, 'delete:user')
 * ```
 */
export function canPerformAction(
  user: User | null,
  action: string,
  resourceOwnerId?: string
): boolean {
  if (!user) return false

  const userRole = user.role as Role

  // SuperAdmin can do everything
  if (userRole === 'SUPERADMIN') return true

  // Check ownership (user can modify their own resources)
  if (resourceOwnerId && user.id === resourceOwnerId) {
    return true
  }

  // Role-based action permissions
  const actionPermissions: Record<string, Role[]> = {
    // Booking actions
    'create:booking': ['MEMBER', 'ADMIN', 'SUPERADMIN'],
    'view:booking': ['MEMBER', 'ADMIN', 'SUPERADMIN'],
    'edit:booking': ['ADMIN', 'SUPERADMIN'],
    'delete:booking': ['ADMIN', 'SUPERADMIN'],
    'cancel:booking': ['MEMBER', 'ADMIN', 'SUPERADMIN'],

    // User actions
    'view:profile': ['MEMBER', 'ADMIN', 'SUPERADMIN'],
    'edit:profile': ['MEMBER', 'ADMIN', 'SUPERADMIN'],
    'view:users': ['ADMIN', 'SUPERADMIN'],
    'edit:user': ['ADMIN', 'SUPERADMIN'],
    'delete:user': ['SUPERADMIN'],

    // Admin actions
    'view:reports': ['ADMIN', 'SUPERADMIN'],
    'view:analytics': ['ADMIN', 'SUPERADMIN'],
    'manage:settings': ['SUPERADMIN'],
    'manage:roles': ['SUPERADMIN'],

    // Communication actions
    'send:notification': ['ADMIN', 'SUPERADMIN'],
    'send:email': ['ADMIN', 'SUPERADMIN'],
    'manage:templates': ['SUPERADMIN'],
  }

  const allowedRoles = actionPermissions[action]
  if (!allowedRoles) return false

  return allowedRoles.includes(userRole)
}

// ==========================================
// ROUTE CONFIGURATION
// ==========================================

/**
 * Default route configurations
 * Maps routes to their access requirements
 */
export const ROUTE_CONFIGS: Record<string, RouteConfig> = {
  // Public routes
  '/login': {
    path: '/login',
    allowedRoles: [],
    requiresAuth: false,
    description: 'Login page',
  },
  '/verify-otp': {
    path: '/verify-otp',
    allowedRoles: [],
    requiresAuth: false,
    description: 'OTP verification',
  },

  // Member routes
  '/dashboard': {
    path: '/dashboard',
    allowedRoles: ['MEMBER', 'ADMIN', 'SUPERADMIN'],
    requiresAuth: true,
    description: 'User dashboard',
  },
  '/profile': {
    path: '/profile',
    allowedRoles: ['MEMBER', 'ADMIN', 'SUPERADMIN'],
    requiresAuth: true,
    description: 'User profile',
  },
  '/bookings': {
    path: '/bookings',
    allowedRoles: ['MEMBER', 'ADMIN'],
    requiresAuth: true,
    description: 'Bookings management',
  },

  // Admin routes
  '/admin/dashboard': {
    path: '/admin/dashboard',
    allowedRoles: ['ADMIN', 'SUPERADMIN'],
    requiresAuth: true,
    description: 'Admin dashboard',
  },
  '/reports': {
    path: '/reports',
    allowedRoles: ['ADMIN', 'SUPERADMIN'],
    requiresAuth: true,
    description: 'Reports and analytics',
  },

  // SuperAdmin routes
  '/communication': {
    path: '/communication',
    allowedRoles: ['SUPERADMIN'],
    requiresAuth: true,
    description: 'Communication management',
  },
  '/rules': {
    path: '/rules',
    allowedRoles: ['SUPERADMIN'],
    requiresAuth: true,
    description: 'Rules management',
  },
  '/settings': {
    path: '/settings',
    allowedRoles: ['SUPERADMIN'],
    requiresAuth: true,
    description: 'System settings',
  },
}

/**
 * Get route configuration by path
 * 
 * @param path - Route path
 * @returns Route config or undefined
 */
export function getRouteConfig(path: string): RouteConfig | undefined {
  // Try exact match first
  if (ROUTE_CONFIGS[path]) {
    return ROUTE_CONFIGS[path]
  }

  // Try prefix match (for dynamic routes)
  for (const [configPath, config] of Object.entries(ROUTE_CONFIGS)) {
    if (path.startsWith(configPath)) {
      return config
    }
  }

  return undefined
}

/**
 * Check if route requires authentication
 * 
 * @param path - Route path
 * @returns True if route requires auth
 */
export function requiresAuth(path: string): boolean {
  const config = getRouteConfig(path)
  return config?.requiresAuth ?? true // Default to requiring auth
}

/**
 * Get allowed roles for a route
 * 
 * @param path - Route path
 * @returns Array of allowed roles or undefined
 */
export function getAllowedRoles(path: string): Role[] | undefined {
  const config = getRouteConfig(path)
  return config?.allowedRoles
}

// ==========================================
// REDIRECT HELPERS
// ==========================================

/**
 * Get redirect URL for unauthorized access
 * 
 * @param user - User object (or null)
 * @param intendedPath - Path user tried to access
 * @returns Redirect URL
 * 
 * @example
 * ```typescript
 * // Not authenticated
 * getRedirectUrl(null, '/dashboard')
 * // Returns: '/login?returnUrl=%2Fdashboard'
 * 
 * // Authenticated but wrong role
 * getRedirectUrl(memberUser, '/admin')
 * // Returns: '/403?from=%2Fadmin'
 * ```
 */
export function getRedirectUrl(user: User | null, intendedPath: string): string {
  if (!user) {
    // Not authenticated - redirect to login
    const returnUrl = encodeURIComponent(intendedPath)
    return `/login?returnUrl=${returnUrl}`
  }

  // Authenticated but wrong role - redirect to forbidden
  const from = encodeURIComponent(intendedPath)
  return `/403?from=${from}`
}

/**
 * Get default dashboard route for user role
 * 
 * @param role - User role
 * @returns Default dashboard path
 */
export function getDefaultDashboard(role: Role): string {
  switch (role) {
    case 'SUPERADMIN':
      return '/admin/dashboard'
    case 'ADMIN':
      return '/admin/dashboard'
    case 'MEMBER':
      return '/dashboard'
    default:
      return '/dashboard'
  }
}

// ==========================================
// VALIDATION HELPERS
// ==========================================

/**
 * Validate role string
 * 
 * @param role - Role string to validate
 * @returns True if valid role
 */
export function isValidRole(role: string): role is Role {
  return ['MEMBER', 'ADMIN', 'SUPERADMIN'].includes(role)
}

/**
 * Normalize role string
 * Ensures role is uppercase and valid
 * 
 * @param role - Role string (any case)
 * @returns Normalized role or undefined
 */
export function normalizeRole(role: string): Role | undefined {
  const normalized = role.toUpperCase()
  return isValidRole(normalized) ? (normalized as Role) : undefined
}
