# Testing Quick Reference Guide

## 🚀 Running Tests

### All Tests
```bash
# Run all test suites (unit + integration + E2E)
pnpm test:all
```

### Unit Tests
```bash
# Run all unit tests
pnpm test:unit

# Run specific unit test file
pnpm test booking-validation.test.ts

# Run unit tests in watch mode
pnpm test:watch
```

### Integration Tests
```bash
# Run all integration tests
pnpm test:integration

# Run specific integration test
pnpm test booking-flow.test.ts
```

### E2E Tests (Cypress)
```bash
# Open Cypress interactive mode
pnpm cypress

# Run E2E tests headless
pnpm e2e:headless

# Run specific Cypress spec
pnpm cypress run --spec "cypress/e2e/booking.cy.ts"

# Run E2E with specific browser
pnpm cypress run --browser chrome
pnpm cypress run --browser firefox
```

### Coverage
```bash
# Generate coverage report
pnpm test:coverage

# View coverage in browser
open coverage/lcov-report/index.html  # macOS
start coverage/lcov-report/index.html # Windows
```

### CI Mode
```bash
# Run tests in CI mode (no watch, single run)
pnpm test:ci
```

## 🎯 Common Test Commands

### Debug Tests
```bash
# Run with verbose output
pnpm test --verbose

# Run specific test by name
pnpm test -- --testNamePattern="should create booking"

# Run tests from specific describe block
pnpm test -- --testNamePattern="Booking Flow"
```

### Test Filtering
```bash
# Run only changed tests
pnpm test --onlyChanged

# Run tests related to changed files
pnpm test --changedSince=main

# Skip specific tests
pnpm test -- --testPathIgnorePatterns="/integration/"
```

## 📊 Test Output

### Success
```
✓ Booking validation tests (123 ms)
  ✓ should validate valid booking input (12 ms)
  ✓ should reject invalid dates (8 ms)
```

### Failure
```
✗ Booking validation tests (145 ms)
  ✗ should validate booking (15 ms)
    Expected: true
    Received: false
```

## 🐛 Debugging

### Debug in VS Code
1. Set breakpoint in test file
2. Run "Jest: Debug" from command palette
3. Or use launch.json configuration:
```json
{
  "type": "node",
  "request": "launch",
  "name": "Jest Debug",
  "program": "${workspaceFolder}/node_modules/.bin/jest",
  "args": ["--runInBand", "--no-cache"],
  "console": "integratedTerminal"
}
```

### Debug Cypress
1. Open Cypress: `pnpm cypress`
2. Click on test to run
3. Use browser DevTools to debug
4. Add `cy.pause()` in test to pause execution

## 📝 Writing Tests

### Unit Test Template
```typescript
describe('Feature Name', () => {
  test('should do something', () => {
    // Arrange
    const input = { /* test data */ }

    // Act
    const result = functionToTest(input)

    // Assert
    expect(result).toBe(expectedValue)
  })
})
```

### Integration Test Template
```typescript
describe('API Endpoint', () => {
  let mockPrisma: any

  beforeEach(() => {
    mockPrisma = createMockPrismaClient()
  })

  test('should handle request', async () => {
    const response = await endpoint(request)
    expect(response.success).toBe(true)
  })
})
```

### Cypress Test Template
```typescript
describe('User Flow', () => {
  beforeEach(() => {
    cy.visit('/page')
  })

  it('should complete action', () => {
    cy.get('[data-testid="button"]').click()
    cy.contains('Success').should('be.visible')
  })
})
```

## 🔧 Test Utilities

### Mock Data Generators
```typescript
import { generateTestUser, generateTestBooking } from '@/tests/helpers/test-utils'

const user = generateTestUser()
const booking = generateTestBooking({ userId: user.id })
```

### Mock Payment Provider
```typescript
import { mockPaymentProvider } from '@/tests/mocks/payment-provider.mock'

// Successful payment
const payment = await mockPaymentProvider.createPaymentIntent({
  amount: 20000,
  currency: 'INR'
})

// Failed payment
mockPaymentProvider.setFailureMode(true, 'Card declined')
```

### Mock Prisma Client
```typescript
import { createMockPrismaClient } from '@/tests/mocks/prisma.mock'

const mockPrisma = createMockPrismaClient()
const user = await mockPrisma.user.create({ data: { /* ... */ } })
```

## 📚 Resources

- **Jest Docs**: https://jestjs.io/docs/getting-started
- **Cypress Docs**: https://docs.cypress.io/
- **Testing Library**: https://testing-library.com/
- **Test Best Practices**: https://github.com/goldbergyoni/javascript-testing-best-practices

## ⚙️ Configuration Files

- `jest.config.js` - Jest configuration
- `jest.setup.js` - Jest global setup
- `cypress.config.ts` - Cypress configuration
- `cypress/support/commands.ts` - Custom Cypress commands
- `.github/workflows/ci.yml` - CI/CD pipeline

## 🎯 Test Coverage Goals

- **Unit Tests**: >80% coverage
- **Integration Tests**: >70% coverage  
- **E2E Tests**: Critical user paths covered

## 💡 Tips

1. **Keep tests fast** - Mock external dependencies
2. **Test behavior, not implementation** - Focus on outcomes
3. **Use descriptive names** - Tests should be self-documenting
4. **Test edge cases** - Don't just test the happy path
5. **Clean up after tests** - Prevent test pollution
6. **Run tests before commits** - Catch issues early

## 🔥 Common Issues

### Tests timing out
```bash
# Increase timeout
pnpm test -- --testTimeout=10000
```

### Snapshot mismatch
```bash
# Update snapshots
pnpm test -- --updateSnapshot
```

### Port already in use
```bash
# Kill process using port 3000
npx kill-port 3000
```

### Cypress tests failing locally
```bash
# Clear Cypress cache
pnpm cypress cache clear
pnpm cypress install
```
