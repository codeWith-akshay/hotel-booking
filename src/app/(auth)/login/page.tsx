'use client'

import { useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAuthStore } from '@/store/auth.store'
import { Button, Input, Alert } from '@/components/ui'
import { isValidPhoneNumber, formatPhoneNumber } from '@/lib/utils'

// ==========================================
// LOGIN PAGE
// ==========================================

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirectUrl = searchParams.get('redirect') || '/dashboard'
  const setPendingPhone = useAuthStore((state) => state.setPendingPhone)

  // Form state
  const [phone, setPhone] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  // Input validation state
  const [touched, setTouched] = useState(false)

  // ==========================================
  // VALIDATION
  // ==========================================

  const phoneError = touched && phone && !isValidPhoneNumber(phone)
    ? 'Please enter a valid phone number (e.g., +14155551234)'
    : ''

  const isFormValid = phone && isValidPhoneNumber(phone)

  // ==========================================
  // HANDLERS
  // ==========================================

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.trim()
    setPhone(value)
    setError('')
    setSuccess('')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setTouched(true)

    // Validate
    if (!isFormValid) {
      setError('Please enter a valid phone number')
      return
    }

    setIsLoading(true)
    setError('')
    setSuccess('')

    try {
      // Call OTP request API
      const response = await fetch('/api/auth/request-otp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ phone }),
      })

      const data = await response.json()

      if (data.success) {
        // Store pending phone in Zustand
        setPendingPhone(phone, data.data.expiresAt)

        // Show success message briefly
        setSuccess(`OTP sent to ${formatPhoneNumber(phone)}!`)

        // Redirect to OTP verification page with redirect URL
        setTimeout(() => {
          router.push(`/verify-otp?redirect=${encodeURIComponent(redirectUrl)}`)
        }, 1500)
      } else {
        // Handle error
        setError(data.message || 'Failed to send OTP. Please try again.')
      }
    } catch (err) {
      console.error('OTP request error:', err)
      setError('An unexpected error occurred. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  // ==========================================
  // RENDER
  // ==========================================

  return (
    <div className="min-h-screen bg-linear-to-br from-blue-50 via-white to-blue-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Card */}
        <div className="bg-white rounded-2xl shadow-xl p-8 space-y-6">
          {/* Header */}
          <div className="text-center space-y-2">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
              <svg
                className="w-8 h-8 text-blue-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                />
              </svg>
            </div>
            <h1 className="text-3xl font-bold text-gray-900">Welcome Back</h1>
            <p className="text-gray-600">
              Sign in to your hotel booking account
            </p>
          </div>

          {/* Success Alert */}
          {success && (
            <Alert
              type="success"
              message={success}
              onClose={() => setSuccess('')}
            />
          )}

          {/* Error Alert */}
          {error && (
            <Alert type="error" message={error} onClose={() => setError('')} />
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Phone Input */}
            <Input
              type="tel"
              label="Phone Number"
              placeholder="+1 (415) 555-1234"
              value={phone}
              onChange={handlePhoneChange}
              onBlur={() => setTouched(true)}
              error={phoneError}
              helperText="Enter your phone number in international format"
              leftIcon={
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                  />
                </svg>
              }
              disabled={isLoading}
              fullWidth
              autoFocus
            />

            {/* Submit Button */}
            <Button
              type="submit"
              variant="primary"
              size="lg"
              isLoading={isLoading}
              disabled={!isFormValid || isLoading}
              fullWidth
            >
              Send OTP
            </Button>
          </form>

          {/* Footer */}
          <div className="pt-4 border-t border-gray-200 space-y-3">
            {/* Info Box */}
            <div className="bg-blue-50 border border-blue-100 rounded-lg p-4">
              <div className="flex gap-3">
                <svg
                  className="w-5 h-5 text-blue-600 shrink-0 mt-0.5"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                    clipRule="evenodd"
                  />
                </svg>
                <div className="flex-1">
                  <h3 className="text-sm font-semibold text-blue-900 mb-1">
                    How it works
                  </h3>
                  <ul className="text-sm text-blue-800 space-y-1">
                    <li>• Enter your phone number</li>
                    <li>• Receive a 6-digit OTP code</li>
                    <li>• Verify the code to sign in</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Security Notice */}
            <p className="text-xs text-center text-gray-500">
              🔒 Your phone number is securely encrypted and never shared
            </p>
          </div>
        </div>

        {/* Test Credentials (Development Only) */}
        {process.env.NODE_ENV === 'development' && (
          <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-xs font-semibold text-yellow-800 mb-2">
              🧪 Development Mode - Test Credentials
            </p>
            <p className="text-xs text-yellow-700 font-mono">
              Phone: +14155551234
            </p>
            <p className="text-xs text-yellow-700 mt-1">
              Check console for OTP code after clicking "Send OTP"
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-blue-600 border-t-transparent"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    }>
      <LoginForm />
    </Suspense>
  )
}
