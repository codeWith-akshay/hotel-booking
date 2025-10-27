'use client'

/**
 * Debug Page - Profile Status Check
 * Visit this page to see your current profile status and JWT token info
 */

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

export default function ProfileDebugPage() {
  const router = useRouter()
  const [tokenInfo, setTokenInfo] = useState<any>(null)
  const [userProfile, setUserProfile] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // Get JWT token from cookie
    const token = document.cookie
      .split('; ')
      .find(row => row.startsWith('auth-session='))
      ?.split('=')[1]

    if (token) {
      // Decode JWT (just the payload part)
      try {
        const parts = token.split('.')
        if (parts.length === 3 && parts[1]) {
          const base64Url = parts[1]
          const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/')
          const jsonPayload = decodeURIComponent(
            atob(base64)
              .split('')
              .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
              .join('')
          )
          setTokenInfo(JSON.parse(jsonPayload))
        } else {
          setError('Invalid JWT token format')
        }
      } catch (e) {
        setError('Failed to decode JWT token')
      }
    } else {
      setError('No JWT token found in cookies')
    }

    // Fetch user profile from API
    fetch('/api/user/profile')
      .then(r => r.json())
      .then(data => setUserProfile(data))
      .catch(e => setError('Failed to fetch user profile: ' + e.message))
  }, [])

  const testDashboardAccess = () => {
    console.log('🧪 Testing dashboard access...')
    router.push('/dashboard')
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6 text-gray-900 dark:text-white">
          🐛 Profile Debug Page
        </h1>

        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-6">
            <p className="text-red-800 dark:text-red-300">{error}</p>
          </div>
        )}

        {/* JWT Token Info */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
            JWT Token Payload
          </h2>
          {tokenInfo ? (
            <div className="space-y-2">
              <pre className="bg-gray-100 dark:bg-gray-900 p-4 rounded text-sm overflow-x-auto">
                {JSON.stringify(tokenInfo, null, 2)}
              </pre>
              <div className="mt-4 space-y-2">
                <p className="text-sm">
                  <span className="font-semibold">User ID:</span>{' '}
                  <code className="bg-gray-100 dark:bg-gray-900 px-2 py-1 rounded">{tokenInfo.userId}</code>
                </p>
                <p className="text-sm">
                  <span className="font-semibold">Phone:</span>{' '}
                  <code className="bg-gray-100 dark:bg-gray-900 px-2 py-1 rounded">{tokenInfo.phone}</code>
                </p>
                <p className="text-sm">
                  <span className="font-semibold">Role:</span>{' '}
                  <code className="bg-gray-100 dark:bg-gray-900 px-2 py-1 rounded">{tokenInfo.role}</code>
                </p>
                <p className="text-sm">
                  <span className="font-semibold">Profile Completed:</span>{' '}
                  <code className={`px-2 py-1 rounded ${
                    tokenInfo.profileCompleted 
                      ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-300' 
                      : 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-300'
                  }`}>
                    {tokenInfo.profileCompleted !== undefined 
                      ? (tokenInfo.profileCompleted ? 'true ✅' : 'false ❌')
                      : 'undefined ⚠️'
                    }
                  </code>
                </p>
              </div>
            </div>
          ) : (
            <p className="text-gray-500">Loading token info...</p>
          )}
        </div>

        {/* User Profile from API */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
            User Profile (from API)
          </h2>
          {userProfile ? (
            <pre className="bg-gray-100 dark:bg-gray-900 p-4 rounded text-sm overflow-x-auto">
              {JSON.stringify(userProfile, null, 2)}
            </pre>
          ) : (
            <p className="text-gray-500">Loading user profile...</p>
          )}
        </div>

        {/* Test Actions */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
            Test Actions
          </h2>
          <div className="space-y-3">
            <button
              onClick={testDashboardAccess}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-lg transition"
            >
              🧪 Test Dashboard Access
            </button>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Click to attempt accessing /dashboard. If profile is incomplete, you should be redirected to /profile/setup.
            </p>

            <button
              onClick={() => router.push('/profile/setup')}
              className="w-full bg-green-600 hover:bg-green-700 text-white font-medium py-3 px-4 rounded-lg transition"
            >
              📝 Go to Profile Setup
            </button>

            <button
              onClick={() => {
                fetch('/api/auth/logout', { method: 'POST' })
                  .then(() => router.push('/login'))
              }}
              className="w-full bg-red-600 hover:bg-red-700 text-white font-medium py-3 px-4 rounded-lg transition"
            >
              🚪 Logout
            </button>
          </div>
        </div>

        {/* Instructions */}
        <div className="mt-6 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <h3 className="font-semibold text-blue-900 dark:text-blue-300 mb-2">
            🔍 How to Debug:
          </h3>
          <ol className="list-decimal list-inside space-y-1 text-sm text-blue-800 dark:text-blue-300">
            <li>Check if <code>profileCompleted</code> field exists in JWT token</li>
            <li>Check if <code>profileCompleted</code> value is true or false</li>
            <li>Click "Test Dashboard Access" button</li>
            <li>Open browser console (F12) to see logs</li>
            <li>Open terminal to see middleware logs</li>
            <li>If redirected, middleware is working ✅</li>
            <li>If not redirected, check terminal for middleware logs</li>
          </ol>
        </div>
      </div>
    </div>
  )
}
