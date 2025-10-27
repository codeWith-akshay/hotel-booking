// ==========================================
// USER WAITLIST PAGE
// ==========================================
// User interface for viewing and managing their waitlist entries

'use client'

import { useState, useEffect } from 'react'
import { Clock, Calendar, Plus, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { WaitlistStatus, WaitlistForm } from '@/components/waitlist'
import { getUserWaitlist } from '@/actions/waitlist/waitlist.action'
import { type WaitlistEntryWithDetails } from '@/lib/validation/waitlist.validation'

interface UserWaitlistPageProps {
  params: {
    userId: string
  }
}

export default function UserWaitlistPage({ params }: UserWaitlistPageProps) {
  const [waitlistEntries, setWaitlistEntries] = useState<WaitlistEntryWithDetails[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isNewWaitlistOpen, setIsNewWaitlistOpen] = useState(false)

  // Load waitlist entries
  const loadWaitlistEntries = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const result = await getUserWaitlist(params.userId)
      
      if (result.success && result.data) {
        setWaitlistEntries(result.data)
      } else {
        setError(result.error || 'Failed to load waitlist entries')
      }
    } catch (err) {
      setError('An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadWaitlistEntries()
  }, [params.userId])

  const handleEntryUpdated = () => {
    loadWaitlistEntries()
  }

  const handleNewWaitlistSuccess = () => {
    setIsNewWaitlistOpen(false)
    loadWaitlistEntries()
  }

  // Filter entries by status
  const activeEntries = waitlistEntries.filter(entry => 
    entry.status === 'PENDING' || entry.status === 'NOTIFIED'
  )
  const completedEntries = waitlistEntries.filter(entry => 
    entry.status === 'CONVERTED' || entry.status === 'EXPIRED'
  )

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">My Waitlist</h1>
            <p className="text-gray-600 mt-1">Loading your waitlist entries...</p>
          </div>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-6 bg-gray-200 rounded w-3/4" />
                <div className="h-4 bg-gray-200 rounded w-1/2" />
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="h-4 bg-gray-200 rounded" />
                  <div className="h-4 bg-gray-200 rounded w-2/3" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">My Waitlist</h1>
          <p className="text-gray-600 mt-1">
            Track your room availability requests and notifications
          </p>
        </div>
        
        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={loadWaitlistEntries}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          
          <Dialog open={isNewWaitlistOpen} onOpenChange={setIsNewWaitlistOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                New Waitlist Request
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Create Waitlist Request</DialogTitle>
              </DialogHeader>
              <WaitlistForm
                userId={params.userId}
                startDate={new Date()}
                endDate={new Date(Date.now() + 24 * 60 * 60 * 1000)} // Tomorrow
                guests={2}
                onSuccess={handleNewWaitlistSuccess}
                onCancel={() => setIsNewWaitlistOpen(false)}
              />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Requests</p>
                <p className="text-2xl font-bold">{waitlistEntries.length}</p>
              </div>
              <Calendar className="w-8 h-8 text-gray-400" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Active</p>
                <p className="text-2xl font-bold text-blue-600">{activeEntries.length}</p>
              </div>
              <Clock className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Completed</p>
                <p className="text-2xl font-bold text-green-600">
                  {completedEntries.filter(e => e.status === 'CONVERTED').length}
                </p>
              </div>
              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                <span className="text-green-600 text-lg">✓</span>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Expired</p>
                <p className="text-2xl font-bold text-gray-600">
                  {completedEntries.filter(e => e.status === 'EXPIRED').length}
                </p>
              </div>
              <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                <span className="text-gray-600 text-lg">×</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Active Waitlist Entries */}
      {activeEntries.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-4">
            <h2 className="text-xl font-semibold text-gray-900">Active Requests</h2>
            <Badge variant="outline" className="bg-blue-50 text-blue-700">
              {activeEntries.length}
            </Badge>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {activeEntries.map((entry) => (
              <WaitlistStatus
                key={entry.id}
                userId={params.userId}
                entry={entry}
                onEntryUpdated={handleEntryUpdated}
                showActions={true}
              />
            ))}
          </div>
        </div>
      )}

      {/* Completed Waitlist Entries */}
      {completedEntries.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-4">
            <h2 className="text-xl font-semibold text-gray-900">Completed Requests</h2>
            <Badge variant="outline" className="bg-gray-50 text-gray-700">
              {completedEntries.length}
            </Badge>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {completedEntries.map((entry) => (
              <WaitlistStatus
                key={entry.id}
                userId={params.userId}
                entry={entry}
                onEntryUpdated={handleEntryUpdated}
                showActions={false}
              />
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {waitlistEntries.length === 0 && !loading && !error && (
        <Card className="p-8 text-center">
          <Clock className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            No Waitlist Requests Yet
          </h3>
          <p className="text-gray-600 mb-4">
            You haven't created any waitlist requests. When rooms you want aren't available, 
            join our waitlist to be notified when they become available.
          </p>
          <Button
            onClick={() => setIsNewWaitlistOpen(true)}
            className="inline-flex items-center"
          >
            <Plus className="h-4 w-4 mr-2" />
            Create Your First Request
          </Button>
        </Card>
      )}

      {/* Help Information */}
      <Card className="border-blue-200 bg-blue-50">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <Clock className="w-5 h-5 text-blue-600 mt-0.5" />
            <div>
              <h3 className="font-medium text-blue-900 mb-1">How Waitlist Works</h3>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>• Join waitlist when your preferred rooms aren't available</li>
                <li>• We'll notify you immediately when rooms become available</li>
                <li>• You have 24 hours to respond to availability notifications</li>
                <li>• Track all your requests and their status in this dashboard</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}