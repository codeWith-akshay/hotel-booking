// ==========================================
// RBAC MIDDLEWARE USAGE EXAMPLES
// ==========================================
// Practical examples of using the RBAC middleware
// in various Next.js contexts

import { NextRequest, NextResponse } from 'next/server'
import {
  getCurrentUser,
  requireAuth,
  requireRole,
  hasRole,
  isAdmin,
  isSuperAdmin,
  getUserId,
} from '@/lib/middleware/auth.utils'
import { redirect } from 'next/navigation'

// ==========================================
// EXAMPLE 1: API Route - Basic Authentication
// ==========================================

/**
 * GET /api/user/profile
 * Get current user's profile
 * Requires: Authentication (any role)
 */
export async function getProfileHandler(request: NextRequest) {
  // Get authenticated user from middleware
  const user = await getCurrentUser()

  // Check if user is authenticated
  if (!user) {
    return NextResponse.json(
      {
        success: false,
        error: 'Unauthorized',
        message: 'Please log in to access your profile',
      },
      { status: 401 }
    )
  }

  // User is authenticated - return profile data
  return NextResponse.json({
    success: true,
    data: {
      userId: user.userId,
      name: user.name,
      phone: user.phone,
      role: user.role,
    },
  })
}

// ==========================================
// EXAMPLE 2: API Route - Role-Based Authorization
// ==========================================

/**
 * DELETE /api/admin/users/:id
 * Delete a user (admin only)
 * Requires: ADMIN or SUPERADMIN role
 */
export async function deleteUserHandler(request: NextRequest) {
  try {
    // Require ADMIN or SUPERADMIN role
    const user = await requireRole(['ADMIN', 'SUPERADMIN'])

    // User has permission - proceed with deletion
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('id')

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'User ID is required' },
        { status: 400 }
      )
    }

    // Delete user logic here
    // await prisma.user.delete({ where: { id: userId } })

    return NextResponse.json({
      success: true,
      message: `User ${userId} deleted by ${user.name}`,
    })
  } catch (error) {
    // User doesn't have required role or not authenticated
    return NextResponse.json(
      {
        success: false,
        error: 'Forbidden',
        message: 'You do not have permission to delete users',
      },
      { status: 403 }
    )
  }
}

// ==========================================
// EXAMPLE 3: API Route - Conditional Logic by Role
// ==========================================

/**
 * GET /api/bookings
 * Get bookings (filtered by role)
 * Requires: Authentication
 * - MEMBER: See only their own bookings
 * - ADMIN/SUPERADMIN: See all bookings
 */
export async function getBookingsHandler(request: NextRequest) {
  const user = await getCurrentUser()

  if (!user) {
    return NextResponse.json(
      { success: false, error: 'Unauthorized' },
      { status: 401 }
    )
  }

  // Check if user has admin access
  const hasAdminAccess = await hasRole(['ADMIN', 'SUPERADMIN'])

  // Fetch bookings based on role
  let bookings
  if (hasAdminAccess) {
    // Admin can see all bookings
    // bookings = await prisma.booking.findMany()
    bookings = [
      { id: '1', userId: 'user1', room: '101' },
      { id: '2', userId: 'user2', room: '102' },
      { id: '3', userId: user.userId, room: '103' },
    ]
  } else {
    // Members can only see their own bookings
    // bookings = await prisma.booking.findMany({
    //   where: { userId: user.userId }
    // })
    bookings = [{ id: '3', userId: user.userId, room: '103' }]
  }

  return NextResponse.json({
    success: true,
    data: bookings,
    meta: {
      isAdmin: hasAdminAccess,
      totalResults: bookings.length,
    },
  })
}

// ==========================================
// EXAMPLE 4: Server Component - Basic Authentication
// ==========================================

/**
 * Dashboard Page
 * Requires: Authentication (any role)
 * 
 * @example File: app/dashboard/page.tsx
 * ```tsx
 * export default async function DashboardPage() {
 *   const user = await getCurrentUser()
 *   if (!user) redirect('/login')
 *   
 *   return (
 *     <div>
 *       <h1>Welcome, {user.name}!</h1>
 *       <p>Role: {user.role}</p>
 *     </div>
 *   )
 * }
 * ```
 */
export async function exampleDashboardPage() {
  const user = await getCurrentUser()
  if (!user) {
    redirect('/login')
  }
  
  // Return user data for rendering
  return {
    userName: user.name,
    userRole: user.role,
    userId: user.userId,
  }
}

// ==========================================
// EXAMPLE 5: Server Component - Role-Based UI
// ==========================================

/**
 * Admin Panel
 * Shows different UI based on user role
 * 
 * @example File: app/admin/page.tsx
 * ```tsx
 * export default async function AdminPanelPage() {
 *   const user = await getCurrentUser()
 *   if (!user) redirect('/login')
 *   
 *   const hasAdminAccess = await isAdmin()
 *   const hasSuperAdminAccess = await isSuperAdmin()
 *   
 *   if (!hasAdminAccess) {
 *     return <div>Access Denied</div>
 *   }
 *   
 *   return (
 *     <div>
 *       <h1>Admin Panel</h1>
 *       {hasSuperAdminAccess && <section>Super Admin Section</section>}
 *     </div>
 *   )
 * }
 * ```
 */
export async function exampleAdminPanelPage() {
  const user = await getCurrentUser()
  if (!user) {
    redirect('/login')
  }

  const hasAdminAccess = await isAdmin()
  const hasSuperAdminAccess = await isSuperAdmin()

  if (!hasAdminAccess) {
    return {
      accessDenied: true,
      message: 'You do not have permission to access this page',
      requiredRole: 'ADMIN or SUPERADMIN',
    }
  }

  return {
    userName: user.name,
    userRole: user.role,
    hasAdminAccess,
    hasSuperAdminAccess,
    features: {
      userManagement: hasAdminAccess,
      systemConfig: hasSuperAdminAccess,
      deleteUsers: hasSuperAdminAccess,
    },
  }
}

// ==========================================
// EXAMPLE 6: Server Action - Protected Operation
// ==========================================

/**
 * Create booking server action
 * Requires: Authentication (any role)
 */
'use server'

export async function createBookingAction(formData: FormData) {
  try {
    // Require authentication
    const user = await requireAuth()

    // Extract form data
    const roomId = formData.get('roomId') as string
    const checkIn = formData.get('checkIn') as string
    const checkOut = formData.get('checkOut') as string

    if (!roomId || !checkIn || !checkOut) {
      return {
        success: false,
        error: 'Missing required fields',
      }
    }

    // Create booking
    // const booking = await prisma.booking.create({
    //   data: {
    //     userId: user.userId,
    //     roomId,
    //     checkIn: new Date(checkIn),
    //     checkOut: new Date(checkOut),
    //   }
    // })

    return {
      success: true,
      message: 'Booking created successfully',
      bookingId: 'booking-123',
    }
  } catch (error) {
    return {
      success: false,
      error: 'Failed to create booking',
      message: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

// ==========================================
// EXAMPLE 7: Server Action - Admin Operation
// ==========================================

/**
 * Update user role server action
 * Requires: SUPERADMIN role
 */
'use server'

export async function updateUserRoleAction(
  userId: string,
  newRole: 'MEMBER' | 'ADMIN' | 'SUPERADMIN'
) {
  try {
    // Require SUPERADMIN role
    const admin = await requireRole('SUPERADMIN')

    // Validate input
    if (!userId || !newRole) {
      return {
        success: false,
        error: 'Invalid input',
      }
    }

    // Update user role
    // await prisma.user.update({
    //   where: { id: userId },
    //   data: { role: newRole }
    // })

    return {
      success: true,
      message: `User role updated to ${newRole} by ${admin.name}`,
    }
  } catch (error) {
    return {
      success: false,
      error: 'Insufficient permissions',
      message: 'Only superadmins can change user roles',
    }
  }
}

// ==========================================
// EXAMPLE 8: API Middleware Pattern
// ==========================================

/**
 * Reusable authentication middleware for API routes
 */
export async function withAuth(
  handler: (request: NextRequest, user: any) => Promise<NextResponse>
) {
  return async (request: NextRequest) => {
    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    return handler(request, user)
  }
}

/**
 * Reusable role-based middleware for API routes
 */
export function withRole(
  roles: string[],
  handler: (request: NextRequest, user: any) => Promise<NextResponse>
) {
  return async (request: NextRequest) => {
    try {
      const user = await requireRole(roles as any)
      return handler(request, user)
    } catch (error) {
      return NextResponse.json(
        { success: false, error: 'Forbidden' },
        { status: 403 }
      )
    }
  }
}

// Usage example:
export const GET = withAuth(async (request, user) => {
  return NextResponse.json({
    message: 'Protected data',
    userId: user.userId,
  })
})

export const DELETE = withRole(['ADMIN', 'SUPERADMIN'], async (request, user) => {
  return NextResponse.json({
    message: 'Admin operation completed',
    adminName: user.name,
  })
})

// ==========================================
// EXAMPLE 9: Client Component with Server Action
// ==========================================

/**
 * Client component that uses protected server action
 * 
 * @example File: app/components/BookingForm.tsx
 * ```tsx
 * 'use client'
 * 
 * export function BookingForm() {
 *   const [loading, setLoading] = useState(false)
 *   
 *   async function handleSubmit(formData: FormData) {
 *     setLoading(true)
 *     const result = await createBookingAction(formData)
 *     setLoading(false)
 *   }
 *   
 *   return <form action={handleSubmit}>...</form>
 * }
 * ```
 */
export function exampleBookingFormLogic() {
  // This function demonstrates the logic without JSX
  async function handleSubmit(formData: FormData) {
    const roomId = formData.get('roomId')
    const checkIn = formData.get('checkIn')
    const checkOut = formData.get('checkOut')

    try {
      const result = await createBookingAction(formData)
      
      if (result.success) {
        return { success: true, message: 'Booking created successfully!' }
      } else {
        return { success: false, message: result.error || 'Failed' }
      }
    } catch (error) {
      return { success: false, message: 'An error occurred' }
    }
  }

  return { handleSubmit }
}

// ==========================================
// EXAMPLE 10: Testing Examples
// ==========================================

/**
 * Test authenticated API route
 */
export async function testAuthenticatedRoute() {
  const validToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' // Example token
  
  // Without token - should return 401
  const unauthResponse = await fetch('http://localhost:3000/api/user/profile')
  console.assert(unauthResponse.status === 401)

  // With valid token - should return 200
  const authResponse = await fetch('http://localhost:3000/api/user/profile', {
    headers: {
      Authorization: `Bearer ${validToken}`,
    },
  })
  console.assert(authResponse.status === 200)
}

/**
 * Test role-based API route
 */
export async function testRoleBasedRoute() {
  // Member token accessing admin route - should return 403
  const memberToken = 'eyJhbGc...' // MEMBER role token
  const response = await fetch('http://localhost:3000/api/admin/users', {
    headers: {
      Authorization: `Bearer ${memberToken}`,
    },
  })
  console.assert(response.status === 403)

  // Admin token accessing admin route - should return 200
  const adminToken = 'eyJhbGc...' // ADMIN role token
  const adminResponse = await fetch('http://localhost:3000/api/admin/users', {
    headers: {
      Authorization: `Bearer ${adminToken}`,
    },
  })
  console.assert(adminResponse.status === 200)
}

// ==========================================
// EXAMPLE 11: Custom Error Handling
// ==========================================

/**
 * Custom error handler for protected routes
 */
export async function protectedRouteWithErrorHandling(request: NextRequest) {
  try {
    // Try to get authenticated user
    const user = await requireAuth()

    // Protected operation
    return NextResponse.json({
      success: true,
      data: {
        message: 'Protected data',
        userId: user.userId,
      },
    })
  } catch (error) {
    // Handle specific errors
    if (error instanceof Error) {
      if (error.message.includes('Authentication required')) {
        return NextResponse.json(
          {
            success: false,
            error: 'UNAUTHORIZED',
            message: 'Please log in to access this resource',
            redirectUrl: '/login',
          },
          { status: 401 }
        )
      }

      if (error.message.includes('Insufficient permissions')) {
        return NextResponse.json(
          {
            success: false,
            error: 'FORBIDDEN',
            message: 'You do not have permission to access this resource',
            redirectUrl: '/dashboard',
          },
          { status: 403 }
        )
      }
    }

    // Generic error
    return NextResponse.json(
      {
        success: false,
        error: 'INTERNAL_ERROR',
        message: 'An unexpected error occurred',
      },
      { status: 500 }
    )
  }
}

// ==========================================
// EXAMPLE 12: Audit Logging
// ==========================================

/**
 * Protected route with audit logging
 */
export async function protectedRouteWithAuditLog(request: NextRequest) {
  const user = await getCurrentUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Log the action
  console.log({
    timestamp: new Date().toISOString(),
    userId: user.userId,
    userName: user.name,
    role: user.role,
    action: 'ACCESS_PROTECTED_RESOURCE',
    resource: request.nextUrl.pathname,
    method: request.method,
    ip: request.headers.get('x-forwarded-for') || 'unknown',
  })

  // Perform operation
  return NextResponse.json({ success: true })
}

// ==========================================
// NOTES
// ==========================================

/*
Key Takeaways:

1. ALWAYS use getCurrentUser() or requireAuth() at the start of protected routes
2. Use requireRole() for admin-only operations
3. Use hasRole() for conditional logic based on roles
4. Handle errors gracefully with proper status codes
5. Return JSON for API routes, redirect for pages
6. Log important actions for audit trails
7. Test with different roles and scenarios
8. Never trust client-side role checks
9. Always validate on server-side
10. Use TypeScript for type safety

Remember:
- Middleware runs BEFORE route handlers
- User context is injected into request headers
- Use helper functions from auth.utils.ts
- Test thoroughly with different roles
*/
