/**
 * Day 19: Send Notification API Route
 * POST /api/notifications/send - Send a single notification
 */

import { NextRequest, NextResponse } from 'next/server';
import { createNotification, sendNotification } from '@/actions/notifications';
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
    if (!body.userId || !body.type || !body.channel || !body.message) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required fields: userId, type, channel, message',
        },
        { status: 400 }
      );
    }

    // Create notification
    const createResult = await createNotification({
      userId: body.userId,
      bookingId: body.bookingId,
      type: body.type,
      channel: body.channel,
      message: body.message,
      subject: body.subject,
      scheduledAt: body.scheduledAt ? new Date(body.scheduledAt) : new Date(),
      metadata: body.metadata,
    });

    if (!createResult.success || !createResult.data) {
      return NextResponse.json(
        { success: false, error: createResult.error, errors: createResult.errors },
        { status: 400 }
      );
    }

    // If scheduledAt is now or not provided, send immediately
    if (!body.scheduledAt || new Date(body.scheduledAt) <= new Date()) {
      const sendResult = await sendNotification({
        notificationId: createResult.data.id,
        requestUserId: user.userId,
      });

      if (!sendResult.success) {
        return NextResponse.json(
          {
            success: false,
            error: sendResult.error,
            data: createResult.data,
          },
          { status: 400 }
        );
      }

      return NextResponse.json(sendResult, { status: 200 });
    }

    // Scheduled for later
    return NextResponse.json(createResult, { status: 201 });
  } catch (error) {
    console.error('[POST /api/notifications/send] Error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
