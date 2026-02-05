'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/auth.store'
import { Button } from '@/components/ui'
import { formatPhoneNumber as _formatPhoneNumber } from '@/lib/utils'
import { ProfileCompletionGuard } from '@/components/guards/ProfileCompletionGuard'
import NotificationCard, { NotificationCardEmpty } from '@/components/notifications/NotificationCard'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Calendar,
  Search,
  TrendingUp,
  Sparkles,
  Bell,
  Settings,
  User,
  LogOut,
} from 'lucide-react'

// ==========================================
// SAFE HELPERS
// ==========================================
const safePhone = (phone?: string) =>
  phone ? _formatPhoneNumber(phone) : '--'

const safeUserId = (id?: string) =>
  id ? `${id.slice(0, 8)}...` : '--'

const safeInitial = (name?: string) =>
  name?.charAt(0)?.toUpperCase() ?? 'U'

// ==========================================
// MOCK NOTIFICATIONS
// ==========================================
const mockNotifications = [
  {
    id: '1',
    type: 'BROADCAST' as const,
    channel: 'IN_APP' as const,
    message: 'Complete your profile to unlock hotel booking features.',
    subject: 'Welcome 🎉',
    status: 'SENT' as const,
    scheduledAt: new Date(),
    sentAt: new Date(),
    createdAt: new Date(),
    errorMessage: null,
    metadata: null,
  },
]

// ==========================================
// DASHBOARD PAGE
// ==========================================
export default function DashboardPage() {
  const router = useRouter()
  const { user, isAuthenticated, logout } = useAuthStore()
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => setHydrated(true), [])

  useEffect(() => {
    if (hydrated && (!isAuthenticated || !user)) {
      router.push('/login')
    }
  }, [hydrated, isAuthenticated, user, router])

  const handleLogout = () => {
    logout()
    fetch('/api/auth/logout', { method: 'POST', credentials: 'include' }).catch(console.error)
    router.push('/login')
  }

  if (!hydrated || !isAuthenticated || !user) return null

  return (
    <ProfileCompletionGuard>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">

       

        {/* ================= CONTENT ================= */}
        <div className="max-w-7xl mx-auto px-6 py-10 space-y-10">

          {/* WELCOME CARD */}
          <Card className="rounded-3xl shadow-xl bg-white/90 backdrop-blur">
            <CardContent className="p-8">
              <h2 className="text-4xl font-extrabold text-gray-900 mb-2">
                Welcome, {user.name ?? 'User'} 🚀
              </h2>
              <p className="text-gray-600 text-lg">
                Your account is active and ready to explore hotels.
              </p>
            </CardContent>
          </Card>

          {/* NOTIFICATIONS */}
          <Card className="rounded-3xl shadow-xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-xl">
                <Bell className="h-5 w-5 text-blue-600" />
                Notifications
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {mockNotifications.length ? (
                mockNotifications.map((n) => (
                  <NotificationCard key={n.id} notification={n} showActions={false} />
                ))
              ) : (
                <NotificationCardEmpty />
              )}
            </CardContent>
          </Card>

          {/* QUICK ACTIONS */}
          <div>
            <h2 className="text-2xl font-extrabold mb-6 flex items-center gap-2">
              <TrendingUp className="h-6 w-6 text-purple-600" />
              Quick Actions
            </h2>

            <div className="grid md:grid-cols-3 gap-6">
              {[
                { label: 'Search Hotels', icon: <Search />, path: '/rooms' },
                { label: 'My Bookings', icon: <Calendar />, path: '/bookings' },
                { label: 'Profile Settings', icon: <Settings />, path: '/profile' },
              ].map((item) => (
                <Card
                  key={item.label}
                  onClick={() => router.push(item.path)}
                  className="cursor-pointer rounded-3xl shadow-lg hover:shadow-2xl hover:-translate-y-1 transition-all"
                >
                  <CardContent className="p-6 flex items-center gap-4">
                    <div className="p-4 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 text-white shadow-lg">
                      {item.icon}
                    </div>
                    <p className="text-lg font-bold text-gray-900">{item.label}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* ACCOUNT INFO */}
          <Card className="rounded-3xl shadow-xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-xl">
                <User className="h-5 w-5 text-purple-600" />
                Account Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {[
                ['User ID', safeUserId(user.id)],
                ['Phone', safePhone(user.phone)],
                ['Name', user.name ?? 'User'],
                ['Email', user.email ?? 'Not set'],
                ['Role', user.role],
              ].map(([label, value]) => (
                <div
                  key={label}
                  className="flex justify-between items-center bg-gray-50 px-5 py-3 rounded-xl"
                >
                  <span className="text-sm font-semibold text-gray-600">{label}</span>
                  <span className="font-bold text-gray-900">{value}</span>
                </div>
              ))}
            </CardContent>
          </Card>

        </div>
      </div>
    </ProfileCompletionGuard>
  )
}
