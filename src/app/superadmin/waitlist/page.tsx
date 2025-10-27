// ==========================================
// SUPERADMIN WAITLIST PAGE
// ==========================================
// Superadmin interface for managing waitlist entries

import { Metadata } from 'next'
import { WaitlistManagement } from '@/components/waitlist'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Clock, TrendingUp, Users, Bell, BarChart3, Calendar } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Waitlist Management | Hotel SuperAdmin',
  description: 'Advanced waitlist management and analytics',
}

export default function SuperAdminWaitlistPage() {
  // User role from ProtectedRoute - SUPERADMIN
  const userRole = 'SUPERADMIN' as const

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Waitlist Analytics & Management</h1>
          <p className="text-gray-600 mt-1">
            Comprehensive waitlist management with advanced analytics and insights
          </p>
        </div>
      </div>

      {/* Enhanced Stats Preview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Pending</p>
                <p className="text-2xl font-bold text-yellow-600">-</p>
              </div>
              <Clock className="w-6 h-6 text-yellow-600" />
            </div>
            <p className="text-xs text-gray-500 mt-1">Waiting</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Notified</p>
                <p className="text-2xl font-bold text-blue-600">-</p>
              </div>
              <Bell className="w-6 h-6 text-blue-600" />
            </div>
            <p className="text-xs text-gray-500 mt-1">Awaiting response</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Converted</p>
                <p className="text-2xl font-bold text-green-600">-</p>
              </div>
              <TrendingUp className="w-6 h-6 text-green-600" />
            </div>
            <p className="text-xs text-gray-500 mt-1">Success rate</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Expired</p>
                <p className="text-2xl font-bold text-red-600">-</p>
              </div>
              <Calendar className="w-6 h-6 text-red-600" />
            </div>
            <p className="text-xs text-gray-500 mt-1">Timeout</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Avg Wait</p>
                <p className="text-2xl font-bold text-purple-600">-</p>
              </div>
              <BarChart3 className="w-6 h-6 text-purple-600" />
            </div>
            <p className="text-xs text-gray-500 mt-1">Days</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total</p>
                <p className="text-2xl font-bold text-gray-900">-</p>
              </div>
              <Users className="w-6 h-6 text-gray-600" />
            </div>
            <p className="text-xs text-gray-500 mt-1">All entries</p>
          </CardContent>
        </Card>
      </div>

      {/* Advanced Features Notice */}
      <Card className="border-blue-200 bg-blue-50">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <BarChart3 className="w-5 h-5 text-blue-600" />
            <div>
              <h3 className="font-medium text-blue-900">SuperAdmin Features</h3>
              <p className="text-sm text-blue-700">
                Advanced analytics, bulk operations, and system-wide waitlist management capabilities
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Waitlist Management Component */}
      <WaitlistManagement userRole={userRole} />
    </div>
  )
}