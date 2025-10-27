// ==========================================
// SUPERADMIN USERS PAGE
// ==========================================
// Comprehensive user management for SuperAdmin
// Features: User list, role management, user actions

'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Layout from '@/components/layout/Layout'
import ProtectedRoute from '@/components/auth/ProtectedRoute'

// ==========================================
// TYPE DEFINITIONS
// ==========================================

interface User {
  id: string
  name: string
  email: string
  phone: string | null
  role: string
  status: string
  totalBookings: number
  lastLogin: string
  createdAt: string
}

// ==========================================
// MAIN COMPONENT
// ==========================================

function SuperAdminUsersContent() {
  const router = useRouter()
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<string>('ALL')

  useEffect(() => {
    fetchUsers()
  }, [filter])

  const fetchUsers = async () => {
    setLoading(true)
    try {
      const url = filter === 'ALL' 
        ? '/api/superadmin/users' 
        : `/api/superadmin/users?role=${filter}`
      
      const response = await fetch(url)
      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          setUsers(data.data)
        }
      }
    } catch (error) {
      console.error('Failed to fetch users:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = () => {
    router.push('/auth/login')
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
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">User Management</h1>
            <p className="text-gray-600 mt-1">Manage all system users, roles, and permissions</p>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-2 border-b border-gray-200">
          {['ALL', 'SUPERADMIN', 'ADMIN', 'MEMBER'].map((tab) => (
            <button
              key={tab}
              onClick={() => setFilter(tab)}
              className={`px-4 py-2 font-medium transition-colors ${
                filter === tab
                  ? 'border-b-2 border-blue-600 text-blue-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Users Table */}
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-blue-600 border-t-transparent"></div>
            <p className="mt-4 text-gray-600">Loading users...</p>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Phone</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Role</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Bookings</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Last Login</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {users.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="font-medium text-gray-900">{user.name}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {user.email}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {user.phone || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                        user.role === 'SUPERADMIN' ? 'bg-purple-100 text-purple-800' :
                        user.role === 'ADMIN' ? 'bg-blue-100 text-blue-800' :
                        user.role === 'MEMBER' ? 'bg-green-100 text-green-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {user.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                        user.status === 'ACTIVE' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {user.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 text-center">
                      {user.totalBookings}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {new Date(user.lastLogin).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <button className="text-blue-600 hover:text-blue-800 mr-3">Edit</button>
                      <button className="text-red-600 hover:text-red-800">Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {users.length === 0 && (
              <div className="text-center py-12 text-gray-500">
                No users found
              </div>
            )}
          </div>
        )}
      </div>
    </Layout>
  )
}

// ==========================================
// PROTECTED PAGE EXPORT
// ==========================================

export default function SuperAdminUsersPage() {
  return (
    <ProtectedRoute allowedRoles={['SUPERADMIN']}>
      <SuperAdminUsersContent />
    </ProtectedRoute>
  )
}
