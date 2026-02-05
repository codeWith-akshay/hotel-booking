// ==========================================
// NEXT.JS MIDDLEWARE - RBAC (Role-Based Access Control)
// ==========================================
// Production-ready API middleware for Next.js 15+
//
// ✔ Protects ONLY API routes
// ✔ Silent in production
// ✔ Clean RBAC
// ✔ Edge-safe
// ✔ No noisy logs
// ==========================================

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
  process.env.JWT_ACCESS_SECRET || 'dev-secret'

const DEBUG_MODE = process.env.NODE_ENV === 'development'

// ==========================================
// ROUTE CONFIG
// ==========================================

const PROTECTED_ROUTES: RouteConfig[] = [
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
  {
    path: '/api/user',
    roles: ['MEMBER', 'ADMIN', 'SUPERADMIN'],
    requiresAuth: true,
  },
  {
    path: '/api/bookings',
    roles: ['MEMBER', 'ADMIN', 'SUPERADMIN'],
    requiresAuth: true,
  },
]

const PUBLIC_ROUTES = [
  '/api/auth/request-otp',
  '/api/auth/verify-otp',
  '/api/auth/logout',
]

// ==========================================
// HELPERS
// ==========================================

function isPublicRoute(pathname: string) {
  return PUBLIC_ROUTES.some(route => pathname.startsWith(route))
}

function findRouteConfig(pathname: string): RouteConfig | undefined {
  return PROTECTED_ROUTES.find(route =>
    pathname.startsWith(route.path)
  )
}

function extractToken(request: NextRequest): string | null {
  const authHeader = request.headers.get('authorization')
  if (authHeader?.startsWith('Bearer ')) {
    return authHeader.slice(7)
  }
  return request.cookies.get('auth-session')?.value ?? null
}

function verifyToken(token: string): MiddlewareContext | null {
  try {
    return jwt.verify(token, JWT_ACCESS_SECRET) as MiddlewareContext
  } catch {
    return null
  }
}

function createErrorResponse(
  error: MiddlewareErrorResponse
): NextResponse {
  return NextResponse.json(error, { status: error.statusCode })
}

// ==========================================
// MIDDLEWARE
// ==========================================

export default function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // 🔒 Middleware ONLY for API routes
  if (!pathname.startsWith('/api/')) {
    return NextResponse.next()
  }

  if (isPublicRoute(pathname)) {
    return NextResponse.next()
  }

  const routeConfig = findRouteConfig(pathname)

  // No RBAC config → allow
  if (!routeConfig) {
    return NextResponse.next()
  }

  const token = extractToken(request)

  if (!token) {
    return createErrorResponse({
      success: false,
      error: 'Unauthorized',
      message: 'Authentication required',
      code: 'UNAUTHORIZED',
      statusCode: 401,
    })
  }

  const user = verifyToken(token)

  if (!user) {
    return createErrorResponse({
      success: false,
      error: 'Invalid token',
      message: 'Session expired or invalid',
      code: 'INVALID_TOKEN',
      statusCode: 401,
    })
  }

  if (
    routeConfig.roles &&
    !routeConfig.roles.includes(user.role as RoleName)
  ) {
    return createErrorResponse({
      success: false,
      error: 'Forbidden',
      message: 'Insufficient permissions',
      code: 'FORBIDDEN',
      statusCode: 403,
    })
  }

  // Inject user context
  const headers = new Headers(request.headers)
  headers.set('x-user-id', user.userId)
  headers.set('x-user-role', user.role)

  if (DEBUG_MODE) {
    console.log(`✅ ${user.role} → ${pathname}`)
  }

  const response = NextResponse.next({
    request: { headers },
  })

  addSecurityHeaders(response)
  return response
}

// ==========================================
// SECURITY HEADERS
// ==========================================

function addSecurityHeaders(response: NextResponse) {
  response.headers.set(
    'Content-Security-Policy',
    "default-src 'self'; img-src 'self' data: https:; style-src 'self' 'unsafe-inline';"
  )
  response.headers.set('X-Frame-Options', 'DENY')
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set(
    'Referrer-Policy',
    'strict-origin-when-cross-origin'
  )
  response.headers.set(
    'Permissions-Policy',
    'camera=(), microphone=(), geolocation=()'
  )

  if (process.env.NODE_ENV === 'production') {
    response.headers.set(
      'Strict-Transport-Security',
      'max-age=31536000; includeSubDomains'
    )
  }
}

// ==========================================
// MATCHER
// ==========================================

export const config = {
  matcher: ['/api/:path*'],
}
