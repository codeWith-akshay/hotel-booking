/**
 * Example: Profile Completion Check in Client Component
 * 
 * This shows how to use profile check utilities in your components
 */

'use client'

import { useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useSessionStore } from '@/store/sessionStore'
import {
  isProfileCompletedFromToken,
  requiresProfileCompletion,
  getProfileSetupUrl,
  getMissingProfileFields,
} from '@/lib/auth/profile-check'

export default function ExampleProtectedComponent() {
  const router = useRouter()
  const pathname = usePathname()
  const { user, isAuthenticated } = useSessionStore()

  useEffect(() => {
    // Check if user is authenticated
    if (!isAuthenticated || !user) {
      router.push('/login')
      return
    }

    // Check if current route requires profile completion
    if (requiresProfileCompletion(pathname)) {
      // Check if user has completed profile
      const profileComplete = isProfileCompletedFromToken(user)

      if (!profileComplete) {
        // Get missing fields for logging/display
        const missingFields = getMissingProfileFields({
          name: user.name,
          email: user.email,
          address: (user as any).address,
        })

        console.warn('Profile incomplete. Missing:', missingFields)

        // Redirect to profile setup with return URL
        const setupUrl = getProfileSetupUrl(pathname)
        router.push(setupUrl)
      }
    }
  }, [isAuthenticated, user, pathname, router])

  if (!isAuthenticated || !user) {
    return <div>Loading...</div>
  }

  return (
    <div>
      <h1>Protected Content</h1>
      <p>Welcome, {user.name}!</p>
      <p>Profile Status: {isProfileCompletedFromToken(user) ? '✅ Complete' : '⚠️ Incomplete'}</p>
    </div>
  )
}
