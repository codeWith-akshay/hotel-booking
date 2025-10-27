/**
 * API Route: Booking Rules
 * GET  /api/superadmin/rules - Fetch booking rules
 * POST /api/superadmin/rules - Update booking rules
 */

import { NextRequest, NextResponse } from 'next/server'
import { fetchBookingRules, updateBookingRules } from '@/actions/superadmin/rules'
import { UpdateBookingRulesRequestSchema } from '@/lib/validation/superadmin.validation'

export async function GET() {
  try {
    const result = await fetchBookingRules()

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 })
    }

    return NextResponse.json({ success: true, rules: result.rules }, { status: 200 })
  } catch (error) {
    console.error('[GET /api/superadmin/rules] Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    const validation = UpdateBookingRulesRequestSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.issues[0]?.message || 'Validation failed' },
        { status: 400 }
      )
    }

    const result = await updateBookingRules(validation.data)

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 })
    }

    return NextResponse.json(
      { success: true, message: result.message, rules: result.rules },
      { status: 200 }
    )
  } catch (error) {
    console.error('[POST /api/superadmin/rules] Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
