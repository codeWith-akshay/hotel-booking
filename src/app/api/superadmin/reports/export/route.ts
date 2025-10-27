/**
 * Export Report API Route (Day 17)
 * 
 * POST /api/superadmin/reports/export
 */

import { NextRequest, NextResponse } from 'next/server'
import { exportReport } from '@/actions/superadmin/reports'
import { ExportRequestSchema } from '@/lib/validation/reports.validation'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    const validation = ExportRequestSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: validation.error.issues[0]?.message || 'Validation failed' },
        { status: 400 }
      )
    }

    const { roomTypeId, ...rest } = validation.data
    const result = await exportReport({
      ...rest,
      ...(roomTypeId && { roomTypeId }),
    })

    if (!result.success) {
      return NextResponse.json(result, { status: 400 })
    }

    return NextResponse.json(result, { status: 200 })
  } catch (error) {
    console.error('[POST /api/superadmin/reports/export] Error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
