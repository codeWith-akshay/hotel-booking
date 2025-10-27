# UI Migration Guide

## 🔄 Migrating Existing Components to New UI System

This guide helps you update existing components to use the new UI polish improvements.

---

## 📋 Migration Checklist

Before migrating a component, ensure you have:
- [ ] Read `docs/UI_POLISH_GUIDE.md`
- [ ] Familiarized with new hooks and utilities
- [ ] Tested the component after migration
- [ ] Verified accessibility with keyboard/screen reader
- [ ] Checked mobile responsiveness

---

## 🎯 Common Migration Patterns

### 1. Replace Standard Inputs with EnhancedInput

#### Before:
```tsx
<div>
  <label htmlFor="email">Email</label>
  <input
    id="email"
    type="email"
    className="border rounded px-4 py-2"
    {...register('email')}
  />
  {errors.email && (
    <span className="text-red-600">{errors.email.message}</span>
  )}
</div>
```

#### After:
```tsx
<EnhancedInput
  label="Email"
  type="email"
  error={errors.email?.message}
  leftIcon={<Mail className="h-4 w-4" />}
  {...register('email')}
/>
```

**Benefits:**
- ✅ Built-in error display
- ✅ Better accessibility (ARIA attributes)
- ✅ Icon support
- ✅ Loading states
- ✅ Password visibility toggle
- ✅ Character count

---

### 2. Replace Basic Modals with Accessible Modal

#### Before:
```tsx
{isOpen && (
  <div className="fixed inset-0 bg-black/50" onClick={onClose}>
    <div className="bg-white p-6 rounded-lg">
      <h2>{title}</h2>
      <button onClick={onClose}>×</button>
      {children}
    </div>
  </div>
)}
```

#### After:
```tsx
<Modal
  isOpen={isOpen}
  onClose={onClose}
  title={title}
  size="md"
  showCloseButton
  closeOnBackdropClick
  closeOnEscape
>
  {children}
</Modal>
```

**Benefits:**
- ✅ Focus trap
- ✅ Keyboard navigation
- ✅ Body scroll prevention
- ✅ Portal rendering
- ✅ Smooth animations
- ✅ Proper ARIA attributes

---

### 3. Replace Spinners with Skeleton Loaders

#### Before:
```tsx
{isLoading ? (
  <div className="flex justify-center">
    <div className="spinner" />
  </div>
) : (
  <BookingCard {...booking} />
)}
```

#### After:
```tsx
{isLoading ? (
  <BookingCardSkeleton />
) : (
  <BookingCard {...booking} />
)}
```

**Benefits:**
- ✅ Better perceived performance
- ✅ Layout preservation (no layout shift)
- ✅ Professional appearance
- ✅ Respects reduced motion

---

### 4. Replace Alert Dialogs with ConfirmDialog

#### Before:
```tsx
const handleDelete = () => {
  if (confirm('Are you sure you want to delete this?')) {
    deleteItem();
  }
};
```

#### After:
```tsx
const [showConfirm, setShowConfirm] = useState(false);

<ConfirmDialog
  isOpen={showConfirm}
  onClose={() => setShowConfirm(false)}
  onConfirm={deleteItem}
  title="Delete Item"
  description="Are you sure you want to delete this item? This action cannot be undone."
  variant="destructive"
  confirmText="Delete"
  cancelText="Cancel"
/>
```

**Benefits:**
- ✅ Better UX (branded, styled)
- ✅ Accessible
- ✅ Async support
- ✅ Loading states

---

### 5. Add Toast Notifications

#### Before:
```tsx
// Using alert() or basic notifications
alert('Booking confirmed!');
```

#### After:
```tsx
// In component
const toast = useToast();

// Success
toast.success('Booking confirmed!');

// Error
toast.error('Payment failed', 'Please try again');

// With action
toast.addToast({
  type: 'info',
  title: 'Update available',
  action: {
    label: 'Update Now',
    onClick: handleUpdate
  }
});
```

**Benefits:**
- ✅ Non-blocking
- ✅ Better UX
- ✅ Accessible (live regions)
- ✅ Auto-dismiss
- ✅ Action buttons

---

### 6. Add Responsive Behavior

#### Before:
```tsx
// Fixed layout, not responsive
<div className="grid grid-cols-4 gap-4">
  {items.map(item => <Card key={item.id} {...item} />)}
</div>
```

#### After:
```tsx
const isMobile = useIsMobile();
const columns = useResponsiveValue({ xs: 1, sm: 2, md: 3, lg: 4 });

<div className={`grid gap-4`} style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
  {items.map(item => <Card key={item.id} {...item} />)}
</div>

// Or use Tailwind responsive classes
<div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
  {items.map(item => <Card key={item.id} {...item} />)}
</div>
```

**Benefits:**
- ✅ Works on all screen sizes
- ✅ Better mobile experience
- ✅ No horizontal scroll

---

### 7. Add Keyboard Navigation

#### Before:
```tsx
// Mouse-only interaction
<div onClick={handleClick}>
  {item.name}
</div>
```

#### After:
```tsx
// Accessible with keyboard
<button
  onClick={handleClick}
  className="touch-target focus-ring"
>
  {item.name}
</button>

// Or for custom keyboard handling
const { activeIndex, handleKeyDown } = useKeyboardNavigation(
  items.length,
  { onSelect: (i) => handleSelect(items[i]) }
);

<div onKeyDown={handleKeyDown} role="listbox">
  {items.map((item, i) => (
    <div
      key={item.id}
      role="option"
      aria-selected={i === activeIndex}
      tabIndex={0}
    >
      {item.name}
    </div>
  ))}
</div>
```

**Benefits:**
- ✅ Keyboard accessible
- ✅ Better for power users
- ✅ WCAG compliant

---

### 8. Add Loading States to Async Operations

#### Before:
```tsx
const [data, setData] = useState(null);

useEffect(() => {
  fetchData().then(setData);
}, []);

return data ? <Content data={data} /> : <div>Loading...</div>;
```

#### After:
```tsx
const [data, setData] = useState(null);
const [isLoading, setIsLoading] = useState(true);

useEffect(() => {
  setIsLoading(true);
  fetchData()
    .then(setData)
    .finally(() => setIsLoading(false));
}, []);

return isLoading ? <CardSkeleton /> : <Content data={data} />;
```

**Benefits:**
- ✅ Better perceived performance
- ✅ Professional loading states
- ✅ No layout shift

---

### 9. Add Smooth Animations

#### Before:
```tsx
// No animation
<div className={isVisible ? 'block' : 'hidden'}>
  Content
</div>
```

#### After:
```tsx
// With animation
<div className={isVisible ? 'animate-fade-in' : 'hidden'}>
  Content
</div>

// Or with scroll trigger
const { ref, isVisible } = useInViewAnimation();

<div
  ref={ref}
  className={isVisible ? 'animate-fade-in-up' : 'opacity-0'}
>
  Content appears when scrolled into view
</div>
```

**Benefits:**
- ✅ Polished feel
- ✅ Respects reduced motion
- ✅ Better UX

---

### 10. Improve Focus Management

#### Before:
```tsx
// Modal without focus management
const ModalComponent = ({ isOpen }) => {
  if (!isOpen) return null;
  
  return (
    <div>
      <h2>Modal Title</h2>
      <button onClick={close}>Close</button>
    </div>
  );
};
```

#### After:
```tsx
// Modal with focus trap
const ModalComponent = ({ isOpen, onClose }) => {
  const modalRef = useFocusTrap<HTMLDivElement>(isOpen);
  
  useEscapeKey(onClose, isOpen);
  
  if (!isOpen) return null;
  
  return (
    <div ref={modalRef}>
      <h2 id="modal-title">Modal Title</h2>
      <button onClick={onClose}>Close</button>
    </div>
  );
};
```

**Benefits:**
- ✅ Better keyboard UX
- ✅ WCAG compliant
- ✅ Professional behavior

---

## 🎯 Component-Specific Migrations

### Migrating Header Component

```tsx
// Before
export default function Header() {
  return (
    <header className="bg-white p-4">
      <nav>
        <a href="/dashboard">Dashboard</a>
        <a href="/profile">Profile</a>
      </nav>
    </header>
  );
}

// After
import { useIsMobile } from '@/lib/hooks/useResponsive';

export default function Header() {
  const isMobile = useIsMobile();
  const [menuOpen, setMenuOpen] = useState(false);
  
  return (
    <header className="bg-white p-4 safe-top">
      {isMobile ? (
        <>
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="touch-target focus-ring"
            aria-label="Toggle menu"
            aria-expanded={menuOpen}
          >
            Menu
          </button>
          
          <Modal
            isOpen={menuOpen}
            onClose={() => setMenuOpen(false)}
            title="Navigation"
          >
            <nav role="navigation">
              <a href="/dashboard" className="focus-ring">Dashboard</a>
              <a href="/profile" className="focus-ring">Profile</a>
            </nav>
          </Modal>
        </>
      ) : (
        <nav role="navigation">
          <a href="/dashboard" className="focus-ring">Dashboard</a>
          <a href="/profile" className="focus-ring">Profile</a>
        </nav>
      )}
    </header>
  );
}
```

---

### Migrating Form Components

```tsx
// Before
<form onSubmit={handleSubmit}>
  <input name="name" />
  <input type="email" name="email" />
  <button type="submit">Submit</button>
</form>

// After
const toast = useToast();

<form onSubmit={async (e) => {
  e.preventDefault();
  try {
    await handleSubmit();
    toast.success('Form submitted!');
  } catch (error) {
    toast.error('Submission failed', error.message);
  }
}}>
  <EnhancedInput
    label="Name"
    name="name"
    leftIcon={<User className="h-4 w-4" />}
    error={errors.name}
    required
  />
  
  <EnhancedInput
    label="Email"
    type="email"
    name="email"
    leftIcon={<Mail className="h-4 w-4" />}
    error={errors.email}
    isLoading={isCheckingEmail}
    required
  />
  
  <button
    type="submit"
    className="touch-target focus-ring bg-blue-600 text-white rounded-lg"
    disabled={isSubmitting}
  >
    {isSubmitting ? 'Submitting...' : 'Submit'}
  </button>
</form>
```

---

### Migrating Card Components

```tsx
// Before
<div className="border rounded p-4">
  <h3>{title}</h3>
  <p>{description}</p>
  <button onClick={handleAction}>Action</button>
</div>

// After
<div className="card-hover border rounded-lg p-4 animate-fade-in-up">
  <h3 className="text-lg font-semibold">{title}</h3>
  <p className="text-gray-600 dark:text-gray-400 mt-2">{description}</p>
  <button
    onClick={handleAction}
    className="mt-4 touch-target focus-ring bg-blue-600 text-white rounded-lg"
  >
    Action
  </button>
</div>
```

---

## 🧪 Testing After Migration

### 1. Accessibility Test
```bash
# Use keyboard only
- Tab through all interactive elements
- Enter/Space to activate
- Escape to close modals

# Test with screen reader
- Enable NVDA/JAWS/VoiceOver
- Navigate with screen reader keys
- Verify all content is announced
```

### 2. Responsive Test
```bash
# Test breakpoints
- 320px (small mobile)
- 375px (iPhone SE)
- 768px (tablet)
- 1024px (desktop)
- 1920px (large desktop)

# Check for
- No horizontal scroll
- Touch targets >= 44x44px
- Readable text at all sizes
```

### 3. Performance Test
```bash
# Lighthouse audit
pnpm build
pnpm start
# Run Lighthouse in Chrome DevTools

# Check for
- Accessibility score 100
- Best practices 100
- Performance > 90
```

---

## ⚠️ Common Pitfalls

### 1. Hydration Mismatches
```tsx
// ❌ Wrong - causes hydration error
function Component() {
  const isMobile = useIsMobile();
  return <div>{isMobile ? 'Mobile' : 'Desktop'}</div>;
}

// ✅ Correct - handles SSR
function Component() {
  const [mounted, setMounted] = useState(false);
  const isMobile = useIsMobile();
  
  useEffect(() => setMounted(true), []);
  
  if (!mounted) return <Skeleton />;
  return <div>{isMobile ? 'Mobile' : 'Desktop'}</div>;
}
```

### 2. Missing ARIA Labels
```tsx
// ❌ Wrong - no label
<button onClick={handleClose}>
  <X className="h-4 w-4" />
</button>

// ✅ Correct - with label
<button
  onClick={handleClose}
  aria-label="Close modal"
>
  <X className="h-4 w-4" aria-hidden="true" />
</button>
```

### 3. Not Using Touch Targets
```tsx
// ❌ Wrong - too small
<button className="p-1">X</button>

// ✅ Correct - 44x44px minimum
<button className="touch-target">X</button>
```

---

## 📚 Additional Resources

- **Full Documentation**: `docs/UI_POLISH_GUIDE.md`
- **Quick Reference**: `docs/UI_POLISH_QUICK_REFERENCE.md`
- **Implementation Summary**: `docs/UI_POLISH_IMPLEMENTATION_SUMMARY.md`

---

## ✅ Migration Checklist

For each component:
- [ ] Replace inputs with EnhancedInput
- [ ] Replace modals with Modal component
- [ ] Replace spinners with skeleton loaders
- [ ] Add toast notifications for feedback
- [ ] Add responsive behavior
- [ ] Add keyboard navigation
- [ ] Add loading states
- [ ] Add smooth animations
- [ ] Improve focus management
- [ ] Test accessibility
- [ ] Test responsiveness
- [ ] Update documentation

---

**Happy Migrating! 🚀**
