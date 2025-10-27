/**
 * Member Bookings API Route (Day 14)
 * 
 * GET /api/member/bookings - Fetch member bookings
 */

import { NextRequest, NextResponse } from 'next/server'
import { fetchMemberBookings } from '@/actions/member/bookings'
import { FetchBookingsRequestSchema } from '@/lib/validation/member.validation'

export async function GET(request: NextRequest) {
  try {
    // TODO: Get userId from session/auth
    // For now, expect it as query parameter
    const searchParams = request.nextUrl.searchParams
    const userId = searchParams.get('userId')
    const filter = searchParams.get('filter') as any
    const limit = searchParams.get('limit')
    const offset = searchParams.get('offset')
    
    if (!userId) {
      return NextResponse.json(
        {
          success: false,
          error: 'UNAUTHORIZED',
          message: 'User ID is required',
        },
        { status: 401 }
      )
    }
    
    // Validate and fetch bookings
    const input = FetchBookingsRequestSchema.parse({
      userId,
      filter,
      limit: limit ? parseInt(limit) : undefined,
      offset: offset ? parseInt(offset) : undefined,
    })
    
    const result = await fetchMemberBookings(input)
    
    if (!result.success) {
      return NextResponse.json(result, { status: 400 })
    }
    
    return NextResponse.json(result, { status: 200 })
    
  } catch (error: any) {
    console.error('GET /api/member/bookings error:', error)
    
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
        message: 'An error occurred while fetching bookings',
      },
      { status: 500 }
    )
  }
}
