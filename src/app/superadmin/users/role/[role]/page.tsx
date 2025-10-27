// ==========================================
// SUPERADMIN USERS BY ROLE PAGE
// ==========================================
// User management filtered by specific role
// Dynamic route: /superadmin/users/[role]

'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
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

function SuperAdminUsersByRoleContent() {
  const router = useRouter()
  const params = useParams()
  const paramRole = (params.role as string)?.toLowerCase() || 'all'

  // Map URL params to filter values
  const roleMapping: Record<string, string> = {
    'admins': 'ADMIN',
    'members': 'MEMBER',
    'superadmin': 'SUPERADMIN',
    'all': 'ALL'
  }

  const role = roleMapping[paramRole] || 'ALL'

  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<string>(role)

  // URL mapping for navigation
  const urlMapping: Record<string, string> = {
    'ALL': 'all',
    'ADMIN': 'admins',
    'MEMBER': 'members',
    'SUPERADMIN': 'superadmin'
  }

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

  // Validate role parameter
  const validParamRoles = Object.keys(roleMapping)
  if (!validParamRoles.includes(paramRole)) {
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
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Invalid Role</h1>
          <p className="text-gray-600">The role "{paramRole}" is not valid.</p>
          <button
            onClick={() => router.push('/superadmin/users')}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Go to User Management
          </button>
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
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              {role === 'ALL' ? 'All Users' : `${role} Users`}
            </h1>
            <p className="text-gray-600 mt-1">
              {role === 'ALL'
                ? 'Manage all system users'
                : `Manage ${role.toLowerCase()} users and permissions`
              }
            </p>
          </div>
          <button
            onClick={() => router.push('/superadmin/users')}
            className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
          >
            View All Users
          </button>
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-2 border-b border-gray-200">
          {['ALL', 'SUPERADMIN', 'ADMIN', 'MEMBER'].map((tab) => (
            <button
              key={tab}
              onClick={() => {
                setFilter(tab)
                if (tab !== role) {
                  router.push(tab === 'ALL' ? '/superadmin/users' : `/superadmin/users/${urlMapping[tab]}`)
                }
              }}
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
                No {role.toLowerCase()} users found
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

export default function SuperAdminUsersByRolePage() {
  return (
    <ProtectedRoute allowedRoles={['SUPERADMIN']}>
      <SuperAdminUsersByRoleContent />
    </ProtectedRoute>
  )
}