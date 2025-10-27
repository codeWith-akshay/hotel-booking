/**
 * Room Availability API
 * 
 * GET /api/rooms/availability
 * 
 * Query parameters:
 * - roomType: Room type ID or name
 * - startDate: Check-in date (ISO 8601)
 * - endDate: Check-out date (ISO 8601)
 * 
 * Returns:
 * - availableCount: Number of available rooms for the specified type and date range
 * - totalRooms: Total rooms of this type
 * - roomTypeId: Room type ID
 * - roomTypeName: Room type name
 */

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'

// Request validation schema
const AvailabilityQuerySchema = z.object({
  roomType: z.string().min(1, { message: 'Room type is required' }),
  startDate: z.string().datetime({ message: 'Valid start date required (ISO 8601)' }),
  endDate: z.string().datetime({ message: 'Valid end date required (ISO 8601)' }),
})

export async function GET(request: NextRequest) {
  try {
    // Parse query parameters
    const { searchParams } = new URL(request.url)
    const roomType = searchParams.get('roomType')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    // Validate input
    const validation = AvailabilityQuerySchema.safeParse({
      roomType,
      startDate,
      endDate,
    })

    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid request parameters',
          issues: validation.error.issues.map((issue) => ({
            field: issue.path.join('.'),
            message: issue.message,
          })),
        },
        { status: 400 }
      )
    }

    const { roomType: roomTypeInput, startDate: start, endDate: end } = validation.data

    // Parse dates
    const checkIn = new Date(start)
    const checkOut = new Date(end)

    // Validate date range
    if (checkOut <= checkIn) {
      return NextResponse.json(
        {
          success: false,
          error: 'End date must be after start date',
        },
        { status: 400 }
      )
    }

    // Find room type (by ID or name)
    const roomTypeRecord = await prisma.roomType.findFirst({
      where: {
        OR: [
          { id: roomTypeInput },
          { name: { contains: roomTypeInput } },
        ],
      },
      select: {
        id: true,
        name: true,
        totalRooms: true,
      },
    })

    if (!roomTypeRecord) {
      return NextResponse.json(
        {
          success: false,
          error: `Room type "${roomTypeInput}" not found`,
        },
        { status: 404 }
      )
    }

    // Calculate booked rooms for the date range
    const bookedRooms = await prisma.booking.findMany({
      where: {
        roomTypeId: roomTypeRecord.id,
        status: { in: ['CONFIRMED', 'PROVISIONAL'] },
        OR: [
          {
            AND: [
              { startDate: { lte: checkIn } },
              { endDate: { gt: checkIn } },
            ],
          },
          {
            AND: [
              { startDate: { lt: checkOut } },
              { endDate: { gte: checkOut } },
            ],
          },
          {
            AND: [
              { startDate: { gte: checkIn } },
              { endDate: { lte: checkOut } },
            ],
          },
        ],
      },
      select: {
        roomsBooked: true,
      },
    })

    // Sum up total rooms booked in this period
    const totalBookedRooms = bookedRooms.reduce((sum, booking) => sum + booking.roomsBooked, 0)
    const availableRooms = Math.max(0, roomTypeRecord.totalRooms - totalBookedRooms)

    // Return availability data
    return NextResponse.json({
      success: true,
      data: {
        roomTypeId: roomTypeRecord.id,
        roomTypeName: roomTypeRecord.name,
        totalRooms: roomTypeRecord.totalRooms,
        bookedRooms: totalBookedRooms,
        availableCount: availableRooms,
        dateRange: {
          startDate: checkIn.toISOString(),
          endDate: checkOut.toISOString(),
        },
      },
    })
  } catch (error) {
    console.error('❌ [Room Availability API] Error:', error)

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch room availability',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
