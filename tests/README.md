# Test Suite

This directory contains all automated tests for the hotel booking application.

## 📁 Structure

### `/unit`
Unit tests for individual functions and components.
- Zod schema validation
- Business logic functions
- Utility helpers

### `/integration`
Integration tests for API routes and server actions.
- Booking flow
- Payment processing
- Admin operations

### `/mocks`
Mock implementations for external services.
- Payment provider mock
- Prisma client mock

### `/helpers`
Reusable test utilities and helper functions.
- Data generators
- Test context creators
- Assertion helpers

## 🚀 Quick Start

```bash
# Run all unit tests
pnpm test:unit

# Run all integration tests
pnpm test:integration

# Run specific test file
pnpm test booking-validation.test.ts

# Run in watch mode
pnpm test:watch

# Generate coverage report
pnpm test:coverage
```

## 📝 Writing Tests

### Unit Test Example
```typescript
import { BookingInputSchema } from '@/lib/validation/booking.validation'

describe('BookingInputSchema', () => {
  test('should validate valid input', () => {
    const input = {
      userId: 'clx1234567890abcdefghijk',
      roomTypeId: 'clx9876543210zyxwvutsrqp',
      startDate: new Date('2025-11-01'),
      endDate: new Date('2025-11-05'),
    }

    const result = BookingInputSchema.safeParse(input)
    expect(result.success).toBe(true)
  })
})
```

### Integration Test Example
```typescript
import { createMockPrismaClient } from '../mocks/prisma.mock'

describe('Booking Flow', () => {
  let mockPrisma: any

  beforeEach(() => {
    mockPrisma = createMockPrismaClient()
  })

  test('should create booking', async () => {
    const booking = await mockPrisma.booking.create({
      data: { /* booking data */ }
    })

    expect(booking).toBeDefined()
    expect(booking.status).toBe('PROVISIONAL')
  })
})
```

## 🎯 Best Practices

1. **Test Independence**: Each test should run independently
2. **Clear Names**: Use descriptive test names
3. **Arrange-Act-Assert**: Structure tests clearly
4. **Mock External Calls**: Don't hit real APIs
5. **Test Edge Cases**: Cover error scenarios
6. **Keep Tests Fast**: Unit tests should be quick

## 📊 Coverage

Coverage reports are generated in the `/coverage` directory.

View coverage:
```bash
# Generate and open coverage report
pnpm test:coverage
open coverage/lcov-report/index.html
```

## 🐛 Debugging

### VS Code
1. Add breakpoint in test file
2. Use Jest extension or launch configuration
3. Run test in debug mode

### Command Line
```bash
# Run with verbose output
pnpm test --verbose

# Run specific test with pattern
pnpm test -- --testNamePattern="should create booking"
```

## 📚 Resources

- [Jest Documentation](https://jestjs.io/)
- [Testing Library](https://testing-library.com/)
- [Test Best Practices](https://testingjavascript.com/)
