// ==========================================
// CREATE ADMIN USER PAGE
// ==========================================
// SuperAdmin can create new admin users

'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Layout from '@/components/layout/Layout'
import ProtectedRoute from '@/components/auth/ProtectedRoute'

function CreateAdminContent() {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    role: 'ADMIN',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    try {
      const response = await fetch('/api/superadmin/users/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          alert('Admin user created successfully')
          router.push('/superadmin/users')
        } else {
          alert(data.message || 'Failed to create user')
        }
      } else {
        alert('Failed to create user')
      }
    } catch (error) {
      console.error('Error creating user:', error)
      alert('An error occurred while creating the user')
    } finally {
      setSaving(false)
    }
  }

  const handleLogout = () => {
    // Clear auth cookies and redirect to login
    document.cookie = 'auth-session=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;'
    document.cookie = 'refresh-token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;'
    router.push('/login')
  }

  return (
    <Layout
      user={{
        id: '1',
        name: 'SuperAdmin',
        email: 'superadmin@hotel.com',
        role: 'SUPERADMIN',
      }}
      onLogout={handleLogout}
      config={{
        showSidebar: true,
        showFooter: true,
      }}
    >
      <div className="max-w-2xl mx-auto">
        <div className="mb-6">
          <button
            onClick={() => router.push('/superadmin/users')}
            className="text-blue-600 hover:text-blue-800 flex items-center gap-2"
          >
            ← Back to Users
          </button>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">Create Admin User</h1>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                required
                placeholder="Enter full name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                required
                placeholder="admin@example.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Phone Number <span className="text-red-500">*</span>
              </label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                required
                placeholder="+919876543210"
                pattern="^\+?[1-9]\d{9,14}$"
                title="Enter a valid phone number with country code (e.g., +919876543210)"
              />
              <p className="text-xs text-gray-500 mt-1">Include country code (e.g., +91 for India)</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Role <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                required
              >
                <option value="ADMIN">Admin</option>
                <option value="SUPERADMIN">Super Admin</option>
              </select>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
              <div className="flex items-start gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-yellow-600 mt-0.5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                <div className="flex-1">
                  <h3 className="text-sm font-medium text-yellow-800">Important Note</h3>
                  <p className="text-sm text-yellow-700 mt-1">
                    The user will receive an OTP on their phone number for initial login. 
                    Make sure the phone number is correct and accessible.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <button
                type="submit"
                disabled={saving}
                className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50 font-medium"
              >
                {saving ? 'Creating...' : 'Create Admin User'}
              </button>
              <button
                type="button"
                onClick={() => router.push('/superadmin/users')}
                className="flex-1 bg-gray-200 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-300 font-medium"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </Layout>
  )
}

export default function CreateAdminPage() {
  return (
    <ProtectedRoute allowedRoles={['SUPERADMIN']}>
      <CreateAdminContent />
    </ProtectedRoute>
  )
}
