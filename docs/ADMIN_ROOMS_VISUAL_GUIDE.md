# Admin Rooms Page - Visual Flow Guide

## 🎨 Page States

### 1. Loading State
```
┌─────────────────────────────────────────┐
│ Room Types         [Create Room Type]   │
│ Manage your hotel room types            │
├─────────────────────────────────────────┤
│                                          │
│         ⟳ Loading room types...         │
│                                          │
└─────────────────────────────────────────┘
```

### 2. Empty State
```
┌─────────────────────────────────────────┐
│ Room Types         [Create Room Type]   │
│ Manage your hotel room types            │
├─────────────────────────────────────────┤
│                                          │
│             🏨                           │
│      No room types found                 │
│   Get started by creating your first    │
│           room type                      │
│      [Create Room Type]                  │
│                                          │
└─────────────────────────────────────────┘
```

### 3. Table with Data
```
┌────────────────────────────────────────────────────────────────────┐
│ Room Types                              [Create Room Type]         │
│ Manage your hotel room types                                       │
├────────────────────────────────────────────────────────────────────┤
│ ┌────────────────────────────────────────────────────────────────┐ │
│ │ Name          Description    Price     Rooms    Actions       │ │
│ ├────────────────────────────────────────────────────────────────┤ │
│ │ Deluxe Room   Spacious...   $150.00    20    [✏️ Edit][🗑️ Del]│ │
│ │ Executive     Luxury...     $250.00    10    [✏️ Edit][🗑️ Del]│ │
│ │ Presidential  Premium...    $500.00     3    [✏️ Edit][🗑️ Del]│ │
│ └────────────────────────────────────────────────────────────────┘ │
│ Total: 3 room types                                                │
└────────────────────────────────────────────────────────────────────┘
```

### 4. Error State
```
┌─────────────────────────────────────────┐
│ Room Types         [Create Room Type]   │
│ Manage your hotel room types            │
├─────────────────────────────────────────┤
│ ┌─────────────────────────────────────┐ │
│ │ ⚠️ Failed to load room types        │ │
│ │ [Retry]                             │ │
│ └─────────────────────────────────────┘ │
└─────────────────────────────────────────┘
```

## 📝 Create Room Type Flow

### Step 1: Click "Create Room Type" Button
```
User clicks button → setIsCreateModalOpen(true)
```

### Step 2: Modal Opens
```
┌─────────────────────────────────────┐
│ Create Room Type               ╳    │
│ Add a new room type to your hotel   │
├─────────────────────────────────────┤
│                                      │
│ Room Name *                          │
│ ┌────────────────────────────────┐  │
│ │ e.g., Deluxe Ocean View        │  │
│ └────────────────────────────────┘  │
│                                      │
│ Description *                        │
│ ┌────────────────────────────────┐  │
│ │ Describe the room features...  │  │
│ │                                │  │
│ │                                │  │
│ └────────────────────────────────┘  │
│                                      │
│ Price per Night ($) *  Total Rooms *│
│ ┌──────────────┐     ┌──────────┐  │
│ │ 150.00       │     │ 20       │  │
│ └──────────────┘     └──────────┘  │
│                                      │
├─────────────────────────────────────┤
│          [Cancel] [Create Room Type]│
└─────────────────────────────────────┘
```

### Step 3: User Fills Form
```typescript
formData = {
  name: "Deluxe Ocean View",
  description: "Spacious room with panoramic ocean views...",
  pricePerNight: 150,
  totalRooms: 20
}
```

### Step 4: Validation (Client-Side)
```typescript
// Zod validates:
✅ Name: 1-100 chars → Valid
✅ Description: 10-2000 chars → Valid
✅ Price: $10-$100,000 → Valid
✅ Total Rooms: 1-1000 → Valid
```

### Step 5: Server Action Call
```typescript
const result = await createRoomType({
  name: "Deluxe Ocean View",
  description: "Spacious room with...",
  pricePerNight: 15000, // Converted to cents
  totalRooms: 20
})
```

### Step 6: Success Response
```typescript
{
  success: true,
  message: "Room type created successfully",
  data: {
    id: "clx123456",
    name: "Deluxe Ocean View",
    description: "Spacious room with...",
    pricePerNight: 15000,
    totalRooms: 20,
    createdAt: Date,
    updatedAt: Date
  }
}
```

### Step 7: UI Updates
```
1. Modal closes → setIsCreateModalOpen(false)
2. Toast shows → "Room type created successfully" (green)
3. Table refreshes → fetchRoomTypes()
4. New row appears in table
```

### Step 8: Toast Notification
```
┌────────────────────────────────────┐
│ ✓ Room type created successfully  │ ← Auto-dismiss after 5s
└────────────────────────────────────┘
```

## ✏️ Edit Room Type Flow

### Step 1: Click "Edit" Button
```
User clicks edit → setSelectedRoom(room) → setIsEditModalOpen(true)
```

### Step 2: Modal Opens with Pre-filled Data
```
┌─────────────────────────────────────┐
│ Edit Room Type                 ╳    │
│ Update the room type details below  │
├─────────────────────────────────────┤
│                                      │
│ Room Name *                          │
│ ┌────────────────────────────────┐  │
│ │ Deluxe Ocean View              │  │ ← Pre-filled
│ └────────────────────────────────┘  │
│                                      │
│ Description *                        │
│ ┌────────────────────────────────┐  │
│ │ Spacious room with panoramic...│  │ ← Pre-filled
│ │                                │  │
│ └────────────────────────────────┘  │
│                                      │
│ Price per Night ($) *  Total Rooms *│
│ ┌──────────────┐     ┌──────────┐  │
│ │ 150.00       │     │ 20       │  │ ← Pre-filled
│ └──────────────┘     └──────────┘  │
│                                      │
├─────────────────────────────────────┤
│          [Cancel] [Update Room Type]│
└─────────────────────────────────────┘
```

### Step 3: User Updates Fields
```typescript
// User changes price from $150 to $175
formData = {
  ...existingData,
  pricePerNight: 175 // Updated
}
```

### Step 4: Server Action Call
```typescript
const result = await updateRoomType({
  id: "clx123456",
  pricePerNight: 17500 // Only updated field
})
```

### Step 5: Success
```
1. Modal closes
2. Toast: "Room type updated successfully" (green)
3. Table refreshes
4. Row shows new price: $175.00
```

## 🗑️ Delete Room Type Flow

### Step 1: Click "Delete" Button
```
User clicks delete → setSelectedRoom(room) → setIsDeleteModalOpen(true)
```

### Step 2: Confirmation Modal Opens
```
┌─────────────────────────────────────────┐
│ Delete Room Type                   ╳    │
│ Are you sure you want to delete         │
│ "Deluxe Ocean View"?                    │
│                                          │
│ This will permanently delete the room   │
│ type and all associated inventory.      │
│ This action cannot be undone.           │
├─────────────────────────────────────────┤
│ ┌─────────────────────────────────────┐ │
│ │ ⚠️ Warning: This will delete all    │ │
│ │    inventory records associated     │ │
│ │    with this room type.             │ │
│ └─────────────────────────────────────┘ │
├─────────────────────────────────────────┤
│              [Cancel] [Delete Room Type]│
└─────────────────────────────────────────┘
```

### Step 3: User Confirms
```
User clicks "Delete Room Type" → handleDeleteConfirm()
```

### Step 4: Server Action Call
```typescript
const result = await deleteRoomType({
  id: "clx123456"
})
```

### Step 5: Success Response
```typescript
{
  success: true,
  message: "Room type 'Deluxe Ocean View' deleted successfully (90 inventory records removed)"
}
```

### Step 6: UI Updates
```
1. Modal closes
2. Toast: "Room type deleted successfully" (green)
3. Table refreshes
4. Row removed from table
```

## ❌ Error Handling Flow

### Validation Error (Client-Side)
```
┌─────────────────────────────────────┐
│ Create Room Type               ╳    │
├─────────────────────────────────────┤
│ Room Name *                          │
│ ┌────────────────────────────────┐  │
│ │                                │  │ ← Empty
│ └────────────────────────────────┘  │
│ ❌ Name is required                 │ ← Error message
│                                      │
│ Price per Night ($) *                │
│ ┌────────────────────────────────┐  │
│ │ 5                              │  │ ← Too low
│ └────────────────────────────────┘  │
│ ❌ Price must be at least $10       │ ← Error message
└─────────────────────────────────────┘
```

### Server Error
```
┌─────────────────────────────────────┐
│ Create Room Type               ╳    │
├─────────────────────────────────────┤
│ ┌─────────────────────────────────┐ │
│ │ ❌ Room type with this name     │ │
│ │    already exists               │ │ ← Server error
│ └─────────────────────────────────┘ │
│                                      │
│ Room Name *                          │
│ ┌────────────────────────────────┐  │
│ │ Deluxe Room                    │  │ ← Duplicate
│ └────────────────────────────────┘  │
└─────────────────────────────────────┘
```

### Network Error
```
Toast appears:
┌────────────────────────────────────┐
│ ❌ An unexpected error occurred    │
└────────────────────────────────────┘
```

## 📱 Responsive Layouts

### Desktop (≥768px)
```
┌──────────────────────────────────────────────────────────────┐
│ Room Types                           [Create Room Type]      │
├──────────────────────────────────────────────────────────────┤
│ ┌──────────────────────────────────────────────────────────┐ │
│ │ Name   │ Description        │ Price │ Rooms │ Actions   │ │
│ ├──────────────────────────────────────────────────────────┤ │
│ │ Deluxe │ Spacious room...   │ $150  │  20   │ [E] [D]  │ │
│ └──────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────┘
```

### Mobile (<768px)
```
┌─────────────────────┐
│ Room Types          │
│ [Create Room Type]  │
├─────────────────────┤
│ ┌─────────────────┐ │
│ │ Name  │Price│Rm│ │
│ ├─────────────────┤ │
│ │ Deluxe│$150│20│ │
│ │ [✏️][🗑️]        │ │
│ └─────────────────┘ │
└─────────────────────┘
```

## 🎯 Component Hierarchy

```
AdminRoomsPage
├── Header
│   ├── Title & Description
│   └── Create Button
├── Error State (conditional)
│   └── Retry Button
├── Loading State (conditional)
│   └── Spinner
├── Empty State (conditional)
│   └── CTA Button
├── Table (conditional)
│   ├── TableHeader
│   │   └── TableRow
│   │       └── TableHead (Name, Description, Price, Rooms, Actions)
│   ├── TableBody
│   │   └── TableRow (for each room)
│   │       ├── TableCell (Name)
│   │       ├── TableCell (Description - hidden on mobile)
│   │       ├── TableCell (Price)
│   │       ├── TableCell (Total Rooms)
│   │       └── TableCell (Actions)
│   │           ├── Edit Button
│   │           └── Delete Button
│   └── Footer (Total count)
├── RoomTypeForm (Create)
│   └── Dialog
│       ├── DialogHeader
│       ├── Form Fields
│       └── DialogFooter
├── RoomTypeForm (Edit)
│   └── Dialog (same structure)
├── Delete Confirmation Dialog
│   ├── Warning Message
│   └── Action Buttons
└── Toast Notification (conditional)
```

## 🔄 State Flow Diagram

```
                      ┌──────────────┐
                      │  Page Mount  │
                      └──────┬───────┘
                             │
                             ▼
                      ┌──────────────┐
                      │ fetchRoomTypes│
                      └──────┬───────┘
                             │
                ┌────────────┼────────────┐
                │            │            │
                ▼            ▼            ▼
         ┌─────────┐  ┌─────────┐  ┌─────────┐
         │ Loading │  │ Success │  │  Error  │
         └─────────┘  └────┬────┘  └────┬────┘
                           │            │
                           ▼            ▼
                    ┌──────────┐  ┌──────────┐
                    │ Show     │  │ Show     │
                    │ Table    │  │ Error    │
                    └────┬─────┘  └──────────┘
                         │
         ┌───────────────┼───────────────┐
         │               │               │
         ▼               ▼               ▼
    ┌────────┐     ┌────────┐     ┌────────┐
    │ Create │     │  Edit  │     │ Delete │
    └───┬────┘     └───┬────┘     └───┬────┘
        │              │              │
        ▼              ▼              ▼
    ┌────────┐     ┌────────┐     ┌────────┐
    │ Server │     │ Server │     │ Server │
    │ Action │     │ Action │     │ Action │
    └───┬────┘     └───┬────┘     └───┬────┘
        │              │              │
        └──────────────┼──────────────┘
                       │
                       ▼
                 ┌──────────┐
                 │  Toast   │
                 │  +       │
                 │ Refresh  │
                 └──────────┘
```

## ⚡ Performance Tips

### Optimized Rendering
```typescript
// ✅ Good: Fetch once on mount
useEffect(() => {
  fetchRoomTypes()
}, [])

// ❌ Bad: Fetch on every render
fetchRoomTypes() // Don't do this in component body
```

### Efficient State Updates
```typescript
// ✅ Good: Update only what changed
const handleEdit = (room: RoomType) => {
  setSelectedRoom(room)
  setIsEditModalOpen(true)
}

// ❌ Bad: Update entire state
const handleEdit = (room: RoomType) => {
  setState({ ...state, selectedRoom: room, isEditModalOpen: true })
}
```

### Modal Cleanup
```typescript
// ✅ Good: Reset state on close
const handleClose = () => {
  resetForm()
  setSelectedRoom(null)
  onOpenChange(false)
}
```

---

**Tip**: Use the browser DevTools to inspect component re-renders and optimize performance.

**Created:** January 22, 2025  
**Version:** 1.0.0
