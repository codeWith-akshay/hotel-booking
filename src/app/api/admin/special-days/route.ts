// ==========================================
// SPECIAL DAY API ROUTES (DAY 12)
// ==========================================
// REST API endpoints for managing special day rules
// Admin/SuperAdmin only

import { NextRequest, NextResponse } from 'next/server'
import {
  createSpecialDay,
  getSpecialDays,
  getSpecialDaysForDateRange,
} from '@/actions/special-days'
import { CreateSpecialDaySchema } from '@/lib/validation/group-booking.validation'

// ==========================================
// GET /api/admin/special-days
// ==========================================

export async function GET(request: NextRequest) {
  try {
    // TODO: Add authentication and Admin/SuperAdmin authorization check
    // const user = await requireAuth(request)
    // if (!['ADMIN', 'SUPERADMIN'].includes(user.role)) {
    //   return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    // }

    const { searchParams } = new URL(request.url)
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const roomTypeId = searchParams.get('roomTypeId')
    const ruleType = searchParams.get('ruleType')
    const active = searchParams.get('active')

    // Build query
    const query: Record<string, unknown> = {}

    if (startDate) query.startDate = new Date(startDate)
    if (endDate) query.endDate = new Date(endDate)
    if (roomTypeId) query.roomTypeId = roomTypeId
    if (ruleType) query.ruleType = ruleType
    if (active !== null) query.active = active === 'true'

    const result = await getSpecialDays(query)

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Failed to fetch special days' },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      data: result.data,
    })
  } catch (error) {
    console.error('Error in GET /api/admin/special-days:', error)

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// ==========================================
// POST /api/admin/special-days
// ==========================================

export async function POST(request: NextRequest) {
  try {
    // TODO: Add authentication and Admin/SuperAdmin authorization check
    // const user = await requireAuth(request)
    // if (!['ADMIN', 'SUPERADMIN'].includes(user.role)) {
    //   return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    // }

    const body = await request.json()

    // Validate input
    const validationResult = CreateSpecialDaySchema.safeParse(body)

    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          details: validationResult.error.flatten().fieldErrors,
        },
        { status: 400 }
      )
    }

    const result = await createSpecialDay(validationResult.data)

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Failed to create special day' },
        { status: 400 }
      )
    }

    return NextResponse.json(
      {
        success: true,
        data: result.data,
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Error in POST /api/admin/special-days:', error)

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
