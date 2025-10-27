// ==========================================
// EDIT USER PAGE
// ==========================================
// SuperAdmin can edit user details and role

'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Layout from '@/components/layout/Layout'
import ProtectedRoute from '@/components/auth/ProtectedRoute'

interface UserData {
  id: string
  name: string
  email: string
  phone: string
  role: string
  profileCompleted: boolean
}

function EditUserContent() {
  const router = useRouter()
  const params = useParams()
  const userId = params.id as string

  const [user, setUser] = useState<UserData | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    role: '',
  })

  useEffect(() => {
    fetchUser()
  }, [userId])

  const fetchUser = async () => {
    try {
      const response = await fetch(`/api/superadmin/users/${userId}`)
      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          setUser(data.data)
          setFormData({
            name: data.data.name || '',
            email: data.data.email || '',
            phone: data.data.phone || '',
            role: data.data.role || '',
          })
        }
      }
    } catch (error) {
      console.error('Failed to fetch user:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    try {
      const response = await fetch(`/api/superadmin/users/${userId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          alert('User updated successfully')
          router.push('/superadmin/users')
        } else {
          alert(data.message || 'Failed to update user')
        }
      } else {
        alert('Failed to update user')
      }
    } catch (error) {
      console.error('Error updating user:', error)
      alert('An error occurred while updating the user')
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

  if (loading) {
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
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-blue-600 border-t-transparent"></div>
          <p className="mt-4 text-gray-600">Loading user...</p>
        </div>
      </Layout>
    )
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
          <h1 className="text-2xl font-bold text-gray-900 mb-6">Edit User</h1>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Name
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Phone
              </label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Role
              </label>
              <select
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                required
              >
                <option value="MEMBER">Member</option>
                <option value="ADMIN">Admin</option>
                <option value="SUPERADMIN">Super Admin</option>
              </select>
            </div>

            <div className="flex gap-3 pt-4">
              <button
                type="submit"
                disabled={saving}
                className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
              <button
                type="button"
                onClick={() => router.push('/superadmin/users')}
                className="flex-1 bg-gray-200 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-300"
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

export default function EditUserPage() {
  return (
    <ProtectedRoute allowedRoles={['SUPERADMIN']}>
      <EditUserContent />
    </ProtectedRoute>
  )
}
