/**
 * API Route: Bulk Campaigns
 * GET /api/superadmin/bulk-campaigns - Fetch bulk message campaigns
 */

import { NextRequest, NextResponse } from 'next/server'
import { fetchBulkCampaigns } from '@/actions/superadmin/bulkMessage'
import { FetchBulkMessagesQuerySchema } from '@/lib/validation/superadmin.validation'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)

    const query: any = {}
    if (searchParams.get('adminId')) query.adminId = searchParams.get('adminId')
    if (searchParams.get('channel')) query.channel = searchParams.get('channel')
    if (searchParams.get('status')) query.status = searchParams.get('status')
    if (searchParams.get('startDate')) query.startDate = searchParams.get('startDate')
    if (searchParams.get('endDate')) query.endDate = searchParams.get('endDate')
    if (searchParams.get('page')) query.page = searchParams.get('page')
    if (searchParams.get('limit')) query.limit = searchParams.get('limit')

    const validation = FetchBulkMessagesQuerySchema.safeParse(query)
    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.issues[0]?.message || 'Validation failed' },
        { status: 400 }
      )
    }

    const result = await fetchBulkCampaigns(validation.data)

    return NextResponse.json(
      { success: true, campaigns: result.campaigns, total: result.total },
      { status: 200 }
    )
  } catch (error) {
    console.error('[GET /api/superadmin/bulk-campaigns] Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
