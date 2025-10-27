# ==========================================
# ACCESSIBILITY TESTING & AUDITS GUIDE
# ==========================================

This document covers accessibility testing tools and workflows for the hotel booking system.

## Table of Contents

1. [Overview](#overview)
2. [Development-Time Testing](#development-time-testing)
3. [Manual Testing](#manual-testing)
4. [Lighthouse Audits](#lighthouse-audits)
5. [Keyboard Navigation Testing](#keyboard-navigation-testing)
6. [Screen Reader Testing](#screen-reader-testing)
7. [Color Contrast Verification](#color-contrast-verification)
8. [Automated CI/CD Testing](#automated-cicd-testing)

---

## Overview

Our accessibility testing strategy includes:

- **@axe-core/react**: Real-time accessibility checks during development
- **Lighthouse**: Comprehensive audits for production readiness
- **Manual keyboard testing**: Ensuring full keyboard navigation
- **Screen reader testing**: Verifying screen reader compatibility
- **Color contrast tools**: Ensuring WCAG AA compliance (4.5:1 minimum)

**Target Score**: Lighthouse Accessibility score ≥ 90

---

## Development-Time Testing

### Using @axe-core/react

The `AccessibilityChecker` component runs continuous accessibility checks in development mode.

#### Setup (Already Integrated)

```tsx
// src/app/layout.tsx
import { AccessibilityChecker } from '@/components/dev/AccessibilityChecker'

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        {/* Only loads in development mode */}
        {process.env.NODE_ENV === 'development' && <AccessibilityChecker />}
        {children}
      </body>
    </html>
  )
}
```

#### What It Does

- Automatically scans the page for WCAG 2.1 AA violations
- Reports issues to browser console with:
  - Violation description and impact level
  - WCAG tags (wcag2a, wcag2aa, wcag21a, wcag21aa)
  - Affected HTML elements
  - Fix suggestions and documentation links
- Runs checks after DOM changes (debounced by 1 second)

#### Reading Console Output

```
♿ Accessibility Checker Active
Checking for WCAG 2.1 AA violations...

⚠ 3 Accessibility Violations Found
  CRITICAL: Buttons must have discernible text
    Description: Ensures buttons have discernible text
    WCAG Tags: cat.name-role-value, wcag2a, wcag412
    Help URL: https://dequeuniversity.com/rules/axe/4.7/button-name
    Affected elements: 2
    
    Element 1
      HTML: <button class="icon-button"></button>
      Target: button.icon-button:nth-child(1)
      Failure summary: Fix any of: Element has no text, aria-label, or aria-labelledby
```

---

## Manual Testing

### Using the Manual Check Function

For testing specific components or interactions:

```tsx
import { runAccessibilityCheck } from '@/components/dev/AccessibilityChecker'

// Test a modal after opening
const handleOpenModal = () => {
  setModalOpen(true)
  setTimeout(() => runAccessibilityCheck(), 100)
}

// Test after dynamic content loads
useEffect(() => {
  if (dataLoaded) {
    runAccessibilityCheck()
  }
}, [dataLoaded])
```

### Using the Hook

```tsx
import { useAccessibilityCheck } from '@/components/dev/AccessibilityChecker'

function BookingForm() {
  const [step, setStep] = useState(1)
  
  // Re-check when step changes
  useAccessibilityCheck([step])
  
  return <div>...</div>
}
```

---

## Lighthouse Audits

### Installation

```bash
# Install Lighthouse CLI globally
npm install -g lighthouse

# Or use via npx (no installation needed)
npx lighthouse --help
```

### Running Audits

#### 1. Start Development Server

```bash
pnpm dev
```

#### 2. Run Lighthouse Audit

```bash
# Basic audit (all categories)
npx lighthouse http://localhost:3000 --view

# Accessibility-only audit
npx lighthouse http://localhost:3000 --only-categories=accessibility --view

# Generate JSON report for CI/CD
npx lighthouse http://localhost:3000 --only-categories=accessibility --output=json --output-path=./lighthouse-report.json

# Audit specific pages
npx lighthouse http://localhost:3000/dashboard --view
npx lighthouse http://localhost:3000/bookings --view
npx lighthouse http://localhost:3000/profile --view
```

#### 3. Audit Multiple Pages (Script)

Create `scripts/lighthouse-audit.sh`:

```bash
#!/bin/bash

# Start dev server in background
pnpm dev &
SERVER_PID=$!

# Wait for server to start
sleep 5

# Pages to audit
PAGES=(
  "http://localhost:3000"
  "http://localhost:3000/dashboard"
  "http://localhost:3000/bookings"
  "http://localhost:3000/profile"
  "http://localhost:3000/admin/rooms"
)

# Create reports directory
mkdir -p lighthouse-reports

# Run audits
for PAGE in "${PAGES[@]}"
do
  PAGE_NAME=$(echo $PAGE | sed 's|http://localhost:3000||' | sed 's|/|-|g')
  if [ -z "$PAGE_NAME" ]; then
    PAGE_NAME="home"
  fi
  
  echo "Auditing: $PAGE"
  npx lighthouse "$PAGE" \
    --only-categories=accessibility \
    --output=html \
    --output=json \
    --output-path="./lighthouse-reports/$PAGE_NAME" \
    --chrome-flags="--headless"
done

# Kill dev server
kill $SERVER_PID

echo "Audits complete! Reports saved to lighthouse-reports/"
```

Make executable:
```bash
chmod +x scripts/lighthouse-audit.sh
```

Run:
```bash
./scripts/lighthouse-audit.sh
```

### Understanding Lighthouse Scores

- **90-100**: Excellent - Production ready
- **50-89**: Needs improvement - Address issues before launch
- **0-49**: Poor - Major accessibility barriers

### Common Lighthouse Issues

| Issue | Fix |
|-------|-----|
| Missing alt text on images | Add `alt="description"` to all `<img>` tags |
| Low color contrast | Use darker text or lighter backgrounds (4.5:1 minimum) |
| Missing form labels | Add `<label>` with `htmlFor` matching input `id` |
| Missing ARIA attributes | Add `aria-label` to icon buttons |
| Non-sequential heading levels | Use h1 → h2 → h3 in order (no skipping) |
| Links without discernible name | Add text content or `aria-label` |

---

## Keyboard Navigation Testing

### Manual Keyboard Testing Checklist

Test **every** interactive element with keyboard only (no mouse).

#### Navigation Keys

- **Tab**: Move forward through focusable elements
- **Shift + Tab**: Move backward
- **Enter**: Activate buttons/links
- **Space**: Toggle checkboxes, activate buttons
- **Arrow Keys**: Navigate dropdowns, radio groups, date pickers
- **Escape**: Close modals, dropdowns, tooltips
- **Home/End**: Jump to first/last item in lists

#### Testing Workflow

1. **Start at top of page** - Press Tab to move through elements
2. **Verify focus indicator** - Should see visible outline on focused element
3. **Test all interactive elements**:
   - [ ] Header navigation links
   - [ ] Sidebar menu items
   - [ ] Theme toggle button
   - [ ] Notification bell
   - [ ] Profile dropdown
   - [ ] Form inputs (text, date, select)
   - [ ] Submit buttons
   - [ ] Modal/dialog close buttons
   - [ ] Calendar date cells
   - [ ] Table sort buttons
   - [ ] Pagination controls

4. **Test modals/dialogs**:
   - [ ] Focus traps inside modal (Tab doesn't leave modal)
   - [ ] Escape key closes modal
   - [ ] Focus returns to trigger element after close

5. **Test dropdown menus**:
   - [ ] Enter/Space opens dropdown
   - [ ] Arrow keys navigate options
   - [ ] Enter selects option
   - [ ] Escape closes dropdown

6. **Test form validation**:
   - [ ] Error messages announced
   - [ ] Focus moves to first error field

#### Focus Management Rules

✅ **Do**:
- Show visible focus indicator (outline)
- Maintain logical tab order (top → bottom, left → right)
- Trap focus inside modals
- Return focus after closing modals

❌ **Don't**:
- Remove focus outline (`:focus { outline: none }`)
- Use positive `tabindex` values (e.g., `tabindex="5"`)
- Let focus escape modals
- Auto-focus random elements on page load

---

## Screen Reader Testing

### Recommended Screen Readers

- **Windows**: NVDA (free) or JAWS (paid)
- **macOS**: VoiceOver (built-in)
- **Linux**: Orca (free)
- **Mobile**: TalkBack (Android), VoiceOver (iOS)

### VoiceOver Testing (macOS)

#### Enable VoiceOver

```bash
# Start VoiceOver
Cmd + F5

# Stop VoiceOver
Cmd + F5 (again)
```

#### Basic Commands

| Action | Command |
|--------|---------|
| Navigate next | VO + Right Arrow |
| Navigate previous | VO + Left Arrow |
| Activate element | VO + Space |
| Read current element | VO + A |
| Stop reading | Control |
| Navigate by headings | VO + Cmd + H |
| Navigate by links | VO + Cmd + L |
| Navigate by forms | VO + Cmd + J |

*(VO = Control + Option)*

#### Testing Checklist

- [ ] All images have descriptive alt text
- [ ] Form inputs announce label and type
- [ ] Buttons announce label and role
- [ ] Links announce destination
- [ ] Headings follow logical structure (h1 → h2 → h3)
- [ ] Loading states announce "Loading..."
- [ ] Error messages announce clearly
- [ ] Modal dialogs announce title and trap focus
- [ ] Tables announce headers correctly
- [ ] Status messages announce (live regions)

### NVDA Testing (Windows)

#### Install NVDA

Download from: https://www.nvaccess.org/download/

#### Basic Commands

| Action | Command |
|--------|---------|
| Navigate next | Down Arrow |
| Navigate previous | Up Arrow |
| Activate element | Enter |
| Read current line | Insert + Up Arrow |
| Stop reading | Control |
| Navigate by headings | H |
| Navigate by links | K |
| Navigate by forms | F |

---

## Color Contrast Verification

### Target Ratios (WCAG AA)

- **Normal text** (< 18pt or < 14pt bold): 4.5:1 minimum
- **Large text** (≥ 18pt or ≥ 14pt bold): 3:1 minimum
- **UI components**: 3:1 minimum (icons, borders, focus indicators)

### Browser DevTools

#### Chrome DevTools

1. Open DevTools (F12)
2. Select element with text
3. Look for contrast ratio in Styles panel:
   - ✅ Green checkmark = Passes
   - ⚠️ Orange warning = Fails

#### Firefox DevTools

1. Open DevTools (F12)
2. Go to Accessibility tab
3. Select "Check for issues" → "Contrast"
4. All failing elements highlighted

### Online Tools

- **WebAIM Contrast Checker**: https://webaim.org/resources/contrastchecker/
- **Coolors Contrast Checker**: https://coolors.co/contrast-checker
- **Color Review**: https://color.review/

### Common Color Issues in Our App

| Element | Light Mode | Dark Mode | Ratio |
|---------|------------|-----------|-------|
| Body text | #0f172a on #ffffff | #f8fafc on #0f172a | ✅ 15.4:1 |
| Muted text | #64748b on #ffffff | #94a3b8 on #0f172a | ✅ 4.6:1 |
| Primary button | #ffffff on #2563eb | #0f172a on #60a5fa | ✅ 8.5:1 |
| Border | #e2e8f0 on #ffffff | #334155 on #0f172a | ⚠️ 1.2:1 (Non-text OK) |

---

## Automated CI/CD Testing

### GitHub Actions Workflow

Create `.github/workflows/accessibility.yml`:

```yaml
name: Accessibility Tests

on:
  pull_request:
    branches: [main, develop]
  push:
    branches: [main]

jobs:
  lighthouse:
    name: Lighthouse Accessibility Audit
    runs-on: ubuntu-latest
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '20'
      
      - name: Install pnpm
        uses: pnpm/action-setup@v2
        with:
          version: 9
      
      - name: Install dependencies
        run: pnpm install
      
      - name: Build app
        run: pnpm build
      
      - name: Start server
        run: pnpm start &
        env:
          PORT: 3000
      
      - name: Wait for server
        run: npx wait-on http://localhost:3000
      
      - name: Run Lighthouse
        uses: treosh/lighthouse-ci-action@v9
        with:
          urls: |
            http://localhost:3000
            http://localhost:3000/dashboard
            http://localhost:3000/bookings
          uploadArtifacts: true
          temporaryPublicStorage: true
      
      - name: Check Lighthouse scores
        run: |
          # Fail if accessibility score < 90
          SCORE=$(jq '.categories.accessibility.score * 100' .lighthouseci/lhr-*.json)
          if [ "$SCORE" -lt 90 ]; then
            echo "Accessibility score $SCORE is below 90!"
            exit 1
          fi

  axe:
    name: Axe Accessibility Tests
    runs-on: ubuntu-latest
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '20'
      
      - name: Install pnpm
        uses: pnpm/action-setup@v2
        with:
          version: 9
      
      - name: Install dependencies
        run: pnpm install
      
      - name: Run Cypress with Axe
        run: pnpm cypress run --spec "cypress/e2e/accessibility.cy.ts"
```

### Cypress + Axe Integration

Create `cypress/e2e/accessibility.cy.ts`:

```typescript
/// <reference types="cypress" />

describe('Accessibility Tests', () => {
  beforeEach(() => {
    cy.visit('/')
    cy.injectAxe() // Add axe-core
  })

  it('Homepage should have no accessibility violations', () => {
    cy.checkA11y()
  })

  it('Dashboard should have no violations', () => {
    cy.visit('/dashboard')
    cy.checkA11y()
  })

  it('Booking form should have no violations', () => {
    cy.visit('/bookings/new')
    cy.checkA11y()
  })

  it('Modal dialogs should be accessible', () => {
    cy.get('[data-testid="open-modal"]').click()
    cy.checkA11y('.modal', {
      rules: {
        'focus-trap': { enabled: true }
      }
    })
  })
})
```

Install Cypress Axe:

```bash
pnpm add -D cypress-axe axe-core
```

Add to `cypress/support/commands.ts`:

```typescript
import 'cypress-axe'
```

---

## Quick Reference: Accessibility Checklist

### Before Every Release

- [ ] Run Lighthouse audits on all major pages
- [ ] All scores ≥ 90
- [ ] No critical @axe-core violations
- [ ] Keyboard navigation tested on all forms
- [ ] Screen reader tested on new features
- [ ] Color contrast verified with DevTools
- [ ] Focus indicators visible everywhere
- [ ] Loading states announce to screen readers
- [ ] Error messages announced and focused
- [ ] Modals trap focus correctly
- [ ] Skip-to-content link working

### Component Checklist

When creating new components:

- [ ] All interactive elements keyboard accessible
- [ ] Focus indicators visible (blue outline)
- [ ] ARIA labels on icon buttons
- [ ] Semantic HTML (button, nav, main, header, footer)
- [ ] Color contrast ≥ 4.5:1 for text
- [ ] Loading states with aria-live="polite"
- [ ] Error states with role="alert"
- [ ] Form labels with htmlFor
- [ ] Images with alt text
- [ ] Headings in correct order (h1 → h2 → h3)

---

## Resources

### Documentation

- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [MDN Accessibility Guide](https://developer.mozilla.org/en-US/docs/Web/Accessibility)
- [WebAIM Resources](https://webaim.org/resources/)
- [A11y Project](https://www.a11yproject.com/)

### Tools

- [@axe-core/react](https://github.com/dequelabs/axe-core-npm/tree/develop/packages/react)
- [Lighthouse CLI](https://github.com/GoogleChrome/lighthouse)
- [axe DevTools Browser Extension](https://www.deque.com/axe/devtools/)
- [WAVE Browser Extension](https://wave.webaim.org/extension/)

### Testing

- [NVDA Screen Reader](https://www.nvaccess.org/)
- [Cypress Axe](https://github.com/component-driven/cypress-axe)
- [Jest Axe](https://github.com/nickcolley/jest-axe)

---

## Support

For accessibility questions or issues:

1. Check console output from @axe-core/react
2. Run Lighthouse audit for detailed report
3. Test with keyboard navigation
4. Consult WCAG 2.1 guidelines
5. Use browser DevTools contrast checker

**Target**: WCAG 2.1 Level AA compliance with Lighthouse score ≥ 90.
