'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/auth.store'
import { Button, Alert } from '@/components/ui'
import {
  isValidOTP,
  formatPhoneNumber,
  formatTimeRemaining,
  getSecondsUntilExpiry,
} from '@/lib/utils'

// ==========================================
// OTP VERIFICATION PAGE
// ==========================================

export default function VerifyOTPPage() {
  const router = useRouter()
  const {
    pendingPhone,
    otpExpiresAt,
    setUser,
    setTokens,
    clearPendingPhone,
  } = useAuthStore()
  const authStore = useAuthStore()

  // OTP input state
  const [otp, setOTP] = useState(['', '', '', '', '', ''])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  // Countdown timer state
  const [secondsRemaining, setSecondsRemaining] = useState(300) // 5 minutes
  const [canResend, setCanResend] = useState(false)
  const [isResending, setIsResending] = useState(false)

  // Input refs for auto-focus
  const inputRefs = useRef<(HTMLInputElement | null)[]>([])

  // ==========================================
  // REDIRECT IF NO PENDING PHONE
  // ==========================================

  useEffect(() => {
    if (!pendingPhone) {
      router.push('/login')
    }
  }, [pendingPhone, router])

  // ==========================================
  // COUNTDOWN TIMER
  // ==========================================

  useEffect(() => {
    if (!otpExpiresAt) return

    // Calculate initial seconds remaining
    const initial = getSecondsUntilExpiry(otpExpiresAt)
    setSecondsRemaining(initial)

    // Update every second
    const interval = setInterval(() => {
      const remaining = getSecondsUntilExpiry(otpExpiresAt)
      setSecondsRemaining(remaining)

      if (remaining <= 0) {
        setCanResend(true)
        clearInterval(interval)
      }
    }, 1000)

    return () => clearInterval(interval)
  }, [otpExpiresAt])

  // ==========================================
  // HANDLERS
  // ==========================================

  const handleOTPChange = (index: number, value: string) => {
    // Only allow digits
    if (value && !/^\d$/.test(value)) return

    // Update OTP array
    const newOTP = [...otp]
    newOTP[index] = value
    setOTP(newOTP)
    setError('')
    setSuccess('')

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus()
    }
  }

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    // Handle backspace
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus()
    }

    // Handle paste
    if (e.key === 'v' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault()
      navigator.clipboard.readText().then((text) => {
        const digits = text.replace(/\D/g, '').slice(0, 6).split('')
        const newOTP = [...otp]
        digits.forEach((digit, i) => {
          if (i < 6) newOTP[i] = digit
        })
        setOTP(newOTP)
        // Focus last filled input
        const lastIndex = Math.min(digits.length, 5)
        inputRefs.current[lastIndex]?.focus()
      })
    }
  }

  const handleVerify = async () => {
    const otpCode = otp.join('')

    // Validate
    if (!isValidOTP(otpCode)) {
      setError('Please enter all 6 digits')
      return
    }

    if (!pendingPhone) {
      setError('Phone number not found. Please start over.')
      router.push('/login')
      return
    }

    setIsLoading(true)
    setError('')
    setSuccess('')

    try {
      // Call OTP verification API
      const response = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // Important: Include cookies
        body: JSON.stringify({
          phone: pendingPhone,
          otp: otpCode,
        }),
      })

      const data = await response.json()

      if (data.success) {
        // Success! Update auth store with token first
        setSuccess('Login successful! Fetching user profile...')
        
        // Store token first
        setTokens(data.data.token)
        
        // Variable to store the final user data for redirection
        let finalUser = null
        
        // Now fetch the complete user profile with role information
        try {
          const profileResponse = await fetch('/api/user/profile', {
            headers: {
              'Authorization': `Bearer ${data.data.token}`,
              'Content-Type': 'application/json',
            },
          })
          
          if (profileResponse.ok) {
            const profileData = await profileResponse.json()
            
            if (profileData.success && profileData.data) {
              // Set user with complete profile data including correct role
              finalUser = {
                id: profileData.data.id,
                phone: profileData.data.phone,
                name: profileData.data.name || 'User',
                email: profileData.data.email,
                role: profileData.data.role?.name || 'MEMBER',
                roleId: profileData.data.roleId,
              }
              
              setUser(finalUser)
              console.log('✅ User profile loaded:', finalUser)
            } else {
              // Fallback to basic user data from verification response
              finalUser = {
                id: data.data.userId,
                phone: data.data.phone,
                name: 'User',
                email: null,
                role: 'MEMBER', // Fallback role
                roleId: '',
              }
              setUser(finalUser)
            }
          } else {
            // Profile fetch failed, use basic data
            finalUser = {
              id: data.data.userId,
              phone: data.data.phone,
              name: 'User',
              email: null,
              role: 'MEMBER', // Fallback role
              roleId: '',
            }
            setUser(finalUser)
          }
        } catch (profileError) {
          console.error('Error fetching user profile:', profileError)
          // Use basic user data as fallback
          finalUser = {
            id: data.data.userId,
            phone: data.data.phone,
            name: 'User',
            email: null,
            role: 'MEMBER', // Fallback role
            roleId: '',
          }
          setUser(finalUser)
        }
        
        clearPendingPhone()
        setSuccess('Login successful! Redirecting...')

        // Redirect to appropriate dashboard based on role
        setTimeout(() => {
          // Use the finalUser variable that has the correct role
          console.log('🚀 Redirecting user with role:', finalUser?.role)
          
          if (finalUser?.role === 'SUPERADMIN') {
            router.push('/superadmin/dashboard')
          } else if (finalUser?.role === 'ADMIN') {
            router.push('/admin/dashboard')
          } else {
            router.push('/dashboard')
          }
        }, 1500)
      } else {
        // Handle error
        setError(data.message || 'Invalid OTP. Please try again.')
        // Clear OTP inputs on error
        setOTP(['', '', '', '', '', ''])
        inputRefs.current[0]?.focus()
      }
    } catch (err) {
      console.error('OTP verification error:', err)
      setError('An unexpected error occurred. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleResend = async () => {
    if (!pendingPhone) return

    setIsResending(true)
    setError('')
    setSuccess('')

    try {
      const response = await fetch('/api/auth/request-otp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ phone: pendingPhone }),
      })

      const data = await response.json()

      if (data.success) {
        // Update expiry time
        useAuthStore.getState().setPendingPhone(pendingPhone, data.data.expiresAt)
        setSecondsRemaining(300)
        setCanResend(false)
        setSuccess('New OTP sent successfully!')
        // Clear existing OTP
        setOTP(['', '', '', '', '', ''])
        inputRefs.current[0]?.focus()
      } else {
        setError(data.message || 'Failed to resend OTP')
      }
    } catch (err) {
      console.error('Resend OTP error:', err)
      setError('Failed to resend OTP. Please try again.')
    } finally {
      setIsResending(false)
    }
  }

  const handleChangePhone = () => {
    clearPendingPhone()
    router.push('/login')
  }

  // ==========================================
  // EARLY RETURN IF NO PENDING PHONE
  // ==========================================

  if (!pendingPhone) {
    return null // Will redirect to /login via useEffect
  }

  const isFormValid = otp.every((digit) => digit !== '')
  const isExpired = secondsRemaining <= 0

  // ==========================================
  // RENDER
  // ==========================================

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 flex items-center justify-center p-4">
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
            <h1 className="text-3xl font-bold text-gray-900">Verify OTP</h1>
            <p className="text-gray-600">
              Enter the code sent to{' '}
              <span className="font-semibold text-gray-900">
                {formatPhoneNumber(pendingPhone)}
              </span>
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

          {/* Expired Warning */}
          {isExpired && !error && (
            <Alert
              type="warning"
              message="OTP has expired. Please request a new code."
            />
          )}

          {/* OTP Input */}
          <div className="space-y-4">
            <label className="block text-sm font-medium text-gray-700 text-center">
              Verification Code
            </label>

            {/* 6-digit OTP inputs */}
            <div className="flex gap-2 justify-center">
              {otp.map((digit, index) => (
                <input
                  key={index}
                  ref={(el) => {
                    inputRefs.current[index] = el
                  }}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleOTPChange(index, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(index, e)}
                  disabled={isLoading || isExpired}
                  className="w-12 h-14 text-center text-2xl font-bold border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none transition-all disabled:bg-gray-100 disabled:cursor-not-allowed"
                  autoFocus={index === 0}
                />
              ))}
            </div>

            {/* Timer */}
            <div className="text-center">
              {!isExpired ? (
                <p className="text-sm text-gray-600">
                  Code expires in{' '}
                  <span className="font-semibold text-blue-600">
                    {formatTimeRemaining(secondsRemaining)}
                  </span>
                </p>
              ) : (
                <p className="text-sm text-red-600 font-semibold">
                  Code has expired
                </p>
              )}
            </div>
          </div>

          {/* Verify Button */}
          <Button
            onClick={handleVerify}
            variant="primary"
            size="lg"
            isLoading={isLoading}
            disabled={!isFormValid || isLoading || isExpired}
            fullWidth
          >
            Verify & Sign In
          </Button>

          {/* Footer Actions */}
          <div className="pt-4 border-t border-gray-200 space-y-3">
            {/* Resend OTP */}
            <div className="text-center">
              {canResend || isExpired ? (
                <Button
                  onClick={handleResend}
                  variant="outline"
                  size="sm"
                  isLoading={isResending}
                  disabled={isResending}
                >
                  Resend OTP
                </Button>
              ) : (
                <p className="text-sm text-gray-500">
                  Didn't receive the code? Wait{' '}
                  {formatTimeRemaining(secondsRemaining)} to resend
                </p>
              )}
            </div>

            {/* Change Phone */}
            <div className="text-center">
              <button
                onClick={handleChangePhone}
                className="text-sm text-blue-600 hover:text-blue-700 font-medium transition-colors"
              >
                Change phone number
              </button>
            </div>
          </div>

          {/* Help Text */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <div className="flex gap-3">
              <svg
                className="w-5 h-5 text-gray-600 flex-shrink-0 mt-0.5"
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
                <p className="text-sm text-gray-700">
                  <strong>Tip:</strong> You can paste the code directly from
                  your messages app.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Development Info */}
        {process.env.NODE_ENV === 'development' && (
          <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-xs font-semibold text-yellow-800 mb-2">
              🧪 Development Mode
            </p>
            <p className="text-xs text-yellow-700">
              Check your server console for the OTP code
            </p>
            <p className="text-xs text-yellow-700 mt-1 font-mono">
              Example: "Your verification code is: 123456"
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
