/**
 * Invoice Generation API Route
 * POST /api/invoices/generate
 * 
 * Generates a new invoice for a booking
 * Requires authentication
 * Admins can generate manually, otherwise automatic on payment success
 */

import { NextRequest, NextResponse } from 'next/server';
import { generateInvoice } from '@/actions/invoices';
import { GenerateInvoiceSchema } from '@/lib/validation/invoice.validation';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate request body
    const validated = GenerateInvoiceSchema.parse(body);

    // Generate invoice
    const result = await generateInvoice(validated);

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
    console.error('Error in POST /api/invoices/generate:', error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to generate invoice',
      },
      { status: 500 }
    );
  }
}
