'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/auth.store'

/**
 * Profile Completion Guard
 * Redirects users with incomplete profiles to /profile/setup
 * Use this in protected pages that require complete profile
 */
export function ProfileCompletionGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const { user, isAuthenticated } = useAuthStore()
  const [isHydrated, setIsHydrated] = useState(false)

  // Wait for Zustand store to rehydrate from localStorage
  useEffect(() => {
    setIsHydrated(true)
  }, [])

  useEffect(() => {
    // Only check profile after store has rehydrated
    if (!isHydrated) {
      return
    }

    console.log('[ProfileGuard] 🔍 Checking profile completion...', {
      isAuthenticated,
      userPhone: user?.phone,
      profileCompleted: user?.profileCompleted,
      userName: user?.name,
      userEmail: user?.email,
      userAddress: user?.address,
    })

    if (isAuthenticated && user) {
      const profileCompleted = user.profileCompleted
      
      // Check if profile is explicitly false or undefined
      if (profileCompleted === false || profileCompleted === undefined) {
        console.warn('[ProfileGuard] ⚠️ Profile incomplete! Redirecting to /profile/setup')
        console.warn('[ProfileGuard] 📊 User data:', {
          hasName: !!user.name,
          hasEmail: !!user.email,
          hasAddress: !!user.address,
          profileCompletedFlag: profileCompleted,
        })
        router.push('/profile/setup?message=Please complete your profile to continue')
      } else {
        console.log('[ProfileGuard] ✅ Profile is complete, allowing access')
      }
    }
  }, [isHydrated, isAuthenticated, user, router])

  // Show loading while hydrating
  if (!isHydrated) {
    return (
      <div className="min-h-screen bg-linear-to-br from-blue-50 via-white to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  // Don't render children until profile check is complete
  if (!isAuthenticated || !user) {
    console.log('[ProfileGuard] ⏳ Waiting for authentication...')
    return null
  }

  const profileCompleted = user.profileCompleted
  if (profileCompleted === false || profileCompleted === undefined) {
    console.log('[ProfileGuard] 🚫 Blocking render - profile incomplete')
    return null // Will redirect via useEffect
  }

  console.log('[ProfileGuard] ✅ Rendering protected content')
  return <>{children}</>
}
