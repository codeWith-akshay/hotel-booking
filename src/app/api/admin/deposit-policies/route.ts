// ==========================================
// DEPOSIT POLICY API ROUTES (DAY 12)
// ==========================================
// REST API endpoints for managing deposit policies
// SuperAdmin only

import { NextRequest, NextResponse } from 'next/server'
import {
  createDepositPolicy,
  getDepositPolicies,
  getDepositPolicyById,
  updateDepositPolicy,
  deleteDepositPolicy,
} from '@/actions/deposit-policies'
import { CreateDepositPolicySchema, UpdateDepositPolicySchema } from '@/lib/validation/group-booking.validation'

// ==========================================
// GET /api/admin/deposit-policies
// ==========================================

export async function GET(request: NextRequest) {
  try {
    // TODO: Add authentication and SuperAdmin authorization check
    // const user = await requireAuth(request)
    // if (user.role !== 'SUPERADMIN') {
    //   return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    // }

    const { searchParams } = new URL(request.url)
    const active = searchParams.get('active')

    const query = active !== null ? { active: active === 'true' } : {}

    const result = await getDepositPolicies(query)

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Failed to fetch deposit policies' },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      data: result.data,
    })
  } catch (error) {
    console.error('Error in GET /api/admin/deposit-policies:', error)

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// ==========================================
// POST /api/admin/deposit-policies
// ==========================================

export async function POST(request: NextRequest) {
  try {
    // TODO: Add authentication and SuperAdmin authorization check
    // const user = await requireAuth(request)
    // if (user.role !== 'SUPERADMIN') {
    //   return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    // }

    const body = await request.json()

    // Validate input
    const validationResult = CreateDepositPolicySchema.safeParse(body)

    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          details: validationResult.error.flatten().fieldErrors,
        },
        { status: 400 }
      )
    }

    const result = await createDepositPolicy(validationResult.data)

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Failed to create deposit policy' },
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
    console.error('Error in POST /api/admin/deposit-policies:', error)

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
