'use client'

import { useState } from 'react'
import ProtectedRoute from '@/components/auth/ProtectedRoute'
import Layout from '@/components/layout/Layout'
import { useAuthStore } from '@/store/auth.store'
import BulkMessageForm from '@/components/superadmin/BulkMessageForm'

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
          <p className="text-gray-600">Send bulk messages via WhatsApp or Email</p>
        </div>

        {/* Bulk Message Form */}
        <BulkMessageForm adminId={user?.id || 'admin-id'} />
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