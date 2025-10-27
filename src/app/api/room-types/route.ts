import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

/**
 * GET /api/room-types
 * Fetch all available room types with their details
 */
export async function GET(request: NextRequest) {
  try {
    console.log('📋 Fetching all room types...')

    const roomTypes = await prisma.roomType.findMany({
      select: {
        id: true,
        name: true,
        description: true,
        pricePerNight: true,
        totalRooms: true,
      },
      orderBy: {
        pricePerNight: 'asc',
      },
    })

    console.log(`✅ Found ${roomTypes.length} room types`)

    return NextResponse.json({ roomTypes })
  } catch (error) {
    console.error('❌ Error fetching room types:', error)
    return NextResponse.json(
      { error: 'Failed to fetch room types' },
      { status: 500 }
    )
  }
}
