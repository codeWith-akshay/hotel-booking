'use client'

import { useState } from 'react'
import ProtectedRoute from '@/components/auth/ProtectedRoute'
import Layout from '@/components/layout/Layout'
import { useAuthStore } from '@/store/auth.store'
import { ReportFilters } from '@/components/superadmin/ReportFilters'
import { ExportButtons } from '@/components/superadmin/ExportButtons'

// ==========================================
// SUPERADMIN REPORTS PAGE
// ==========================================

function SuperAdminReportsContent() {
  const user = useAuthStore((state) => state.user)
  const [reportType] = useState<'revenue' | 'occupancy' | 'bookings' | 'waitlist'>('revenue')
  const [startDate, setStartDate] = useState<string>('')
  const [endDate, setEndDate] = useState<string>('')
  const [roomTypeId, setRoomTypeId] = useState<string | undefined>(undefined)

  const handleLogout = () => {
    useAuthStore.getState().logout()
    window.location.href = '/login'
  }

  const handleApplyFilters = () => {
    console.log('Applying filters:', { reportType, startDate, endDate, roomTypeId })
  }

  const handleResetFilters = () => {
    setStartDate('')
    setEndDate('')
    setRoomTypeId(undefined)
  }

  const handleExportSuccess = (filename: string) => {
    console.log('Export successful:', filename)
  }

  const handleExportError = (error: string) => {
    console.error('Export error:', error)
  }

  return (
    <Layout
      user={{
        name: user?.name || 'Super Admin',
        email: user?.email || user?.phone || '',
        role: user?.role || 'SUPERADMIN',
      }}
      config={{
        showSidebar: true,
        showFooter: true,
      }}
      onLogout={handleLogout}
    >
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Reports & Analytics</h1>
            <p className="text-gray-600">Generate comprehensive reports and export data</p>
          </div>
          
          {/* Export Buttons - NEWLY INTEGRATED */}
          <ExportButtons
            reportType={reportType}
            startDate={startDate}
            endDate={endDate}
            roomTypeId={roomTypeId}
            adminId={user?.id || 'admin-id'}
            onExportSuccess={handleExportSuccess}
            onExportError={handleExportError}
          />
        </div>

        {/* Report Filters - NEWLY INTEGRATED */}
        <ReportFilters
          startDate={startDate}
          endDate={endDate}
          roomTypeId={roomTypeId}
          onStartDateChange={setStartDate}
          onEndDateChange={setEndDate}
          onRoomTypeChange={setRoomTypeId}
          onApply={handleApplyFilters}
          onReset={handleResetFilters}
        />

        {/* Report Display Area */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg
                className="w-8 h-8 text-green-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Select filters and generate report
            </h3>
            <p className="text-gray-600 max-w-md mx-auto">
              Choose date range, room type, and click "Apply Filters" to generate reports.
              Use the export buttons above to download reports in CSV or PDF format.
            </p>
          </div>
        </div>

        {/* Components Info */}
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <p className="text-sm text-green-800">
            ✅ <strong>Report Components Integrated:</strong> ReportFilters and ExportButtons
            are now active. Connect to reporting API (/api/superadmin/reports/export) to fetch and display actual data.
          </p>
        </div>
      </div>
    </Layout>
  )
}

export default function SuperAdminReportsPage() {
  return (
    <ProtectedRoute allowedRoles={['SUPERADMIN']}>
      <SuperAdminReportsContent />
    </ProtectedRoute>
  )
}