// ==========================================
// NOTIFICATIONS DASHBOARD PAGE
// ==========================================
// SuperAdmin view for monitoring notification status and logs

'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import ProtectedRoute from '@/components/auth/ProtectedRoute'
import Layout from '@/components/layout/Layout'
import Header from '@/components/layout/Header'
import { useAuthStore } from '@/store/auth.store'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, RefreshCw, Send, AlertCircle, CheckCircle, XCircle, Clock } from 'lucide-react'
import { format } from 'date-fns'

// ==========================================
// TYPES
// ==========================================

interface Notification {
  id: string
  userId: string
  type: string
  channel: string
  subject?: string
  message: string
  status: 'PENDING' | 'SENT' | 'FAILED'
  sentAt?: string
  errorMessage?: string
  createdAt: string
  updatedAt: string
  user: {
    name: string
    email?: string
    phone?: string
  }
  metadata?: any
}

interface NotificationStats {
  total: number
  pending: number
  sent: number
  failed: number
  today: number
}

// ==========================================
// MAIN COMPONENT
// ==========================================

export default function NotificationsDashboard() {
  const router = useRouter()
  const { user, logout } = useAuthStore()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [stats, setStats] = useState<NotificationStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState('all')

  const handleLogout = () => {
    logout()
    router.push('/login')
  }

  // ==========================================
  // DATA FETCHING
  // ==========================================

  const fetchNotifications = async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch('/api/notifications/admin/list')
      if (!response.ok) {
        throw new Error('Failed to fetch notifications')
      }

      const data = await response.json()
      setNotifications(data.notifications || [])
      setStats(data.stats || null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load notifications')
    } finally {
      setLoading(false)
    }
  }

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/notifications/admin/stats')
      if (!response.ok) {
        throw new Error('Failed to fetch stats')
      }

      const data = await response.json()
      setStats(data.stats)
    } catch (err) {
      console.error('Failed to fetch stats:', err)
    }
  }

  // ==========================================
  // ACTIONS
  // ==========================================

  const processPendingNotifications = async () => {
    try {
      setProcessing(true)
      setError(null)

      const response = await fetch('/api/notifications/admin/process-pending', {
        method: 'POST',
      })

      if (!response.ok) {
        throw new Error('Failed to process notifications')
      }

      const result = await response.json()

      if (result.success) {
        // Refresh data
        await fetchNotifications()
        await fetchStats()
      } else {
        setError(result.message || 'Failed to process notifications')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to process notifications')
    } finally {
      setProcessing(false)
    }
  }

  const triggerCheckInReminders = async () => {
    try {
      setProcessing(true)
      setError(null)

      const response = await fetch('/api/scheduler/checkin-reminders', {
        method: 'POST',
      })

      if (!response.ok) {
        throw new Error('Failed to trigger check-in reminders')
      }

      const result = await response.json()

      if (result.success) {
        // Refresh data
        await fetchNotifications()
        await fetchStats()
      } else {
        setError(result.message || 'Failed to trigger reminders')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to trigger reminders')
    } finally {
      setProcessing(false)
    }
  }

  // ==========================================
  // FILTERING
  // ==========================================

  const getFilteredNotifications = () => {
    switch (activeTab) {
      case 'pending':
        return notifications.filter(n => n.status === 'PENDING')
      case 'sent':
        return notifications.filter(n => n.status === 'SENT')
      case 'failed':
        return notifications.filter(n => n.status === 'FAILED')
      default:
        return notifications
    }
  }

  // ==========================================
  // HELPERS
  // ==========================================

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'SENT':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'FAILED':
        return <XCircle className="h-4 w-4 text-red-500" />
      case 'PENDING':
        return <Clock className="h-4 w-4 text-yellow-500" />
      default:
        return <AlertCircle className="h-4 w-4 text-gray-500" />
    }
  }

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      SENT: 'default',
      FAILED: 'destructive',
      PENDING: 'secondary',
    }

    return (
      <Badge variant={variants[status] || 'outline'}>
        {status}
      </Badge>
    )
  }

  const getChannelBadge = (channel: string) => {
    return (
      <Badge variant="outline">
        {channel}
      </Badge>
    )
  }

  // ==========================================
  // EFFECTS
  // ==========================================

  useEffect(() => {
    fetchNotifications()
  }, [])

  // ==========================================
  // RENDER
  // ==========================================

  if (loading && !notifications.length) {
    return (
      <ProtectedRoute allowedRoles={['SUPERADMIN']}>
        {user && (
          <>
            <Header 
              user={user}
              onLogout={handleLogout}
              showNotifications={true}
              onNotificationClick={() => router.push('/superadmin/notifications')}
            />
            
            <Layout
              user={user}
              onLogout={handleLogout}
              config={{ showHeader: false }}
            >
              <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="h-8 w-8 animate-spin" />
              </div>
            </Layout>
          </>
        )}
      </ProtectedRoute>
    )
  }

  return (
    <ProtectedRoute allowedRoles={['SUPERADMIN']}>
      {user && (
        <>
          <Header 
            user={user}
            onLogout={handleLogout}
            showNotifications={true}
            onNotificationClick={() => router.push('/superadmin/notifications')}
          />
          
          <Layout
            user={user}
            onLogout={handleLogout}
            config={{ showHeader: false }}
          >
        
        <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Notifications Dashboard</h1>
          <p className="text-muted-foreground">
            Monitor and manage notification delivery
          </p>
        </div>

        <div className="flex gap-2">
          <Button
            onClick={triggerCheckInReminders}
            disabled={processing}
            variant="outline"
          >
            {processing ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <Send className="h-4 w-4 mr-2" />
            )}
            Send Check-in Reminders
          </Button>

          <Button
            onClick={processPendingNotifications}
            disabled={processing}
          >
            {processing ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <RefreshCw className="h-4 w-4 mr-2" />
            )}
            Process Pending
          </Button>

          <Button
            onClick={fetchNotifications}
            disabled={loading}
            variant="outline"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending</CardTitle>
              <Clock className="h-4 w-4 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Sent</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.sent}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Failed</CardTitle>
              <XCircle className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{stats.failed}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Today</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.today}</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Notifications Table */}
      <Card>
        <CardHeader>
          <CardTitle>Notification History</CardTitle>
          <CardDescription>
            Recent notifications and their delivery status
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList>
              <TabsTrigger value="all">All ({notifications.length})</TabsTrigger>
              <TabsTrigger value="pending">
                Pending ({notifications.filter(n => n.status === 'PENDING').length})
              </TabsTrigger>
              <TabsTrigger value="sent">
                Sent ({notifications.filter(n => n.status === 'SENT').length})
              </TabsTrigger>
              <TabsTrigger value="failed">
                Failed ({notifications.filter(n => n.status === 'FAILED').length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value={activeTab} className="mt-4">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Status</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Channel</TableHead>
                    <TableHead>User</TableHead>
                    <TableHead>Subject</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Sent</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {getFilteredNotifications().map((notification) => (
                    <TableRow key={notification.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getStatusIcon(notification.status)}
                          {getStatusBadge(notification.status)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{notification.type}</Badge>
                      </TableCell>
                      <TableCell>
                        {getChannelBadge(notification.channel)}
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{notification.user.name}</div>
                          <div className="text-sm text-muted-foreground">
                            {notification.user.email || notification.user.phone}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="max-w-xs truncate">
                          {notification.subject || 'No subject'}
                        </div>
                      </TableCell>
                      <TableCell>
                        {format(new Date(notification.createdAt), 'MMM dd, HH:mm')}
                      </TableCell>
                      <TableCell>
                        {notification.sentAt
                          ? format(new Date(notification.sentAt), 'MMM dd, HH:mm')
                          : '-'
                        }
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {getFilteredNotifications().length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  No notifications found
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
            </div>
          </Layout>
        </>
      )}
    </ProtectedRoute>
  )
}