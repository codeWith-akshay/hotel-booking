// ==========================================
// SPECIAL DAY BY ID API ROUTES (DAY 12)
// ==========================================
// REST API endpoints for managing individual special day rules
// Admin/SuperAdmin only

import { NextRequest, NextResponse } from 'next/server'
import {
  getSpecialDayById,
  updateSpecialDay,
  deleteSpecialDay,
} from '@/actions/special-days'
import { UpdateSpecialDaySchema } from '@/lib/validation/group-booking.validation'

// ==========================================
// GET /api/admin/special-days/[id]
// ==========================================

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // TODO: Add authentication and Admin/SuperAdmin authorization check

    const { id } = await params
    const result = await getSpecialDayById(id)

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Special day not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: result.data,
    })
  } catch (error) {
    console.error('Error in GET /api/admin/special-days/[id]:', error)

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// ==========================================
// PATCH /api/admin/special-days/[id]
// ==========================================

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // TODO: Add authentication and Admin/SuperAdmin authorization check

    const body = await request.json()

    // Validate input
    const validationResult = UpdateSpecialDaySchema.safeParse(body)

    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          details: validationResult.error.flatten().fieldErrors,
        },
        { status: 400 }
      )
    }

    const { id } = await params
    const result = await updateSpecialDay(id, validationResult.data)

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Failed to update special day' },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      data: result.data,
    })
  } catch (error) {
    console.error('Error in PATCH /api/admin/special-days/[id]:', error)

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// ==========================================
// DELETE /api/admin/special-days/[id]
// ==========================================

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // TODO: Add authentication and Admin/SuperAdmin authorization check

    const { id } = await params
    const result = await deleteSpecialDay(id)

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Failed to delete special day' },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Special day deactivated successfully',
      data: result.data,
    })
  } catch (error) {
    console.error('Error in DELETE /api/admin/special-days/[id]:', error)

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
