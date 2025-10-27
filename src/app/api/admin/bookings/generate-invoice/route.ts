/**
 * Admin Generate Invoice API Route (Day 15)
 * POST /api/admin/bookings/generate-invoice - Generate invoice for booking
 */

import { NextRequest, NextResponse } from 'next/server'
import { generateInvoice } from '@/actions/admin/bookings'
import { GenerateInvoiceSchema } from '@/lib/validation/invoice.validation'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
  // Validate input (use canonical invoice schema)
  const validated = GenerateInvoiceSchema.parse(body)
    
    // Generate invoice
    const result = await generateInvoice(validated)
    
    if (!result.success) {
      const statusCode =
        result.error === 'BOOKING_NOT_FOUND' ? 404
        : result.error === 'PAYMENT_NOT_COMPLETE' ? 402
        : result.error === 'UNAUTHORIZED' ? 403
        : 500
      
      return NextResponse.json(result, { status: statusCode })
    }
    
    return NextResponse.json(result, { status: 200 })
    
  } catch (error: any) {
    console.error('POST /api/admin/bookings/generate-invoice error:', error)
    
    if (error.name === 'ZodError') {
      const issues = (error as any).issues || error.issues || []
      return NextResponse.json(
        {
          success: false,
          error: 'VALIDATION_ERROR',
          message: 'Invalid request data',
          details: issues.map((i: any) => ({ field: Array.isArray(i.path) ? i.path.join('.') : String(i.path || ''), message: i.message })),
        },
        { status: 400 }
      )
    }
    
    return NextResponse.json(
      {
        success: false,
        error: 'INTERNAL_ERROR',
        message: 'Failed to generate invoice',
      },
      { status: 500 }
    )
  }
}
