'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/auth.store'

// ==========================================
// SUPERADMIN ROOT PAGE
// ==========================================
// Redirects to superadmin dashboard or appropriate page based on authentication

export default function SuperAdminPage() {
  const router = useRouter()
  const { user, isAuthenticated } = useAuthStore()

  useEffect(() => {
    // Check if user is authenticated
    if (!isAuthenticated || !user) {
      // Not authenticated, redirect to login
      router.push('/login')
      return
    }

    // Check if user has superadmin role
    if (user.role === 'SUPERADMIN') {
      // Redirect to superadmin dashboard
      router.push('/superadmin/dashboard')
    } else if (user.role === 'ADMIN') {
      // Admin user trying to access superadmin, redirect to admin dashboard
      router.push('/admin/dashboard')
    } else {
      // Regular member, redirect to member dashboard
      router.push('/dashboard')
    }
  }, [isAuthenticated, user, router])

  // Show loading while redirecting
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-purple-50 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Redirecting to super admin panel...</p>
      </div>
    </div>
  )
}