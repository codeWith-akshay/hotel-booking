/**
 * API Route: Special Day Delete
 * DELETE /api/superadmin/special-days/[id] - Delete special day
 */

import { NextRequest, NextResponse } from 'next/server'
import { deleteSpecialDay } from '@/actions/superadmin/rules'
import { DeleteSpecialDayRequestSchema } from '@/lib/validation/superadmin.validation'

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const body = await request.json()
    const { id } = await params

    const validation = DeleteSpecialDayRequestSchema.safeParse({ id, adminId: body.adminId })
    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.issues[0]?.message || 'Validation failed' },
        { status: 400 }
      )
    }

    const result = await deleteSpecialDay(validation.data)

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 })
    }

    return NextResponse.json({ success: true, message: result.message }, { status: 200 })
  } catch (error) {
    console.error('[DELETE /api/superadmin/special-days/[id]] Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
