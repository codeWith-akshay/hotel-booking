// ==========================================
// NEXT.JS MIDDLEWARE - RBAC (Role-Based Access Control)
// ==========================================
// Authentication and authorization middleware for Next.js 15+
// Protects routes based on JWT tokens and user roles
//
// Features:
// - JWT token verification from Authorization header or cookies
// - Role-based access control (RBAC)
// - Automatic redirects for unauthorized access
// - JSON error responses for API routes
// - User context injection into request headers
// - Comprehensive logging and error handling
//
// @see https://nextjs.org/docs/app/building-your-application/routing/middleware
// @see https://nextjs.org/docs/app/api-reference/functions/next-request

import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import jwt from 'jsonwebtoken'
import type { RoleName } from '@prisma/client'
import type {
  MiddlewareContext,
  MiddlewareErrorResponse,
  RouteConfig,
} from './src/types/middleware.types'

// Import audit logging - NOTE: Can't use in middleware due to Prisma Edge limitations
// Audit logging will be done in API routes instead
// import { logAccessGranted, logAccessDenied } from './src/lib/services/audit.service'

// ==========================================
// CONFIGURATION
// ==========================================

/**
 * JWT Secret for token verification
 * IMPORTANT: Set JWT_ACCESS_SECRET environment variable in production
 * @default 'your-access-secret-change-in-production'
 */
const JWT_ACCESS_SECRET =
  process.env.JWT_ACCESS_SECRET || 'your-access-secret-change-in-production'

/**
 * Enable debug logging
 * Set to false in production for performance
 */
const DEBUG_MODE = true  // Force enable for debugging

// Log when middleware file is loaded
console.log('========================================')
console.log('🚀 MIDDLEWARE FILE LOADED!')
console.log('========================================')

/**
 * Route protection configuration
 * Define which routes require authentication and specific roles
 * 
 * NOTE: Page routes (/admin, /dashboard, etc.) are protected client-side by ProtectedRoute component
 * This middleware protects API routes and adds audit logging
 * 
 * Path patterns:
 * - Exact match: '/api/user' matches only /api/user
 * - Prefix match: '/api/admin' matches /api/admin, /api/admin/users, etc.
 * - Wildcard: '/api/admin*' explicitly matches all /api/admin/* routes
 * 
 * Role hierarchy (most to least privileged):
 * 1. SUPERADMIN - Full system access + system management
 * 2. ADMIN - Administrative access to bookings, rooms, users
 * 3. MEMBER - Basic user access to own bookings
 */
const PROTECTED_ROUTES: RouteConfig[] = [
  // ==========================================
  // MEMBER ROUTES (All authenticated users)
  // ==========================================
  {
    path: '/api/user/profile',
    roles: ['MEMBER', 'ADMIN', 'SUPERADMIN'],
    requiresAuth: true,
  },
  {
    path: '/api/bookings/my-bookings',
    roles: ['MEMBER', 'ADMIN', 'SUPERADMIN'],
    requiresAuth: true,
  },
  {
    path: '/api/bookings/create',
    roles: ['MEMBER', 'ADMIN', 'SUPERADMIN'],
    requiresAuth: true,
  },
  {
    path: '/api/payments/process',
    roles: ['MEMBER', 'ADMIN', 'SUPERADMIN'],
    requiresAuth: true,
  },
  {
    path: '/api/notifications/user',
    roles: ['MEMBER', 'ADMIN', 'SUPERADMIN'],
    requiresAuth: true,
  },

  // ==========================================
  // ADMIN ROUTES (Admin + SuperAdmin only)
  // ==========================================
  
  // Booking Management
  {
    path: '/api/admin/bookings',
    roles: ['ADMIN', 'SUPERADMIN'],
    requiresAuth: true,
  },
  {
    path: '/api/admin/bookings/override',
    roles: ['ADMIN', 'SUPERADMIN'],
    requiresAuth: true,
  },
  {
    path: '/api/admin/bookings/checkin',
    roles: ['ADMIN', 'SUPERADMIN'],
    requiresAuth: true,
  },
  {
    path: '/api/admin/bookings/checkout',
    roles: ['ADMIN', 'SUPERADMIN'],
    requiresAuth: true,
  },
  
  // Room Management
  {
    path: '/api/admin/rooms',
    roles: ['ADMIN', 'SUPERADMIN'],
    requiresAuth: true,
  },
  {
    path: '/api/admin/room-types',
    roles: ['ADMIN', 'SUPERADMIN'],
    requiresAuth: true,
  },
  
  // Inventory Management
  {
    path: '/api/admin/inventory',
    roles: ['ADMIN', 'SUPERADMIN'],
    requiresAuth: true,
  },
  
  // Payment Management
  {
    path: '/api/admin/payments',
    roles: ['ADMIN', 'SUPERADMIN'],
    requiresAuth: true,
  },
  {
    path: '/api/admin/payments/refund',
    roles: ['ADMIN', 'SUPERADMIN'],
    requiresAuth: true,
  },
  
  // User Management
  {
    path: '/api/admin/users',
    roles: ['ADMIN', 'SUPERADMIN'],
    requiresAuth: true,
  },
  
  // Notification Management
  {
    path: '/api/admin/notifications',
    roles: ['ADMIN', 'SUPERADMIN'],
    requiresAuth: true,
  },
  {
    path: '/api/admin/broadcast',
    roles: ['ADMIN', 'SUPERADMIN'],
    requiresAuth: true,
  },
  
  // Reports & Analytics
  {
    path: '/api/admin/reports',
    roles: ['ADMIN', 'SUPERADMIN'],
    requiresAuth: true,
  },
  {
    path: '/api/admin/analytics',
    roles: ['ADMIN', 'SUPERADMIN'],
    requiresAuth: true,
  },
  
  // Waitlist Management
  {
    path: '/api/admin/waitlist',
    roles: ['ADMIN', 'SUPERADMIN'],
    requiresAuth: true,
  },

  // ==========================================
  // SUPERADMIN ROUTES (SuperAdmin only)
  // ==========================================
  
  // User Role Management
  {
    path: '/api/superadmin/users/role',
    roles: ['SUPERADMIN'],
    requiresAuth: true,
  },
  {
    path: '/api/superadmin/users/delete',
    roles: ['SUPERADMIN'],
    requiresAuth: true,
  },
  
  // System Management
  {
    path: '/api/superadmin/system',
    roles: ['SUPERADMIN'],
    requiresAuth: true,
  },
  {
    path: '/api/superadmin/settings',
    roles: ['SUPERADMIN'],
    requiresAuth: true,
  },
  {
    path: '/api/superadmin/backup',
    roles: ['SUPERADMIN'],
    requiresAuth: true,
  },
  
  // Audit Logs
  {
    path: '/api/superadmin/audit-logs',
    roles: ['SUPERADMIN'],
    requiresAuth: true,
  },
  {
    path: '/api/admin/audit-logs',
    roles: ['ADMIN', 'SUPERADMIN'],
    requiresAuth: true,
  },
  
  // Data Export
  {
    path: '/api/superadmin/export',
    roles: ['SUPERADMIN'],
    requiresAuth: true,
  },
  
  // Payment Overrides
  {
    path: '/api/superadmin/payments/override',
    roles: ['SUPERADMIN'],
    requiresAuth: true,
  },

  // Catch-all admin routes
  {
    path: '/api/admin',
    roles: ['ADMIN', 'SUPERADMIN'],
    requiresAuth: true,
  },
  {
    path: '/api/superadmin',
    roles: ['SUPERADMIN'],
    requiresAuth: true,
  },
]

/**
 * Public routes that bypass authentication
 * These routes are accessible to everyone without a token
 * 
 * Special patterns:
 * - Exact match: '/' matches only the root
 * - Directory match: '/login' matches /login and /login/*
 * - Static assets: '/_next', '/favicon.ico'
 */
const PUBLIC_ROUTES = [
  '/',
  '/login',
  '/verify-otp',
  '/api/auth/request-otp',
  '/api/auth/verify-otp',
  '/api/auth/logout',
  '/_next',
  '/favicon.ico',
]

// ==========================================
// HELPER FUNCTIONS
// ==========================================

/**
 * Check if route is public (no authentication required)
 * 
 * @param {string} pathname - Request pathname to check
 * @returns {boolean} True if route is public
 * 
 * @example
 * isPublicRoute('/login') // true
 * isPublicRoute('/dashboard') // false
 */
function isPublicRoute(pathname: string): boolean {
  return PUBLIC_ROUTES.some((route) => {
    if (route.endsWith('*')) {
      // Wildcard match: '/api/auth*' matches '/api/auth/login'
      return pathname.startsWith(route.slice(0, -1))
    }
    // Exact or prefix match
    return pathname === route || pathname.startsWith(route + '/')
  })
}

/**
 * Find matching protected route configuration
 * Returns the first matching route config based on pathname
 * 
 * @param {string} pathname - Request pathname to check
 * @returns {RouteConfig | undefined} Matching route config or undefined
 * 
 * @example
 * findRouteConfig('/dashboard') // { path: '/dashboard', roles: ['MEMBER', ...], ... }
 * findRouteConfig('/api/admin/users') // { path: '/api/admin', roles: ['ADMIN', ...], ... }
 */
function findRouteConfig(pathname: string): RouteConfig | undefined {
  const matched = PROTECTED_ROUTES.find((route) => {
    if (route.path.endsWith('*')) {
      // Wildcard match
      return pathname.startsWith(route.path.slice(0, -1))
    }
    // Exact or prefix match
    return pathname === route.path || pathname.startsWith(route.path + '/')
  })
  
  if (DEBUG_MODE && matched) {
    console.log(`[Middleware] 🎯 Route matched: ${pathname} → ${matched.path}`)
  } else if (DEBUG_MODE && !matched) {
    console.log(`[Middleware] ❌ No route match for: ${pathname}`)
  }
  
  return matched
}

/**
 * Check if user has required role
 * Validates user's role against required roles for a route
 * 
 * @param {RoleName} userRole - User's current role
 * @param {RoleName[] | undefined} requiredRoles - Required roles for access
 * @returns {boolean} True if user has permission
 * 
 * @example
 * hasRequiredRole('ADMIN', ['ADMIN', 'SUPERADMIN']) // true
 * hasRequiredRole('MEMBER', ['ADMIN']) // false
 * hasRequiredRole('ADMIN', undefined) // true (no role requirement)
 */
function hasRequiredRole(
  userRole: RoleName,
  requiredRoles?: RoleName[]
): boolean {
  // No role requirement - allow access
  if (!requiredRoles || requiredRoles.length === 0) {
    return true
  }
  // Check if user's role is in the required roles list
  return requiredRoles.includes(userRole)
}

/**
 * Extract JWT token from request
 * Checks both Authorization header (Bearer token) and auth-session cookie
 * Priority: Authorization header > Cookie
 * 
 * @param {NextRequest} request - Next.js request object
 * @returns {string | null} JWT token or null if not found
 * 
 * @example
 * // Request with Bearer token:
 * // Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 * extractToken(request) // 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
 * 
 * @example
 * // Request with cookie:
 * // Cookie: auth-session=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 * extractToken(request) // 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
 */
function extractToken(request: NextRequest): string | null {
  // 1. Check Authorization header (preferred for API calls)
  const authHeader = request.headers.get('authorization')
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7) // Remove 'Bearer ' prefix
  }

  // 2. Check auth-session cookie (preferred for browser requests)
  const sessionCookie = request.cookies.get('auth-session')
  if (sessionCookie) {
    return sessionCookie.value
  }

  return null
}

/**
 * Verify and decode JWT token
 * Validates token signature and expiration
 * 
 * @param {string} token - JWT token to verify
 * @returns {MiddlewareContext | null} Decoded token payload or null if invalid
 * 
 * @example
 * const user = verifyToken('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...')
 * if (user) {
 *   console.log(user.userId, user.role)
 * }
 */
function verifyToken(token: string): MiddlewareContext | null {
  try {
    // Verify token signature and decode payload
    const decoded = jwt.verify(token, JWT_ACCESS_SECRET) as MiddlewareContext

    // Validate required fields
    if (!decoded.userId || !decoded.role) {
      if (DEBUG_MODE) {
        console.error('[Middleware] Invalid token: missing required fields')
      }
      return null
    }

    return decoded
  } catch (error) {
    // Handle different error types
    if (error instanceof jwt.TokenExpiredError) {
      if (DEBUG_MODE) {
        console.error('[Middleware] Token expired:', error.message)
      }
    } else if (error instanceof jwt.JsonWebTokenError) {
      if (DEBUG_MODE) {
        console.error('[Middleware] Invalid token:', error.message)
      }
    } else {
      if (DEBUG_MODE) {
        console.error('[Middleware] Token verification failed:', error)
      }
    }
    return null
  }
}

/**
 * Create JSON error response for API routes
 * Returns properly formatted error with appropriate status code
 * 
 * @param {MiddlewareErrorResponse} error - Error response object
 * @returns {NextResponse<MiddlewareErrorResponse>} JSON error response
 * 
 * @example
 * return createErrorResponse({
 *   success: false,
 *   error: 'Unauthorized',
 *   message: 'No token provided',
 *   code: 'UNAUTHORIZED',
 *   statusCode: 401
 * })
 */
function createErrorResponse(
  error: MiddlewareErrorResponse
): NextResponse<MiddlewareErrorResponse> {
  return NextResponse.json(error, { status: error.statusCode })
}

/**
 * Create redirect response for browser navigation
 * Redirects user to login with return URL parameter
 * 
 * @param {NextRequest} request - Next.js request object
 * @param {string} redirectTo - Redirect destination (usually '/login')
 * @returns {NextResponse} Redirect response
 * 
 * @example
 * // User tries to access /dashboard
 * // Redirects to /login?returnTo=/dashboard
 * createRedirectResponse(request, '/login')
 */
function createRedirectResponse(
  request: NextRequest,
  redirectTo: string
): NextResponse {
  const loginUrl = new URL(redirectTo, request.url)
  
  // Add return URL for redirect after login
  // This allows redirecting back to the original page after authentication
  loginUrl.searchParams.set('returnTo', request.nextUrl.pathname)
  
  return NextResponse.redirect(loginUrl)
}

// ==========================================
// MIDDLEWARE FUNCTION
// ==========================================

/**
 * Next.js Middleware - Main entry point
 * Runs on every request matching the matcher config
 * Performs authentication and authorization checks
 * 
 * Flow:
 * 1. Check if route is public → allow
 * 2. Check if route is protected → verify token
 * 3. Verify user has required role → allow/deny
 * 4. Inject user context into request headers
 * 
 * @param {NextRequest} request - Incoming request
 * @returns {NextResponse} Response, redirect, or modified request
 * 
 * @see https://nextjs.org/docs/app/building-your-application/routing/middleware
 */
export default function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // FORCE LOG - Always visible regardless of DEBUG_MODE
  console.log(`========================================`)
  console.log(`[Middleware] 🔵 EXECUTING for: ${pathname}`)
  console.log(`[Middleware] 🔍 Cookies present:`, request.cookies.getAll().map(c => c.name))
  console.log(`========================================`)

  if (DEBUG_MODE) {
    console.log(`[Middleware] 🔵 Processing: ${pathname}`)
  }

  // ==========================================
  // STEP 1: Check if route is public
  // ==========================================
  if (isPublicRoute(pathname)) {
    if (DEBUG_MODE) {
      console.log(`[Middleware] ✅ Public route: ${pathname}`)
    }
    return NextResponse.next()
  }

  // ==========================================
  // STEP 2: Find route configuration
  // ==========================================
  const routeConfig = findRouteConfig(pathname)

  // If no route config found, allow access (fail open strategy)
  // Add routes to PROTECTED_ROUTES to secure them
  if (!routeConfig) {
    if (DEBUG_MODE) {
      console.log(`[Middleware] ⚠️  No config for: ${pathname} (allowing access)`)
    }
    return NextResponse.next()
  }

  if (DEBUG_MODE) {
    console.log(`[Middleware] 🔒 Protected route matched: ${routeConfig.path}`)
  }

  // ==========================================
  // STEP 3: Extract and verify token
  // ==========================================
  const token = extractToken(request)

  if (DEBUG_MODE) {
    console.log(`[Middleware] 🔍 Token extraction for ${pathname}:`, {
      hasAuthHeader: !!request.headers.get('authorization'),
      hasAuthCookie: !!request.cookies.get('auth-session'),
      tokenFound: !!token,
      tokenPreview: token ? `${token.substring(0, 20)}...` : 'none',
    })
  }

  if (!token) {
    // No token provided
    if (DEBUG_MODE) {
      console.warn(`[Middleware] ❌ No token provided for: ${pathname}`)
    }

    // For API routes, return JSON error
    if (pathname.startsWith('/api/')) {
      return createErrorResponse({
        success: false,
        error: 'Authentication required',
        message: 'No authentication token provided. Please log in.',
        code: 'UNAUTHORIZED',
        statusCode: 401,
      })
    }

    // For browser requests, redirect to login
    return createRedirectResponse(
      request,
      routeConfig.redirectTo || '/login'
    )
  }

  // Verify token signature and expiration
  const user = verifyToken(token)

  if (DEBUG_MODE) {
    console.log(`[Middleware] 🔍 Token verification result:`, {
      verified: !!user,
      userId: user?.userId,
      role: user?.role,
    })
  }

  if (!user) {
    // Invalid or expired token
    if (DEBUG_MODE) {
      console.warn(`[Middleware] ❌ Invalid/expired token for: ${pathname}`)
    }

    // For API routes, return JSON error
    if (pathname.startsWith('/api/')) {
      return createErrorResponse({
        success: false,
        error: 'Invalid or expired token',
        message: 'Your session has expired. Please log in again.',
        code: 'INVALID_TOKEN',
        statusCode: 401,
      })
    }

    // For browser requests, redirect to login
    return createRedirectResponse(
      request,
      routeConfig.redirectTo || '/login'
    )
  }

  // ==========================================
  // STEP 4: Check role permissions
  // ==========================================
  if (!hasRequiredRole(user.role, routeConfig.roles)) {
    if (DEBUG_MODE) {
      console.warn(
        `[Middleware] ❌ Insufficient permissions for ${pathname}. User: ${user.role}, Required: ${routeConfig.roles?.join(', ')}`
      )
    }

    // For API routes, return JSON error
    if (pathname.startsWith('/api/')) {
      return createErrorResponse({
        success: false,
        error: 'Insufficient permissions',
        message: `You do not have permission to access this resource. Required role: ${routeConfig.roles?.join(' or ')}`,
        code: 'FORBIDDEN',
        statusCode: 403,
      })
    }

    // For browser requests, redirect to dashboard with error
    const dashboardUrl = new URL('/dashboard', request.url)
    dashboardUrl.searchParams.set('error', 'forbidden')
    dashboardUrl.searchParams.set('message', 'Insufficient permissions')
    return NextResponse.redirect(dashboardUrl)
  }

  // ==========================================
  // STEP 5: Check profile completion
  // ==========================================
  console.log(`[Middleware] 🔍 REACHED PROFILE CHECK for ${pathname}`)
  console.log(`[Middleware] 📊 User object:`, JSON.stringify(user, null, 2))
  
  // For MEMBER, ADMIN, and SUPERADMIN roles, check if profile is completed
  // Redirect to /profile/setup if incomplete
  // Allow access to /profile/setup itself and API routes
  const profileCompleted = (user as any).profileCompleted ?? false
  console.log(`[Middleware] 🎯 Profile completed value: ${profileCompleted}`)
  
  if (DEBUG_MODE) {
    console.log(`[Middleware] 🔍 Profile check for ${pathname}:`, {
      userId: user.userId,
      profileCompleted,
      pathname,
    })
  }
  
  // Routes that require profile completion
  const requiresProfileCompletion = pathname.startsWith('/dashboard') || 
                                     pathname.startsWith('/admin') || 
                                     pathname.startsWith('/superadmin')
  
  console.log(`[Middleware] 🔑 Requires profile completion: ${requiresProfileCompletion}`)
  
  // Exclude /profile/setup and profile-related API routes from the check
  const isProfileSetupRoute = pathname === '/profile/setup' || pathname.startsWith('/profile/setup/')
  const isProfileApiRoute = pathname === '/api/user/update-profile' || pathname === '/api/user/profile'
  
  console.log(`[Middleware] 🚪 Is profile setup route: ${isProfileSetupRoute}`)
  console.log(`[Middleware] 🛠️ Is profile API route: ${isProfileApiRoute}`)
  
  // Check 1: Redirect incomplete profiles to setup
  if (requiresProfileCompletion && !profileCompleted && !isProfileSetupRoute && !isProfileApiRoute) {
    console.error(`[Middleware] 🚨 REDIRECT TRIGGERED! Profile incomplete for user ${user.userId}`)
    console.error(`[Middleware] 📍 Redirecting from ${pathname} to /profile/setup`)
    if (DEBUG_MODE) {
      console.warn(`[Middleware] ⚠️  Profile incomplete for user ${user.userId}. Redirecting to /profile/setup`)
      console.warn(`[Middleware] 📊 Details:`, {
        requiresProfileCompletion,
        profileCompleted,
        isProfileSetupRoute,
        isProfileApiRoute,
        willRedirect: true
      })
    }
    
    const setupUrl = new URL('/profile/setup', request.url)
    setupUrl.searchParams.set('message', 'Please complete your profile to continue')
    setupUrl.searchParams.set('returnTo', pathname)
    return NextResponse.redirect(setupUrl)
  } else {
    console.log(`[Middleware] ✅ Profile check PASSED (no redirect needed) - Conditions:`, {
      requiresProfileCompletion,
      profileCompleted,
      isProfileSetupRoute,
      isProfileApiRoute
    })
  }

  // Check 2: Redirect completed profiles away from setup (prevent unnecessary access)
  if (isProfileSetupRoute && profileCompleted && !isProfileApiRoute) {
    if (DEBUG_MODE) {
      console.log(`[Middleware] ✅ Profile already completed for user ${user.userId}. Redirecting to /dashboard`)
    }
    
    const dashboardUrl = new URL('/dashboard', request.url)
    dashboardUrl.searchParams.set('message', 'Your profile is already complete')
    return NextResponse.redirect(dashboardUrl)
  }

  // ==========================================
  // STEP 6: Inject user context and audit info into headers
  // ==========================================
  // Add user information to request headers
  // These headers can be accessed in route handlers via headers()
  const requestHeaders = new Headers(request.headers)
  requestHeaders.set('x-user-id', user.userId)
  requestHeaders.set('x-user-role', user.role)
  requestHeaders.set('x-user-phone', user.phone)
  requestHeaders.set('x-user-name', user.name)
  if (user.email) {
    requestHeaders.set('x-user-email', user.email)
  }
  
  // Add audit tracking headers for API routes
  if (pathname.startsWith('/api/')) {
    const clientIp = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown'
    const userAgent = request.headers.get('user-agent') || 'unknown'
    
    requestHeaders.set('x-audit-ip', clientIp)
    requestHeaders.set('x-audit-user-agent', userAgent)
    requestHeaders.set('x-audit-route', pathname)
    requestHeaders.set('x-audit-method', request.method)
    requestHeaders.set('x-audit-timestamp', new Date().toISOString())
    
    // Flag admin/superadmin actions for audit logging
    if (user.role === 'ADMIN' || user.role === 'SUPERADMIN') {
      requestHeaders.set('x-audit-required', 'true')
    }
  }

  // Create response with modified headers
  const response = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  })

  // ==========================================
  // STEP 7: Add Security Headers (Day 20)
  // ==========================================
  addSecurityHeaders(response)

  // ==========================================
  // STEP 8: Log successful access
  // ==========================================
  if (DEBUG_MODE) {
    console.log(
      `[Middleware] ✅ Access granted: ${user.role} → ${pathname}`
    )
  }

  return response
}

// ==========================================
// SECURITY HEADERS (Day 20)
// ==========================================

/**
 * Add security headers to response
 * Implements OWASP security best practices
 * 
 * @param {NextResponse} response - Response to add headers to
 */
function addSecurityHeaders(response: NextResponse): void {
  // Content Security Policy (CSP)
  // Starter policy - adjust based on your needs
  const cspDirectives = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval'", // Note: Remove unsafe-* in production
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: https:",
    "font-src 'self' data:",
    "connect-src 'self'",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
  ]

  response.headers.set(
    'Content-Security-Policy',
    cspDirectives.join('; ')
  )

  // Prevent clickjacking
  response.headers.set('X-Frame-Options', 'DENY')

  // Prevent MIME type sniffing
  response.headers.set('X-Content-Type-Options', 'nosniff')

  // Control referrer information
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')

  // Force HTTPS (only in production)
  if (process.env.NODE_ENV === 'production') {
    response.headers.set(
      'Strict-Transport-Security',
      'max-age=31536000; includeSubDomains'
    )
  }

  // XSS Protection (legacy but still useful)
  response.headers.set('X-XSS-Protection', '1; mode=block')

  // Permissions Policy (formerly Feature-Policy)
  response.headers.set(
    'Permissions-Policy',
    'camera=(), microphone=(), geolocation=()'
  )
}

// ==========================================
// MIDDLEWARE CONFIGURATION
// ==========================================

/**
 * Matcher configuration
 * Defines which routes should run through middleware
 */
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - _global-error (Next.js error boundary)
     * - favicon.ico (favicon file)
     * - public folder files
     */
    '/((?!_next/static|_next/image|_global-error|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
