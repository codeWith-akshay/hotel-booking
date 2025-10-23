# Admin Room List UI Documentation

Complete guide for the Admin Rooms page with table view and CRUD operations.

---

## Overview

The Admin Rooms page (`/admin/rooms`) provides a comprehensive interface for managing hotel room types with full CRUD (Create, Read, Update, Delete) functionality.

### Features Implemented

✅ **Data Table**: Responsive table with room information  
✅ **Create Modal**: Form to add new room types  
✅ **Edit Modal**: Form to update existing room types  
✅ **Delete Confirmation**: Modal with warning before deletion  
✅ **Toast Notifications**: Success/error feedback  
✅ **Zod Validation**: Client-side form validation  
✅ **Server Actions**: Integration with backend APIs  
✅ **Responsive Design**: Mobile-friendly layout  
✅ **Accessible UI**: Keyboard navigation and ARIA attributes  
✅ **Loading States**: Skeleton loaders and spinners  
✅ **Error Handling**: User-friendly error messages

---

## File Structure

```
src/
├── app/
│   └── (admin)/
│       └── rooms/
│           └── page.tsx              # Main admin page
├── components/
│   ├── forms/
│   │   └── RoomTypeForm.tsx          # Create/Edit form modal
│   └── ui/
│       ├── button.tsx                # Button component
│       ├── dialog.tsx                # Modal dialog components
│       ├── input.tsx                 # Form input component
│       ├── textarea.tsx              # Textarea component
│       ├── label.tsx                 # Form label component
│       ├── table.tsx                 # Table components
│       └── Toast.tsx                 # Toast notification (existing)
└── actions/
    └── rooms/
        └── room-type.action.ts       # Server actions (already created)
```

---

## Components Created

### 1. Button Component (`button.tsx`)

Reusable button with variants and loading state.

**Variants:**
- `default` - Primary blue button
- `destructive` - Red danger button
- `outline` - Bordered button
- `ghost` - Transparent button
- `link` - Link-styled button

**Sizes:**
- `sm` - Small (h-9)
- `default` - Medium (h-10)
- `lg` - Large (h-11)
- `icon` - Square icon button (10x10)

**Props:**
```typescript
interface ButtonProps {
  variant?: 'default' | 'destructive' | 'outline' | 'ghost' | 'link'
  size?: 'default' | 'sm' | 'lg' | 'icon'
  isLoading?: boolean
  disabled?: boolean
  // ...standard button props
}
```

**Usage:**
```tsx
<Button variant="default" size="lg">
  Create Room Type
</Button>

<Button variant="destructive" isLoading>
  Deleting...
</Button>
```

---

### 2. Dialog Components (`dialog.tsx`)

Modal dialog system with overlay.

**Components:**
- `Dialog` - Root container
- `DialogContent` - Content wrapper
- `DialogHeader` - Header section
- `DialogTitle` - Modal title
- `DialogDescription` - Subtitle/description
- `DialogFooter` - Footer with actions

**Usage:**
```tsx
<Dialog open={isOpen} onOpenChange={setIsOpen}>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Create Room Type</DialogTitle>
      <DialogDescription>Add a new room type</DialogDescription>
    </DialogHeader>
    {/* Content */}
    <DialogFooter>
      <Button variant="outline" onClick={() => setIsOpen(false)}>
        Cancel
      </Button>
      <Button>Submit</Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
```

**Features:**
- Auto-focuses on open
- Locks body scroll
- Click outside to close
- ESC key to close
- Smooth animations
- Max height with scroll

---

### 3. Input Component (`input.tsx`)

Form input with error state.

**Props:**
```typescript
interface InputProps {
  error?: string | undefined
  // ...standard input props
}
```

**Usage:**
```tsx
<Input
  id="name"
  type="text"
  placeholder="Enter name"
  value={formData.name}
  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
  error={errors.name}
/>
```

**Features:**
- Error state styling
- Focus ring
- Disabled state
- Placeholder support
- Error message display

---

### 4. Textarea Component (`textarea.tsx`)

Multi-line text input with error state.

**Props:**
```typescript
interface TextareaProps {
  error?: string | undefined
  rows?: number
  // ...standard textarea props
}
```

**Usage:**
```tsx
<Textarea
  id="description"
  placeholder="Enter description"
  value={formData.description}
  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
  rows={4}
  error={errors.description}
/>
```

---

### 5. Label Component (`label.tsx`)

Form label with required indicator.

**Props:**
```typescript
interface LabelProps {
  required?: boolean
  htmlFor?: string
  // ...standard label props
}
```

**Usage:**
```tsx
<Label htmlFor="name" required>
  Room Name
</Label>
```

---

### 6. Table Components (`table.tsx`)

Responsive data table system.

**Components:**
- `Table` - Root container with scroll
- `TableHeader` - Header section
- `TableBody` - Body section
- `TableFooter` - Footer section
- `TableRow` - Table row
- `TableHead` - Header cell
- `TableCell` - Data cell
- `TableCaption` - Table caption

**Usage:**
```tsx
<Table>
  <TableHeader>
    <TableRow>
      <TableHead>Name</TableHead>
      <TableHead>Price</TableHead>
    </TableRow>
  </TableHeader>
  <TableBody>
    {data.map((item) => (
      <TableRow key={item.id}>
        <TableCell>{item.name}</TableCell>
        <TableCell>{item.price}</TableCell>
      </TableRow>
    ))}
  </TableBody>
</Table>
```

---

### 7. RoomTypeForm Component (`RoomTypeForm.tsx`)

Reusable form for creating/editing room types.

**Props:**
```typescript
interface RoomTypeFormProps {
  open: boolean                    // Modal open state
  onOpenChange: (open: boolean) => void  // Close handler
  onSuccess: () => void            // Success callback
  roomType?: RoomType              // Optional: for edit mode
}
```

**Features:**
- **Dual Mode**: Create or edit based on `roomType` prop
- **Zod Validation**: Client-side validation before submission
- **Error Display**: Field-level and server error messages
- **Auto-conversion**: Converts dollars to cents for price
- **Loading State**: Disabled inputs during submission
- **Reset on Close**: Clears form when modal closes

**Form Fields:**
1. **Name** (required)
   - Type: Text
   - Validation: 1-100 characters
   - Unique constraint checked on server

2. **Description** (required)
   - Type: Textarea
   - Validation: 10-2000 characters
   - Rows: 4

3. **Price per Night** (required)
   - Type: Number (dollars)
   - Validation: $10-$100,000
   - Step: 0.01
   - Converted to cents on submit

4. **Total Rooms** (required)
   - Type: Number
   - Validation: 1-1000

**Usage:**
```tsx
// Create mode
<RoomTypeForm
  open={isCreateModalOpen}
  onOpenChange={setIsCreateModalOpen}
  onSuccess={() => {
    showToast('Room created successfully', 'success')
    fetchRoomTypes()
  }}
/>

// Edit mode
<RoomTypeForm
  open={isEditModalOpen}
  onOpenChange={setIsEditModalOpen}
  onSuccess={() => {
    showToast('Room updated successfully', 'success')
    fetchRoomTypes()
  }}
  roomType={selectedRoom}
/>
```

**Validation Schema:**
```typescript
const roomTypeFormSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().min(10).max(2000),
  pricePerNight: z.number().min(10).max(100000),
  totalRooms: z.number().min(1).max(1000),
})
```

---

### 8. Admin Rooms Page (`page.tsx`)

Main admin page with table and modals.

**State Management:**
```typescript
// Data state
const [roomTypes, setRoomTypes] = useState<RoomType[]>([])
const [isLoading, setIsLoading] = useState(true)
const [error, setError] = useState<string | null>(null)

// Modal states
const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
const [isEditModalOpen, setIsEditModalOpen] = useState(false)
const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)

// Selected room
const [selectedRoom, setSelectedRoom] = useState<RoomType | null>(null)

// Toast notification
const [toast, setToast] = useState<ToastState | null>(null)
```

**Key Functions:**

1. **fetchRoomTypes()**
   - Fetches all room types from server
   - Sorts by name (ascending)
   - Updates state with results
   - Handles errors

2. **handleCreate()**
   - Opens create modal
   - No selected room

3. **handleEdit(room)**
   - Sets selected room
   - Opens edit modal

4. **handleDeleteClick(room)**
   - Sets selected room
   - Opens delete confirmation modal

5. **handleDeleteConfirm()**
   - Calls deleteRoomType server action
   - Shows loading state
   - Displays success/error toast
   - Refreshes data on success

6. **handleFormSuccess()**
   - Called after create/update success
   - Shows success toast
   - Refreshes room types list

7. **formatPrice(priceInCents)**
   - Converts cents to formatted dollar string
   - Example: 15000 → "$150.00"

**UI Sections:**

1. **Header**
   - Page title and description
   - "Create Room Type" button
   - Responsive layout

2. **Loading State**
   - Spinner with message
   - Centered layout

3. **Error State**
   - Error message in red box
   - Retry button

4. **Empty State**
   - Icon illustration
   - "No room types found" message
   - "Create Room Type" CTA button

5. **Table**
   - Columns: Name, Description (hidden on mobile), Price, Total Rooms, Actions
   - Edit button (pencil icon)
   - Delete button (trash icon)
   - Responsive: Description hidden on small screens
   - Footer with total count

6. **Modals**
   - Create modal (RoomTypeForm)
   - Edit modal (RoomTypeForm with selected room)
   - Delete confirmation modal

---

## Page Layout

### Desktop View (≥768px)

```
┌─────────────────────────────────────────────────────┐
│ Room Types                    [Create Room Type]    │
│ Manage your hotel room types                        │
├─────────────────────────────────────────────────────┤
│                                                      │
│ ┌──────────────────────────────────────────────┐   │
│ │ Name   Description   Price   Rooms   Actions │   │
│ ├──────────────────────────────────────────────┤   │
│ │ Deluxe  Spacious... $150.00   20   [E] [D]  │   │
│ │ Suite   Luxury...   $250.00   10   [E] [D]  │   │
│ └──────────────────────────────────────────────┘   │
│                                                      │
└─────────────────────────────────────────────────────┘
```

### Mobile View (<768px)

```
┌─────────────────────┐
│ Room Types          │
│ Manage rooms        │
│ [Create Room Type]  │
├─────────────────────┤
│                     │
│ ┌─────────────────┐ │
│ │ Name            │ │
│ │ Price   Rooms   │ │
│ │ Actions         │ │
│ ├─────────────────┤ │
│ │ Deluxe          │ │
│ │ $150  20        │ │
│ │ [E] [D]         │ │
│ └─────────────────┘ │
│                     │
└─────────────────────┘
```

---

## User Flows

### Create Room Type Flow

1. User clicks "Create Room Type" button
2. Modal opens with empty form
3. User fills in fields:
   - Name
   - Description
   - Price per Night
   - Total Rooms
4. User clicks "Create Room Type" button
5. Form validates with Zod
   - If invalid: Show field errors
   - If valid: Continue
6. Call `createRoomType` server action
7. Server validates and creates record
   - If error: Show server error message
   - If success: Continue
8. Close modal
9. Show success toast
10. Refresh room types list

### Edit Room Type Flow

1. User clicks "Edit" button on table row
2. Selected room stored in state
3. Modal opens with pre-filled form
4. User updates fields
5. User clicks "Update Room Type" button
6. Form validates with Zod
7. Call `updateRoomType` server action
8. Server validates and updates record
9. Close modal
10. Show success toast
11. Refresh room types list

### Delete Room Type Flow

1. User clicks "Delete" button on table row
2. Selected room stored in state
3. Delete confirmation modal opens
4. Warning message displayed
5. User clicks "Delete Room Type" button
6. Call `deleteRoomType` server action
7. Loading state shown on button
8. Server deletes room type (CASCADE deletes inventory)
9. Close modal
10. Show success toast with deletion count
11. Refresh room types list

---

## Responsive Behavior

### Breakpoints

- **Mobile**: < 640px (sm)
- **Tablet**: 640px - 768px (md)
- **Desktop**: ≥ 768px (lg)

### Mobile Adaptations

1. **Header**
   - Stack title and button vertically
   - Full-width button

2. **Table**
   - Hide "Description" column
   - Show only essential columns
   - Action buttons show only icons

3. **Modal**
   - Full-screen on mobile
   - Max-width on desktop

4. **Form Fields**
   - Stack price and rooms fields vertically on mobile
   - Side-by-side on desktop

---

## Accessibility Features

### Keyboard Navigation

- Tab through interactive elements
- Enter to submit forms
- ESC to close modals
- Focus visible indicators

### ARIA Attributes

- `role="dialog"` on modals
- `aria-label` on icon buttons
- `aria-describedby` for error messages
- `aria-required` on required fields

### Screen Reader Support

- Semantic HTML elements
- Form labels properly associated
- Error messages announced
- Loading states announced

---

## Error Handling

### Client-Side Validation

**Field Errors:**
```typescript
{
  name: 'Name is required',
  description: 'Description must be at least 10 characters',
  pricePerNight: 'Price must be at least $10',
  totalRooms: 'Must have at least 1 room',
}
```

Displayed below each input field in red.

### Server-Side Errors

**Types:**
1. **Validation Error**: "Validation failed: [specific error]"
2. **Unique Constraint**: "Room type with this name already exists"
3. **Not Found**: "Room type not found"
4. **Authorization**: "Unauthorized" (handled by server actions)
5. **Generic Error**: "Failed to [action]"

Displayed in red alert box above form.

### Network Errors

Caught in try/catch blocks:
```typescript
try {
  const result = await createRoomType(data)
  // Handle result
} catch (error) {
  showToast('An unexpected error occurred', 'error')
}
```

---

## Toast Notifications

### Types

1. **Success** (Green)
   - "Room type created successfully"
   - "Room type updated successfully"
   - "Room type deleted successfully"

2. **Error** (Red)
   - "Failed to create room type"
   - "Failed to update room type"
   - "Failed to delete room type"

### Behavior

- Auto-dismiss after 5 seconds
- Click outside to dismiss
- Position: Top-right corner
- Stacks multiple toasts
- Smooth animations

---

## Testing Checklist

### Functionality Tests

- [ ] Create room type with valid data
- [ ] Create room type with invalid data (validation errors)
- [ ] Create room type with duplicate name (server error)
- [ ] Edit room type (update all fields)
- [ ] Edit room type (update single field)
- [ ] Delete room type (confirm deletion)
- [ ] Cancel create modal (closes without action)
- [ ] Cancel edit modal (closes without action)
- [ ] Cancel delete modal (closes without action)

### Responsive Tests

- [ ] Mobile view (< 640px)
- [ ] Tablet view (640px - 768px)
- [ ] Desktop view (≥ 768px)
- [ ] Modal responsiveness
- [ ] Table scrolling on small screens

### Accessibility Tests

- [ ] Keyboard navigation (tab, enter, esc)
- [ ] Focus visible on all interactive elements
- [ ] Screen reader announces form errors
- [ ] Screen reader announces loading states
- [ ] ARIA labels on icon buttons

### Error Handling Tests

- [ ] Network error during fetch
- [ ] Network error during create
- [ ] Network error during update
- [ ] Network error during delete
- [ ] Invalid form submission
- [ ] Server validation errors

---

## Future Enhancements

### Potential Improvements

1. **Bulk Operations**
   - Select multiple rooms
   - Bulk delete
   - Bulk price update

2. **Filtering & Search**
   - Search by name
   - Filter by price range
   - Filter by availability

3. **Sorting**
   - Click column headers to sort
   - Multi-column sorting

4. **Pagination**
   - Page size selector
   - Page navigation
   - Total count

5. **Export**
   - Export to CSV
   - Export to Excel
   - Print view

6. **History**
   - View change history
   - Audit log
   - Undo changes

7. **Images**
   - Upload room images
   - Image gallery
   - Image preview in table

8. **Advanced Validation**
   - Check for active bookings before delete
   - Warn if price change affects existing bookings
   - Validate inventory consistency

---

## Troubleshooting

### Common Issues

**Issue**: Modal doesn't open  
**Solution**: Check `open` state is being set to `true`

**Issue**: Form doesn't submit  
**Solution**: Check validation errors in console, verify server action import

**Issue**: Toast doesn't appear  
**Solution**: Verify `toast` state is set, check Toast component is rendered

**Issue**: Table shows "No room types found" but data exists  
**Solution**: Check `fetchRoomTypes()` is being called, verify server action response

**Issue**: Delete doesn't refresh table  
**Solution**: Ensure `fetchRoomTypes()` is called in `handleDeleteConfirm` success path

---

## API Integration

### Server Actions Used

1. **getRoomTypes()**
   - Fetches all room types
   - Optional: filters, sorting

2. **createRoomType(input)**
   - Creates new room type
   - Requires: name, description, pricePerNight, totalRooms

3. **updateRoomType(input)**
   - Updates existing room type
   - Requires: id + fields to update

4. **deleteRoomType(input)**
   - Deletes room type (CASCADE)
   - Requires: id

See [SERVER_ACTIONS_ROOM.md](./SERVER_ACTIONS_ROOM.md) for detailed API documentation.

---

## Performance Considerations

### Optimizations

1. **Data Fetching**
   - Fetch on mount only
   - Manual refresh after mutations
   - Consider adding React Query for caching

2. **Component Re-renders**
   - Use `useState` for local state
   - Avoid unnecessary re-renders
   - Consider memoization for large lists

3. **Modal State**
   - Unmount modals when closed
   - Reset form state on close
   - Clear selected room on close

4. **Table Rendering**
   - Virtualize for large datasets (>1000 rows)
   - Paginate server-side
   - Lazy load images

---

## Security Considerations

### Implemented

✅ Server-side validation (Zod schemas)  
✅ RBAC authorization (Admin/SuperAdmin only)  
✅ Input sanitization (Zod parsing)  
✅ CSRF protection (Next.js built-in)  
✅ Type-safe server actions  

### Best Practices

- Never trust client-side validation alone
- Always validate on server
- Check authorization on every mutation
- Log all administrative actions
- Use prepared statements (Prisma)

---

**Last Updated**: 2025-01-22  
**Version**: 1.0.0  
**Author**: Hotel Booking System Team
