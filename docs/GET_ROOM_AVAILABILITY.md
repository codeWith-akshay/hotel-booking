# Get Room Availability Server Action

## Overview

The `getRoomAvailability` server action fetches room availability per date from Prisma `RoomInventory` and returns structured JSON with color-coded availability status.

## Implementation Details

### Location
- **File**: `src/actions/rooms/room-inventory.action.ts`
- **Function**: `getRoomAvailability(roomTypeId: string, from: Date, to: Date)`

### Features

✅ **Zod Input Validation**
- Validates room type ID (CUID format)
- Validates date range (from <= to)
- Type-safe inputs

✅ **Prisma Database Query**
- Queries `RoomInventory` table
- Filters by room type and date range
- Returns ordered results (ascending by date)

✅ **Availability Status Computation**
- **Green** (`> 5 rooms`): High availability
- **Yellow** (`1-5 rooms`): Low availability
- **Red** (`0 rooms`): Fully booked

✅ **Structured JSON Response**
```typescript
{
  date: string,           // ISO format "YYYY-MM-DD"
  availableRooms: number, // Number of available rooms
  status: 'green' | 'yellow' | 'red'
}[]
```

✅ **Error Handling**
- Try/catch block
- Prisma-specific error handling
- User-friendly error messages

✅ **TypeScript Types**
- Full type safety
- JSDoc documentation
- Exported interfaces

---

## Function Signature

```typescript
export async function getRoomAvailability(
  roomTypeId: string,
  from: Date,
  to: Date
): Promise<RoomAvailabilityResponse>
```

### Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `roomTypeId` | `string` | Room type ID in CUID format (e.g., `clx123456`) |
| `from` | `Date` | Start date of the range (inclusive) |
| `to` | `Date` | End date of the range (inclusive) |

### Return Type

```typescript
type RoomAvailabilityResponse = ServerActionResponse<RoomAvailabilityByDate[]>

interface RoomAvailabilityByDate {
  date: string                              // "2025-10-25"
  availableRooms: number                    // 8
  status: 'green' | 'yellow' | 'red'        // "green"
}

interface ServerActionResponse<T> {
  success: boolean
  message: string
  data?: T
  error?: string
}
```

---

## Validation Schema

**File**: `src/lib/validation/room.validation.ts`

```typescript
export const getRoomAvailabilitySchema = z.object({
  roomTypeId: z.string().cuid('Invalid room type ID'),
  from: z.date(),
  to: z.date(),
}).refine(
  (data) => data.to >= data.from,
  {
    message: 'End date must be on or after start date',
    path: ['to'],
  }
)
```

### Validation Rules
1. ✅ Room type ID must be valid CUID
2. ✅ Both dates must be valid Date objects
3. ✅ End date must be >= start date

---

## Type Definitions

**File**: `src/types/room.types.ts`

```typescript
export type AvailabilityStatus = 'green' | 'yellow' | 'red'

export interface RoomAvailabilityByDate {
  date: string
  availableRooms: number
  status: AvailabilityStatus
}

export type RoomAvailabilityResponse = 
  ServerActionResponse<RoomAvailabilityByDate[]>
```

---

## Usage Examples

### Basic Usage

```typescript
import { getRoomAvailability } from '@/actions/rooms/room-inventory.action'

const result = await getRoomAvailability(
  'clx123456',
  new Date('2025-10-25'),
  new Date('2025-10-30')
)

if (result.success && result.data) {
  result.data.forEach(({ date, availableRooms, status }) => {
    console.log(`${date}: ${availableRooms} rooms (${status})`)
  })
}
```

### React Component

```typescript
'use client'

import { getRoomAvailability } from '@/actions/rooms/room-inventory.action'
import { useState, useEffect } from 'react'

export function AvailabilityCalendar({ roomTypeId }: { roomTypeId: string }) {
  const [availability, setAvailability] = useState([])

  useEffect(() => {
    const fetchData = async () => {
      const result = await getRoomAvailability(
        roomTypeId,
        new Date(),
        new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // +30 days
      )
      if (result.success && result.data) {
        setAvailability(result.data)
      }
    }
    fetchData()
  }, [roomTypeId])

  return (
    <div className="grid grid-cols-7 gap-2">
      {availability.map(({ date, availableRooms, status }) => (
        <div
          key={date}
          className={`p-4 rounded ${
            status === 'green' ? 'bg-green-100' :
            status === 'yellow' ? 'bg-yellow-100' :
            'bg-red-100'
          }`}
        >
          <div>{date}</div>
          <div>{availableRooms} rooms</div>
        </div>
      ))}
    </div>
  )
}
```

---

## Response Examples

### Success Response

```json
{
  "success": true,
  "message": "Retrieved availability for 6 date(s) for room type: Deluxe Room",
  "data": [
    { "date": "2025-10-25", "availableRooms": 8, "status": "green" },
    { "date": "2025-10-26", "availableRooms": 3, "status": "yellow" },
    { "date": "2025-10-27", "availableRooms": 0, "status": "red" },
    { "date": "2025-10-28", "availableRooms": 12, "status": "green" },
    { "date": "2025-10-29", "availableRooms": 1, "status": "yellow" },
    { "date": "2025-10-30", "availableRooms": 6, "status": "green" }
  ]
}
```

### Error Response (Invalid Room Type)

```json
{
  "success": false,
  "message": "Room type not found with ID: clx999999",
  "error": "Room type does not exist"
}
```

### Error Response (Validation Failure)

```json
{
  "success": false,
  "message": "Validation failed: End date must be on or after start date",
  "error": "End date must be on or after start date"
}
```

### Error Response (Database Error)

```json
{
  "success": false,
  "message": "Database error while fetching availability",
  "error": "Prisma error: P2001 - Record not found"
}
```

---

## Status Logic

The availability status is computed using the following rules:

```typescript
function getAvailabilityStatus(availableRooms: number): AvailabilityStatus {
  if (availableRooms > 5) return 'green'   // High availability
  if (availableRooms >= 1) return 'yellow' // Low availability
  return 'red'                              // Fully booked
}
```

| Available Rooms | Status | Color | Meaning |
|----------------|--------|-------|---------|
| > 5 | `green` | 🟢 | High availability - plenty of rooms |
| 1-5 | `yellow` | 🟡 | Low availability - limited rooms |
| 0 | `red` | 🔴 | Fully booked - no rooms available |

---

## Implementation Steps

The function follows these steps:

1. **Validate Input** - Use Zod schema to validate parameters
2. **Verify Room Type** - Check if room type exists in database
3. **Normalize Dates** - Remove time component for consistent date comparison
4. **Fetch Inventory** - Query Prisma for inventory records in date range
5. **Compute Status** - Apply status logic to each inventory record
6. **Transform Data** - Map to structured JSON format
7. **Return Response** - Send success response with data array

---

## Error Handling

The function handles multiple error scenarios:

### Validation Errors
- Invalid CUID format
- Invalid date objects
- End date before start date

### Database Errors
- Room type not found
- Prisma connection errors
- Query timeout

### Generic Errors
- Unexpected runtime errors
- Type conversion errors

---

## Database Schema Reference

```prisma
model RoomInventory {
  id             String   @id @default(cuid())
  roomTypeId     String
  availableRooms Int
  date           DateTime @db.Date
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt
  
  roomType RoomType @relation(fields: [roomTypeId], references: [id], onDelete: Cascade)
  
  @@unique([roomTypeId, date])
  @@index([roomTypeId])
  @@index([date])
  @@map("room_inventory")
}
```

---

## Related Files

| File | Purpose |
|------|---------|
| `src/actions/rooms/room-inventory.action.ts` | Server action implementation |
| `src/lib/validation/room.validation.ts` | Zod validation schema |
| `src/types/room.types.ts` | TypeScript type definitions |
| `src/examples/get-room-availability-example.tsx` | Usage examples |
| `prisma/schema.prisma` | Database schema |

---

## Testing Recommendations

### Unit Tests
```typescript
describe('getRoomAvailability', () => {
  it('should return availability for valid date range', async () => {
    const result = await getRoomAvailability(
      'valid-room-type-id',
      new Date('2025-10-25'),
      new Date('2025-10-30')
    )
    expect(result.success).toBe(true)
    expect(result.data).toBeInstanceOf(Array)
  })

  it('should fail for invalid room type', async () => {
    const result = await getRoomAvailability(
      'invalid-id',
      new Date('2025-10-25'),
      new Date('2025-10-30')
    )
    expect(result.success).toBe(false)
  })

  it('should validate date range', async () => {
    const result = await getRoomAvailability(
      'valid-room-type-id',
      new Date('2025-10-30'),
      new Date('2025-10-25') // end before start
    )
    expect(result.success).toBe(false)
  })
})
```

---

## Performance Considerations

- ✅ Uses indexed fields (`roomTypeId`, `date`)
- ✅ Selective field queries (`select: { date, availableRooms }`)
- ✅ Efficient date normalization
- ✅ Single database query
- ⚠️ Large date ranges may return many records - consider pagination

---

## Security

- ✅ No RBAC required (read-only operation)
- ✅ Input validation via Zod
- ✅ SQL injection protection via Prisma
- ✅ No sensitive data exposed

---

## Future Enhancements

Potential improvements:

1. **Pagination** - Add limit/offset for large date ranges
2. **Caching** - Redis cache for frequently queried ranges
3. **Aggregation** - Summary statistics (total available, peak days)
4. **Room Type Validation** - Verify room type is active/published
5. **Date Range Limits** - Prevent queries for excessively long ranges

---

## Quick Reference

```typescript
// Import
import { getRoomAvailability } from '@/actions/rooms/room-inventory.action'

// Call
const result = await getRoomAvailability(roomTypeId, from, to)

// Response
if (result.success) {
  result.data // Array<{ date, availableRooms, status }>
}

// Status Colors
green  = > 5 rooms
yellow = 1-5 rooms
red    = 0 rooms
```
