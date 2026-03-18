/**
 * Logout API Route
 * 
 * Handles user logout by clearing authentication cookies.
 * 
 * @module logout.route
 */

import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

/**
 * POST /api/auth/logout
 * Logout user by clearing session cookies
 * 
 * @returns {Promise<NextResponse>} Success response
 */
export async function POST() {
  try {
    const cookieStore = await cookies()
    
    // Clear authentication cookies
    cookieStore.delete('auth-session')
    cookieStore.delete('refresh-token')
    
    console.log('✅ User logged out successfully - cookies cleared')
    
    return NextResponse.json(
      {
        success: true,
        message: 'Logged out successfully',
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('❌ Logout error:', error)
    
    return NextResponse.json(
      {
        success: false,
        error: 'Logout failed',
        message: 'An error occurred during logout',
      },
      { status: 500 }
    )
  }
}
