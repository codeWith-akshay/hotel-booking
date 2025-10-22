// ==========================================
// PROTECTED ROUTE USAGE EXAMPLES
// ==========================================
// Comprehensive examples for using ProtectedRoute component

'use client'

import ProtectedRoute, {
  LoadingWithReason,
  MinimalLoading,
} from '@/components/auth/ProtectedRoute'
import {
  checkRole,
  checkRouteAccess,
  canPerformAction,
  getDefaultDashboard,
  hasRoleLevel,
} from '@/lib/auth/route-protection'
import { useAuthStore } from '@/store/auth.store'

// ==========================================
// EXAMPLE 1: Basic Protected Route (Any Authenticated User)
// ==========================================

/**
 * Allow any authenticated user to access
 * No role restriction
 */
export function Example1_BasicProtection() {
  return (
    <ProtectedRoute>
      <div className="p-6">
        <h1>Protected Content</h1>
        <p>Any authenticated user can see this.</p>
      </div>
    </ProtectedRoute>
  )
}

// ==========================================
// EXAMPLE 2: Role-Based Protection (Single Role)
// ==========================================

/**
 * Only MEMBER role can access
 */
export function Example2_MemberOnly() {
  return (
    <ProtectedRoute allowedRoles={['MEMBER']}>
      <div className="p-6">
        <h1>Member Dashboard</h1>
        <p>Only members can see this page.</p>
      </div>
    </ProtectedRoute>
  )
}

/**
 * Only ADMIN role can access
 */
export function Example3_AdminOnly() {
  return (
    <ProtectedRoute allowedRoles={['ADMIN']}>
      <div className="p-6">
        <h1>Admin Panel</h1>
        <p>Only admins can access this area.</p>
      </div>
    </ProtectedRoute>
  )
}

/**
 * Only SUPERADMIN role can access
 */
export function Example4_SuperAdminOnly() {
  return (
    <ProtectedRoute allowedRoles={['SUPERADMIN']}>
      <div className="p-6">
        <h1>Super Admin Settings</h1>
        <p>Restricted to super administrators.</p>
      </div>
    </ProtectedRoute>
  )
}

// ==========================================
// EXAMPLE 5: Multiple Allowed Roles
// ==========================================

/**
 * Allow ADMIN and SUPERADMIN
 */
export function Example5_MultipleRoles() {
  return (
    <ProtectedRoute allowedRoles={['ADMIN', 'SUPERADMIN']}>
      <div className="p-6">
        <h1>Reports</h1>
        <p>Admins and Super Admins can view reports.</p>
      </div>
    </ProtectedRoute>
  )
}

// ==========================================
// EXAMPLE 6: Custom Loading Component
// ==========================================

/**
 * Use custom loading component during auth check
 */
export function Example6_CustomLoading() {
  return (
    <ProtectedRoute
      allowedRoles={['MEMBER']}
      loadingComponent={<LoadingWithReason />}
    >
      <div className="p-6">
        <h1>Profile Page</h1>
      </div>
    </ProtectedRoute>
  )
}

/**
 * Use minimal loading spinner
 */
export function Example7_MinimalLoading() {
  return (
    <ProtectedRoute
      allowedRoles={['ADMIN']}
      loadingComponent={<MinimalLoading />}
    >
      <div className="p-6">
        <h1>Admin Dashboard</h1>
      </div>
    </ProtectedRoute>
  )
}

// ==========================================
// EXAMPLE 8: Custom Redirect Paths
// ==========================================

/**
 * Custom login and forbidden pages
 */
export function Example8_CustomRedirects() {
  return (
    <ProtectedRoute
      allowedRoles={['ADMIN']}
      loginPath="/auth/login"
      forbiddenPath="/access-denied"
    >
      <div className="p-6">
        <h1>Custom Redirects</h1>
      </div>
    </ProtectedRoute>
  )
}

// ==========================================
// EXAMPLE 9: Auth Check Callback
// ==========================================

/**
 * Track auth check results
 */
export function Example9_AuthCheckCallback() {
  const handleAuthCheck = (isAuthorized: boolean, user: any) => {
    console.log('Auth check complete:', { isAuthorized, user })
    
    if (isAuthorized) {
      // Track successful access
      console.log('User authorized:', user?.name)
    } else {
      // Track denied access
      console.log('Access denied')
    }
  }

  return (
    <ProtectedRoute
      allowedRoles={['MEMBER']}
      onAuthCheck={handleAuthCheck}
    >
      <div className="p-6">
        <h1>Tracked Page</h1>
      </div>
    </ProtectedRoute>
  )
}

// ==========================================
// EXAMPLE 10: Full Page Layout with ProtectedRoute
// ==========================================

/**
 * Complete page with layout and protection
 */
export function Example10_FullPageLayout() {
  return (
    <ProtectedRoute allowedRoles={['MEMBER', 'ADMIN']}>
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white shadow">
          <div className="max-w-7xl mx-auto px-4 py-6">
            <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          </div>
        </header>
        
        <main className="max-w-7xl mx-auto px-4 py-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-lg shadow">
              <h2 className="text-xl font-semibold mb-2">Card 1</h2>
              <p>Protected content here...</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow">
              <h2 className="text-xl font-semibold mb-2">Card 2</h2>
              <p>More content...</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow">
              <h2 className="text-xl font-semibold mb-2">Card 3</h2>
              <p>Even more content...</p>
            </div>
          </div>
        </main>
      </div>
    </ProtectedRoute>
  )
}

// ==========================================
// EXAMPLE 11: Using Route Protection Utilities
// ==========================================

/**
 * Check permissions programmatically
 */
export function Example11_PermissionChecks() {
  const { user } = useAuthStore()

  return (
    <ProtectedRoute>
      <div className="p-6 space-y-4">
        <h1 className="text-2xl font-bold">Permission Checks</h1>

        {/* Check role */}
        <div className="bg-white p-4 rounded border">
          <h2 className="font-semibold mb-2">Role Check</h2>
          <p className="text-sm">
            Can user access admin panel?{' '}
            {checkRole(user?.role || '', ['ADMIN', 'SUPERADMIN']).allowed
              ? '✅ Yes'
              : '❌ No'}
          </p>
        </div>

        {/* Check action permission */}
        <div className="bg-white p-4 rounded border">
          <h2 className="font-semibold mb-2">Action Permission</h2>
          <p className="text-sm">
            Can user delete bookings?{' '}
            {canPerformAction(user, 'delete:booking') ? '✅ Yes' : '❌ No'}
          </p>
        </div>

        {/* Check role level */}
        <div className="bg-white p-4 rounded border">
          <h2 className="font-semibold mb-2">Role Level</h2>
          <p className="text-sm">
            Is user admin or higher?{' '}
            {user && hasRoleLevel(user.role as any, 'ADMIN') ? '✅ Yes' : '❌ No'}
          </p>
        </div>
      </div>
    </ProtectedRoute>
  )
}

// ==========================================
// EXAMPLE 12: Conditional UI Based on Permissions
// ==========================================

/**
 * Show/hide UI elements based on user permissions
 */
export function Example12_ConditionalUI() {
  const { user } = useAuthStore()

  const canEdit = canPerformAction(user, 'edit:booking')
  const canDelete = canPerformAction(user, 'delete:booking')
  const canViewReports = checkRole(user?.role || '', ['ADMIN', 'SUPERADMIN']).allowed

  return (
    <ProtectedRoute allowedRoles={['MEMBER', 'ADMIN', 'SUPERADMIN']}>
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-4">My Bookings</h1>

        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="font-semibold mb-2">Booking #12345</h2>
          <p className="text-gray-600 mb-4">Hotel: Grand Plaza | Date: Oct 25, 2025</p>

          {/* Action Buttons (shown based on permissions) */}
          <div className="flex gap-2">
            <button className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
              View
            </button>

            {canEdit && (
              <button className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700">
                Edit
              </button>
            )}

            {canDelete && (
              <button className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700">
                Delete
              </button>
            )}
          </div>

          {/* Admin-only section */}
          {canViewReports && (
            <div className="mt-4 pt-4 border-t">
              <h3 className="font-semibold text-sm text-gray-700 mb-2">
                Admin Tools
              </h3>
              <button className="text-sm text-blue-600 hover:underline">
                View Booking Analytics →
              </button>
            </div>
          )}
        </div>
      </div>
    </ProtectedRoute>
  )
}

// ==========================================
// EXAMPLE 13: Nested Protection (Route + Component Level)
// ==========================================

/**
 * Double protection: page level + component level
 */
function AdminOnlyWidget() {
  const { user } = useAuthStore()
  
  if (!checkRole(user?.role || '', ['ADMIN', 'SUPERADMIN']).allowed) {
    return null // Don't render for non-admins
  }

  return (
    <div className="bg-yellow-50 border border-yellow-200 p-4 rounded">
      <h3 className="font-semibold text-yellow-900">Admin Widget</h3>
      <p className="text-sm text-yellow-800">
        This widget is only visible to admins.
      </p>
    </div>
  )
}

export function Example13_NestedProtection() {
  return (
    <ProtectedRoute allowedRoles={['MEMBER', 'ADMIN', 'SUPERADMIN']}>
      <div className="p-6 space-y-4">
        <h1 className="text-2xl font-bold">Dashboard</h1>

        {/* Visible to all authenticated users */}
        <div className="bg-white p-4 rounded shadow">
          <h2 className="font-semibold">Welcome</h2>
          <p>This section is visible to all users.</p>
        </div>

        {/* Only visible to admins */}
        <AdminOnlyWidget />
      </div>
    </ProtectedRoute>
  )
}

// ==========================================
// EXAMPLE 14: Redirect After Login
// ==========================================

/**
 * User will be redirected back to this page after login
 * The returnUrl query parameter is automatically added
 */
export function Example14_ReturnUrlAfterLogin() {
  return (
    <ProtectedRoute allowedRoles={['MEMBER']}>
      <div className="p-6">
        <h1>Booking Details</h1>
        <p>If you weren't logged in, you'll be redirected back here after login.</p>
      </div>
    </ProtectedRoute>
  )
}

// ==========================================
// EXAMPLE 15: Default Dashboard Redirect
// ==========================================

/**
 * Get user's default dashboard based on role
 */
export function Example15_DefaultDashboard() {
  const { user } = useAuthStore()

  if (!user) return null

  const defaultDashboard = getDefaultDashboard(user.role as any)

  return (
    <div className="p-6">
      <h1>Default Dashboard</h1>
      <p>Your default dashboard is: <strong>{defaultDashboard}</strong></p>
      <a href={defaultDashboard} className="text-blue-600 hover:underline">
        Go to dashboard →
      </a>
    </div>
  )
}
