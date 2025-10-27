# 🚀 Responsive UI Polish - Quick Reference

## Common Patterns & Code Snippets

---

## 📱 Responsive Utilities

### Using Responsive Classes
```tsx
// Hide on mobile, show on desktop
<div className="hidden md:block">Desktop only</div>

// Show on mobile, hide on desktop  
<div className="md:hidden">Mobile only</div>

// Responsive grid
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">

// Responsive padding
<div className="p-4 sm:p-6 lg:p-8">

// Responsive text
<h1 className="text-2xl sm:text-3xl lg:text-4xl">
```

### Using Responsive Hooks
```tsx
import { useIsMobile, useIsTablet, useIsDesktop } from '@/lib/hooks/useResponsive'

function MyComponent() {
  const isMobile = useIsMobile() // < 768px
  const isTablet = useIsTablet() // >= 768px && < 1024px
  const isDesktop = useIsDesktop() // >= 1024px
  
  return (
    <div>
      {isMobile && <MobileView />}
      {isDesktop && <DesktopView />}
    </div>
  )
}
```

---

## ♿ Accessibility Patterns

### Skip to Content Link
```tsx
// Already added to root layout
<a 
  href="#main-content" 
  className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50..."
>
  Skip to main content
</a>

// Add ID to main content area
<main id="main-content">
  {children}
</main>
```

### Semantic HTML
```tsx
// Use proper semantic elements
<header role="banner">Header content</header>
<nav role="navigation" aria-label="Main navigation">
  <ul role="list">...</ul>
</nav>
<main id="main-content" role="main">Content</main>
<footer role="contentinfo">Footer</footer>
```

### ARIA Attributes
```tsx
// Button that toggles menu
<button
  onClick={toggleMenu}
  aria-label="Toggle menu"
  aria-expanded={isOpen}
  aria-controls="menu-id"
  aria-haspopup="true"
>

// Menu/dropdown
<div
  id="menu-id"
  role="dialog"
  aria-modal="true"
  aria-labelledby="menu-title"
>

// Active navigation link
<a 
  href="/dashboard"
  aria-current="page"
  className="..."
>
```

### Focus Management
```tsx
// Use focus-ring utility
<button className="focus-ring">
  Click me
</button>

// Custom focus styling
<button className="focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2">
  
// Using focus trap hook
import { useFocusTrap } from '@/lib/hooks/useAccessibility'

function Modal({ isOpen }) {
  const modalRef = useFocusTrap<HTMLDivElement>(isOpen)
  
  return <div ref={modalRef}>...</div>
}
```

---

## 🎨 Visual Polish

### Touch-Friendly Targets
```tsx
// Minimum 44x44px touch targets
<button className="touch-target">
  <Icon className="w-5 h-5" />
</button>

// Custom touch target
<button className="min-w-[44px] min-h-[44px] inline-flex items-center justify-center">
```

### Hover Effects
```tsx
// Simple hover
<button className="hover:bg-gray-100 transition-colors duration-200">

// With shadow
<div className="hover:shadow-md transition-all duration-200">

// Card hover
<div className="card-hover"> // Uses global utility

// Multiple states
<button className="
  hover:bg-blue-600 
  active:bg-blue-700 
  focus:ring-2 
  focus:ring-blue-500
  transition-all duration-200
">
```

### Gradients
```tsx
// Linear gradient (Tailwind v4)
<div className="bg-linear-to-r from-blue-600 to-blue-800">

// Radial gradient
<div className="bg-linear-to-br from-blue-500 to-purple-600">

// Gradient text (if supported)
<h1 className="bg-linear-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
```

### Shadows & Depth
```tsx
// Progressive shadows
<div className="shadow-sm hover:shadow-md transition-shadow duration-200">

// Card with shadow
<div className="bg-white rounded-lg shadow-md p-4">

// Elevated card
<div className="bg-white rounded-lg shadow-lg hover:shadow-xl transition-all duration-200">
```

---

## 📊 Responsive Table

### Basic Usage
```tsx
import ResponsiveTable from '@/components/ui/responsive-table'

<ResponsiveTable
  data={bookings}
  columns={[
    { label: 'Guest Name', key: 'guestName' },
    { label: 'Room', key: 'roomNumber' },
    { label: 'Check-in', key: 'checkIn' },
  ]}
/>
```

### With Custom Renderer
```tsx
<ResponsiveTable
  data={bookings}
  columns={[
    { label: 'Guest', key: 'guestName' },
    { 
      label: 'Status', 
      key: 'status',
      render: (status) => (
        <span className={`
          px-2 py-1 rounded-full text-xs font-medium
          ${status === 'confirmed' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}
        `}>
          {status}
        </span>
      )
    }
  ]}
/>
```

### With Sorting
```tsx
const [sortKey, setSortKey] = useState('name')
const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc')

const handleSort = (key: string) => {
  if (sortKey === key) {
    setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
  } else {
    setSortKey(key)
    setSortDirection('asc')
  }
}

<ResponsiveTable
  data={sortedData}
  columns={[
    { label: 'Name', key: 'name', sortable: true },
    { label: 'Email', key: 'email', sortable: true },
  ]}
  onSort={handleSort}
  sortKey={sortKey}
  sortDirection={sortDirection}
/>
```

### Custom Mobile Card
```tsx
<ResponsiveTable
  data={bookings}
  columns={columns}
  renderMobileCard={(booking) => (
    <div className="border rounded-lg p-4 space-y-2">
      <h3 className="font-semibold">{booking.guestName}</h3>
      <p className="text-sm text-gray-600">Room {booking.roomNumber}</p>
      <StatusBadge status={booking.status} />
      <button className="mt-2 text-blue-600 text-sm">View Details</button>
    </div>
  )}
/>
```

---

## 🎭 Animations

### Fade In
```tsx
// Using global animation
<div className="animate-fade-in">
  Content fades in
</div>

// Fade in from bottom
<div className="animate-fade-in-up">
  Slides up and fades in
</div>
```

### Conditional Animation
```tsx
import { useAnimation } from '@/lib/utils/animations'

function Component() {
  const { className, shouldAnimate } = useAnimation('fadeIn')
  
  return <div className={className}>...</div>
}
```

### Scroll Triggered
```tsx
import { useInViewAnimation } from '@/lib/utils/animations'

function Component() {
  const { ref, isVisible } = useInViewAnimation()
  
  return (
    <div 
      ref={ref} 
      className={isVisible ? 'animate-fade-in-up' : 'opacity-0'}
    >
      Animates when scrolled into view
    </div>
  )
}
```

---

## 🧩 Component Patterns

### Dropdown Menu Pattern
```tsx
const [isOpen, setIsOpen] = useState(false)

<div className="relative">
  <button
    onClick={() => setIsOpen(!isOpen)}
    aria-expanded={isOpen}
    aria-haspopup="true"
    className="focus-ring"
  >
    Menu
  </button>
  
  {isOpen && (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40"
        onClick={() => setIsOpen(false)}
        aria-hidden="true"
      />
      
      {/* Menu */}
      <div
        className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-xl z-50 animate-fade-in-up"
        role="dialog"
        aria-modal="true"
      >
        {/* Menu items */}
      </div>
    </>
  )}
</div>
```

### Mobile Sidebar Pattern
```tsx
const [sidebarOpen, setSidebarOpen] = useState(false)

<>
  {/* Backdrop */}
  {sidebarOpen && (
    <div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden animate-fade-in"
      onClick={() => setSidebarOpen(false)}
      aria-hidden="true"
    />
  )}
  
  {/* Sidebar */}
  <aside
    className={`
      fixed lg:sticky top-0 left-0 h-screen bg-white z-50
      transition-all duration-300 ease-in-out
      ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
    `}
    role="navigation"
    aria-label="Sidebar"
  >
    {/* Sidebar content */}
  </aside>
</>
```

### Loading State Pattern
```tsx
import { CardSkeleton } from '@/components/ui/skeleton-loaders'

function Component() {
  const { data, isLoading } = useData()
  
  if (isLoading) {
    return <CardSkeleton />
  }
  
  return <Card data={data} />
}
```

---

## 🎯 Common Utility Classes

### Spacing
```css
/* Container padding */
.container-padding { @apply px-4 sm:px-6 lg:px-8; }

/* Section spacing */
.section-spacing { @apply py-8 sm:py-12 lg:py-16; }
```

### Typography
```css
/* Responsive text */
.text-responsive-sm { @apply text-sm sm:text-base; }
.text-responsive-md { @apply text-base sm:text-lg lg:text-xl; }
.text-responsive-lg { @apply text-xl sm:text-2xl lg:text-3xl; }
```

### Layout
```css
/* Centered container */
.container-center { 
  @apply max-w-7xl mx-auto px-4 sm:px-6 lg:px-8; 
}

/* Full height */
.min-h-screen-safe { 
  @apply min-h-screen pb-safe-bottom; 
}
```

---

## 🔍 Testing Checklist

### Quick Manual Tests

```bash
# Keyboard Navigation
- Tab through all elements
- Shift+Tab reverse navigation
- Enter/Space activate buttons
- Escape closes modals
- Arrow keys navigate menus

# Screen Sizes
- 320px (iPhone SE)
- 768px (iPad)
- 1024px (Desktop)
- 1920px (Large Desktop)

# Accessibility
- Turn on screen reader
- Navigate with keyboard only
- Check color contrast
- Verify ARIA labels
- Test focus indicators

# Interactions
- All hover states work
- Touch targets ≥ 44px
- Animations smooth
- No layout shift
- Loading states show
```

---

## 📖 Component API Quick Reference

### ResponsiveTable Props
```tsx
interface ResponsiveTableProps {
  data: any[]                           // Required
  columns: ResponsiveTableColumn[]      // Required
  keyExtractor?: (row, index) => string
  isLoading?: boolean
  emptyMessage?: string
  className?: string
  hoverable?: boolean                   // Default: true
  striped?: boolean                     // Default: false
  mobileBreakpoint?: 'sm'|'md'|'lg'     // Default: 'md'
  renderMobileCard?: (row, index) => ReactNode
  onSort?: (key: string) => void
  sortKey?: string
  sortDirection?: 'asc'|'desc'
}

interface ResponsiveTableColumn {
  label: string                         // Required
  key: string                           // Required
  render?: (value, row, index) => ReactNode
  className?: string
  hideOnMobile?: boolean
  width?: string
  sortable?: boolean
}
```

### Enhanced Input Props
```tsx
import EnhancedInput from '@/components/ui/enhanced-input'

<EnhancedInput
  label="Email"
  type="email"
  error={errors.email}
  success={isValid}
  helperText="We'll never share your email"
  leftIcon={<Mail />}
  isLoading={isChecking}
  showCount
  maxLength={100}
/>
```

### Modal Props
```tsx
import { Modal } from '@/components/ui/modal'

<Modal
  isOpen={isOpen}
  onClose={handleClose}
  title="Confirm Action"
  description="Are you sure?"
  size="md"                    // sm|md|lg|xl|full
  showCloseButton={true}
  closeOnBackdropClick={true}
  closeOnEscape={true}
  footer={<>Footer content</>}
>
  Modal content
</Modal>
```

---

## 🛠️ Development Tips

### Debugging Responsive Design
```tsx
// Add this temporarily to see current breakpoint
<div className="fixed bottom-4 right-4 bg-black text-white p-2 rounded z-50">
  <span className="sm:hidden">XS</span>
  <span className="hidden sm:inline md:hidden">SM</span>
  <span className="hidden md:inline lg:hidden">MD</span>
  <span className="hidden lg:inline xl:hidden">LG</span>
  <span className="hidden xl:inline 2xl:hidden">XL</span>
  <span className="hidden 2xl:inline">2XL</span>
</div>
```

### Accessibility Debug
```tsx
// Add this to test screen reader announcements
import { useAnnouncer } from '@/lib/hooks/useAccessibility'

function Component() {
  const announcer = useAnnouncer()
  
  const handleAction = () => {
    // Do something
    announcer.announce('Action completed successfully')
  }
}
```

---

## 📚 References

- **Full Documentation**: `docs/UI_POLISH_GUIDE.md`
- **Implementation Summary**: `docs/RESPONSIVE_UI_POLISH_SUMMARY.md`
- **Migration Guide**: `docs/UI_MIGRATION_GUIDE.md`
- **Tailwind CSS**: https://tailwindcss.com/docs
- **WCAG Guidelines**: https://www.w3.org/WAI/WCAG21/quickref/
- **MDN ARIA**: https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA

---

**Quick Tip**: Use `focus-ring`, `touch-target`, and `card-hover` utility classes for consistent, accessible, and polished UIs across your application! 🎨✨
