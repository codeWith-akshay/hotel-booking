// ==========================================
// DEPOSIT POLICY BY ID API ROUTES (DAY 12)
// ==========================================
// REST API endpoints for managing individual deposit policies
// SuperAdmin only

import { NextRequest, NextResponse } from 'next/server'
import {
  getDepositPolicyById,
  updateDepositPolicy,
  deleteDepositPolicy,
} from '@/actions/deposit-policies'
import { UpdateDepositPolicySchema } from '@/lib/validation/group-booking.validation'

// ==========================================
// GET /api/admin/deposit-policies/[id]
// ==========================================

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // TODO: Add authentication and SuperAdmin authorization check

    const result = await getDepositPolicyById(params.id)

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Deposit policy not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: result.data,
    })
  } catch (error) {
    console.error('Error in GET /api/admin/deposit-policies/[id]:', error)

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// ==========================================
// PATCH /api/admin/deposit-policies/[id]
// ==========================================

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // TODO: Add authentication and SuperAdmin authorization check

    const body = await request.json()

    // Validate input
    const validationResult = UpdateDepositPolicySchema.safeParse(body)

    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          details: validationResult.error.flatten().fieldErrors,
        },
        { status: 400 }
      )
    }

    const result = await updateDepositPolicy(params.id, validationResult.data)

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Failed to update deposit policy' },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      data: result.data,
    })
  } catch (error) {
    console.error('Error in PATCH /api/admin/deposit-policies/[id]:', error)

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// ==========================================
// DELETE /api/admin/deposit-policies/[id]
// ==========================================

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // TODO: Add authentication and SuperAdmin authorization check

    const result = await deleteDepositPolicy(params.id)

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Failed to delete deposit policy' },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Deposit policy deactivated successfully',
      data: result.data,
    })
  } catch (error) {
    console.error('Error in DELETE /api/admin/deposit-policies/[id]:', error)

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
