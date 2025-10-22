# Room Management Server Actions Documentation

Complete guide to using Next.js server actions for room type and inventory management in the hotel booking system.

---

## Table of Contents

1. [Overview](#overview)
2. [Authentication & Authorization](#authentication--authorization)
3. [RoomType Actions](#roomtype-actions)
4. [RoomInventory Actions](#roominventory-actions)
5. [Response Format](#response-format)
6. [Error Handling](#error-handling)
7. [Usage Examples](#usage-examples)
8. [Testing Guide](#testing-guide)

---

## Overview

### Technology Stack

- **Framework**: Next.js 15+ Server Actions
- **Validation**: Zod schemas
- **Database**: Prisma ORM with PostgreSQL
- **Authorization**: Role-Based Access Control (RBAC)
- **Type Safety**: Full TypeScript support

### Key Features

- ✅ Input validation with Zod
- ✅ Role-based authorization (Admin/SuperAdmin)
- ✅ Consistent JSON responses
- ✅ Comprehensive error handling
- ✅ Audit logging for all mutations
- ✅ TypeScript interfaces and JSDoc comments

---

## Authentication & Authorization

### User Roles

| Role | Permissions | Description |
|------|-------------|-------------|
| **MEMBER** | Read-only | Can view room types and check availability |
| **ADMIN** | room:*, inventory:* | Full CRUD on rooms and inventory |
| **SUPERADMIN** | all:* | Wildcard access to all operations |

### Permission Structure

```typescript
// Room Type Permissions
'room:create'  // Create new room types
'room:read'    // View room types (public)
'room:update'  // Modify existing room types
'room:delete'  // Remove room types

// Inventory Permissions
'inventory:create'  // Add inventory records
'inventory:read'    // View inventory (public)
'inventory:update'  // Modify availability
'inventory:delete'  // Remove inventory records
```

### Session Management

Server actions automatically retrieve the current user session from cookies:

```typescript
const session = await getCurrentUserSession()
// Returns: { userId: string, role: string, permissions: string[] } | null
```

---

## RoomType Actions

### 1. Create Room Type

**Function**: `createRoomType(input)`

**Authorization**: Admin or SuperAdmin

**Input Schema**:
```typescript
{
  name: string           // 1-100 chars, unique
  description: string    // 10-2000 chars
  pricePerNight: number  // 1000-10000000 cents ($10-$100,000)
  totalRooms: number     // 1-1000
}
```

**Example**:
```typescript
'use server'
import { createRoomType } from '@/actions/rooms/room-type.action'

export async function handleCreateRoom(formData: FormData) {
  const result = await createRoomType({
    name: 'Deluxe Ocean View',
    description: 'Spacious room with panoramic ocean views...',
    pricePerNight: 25000, // $250.00
    totalRooms: 15,
  })

  if (result.success) {
    console.log('Created:', result.data)
    // Created: { id: 'clx...', name: '...', ... }
  } else {
    console.error('Error:', result.message)
  }
}
```

**Response**:
```typescript
{
  success: true,
  message: 'Room type created successfully',
  data: {
    id: 'clx123456',
    name: 'Deluxe Ocean View',
    description: '...',
    pricePerNight: 25000,
    totalRooms: 15,
    createdAt: Date,
    updatedAt: Date,
  }
}
```

---

### 2. Get Room Types

**Function**: `getRoomTypes(input?)`

**Authorization**: Public (no authentication required)

**Input Schema** (all optional):
```typescript
{
  includeInventory?: boolean  // Include next 30 days of inventory
  minPrice?: number          // Filter by minimum price
  maxPrice?: number          // Filter by maximum price
  sortBy?: 'name' | 'pricePerNight' | 'totalRooms' | 'createdAt'
  sortOrder?: 'asc' | 'desc'
}
```

**Example**:
```typescript
import { getRoomTypes } from '@/actions/rooms/room-type.action'

// Basic usage - get all room types
const result = await getRoomTypes()

// Advanced filtering
const filteredResult = await getRoomTypes({
  minPrice: 10000,  // $100+
  maxPrice: 50000,  // Up to $500
  sortBy: 'pricePerNight',
  sortOrder: 'asc',
  includeInventory: true,
})

if (filteredResult.success) {
  filteredResult.data.forEach(roomType => {
    console.log(`${roomType.name}: $${roomType.pricePerNight / 100}`)
    if (roomType.inventory) {
      console.log(`  Next 30 days availability:`, roomType.inventory.length)
    }
  })
}
```

**Response**:
```typescript
{
  success: true,
  message: 'Found 5 room type(s)',
  data: [
    {
      id: 'clx123',
      name: 'Standard Room',
      pricePerNight: 15000,
      totalRooms: 20,
      // Optional: inventory array if includeInventory=true
      inventory?: [...],
    },
    // ... more room types
  ]
}
```

---

### 3. Get Room Type By ID

**Function**: `getRoomTypeById(input)`

**Authorization**: Public

**Input Schema**:
```typescript
{
  id: string  // CUID of room type
}
```

**Example**:
```typescript
import { getRoomTypeById } from '@/actions/rooms/room-type.action'

const result = await getRoomTypeById({ id: 'clx123456' })

if (result.success && result.data) {
  const roomType = result.data
  console.log(`Room: ${roomType.name}`)
  console.log(`Price: $${roomType.pricePerNight / 100}/night`)
  console.log(`Total Rooms: ${roomType.totalRooms}`)
  console.log(`Next 90 days inventory:`, roomType.inventory?.length)
} else {
  console.log('Room type not found')
}
```

**Response**:
```typescript
{
  success: true,
  message: 'Room type found',
  data: {
    id: 'clx123456',
    name: 'Executive Suite',
    description: '...',
    pricePerNight: 35000,
    totalRooms: 10,
    createdAt: Date,
    updatedAt: Date,
    inventory: [
      { id: '...', date: Date, availableRooms: 10 },
      // ... next 90 days
    ]
  }
}
```

---

### 4. Update Room Type

**Function**: `updateRoomType(input)`

**Authorization**: Admin or SuperAdmin

**Input Schema** (all fields optional except `id`):
```typescript
{
  id: string             // Required: CUID
  name?: string          // Validates uniqueness if changed
  description?: string
  pricePerNight?: number
  totalRooms?: number
}
```

**Example**:
```typescript
import { updateRoomType } from '@/actions/rooms/room-type.action'

// Update price only
const result = await updateRoomType({
  id: 'clx123456',
  pricePerNight: 28000,  // $280
})

// Update multiple fields
const fullUpdate = await updateRoomType({
  id: 'clx123456',
  name: 'Premium Executive Suite',
  description: 'Newly renovated with modern amenities...',
  pricePerNight: 30000,
  totalRooms: 12,
})

if (fullUpdate.success) {
  console.log('Updated:', fullUpdate.data)
}
```

**Response**:
```typescript
{
  success: true,
  message: 'Room type updated successfully',
  data: {
    id: 'clx123456',
    name: 'Premium Executive Suite',
    pricePerNight: 30000,
    totalRooms: 12,
    // ... full room type object
  }
}
```

---

### 5. Delete Room Type

**Function**: `deleteRoomType(input)`

**Authorization**: Admin or SuperAdmin

**Input Schema**:
```typescript
{
  id: string  // CUID of room type to delete
}
```

**⚠️ Warning**: This action uses **CASCADE DELETE**. All associated inventory records will be permanently deleted.

**Example**:
```typescript
import { deleteRoomType } from '@/actions/rooms/room-type.action'

const result = await deleteRoomType({ id: 'clx123456' })

if (result.success) {
  console.log(result.message)
  // "Room type 'Deluxe Ocean View' deleted successfully (45 inventory records removed)"
}
```

**Response**:
```typescript
{
  success: true,
  message: "Room type 'Executive Suite' deleted successfully (90 inventory records removed)"
}
```

---

## RoomInventory Actions

### 1. Create Inventory

**Function**: `createInventory(input)`

**Authorization**: Admin or SuperAdmin

**Input Schema**:
```typescript
{
  roomTypeId: string     // CUID of room type
  date: Date             // Must be today or future
  availableRooms: number // 0-1000, must be ≤ totalRooms
}
```

**Example**:
```typescript
import { createInventory } from '@/actions/rooms/room-inventory.action'

const result = await createInventory({
  roomTypeId: 'clx123456',
  date: new Date('2025-12-25'),
  availableRooms: 20,
})

if (result.success) {
  console.log('Inventory created:', result.data)
}
```

**Response**:
```typescript
{
  success: true,
  message: 'Inventory created successfully',
  data: {
    id: 'clx789012',
    roomTypeId: 'clx123456',
    date: Date('2025-12-25'),
    availableRooms: 20,
    createdAt: Date,
    updatedAt: Date,
  }
}
```

**Validations**:
- ✅ Date must be today or future
- ✅ Room type must exist
- ✅ `availableRooms` ≤ `totalRooms` of room type
- ✅ No duplicate inventory for same (roomTypeId, date)

---

### 2. Create Bulk Inventory

**Function**: `createBulkInventory(input)`

**Authorization**: Admin or SuperAdmin

**Input Schema**:
```typescript
{
  roomTypeId: string        // CUID of room type
  startDate: Date           // Start of date range
  endDate: Date             // End of date range (exclusive)
  availableRooms?: number   // Optional, defaults to totalRooms
}
```

**Example**:
```typescript
import { createBulkInventory } from '@/actions/rooms/room-inventory.action'

// Create 30 days of inventory
const result = await createBulkInventory({
  roomTypeId: 'clx123456',
  startDate: new Date('2025-10-01'),
  endDate: new Date('2025-10-31'),
  availableRooms: 15,  // Optional: use 15 instead of totalRooms
})

if (result.success) {
  console.log(`Created: ${result.data.created}`)
  console.log(`Updated: ${result.data.updated}`)
  console.log(`Total: ${result.data.total}`)
  console.log(`Records:`, result.data.records)
}
```

**Response**:
```typescript
{
  success: true,
  message: 'Bulk inventory created: 25 new, 5 updated',
  data: {
    created: 25,
    updated: 5,
    total: 30,
    records: [
      { id: '...', roomTypeId: '...', date: Date, availableRooms: 15 },
      // ... 29 more records
    ]
  }
}
```

**Use Cases**:
- Initial inventory setup for new room types
- Seasonal availability updates
- Bulk reopening after maintenance

---

### 3. Get Inventory By Room Type

**Function**: `getInventoryByRoomType(input)`

**Authorization**: Public

**Input Schema**:
```typescript
{
  roomTypeId: string                                  // Required
  startDate?: Date                                    // Optional filter
  endDate?: Date                                      // Optional filter
  sortBy?: 'date' | 'availableRooms' | 'createdAt'  // Default: 'date'
  sortOrder?: 'asc' | 'desc'                         // Default: 'asc'
}
```

**Example**:
```typescript
import { getInventoryByRoomType } from '@/actions/rooms/room-inventory.action'

// Get all inventory for a room type
const allInventory = await getInventoryByRoomType({
  roomTypeId: 'clx123456',
})

// Get next 7 days
const weekInventory = await getInventoryByRoomType({
  roomTypeId: 'clx123456',
  startDate: new Date(),
  endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
  sortBy: 'date',
  sortOrder: 'asc',
})

if (weekInventory.success) {
  weekInventory.data.forEach(inv => {
    console.log(`${inv.date.toDateString()}: ${inv.availableRooms} rooms`)
  })
}
```

**Response**:
```typescript
{
  success: true,
  message: 'Found 7 inventory record(s)',
  data: [
    {
      id: 'clx789',
      roomTypeId: 'clx123',
      date: Date('2025-10-25'),
      availableRooms: 18,
      createdAt: Date,
      updatedAt: Date,
    },
    // ... more records
  ]
}
```

---

### 4. Update Inventory

**Function**: `updateInventory(input)`

**Authorization**: Admin or SuperAdmin

**Input Schema**:
```typescript
{
  id: string             // CUID of inventory record
  availableRooms: number // 0-1000, must be ≤ totalRooms
}
```

**Example**:
```typescript
import { updateInventory } from '@/actions/rooms/room-inventory.action'

// Update after a booking
const result = await updateInventory({
  id: 'clx789012',
  availableRooms: 17,  // Decremented by 1
})

if (result.success) {
  console.log('Updated inventory:', result.data)
}
```

**Response**:
```typescript
{
  success: true,
  message: 'Inventory updated successfully',
  data: {
    id: 'clx789012',
    roomTypeId: 'clx123456',
    date: Date('2025-10-25'),
    availableRooms: 17,
    updatedAt: Date,  // Updated timestamp
  }
}
```

---

### 5. Update Inventory By Date

**Function**: `updateInventoryByDate(input)`

**Authorization**: Admin or SuperAdmin

**Input Schema**:
```typescript
{
  roomTypeId: string     // CUID of room type
  date: Date             // Specific date
  availableRooms: number // New availability
}
```

**Example**:
```typescript
import { updateInventoryByDate } from '@/actions/rooms/room-inventory.action'

// Update or create inventory for specific date
const result = await updateInventoryByDate({
  roomTypeId: 'clx123456',
  date: new Date('2025-12-31'),
  availableRooms: 5,  // Limited availability for New Year's Eve
})

if (result.success) {
  console.log('Inventory updated:', result.data)
}
```

**Response**:
```typescript
{
  success: true,
  message: 'Inventory updated successfully',
  data: {
    id: 'clx789012',
    roomTypeId: 'clx123456',
    date: Date('2025-12-31'),
    availableRooms: 5,
    updatedAt: Date,
  }
}
```

**Note**: This function uses `upsert`, so it will create the inventory if it doesn't exist.

---

### 6. Delete Inventory

**Function**: `deleteInventory(input)`

**Authorization**: Admin or SuperAdmin

**Input Schema**:
```typescript
{
  id: string  // CUID of inventory record
}
```

**Example**:
```typescript
import { deleteInventory } from '@/actions/rooms/room-inventory.action'

const result = await deleteInventory({ id: 'clx789012' })

if (result.success) {
  console.log(result.message)  // "Inventory deleted successfully"
}
```

**Response**:
```typescript
{
  success: true,
  message: 'Inventory deleted successfully'
}
```

**Use Cases**:
- Remove incorrect inventory entries
- Clean up test data
- Delete future dates that are no longer needed

---

### 7. Check Availability

**Function**: `checkAvailability(input)`

**Authorization**: Public

**Input Schema**:
```typescript
{
  roomTypeId: string       // CUID of room type
  checkInDate: Date        // Check-in date
  checkOutDate: Date       // Check-out date (exclusive)
  requiredRooms?: number   // Default: 1
}
```

**Example**:
```typescript
import { checkAvailability } from '@/actions/rooms/room-inventory.action'

// Check if 2 rooms available for a weekend stay
const result = await checkAvailability({
  roomTypeId: 'clx123456',
  checkInDate: new Date('2025-10-25'),
  checkOutDate: new Date('2025-10-27'),
  requiredRooms: 2,
})

if (result.success && result.data.isAvailable) {
  console.log('✅ Rooms available!')
  console.log(`Min availability: ${result.data.minAvailability}`)
} else {
  console.log('❌ Not available')
  console.log('Unavailable dates:', result.data.unavailableDates)
}
```

**Response (Available)**:
```typescript
{
  success: true,
  message: 'Rooms available for selected dates',
  data: {
    isAvailable: true,
    roomTypeId: 'clx123456',
    checkInDate: Date('2025-10-25'),
    checkOutDate: Date('2025-10-27'),
    requiredRooms: 2,
    minAvailability: 15,  // Lowest availability across all dates
    inventory: [
      { id: '...', date: Date('2025-10-25'), availableRooms: 18 },
      { id: '...', date: Date('2025-10-26'), availableRooms: 15 },
    ]
  }
}
```

**Response (Unavailable)**:
```typescript
{
  success: true,
  message: 'Insufficient availability for selected dates',
  data: {
    isAvailable: false,
    roomTypeId: 'clx123456',
    checkInDate: Date('2025-10-25'),
    checkOutDate: Date('2025-10-27'),
    requiredRooms: 2,
    minAvailability: 0,
    inventory: [...],
    unavailableDates: [
      Date('2025-10-26'),  // This date has 0 available rooms
    ]
  }
}
```

**Use Cases**:
- Pre-booking validation
- Search result filtering
- Real-time availability display

---

## Response Format

All server actions return a consistent response structure:

### Success Response

```typescript
{
  success: true,
  message: string,        // Human-readable success message
  data?: T,              // Optional typed data
}
```

### Error Response

```typescript
{
  success: false,
  message: string,        // User-friendly error message
  error?: string,        // Technical error details (optional)
}
```

### Validation Error

```typescript
{
  success: false,
  message: 'Validation failed',
  error: 'Price must be at least $10.00'  // First validation error
}
```

---

## Error Handling

### Common Error Types

#### 1. Validation Errors

```typescript
const result = await createRoomType({
  name: '',  // Too short
  pricePerNight: 500,  // Too low
})

// Response:
// { success: false, message: 'Validation failed', error: 'Name must be at least 1 character' }
```

#### 2. Authorization Errors

```typescript
// User is not Admin/SuperAdmin
const result = await createRoomType({...})

// Response:
// { success: false, message: 'Insufficient permissions' }
```

#### 3. Not Found Errors

```typescript
const result = await getRoomTypeById({ id: 'invalid-id' })

// Response:
// { success: true, message: 'Room type not found', data: null }
```

#### 4. Unique Constraint Errors

```typescript
const result = await createRoomType({
  name: 'Deluxe Room',  // Already exists
  // ...
})

// Response:
// { success: false, message: 'Room type with this name already exists' }
```

#### 5. Business Logic Errors

```typescript
const result = await createInventory({
  roomTypeId: 'clx123',
  availableRooms: 50,  // Room type only has 20 total rooms
  date: new Date(),
})

// Response:
// { success: false, message: 'Available rooms (50) cannot exceed total rooms (20)' }
```

### Error Handling Pattern

```typescript
async function handleAction() {
  try {
    const result = await createRoomType({...})
    
    if (!result.success) {
      // Handle error
      console.error('Action failed:', result.message)
      if (result.error) {
        console.error('Technical details:', result.error)
      }
      return
    }
    
    // Handle success
    console.log('Success:', result.data)
  } catch (error) {
    // Catch unexpected errors
    console.error('Unexpected error:', error)
  }
}
```

---

## Usage Examples

### Example 1: Create Room Type and Initialize Inventory

```typescript
import { createRoomType } from '@/actions/rooms/room-type.action'
import { createBulkInventory } from '@/actions/rooms/room-inventory.action'

async function setupNewRoomType() {
  // Step 1: Create room type
  const roomTypeResult = await createRoomType({
    name: 'Honeymoon Suite',
    description: 'Romantic suite with private jacuzzi and ocean view',
    pricePerNight: 45000,  // $450
    totalRooms: 5,
  })

  if (!roomTypeResult.success) {
    console.error('Failed to create room type:', roomTypeResult.message)
    return
  }

  const roomType = roomTypeResult.data!
  console.log('✅ Room type created:', roomType.name)

  // Step 2: Create inventory for next 90 days
  const inventoryResult = await createBulkInventory({
    roomTypeId: roomType.id,
    startDate: new Date(),
    endDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
    // availableRooms defaults to totalRooms (5)
  })

  if (inventoryResult.success) {
    console.log(`✅ Inventory created: ${inventoryResult.data.total} records`)
  }
}
```

---

### Example 2: Search Available Rooms

```typescript
import { getRoomTypes } from '@/actions/rooms/room-type.action'
import { checkAvailability } from '@/actions/rooms/room-inventory.action'

async function searchAvailableRooms(
  checkIn: Date,
  checkOut: Date,
  maxPrice: number,
  requiredRooms: number = 1
) {
  // Get room types within price range
  const roomTypesResult = await getRoomTypes({
    maxPrice,
    sortBy: 'pricePerNight',
    sortOrder: 'asc',
  })

  if (!roomTypesResult.success) {
    return []
  }

  const availableRooms = []

  // Check availability for each room type
  for (const roomType of roomTypesResult.data) {
    const availabilityResult = await checkAvailability({
      roomTypeId: roomType.id,
      checkInDate: checkIn,
      checkOutDate: checkOut,
      requiredRooms,
    })

    if (availabilityResult.success && availabilityResult.data.isAvailable) {
      availableRooms.push({
        ...roomType,
        minAvailability: availabilityResult.data.minAvailability,
      })
    }
  }

  return availableRooms
}

// Usage
const available = await searchAvailableRooms(
  new Date('2025-12-20'),
  new Date('2025-12-25'),
  50000,  // Max $500/night
  2       // Need 2 rooms
)

console.log(`Found ${available.length} available room types`)
```

---

### Example 3: Process Booking (Decrement Inventory)

```typescript
import { checkAvailability, updateInventoryByDate } from '@/actions/rooms/room-inventory.action'
import { getInventoryByRoomType } from '@/actions/rooms/room-inventory.action'

async function processBooking(
  roomTypeId: string,
  checkIn: Date,
  checkOut: Date,
  roomsBooked: number
) {
  // Step 1: Check availability
  const availabilityResult = await checkAvailability({
    roomTypeId,
    checkInDate: checkIn,
    checkOutDate: checkOut,
    requiredRooms: roomsBooked,
  })

  if (!availabilityResult.success || !availabilityResult.data.isAvailable) {
    return { success: false, message: 'Rooms not available' }
  }

  // Step 2: Get inventory for date range
  const inventoryResult = await getInventoryByRoomType({
    roomTypeId,
    startDate: checkIn,
    endDate: checkOut,
  })

  if (!inventoryResult.success) {
    return { success: false, message: 'Failed to fetch inventory' }
  }

  // Step 3: Decrement inventory for each date
  for (const inv of inventoryResult.data) {
    const updateResult = await updateInventoryByDate({
      roomTypeId,
      date: inv.date,
      availableRooms: inv.availableRooms - roomsBooked,
    })

    if (!updateResult.success) {
      // TODO: Implement rollback logic
      return { success: false, message: 'Failed to update inventory' }
    }
  }

  return { success: true, message: 'Booking processed successfully' }
}
```

---

### Example 4: Admin Dashboard - Inventory Overview

```typescript
import { getRoomTypes } from '@/actions/rooms/room-type.action'
import { getInventoryByRoomType } from '@/actions/rooms/room-inventory.action'

async function getInventoryOverview() {
  // Get all room types
  const roomTypesResult = await getRoomTypes()
  
  if (!roomTypesResult.success) {
    return []
  }

  const overview = []
  const today = new Date()
  const nextWeek = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)

  for (const roomType of roomTypesResult.data) {
    const inventoryResult = await getInventoryByRoomType({
      roomTypeId: roomType.id,
      startDate: today,
      endDate: nextWeek,
    })

    if (inventoryResult.success) {
      const avgAvailability =
        inventoryResult.data.reduce((sum, inv) => sum + inv.availableRooms, 0) /
        inventoryResult.data.length

      const occupancyRate =
        ((roomType.totalRooms - avgAvailability) / roomType.totalRooms) * 100

      overview.push({
        name: roomType.name,
        totalRooms: roomType.totalRooms,
        avgAvailability: Math.round(avgAvailability),
        occupancyRate: Math.round(occupancyRate),
      })
    }
  }

  return overview
}

// Usage
const overview = await getInventoryOverview()
overview.forEach(room => {
  console.log(`${room.name}: ${room.occupancyRate}% occupancy`)
})
```

---

## Testing Guide

### Unit Testing

```typescript
import { describe, it, expect, vi } from 'vitest'
import { createRoomType, getRoomTypes } from '@/actions/rooms/room-type.action'

describe('Room Type Actions', () => {
  it('should create a room type with valid data', async () => {
    const result = await createRoomType({
      name: 'Test Room',
      description: 'Test description with enough characters',
      pricePerNight: 15000,
      totalRooms: 10,
    })

    expect(result.success).toBe(true)
    expect(result.data).toHaveProperty('id')
    expect(result.data?.name).toBe('Test Room')
  })

  it('should reject invalid price', async () => {
    const result = await createRoomType({
      name: 'Test Room',
      description: 'Test description',
      pricePerNight: 500,  // Too low
      totalRooms: 10,
    })

    expect(result.success).toBe(false)
    expect(result.message).toContain('Validation failed')
  })
})
```

### Integration Testing

```typescript
describe('Inventory Workflow', () => {
  it('should create room type and bulk inventory', async () => {
    // Create room type
    const roomTypeResult = await createRoomType({
      name: 'Integration Test Room',
      description: 'Room for testing the full workflow',
      pricePerNight: 20000,
      totalRooms: 15,
    })

    expect(roomTypeResult.success).toBe(true)
    const roomTypeId = roomTypeResult.data!.id

    // Create bulk inventory
    const inventoryResult = await createBulkInventory({
      roomTypeId,
      startDate: new Date('2025-10-01'),
      endDate: new Date('2025-10-31'),
    })

    expect(inventoryResult.success).toBe(true)
    expect(inventoryResult.data.total).toBe(30)

    // Check availability
    const availabilityResult = await checkAvailability({
      roomTypeId,
      checkInDate: new Date('2025-10-15'),
      checkOutDate: new Date('2025-10-18'),
      requiredRooms: 5,
    })

    expect(availabilityResult.success).toBe(true)
    expect(availabilityResult.data.isAvailable).toBe(true)
  })
})
```

### Manual Testing Checklist

#### Room Type Actions
- [ ] Create room type with valid data
- [ ] Create room type with duplicate name (should fail)
- [ ] Update room type price
- [ ] Update room type name (check uniqueness)
- [ ] Delete room type (verify cascade delete)
- [ ] Get all room types with filters
- [ ] Get single room type by ID

#### Inventory Actions
- [ ] Create single inventory record
- [ ] Create bulk inventory (30 days)
- [ ] Update inventory by ID
- [ ] Update inventory by date (upsert test)
- [ ] Delete inventory record
- [ ] Check availability for available dates
- [ ] Check availability for unavailable dates
- [ ] Verify availableRooms <= totalRooms validation

#### Authorization
- [ ] Test Admin user can create/update/delete
- [ ] Test SuperAdmin user has full access
- [ ] Test Member user cannot create/update/delete
- [ ] Test unauthenticated user can only read

---

## Best Practices

### 1. Always Validate Availability Before Booking

```typescript
// ❌ Bad: Skip availability check
await updateInventoryByDate({ roomTypeId, date, availableRooms: 10 })

// ✅ Good: Check first
const availability = await checkAvailability({...})
if (availability.data.isAvailable) {
  await updateInventoryByDate({...})
}
```

### 2. Use Bulk Operations for Efficiency

```typescript
// ❌ Bad: Create inventory one by one
for (let i = 0; i < 30; i++) {
  await createInventory({...})
}

// ✅ Good: Use bulk create
await createBulkInventory({
  startDate: new Date(),
  endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
})
```

### 3. Handle Errors Gracefully

```typescript
// ✅ Good: Check success and provide fallback
const result = await getRoomTypes()
if (!result.success) {
  console.error('Failed to load room types:', result.message)
  return []  // Return empty array instead of crashing
}
return result.data
```

### 4. Use TypeScript Types

```typescript
import type { RoomTypeResponse } from '@/types/room.types'

async function loadRoomType(id: string): Promise<RoomType | null> {
  const result: RoomTypeWithInventoryResponse = await getRoomTypeById({ id })
  return result.success && result.data ? result.data : null
}
```

---

## Troubleshooting

### Issue: "Unauthorized" Error

**Cause**: User doesn't have required permissions

**Solution**: Verify user role and permissions
```typescript
import { getCurrentUserSession } from '@/lib/auth/room-rbac'

const session = await getCurrentUserSession()
console.log('Role:', session?.role)
console.log('Permissions:', session?.permissions)
```

---

### Issue: "Validation failed" Error

**Cause**: Input doesn't match Zod schema

**Solution**: Check validation schema requirements
```typescript
// Check minimum/maximum values
pricePerNight: 1000-10000000 cents ($10-$100,000)
totalRooms: 1-1000
availableRooms: 0-1000
```

---

### Issue: "Room type not found"

**Cause**: Invalid room type ID or deleted room type

**Solution**: Verify room type exists
```typescript
const roomType = await getRoomTypeById({ id: 'clx123' })
if (!roomType.success || !roomType.data) {
  console.error('Room type does not exist')
}
```

---

### Issue: "Available rooms exceeds total rooms"

**Cause**: Trying to set availableRooms > totalRooms

**Solution**: Fetch room type and validate
```typescript
const roomType = await getRoomTypeById({ id })
if (availableRooms > roomType.data.totalRooms) {
  // Handle error
}
```

---

## Next Steps

1. **Implement Booking System**: Use these actions to create booking functionality
2. **Add Caching**: Cache room types and inventory for better performance
3. **Add Webhooks**: Notify external systems when inventory changes
4. **Add Analytics**: Track occupancy rates and revenue
5. **Add Reservation System**: Hold rooms temporarily before payment

---

## Related Documentation

- [Room Models Schema](./ROOM_MODELS.md) - Database schema and relations
- [RBAC Architecture](./RBAC_ARCHITECTURE.md) - Authorization system
- [Testing Guide](./TESTING_GUIDE.md) - Comprehensive testing strategies

---

**Last Updated**: 2025-01-22  
**Version**: 1.0.0  
**Maintainer**: Hotel Booking System Team
