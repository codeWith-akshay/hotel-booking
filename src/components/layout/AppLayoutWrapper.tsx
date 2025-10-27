'use client'

import { usePathname, useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/auth.store'
import { useState, useEffect, useCallback, useRef } from 'react'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'

interface AppLayoutWrapperProps {
  children: React.ReactNode
}

/**
 * Client-side wrapper for Header and Footer components
 * Handles authentication state and navigation
 */
export default function AppLayoutWrapper({ children }: AppLayoutWrapperProps) {
  const pathname = usePathname()
  const router = useRouter()
  const { user, isAuthenticated, logout, token } = useAuthStore()
  const [notificationCount, setNotificationCount] = useState(0)
  
  // Track if component is mounted to prevent state updates on unmounted component
  const isMountedRef = useRef(true)
  
  // Track last fetch time to prevent redundant fetches
  const lastFetchRef = useRef<number>(0)
  
  // Minimum time between fetches (5 seconds)
  const MIN_FETCH_INTERVAL = 5000

  // Memoized fetch function to prevent recreation on every render
  const fetchNotificationCount = useCallback(async () => {
    // Prevent redundant fetches within MIN_FETCH_INTERVAL
    const now = Date.now()
    if (now - lastFetchRef.current < MIN_FETCH_INTERVAL) {
      return
    }
    
    lastFetchRef.current = now

    try {
      const response = await fetch('/api/notifications/unread-count', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Cache-Control': 'no-cache',
        },
      })
      
      if (response.ok) {
        const data = await response.json()
        if (data.success && isMountedRef.current) {
          setNotificationCount(data.count)
        }
      } else if (response.status === 401) {
        // Token expired or invalid - don't retry
        console.warn('[AppLayoutWrapper] Unauthorized - stopping notification polling')
        return
      }
    } catch (error) {
      // Only log if not a network error during unmount
      if (isMountedRef.current) {
        console.error('[AppLayoutWrapper] Failed to fetch notification count:', error)
      }
    }
  }, [token])

  // Fetch notification count with optimized polling
  useEffect(() => {
    if (!isAuthenticated || !token) {
      setNotificationCount(0)
      return
    }

    // Fetch immediately on mount or auth change
    fetchNotificationCount()

    // Poll every 60 seconds for new notifications (increased from 30s)
    const interval = setInterval(fetchNotificationCount, 60000)

    return () => {
      clearInterval(interval)
    }
  }, [isAuthenticated, fetchNotificationCount])
  
  // Cleanup on unmount
  useEffect(() => {
    isMountedRef.current = true
    return () => {
      isMountedRef.current = false
    }
  }, [])

  // Routes where we should show header/footer
  const publicRoutes = ['/login', '/verify-otp', '/']
  const authRoutes = ['/dashboard', '/profile', '/booking', '/admin', '/superadmin']
  
  // Don't show header/footer on auth pages
  const isAuthPage = pathname.startsWith('/login') || pathname.startsWith('/verify-otp')
  
  // Show header/footer on authenticated routes or public pages
  const showLayout = !isAuthPage && (isAuthenticated || publicRoutes.includes(pathname))
  
  // Don't show footer on admin/superadmin routes
  const isAdminRoute = pathname.startsWith('/admin') || pathname.startsWith('/superadmin')

  const handleLogout = () => {
    logout()
    
    // Clear server-side cookies
    fetch('/api/auth/logout', {
      method: 'POST',
      credentials: 'include',
    }).catch(console.error)

    router.push('/login')
  }

  // If not showing layout, just render children
  if (!showLayout) {
    return <>{children}</>
  }

  // Default navigation links based on role
  const getNavLinks = () => {
    if (!user) return []
    
    const links = [
      { label: 'Home', href: '/dashboard', roles: ['MEMBER', 'ADMIN', 'SUPERADMIN'] },
      { label: 'Rooms', href: '/rooms', roles: ['MEMBER', 'ADMIN', 'SUPERADMIN'] },
      { label: 'Book Now', href: '/booking', roles: ['MEMBER', 'ADMIN', 'SUPERADMIN'] },
    ]

    // Add role-specific dashboard links for admin roles
    if (user.role === 'ADMIN') {
      links.push({ label: 'Admin Dashboard', href: '/admin/dashboard', roles: ['ADMIN'] })
    }

    if (user.role === 'SUPERADMIN') {
      links.push({ label: 'Super Admin Dashboard', href: '/superadmin/dashboard', roles: ['SUPERADMIN'] })
    }

    // Add additional links at the end
    links.push(
      { label: 'About', href: '/about', roles: ['MEMBER', 'ADMIN', 'SUPERADMIN'] },
      { label: 'Contact', href: '/contact', roles: ['MEMBER', 'ADMIN', 'SUPERADMIN'] }
    )

    return links
  }

  // Get notification URL based on user role
  const getNotificationUrl = () => {
    if (!user) return '/notifications'
    
    switch (user.role) {
      case 'ADMIN':
        return '/admin/notifications'
      case 'SUPERADMIN':
        return '/superadmin/notifications'
      default:
        return '/notifications'
    }
  }

  return (
    <div className="flex flex-col min-h-screen">
      {/* Header - Hidden on admin/superadmin routes */}
      {isAuthenticated && user && !isAdminRoute && (
        <Header
          user={{
            name: user.name,
            email: user.email || user.phone,
            phone: user.phone,
            role: user.role,
            id: user.id,
          }}
          onLogout={handleLogout}
          navLinks={getNavLinks()}
          showNotifications={true}
          notificationsCount={notificationCount}
          onNotificationClick={() => router.push(getNotificationUrl())}
        />
      )}

      {/* Main Content */}
      <main id="main-content" className="flex-1">
        {children}
      </main>

      {/* Footer - Hidden on admin/superadmin routes */}
      {!isAdminRoute && (
        <Footer
          companyName="Hotel Booking"
          showSocialLinks={true}
        />
      )}
    </div>
  )
}
