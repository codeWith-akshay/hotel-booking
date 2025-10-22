// ==========================================
// 403 FORBIDDEN PAGE
// ==========================================
// User-friendly error page for unauthorized access

'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { useAuthStore } from '@/store/auth.store'
import { getDefaultDashboard, type Role } from '@/lib/auth/route-protection'

// ==========================================
// 403 FORBIDDEN PAGE COMPONENT
// ==========================================

/**
 * 403 Forbidden Page
 * 
 * Shows when user tries to access a route they don't have permission for.
 * 
 * Features:
 * - User-friendly error message
 * - Shows what page they tried to access
 * - Displays current user role
 * - Provides navigation options
 * - Auto-redirect option
 */
export default function ForbiddenPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user, logout } = useAuthStore()
  
  // Get the page user tried to access
  const fromPath = searchParams.get('from') || 'this page'
  
  // Auto-redirect state
  const [countdown, setCountdown] = useState(10)
  const [autoRedirect, setAutoRedirect] = useState(true)

  // ==========================================
  // AUTO-REDIRECT COUNTDOWN
  // ==========================================
  useEffect(() => {
    if (!autoRedirect || countdown === 0) return

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer)
          handleGoBack()
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [autoRedirect, countdown])

  // ==========================================
  // NAVIGATION HANDLERS
  // ==========================================

  const handleGoBack = () => {
    if (user) {
      const dashboard = getDefaultDashboard(user.role as Role)
      router.push(dashboard)
    } else {
      router.push('/login')
    }
  }

  const handleLogout = () => {
    logout()
    router.push('/login')
  }

  const handleStopRedirect = () => {
    setAutoRedirect(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full">
        
        {/* ==========================================
            ERROR ICON & CODE
        ========================================== */}
        <div className="text-center mb-8">
          {/* Lock Icon */}
          <div className="inline-flex items-center justify-center w-20 h-20 bg-red-100 rounded-full mb-4">
            <svg
              className="w-10 h-10 text-red-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
              />
            </svg>
          </div>

          {/* Error Code */}
          <h1 className="text-6xl font-bold text-gray-900 mb-2">403</h1>
          <h2 className="text-2xl font-semibold text-gray-800 mb-2">
            Access Denied
          </h2>
        </div>

        {/* ==========================================
            ERROR MESSAGE
        ========================================== */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <p className="text-gray-600 text-center mb-4">
            You don't have permission to access{' '}
            <span className="font-semibold text-gray-900">{fromPath}</span>
          </p>

          {/* User Info */}
          {user && (
            <div className="bg-gray-50 rounded-md p-4 mb-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Logged in as</p>
                  <p className="font-medium text-gray-900">{user.name}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-500">Role</p>
                  <span className="inline-block px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                    {user.role}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Possible Reasons */}
          <div className="border-t border-gray-200 pt-4">
            <p className="text-sm font-medium text-gray-700 mb-2">
              Possible reasons:
            </p>
            <ul className="space-y-1 text-sm text-gray-600">
              <li className="flex items-start gap-2">
                <span className="text-red-500 mt-0.5">•</span>
                <span>This page is restricted to specific user roles</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-red-500 mt-0.5">•</span>
                <span>Your account doesn't have the required permissions</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-red-500 mt-0.5">•</span>
                <span>This feature is available to admins only</span>
              </li>
            </ul>
          </div>
        </div>

        {/* ==========================================
            AUTO-REDIRECT NOTICE
        ========================================== */}
        {autoRedirect && countdown > 0 && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 border-3 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
                <p className="text-sm text-blue-800">
                  Redirecting in <span className="font-bold">{countdown}</span> seconds...
                </p>
              </div>
              <button
                onClick={handleStopRedirect}
                className="text-xs text-blue-600 hover:text-blue-800 font-medium underline"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* ==========================================
            ACTION BUTTONS
        ========================================== */}
        <div className="space-y-3">
          {/* Go Back Button */}
          <button
            onClick={handleGoBack}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            {user ? 'Go to Dashboard' : 'Go to Login'}
          </button>

          {/* Secondary Actions */}
          <div className="grid grid-cols-2 gap-3">
            <Link
              href="/"
              className="text-center bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-2 px-4 rounded-lg transition-colors"
            >
              Home
            </Link>
            
            {user ? (
              <button
                onClick={handleLogout}
                className="bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-2 px-4 rounded-lg transition-colors"
              >
                Logout
              </button>
            ) : (
              <Link
                href="/login"
                className="text-center bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-2 px-4 rounded-lg transition-colors"
              >
                Login
              </Link>
            )}
          </div>
        </div>

        {/* ==========================================
            HELP LINK
        ========================================== */}
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">
            Need help?{' '}
            <Link
              href="/contact"
              className="text-blue-600 hover:text-blue-800 font-medium underline"
            >
              Contact Support
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
