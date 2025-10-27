/**
 * Get Invoice by Booking ID API Route
 * GET /api/invoices/booking/[bookingId]
 * 
 * Retrieves invoice for a specific booking
 * Requires authentication and authorization
 */

import { NextRequest, NextResponse } from 'next/server';
import { getInvoiceByBookingId } from '@/actions/invoices';

export async function GET(
  request: NextRequest,
  { params }: { params: { bookingId: string } }
) {
  try {
    const bookingId = params.bookingId;

    // Get userId from query params (in real app, get from session/JWT)
    const userId = request.nextUrl.searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 401 }
      );
    }

    // Get invoice
    const result = await getInvoiceByBookingId({ bookingId, userId });

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: result.error?.includes('Unauthorized') ? 403 : 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: result.data,
    });
  } catch (error) {
    console.error('Error in GET /api/invoices/booking/[bookingId]:', error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to retrieve invoice',
      },
      { status: 500 }
    );
  }
}
