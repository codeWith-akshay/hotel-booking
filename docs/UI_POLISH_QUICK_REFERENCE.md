# UI Polish Quick Reference

## 🚀 Quick Start

### Import New Components

```tsx
// Accessibility Hooks
import {
  useFocusTrap,
  useEscapeKey,
  useAnnouncer,
  usePrefersReducedMotion
} from '@/lib/hooks/useAccessibility';

// Responsive Hooks
import {
  useIsMobile,
  useBreakpoint,
  useViewportSize,
  useResponsiveValue
} from '@/lib/hooks/useResponsive';

// Components
import AccessibleBookingCalendar from '@/components/Calendar/AccessibleBookingCalendar';
import { Modal, ConfirmDialog } from '@/components/ui/modal';
import EnhancedInput from '@/components/ui/enhanced-input';
import { ToastProvider, useToast } from '@/components/ui/enhanced-toast';
import {
  Skeleton,
  TextSkeleton,
  CardSkeleton,
  TableSkeleton,
  BookingCardSkeleton
} from '@/components/ui/skeleton-loaders';
```

---

## 📱 Responsive Design

### Quick Checks
```tsx
const isMobile = useIsMobile();        // < 768px
const isTablet = useIsTablet();        // 768px - 1024px
const isDesktop = useIsDesktop();      // >= 1024px
const breakpoint = useBreakpoint();    // Current breakpoint name
```

### Responsive Values
```tsx
// Show different number of columns based on screen size
const columns = useResponsiveValue({
  xs: 1,
  sm: 2,
  md: 3,
  lg: 4
});
```

### Responsive Text
```tsx
<h1 className="text-responsive-2xl">Heading</h1>
<p className="text-responsive-base">Body text</p>
```

---

## ♿ Accessibility

### Focus Management
```tsx
// Trap focus in modal
const modalRef = useFocusTrap<HTMLDivElement>(isOpen);

// Handle escape key
useEscapeKey(() => closeModal(), isModalOpen);
```

### Screen Reader Announcements
```tsx
const announce = useAnnouncer();

// Success message
announce('Booking confirmed', 'polite');

// Error message
announce('Payment failed', 'assertive');
```

### Reduced Motion
```tsx
const prefersReducedMotion = usePrefersReducedMotion();

// Conditionally apply animations
const transition = prefersReducedMotion 
  ? 'none' 
  : 'all 0.3s ease-in-out';
```

### Keyboard Navigation
```tsx
const { activeIndex, handleKeyDown } = useKeyboardNavigation(
  items.length,
  {
    onSelect: (index) => handleSelect(items[index]),
    orientation: 'vertical', // or 'horizontal' or 'grid'
    loop: true
  }
);
```

---

## 🎨 Common Patterns

### Loading States

#### Skeleton Loaders
```tsx
// During loading
{isLoading ? (
  <BookingCardSkeleton />
) : (
  <BookingCard data={booking} />
)}

// Multiple cards
{isLoading ? (
  Array.from({ length: 3 }).map((_, i) => (
    <CardSkeleton key={i} showImage lines={3} />
  ))
) : (
  bookings.map(b => <BookingCard key={b.id} {...b} />)
)}
```

#### Input Loading
```tsx
<EnhancedInput
  label="Email"
  isLoading={isCheckingAvailability}
  helperText="Checking availability..."
/>
```

### Form Validation

```tsx
<EnhancedInput
  label="Email"
  type="email"
  error={errors.email}
  success={!errors.email && touched.email ? "Valid email" : undefined}
  helperText="We'll never share your email"
  required
/>
```

### Modals

#### Basic Modal
```tsx
<Modal
  isOpen={isOpen}
  onClose={onClose}
  title="Booking Details"
  size="lg"
>
  <BookingDetails />
</Modal>
```

#### Confirm Dialog
```tsx
<ConfirmDialog
  isOpen={showDeleteConfirm}
  onClose={() => setShowDeleteConfirm(false)}
  onConfirm={handleDelete}
  title="Delete Booking"
  description="This action cannot be undone."
  variant="destructive"
  confirmText="Delete"
/>
```

### Toast Notifications

```tsx
const toast = useToast();

// Success
toast.success('Booking confirmed!');

// Error with description
toast.error('Payment failed', 'Please try again or contact support');

// With action button
toast.addToast({
  type: 'info',
  title: 'New update available',
  description: 'Version 2.0 is ready',
  action: {
    label: 'Update Now',
    onClick: () => window.location.reload()
  }
});
```

---

## 🎯 Utility Classes

### Touch Targets (WCAG AA)
```tsx
<button className="touch-target">
  {/* Minimum 44x44px */}
</button>
```

### Focus Rings
```tsx
<button className="focus-ring">
  {/* Visible keyboard focus */}
</button>
```

### Animations
```tsx
<div className="animate-fade-in">Fades in</div>
<div className="animate-fade-in-up">Fades in from below</div>
<div className="animate-scale-in">Scales in</div>
<div className="animate-slide-in-right">Slides in from right</div>
```

### Container Padding
```tsx
<div className="container-padding">
  {/* Responsive px-4 sm:px-6 lg:px-8 */}
</div>
```

### Glassmorphism
```tsx
<div className="glass">
  {/* Frosted glass effect */}
</div>
```

### Safe Areas (Mobile Notch)
```tsx
<div className="safe-top safe-bottom">
  {/* Respects device safe areas */}
</div>
```

---

## 📐 Layout Patterns

### Responsive Grid
```tsx
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
  {items.map(item => <Card key={item.id} {...item} />)}
</div>
```

### Centered Container
```tsx
<div className="container mx-auto container-padding max-w-7xl">
  {/* Centered content with responsive padding */}
</div>
```

### Flex Layout
```tsx
<div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
  <div>Left content</div>
  <div>Right content</div>
</div>
```

---

## 🎨 Color System

### Button Variants
```tsx
// Primary
<button className="bg-blue-600 hover:bg-blue-700 text-white">Primary</button>

// Success
<button className="bg-green-600 hover:bg-green-700 text-white">Success</button>

// Danger
<button className="bg-red-600 hover:bg-red-700 text-white">Danger</button>

// Secondary
<button className="bg-gray-200 hover:bg-gray-300 text-gray-900">Secondary</button>
```

### Badge Colors
```tsx
<span className="bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300">
  Success
</span>
<span className="bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300">
  Error
</span>
<span className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300">
  Warning
</span>
<span className="bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300">
  Info
</span>
```

---

## 🚦 Status Indicators

### With Icons
```tsx
import { CheckCircle2, XCircle, AlertCircle, Info } from 'lucide-react';

<div className="flex items-center gap-2">
  <CheckCircle2 className="h-4 w-4 text-green-600" />
  <span>Available</span>
</div>

<div className="flex items-center gap-2">
  <XCircle className="h-4 w-4 text-red-600" />
  <span>Unavailable</span>
</div>

<div className="flex items-center gap-2">
  <AlertCircle className="h-4 w-4 text-yellow-600" />
  <span>Limited</span>
</div>

<div className="flex items-center gap-2">
  <Info className="h-4 w-4 text-blue-600" />
  <span>Information</span>
</div>
```

---

## 📝 Form Examples

### Complete Form
```tsx
<form onSubmit={handleSubmit} className="space-y-6">
  <EnhancedInput
    label="Full Name"
    type="text"
    placeholder="John Doe"
    leftIcon={<User className="h-4 w-4" />}
    error={errors.name}
    required
  />
  
  <EnhancedInput
    label="Email Address"
    type="email"
    placeholder="you@example.com"
    leftIcon={<Mail className="h-4 w-4" />}
    error={errors.email}
    isLoading={isCheckingEmail}
    success={emailAvailable ? "Email available" : undefined}
    required
  />
  
  <EnhancedInput
    label="Password"
    type="password"
    placeholder="••••••••"
    leftIcon={<Lock className="h-4 w-4" />}
    error={errors.password}
    helperText="Must be at least 8 characters"
    showCount
    maxLength={50}
    required
  />
  
  <button
    type="submit"
    className="w-full touch-target bg-blue-600 hover:bg-blue-700 text-white rounded-lg focus-ring"
    disabled={isSubmitting}
  >
    {isSubmitting ? 'Creating Account...' : 'Create Account'}
  </button>
</form>
```

---

## 🎭 Animation Examples

### Page Transitions
```tsx
import { useInViewAnimation } from '@/lib/utils/animations';

function Section() {
  const { ref, isVisible } = useInViewAnimation();
  
  return (
    <section
      ref={ref}
      className={isVisible ? 'animate-fade-in-up' : 'opacity-0'}
    >
      Content appears when scrolled into view
    </section>
  );
}
```

### Staggered List
```tsx
{items.map((item, index) => (
  <div
    key={item.id}
    className="animate-fade-in-up"
    style={{
      animationDelay: `${index * 50}ms`
    }}
  >
    {item.content}
  </div>
))}
```

---

## 🧪 Testing Checklist

### Quick Accessibility Tests

```bash
# 1. Keyboard Navigation
- [ ] Tab through all interactive elements
- [ ] Enter/Space activates buttons
- [ ] Escape closes modals
- [ ] Arrow keys work in calendar

# 2. Screen Reader
- [ ] All images have alt text
- [ ] Form inputs have labels
- [ ] Error messages are announced
- [ ] Loading states are announced

# 3. Visual
- [ ] Text contrast passes WCAG AA
- [ ] Focus indicators are visible
- [ ] Touch targets are 44x44px minimum
- [ ] Works at 200% zoom

# 4. Mobile
- [ ] Responsive on all breakpoints
- [ ] Touch gestures work
- [ ] No horizontal scroll
- [ ] Safe areas respected (notch/home indicator)
```

---

## 🐛 Common Issues & Fixes

### Hydration Mismatch
```tsx
// ❌ Wrong (causes hydration error)
const isMobile = useIsMobile();

// ✅ Correct (handles SSR)
const [mounted, setMounted] = useState(false);
useEffect(() => setMounted(true), []);
const isMobile = useIsMobile();

if (!mounted) return <Skeleton />;
```

### Modal Body Scroll
```tsx
// Automatically handled by Modal component
<Modal preventScroll={true} {...props} />
```

### Focus Management
```tsx
// Automatically handled by useFocusTrap hook
const modalRef = useFocusTrap<HTMLDivElement>(isOpen);
```

---

## 📦 Component Checklist

When creating a new component:

- [ ] Add proper TypeScript types
- [ ] Include ARIA labels and roles
- [ ] Support keyboard navigation
- [ ] Handle loading states
- [ ] Include error states
- [ ] Respect reduced motion
- [ ] Test on mobile
- [ ] Support dark mode
- [ ] Add proper focus styles
- [ ] Document with JSDoc comments

---

## 🎯 Performance Tips

1. **Lazy Load Heavy Components**
```tsx
const Calendar = dynamic(() => import('@/components/Calendar'));
```

2. **Memoize Expensive Computations**
```tsx
const filteredItems = useMemo(
  () => items.filter(item => item.active),
  [items]
);
```

3. **Debounce Search Inputs**
```tsx
const debouncedSearch = useMemo(
  () => debounce(handleSearch, 300),
  []
);
```

4. **Use Skeleton Loaders**
```tsx
// Better UX than spinners
{isLoading ? <CardSkeleton /> : <Card {...data} />}
```

---

## 📚 Resources

- Full Guide: `docs/UI_POLISH_GUIDE.md`
- WCAG Guidelines: [https://www.w3.org/WAI/WCAG21/quickref/](https://www.w3.org/WAI/WCAG21/quickref/)
- Tailwind Docs: [https://tailwindcss.com](https://tailwindcss.com)
- Lucide Icons: [https://lucide.dev](https://lucide.dev)

---

**Happy Coding! 🚀**
