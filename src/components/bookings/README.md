# BookingsTable Component

A beautiful, reusable, and feature-rich bookings table component with professional UI inspired by the Admin Dashboard's Recent Bookings interface.

## Features

✨ **Professional Design**
- Gradient backgrounds and animations
- Card-based layout with hover effects
- Status badges with icons
- Responsive grid layout (1/2/3 columns)

🔍 **Advanced Filtering**
- Real-time search (booking ID, room name, guest name)
- Status filter (All/Provisional/Confirmed/Cancelled)
- Payment status filter (All/Pending/Paid/Failed)
- Sort by date or price (ascending/descending)

🎨 **Visual Enhancements**
- Color-coded status badges
- Payment status indicators
- Check-in/check-out status display
- Empty state with call-to-action
- Loading spinner

⚡ **Actions**
- View booking details
- Record payment
- Check-in guest (optional)
- Check-out guest (optional)

## Installation

The component is already created at:
\`\`\`
src/components/bookings/BookingsTable.tsx
\`\`\`

## Usage

### Basic Example

\`\`\`tsx
import BookingsTable, { type BookingTableData } from '@/components/bookings/BookingsTable'

export default function MyBookingsPage() {
  const [bookings, setBookings] = useState<BookingTableData[]>([])
  const [loading, setLoading] = useState(true)

  return (
    <BookingsTable
      bookings={bookings}
      loading={loading}
      title="My Bookings"
      description="View and manage your reservations"
    />
  )
}
\`\`\`

### Full Example with Actions

\`\`\`tsx
import BookingsTable, { type BookingTableData } from '@/components/bookings/BookingsTable'
import { useRouter } from 'next/navigation'

export default function MyBookingsPage() {
  const router = useRouter()
  const [bookings, setBookings] = useState<BookingTableData[]>([])
  const [loading, setLoading] = useState(true)

  const handleViewDetails = (bookingId: string) => {
    router.push(\`/bookings/\${bookingId}\`)
  }

  const handleRecordPayment = (bookingId: string) => {
    router.push(\`/bookings/\${bookingId}/payment\`)
  }

  return (
    <BookingsTable
      bookings={bookings}
      loading={loading}
      onViewDetails={handleViewDetails}
      onRecordPayment={handleRecordPayment}
      showActions={true}
      showSearch={true}
      showFilters={true}
      title="My Bookings"
      description="View and manage your hotel reservations"
      emptyMessage="No bookings yet"
      emptyAction={{
        label: 'Browse Rooms',
        onClick: () => router.push('/rooms')
      }}
    />
  )
}
\`\`\`

## Props

### BookingsTableProps

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `bookings` | `BookingTableData[]` | **Required** | Array of booking data to display |
| `loading` | `boolean` | `false` | Show loading spinner |
| `onViewDetails` | `(bookingId: string) => void` | `undefined` | Callback when "View" is clicked |
| `onRecordPayment` | `(bookingId: string) => void` | `undefined` | Callback when "Pay" is clicked |
| `onCheckIn` | `(bookingId: string) => void` | `undefined` | Callback for check-in action |
| `onCheckOut` | `(bookingId: string) => void` | `undefined` | Callback for check-out action |
| `showActions` | `boolean` | `true` | Show action buttons |
| `showSearch` | `boolean` | `true` | Show search bar |
| `showFilters` | `boolean` | `true` | Show filter dropdowns |
| `title` | `string` | `'My Bookings'` | Page title |
| `description` | `string` | `'View and manage your hotel reservations'` | Page description |
| `emptyMessage` | `string` | `'No bookings found'` | Message when no bookings |
| `emptyAction` | `{ label: string, onClick: () => void }` | `undefined` | Call-to-action for empty state |

### BookingTableData Interface

\`\`\`typescript
interface BookingTableData {
  id: string                    // Booking database ID
  bookingId: string             // Booking reference number
  roomTypeName: string          // Room type (e.g., "Deluxe Suite")
  roomNumber?: string           // Room number (optional)
  userName: string              // Guest name
  userEmail?: string            // Guest email (optional)
  userPhone?: string            // Guest phone (optional)
  startDate: Date | string      // Check-in date
  endDate: Date | string        // Check-out date
  nights: number                // Number of nights
  totalPrice: number            // Total price in cents
  status: BookingStatus         // PROVISIONAL | CONFIRMED | CANCELLED
  paymentStatus?: PaymentStatus // PENDING | SUCCEEDED | FAILED | REFUNDED | CANCELLED
  createdAt: Date | string      // Booking creation date
  hasCheckedIn?: boolean        // Has guest checked in
  hasCheckedOut?: boolean       // Has guest checked out
  checkInTime?: Date | string | null    // Check-in timestamp
  checkOutTime?: Date | string | null   // Check-out timestamp
}
\`\`\`

## Customization

### Hide Search and Filters

\`\`\`tsx
<BookingsTable
  bookings={bookings}
  showSearch={false}
  showFilters={false}
/>
\`\`\`

### Hide Action Buttons

\`\`\`tsx
<BookingsTable
  bookings={bookings}
  showActions={false}
/>
\`\`\`

### Custom Empty State

\`\`\`tsx
<BookingsTable
  bookings={bookings}
  emptyMessage="You haven't made any reservations yet"
  emptyAction={{
    label: 'Book Your First Room',
    onClick: () => router.push('/rooms')
  }}
/>
\`\`\`

### Different Titles

\`\`\`tsx
<BookingsTable
  bookings={bookings}
  title="Reservation History"
  description="All your past and upcoming bookings"
/>
\`\`\`

## Data Transformation

If you're using the \`getUserBookings\` action, transform the data like this:

\`\`\`tsx
const transformedBookings: BookingTableData[] = bookings.map(booking => ({
  id: booking.id,
  bookingId: booking.bookingId || '',
  roomTypeName: booking.roomTypeName,
  userName: booking.userName,
  userEmail: user?.email,
  startDate: booking.startDate,
  endDate: booking.endDate,
  nights: booking.nights,
  totalPrice: booking.totalPrice,
  status: booking.status,
  paymentStatus: booking.paymentStatus,
  createdAt: booking.createdAt,
}))
\`\`\`

## Examples in Codebase

### User Bookings Page
\`\`\`
src/app/bookings/my-bookings/page.tsx
\`\`\`

### Admin Dashboard (Similar UI)
\`\`\`
src/app/admin/dashboard/page.tsx
\`\`\`

## Dependencies

- React Icons: `lucide-react`
- UI Components: `@/components/ui/*`
- Date Formatting: `date-fns`
- Currency Formatting: `@/lib/utils`
- Prisma Types: `@prisma/client`

## Notes

- **Currency**: The component expects `totalPrice` in **cents** (integer). It automatically divides by 100 for display.
- **Dates**: Accepts both `Date` objects and ISO date strings
- **Responsive**: Automatically adjusts to 1/2/3 columns based on screen size
- **Status Badges**: Color-coded with icons for quick visual identification
- **Payment Button**: Only shows when payment status is not 'SUCCEEDED'

## Future Enhancements

- [ ] Bulk actions (select multiple bookings)
- [ ] Export to CSV/PDF
- [ ] Date range filter
- [ ] Advanced sorting options
- [ ] Print booking confirmation
- [ ] Email booking details
- [ ] Booking modification/cancellation

## Screenshots

The component features:
- Beautiful gradient backgrounds
- Animated hover effects
- Professional card layout
- Status badges with icons
- Advanced search and filters
- Responsive design
- Empty state with CTA

---

**Created**: October 2025  
**Version**: 1.0.0  
**Status**: ✅ Production Ready
