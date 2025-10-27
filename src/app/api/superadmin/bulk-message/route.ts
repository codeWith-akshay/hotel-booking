/**
 * API Route: Bulk Message
 * POST /api/superadmin/bulk-message - Send bulk messages
 */

import { NextRequest, NextResponse } from 'next/server'
import { sendBulkMessages } from '@/actions/superadmin/bulkMessage'
import { SendBulkMessagesRequestSchema } from '@/lib/validation/superadmin.validation'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    const validation = SendBulkMessagesRequestSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.issues[0]?.message || 'Validation failed' },
        { status: 400 }
      )
    }

    const result = await sendBulkMessages(validation.data)

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 })
    }

    return NextResponse.json(
      {
        success: true,
        message: result.message,
        campaignId: result.campaignId,
        totalRecipients: result.totalRecipients,
        sentCount: result.sentCount,
        failedCount: result.failedCount,
        results: result.results,
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('[POST /api/superadmin/bulk-message] Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
