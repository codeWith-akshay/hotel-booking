// ==========================================
// SUPERADMIN DASHBOARD PAGE
// ==========================================
// Super Admin role dashboard with real-time system statistics
// Features: Protected route, system-wide management, advanced analytics, user management

'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import ProtectedRoute from '@/components/auth/ProtectedRoute'
import Layout from '@/components/layout/Layout'
import Header from '@/components/layout/Header'
import { useAuthStore } from '@/store/auth.store'
import StatCard, { StatCardGrid } from '@/components/dashboard/StatCard'
import DataTable, { type Column, Badge } from '@/components/dashboard/DataTable'
import {
  getSystemStats,
  getSystemUsers,
  getSystemHealth,
  type SystemStats,
  type SystemUser,
  type SystemHealth,
} from '@/actions/superadmin/dashboard.action'
import { RoleName } from '@prisma/client'

// ==========================================
// INITIAL STATE
// ==========================================

const initialStats: SystemStats = {
  totalUsers: 0,
  totalAdmins: 0,
  totalMembers: 0,
  activeUsers: 0,
  totalBookings: 0,
  totalRevenue: 0,
  totalRoomTypes: 0,
  totalRooms: 0,
}

const initialHealth: SystemHealth = {
  databaseStatus: 'HEALTHY',
  totalBookings: 0,
  totalUsers: 0,
  totalRoomTypes: 0,
  recentErrors: 0,
}

// ==========================================
// BADGE HELPERS
// ==========================================

function getRoleBadge(role: RoleName) {
  switch (role) {
    case RoleName.SUPERADMIN:
      return <Badge variant="danger">SuperAdmin</Badge>
    case RoleName.ADMIN:
      return <Badge variant="info">Admin</Badge>
    case RoleName.MEMBER:
      return <Badge variant="default">Member</Badge>
    default:
      return <Badge>{role}</Badge>
  }
}

function getHealthBadge(status: SystemHealth['databaseStatus']) {
  switch (status) {
    case 'HEALTHY':
      return <Badge variant="success">Healthy</Badge>
    case 'WARNING':
      return <Badge variant="warning">Warning</Badge>
    case 'CRITICAL':
      return <Badge variant="danger">Critical</Badge>
    default:
      return <Badge>{status}</Badge>
  }
}

// ==========================================
// TABLE COLUMNS
// ==========================================

const columns: Column<SystemUser>[] = [
  {
    key: 'name',
    label: 'Name',
    render: (user) => user.name || 'N/A',
  },
  {
    key: 'email',
    label: 'Email',
    render: (user) => user.email,
  },
  {
    key: 'role',
    label: 'Role',
    render: (user) => getRoleBadge(user.role),
  },
  {
    key: 'totalBookings',
    label: 'Bookings',
    render: (user) => user.totalBookings.toString(),
  },
  {
    key: 'totalSpent',
    label: 'Total Spent',
    render: (user) => `$${(user.totalSpent / 100).toFixed(2)}`,
  },
  {
    key: 'createdAt',
    label: 'Member Since',
    render: (user) => new Date(user.createdAt).toLocaleDateString(),
  },
]

// ==========================================
// MAIN COMPONENT
// ==========================================

function SuperAdminDashboardContent() {
  const router = useRouter()
  const user = useAuthStore((state) => state.user)
  const logout = useAuthStore((state) => state.logout)
  const [stats, setStats] = useState<SystemStats>(initialStats)
  const [users, setUsers] = useState<SystemUser[]>([])
  const [health, setHealth] = useState<SystemHealth>(initialHealth)
  const [filter, setFilter] = useState<'all' | RoleName>('all')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Fetch all dashboard data
  useEffect(() => {
    async function fetchDashboardData() {
      try {
        setLoading(true)
        setError(null)

        const [
          statsData,
          usersData,
          healthData,
        ] = await Promise.all([
          getSystemStats(),
          getSystemUsers(),
          getSystemHealth(),
        ])

        if (statsData.success && statsData.data) setStats(statsData.data)
        if (usersData.success && usersData.data) setUsers(usersData.data)
        if (healthData.success && healthData.data) setHealth(healthData.data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load dashboard data')
        console.error('Dashboard data fetch error:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchDashboardData()
  }, [])

  // Filter users based on role
  const filteredUsers = filter === 'all' ? users : users.filter(u => u.role === filter)

  // Handle user row click
  const handleUserClick = (user: SystemUser) => {
    console.log('Selected user:', user)
    // TODO: Open user management modal
  }

  const handleLogout = () => {
    logout()
    window.location.href = '/login'
  }

  return (
    <>
      {/* Header at the top */}
      <Header
        user={{
          name: user?.name || 'SuperAdmin',
          email: user?.email || user?.phone || '',
          role: user?.role || 'SUPERADMIN',
        }}
        onLogout={handleLogout}
        showNotifications={true}
        notificationsCount={0}
        onNotificationClick={() => router.push('/superadmin/notifications')}
        showSidebarToggle={false}
      />
      
      <Layout
        user={{
          name: user?.name || 'SuperAdmin',
          email: user?.email || user?.phone || '',
          role: user?.role || 'SUPERADMIN',
        }}
        onLogout={handleLogout}
        config={{ showHeader: false }}
      >
        <div className="space-y-6 p-6">
          {/* Dashboard Title */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                SuperAdmin Dashboard
              </h1>
              <p className="text-gray-600 mt-1">
                System-wide management and advanced analytics
              </p>
            </div>
            <div className="mt-4 md:mt-0 flex gap-2">
              <button 
                onClick={() => router.push('/superadmin/system')}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                🔧 System Settings
              </button>
              <button className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors">
                🚨 Emergency Controls
              </button>
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-blue-800 font-medium">Loading dashboard data...</p>
          </div>
        )}

        {/* Error State */}
        {error && !loading && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <div className="flex items-center gap-2 text-red-800 font-medium mb-2">
              <span>⚠️</span>
              <span>Error Loading Data</span>
            </div>
            <p className="text-red-700">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              Retry
            </button>
          </div>
        )}

        {/* Main Content */}
        {!loading && !error && (
          <>
            {/* System Health */}
            <section className="bg-linear-to-br from-green-50 to-emerald-50 rounded-lg border border-green-200 p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                System Health
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white rounded-lg p-4">
                  <p className="text-sm text-gray-600 mb-1">Database</p>
                  {getHealthBadge(health.databaseStatus)}
                </div>
                <div className="bg-white rounded-lg p-4">
                  <p className="text-sm text-gray-600 mb-1">Total Users</p>
                  <p className="text-xl font-bold text-gray-900">
                    {health.totalUsers}
                  </p>
                </div>
                <div className="bg-white rounded-lg p-4">
                  <p className="text-sm text-gray-600 mb-1">Total Bookings</p>
                  <p className="text-xl font-bold text-gray-900">
                    {health.totalBookings}
                  </p>
                </div>
                <div className="bg-white rounded-lg p-4">
                  <p className="text-sm text-gray-600 mb-1">Recent Errors</p>
                  <p className="text-xl font-bold text-gray-900">
                    {health.recentErrors}
                  </p>
                </div>
              </div>
            </section>

            {/* System Statistics */}
            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                System Overview
              </h2>
              <StatCardGrid columns={4}>
                <StatCard
                  label="Total Users"
                  value={stats.totalUsers}
                  icon="👥"
                  variant="primary"
                />
                <StatCard
                  label="Active Members"
                  value={stats.totalMembers}
                  icon="👤"
                  variant="success"
                />
                <StatCard
                  label="Administrators"
                  value={stats.totalAdmins}
                  icon="🔑"
                  variant="info"
                />
                <StatCard
                  label="Active (30 days)"
                  value={stats.activeUsers}
                  icon="🔥"
                  variant="warning"
                />
              </StatCardGrid>
            </section>

            {/* Revenue & Bookings */}
            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Revenue & Bookings
              </h2>
              <StatCardGrid columns={3}>
                <StatCard
                  label="Total Revenue"
                  value={`$${(stats.totalRevenue / 100).toFixed(2)}`}
                  icon="💰"
                  variant="success"
                />
                <StatCard
                  label="Total Bookings"
                  value={stats.totalBookings}
                  icon="📅"
                  variant="primary"
                />
                <StatCard
                  label="Total Rooms"
                  value={stats.totalRooms}
                  icon="🏨"
                  variant="info"
                />
              </StatCardGrid>
            </section>



            {/* User Management */}
            <section>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-900">
                  User Management
                </h2>
                <div className="flex gap-2">
                  <button
                    onClick={() => setFilter('all')}
                    className={`px-4 py-2 rounded-lg transition-colors ${
                      filter === 'all'
                        ? 'bg-purple-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    All Users
                  </button>
                  <button
                    onClick={() => setFilter(RoleName.ADMIN)}
                    className={`px-4 py-2 rounded-lg transition-colors ${
                      filter === RoleName.ADMIN
                        ? 'bg-purple-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    Admins
                  </button>
                  <button
                    onClick={() => setFilter(RoleName.MEMBER)}
                    className={`px-4 py-2 rounded-lg transition-colors ${
                      filter === RoleName.MEMBER
                        ? 'bg-purple-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    Members
                  </button>
                </div>
              </div>

              <DataTable<SystemUser>
                columns={columns}
                data={filteredUsers}
                onRowClick={handleUserClick}
                emptyMessage="No users found"
                keyExtractor={(user) => user.id}
              />
            </section>
          </>
        )}
      </div>
    </Layout>
    </>
  )
}

// ==========================================
// PROTECTED PAGE EXPORT
// ==========================================

/**
 * SuperAdmin Dashboard Page
 * 
 * Protected route only accessible by users with SUPERADMIN role.
 * Provides system-wide management, user control, and advanced analytics.
 * 
 * @route /superadmin/dashboard
 * @access SUPERADMIN
 */
export default function SuperAdminDashboardPage() {
  return (
    <ProtectedRoute allowedRoles={['SUPERADMIN']}>
      <SuperAdminDashboardContent />
    </ProtectedRoute>
  )
}
