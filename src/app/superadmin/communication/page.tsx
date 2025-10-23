'use client'

import { useState } from 'react'
import ProtectedRoute from '@/components/auth/ProtectedRoute'
import Layout from '@/components/layout/Layout'
import { useAuthStore } from '@/store/auth.store'

// ==========================================
// SUPERADMIN COMMUNICATION PAGE
// ==========================================

function SuperAdminCommunicationContent() {
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
          <h1 className="text-2xl font-bold text-gray-900">Communication Center</h1>
          <p className="text-gray-600">Manage system notifications, announcements, and user communications</p>
        </div>

        {/* Coming Soon Card */}
        <div className="bg-white rounded-xl shadow-md p-8 text-center">
          <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-8 h-8 text-purple-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
              />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Communication Center Coming Soon
          </h2>
          <p className="text-gray-600 mb-4">
            This feature will enable you to:
          </p>
          <ul className="text-left text-gray-600 space-y-2 max-w-md mx-auto">
            <li className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-purple-600 rounded-full"></span>
              Send system-wide announcements
            </li>
            <li className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-purple-600 rounded-full"></span>
              Manage email templates
            </li>
            <li className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-purple-600 rounded-full"></span>
              Monitor communication logs
            </li>
            <li className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-purple-600 rounded-full"></span>
              Configure notification settings
            </li>
          </ul>
        </div>
      </div>
    </Layout>
  )
}

export default function SuperAdminCommunicationPage() {
  return (
    <ProtectedRoute allowedRoles={['SUPERADMIN']}>
      <SuperAdminCommunicationContent />
    </ProtectedRoute>
  )
}