'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import ProtectedRoute from '@/components/auth/ProtectedRoute'

export default function NewBookingPage() {
  const router = useRouter()

  useEffect(() => {
    // Redirect to the booking flow (rooms page where users can start booking)
    router.push('/rooms')
  }, [router])

  return (
    <ProtectedRoute>
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    </ProtectedRoute>
  )
}
