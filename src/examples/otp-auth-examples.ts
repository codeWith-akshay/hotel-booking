/**
 * OTP Authentication Flow - Test Examples
 * 
 * This file demonstrates how to use the OTP authentication system
 * Use these examples for manual testing or integration tests
 */

// ==========================================
// EXAMPLE 1: Request OTP
// ==========================================

async function exampleRequestOTP() {
  const response = await fetch('http://localhost:3000/api/auth/request-otp', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      phone: '+14155551234', // Use your phone number
    }),
  })

  const data = await response.json()
  console.log('✅ OTP Request Response:', data)

  /**
   * Expected Success Response:
   * {
   *   "success": true,
   *   "message": "OTP sent successfully to +14155551234",
   *   "data": {
   *     "expiresIn": 300,
   *     "expiresAt": "2024-01-15T10:05:00.000Z"
   *   }
   * }
   * 
   * Check console logs for the OTP code (mock SMS service):
   * 📱 [MOCK SMS] Sending OTP to +14155551234
   * Your verification code is: 123456
   */

  return data
}

// ==========================================
// EXAMPLE 2: Verify OTP
// ==========================================

async function exampleVerifyOTP(phone: string, otp: string) {
  const response = await fetch('http://localhost:3000/api/auth/verify-otp', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      phone,
      otp,
    }),
    credentials: 'include', // Important: Include cookies
  })

  const data = await response.json()
  console.log('✅ OTP Verification Response:', data)

  /**
   * Expected Success Response:
   * {
   *   "success": true,
   *   "message": "OTP verified successfully",
   *   "data": {
   *     "userId": "uuid-here",
   *     "phone": "+14155551234",
   *     "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
   *   }
   * }
   * 
   * Cookies are automatically set by the server:
   * - auth-session: Access token (15 minutes)
   * - refresh-token: Refresh token (7 days)
   */

  return data
}

// ==========================================
// EXAMPLE 3: Complete Authentication Flow
// ==========================================

async function exampleCompleteFlow() {
  console.log('🚀 Starting OTP Authentication Flow...\n')

  const phone = '+14155551234'

  // Step 1: Request OTP
  console.log('📱 Step 1: Requesting OTP...')
  const requestResult = await exampleRequestOTP()

  if (!requestResult.success) {
    console.error('❌ Failed to request OTP:', requestResult)
    return
  }

  console.log('✅ OTP sent successfully!\n')

  // Step 2: Get OTP from console logs (in production, user receives via SMS)
  console.log('⚠️  Check your server console logs for the OTP code')
  console.log('Example: "Your verification code is: 123456"\n')

  // For testing, you can hardcode the OTP if you know it
  const otp = '123456' // Replace with actual OTP from console

  // Wait a bit to simulate user entering OTP
  await new Promise(resolve => setTimeout(resolve, 2000))

  // Step 3: Verify OTP
  console.log('🔐 Step 2: Verifying OTP...')
  const verifyResult = await exampleVerifyOTP(phone, otp)

  if (!verifyResult.success) {
    console.error('❌ Failed to verify OTP:', verifyResult)
    return
  }

  console.log('✅ Authentication successful!')
  console.log('👤 User ID:', verifyResult.data.userId)
  console.log('📱 Phone:', verifyResult.data.phone)
  console.log('🎫 Access Token:', verifyResult.data.token.substring(0, 50) + '...\n')

  console.log('🍪 Session cookies have been set:')
  console.log('  - auth-session (15 minutes)')
  console.log('  - refresh-token (7 days)\n')

  console.log('✨ You can now access protected routes!')
}

// ==========================================
// EXAMPLE 4: Access Protected Route
// ==========================================

async function exampleAccessProtectedRoute(accessToken: string) {
  // Option 1: Using cookies (recommended)
  const response1 = await fetch('http://localhost:3000/api/protected', {
    method: 'GET',
    credentials: 'include', // Send cookies
  })

  // Option 2: Using Authorization header
  const response2 = await fetch('http://localhost:3000/api/protected', {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
    },
  })

  const data = await response1.json()
  console.log('✅ Protected Route Response:', data)
}

// ==========================================
// EXAMPLE 5: Error Handling
// ==========================================

async function exampleErrorHandling() {
  console.log('🚀 Testing Error Scenarios...\n')

  // Test 1: Invalid phone number
  console.log('❌ Test 1: Invalid phone number')
  const invalidPhone = await fetch('http://localhost:3000/api/auth/request-otp', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phone: '123456' }),
  })
  console.log(await invalidPhone.json())
  console.log()

  // Test 2: Invalid OTP format
  console.log('❌ Test 2: Invalid OTP format')
  const invalidOTP = await fetch('http://localhost:3000/api/auth/verify-otp', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phone: '+14155551234', otp: 'abc123' }),
  })
  console.log(await invalidOTP.json())
  console.log()

  // Test 3: Wrong OTP
  console.log('❌ Test 3: Wrong OTP')
  const wrongOTP = await fetch('http://localhost:3000/api/auth/verify-otp', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phone: '+14155551234', otp: '999999' }),
  })
  console.log(await wrongOTP.json())
  console.log()

  // Test 4: Rate limiting (requires 3+ requests in 15 minutes)
  console.log('❌ Test 4: Rate limiting')
  for (let i = 0; i < 4; i++) {
    const response = await fetch('http://localhost:3000/api/auth/request-otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone: '+14155559999' }),
    })
    const data = await response.json()
    console.log(`Request ${i + 1}:`, data.success ? '✅' : '❌', data.message)
  }
}

// ==========================================
// EXAMPLE 6: Using Server Actions (Client Component)
// ==========================================

/**
 * Example React component using Server Actions
 * This demonstrates the recommended approach for client-side usage
 */
/*
'use client'

import { useState } from 'react'
import { requestOTPAction } from '@/actions/auth/request-otp.action'
import { verifyOTPAction } from '@/actions/auth/verify-otp.action'

export function OTPLoginForm() {
  const [phone, setPhone] = useState('+14155551234')
  const [otp, setOTP] = useState('')
  const [step, setStep] = useState<'phone' | 'otp'>('phone')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleRequestOTP = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const result = await requestOTPAction(phone)

    if (result.success) {
      setStep('otp')
      alert('OTP sent! Check your phone.')
    } else {
      setError(result.message)
    }

    setLoading(false)
  }

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const result = await verifyOTPAction(phone, otp)

    if (result.success) {
      alert('Login successful!')
      // Redirect to dashboard
      window.location.href = '/dashboard'
    } else {
      setError(result.message)
    }

    setLoading(false)
  }

  if (step === 'phone') {
    return (
      <form onSubmit={handleRequestOTP}>
        <input
          type="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="+1 (415) 555-1234"
          required
        />
        <button type="submit" disabled={loading}>
          {loading ? 'Sending...' : 'Send OTP'}
        </button>
        {error && <p className="error">{error}</p>}
      </form>
    )
  }

  return (
    <form onSubmit={handleVerifyOTP}>
      <input
        type="text"
        value={otp}
        onChange={(e) => setOTP(e.target.value)}
        placeholder="Enter 6-digit code"
        maxLength={6}
        required
      />
      <button type="submit" disabled={loading}>
        {loading ? 'Verifying...' : 'Verify OTP'}
      </button>
      {error && <p className="error">{error}</p>}
      <button type="button" onClick={() => setStep('phone')}>
        Change phone number
      </button>
    </form>
  )
}
*/

// ==========================================
// RUN EXAMPLES
// ==========================================

// Uncomment to run:
// exampleCompleteFlow()
// exampleErrorHandling()

export {
  exampleRequestOTP,
  exampleVerifyOTP,
  exampleCompleteFlow,
  exampleAccessProtectedRoute,
  exampleErrorHandling,
}
