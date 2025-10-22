# Layout System - Step 1 Complete

## 📋 Overview

Complete responsive layout system with Header, Sidebar, Footer, and main Layout component. Built with Next.js 14+, TypeScript, and Tailwind CSS.

## ✨ Components Created

### 1. **Header** (`src/components/layout/Header.tsx`)
- Logo and branding
- Role-based navigation links
- Profile avatar with dropdown menu
- Logout functionality
- Mobile hamburger menu
- Responsive design

### 2. **Sidebar** (`src/components/layout/Sidebar.tsx`)
- Collapsible sidebar (desktop)
- Mobile drawer with backdrop
- Role-based link filtering
- Hierarchical menu with submenus
- Active link highlighting
- Smooth transitions

### 3. **Footer** (`src/components/layout/Footer.tsx`)
- Company branding
- Quick navigation links
- Social media links
- Contact information
- Copyright notice
- Mobile-responsive

### 4. **Layout** (`src/components/layout/Layout.tsx`)
- Main layout component
- Combines Header + Sidebar + Footer
- Responsive grid system
- Mobile-first design
- Three layout variants:
  - `Layout` - Full layout with sidebar
  - `SimpleLayout` - No sidebar
  - `FullWidthLayout` - No sidebar, no footer
  - `MinimalLayout` - Header only

### 5. **Types & Utilities** (`src/types/layout.types.ts`)
- TypeScript interfaces
- Helper functions
- Default navigation configs
- Responsive utilities

## 🚀 Usage Examples

### Basic Layout Usage

```tsx
// app/dashboard/page.tsx
'use client'

import Layout from '@/components/layout/Layout'
import { useRouter } from 'next/navigation'

export default function DashboardPage() {
  const router = useRouter()
  
  const user = {
    name: 'John Doe',
    email: 'john@example.com',
    role: 'MEMBER' as const,
  }

  const handleLogout = () => {
    // Clear session
    router.push('/login')
  }

  return (
    <Layout user={user} onLogout={handleLogout}>
      <h1 className="text-2xl font-bold">Dashboard</h1>
      <p>Your dashboard content here...</p>
    </Layout>
  )
}
```

### Simple Layout (No Sidebar)

```tsx
// app/profile/page.tsx
import { SimpleLayout } from '@/components/layout/Layout'

export default function ProfilePage() {
  const user = {
    name: 'John Doe',
    email: 'john@example.com',
    role: 'MEMBER' as const,
  }

  return (
    <SimpleLayout user={user}>
      <h1>My Profile</h1>
      {/* Profile content */}
    </SimpleLayout>
  )
}
```

### Full Width Layout

```tsx
// app/booking/new/page.tsx
import { FullWidthLayout } from '@/components/layout/Layout'

export default function NewBookingPage() {
  const user = {
    name: 'John Doe',
    role: 'MEMBER' as const,
  }

  return (
    <FullWidthLayout user={user}>
      {/* Booking wizard - needs full width */}
      <div className="container mx-auto">
        <h1>New Booking</h1>
      </div>
    </FullWidthLayout>
  )
}
```

### Custom Navigation Links

```tsx
import Layout from '@/components/layout/Layout'

const customHeaderLinks = [
  { label: 'Home', href: '/' },
  { label: 'Explore', href: '/explore' },
  { label: 'My Trips', href: '/trips', roles: ['MEMBER'] },
]

const customSidebarLinks = [
  {
    label: 'Dashboard',
    href: '/dashboard',
    icon: <DashboardIcon />,
  },
  {
    label: 'Settings',
    href: '/settings',
    roles: ['ADMIN'],
  },
]

export default function CustomLayoutPage() {
  return (
    <Layout
      user={user}
      config={{
        headerNavLinks: customHeaderLinks,
        sidebarLinks: customSidebarLinks,
        companyName: 'My Hotel App',
      }}
    >
      {/* Content */}
    </Layout>
  )
}
```

## 🎨 Customization

### Tailwind Colors

Update component colors:

```tsx
// In Header.tsx - change logo gradient
<div className="w-8 h-8 bg-linear-to-br from-purple-600 to-purple-800">

// In Sidebar.tsx - change active link color
className={isActive ? 'bg-purple-50 text-purple-700' : 'text-gray-700'}
```

### Logo

Replace logo in Header:

```tsx
<Link href="/dashboard">
  <img src="/logo.png" alt="Logo" className="h-8" />
</Link>
```

### Navigation

Use helper functions from `layout.types.ts`:

```tsx
import { filterLinksByRole, isLinkActive } from '@/types/layout.types'

const visibleLinks = filterLinksByRole(allLinks, user.role)
const isActive = isLinkActive('/dashboard', pathname)
```

## 📱 Responsive Behavior

### Breakpoints

- **Mobile** (`< 1024px`): Sidebar becomes drawer, opens from left
- **Desktop** (`>= 1024px`): Sidebar fixed, collapsible

### Testing Responsive Design

```tsx
import { isMobileViewport, isDesktopViewport } from '@/types/layout.types'

// In useEffect
useEffect(() => {
  if (isMobileViewport()) {
    setSidebarOpen(false)
  }
}, [])
```

## 🔐 Role-Based Navigation

### Supported Roles

- `MEMBER` - Regular users
- `ADMIN` - Administrators
- `SUPERADMIN` - Super administrators

### Filtering by Role

```tsx
// Links automatically filtered based on user role
const links = [
  { label: 'Dashboard', href: '/dashboard', roles: ['MEMBER', 'ADMIN'] },
  { label: 'Settings', href: '/settings', roles: ['SUPERADMIN'] },
]

// Only SUPERADMIN will see Settings link
```

## 🎯 Props Reference

### Layout Props

```typescript
interface LayoutProps {
  children: React.ReactNode
  user: {
    name: string
    email?: string
    role: 'MEMBER' | 'ADMIN' | 'SUPERADMIN'
    avatarUrl?: string
  }
  config?: {
    showSidebar?: boolean
    showFooter?: boolean
    headerNavLinks?: NavLink[]
    sidebarLinks?: SidebarLink[]
    companyName?: string
  }
  onLogout?: () => void
  contentClassName?: string
}
```

### Header Props

```typescript
interface HeaderProps {
  userName?: string
  userRole: string
  userEmail?: string
  avatarUrl?: string
  onLogout?: () => void
  navLinks?: NavLink[]
  showSidebarToggle?: boolean
  onSidebarToggle?: () => void
}
```

### Sidebar Props

```typescript
interface SidebarProps {
  userRole: string
  links?: SidebarLink[]
  isOpen?: boolean
  onToggle?: (open: boolean) => void
  showOnDesktop?: boolean
}
```

## 🐛 Troubleshooting

### Sidebar not showing

**Solution**: Check `showSidebar` config and `showOnDesktop` prop

```tsx
<Layout
  user={user}
  config={{ showSidebar: true }}
>
```

### Navigation links not filtered

**Solution**: Ensure `roles` array is set on links

```tsx
const links = [
  { label: 'Admin', href: '/admin', roles: ['ADMIN'] }
]
```

### Mobile menu not closing

**Solution**: Sidebar automatically closes on route change for mobile

## 📦 Files Created

```
src/
├── components/
│   └── layout/
│       ├── Header.tsx         (520 lines) ✅
│       ├── Sidebar.tsx        (390 lines) ✅
│       ├── Footer.tsx         (160 lines) ✅
│       └── Layout.tsx         (280 lines) ✅
└── types/
    └── layout.types.ts        (370 lines) ✅
```

## ✅ Features Completed

- ✅ Header with logo, navigation, profile dropdown, logout
- ✅ Collapsible sidebar with role-based links
- ✅ Responsive footer with social links
- ✅ Main Layout component with variants
- ✅ TypeScript types and utilities
- ✅ Mobile-first responsive design
- ✅ Role-based navigation filtering
- ✅ Active link highlighting
- ✅ Smooth animations and transitions

## 🚀 Next Steps

1. **Integration**: Import and use in your pages
2. **Styling**: Customize colors and branding
3. **Icons**: Add custom icons to navigation
4. **Content**: Build page content inside layouts
5. **Auth**: Connect with your auth system

## 📝 Example Integration

Create a test page:

```tsx
// app/test-layout/page.tsx
'use client'

import Layout from '@/components/layout/Layout'

export default function TestLayoutPage() {
  return (
    <Layout
      user={{
        name: 'Test User',
        email: 'test@example.com',
        role: 'MEMBER',
      }}
      onLogout={() => console.log('Logout clicked')}
    >
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Test Layout</h1>
        <p>This is a test page with the new layout system.</p>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="font-bold mb-2">Card 1</h2>
            <p>Content here...</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="font-bold mb-2">Card 2</h2>
            <p>Content here...</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="font-bold mb-2">Card 3</h2>
            <p>Content here...</p>
          </div>
        </div>
      </div>
    </Layout>
  )
}
```

---

**Created**: October 22, 2025  
**Version**: 1.0.0  
**Status**: ✅ Complete and Ready to Use
