'use client'

import { useState } from 'react'
import ProtectedRoute from '@/components/auth/ProtectedRoute'
import Layout from '@/components/layout/Layout'
import { useAuthStore } from '@/store/auth.store'

// ==========================================
// SUPERADMIN RULES PAGE
// ==========================================

function SuperAdminRulesContent() {
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
          <h1 className="text-2xl font-bold text-gray-900">System Rules & Policies</h1>
          <p className="text-gray-600">Configure business rules, policies, and system constraints</p>
        </div>

        {/* Coming Soon Card */}
        <div className="bg-white rounded-xl shadow-md p-8 text-center">
          <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-8 h-8 text-orange-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
              />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            System Rules Coming Soon
          </h2>
          <p className="text-gray-600 mb-4">
            This feature will allow you to:
          </p>
          <ul className="text-left text-gray-600 space-y-2 max-w-md mx-auto">
            <li className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-orange-600 rounded-full"></span>
              Configure booking policies
            </li>
            <li className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-orange-600 rounded-full"></span>
              Set pricing rules
            </li>
            <li className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-orange-600 rounded-full"></span>
              Manage cancellation policies
            </li>
            <li className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-orange-600 rounded-full"></span>
              Define access permissions
            </li>
          </ul>
        </div>
      </div>
    </Layout>
  )
}

export default function SuperAdminRulesPage() {
  return (
    <ProtectedRoute allowedRoles={['SUPERADMIN']}>
      <SuperAdminRulesContent />
    </ProtectedRoute>
  )
}