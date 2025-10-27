# 🎨 BookingsTable Component - Visual Guide

## Component Overview

A professional, reusable bookings table component with modern UI/UX design.

---

## 🖼️ Visual Structure

```
┌─────────────────────────────────────────────────────────────┐
│  🏨 My Bookings                                              │
│  View and manage your hotel reservations                    │
├─────────────────────────────────────────────────────────────┤
│  ┌────────────────────────────────────────────────────────┐ │
│  │ 🔍 Search...  | [Status ▼] | [Payment ▼] | [↕ Sort] │ │
│  └────────────────────────────────────────────────────────┘ │
├─────────────────────────────────────────────────────────────┤
│  ┌──────────┐  ┌──────────┐  ┌──────────┐                  │
│  │ BOOKING  │  │ BOOKING  │  │ BOOKING  │                  │
│  │  CARD    │  │  CARD    │  │  CARD    │                  │
│  │          │  │          │  │          │                  │
│  └──────────┘  └──────────┘  └──────────┘                  │
│                                                             │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐                  │
│  │ BOOKING  │  │ BOOKING  │  │ BOOKING  │                  │
│  │  CARD    │  │  CARD    │  │  CARD    │                  │
│  │          │  │          │  │          │                  │
│  └──────────┘  └──────────┘  └──────────┘                  │
└─────────────────────────────────────────────────────────────┘
```

---

## 📋 Booking Card Layout

```
┌────────────────────────────────────────────┐
│ [Gradient Bar: Blue → Purple → Pink]      │
├────────────────────────────────────────────┤
│  🏨 Deluxe Suite          [CONFIRMED ✓]   │
│  #BK-2024-001                              │
├────────────────────────────────────────────┤
│  ┌──────────────────────────────────────┐ │
│  │ 👤 John Doe                          │ │
│  │ ✉ john@example.com                   │ │
│  └──────────────────────────────────────┘ │
├────────────────────────────────────────────┤
│  📅 Check-in      Oct 26, 2025            │
│  📅 Check-out     Oct 29, 2025            │
│  ⏰ Duration      3 nights                │
├────────────────────────────────────────────┤
│  ┌──────────────────────────────────────┐ │
│  │ Total Amount         $450.00         │ │
│  │                    [PAID ✓]          │ │
│  └──────────────────────────────────────┘ │
├────────────────────────────────────────────┤
│  [👁️ View]          [💳 Pay]              │
└────────────────────────────────────────────┘
```

---

## 🎨 Color Palette

### Background Gradients
```
Page Background:
- from-gray-50 via-blue-50/30 to-purple-50/20

Card Accent Bar:
- from-blue-500 via-purple-500 to-pink-500

Header Text:
- from-gray-900 via-blue-800 to-purple-800

Price Display:
- from-blue-600 to-purple-600
```

### Status Badge Colors

#### Booking Status
```
PROVISIONAL  → 🟡 Yellow gradient  (⏰ Clock icon)
CONFIRMED    → 🔵 Blue gradient    (✓ Check icon)
CANCELLED    → 🔴 Red gradient     (✗ X icon)
```

#### Payment Status
```
PENDING      → 🟡 Yellow-100/800   (⏰ Clock icon)
SUCCEEDED    → 🟢 Green-100/800    (✓ Check icon)
FAILED       → 🔴 Red-100/800      (✗ X icon)
REFUNDED     → 🟣 Purple-100/800   ($ Dollar icon)
CANCELLED    → ⚫ Gray-100/800     (✗ X icon)
```

### Button Styles
```
Primary (View):
- Border: gray-200
- Hover: shadow effect

Success (Pay):
- from-green-600 to-emerald-600
- hover: from-green-700 to-emerald-700

Empty State CTA:
- from-blue-600 to-purple-600
- hover: from-blue-700 to-purple-700
```

---

## ✨ Interactive States

### Card Hover Effect
```
Default:
- shadow-lg
- translate-y-0

Hover:
- shadow-2xl
- -translate-y-1
- duration-300
```

### Button Interactions
```
View Button:
- Icon scales on hover (group-hover/btn:scale-110)
- Smooth transition

Pay Button:
- Gradient shift
- Icon animation
```

---

## 📱 Responsive Layout

### Desktop (lg: 1024px+)
```
┌────────┬────────┬────────┐
│ Card 1 │ Card 2 │ Card 3 │
├────────┼────────┼────────┤
│ Card 4 │ Card 5 │ Card 6 │
└────────┴────────┴────────┘
```

### Tablet (md: 768px+)
```
┌────────┬────────┐
│ Card 1 │ Card 2 │
├────────┼────────┤
│ Card 3 │ Card 4 │
└────────┴────────┘
```

### Mobile (< 768px)
```
┌────────┐
│ Card 1 │
├────────┤
│ Card 2 │
├────────┤
│ Card 3 │
└────────┘
```

---

## 🔍 Search & Filter Bar

### Desktop Layout
```
┌──────────────────────────────────────────────────────────┐
│ [🔍 Search...                  ] [Status ▼] [Payment ▼] [↕] │
│                                                            │
│ 🔹 Showing 6 of 10 bookings          [Clear filters]     │
└──────────────────────────────────────────────────────────┘
```

### Mobile Layout
```
┌─────────────────────────────────┐
│ [🔍 Search...                 ] │
├─────────────────────────────────┤
│ [Status Filter ▼              ] │
├─────────────────────────────────┤
│ [Payment Filter ▼             ] │
├─────────────────────────────────┤
│ [↕ Sort                       ] │
└─────────────────────────────────┘
```

---

## 🎭 Empty States

### No Bookings
```
┌────────────────────────────────────┐
│                                    │
│          🏨                        │
│      (Hotel Icon)                  │
│                                    │
│    No bookings yet                 │
│                                    │
│  Start by making your first        │
│  reservation                       │
│                                    │
│  [✨ Browse Rooms]                 │
│                                    │
└────────────────────────────────────┘
```

### No Results (After Filter)
```
┌────────────────────────────────────┐
│                                    │
│          🏨                        │
│      (Hotel Icon)                  │
│                                    │
│    No bookings found               │
│                                    │
│  Try adjusting your filters or     │
│  search criteria                   │
│                                    │
│  [Clear filters]                   │
│                                    │
└────────────────────────────────────┘
```

---

## ⚡ Loading State

```
┌────────────────────────────────────┐
│                                    │
│                                    │
│           ◉◉                       │
│       (Spinning Rings)             │
│                                    │
│                                    │
│                                    │
└────────────────────────────────────┘
```

Dual-ring spinner:
- Outer ring: gray-200 (static)
- Inner ring: blue-500 (animated)

---

## 🏷️ Badge Components

### Status Badge with Icon
```
┌──────────────┐
│ ⏰ Provisional │  (Yellow gradient)
└──────────────┘

┌──────────────┐
│ ✓ Confirmed   │  (Blue gradient)
└──────────────┘

┌──────────────┐
│ ✗ Cancelled   │  (Red gradient)
└──────────────┘
```

### Payment Badge with Icon
```
┌──────────┐
│ ⏰ Pending │  (Yellow outline)
└──────────┘

┌──────────┐
│ ✓ Paid    │  (Green outline)
└──────────┘

┌──────────┐
│ ✗ Failed  │  (Red outline)
└──────────┘
```

---

## 📊 Information Display

### Guest Info Section (Gray Background)
```
┌────────────────────────────┐
│ 👤 John Doe                │
│ ✉ john@example.com         │
└────────────────────────────┘
```

### Date Info Section
```
📅 Check-in     Oct 26, 2025
📅 Check-out    Oct 29, 2025
─────────────────────────────
⏰ Duration     3 nights
```

### Price Section (Gradient Background)
```
┌────────────────────────────┐
│ Total Amount    $450.00    │
│            [PAID ✓]        │
└────────────────────────────┘
```

---

## 🎯 Action Buttons

### Layout Options

#### Both Actions Available
```
┌────────┬────────┐
│ 👁️ View │ 💳 Pay  │
└────────┴────────┘
```

#### Only View (Already Paid)
```
┌──────────────────┐
│ 👁️ View          │
└──────────────────┘
```

#### No Actions
```
(No button row)
```

---

## 📐 Spacing & Typography

### Card Spacing
```
Padding:         p-6 (24px)
Gap between:     gap-6 (24px)
Border radius:   rounded-lg (8px)
```

### Typography
```
Page Title:       text-4xl font-bold
Card Title:       text-lg font-bold
Booking ID:       text-sm font-mono
Section Labels:   text-sm text-gray-600
Values:           text-sm font-semibold
Price:            text-2xl font-bold
```

---

## 🌟 Special Features

### Gradient Text Effect
```css
bg-gradient-to-r from-gray-900 via-blue-800 to-purple-800
bg-clip-text text-transparent
```
Used for: Page titles, price displays

### Card Accent Bar
```css
h-2 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500
```
Top of each card for visual appeal

### Icon Styling
```
Size:           h-4 w-4 (most icons)
Guest section:  h-4 w-4, text-blue-600
Empty state:    h-12 w-12
```

---

## 🎪 Animation Timeline

### Page Load
```
0ms:    Header appears
100ms:  Search bar fades in
200ms:  First row of cards animates
300ms:  Second row of cards animates
```

### Card Hover (300ms)
```
Transform:  translate-y-0 → translate-y-(-4px)
Shadow:     shadow-lg → shadow-2xl
Icon:       scale-100 → scale-110
```

### Filter Change (Instant)
```
Cards fade out/in with filtered results
Results counter updates
```

---

## 💡 Best Practices Used

### Accessibility
- ✓ Semantic HTML
- ✓ Alt text on icons
- ✓ ARIA labels where needed
- ✓ Keyboard navigation support
- ✓ High contrast ratios

### Performance
- ✓ Lazy loading images (if added)
- ✓ Efficient filtering (client-side)
- ✓ Optimized re-renders
- ✓ CSS transitions over JS animations

### UX
- ✓ Clear visual hierarchy
- ✓ Consistent spacing
- ✓ Intuitive interactions
- ✓ Helpful empty states
- ✓ Loading feedback

### Code Quality
- ✓ TypeScript types
- ✓ Component composition
- ✓ Reusable patterns
- ✓ Clean prop interface

---

## 📝 Usage Tips

### Customize Title
```tsx
<BookingsTable
  title="Reservation History"
  description="All your past bookings"
/>
```

### Hide Filters
```tsx
<BookingsTable
  showSearch={false}
  showFilters={false}
/>
```

### Custom Empty Action
```tsx
<BookingsTable
  emptyAction={{
    label: "Book Now",
    onClick: () => router.push('/rooms')
  }}
/>
```

---

## 🔮 Future Visual Enhancements

- [ ] Skeleton loading states
- [ ] Card flip animation for details
- [ ] Timeline view option
- [ ] Calendar view
- [ ] Dark mode support
- [ ] Print stylesheet
- [ ] Download as PDF with custom design
- [ ] Booking status progress indicator
- [ ] Interactive date picker
- [ ] Drag-to-reorder (for admin)

---

**Component**: BookingsTable  
**Version**: 1.0.0  
**Design System**: Tailwind CSS + Custom Gradients  
**Inspiration**: Admin Dashboard Recent Bookings  
**Status**: ✅ Production Ready
