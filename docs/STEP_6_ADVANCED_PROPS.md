# Step 6: Advanced Props for Header and Sidebar

## Overview

Step 6 enhances the Header and Sidebar components with advanced props for:
- Notifications system with count badges
- Optional search functionality
- Badge support for navigation links
- External link indicators
- Role-based navigation utilities
- Custom widths and compact mode
- Dynamic active route highlighting

## Files Modified/Created

### Components Enhanced
- `src/components/layout/Header.tsx` - 14 props, notifications, search
- `src/components/layout/Sidebar.tsx` - 14 props, badges, external links
- `src/components/layout/Layout.tsx` - Integrated new prop structure

### Utilities Created
- `src/lib/navigation.utils.ts` - Role-based navigation helpers

---

## Header Component (`src/components/layout/Header.tsx`)

### New Type Definitions

#### HeaderUser Interface
```typescript
interface HeaderUser {
  /** User's display name */
  name: string
  /** User's email address (optional) */
  email?: string | null
  /** User's phone number (optional) */
  phone?: string
  /** User's role (MEMBER, ADMIN, SUPERADMIN) */
  role: string
  /** Avatar image URL (optional) */
  avatarUrl?: string
  /** User's unique ID (optional) */
  id?: string
}
```

#### Enhanced HeaderProps
```typescript
interface HeaderProps {
  // REQUIRED PROPS
  /** User information object (consolidated from separate props) */
  user: HeaderUser
  /** Logout callback (now required) */
  onLogout: () => void
  
  // OPTIONAL PROPS
  /** Navigation links for header (defaults to []) */
  navLinks?: NavLink[]
  /** Notifications count for bell badge (defaults to 0) */
  notificationsCount?: number
  /** Show notifications bell (defaults to true) */
  showNotifications?: boolean
  /** Callback when notifications bell is clicked */
  onNotificationClick?: () => void
  /** Show search bar (defaults to false) */
  showSearch?: boolean
  /** Search input placeholder (defaults to 'Search...') */
  searchPlaceholder?: string
  /** Callback when search is submitted */
  onSearch?: (query: string) => void
  /** Show sidebar toggle button (defaults to false) */
  showSidebarToggle?: boolean
  /** Callback for sidebar toggle */
  onSidebarToggle?: (open?: boolean) => void
}
```

#### Enhanced NavLink
```typescript
interface NavLink {
  label: string
  href: string
  icon?: React.ReactNode | string  // NEW: Icons support
  badge?: string | number           // NEW: Badge display
  roles?: string[]
  external?: boolean                // NEW: External link indicator
}
```

### New Features

#### 1. Notifications Bell
- Bell icon with red count badge
- Badge shows "99+" for counts > 99
- Dropdown with header showing unread count
- Empty state: "No new notifications"
- Click callback: `onNotificationClick`

```tsx
<Header
  user={user}
  notificationsCount={5}
  onNotificationClick={() => console.log('Notifications clicked')}
  onLogout={handleLogout}
/>
```

#### 2. Search Bar
- Optional controlled search input
- Search icon positioned left
- Form submission callback
- Centered in header with max-width

```tsx
<Header
  user={user}
  showSearch={true}
  searchPlaceholder="Search bookings..."
  onSearch={(query) => handleSearch(query)}
  onLogout={handleLogout}
/>
```

#### 3. Enhanced Navigation Links
- Icon support (emoji or React nodes)
- Badge display with count
- External link detection
- Role-based filtering

```tsx
const navLinks: NavLink[] = [
  { 
    label: 'Dashboard', 
    href: '/dashboard', 
    icon: '🏠' 
  },
  { 
    label: 'Bookings', 
    href: '/bookings', 
    icon: '📅', 
    badge: 5 
  },
]

<Header
  user={user}
  navLinks={navLinks}
  onLogout={handleLogout}
/>
```

### Migration Guide

**Before (Old Props):**
```tsx
<Header
  userName="John Doe"
  userEmail="john@example.com"
  userRole="MEMBER"
  avatarUrl="/avatar.jpg"
  onLogout={handleLogout}
/>
```

**After (New Props):**
```typescript
const user: HeaderUser = {
  name: "John Doe",
  email: "john@example.com",
  role: "MEMBER",
  avatarUrl: "/avatar.jpg",
}

<Header
  user={user}
  onLogout={handleLogout}
/>
```

---

## Sidebar Component (`src/components/layout/Sidebar.tsx`)

### New Type Definitions

#### Enhanced SidebarLink
```typescript
interface SidebarLink {
  label: string
  href: string
  icon?: React.ReactNode
  roles?: string[]
  children?: SidebarLink[]
  
  // NEW PROPERTIES
  /** Badge text or count */
  badge?: string | number
  /** Badge color variant */
  badgeVariant?: 'primary' | 'success' | 'warning' | 'danger' | 'info'
  /** External link indicator */
  external?: boolean
  /** Custom CSS classes */
  className?: string
}
```

#### Enhanced SidebarProps
```typescript
interface SidebarProps {
  // REQUIRED PROPS
  /** Navigation links array */
  links: SidebarLink[]
  /** Current active route for highlighting */
  activeRoute: string
  /** User's role for filtering */
  userRole: string
  
  // OPTIONAL PROPS
  /** Sidebar open state */
  isOpen?: boolean
  /** Toggle callback */
  onToggle?: (open?: boolean) => void
  /** Show on desktop */
  showOnDesktop?: boolean
  /** Link click callback */
  onLinkClick?: (link: SidebarLink) => void
  /** Show footer */
  showFooter?: boolean
  /** Custom footer content */
  footerContent?: React.ReactNode
  /** Compact mode (icon-only) */
  compact?: boolean
  /** Open width (defaults to 'w-64') */
  width?: string
  /** Collapsed width (defaults to 'w-20') */
  collapsedWidth?: string
}
```

### New Features

#### 1. Badge Support
- Display count or text
- 5 color variants: primary, success, warning, danger, info
- Auto-positioned with ml-auto
- Only shows when sidebar is open (or not compact)

```tsx
const links: SidebarLink[] = [
  {
    label: 'Bookings',
    href: '/bookings',
    badge: 5,
    badgeVariant: 'warning',
  },
  {
    label: 'Pending',
    href: '/bookings/pending',
    badge: 'NEW',
    badgeVariant: 'danger',
  },
]
```

#### 2. External Link Indicators
- Shows external link icon
- Adds `target="_blank" rel="noopener noreferrer"`
- Icon only shows when open (or not compact)

```tsx
const links: SidebarLink[] = [
  {
    label: 'Documentation',
    href: 'https://example.com/docs',
    external: true,
  },
]
```

#### 3. Custom Widths
- Configurable open/collapsed widths
- Defaults: w-64 open, w-20 collapsed
- Supports any Tailwind width class

```tsx
<Sidebar
  links={links}
  activeRoute="/dashboard"
  userRole="ADMIN"
  width="w-72"
  collapsedWidth="w-16"
/>
```

#### 4. Compact Mode
- Icon-only navigation
- Hides labels
- Reduces width
- Perfect for icon-only sidebars

```tsx
<Sidebar
  links={links}
  activeRoute="/dashboard"
  userRole="ADMIN"
  compact={true}
/>
```

#### 5. Custom Footer
- Replace default footer text
- Accepts React nodes
- Shows when sidebar is open (or not compact)

```tsx
<Sidebar
  links={links}
  activeRoute="/dashboard"
  userRole="ADMIN"
  footerContent={
    <div className="text-xs text-gray-500">
      <div>Custom App v2.0</div>
      <div>© 2024</div>
    </div>
  }
/>
```

#### 6. Active Route Highlighting
- Prop-based active route
- Highlights current link
- Works with client-side navigation

```tsx
'use client'
import { usePathname } from 'next/navigation'

function MyComponent() {
  const pathname = usePathname()
  
  return (
    <Sidebar
      links={links}
      activeRoute={pathname}
      userRole="ADMIN"
    />
  )
}
```

### Migration Guide

**Before (Old Props):**
```tsx
<Sidebar
  userRole="ADMIN"
  isOpen={true}
  onToggle={handleToggle}
/>
// Links were hardcoded in component
```

**After (New Props):**
```tsx
import { usePathname } from 'next/navigation'
import { getNavigationForRole } from '@/lib/navigation.utils'

function MyComponent() {
  const pathname = usePathname()
  const navigation = getNavigationForRole('ADMIN')
  
  return (
    <Sidebar
      links={navigation.sidebarLinks()}
      activeRoute={pathname}
      userRole="ADMIN"
      isOpen={true}
      onToggle={handleToggle}
    />
  )
}
```

---

## Navigation Utilities (`src/lib/navigation.utils.ts`)

### Overview
Helper functions and constants for role-based navigation.

### Type Definitions

```typescript
type UserRole = 'MEMBER' | 'ADMIN' | 'SUPERADMIN'

interface RoleNavigationConfig {
  role: UserRole
  headerLinks: NavLink[]
  sidebarLinks: () => SidebarLink[]
  allowedRoutes: string[]
}
```

### Functions

#### getNavigationForRole()
Get complete navigation config for a role.

```typescript
const navigation = getNavigationForRole('ADMIN')
// Returns: { role, headerLinks, sidebarLinks, allowedRoutes }

const headerLinks = navigation.headerLinks
const sidebarLinks = navigation.sidebarLinks()
```

#### isRouteAllowedForRole()
Check if a route is allowed for a role.

```typescript
const isAllowed = isRouteAllowedForRole('/admin/dashboard', 'ADMIN')
// Returns: true

const isAllowed = isRouteAllowedForRole('/superadmin/users', 'ADMIN')
// Returns: false
```

#### filterLinksByRole()
Filter navigation links by role.

```typescript
const allLinks: NavLink[] = [
  { label: 'Dashboard', href: '/dashboard', roles: ['MEMBER', 'ADMIN'] },
  { label: 'Users', href: '/users', roles: ['SUPERADMIN'] },
]

const memberLinks = filterLinksByRole(allLinks, 'MEMBER')
// Returns: [{ label: 'Dashboard', ... }]
```

#### isLinkActive()
Check if a link is active based on current path.

```typescript
const active = isLinkActive('/dashboard', '/dashboard')
// Returns: true

const active = isLinkActive('/admin/bookings', '/admin/bookings/123')
// Returns: true (startsWith match)
```

#### getRoleDisplayName()
Get human-readable role name.

```typescript
const name = getRoleDisplayName('SUPERADMIN')
// Returns: "Super Administrator"
```

#### getRoleColor()
Get role color for UI elements.

```typescript
const color = getRoleColor('ADMIN')
// Returns: "blue"
```

### Default Navigation Configs

#### MEMBER_NAVIGATION
- Dashboard
- My Bookings (with children: All Bookings, New Booking)
- Profile

#### ADMIN_NAVIGATION
- Dashboard
- Bookings (badge: 5, variant: warning)
  - All Bookings
  - Pending (badge: 5, variant: warning)
  - Today Check-ins
  - Today Check-outs
- Rooms
- Guests
- Reports

#### SUPERADMIN_NAVIGATION
- Dashboard
- Users
  - All Users
  - Admins
  - Members
  - Roles & Permissions
- Communication
- Reports
- Rules
- System Settings

---

## Layout Component (`src/components/layout/Layout.tsx`)

### Updated Props

```typescript
interface LayoutProps {
  children: React.ReactNode
  user: HeaderUser                    // NEW: HeaderUser instead of separate props
  onLogout: () => void                // NOW REQUIRED
  onSearch?: (query: string) => void  // NEW
  onNotificationClick?: () => void    // NEW
  contentClassName?: string
  
  config?: {
    showSidebar?: boolean
    showFooter?: boolean
    headerNavLinks?: NavLink[]
    sidebarLinks?: SidebarLink[]
    notificationsCount?: number       // NEW
    showSearch?: boolean              // NEW
    searchPlaceholder?: string        // NEW
    companyName?: string
  }
}
```

### Features

#### Auto Role-Based Navigation
Layout automatically loads role-based navigation if custom links not provided.

```tsx
<Layout user={user} onLogout={handleLogout}>
  {children}
</Layout>
// Automatically loads MEMBER/ADMIN/SUPERADMIN navigation based on user.role
```

#### Custom Navigation
Override default navigation with custom links.

```tsx
<Layout
  user={user}
  onLogout={handleLogout}
  config={{
    headerNavLinks: customHeaderLinks,
    sidebarLinks: customSidebarLinks,
  }}
>
  {children}
</Layout>
```

#### Notifications
Enable notifications bell with count.

```tsx
<Layout
  user={user}
  onLogout={handleLogout}
  onNotificationClick={() => router.push('/notifications')}
  config={{
    notificationsCount: 5,
  }}
>
  {children}
</Layout>
```

#### Search
Enable header search bar.

```tsx
<Layout
  user={user}
  onLogout={handleLogout}
  onSearch={(query) => handleSearch(query)}
  config={{
    showSearch: true,
    searchPlaceholder: 'Search bookings...',
  }}
>
  {children}
</Layout>
```

### Layout Variants

#### SimpleLayout (No Sidebar)
```tsx
<SimpleLayout user={user} onLogout={handleLogout}>
  {children}
</SimpleLayout>
```

#### FullWidthLayout (No Sidebar, No Footer)
```tsx
<FullWidthLayout user={user} onLogout={handleLogout}>
  {children}
</FullWidthLayout>
```

#### MinimalLayout (Header Only)
```tsx
<MinimalLayout user={user} onLogout={handleLogout}>
  {children}
</MinimalLayout>
```

---

## Usage Examples

### Example 1: Member Dashboard
```tsx
'use client'
import Layout from '@/components/layout/Layout'
import { useRouter } from 'next/navigation'

export default function MemberDashboard() {
  const router = useRouter()
  
  const user = {
    name: 'John Doe',
    email: 'john@example.com',
    role: 'MEMBER',
    avatarUrl: '/avatars/john.jpg',
  }
  
  const handleLogout = () => {
    // Clear session
    router.push('/login')
  }
  
  return (
    <Layout user={user} onLogout={handleLogout}>
      <h1>Member Dashboard</h1>
      {/* Dashboard content */}
    </Layout>
  )
}
```

### Example 2: Admin with Notifications & Search
```tsx
'use client'
import Layout from '@/components/layout/Layout'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

export default function AdminDashboard() {
  const router = useRouter()
  const [notifications, setNotifications] = useState(5)
  
  const user = {
    name: 'Jane Admin',
    email: 'jane@hotel.com',
    role: 'ADMIN',
  }
  
  const handleLogout = () => {
    router.push('/login')
  }
  
  const handleNotificationClick = () => {
    router.push('/admin/notifications')
    setNotifications(0)
  }
  
  const handleSearch = (query: string) => {
    router.push(`/admin/search?q=${query}`)
  }
  
  return (
    <Layout
      user={user}
      onLogout={handleLogout}
      onNotificationClick={handleNotificationClick}
      onSearch={handleSearch}
      config={{
        notificationsCount: notifications,
        showSearch: true,
        searchPlaceholder: 'Search bookings, guests...',
      }}
    >
      <h1>Admin Dashboard</h1>
      {/* Dashboard content */}
    </Layout>
  )
}
```

### Example 3: Custom Navigation Links
```tsx
'use client'
import Layout from '@/components/layout/Layout'
import type { NavLink } from '@/components/layout/Header'
import type { SidebarLink } from '@/components/layout/Sidebar'

const customHeaderLinks: NavLink[] = [
  { label: 'Home', href: '/', icon: '🏠' },
  { label: 'About', href: '/about', icon: 'ℹ️' },
  { label: 'Docs', href: 'https://docs.example.com', external: true },
]

const customSidebarLinks: SidebarLink[] = [
  {
    label: 'Dashboard',
    href: '/dashboard',
    badge: 3,
    badgeVariant: 'primary',
  },
  {
    label: 'Tasks',
    href: '/tasks',
    badge: 'NEW',
    badgeVariant: 'success',
    children: [
      { label: 'Active', href: '/tasks/active', badge: 3 },
      { label: 'Completed', href: '/tasks/completed' },
    ],
  },
]

export default function CustomPage() {
  return (
    <Layout
      user={user}
      onLogout={handleLogout}
      config={{
        headerNavLinks: customHeaderLinks,
        sidebarLinks: customSidebarLinks,
      }}
    >
      {/* Content */}
    </Layout>
  )
}
```

---

## Breaking Changes

### Header Component
1. **Props consolidated**: `userName`, `userEmail`, `userRole`, `avatarUrl` → `user` object
2. **onLogout now required**: No longer optional with fallback
3. **Must pass HeaderUser object**: Cannot use individual props

### Sidebar Component
1. **links prop now required**: Was optional with default links
2. **activeRoute prop now required**: For proper highlighting
3. **Must explicitly pass links**: Cannot rely on hardcoded defaults

### Layout Component
1. **user prop type changed**: Now expects HeaderUser interface
2. **onLogout now required**: No longer optional

---

## Badge Variants

### Available Colors
```typescript
type BadgeVariant = 'primary' | 'success' | 'warning' | 'danger' | 'info'
```

### Color Mapping
- **primary**: Blue background (`bg-blue-600`)
- **success**: Green background (`bg-green-500`)
- **warning**: Yellow background (`bg-yellow-500`)
- **danger**: Red background (`bg-red-500`)
- **info**: Light blue background (`bg-blue-500`)

All badges have white text and are rounded with small text.

---

## Responsive Behavior

### Header
- **Mobile** (<768px):
  - Hamburger menu for sidebar toggle
  - Navigation links hidden
  - Profile and notifications visible
  - Search collapses if too narrow
  
- **Tablet** (768px - 1024px):
  - Navigation links visible
  - All features available
  
- **Desktop** (>1024px):
  - Full horizontal layout
  - All features visible

### Sidebar
- **Mobile** (<1024px):
  - Drawer overlay style
  - Backdrop click to close
  - Fixed positioning
  - Swipe gesture support
  
- **Desktop** (>1024px):
  - Static positioning
  - Collapsible width
  - Hover effects
  - Persistent state

---

## Testing Checklist

### Header
- [ ] User avatar displays correctly
- [ ] User name and email/phone shown in dropdown
- [ ] Role badge shows correct color
- [ ] Notifications bell appears with count
- [ ] Notifications count shows "99+" for >99
- [ ] Notifications dropdown opens/closes
- [ ] Search bar appears when enabled
- [ ] Search submission works
- [ ] Navigation links display with icons
- [ ] Navigation links show badges
- [ ] Logout button works
- [ ] Mobile hamburger menu works
- [ ] Profile dropdown opens/closes

### Sidebar
- [ ] Links display with icons
- [ ] Active link is highlighted correctly
- [ ] Badges appear with correct colors
- [ ] External link icon appears
- [ ] External links open in new tab
- [ ] Children (submenu) expand/collapse
- [ ] Role filtering works
- [ ] Custom footer displays
- [ ] Empty state shows when no links
- [ ] Compact mode hides labels
- [ ] Custom widths apply correctly
- [ ] Mobile drawer opens/closes
- [ ] Backdrop click closes on mobile
- [ ] Desktop collapse/expand works

### Layout
- [ ] Role-based navigation loads correctly
- [ ] Custom navigation overrides defaults
- [ ] Notifications count updates
- [ ] Search callback fires
- [ ] Notification callback fires
- [ ] Active route highlighting works
- [ ] SimpleLayout hides sidebar
- [ ] FullWidthLayout hides sidebar and footer
- [ ] MinimalLayout shows only header

---

## Performance Notes

1. **Navigation Config**: `sidebarLinks()` is a function to avoid JSX serialization issues
2. **Active Route**: Uses pathname from Next.js for client-side highlighting
3. **Role Filtering**: Filters links on render, cached by React
4. **Badge Rendering**: Only renders when sidebar is open (optimization)

---

## Summary

### Files Modified
- ✅ `src/components/layout/Header.tsx` - 14 props
- ✅ `src/components/layout/Sidebar.tsx` - 14 props
- ✅ `src/components/layout/Layout.tsx` - Integrated new props

### Files Created
- ✅ `src/lib/navigation.utils.ts` - Role-based navigation utilities
- ✅ `docs/STEP_6_ADVANCED_PROPS.md` - This documentation

### New Features
- ✅ Notifications bell with count badge
- ✅ Optional search bar in header
- ✅ Badge support in navigation links
- ✅ External link indicators
- ✅ Custom widths for sidebar
- ✅ Compact mode for sidebar
- ✅ Active route highlighting
- ✅ Custom footer content
- ✅ Role-based navigation utilities
- ✅ Link click callbacks

### Breaking Changes
- ⚠️ Header user props consolidated
- ⚠️ Sidebar links prop now required
- ⚠️ onLogout now required in Layout

### Next Steps
- Step 7: Consider adding notification center page
- Step 8: Consider adding advanced search with filters
- Step 9: Consider adding user preferences/settings
