/**
 * API Route: Deposit Policies
 * GET  /api/superadmin/deposit-policies - Fetch deposit policies
 * POST /api/superadmin/deposit-policies - Update deposit policies
 */

import { NextRequest, NextResponse } from 'next/server'
import { fetchDepositPolicies, updateDepositPolicies } from '@/actions/superadmin/rules'
import { UpdateDepositPoliciesRequestSchema } from '@/lib/validation/superadmin.validation'

export async function GET() {
  try {
    const result = await fetchDepositPolicies()

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 })
    }

    return NextResponse.json({ success: true, policies: result.policies }, { status: 200 })
  } catch (error) {
    console.error('[GET /api/superadmin/deposit-policies] Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    const validation = UpdateDepositPoliciesRequestSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.issues[0]?.message || 'Validation failed' },
        { status: 400 }
      )
    }

    const result = await updateDepositPolicies(validation.data)

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 })
    }

    return NextResponse.json(
      { success: true, message: result.message, policies: result.policies },
      { status: 200 }
    )
  } catch (error) {
    console.error('[POST /api/superadmin/deposit-policies] Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
