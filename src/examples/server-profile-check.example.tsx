/**
 * Example: Server-Side Profile Completion Check
 * 
 * Shows how to use profile check utilities in Server Components and API Routes
 */

import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { verifyAccessToken } from '@/lib/auth/jwt.service'
import {
  isProfileCompleted,
  getProfileCompletionStatus,
  requireProfileCompletion,
  getProfileSetupUrl,
} from '@/lib/auth/profile-check'

// ==========================================
// Example 1: Server Component with Profile Check
// ==========================================

export default async function DashboardPage() {
  // Get user from JWT cookie
  const cookieStore = await cookies()
  const authCookie = cookieStore.get('auth-session')

  if (!authCookie) {
    redirect('/login')
  }

  const decoded = verifyAccessToken(authCookie.value)

  if (!decoded || !decoded.userId) {
    redirect('/login')
  }

  // Method 1: Simple boolean check
  const profileComplete = await isProfileCompleted(decoded.userId)

  if (!profileComplete) {
    redirect('/profile/setup?message=Please complete your profile&returnTo=/dashboard')
  }

  // Method 2: Detailed status check (provides more info)
  const status = await getProfileCompletionStatus(decoded.userId)

  if (!status.completed) {
    redirect(status.redirectTo || '/profile/setup')
  }

  // Method 3: Using requireProfileCompletion (throws if incomplete)
  try {
    await requireProfileCompletion(decoded.userId)
  } catch (error) {
    redirect('/profile/setup?message=Profile setup required')
  }

  // If we reach here, profile is completed
  return (
    <div>
      <h1>Dashboard</h1>
      <p>Welcome! Your profile is complete.</p>
    </div>
  )
}

// ==========================================
// Example 2: API Route with Profile Check
// ==========================================

import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  // Get user from JWT cookie
  const cookieStore = await cookies()
  const authCookie = cookieStore.get('auth-session')

  if (!authCookie) {
    return NextResponse.json(
      { error: 'Unauthorized', message: 'Authentication required' },
      { status: 401 }
    )
  }

  const decoded = verifyAccessToken(authCookie.value)

  if (!decoded || !decoded.userId) {
    return NextResponse.json(
      { error: 'Unauthorized', message: 'Invalid token' },
      { status: 401 }
    )
  }

  // Check profile completion
  const status = await getProfileCompletionStatus(decoded.userId)

  if (!status.completed) {
    return NextResponse.json(
      {
        error: 'Profile Incomplete',
        message: status.message,
        redirectTo: status.redirectTo,
      },
      { status: 403 }
    )
  }

  // Profile is complete, proceed with API logic
  return NextResponse.json({
    success: true,
    message: 'API request successful',
    userId: decoded.userId,
  })
}

// ==========================================
// Example 3: Server Action with Profile Check
// ==========================================

'use server'

import { prisma } from '@/lib/prisma'

export async function getUserData(userId: string) {
  // Ensure profile is completed before fetching data
  try {
    await requireProfileCompletion(userId)
  } catch (error) {
    throw new Error('Profile setup required before accessing user data')
  }

  // Fetch user data
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      address: true,
      vipStatus: true,
      profileCompleted: true,
    },
  })

  return user
}

// ==========================================
// Example 4: Conditional Rendering Based on Profile Status
// ==========================================

export async function ConditionalContentPage() {
  const cookieStore = await cookies()
  const authCookie = cookieStore.get('auth-session')

  if (!authCookie) {
    redirect('/login')
  }

  const decoded = verifyAccessToken(authCookie.value)

  if (!decoded || !decoded.userId) {
    redirect('/login')
  }

  const status = await getProfileCompletionStatus(decoded.userId)

  // Show different content based on profile status
  if (!status.completed) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Complete Your Profile</h1>
          <p className="text-gray-600 mb-6">{status.message}</p>
          <a
            href={status.redirectTo}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700"
          >
            Complete Profile Now
          </a>
        </div>
      </div>
    )
  }

  return (
    <div>
      <h1>Full Access Content</h1>
      <p>Your profile is complete. Enjoy all features!</p>
    </div>
  )
}
