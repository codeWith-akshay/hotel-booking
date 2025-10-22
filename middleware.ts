// ==========================================
// NEXT.JS MIDDLEWARE - RBAC (Role-Based Access Control)
// ==========================================
// Authentication and authorization middleware for Next.js 16
// Protects routes based on JWT tokens and user roles

import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import jwt from 'jsonwebtoken'
import type { RoleName } from '@prisma/client'
import type {
  MiddlewareContext,
  MiddlewareErrorResponse,
  RouteConfig,
} from './src/types/middleware.types'

// ==========================================
// CONFIGURATION
// ==========================================

const JWT_ACCESS_SECRET =
  process.env.JWT_ACCESS_SECRET || 'your-access-secret-change-in-production'

/**
 * Route protection configuration
 * Define which routes require authentication and specific roles
 */
const PROTECTED_ROUTES: RouteConfig[] = [
  // Member dashboard - requires MEMBER role or higher
  {
    path: '/dashboard',
    roles: ['MEMBER', 'ADMIN', 'SUPERADMIN'],
    requiresAuth: true,
    redirectTo: '/login',
  },
  // Admin panel - requires ADMIN role or higher
  {
    path: '/admin',
    roles: ['ADMIN', 'SUPERADMIN'],
    requiresAuth: true,
    redirectTo: '/login',
  },
  // Super admin panel - requires SUPERADMIN role only
  {
    path: '/superadmin',
    roles: ['SUPERADMIN'],
    requiresAuth: true,
    redirectTo: '/login',
  },
  // API routes that require authentication
  {
    path: '/api/user',
    roles: ['MEMBER', 'ADMIN', 'SUPERADMIN'],
    requiresAuth: true,
  },
  {
    path: '/api/admin',
    roles: ['ADMIN', 'SUPERADMIN'],
    requiresAuth: true,
  },
]

/**
 * Public routes that bypass authentication
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
 */
function isPublicRoute(pathname: string): boolean {
  return PUBLIC_ROUTES.some((route) => {
    if (route.endsWith('*')) {
      return pathname.startsWith(route.slice(0, -1))
    }
    return pathname === route || pathname.startsWith(route + '/')
  })
}

/**
 * Find matching protected route configuration
 */
function findRouteConfig(pathname: string): RouteConfig | undefined {
  return PROTECTED_ROUTES.find((route) => {
    if (route.path.endsWith('*')) {
      return pathname.startsWith(route.path.slice(0, -1))
    }
    return pathname === route.path || pathname.startsWith(route.path + '/')
  })
}

/**
 * Check if user has required role
 */
function hasRequiredRole(
  userRole: RoleName,
  requiredRoles?: RoleName[]
): boolean {
  if (!requiredRoles || requiredRoles.length === 0) {
    return true
  }
  return requiredRoles.includes(userRole)
}

/**
 * Extract JWT token from request
 * Checks both Authorization header and cookies
 */
function extractToken(request: NextRequest): string | null {
  // 1. Check Authorization header
  const authHeader = request.headers.get('authorization')
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7)
  }

  // 2. Check auth-session cookie
  const sessionCookie = request.cookies.get('auth-session')
  if (sessionCookie) {
    return sessionCookie.value
  }

  return null
}

/**
 * Verify and decode JWT token
 */
function verifyToken(token: string): MiddlewareContext | null {
  try {
    const decoded = jwt.verify(token, JWT_ACCESS_SECRET) as MiddlewareContext

    // Validate required fields
    if (!decoded.userId || !decoded.role) {
      console.error('Invalid token: missing required fields')
      return null
    }

    return decoded
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      console.error('Token expired:', error.message)
    } else if (error instanceof jwt.JsonWebTokenError) {
      console.error('Invalid token:', error.message)
    } else {
      console.error('Token verification failed:', error)
    }
    return null
  }
}

/**
 * Create JSON error response
 */
function createErrorResponse(
  error: MiddlewareErrorResponse
): NextResponse<MiddlewareErrorResponse> {
  return NextResponse.json(error, { status: error.statusCode })
}

/**
 * Create redirect response for browser navigation
 */
function createRedirectResponse(
  request: NextRequest,
  redirectTo: string
): NextResponse {
  const loginUrl = new URL(redirectTo, request.url)
  
  // Add return URL for redirect after login
  loginUrl.searchParams.set('returnTo', request.nextUrl.pathname)
  
  return NextResponse.redirect(loginUrl)
}

// ==========================================
// MIDDLEWARE FUNCTION
// ==========================================

/**
 * Next.js Middleware
 * Runs on every request to protected routes
 * 
 * @param {NextRequest} request - Incoming request
 * @returns {NextResponse} Response or redirect
 */
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Skip public routes
  if (isPublicRoute(pathname)) {
    return NextResponse.next()
  }

  // Find route configuration
  const routeConfig = findRouteConfig(pathname)

  // If no route config found, allow access (fail open)
  if (!routeConfig) {
    return NextResponse.next()
  }

  // Extract and verify token
  const token = extractToken(request)

  if (!token) {
    // No token provided
    console.warn(`[Middleware] No token provided for: ${pathname}`)

    // Check if it's an API route
    if (pathname.startsWith('/api/')) {
      return createErrorResponse({
        success: false,
        error: 'Authentication required',
        message: 'No authentication token provided. Please log in.',
        code: 'UNAUTHORIZED',
        statusCode: 401,
      })
    }

    // Redirect to login for browser navigation
    return createRedirectResponse(
      request,
      routeConfig.redirectTo || '/login'
    )
  }

  // Verify token
  const user = verifyToken(token)

  if (!user) {
    // Invalid or expired token
    console.warn(`[Middleware] Invalid token for: ${pathname}`)

    if (pathname.startsWith('/api/')) {
      return createErrorResponse({
        success: false,
        error: 'Invalid or expired token',
        message: 'Your session has expired. Please log in again.',
        code: 'INVALID_TOKEN',
        statusCode: 401,
      })
    }

    // Redirect to login
    return createRedirectResponse(
      request,
      routeConfig.redirectTo || '/login'
    )
  }

  // Check if user has required role
  if (!hasRequiredRole(user.role, routeConfig.roles)) {
    console.warn(
      `[Middleware] Insufficient permissions for ${pathname}. User role: ${user.role}, Required: ${routeConfig.roles?.join(', ')}`
    )

    if (pathname.startsWith('/api/')) {
      return createErrorResponse({
        success: false,
        error: 'Insufficient permissions',
        message: `You do not have permission to access this resource. Required role: ${routeConfig.roles?.join(' or ')}`,
        code: 'FORBIDDEN',
        statusCode: 403,
      })
    }

    // Redirect to dashboard with error message
    const dashboardUrl = new URL('/dashboard', request.url)
    dashboardUrl.searchParams.set('error', 'forbidden')
    return NextResponse.redirect(dashboardUrl)
  }

  // Authentication and authorization successful
  // Add user context to request headers for route handlers
  const requestHeaders = new Headers(request.headers)
  requestHeaders.set('x-user-id', user.userId)
  requestHeaders.set('x-user-role', user.role)
  requestHeaders.set('x-user-phone', user.phone)
  requestHeaders.set('x-user-name', user.name)

  // Create response with modified headers
  const response = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  })

  // Log successful access (optional, remove in production)
  if (process.env.NODE_ENV === 'development') {
    console.log(
      `[Middleware] ✅ Access granted: ${user.role} → ${pathname}`
    )
  }

  return response
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
     * - favicon.ico (favicon file)
     * - public folder files
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
