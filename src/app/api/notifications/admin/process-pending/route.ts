/**
 * Process Pending Notifications API
 * POST /api/notifications/admin/process-pending
 * Sends all pending notifications
 */

import { NextResponse } from 'next/server'
import { sendPendingNotifications } from '@/lib/services/notification-sender.service'

export async function POST() {
  try {
    // Process pending notifications
    const result = await sendPendingNotifications(50) // Process up to 50 at once

    return NextResponse.json({
      success: true,
      message: `Processed ${result.processed} notifications: ${result.sent} sent, ${result.failed} failed`,
      data: result,
    })
  } catch (error) {
    console.error('[POST /api/notifications/admin/process-pending] Error:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to process pending notifications',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
