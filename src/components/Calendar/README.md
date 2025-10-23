# 📅 BookingCalendar Component

A modern, reusable calendar component for hotel booking systems built with Next.js 14+, TypeScript, Tailwind CSS, and react-day-picker.

## ✨ Features

- **Date Range Selection**: Intuitive check-in to check-out date selection
- **Fully Responsive**: Adapts to mobile, tablet, and desktop screens
- **Customizable**: Extensive prop configuration for different use cases
- **Accessible**: WCAG compliant with keyboard navigation and screen reader support
- **Type-Safe**: Full TypeScript support with detailed prop types
- **Modern Styling**: Beautiful Tailwind CSS design with hover effects and animations
- **Disabled Dates**: Support for blocking unavailable dates (e.g., fully booked)
- **Date Validation**: Built-in min/max date constraints

## 📦 Installation

The required dependencies are already installed:

```bash
pnpm add react-day-picker date-fns
```

## 🚀 Quick Start

### Basic Usage

```tsx
import { useState } from "react";
import { BookingCalendar } from "@/components/Calendar";

export default function BookingPage() {
  const [dateRange, setDateRange] = useState<{
    from: Date;
    to: Date | null;
  }>({
    from: new Date(),
    to: null,
  });

  return (
    <BookingCalendar
      selectedRange={dateRange}
      onSelect={setDateRange}
    />
  );
}
```

## 📖 API Reference

### Props

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `selectedRange` | `{ from: Date; to: Date \| null }` | ✅ Yes | - | Currently selected date range |
| `onSelect` | `(range: { from: Date; to: Date \| null }) => void` | ✅ Yes | - | Callback when dates are selected |
| `minDate` | `Date` | ❌ No | `new Date()` | Minimum selectable date (prevents past dates) |
| `maxDate` | `Date` | ❌ No | `undefined` | Maximum selectable date |
| `disabledDates` | `Date[]` | ❌ No | `[]` | Array of dates to disable (e.g., booked dates) |
| `numberOfMonths` | `number` | ❌ No | `2` | Number of months to display (responsive) |

### Type Definitions

```typescript
export interface BookingCalendarProps {
  selectedRange: { from: Date; to: Date | null };
  onSelect: (range: { from: Date; to: Date | null }) => void;
  minDate?: Date;
  maxDate?: Date;
  disabledDates?: Date[];
  numberOfMonths?: number;
}
```

## 💡 Advanced Usage Examples

### 1. With API Integration (Fetch Unavailable Dates)

```tsx
import { useState, useEffect } from "react";
import { BookingCalendar } from "@/components/Calendar";

export default function RoomBooking({ roomId }: { roomId: string }) {
  const [dateRange, setDateRange] = useState<{
    from: Date;
    to: Date | null;
  }>({
    from: new Date(),
    to: null,
  });
  
  const [unavailableDates, setUnavailableDates] = useState<Date[]>([]);

  // Fetch booked dates from your API
  useEffect(() => {
    async function fetchAvailability() {
      const res = await fetch(`/api/rooms/${roomId}/availability`);
      const data = await res.json();
      
      // Convert ISO strings to Date objects
      const bookedDates = data.bookedDates.map((d: string) => new Date(d));
      setUnavailableDates(bookedDates);
    }
    
    fetchAvailability();
  }, [roomId]);

  return (
    <BookingCalendar
      selectedRange={dateRange}
      onSelect={setDateRange}
      disabledDates={unavailableDates}
      minDate={new Date()}
      maxDate={new Date(new Date().setFullYear(new Date().getFullYear() + 1))}
    />
  );
}
```

### 2. With Form Validation

```tsx
import { useState } from "react";
import { BookingCalendar } from "@/components/Calendar";

export default function ValidatedBookingForm() {
  const [dateRange, setDateRange] = useState<{
    from: Date;
    to: Date | null;
  }>({
    from: new Date(),
    to: null,
  });
  
  const [error, setError] = useState<string>("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (!dateRange.to) {
      setError("Please select both check-in and check-out dates");
      return;
    }
    
    const nights = Math.ceil(
      (dateRange.to.getTime() - dateRange.from.getTime()) / (1000 * 60 * 60 * 24)
    );
    
    if (nights < 1) {
      setError("Minimum stay is 1 night");
      return;
    }
    
    if (nights > 30) {
      setError("Maximum stay is 30 nights");
      return;
    }
    
    setError("");
    // Submit booking...
  };

  return (
    <form onSubmit={handleSubmit}>
      <BookingCalendar
        selectedRange={dateRange}
        onSelect={(range) => {
          setDateRange(range);
          setError(""); // Clear error on selection
        }}
      />
      
      {error && (
        <div className="mt-2 text-sm text-red-600">{error}</div>
      )}
      
      <button type="submit" className="mt-4 btn-primary">
        Book Now
      </button>
    </form>
  );
}
```

### 3. With Redux/Zustand State Management

```tsx
// With Redux
import { useDispatch, useSelector } from "react-redux";
import { setBookingDates } from "@/redux/slices/bookingSlice";
import { BookingCalendar } from "@/components/Calendar";

export default function ReduxBooking() {
  const dispatch = useDispatch();
  const dateRange = useSelector((state) => state.booking.dateRange);

  return (
    <BookingCalendar
      selectedRange={dateRange}
      onSelect={(range) => dispatch(setBookingDates(range))}
    />
  );
}

// With Zustand
import { useBookingStore } from "@/store/booking.store";
import { BookingCalendar } from "@/components/Calendar";

export default function ZustandBooking() {
  const { dateRange, setDateRange } = useBookingStore();

  return (
    <BookingCalendar
      selectedRange={dateRange}
      onSelect={setDateRange}
    />
  );
}
```

### 4. With URL Query Parameters (Shareable Links)

```tsx
import { useSearchParams, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { BookingCalendar } from "@/components/Calendar";

export default function ShareableBooking() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [dateRange, setDateRange] = useState<{
    from: Date;
    to: Date | null;
  }>({
    from: new Date(),
    to: null,
  });

  // Load dates from URL on mount
  useEffect(() => {
    const checkIn = searchParams.get("checkIn");
    const checkOut = searchParams.get("checkOut");
    
    if (checkIn && checkOut) {
      setDateRange({
        from: new Date(checkIn),
        to: new Date(checkOut),
      });
    }
  }, [searchParams]);

  // Update URL when dates change
  const handleDateSelect = (range: { from: Date; to: Date | null }) => {
    setDateRange(range);
    
    if (range.from && range.to) {
      const params = new URLSearchParams();
      params.set("checkIn", range.from.toISOString());
      params.set("checkOut", range.to.toISOString());
      router.push(`?${params.toString()}`);
    }
  };

  return (
    <BookingCalendar
      selectedRange={dateRange}
      onSelect={handleDateSelect}
    />
  );
}
```

## 🎨 Customization

### Custom Styling

The component uses Tailwind CSS classes that can be customized in `BookingCalendar.css`. Key customization points:

```css
/* Accent color (selected dates) */
.booking-calendar .rdp {
  --rdp-accent-color: #2563eb; /* Change to your brand color */
}

/* Hover effects */
.booking-calendar .rdp-day:hover {
  background-color: #dbeafe;
  transform: scale(1.05);
}

/* Mobile responsive sizing */
@media (max-width: 640px) {
  .booking-calendar .rdp {
    --rdp-cell-size: 36px;
  }
}
```

### Dark Mode Support

Add dark mode classes to your theme:

```tsx
<div className="dark"> {/* or use your theme provider */}
  <BookingCalendar
    selectedRange={dateRange}
    onSelect={setDateRange}
  />
</div>
```

## 🔧 Integration with Backend

### Example API Endpoint for Availability

```typescript
// app/api/rooms/[id]/availability/route.ts
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const roomId = params.id;

  // Fetch all bookings for this room
  const bookings = await prisma.booking.findMany({
    where: {
      roomId,
      status: { in: ["CONFIRMED", "CHECKED_IN"] },
    },
    select: {
      checkIn: true,
      checkOut: true,
    },
  });

  // Generate array of all booked dates
  const bookedDates: string[] = [];
  
  bookings.forEach((booking) => {
    const start = new Date(booking.checkIn);
    const end = new Date(booking.checkOut);
    
    // Add all dates between check-in and check-out
    for (let d = new Date(start); d < end; d.setDate(d.getDate() + 1)) {
      bookedDates.push(new Date(d).toISOString());
    }
  });

  return NextResponse.json({ bookedDates });
}
```

## 📱 Responsive Behavior

- **Desktop (> 640px)**: Shows 2 months side-by-side
- **Mobile (< 640px)**: Shows 1 month, stacked vertically
- Touch-friendly: Larger tap targets on mobile devices
- Swipe gestures: Natural navigation between months

## ♿ Accessibility Features

- ✅ Keyboard navigation (Arrow keys, Enter, Escape)
- ✅ Screen reader support with ARIA labels
- ✅ Focus indicators for keyboard users
- ✅ High contrast mode support
- ✅ Proper semantic HTML structure

## 🧪 Testing

```tsx
import { render, screen, fireEvent } from "@testing-library/react";
import BookingCalendar from "./BookingCalendar";

test("renders calendar and allows date selection", () => {
  const onSelect = jest.fn();
  const dateRange = { from: new Date(), to: null };

  render(
    <BookingCalendar
      selectedRange={dateRange}
      onSelect={onSelect}
    />
  );

  // Calendar should be rendered
  expect(screen.getByText(/Check-in:/i)).toBeInTheDocument();
  
  // Click a date
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  
  const dateButton = screen.getByText(tomorrow.getDate().toString());
  fireEvent.click(dateButton);
  
  expect(onSelect).toHaveBeenCalled();
});
```

## 📄 License

MIT

## 🤝 Contributing

Feel free to customize and extend this component for your specific needs!

## 📚 Related Documentation

- [react-day-picker docs](https://react-day-picker.js.org/)
- [date-fns docs](https://date-fns.org/)
- [Tailwind CSS docs](https://tailwindcss.com/)

## 🐛 Troubleshooting

### Issue: Styles not appearing correctly

**Solution**: Import the CSS file in your component or global styles:

```tsx
import "@/components/Calendar/BookingCalendar.css";
```

### Issue: Dates not updating in parent component

**Solution**: Ensure you're using controlled state:

```tsx
const [dateRange, setDateRange] = useState({ from: new Date(), to: null });
// Pass both selectedRange and onSelect
<BookingCalendar selectedRange={dateRange} onSelect={setDateRange} />
```

### Issue: TypeScript errors with Date types

**Solution**: Ensure date-fns is installed and use proper Date objects:

```tsx
const date = new Date("2025-10-22"); // ✅ Correct
const date = "2025-10-22"; // ❌ Wrong - use Date object
```
