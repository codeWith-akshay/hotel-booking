/**
 * Join Waitlist API Route (Day 14)
 * 
 * POST /api/member/bookings/join-waitlist - Add user to waitlist
 */

import { NextRequest, NextResponse } from 'next/server'
import { joinMemberWaitlist } from '@/actions/member/bookings'
import { JoinWaitlistRequestSchema } from '@/lib/validation/member.validation'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validate input
    const input = JoinWaitlistRequestSchema.parse(body)
    
    // Join waitlist
    const result = await joinMemberWaitlist(input)
    
    if (!result.success) {
      const statusCode = result.error === 'ROOM_TYPE_NOT_FOUND' ? 404
        : result.error === 'ALREADY_ON_WAITLIST' ? 409
        : 400
      
      return NextResponse.json(result, { status: statusCode })
    }
    
    return NextResponse.json(result, { status: 201 })
    
  } catch (error: any) {
    console.error('POST /api/member/bookings/join-waitlist error:', error)
    
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
        message: 'An error occurred while joining the waitlist',
      },
      { status: 500 }
    )
  }
}
