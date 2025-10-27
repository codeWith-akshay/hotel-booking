# Day 14: Member Dashboard - Implementation Guide

Complete implementation of the member dashboard for hotel booking system with advanced features including booking management, cancellation with refunds, waitlist functionality, and responsive UI.

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [State Management](#state-management)
3. [Validation Layer](#validation-layer)
4. [Server Actions](#server-actions)
5. [UI Components](#ui-components)
6. [Dashboard Page](#dashboard-page)
7. [API Endpoints](#api-endpoints)
8. [Usage Examples](#usage-examples)
9. [Troubleshooting](#troubleshooting)

---

## Architecture Overview

### Tech Stack
- **Next.js 14+**: App Router with Server Actions
- **TypeScript**: Type-safe development
- **Zustand v4**: State management with persist middleware
- **Zod v3**: Runtime validation
- **Tailwind CSS**: Responsive styling
- **Prisma ORM**: Database operations
- **date-fns**: Date formatting

### File Structure
```
src/
├── store/
│   └── sessionStore.ts              # Zustand state management
├── lib/
│   └── validation/
│       └── member.validation.ts     # Zod validation schemas
├── actions/
│   └── member/
│       └── bookings.ts              # Server actions
├── components/
│   └── dashboard/
│       ├── StatusBadge.tsx          # Status indicators
│       ├── BookingCard.tsx          # Booking display
│       ├── ConfirmModal.tsx         # Confirmation dialogs
│       └── Toast.tsx                # Notifications
├── app/
│   ├── dashboard/
│   │   └── member/
│   │       └── page.tsx             # Main dashboard
│   └── api/
│       └── member/
│           └── bookings/
│               ├── route.ts         # GET bookings
│               ├── cancel/
│               │   └── route.ts     # POST cancel
│               └── join-waitlist/
│                   └── route.ts     # POST waitlist
```

---

## State Management

### Zustand Session Store (`sessionStore.ts`)

**Purpose**: Centralized state for user session and booking data.

#### Type Definitions

```typescript
// Core types
interface User {
  id: string
  name: string
  email: string
  role: 'MEMBER' | 'ADMIN' | 'SUPERADMIN'
}

interface RoomType {
  id: string
  name: string
  description: string | null
  basePrice: number
  capacity: number
  amenities: string[]
}

interface Payment {
  id: string
  bookingId: string
  amount: number
  status: PaymentStatus
  method: PaymentMethod
  transactionId: string | null
  createdAt: Date
  updatedAt: Date
}

interface Booking {
  id: string
  userId: string
  roomTypeId: string
  checkIn: Date
  checkOut: Date
  numberOfRooms: number
  totalPrice: number
  depositAmount: number
  status: BookingStatus
  createdAt: Date
  updatedAt: Date
  roomType?: RoomType
  payments?: Payment[]
}
```

#### Filter Types

```typescript
type BookingFilter = 'all' | 'upcoming' | 'past' | 'cancelled' | 'waitlisted'
```

#### Store State

```typescript
interface SessionState {
  // User state
  user: User | null
  setUser: (user: User | null) => void
  clearUser: () => void

  // Booking state
  bookings: Booking[]
  setBookings: (bookings: Booking[]) => void
  addBooking: (booking: Booking) => void
  updateBooking: (id: string, updates: Partial<Booking>) => void
  removeBooking: (id: string) => void

  // Filtering
  currentFilter: BookingFilter
  setFilter: (filter: BookingFilter) => void
  getFilteredBookings: () => Booking[]
}
```

#### Helper Functions

**`getPaymentStatus(booking: Booking): 'paid' | 'partial' | 'pending'`**

Calculates aggregate payment status from all payments:
- `paid`: Total paid >= total price
- `partial`: Some payments made but < total price
- `pending`: No payments

```typescript
const status = getPaymentStatus(booking)
// Returns: 'paid' | 'partial' | 'pending'
```

**`canCancelBooking(booking: Booking): boolean`**

Checks if booking can be cancelled:
- Status must be CONFIRMED or PROVISIONAL
- Check-in date must be in the future

```typescript
if (canCancelBooking(booking)) {
  // Show cancel button
}
```

**`calculateNights(checkIn: Date, checkOut: Date): number`**

Calculates number of nights between dates:

```typescript
const nights = calculateNights(booking.checkIn, booking.checkOut)
// Returns: number of nights
```

#### Usage Example

```typescript
'use client'

import { useSessionStore } from '@/store/sessionStore'

function MyComponent() {
  const { 
    bookings, 
    setBookings, 
    currentFilter, 
    setFilter,
    getFilteredBookings 
  } = useSessionStore()

  // Load bookings
  useEffect(() => {
    fetchBookings().then(setBookings)
  }, [])

  // Get filtered bookings
  const filtered = getFilteredBookings()

  // Change filter
  const handleFilter = (filter: BookingFilter) => {
    setFilter(filter)
  }

  return (
    <div>
      <button onClick={() => handleFilter('upcoming')}>
        Upcoming
      </button>
      {filtered.map(booking => (
        <div key={booking.id}>{booking.id}</div>
      ))}
    </div>
  )
}
```

---

## Validation Layer

### Member Validation (`member.validation.ts`)

**Purpose**: Runtime validation with Zod for all member operations.

#### Request Schemas

**`FetchBookingsRequestSchema`**
```typescript
{
  userId: string
  filter?: 'all' | 'upcoming' | 'past' | 'cancelled' | 'waitlisted'
  limit?: number (min: 1, max: 100)
  offset?: number (min: 0)
}
```

**`CancelBookingRequestSchema`**
```typescript
{
  bookingId: string
  userId: string
  reason?: string
}
```

**`JoinWaitlistRequestSchema`**
```typescript
{
  userId: string
  roomTypeId: string
  checkIn: Date (ISO string)
  checkOut: Date (ISO string)
  numberOfRooms: number (min: 1)
}
```

#### Response Schemas

**`BookingResponseSchema`**
```typescript
{
  id: string
  userId: string
  roomTypeId: string
  checkIn: Date
  checkOut: Date
  numberOfRooms: number
  totalPrice: number
  depositAmount: number
  status: BookingStatus
  createdAt: Date
  updatedAt: Date
  roomType?: RoomTypeResponse
  payments?: PaymentResponse[]
}
```

**`CancelBookingResponseSchema`**
```typescript
// Success
{
  success: true
  message: string
  booking: BookingResponse
  refundAmount: number
  refundPercentage: number
}

// Error
{
  success: false
  error: 'BOOKING_NOT_FOUND' | 'NOT_AUTHORIZED' | 'CANNOT_CANCEL' | ...
  message: string
}
```

#### Validation Helpers

**`validateBookingOwnership(booking, userId): boolean`**

```typescript
const isOwner = validateBookingOwnership(booking, userId)
if (!isOwner) {
  throw new Error('Not authorized')
}
```

**`validateCancellationDeadline(checkIn): { allowed: boolean, message?: string }`**

Checks if cancellation is allowed based on check-in date:
- Returns `{ allowed: true }` if check-in is in future
- Returns `{ allowed: false, message: 'Cannot cancel past bookings' }` otherwise

```typescript
const validation = validateCancellationDeadline(booking.checkIn)
if (!validation.allowed) {
  return { success: false, error: validation.message }
}
```

**`calculateRefund(depositAmount, checkIn): { amount: number, percentage: number }`**

Calculates refund based on time until check-in:
- 100% refund: >7 days before
- 75% refund: 3-7 days before
- 50% refund: 1-3 days before
- 0% refund: <24 hours before

```typescript
const { amount, percentage } = calculateRefund(booking.depositAmount, booking.checkIn)
// { amount: 750, percentage: 75 }
```

---

## Server Actions

### Member Bookings Actions (`actions/member/bookings.ts`)

**Purpose**: Server-side business logic for booking operations.

#### `fetchMemberBookings`

Fetches bookings for a user with optional filtering.

**Signature:**
```typescript
async function fetchMemberBookings(input: FetchBookingsInput): Promise<FetchBookingsResponse>
```

**Input:**
```typescript
{
  userId: string
  filter?: 'all' | 'upcoming' | 'past' | 'cancelled' | 'waitlisted'
  limit?: number
  offset?: number
}
```

**Returns:**
```typescript
{
  success: true
  bookings: Booking[]
  total: number
} | {
  success: false
  error: string
  message: string
}
```

**Example:**
```typescript
const result = await fetchMemberBookings({
  userId: 'user_123',
  filter: 'upcoming',
  limit: 10,
  offset: 0
})

if (result.success) {
  console.log('Bookings:', result.bookings)
  console.log('Total:', result.total)
}
```

**Filter Logic:**
- `all`: All bookings
- `upcoming`: Status CONFIRMED/PROVISIONAL and checkIn >= today
- `past`: checkOut < today
- `cancelled`: Status CANCELLED
- `waitlisted`: No direct bookings (use separate waitlist query)

---

#### `cancelMemberBooking`

Cancels a booking with refund calculation and inventory restoration.

**Signature:**
```typescript
async function cancelMemberBooking(input: CancelBookingInput): Promise<CancelBookingResponse>
```

**Input:**
```typescript
{
  bookingId: string
  userId: string
  reason?: string
}
```

**Returns:**
```typescript
{
  success: true
  message: string
  booking: Booking
  refundAmount: number
  refundPercentage: number
} | {
  success: false
  error: 'BOOKING_NOT_FOUND' | 'NOT_AUTHORIZED' | 'CANNOT_CANCEL' | 'CANCELLATION_DEADLINE_PASSED'
  message: string
}
```

**Example:**
```typescript
const result = await cancelMemberBooking({
  bookingId: 'booking_123',
  userId: 'user_123',
  reason: 'Change of plans'
})

if (result.success) {
  console.log(`Refund: $${result.refundAmount} (${result.refundPercentage}%)`)
}
```

**Transaction Steps:**
1. Validate booking exists and user owns it
2. Check cancellation is allowed (status + deadline)
3. Calculate refund amount
4. Update booking status to CANCELLED
5. Create refund payment record
6. Restore room inventory (unlock dates)
7. Revalidate dashboard path

---

#### `joinMemberWaitlist`

Adds user to waitlist for unavailable dates.

**Signature:**
```typescript
async function joinMemberWaitlist(input: JoinWaitlistInput): Promise<JoinWaitlistResponse>
```

**Input:**
```typescript
{
  userId: string
  roomTypeId: string
  checkIn: Date
  checkOut: Date
  numberOfRooms: number
}
```

**Returns:**
```typescript
{
  success: true
  message: string
  waitlist: {
    id: string
    position: number
  }
} | {
  success: false
  error: 'ROOM_TYPE_NOT_FOUND' | 'ALREADY_ON_WAITLIST'
  message: string
}
```

**Example:**
```typescript
const result = await joinMemberWaitlist({
  userId: 'user_123',
  roomTypeId: 'room_456',
  checkIn: new Date('2025-06-01'),
  checkOut: new Date('2025-06-05'),
  numberOfRooms: 2
})

if (result.success) {
  console.log(`Position: ${result.waitlist.position}`)
}
```

---

#### `getMemberBooking`

Fetches a single booking by ID.

**Signature:**
```typescript
async function getMemberBooking(bookingId: string, userId: string): Promise<Booking | null>
```

**Example:**
```typescript
const booking = await getMemberBooking('booking_123', 'user_123')
if (booking) {
  console.log('Booking found:', booking)
}
```

---

## UI Components

### StatusBadge

**Purpose**: Display booking and payment status with color coding.

**Props:**
```typescript
interface StatusBadgeProps {
  status: BookingStatus | PaymentStatus
  className?: string
}

interface StatusBadgeWithIconProps extends StatusBadgeProps {
  showIcon?: boolean
}
```

**Usage:**
```typescript
import { StatusBadge, StatusBadgeWithIcon } from '@/components/dashboard/StatusBadge'

<StatusBadge status="CONFIRMED" />
<StatusBadgeWithIcon status="PAID" showIcon />
```

**Color Coding:**
- Green: CONFIRMED, PAID
- Yellow: PROVISIONAL, PARTIAL, PENDING (payment)
- Red: CANCELLED, FAILED, REFUNDED
- Gray: PENDING (booking)

---

### BookingCard

**Purpose**: Display booking details in a responsive card layout.

**Props:**
```typescript
interface BookingCardProps {
  booking: Booking
  onCancel: (id: string) => void
  onWaitlist: (booking: Booking) => void
  onViewInvoice: (id: string) => void
}
```

**Usage:**
```typescript
import { BookingCard, BookingCardSkeleton } from '@/components/dashboard/BookingCard'

// Loading state
{loading && <BookingCardSkeleton />}

// Loaded
{bookings.map(booking => (
  <BookingCard
    key={booking.id}
    booking={booking}
    onCancel={handleCancel}
    onWaitlist={handleWaitlist}
    onViewInvoice={handleInvoice}
  />
))}
```

**Features:**
- Responsive grid layout (mobile: 1 col, tablet: 2 cols, desktop: 3 cols)
- Conditional action buttons based on booking status
- Shows payment status badge
- Calculates and displays number of nights
- Cancel button (if cancellable)
- Invoice button (if paid)
- Join waitlist link (if cancelled)

---

### ConfirmModal

**Purpose**: Reusable confirmation dialog for critical actions.

**Props:**
```typescript
interface ConfirmModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void | Promise<void>
  title: string
  message: string
  confirmText?: string
  cancelText?: string
  variant?: 'danger' | 'warning' | 'info'
  loading?: boolean
}
```

**Usage:**
```typescript
import { ConfirmModal } from '@/components/dashboard/ConfirmModal'

const [showModal, setShowModal] = useState(false)
const [loading, setLoading] = useState(false)

<ConfirmModal
  isOpen={showModal}
  onClose={() => setShowModal(false)}
  onConfirm={async () => {
    setLoading(true)
    await handleCancel()
    setLoading(false)
    setShowModal(false)
  }}
  title="Cancel Booking"
  message="Are you sure you want to cancel this booking? You may receive a partial refund based on our cancellation policy."
  confirmText="Yes, Cancel"
  cancelText="Keep Booking"
  variant="danger"
  loading={loading}
/>
```

**Variants:**
- `danger`: Red confirm button (destructive actions)
- `warning`: Yellow confirm button (caution actions)
- `info`: Blue confirm button (informational actions)

---

### Toast Notification System

**Purpose**: Display temporary success/error/info messages.

**Hook API:**
```typescript
const toast = useToast()

toast.success('Booking cancelled successfully!')
toast.error('Failed to cancel booking')
toast.warning('Partial refund applied')
toast.info('Added to waitlist')

// Or use generic addToast
toast.addToast({
  id: Date.now().toString(),
  type: 'success',
  message: 'Custom message',
})
```

**Component Usage:**
```typescript
import { ToastContainer } from '@/components/dashboard/Toast'

export default function Layout({ children }) {
  return (
    <>
      {children}
      <ToastContainer />
    </>
  )
}
```

**Features:**
- Auto-dismiss after 5 seconds
- Manual close button
- Stacked display (bottom-right by default)
- Fade in/out animations
- Color-coded by type (green/red/yellow/blue)

---

## Dashboard Page

### Member Dashboard (`app/dashboard/member/page.tsx`)

**Purpose**: Main member dashboard with booking management.

**Features:**
1. **Filter Tabs**: Switch between all/upcoming/past/cancelled bookings
2. **Booking Grid**: Responsive card layout
3. **Cancel Modal**: Confirmation dialog with refund info
4. **Waitlist Modal**: Join waitlist for unavailable dates
5. **Toast Notifications**: Success/error feedback
6. **Loading Skeletons**: Better UX during data fetch
7. **Empty States**: User-friendly messages
8. **New Booking Button**: Quick access to booking flow

**Component Structure:**
```typescript
'use client'

export default function MemberDashboardPage() {
  // State
  const [loading, setLoading] = useState(true)
  const [cancelModalOpen, setCancelModalOpen] = useState(false)
  const [waitlistModalOpen, setWaitlistModalOpen] = useState(false)
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null)
  
  // Zustand store
  const { 
    user, 
    bookings, 
    setBookings, 
    currentFilter, 
    setFilter,
    getFilteredBookings,
    updateBooking 
  } = useSessionStore()
  
  // Toast
  const toast = useToast()
  
  // Load bookings on mount
  useEffect(() => {
    loadBookings()
  }, [user])
  
  // Handlers
  const handleCancel = async (id: string) => { /* ... */ }
  const handleWaitlist = (booking: Booking) => { /* ... */ }
  const handleJoinWaitlist = async () => { /* ... */ }
  
  return (
    <div>
      {/* Header */}
      {/* Filter tabs */}
      {/* Booking grid */}
      {/* Modals */}
      <ToastContainer />
    </div>
  )
}
```

**User Flow:**
1. User lands on dashboard
2. Bookings load and display in grid
3. User clicks filter tab (upcoming/past/etc)
4. Grid updates to show filtered bookings
5. User clicks "Cancel" on a booking
6. Confirmation modal appears with refund info
7. User confirms cancellation
8. Server action executes
9. Toast notification shows success/error
10. Bookings reload with updated status

---

## API Endpoints

### REST API for External Clients

**Base URL:** `/api/member/bookings`

#### GET `/api/member/bookings`

Fetch bookings with optional filtering.

**Query Parameters:**
```typescript
{
  userId: string (required)
  filter?: 'all' | 'upcoming' | 'past' | 'cancelled' | 'waitlisted'
  limit?: number (1-100, default: 10)
  offset?: number (min: 0, default: 0)
}
```

**Response (200):**
```json
{
  "success": true,
  "bookings": [...],
  "total": 42
}
```

**Error Responses:**
- 400: Validation error
- 401: Unauthorized (missing userId)
- 500: Internal error

**Example:**
```bash
curl "http://localhost:3000/api/member/bookings?userId=user_123&filter=upcoming&limit=10"
```

---

#### POST `/api/member/bookings/cancel`

Cancel a booking with refund.

**Body:**
```json
{
  "bookingId": "booking_123",
  "userId": "user_123",
  "reason": "Change of plans"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Booking cancelled successfully",
  "booking": {...},
  "refundAmount": 750,
  "refundPercentage": 75
}
```

**Error Responses:**
- 400: Validation error or cannot cancel
- 403: Not authorized
- 404: Booking not found
- 500: Internal error

**Example:**
```bash
curl -X POST http://localhost:3000/api/member/bookings/cancel \
  -H "Content-Type: application/json" \
  -d '{"bookingId":"booking_123","userId":"user_123"}'
```

---

#### POST `/api/member/bookings/join-waitlist`

Join waitlist for unavailable dates.

**Body:**
```json
{
  "userId": "user_123",
  "roomTypeId": "room_456",
  "checkIn": "2025-06-01T00:00:00.000Z",
  "checkOut": "2025-06-05T00:00:00.000Z",
  "numberOfRooms": 2
}
```

**Response (201):**
```json
{
  "success": true,
  "message": "Added to waitlist successfully",
  "waitlist": {
    "id": "waitlist_789",
    "position": 3
  }
}
```

**Error Responses:**
- 400: Validation error
- 404: Room type not found
- 409: Already on waitlist
- 500: Internal error

**Example:**
```bash
curl -X POST http://localhost:3000/api/member/bookings/join-waitlist \
  -H "Content-Type: application/json" \
  -d '{"userId":"user_123","roomTypeId":"room_456","checkIn":"2025-06-01","checkOut":"2025-06-05","numberOfRooms":2}'
```

---

## Usage Examples

### Complete Integration Example

```typescript
'use client'

import { useEffect, useState } from 'react'
import { useSessionStore } from '@/store/sessionStore'
import { fetchMemberBookings, cancelMemberBooking } from '@/actions/member/bookings'
import { BookingCard, BookingCardSkeleton } from '@/components/dashboard/BookingCard'
import { ConfirmModal } from '@/components/dashboard/ConfirmModal'
import { ToastContainer, useToast } from '@/components/dashboard/Toast'

export default function BookingsPage() {
  const [loading, setLoading] = useState(true)
  const [cancelModalOpen, setCancelModalOpen] = useState(false)
  const [selectedBookingId, setSelectedBookingId] = useState<string | null>(null)
  const [cancelling, setCancelling] = useState(false)
  
  const { 
    user, 
    bookings, 
    setBookings, 
    currentFilter, 
    setFilter,
    getFilteredBookings,
    updateBooking 
  } = useSessionStore()
  
  const toast = useToast()
  
  // Load bookings
  useEffect(() => {
    if (!user) return
    
    const loadData = async () => {
      setLoading(true)
      const result = await fetchMemberBookings({
        userId: user.id,
        filter: currentFilter,
        limit: 50,
      })
      
      if (result.success) {
        setBookings(result.bookings)
      } else {
        toast.error('Failed to load bookings')
      }
      
      setLoading(false)
    }
    
    loadData()
  }, [user, currentFilter])
  
  // Handle cancel
  const handleCancelClick = (id: string) => {
    setSelectedBookingId(id)
    setCancelModalOpen(true)
  }
  
  const handleCancelConfirm = async () => {
    if (!selectedBookingId || !user) return
    
    setCancelling(true)
    
    const result = await cancelMemberBooking({
      bookingId: selectedBookingId,
      userId: user.id,
    })
    
    if (result.success) {
      updateBooking(selectedBookingId, { status: 'CANCELLED' })
      toast.success(
        `Booking cancelled. Refund: $${result.refundAmount} (${result.refundPercentage}%)`
      )
      setCancelModalOpen(false)
    } else {
      toast.error(result.message)
    }
    
    setCancelling(false)
  }
  
  // Filtered bookings
  const filteredBookings = getFilteredBookings()
  
  return (
    <div className="container mx-auto px-4 py-8">
      {/* Filter tabs */}
      <div className="flex gap-2 mb-6">
        {['all', 'upcoming', 'past', 'cancelled'].map((filter) => (
          <button
            key={filter}
            onClick={() => setFilter(filter as any)}
            className={`px-4 py-2 rounded-lg ${
              currentFilter === filter
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-700'
            }`}
          >
            {filter.charAt(0).toUpperCase() + filter.slice(1)}
          </button>
        ))}
      </div>
      
      {/* Bookings grid */}
      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <BookingCardSkeleton key={i} />
          ))}
        </div>
      ) : filteredBookings.length === 0 ? (
        <p className="text-gray-500 text-center py-8">
          No bookings found for this filter.
        </p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredBookings.map((booking) => (
            <BookingCard
              key={booking.id}
              booking={booking}
              onCancel={handleCancelClick}
              onWaitlist={() => {}}
              onViewInvoice={(id) => console.log('View invoice:', id)}
            />
          ))}
        </div>
      )}
      
      {/* Cancel confirmation modal */}
      <ConfirmModal
        isOpen={cancelModalOpen}
        onClose={() => setCancelModalOpen(false)}
        onConfirm={handleCancelConfirm}
        title="Cancel Booking"
        message="Are you sure you want to cancel this booking? Refund amount depends on cancellation timing."
        confirmText="Yes, Cancel"
        cancelText="Keep Booking"
        variant="danger"
        loading={cancelling}
      />
      
      {/* Toast notifications */}
      <ToastContainer />
    </div>
  )
}
```

---

## Troubleshooting

### Common Issues

#### 1. Bookings not loading

**Symptom:** Dashboard shows loading skeleton indefinitely

**Solutions:**
- Check user is authenticated: `const { user } = useSessionStore()`
- Verify Prisma schema has Booking model
- Check console for errors
- Ensure database has bookings for user

```typescript
// Debug
useEffect(() => {
  console.log('User:', user)
  if (user) {
    fetchMemberBookings({ userId: user.id }).then(console.log)
  }
}, [user])
```

---

#### 2. Cancel button not working

**Symptom:** Cancel button doesn't appear or does nothing

**Solutions:**
- Check booking status: Only CONFIRMED/PROVISIONAL can be cancelled
- Verify check-in date is in future
- Check `canCancelBooking()` helper

```typescript
import { canCancelBooking } from '@/store/sessionStore'

if (!canCancelBooking(booking)) {
  console.log('Cannot cancel:', booking.status, booking.checkIn)
}
```

---

#### 3. Refund calculation incorrect

**Symptom:** Refund amount doesn't match expected percentage

**Solution:** Check `calculateRefund()` logic

```typescript
import { calculateRefund } from '@/lib/validation/member.validation'

const { amount, percentage } = calculateRefund(
  booking.depositAmount,
  booking.checkIn
)

console.log('Days until check-in:', differenceInDays(booking.checkIn, new Date()))
console.log('Refund:', amount, `(${percentage}%)`)
```

**Refund Rules:**
- >7 days: 100%
- 3-7 days: 75%
- 1-3 days: 50%
- <24 hours: 0%

---

#### 4. Inventory not restored after cancellation

**Symptom:** Room still shows as booked after cancellation

**Solution:** Check transaction in `cancelMemberBooking`

```typescript
// Verify inventory locks are deleted
await prisma.inventoryLock.deleteMany({
  where: {
    bookingId: booking.id,
  },
})

// Check InventoryLock table
const locks = await prisma.inventoryLock.findMany({
  where: { bookingId: booking.id },
})
console.log('Remaining locks:', locks) // Should be []
```

---

#### 5. Filters not working

**Symptom:** Changing filter doesn't update bookings

**Solution:** Check filter logic in Zustand store

```typescript
// Debug filter
const filtered = useSessionStore(state => state.getFilteredBookings())
console.log('Current filter:', useSessionStore.getState().currentFilter)
console.log('All bookings:', useSessionStore.getState().bookings)
console.log('Filtered bookings:', filtered)
```

**Filter Logic:**
- `upcoming`: checkIn >= today AND status IN (CONFIRMED, PROVISIONAL)
- `past`: checkOut < today
- `cancelled`: status === CANCELLED

---

#### 6. TypeScript errors

**Common errors:**

```typescript
// Error: Type 'Date | string' is not assignable to type 'Date'
// Solution: Parse dates from API
const booking = {
  ...data,
  checkIn: new Date(data.checkIn),
  checkOut: new Date(data.checkOut),
}

// Error: Property 'payments' does not exist
// Solution: Include payments in Prisma query
const booking = await prisma.booking.findUnique({
  where: { id },
  include: {
    payments: true,
    roomType: true,
  },
})
```

---

#### 7. Payment status not updating

**Symptom:** Payment badge shows wrong status

**Solution:** Use `getPaymentStatus()` helper

```typescript
import { getPaymentStatus } from '@/store/sessionStore'

const paymentStatus = getPaymentStatus(booking)
console.log('Payment status:', paymentStatus)
console.log('Total paid:', booking.payments?.reduce((sum, p) => sum + p.amount, 0))
console.log('Total price:', booking.totalPrice)
```

---

### Performance Optimization

#### 1. Limit bookings query

```typescript
// Fetch only necessary bookings
const result = await fetchMemberBookings({
  userId: user.id,
  filter: 'upcoming', // Don't load all bookings
  limit: 20, // Paginate
  offset: page * 20,
})
```

#### 2. Memoize filtered bookings

```typescript
import { useMemo } from 'react'

const filteredBookings = useMemo(
  () => getFilteredBookings(),
  [bookings, currentFilter]
)
```

#### 3. Debounce search/filters

```typescript
import { useDebounce } from '@/hooks/useDebounce'

const [search, setSearch] = useState('')
const debouncedSearch = useDebounce(search, 300)

useEffect(() => {
  // Fetch with debouncedSearch
}, [debouncedSearch])
```

---

### Security Considerations

1. **Always validate user ownership**
   ```typescript
   if (booking.userId !== user.id) {
     return { success: false, error: 'NOT_AUTHORIZED' }
   }
   ```

2. **Use server actions, not client-side API calls**
   ```typescript
   // ❌ Bad: Exposes userId
   fetch(`/api/bookings?userId=${user.id}`)
   
   // ✅ Good: Server-side validation
   await fetchMemberBookings({ userId: user.id })
   ```

3. **Validate dates on server**
   ```typescript
   // Don't trust client-side dates
   const checkIn = new Date(input.checkIn)
   if (isNaN(checkIn.getTime())) {
     return { success: false, error: 'INVALID_DATE' }
   }
   ```

---

## Advanced Customization

### Custom Refund Logic

Override `calculateRefund` in validation:

```typescript
export function calculateRefund(
  depositAmount: number,
  checkIn: Date
): { amount: number; percentage: number } {
  const daysUntilCheckIn = differenceInDays(checkIn, new Date())
  
  // Custom logic: VIP members get 100% refund always
  if (isVIPMember()) {
    return { amount: depositAmount, percentage: 100 }
  }
  
  // Custom tiered refunds
  if (daysUntilCheckIn >= 14) return { amount: depositAmount, percentage: 100 }
  if (daysUntilCheckIn >= 7) return { amount: depositAmount * 0.8, percentage: 80 }
  if (daysUntilCheckIn >= 3) return { amount: depositAmount * 0.6, percentage: 60 }
  if (daysUntilCheckIn >= 1) return { amount: depositAmount * 0.3, percentage: 30 }
  
  return { amount: 0, percentage: 0 }
}
```

### Custom Status Colors

Override StatusBadge colors:

```typescript
const getStatusColor = (status: BookingStatus | PaymentStatus) => {
  const colors = {
    // Booking statuses
    CONFIRMED: 'bg-green-100 text-green-800',
    PROVISIONAL: 'bg-yellow-100 text-yellow-800',
    CANCELLED: 'bg-red-100 text-red-800',
    PENDING: 'bg-gray-100 text-gray-800',
    
    // Payment statuses
    PAID: 'bg-green-100 text-green-800',
    PARTIAL: 'bg-blue-100 text-blue-800', // Custom color
    FAILED: 'bg-red-100 text-red-800',
    REFUNDED: 'bg-purple-100 text-purple-800', // Custom color
  }
  
  return colors[status] || 'bg-gray-100 text-gray-800'
}
```

### Add Email Notifications

Extend `cancelMemberBooking`:

```typescript
// In server action
const result = await cancelMemberBooking(input)

if (result.success) {
  // Send email
  await sendCancellationEmail({
    to: user.email,
    bookingId: result.booking.id,
    refundAmount: result.refundAmount,
  })
}
```

---

## Testing Checklist

### Unit Tests

- [ ] `getPaymentStatus` returns correct status for various payment combinations
- [ ] `canCancelBooking` validates status and date correctly
- [ ] `calculateNights` returns correct number of nights
- [ ] `calculateRefund` returns correct refund percentages
- [ ] `validateCancellationDeadline` checks dates properly
- [ ] Zustand store actions update state correctly

### Integration Tests

- [ ] `fetchMemberBookings` returns filtered bookings
- [ ] `cancelMemberBooking` updates booking and creates refund
- [ ] `joinMemberWaitlist` creates waitlist entry with correct position
- [ ] API routes validate inputs and return proper status codes
- [ ] Inventory locks are restored after cancellation
- [ ] Refund payments are created with correct amounts

### E2E Tests

- [ ] User can view their bookings
- [ ] User can filter bookings (all/upcoming/past/cancelled)
- [ ] User can cancel a booking and see refund amount
- [ ] User cannot cancel past or already cancelled bookings
- [ ] User can join waitlist for unavailable dates
- [ ] User sees toast notifications for actions
- [ ] User can download invoice (if implemented)
- [ ] Loading skeletons appear during data fetch
- [ ] Empty states show when no bookings match filter

---

## Summary

Day 14 Member Dashboard provides a complete booking management system with:

✅ **State Management**: Zustand store with persist middleware
✅ **Validation**: 15 Zod schemas for type-safe operations
✅ **Server Actions**: Fetch, cancel, waitlist operations
✅ **UI Components**: Status badges, booking cards, modals, toasts
✅ **Responsive Design**: Mobile-first Tailwind CSS
✅ **Refund System**: Time-based refund calculation
✅ **Inventory Management**: Transaction-safe cancellation with lock restoration
✅ **API Endpoints**: REST API for external clients
✅ **Advanced Features**: Filters, loading states, empty states, notifications

**Next Steps:**
- Implement invoice download feature
- Add email notifications for cancellations
- Create admin dashboard to manage refunds
- Add unit and E2E tests
- Implement pagination for large booking lists
