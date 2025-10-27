/**
 * Invoice Download API Route
 * GET /api/invoices/[invoiceId]/download
 * 
 * Downloads invoice PDF with authorization
 * Returns PDF file or error
 */

import { NextRequest, NextResponse } from 'next/server';
import { downloadInvoice } from '@/actions/invoices';
import { readFile } from 'fs/promises';
import { join } from 'path';

export async function GET(
  request: NextRequest,
  { params }: { params: { invoiceId: string } }
) {
  try {
    const invoiceId = params.invoiceId;

    // Get userId from query params (in real app, get from session/JWT)
    const userId = request.nextUrl.searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 401 }
      );
    }

    // Get download authorization
    const result = await downloadInvoice({ invoiceId, userId });

    if (!result.success || !result.data) {
      return NextResponse.json(
        { error: result.error },
        { status: result.error?.includes('Unauthorized') ? 403 : 404 }
      );
    }

    const { pdfUrl, invoiceNumber } = result.data as { pdfUrl: string; invoiceNumber: string };

    // Read PDF file from public directory
    // pdfUrl format: /invoices/2025/INV-2025-00001.pdf
    const filePath = join(process.cwd(), 'public', pdfUrl);

    try {
      const fileBuffer = await readFile(filePath);

      // Return PDF with proper headers
      return new NextResponse(fileBuffer, {
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="${invoiceNumber}.pdf"`,
          'Cache-Control': 'private, max-age=3600',
        },
      });
    } catch (fileError) {
      console.error('Error reading PDF file:', fileError);
      return NextResponse.json(
        { error: 'PDF file not found. Please contact support.' },
        { status: 404 }
      );
    }
  } catch (error) {
    console.error('Error in GET /api/invoices/[invoiceId]/download:', error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to download invoice',
      },
      { status: 500 }
    );
  }
}
