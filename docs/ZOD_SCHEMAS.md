# Zod Validation Schemas Documentation

Complete documentation for centralized Zod validation schemas for Room and Inventory forms.

## Table of Contents
- [Overview](#overview)
- [Installation](#installation)
- [Schemas](#schemas)
- [Usage Examples](#usage-examples)
- [TypeScript Types](#typescript-types)
- [Validation Helpers](#validation-helpers)
- [Custom Refinements](#custom-refinements)
- [Best Practices](#best-practices)

## Overview

The `roomSchemas.ts` file provides centralized Zod validation schemas for:
- **Room Types**: Creating and updating room type records
- **Inventory**: Managing single-date inventory records
- **Bulk Inventory**: Creating inventory across date ranges

### Location
```
src/lib/validation/zodSchemas/roomSchemas.ts
```

### Benefits
- ✅ **Type Safety**: Auto-generated TypeScript types via `z.infer<>`
- ✅ **Centralized**: Single source of truth for validation rules
- ✅ **Reusable**: Use in forms, server actions, and API routes
- ✅ **Self-Documenting**: Inline comments explain each field
- ✅ **Client & Server**: Works on both client and server side

## Installation

The schemas are already created. To use them, simply import:

```typescript
import {
  RoomTypeSchema,
  InventorySchema,
  BulkInventorySchema,
  type RoomTypeFormData,
  type InventoryFormData,
  type BulkInventoryFormData,
} from '@/lib/validation/zodSchemas/roomSchemas'
```

## Schemas

### 1. RoomTypeSchema

**Purpose**: Validate room type creation and updates

**Fields**:

| Field | Type | Validation | Description |
|-------|------|------------|-------------|
| `name` | `string` | min: 2, max: 100, trimmed | Room type name (e.g., "Deluxe Suite") |
| `description` | `string \| undefined` | max: 1000, trimmed, optional | Detailed description of amenities |
| `pricePerNight` | `number` | min: 1, max: 999999, positive | Price in currency units |
| `totalRooms` | `number` | min: 1, max: 1000, integer, positive | Total number of rooms |

**Schema Definition**:
```typescript
export const RoomTypeSchema = z.object({
  // Room type name (e.g., "Deluxe Suite", "Standard Room")
  // Minimum 2 characters to ensure meaningful names
  name: z
    .string()
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name must not exceed 100 characters')
    .trim(),

  // Detailed description of the room type
  // Optional field for additional information about amenities, size, etc.
  description: z
    .string()
    .max(1000, 'Description must not exceed 1000 characters')
    .trim()
    .optional()
    .or(z.literal('')),

  // Price per night in the currency unit (e.g., dollars, euros)
  // Must be at least 1 to ensure valid pricing
  pricePerNight: z
    .number()
    .min(1, 'Price must be at least 1')
    .max(999999, 'Price must not exceed 999,999')
    .positive('Price must be positive'),

  // Total number of rooms available for this room type
  // Must be at least 1 room
  totalRooms: z
    .number()
    .int('Total rooms must be a whole number')
    .min(1, 'Must have at least 1 room')
    .max(1000, 'Total rooms must not exceed 1000')
    .positive('Total rooms must be positive'),
})
```

---

### 2. InventorySchema

**Purpose**: Validate single inventory record creation/update

**Fields**:

| Field | Type | Validation | Description |
|-------|------|------------|-------------|
| `roomTypeId` | `string` | min: 1, UUID format | ID of the room type |
| `date` | `string` | YYYY-MM-DD format, valid date | Date for this inventory record |
| `availableRooms` | `number` | min: 0, integer, non-negative | Number of rooms available |

**Schema Definition**:
```typescript
export const InventorySchema = z.object({
  // ID of the room type this inventory belongs to
  // Must be a valid UUID or database ID
  roomTypeId: z
    .string()
    .min(1, 'Room type ID is required')
    .uuid('Invalid room type ID format'),

  // Date for this inventory record (ISO format: YYYY-MM-DD)
  // Must be a valid date string
  date: z
    .string()
    .min(1, 'Date is required')
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format')
    .refine(
      (dateStr) => {
        const date = new Date(dateStr)
        return !isNaN(date.getTime())
      },
      { message: 'Invalid date' }
    ),

  // Number of rooms available for booking on this date
  // Must be non-negative (0 = fully booked)
  availableRooms: z
    .number()
    .int('Available rooms must be a whole number')
    .min(0, 'Available rooms cannot be negative')
    .nonnegative('Available rooms must be non-negative'),
})
```

---

### 3. BulkInventorySchema

**Purpose**: Validate bulk inventory creation across date ranges

**Fields**:

| Field | Type | Validation | Description |
|-------|------|------------|-------------|
| `roomTypeId` | `string` | min: 1, UUID format | ID of the room type |
| `startDate` | `string` | YYYY-MM-DD format | Start date (inclusive) |
| `endDate` | `string` | YYYY-MM-DD format, after startDate | End date (exclusive) |
| `availableRooms` | `number \| undefined` | min: 0, integer, optional | Rooms available (defaults to totalRooms) |

**Custom Refinements**:
1. End date must be after start date
2. Both dates must be valid

**Schema Definition**:
```typescript
export const BulkInventorySchema = z
  .object({
    // ID of the room type to create inventory for
    roomTypeId: z
      .string()
      .min(1, 'Room type ID is required')
      .uuid('Invalid room type ID format'),

    // Start date of the range (ISO format: YYYY-MM-DD)
    // Inclusive - inventory will be created for this date
    startDate: z
      .string()
      .min(1, 'Start date is required')
      .regex(/^\d{4}-\d{2}-\d{2}$/, 'Start date must be in YYYY-MM-DD format'),

    // End date of the range (ISO format: YYYY-MM-DD)
    // Exclusive - inventory will be created up to but not including this date
    endDate: z
      .string()
      .min(1, 'End date is required')
      .regex(/^\d{4}-\d{2}-\d{2}$/, 'End date must be in YYYY-MM-DD format'),

    // Number of rooms available for each date in the range
    // Optional - if not provided, defaults to totalRooms of the room type
    availableRooms: z
      .number()
      .int('Available rooms must be a whole number')
      .min(0, 'Available rooms cannot be negative')
      .optional(),
  })
  .refine(
    (data) => {
      // Validate that end date is after start date
      const start = new Date(data.startDate)
      const end = new Date(data.endDate)
      return end > start
    },
    {
      message: 'End date must be after start date',
      path: ['endDate'],
    }
  )
```

## TypeScript Types

All schemas include auto-generated TypeScript types via `z.infer<>`:

```typescript
// Room Type
export type RoomTypeFormData = z.infer<typeof RoomTypeSchema>
// Equivalent to:
// {
//   name: string
//   description?: string | undefined
//   pricePerNight: number
//   totalRooms: number
// }

// Inventory
export type InventoryFormData = z.infer<typeof InventorySchema>
// Equivalent to:
// {
//   roomTypeId: string
//   date: string
//   availableRooms: number
// }

// Bulk Inventory
export type BulkInventoryFormData = z.infer<typeof BulkInventorySchema>
// Equivalent to:
// {
//   roomTypeId: string
//   startDate: string
//   endDate: string
//   availableRooms?: number | undefined
// }
```

## Usage Examples

### Example 1: Validate Room Type Form

```typescript
import { RoomTypeSchema, type RoomTypeFormData } from '@/lib/validation/zodSchemas/roomSchemas'

function CreateRoomForm() {
  const [formData, setFormData] = useState<RoomTypeFormData>({
    name: '',
    description: '',
    pricePerNight: 0,
    totalRooms: 0,
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validate form data
    const result = RoomTypeSchema.safeParse(formData)

    if (!result.success) {
      // Handle validation errors
      const errors = result.error.flatten()
      console.log('Validation errors:', errors)
      return
    }

    // Type-safe validated data
    const validatedData: RoomTypeFormData = result.data

    // Submit to server action
    await createRoomType(validatedData)
  }

  return (
    <form onSubmit={handleSubmit}>
      {/* Form fields */}
    </form>
  )
}
```

### Example 2: Validate in Server Action

```typescript
'use server'

import { RoomTypeSchema } from '@/lib/validation/zodSchemas/roomSchemas'

export async function createRoomType(data: unknown) {
  // Validate incoming data
  const result = RoomTypeSchema.safeParse(data)

  if (!result.success) {
    return {
      success: false,
      message: 'Validation failed',
      errors: result.error.flatten().fieldErrors,
    }
  }

  // Safe to use validated data
  const validatedData = result.data

  // Create in database
  const roomType = await prisma.roomType.create({
    data: {
      name: validatedData.name,
      description: validatedData.description || null,
      pricePerNight: validatedData.pricePerNight,
      totalRooms: validatedData.totalRooms,
    },
  })

  return { success: true, data: roomType }
}
```

### Example 3: Bulk Inventory Validation

```typescript
import { BulkInventorySchema } from '@/lib/validation/zodSchemas/roomSchemas'

function BulkInventoryModal({ roomTypeId, totalRooms }: Props) {
  const [formData, setFormData] = useState({
    roomTypeId,
    startDate: '',
    endDate: '',
    availableRooms: undefined,
  })

  const handleSubmit = async () => {
    // Validate
    const result = BulkInventorySchema.safeParse(formData)

    if (!result.success) {
      // Show errors
      const errors = result.error.flatten()
      
      // endDate error will show: "End date must be after start date"
      if (errors.fieldErrors.endDate) {
        setEndDateError(errors.fieldErrors.endDate[0])
      }
      
      return
    }

    // Submit validated data
    await createBulkInventory(result.data)
  }

  return <form>{/* ... */}</form>
}
```

### Example 4: React Hook Form Integration

```typescript
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { RoomTypeSchema, type RoomTypeFormData } from '@/lib/validation/zodSchemas/roomSchemas'

function RoomTypeForm() {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RoomTypeFormData>({
    resolver: zodResolver(RoomTypeSchema),
  })

  const onSubmit = async (data: RoomTypeFormData) => {
    // Data is already validated by Zod
    await createRoomType(data)
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <input {...register('name')} />
      {errors.name && <span>{errors.name.message}</span>}

      <textarea {...register('description')} />
      {errors.description && <span>{errors.description.message}</span>}

      <input type="number" {...register('pricePerNight', { valueAsNumber: true })} />
      {errors.pricePerNight && <span>{errors.pricePerNight.message}</span>}

      <input type="number" {...register('totalRooms', { valueAsNumber: true })} />
      {errors.totalRooms && <span>{errors.totalRooms.message}</span>}

      <button type="submit">Create Room Type</button>
    </form>
  )
}
```

## Validation Helpers

The schemas export helper functions for common validation tasks:

### validateRoomType

```typescript
export function validateRoomType(data: unknown) {
  return RoomTypeSchema.safeParse(data)
}

// Usage
const result = validateRoomType(formData)
if (result.success) {
  console.log('Valid data:', result.data)
} else {
  console.log('Errors:', result.error.flatten())
}
```

### validateInventory

```typescript
export function validateInventory(data: unknown) {
  return InventorySchema.safeParse(data)
}
```

### validateBulkInventory

```typescript
export function validateBulkInventory(data: unknown) {
  return BulkInventorySchema.safeParse(data)
}
```

## Custom Refinements

The schemas include factory functions to create custom validation rules:

### createInventoryWithMaxRoomsSchema

**Purpose**: Validate that `availableRooms` doesn't exceed the room type's `totalRooms`

```typescript
export function createInventoryWithMaxRoomsSchema(totalRooms: number) {
  return InventorySchema.extend({
    availableRooms: z
      .number()
      .int()
      .min(0)
      .max(totalRooms, `Available rooms cannot exceed ${totalRooms}`),
  })
}

// Usage
const roomType = { totalRooms: 25 }
const CustomSchema = createInventoryWithMaxRoomsSchema(roomType.totalRooms)

const result = CustomSchema.safeParse({
  roomTypeId: 'uuid',
  date: '2025-10-25',
  availableRooms: 30, // ❌ Fails: exceeds 25
})

console.log(result.error.message) // "Available rooms cannot exceed 25"
```

### createBulkInventoryWithMaxRoomsSchema

**Purpose**: Same as above but for bulk inventory

```typescript
export function createBulkInventoryWithMaxRoomsSchema(totalRooms: number) {
  return BulkInventorySchema.extend({
    availableRooms: z
      .number()
      .int()
      .min(0)
      .max(totalRooms, `Available rooms cannot exceed ${totalRooms}`)
      .optional(),
  })
}

// Usage in component
function BulkInventoryForm({ roomType }: Props) {
  const CustomSchema = createBulkInventoryWithMaxRoomsSchema(roomType.totalRooms)

  const handleSubmit = (data: unknown) => {
    const result = CustomSchema.safeParse(data)
    // Will validate that availableRooms ≤ roomType.totalRooms
  }
}
```

## Best Practices

### 1. Use TypeScript Types

Always use the inferred types for type safety:

```typescript
// ✅ Good
import { type RoomTypeFormData } from '@/lib/validation/zodSchemas/roomSchemas'

const data: RoomTypeFormData = {
  name: 'Deluxe Suite',
  pricePerNight: 150,
  totalRooms: 10,
}

// ❌ Bad - no type safety
const data = {
  name: 'Deluxe Suite',
  pricePerNight: 150,
  totalRooms: 10,
}
```

### 2. Validate on Client AND Server

Always validate on both sides:

```typescript
// Client-side: Provide immediate feedback
function Form() {
  const result = RoomTypeSchema.safeParse(formData)
  if (!result.success) {
    showErrors(result.error)
    return
  }
  await submitToServer(result.data)
}

// Server-side: Security and data integrity
async function serverAction(data: unknown) {
  const result = RoomTypeSchema.safeParse(data)
  if (!result.success) {
    return { error: 'Invalid data' }
  }
  // Safe to use result.data
}
```

### 3. Use Custom Refinements When Needed

For dynamic validation rules (like max rooms), use factory functions:

```typescript
// ✅ Good - validates against actual totalRooms
const schema = createInventoryWithMaxRoomsSchema(roomType.totalRooms)

// ❌ Bad - hardcoded max might be wrong
const schema = InventorySchema.extend({
  availableRooms: z.number().max(100), // What if this room type has 150 rooms?
})
```

### 4. Handle Errors Gracefully

```typescript
const result = RoomTypeSchema.safeParse(data)

if (!result.success) {
  // Option 1: Flatten errors for forms
  const errors = result.error.flatten()
  setFieldErrors(errors.fieldErrors)

  // Option 2: Get first error message
  const firstError = result.error.issues[0]?.message
  showToast(firstError, 'error')

  // Option 3: Group by field
  const errorsByField = result.error.formErrors.fieldErrors
  Object.entries(errorsByField).forEach(([field, messages]) => {
    console.log(`${field}: ${messages.join(', ')}`)
  })
}
```

### 5. Reuse Schemas

Don't duplicate validation logic:

```typescript
// ✅ Good - single source of truth
import { RoomTypeSchema } from '@/lib/validation/zodSchemas/roomSchemas'

// Use in form
const FormSchema = RoomTypeSchema

// Use in server action
const ServerSchema = RoomTypeSchema

// Extend if needed
const ExtendedSchema = RoomTypeSchema.extend({
  customField: z.string(),
})

// ❌ Bad - duplicated validation
const FormSchema = z.object({ name: z.string().min(2), /* ... */ })
const ServerSchema = z.object({ name: z.string().min(2), /* ... */ })
```

## Error Messages

All validation rules include descriptive error messages:

| Validation | Error Message |
|------------|---------------|
| `name.min(2)` | "Name must be at least 2 characters" |
| `name.max(100)` | "Name must not exceed 100 characters" |
| `description.max(1000)` | "Description must not exceed 1000 characters" |
| `pricePerNight.min(1)` | "Price must be at least 1" |
| `pricePerNight.max(999999)` | "Price must not exceed 999,999" |
| `pricePerNight.positive()` | "Price must be positive" |
| `totalRooms.int()` | "Total rooms must be a whole number" |
| `totalRooms.min(1)` | "Must have at least 1 room" |
| `totalRooms.max(1000)` | "Total rooms must not exceed 1000" |
| `roomTypeId.uuid()` | "Invalid room type ID format" |
| `date.regex()` | "Date must be in YYYY-MM-DD format" |
| `date.refine()` | "Invalid date" |
| `availableRooms.min(0)` | "Available rooms cannot be negative" |
| `endDate.refine()` | "End date must be after start date" |

## Testing Schemas

```typescript
import { describe, it, expect } from 'vitest'
import { RoomTypeSchema, InventorySchema, BulkInventorySchema } from './roomSchemas'

describe('RoomTypeSchema', () => {
  it('should validate valid data', () => {
    const validData = {
      name: 'Deluxe Suite',
      description: 'Luxury room with ocean view',
      pricePerNight: 250,
      totalRooms: 15,
    }

    const result = RoomTypeSchema.safeParse(validData)
    expect(result.success).toBe(true)
  })

  it('should reject name shorter than 2 characters', () => {
    const invalidData = {
      name: 'D',
      pricePerNight: 250,
      totalRooms: 15,
    }

    const result = RoomTypeSchema.safeParse(invalidData)
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues[0].message).toContain('at least 2 characters')
    }
  })
})
```

## Summary

The Zod validation schemas provide:
- **Centralized validation** for Room and Inventory forms
- **TypeScript types** auto-generated via `z.infer<>`
- **Inline documentation** explaining each field
- **Reusable helpers** for common validation tasks
- **Custom refinements** for dynamic rules (e.g., max rooms)
- **Descriptive errors** for better user experience
- **Client & server** validation support

Use these schemas consistently across forms, server actions, and API routes to ensure data integrity and type safety throughout your application.
