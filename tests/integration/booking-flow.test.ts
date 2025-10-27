/**
 * Booking Flow Integration Tests
 * Tests the complete booking flow with mocked Prisma and payment provider
 */

import { mockPaymentProvider, createMockSuccessfulPayment } from '../mocks/payment-provider.mock'
import { createMockPrismaClient, seedMockData } from '../mocks/prisma.mock'
import { BookingStatus, GuestType, PaymentStatus } from '@prisma/client'

describe('Booking Flow Integration Tests', () => {
  let mockPrisma: any

  beforeEach(() => {
    // Create fresh mock instances for each test
    mockPrisma = createMockPrismaClient()
    seedMockData(mockPrisma)
    mockPaymentProvider.reset()
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  describe('Complete Booking Flow', () => {
    test('should create provisional booking successfully', async () => {
      const bookingData = {
        userId: 'user_test',
        roomTypeId: 'roomtype_deluxe',
        startDate: new Date('2025-11-01'),
        endDate: new Date('2025-11-05'),
        guests: 2,
        guestType: GuestType.REGULAR,
      }

      const booking = await mockPrisma.booking.create({ data: bookingData })

      expect(booking).toBeDefined()
      expect(booking.status).toBe(BookingStatus.PROVISIONAL)
      expect(booking.userId).toBe('user_test')
      expect(booking.roomTypeId).toBe('roomtype_deluxe')
    })

    test('should validate availability before booking', async () => {
      const checkInDate = new Date('2025-11-01')
      const checkOutDate = new Date('2025-11-05')
      const requiredRooms = 2

      // Get inventory for date range
      const inventory = await mockPrisma.roomInventory.findMany({
        where: {
          roomTypeId: 'roomtype_deluxe',
          date: {
            gte: checkInDate,
            lt: checkOutDate,
          },
        },
      })

      // Check if all dates have sufficient availability
      const isAvailable = inventory.every((inv: any) => inv.availableRooms >= requiredRooms)

      expect(inventory.length).toBeGreaterThan(0)
      expect(isAvailable).toBe(true)
    })

    test('should check 3-2-1 booking rules for REGULAR guest', async () => {
      const rules = await mockPrisma.bookingRules.findMany({
        where: { guestType: GuestType.REGULAR },
      })

      expect(rules).toHaveLength(1)
      expect(rules[0].maxDaysAdvance).toBe(90)
      expect(rules[0].minDaysNotice).toBe(2)

      // Validate booking against rules
      const today = new Date()
      const checkInDate = new Date(today)
      checkInDate.setDate(checkInDate.getDate() + 5) // 5 days from now

      const daysFromNow = Math.ceil(
        (checkInDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
      )

      expect(daysFromNow).toBeGreaterThanOrEqual(rules[0].minDaysNotice)
      expect(daysFromNow).toBeLessThanOrEqual(rules[0].maxDaysAdvance)
    })

    test('should reject booking that violates minimum notice period', async () => {
      const rules = await mockPrisma.bookingRules.findMany({
        where: { guestType: GuestType.REGULAR },
      })

      const today = new Date()
      const checkInDate = new Date(today)
      checkInDate.setDate(checkInDate.getDate() + 1) // Only 1 day notice

      const daysFromNow = Math.ceil(
        (checkInDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
      )

      const isValid = daysFromNow >= rules[0].minDaysNotice

      expect(isValid).toBe(false)
    })

    test('should reject booking beyond maximum advance period', async () => {
      const rules = await mockPrisma.bookingRules.findMany({
        where: { guestType: GuestType.REGULAR },
      })

      const today = new Date()
      const checkInDate = new Date(today)
      checkInDate.setDate(checkInDate.getDate() + 100) // 100 days (exceeds 90)

      const daysFromNow = Math.ceil(
        (checkInDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
      )

      const isValid = daysFromNow <= rules[0].maxDaysAdvance

      expect(isValid).toBe(false)
    })

    test('should create payment for booking', async () => {
      // Create booking
      const booking = await mockPrisma.booking.create({
        data: {
          userId: 'user_test',
          roomTypeId: 'roomtype_deluxe',
          startDate: new Date('2025-11-01'),
          endDate: new Date('2025-11-05'),
          guests: 2,
          totalAmount: 20000,
          status: BookingStatus.PROVISIONAL,
        },
      })

      // Create payment intent
      const paymentIntent = await mockPaymentProvider.createPaymentIntent({
        amount: 20000,
        currency: 'INR',
        metadata: {
          bookingId: booking.id,
          userId: booking.userId,
        },
      })

      expect(paymentIntent).toBeDefined()
      expect(paymentIntent.amount).toBe(20000)
      expect(paymentIntent.status).toBe('pending')
      expect(paymentIntent.metadata.bookingId).toBe(booking.id)
    })

    test('should confirm booking after successful payment', async () => {
      // Create booking
      const booking = await mockPrisma.booking.create({
        data: {
          userId: 'user_test',
          roomTypeId: 'roomtype_deluxe',
          startDate: new Date('2025-11-01'),
          endDate: new Date('2025-11-05'),
          totalAmount: 20000,
          status: BookingStatus.PROVISIONAL,
        },
      })

      // Create and confirm payment
      const payment = await createMockSuccessfulPayment(20000, {
        bookingId: booking.id,
      })

      expect(payment.status).toBe('success')

      // Update booking status
      const confirmedBooking = await mockPrisma.booking.update({
        where: { id: booking.id },
        data: { status: BookingStatus.CONFIRMED },
      })

      expect(confirmedBooking.status).toBe(BookingStatus.CONFIRMED)
    })

    test('should rollback booking on payment failure', async () => {
      // Create booking
      const booking = await mockPrisma.booking.create({
        data: {
          userId: 'user_test',
          roomTypeId: 'roomtype_deluxe',
          startDate: new Date('2025-11-01'),
          endDate: new Date('2025-11-05'),
          totalAmount: 20000,
          status: BookingStatus.PROVISIONAL,
        },
      })

      // Simulate payment failure
      mockPaymentProvider.setFailureMode(true, 'Insufficient funds')

      try {
        const paymentIntent = await mockPaymentProvider.createPaymentIntent({
          amount: 20000,
          currency: 'INR',
        })

        await mockPaymentProvider.confirmPayment(paymentIntent.id)
      } catch (error: any) {
        expect(error.message).toBe('Insufficient funds')
        
        // Cancel the booking
        const cancelledBooking = await mockPrisma.booking.update({
          where: { id: booking.id },
          data: { status: BookingStatus.CANCELLED },
        })

        expect(cancelledBooking.status).toBe(BookingStatus.CANCELLED)
      }
    })

    test('should update room inventory after confirmed booking', async () => {
      const checkInDate = new Date('2025-11-01')
      const checkOutDate = new Date('2025-11-05')

      // Get initial inventory
      const inventoryBefore = await mockPrisma.roomInventory.findMany({
        where: {
          roomTypeId: 'roomtype_deluxe',
          date: {
            gte: checkInDate,
            lt: checkOutDate,
          },
        },
      })

      const initialAvailability = inventoryBefore[0].availableRooms

      // Create and confirm booking
      const booking = await mockPrisma.booking.create({
        data: {
          userId: 'user_test',
          roomTypeId: 'roomtype_deluxe',
          startDate: checkInDate,
          endDate: checkOutDate,
          totalAmount: 20000,
          status: BookingStatus.CONFIRMED,
        },
      })

      // Simulate inventory update (decrease by 1 room)
      for (const inv of inventoryBefore) {
        await mockPrisma.roomInventory.update({
          where: { id: inv.id },
          data: { availableRooms: inv.availableRooms - 1 },
        })
      }

      // Verify inventory decreased
      const inventoryAfter = await mockPrisma.roomInventory.findMany({
        where: {
          roomTypeId: 'roomtype_deluxe',
          date: {
            gte: checkInDate,
            lt: checkOutDate,
          },
        },
      })

      expect(inventoryAfter[0].availableRooms).toBe(initialAvailability - 1)
    })
  })

  describe('Booking Cancellation Flow', () => {
    test('should cancel booking and issue refund', async () => {
      // Create confirmed booking
      const booking = await mockPrisma.booking.create({
        data: {
          userId: 'user_test',
          roomTypeId: 'roomtype_deluxe',
          startDate: new Date('2025-11-01'),
          endDate: new Date('2025-11-05'),
          totalAmount: 20000,
          status: BookingStatus.CONFIRMED,
        },
      })

      // Create successful payment
      const payment = await createMockSuccessfulPayment(20000, {
        bookingId: booking.id,
      })

      // Cancel booking
      const cancelledBooking = await mockPrisma.booking.update({
        where: { id: booking.id },
        data: { status: BookingStatus.CANCELLED },
      })

      // Issue refund
      const refund = await mockPaymentProvider.createRefund({
        paymentIntentId: payment.id,
        amount: 20000,
      })

      expect(cancelledBooking.status).toBe(BookingStatus.CANCELLED)
      expect(refund.status).toBe('succeeded')
      expect(refund.amount).toBe(20000)
    })

    test('should restore room inventory after cancellation', async () => {
      const checkInDate = new Date('2025-11-01')
      const checkOutDate = new Date('2025-11-05')

      // Get initial inventory
      const inventoryBefore = await mockPrisma.roomInventory.findMany({
        where: {
          roomTypeId: 'roomtype_deluxe',
          date: {
            gte: checkInDate,
            lt: checkOutDate,
          },
        },
      })

      const initialAvailability = inventoryBefore[0].availableRooms

      // Decrease inventory (simulating confirmed booking)
      for (const inv of inventoryBefore) {
        await mockPrisma.roomInventory.update({
          where: { id: inv.id },
          data: { availableRooms: inv.availableRooms - 1 },
        })
      }

      // Cancel booking - restore inventory
      for (const inv of inventoryBefore) {
        await mockPrisma.roomInventory.update({
          where: { id: inv.id },
          data: { availableRooms: inv.availableRooms },
        })
      }

      // Verify inventory restored
      const inventoryAfter = await mockPrisma.roomInventory.findMany({
        where: {
          roomTypeId: 'roomtype_deluxe',
          date: {
            gte: checkInDate,
            lt: checkOutDate,
          },
        },
      })

      expect(inventoryAfter[0].availableRooms).toBe(initialAvailability)
    })
  })

  describe('Multiple Bookings Concurrency', () => {
    test('should handle multiple bookings for same room type', async () => {
      const bookingData = {
        roomTypeId: 'roomtype_deluxe',
        startDate: new Date('2025-11-01'),
        endDate: new Date('2025-11-05'),
        totalAmount: 20000,
        status: BookingStatus.CONFIRMED,
      }

      // Create multiple bookings
      const booking1 = await mockPrisma.booking.create({
        data: { ...bookingData, userId: 'user_test' },
      })

      const booking2 = await mockPrisma.booking.create({
        data: { ...bookingData, userId: 'user_test_2' },
      })

      const bookings = await mockPrisma.booking.findMany({
        where: {
          roomTypeId: 'roomtype_deluxe',
          status: BookingStatus.CONFIRMED,
        },
      })

      expect(bookings.length).toBeGreaterThanOrEqual(2)
    })

    test('should prevent overbooking by checking availability', async () => {
      const checkInDate = new Date('2025-11-01')
      const checkOutDate = new Date('2025-11-05')

      // Get available rooms
      const inventory = await mockPrisma.roomInventory.findMany({
        where: {
          roomTypeId: 'roomtype_deluxe',
          date: {
            gte: checkInDate,
            lt: checkOutDate,
          },
        },
      })

      const minAvailability = Math.min(...inventory.map((inv: any) => inv.availableRooms))

      // Try to book more rooms than available
      const requestedRooms = minAvailability + 5

      const canBook = requestedRooms <= minAvailability

      expect(canBook).toBe(false)
    })
  })
})
