# 🎨 Tailwind CSS Classes Reference - Enhanced Calendar

Quick reference for all Tailwind classes applied in Prompt 4 enhancements.

---

## 📦 Main Container

```tsx
// Wrapper
className="enhanced-booking-calendar-wrapper space-y-6 p-4 md:p-6 lg:p-8"
```

**Classes:**
- `space-y-6`: 24px vertical spacing between sections
- `p-4 md:p-6 lg:p-8`: Responsive padding (16px → 24px → 32px)

---

## 🗓️ Calendar Container

```tsx
// Outer container
className="booking-calendar overflow-hidden rounded-2xl border border-gray-200 
           bg-white shadow-xl transition-shadow duration-300 hover:shadow-2xl"

// Inner wrapper
className="bg-linear-to-br from-blue-50 via-white to-indigo-50 p-6 md:p-8"
```

**Key Classes:**
- `rounded-2xl`: Large border radius (16px)
- `shadow-xl`: Extra large shadow
- `hover:shadow-2xl`: Even larger shadow on hover
- `transition-shadow duration-300`: Smooth 300ms shadow transition
- `bg-linear-to-br`: Bottom-right diagonal gradient

---

## 📅 Day Cells

### Available Dates
```tsx
day: "h-10 w-10 rounded-lg p-0 font-medium text-gray-700 
      hover:bg-blue-50 hover:text-blue-700 
      hover:border hover:border-blue-300 hover:shadow-sm 
      transition-all duration-200 ease-in-out 
      cursor-pointer transform hover:scale-105"
```

**Hover Effects:**
- `hover:bg-blue-50`: Light blue background
- `hover:border hover:border-blue-300`: Blue border appears
- `hover:shadow-sm`: Small shadow
- `hover:scale-105`: Slightly larger (5% scale)
- `transition-all duration-200 ease-in-out`: Smooth transitions

### Selected Dates
```tsx
day_selected: "bg-linear-to-br from-blue-500 to-blue-700 
               text-white font-bold 
               hover:from-blue-600 hover:to-blue-800 
               shadow-md hover:shadow-lg border-0"
```

**Gradient:**
- `from-blue-500 to-blue-700`: Blue gradient
- `hover:from-blue-600 hover:to-blue-800`: Darker on hover
- `shadow-md hover:shadow-lg`: Shadow intensifies

### Range Middle
```tsx
day_range_middle: "aria-selected:bg-linear-to-r 
                   aria-selected:from-blue-100 
                   aria-selected:to-blue-200 
                   aria-selected:text-blue-900 
                   aria-selected:rounded-none 
                   aria-selected:font-semibold"
```

**Range Styling:**
- `bg-linear-to-r`: Left-to-right gradient
- `from-blue-100 to-blue-200`: Light blue gradient
- `rounded-none`: Square edges for middle dates

### Unavailable Dates (Fully Booked)
```tsx
fullyBooked: "bg-gray-200 text-gray-400 cursor-not-allowed 
              hover:bg-gray-200 hover:text-gray-400 
              hover:border-0 hover:shadow-none hover:scale-100"
```

**Disabled Styling:**
- `bg-gray-200`: Gray background
- `text-gray-400`: Muted gray text
- `cursor-not-allowed`: No-drop cursor icon
- `hover:scale-100`: No scale effect on hover

### Today
```tsx
day_today: "bg-gradient-to-br from-gray-100 to-gray-200 
            font-bold text-gray-900 
            border border-gray-300 shadow-sm"
```

---

## 🎯 Availability Indicators

### Dots (Pseudo-elements)
```tsx
// High availability (green)
highAvailability: "after:content-[''] 
                   after:absolute after:bottom-1 
                   after:left-1/2 after:-translate-x-1/2 
                   after:w-1.5 after:h-1.5 after:rounded-full 
                   after:bg-green-500 after:shadow-sm 
                   after:transition-transform after:duration-200 
                   hover:after:scale-150"

// Low availability (yellow)
lowAvailability: "after:bg-yellow-500"

// Fully booked (red)
fullyBooked: "after:bg-red-500"
```

**Dot Styling:**
- `after:bottom-1`: 4px from bottom
- `after:w-1.5 after:h-1.5`: 6px × 6px
- `after:rounded-full`: Perfect circle
- `hover:after:scale-150`: Grows 50% on hover

---

## 📍 Date Range Display

```tsx
// Container
className="rounded-xl border-2 border-blue-100 
           bg-linear-to-r from-blue-50 to-indigo-50 
           p-5 shadow-lg transition-all duration-300 
           hover:shadow-xl md:p-6"

// Icon container
className="rounded-lg bg-blue-100 p-2"

// Icon
className="h-5 w-5 text-blue-600"

// Label
className="block text-xs font-medium text-gray-600"

// Date badge
className="mt-0.5 block rounded-md bg-white 
           px-4 py-2 font-bold text-blue-700 
           shadow-sm ring-1 ring-blue-200"

// Nights counter
className="mt-4 flex items-center justify-center gap-2 
           rounded-lg bg-linear-to-r from-blue-600 to-indigo-600 
           px-4 py-2 text-white shadow-md"
```

---

## 🧭 Navigation Buttons

```tsx
nav_button: "inline-flex items-center justify-center 
             rounded-lg w-9 h-9 
             bg-white border border-gray-200 
             hover:bg-blue-50 hover:border-blue-300 
             active:bg-blue-100 
             transition-all duration-200 
             disabled:opacity-40 disabled:cursor-not-allowed 
             shadow-sm hover:shadow-md"
```

**States:**
- Default: White with gray border
- Hover: Blue tint, blue border, larger shadow
- Active: Darker blue background
- Disabled: 40% opacity, no-drop cursor

---

## 📖 Legend Section

```tsx
// Container
className="mt-6 overflow-hidden rounded-xl 
           border border-gray-200 
           bg-linear-to-br from-gray-50 to-white 
           p-5 shadow-md transition-shadow duration-300 
           hover:shadow-lg md:p-6"

// Section header
className="flex items-center gap-2 mb-4"

// Icon container
className="rounded-lg bg-blue-100 p-2"

// Availability cards
className="grid grid-cols-1 gap-3 sm:grid-cols-3"

// Individual card
className="flex items-center gap-3 
           rounded-lg bg-white p-3 
           shadow-sm ring-1 ring-gray-200 
           transition-all duration-200 
           hover:shadow-md hover:ring-green-300"
```

**Card Hover:**
- `hover:shadow-md`: Shadow increases
- `hover:ring-green-300`: Color-coded ring (changes per status)

---

## ⚠️ Error Banner

```tsx
className="mb-6 animate-in fade-in slide-in-from-top-2 duration-300 
           rounded-xl border-2 border-red-200 
           bg-linear-to-r from-red-50 to-red-100 
           p-5 shadow-lg"

// Icon container
className="rounded-full bg-red-200 p-2"

// Retry button
className="rounded-lg bg-red-600 px-4 py-2 
           text-sm font-semibold text-white 
           shadow-md transition-all duration-200 
           hover:bg-red-700 hover:shadow-lg 
           active:scale-95"
```

**Animations:**
- `animate-in fade-in`: Fade in animation
- `slide-in-from-top-2`: Slide from top (8px)
- `active:scale-95`: Shrinks 5% when clicked

---

## ⏳ Loading State

```tsx
// Loading banner
className="mb-4 animate-in fade-in slide-in-from-top-2 duration-300 
           rounded-xl bg-linear-to-r from-blue-50 to-indigo-50 
           p-4 shadow-md"

// Spinner
className="h-5 w-5 animate-spin text-blue-600"
```

---

## 💀 Loading Skeleton

```tsx
// Wrapper
className="space-y-6 p-4 md:p-6 lg:p-8"

// Date range skeleton
className="animate-pulse rounded-xl border-2 border-gray-200 
           bg-linear-to-r from-gray-100 to-gray-50 
           p-5 shadow-lg md:p-6"

// Calendar skeleton
className="animate-pulse overflow-hidden rounded-2xl 
           border border-gray-200 bg-white shadow-xl"

// Inner gradient
className="bg-linear-to-br from-gray-100 via-gray-50 to-gray-100 
           p-6 md:p-8"

// Skeleton elements
className="h-10 w-10 rounded-lg bg-gray-200 shadow-sm"
```

---

## 🎨 Gradient Reference

### Backgrounds
```css
bg-linear-to-r    /* Left to right */
bg-linear-to-br   /* Bottom-right diagonal */
```

### Common Combinations
```css
/* Calendar background */
from-blue-50 via-white to-indigo-50

/* Selected range */
from-blue-500 to-blue-700

/* Error state */
from-red-50 to-red-100

/* Loading skeleton */
from-gray-100 to-gray-50
```

---

## 📏 Spacing Scale

```css
gap-2   →  8px
gap-3   → 12px
gap-6   → 24px
gap-10  → 40px

p-2     →  8px padding
p-3     → 12px padding
p-4     → 16px padding
p-5     → 20px padding
p-6     → 24px padding
p-8     → 32px padding
```

---

## 🔲 Border Radius

```css
rounded-md   →  6px
rounded-lg   →  8px
rounded-xl   → 12px
rounded-2xl  → 16px
rounded-full → 9999px (circle)
```

---

## 🌑 Shadows

```css
shadow-sm  → Small shadow
shadow-md  → Medium shadow
shadow-lg  → Large shadow
shadow-xl  → Extra large shadow
shadow-2xl → 2X large shadow
```

---

## ⏱️ Transitions

```css
transition-all       → All properties
transition-shadow    → Shadow only
transition-transform → Transform only

duration-200 → 200ms
duration-300 → 300ms

ease-in-out → Smooth easing
```

---

## 🎯 Transform

```css
transform           → Enable transforms
scale-95            → 95% size
scale-105           → 105% size
hover:scale-105     → Scale on hover
```

---

## 🎨 Color Palette

### Blue Scale
```css
blue-50  → #eff6ff (lightest)
blue-100 → #dbeafe
blue-300 → #93c5fd
blue-500 → #3b82f6
blue-600 → #2563eb
blue-700 → #1d4ed8
blue-800 → #1e40af (darkest)
```

### Gray Scale
```css
gray-50  → #f9fafb
gray-100 → #f3f4f6
gray-200 → #e5e7eb
gray-300 → #d1d5db
gray-400 → #9ca3af
gray-600 → #4b5563
gray-700 → #374151
gray-800 → #1f2937
gray-900 → #111827
```

---

## 📱 Responsive Breakpoints

```css
/* Default (mobile) */
sm:  640px   → Tablet
md:  768px   → Small desktop
lg:  1024px  → Large desktop
```

**Usage:**
```css
p-4 md:p-6 lg:p-8
/* Mobile: 16px, Tablet: 24px, Desktop: 32px */
```

---

This reference covers all Tailwind classes used in the enhanced calendar design!
