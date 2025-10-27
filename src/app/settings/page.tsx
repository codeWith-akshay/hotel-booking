// ==========================================
// SETTINGS PAGE
// ==========================================

'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Settings as SettingsIcon, User, Bell, Shield, Moon } from 'lucide-react'

export default function SettingsPage() {
  const router = useRouter()

  useEffect(() => {
    // Redirect to profile page for now
    // In production, this would check auth and show settings
    router.push('/profile')
  }, [router])

  return (
    <div className="min-h-screen bg-linear-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-2xl mx-auto text-center">
          <SettingsIcon className="h-16 w-16 mx-auto text-blue-600 mb-4" />
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">Settings</h1>
          <p className="text-gray-600 dark:text-gray-300 mb-8">
            Redirecting to your profile page...
          </p>
          <Link
            href="/profile"
            className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Go to Profile
          </Link>
        </div>
      </div>
    </div>
  )
}
