# Room Inventory Management UI

Complete documentation for the Room Inventory Management interface at `/admin/inventory`.

## Table of Contents
- [Overview](#overview)
- [Architecture](#architecture)
- [Components](#components)
- [Features](#features)
- [Usage Examples](#usage-examples)
- [Testing Checklist](#testing-checklist)
- [Troubleshooting](#troubleshooting)

## Overview

The Room Inventory Management UI provides a comprehensive interface for hotel administrators to:
- View and manage room availability across dates
- Perform inline editing of availability numbers
- Create bulk inventory records for date ranges
- Navigate through dates with pagination
- View data in responsive table (desktop) or card (mobile) layouts

### Technology Stack
- **Framework**: Next.js 15+ (App Router)
- **UI Library**: Custom components inspired by ShadCN
- **Styling**: Tailwind CSS
- **Validation**: Zod schemas
- **Backend**: Server actions with Prisma ORM

## Architecture

### File Structure
```
src/
├── app/(admin)/inventory/
│   └── page.tsx                        # Main inventory page
├── components/
│   ├── ui/
│   │   └── select.tsx                  # Dropdown component
│   ├── dashboard/
│   │   ├── InventoryTable.tsx          # Desktop table view
│   │   └── InventoryCards.tsx          # Mobile card view
│   └── forms/
│       └── BulkInventoryForm.tsx       # Bulk creation modal
└── actions/rooms/
    └── room-inventory.action.ts        # Server actions
```

### Component Hierarchy
```
AdminInventoryPage
├── Select (Room Type Dropdown)
├── InventoryTable (Desktop)
│   └── Inline Edit Form
├── InventoryCards (Mobile)
│   └── Inline Edit Form
└── BulkInventoryForm (Modal)
```

### Data Flow
1. **Initial Load**: Fetch room types → populate dropdown
2. **Room Selection**: User selects room type → fetch inventory
3. **Pagination**: User clicks next/prev → update date range → refetch
4. **Inline Edit**: User edits value → save → toast → refetch
5. **Bulk Create**: User opens modal → fills form → submit → toast → refetch

## Components

### 1. Select Component (`src/components/ui/select.tsx`)

**Purpose**: Reusable dropdown for room type selection.

**Props**:
```typescript
interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  options: Array<{ value: string; label: string }>
  error?: string
}
```

**Features**:
- Optional label
- Error state styling (red border + message)
- Focus ring for accessibility
- Disabled state
- Full keyboard navigation

**Usage**:
```typescript
<Select
  label="Select Room Type"
  options={[
    { value: '', label: '-- Select --' },
    { value: 'deluxe', label: 'Deluxe (25 rooms)' },
  ]}
  value={selected}
  onChange={(e) => setSelected(e.target.value)}
/>
```

---

### 2. InventoryTable Component (`src/components/dashboard/InventoryTable.tsx`)

**Purpose**: Desktop table view with inline editing.

**Props**:
```typescript
interface InventoryTableProps {
  inventory: RoomInventory[]
  roomTypeId: string
  totalRooms: number
  onUpdate: () => void
  onShowToast: (message: string, type: 'success' | 'error') => void
}
```

**Features**:

1. **Inline Editing**:
   - Click "Edit" button → input field appears
   - Save/Cancel buttons replace edit button
   - Enter key saves, Escape key cancels

2. **Validation**:
   - Prevents negative values
   - Enforces maximum of `totalRooms`
   - Shows error in toast on invalid input

3. **Past Date Handling**:
   - Past dates grayed out
   - Edit button disabled
   - Visual indication (muted text)

4. **Occupancy Display**:
   - Progress bar showing occupancy percentage
   - Color-coded by occupancy level:
     * Red: 90%+ occupancy
     * Orange: 70-89% occupancy
     * Yellow: 50-69% occupancy
     * Green: <50% occupancy

5. **Columns**:
   - **Date**: Full formatted date (e.g., "Thu, Oct 25, 2025")
   - **Day**: Badge showing weekday (Mon, Tue, etc.)
   - **Available**: Editable availability count
   - **Occupancy**: Visual progress + percentage
   - **Actions**: Edit/Save/Cancel buttons

**Usage**:
```typescript
<InventoryTable
  inventory={inventoryData}
  roomTypeId="deluxe-room-id"
  totalRooms={25}
  onUpdate={() => refetchData()}
  onShowToast={(msg, type) => setToast({ message: msg, type })}
/>
```

---

### 3. InventoryCards Component (`src/components/dashboard/InventoryCards.tsx`)

**Purpose**: Mobile-responsive card layout.

**Props**: Same as `InventoryTable`

**Features**:
- Card-based layout (one card per date)
- Large text for readability on mobile
- Colored occupancy badge
- Full-width edit button
- Same validation and editing logic as table
- Stacked vertically for easy scrolling

**Card Layout**:
```
┌────────────────────────────────────┐
│ Thu, Oct 25, 2025      [80% Full] │
│                                    │
│ 20 / 25 rooms available           │
│ [▓▓▓▓▓▓▓▓░░] 80%                   │
│                                    │
│ [Edit]                             │
└────────────────────────────────────┘
```

**Usage**: Same as `InventoryTable`

---

### 4. BulkInventoryForm Component (`src/components/forms/BulkInventoryForm.tsx`)

**Purpose**: Modal form for creating inventory across date ranges.

**Props**:
```typescript
interface BulkInventoryFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
  roomTypeId: string
  roomTypeName: string
  totalRooms: number
}
```

**Form Fields**:

1. **Start Date** (required):
   - Type: date input
   - Default: Tomorrow
   - Min: Today
   - Validation: Required

2. **End Date** (required):
   - Type: date input
   - Default: 30 days from tomorrow
   - Min: Start date
   - Validation: Must be after start date

3. **Available Rooms** (optional):
   - Type: number input
   - Default: Empty (uses `totalRooms` on server)
   - Min: 0, Max: `totalRooms`
   - Placeholder: "Default: {totalRooms} (all rooms)"

**Validation Schema**:
```typescript
z.object({
  startDate: z.string().min(1, 'Start date is required'),
  endDate: z.string().min(1, 'End date is required'),
  availableRooms: z.number().min(0, 'Must be non-negative').optional(),
}).refine((data) => new Date(data.endDate) > new Date(data.startDate), {
  message: 'End date must be after start date',
  path: ['endDate'],
})
```

**Features**:
- Shows total rooms in info box
- Calculates and displays number of days: "This will create X records"
- Server action: `createBulkInventory`
- Form resets on success or cancel
- Loading state during submission

**Usage**:
```typescript
<BulkInventoryForm
  open={isOpen}
  onOpenChange={setIsOpen}
  onSuccess={() => {
    showToast('Success!', 'success')
    refetchData()
  }}
  roomTypeId="deluxe-room-id"
  roomTypeName="Deluxe Room"
  totalRooms={25}
/>
```

---

### 5. Main Inventory Page (`src/app/(admin)/inventory/page.tsx`)

**Purpose**: Orchestrates all components and manages state.

**Key Features**:

1. **Room Type Selection**:
   - Dropdown populated from database
   - Auto-selects first room type on load
   - Changes trigger inventory refetch

2. **Date Range Pagination**:
   - Shows 30 days per page
   - Previous/Next buttons
   - Page number display
   - Disabled states when at boundaries

3. **Responsive Design**:
   - Desktop (≥768px): Shows table view
   - Mobile (<768px): Shows card view
   - Auto-switches based on window resize
   - Manual toggle available on desktop

4. **Loading States**:
   - Spinner during data fetch
   - Loading text: "Loading inventory..."
   - Disabled buttons during load

5. **Error States**:
   - Error message display
   - Retry button
   - Does not clear existing data

6. **Empty States**:
   - No room type selected: "Select a room type"
   - No inventory data: "Create inventory to get started"
   - CTA button to open bulk modal

**State Management**:
```typescript
// Room types
const [roomTypes, setRoomTypes] = useState<RoomType[]>([])
const [selectedRoomTypeId, setSelectedRoomTypeId] = useState<string>('')
const [selectedRoomType, setSelectedRoomType] = useState<RoomType | null>(null)

// Inventory data
const [inventory, setInventory] = useState<RoomInventory[]>([])
const [isLoading, setIsLoading] = useState(false)
const [error, setError] = useState<string | null>(null)

// Pagination
const [currentPage, setCurrentPage] = useState(0)
const [hasMore, setHasMore] = useState(true)

// Modals
const [isBulkModalOpen, setIsBulkModalOpen] = useState(false)

// View
const [viewMode, setViewMode] = useState<'table' | 'cards'>('table')
const [toast, setToast] = useState<ToastState | null>(null)
```

## Features

### Inline Editing Workflow

1. **Desktop (Table)**:
   ```
   [Date] [Day] [20 / 25] [Progress] [Edit]
   ↓ Click Edit
   [Date] [Day] [Input: 20] [--] [Save] [Cancel]
   ↓ Enter new value
   [Date] [Day] [Input: 18] [--] [Save] [Cancel]
   ↓ Click Save
   Server action → Toast → Refetch → Back to view mode
   ```

2. **Mobile (Cards)**:
   ```
   [Card showing date, availability, progress bar]
   [Edit Button (full width)]
   ↓ Click Edit
   [Card with input field]
   [Save Button] [Cancel Button]
   ```

### Pagination System

- **Default**: Shows next 30 days from today
- **Navigation**: Previous/Next buttons advance by 30 days
- **Calculation**:
  ```typescript
  const startDate = new Date()
  startDate.setDate(startDate.getDate() + currentPage * 30)
  
  const endDate = new Date(startDate)
  endDate.setDate(endDate.getDate() + 30)
  ```
- **Boundary Handling**:
  - Previous disabled when `currentPage === 0`
  - Next disabled when `hasMore === false`

### Occupancy Color Coding

```typescript
const getOccupancyColor = (percentage: number) => {
  if (percentage >= 90) return 'red'    // Critical
  if (percentage >= 70) return 'orange' // High
  if (percentage >= 50) return 'yellow' // Medium
  return 'green'                        // Low
}
```

### Responsive Breakpoints

- **Mobile**: < 768px → Card view (forced)
- **Desktop**: ≥ 768px → Table view (default, toggleable)

## Usage Examples

### Example 1: Basic Setup

```typescript
// In your admin layout
import AdminInventoryPage from '@/app/(admin)/inventory/page'

export default function InventoryRoute() {
  return <AdminInventoryPage />
}
```

### Example 2: Viewing Inventory

1. Navigate to `/admin/inventory`
2. Select a room type from dropdown (e.g., "Deluxe (25 rooms)")
3. View current inventory (30 days shown by default)
4. Scroll through dates
5. Click "Next 30 Days" to see future dates

### Example 3: Editing Availability

**Desktop**:
1. Find the date you want to edit
2. Click "Edit" button in Actions column
3. Input field appears with current value
4. Type new availability (e.g., change 20 to 18)
5. Press Enter or click "Save"
6. Toast shows "Inventory updated successfully"
7. Data refreshes automatically

**Mobile**:
1. Scroll to the date card
2. Tap "Edit" button at bottom of card
3. Input field appears
4. Enter new value
5. Tap "Save"
6. Toast confirmation appears

### Example 4: Creating Bulk Inventory

1. Click "Create Inventory" button
2. Modal opens with form
3. Select start date (default: tomorrow)
4. Select end date (default: 30 days out)
5. Optionally override available rooms (leave empty to use all rooms)
6. View calculated days count: "This will create 30 records"
7. Click "Create Inventory"
8. Toast shows "Bulk inventory created successfully"
9. Data refreshes to show new records

### Example 5: Handling Past Dates

Past dates automatically:
- Show grayed out text
- Display "Past" badge instead of day
- Have disabled edit button
- Cannot be modified

## Testing Checklist

### Functional Tests

- [ ] **Room Type Selection**
  - [ ] Dropdown populates with all room types
  - [ ] First room type auto-selected on load
  - [ ] Changing selection fetches new inventory
  - [ ] Loading state shows during fetch
  
- [ ] **Pagination**
  - [ ] Shows 30 days per page
  - [ ] Previous button disabled on page 0
  - [ ] Next button works correctly
  - [ ] Date range text updates correctly
  - [ ] Page number increments/decrements
  
- [ ] **Inline Editing**
  - [ ] Edit button enables input field
  - [ ] Save button validates and submits
  - [ ] Cancel button resets value
  - [ ] Enter key saves
  - [ ] Escape key cancels
  - [ ] Invalid values show error toast
  - [ ] Success shows success toast
  - [ ] Data refetches after save
  
- [ ] **Bulk Creation**
  - [ ] Modal opens on button click
  - [ ] Form validates date range
  - [ ] Form validates available rooms
  - [ ] Days count calculates correctly
  - [ ] Submit creates records
  - [ ] Success toast shows
  - [ ] Modal closes on success
  - [ ] Data refetches after creation
  
- [ ] **Past Date Handling**
  - [ ] Past dates are grayed out
  - [ ] Edit button disabled for past dates
  - [ ] "Past" badge shows instead of day

### Responsive Tests

- [ ] **Desktop (≥768px)**
  - [ ] Table view shows by default
  - [ ] View toggle buttons visible
  - [ ] Inline editing works in table
  - [ ] All columns visible
  - [ ] Pagination controls accessible
  
- [ ] **Tablet (768px-1024px)**
  - [ ] Layout adjusts appropriately
  - [ ] Controls remain accessible
  - [ ] Table still usable
  
- [ ] **Mobile (<768px)**
  - [ ] Card view forced
  - [ ] View toggle hidden
  - [ ] Cards stack vertically
  - [ ] Edit buttons full width
  - [ ] Touch targets adequate size
  - [ ] Date range text truncates properly

### Error Handling Tests

- [ ] **Network Errors**
  - [ ] Error message displays
  - [ ] Retry button works
  - [ ] Existing data not cleared
  
- [ ] **Validation Errors**
  - [ ] Negative values rejected
  - [ ] Values > totalRooms rejected
  - [ ] End date < start date rejected
  - [ ] Empty required fields rejected
  
- [ ] **Edge Cases**
  - [ ] No room types in system
  - [ ] No inventory for selected room
  - [ ] Very large date ranges
  - [ ] Rapid pagination clicks

### Accessibility Tests

- [ ] Keyboard navigation works
- [ ] Focus indicators visible
- [ ] Screen reader compatible
- [ ] Color contrast sufficient
- [ ] Error messages announced

## Troubleshooting

### Issue: Inventory not loading

**Symptoms**: Spinner shows indefinitely, no data appears

**Possible Causes**:
1. Server action failing
2. Database connection issue
3. Invalid room type ID

**Solutions**:
1. Check browser console for errors
2. Verify database connection in server logs
3. Ensure room type exists in database
4. Check `getInventoryByRoomType` server action logs

---

### Issue: Edit button disabled

**Symptoms**: Can't click edit button on a date

**Possible Causes**:
1. Date is in the past
2. Another row is being edited
3. Save operation in progress

**Solutions**:
1. Past dates cannot be edited (by design)
2. Cancel current edit before starting new one
3. Wait for save operation to complete

---

### Issue: Bulk creation not working

**Symptoms**: Modal submits but no records created

**Possible Causes**:
1. Date range validation failing
2. Server action error
3. Database constraint violation

**Solutions**:
1. Check end date is after start date
2. Verify `availableRooms` ≤ `totalRooms`
3. Check server logs for detailed error
4. Ensure no existing records conflict

---

### Issue: Pagination not advancing

**Symptoms**: Next button doesn't load more dates

**Possible Causes**:
1. No more inventory records
2. `hasMore` flag stuck
3. Date calculation error

**Solutions**:
1. Check if you've reached end of available data
2. Verify `hasMore` logic in page component
3. Inspect date range calculation in `fetchInventory`

---

### Issue: Mobile view not showing

**Symptoms**: Table shows on mobile devices

**Possible Causes**:
1. Responsive classes not working
2. View mode stuck on 'table'
3. CSS not loaded

**Solutions**:
1. Check Tailwind classes (hidden/md:block)
2. Verify `viewMode` state updates on resize
3. Ensure Tailwind CSS is properly configured

---

### Issue: Occupancy colors wrong

**Symptoms**: Progress bar shows wrong color

**Possible Causes**:
1. Percentage calculation error
2. Color mapping logic incorrect

**Solutions**:
1. Verify: `percentage = (totalRooms - availableRooms) / totalRooms * 100`
2. Check color thresholds (90%, 70%, 50%)
3. Inspect computed percentage in browser dev tools

---

## API Reference

### Server Actions Used

1. **getRoomTypes**:
   ```typescript
   getRoomTypes({
     sortBy: 'name',
     sortOrder: 'asc',
   })
   ```

2. **getInventoryByRoomType**:
   ```typescript
   getInventoryByRoomType({
     roomTypeId: string,
     startDate: Date,
     endDate: Date,
     sortBy: 'date',
     sortOrder: 'asc',
   })
   ```

3. **updateInventory**:
   ```typescript
   updateInventory({
     id: string,
     data: {
       availableRooms: number,
     },
   })
   ```

4. **createBulkInventory**:
   ```typescript
   createBulkInventory({
     roomTypeId: string,
     startDate: Date,
     endDate: Date,
     availableRooms?: number,
   })
   ```

---

## Performance Considerations

1. **Data Fetching**:
   - Only fetch 30 days at a time (pagination)
   - Use server actions for automatic caching
   - Refetch only when necessary (after edits)

2. **Responsive Design**:
   - Use CSS classes for responsive switching
   - Avoid JavaScript-based layout calculations
   - Leverage Tailwind's responsive utilities

3. **State Management**:
   - Local state for UI interactions
   - Server actions for data operations
   - Toast notifications for feedback

---

## Future Enhancements

- [ ] Date range presets (This Week, Next Month, etc.)
- [ ] Search/filter by occupancy level
- [ ] Export to CSV functionality
- [ ] Calendar view option
- [ ] Bulk edit (update multiple dates)
- [ ] Availability trends chart
- [ ] Occupancy analytics dashboard
- [ ] Real-time updates via WebSocket
- [ ] Undo/Redo functionality
- [ ] Keyboard shortcuts for power users
