// ==========================================
// PROFILE CARD COMPONENT
// ==========================================
// Displays user profile information with edit functionality
// Production-ready with Tailwind CSS and TypeScript

'use client'

import type { ProfileData } from '@/lib/validation/profile.schemas'

// ==========================================
// TYPE DEFINITIONS
// ==========================================

interface ProfileCardProps {
  profile: ProfileData
  onEdit: () => void
  isLoading?: boolean
}

// ==========================================
// PROFILE CARD COMPONENT
// ==========================================

/**
 * Profile Card Component
 * Displays user information in a card layout
 * 
 * @example
 * ```tsx
 * <ProfileCard
 *   profile={profileData}
 *   onEdit={() => setShowEditModal(true)}
 * />
 * ```
 */
export function ProfileCard({ profile, onEdit, isLoading = false }: ProfileCardProps) {
  return (
    <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
      {/* Card Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Profile Information</h2>
        <button
          onClick={onEdit}
          disabled={isLoading}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
        >
          Edit Profile
        </button>
      </div>

      {/* Profile Details */}
      <div className="space-y-4">
        {/* Name */}
        <div>
          <label className="block text-sm font-medium text-gray-600 mb-1">Full Name</label>
          <p className="text-lg text-gray-900">{profile.name}</p>
        </div>

        {/* Email */}
        <div>
          <label className="block text-sm font-medium text-gray-600 mb-1">Email Address</label>
          <p className="text-lg text-gray-900">{profile.email || 'Not provided'}</p>
        </div>

        {/* Phone */}
        <div>
          <label className="block text-sm font-medium text-gray-600 mb-1">Phone Number</label>
          <p className="text-lg text-gray-900">{profile.phone}</p>
        </div>

        {/* Role */}
        <div>
          <label className="block text-sm font-medium text-gray-600 mb-1">Account Type</label>
          <span
            className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
              profile.role === 'SUPERADMIN'
                ? 'bg-purple-100 text-purple-800'
                : profile.role === 'ADMIN'
                ? 'bg-blue-100 text-blue-800'
                : 'bg-green-100 text-green-800'
            }`}
          >
            {profile.role}
          </span>
        </div>

        {/* Member Since */}
        <div>
          <label className="block text-sm font-medium text-gray-600 mb-1">Member Since</label>
          <p className="text-lg text-gray-900">
            {new Date(profile.createdAt).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </p>
        </div>
      </div>
    </div>
  )
}
