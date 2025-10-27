# Day 12 — Group Booking, Deposits & Special Day Rules

**Implementation Guide for Hotel Booking System**

---

## 📋 Overview

Day 12 adds advanced booking features to the hotel management system:

1. **Group Booking Support**: Handle bookings for 10-100+ rooms
2. **Deposit Policies**: Configurable deposit requirements for large bookings
3. **Special Day Rules**: Blocked dates and dynamic pricing (holidays, events, sales)
4. **Enhanced Price Calculation**: Automatic price adjustments based on special days
5. **Transaction-safe Operations**: Atomic booking creation with inventory management

---

## 🗄️ Database Schema

### DepositPolicy Model

Configures deposit requirements for group bookings.

```prisma
model DepositPolicy {
  id          String   @id @default(cuid())
  minRooms    Int      // Lower bound (e.g., 10)
  maxRooms    Int      // Upper bound (e.g., 19)
  type        String   // "percent" | "fixed"
  value       Float    // Percentage (20.0 = 20%) or fixed amount in cents
  description String?
  active      Boolean  @default(true)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}
```

**Example Policies:**
- 10-19 rooms: 20% deposit
- 20-49 rooms: 30% deposit
- 50+ rooms: 50% deposit

### SpecialDay Model

Defines special pricing or blocked dates.

```prisma
model SpecialDay {
  id          String    @id @default(cuid())
  date        DateTime  // Date this rule applies to
  roomTypeId  String?   // null = apply to all room types
  ruleType    String    // "blocked" | "special_rate"
  rateType    String?   // "multiplier" | "fixed"
  rateValue   Float?    // 1.5 = 150% of base price, or fixed price in cents
  description String?
  active      Boolean   @default(true)
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt
  
  roomType    RoomType? @relation(fields: [roomTypeId], references: [id])
  
  @@unique([date, roomTypeId])
}
```

**Rule Types:**
- `blocked`: No bookings allowed (maintenance, private events)
- `special_rate`: Custom pricing (holidays, sales, peak seasons)

**Rate Types:**
- `multiplier`: Multiply base price (e.g., 1.5 = 50% increase, 0.8 = 20% discount)
- `fixed`: Override with fixed price per night in cents

### Booking Model Updates

```prisma
model Booking {
  // ... existing fields
  
  roomsBooked    Int      @default(1)        // Number of rooms
  depositAmount  Int?                        // Required deposit in cents
  isDepositPaid  Boolean  @default(false)    // Payment status
  
  // ... existing relations
}
```

---

## 🔧 Core Features

### 1. Deposit Policy Management

**Server Actions** (`src/actions/deposit-policies/index.ts`):

```typescript
// Create policy (SuperAdmin only)
const result = await createDepositPolicy({
  minRooms: 10,
  maxRooms: 19,
  type: 'percent',
  value: 20.0,
  description: '10-19 rooms require 20% deposit',
  active: true
})

// Get applicable policy for booking
const policy = await getApplicableDepositPolicy(15) // 15 rooms

// Calculate deposit amount
const deposit = await calculateDepositAmount(15, 50000) // 15 rooms, ₹500 total
// Returns: { required: true, amount: 10000, policy: {...} }
```

**API Endpoints**:
- `GET /api/admin/deposit-policies` - List all policies
- `POST /api/admin/deposit-policies` - Create policy
- `GET /api/admin/deposit-policies/[id]` - Get single policy
- `PATCH /api/admin/deposit-policies/[id]` - Update policy
- `DELETE /api/admin/deposit-policies/[id]` - Soft delete (set active=false)

### 2. Special Day Management

**Server Actions** (`src/actions/special-days/index.ts`):

```typescript
// Create blocked date
const blocked = await createSpecialDay({
  date: new Date('2025-12-25'),
  roomTypeId: null, // Apply to all room types
  ruleType: 'blocked',
  description: 'Property closed for Christmas',
  active: true
})

// Create premium rate
const premium = await createSpecialDay({
  date: new Date('2025-12-31'),
  roomTypeId: null,
  ruleType: 'special_rate',
  rateType: 'multiplier',
  rateValue: 1.75, // 75% price increase
  description: "New Year's Eve Premium",
  active: true
})

// Check if dates are blocked
const check = await checkBlockedDates(
  new Date('2025-12-20'),
  new Date('2025-12-27'),
  'room-type-id'
)
```

**API Endpoints**:
- `GET /api/admin/special-days` - List special days (with filters)
- `POST /api/admin/special-days` - Create special day
- `GET /api/admin/special-days/[id]` - Get single special day
- `PATCH /api/admin/special-days/[id]` - Update special day
- `DELETE /api/admin/special-days/[id]` - Soft delete

**Query Parameters**:
```
?startDate=2025-12-01
&endDate=2025-12-31
&roomTypeId=abc123
&ruleType=special_rate
&active=true
```

### 3. Price Calculation with Special Days

**Utility** (`src/lib/pricing.ts`):

```typescript
const calculation = await calculatePriceWithSpecialDays(
  'room-type-id',
  new Date('2025-12-24'),
  new Date('2025-12-27'),
  2 // 2 rooms
)

/*
Returns:
{
  success: true,
  basePrice: 15000,  // Original price (3 nights × ₹2500 × 2 rooms)
  specialDayAdjustments: [
    {
      date: '2025-12-25',
      originalPrice: 2500,
      adjustedPrice: 3750,  // 1.5x multiplier (Christmas)
      ruleType: 'special_rate',
      description: 'Christmas Premium'
    }
  ],
  totalPrice: 17500,  // Adjusted total
  nights: 3,
  roomsBooked: 2
}
*/
```

**Price Breakdown API**:

```typescript
const breakdown = await getPriceBreakdown(
  'room-type-id',
  startDate,
  endDate,
  roomsBooked
)

/*
Includes:
- basePrice: Original calculation
- totalPrice: With adjustments
- difference: Price change amount
- percentageChange: Price change %
- hasSpecialRates: Boolean flag
- specialDayAdjustments: Detailed breakdown
*/
```

### 4. Group Booking Creation

**Server Action** (`src/actions/bookings/group-booking.action.ts`):

```typescript
const result = await createGroupBooking({
  userId: 'user-id',
  roomTypeId: 'room-type-id',
  startDate: new Date('2025-12-20'),
  endDate: new Date('2025-12-23'),
  roomsBooked: 15,
  isDepositPaid: true  // Mark as paid if deposit processed
})

/*
Workflow:
1. Validate user exists
2. Validate booking (dates, availability, blocked days)
3. Check deposit requirements (if 10+ rooms)
4. Calculate price with special day rates
5. Create booking in transaction
6. Update inventory for all nights
7. Return booking details
*/
```

**Get Quote (Before Booking)**:

```typescript
const quote = await getGroupBookingQuote({
  roomTypeId: 'room-type-id',
  startDate: new Date('2025-12-20'),
  endDate: new Date('2025-12-23'),
  roomsBoked: 15
})

/*
Returns:
{
  totalPrice: 45000,
  priceBreakdown: { ... },
  requiresDeposit: true,
  depositAmount: 9000,  // 20% of total
  depositPolicy: { minRooms: 10, maxRooms: 19, ... },
  isGroupBooking: true
}
*/
```

### 5. Validation Logic

**Comprehensive Validation** (`src/lib/group-booking-validation.ts`):

```typescript
const validation = await validateGroupBooking({
  userId: 'user-id',
  roomTypeId: 'room-type-id',
  startDate: new Date('2025-12-20'),
  endDate: new Date('2025-12-23'),
  roomsBooked: 15
})

/*
Checks:
✅ Dates are valid (end > start, not in past)
✅ Room type exists with sufficient capacity
✅ No blocked dates in range
✅ Sufficient inventory available for all nights
✅ Price calculation with special days
✅ Deposit requirements

Returns:
{
  success: true,
  data: {
    isGroupBooking: true,
    requiresDeposit: true,
    depositAmount: 9000,
    depositPolicy: { ... },
    totalPrice: 45000,
    priceCalculation: { ... }
  }
}
*/
```

---

## 🔐 Authorization

### SuperAdmin Only
- Create/Update/Delete Deposit Policies
- Configure deposit percentages and thresholds

### Admin/SuperAdmin
- Create/Update/Delete Special Days
- Set blocked dates
- Configure special rates

### Members
- Create group bookings
- **Must pay deposit** for group bookings (10+ rooms) before confirmation

---

## 📊 Usage Examples

### Example 1: Create Deposit Policy

```typescript
// SuperAdmin creates 20% deposit requirement for 10-19 rooms
const policy = await createDepositPolicy({
  minRooms: 10,
  maxRooms: 19,
  type: 'percent',
  value: 20.0,
  description: 'Small group booking deposit',
  active: true
})
```

### Example 2: Block Maintenance Days

```typescript
// Admin blocks property for maintenance
const maintenance = await createSpecialDay({
  date: new Date('2025-11-15'),
  roomTypeId: null,  // All room types
  ruleType: 'blocked',
  description: 'Annual maintenance - Property closed',
  active: true
})
```

### Example 3: Holiday Premium Pricing

```typescript
// Admin sets Christmas premium (50% increase)
const christmas = await createSpecialDay({
  date: new Date('2025-12-25'),
  roomTypeId: null,
  ruleType: 'special_rate',
  rateType: 'multiplier',
  rateValue: 1.5,
  description: 'Christmas - Premium Rates',
  active: true
})
```

### Example 4: Create Group Booking

```typescript
// Member books 15 rooms
const booking = await createGroupBooking({
  userId: 'user-123',
  roomTypeId: 'deluxe-room',
  startDate: new Date('2025-12-24'),
  endDate: new Date('2025-12-27'),
  roomsBooked: 15,
  isDepositPaid: false  // Will require deposit payment
})

/*
Response:
{
  success: false,  // Blocked because deposit not paid
  error: 'This is a group booking requiring a deposit of ₹9000. Please complete deposit payment first.',
  data: {
    requiresDeposit: true,
    depositAmount: 9000
  }
}
*/

// After deposit is paid via payment gateway
const confirmedBooking = await createGroupBooking({
  ...bookingData,
  isDepositPaid: true
})

// Mark deposit as paid later
await markDepositAsPaid('booking-id')
```

### Example 5: Room-Specific Special Rate

```typescript
// Deluxe Suite only - weekend premium
const weekendSuite = await createSpecialDay({
  date: new Date('2025-12-21'),
  roomTypeId: 'deluxe-suite-id',  // Only this room type
  ruleType: 'special_rate',
  rateType: 'multiplier',
  rateValue: 1.2,
  description: 'Weekend Premium - Deluxe Suite',
  active: true
})
```

---

## 🧪 Testing Scenarios

### Test 1: Deposit Requirement

```typescript
// Book 9 rooms - No deposit required
const booking9 = await createGroupBooking({
  roomsBooked: 9,
  // ...other params
})
// Success: No deposit required

// Book 10 rooms - Deposit required
const booking10 = await createGroupBooking({
  roomsBooked: 10,
  isDepositPaid: false,
  // ...other params
})
// Error: Deposit payment required
```

### Test 2: Blocked Date

```typescript
// Try to book blocked date
const blockedBooking = await createGroupBooking({
  startDate: new Date('2025-12-25'),  // Christmas - blocked
  endDate: new Date('2025-12-27'),
  // ...other params
})
// Error: "Booking not allowed: Christmas - Property closed (12/25/2025)"
```

### Test 3: Special Rate Calculation

```typescript
// Book during premium period
const premiumBooking = await getGroupBookingQuote({
  roomTypeId: 'standard-room',
  startDate: new Date('2025-12-30'),
  endDate: new Date('2026-01-02'),  // Includes New Year's Eve
  roomsBooked: 5
})

/*
Base: ₹2000/night × 3 nights × 5 rooms = ₹30,000
Dec 31: ₹2000 × 1.75 (multiplier) = ₹3,500/night
Adjusted: (₹2000 + ₹2000 + ₹3500) × 5 = ₹37,500
*/
```

---

## 🔄 Integration with Existing System

### Payment Integration (Day 10)

When deposit payment succeeds:

```typescript
// In Stripe webhook handler
if (booking.depositAmount && !booking.isDepositPaid) {
  await markDepositAsPaid(booking.id)
  // Upgrades status from PROVISIONAL to CONFIRMED
}
```

### Notifications (Day 11)

Send notifications when deposit is required:

```typescript
if (requiresDeposit && !isDepositPaid) {
  await sendNotification({
    type: 'deposit_required',
    amount: depositAmount,
    dueDate: addDays(new Date(), 7)
  })
}
```

---

## 📁 File Structure

```
src/
├── actions/
│   ├── deposit-policies/
│   │   └── index.ts              # Deposit policy CRUD
│   ├── special-days/
│   │   └── index.ts              # Special day CRUD
│   └── bookings/
│       └── group-booking.action.ts  # Group booking logic
├── lib/
│   ├── validation/
│   │   └── group-booking.validation.ts  # Zod schemas
│   ├── pricing.ts                # Price calculation
│   └── group-booking-validation.ts  # Validation logic
└── app/
    └── api/
        └── admin/
            ├── deposit-policies/
            │   ├── route.ts      # List & create
            │   └── [id]/
            │       └── route.ts  # Get, update, delete
            └── special-days/
                ├── route.ts
                └── [id]/
                    └── route.ts
```

---

## 🎯 Business Rules

### Deposit Requirements

- **Group threshold**: 10+ rooms
- **Configurable policies**: SuperAdmin can set multiple policies for different room ranges
- **No overlapping**: System prevents conflicting deposit policies
- **Type-based calculation**:
  - Percent: `(totalPrice × percentage) / 100`
  - Fixed: Fixed amount regardless of total price

### Special Day Rules

- **Priority**: Room-specific rules > Global rules
- **Unique constraint**: One rule per date per room type
- **Blocked dates**: Override all pricing, reject bookings
- **Special rates**: Applied per night, multiplied by rooms booked
- **Active flag**: Soft delete - set `active = false` to disable

### Price Calculation

- **Base price**: `roomType.pricePerNight × nights × roomsBooked`
- **Special day adjustment**: Applied to each affected night
- **Check-out date**: Exclusive (not charged)
- **Rounding**: All amounts in cents, rounded to nearest integer

---

## 🚀 Deployment Checklist

- [ ] Run migration: `pnpm prisma migrate dev`
- [ ] Seed database: `pnpm prisma db seed`
- [ ] Verify deposit policies created
- [ ] Verify special days created
- [ ] Test API endpoints with Postman/curl
- [ ] Test booking creation with deposits
- [ ] Test blocked date validation
- [ ] Test special rate calculation
- [ ] Add authentication middleware to API routes
- [ ] Configure RBAC for deposit policy management
- [ ] Set up monitoring for group bookings
- [ ] Document API for frontend team

---

## 🐛 Troubleshooting

### Issue: Deposit not required for 10+ rooms

**Check:**
1. Deposit policies are active: `SELECT * FROM deposit_policies WHERE active = true`
2. Policy covers the room range: `minRooms <= roomsBooked <= maxRooms`
3. No errors in `calculateDepositAmount` function logs

### Issue: Special day not applied

**Check:**
1. Special day is active: `active = true`
2. Date matches exactly (use date comparison, not datetime)
3. `roomTypeId` is null (global) or matches booking room type
4. No conflicting rules (room-specific overrides global)

### Issue: Blocked date allows booking

**Check:**
1. Special day `ruleType = 'blocked'`
2. Date range includes the blocked date
3. `checkBlockedDates` is called before booking creation
4. Special day is active

---

## 📝 API Response Examples

### Success Response

```json
{
  "success": true,
  "data": {
    "booking": {
      "id": "cm1abc123",
      "roomsBooked": 15,
      "depositAmount": 9000,
      "isDepositPaid": true,
      "totalPrice": 45000,
      "status": "CONFIRMED"
    },
    "requiresDeposit": true,
    "depositAmount": 9000
  }
}
```

### Error Response

```json
{
  "success": false,
  "error": "Booking not allowed: Christmas - Property closed (12/25/2025)",
  "data": {
    "isGroupBooking": true,
    "requiresDeposit": true,
    "totalPrice": 0,
    "blockedDates": [
      {
        "date": "2025-12-25",
        "description": "Christmas - Property closed",
        "ruleType": "blocked"
      }
    ]
  }
}
```

---

## 🎓 Next Steps

1. **Frontend Integration**: Build UI for deposit policy and special day management
2. **Analytics**: Track group booking trends and deposit collection rates
3. **Email Templates**: Notify users about deposit requirements and deadlines
4. **Refund Logic**: Handle deposit refunds for cancelled group bookings
5. **Bulk Operations**: Import/export special days for recurring events
6. **Calendar View**: Visual calendar showing blocked dates and special rates

---

**Implementation Status**: ✅ Complete  
**Version**: 1.0.0  
**Last Updated**: October 23, 2025
