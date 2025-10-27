// ==========================================
// CHECK-IN REMINDER SCHEDULER API
// ==========================================
// Manual trigger endpoint for check-in reminders
// This can be called by cron jobs or manually for testing

import { NextRequest, NextResponse } from 'next/server'
import { triggerCheckInReminders } from '@/lib/services/checkin-reminder-scheduler.service'

// ==========================================
// GET ENDPOINT - MANUAL TRIGGER
// ==========================================

/**
 * GET /api/scheduler/checkin-reminders
 *
 * Manually trigger check-in reminder notifications
 * This endpoint can be called by:
 * - Cron jobs for daily execution
 * - Admin dashboard for manual triggering
 * - Testing purposes
 *
 * Returns the result of the reminder sending process
 */
export async function GET(req: NextRequest) {
  try {
    console.log('[CheckInReminderAPI] Manual trigger requested')

    // Execute the reminder scheduler
    const result = await triggerCheckInReminders()

    // Return appropriate status based on result
    const status = result.success ? 200 : 500

    return NextResponse.json(result, { status })

  } catch (error) {
    console.error('[CheckInReminderAPI] Error:', error)

    return NextResponse.json(
      {
        success: false,
        message: 'Internal server error while processing check-in reminders',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

// ==========================================
// POST ENDPOINT - SCHEDULED TRIGGER
// ==========================================

/**
 * POST /api/scheduler/checkin-reminders
 *
 * Scheduled trigger for check-in reminders (for cron jobs)
 * This endpoint can be called by external schedulers like cron, GitHub Actions, etc.
 *
 * Expected headers:
 * - Authorization: Bearer <token> (optional, for security)
 *
 * Returns minimal response for automated systems
 */
export async function POST(req: NextRequest) {
  try {
    console.log('[CheckInReminderAPI] Scheduled trigger requested')

    // Optional: Check for authorization header
    const authHeader = req.headers.get('authorization')
    const expectedToken = process.env.CRON_SECRET_TOKEN

    if (expectedToken && (!authHeader || !authHeader.startsWith('Bearer ') || authHeader.split(' ')[1] !== expectedToken)) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Execute the reminder scheduler
    const result = await triggerCheckInReminders()

    // Return minimal response for cron jobs
    return NextResponse.json({
      success: result.success,
      sent: result.sent || 0,
      failed: result.failed || 0,
    }, {
      status: result.success ? 200 : 500
    })

  } catch (error) {
    console.error('[CheckInReminderAPI] Error:', error)

    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
}