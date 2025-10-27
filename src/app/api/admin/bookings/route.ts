/**
 * Admin Bookings API Route (Day 15)
 * GET /api/admin/bookings - Fetch bookings with filters
 */

import { NextRequest, NextResponse } from 'next/server'
import { fetchAdminBookings } from '@/actions/admin/bookings'
import { BookingFiltersSchema } from '@/lib/validation/admin.validation'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.url ? new URL(request.url) : { searchParams: new URLSearchParams() }
    
    // Parse filters from query params
    const filters: any = {}
    
    if (searchParams.get('startDate')) filters.startDate = searchParams.get('startDate')
    if (searchParams.get('endDate')) filters.endDate = searchParams.get('endDate')
    if (searchParams.get('memberSearch')) filters.memberSearch = searchParams.get('memberSearch')
    if (searchParams.get('status')) filters.status = searchParams.get('status')
    if (searchParams.get('paymentStatus')) filters.paymentStatus = searchParams.get('paymentStatus')
    if (searchParams.get('roomTypeId')) filters.roomTypeId = searchParams.get('roomTypeId')
    if (searchParams.get('page')) filters.page = parseInt(searchParams.get('page') || '1')
    if (searchParams.get('limit')) filters.limit = parseInt(searchParams.get('limit') || '20')
    if (searchParams.get('sortBy')) filters.sortBy = searchParams.get('sortBy')
    if (searchParams.get('sortOrder')) filters.sortOrder = searchParams.get('sortOrder')
    
    // Validate filters
    const validated = BookingFiltersSchema.parse(filters)
    
    // Fetch bookings
    const result = await fetchAdminBookings(validated)
    
    if (!result.success) {
      return NextResponse.json(result, { status: 500 })
    }
    
    return NextResponse.json(result, { status: 200 })
    
  } catch (error: any) {
    console.error('GET /api/admin/bookings error:', error)
    
    if (error.name === 'ZodError') {
      return NextResponse.json(
        {
          success: false,
          error: 'VALIDATION_ERROR',
          message: 'Invalid filter parameters',
          details: error.errors,
        },
        { status: 400 }
      )
    }
    
    return NextResponse.json(
      {
        success: false,
        error: 'INTERNAL_ERROR',
        message: 'Failed to fetch bookings',
      },
      { status: 500 }
    )
  }
}
