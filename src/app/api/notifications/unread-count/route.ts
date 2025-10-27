/**
 * Unread Notifications Count API
 * GET /api/notifications/unread-count
 * Returns the count of unread notifications for the authenticated user
 */

import { NextRequest, NextResponse } from 'next/server'
import { verifyAccessToken } from '@/lib/auth/jwt.service'
import { getUnreadNotificationCount } from '@/lib/services/notification.service'

export async function GET(request: NextRequest) {
  try {
    // Check authentication via Authorization header
    const authHeader = request.headers.get('authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const token = authHeader.substring(7)
    
    // Verify JWT token
    const payload = verifyAccessToken(token)
    if (!payload || !payload.userId) {
      return NextResponse.json(
        { success: false, error: 'Invalid token' },
        { status: 401 }
      )
    }

    // Get unread count
    const count = await getUnreadNotificationCount(payload.userId)

    return NextResponse.json(
      {
        success: true,
        count,
      },
      {
        headers: {
          // Cache for 30 seconds to reduce redundant queries
          'Cache-Control': 'private, max-age=30, must-revalidate',
          // Add ETag for conditional requests
          'ETag': `"unread-${payload.userId}-${count}-${Date.now()}"`,
        },
      }
    )
  } catch (error) {
    console.error('[GET /api/notifications/unread-count] Error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
