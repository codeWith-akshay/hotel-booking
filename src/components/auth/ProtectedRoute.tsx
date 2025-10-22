// ==========================================
// PROTECTED ROUTE COMPONENT
// ==========================================
// Role-based route protection for Next.js pages
// Validates JWT token and user roles, handles redirects

'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useAuthStore, type User } from '@/store/auth.store'
import type { Role } from '@/lib/auth/route-protection'

// ==========================================
// TYPE DEFINITIONS
// ==========================================

/**
 * Props for ProtectedRoute component
 */
export interface ProtectedRouteProps {
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

/**
 * Loading state reasons
 */
type LoadingReason = 'checking-auth' | 'validating-token' | 'checking-role' | 'redirecting'

// ==========================================
// DEFAULT LOADING COMPONENT
// ==========================================

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

// ==========================================
// PROTECTED ROUTE COMPONENT
// ==========================================

/**
 * ProtectedRoute Component
 * 
 * Wraps page content and enforces authentication + role-based access control.
 * 
 * Features:
 * - JWT token validation
 * - Role-based access control
 * - Automatic redirects for unauthorized access
 * - Loading states during auth checks
 * - Token expiration handling
 * - Preserves intended destination for redirect after login
 * 
 * @example
 * ```tsx
 * // Protect route for MEMBER role only
 * <ProtectedRoute allowedRoles={['MEMBER']}>
 *   <MemberDashboard />
 * </ProtectedRoute>
 * 
 * // Protect route for ADMIN and SUPERADMIN
 * <ProtectedRoute allowedRoles={['ADMIN', 'SUPERADMIN']}>
 *   <AdminPanel />
 * </ProtectedRoute>
 * 
 * // Protect route, allow any authenticated user
 * <ProtectedRoute>
 *   <ProfilePage />
 * </ProtectedRoute>
 * ```
 */
export default function ProtectedRoute({
  children,
  allowedRoles,
  loginPath = '/login',
  forbiddenPath = '/403',
  loadingComponent,
  onAuthCheck,
}: ProtectedRouteProps) {
  const router = useRouter()
  const pathname = usePathname()
  
  // Zustand store
  const { user, token, isAuthenticated, isTokenExpired, logout } = useAuthStore()
  
  // Local state
  const [isChecking, setIsChecking] = useState(true)
  const [loadingReason, setLoadingReason] = useState<LoadingReason>('checking-auth')

  // ==========================================
  // AUTH CHECK EFFECT
  // ==========================================
  useEffect(() => {
    const checkAuth = async () => {
      try {
        // ==========================================
        // STEP 1: Check if user is authenticated
        // ==========================================
        setLoadingReason('checking-auth')
        
        if (!isAuthenticated || !token || !user) {
          console.log('[ProtectedRoute] Not authenticated, redirecting to login')
          
          // Store intended destination
          const returnUrl = encodeURIComponent(pathname)
          
          // Redirect to login
          setLoadingReason('redirecting')
          router.push(`${loginPath}?returnUrl=${returnUrl}`)
          
          // Notify callback
          onAuthCheck?.(false, null)
          return
        }

        // ==========================================
        // STEP 2: Validate JWT token expiration
        // ==========================================
        setLoadingReason('validating-token')
        
        if (isTokenExpired()) {
          console.log('[ProtectedRoute] Token expired, logging out')
          
          // Clear session
          logout()
          
          // Store intended destination
          const returnUrl = encodeURIComponent(pathname)
          
          // Redirect to login with session expired message
          setLoadingReason('redirecting')
          router.push(`${loginPath}?returnUrl=${returnUrl}&reason=session-expired`)
          
          // Notify callback
          onAuthCheck?.(false, null)
          return
        }

        // ==========================================
        // STEP 3: Check role-based access
        // ==========================================
        if (allowedRoles && allowedRoles.length > 0) {
          setLoadingReason('checking-role')
          
          const userRole = user.role as Role
          const hasAccess = allowedRoles.includes(userRole)
          
          if (!hasAccess) {
            console.log(
              `[ProtectedRoute] User role "${userRole}" not in allowed roles:`,
              allowedRoles
            )
            
            // Redirect to forbidden page
            setLoadingReason('redirecting')
            router.push(`${forbiddenPath}?from=${encodeURIComponent(pathname)}`)
            
            // Notify callback
            onAuthCheck?.(false, user)
            return
          }
          
          console.log(`[ProtectedRoute] Access granted for role: ${userRole}`)
        }

        // ==========================================
        // STEP 4: Access granted
        // ==========================================
        console.log('[ProtectedRoute] Auth check passed, rendering protected content')
        
        // Notify callback
        onAuthCheck?.(true, user)
        
        // Done checking
        setIsChecking(false)
      } catch (error) {
        console.error('[ProtectedRoute] Error during auth check:', error)
        
        // On error, redirect to login
        logout()
        const returnUrl = encodeURIComponent(pathname)
        router.push(`${loginPath}?returnUrl=${returnUrl}&reason=error`)
        
        // Notify callback
        onAuthCheck?.(false, null)
      }
    }

    checkAuth()
  }, [
    isAuthenticated,
    token,
    user,
    allowedRoles,
    pathname,
    router,
    loginPath,
    forbiddenPath,
    isTokenExpired,
    logout,
    onAuthCheck,
  ])

  // ==========================================
  // RENDER LOADING STATE
  // ==========================================
  if (isChecking) {
    return loadingComponent || <DefaultLoadingComponent />
  }

  // ==========================================
  // RENDER PROTECTED CONTENT
  // ==========================================
  return <>{children}</>
}

// ==========================================
// UTILITY COMPONENTS
// ==========================================

/**
 * Custom Loading Component with Reason
 * 
 * @example
 * ```tsx
 * <ProtectedRoute
 *   loadingComponent={<LoadingWithReason />}
 * >
 *   <Dashboard />
 * </ProtectedRoute>
 * ```
 */
export function LoadingWithReason() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center space-y-4">
        {/* Animated Logo */}
        <div className="flex justify-center">
          <div className="w-16 h-16 bg-linear-to-br from-blue-600 to-blue-800 rounded-2xl flex items-center justify-center animate-pulse">
            <span className="text-white font-bold text-2xl">H</span>
          </div>
        </div>
        
        {/* Loading Spinner */}
        <div className="flex justify-center">
          <div className="w-8 h-8 border-3 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
        </div>
        
        {/* Loading Text */}
        <div>
          <p className="text-gray-900 font-semibold">Verifying Access</p>
          <p className="text-sm text-gray-500 mt-1">Please wait a moment...</p>
        </div>
      </div>
    </div>
  )
}

/**
 * Minimal Loading Component
 * Simple spinner without extra styling
 */
export function MinimalLoading() {
  return (
    <div className="flex items-center justify-center p-8">
      <div className="w-10 h-10 border-4 border-gray-200 border-t-blue-600 rounded-full animate-spin" />
    </div>
  )
}
