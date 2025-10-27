'use client'

/**
 * Complete Profile Setup Page
 * 
 * Allows MEMBER users to complete their profile after first OTP login.
 * Features:
 * - Full name, email, address input
 * - VIP status selection (VIP or Regular)
 * - Form validation with react-hook-form + Zod
 * - Responsive Tailwind UI with dark mode support
 * - Redirects to /dashboard after successful completion
 */

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { 
  UpdateUserProfileSchema, 
  type UpdateUserProfileInput,
  UserVipStatusEnum
} from '@/lib/validation/user-profile.validation'
import { useAuthStore } from '@/store/auth.store'

export default function ProfileSetupPage() {
  const router = useRouter()
  const { user, isAuthenticated, setUser } = useAuthStore()
  
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [apiError, setApiError] = useState<string | null>(null)
  const [showSuccess, setShowSuccess] = useState(false)
  const [isHydrated, setIsHydrated] = useState(false)

  // React Hook Form setup
  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
  } = useForm<UpdateUserProfileInput>({
    resolver: zodResolver(UpdateUserProfileSchema),
    defaultValues: {
      fullName: '',
      email: '',
      address: '',
      vipStatus: 'Regular',
    },
  })

  // Wait for Zustand store to rehydrate from localStorage
  useEffect(() => {
    setIsHydrated(true)
  }, [])

  // ==========================================
  // AUTHENTICATION CHECK
  // ==========================================
  
  useEffect(() => {
    // Only check auth after store has rehydrated
    if (!isHydrated) {
      return
    }

    console.log('[ProfileSetup] 🔍 Checking auth state:', {
      isAuthenticated,
      hasUser: !!user,
      userPhone: user?.phone,
      profileCompleted: user?.profileCompleted,
    })

    if (!isAuthenticated || !user) {
      console.warn('[ProfileSetup] ⚠️ Not authenticated, redirecting to login')
      router.push('/login')
      return
    }

    // Pre-fill name if exists
    if (user.name) {
      setValue('fullName', user.name)
    }

    // Pre-fill email if exists
    if (user.email) {
      setValue('email', user.email)
    }

    // Pre-fill address if exists
    if (user.address) {
      setValue('address', user.address)
    }

    // Redirect if profile already completed
    if (user.profileCompleted === true) {
      console.log('[ProfileSetup] ✅ Profile already completed, redirecting to dashboard')
      router.push('/dashboard')
    } else {
      console.log('[ProfileSetup] 📝 Profile incomplete, showing form')
    }
  }, [isHydrated, isAuthenticated, user, router, setValue])

  // ==========================================
  // LOADING STATE (WHILE HYDRATING)
  // ==========================================

  if (!isHydrated) {
    return (
      <div className="min-h-screen bg-linear-to-br from-blue-50 via-white to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  // ==========================================
  // FORM SUBMISSION
  // ==========================================
  
  const onSubmit = async (data: UpdateUserProfileInput) => {
    setIsSubmitting(true)
    setApiError(null)

    try {
      console.log('📤 Submitting profile data:', data)

      // Call API to update profile (uses cookie authentication)
      const response = await fetch('/api/user/update-profile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.message || 'Failed to update profile')
      }

      console.log('✅ Profile updated successfully:', result)

      // Show success toast
      setShowSuccess(true)

      // Update auth store with new user data including profileCompleted flag
      if (result.user) {
        setUser({
          id: result.user.id,
          name: result.user.name,
          email: result.user.email,
          phone: result.user.phone,
          address: result.user.address,
          profileCompleted: true, // Mark profile as completed
          role: result.user.roleName || user?.role || 'MEMBER',
          roleId: user?.roleId || result.user.roleId || '',
        })
        console.log('✅ Auth store updated with completed profile')
      }

      // Redirect to dashboard after 2 seconds
      setTimeout(() => {
        router.push('/dashboard')
      }, 2000)

    } catch (error) {
      console.error('❌ Profile update error:', error)
      setApiError(
        error instanceof Error 
          ? error.message 
          : 'An unexpected error occurred. Please try again.'
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  // ==========================================
  // LOADING STATE
  // ==========================================
  
  if (!isAuthenticated || !user) {
    return (
      <div className="min-h-screen bg-linear-to-br from-blue-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    )
  }

  // ==========================================
  // RENDER FORM
  // ==========================================
  
  return (
    <div className="min-h-screen bg-linear-to-br from-blue-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        {/* Success Toast */}
        {showSuccess && (
          <div className="fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50 animate-fade-in">
            ✅ Profile updated successfully! Redirecting to dashboard...
          </div>
        )}

        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Complete Your Profile
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Please provide your details to access your dashboard
          </p>
        </div>

        {/* Form Card */}
        <div className="bg-white dark:bg-gray-800 shadow-xl rounded-lg p-8">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            
            {/* Full Name */}
            <div>
              <label
                htmlFor="fullName"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
              >
                Full Name <span className="text-red-500">*</span>
              </label>
              <input
                id="fullName"
                type="text"
                {...register('fullName')}
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white ${
                  errors.fullName ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="John Doe"
                aria-invalid={errors.fullName ? 'true' : 'false'}
                aria-describedby="fullName-error"
              />
              {errors.fullName && (
                <p id="fullName-error" className="mt-1 text-sm text-red-600 dark:text-red-400">
                  {errors.fullName?.message}
                </p>
              )}
            </div>

            {/* Email */}
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
              >
                Email Address <span className="text-red-500">*</span>
              </label>
              <input
                id="email"
                type="email"
                {...register('email')}
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white ${
                  errors.email ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="john.doe@example.com"
                aria-invalid={errors.email ? 'true' : 'false'}
                aria-describedby="email-error"
              />
              {errors.email && (
                <p id="email-error" className="mt-1 text-sm text-red-600 dark:text-red-400">
                  {errors.email?.message}
                </p>
              )}
            </div>

            {/* Address */}
            <div>
              <label
                htmlFor="address"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
              >
                Address <span className="text-red-500">*</span>
              </label>
              <textarea
                id="address"
                {...register('address')}
                rows={3}
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white ${
                  errors.address ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="123 Main St, City, State, ZIP"
                aria-invalid={errors.address ? 'true' : 'false'}
                aria-describedby="address-error"
              />
              {errors.address && (
                <p id="address-error" className="mt-1 text-sm text-red-600 dark:text-red-400">
                  {errors.address?.message}
                </p>
              )}
            </div>

            {/* VIP Status */}
            <div>
              <label
                htmlFor="vipStatus"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
              >
                Guest Status <span className="text-red-500">*</span>
              </label>
              <select
                id="vipStatus"
                {...register('vipStatus')}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                aria-describedby="vipStatus-help"
              >
                <option value="Regular">Regular Guest</option>
                <option value="VIP">VIP Guest</option>
              </select>
              <p id="vipStatus-help" className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                VIP guests may receive special privileges and benefits
              </p>
              {errors.vipStatus && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                  {errors.vipStatus?.message}
                </p>
              )}
            </div>

            {/* API Error Message */}
            {apiError && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                <div className="flex items-center">
                  <svg
                    className="w-5 h-5 text-red-600 dark:text-red-400 shrink-0"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <p className="ml-3 text-sm text-red-800 dark:text-red-300">{apiError}</p>
                </div>
              </div>
            )}

            {/* Submit Button */}
            <div className="pt-4">
              <button
                type="submit"
                disabled={isSubmitting}
                className={`w-full py-3 px-4 rounded-lg font-medium text-white transition duration-200 ${
                  isSubmitting
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-blue-600 hover:bg-blue-700 active:bg-blue-800'
                }`}
                aria-label="Complete profile setup"
              >
                {isSubmitting ? (
                  <span className="flex items-center justify-center">
                    <svg
                      className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                    Updating Profile...
                  </span>
                ) : (
                  'Complete Profile & Continue to Dashboard'
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Footer Help Text */}
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Need help?{' '}
            <a
              href="/support"
              className="text-blue-600 hover:text-blue-700 dark:text-blue-400 underline"
            >
              Contact Support
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}
