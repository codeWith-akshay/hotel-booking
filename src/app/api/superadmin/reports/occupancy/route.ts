/**
 * Occupancy Report API Route (Day 17)
 * 
 * GET /api/superadmin/reports/occupancy
 */

import { NextRequest, NextResponse } from 'next/server'
import { fetchOccupancyReport } from '@/actions/superadmin/reports'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const roomTypeId = searchParams.get('roomTypeId') || undefined
    
    // Get admin ID from auth context (assuming middleware provides it)
    // For now, using a placeholder - replace with actual auth
    const adminId = searchParams.get('adminId') || 'placeholder-admin-id'

    if (!startDate || !endDate) {
      return NextResponse.json(
        { success: false, error: 'startDate and endDate are required' },
        { status: 400 }
      )
    }

    const result = await fetchOccupancyReport({
      adminId,
      startDate,
      endDate,
      ...(roomTypeId && { roomTypeId }),
    })

    if (!result.success) {
      return NextResponse.json(result, { status: 400 })
    }

    return NextResponse.json(result, { status: 200 })
  } catch (error) {
    console.error('[GET /api/superadmin/reports/occupancy] Error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
