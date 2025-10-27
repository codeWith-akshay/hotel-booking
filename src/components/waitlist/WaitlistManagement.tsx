// ==========================================
// WAITLIST MANAGEMENT COMPONENT
// ==========================================
// Admin interface for managing waitlist entries

'use client'

import { useState, useEffect } from 'react'
import { format } from 'date-fns'
import { 
  Search, 
  Filter, 
  Bell, 
  CheckCircle, 
  XCircle, 
  Clock,
  Users,
  Calendar,
  MoreVertical,
  Send,
  Eye,
  TrendingUp,
  AlertCircle
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select-shadcn'
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Alert, AlertDescription } from '@/components/ui/alert'

import { 
  getWaitlistEntries,
  updateWaitlistStatus,
  notifyWaitlistUser,
  getWaitlistStats
} from '@/actions/waitlist/waitlist.action'
import { 
  type WaitlistEntryWithDetails,
  type WaitlistStats,
  type GetWaitlistEntriesInput
} from '@/lib/validation/waitlist.validation'

interface WaitlistManagementProps {
  userRole: 'ADMIN' | 'SUPERADMIN'
}

export function WaitlistManagement({ userRole }: WaitlistManagementProps) {
  // State management
  const [entries, setEntries] = useState<WaitlistEntryWithDetails[]>([])
  const [stats, setStats] = useState<WaitlistStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // Filtering and pagination
  const [filters, setFilters] = useState<GetWaitlistEntriesInput>({
    page: 1,
    limit: 20,
    sortBy: 'createdAt',
    sortOrder: 'desc',
  })
  const [pagination, setPagination] = useState({ total: 0, pages: 0 })
  
  // UI state
  const [selectedEntry, setSelectedEntry] = useState<WaitlistEntryWithDetails | null>(null)
  const [isNotifyDialogOpen, setIsNotifyDialogOpen] = useState(false)
  const [notifyMessage, setNotifyMessage] = useState('')
  const [expiresInHours, setExpiresInHours] = useState(24)
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  // Load data
  useEffect(() => {
    loadWaitlistData()
  }, [filters])

  useEffect(() => {
    loadStats()
  }, [])

  const loadWaitlistData = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const result = await getWaitlistEntries(filters)
      
      if (result.success && result.data) {
        setEntries(result.data.entries)
        setPagination({ total: result.data.total, pages: result.data.pages })
      } else {
        setError(result.error || 'Failed to load waitlist entries')
      }
    } catch (err) {
      setError('An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  const loadStats = async () => {
    try {
      const result = await getWaitlistStats()
      if (result.success && result.data) {
        setStats(result.data)
      }
    } catch (err) {
      console.error('Failed to load stats:', err)
    }
  }

  // Actions
  const handleStatusUpdate = async (entryId: string, status: string) => {
    try {
      setActionLoading(entryId)
      
      const result = await updateWaitlistStatus({ id: entryId, status: status as any })
      
      if (result.success) {
        loadWaitlistData()
        loadStats()
      } else {
        setError(result.error || 'Failed to update status')
      }
    } catch (err) {
      setError('An unexpected error occurred')
    } finally {
      setActionLoading(null)
    }
  }

  const handleNotifyUser = async () => {
    if (!selectedEntry) return

    try {
      setActionLoading(selectedEntry.id)
      
      const result = await notifyWaitlistUser({
        id: selectedEntry.id,
        message: notifyMessage,
        expiresInHours,
      })
      
      if (result.success) {
        setIsNotifyDialogOpen(false)
        setNotifyMessage('')
        setSelectedEntry(null)
        loadWaitlistData()
        loadStats()
      } else {
        setError(result.error || 'Failed to notify user')
      }
    } catch (err) {
      setError('An unexpected error occurred')
    } finally {
      setActionLoading(null)
    }
  }

  // Status configuration
  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'PENDING':
        return { icon: Clock, color: 'bg-yellow-100 text-yellow-800', label: 'Pending' }
      case 'NOTIFIED':
        return { icon: Bell, color: 'bg-blue-100 text-blue-800', label: 'Notified' }
      case 'CONVERTED':
        return { icon: CheckCircle, color: 'bg-green-100 text-green-800', label: 'Converted' }
      case 'EXPIRED':
        return { icon: XCircle, color: 'bg-gray-100 text-gray-800', label: 'Expired' }
      default:
        return { icon: AlertCircle, color: 'bg-gray-100 text-gray-800', label: 'Unknown' }
    }
  }

  if (loading && entries.length === 0) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-center">
          <Clock className="w-8 h-8 text-gray-400 mx-auto mb-2" />
          <p className="text-gray-600">Loading waitlist entries...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Entries</p>
                  <p className="text-2xl font-bold">{stats.total}</p>
                </div>
                <Users className="w-8 h-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Pending</p>
                  <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
                </div>
                <Clock className="w-8 h-8 text-yellow-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Conversion Rate</p>
                  <p className="text-2xl font-bold text-green-600">{stats.conversionRate}%</p>
                </div>
                <TrendingUp className="w-8 h-8 text-green-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Avg Wait Time</p>
                  <p className="text-2xl font-bold text-blue-600">{stats.avgWaitTime}d</p>
                </div>
                <Calendar className="w-8 h-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters and Search */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="w-5 h-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Label>Status</Label>
              <Select
                value={filters.status || 'all'}
                onValueChange={(value: string) => 
                  setFilters(prev => ({ 
                    ...prev, 
                    status: value === 'all' ? undefined : value as 'PENDING' | 'NOTIFIED' | 'CONVERTED' | 'EXPIRED',
                    page: 1 
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="PENDING">Pending</SelectItem>
                  <SelectItem value="NOTIFIED">Notified</SelectItem>
                  <SelectItem value="CONVERTED">Converted</SelectItem>
                  <SelectItem value="EXPIRED">Expired</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label>Sort By</Label>
              <Select
                value={filters.sortBy}
                onValueChange={(value: string) => 
                  setFilters(prev => ({ ...prev, sortBy: value as 'createdAt' | 'startDate' | 'status' | 'guests' }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="createdAt">Created Date</SelectItem>
                  <SelectItem value="startDate">Check-in Date</SelectItem>
                  <SelectItem value="status">Status</SelectItem>
                  <SelectItem value="guests">Number of Guests</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label>Order</Label>
              <Select
                value={filters.sortOrder}
                onValueChange={(value: string) => 
                  setFilters(prev => ({ ...prev, sortOrder: value as 'asc' | 'desc' }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="desc">Newest First</SelectItem>
                  <SelectItem value="asc">Oldest First</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label>Entries Per Page</Label>
              <Select
                value={filters.limit?.toString() || '20'}
                onValueChange={(value: string) => 
                  setFilters(prev => ({ ...prev, limit: parseInt(value), page: 1 }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="20">20</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                  <SelectItem value="100">100</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="w-4 h-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Waitlist Table */}
      <Card>
        <CardHeader>
          <CardTitle>Waitlist Entries</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Guest</TableHead>
                <TableHead>Dates</TableHead>
                <TableHead>Room Type</TableHead>
                <TableHead>Guests</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {entries.map((entry) => {
                const statusConfig = getStatusConfig(entry.status)
                const StatusIcon = statusConfig.icon
                
                return (
                  <TableRow key={entry.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{entry.user.name}</p>
                        <p className="text-sm text-gray-600">{entry.user.phone}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <p>{format(new Date(entry.startDate), 'MMM dd')}</p>
                        <p>{format(new Date(entry.endDate), 'MMM dd, yyyy')}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      {entry.roomType?.name || 'Any Type'}
                    </TableCell>
                    <TableCell>
                      {entry.guests} {entry.guestType.toLowerCase()}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={statusConfig.color}>
                        <StatusIcon className="w-3 h-3 mr-1" />
                        {statusConfig.label}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {format(new Date(entry.createdAt), 'MMM dd, yyyy')}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            disabled={actionLoading === entry.id}
                          >
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {entry.status === 'PENDING' && (
                            <DropdownMenuItem
                              onClick={() => {
                                setSelectedEntry(entry)
                                setIsNotifyDialogOpen(true)
                              }}
                            >
                              <Send className="w-4 h-4 mr-2" />
                              Notify Available
                            </DropdownMenuItem>
                          )}
                          
                          {entry.status === 'NOTIFIED' && (
                            <DropdownMenuItem
                              onClick={() => handleStatusUpdate(entry.id, 'CONVERTED')}
                            >
                              <CheckCircle className="w-4 h-4 mr-2" />
                              Mark Converted
                            </DropdownMenuItem>
                          )}
                          
                          {(entry.status === 'PENDING' || entry.status === 'NOTIFIED') && (
                            <DropdownMenuItem
                              onClick={() => handleStatusUpdate(entry.id, 'EXPIRED')}
                              className="text-red-600"
                            >
                              <XCircle className="w-4 h-4 mr-2" />
                              Mark Expired
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
          
          {entries.length === 0 && !loading && (
            <div className="text-center py-8 text-gray-500">
              No waitlist entries found
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      {pagination.pages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-600">
            Showing {((filters.page || 1) - 1) * (filters.limit || 20) + 1} to{' '}
            {Math.min((filters.page || 1) * (filters.limit || 20), pagination.total)} of{' '}
            {pagination.total} entries
          </p>
          
          <div className="flex gap-2">
            <Button
              variant="outline"
              disabled={(filters.page || 1) <= 1}
              onClick={() => setFilters(prev => ({ ...prev, page: (prev.page || 1) - 1 }))}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              disabled={(filters.page || 1) >= pagination.pages}
              onClick={() => setFilters(prev => ({ ...prev, page: (prev.page || 1) + 1 }))}
            >
              Next
            </Button>
          </div>
        </div>
      )}

      {/* Notify User Dialog */}
      <Dialog open={isNotifyDialogOpen} onOpenChange={setIsNotifyDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Notify User of Availability</DialogTitle>
            <DialogDescription>
              Send a notification to {selectedEntry?.user.name} about room availability
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="expiresInHours">Response Time (hours)</Label>
              <Input
                id="expiresInHours"
                type="number"
                min="1"
                max="168"
                value={expiresInHours}
                onChange={(e) => setExpiresInHours(parseInt(e.target.value) || 24)}
              />
            </div>
            
            <div>
              <Label htmlFor="message">Message</Label>
              <Textarea
                id="message"
                placeholder="Good news! A room is now available for your dates..."
                value={notifyMessage}
                onChange={(e) => setNotifyMessage(e.target.value)}
                rows={4}
              />
            </div>
            
            <div className="flex gap-3 pt-4">
              <Button
                variant="outline"
                onClick={() => {
                  setIsNotifyDialogOpen(false)
                  setNotifyMessage('')
                  setSelectedEntry(null)
                }}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={handleNotifyUser}
                disabled={!notifyMessage.trim() || actionLoading === selectedEntry?.id}
                className="flex-1"
              >
                {actionLoading === selectedEntry?.id ? 'Sending...' : 'Send Notification'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}