'use client'

import { useState } from 'react'
import ProtectedRoute from '@/components/auth/ProtectedRoute'
import Layout from '@/components/layout/Layout'
import { useAuthStore } from '@/store/auth.store'
import BookingRulesForm from '@/components/superadmin/BookingRulesForm'
import SpecialDaysCalendar from '@/components/superadmin/SpecialDaysCalendar'

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
          <h1 className="text-2xl font-bold text-gray-900">Booking Rules & Special Days</h1>
          <p className="text-gray-600">Configure booking windows, deposit policies, and special date rules</p>
        </div>

        {/* Booking Rules Form - NEWLY INTEGRATED */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Booking Rules & Deposit Policies</h2>
          <BookingRulesForm 
            adminId={user?.id || 'admin-id'} 
            onSuccess={() => console.log('Rules updated')}
          />
        </div>

        {/* Special Days Calendar - NEWLY INTEGRATED */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Special Days Calendar</h2>
          <SpecialDaysCalendar 
            adminId={user?.id || 'admin-id'}
            roomTypes={[]}
          />
        </div>

        {/* Info Card */}
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
          <p className="text-sm text-orange-800">
            ✅ <strong>Rules Components Integrated:</strong> BookingRulesForm for 3-2-1 booking windows
            and deposit policies, SpecialDaysCalendar for blocked dates and special rates. Connect to
            API endpoints (/api/superadmin/rules) for full functionality.
          </p>
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