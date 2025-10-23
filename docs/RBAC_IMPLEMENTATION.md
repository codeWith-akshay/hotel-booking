# Role-Based Access Control (RBAC) Documentation

Complete documentation for implementing role-based access control on admin pages.

## Table of Contents
- [Overview](#overview)
- [Protected Routes](#protected-routes)
- [Implementation](#implementation)
- [User Roles](#user-roles)
- [Visual Feedback](#visual-feedback)
- [Testing](#testing)
- [Troubleshooting](#troubleshooting)

## Overview

The hotel booking system implements Role-Based Access Control (RBAC) to restrict access to admin pages:

- **/admin/rooms** - Only accessible by `ADMIN` and `SUPERADMIN`
- **/admin/inventory** - Only accessible by `ADMIN` and `SUPERADMIN`

### Key Features
- ✅ **Automatic Redirects**: Unauthorized users → `/403`
- ✅ **Unauthenticated Users**: Redirect → `/login` (with return URL preserved)
- ✅ **Loading States**: Shows "Verifying access..." during auth check
- ✅ **Session Management**: Uses Zustand auth store for session state
- ✅ **Protected Route Component**: Reusable wrapper for any page

## Protected Routes

### ProtectedRoute Component

**Location**: `src/components/auth/ProtectedRoute.tsx`

**Purpose**: Wraps page content and enforces authentication + role-based access control.

**Features**:
- JWT token validation
- Role-based access control
- Automatic redirects for unauthorized access
- Loading states during auth checks
- Token expiration handling
- Preserves intended destination for redirect after login

**Props**:

```typescript
interface ProtectedRouteProps {
  /** Child components to render when authorized */
  children: React.ReactNode
  
  /** Array of roles allowed to access this route */
  allowedRoles?: Role[]
  
  /** Redirect path for unauthenticated users (default: /login) */
  loginPath?: string
  
  /** Redirect path for unauthorized users (default: /403) */
  forbiddenPath?: string
  
  /** Show loading component during auth check */
  loadingComponent?: React.ReactNode
  
  /** Callback when auth check completes */
  onAuthCheck?: (isAuthorized: boolean, user: User | null) => void
}
```

**Usage**:

```typescript
import ProtectedRoute from '@/components/auth/ProtectedRoute'

export default function AdminPage() {
  return (
    <ProtectedRoute allowedRoles={['ADMIN', 'SUPERADMIN']}>
      {/* Page content here */}
    </ProtectedRoute>
  )
}
```

## Implementation

### Admin Rooms Page

**File**: `src/app/(admin)/rooms/page.tsx`

**Before RBAC**:
```typescript
export default function AdminRoomsPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      {/* Page content */}
    </div>
  )
}
```

**After RBAC**:
```typescript
import ProtectedRoute from '@/components/auth/ProtectedRoute'

export default function AdminRoomsPage() {
  return (
    <ProtectedRoute allowedRoles={['ADMIN', 'SUPERADMIN']}>
      <div className="container mx-auto px-4 py-8">
        {/* Page content */}
      </div>
    </ProtectedRoute>
  )
}
```

### Admin Inventory Page

**File**: `src/app/(admin)/inventory/page.tsx`

**Before RBAC**:
```typescript
export default function AdminInventoryPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      {/* Page content */}
    </div>
  )
}
```

**After RBAC**:
```typescript
import ProtectedRoute from '@/components/auth/ProtectedRoute'

export default function AdminInventoryPage() {
  return (
    <ProtectedRoute allowedRoles={['ADMIN', 'SUPERADMIN']}>
      <div className="container mx-auto px-4 py-8">
        {/* Page content */}
      </div>
    </ProtectedRoute>
  )
}
```

## User Roles

The system supports the following roles:

| Role | Access Level | Permissions |
|------|--------------|-------------|
| `SUPERADMIN` | Highest | Full system access, all admin pages |
| `ADMIN` | High | Manage rooms, inventory, bookings |
| `MEMBER` | Standard | View own bookings, make reservations |
| `GUEST` | Lowest | Browse available rooms (no login) |

### Role Hierarchy

```
SUPERADMIN
    └── ADMIN
            └── MEMBER
                    └── GUEST
```

### Admin Pages Access Matrix

| Page | SUPERADMIN | ADMIN | MEMBER | GUEST |
|------|------------|-------|--------|-------|
| `/admin/rooms` | ✅ | ✅ | ❌ | ❌ |
| `/admin/inventory` | ✅ | ✅ | ❌ | ❌ |
| `/admin/bookings` | ✅ | ✅ | ❌ | ❌ |
| `/dashboard` | ✅ | ✅ | ✅ | ❌ |
| `/member/profile` | ✅ | ✅ | ✅ | ❌ |

## Visual Feedback

### Loading State

When a user navigates to a protected page, they see:

```
┌─────────────────────────────────┐
│                                 │
│         [Spinner Animation]     │
│                                 │
│      Verifying access...        │
│                                 │
└─────────────────────────────────┘
```

**Code**:
```typescript
const DefaultLoadingComponent = () => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50">
    <div className="text-center">
      {/* Loading Spinner */}
      <div className="inline-block w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
      
      {/* Loading Text */}
      <p className="mt-4 text-gray-600 font-medium">Verifying access...</p>
    </div>
  </div>
)
```

### Unauthorized Access (403 Page)

When a user without proper role tries to access admin pages, they are redirected to `/403`.

**Create 403 Page** (`src/app/403/page.tsx`):

```typescript
'use client'

import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'

export default function ForbiddenPage() {
  const router = useRouter()

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center max-w-md px-4">
        {/* 403 Icon */}
        <div className="mx-auto w-24 h-24 bg-red-100 rounded-full flex items-center justify-center mb-6">
          <svg
            className="w-12 h-12 text-red-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
        </div>

        {/* Title */}
        <h1 className="text-4xl font-bold text-gray-900 mb-4">403</h1>
        <h2 className="text-2xl font-semibold text-gray-800 mb-4">
          Access Denied
        </h2>

        {/* Description */}
        <p className="text-gray-600 mb-8">
          You don't have permission to access this page. 
          Please contact an administrator if you believe this is an error.
        </p>

        {/* Actions */}
        <div className="flex gap-4 justify-center">
          <Button
            variant="outline"
            onClick={() => router.back()}
          >
            Go Back
          </Button>
          <Button
            onClick={() => router.push('/dashboard')}
          >
            Go to Dashboard
          </Button>
        </div>
      </div>
    </div>
  )
}
```

### Toast Notifications (Optional)

For additional feedback, you can show toast notifications when access is denied:

```typescript
import { useAuthStore } from '@/store/auth.store'
import { Toast } from '@/components/ui/Toast'

export default function AdminPage() {
  const [toast, setToast] = useState<{ message: string; type: 'error' } | null>(null)
  const user = useAuthStore((state) => state.user)

  const handleAuthCheck = (isAuthorized: boolean, user: User | null) => {
    if (!isAuthorized && user) {
      // User is logged in but doesn't have permission
      setToast({
        message: 'You do not have permission to access this page',
        type: 'error',
      })
    }
  }

  return (
    <>
      <ProtectedRoute
        allowedRoles={['ADMIN', 'SUPERADMIN']}
        onAuthCheck={handleAuthCheck}
      >
        {/* Page content */}
      </ProtectedRoute>

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </>
  )
}
```

## Testing

### Test Scenarios

#### 1. Unauthenticated User

**Test**: Navigate to `/admin/rooms` without being logged in

**Expected Behavior**:
1. Shows "Verifying access..." loading screen
2. Redirects to `/login?callbackUrl=/admin/rooms`
3. After successful login, redirects back to `/admin/rooms`

**How to Test**:
```bash
# 1. Logout if logged in
# 2. Navigate to http://localhost:3000/admin/rooms
# 3. Should redirect to /login
# 4. Login with valid credentials
# 5. Should redirect back to /admin/rooms
```

#### 2. MEMBER Role User

**Test**: Login as MEMBER, navigate to `/admin/rooms`

**Expected Behavior**:
1. Shows "Verifying access..." loading screen
2. Validates JWT token
3. Checks user role (MEMBER)
4. MEMBER not in allowedRoles (['ADMIN', 'SUPERADMIN'])
5. Redirects to `/403`

**How to Test**:
```bash
# 1. Login with MEMBER credentials
# 2. Navigate to http://localhost:3000/admin/rooms
# 3. Should redirect to /403
# 4. Should see "Access Denied" message
```

#### 3. ADMIN Role User

**Test**: Login as ADMIN, navigate to `/admin/rooms`

**Expected Behavior**:
1. Shows "Verifying access..." loading screen
2. Validates JWT token
3. Checks user role (ADMIN)
4. ADMIN in allowedRoles (['ADMIN', 'SUPERADMIN'])
5. Shows page content

**How to Test**:
```bash
# 1. Login with ADMIN credentials
# 2. Navigate to http://localhost:3000/admin/rooms
# 3. Should show Admin Rooms page
# 4. Should be able to perform all operations
```

#### 4. SUPERADMIN Role User

**Test**: Login as SUPERADMIN, navigate to `/admin/rooms`

**Expected Behavior**:
1. Shows "Verifying access..." loading screen
2. Validates JWT token
3. Checks user role (SUPERADMIN)
4. SUPERADMIN in allowedRoles (['ADMIN', 'SUPERADMIN'])
5. Shows page content

**How to Test**:
```bash
# 1. Login with SUPERADMIN credentials
# 2. Navigate to http://localhost:3000/admin/rooms
# 3. Should show Admin Rooms page
# 4. Should be able to perform all operations
```

#### 5. Expired Token

**Test**: Have an expired JWT token, navigate to `/admin/rooms`

**Expected Behavior**:
1. Shows "Verifying access..." loading screen
2. Detects token expiration
3. Redirects to `/login?callbackUrl=/admin/rooms`
4. Shows toast: "Session expired. Please login again."

**How to Test**:
```bash
# 1. Login with valid credentials
# 2. Manually expire the token (or wait for natural expiration)
# 3. Navigate to http://localhost:3000/admin/rooms
# 4. Should redirect to /login
```

### Manual Testing Checklist

- [ ] **Unauthenticated Access**
  - [ ] Navigate to `/admin/rooms` → redirects to `/login`
  - [ ] Navigate to `/admin/inventory` → redirects to `/login`
  - [ ] Login → redirects back to intended page

- [ ] **MEMBER Role**
  - [ ] Login as MEMBER
  - [ ] Navigate to `/admin/rooms` → redirects to `/403`
  - [ ] Navigate to `/admin/inventory` → redirects to `/403`
  - [ ] Can access `/dashboard` successfully

- [ ] **ADMIN Role**
  - [ ] Login as ADMIN
  - [ ] Navigate to `/admin/rooms` → shows page
  - [ ] Navigate to `/admin/inventory` → shows page
  - [ ] Can perform all CRUD operations

- [ ] **SUPERADMIN Role**
  - [ ] Login as SUPERADMIN
  - [ ] Navigate to `/admin/rooms` → shows page
  - [ ] Navigate to `/admin/inventory` → shows page
  - [ ] Can perform all CRUD operations

- [ ] **Token Expiration**
  - [ ] Expired token → redirects to `/login`
  - [ ] Invalid token → redirects to `/login`

- [ ] **Visual Feedback**
  - [ ] Loading spinner shows during auth check
  - [ ] "Verifying access..." text visible
  - [ ] 403 page shows proper styling
  - [ ] Toast notifications work (if implemented)

### Automated Testing (Vitest)

```typescript
import { describe, it, expect, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { useRouter } from 'next/navigation'
import ProtectedRoute from '@/components/auth/ProtectedRoute'
import { useAuthStore } from '@/store/auth.store'

vi.mock('next/navigation')
vi.mock('@/store/auth.store')

describe('ProtectedRoute', () => {
  it('should redirect unauthenticated users to login', async () => {
    const mockPush = vi.fn()
    vi.mocked(useRouter).mockReturnValue({ push: mockPush } as any)
    vi.mocked(useAuthStore).mockReturnValue({
      user: null,
      isAuthenticated: false,
      token: null,
    } as any)

    render(
      <ProtectedRoute allowedRoles={['ADMIN']}>
        <div>Protected Content</div>
      </ProtectedRoute>
    )

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/login?callbackUrl=/')
    })
  })

  it('should redirect unauthorized users to 403', async () => {
    const mockPush = vi.fn()
    vi.mocked(useRouter).mockReturnValue({ push: mockPush } as any)
    vi.mocked(useAuthStore).mockReturnValue({
      user: { role: 'MEMBER' },
      isAuthenticated: true,
      token: 'valid-token',
    } as any)

    render(
      <ProtectedRoute allowedRoles={['ADMIN']}>
        <div>Protected Content</div>
      </ProtectedRoute>
    )

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/403')
    })
  })

  it('should show content for authorized users', async () => {
    vi.mocked(useRouter).mockReturnValue({ push: vi.fn() } as any)
    vi.mocked(useAuthStore).mockReturnValue({
      user: { role: 'ADMIN' },
      isAuthenticated: true,
      token: 'valid-token',
    } as any)

    render(
      <ProtectedRoute allowedRoles={['ADMIN']}>
        <div>Protected Content</div>
      </ProtectedRoute>
    )

    await waitFor(() => {
      expect(screen.getByText('Protected Content')).toBeInTheDocument()
    })
  })
})
```

## Troubleshooting

### Issue: Infinite redirect loop

**Symptoms**: Page keeps redirecting between `/login` and target page

**Possible Causes**:
1. Auth store not persisting correctly
2. Token validation failing
3. Browser cookies/localStorage issues

**Solutions**:
1. Check Zustand persist configuration
2. Verify JWT token is being stored
3. Clear browser storage and try again
4. Check token expiration logic

---

### Issue: Authorized user sees 403

**Symptoms**: Admin user gets "Access Denied" page

**Possible Causes**:
1. Role string mismatch (e.g., "Admin" vs "ADMIN")
2. Token doesn't contain role information
3. Auth store not updated after login

**Solutions**:
1. Verify role is uppercase: `'ADMIN'` not `'admin'`
2. Check JWT payload includes `role` field
3. Ensure login action updates auth store
4. Console.log user object to verify role

---

### Issue: Loading screen never disappears

**Symptoms**: "Verifying access..." shows indefinitely

**Possible Causes**:
1. Async auth check not completing
2. useEffect dependency issues
3. Router not available (SSR issue)

**Solutions**:
1. Check browser console for errors
2. Verify `'use client'` directive is present
3. Add timeout to auth check logic
4. Ensure router methods are available

---

### Issue: No redirect on unauthorized access

**Symptoms**: Unauthorized user sees page content

**Possible Causes**:
1. ProtectedRoute not wrapping page
2. allowedRoles prop missing
3. Auth check bypassed

**Solutions**:
1. Verify ProtectedRoute is wrapping return JSX
2. Add `allowedRoles={['ADMIN', 'SUPERADMIN']}` prop
3. Check if auth check is actually running

---

## Summary

The RBAC implementation provides:

✅ **Security**: Prevents unauthorized access to admin pages  
✅ **User Experience**: Clear feedback with loading and error states  
✅ **Flexibility**: Reusable `ProtectedRoute` component for any page  
✅ **Maintainability**: Centralized role checking logic  
✅ **Type Safety**: TypeScript types for roles and user objects  

### Key Files

| File | Purpose |
|------|---------|
| `src/components/auth/ProtectedRoute.tsx` | Main protection component |
| `src/app/(admin)/rooms/page.tsx` | Protected admin rooms page |
| `src/app/(admin)/inventory/page.tsx` | Protected admin inventory page |
| `src/app/403/page.tsx` | Access denied page |
| `src/store/auth.store.ts` | Authentication state management |

### Next Steps

1. ✅ Create 403 error page with styling
2. ✅ Test all role combinations
3. ✅ Add toast notifications for denied access
4. ✅ Implement session refresh logic
5. ✅ Add audit logging for access attempts
6. ✅ Create admin dashboard with role-based menu
