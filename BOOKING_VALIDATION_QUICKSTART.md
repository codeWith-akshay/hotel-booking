# Booking Rules Validation - Quick Start Guide

## 🚀 Quick Start

### 1. The validation is already integrated! 

When users create bookings, these checks happen automatically:

```typescript
// In: src/actions/bookings/bookings.action.ts
export async function createBookingAction(payload) {
  // ✅ Validation happens here automatically
  const validation = await validateBookingRules(
    payload.guestId,
    payload.roomId,
    startDate,
    endDate,
    roomsBooked
  )
  
  // ❌ Booking fails if validation errors exist
  if (!validation.isValid) {
    return {
      success: false,
      error: validation.errors.join(' '),
      validationErrors: validation.errors
    }
  }
  
  // ✅ Booking proceeds...
}
```

### 2. Seed Initial Rules (Required)

Run this once to set up default booking rules:

```typescript
// Add to: prisma/seed.ts

// Booking Rules (3-2-1 rule)
await prisma.bookingRules.createMany({
  data: [
    { guestType: 'REGULAR', maxDaysAdvance: 90, minDaysNotice: 3 },
    { guestType: 'VIP', maxDaysAdvance: 365, minDaysNotice: 2 },
    { guestType: 'CORPORATE', maxDaysAdvance: 180, minDaysNotice: 1 },
  ],
  skipDuplicates: true,
})

// Special Days (optional)
await prisma.specialDay.createMany({
  data: [
    {
      date: new Date('2024-12-25'),
      ruleType: 'blocked',
      description: 'Christmas - Closed',
      active: true,
    },
  ],
  skipDuplicates: true,
})
```

Then run:
```bash
npm run db:seed
```

### 3. Test It!

Try creating a booking:

**Test Case 1: Valid Booking**
```typescript
const result = await createBookingAction({
  guestId: 'user-123',
  roomId: 'room-456',
  checkInDate: '2024-11-10',  // 10 days from now
  checkOutDate: '2024-11-12',
  numberOfGuests: 2,
  numberOfAdults: 2,
  numberOfChildren: 0,
  roomsBooked: 1,
})

// Expected: Success ✅
```

**Test Case 2: Too Far in Advance (Regular User)**
```typescript
const result = await createBookingAction({
  guestId: 'regular-user',
  roomId: 'room-456',
  checkInDate: '2025-05-01',  // 150 days from now
  checkOutDate: '2025-05-03',
  numberOfGuests: 2,
  numberOfAdults: 2,
  numberOfChildren: 0,
  roomsBooked: 1,
})

// Expected: Error ❌
// "Booking too far in advance. REGULAR guests can book up to 90 days ahead."
```

**Test Case 3: Group Booking**
```typescript
const result = await createBookingAction({
  guestId: 'user-123',
  roomId: 'room-456',
  checkInDate: '2024-12-01',
  checkOutDate: '2024-12-04',
  numberOfGuests: 30,
  numberOfAdults: 30,
  numberOfChildren: 0,
  roomsBooked: 15,  // Group booking!
})

// Expected: Success with deposit requirement ✅
// Warning: "This is a group booking (15 rooms). A 30% deposit of $X is required."
```

**Test Case 4: Blocked Date**
```typescript
// First, create a blocked date
await prisma.specialDay.create({
  data: {
    date: new Date('2024-12-25'),
    ruleType: 'blocked',
    description: 'Christmas',
    active: true,
  },
})

// Then try to book
const result = await createBookingAction({
  guestId: 'user-123',
  roomId: 'room-456',
  checkInDate: '2024-12-24',
  checkOutDate: '2024-12-26',  // Includes Christmas
  numberOfGuests: 2,
  numberOfAdults: 2,
  numberOfChildren: 0,
  roomsBooked: 1,
})

// Expected: Error ❌
// "Bookings are not allowed on the following date(s): 12/25/2024."
```

---

## 📝 What Each Rule Does

### Rule 1: 3-2-1 Booking Rule
- **REGULAR** guests: Book 3-90 days in advance
- **VIP** guests: Book 2-365 days in advance  
- **CORPORATE** guests: Book 1-180 days in advance

**How users are classified:**
- Admins/SuperAdmins → VIP
- Users with `ircaMembershipId` → CORPORATE
- Everyone else → REGULAR

### Rule 2: Group Booking Deposits
- **Applies to:** 10-19 rooms
- **Deposit:** 30% of total booking cost
- **Booking status:** Stays PENDING until deposit paid

### Rule 3: Special Day Restrictions
- **Blocked days:** No bookings allowed (e.g., Christmas, maintenance)
- **Special rates:** Custom pricing (e.g., New Year's Eve 2× rate)

---

## 🎨 Frontend Integration

### Display Validation Errors

```tsx
// In your booking form component
const [errors, setErrors] = useState<string[]>([])

const handleSubmit = async () => {
  const result = await createBookingAction(formData)
  
  if (!result.success) {
    if (result.validationErrors) {
      setErrors(result.validationErrors)
      // Show errors to user
    }
  }
}

// In your JSX
{errors.length > 0 && (
  <div className="alert alert-error">
    {errors.map(error => (
      <p key={error}>{error}</p>
    ))}
  </div>
)}
```

### Show Group Booking Notice

```tsx
{formData.roomsBooked >= 10 && formData.roomsBooked <= 19 && (
  <div className="alert alert-warning">
    💰 Group booking: 30% deposit required
  </div>
)}
```

### Display Guest Type

```tsx
const guestType = userRole === 'ADMIN' ? 'VIP' 
  : user.ircaMembershipId ? 'CORPORATE' 
  : 'REGULAR'

<div className="badge">
  {guestType} Guest - Book {bookingWindow} days in advance
</div>
```

---

## 🔧 Admin Tools Needed

### 1. Manage Booking Rules
Create: `/admin/booking-rules`

Features:
- View current rules for each guest type
- Edit max days advance
- Edit min days notice
- See affected user count

### 2. Manage Special Days
Create: `/admin/special-days`

Features:
- Calendar view of special days
- Add blocked dates
- Set special rates
- Bulk import holidays

---

## 📊 Monitoring

### Log Validation Failures

```typescript
// Add to your analytics/logging
if (!validation.isValid) {
  logEvent('booking_validation_failed', {
    userId,
    guestType,
    errors: validation.errors,
    attemptedDate: startDate,
  })
}
```

### Track Deposit Bookings

```typescript
// Monitor group bookings requiring deposits
if (validation.requiresDeposit) {
  logEvent('group_booking_deposit_required', {
    userId,
    roomsBooked,
    depositAmount: validation.depositAmount,
  })
}
```

---

## ✅ Checklist

- [ ] Seed booking rules database
- [ ] Test validation with different user types
- [ ] Add validation error display to frontend
- [ ] Show group booking deposit notices
- [ ] Add special day indicators to calendar
- [ ] Create admin interface for rules management
- [ ] Create admin interface for special days
- [ ] Set up monitoring/logging
- [ ] Update user documentation
- [ ] Train support team on new rules

---

## 🆘 Troubleshooting

### Problem: "Booking rules not found"
**Solution:** Run seed script to create default rules
```bash
npm run db:seed
```

### Problem: "All bookings are rejected"
**Solution:** Check `BookingRules` table exists and has data
```sql
SELECT * FROM booking_rules;
```

### Problem: "Group booking not requiring deposit"
**Solution:** Ensure `roomsBooked` is passed correctly (10-19 rooms)

### Problem: "Special days not blocking bookings"
**Solution:** Check `active` field is `true` in `SpecialDay` table

---

## 📚 Additional Resources

- Full Documentation: `docs/BOOKING_RULES_VALIDATION.md`
- Implementation Summary: `BOOKING_VALIDATION_IMPLEMENTATION.md`
- Frontend Examples: `src/examples/booking-validation-frontend.tsx`
- Core Validator: `src/lib/validation/booking-rules-validator.ts`

---

## 🎯 Key Takeaways

1. **Validation happens automatically** when creating bookings
2. **Three rules are checked**: 3-2-1, group deposits, special days
3. **User-friendly errors** are returned for failed validations
4. **Warnings** are shown for non-blocking issues (like group deposits)
5. **Database-driven** rules can be updated without code changes

**The system is ready to use!** 🎉
