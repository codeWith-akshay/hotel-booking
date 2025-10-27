/**
 * Admin Notifications Page
 * View all notification logs with filters and statuses
 */

'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAuthStore } from '@/store/auth.store'
import ProtectedRoute from '@/components/auth/ProtectedRoute'
import AdminLayout from '@/components/layout/AdminLayout'
import Header from '@/components/layout/Header'
import { NotificationType, NotificationChannel, NotificationStatus } from '@prisma/client'
import { 
  Bell, 
  Mail, 
  MessageSquare, 
  Check, 
  X, 
  Clock, 
  Ban,
  CheckCircle2,
  AlertCircle,
  Loader2
} from 'lucide-react'
import { format } from 'date-fns'

// Type definitions
interface NotificationLog {
  id: string
  userId: string
  type: NotificationType
  channel: NotificationChannel
  status: NotificationStatus
  subject: string | null
  message: string
  createdAt: Date
  sentAt: Date | null
  errorMessage: string | null
  user: {
    name: string
    email: string | null
    phone: string
  }
}

interface Stats {
  total: number
  pending: number
  sent: number
  failed: number
  byType: { type: NotificationType; _count: number }[]
  byChannel: { channel: NotificationChannel; _count: number }[]
}

function AdminNotificationsContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user, logout } = useAuthStore()
  
  const [notifications, setNotifications] = useState<NotificationLog[]>([])
  const [stats, setStats] = useState<Stats>({ 
    total: 0, 
    pending: 0, 
    sent: 0, 
    failed: 0,
    byType: [],
    byChannel: []
  })
  const [loading, setLoading] = useState(true)
  const [totalPages, setTotalPages] = useState(1)
  
  const page = parseInt(searchParams.get('page') || '1')
  const typeFilter = searchParams.get('type') as NotificationType | null
  const channelFilter = searchParams.get('channel') as NotificationChannel | null
  const statusFilter = searchParams.get('status') as NotificationStatus | null

  const handleLogout = () => {
    logout()
    router.push('/login')
  }

  useEffect(() => {
    fetchNotifications()
  }, [page, typeFilter, channelFilter, statusFilter])

  async function fetchNotifications() {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (typeFilter) params.set('type', typeFilter)
      if (channelFilter) params.set('channel', channelFilter)
      if (statusFilter) params.set('status', statusFilter)
      params.set('page', page.toString())

      const response = await fetch(`/api/notifications/admin/logs?${params}`)
      const data = await response.json()
      
      setNotifications(data.notifications || [])
      setStats(data.stats || stats)
      setTotalPages(data.pages || 1)
    } catch (error) {
      console.error('Failed to fetch notifications:', error)
    } finally {
      setLoading(false)
    }
  }

  function updateFilter(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString())
    if (value) {
      params.set(key, value)
    } else {
      params.delete(key)
    }
    params.set('page', '1')
    router.push(`/admin/notifications?${params.toString()}`)
  }

  return (
    <ProtectedRoute allowedRoles={['ADMIN', 'SUPERADMIN']}>
      {user && (
        <>
          <Header 
            user={user}
            onLogout={handleLogout}
            showNotifications={true}
            onNotificationClick={() => router.push('/admin/notifications')}
          />
          
          <AdminLayout>
        
        <div className="container mx-auto py-8 px-4">
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">Notification Logs</h1>
            <p className="text-gray-600">Monitor all email and WhatsApp notifications</p>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            </div>
          ) : (
            <>
              {/* Statistics Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                <StatCard
                  title="Total Notifications"
                  value={stats.total}
                  icon={<Bell className="w-5 h-5" />}
                  color="bg-blue-500"
                />
                <StatCard
                  title="Pending"
                  value={stats.pending}
                  icon={<Clock className="w-5 h-5" />}
                  color="bg-yellow-500"
                />
                <StatCard
                  title="Sent"
                  value={stats.sent}
                  icon={<Check className="w-5 h-5" />}
                  color="bg-green-500"
                />
                <StatCard
                  title="Failed"
                  value={stats.failed}
                  icon={<X className="w-5 h-5" />}
                  color="bg-red-500"
                />
              </div>

              {/* Filters */}
              <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                <h2 className="text-lg font-semibold mb-4">Filters</h2>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Type</label>
                    <select
                      value={typeFilter || ''}
                      onChange={(e) => updateFilter('type', e.target.value)}
                      className="w-full border rounded-md px-3 py-2"
                    >
                      <option value="">All Types</option>
                      <option value="BOOKING_CONFIRMATION">Booking Confirmation</option>
                      <option value="BOOKING_REMINDER">Check-in Reminder</option>
                      <option value="PAYMENT_REMINDER">Payment</option>
                      <option value="WAITLIST_ALERT">Waitlist</option>
                      <option value="BROADCAST">Broadcast</option>
                      <option value="CANCELLATION_NOTICE">Cancellation</option>
                      <option value="INVOICE_READY">Invoice</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Channel</label>
                    <select
                      value={channelFilter || ''}
                      onChange={(e) => updateFilter('channel', e.target.value)}
                      className="w-full border rounded-md px-3 py-2"
                    >
                      <option value="">All Channels</option>
              <option value="EMAIL">Email</option>
                      <option value="WHATSAPP">WhatsApp</option>
                      <option value="SMS">SMS</option>
                      <option value="IN_APP">In-App</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Status</label>
                    <select
                      value={statusFilter || ''}
                      onChange={(e) => updateFilter('status', e.target.value)}
                      className="w-full border rounded-md px-3 py-2"
                    >
                      <option value="">All Statuses</option>
                      <option value="PENDING">Pending</option>
                      <option value="SENT">Sent</option>
                      <option value="DELIVERED">Delivered</option>
                      <option value="FAILED">Failed</option>
                      <option value="CANCELLED">Cancelled</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Notifications Table */}
              <div className="bg-white rounded-lg shadow-md overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Time
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          User
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Type
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Channel
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Message
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {notifications.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                            No notifications found
                          </td>
                        </tr>
                      ) : (
                        notifications.map((notification) => (
                          <tr key={notification.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                              {format(new Date(notification.createdAt), 'MMM dd, HH:mm')}
                            </td>
                            <td className="px-6 py-4 text-sm">
                              <div className="font-medium">{notification.user.name}</div>
                              <div className="text-gray-500 text-xs">
                                {notification.channel === 'EMAIL'
                                  ? notification.user.email
                                  : notification.user.phone}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <TypeBadge type={notification.type} />
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <ChannelBadge channel={notification.channel} />
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <StatusBadge
                                status={notification.status}
                                failureReason={notification.errorMessage}
                              />
                            </td>
                            <td className="px-6 py-4 text-sm max-w-md">
                              <div className="truncate">
                                {notification.subject || notification.message.substring(0, 100)}
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="px-6 py-4 flex items-center justify-between border-t">
                    <div className="text-sm text-gray-700">
                      Page {page} of {totalPages}
                    </div>
                    <div className="flex gap-2">
                      {page > 1 && (
                        <button
                          onClick={() => updateFilter('page', String(page - 1))}
                          className="px-4 py-2 border rounded-md hover:bg-gray-50"
                        >
                          Previous
                        </button>
                      )}
                      {page < totalPages && (
                        <button
                          onClick={() => updateFilter('page', String(page + 1))}
                          className="px-4 py-2 border rounded-md hover:bg-gray-50"
                        >
                          Next
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
          </div>
          </AdminLayout>
        </>
      )}
    </ProtectedRoute>
  )
}

// Helper Components
function StatCard({ title, value, icon, color }: any) {
  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-600 mb-1">{title}</p>
          <p className="text-2xl font-bold">{value.toLocaleString()}</p>
        </div>
        <div className={`${color} text-white p-3 rounded-full`}>
          {icon}
        </div>
      </div>
    </div>
  )
}

function TypeBadge({ type }: { type: NotificationType }) {
  const styles: Record<NotificationType, string> = {
    BOOKING_CONFIRMATION: 'bg-green-100 text-green-800',
    BOOKING_REMINDER: 'bg-blue-100 text-blue-800',
    PAYMENT_REMINDER: 'bg-yellow-100 text-yellow-800',
    WAITLIST_ALERT: 'bg-purple-100 text-purple-800',
    BROADCAST: 'bg-indigo-100 text-indigo-800',
    CANCELLATION_NOTICE: 'bg-red-100 text-red-800',
    INVOICE_READY: 'bg-gray-100 text-gray-800',
    CHECKIN_ALERT: 'bg-teal-100 text-teal-800',
    CHECKOUT_ALERT: 'bg-cyan-100 text-cyan-800',
  }

  const labels: Record<NotificationType, string> = {
    BOOKING_CONFIRMATION: 'Booking',
    BOOKING_REMINDER: 'Reminder',
    PAYMENT_REMINDER: 'Payment',
    WAITLIST_ALERT: 'Waitlist',
    BROADCAST: 'Broadcast',
    CANCELLATION_NOTICE: 'Cancellation',
    INVOICE_READY: 'Invoice',
    CHECKIN_ALERT: 'Check-in',
    CHECKOUT_ALERT: 'Check-out',
  }

  return (
    <span className={`px-2 py-1 text-xs font-medium rounded-full ${styles[type]}`}>
      {labels[type]}
    </span>
  )
}

function ChannelBadge({ channel }: { channel: NotificationChannel }) {
  const icons = {
    EMAIL: <Mail className="w-4 h-4" />,
    WHATSAPP: <MessageSquare className="w-4 h-4" />,
    SMS: <MessageSquare className="w-4 h-4" />,
    IN_APP: <Bell className="w-4 h-4" />,
  }

  const styles = {
    EMAIL: 'bg-blue-100 text-blue-800',
    WHATSAPP: 'bg-green-100 text-green-800',
    SMS: 'bg-purple-100 text-purple-800',
    IN_APP: 'bg-gray-100 text-gray-800',
  }

  return (
    <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full ${styles[channel]}`}>
      {icons[channel]}
      {channel}
    </span>
  )
}

function StatusBadge({ status, failureReason }: { status: NotificationStatus; failureReason: string | null }) {
  const config = {
    PENDING: {
      icon: <Clock className="w-4 h-4" />,
      className: 'bg-yellow-100 text-yellow-800',
      label: 'Pending',
    },
    SENT: {
      icon: <CheckCircle2 className="w-4 h-4" />,
      className: 'bg-green-100 text-green-800',
      label: 'Sent',
    },
    DELIVERED: {
      icon: <CheckCircle2 className="w-4 h-4" />,
      className: 'bg-emerald-100 text-emerald-800',
      label: 'Delivered',
    },
    FAILED: {
      icon: <AlertCircle className="w-4 h-4" />,
      className: 'bg-red-100 text-red-800',
      label: 'Failed',
    },
    CANCELLED: {
      icon: <Ban className="w-4 h-4" />,
      className: 'bg-gray-100 text-gray-800',
      label: 'Cancelled',
    },
  }

  const { icon, className, label } = config[status]

  return (
    <div className="flex items-center gap-2">
      <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full ${className}`}>
        {icon}
        {label}
      </span>
      {failureReason && (
        <span className="text-xs text-red-600" title={failureReason}>
          ⚠️
        </span>
      )}
    </div>
  )
}

export default function AdminNotificationsPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            <p className="text-gray-600">Loading notifications...</p>
          </div>
        </div>
      }
    >
      <AdminNotificationsContent />
    </Suspense>
  )
}
