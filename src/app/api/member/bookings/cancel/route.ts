/**
 * Cancel Booking API Route (Day 14)
 * 
 * POST /api/member/bookings/cancel - Cancel a booking
 */

import { NextRequest, NextResponse } from 'next/server'
import { cancelMemberBooking } from '@/actions/member/bookings'
import { CancelBookingRequestSchema } from '@/lib/validation/member.validation'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validate input
    const input = CancelBookingRequestSchema.parse(body)
    
    // Cancel booking
    const result = await cancelMemberBooking(input)
    
    if (!result.success) {
      const statusCode = result.error === 'UNAUTHORIZED' ? 403
        : result.error === 'NOT_FOUND' ? 404
        : 400
      
      return NextResponse.json(result, { status: statusCode })
    }
    
    return NextResponse.json(result, { status: 200 })
    
  } catch (error: any) {
    console.error('POST /api/member/bookings/cancel error:', error)
    
    if (error.name === 'ZodError') {
      return NextResponse.json(
        {
          success: false,
          error: 'VALIDATION_ERROR',
          message: 'Invalid request parameters',
          details: error.errors,
        },
        { status: 400 }
      )
    }
    
    return NextResponse.json(
      {
        success: false,
        error: 'INTERNAL_ERROR',
        message: 'An error occurred while canceling the booking',
      },
      { status: 500 }
    )
  }
}
