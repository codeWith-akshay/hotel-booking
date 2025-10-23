'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/auth.store'

// ==========================================
// ADMIN ROOT PAGE
// ==========================================
// Redirects to admin dashboard or login based on authentication

export default function AdminPage() {
  const router = useRouter()
  const { user, isAuthenticated } = useAuthStore()

  useEffect(() => {
    // Check if user is authenticated and has admin privileges
    if (!isAuthenticated || !user) {
      // Not authenticated, redirect to login
      router.push('/login')
      return
    }

    // Check if user has admin or superadmin role
    if (user.role === 'ADMIN' || user.role === 'SUPERADMIN') {
      // Redirect to admin dashboard
      router.push('/admin/dashboard')
    } else {
      // User is authenticated but not admin, redirect to member dashboard
      router.push('/dashboard')
    }
  }, [isAuthenticated, user, router])

  // Show loading while redirecting
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Redirecting to admin panel...</p>
      </div>
    </div>
  )
}