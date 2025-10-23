'use client'

import { useState } from 'react'
import ProtectedRoute from '@/components/auth/ProtectedRoute'
import Layout from '@/components/layout/Layout'
import { useAuthStore } from '@/store/auth.store'

// ==========================================
// ADMIN BOOKINGS PAGE
// ==========================================

function AdminBookingsContent() {
  const user = useAuthStore((state) => state.user)
  const [bookings] = useState([])

  const handleLogout = () => {
    useAuthStore.getState().logout()
    window.location.href = '/login'
  }

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
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Booking Management</h1>
          <p className="text-gray-600">Manage all hotel bookings and reservations</p>
        </div>

        {/* Coming Soon Card */}
        <div className="bg-white rounded-xl shadow-md p-8 text-center">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-8 h-8 text-blue-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
              />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Booking Management Coming Soon
          </h2>
          <p className="text-gray-600 mb-4">
            This feature is currently under development. You'll be able to:
          </p>
          <ul className="text-left text-gray-600 space-y-2 max-w-md mx-auto">
            <li className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-blue-600 rounded-full"></span>
              View all customer bookings
            </li>
            <li className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-blue-600 rounded-full"></span>
              Modify booking details
            </li>
            <li className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-blue-600 rounded-full"></span>
              Handle cancellations and refunds
            </li>
            <li className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-blue-600 rounded-full"></span>
              Generate booking reports
            </li>
          </ul>
        </div>
      </div>
    </Layout>
  )
}

export default function AdminBookingsPage() {
  return (
    <ProtectedRoute allowedRoles={['ADMIN', 'SUPERADMIN']}>
      <AdminBookingsContent />
    </ProtectedRoute>
  )
}