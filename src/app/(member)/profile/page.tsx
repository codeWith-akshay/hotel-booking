// ==========================================
// PROFILE PAGE
// ==========================================
// Main profile page with edit functionality and IRCA membership integration
// Production-ready with Zustand state management, loading states, and toast notifications

'use client'

import { useEffect, useState } from 'react'
import { useProfileStore } from '@/store/profile.store'
import { ProfileCard } from '@/components/profile/ProfileCard'
import { MembershipCard } from '@/components/profile/MembershipCard'
import { EditProfileModal } from '@/components/profile/EditProfileModal'
import { LinkMembershipModal } from '@/components/profile/LinkMembershipModal'
import { Toast } from '@/components/ui/Toast'

// ==========================================
// PROFILE PAGE COMPONENT
// ==========================================

/**
 * Profile Page
 * Displays and manages user profile and IRCA membership
 * 
 * Features:
 * - View and edit profile information
 * - Link/unlink IRCA membership
 * - Real-time membership verification
 * - Success/error notifications
 * - Responsive design
 */
export default function ProfilePage() {
  // ==========================================
  // STATE MANAGEMENT
  // ==========================================

  // Global profile state
  const {
    profile,
    membership,
    isLoading,
    isUpdating,
    isMembershipLoading,
    error,
    successMessage,
    fetchProfile,
    updateProfile,
    checkMembership,
    linkMembership,
    unlinkMembership,
    clearMessages,
  } = useProfileStore()

  // Local UI state
  const [showEditModal, setShowEditModal] = useState(false)
  const [showLinkModal, setShowLinkModal] = useState(false)

  // ==========================================
  // LIFECYCLE
  // ==========================================

  // Fetch profile on mount
  useEffect(() => {
    fetchProfile()
  }, [fetchProfile])

  // ==========================================
  // EVENT HANDLERS
  // ==========================================

  /**
   * Handle profile update
   */
  const handleUpdateProfile = async (data: {
    name: string
    email: string | null
    phone: string
  }) => {
    const success = await updateProfile(data)
    return success
  }

  /**
   * Handle membership verification
   */
  const handleVerifyMembership = async (membershipId: string) => {
    const data = await checkMembership(membershipId)
    return data
  }

  /**
   * Handle membership linking
   */
  const handleLinkMembership = async (membershipId: string) => {
    const success = await linkMembership(membershipId)
    return success
  }

  /**
   * Handle membership unlinking
   */
  const handleUnlinkMembership = async () => {
    if (!confirm('Are you sure you want to unlink your IRCA membership?')) {
      return
    }
    await unlinkMembership()
  }

  // ==========================================
  // LOADING STATE
  // ==========================================

  if (isLoading && !profile) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading profile...</p>
        </div>
      </div>
    )
  }

  // ==========================================
  // ERROR STATE
  // ==========================================

  if (!profile && error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow-md p-8 max-w-md text-center">
          <div className="text-red-600 text-5xl mb-4">⚠️</div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Failed to Load Profile</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => fetchProfile()}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    )
  }

  if (!profile) {
    return null
  }

  // ==========================================
  // MAIN RENDER
  // ==========================================

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Page Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <h1 className="text-3xl font-bold text-gray-900">My Profile</h1>
          <p className="mt-2 text-gray-600">Manage your account information and membership</p>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Profile Card */}
          <ProfileCard
            profile={profile}
            onEdit={() => setShowEditModal(true)}
            isLoading={isUpdating}
          />

          {/* Membership Card */}
          <MembershipCard
            membership={membership}
            onLink={() => setShowLinkModal(true)}
            onUnlink={handleUnlinkMembership}
            isLoading={isUpdating || isMembershipLoading}
          />
        </div>

        {/* Additional Information */}
        <div className="mt-8 bg-white rounded-lg shadow-md p-6 border border-gray-200">
          <h2 className="text-xl font-bold text-gray-900 mb-4">About Your Profile</h2>
          <div className="space-y-4 text-gray-600">
            <p>
              Your profile information is used to personalize your experience and manage your bookings.
              Keep your contact information up to date to receive important notifications.
            </p>
            <p>
              Link your IRCA membership to unlock exclusive benefits, priority booking, and special rates.
              Your membership status is verified in real-time with the IRCA system.
            </p>
          </div>
        </div>
      </div>

      {/* ==========================================
          MODALS
          ========================================== */}

      {/* Edit Profile Modal */}
      <EditProfileModal
        profile={profile}
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        onSave={handleUpdateProfile}
        isLoading={isUpdating}
      />

      {/* Link Membership Modal */}
      <LinkMembershipModal
        isOpen={showLinkModal}
        onClose={() => setShowLinkModal(false)}
        onVerify={handleVerifyMembership}
        onConfirm={handleLinkMembership}
        isLoading={isUpdating || isMembershipLoading}
      />

      {/* ==========================================
          TOAST NOTIFICATIONS
          ========================================== */}

      {/* Success Toast */}
      {successMessage && (
        <Toast message={successMessage} type="success" onClose={clearMessages} />
      )}

      {/* Error Toast */}
      {error && <Toast message={error} type="error" onClose={clearMessages} />}
    </div>
  )
}
