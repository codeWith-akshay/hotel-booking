// ==========================================
// GET ROOM AVAILABILITY EXAMPLE
// ==========================================
// Example usage of the getRoomAvailability server action
// Demonstrates fetching room availability with color-coded status

import { getRoomAvailability } from '@/actions/rooms/room-inventory.action'
import type { RoomAvailabilityByDate } from '@/types/room.types'

// ==========================================
// EXAMPLE 1: Basic Usage
// ==========================================

/**
 * Fetch availability for a room type over a date range
 */
async function example1_BasicUsage() {
  const roomTypeId = 'clx123456' // Replace with actual room type ID
  const from = new Date('2025-10-25')
  const to = new Date('2025-10-30')

  const result = await getRoomAvailability(roomTypeId, from, to)

  if (result.success && result.data) {
    console.log(result.message)
    
    result.data.forEach(({ date, availableRooms, status }) => {
      console.log(`${date}: ${availableRooms} rooms available (${status})`)
    })
  } else {
    console.error('Error:', result.message)
    if (result.error) {
      console.error('Details:', result.error)
    }
  }
}

// ==========================================
// EXAMPLE 2: Display in React Component
// ==========================================

/**
 * React component to display room availability calendar
 */
export function RoomAvailabilityCalendar({ roomTypeId }: { roomTypeId: string }) {
  const [availability, setAvailability] = React.useState<RoomAvailabilityByDate[]>([])
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  const fetchAvailability = async (from: Date, to: Date) => {
    setLoading(true)
    setError(null)

    try {
      const result = await getRoomAvailability(roomTypeId, from, to)

      if (result.success && result.data) {
        setAvailability(result.data)
      } else {
        setError(result.message)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  React.useEffect(() => {
    const today = new Date()
    const thirtyDaysLater = new Date(today)
    thirtyDaysLater.setDate(today.getDate() + 30)
    
    fetchAvailability(today, thirtyDaysLater)
  }, [roomTypeId])

  if (loading) return <div>Loading availability...</div>
  if (error) return <div className="text-red-500">Error: {error}</div>

  return (
    <div className="space-y-2">
      <h2 className="text-xl font-bold">Room Availability</h2>
      
      <div className="grid grid-cols-7 gap-2">
        {availability.map(({ date, availableRooms, status }) => (
          <div
            key={date}
            className={`p-4 rounded-lg text-center ${
              status === 'green'
                ? 'bg-green-100 text-green-800'
                : status === 'yellow'
                ? 'bg-yellow-100 text-yellow-800'
                : 'bg-red-100 text-red-800'
            }`}
          >
            <div className="text-sm font-medium">{date}</div>
            <div className="text-lg font-bold">{availableRooms}</div>
            <div className="text-xs">rooms</div>
          </div>
        ))}
      </div>

      <div className="flex gap-4 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-green-500 rounded"></div>
          <span>High availability (&gt;5)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-yellow-500 rounded"></div>
          <span>Low availability (1-5)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-red-500 rounded"></div>
          <span>Fully booked (0)</span>
        </div>
      </div>
    </div>
  )
}

// ==========================================
// EXAMPLE 3: API Route Usage
// ==========================================

/**
 * Next.js API route to fetch availability
 * File: app/api/rooms/[roomTypeId]/availability/route.ts
 */
export async function GET_APIRouteExample(
  request: Request,
  { params }: { params: { roomTypeId: string } }
) {
  try {
    const { searchParams } = new URL(request.url)
    const fromParam = searchParams.get('from')
    const toParam = searchParams.get('to')

    if (!fromParam || !toParam) {
      return Response.json(
        { error: 'Missing required parameters: from, to' },
        { status: 400 }
      )
    }

    const from = new Date(fromParam)
    const to = new Date(toParam)

    // Validate dates
    if (isNaN(from.getTime()) || isNaN(to.getTime())) {
      return Response.json(
        { error: 'Invalid date format' },
        { status: 400 }
      )
    }

    const result = await getRoomAvailability(params.roomTypeId, from, to)

    if (result.success) {
      return Response.json({
        success: true,
        data: result.data,
        message: result.message,
      })
    } else {
      return Response.json(
        {
          success: false,
          error: result.message,
        },
        { status: 400 }
      )
    }
  } catch (error) {
    return Response.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

// ==========================================
// EXAMPLE 4: Filter by Status
// ==========================================

/**
 * Get only dates with low or no availability
 */
async function example4_FilterByStatus() {
  const roomTypeId = 'clx123456'
  const from = new Date('2025-10-25')
  const to = new Date('2025-11-25')

  const result = await getRoomAvailability(roomTypeId, from, to)

  if (result.success && result.data) {
    // Filter for red and yellow dates only
    const criticalDates = result.data.filter(
      (item) => item.status === 'red' || item.status === 'yellow'
    )

    console.log('Dates with low availability:')
    criticalDates.forEach(({ date, availableRooms, status }) => {
      console.log(`${date}: ${availableRooms} rooms (${status})`)
    })

    // Get dates that are fully booked
    const fullyBooked = result.data.filter((item) => item.status === 'red')
    console.log(`\nFully booked dates: ${fullyBooked.length}`)
  }
}

// ==========================================
// EXAMPLE 5: Generate CSV Export
// ==========================================

/**
 * Export availability data as CSV
 */
async function example5_ExportCSV() {
  const roomTypeId = 'clx123456'
  const from = new Date('2025-10-01')
  const to = new Date('2025-10-31')

  const result = await getRoomAvailability(roomTypeId, from, to)

  if (result.success && result.data) {
    // Generate CSV header
    const csv = ['Date,Available Rooms,Status']

    // Add data rows
    result.data.forEach(({ date, availableRooms, status }) => {
      csv.push(`${date},${availableRooms},${status}`)
    })

    // Join and return
    const csvContent = csv.join('\n')
    console.log(csvContent)

    // In a real application, you might:
    // - Write to a file: fs.writeFileSync('availability.csv', csvContent)
    // - Send as download: create blob and trigger download
    // - Send via email: attach to email
  }
}

// ==========================================
// EXAMPLE 6: Calculate Statistics
// ==========================================

/**
 * Calculate availability statistics
 */
async function example6_Statistics() {
  const roomTypeId = 'clx123456'
  const from = new Date('2025-10-01')
  const to = new Date('2025-10-31')

  const result = await getRoomAvailability(roomTypeId, from, to)

  if (result.success && result.data) {
    const stats = {
      totalDates: result.data.length,
      greenDates: result.data.filter((d) => d.status === 'green').length,
      yellowDates: result.data.filter((d) => d.status === 'yellow').length,
      redDates: result.data.filter((d) => d.status === 'red').length,
      averageAvailability:
        result.data.reduce((sum, d) => sum + d.availableRooms, 0) / result.data.length,
      minAvailability: Math.min(...result.data.map((d) => d.availableRooms)),
      maxAvailability: Math.max(...result.data.map((d) => d.availableRooms)),
    }

    console.log('Availability Statistics:')
    console.log(`Total dates: ${stats.totalDates}`)
    console.log(`High availability (green): ${stats.greenDates} days`)
    console.log(`Low availability (yellow): ${stats.yellowDates} days`)
    console.log(`Fully booked (red): ${stats.redDates} days`)
    console.log(`Average availability: ${stats.averageAvailability.toFixed(2)} rooms`)
    console.log(`Range: ${stats.minAvailability} - ${stats.maxAvailability} rooms`)
    console.log(`Occupancy rate: ${((stats.totalDates - stats.redDates) / stats.totalDates * 100).toFixed(1)}%`)
  }
}

// ==========================================
// TYPE EXAMPLES
// ==========================================

/**
 * Example of the response structure
 */
interface ExampleResponse {
  success: true
  message: string
  data: Array<{
    date: string // "2025-10-25"
    availableRooms: number // 8
    status: 'green' | 'yellow' | 'red' // "green"
  }>
}

/**
 * Example response data:
 * {
 *   "success": true,
 *   "message": "Retrieved availability for 6 date(s) for room type: Deluxe Room",
 *   "data": [
 *     { "date": "2025-10-25", "availableRooms": 8, "status": "green" },
 *     { "date": "2025-10-26", "availableRooms": 3, "status": "yellow" },
 *     { "date": "2025-10-27", "availableRooms": 0, "status": "red" },
 *     { "date": "2025-10-28", "availableRooms": 12, "status": "green" },
 *     { "date": "2025-10-29", "availableRooms": 1, "status": "yellow" },
 *     { "date": "2025-10-30", "availableRooms": 6, "status": "green" }
 *   ]
 * }
 */

// Import React for component examples
import * as React from 'react'
