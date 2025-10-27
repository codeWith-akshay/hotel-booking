/**
 * Day 19: Cron API Route for Scheduled Notifications
 * GET /api/cron/send-notifications - Trigger scheduled notification processing
 * 
 * This endpoint is designed to be called by:
 * 1. Vercel Cron Jobs (https://vercel.com/docs/cron-jobs)
 * 2. External cron services (cron-job.org, EasyCron, etc.)
 * 3. Manual triggers for testing
 * 
 * Security: Uses CRON_SECRET environment variable for authentication
 */

import { NextRequest, NextResponse } from 'next/server';
import { processScheduledNotifications } from '@/actions/notifications';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    // Get authorization header or query parameter
    const authHeader = request.headers.get('authorization');
    const secretParam = request.nextUrl.searchParams.get('secret');
    
    // Extract secret from bearer token or query param
    const providedSecret = authHeader?.replace('Bearer ', '') || secretParam;
    const expectedSecret = process.env.CRON_SECRET;

    // Validate secret (if CRON_SECRET is set in environment)
    if (expectedSecret && providedSecret !== expectedSecret) {
      console.warn('[Cron API] Unauthorized access attempt');
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    console.log('[Cron API] Processing scheduled notifications...');

    // Process all pending notifications
    const result = await processScheduledNotifications();

    if (!result.success) {
      console.error('[Cron API] Error processing notifications:', result.error);
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 500 }
      );
    }

    console.log(
      `[Cron API] Success! Processed: ${result.data?.processed}, Succeeded: ${result.data?.succeeded}, Failed: ${result.data?.failed}`
    );

    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    console.error('[Cron API] Unexpected error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
      },
      { status: 500 }
    );
  }
}

// Also support POST for some cron services
export async function POST(request: NextRequest) {
  return GET(request);
}
