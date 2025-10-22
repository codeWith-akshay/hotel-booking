// ==========================================
// EDIT PROFILE MODAL COMPONENT
// ==========================================
// Modal form for editing user profile information
// Production-ready with validation, loading states, and animations

'use client'

import { useState, useEffect } from 'react'
import type { ProfileData } from '@/lib/validation/profile.schemas'
import { validateField } from '@/lib/validation/profile.schemas'

// ==========================================
// TYPE DEFINITIONS
// ==========================================

interface EditProfileModalProps {
  profile: ProfileData
  isOpen: boolean
  onClose: () => void
  onSave: (data: { name: string; email: string | null; phone: string }) => Promise<boolean>
  isLoading?: boolean
}

interface FormErrors {
  name?: string
  email?: string
  phone?: string
}

// ==========================================
// EDIT PROFILE MODAL COMPONENT
// ==========================================

/**
 * Edit Profile Modal
 * Provides form for editing profile with validation
 * 
 * @example
 * ```tsx
 * <EditProfileModal
 *   profile={profileData}
 *   isOpen={showModal}
 *   onClose={() => setShowModal(false)}
 *   onSave={handleSave}
 * />
 * ```
 */
export function EditProfileModal({
  profile,
  isOpen,
  onClose,
  onSave,
  isLoading = false,
}: EditProfileModalProps) {
  // Form state
  const [name, setName] = useState(profile.name)
  const [email, setEmail] = useState(profile.email || '')
  const [phone, setPhone] = useState(profile.phone)
  const [errors, setErrors] = useState<FormErrors>({})

  // Update form when profile changes
  useEffect(() => {
    if (isOpen) {
      setName(profile.name)
      setEmail(profile.email || '')
      setPhone(profile.phone)
      setErrors({})
    }
  }, [isOpen, profile])

  // Validate single field
  const validateSingleField = (field: 'name' | 'email' | 'phone', value: string) => {
    const result = validateField(field, value)
    
    if (!result.success && result.error) {
      setErrors((prev) => ({ ...prev, [field]: result.error }))
    } else {
      setErrors((prev) => {
        const newErrors = { ...prev }
        delete newErrors[field]
        return newErrors
      })
    }
  }

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validate all fields
    const nameValidation = validateField('name', name)
    const emailValidation = email ? validateField('email', email) : { success: true, error: null }
    const phoneValidation = validateField('phone', phone)

    const newErrors: FormErrors = {}
    if (!nameValidation.success && nameValidation.error) {
      newErrors.name = nameValidation.error
    }
    if (!emailValidation.success && emailValidation.error) {
      newErrors.email = emailValidation.error
    }
    if (!phoneValidation.success && phoneValidation.error) {
      newErrors.phone = phoneValidation.error
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    // Submit form
    const success = await onSave({
      name,
      email: email || null,
      phone,
    })

    if (success) {
      onClose()
    }
  }

  if (!isOpen) return null

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 z-40 transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div
          className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in duration-200"
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-title"
        >
          {/* Modal Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <h3 id="modal-title" className="text-xl font-bold text-gray-900">
              Edit Profile
            </h3>
            <button
              onClick={onClose}
              disabled={isLoading}
              className="text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-50 text-2xl leading-none"
              aria-label="Close modal"
            >
              ×
            </button>
          </div>

          {/* Modal Body */}
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            {/* Name Field */}
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                Full Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="name"
                value={name}
                onChange={(e) => {
                  setName(e.target.value)
                  validateSingleField('name', e.target.value)
                }}
                disabled={isLoading}
                className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed ${
                  errors.name ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Enter your full name"
              />
              {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
            </div>

            {/* Email Field */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Email Address
              </label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value)
                  if (e.target.value) {
                    validateSingleField('email', e.target.value)
                  } else {
                    setErrors((prev) => {
                      const newErrors = { ...prev }
                      delete newErrors.email
                      return newErrors
                    })
                  }
                }}
                disabled={isLoading}
                className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed ${
                  errors.email ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Enter your email address"
              />
              {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email}</p>}
            </div>

            {/* Phone Field */}
            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                Phone Number <span className="text-red-500">*</span>
              </label>
              <input
                type="tel"
                id="phone"
                value={phone}
                onChange={(e) => {
                  setPhone(e.target.value)
                  validateSingleField('phone', e.target.value)
                }}
                disabled={isLoading}
                className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed ${
                  errors.phone ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="+1234567890"
              />
              {errors.phone && <p className="mt-1 text-sm text-red-600">{errors.phone}</p>}
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
              <button
                type="button"
                onClick={onClose}
                disabled={isLoading}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isLoading || Object.keys(errors).length > 0}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
              >
                {isLoading ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  )
}
