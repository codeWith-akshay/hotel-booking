/**
 * Invoice Statistics API Route
 * GET /api/invoices/stats
 * 
 * Gets invoice statistics for admin dashboard
 * SuperAdmin only
 */

import { NextRequest, NextResponse } from 'next/server';
import { getInvoiceStatistics } from '@/actions/invoices';

export async function GET(request: NextRequest) {
  try {
    // Get adminId from query params (in real app, get from session/JWT)
    const adminId = request.nextUrl.searchParams.get('adminId');

    if (!adminId) {
      return NextResponse.json(
        { error: 'Admin ID is required' },
        { status: 401 }
      );
    }

    const startDate = request.nextUrl.searchParams.get('startDate') || undefined;
    const endDate = request.nextUrl.searchParams.get('endDate') || undefined;

    // Get statistics
    const result = await getInvoiceStatistics(startDate, endDate, adminId);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: result.error?.includes('Unauthorized') ? 403 : 400 }
      );
    }

    return NextResponse.json({
      success: true,
      data: result.data,
    });
  } catch (error) {
    console.error('Error in GET /api/invoices/stats:', error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get statistics',
      },
      { status: 500 }
    );
  }
}
