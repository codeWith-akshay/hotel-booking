'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/auth.store'
import ProtectedRoute from '@/components/auth/ProtectedRoute'

export default function BookingsPage() {
  const router = useRouter()
  const { user } = useAuthStore()

  useEffect(() => {
    if (user) {
      // Redirect based on user role
      if (user.role === 'ADMIN' || user.role === 'SUPERADMIN') {
        router.push('/admin/bookings')
      } else {
        router.push('/bookings/my-bookings')
      }
    }
  }, [user, router])

  return (
    <ProtectedRoute>
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    </ProtectedRoute>
  )
}
