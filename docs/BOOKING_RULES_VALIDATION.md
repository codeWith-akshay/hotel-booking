# Booking Rules Validation Implementation

## Overview
This document describes the comprehensive backend validation system for the booking flow, implementing three key validation rules before booking creation.

## Implemented Features

### 1. **3-2-1 Booking Rule** (Guest Type Based)
Different guest types have different booking windows and notice requirements:

#### Guest Type Rules

| Guest Type | Max Days Advance | Min Days Notice | Description |
|------------|------------------|-----------------|-------------|
| **REGULAR** | 90 days | 3 days | Standard guests can book 3-90 days in advance |
| **VIP** | 365 days | 2 days | VIP guests get extended booking window |
| **CORPORATE** | 180 days | 1 day | Corporate guests have flexible booking |

#### How It Works
- **Max Days Advance**: Users cannot book beyond this many days in the future
- **Min Days Notice**: Users must book at least this many days before check-in
- Rules are stored in `BookingRules` table and enforced before booking creation
- Fallback to default rules if database rules don't exist

#### User Type Detection
```typescript
- ADMIN/SUPERADMIN roles → VIP guest type
- Users with ircaMembershipId → CORPORATE guest type
- All other users → REGULAR guest type
```

---

### 2. **Group Booking Deposit Requirements**

#### Thresholds
- **Group Booking**: 10-19 rooms
- **Deposit Requirement**: 30% of total booking amount
- **Status**: Booking remains PENDING until deposit is paid

#### Process Flow
1. User creates booking with 10-19 rooms
2. System calculates 30% deposit amount
3. Validation returns `requiresDeposit: true` and `depositAmount`
4. Booking is created with:
   - `depositAmount` set
   - `isDepositPaid: false`
   - `status: PENDING`
5. User must pay deposit before booking moves to CONFIRMED

#### Calculation Example
```typescript
// Booking: 15 rooms, $150/night, 3 nights
Total = 15 rooms × $150/night × 3 nights = $6,750
Deposit = $6,750 × 30% = $2,025

// System stores amounts in cents
depositAmount = 202500 cents
```

---

### 3. **Special Day Restrictions**

Special days can block bookings or apply custom rates for holidays, maintenance, or blackout periods.

#### Rule Types

**a) Blocked Days**
- No bookings allowed on these dates
- Used for: Holidays, maintenance periods, private events
- Validation fails if any day in booking range is blocked

**b) Special Rate Days**
- Custom pricing applies
- Can use multiplier (e.g., 1.5× for 150%) or fixed price
- Warning shown to user about adjusted pricing

#### Configuration
```prisma
model SpecialDay {
  date        DateTime   // The special date
  roomTypeId  String?    // null = applies to all room types
  ruleType    String     // "blocked" | "special_rate"
  rateType    String?    // "multiplier" | "fixed"
  rateValue   Float?     // 1.5 or price in cents
  description String?
  active      Boolean
}
```

#### Examples

**Christmas - Blocked**
```typescript
{
  date: "2024-12-25",
  roomTypeId: null,        // All rooms
  ruleType: "blocked",
  description: "Christmas Day - Hotel Closed"
}
```

**New Year's Eve - Premium Rate**
```typescript
{
  date: "2024-12-31",
  roomTypeId: null,
  ruleType: "special_rate",
  rateType: "multiplier",
  rateValue: 2.0,          // 2× normal price
  description: "New Year's Eve - Premium Rates"
}
```

---

## Implementation Files

### Core Validator
**File**: `src/lib/validation/booking-rules-validator.ts`

Main function:
```typescript
async function validateBookingRules(
  userId: string,
  roomTypeId: string,
  startDate: Date,
  endDate: Date,
  roomsBooked: number = 1
): Promise<BookingValidationResult>
```

### Integration
**File**: `src/actions/bookings/bookings.action.ts`

The `createBookingAction` now includes:
```typescript
// Validate all booking rules before creation
const validation = await validateBookingRules(
  payload.guestId,
  payload.roomId,
  startDate,
  endDate,
  roomsBooked
)

// Fail if validation errors exist
if (!validation.isValid) {
  return {
    success: false,
    error: validation.errors.join(' '),
    validationErrors: validation.errors,
  }
}
```

---

## Error Messages

### User-Friendly Error Messages

#### 3-2-1 Rule Violations
```
❌ "Booking too far in advance. REGULAR guests can book up to 90 days ahead. 
   You are trying to book 120 days in advance."

❌ "Insufficient notice period. VIP guests require at least 2 day(s) advance 
   notice for bookings."
```

#### Group Booking Messages
```
⚠️  "This is a group booking (15 rooms). A 30% deposit of $2,025.00 is 
   required before confirmation."
```

#### Special Day Messages
```
❌ "Bookings are not allowed on the following date(s): 12/25/2024, 1/1/2025. 
   These are special days (holidays/maintenance/blackout periods)."

⚠️  "Special rates apply on: 12/31/2024. Final price may differ from 
   standard rates."
```

---

## Validation Result Structure

```typescript
interface BookingValidationResult {
  isValid: boolean           // Overall validation status
  errors: string[]           // Blocking errors (booking cannot proceed)
  warnings: string[]         // Non-blocking warnings (informational)
  requiresDeposit?: boolean  // Group booking flag
  depositAmount?: number     // Deposit amount in cents
}
```

### Example Responses

**✅ Success - Regular Booking**
```json
{
  "isValid": true,
  "errors": [],
  "warnings": [],
  "requiresDeposit": false
}
```

**✅ Success - Group Booking**
```json
{
  "isValid": true,
  "errors": [],
  "warnings": [
    "This is a group booking (12 rooms). A 30% deposit of $1,620.00 is required before confirmation."
  ],
  "requiresDeposit": true,
  "depositAmount": 162000
}
```

**❌ Failed - Multiple Violations**
```json
{
  "isValid": false,
  "errors": [
    "Booking too far in advance. REGULAR guests can book up to 90 days ahead. You are trying to book 150 days in advance.",
    "Bookings are not allowed on the following date(s): 12/25/2024. These are special days (holidays/maintenance/blackout periods)."
  ],
  "warnings": []
}
```

---

## Database Schema Requirements

### BookingRules Table
```sql
CREATE TABLE "booking_rules" (
  "id" TEXT PRIMARY KEY,
  "guestType" TEXT UNIQUE NOT NULL,
  "maxDaysAdvance" INTEGER NOT NULL,
  "minDaysNotice" INTEGER NOT NULL,
  "createdAt" DATETIME DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME
);
```

### SpecialDay Table
```sql
CREATE TABLE "special_days" (
  "id" TEXT PRIMARY KEY,
  "date" DATETIME NOT NULL,
  "roomTypeId" TEXT,
  "ruleType" TEXT NOT NULL,
  "rateType" TEXT,
  "rateValue" REAL,
  "description" TEXT,
  "active" BOOLEAN DEFAULT true,
  "createdAt" DATETIME DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME,
  UNIQUE("date", "roomTypeId")
);
```

### Booking Table Updates
```sql
ALTER TABLE "bookings" ADD COLUMN "roomsBooked" INTEGER DEFAULT 1;
ALTER TABLE "bookings" ADD COLUMN "depositAmount" INTEGER;
ALTER TABLE "bookings" ADD COLUMN "isDepositPaid" BOOLEAN DEFAULT false;
```

---

## Usage Examples

### Example 1: Regular User, Standard Booking
```typescript
// User: MEMBER role, no IRCA ID
// Trying to book 5 days from now
// 1 room, 2 nights

const validation = await validateBookingRules(
  "user-123",
  "room-type-456",
  new Date("2024-11-01"),  // 5 days from now
  new Date("2024-11-03"),
  1
)

// Result:
// ✅ isValid: true
// Guest Type: REGULAR (3-90 days, min 3 days notice)
// 5 days advance ✓ (within 90 days)
// 5 days notice ✓ (≥ 3 days)
```

### Example 2: VIP User, Last-Minute Booking
```typescript
// User: ADMIN role
// Trying to book tomorrow
// 1 room, 3 nights

const validation = await validateBookingRules(
  "admin-789",
  "room-type-456",
  new Date("2024-10-28"),  // Tomorrow
  new Date("2024-10-31"),
  1
)

// Result:
// ❌ isValid: false
// Guest Type: VIP (2-365 days, min 2 days notice)
// 1 day advance ✗ (< 2 days minimum)
// Error: "Insufficient notice period. VIP guests require at least 2 day(s) advance notice."
```

### Example 3: Corporate User, Group Booking
```typescript
// User: MEMBER with ircaMembershipId
// Booking 10 days from now
// 15 rooms, 3 nights

const validation = await validateBookingRules(
  "corp-user-101",
  "room-type-deluxe",
  new Date("2024-11-06"),
  new Date("2024-11-09"),
  15
)

// Result:
// ✅ isValid: true
// Guest Type: CORPORATE (1-180 days, min 1 day notice)
// ⚠️  Warning: "This is a group booking (15 rooms). A 30% deposit of $2,025.00 is required."
// requiresDeposit: true
// depositAmount: 202500 (cents)
```

### Example 4: Booking on Blocked Date
```typescript
// Trying to book on Christmas
// Room blocked on 12/25/2024

const validation = await validateBookingRules(
  "user-123",
  "room-type-456",
  new Date("2024-12-24"),
  new Date("2024-12-26"),  // Includes Christmas
  1
)

// Result:
// ❌ isValid: false
// Error: "Bookings are not allowed on the following date(s): 12/25/2024. 
//         These are special days (holidays/maintenance/blackout periods)."
```

---

## Testing

### Unit Tests
Create tests in `tests/unit/booking-rules-validation.test.ts`:

```typescript
describe('Booking Rules Validation', () => {
  test('REGULAR user cannot book beyond 90 days', async () => {
    const result = await validateBookingRules(
      regularUserId,
      roomTypeId,
      add(new Date(), { days: 100 }),
      add(new Date(), { days: 102 }),
      1
    )
    expect(result.isValid).toBe(false)
    expect(result.errors[0]).toContain('90 days ahead')
  })

  test('Group booking requires deposit', async () => {
    const result = await validateBookingRules(
      userId,
      roomTypeId,
      futureDate,
      add(futureDate, { days: 3 }),
      15
    )
    expect(result.isValid).toBe(true)
    expect(result.requiresDeposit).toBe(true)
    expect(result.depositAmount).toBeGreaterThan(0)
  })

  test('Blocked date prevents booking', async () => {
    // Setup: Create blocked special day
    await prisma.specialDay.create({
      data: {
        date: christmasDate,
        ruleType: 'blocked',
        active: true
      }
    })

    const result = await validateBookingRules(
      userId,
      roomTypeId,
      christmasEve,
      dayAfterChristmas,
      1
    )
    expect(result.isValid).toBe(false)
    expect(result.errors[0]).toContain('not allowed')
  })
})
```

---

## Seeding Default Rules

Add to `prisma/seed.ts`:

```typescript
// Seed booking rules
await prisma.bookingRules.createMany({
  data: [
    {
      guestType: 'REGULAR',
      maxDaysAdvance: 90,
      minDaysNotice: 3,
    },
    {
      guestType: 'VIP',
      maxDaysAdvance: 365,
      minDaysNotice: 2,
    },
    {
      guestType: 'CORPORATE',
      maxDaysAdvance: 180,
      minDaysNotice: 1,
    },
  ],
  skipDuplicates: true,
})

// Seed special days
await prisma.specialDay.createMany({
  data: [
    {
      date: new Date('2024-12-25'),
      ruleType: 'blocked',
      description: 'Christmas Day - Hotel Closed',
      active: true,
    },
    {
      date: new Date('2024-12-31'),
      ruleType: 'special_rate',
      rateType: 'multiplier',
      rateValue: 2.0,
      description: "New Year's Eve - Premium Rates",
      active: true,
    },
  ],
  skipDuplicates: true,
})
```

---

## Admin Interface

Create admin pages to manage these rules:

### `/admin/booking-rules` - Manage 3-2-1 Rules
- View current rules for each guest type
- Edit max days advance and min days notice
- Preview impact on users

### `/admin/special-days` - Manage Special Days
- Calendar view of special days
- Add blocked dates
- Set special rates
- Bulk operations for holidays

---

## Future Enhancements

1. **Dynamic Pricing**
   - Calculate adjusted prices for special rate days
   - Show price breakdown in booking flow

2. **Waitlist Integration**
   - Auto-notify waitlist when blocked dates open up
   - Priority booking for VIP on special days

3. **Flexible Group Tiers**
   - 20+ rooms: different deposit percentage
   - Custom rules per room type

4. **Analytics**
   - Track booking rule violations
   - Popular blocked dates
   - Group booking conversion rates

---

## Summary

✅ **3-2-1 Rule**: Enforces guest-type-based booking windows  
✅ **Group Deposits**: Requires 30% deposit for 10-19 room bookings  
✅ **Special Days**: Blocks or adjusts pricing for holidays/blackout periods  
✅ **User-Friendly Errors**: Clear, actionable error messages  
✅ **Database-Driven**: Rules stored in DB, easy to configure  
✅ **Type-Safe**: Full TypeScript support with proper types  

All validations occur **before** booking creation, preventing invalid bookings from entering the system.
