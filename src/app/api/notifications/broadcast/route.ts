/**
 * Day 19: Broadcast Notification API Route
 * POST /api/notifications/broadcast - Send bulk notifications (SuperAdmin only)
 */

import { NextRequest, NextResponse } from 'next/server';
import { broadcastNotification } from '@/actions/notifications';
import { getCurrentUser } from '@/lib/middleware/auth.utils';

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const user = await getCurrentUser()
    if (!user || !user.userId) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();

    // Validate required fields
    if (!body.channel || !body.message) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required fields: channel, message',
        },
        { status: 400 }
      );
    }

    // Call broadcast server action
    const result = await broadcastNotification({
      adminId: user.userId,
      recipientIds: body.recipientIds,
      channel: body.channel,
      message: body.message,
      subject: body.subject,
      scheduledAt: body.scheduledAt ? new Date(body.scheduledAt) : undefined,
      filterByRole: body.filterByRole,
      metadata: body.metadata,
    });

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error, errors: result.errors },
        { status: result.error?.includes('permission') ? 403 : 400 }
      );
    }

    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    console.error('[POST /api/notifications/broadcast] Error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
