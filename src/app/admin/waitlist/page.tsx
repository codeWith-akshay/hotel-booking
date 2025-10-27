// ==========================================
// ADMIN WAITLIST PAGE
// ==========================================
// Admin interface for managing waitlist entries

'use client'

import { useEffect, useState } from 'react'
import { WaitlistManagement } from '@/components/waitlist'
import AdminLayout from '@/components/layout/AdminLayout'
import { Card, CardContent } from '@/components/ui/card'
import { Clock, TrendingUp, Users, Bell, CheckCircle, XCircle, Hourglass, Percent, Send } from 'lucide-react'
import ProtectedRoute from '@/components/auth/ProtectedRoute'
import { getWaitlistStats } from '@/actions/waitlist/waitlist.action'
import type { WaitlistStats } from '@/lib/validation/waitlist.validation'

function AdminWaitlistContent() {
  const [stats, setStats] = useState<WaitlistStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const result = await getWaitlistStats()
        if (result.success && result.data) {
          setStats(result.data)
        }
      } catch (error) {
        console.error('Failed to fetch waitlist stats:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
  }, [])

  // Get notified today count (approximation - notified entries updated today)
  const notifiedToday = stats ? Math.floor(stats.notified * 0.3) : 0 // Rough estimate
  
  // Get conversions this month (approximation)
  const conversionsThisMonth = stats ? Math.floor(stats.converted * 0.15) : 0 // Rough estimate

  return (
    <AdminLayout
      title="Waitlist Management"
      subtitle="Manage guest waitlist entries and room availability notifications"
    >
      <div className="space-y-6">
        {/* Quick Stats Preview */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Pending Entries */}
          <Card className="hover:shadow-lg transition-shadow duration-200 border-l-4 border-l-yellow-500">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Pending Entries</p>
                  {loading ? (
                    <div className="h-8 w-16 bg-gray-200 dark:bg-gray-700 animate-pulse rounded mt-1"></div>
                  ) : (
                    <p className="text-3xl font-bold text-yellow-600 dark:text-yellow-500 mt-1">
                      {stats?.pending || 0}
                    </p>
                  )}
                </div>
                <div className="ml-4">
                  <div className="p-3 bg-yellow-100 dark:bg-yellow-900/30 rounded-full">
                    <Clock className="w-6 h-6 text-yellow-600 dark:text-yellow-500" />
                  </div>
                </div>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-3 flex items-center gap-1">
                <Hourglass className="w-3 h-3" />
                Waiting for rooms
              </p>
            </CardContent>
          </Card>
          
          {/* Notified Entries */}
          <Card className="hover:shadow-lg transition-shadow duration-200 border-l-4 border-l-blue-500">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Notified</p>
                  {loading ? (
                    <div className="h-8 w-16 bg-gray-200 dark:bg-gray-700 animate-pulse rounded mt-1"></div>
                  ) : (
                    <p className="text-3xl font-bold text-blue-600 dark:text-blue-500 mt-1">
                      {stats?.notified || 0}
                    </p>
                  )}
                </div>
                <div className="ml-4">
                  <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-full">
                    <Bell className="w-6 h-6 text-blue-600 dark:text-blue-500" />
                  </div>
                </div>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-3 flex items-center gap-1">
                <Send className="w-3 h-3" />
                Awaiting response
              </p>
            </CardContent>
          </Card>
          
          {/* Conversions */}
          <Card className="hover:shadow-lg transition-shadow duration-200 border-l-4 border-l-green-500">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Converted</p>
                  {loading ? (
                    <div className="h-8 w-16 bg-gray-200 dark:bg-gray-700 animate-pulse rounded mt-1"></div>
                  ) : (
                    <p className="text-3xl font-bold text-green-600 dark:text-green-500 mt-1">
                      {stats?.converted || 0}
                    </p>
                  )}
                </div>
                <div className="ml-4">
                  <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-full">
                    <CheckCircle className="w-6 h-6 text-green-600 dark:text-green-500" />
                  </div>
                </div>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-3 flex items-center gap-1">
                <TrendingUp className="w-3 h-3" />
                {stats?.conversionRate?.toFixed(1) || '0'}% conversion rate
              </p>
            </CardContent>
          </Card>
          
          {/* Total Entries */}
          <Card className="hover:shadow-lg transition-shadow duration-200 border-l-4 border-l-purple-500">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Entries</p>
                  {loading ? (
                    <div className="h-8 w-16 bg-gray-200 dark:bg-gray-700 animate-pulse rounded mt-1"></div>
                  ) : (
                    <p className="text-3xl font-bold text-purple-600 dark:text-purple-500 mt-1">
                      {stats?.total || 0}
                    </p>
                  )}
                </div>
                <div className="ml-4">
                  <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-full">
                    <Users className="w-6 h-6 text-purple-600 dark:text-purple-500" />
                  </div>
                </div>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-3 flex items-center gap-1">
                <Clock className="w-3 h-3" />
                Avg wait: {stats?.avgWaitTime?.toFixed(1) || '0'} days
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Additional Stats Row */}
        {!loading && stats && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Expired Entries */}
            <Card className="border-l-4 border-l-red-500">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Expired</p>
                    <p className="text-2xl font-bold text-red-600 dark:text-red-500 mt-1">
                      {stats.expired || 0}
                    </p>
                  </div>
                  <XCircle className="w-8 h-8 text-red-600 dark:text-red-500 opacity-50" />
                </div>
              </CardContent>
            </Card>

            {/* Conversion Rate */}
            <Card className="border-l-4 border-l-indigo-500">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Conversion Rate</p>
                    <p className="text-2xl font-bold text-indigo-600 dark:text-indigo-500 mt-1">
                      {stats.conversionRate?.toFixed(1) || '0'}%
                    </p>
                  </div>
                  <Percent className="w-8 h-8 text-indigo-600 dark:text-indigo-500 opacity-50" />
                </div>
              </CardContent>
            </Card>

            {/* Average Wait Time */}
            <Card className="border-l-4 border-l-orange-500">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Avg Wait Time</p>
                    <p className="text-2xl font-bold text-orange-600 dark:text-orange-500 mt-1">
                      {stats.avgWaitTime?.toFixed(1) || '0'}d
                    </p>
                  </div>
                  <Hourglass className="w-8 h-8 text-orange-600 dark:text-orange-500 opacity-50" />
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Waitlist Management Component */}
        <WaitlistManagement userRole={'ADMIN'} />
      </div>
    </AdminLayout>
  );
}

export default function AdminWaitlistPage() {
  return (
    <ProtectedRoute allowedRoles={['ADMIN', 'SUPERADMIN']}>
      <AdminWaitlistContent />
    </ProtectedRoute>
  );
}
