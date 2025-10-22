# Step 7 — RBAC Middleware Documentation

## Overview

This document describes the Role-Based Access Control (RBAC) middleware implementation for the hotel booking system. The middleware protects routes based on JWT authentication and user roles.

## Features

✅ **JWT Token Verification**
- Reads tokens from Authorization header or cookies
- Verifies token signature and expiration
- Handles TokenExpiredError and JsonWebTokenError

✅ **Role-Based Access Control**
- Checks user roles against required permissions
- Supports multiple roles per route
- Role hierarchy: SUPERADMIN > ADMIN > MEMBER

✅ **Smart Response Handling**
- JSON errors for API routes (401/403)
- Redirects for browser navigation
- Return URL preservation after login

✅ **User Context Injection**
- Injects user data into request headers
- Available in route handlers via `headers()`
- Type-safe with TypeScript

✅ **Comprehensive Logging**
- Debug mode for development
- Access logs and error tracking
- Performance optimized for production

---

## Architecture

### Middleware Flow

```
┌─────────────────────────────────────────────────────────────┐
│                    Incoming Request                         │
└─────────────────┬───────────────────────────────────────────┘
                  │
                  ▼
         ┌────────────────────┐
         │  Is Public Route?  │
         └────────┬───────────┘
                  │
        ┌─────────┴─────────┐
        │ Yes               │ No
        ▼                   ▼
   ┌────────┐        ┌──────────────┐
   │ Allow  │        │ Find Route   │
   │ Access │        │ Config       │
   └────────┘        └──────┬───────┘
                            │
                            ▼
                     ┌──────────────┐
                     │ Extract JWT  │
                     │ Token        │
                     └──────┬───────┘
                            │
                  ┌─────────┴─────────┐
                  │ Token Found?      │
                  └─────────┬─────────┘
                            │
                  ┌─────────┴─────────┐
                  │ No                │ Yes
                  ▼                   ▼
          ┌──────────────┐     ┌──────────────┐
          │ Return 401   │     │ Verify Token │
          │ or Redirect  │     └──────┬───────┘
          └──────────────┘            │
                                      ▼
                            ┌──────────────────┐
                            │ Token Valid?     │
                            └──────┬───────────┘
                                   │
                         ┌─────────┴─────────┐
                         │ No                │ Yes
                         ▼                   ▼
                 ┌──────────────┐     ┌──────────────┐
                 │ Return 401   │     │ Check Role   │
                 │ or Redirect  │     │ Permission   │
                 └──────────────┘     └──────┬───────┘
                                             │
                                   ┌─────────┴─────────┐
                                   │ Has Permission?   │
                                   └─────────┬─────────┘
                                             │
                                   ┌─────────┴─────────┐
                                   │ No                │ Yes
                                   ▼                   ▼
                           ┌──────────────┐     ┌──────────────┐
                           │ Return 403   │     │ Inject User  │
                           │ or Redirect  │     │ Context      │
                           └──────────────┘     └──────┬───────┘
                                                       │
                                                       ▼
                                                ┌──────────────┐
                                                │ Allow Access │
                                                └──────────────┘
```

---

## Configuration

### Route Protection

Define protected routes in `middleware.ts`:

```typescript
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
  
  // API routes
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
```

### Public Routes

Define public routes that bypass authentication:

```typescript
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
```

### Environment Variables

Required environment variables:

```bash
# JWT Secret for token verification
JWT_ACCESS_SECRET=your-super-secret-key-change-in-production

# Optional: Enable debug logging
NODE_ENV=development
```

---

## Usage

### 1. API Route Handlers

Access authenticated user context in API routes:

```typescript
// app/api/user/profile/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/middleware/auth.utils'

export async function GET(request: NextRequest) {
  // Get authenticated user from middleware
  const user = await getCurrentUser()
  
  if (!user) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    )
  }
  
  // User is authenticated - access user data
  return NextResponse.json({
    userId: user.userId,
    name: user.name,
    role: user.role,
    phone: user.phone,
  })
}
```

### 2. Role-Based Authorization

Check user roles in API routes:

```typescript
// app/api/admin/users/route.ts
import { requireRole } from '@/lib/middleware/auth.utils'

export async function DELETE(request: NextRequest) {
  try {
    // Require ADMIN or SUPERADMIN role
    const user = await requireRole(['ADMIN', 'SUPERADMIN'])
    
    // User has permission - proceed with deletion
    // ... delete logic
    
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json(
      { error: 'Forbidden', message: error.message },
      { status: 403 }
    )
  }
}
```

### 3. Server Components

Use middleware context in server components:

```typescript
// app/dashboard/page.tsx
import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/middleware/auth.utils'

export default async function DashboardPage() {
  const user = await getCurrentUser()
  
  if (!user) {
    redirect('/login')
  }
  
  return (
    <div>
      <h1>Welcome, {user.name}!</h1>
      <p>Role: {user.role}</p>
    </div>
  )
}
```

### 4. Conditional Rendering by Role

```typescript
// app/admin/page.tsx
import { isAdmin, isSuperAdmin } from '@/lib/middleware/auth.utils'

export default async function AdminPage() {
  const hasAdminAccess = await isAdmin()
  const hasSuperAdminAccess = await isSuperAdmin()
  
  if (!hasAdminAccess) {
    return <div>Access Denied</div>
  }
  
  return (
    <div>
      <h1>Admin Panel</h1>
      
      {hasSuperAdminAccess && (
        <section>
          <h2>Super Admin Section</h2>
          {/* Super admin only features */}
        </section>
      )}
    </div>
  )
}
```

---

## Helper Functions

### Authentication Utilities

Located in `src/lib/middleware/auth.utils.ts`:

#### `getCurrentUser()`
Get authenticated user context (returns null if not authenticated).

```typescript
const user = await getCurrentUser()
if (user) {
  console.log(user.userId, user.role)
}
```

#### `requireAuth()`
Require authentication (throws error if not authenticated).

```typescript
try {
  const user = await requireAuth()
  // User is authenticated
} catch (error) {
  // User is not authenticated
}
```

#### `hasRole(role)`
Check if user has specific role(s).

```typescript
const isAdmin = await hasRole(['ADMIN', 'SUPERADMIN'])
const isMember = await hasRole('MEMBER')
```

#### `requireRole(role)`
Require specific role (throws error if insufficient permissions).

```typescript
try {
  const user = await requireRole('SUPERADMIN')
  // User is superadmin
} catch (error) {
  // User doesn't have permission
}
```

#### `isAdmin()`
Check if user is admin or superadmin.

```typescript
if (await isAdmin()) {
  // Show admin features
}
```

#### `isSuperAdmin()`
Check if user is superadmin.

```typescript
if (await isSuperAdmin()) {
  // Show superadmin features
}
```

#### `getUserId()`
Get current user's ID.

```typescript
const userId = await getUserId()
```

---

## Error Responses

### API Routes (JSON)

#### 401 Unauthorized - No Token
```json
{
  "success": false,
  "error": "Authentication required",
  "message": "No authentication token provided. Please log in.",
  "code": "UNAUTHORIZED",
  "statusCode": 401
}
```

#### 401 Unauthorized - Invalid Token
```json
{
  "success": false,
  "error": "Invalid or expired token",
  "message": "Your session has expired. Please log in again.",
  "code": "INVALID_TOKEN",
  "statusCode": 401
}
```

#### 403 Forbidden - Insufficient Permissions
```json
{
  "success": false,
  "error": "Insufficient permissions",
  "message": "You do not have permission to access this resource. Required role: ADMIN or SUPERADMIN",
  "code": "FORBIDDEN",
  "statusCode": 403
}
```

### Browser Navigation (Redirects)

#### Unauthorized Access
```
Redirect to: /login?returnTo=/dashboard
```

#### Forbidden Access
```
Redirect to: /dashboard?error=forbidden&message=Insufficient permissions
```

---

## Token Handling

### Authorization Header (API Calls)

```bash
# Preferred for API requests
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

Example API call:

```typescript
const response = await fetch('/api/user/profile', {
  headers: {
    'Authorization': `Bearer ${accessToken}`,
  },
})
```

### Cookie-Based (Browser)

```bash
# Preferred for browser requests
Cookie: auth-session=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

Set via server action:

```typescript
import { setSessionCookie } from '@/lib/auth/jwt.service'

await setSessionCookie(accessToken)
```

---

## Type Definitions

### MiddlewareContext

```typescript
interface MiddlewareContext {
  userId: string
  phone: string
  email?: string | null
  name: string
  role: RoleName
  roleId: string
  iat: number // Issued at (Unix timestamp)
  exp: number // Expires at (Unix timestamp)
}
```

### RouteConfig

```typescript
interface RouteConfig {
  path: string // Route path pattern
  roles?: RoleName[] // Required roles
  requiresAuth?: boolean // Authentication required
  redirectTo?: string // Redirect path for unauthorized
}
```

### MiddlewareErrorResponse

```typescript
interface MiddlewareErrorResponse {
  success: false
  error: string
  message: string
  code: 'UNAUTHORIZED' | 'FORBIDDEN' | 'INVALID_TOKEN' | 'TOKEN_EXPIRED'
  statusCode: 401 | 403
}
```

---

## Testing

### Test Authentication

```typescript
// Test public route access
const publicResponse = await fetch('http://localhost:3000/')
// Should return 200

// Test protected route without token
const protectedResponse = await fetch('http://localhost:3000/dashboard')
// Should redirect to /login

// Test protected route with token
const authResponse = await fetch('http://localhost:3000/dashboard', {
  headers: {
    'Authorization': `Bearer ${validToken}`,
  },
})
// Should return 200
```

### Test Authorization

```typescript
// Test admin route with MEMBER role
const memberToken = generateAccessToken({
  userId: 'user1',
  role: 'MEMBER',
  // ...
})

const adminResponse = await fetch('http://localhost:3000/admin', {
  headers: {
    'Authorization': `Bearer ${memberToken}`,
  },
})
// Should return 403 Forbidden
```

### Test Token Expiration

```typescript
// Generate expired token
const expiredToken = jwt.sign(
  { userId: 'user1', role: 'MEMBER' },
  JWT_SECRET,
  { expiresIn: '-1h' } // Already expired
)

const response = await fetch('http://localhost:3000/dashboard', {
  headers: {
    'Authorization': `Bearer ${expiredToken}`,
  },
})
// Should return 401 Unauthorized
```

---

## Security Best Practices

### 1. Strong JWT Secrets
```bash
# Generate strong secrets (32+ characters)
JWT_ACCESS_SECRET=$(openssl rand -base64 32)
JWT_REFRESH_SECRET=$(openssl rand -base64 32)
```

### 2. Token Expiration
- Access tokens: 15 minutes (short-lived)
- Refresh tokens: 7 days (long-lived)

### 3. HTTP-Only Cookies
```typescript
const COOKIE_OPTIONS = {
  httpOnly: true, // Prevents XSS attacks
  secure: true, // HTTPS only in production
  sameSite: 'lax', // CSRF protection
  path: '/',
}
```

### 4. Fail-Safe Strategy
- Unknown routes allow access (fail open)
- Add routes to `PROTECTED_ROUTES` to secure them
- Log unknown route access in development

### 5. Role Validation
- Always validate roles server-side
- Never trust client-side role checks
- Use `requireRole()` for critical operations

---

## Troubleshooting

### Issue: Middleware not running

**Solution**: Check matcher configuration in `middleware.ts`:

```typescript
export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
```

### Issue: Token not found

**Solution**: Ensure token is sent correctly:

```typescript
// API calls: Use Authorization header
headers: { 'Authorization': `Bearer ${token}` }

// Browser: Set cookie via server action
await setSessionCookie(accessToken)
```

### Issue: User context not available

**Solution**: Ensure route is protected and token is valid:

```typescript
const user = await getCurrentUser()
if (!user) {
  console.error('No user context - check middleware')
}
```

### Issue: 403 Forbidden despite correct role

**Solution**: Check role configuration in `PROTECTED_ROUTES`:

```typescript
{
  path: '/admin',
  roles: ['ADMIN', 'SUPERADMIN'], // Add all allowed roles
  requiresAuth: true,
}
```

---

## Performance Optimization

### 1. Minimize Token Verification
- Token verification happens once per request
- Cached in request headers for route handlers

### 2. Efficient Route Matching
- Public routes checked first (O(n) lookup)
- Protected routes use prefix matching
- Wildcard support for grouped routes

### 3. Debug Mode Toggle
- Enable in development: `NODE_ENV=development`
- Disable in production for performance
- Reduces console logging overhead

### 4. Header Injection
- User context added to headers (no database calls)
- Available in all route handlers and server components
- Type-safe with TypeScript

---

## Migration from Existing Auth

### From Session-Based Auth

1. Replace session check with JWT verification
2. Update route handlers to use `getCurrentUser()`
3. Remove session middleware/libraries

### From Basic Auth

1. Add JWT generation to login flow
2. Replace Authorization header parsing
3. Update API clients to send Bearer tokens

---

## Next Steps

✅ Step 7 Complete: RBAC Middleware

**Next**: Step 8 — Testing & Documentation
- Write unit tests for middleware
- Write integration tests for protected routes
- Document API endpoints
- Create user guide

---

## Files Modified

- `middleware.ts` - Main middleware implementation
- `src/types/middleware.types.ts` - TypeScript types
- `src/lib/middleware/auth.utils.ts` - Helper functions
- `src/lib/auth/jwt.service.ts` - JWT utilities
- `src/lib/rbac.ts` - Role-based access control

---

## Resources

- [Next.js Middleware Docs](https://nextjs.org/docs/app/building-your-application/routing/middleware)
- [JWT.io](https://jwt.io/) - JWT debugger and docs
- [OWASP Authentication Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html)

---

**Last Updated**: October 22, 2025
**Version**: 1.0.0
