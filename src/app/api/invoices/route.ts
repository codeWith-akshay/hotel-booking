/**
 * List Invoices API Route
 * GET /api/invoices
 * 
 * Lists invoices with filtering and pagination
 * Members see only their invoices
 * Admins see all invoices
 */

import { NextRequest, NextResponse } from 'next/server';
import { listInvoices } from '@/actions/invoices';
import { ListInvoicesSchema } from '@/lib/validation/invoice.validation';

export async function GET(request: NextRequest) {
  try {
    // Get userId from query params (in real app, get from session/JWT)
    const userId = request.nextUrl.searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 401 }
      );
    }

    // Parse query parameters
    const searchParams = request.nextUrl.searchParams;
    const query = {
      userId: searchParams.get('filterUserId') || undefined,
      paymentStatus: searchParams.get('paymentStatus') as any,
      startDate: searchParams.get('startDate') || undefined,
      endDate: searchParams.get('endDate') || undefined,
      page: searchParams.get('page') ? Number(searchParams.get('page')) : 1,
      limit: searchParams.get('limit') ? Number(searchParams.get('limit')) : 10,
      sortBy: (searchParams.get('sortBy') as any) || 'createdAt',
      sortOrder: (searchParams.get('sortOrder') as any) || 'desc',
    };

    // Validate query
    const validated = ListInvoicesSchema.parse(query);

    // List invoices
    const result = await listInvoices(validated, userId);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      data: result.data,
    });
  } catch (error) {
    console.error('Error in GET /api/invoices:', error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to list invoices',
      },
      { status: 500 }
    );
  }
}
