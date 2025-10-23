'use client'

import { useState } from 'react'
import ProtectedRoute from '@/components/auth/ProtectedRoute'
import Layout from '@/components/layout/Layout'
import { useAuthStore } from '@/store/auth.store'

// ==========================================
// SUPERADMIN REPORTS PAGE
// ==========================================

function SuperAdminReportsContent() {
  const user = useAuthStore((state) => state.user)

  const handleLogout = () => {
    useAuthStore.getState().logout()
    window.location.href = '/login'
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
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Reports & Analytics</h1>
          <p className="text-gray-600">Generate comprehensive reports and view system analytics</p>
        </div>

        {/* Coming Soon Card */}
        <div className="bg-white rounded-xl shadow-md p-8 text-center">
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
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Reports & Analytics Coming Soon
          </h2>
          <p className="text-gray-600 mb-4">
            This feature will provide:
          </p>
          <ul className="text-left text-gray-600 space-y-2 max-w-md mx-auto">
            <li className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-green-600 rounded-full"></span>
              Financial performance reports
            </li>
            <li className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-green-600 rounded-full"></span>
              User activity analytics
            </li>
            <li className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-green-600 rounded-full"></span>
              System usage statistics
            </li>
            <li className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-green-600 rounded-full"></span>
              Custom report generation
            </li>
          </ul>
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