// ==========================================
// SUPERADMIN DASHBOARD PAGE - ENHANCED
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
import {
  Users, Shield, Activity, DollarSign, Calendar, Hotel,
  TrendingUp, AlertCircle, CheckCircle, Zap, RefreshCw,
  Settings, Bell, Crown, Sparkles, BarChart3, PieChart,
  ArrowUpRight, ArrowDownRight, Eye, UserPlus
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

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
// ANIMATED STAT CARD COMPONENT
// ==========================================

interface AnimatedStatCardProps {
  title: string
  value: string | number
  icon: React.ReactNode
  trend?: {
    value: number
    isPositive: boolean
  }
  subtitle?: string
  gradient: string
  delay?: number
}

const AnimatedStatCard = ({ title, value, icon, trend, subtitle, gradient, delay = 0 }: AnimatedStatCardProps) => {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), delay)
    return () => clearTimeout(timer)
  }, [delay])

  return (
    <div
      className={`group relative overflow-hidden rounded-3xl p-8 shadow-xl transition-all duration-500 hover:shadow-2xl hover:-translate-y-2 ${
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
      }`}
      style={{
        background: gradient,
      }}
    >
      {/* Animated Background Blobs */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute top-0 right-0 w-32 h-32 bg-white rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-white rounded-full blur-2xl animate-pulse" style={{ animationDelay: '1s' }} />
      </div>

      {/* Animated Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0 bg-linear-to-br from-white/50 to-transparent transform rotate-45 translate-x-full group-hover:translate-x-0 transition-transform duration-1000" />
      </div>

      <div className="relative z-10">
        <div className="flex items-start justify-between mb-6">
          <div className="p-4 bg-white/30 backdrop-blur-lg rounded-2xl group-hover:scale-110 group-hover:rotate-3 transition-all duration-300 shadow-lg">
            <div className="text-white">{icon}</div>
          </div>
          {trend && (
            <div className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-bold shadow-lg ${
              trend.isPositive ? 'bg-green-500/30 text-green-100 backdrop-blur-sm' : 'bg-red-500/30 text-red-100 backdrop-blur-sm'
            }`}>
              {trend.isPositive ? (
                <ArrowUpRight className="h-4 w-4" />
              ) : (
                <ArrowDownRight className="h-4 w-4" />
              )}
              <span>{Math.abs(trend.value)}%</span>
            </div>
          )}
        </div>
        
        <div className="text-white">
          <div className="text-5xl font-extrabold mb-2 group-hover:scale-105 transition-transform duration-300 tracking-tight">
            {value}
          </div>
          <div className="text-white/90 text-base font-semibold mb-2">
            {title}
          </div>
          {subtitle && (
            <div className="text-white/70 text-sm font-medium">
              {subtitle}
            </div>
          )}
        </div>
      </div>

      {/* Shine Effect */}
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
        <div className="absolute inset-0 bg-linear-to-r from-transparent via-white/20 to-transparent transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
      </div>

      {/* Glow Effect */}
      <div className="absolute -inset-1 bg-white/20 blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 -z-10" />
    </div>
  )
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
  const [refreshing, setRefreshing] = useState(false)

  // Fetch all dashboard data
  const fetchDashboardData = async () => {
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
        setRefreshing(false)
      }
  }

  // Fetch all dashboard data on mount
  useEffect(() => {
    fetchDashboardData()
  }, [])

  // Handle refresh
  const handleRefresh = async () => {
    setRefreshing(true)
    await fetchDashboardData()
  }

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
        <div className="space-y-8 pb-12 relative">
          {/* Animated Background Elements */}
          <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
            <div className="absolute top-20 right-20 w-96 h-96 bg-purple-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob" />
            <div className="absolute top-40 left-20 w-96 h-96 bg-pink-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000" />
            <div className="absolute bottom-20 left-1/2 w-96 h-96 bg-blue-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000" />
          </div>

          {/* Dashboard Header */}
          <div className="flex items-center justify-between relative z-10">
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-linear-to-br from-purple-600 to-pink-600 rounded-2xl shadow-xl">
                  <Crown className="h-8 w-8 text-white" />
                </div>
                <div>
                  <h1 className="text-5xl font-extrabold bg-linear-to-r from-purple-600 via-pink-600 to-orange-600 bg-clip-text text-transparent animate-gradient">
                    SuperAdmin Dashboard
                  </h1>
                  <p className="text-gray-600 text-lg font-medium flex items-center gap-2 mt-1">
                    <Sparkles className="h-5 w-5 text-purple-600" />
                    System-wide management and advanced analytics
                  </p>
                </div>
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleRefresh}
                disabled={refreshing}
                className="group flex items-center gap-2 px-6 py-4 bg-white border-2 border-gray-200 rounded-2xl hover:border-purple-500 hover:shadow-xl transition-all duration-300 disabled:opacity-50 hover:-translate-y-1"
              >
                <RefreshCw className={`h-5 w-5 text-purple-600 ${refreshing ? 'animate-spin' : ''}`} />
                <span className="font-bold text-gray-700">Refresh</span>
              </button>
              <button 
                onClick={() => router.push('/superadmin/system')}
                className="group flex items-center gap-2 px-6 py-4 bg-linear-to-r from-blue-600 to-cyan-600 text-white rounded-2xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 hover:scale-105 relative overflow-hidden"
              >
                <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <Settings className="h-5 w-5 relative z-10" />
                <span className="font-bold relative z-10">System Settings</span>
              </button>
              <button className="group flex items-center gap-2 px-6 py-4 bg-linear-to-r from-red-600 to-orange-600 text-white rounded-2xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 hover:scale-105 relative overflow-hidden">
                <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <AlertCircle className="h-5 w-5 relative z-10" />
                <span className="font-bold relative z-10">Emergency Controls</span>
              </button>
            </div>
          </div>

        {/* Loading State */}
        {loading && (
          <div className="relative z-10">
            <div className="flex items-center justify-center h-96">
              <div className="text-center">
                <div className="relative w-24 h-24 mx-auto mb-6">
                  <div className="absolute inset-0 rounded-full border-4 border-purple-200 animate-ping" />
                  <div className="absolute inset-0 rounded-full border-4 border-t-purple-600 border-r-transparent border-b-transparent border-l-transparent animate-spin" />
                </div>
                <p className="text-lg font-semibold text-gray-700 mb-2">Loading Dashboard</p>
                <p className="text-sm text-gray-500">Fetching system data...</p>
              </div>
            </div>
          </div>
        )}

        {/* Error State */}
        {error && !loading && (
          <div className="bg-red-50 border-2 border-red-200 rounded-3xl p-8 shadow-lg relative z-10">
            <div className="flex items-center mb-4">
              <AlertCircle className="h-8 w-8 text-red-600 mr-3" />
              <div>
                <h3 className="text-lg font-semibold text-red-800">Error Loading Dashboard</h3>
                <p className="text-red-600">{error}</p>
              </div>
            </div>
            <button
              onClick={handleRefresh}
              className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
            >
              Retry
            </button>
          </div>
        )}

        {/* Main Content */}
        {!loading && !error && (
          <>
            {/* System Health - Enhanced */}
            <section className="relative z-10">
              <Card className="border-0 shadow-2xl rounded-3xl overflow-hidden backdrop-blur-sm bg-white/90">
                <CardHeader className="bg-linear-to-r from-green-50 via-emerald-50 to-teal-50 border-b-2 border-gray-100">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-2xl font-extrabold text-gray-900 flex items-center gap-3">
                        <div className="p-3 bg-green-600 rounded-2xl shadow-lg">
                          <Activity className="h-7 w-7 text-white" />
                        </div>
                        System Health
                      </CardTitle>
                      <p className="text-sm text-gray-600 mt-2 ml-16 font-medium">Real-time system status monitoring</p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-8">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <div className="group bg-linear-to-br from-green-50 to-emerald-50 rounded-2xl p-6 hover:shadow-lg transition-all duration-300 hover:-translate-y-1 border-2 border-green-200">
                      <p className="text-sm text-gray-600 mb-3 font-semibold uppercase tracking-wide">Database</p>
                      {getHealthBadge(health.databaseStatus)}
                    </div>
                    <div className="group bg-linear-to-br from-blue-50 to-cyan-50 rounded-2xl p-6 hover:shadow-lg transition-all duration-300 hover:-translate-y-1 border-2 border-blue-200">
                      <p className="text-sm text-gray-600 mb-3 font-semibold uppercase tracking-wide">Total Users</p>
                      <p className="text-3xl font-extrabold text-gray-900">
                        {health.totalUsers}
                      </p>
                    </div>
                    <div className="group bg-linear-to-br from-purple-50 to-pink-50 rounded-2xl p-6 hover:shadow-lg transition-all duration-300 hover:-translate-y-1 border-2 border-purple-200">
                      <p className="text-sm text-gray-600 mb-3 font-semibold uppercase tracking-wide">Total Bookings</p>
                      <p className="text-3xl font-extrabold text-gray-900">
                        {health.totalBookings}
                      </p>
                    </div>
                    <div className="group bg-linear-to-br from-orange-50 to-red-50 rounded-2xl p-6 hover:shadow-lg transition-all duration-300 hover:-translate-y-1 border-2 border-orange-200">
                      <p className="text-sm text-gray-600 mb-3 font-semibold uppercase tracking-wide">Recent Errors</p>
                      <p className="text-3xl font-extrabold text-gray-900">
                        {health.recentErrors}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </section>

            {/* System Statistics - Enhanced Animated Cards */}
            <section className="relative z-10">
              <h2 className="text-3xl font-extrabold text-gray-900 mb-6 flex items-center gap-3">
                <BarChart3 className="h-8 w-8 text-purple-600" />
                System Overview
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                <AnimatedStatCard
                  title="Total Users"
                  value={stats.totalUsers}
                  icon={<Users className="h-8 w-8" />}
                  subtitle="All registered users"
                  gradient="linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
                  trend={{ value: 12.5, isPositive: true }}
                  delay={0}
                />
                <AnimatedStatCard
                  title="Active Members"
                  value={stats.totalMembers}
                  icon={<Users className="h-8 w-8" />}
                  subtitle="Member accounts"
                  gradient="linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)"
                  trend={{ value: 8.3, isPositive: true }}
                  delay={100}
                />
                <AnimatedStatCard
                  title="Administrators"
                  value={stats.totalAdmins}
                  icon={<Shield className="h-8 w-8" />}
                  subtitle="Admin access"
                  gradient="linear-gradient(135deg, #fa709a 0%, #fee140 100%)"
                  trend={{ value: 2.1, isPositive: true }}
                  delay={200}
                />
                <AnimatedStatCard
                  title="Active Users"
                  value={stats.activeUsers}
                  icon={<Zap className="h-8 w-8" />}
                  subtitle="Last 30 days"
                  gradient="linear-gradient(135deg, #f093fb 0%, #f5576c 100%)"
                  trend={{ value: 15.7, isPositive: true }}
                  delay={300}
                />
              </div>
            </section>

            {/* Revenue & Bookings - Enhanced */}
            <section className="relative z-10">
              <h2 className="text-3xl font-extrabold text-gray-900 mb-6 flex items-center gap-3">
                <DollarSign className="h-8 w-8 text-green-600" />
                Revenue & Bookings
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <AnimatedStatCard
                  title="Total Revenue"
                  value={`$${(stats.totalRevenue / 100).toFixed(2)}`}
                  icon={<DollarSign className="h-8 w-8" />}
                  subtitle="All-time earnings"
                  gradient="linear-gradient(135deg, #11998e 0%, #38ef7d 100%)"
                  trend={{ value: 18.4, isPositive: true }}
                  delay={0}
                />
                <AnimatedStatCard
                  title="Total Bookings"
                  value={stats.totalBookings}
                  icon={<Calendar className="h-8 w-8" />}
                  subtitle="All reservations"
                  gradient="linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)"
                  trend={{ value: 10.2, isPositive: true }}
                  delay={100}
                />
                <AnimatedStatCard
                  title="Total Rooms"
                  value={stats.totalRooms}
                  icon={<Hotel className="h-8 w-8" />}
                  subtitle="Available inventory"
                  gradient="linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)"
                  trend={{ value: 5.1, isPositive: true }}
                  delay={200}
                />
              </div>
            </section>



            {/* User Management - Enhanced */}
            <section className="relative z-10">
              <Card className="border-0 shadow-2xl rounded-3xl overflow-hidden backdrop-blur-sm bg-white/90">
                <CardHeader className="bg-linear-to-r from-indigo-50 via-purple-50 to-pink-50 border-b-2 border-gray-100">
                  <div className="flex items-center justify-between flex-wrap gap-4">
                    <div>
                      <CardTitle className="text-2xl font-extrabold text-gray-900 flex items-center gap-3">
                        <div className="p-3 bg-purple-600 rounded-2xl shadow-lg">
                          <Users className="h-7 w-7 text-white" />
                        </div>
                        User Management
                      </CardTitle>
                      <p className="text-sm text-gray-600 mt-2 ml-16 font-medium">
                        View and manage all system users
                      </p>
                    </div>
                    <div className="flex gap-3">
                      <button
                        onClick={() => setFilter('all')}
                        className={`px-6 py-3 rounded-xl font-bold transition-all duration-300 transform hover:scale-105 ${
                          filter === 'all'
                            ? 'bg-linear-to-r from-purple-600 to-pink-600 text-white shadow-lg'
                            : 'bg-white text-gray-700 hover:bg-gray-50 border-2 border-gray-200'
                        }`}
                      >
                        All Users
                      </button>
                      <button
                        onClick={() => setFilter(RoleName.ADMIN)}
                        className={`px-6 py-3 rounded-xl font-bold transition-all duration-300 transform hover:scale-105 ${
                          filter === RoleName.ADMIN
                            ? 'bg-linear-to-r from-purple-600 to-pink-600 text-white shadow-lg'
                            : 'bg-white text-gray-700 hover:bg-gray-50 border-2 border-gray-200'
                        }`}
                      >
                        Admins
                      </button>
                      <button
                        onClick={() => setFilter(RoleName.MEMBER)}
                        className={`px-6 py-3 rounded-xl font-bold transition-all duration-300 transform hover:scale-105 ${
                          filter === RoleName.MEMBER
                            ? 'bg-linear-to-r from-purple-600 to-pink-600 text-white shadow-lg'
                            : 'bg-white text-gray-700 hover:bg-gray-50 border-2 border-gray-200'
                        }`}
                      >
                        Members
                      </button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  <DataTable<SystemUser>
                    columns={columns}
                    data={filteredUsers}
                    onRowClick={handleUserClick}
                    emptyMessage="No users found"
                    keyExtractor={(user) => user.id}
                  />
                </CardContent>
              </Card>
            </section>
          </>
        )}
      </div>

      <style jsx>{`
        @keyframes blob {
          0%, 100% { transform: translate(0, 0) scale(1); }
          25% { transform: translate(20px, -50px) scale(1.1); }
          50% { transform: translate(-20px, 20px) scale(0.9); }
          75% { transform: translate(50px, 50px) scale(1.05); }
        }
        
        @keyframes gradient {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
        
        .animate-blob {
          animation: blob 7s infinite;
        }
        
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        
        .animation-delay-4000 {
          animation-delay: 4s;
        }
        
        .animate-gradient {
          background-size: 200% auto;
          animation: gradient 3s linear infinite;
        }
      `}</style>
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
