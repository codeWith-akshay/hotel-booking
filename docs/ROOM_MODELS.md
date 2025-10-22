# Room Management System - Prisma Models

## Overview

This document describes the RoomType and RoomInventory Prisma models for the hotel booking system. These models enable dynamic inventory management, date-based availability tracking, and booking operations.

---

## Database Schema

### RoomType Model

The `RoomType` model represents categories of rooms available in the hotel (e.g., Deluxe, Suite, Presidential).

#### Schema Definition

```prisma
model RoomType {
  id            String   @id @default(cuid())
  name          String   @unique
  description   String   @db.Text
  pricePerNight Int
  totalRooms    Int
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  // Relations
  inventory RoomInventory[]

  // Indexes
  @@index([name])
  @@index([pricePerNight])
  @@map("room_types")
}
```

#### Field Descriptions

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `id` | String | Primary Key, CUID | Unique identifier for the room type |
| `name` | String | Unique, Indexed | Display name (e.g., "Deluxe Room", "Executive Suite") |
| `description` | String (Text) | - | Detailed description of room features, amenities, size |
| `pricePerNight` | Int | Indexed | Base price per night in cents (e.g., 15000 = $150.00) |
| `totalRooms` | Int | - | Total physical rooms of this type in the hotel |
| `createdAt` | DateTime | Auto-generated | Timestamp when record was created |
| `updatedAt` | DateTime | Auto-updated | Timestamp when record was last updated |

#### Relations

- **One-to-Many with RoomInventory**: Each RoomType has multiple daily inventory records
- **Cascade Delete**: When a RoomType is deleted, all its inventory records are automatically deleted

#### Indexes

- `name` - For fast lookups by room type name
- `pricePerNight` - For price range queries and sorting

---

### RoomInventory Model

The `RoomInventory` model tracks daily availability for each room type. Each record represents the number of available rooms for a specific room type on a specific date.

#### Schema Definition

```prisma
model RoomInventory {
  id             String   @id @default(cuid())
  roomTypeId     String
  availableRooms Int
  date           DateTime @db.Date
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt

  // Relations
  roomType RoomType @relation(fields: [roomTypeId], references: [id], onDelete: Cascade)

  // Indexes
  @@index([roomTypeId])
  @@index([date])
  @@unique([roomTypeId, date])
  @@map("room_inventory")
}
```

#### Field Descriptions

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `id` | String | Primary Key, CUID | Unique identifier for the inventory record |
| `roomTypeId` | String | Foreign Key, Indexed | References RoomType.id |
| `availableRooms` | Int | - | Number of rooms available for booking on this date |
| `date` | DateTime (Date) | Indexed, Unique composite | The specific date (YYYY-MM-DD) for this inventory |
| `createdAt` | DateTime | Auto-generated | Timestamp when record was created |
| `updatedAt` | DateTime | Auto-updated | Timestamp when record was last updated |

#### Relations

- **Many-to-One with RoomType**: Each inventory record belongs to one room type
- **Cascade Delete**: Deleting a room type automatically deletes all its inventory records

#### Constraints

- **Unique Composite Index**: `(roomTypeId, date)` - Ensures only one inventory record per room type per date
- Prevents duplicate inventory records for the same room type and date

#### Indexes

- `roomTypeId` - For fast lookups of all inventory for a room type
- `date` - For fast date range queries (e.g., availability for next 30 days)

---

## Relationships Diagram

```
RoomType (1) ←──────────→ (Many) RoomInventory
    │                            │
    │                            │
    └─ id                        └─ roomTypeId (FK)
    └─ name                      └─ availableRooms
    └─ pricePerNight             └─ date
    └─ totalRooms
```

### Relationship Details

- **Type**: One-to-Many
- **Delete Behavior**: Cascade (deleting RoomType deletes all related inventory)
- **Referential Integrity**: Enforced at database level via foreign key

---

## Seed Data

The system includes seed data for 3 room types with 90 days of inventory.

### Room Types Seeded

#### 1. Deluxe Room
- **Price**: $150.00/night (15000 cents)
- **Total Rooms**: 20
- **Description**: Spacious room with king-size bed, modern amenities, private balcony with city views
- **Features**: 
  - Complimentary Wi-Fi
  - 50" Smart TV
  - Mini-bar
  - Coffee maker
  - Marble bathroom with rain shower
  - Room size: 350 sq ft

#### 2. Executive Suite
- **Price**: $250.00/night (25000 cents)
- **Total Rooms**: 10
- **Description**: Premium suite with separate living and sleeping areas, exclusive lounge access
- **Features**:
  - King-size bed with premium bedding
  - Spacious living room with sofa bed
  - Dining area
  - Kitchenette
  - Two 55" Smart TVs
  - Premium bathroom with bathtub and separate shower
  - Complimentary breakfast
  - Room size: 650 sq ft

#### 3. Presidential Suite
- **Price**: $500.00/night (50000 cents)
- **Total Rooms**: 3
- **Description**: Ultimate luxury with panoramic views, master bedroom, private dining, butler service
- **Features**:
  - Master bedroom with king-size bed
  - Grand piano
  - Home theater system
  - Private bar
  - Premium jacuzzi
  - Walk-in closet
  - 24/7 butler service
  - Complimentary airport transfers
  - Room size: 1,200 sq ft

### Inventory Seeding

- **Date Range**: Today + 90 days
- **Initial Availability**: Each room type starts with full availability (equals totalRooms)
- **Total Records**: 270 (3 room types × 90 days)
- **Update Strategy**: Upsert (idempotent seeding)

---

## Usage Examples

### TypeScript Type Definitions

```typescript
import { RoomType, RoomInventory } from '@prisma/client'

// RoomType with inventory
type RoomTypeWithInventory = RoomType & {
  inventory: RoomInventory[]
}

// RoomInventory with room type
type RoomInventoryWithType = RoomInventory & {
  roomType: RoomType
}
```

### 1. Fetch All Room Types

```typescript
import { prisma } from '@/lib/prisma'

async function getAllRoomTypes() {
  const roomTypes = await prisma.roomType.findMany({
    orderBy: {
      pricePerNight: 'asc', // Sort by price
    },
  })
  return roomTypes
}
```

### 2. Get Room Type with Inventory

```typescript
async function getRoomTypeWithInventory(roomTypeId: string) {
  const roomType = await prisma.roomType.findUnique({
    where: { id: roomTypeId },
    include: {
      inventory: {
        where: {
          date: {
            gte: new Date(), // Only future dates
          },
        },
        orderBy: {
          date: 'asc',
        },
      },
    },
  })
  return roomType
}
```

### 3. Check Availability for Date Range

```typescript
async function checkAvailability(
  roomTypeId: string,
  checkInDate: Date,
  checkOutDate: Date
) {
  const inventory = await prisma.roomInventory.findMany({
    where: {
      roomTypeId,
      date: {
        gte: checkInDate,
        lt: checkOutDate,
      },
    },
    orderBy: {
      date: 'asc',
    },
  })

  // Check if any date has 0 availability
  const isAvailable = inventory.every((inv) => inv.availableRooms > 0)
  const minAvailability = Math.min(...inventory.map((inv) => inv.availableRooms))

  return {
    isAvailable,
    minAvailability,
    inventory,
  }
}
```

### 4. Create Inventory for New Dates

```typescript
async function createInventoryForDates(
  roomTypeId: string,
  dates: Date[]
) {
  const roomType = await prisma.roomType.findUnique({
    where: { id: roomTypeId },
  })

  if (!roomType) {
    throw new Error('Room type not found')
  }

  const inventoryRecords = await Promise.all(
    dates.map((date) =>
      prisma.roomInventory.upsert({
        where: {
          roomTypeId_date: {
            roomTypeId,
            date,
          },
        },
        update: {},
        create: {
          roomTypeId,
          date,
          availableRooms: roomType.totalRooms,
        },
      })
    )
  )

  return inventoryRecords
}
```

### 5. Update Availability (Book Rooms)

```typescript
async function bookRooms(
  roomTypeId: string,
  checkInDate: Date,
  checkOutDate: Date,
  roomCount: number
) {
  // Generate array of dates
  const dates: Date[] = []
  const currentDate = new Date(checkInDate)
  while (currentDate < checkOutDate) {
    dates.push(new Date(currentDate))
    currentDate.setDate(currentDate.getDate() + 1)
  }

  // Use transaction to ensure atomic updates
  const result = await prisma.$transaction(async (tx) => {
    // Check availability for all dates
    const inventory = await tx.roomInventory.findMany({
      where: {
        roomTypeId,
        date: { in: dates },
      },
    })

    // Verify sufficient rooms available
    const insufficientDates = inventory.filter(
      (inv) => inv.availableRooms < roomCount
    )
    if (insufficientDates.length > 0) {
      throw new Error(
        `Insufficient rooms on ${insufficientDates.map((d) => d.date.toISOString()).join(', ')}`
      )
    }

    // Update availability
    const updates = await Promise.all(
      dates.map((date) =>
        tx.roomInventory.update({
          where: {
            roomTypeId_date: {
              roomTypeId,
              date,
            },
          },
          data: {
            availableRooms: {
              decrement: roomCount,
            },
          },
        })
      )
    )

    return updates
  })

  return result
}
```

### 6. Cancel Booking (Restore Availability)

```typescript
async function cancelBooking(
  roomTypeId: string,
  checkInDate: Date,
  checkOutDate: Date,
  roomCount: number
) {
  const dates: Date[] = []
  const currentDate = new Date(checkInDate)
  while (currentDate < checkOutDate) {
    dates.push(new Date(currentDate))
    currentDate.setDate(currentDate.getDate() + 1)
  }

  const result = await prisma.$transaction(async (tx) => {
    const updates = await Promise.all(
      dates.map((date) =>
        tx.roomInventory.update({
          where: {
            roomTypeId_date: {
              roomTypeId,
              date,
            },
          },
          data: {
            availableRooms: {
              increment: roomCount,
            },
          },
        })
      )
    )

    return updates
  })

  return result
}
```

### 7. Get Available Room Types for Date Range

```typescript
async function getAvailableRoomTypes(
  checkInDate: Date,
  checkOutDate: Date,
  requiredRooms: number = 1
) {
  const roomTypes = await prisma.roomType.findMany({
    include: {
      inventory: {
        where: {
          date: {
            gte: checkInDate,
            lt: checkOutDate,
          },
        },
      },
    },
  })

  // Filter room types with sufficient availability
  const availableRoomTypes = roomTypes.filter((roomType) => {
    const allDatesAvailable = roomType.inventory.every(
      (inv) => inv.availableRooms >= requiredRooms
    )
    return allDatesAvailable
  })

  return availableRoomTypes
}
```

---

## Database Operations

### Running Migrations

```bash
# Create migration
npx prisma migrate dev --name add_room_models

# Apply migrations to production
npx prisma migrate deploy

# Generate Prisma Client
npx prisma generate
```

### Running Seeds

```bash
# Seed database with room types and inventory
npx prisma db seed
```

### Resetting Database

```bash
# Drop database, run all migrations, and seed
npx prisma migrate reset
```

---

## Best Practices

### 1. Inventory Management

**Always use transactions** when updating inventory to prevent race conditions:

```typescript
await prisma.$transaction(async (tx) => {
  // All inventory operations here
})
```

### 2. Date Handling

**Normalize dates** to avoid timezone issues:

```typescript
function normalizeDate(date: Date): Date {
  const normalized = new Date(date)
  normalized.setHours(0, 0, 0, 0)
  return normalized
}
```

### 3. Overbooking Prevention

**Always validate** against `totalRooms`:

```typescript
const roomType = await prisma.roomType.findUnique({
  where: { id: roomTypeId },
})

if (newAvailability > roomType.totalRooms) {
  throw new Error('Cannot exceed total rooms')
}
```

### 4. Price Handling

**Store prices in cents** to avoid floating-point errors:

```typescript
// Store: 15000 (cents)
// Display: $150.00
const displayPrice = pricePerNight / 100
```

### 5. Inventory Initialization

**Pre-populate inventory** for future dates (e.g., 90-365 days ahead):

```typescript
// Run nightly cron job to extend inventory
async function extendInventory() {
  const targetDate = new Date()
  targetDate.setDate(targetDate.getDate() + 90)
  
  // Create inventory records up to target date
}
```

---

## Validation Rules

### RoomType Validation

```typescript
import { z } from 'zod'

const RoomTypeSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().min(10).max(2000),
  pricePerNight: z.number().int().positive().min(1000), // Min $10
  totalRooms: z.number().int().positive().min(1).max(1000),
})
```

### RoomInventory Validation

```typescript
const RoomInventorySchema = z.object({
  roomTypeId: z.string().cuid(),
  availableRooms: z.number().int().min(0),
  date: z.date().refine(
    (date) => date >= new Date(),
    'Date must be in the future'
  ),
})
```

---

## Performance Considerations

### 1. Indexes

The schema includes strategic indexes:
- `RoomType.name` - Fast lookups by room type
- `RoomType.pricePerNight` - Price range queries
- `RoomInventory.roomTypeId` - Fast inventory lookups
- `RoomInventory.date` - Date range queries

### 2. Query Optimization

```typescript
// BAD: N+1 query problem
const roomTypes = await prisma.roomType.findMany()
for (const roomType of roomTypes) {
  const inventory = await prisma.roomInventory.findMany({
    where: { roomTypeId: roomType.id },
  })
}

// GOOD: Single query with join
const roomTypes = await prisma.roomType.findMany({
  include: {
    inventory: true,
  },
})
```

### 3. Batch Operations

```typescript
// Use transactions for batch updates
await prisma.$transaction(
  dates.map((date) =>
    prisma.roomInventory.update({
      where: { roomTypeId_date: { roomTypeId, date } },
      data: { availableRooms: { decrement: 1 } },
    })
  )
)
```

---

## Migration History

| Migration | Date | Description |
|-----------|------|-------------|
| `20251022060749_init` | 2025-10-22 | Initial schema setup |
| `20251022061850_auth_module_setup` | 2025-10-22 | Authentication models |
| `add_room_models` | 2025-10-22 | Added RoomType and RoomInventory models |

---

## Testing Checklist

- [ ] Room types can be created with valid data
- [ ] Room type names are unique
- [ ] Prices are stored in cents (integer)
- [ ] Inventory records have unique (roomTypeId, date) pairs
- [ ] Cascading delete removes all inventory when room type is deleted
- [ ] Available rooms cannot exceed totalRooms
- [ ] Date-based queries return correct inventory
- [ ] Transactions prevent race conditions during booking
- [ ] Seed data creates 3 room types
- [ ] Seed data creates 90 days of inventory per room type
- [ ] Booking decrements availability correctly
- [ ] Cancellation increments availability correctly

---

## Summary

### Models Created
- ✅ **RoomType** - Room categories with pricing and capacity
- ✅ **RoomInventory** - Daily availability tracking

### Features
- ✅ One-to-many relationship with cascade delete
- ✅ Unique composite index on (roomTypeId, date)
- ✅ Strategic indexes for performance
- ✅ Comprehensive Prisma comments
- ✅ Seed data for 3 room types
- ✅ 90 days of inventory per room type

### Room Types Seeded
- ✅ Deluxe Room ($150/night, 20 rooms)
- ✅ Executive Suite ($250/night, 10 rooms)
- ✅ Presidential Suite ($500/night, 3 rooms)

### Total Seed Data
- **Room Types**: 3
- **Inventory Records**: 270 (3 types × 90 days)
- **Date Range**: Today through next 89 days
