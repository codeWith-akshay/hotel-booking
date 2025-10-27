/**
 * Day 19: List Notifications API Route
 * GET /api/notifications - List notifications with filters
 */

import { NextRequest, NextResponse } from 'next/server';
import { listNotifications } from '@/actions/notifications';
import { verifyAccessToken } from '@/lib/auth/jwt.service';

export async function GET(request: NextRequest) {
  try {
    // Check authentication via Authorization header
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix
    
    // Verify JWT token
    const payload = verifyAccessToken(token);
    if (!payload || !payload.userId) {
      return NextResponse.json({ success: false, error: 'Invalid token' }, { status: 401 });
    }

    const authenticatedUserId = payload.userId;

    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const filterUserId = searchParams.get('userId') || undefined;
    const type = searchParams.get('type') || undefined;
    const channel = searchParams.get('channel') || undefined;
    const status = searchParams.get('status') || undefined;
    const startDate = searchParams.get('startDate') ? new Date(searchParams.get('startDate')!) : undefined;
    const endDate = searchParams.get('endDate') ? new Date(searchParams.get('endDate')!) : undefined;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const sortBy = (searchParams.get('sortBy') || 'createdAt') as any;
    const sortOrder = (searchParams.get('sortOrder') || 'desc') as any;

    // Call server action
    const result = await listNotifications({
      userId: filterUserId,
      requestUserId: authenticatedUserId,
      type: type as any,
      channel: channel as any,
      status: status as any,
      startDate,
      endDate,
      page,
      limit,
      sortBy,
      sortOrder,
    });

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error, errors: result.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    console.error('[GET /api/notifications] Error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
