/**
 * API Route: Special Days
 * GET    /api/superadmin/special-days - Fetch special days
 * POST   /api/superadmin/special-days - Create/update special day
 */

import { NextRequest, NextResponse } from 'next/server'
import { fetchSpecialDays, upsertSpecialDay } from '@/actions/superadmin/rules'
import {
  FetchSpecialDaysQuerySchema,
  UpsertSpecialDayRequestSchema,
} from '@/lib/validation/superadmin.validation'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)

    const query: any = {}
    if (searchParams.get('startDate')) query.startDate = searchParams.get('startDate')
    if (searchParams.get('endDate')) query.endDate = searchParams.get('endDate')
    if (searchParams.get('roomTypeId')) query.roomTypeId = searchParams.get('roomTypeId')
    if (searchParams.get('ruleType')) query.ruleType = searchParams.get('ruleType')
    if (searchParams.get('active')) query.active = searchParams.get('active')

    const validation = FetchSpecialDaysQuerySchema.safeParse(query)
    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.issues[0]?.message || 'Validation failed' },
        { status: 400 }
      )
    }

    const result = await fetchSpecialDays(validation.data)

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 })
    }

    return NextResponse.json({ success: true, specialDays: result.specialDays }, { status: 200 })
  } catch (error) {
    console.error('[GET /api/superadmin/special-days] Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    const validation = UpsertSpecialDayRequestSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.issues[0]?.message || 'Validation failed' },
        { status: 400 }
      )
    }

    const result = await upsertSpecialDay(validation.data)

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 })
    }

    return NextResponse.json(
      { success: true, message: result.message, specialDay: result.specialDay },
      { status: 200 }
    )
  } catch (error) {
    console.error('[POST /api/superadmin/special-days] Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
