# Protected Route Component - Step 2 Complete

## 📋 Overview

Complete role-based route protection system for Next.js with JWT validation, automatic redirects, and comprehensive permission utilities.

## ✨ Components Created

### 1. **ProtectedRoute** (`src/components/auth/ProtectedRoute.tsx`)
- JWT token validation
- Role-based access control
- Automatic redirects (login/403)
- Loading states during auth check
- Token expiration handling
- Return URL preservation
- Auth check callbacks

### 2. **Route Protection Utilities** (`src/lib/auth/route-protection.ts`)
- `checkRole()` - Validate user roles
- `checkRouteAccess()` - Check route permissions
- `canPerformAction()` - Action-based permissions
- `hasRoleLevel()` - Role hierarchy checks
- `getDefaultDashboard()` - Role-based dashboard routing
- Route configuration system
- Permission validation helpers

### 3. **403 Forbidden Page** (`src/app/403/page.tsx`)
- User-friendly error message
- Shows attempted access path
- Displays current user role
- Auto-redirect with countdown
- Navigation options
- Contact support link

### 4. **Auth Store** (Already exists: `src/store/auth.store.ts`)
- JWT token management
- User session persistence
- Token expiration checking
- Auth state management

## 🚀 Quick Start

### Basic Usage

```tsx
// app/dashboard/page.tsx
'use client'

import ProtectedRoute from '@/components/auth/ProtectedRoute'

export default function DashboardPage() {
  return (
    <ProtectedRoute>
      <h1>Dashboard</h1>
      <p>Any authenticated user can access this.</p>
    </ProtectedRoute>
  )
}
```

### Role-Based Protection

```tsx
// app/admin/page.tsx
'use client'

import ProtectedRoute from '@/components/auth/ProtectedRoute'

export default function AdminPage() {
  return (
    <ProtectedRoute allowedRoles={['ADMIN', 'SUPERADMIN']}>
      <h1>Admin Panel</h1>
      <p>Only admins can see this.</p>
    </ProtectedRoute>
  )
}
```

### Member-Only Page

```tsx
// app/profile/page.tsx
import ProtectedRoute from '@/components/auth/ProtectedRoute'

export default function ProfilePage() {
  return (
    <ProtectedRoute allowedRoles={['MEMBER']}>
      <div className="p-6">
        <h1>Member Profile</h1>
        <p>Exclusive member content</p>
      </div>
    </ProtectedRoute>
  )
}
```

## 🎯 Features

### Role Hierarchy

```typescript
MEMBER < ADMIN < SUPERADMIN
```

**Role Permissions:**
- **MEMBER**: Basic user access (dashboard, profile, bookings)
- **ADMIN**: Management access (reports, user management, bookings)
- **SUPERADMIN**: Full system access (settings, rules, communication)

### Supported Roles

```typescript
type Role = 'MEMBER' | 'ADMIN' | 'SUPERADMIN'
```

## 📝 API Reference

### ProtectedRoute Props

```typescript
interface ProtectedRouteProps {
  children: React.ReactNode
  allowedRoles?: Role[]
  loginPath?: string              // Default: '/login'
  forbiddenPath?: string          // Default: '/403'
  loadingComponent?: React.ReactNode
  onAuthCheck?: (isAuthorized: boolean, user: User | null) => void
}
```

### Utility Functions

#### `checkRole(userRole, allowedRoles)`

Check if user has required role.

```typescript
import { checkRole } from '@/lib/auth/route-protection'

const result = checkRole('ADMIN', ['ADMIN', 'SUPERADMIN'])
// Returns: { allowed: true }

const result2 = checkRole('MEMBER', ['ADMIN'])
// Returns: { 
//   allowed: false, 
//   reason: 'Insufficient permissions',
//   missingRoles: ['ADMIN']
// }
```

#### `checkRouteAccess(user, allowedRoles)`

Check if user can access a route.

```typescript
import { checkRouteAccess } from '@/lib/auth/route-protection'

const result = checkRouteAccess(user, ['ADMIN', 'SUPERADMIN'])
if (result.allowed) {
  // User can access
}
```

#### `canPerformAction(user, action, resourceOwnerId?)`

Check action-based permissions.

```typescript
import { canPerformAction } from '@/lib/auth/route-protection'

// Check if user can delete bookings
if (canPerformAction(user, 'delete:booking')) {
  // Show delete button
}

// Check if user can edit their own booking
if (canPerformAction(user, 'edit:booking', booking.userId)) {
  // Allow editing
}
```

**Available Actions:**
- `create:booking`, `view:booking`, `edit:booking`, `delete:booking`, `cancel:booking`
- `view:profile`, `edit:profile`, `view:users`, `edit:user`, `delete:user`
- `view:reports`, `view:analytics`, `manage:settings`, `manage:roles`
- `send:notification`, `send:email`, `manage:templates`

#### `hasRoleLevel(userRole, requiredRole)`

Check role hierarchy.

```typescript
import { hasRoleLevel } from '@/lib/auth/route-protection'

hasRoleLevel('ADMIN', 'MEMBER')      // true (Admin >= Member)
hasRoleLevel('MEMBER', 'ADMIN')      // false (Member < Admin)
hasRoleLevel('SUPERADMIN', 'ADMIN')  // true (SuperAdmin >= Admin)
```

#### `getDefaultDashboard(role)`

Get default dashboard path for role.

```typescript
import { getDefaultDashboard } from '@/lib/auth/route-protection'

getDefaultDashboard('MEMBER')      // '/dashboard'
getDefaultDashboard('ADMIN')       // '/admin/dashboard'
getDefaultDashboard('SUPERADMIN')  // '/admin/dashboard'
```

## 🎨 Custom Loading Components

### Default Loading

```tsx
<ProtectedRoute allowedRoles={['MEMBER']}>
  <YourContent />
</ProtectedRoute>
```

### Loading with Reason

```tsx
import ProtectedRoute, { LoadingWithReason } from '@/components/auth/ProtectedRoute'

<ProtectedRoute
  allowedRoles={['ADMIN']}
  loadingComponent={<LoadingWithReason />}
>
  <AdminPanel />
</ProtectedRoute>
```

### Minimal Loading

```tsx
import ProtectedRoute, { MinimalLoading } from '@/components/auth/ProtectedRoute'

<ProtectedRoute
  loadingComponent={<MinimalLoading />}
>
  <QuickPage />
</ProtectedRoute>
```

### Custom Loading Component

```tsx
function CustomLoading() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
        <p className="mt-4">Loading...</p>
      </div>
    </div>
  )
}

<ProtectedRoute loadingComponent={<CustomLoading />}>
  <YourContent />
</ProtectedRoute>
```

## 🔐 Auth Flow

### 1. Unauthenticated User

```
User visits /dashboard
  ↓
ProtectedRoute checks auth
  ↓
Not authenticated
  ↓
Redirect to /login?returnUrl=%2Fdashboard
```

### 2. Authenticated but Wrong Role

```
MEMBER user visits /admin
  ↓
ProtectedRoute checks role
  ↓
Role not in allowedRoles
  ↓
Redirect to /403?from=%2Fadmin
```

### 3. Token Expired

```
User visits /dashboard
  ↓
Token is expired
  ↓
Logout user
  ↓
Redirect to /login?returnUrl=%2Fdashboard&reason=session-expired
```

### 4. Authorized Access

```
ADMIN user visits /reports
  ↓
Token valid, role matches
  ↓
Render protected content
```

## 💡 Usage Examples

### Example 1: Conditional UI Elements

```tsx
'use client'

import { useAuthStore } from '@/store/auth.store'
import { canPerformAction } from '@/lib/auth/route-protection'
import ProtectedRoute from '@/components/auth/ProtectedRoute'

export default function BookingPage() {
  const { user } = useAuthStore()
  
  const canEdit = canPerformAction(user, 'edit:booking')
  const canDelete = canPerformAction(user, 'delete:booking')

  return (
    <ProtectedRoute allowedRoles={['MEMBER', 'ADMIN']}>
      <div>
        <h1>My Booking</h1>
        
        {/* Always visible */}
        <button>View Details</button>
        
        {/* Conditional buttons */}
        {canEdit && <button>Edit</button>}
        {canDelete && <button>Delete</button>}
      </div>
    </ProtectedRoute>
  )
}
```

### Example 2: Auth Check Callback

```tsx
function DashboardPage() {
  const handleAuthCheck = (isAuthorized: boolean, user: User | null) => {
    if (isAuthorized) {
      // Track page view
      analytics.track('dashboard_view', { userId: user?.id })
    }
  }

  return (
    <ProtectedRoute
      allowedRoles={['MEMBER']}
      onAuthCheck={handleAuthCheck}
    >
      <Dashboard />
    </ProtectedRoute>
  )
}
```

### Example 3: Custom Redirects

```tsx
<ProtectedRoute
  allowedRoles={['ADMIN']}
  loginPath="/auth/signin"
  forbiddenPath="/access-denied"
>
  <AdminPanel />
</ProtectedRoute>
```

### Example 4: Programmatic Permission Checks

```tsx
import { checkRole, canPerformAction } from '@/lib/auth/route-protection'

function MyComponent() {
  const { user } = useAuthStore()
  
  // Check role
  const isAdmin = checkRole(user?.role || '', ['ADMIN', 'SUPERADMIN']).allowed
  
  // Check action
  const canDelete = canPerformAction(user, 'delete:booking')
  
  return (
    <div>
      {isAdmin && <AdminTools />}
      {canDelete && <DeleteButton />}
    </div>
  )
}
```

## 🛣️ Route Configuration

### Define Protected Routes

```typescript
// In route-protection.ts
export const ROUTE_CONFIGS: Record<string, RouteConfig> = {
  '/dashboard': {
    path: '/dashboard',
    allowedRoles: ['MEMBER', 'ADMIN', 'SUPERADMIN'],
    requiresAuth: true,
  },
  '/admin/dashboard': {
    path: '/admin/dashboard',
    allowedRoles: ['ADMIN', 'SUPERADMIN'],
    requiresAuth: true,
  },
  '/settings': {
    path: '/settings',
    allowedRoles: ['SUPERADMIN'],
    requiresAuth: true,
  },
}
```

### Use Route Config

```typescript
import { getRouteConfig, requiresAuth } from '@/lib/auth/route-protection'

const config = getRouteConfig('/dashboard')
if (config && requiresAuth(config.path)) {
  // Route requires authentication
}
```

## 🐛 Troubleshooting

### Issue: Infinite redirect loop

**Solution**: Make sure login page is not protected

```tsx
// ❌ Wrong - will cause infinite loop
<ProtectedRoute>
  <LoginPage />
</ProtectedRoute>

// ✅ Correct - login page should be public
<LoginPage />
```

### Issue: User redirected even when authenticated

**Solution**: Check token expiration and validity

```tsx
import { useAuthStore } from '@/store/auth.store'

const { isTokenExpired, token } = useAuthStore()

console.log('Token exists:', !!token)
console.log('Token expired:', isTokenExpired())
```

### Issue: Wrong role still sees protected content

**Solution**: Ensure `allowedRoles` prop is set correctly

```tsx
// ✅ Correct
<ProtectedRoute allowedRoles={['ADMIN', 'SUPERADMIN']}>

// ❌ Wrong - missing allowedRoles allows all authenticated users
<ProtectedRoute>
```

## 📊 Permission Matrix

| Action | MEMBER | ADMIN | SUPERADMIN |
|--------|--------|-------|------------|
| View Dashboard | ✅ | ✅ | ✅ |
| View Profile | ✅ | ✅ | ✅ |
| Create Booking | ✅ | ✅ | ✅ |
| Edit Own Booking | ✅ | ✅ | ✅ |
| Delete Own Booking | ❌ | ✅ | ✅ |
| View All Bookings | ❌ | ✅ | ✅ |
| View Reports | ❌ | ✅ | ✅ |
| Manage Users | ❌ | ✅ | ✅ |
| Delete Users | ❌ | ❌ | ✅ |
| System Settings | ❌ | ❌ | ✅ |
| Manage Roles | ❌ | ❌ | ✅ |

## 📦 Files Created

```
src/
├── components/
│   └── auth/
│       └── ProtectedRoute.tsx           (340 lines) ✅
├── lib/
│   └── auth/
│       └── route-protection.ts          (450 lines) ✅
├── app/
│   └── 403/
│       └── page.tsx                     (210 lines) ✅
├── examples/
│   └── protected-route-examples.tsx     (440 lines) ✅
└── store/
    └── auth.store.ts                    (Already exists) ✅
```

## ✅ Features Completed

- ✅ ProtectedRoute component with JWT validation
- ✅ Role-based access control (MEMBER/ADMIN/SUPERADMIN)
- ✅ Automatic redirects (login/403)
- ✅ Token expiration handling
- ✅ Loading states during auth checks
- ✅ Return URL preservation
- ✅ Auth check callbacks
- ✅ Route configuration system
- ✅ Permission utility functions
- ✅ Action-based permissions
- ✅ Role hierarchy system
- ✅ 403 Forbidden page with auto-redirect
- ✅ Comprehensive examples
- ✅ Full TypeScript support

## 🚀 Next Steps

1. **Integration**: Wrap your protected pages with `<ProtectedRoute>`
2. **Customize**: Adjust allowed roles per route
3. **UI**: Add conditional UI based on permissions
4. **Testing**: Test with different user roles
5. **Analytics**: Track auth events with callbacks

---

**Created**: October 22, 2025  
**Version**: 1.0.0  
**Status**: ✅ Complete and Production-Ready
