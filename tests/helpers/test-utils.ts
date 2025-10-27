/**
 * Test Helpers and Utilities
 * Reusable functions for testing
 */

import { faker } from '@faker-js/faker'

/**
 * Generate a mock CUID
 */
export const generateCUID = (): string => {
  return `c${faker.string.alphanumeric(24)}`
}

/**
 * Generate test user data
 */
export const generateTestUser = (overrides?: any) => {
  return {
    id: generateCUID(),
    email: faker.internet.email(),
    firstName: faker.person.firstName(),
    lastName: faker.person.lastName(),
    phone: faker.phone.number('+91##########'),
    role: 'MEMBER',
    guestType: 'REGULAR',
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  }
}

/**
 * Generate test room type data
 */
export const generateTestRoomType = (overrides?: any) => {
  return {
    id: generateCUID(),
    name: faker.helpers.arrayElement(['Deluxe Room', 'Suite', 'Standard Room']),
    description: faker.lorem.sentence(),
    basePrice: faker.number.int({ min: 3000, max: 10000 }),
    totalRooms: faker.number.int({ min: 5, max: 20 }),
    amenities: ['AC', 'TV', 'WiFi'],
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  }
}

/**
 * Generate test booking data
 */
export const generateTestBooking = (overrides?: any) => {
  const checkIn = faker.date.future()
  const checkOut = new Date(checkIn)
  checkOut.setDate(checkOut.getDate() + faker.number.int({ min: 1, max: 7 }))

  return {
    id: generateCUID(),
    userId: generateCUID(),
    roomTypeId: generateCUID(),
    startDate: checkIn,
    endDate: checkOut,
    guests: faker.number.int({ min: 1, max: 4 }),
    totalAmount: faker.number.int({ min: 5000, max: 50000 }),
    status: 'PROVISIONAL',
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  }
}

/**
 * Generate test payment data
 */
export const generateTestPayment = (overrides?: any) => {
  return {
    id: generateCUID(),
    bookingId: generateCUID(),
    userId: generateCUID(),
    amount: faker.number.int({ min: 5000, max: 50000 }),
    status: 'PENDING',
    method: 'ONLINE',
    transactionId: `TXN_${faker.string.alphanumeric(12)}`,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  }
}

/**
 * Generate test booking rules
 */
export const generateTestBookingRules = (guestType: string, overrides?: any) => {
  const rules = {
    REGULAR: { maxDaysAdvance: 90, minDaysNotice: 2 },
    VIP: { maxDaysAdvance: 60, minDaysNotice: 1 },
    CORPORATE: { maxDaysAdvance: 30, minDaysNotice: 0 },
  }

  return {
    id: generateCUID(),
    guestType,
    ...rules[guestType as keyof typeof rules],
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  }
}

/**
 * Generate date range for testing
 */
export const generateDateRange = (daysFromNow: number, duration: number) => {
  const checkIn = new Date()
  checkIn.setDate(checkIn.getDate() + daysFromNow)
  checkIn.setHours(0, 0, 0, 0)

  const checkOut = new Date(checkIn)
  checkOut.setDate(checkOut.getDate() + duration)

  return { checkIn, checkOut }
}

/**
 * Wait for a specific time (for async tests)
 */
export const wait = (ms: number): Promise<void> => {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

/**
 * Mock Date.now() for consistent testing
 */
export const mockDateNow = (timestamp: number) => {
  const originalNow = Date.now
  Date.now = jest.fn(() => timestamp)
  return () => {
    Date.now = originalNow
  }
}

/**
 * Create test context with common data
 */
export const createTestContext = () => {
  const user = generateTestUser()
  const roomType = generateTestRoomType()
  const booking = generateTestBooking({
    userId: user.id,
    roomTypeId: roomType.id,
  })
  const payment = generateTestPayment({
    bookingId: booking.id,
    userId: user.id,
  })

  return {
    user,
    roomType,
    booking,
    payment,
  }
}

/**
 * Assert server action response structure
 */
export const assertServerActionResponse = (response: any) => {
  expect(response).toHaveProperty('success')
  expect(typeof response.success).toBe('boolean')

  if (response.success) {
    expect(response).toHaveProperty('message')
  } else {
    expect(response).toHaveProperty('message')
    expect(response.message).toBeTruthy()
  }
}

/**
 * Generate inventory for date range
 */
export const generateInventory = (
  roomTypeId: string,
  startDate: Date,
  days: number,
  availableRooms: number
) => {
  const inventory = []

  for (let i = 0; i < days; i++) {
    const date = new Date(startDate)
    date.setDate(date.getDate() + i)
    date.setHours(0, 0, 0, 0)

    inventory.push({
      id: generateCUID(),
      roomTypeId,
      date,
      availableRooms,
      createdAt: new Date(),
      updatedAt: new Date(),
    })
  }

  return inventory
}

/**
 * Calculate expected booking amount
 */
export const calculateBookingAmount = (
  pricePerNight: number,
  nights: number,
  rooms: number,
  taxRate: number = 18
): { subtotal: number; tax: number; total: number } => {
  const subtotal = pricePerNight * nights * rooms
  const tax = subtotal * (taxRate / 100)
  const total = subtotal + tax

  return { subtotal, tax, total }
}

/**
 * Mock fetch API response
 */
export const mockFetch = (response: any, options?: { ok?: boolean; status?: number }) => {
  global.fetch = jest.fn(() =>
    Promise.resolve({
      ok: options?.ok ?? true,
      status: options?.status ?? 200,
      json: () => Promise.resolve(response),
      text: () => Promise.resolve(JSON.stringify(response)),
    } as Response)
  )
}

/**
 * Reset all mocks
 */
export const resetAllMocks = () => {
  jest.clearAllMocks()
  jest.resetAllMocks()
  jest.restoreAllMocks()
}

/**
 * Create spy on console methods
 */
export const spyOnConsole = () => {
  const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation()
  const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation()
  const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation()

  return {
    error: consoleErrorSpy,
    warn: consoleWarnSpy,
    log: consoleLogSpy,
    restore: () => {
      consoleErrorSpy.mockRestore()
      consoleWarnSpy.mockRestore()
      consoleLogSpy.mockRestore()
    },
  }
}

/**
 * Test data seeds
 */
export const testSeeds = {
  users: [
    { email: 'test@example.com', role: 'MEMBER', guestType: 'REGULAR' },
    { email: 'admin@example.com', role: 'ADMIN', guestType: 'REGULAR' },
    { email: 'vip@example.com', role: 'MEMBER', guestType: 'VIP' },
  ],
  roomTypes: [
    { name: 'Deluxe Room', basePrice: 5000, totalRooms: 10 },
    { name: 'Suite', basePrice: 8000, totalRooms: 5 },
    { name: 'Standard Room', basePrice: 3000, totalRooms: 15 },
  ],
  bookingRules: [
    { guestType: 'REGULAR', maxDaysAdvance: 90, minDaysNotice: 2 },
    { guestType: 'VIP', maxDaysAdvance: 60, minDaysNotice: 1 },
    { guestType: 'CORPORATE', maxDaysAdvance: 30, minDaysNotice: 0 },
  ],
}
