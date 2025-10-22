// ==========================================
// LINK MEMBERSHIP MODAL COMPONENT
// ==========================================
// Modal for linking IRCA membership to user profile
// Production-ready with validation and preview

'use client'

import { useState } from 'react'
import type { IRCAMembershipData } from '@/lib/validation/profile.schemas'
import { validateField } from '@/lib/validation/profile.schemas'

// ==========================================
// TYPE DEFINITIONS
// ==========================================

interface LinkMembershipModalProps {
  isOpen: boolean
  onClose: () => void
  onVerify: (membershipId: string) => Promise<IRCAMembershipData | null>
  onConfirm: (membershipId: string) => Promise<boolean>
  isLoading?: boolean
}

// ==========================================
// LINK MEMBERSHIP MODAL COMPONENT
// ==========================================

/**
 * Link Membership Modal
 * Allows users to verify and link their IRCA membership
 */
export function LinkMembershipModal({
  isOpen,
  onClose,
  onVerify,
  onConfirm,
  isLoading = false,
}: LinkMembershipModalProps) {
  const [membershipId, setMembershipId] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [previewData, setPreviewData] = useState<IRCAMembershipData | null>(null)
  const [step, setStep] = useState<'input' | 'preview'>('input')

  // Reset state when modal closes
  const handleClose = () => {
    setMembershipId('')
    setError(null)
    setPreviewData(null)
    setStep('input')
    onClose()
  }

  // Verify membership
  const handleVerify = async () => {
    // Validate format
    const validation = validateField('ircaMembershipId' as any, membershipId)
    if (!validation.success && validation.error) {
      setError(validation.error)
      return
    }

    setError(null)
    const data = await onVerify(membershipId)

    if (data) {
      setPreviewData(data)
      setStep('preview')
    } else {
      setError('Membership ID not found or invalid')
    }
  }

  // Confirm and link
  const handleConfirm = async () => {
    const success = await onConfirm(membershipId)
    if (success) {
      handleClose()
    }
  }

  if (!isOpen) return null

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 z-40"
        onClick={handleClose}
        aria-hidden="true"
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b">
            <h3 className="text-xl font-bold text-gray-900">Link IRCA Membership</h3>
            <button
              onClick={handleClose}
              disabled={isLoading}
              className="text-gray-400 hover:text-gray-600 text-2xl leading-none disabled:opacity-50"
            >
              ×
            </button>
          </div>

          {/* Body */}
          <div className="p-6">
            {step === 'input' ? (
              // Step 1: Enter Membership ID
              <div className="space-y-4">
                <p className="text-gray-600">
                  Enter your IRCA membership ID to verify and link it to your account.
                </p>

                <div>
                  <label htmlFor="membershipId" className="block text-sm font-medium text-gray-700 mb-1">
                    Membership ID
                  </label>
                  <input
                    type="text"
                    id="membershipId"
                    value={membershipId}
                    onChange={(e) => {
                      setMembershipId(e.target.value.toUpperCase())
                      setError(null)
                    }}
                    disabled={isLoading}
                    className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 font-mono ${
                      error ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="IRCA-2024-001"
                  />
                  {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-sm text-blue-800">
                    💡 Your membership ID can be found on your IRCA membership card or in your confirmation email.
                  </p>
                </div>

                <div className="flex justify-end gap-3 pt-4">
                  <button
                    onClick={handleClose}
                    disabled={isLoading}
                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleVerify}
                    disabled={isLoading || !membershipId}
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isLoading ? 'Verifying...' : 'Verify Membership'}
                  </button>
                </div>
              </div>
            ) : (
              // Step 2: Preview and Confirm
              <div className="space-y-4">
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <p className="text-sm text-green-800 font-medium">
                    ✓ Membership verified successfully!
                  </p>
                </div>

                {previewData && (
                  <div className="space-y-3">
                    <div>
                      <label className="text-sm font-medium text-gray-600">Membership ID</label>
                      <p className="font-mono text-gray-900">{previewData.membershipId}</p>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-sm font-medium text-gray-600">Status</label>
                        <p className="text-gray-900 capitalize">{previewData.status}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-600">Level</label>
                        <p className="text-gray-900">{previewData.level}</p>
                      </div>
                    </div>

                    <div>
                      <label className="text-sm font-medium text-gray-600">Benefits</label>
                      <ul className="mt-1 space-y-1">
                        {previewData.benefits.slice(0, 3).map((benefit, index) => (
                          <li key={index} className="text-sm text-gray-700 flex items-start gap-2">
                            <span className="text-green-600">✓</span>
                            <span>{benefit}</span>
                          </li>
                        ))}
                        {previewData.benefits.length > 3 && (
                          <li className="text-sm text-gray-500">
                            +{previewData.benefits.length - 3} more benefits
                          </li>
                        )}
                      </ul>
                    </div>
                  </div>
                )}

                <div className="flex justify-end gap-3 pt-4 border-t">
                  <button
                    onClick={() => setStep('input')}
                    disabled={isLoading}
                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50"
                  >
                    Back
                  </button>
                  <button
                    onClick={handleConfirm}
                    disabled={isLoading}
                    className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                  >
                    {isLoading ? 'Linking...' : 'Confirm & Link'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  )
}
