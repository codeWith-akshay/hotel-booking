'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/auth.store'
import { Button } from '@/components/ui'
import { formatPhoneNumber } from '@/lib/utils'
import { ProfileCompletionGuard } from '@/components/guards/ProfileCompletionGuard'
import NotificationCard, { NotificationCardSkeleton, NotificationCardEmpty } from '@/components/notifications/NotificationCard'
import StatCard, { StatCardGrid } from '@/components/dashboard/StatCard'

// ==========================================
// MOCK NOTIFICATIONS
// ==========================================

const mockNotifications = [
  {
    id: '1',
    type: 'BROADCAST' as const,
    channel: 'IN_APP' as const,
    message: 'Complete your profile to start booking hotels and enjoy exclusive member benefits.',
    subject: 'Welcome to Your Dashboard',
    status: 'SENT' as const,
    scheduledAt: new Date(),
    sentAt: new Date(),
    createdAt: new Date(),
    errorMessage: null,
    metadata: null,
  },
  {
    id: '2',
    type: 'BOOKING_CONFIRMATION' as const,
    channel: 'IN_APP' as const,
    message: 'Your account is now fully set up! You can now make bookings and access all features.',
    subject: 'Profile Setup Complete',
    status: 'SENT' as const,
    scheduledAt: new Date(Date.now() - 1000 * 60 * 30), // 30 min ago
    sentAt: new Date(Date.now() - 1000 * 60 * 30),
    createdAt: new Date(Date.now() - 1000 * 60 * 30),
    errorMessage: null,
    metadata: null,
  },
]

// ==========================================
// MEMBER DASHBOARD PAGE
// ==========================================

export default function DashboardPage() {
  const router = useRouter()
  const { user, isAuthenticated, logout } = useAuthStore()
  const [isHydrated, setIsHydrated] = useState(false)

  // Wait for Zustand store to rehydrate from localStorage
  useEffect(() => {
    setIsHydrated(true)
  }, [])

  // ==========================================
  // REDIRECT IF NOT AUTHENTICATED
  // ==========================================

  useEffect(() => {
    // Only check auth after store has rehydrated
    if (isHydrated && (!isAuthenticated || !user)) {
      console.log('[Dashboard] Not authenticated, redirecting to login')
      router.push('/login')
    }
  }, [isHydrated, isAuthenticated, user, router])

  // ==========================================
  // HANDLERS
  // ==========================================

  const handleLogout = () => {
    // Clear auth state
    logout()

    // Clear server-side cookies
    fetch('/api/auth/logout', {
      method: 'POST',
      credentials: 'include',
    }).catch(console.error)

    // Redirect to login
    router.push('/login')
  }

  // ==========================================
  // LOADING STATE (WHILE HYDRATING)
  // ==========================================

  if (!isHydrated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  // ==========================================
  // EARLY RETURN IF NOT AUTHENTICATED
  // ==========================================

  if (!isAuthenticated || !user) {
    return null // Will redirect via useEffect
  }

  // ==========================================
  // RENDER WITH PROFILE CHECK
  // ==========================================

  return (
    <ProfileCompletionGuard>
      {/* Header with user info and logout */}
      <header className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-20">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
            
            {/* User Menu */}
            <div className="flex items-center gap-4">
              <div className="hidden sm:block text-right">
                <p className="text-sm font-medium text-gray-900">{user.name}</p>
                <p className="text-xs text-gray-500">
                  {formatPhoneNumber(user.phone)}
                </p>
              </div>
              <Button
                onClick={handleLogout}
                variant="outline"
                size="sm"
                leftIcon={
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                    />
                  </svg>
                }
              >
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Dashboard Content */}
      <div className="p-4 sm:p-6 lg:p-8">
        {/* Welcome Card */}
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h2 className="text-3xl font-bold text-gray-900 mb-2">
                Welcome back, {user.name}! 👋
              </h2>
              <p className="text-gray-600 mb-6">
                You're successfully authenticated and ready to book your next
                stay.
              </p>

              {/* Enhanced Stats with StatCard Component */}
            </div>
          </div>
          
          <StatCardGrid columns={4}>
            <StatCard
              label="Active Bookings"
              value={0}
              icon="📅"
              variant="primary"
              description="Current reservations"
            />
            <StatCard
              label="Completed Stays"
              value={0}
              icon="✅"
              variant="success"
              description="Total stays completed"
            />
            <StatCard
              label="Loyalty Points"
              value={0}
              icon="⭐"
              variant="warning"
              description="Earn more on bookings"
            />
            <StatCard
              label="Member Role"
              value={user.role}
              icon="👤"
              variant="info"
              description="Account tier"
            />
          </StatCardGrid>
        </div>

        {/* Notifications Section - NEW INTEGRATION */}
        <div className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">
            Recent Notifications
          </h2>
          <div className="space-y-3">
            {mockNotifications.length > 0 ? (
              mockNotifications.map((notification) => (
                <NotificationCard
                  key={notification.id}
                  notification={notification}
                  onMarkAsRead={(id: string) => console.log('Mark read:', id)}
                  onCancel={(id: string) => console.log('Cancel:', id)}
                  showActions={true}
                />
              ))
            ) : (
              <NotificationCardEmpty />
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* Search Hotels */}
          <div className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center shrink-0">
                <svg
                  className="w-6 h-6 text-blue-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Search Hotels
                </h3>
                <p className="text-sm text-gray-600 mb-4">
                  Find the perfect hotel for your next trip
                </p>
                <Button variant="primary" size="sm" disabled>
                  Coming Soon
                </Button>
              </div>
            </div>
          </div>

          {/* My Bookings */}
          <div className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center shrink-0">
                <svg
                  className="w-6 h-6 text-green-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                  />
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  My Bookings
                </h3>
                <p className="text-sm text-gray-600 mb-4">
                  View and manage your hotel reservations
                </p>
                <Button variant="primary" size="sm" disabled>
                  Coming Soon
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* User Info Card */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <h3 className="text-xl font-semibold text-gray-900 mb-4">
            Account Information
          </h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center py-3 border-b border-gray-100">
              <span className="text-sm font-medium text-gray-600">
                User ID
              </span>
              <span className="text-sm text-gray-900 font-mono">
                {user.id}
              </span>
            </div>
            <div className="flex justify-between items-center py-3 border-b border-gray-100">
              <span className="text-sm font-medium text-gray-600">Phone</span>
              <span className="text-sm text-gray-900">
                {formatPhoneNumber(user.phone)}
              </span>
            </div>
            <div className="flex justify-between items-center py-3 border-b border-gray-100">
              <span className="text-sm font-medium text-gray-600">Name</span>
              <span className="text-sm text-gray-900">{user.name}</span>
            </div>
            <div className="flex justify-between items-center py-3 border-b border-gray-100">
              <span className="text-sm font-medium text-gray-600">Email</span>
              <span className="text-sm text-gray-900">
                {user.email || 'Not set'}
              </span>
            </div>
            <div className="flex justify-between items-center py-3">
              <span className="text-sm font-medium text-gray-600">Role</span>
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                {user.role}
              </span>
            </div>
          </div>
        </div>
      </div>
    </ProfileCompletionGuard>
  )
}