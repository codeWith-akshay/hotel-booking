// Learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom'

// Mock environment variables
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test_db'
process.env.NEXTAUTH_SECRET = 'test-secret-key-for-testing'
process.env.NEXTAUTH_URL = 'http://localhost:3000'
process.env.STRIPE_SECRET_KEY = 'sk_test_mock_key'
process.env.STRIPE_PUBLISHABLE_KEY = 'pk_test_mock_key'
process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY = 'pk_test_mock_key'

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter() {
    return {
      push: jest.fn(),
      replace: jest.fn(),
      prefetch: jest.fn(),
      back: jest.fn(),
      pathname: '/',
      query: {},
      asPath: '/',
    }
  },
  useSearchParams() {
    return new URLSearchParams()
  },
  usePathname() {
    return '/'
  },
}))

// Mock Prisma Client
jest.mock('@prisma/client', () => {
  const mockPrisma = {
    user: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    booking: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    roomType: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    roomInventory: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      upsert: jest.fn(),
    },
    payment: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    bookingRules: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
  }

  return {
    PrismaClient: jest.fn(() => mockPrisma),
    BookingStatus: {
      PROVISIONAL: 'PROVISIONAL',
      CONFIRMED: 'CONFIRMED',
      CANCELLED: 'CANCELLED',
      COMPLETED: 'COMPLETED',
    },
    GuestType: {
      MEMBER: 'MEMBER',
      ASSOCIATED_MEMBER: 'ASSOCIATED_MEMBER',
      NON_MEMBER: 'NON_MEMBER',
    },
    PaymentStatus: {
      PENDING: 'PENDING',
      COMPLETED: 'COMPLETED',
      FAILED: 'FAILED',
      REFUNDED: 'REFUNDED',
    },
    PaymentMethod: {
      ONLINE: 'ONLINE',
      OFFLINE: 'OFFLINE',
      CARD: 'CARD',
      UPI: 'UPI',
      NETBANKING: 'NETBANKING',
    },
    UserRole: {
      GUEST: 'GUEST',
      MEMBER: 'MEMBER',
      ADMIN: 'ADMIN',
      SUPER_ADMIN: 'SUPER_ADMIN',
    },
  }
})

// Global test utilities
global.mockDate = (dateString) => {
  const mockDate = new Date(dateString)
  jest.spyOn(global, 'Date').mockImplementation(() => mockDate)
  return mockDate
}

global.restoreDate = () => {
  jest.spyOn(global, 'Date').mockRestore()
}
