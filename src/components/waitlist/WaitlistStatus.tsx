// ==========================================
// WAITLIST STATUS COMPONENT
// ==========================================
// Display waitlist entry status and details for users

'use client'

import { useState } from 'react'
import { format, formatDistanceToNow } from 'date-fns'
import { 
  Clock, 
  Calendar, 
  Users, 
  Bell, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  Eye,
  MoreVertical,
  Trash2
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
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

import { cancelWaitlistEntry } from '@/actions/waitlist/waitlist.action'
import { type WaitlistEntryWithDetails } from '@/lib/validation/waitlist.validation'

interface WaitlistStatusProps {
  userId: string
  entry: WaitlistEntryWithDetails
  onEntryUpdated?: () => void
  showActions?: boolean
}

export function WaitlistStatus({ 
  userId, 
  entry, 
  onEntryUpdated,
  showActions = true 
}: WaitlistStatusProps) {
  const [isDetailsOpen, setIsDetailsOpen] = useState(false)
  const [isCancelling, setIsCancelling] = useState(false)
  const [cancelError, setCancelError] = useState<string | null>(null)

  // Status configuration
  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'PENDING':
        return {
          icon: Clock,
          color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
          label: 'Waiting',
          description: 'Your request is in the queue'
        }
      case 'NOTIFIED':
        return {
          icon: Bell,
          color: 'bg-blue-100 text-blue-800 border-blue-200',
          label: 'Notified',
          description: 'Room available! Please respond soon'
        }
      case 'CONVERTED':
        return {
          icon: CheckCircle,
          color: 'bg-green-100 text-green-800 border-green-200',
          label: 'Booked',
          description: 'Successfully converted to booking'
        }
      case 'EXPIRED':
        return {
          icon: XCircle,
          color: 'bg-gray-100 text-gray-800 border-gray-200',
          label: 'Expired',
          description: 'Request has expired'
        }
      default:
        return {
          icon: AlertCircle,
          color: 'bg-gray-100 text-gray-800 border-gray-200',
          label: 'Unknown',
          description: 'Status unknown'
        }
    }
  }

  const statusConfig = getStatusConfig(entry.status)
  const StatusIcon = statusConfig.icon

  // Calculate time remaining for notified entries
  const getTimeRemaining = () => {
    if (entry.status === 'NOTIFIED' && entry.expiresAt) {
      const now = new Date()
      const expiresAt = new Date(entry.expiresAt)
      
      if (expiresAt > now) {
        return formatDistanceToNow(expiresAt, { addSuffix: true })
      } else {
        return 'Expired'
      }
    }
    return null
  }

  const timeRemaining = getTimeRemaining()

  const handleCancel = async () => {
    try {
      setIsCancelling(true)
      setCancelError(null)

      const result = await cancelWaitlistEntry(userId, entry.id)

      if (result.success) {
        onEntryUpdated?.()
      } else {
        setCancelError(result.error || 'Failed to cancel waitlist entry')
      }
    } catch (error) {
      setCancelError('An unexpected error occurred')
    } finally {
      setIsCancelling(false)
    }
  }

  const canCancel = entry.status === 'PENDING' || entry.status === 'NOTIFIED'

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-full ${statusConfig.color}`}>
              <StatusIcon className="w-4 h-4" />
            </div>
            <div>
              <CardTitle className="text-lg">
                {entry.roomType?.name || 'Any Room Type'}
              </CardTitle>
              <p className="text-sm text-gray-600">
                {statusConfig.description}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Badge variant="outline" className={statusConfig.color}>
              {statusConfig.label}
            </Badge>
            
            {showActions && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm">
                    <MoreVertical className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => setIsDetailsOpen(true)}>
                    <Eye className="w-4 h-4 mr-2" />
                    View Details
                  </DropdownMenuItem>
                  {canCancel && (
                    <DropdownMenuItem 
                      onClick={handleCancel}
                      disabled={isCancelling}
                      className="text-red-600"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      {isCancelling ? 'Cancelling...' : 'Cancel Request'}
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Booking Details */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-gray-500" />
            <span>
              {format(new Date(entry.startDate), 'MMM dd')} - {format(new Date(entry.endDate), 'MMM dd, yyyy')}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-gray-500" />
            <span>{entry.guests} {entry.guestType.toLowerCase()}</span>
          </div>
          <div className="text-gray-500">
            Requested {formatDistanceToNow(new Date(entry.createdAt), { addSuffix: true })}
          </div>
        </div>

        {/* Time-sensitive alerts */}
        {entry.status === 'NOTIFIED' && timeRemaining && (
          <Alert className="border-blue-200 bg-blue-50">
            <Bell className="w-4 h-4" />
            <AlertDescription>
              <span className="font-medium">Room Available!</span>
              {timeRemaining !== 'Expired' ? (
                <span> Please respond {timeRemaining} to secure your booking.</span>
              ) : (
                <span className="text-red-600"> This offer has expired.</span>
              )}
            </AlertDescription>
          </Alert>
        )}

        {/* Notification timestamp */}
        {entry.status === 'NOTIFIED' && entry.notifiedAt && (
          <div className="text-sm text-gray-600">
            Notified {formatDistanceToNow(new Date(entry.notifiedAt), { addSuffix: true })}
          </div>
        )}

        {/* Error display */}
        {cancelError && (
          <Alert variant="destructive">
            <AlertDescription>{cancelError}</AlertDescription>
          </Alert>
        )}
      </CardContent>

      {/* Details Dialog */}
      <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Waitlist Entry Details</DialogTitle>
            <DialogDescription>
              Complete information about your waitlist request
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6">
            {/* Status Timeline */}
            <div>
              <h4 className="font-medium mb-3">Status</h4>
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-full ${statusConfig.color}`}>
                    <StatusIcon className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="font-medium">{statusConfig.label}</span>
                    <p className="text-sm text-gray-600">{statusConfig.description}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Booking Information */}
            <div>
              <h4 className="font-medium mb-3">Booking Information</h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-500">Check-in:</span>
                  <p>{format(new Date(entry.startDate), 'EEEE, MMMM dd, yyyy')}</p>
                </div>
                <div>
                  <span className="text-gray-500">Check-out:</span>
                  <p>{format(new Date(entry.endDate), 'EEEE, MMMM dd, yyyy')}</p>
                </div>
                <div>
                  <span className="text-gray-500">Guests:</span>
                  <p>{entry.guests} {entry.guestType.toLowerCase()}</p>
                </div>
                <div>
                  <span className="text-gray-500">Room Type:</span>
                  <p>{entry.roomType?.name || 'Any Available'}</p>
                </div>
                {entry.deposit > 0 && (
                  <div>
                    <span className="text-gray-500">Deposit:</span>
                    <p>${entry.deposit}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Special Requests */}
            {entry.notes && (
              <div>
                <h4 className="font-medium mb-3">Special Requests</h4>
                <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded-lg">
                  {entry.notes}
                </p>
              </div>
            )}

            {/* Timeline */}
            <div>
              <h4 className="font-medium mb-3">Timeline</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Request submitted:</span>
                  <span>{format(new Date(entry.createdAt), 'MMM dd, yyyy at h:mm a')}</span>
                </div>
                {entry.notifiedAt && (
                  <div className="flex justify-between">
                    <span>Notified of availability:</span>
                    <span>{format(new Date(entry.notifiedAt), 'MMM dd, yyyy at h:mm a')}</span>
                  </div>
                )}
                {entry.expiresAt && entry.status === 'NOTIFIED' && (
                  <div className="flex justify-between">
                    <span>Response deadline:</span>
                    <span className={timeRemaining === 'Expired' ? 'text-red-600' : ''}>
                      {format(new Date(entry.expiresAt), 'MMM dd, yyyy at h:mm a')}
                    </span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span>Last updated:</span>
                  <span>{format(new Date(entry.updatedAt), 'MMM dd, yyyy at h:mm a')}</span>
                </div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  )
}