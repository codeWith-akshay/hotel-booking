// ==========================================
// ADMIN DASHBOARD PAGE
// ==========================================
// Example page for ADMIN role
// Features: Protected route, layout integration, booking management, analytics

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
 * Booking management interface
 */
interface AdminBooking {
  id: string
  bookingNumber: string
  guestName: string
  guestPhone: string
  roomType: string
  roomNumber: string
  checkIn: Date
  checkOut: Date
  guests: number
  status: 'PENDING' | 'CONFIRMED' | 'CHECKED_IN' | 'CHECKED_OUT' | 'CANCELLED'
  paymentStatus: 'PENDING' | 'PAID' | 'PARTIAL' | 'REFUNDED'
  amount: number
  createdAt: Date
}

/**
 * Admin dashboard statistics
 */
interface AdminStats {
  totalBookings: number
  todayCheckIns: number
  todayCheckOuts: number
  occupancyRate: number
  pendingBookings: number
  revenue: number
  avgBookingValue: number
  cancelledToday: number
}

// ==========================================
// MOCK DATA
// ==========================================

const mockStats: AdminStats = {
  totalBookings: 342,
  todayCheckIns: 12,
  todayCheckOuts: 8,
  occupancyRate: 78.5,
  pendingBookings: 23,
  revenue: 125480,
  avgBookingValue: 367,
  cancelledToday: 2,
}

const mockBookings: AdminBooking[] = [
  {
    id: '1',
    bookingNumber: 'BK-2024-001567',
    guestName: 'John Smith',
    guestPhone: '+1-555-0123',
    roomType: 'Deluxe Suite',
    roomNumber: '302',
    checkIn: new Date('2024-10-23'),
    checkOut: new Date('2024-10-25'),
    guests: 2,
    status: 'CONFIRMED',
    paymentStatus: 'PAID',
    amount: 890,
    createdAt: new Date('2024-10-20'),
  },
  {
    id: '2',
    bookingNumber: 'BK-2024-001568',
    guestName: 'Sarah Johnson',
    guestPhone: '+1-555-0456',
    roomType: 'Standard Room',
    roomNumber: '105',
    checkIn: new Date('2024-10-22'),
    checkOut: new Date('2024-10-24'),
    guests: 1,
    status: 'CHECKED_IN',
    paymentStatus: 'PAID',
    amount: 420,
    createdAt: new Date('2024-10-21'),
  },
  {
    id: '3',
    bookingNumber: 'BK-2024-001569',
    guestName: 'Michael Chen',
    guestPhone: '+1-555-0789',
    roomType: 'Executive Suite',
    roomNumber: '501',
    checkIn: new Date('2024-10-25'),
    checkOut: new Date('2024-10-28'),
    guests: 3,
    status: 'PENDING',
    paymentStatus: 'PENDING',
    amount: 1340,
    createdAt: new Date('2024-10-22'),
  },
  {
    id: '4',
    bookingNumber: 'BK-2024-001570',
    guestName: 'Emily Davis',
    guestPhone: '+1-555-0321',
    roomType: 'Standard Room',
    roomNumber: '208',
    checkIn: new Date('2024-10-22'),
    checkOut: new Date('2024-10-23'),
    guests: 2,
    status: 'CHECKED_OUT',
    paymentStatus: 'PAID',
    amount: 380,
    createdAt: new Date('2024-10-19'),
  },
  {
    id: '5',
    bookingNumber: 'BK-2024-001571',
    guestName: 'Robert Wilson',
    guestPhone: '+1-555-0654',
    roomType: 'Deluxe Suite',
    roomNumber: '405',
    checkIn: new Date('2024-10-26'),
    checkOut: new Date('2024-10-29'),
    guests: 2,
    status: 'CANCELLED',
    paymentStatus: 'REFUNDED',
    amount: 920,
    createdAt: new Date('2024-10-18'),
  },
]

// ==========================================
// STATUS BADGE HELPERS
// ==========================================

function getStatusBadge(status: AdminBooking['status']) {
  switch (status) {
    case 'PENDING':
      return <Badge variant="warning">Pending</Badge>
    case 'CONFIRMED':
      return <Badge variant="info">Confirmed</Badge>
    case 'CHECKED_IN':
      return <Badge variant="success">Checked In</Badge>
    case 'CHECKED_OUT':
      return <Badge variant="default">Checked Out</Badge>
    case 'CANCELLED':
      return <Badge variant="danger">Cancelled</Badge>
    default:
      return <Badge>{status}</Badge>
  }
}

function getPaymentBadge(status: AdminBooking['paymentStatus']) {
  switch (status) {
    case 'PAID':
      return <Badge variant="success">Paid</Badge>
    case 'PENDING':
      return <Badge variant="warning">Pending</Badge>
    case 'PARTIAL':
      return <Badge variant="info">Partial</Badge>
    case 'REFUNDED':
      return <Badge variant="default">Refunded</Badge>
    default:
      return <Badge>{status}</Badge>
  }
}

// ==========================================
// TABLE COLUMNS
// ==========================================

const columns: Column<AdminBooking>[] = [
  {
    label: 'Booking #',
    key: 'bookingNumber',
    sortable: true,
    width: 'w-32',
  },
  {
    label: 'Guest',
    key: 'guestName',
    sortable: true,
    render: (booking) => (
      <div>
        <div className="font-medium">{booking.guestName}</div>
        <div className="text-xs text-gray-500">{booking.guestPhone}</div>
      </div>
    ),
  },
  {
    label: 'Room',
    key: 'roomNumber',
    sortable: true,
    render: (booking) => (
      <div>
        <div className="font-medium">#{booking.roomNumber}</div>
        <div className="text-xs text-gray-500">{booking.roomType}</div>
      </div>
    ),
  },
  {
    label: 'Check In',
    key: 'checkIn',
    sortable: true,
    render: (booking) => booking.checkIn.toLocaleDateString(),
  },
  {
    label: 'Check Out',
    key: 'checkOut',
    sortable: true,
    render: (booking) => booking.checkOut.toLocaleDateString(),
  },
  {
    label: 'Status',
    key: 'status',
    sortable: true,
    render: (booking) => getStatusBadge(booking.status),
  },
  {
    label: 'Payment',
    key: 'paymentStatus',
    sortable: true,
    render: (booking) => getPaymentBadge(booking.paymentStatus),
  },
  {
    label: 'Amount',
    key: 'amount',
    sortable: true,
    align: 'right',
    render: (booking) => `$${booking.amount.toLocaleString()}`,
  },
]

// ==========================================
// PAGE CONTENT COMPONENT
// ==========================================

function AdminDashboardContent() {
  const user = useAuthStore((state) => state.user)
  const [stats, setStats] = useState<AdminStats>(mockStats)
  const [bookings, setBookings] = useState<AdminBooking[]>(mockBookings)
  const [loading, setLoading] = useState(false)
  const [filter, setFilter] = useState<'all' | 'pending' | 'today'>('all')

  // ==========================================
  // FETCH DATA
  // ==========================================

  useEffect(() => {
    // TODO: Replace with actual API calls
    // fetchDashboardStats()
    // fetchRecentBookings()
  }, [])

  // ==========================================
  // FILTER BOOKINGS
  // ==========================================

  const filteredBookings = bookings.filter((booking) => {
    if (filter === 'pending') {
      return booking.status === 'PENDING'
    }
    if (filter === 'today') {
      const today = new Date().toDateString()
      return (
        booking.checkIn.toDateString() === today ||
        booking.checkOut.toDateString() === today
      )
    }
    return true
  })

  // ==========================================
  // HANDLERS
  // ==========================================

  const handleLogout = () => {
    // Clear auth store
    useAuthStore.getState().logout()
    // Redirect to login
    window.location.href = '/login'
  }

  const handleBookingClick = (booking: AdminBooking) => {
    console.log('Booking clicked:', booking)
    // TODO: Open booking details modal or navigate
    // router.push(`/admin/bookings/${booking.id}`)
  }

  const handleConfirmBooking = async (bookingId: string) => {
    console.log('Confirm booking:', bookingId)
    // TODO: API call to confirm booking
  }

  const handleCheckIn = async (bookingId: string) => {
    console.log('Check in:', bookingId)
    // TODO: API call to check in guest
  }

  // ==========================================
  // RENDER
  // ==========================================

  return (
    <Layout
      user={{
        name: user?.name || 'Admin User',
        email: user?.email || user?.phone || '',
        role: user?.role || 'ADMIN',
      }}
      config={{
        showSidebar: true,
        showFooter: true,
      }}
      onLogout={handleLogout}
    >
      <div className="space-y-8">
        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
            <p className="text-gray-600 mt-1">
              Manage bookings, monitor operations, and track performance
            </p>
          </div>
          <div className="mt-4 md:mt-0 flex gap-2">
            <button className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
              📊 Reports
            </button>
            <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
              + New Booking
            </button>
          </div>
        </div>

        {/* Statistics Cards */}
        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Today's Overview
          </h2>
          <StatCardGrid columns={4}>
            <StatCard
              label="Check-Ins Today"
              value={stats.todayCheckIns}
              icon="🔑"
              variant="success"
              trend={{ direction: 'up', value: '+3', label: 'vs yesterday' }}
            />
            <StatCard
              label="Check-Outs Today"
              value={stats.todayCheckOuts}
              icon="👋"
              variant="info"
              trend={{ direction: 'neutral', value: '0', label: 'vs yesterday' }}
            />
            <StatCard
              label="Occupancy Rate"
              value={`${stats.occupancyRate}%`}
              icon="🏨"
              variant="primary"
              trend={{ direction: 'up', value: '+2.5%', label: 'vs last week' }}
            />
            <StatCard
              label="Pending Bookings"
              value={stats.pendingBookings}
              icon="⏳"
              variant="warning"
              description="Awaiting confirmation"
              onClick={() => setFilter('pending')}
            />
          </StatCardGrid>
        </section>

        {/* Revenue Cards */}
        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Revenue Metrics
          </h2>
          <StatCardGrid columns={3}>
            <StatCard
              label="Total Revenue"
              value={`$${stats.revenue.toLocaleString()}`}
              icon="💰"
              variant="success"
              trend={{ direction: 'up', value: '+12%', label: 'vs last month' }}
            />
            <StatCard
              label="Avg Booking Value"
              value={`$${stats.avgBookingValue}`}
              icon="📈"
              variant="info"
              trend={{ direction: 'up', value: '+5%', label: 'vs last month' }}
            />
            <StatCard
              label="Total Bookings"
              value={stats.totalBookings}
              icon="📅"
              variant="primary"
              description="This month"
            />
          </StatCardGrid>
        </section>

        {/* Booking Management */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900">
              Recent Bookings
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
                All
              </button>
              <button
                onClick={() => setFilter('pending')}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  filter === 'pending'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Pending
              </button>
              <button
                onClick={() => setFilter('today')}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  filter === 'today'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Today
              </button>
            </div>
          </div>
          <DataTable
            data={filteredBookings}
            columns={columns}
            keyExtractor={(booking) => booking.id}
            onRowClick={handleBookingClick}
            emptyMessage={
              filter === 'pending'
                ? 'No pending bookings'
                : filter === 'today'
                ? 'No bookings for today'
                : 'No bookings found'
            }
            loading={loading}
          />
        </section>

        {/* Quick Actions */}
        <section className="bg-linear-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Admin Actions
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <button className="flex flex-col items-center gap-2 p-4 bg-white rounded-lg hover:shadow-md transition-shadow">
              <span className="text-3xl">🏨</span>
              <p className="font-medium">Manage Rooms</p>
            </button>
            <button className="flex flex-col items-center gap-2 p-4 bg-white rounded-lg hover:shadow-md transition-shadow">
              <span className="text-3xl">👥</span>
              <p className="font-medium">View Guests</p>
            </button>
            <button className="flex flex-col items-center gap-2 p-4 bg-white rounded-lg hover:shadow-md transition-shadow">
              <span className="text-3xl">📊</span>
              <p className="font-medium">Analytics</p>
            </button>
            <button className="flex flex-col items-center gap-2 p-4 bg-white rounded-lg hover:shadow-md transition-shadow">
              <span className="text-3xl">⚙️</span>
              <p className="font-medium">Settings</p>
            </button>
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
 * Admin Dashboard Page
 * 
 * Protected route only accessible by users with ADMIN role.
 * Provides booking management, statistics, and operational tools.
 * 
 * @route /admin/dashboard
 * @access ADMIN
 */
export default function AdminDashboardPage() {
  return (
    <ProtectedRoute allowedRoles={['ADMIN']}>
      <AdminDashboardContent />
    </ProtectedRoute>
  )
}
