// ==========================================
// MEMBERSHIP CARD COMPONENT
// ==========================================
// Displays IRCA membership information with management options
// Production-ready with Tailwind CSS and TypeScript

'use client'

import type { IRCAMembershipData } from '@/lib/validation/profile.schemas'
import { formatExpiryDate, formatCurrency } from '@/lib/services/irca.service'

// ==========================================
// TYPE DEFINITIONS
// ==========================================

interface MembershipCardProps {
  membership: IRCAMembershipData | null
  onLink: () => void
  onUnlink: () => void
  isLoading?: boolean
}

// ==========================================
// MEMBERSHIP CARD COMPONENT
// ==========================================

/**
 * Membership Card Component
 * Displays IRCA membership status and benefits
 * 
 * @example
 * ```tsx
 * <MembershipCard
 *   membership={membershipData}
 *   onLink={() => setShowLinkModal(true)}
 *   onUnlink={handleUnlink}
 * />
 * ```
 */
export function MembershipCard({
  membership,
  onLink,
  onUnlink,
  isLoading = false,
}: MembershipCardProps) {
  // Calculate days until expiry
  const getDaysUntilExpiry = () => {
    if (!membership?.expiresAt) return null
    const expiryDate = new Date(membership.expiresAt)
    const today = new Date()
    const diffTime = expiryDate.getTime() - today.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
  }

  const daysUntilExpiry = getDaysUntilExpiry()

  // No membership linked
  if (!membership) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">IRCA Membership</h2>
        
        <div className="text-center py-8">
          <div className="text-6xl mb-4">🏨</div>
          <p className="text-gray-600 mb-6">No membership linked to your account</p>
          <button
            onClick={onLink}
            disabled={isLoading}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
          >
            Link IRCA Membership
          </button>
        </div>
      </div>
    )
  }

  // Status badge colors
  const statusColors = {
    active: 'bg-green-100 text-green-800 border-green-200',
    expired: 'bg-red-100 text-red-800 border-red-200',
    pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    suspended: 'bg-orange-100 text-orange-800 border-orange-200',
    cancelled: 'bg-gray-100 text-gray-800 border-gray-200',
  }

  // Level badge colors
  const levelColors = {
    Basic: 'bg-gray-100 text-gray-800',
    Standard: 'bg-blue-100 text-blue-800',
    Premium: 'bg-purple-100 text-purple-800',
    Corporate: 'bg-indigo-100 text-indigo-800',
    Lifetime: 'bg-amber-100 text-amber-800',
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
      {/* Card Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">IRCA Membership</h2>
        <button
          onClick={onUnlink}
          disabled={isLoading}
          className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium text-sm"
        >
          Unlink
        </button>
      </div>

      {/* Membership ID */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-600 mb-1">Membership ID</label>
        <p className="text-lg font-mono text-gray-900">{membership.membershipId}</p>
      </div>

      {/* Status and Level Badges */}
      <div className="flex flex-wrap gap-3 mb-6">
        <span
          className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${
            statusColors[membership.status]
          }`}
        >
          <span className="mr-1">●</span> {membership.status.toUpperCase()}
        </span>
        <span
          className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
            levelColors[membership.level]
          }`}
        >
          {membership.level} Level
        </span>
      </div>

      {/* Membership Details Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        {/* Member Since */}
        <div>
          <label className="block text-sm font-medium text-gray-600 mb-1">Member Since</label>
          <p className="text-gray-900">{formatExpiryDate(membership.memberSince)}</p>
        </div>

        {/* Expires At */}
        <div>
          <label className="block text-sm font-medium text-gray-600 mb-1">Expires</label>
          <p className="text-gray-900">
            {formatExpiryDate(membership.expiresAt)}
            {daysUntilExpiry !== null && daysUntilExpiry > 0 && daysUntilExpiry < 90 && (
              <span className="ml-2 text-sm text-orange-600">
                ({daysUntilExpiry} days left)
              </span>
            )}
            {daysUntilExpiry !== null && daysUntilExpiry <= 0 && (
              <span className="ml-2 text-sm text-red-600">(Expired)</span>
            )}
          </p>
        </div>

        {/* Dues Status */}
        <div>
          <label className="block text-sm font-medium text-gray-600 mb-1">Dues Status</label>
          <div className="flex items-center gap-2">
            {membership.duesPaid ? (
              <span className="text-green-600 font-medium">✓ Paid</span>
            ) : (
              <span className="text-red-600 font-medium">✕ Unpaid ({formatCurrency(membership.dues)})</span>
            )}
          </div>
        </div>

        {/* Last Verified */}
        <div>
          <label className="block text-sm font-medium text-gray-600 mb-1">Last Verified</label>
          <p className="text-gray-900">
            {new Date(membership.lastVerified).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'short',
              day: 'numeric',
            })}
          </p>
        </div>
      </div>

      {/* Benefits Section */}
      {membership.benefits && membership.benefits.length > 0 && (
        <div>
          <label className="block text-sm font-medium text-gray-600 mb-2">Membership Benefits</label>
          <ul className="space-y-2">
            {membership.benefits.map((benefit, index) => (
              <li key={index} className="flex items-start gap-2 text-gray-700">
                <span className="text-green-600 mt-1">✓</span>
                <span>{benefit}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Expiry Warning */}
      {membership.status === 'expired' && (
        <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-800">
            ⚠️ Your membership has expired. Please renew to continue enjoying member benefits.
          </p>
        </div>
      )}

      {/* Upcoming Expiry Warning */}
      {membership.status === 'active' &&
        daysUntilExpiry !== null &&
        daysUntilExpiry > 0 &&
        daysUntilExpiry < 30 && (
          <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-sm text-yellow-800">
              ⚠️ Your membership expires in {daysUntilExpiry} days. Please renew to avoid interruption.
            </p>
          </div>
        )}
    </div>
  )
}
