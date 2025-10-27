/**
 * Admin Offline Payment API Route (Day 15)
 * POST /api/admin/bookings/offline-payment - Mark offline payment
 */

import { NextRequest, NextResponse } from 'next/server'
import { markOfflinePayment } from '@/actions/admin/bookings'
import { MarkOfflinePaymentRequestSchema } from '@/lib/validation/admin.validation'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validate input
    const validated = MarkOfflinePaymentRequestSchema.parse(body)
    
    // Mark payment
    const result = await markOfflinePayment(validated)
    
    if (!result.success) {
      const statusCode =
        result.error === 'BOOKING_NOT_FOUND' ? 404
        : result.error === 'UNAUTHORIZED' ? 403
        : result.error === 'ALREADY_PAID' ? 409
        : result.error === 'INVALID_AMOUNT' ? 400
        : 500
      
      return NextResponse.json(result, { status: statusCode })
    }
    
    return NextResponse.json(result, { status: 200 })
    
  } catch (error: any) {
    console.error('POST /api/admin/bookings/offline-payment error:', error)
    
    if (error.name === 'ZodError') {
      return NextResponse.json(
        {
          success: false,
          error: 'VALIDATION_ERROR',
          message: 'Invalid request data',
          details: error.errors,
        },
        { status: 400 }
      )
    }
    
    return NextResponse.json(
      {
        success: false,
        error: 'INTERNAL_ERROR',
        message: 'Failed to process offline payment',
      },
      { status: 500 }
    )
  }
}
