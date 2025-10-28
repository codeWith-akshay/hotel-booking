'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/auth.store'
import { Button } from '@/components/ui'
import { formatPhoneNumber } from '@/lib/utils'
import { ProfileCompletionGuard } from '@/components/guards/ProfileCompletionGuard'
import NotificationCard, { NotificationCardSkeleton, NotificationCardEmpty } from '@/components/notifications/NotificationCard'
import StatCard, { StatCardGrid } from '@/components/dashboard/StatCard'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { 
  Calendar, CheckCircle, Star, User, Search, 
  Clock, TrendingUp, Award, Sparkles, ArrowRight,
  MapPin, CreditCard, Bell, Settings
} from 'lucide-react'

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
      <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-blue-50 via-purple-50 to-pink-50">
        <div className="text-center">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto" />
            <div className="absolute inset-0 w-16 h-16 border-4 border-transparent border-t-purple-600 rounded-full animate-ping mx-auto" />
          </div>
          <p className="mt-6 text-lg font-semibold text-gray-700">Loading your dashboard...</p>
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
      <div className="min-h-screen bg-linear-to-br from-blue-50 via-purple-50 to-pink-50 relative overflow-hidden">
        {/* Animated Background Blobs */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-400 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob" />
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-400 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000" />
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-pink-400 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000" />
        </div>

        {/* Header with user info and logout */}
        <header className="bg-white/80 backdrop-blur-lg border-b border-gray-200 shadow-lg sticky top-0 z-20">
          <div className="px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-20">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-linear-to-br from-blue-600 via-purple-600 to-pink-600 rounded-2xl shadow-lg">
                  <Sparkles className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl font-extrabold bg-linear-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                    Dashboard
                  </h1>
                  <p className="text-sm text-gray-600">Welcome to your control center</p>
                </div>
              </div>
              
              {/* User Menu */}
              <div className="flex items-center gap-4">
                <div className="hidden sm:block text-right">
                  <p className="text-sm font-bold text-gray-900">{user.name}</p>
                  <p className="text-xs text-gray-500">
                    {formatPhoneNumber(user.phone)}
                  </p>
                </div>
                <div className="h-12 w-12 rounded-full bg-linear-to-br from-blue-500 via-purple-500 to-pink-500 flex items-center justify-center text-white font-bold text-lg shadow-lg">
                  {user.name?.charAt(0).toUpperCase()}
                </div>
                <Button
                  onClick={handleLogout}
                  variant="outline"
                  size="sm"
                  className="hover:bg-red-50 hover:border-red-400 hover:text-red-600 transition-all duration-200"
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
        <div className="p-4 sm:p-6 lg:p-8 relative z-10">
          {/* Welcome Card - Enhanced */}
          <Card className="border-0 shadow-2xl rounded-3xl overflow-hidden backdrop-blur-sm bg-white/90 mb-8 relative">
            <div className="absolute top-0 right-0 w-64 h-64 bg-linear-to-br from-blue-200 via-purple-200 to-pink-200 rounded-full filter blur-3xl opacity-30 -mr-32 -mt-32" />
            <CardContent className="p-8 relative z-10">
              <div className="flex items-start justify-between mb-6">
                <div className="flex-1">
                  <h2 className="text-4xl font-extrabold text-gray-900 mb-2 flex items-center gap-3">
                    Welcome back, {user.name}! 
                    <span className="text-4xl">👋</span>
                  </h2>
                  <p className="text-lg text-gray-600">
                    You're successfully authenticated and ready to book your next stay.
                  </p>
                </div>
              </div>

              {/* Enhanced Stats Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-8">
                {/* Active Bookings */}
                <div className="group relative">
                  <div className="absolute inset-0 bg-linear-to-br from-blue-500 to-blue-600 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  <div className="relative bg-white rounded-2xl p-6 shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 border-2 border-blue-100">
                    <div className="flex items-center justify-between mb-4">
                      <div className="p-3 bg-blue-100 rounded-xl group-hover:bg-blue-500 transition-colors duration-300">
                        <Calendar className="h-6 w-6 text-blue-600 group-hover:text-white transition-colors duration-300" />
                      </div>
                      <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-3 py-1 rounded-full">Active</span>
                    </div>
                    <p className="text-sm font-medium text-gray-600 mb-1">Active Bookings</p>
                    <p className="text-4xl font-extrabold text-gray-900">0</p>
                    <p className="text-xs text-gray-500 mt-2">Current reservations</p>
                  </div>
                </div>

                {/* Completed Stays */}
                <div className="group relative">
                  <div className="absolute inset-0 bg-linear-to-br from-green-500 to-emerald-600 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  <div className="relative bg-white rounded-2xl p-6 shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 border-2 border-green-100">
                    <div className="flex items-center justify-between mb-4">
                      <div className="p-3 bg-green-100 rounded-xl group-hover:bg-green-500 transition-colors duration-300">
                        <CheckCircle className="h-6 w-6 text-green-600 group-hover:text-white transition-colors duration-300" />
                      </div>
                      <span className="text-xs font-semibold text-green-600 bg-green-50 px-3 py-1 rounded-full">Complete</span>
                    </div>
                    <p className="text-sm font-medium text-gray-600 mb-1">Completed Stays</p>
                    <p className="text-4xl font-extrabold text-gray-900">0</p>
                    <p className="text-xs text-gray-500 mt-2">Total stays completed</p>
                  </div>
                </div>

                {/* Loyalty Points */}
                <div className="group relative">
                  <div className="absolute inset-0 bg-linear-to-br from-yellow-500 to-orange-600 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  <div className="relative bg-white rounded-2xl p-6 shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 border-2 border-yellow-100">
                    <div className="flex items-center justify-between mb-4">
                      <div className="p-3 bg-yellow-100 rounded-xl group-hover:bg-yellow-500 transition-colors duration-300">
                        <Star className="h-6 w-6 text-yellow-600 group-hover:text-white transition-colors duration-300" />
                      </div>
                      <span className="text-xs font-semibold text-yellow-600 bg-yellow-50 px-3 py-1 rounded-full">Rewards</span>
                    </div>
                    <p className="text-sm font-medium text-gray-600 mb-1">Loyalty Points</p>
                    <p className="text-4xl font-extrabold text-gray-900">0</p>
                    <p className="text-xs text-gray-500 mt-2">Earn more on bookings</p>
                  </div>
                </div>

                {/* Member Role */}
                <div className="group relative">
                  <div className="absolute inset-0 bg-linear-to-br from-purple-500 to-pink-600 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  <div className="relative bg-white rounded-2xl p-6 shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 border-2 border-purple-100">
                    <div className="flex items-center justify-between mb-4">
                      <div className="p-3 bg-purple-100 rounded-xl group-hover:bg-purple-500 transition-colors duration-300">
                        <Award className="h-6 w-6 text-purple-600 group-hover:text-white transition-colors duration-300" />
                      </div>
                      <span className="text-xs font-semibold text-purple-600 bg-purple-50 px-3 py-1 rounded-full">Tier</span>
                    </div>
                    <p className="text-sm font-medium text-gray-600 mb-1">Member Role</p>
                    <p className="text-2xl font-extrabold text-gray-900">{user.role}</p>
                    <p className="text-xs text-gray-500 mt-2">Account tier</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Notifications Section - Enhanced */}
          <Card className="border-0 shadow-2xl rounded-3xl overflow-hidden backdrop-blur-sm bg-white/90 mb-8">
            <CardHeader className="bg-linear-to-r from-blue-50 via-purple-50 to-pink-50 border-b-2 border-gray-100">
              <div className="flex items-center justify-between">
                <CardTitle className="text-2xl font-extrabold text-gray-900 flex items-center gap-3">
                  <div className="p-3 bg-blue-600 rounded-2xl shadow-lg">
                    <Bell className="h-6 w-6 text-white" />
                  </div>
                  Recent Notifications
                </CardTitle>
                <span className="text-sm font-semibold text-blue-600 bg-blue-100 px-4 py-2 rounded-full">
                  {mockNotifications.length} new
                </span>
              </div>
            </CardHeader>
            <CardContent className="p-6">
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
            </CardContent>
          </Card>

          {/* Quick Actions - Enhanced */}
          <div className="mb-8">
            <h2 className="text-2xl font-extrabold text-gray-900 mb-6 flex items-center gap-3">
              <TrendingUp className="h-7 w-7 text-blue-600" />
              Quick Actions
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Search Hotels - ACTIVE */}
              <Card 
                className="border-0 shadow-xl rounded-3xl overflow-hidden backdrop-blur-sm bg-white/90 hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 group cursor-pointer relative"
                onClick={() => router.push('/rooms')}
              >
                {/* Shimmer Effect */}
                <div className="absolute inset-0 bg-linear-to-r from-transparent via-white to-transparent opacity-0 group-hover:opacity-30 group-hover:animate-shimmer" />
                
                <CardContent className="p-6 relative z-10">
                  <div className="flex items-start gap-4">
                    <div className="p-4 bg-linear-to-br from-blue-500 to-blue-600 rounded-2xl shadow-lg group-hover:scale-110 group-hover:rotate-3 transition-all duration-300">
                      <Search className="h-7 w-7 text-white" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="text-lg font-bold text-gray-900">
                          Search Hotels
                        </h3>
                        <span className="px-2 py-1 text-xs font-bold bg-blue-100 text-blue-700 rounded-full animate-pulse">
                          Active
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mb-4">
                        Find the perfect hotel for your next trip
                      </p>
                      
                      {/* Quick Stats */}
                      <div className="flex items-center gap-4 mb-4 text-xs">
                        <div className="flex items-center gap-1">
                          <MapPin className="h-3 w-3 text-blue-500" />
                          <span className="text-gray-600 font-medium">Multiple Locations</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Star className="h-3 w-3 text-yellow-500 fill-yellow-500" />
                          <span className="text-gray-600 font-medium">Best Rates</span>
                        </div>
                      </div>
                      
                      <Button 
                        variant="primary" 
                        size="sm" 
                        className="bg-linear-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 shadow-lg hover:shadow-xl transition-all duration-200 group/btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          router.push('/rooms');
                        }}
                      >
                        Browse Rooms
                        <ArrowRight className="ml-2 h-4 w-4 group-hover/btn:translate-x-1 transition-transform" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* My Bookings - ACTIVE */}
              <Card 
                className="border-0 shadow-xl rounded-3xl overflow-hidden backdrop-blur-sm bg-white/90 hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 group cursor-pointer relative"
                onClick={() => router.push('/bookings')}
              >
                {/* Shimmer Effect */}
                <div className="absolute inset-0 bg-linear-to-r from-transparent via-white to-transparent opacity-0 group-hover:opacity-30 group-hover:animate-shimmer" />
                
                <CardContent className="p-6 relative z-10">
                  <div className="flex items-start gap-4">
                    <div className="p-4 bg-linear-to-br from-green-500 to-emerald-600 rounded-2xl shadow-lg group-hover:scale-110 group-hover:rotate-3 transition-all duration-300">
                      <Calendar className="h-7 w-7 text-white" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="text-lg font-bold text-gray-900">
                          My Bookings
                        </h3>
                        <span className="px-2 py-1 text-xs font-bold bg-green-100 text-green-700 rounded-full animate-pulse">
                          Active
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mb-4">
                        View and manage your hotel reservations
                      </p>
                      
                      {/* Stats Preview */}
                      <div className="flex items-center gap-4 mb-4 text-xs">
                        <div className="flex items-center gap-1">
                          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                          <span className="text-gray-600 font-medium">0 Active</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <div className="w-2 h-2 bg-blue-500 rounded-full" />
                          <span className="text-gray-600 font-medium">0 Total</span>
                        </div>
                      </div>
                      
                      <Button 
                        variant="primary" 
                        size="sm" 
                        className="bg-linear-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 shadow-lg hover:shadow-xl transition-all duration-200 group/btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          router.push('/bookings');
                        }}
                      >
                        View Bookings
                        <ArrowRight className="ml-2 h-4 w-4 group-hover/btn:translate-x-1 transition-transform" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Payment Methods - ACTIVE */}
              <Card 
                className="border-0 shadow-xl rounded-3xl overflow-hidden backdrop-blur-sm bg-white/90 hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 group cursor-pointer relative"
                onClick={() => router.push('/profile?tab=payment')}
              >
                {/* Shimmer Effect */}
                <div className="absolute inset-0 bg-linear-to-r from-transparent via-white to-transparent opacity-0 group-hover:opacity-30 group-hover:animate-shimmer" />
                
                <CardContent className="p-6 relative z-10">
                  <div className="flex items-start gap-4">
                    <div className="p-4 bg-linear-to-br from-purple-500 to-pink-600 rounded-2xl shadow-lg group-hover:scale-110 group-hover:rotate-3 transition-all duration-300">
                      <CreditCard className="h-7 w-7 text-white" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="text-lg font-bold text-gray-900">
                          Payment Methods
                        </h3>
                        <span className="px-2 py-1 text-xs font-bold bg-purple-100 text-purple-700 rounded-full animate-pulse">
                          Active
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mb-4">
                        Manage your payment cards and options
                      </p>
                      
                      {/* Stats Preview */}
                      <div className="flex items-center gap-4 mb-4 text-xs">
                        <div className="flex items-center gap-1">
                          <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse" />
                          <span className="text-gray-600 font-medium">0 Cards</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <div className="w-2 h-2 bg-green-500 rounded-full" />
                          <span className="text-gray-600 font-medium">Secure</span>
                        </div>
                      </div>
                      
                      <Button 
                        variant="primary" 
                        size="sm" 
                        className="bg-linear-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 shadow-lg hover:shadow-xl transition-all duration-200 group/btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          router.push('/profile?tab=payment');
                        }}
                      >
                        Manage Payments
                        <ArrowRight className="ml-2 h-4 w-4 group-hover/btn:translate-x-1 transition-transform" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* User Info Card - Enhanced */}
          <Card className="border-0 shadow-2xl rounded-3xl overflow-hidden backdrop-blur-sm bg-white/90">
            <CardHeader className="bg-linear-to-r from-indigo-50 via-purple-50 to-pink-50 border-b-2 border-gray-100">
              <div className="flex items-center justify-between">
                <CardTitle className="text-2xl font-extrabold text-gray-900 flex items-center gap-3">
                  <div className="p-3 bg-purple-600 rounded-2xl shadow-lg">
                    <User className="h-6 w-6 text-white" />
                  </div>
                  Account Information
                </CardTitle>
                <Button 
                  variant="outline" 
                  size="sm"
                  className="hover:bg-purple-50 hover:border-purple-400 transition-all duration-200"
                >
                  <Settings className="h-4 w-4 mr-2" />
                  Edit Profile
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between py-4 border-b border-gray-100 hover:bg-gray-50 px-4 rounded-xl transition-colors duration-200">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <User className="h-5 w-5 text-blue-600" />
                    </div>
                    <span className="text-sm font-semibold text-gray-600">User ID</span>
                  </div>
                  <span className="text-sm text-gray-900 font-mono bg-gray-100 px-3 py-1 rounded-lg">
                    {user.id.slice(0, 8)}...
                  </span>
                </div>
                <div className="flex items-center justify-between py-4 border-b border-gray-100 hover:bg-gray-50 px-4 rounded-xl transition-colors duration-200">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-green-100 rounded-lg">
                      <svg className="h-5 w-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                      </svg>
                    </div>
                    <span className="text-sm font-semibold text-gray-600">Phone</span>
                  </div>
                  <span className="text-sm font-bold text-gray-900">
                    {formatPhoneNumber(user.phone)}
                  </span>
                </div>
                <div className="flex items-center justify-between py-4 border-b border-gray-100 hover:bg-gray-50 px-4 rounded-xl transition-colors duration-200">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-purple-100 rounded-lg">
                      <User className="h-5 w-5 text-purple-600" />
                    </div>
                    <span className="text-sm font-semibold text-gray-600">Name</span>
                  </div>
                  <span className="text-sm font-bold text-gray-900">{user.name}</span>
                </div>
                <div className="flex items-center justify-between py-4 border-b border-gray-100 hover:bg-gray-50 px-4 rounded-xl transition-colors duration-200">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-yellow-100 rounded-lg">
                      <svg className="h-5 w-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <span className="text-sm font-semibold text-gray-600">Email</span>
                  </div>
                  <span className="text-sm font-bold text-gray-900">
                    {user.email || 'Not set'}
                  </span>
                </div>
                <div className="flex items-center justify-between py-4 hover:bg-gray-50 px-4 rounded-xl transition-colors duration-200">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-pink-100 rounded-lg">
                      <Award className="h-5 w-5 text-pink-600" />
                    </div>
                    <span className="text-sm font-semibold text-gray-600">Role</span>
                  </div>
                  <span className="inline-flex items-center px-4 py-2 rounded-full text-sm font-bold bg-linear-to-r from-blue-500 to-purple-600 text-white shadow-lg">
                    {user.role}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </ProfileCompletionGuard>
  )
}