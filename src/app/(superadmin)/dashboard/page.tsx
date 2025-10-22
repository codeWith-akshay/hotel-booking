// ==========================================
// SUPERADMIN DASHBOARD PAGE
// ==========================================
// Example page for SUPERADMIN role
// Features: Protected route, system-wide management, advanced analytics, user management

'use client'

import { useEffect, useState } from 'react'
import ProtectedRoute from '@/components/auth/ProtectedRoute'
import Layout from '@/components/layout/Layout'
import { useAuthStore } from '@/store/auth.store'
import StatCard, { StatCardGrid } from '@/components/dashboard/StatCard'
import DataTable, { type Column, Badge } from '@/components/dashboard/DataTable'

// ==========================================
// TYPE DEFINITIONS
// ==========================================

/**
 * System user interface
 */
interface SystemUser {
  id: string
  name: string
  email: string | null
  phone: string
  role: 'MEMBER' | 'ADMIN' | 'SUPERADMIN'
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED'
  totalBookings: number
  lastLogin: Date
  createdAt: Date
}

/**
 * System-wide statistics
 */
interface SystemStats {
  totalUsers: number
  totalAdmins: number
  totalMembers: number
  activeUsers: number
  totalBookings: number
  totalRevenue: number
  systemUptime: number
  activeSessionsCount: number
}

/**
 * System health metrics
 */
interface SystemHealth {
  databaseStatus: 'HEALTHY' | 'WARNING' | 'CRITICAL'
  apiResponseTime: number
  errorRate: number
  serverLoad: number
}

// ==========================================
// MOCK DATA
// ==========================================

const mockStats: SystemStats = {
  totalUsers: 1847,
  totalAdmins: 12,
  totalMembers: 1835,
  activeUsers: 342,
  totalBookings: 8934,
  totalRevenue: 2547890,
  systemUptime: 99.97,
  activeSessionsCount: 128,
}

const mockHealth: SystemHealth = {
  databaseStatus: 'HEALTHY',
  apiResponseTime: 142,
  errorRate: 0.03,
  serverLoad: 34.5,
}

const mockUsers: SystemUser[] = [
  {
    id: '1',
    name: 'John Admin',
    email: 'john@hotel.com',
    phone: '+1-555-0001',
    role: 'ADMIN',
    status: 'ACTIVE',
    totalBookings: 0,
    lastLogin: new Date('2024-10-22T14:30:00'),
    createdAt: new Date('2024-01-15'),
  },
  {
    id: '2',
    name: 'Sarah Manager',
    email: 'sarah@hotel.com',
    phone: '+1-555-0002',
    role: 'ADMIN',
    status: 'ACTIVE',
    totalBookings: 0,
    lastLogin: new Date('2024-10-22T09:15:00'),
    createdAt: new Date('2024-02-01'),
  },
  {
    id: '3',
    name: 'Michael Guest',
    email: 'michael@example.com',
    phone: '+1-555-0103',
    role: 'MEMBER',
    status: 'ACTIVE',
    totalBookings: 15,
    lastLogin: new Date('2024-10-21T18:45:00'),
    createdAt: new Date('2024-03-10'),
  },
  {
    id: '4',
    name: 'Emily User',
    email: null,
    phone: '+1-555-0204',
    role: 'MEMBER',
    status: 'ACTIVE',
    totalBookings: 3,
    lastLogin: new Date('2024-10-20T12:00:00'),
    createdAt: new Date('2024-06-15'),
  },
  {
    id: '5',
    name: 'Robert Inactive',
    email: 'robert@example.com',
    phone: '+1-555-0305',
    role: 'MEMBER',
    status: 'SUSPENDED',
    totalBookings: 1,
    lastLogin: new Date('2024-09-10T10:30:00'),
    createdAt: new Date('2024-08-01'),
  },
]

// ==========================================
// BADGE HELPERS
// ==========================================

function getRoleBadge(role: SystemUser['role']) {
  switch (role) {
    case 'SUPERADMIN':
      return <Badge variant="danger">SuperAdmin</Badge>
    case 'ADMIN':
      return <Badge variant="info">Admin</Badge>
    case 'MEMBER':
      return <Badge variant="default">Member</Badge>
    default:
      return <Badge>{role}</Badge>
  }
}

function getStatusBadge(status: SystemUser['status']) {
  switch (status) {
    case 'ACTIVE':
      return <Badge variant="success">Active</Badge>
    case 'INACTIVE':
      return <Badge variant="warning">Inactive</Badge>
    case 'SUSPENDED':
      return <Badge variant="danger">Suspended</Badge>
    default:
      return <Badge>{status}</Badge>
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
    label: 'User',
    key: 'name',
    sortable: true,
    render: (user) => (
      <div>
        <div className="font-medium">{user.name}</div>
        <div className="text-xs text-gray-500">
          {user.email || user.phone}
        </div>
      </div>
    ),
  },
  {
    label: 'Role',
    key: 'role',
    sortable: true,
    render: (user) => getRoleBadge(user.role),
  },
  {
    label: 'Status',
    key: 'status',
    sortable: true,
    render: (user) => getStatusBadge(user.status),
  },
  {
    label: 'Bookings',
    key: 'totalBookings',
    sortable: true,
    align: 'center',
  },
  {
    label: 'Last Login',
    key: 'lastLogin',
    sortable: true,
    render: (user) => user.lastLogin.toLocaleString(),
  },
  {
    label: 'Member Since',
    key: 'createdAt',
    sortable: true,
    render: (user) => user.createdAt.toLocaleDateString(),
  },
]

// ==========================================
// PAGE CONTENT COMPONENT
// ==========================================

function SuperAdminDashboardContent() {
  const user = useAuthStore((state) => state.user)
  const [stats, setStats] = useState<SystemStats>(mockStats)
  const [health, setHealth] = useState<SystemHealth>(mockHealth)
  const [users, setUsers] = useState<SystemUser[]>(mockUsers)
  const [loading, setLoading] = useState(false)
  const [filter, setFilter] = useState<'all' | 'admins' | 'members'>('all')

  // ==========================================
  // FETCH DATA
  // ==========================================

  useEffect(() => {
    // TODO: Replace with actual API calls
    // fetchSystemStats()
    // fetchSystemHealth()
    // fetchAllUsers()
  }, [])

  // ==========================================
  // FILTER USERS
  // ==========================================

  const filteredUsers = users.filter((user) => {
    if (filter === 'admins') {
      return user.role === 'ADMIN' || user.role === 'SUPERADMIN'
    }
    if (filter === 'members') {
      return user.role === 'MEMBER'
    }
    return true
  })

  // ==========================================
  // HANDLERS
  // ==========================================

  const handleUserClick = (user: SystemUser) => {
    console.log('User clicked:', user)
    // TODO: Open user details modal
  }

  const handleManageUser = (userId: string) => {
    console.log('Manage user:', userId)
    // TODO: Open user management modal
  }

  // ==========================================
  // RENDER
  // ==========================================

  return (
    <Layout
      user={{
        name: user?.name || 'SuperAdmin',
        email: user?.email || user?.phone || '',
        role: user?.role || 'SUPERADMIN',
      }}
      config={{
        showSidebar: true,
        showFooter: true,
      }}
    >
      <div className="space-y-8">
        {/* Page Header */}
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
            <button className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
              🔧 System Settings
            </button>
            <button className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors">
              🚨 Emergency Controls
            </button>
          </div>
        </div>

        {/* System Health */}
        <section className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg border border-green-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            System Health
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-lg p-4">
              <p className="text-sm text-gray-600 mb-1">Database</p>
              {getHealthBadge(health.databaseStatus)}
            </div>
            <div className="bg-white rounded-lg p-4">
              <p className="text-sm text-gray-600 mb-1">API Response</p>
              <p className="text-xl font-bold text-gray-900">
                {health.apiResponseTime}ms
              </p>
            </div>
            <div className="bg-white rounded-lg p-4">
              <p className="text-sm text-gray-600 mb-1">Error Rate</p>
              <p className="text-xl font-bold text-gray-900">
                {health.errorRate}%
              </p>
            </div>
            <div className="bg-white rounded-lg p-4">
              <p className="text-sm text-gray-600 mb-1">Server Load</p>
              <p className="text-xl font-bold text-gray-900">
                {health.serverLoad}%
              </p>
            </div>
          </div>
        </section>

        {/* User Statistics */}
        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            User Statistics
          </h2>
          <StatCardGrid columns={4}>
            <StatCard
              label="Total Users"
              value={stats.totalUsers.toLocaleString()}
              icon="👥"
              variant="primary"
              trend={{ direction: 'up', value: '+127', label: 'this month' }}
            />
            <StatCard
              label="Active Users"
              value={stats.activeUsers}
              icon="🟢"
              variant="success"
              description="Currently online"
            />
            <StatCard
              label="Admins"
              value={stats.totalAdmins}
              icon="🛡️"
              variant="info"
              onClick={() => setFilter('admins')}
            />
            <StatCard
              label="Members"
              value={stats.totalMembers.toLocaleString()}
              icon="⭐"
              variant="primary"
              onClick={() => setFilter('members')}
            />
          </StatCardGrid>
        </section>

        {/* System Metrics */}
        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            System Metrics
          </h2>
          <StatCardGrid columns={4}>
            <StatCard
              label="Total Bookings"
              value={stats.totalBookings.toLocaleString()}
              icon="📊"
              variant="primary"
              description="All-time"
            />
            <StatCard
              label="Total Revenue"
              value={`$${(stats.totalRevenue / 1000).toFixed(0)}K`}
              icon="💰"
              variant="success"
              trend={{ direction: 'up', value: '+18%', label: 'vs last month' }}
            />
            <StatCard
              label="System Uptime"
              value={`${stats.systemUptime}%`}
              icon="⚡"
              variant="success"
              description="Last 30 days"
            />
            <StatCard
              label="Active Sessions"
              value={stats.activeSessionsCount}
              icon="🔒"
              variant="info"
              description="Current connections"
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
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                All Users
              </button>
              <button
                onClick={() => setFilter('admins')}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  filter === 'admins'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Admins
              </button>
              <button
                onClick={() => setFilter('members')}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  filter === 'members'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Members
              </button>
            </div>
          </div>
          <DataTable
            data={filteredUsers}
            columns={columns}
            keyExtractor={(user) => user.id}
            onRowClick={handleUserClick}
            emptyMessage="No users found"
            loading={loading}
          />
        </section>

        {/* Advanced Controls */}
        <section className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-lg border border-purple-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Advanced Controls
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <button className="flex flex-col items-center gap-2 p-4 bg-white rounded-lg hover:shadow-md transition-shadow">
              <span className="text-3xl">👥</span>
              <p className="font-medium text-sm">User Roles</p>
            </button>
            <button className="flex flex-col items-center gap-2 p-4 bg-white rounded-lg hover:shadow-md transition-shadow">
              <span className="text-3xl">🔐</span>
              <p className="font-medium text-sm">Permissions</p>
            </button>
            <button className="flex flex-col items-center gap-2 p-4 bg-white rounded-lg hover:shadow-md transition-shadow">
              <span className="text-3xl">📊</span>
              <p className="font-medium text-sm">Analytics</p>
            </button>
            <button className="flex flex-col items-center gap-2 p-4 bg-white rounded-lg hover:shadow-md transition-shadow">
              <span className="text-3xl">📝</span>
              <p className="font-medium text-sm">Audit Logs</p>
            </button>
            <button className="flex flex-col items-center gap-2 p-4 bg-white rounded-lg hover:shadow-md transition-shadow">
              <span className="text-3xl">🗄️</span>
              <p className="font-medium text-sm">Database</p>
            </button>
            <button className="flex flex-col items-center gap-2 p-4 bg-white rounded-lg hover:shadow-md transition-shadow">
              <span className="text-3xl">⚙️</span>
              <p className="font-medium text-sm">Settings</p>
            </button>
          </div>
        </section>

        {/* System Alerts */}
        <section className="bg-yellow-50 rounded-lg border border-yellow-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            System Alerts
          </h2>
          <div className="space-y-3">
            <div className="flex items-start gap-3 bg-white p-4 rounded-lg">
              <span className="text-2xl">ℹ️</span>
              <div className="flex-1">
                <p className="font-medium text-gray-900">System Update Available</p>
                <p className="text-sm text-gray-600">
                  New version v2.1.0 is available. Update during low-traffic hours.
                </p>
              </div>
              <button className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700">
                View
              </button>
            </div>
            <div className="flex items-start gap-3 bg-white p-4 rounded-lg">
              <span className="text-2xl">✅</span>
              <div className="flex-1">
                <p className="font-medium text-gray-900">Database Backup Complete</p>
                <p className="text-sm text-gray-600">
                  Daily backup completed successfully at 2:00 AM.
                </p>
              </div>
            </div>
          </div>
        </section>
      </div>
    </Layout>
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
