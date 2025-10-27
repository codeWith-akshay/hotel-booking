/**
 * @jest-environment jsdom
 */
import {
  BookingInputSchema,
  ConfirmBookingSchema,
  CancelBookingSchema,
  CheckAvailabilitySchema,
  CreateBookingRulesSchema,
  UpdateBookingRulesSchema,
} from '@/lib/validation/booking.validation'
import { GuestType } from '@prisma/client'

describe('Booking Validation Tests', () => {
  describe('BookingInputSchema', () => {
    test('should validate valid booking input', () => {
      const validInput = {
        userId: 'clx1234567890abcdefghijk',
        roomTypeId: 'clx9876543210zyxwvutsrqp',
        startDate: new Date('2025-11-01'),
        endDate: new Date('2025-11-05'),
      }

      const result = BookingInputSchema.safeParse(validInput)
      expect(result.success).toBe(true)
    })

    test('should reject booking with end date before start date', () => {
      const invalidInput = {
        userId: 'clx1234567890abcdefghijk',
        roomTypeId: 'clx9876543210zyxwvutsrqp',
        startDate: new Date('2025-11-05'),
        endDate: new Date('2025-11-01'),
      }

      const result = BookingInputSchema.safeParse(invalidInput)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0]?.message).toContain('End date must be after start date')
      }
    })

    test('should reject booking exceeding 30 nights', () => {
      const invalidInput = {
        userId: 'clx1234567890abcdefghijk',
        roomTypeId: 'clx9876543210zyxwvutsrqp',
        startDate: new Date('2025-11-01'),
        endDate: new Date('2025-12-05'), // 34 days
      }

      const result = BookingInputSchema.safeParse(invalidInput)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0]?.message).toContain('Booking cannot exceed 30 nights')
      }
    })

    test('should reject invalid CUID format', () => {
      const invalidInput = {
        userId: 'invalid-id',
        roomTypeId: 'clx9876543210zyxwvutsrqp',
        startDate: new Date('2025-11-01'),
        endDate: new Date('2025-11-05'),
      }

      const result = BookingInputSchema.safeParse(invalidInput)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0]?.message).toContain('Invalid user ID format')
      }
    })
  })

  describe('CheckAvailabilitySchema', () => {
    test('should validate valid availability check', () => {
      const validInput = {
        roomTypeId: 'clx9876543210zyxwvutsrqp',
        startDate: new Date('2025-11-01'),
        endDate: new Date('2025-11-05'),
      }

      const result = CheckAvailabilitySchema.safeParse(validInput)
      expect(result.success).toBe(true)
    })

    test('should reject availability check with invalid date range', () => {
      const invalidInput = {
        roomTypeId: 'clx9876543210zyxwvutsrqp',
        startDate: new Date('2025-11-05'),
        endDate: new Date('2025-11-01'),
      }

      const result = CheckAvailabilitySchema.safeParse(invalidInput)
      expect(result.success).toBe(false)
    })
  })

  describe('CreateBookingRulesSchema - 3-2-1 Rule', () => {
    test('should validate REGULAR guest rules (3 months advance, 2 days notice)', () => {
      const memberRule = {
        guestType: GuestType.REGULAR,
        maxDaysAdvance: 90,
        minDaysNotice: 2,
      }

      const result = CreateBookingRulesSchema.safeParse(memberRule)
      expect(result.success).toBe(true)
    })

    test('should validate VIP rules (2 months advance, 1 day notice)', () => {
      const associatedRule = {
        guestType: GuestType.VIP,
        maxDaysAdvance: 60,
        minDaysNotice: 1,
      }

      const result = CreateBookingRulesSchema.safeParse(associatedRule)
      expect(result.success).toBe(true)
    })

    test('should validate CORPORATE rules (1 month advance, 0 days notice)', () => {
      const nonMemberRule = {
        guestType: GuestType.CORPORATE,
        maxDaysAdvance: 30,
        minDaysNotice: 0,
      }

      const result = CreateBookingRulesSchema.safeParse(nonMemberRule)
      expect(result.success).toBe(true)
    })

    test('should reject when maxDaysAdvance <= minDaysNotice', () => {
      const invalidRule = {
        guestType: GuestType.REGULAR,
        maxDaysAdvance: 2,
        minDaysNotice: 5,
      }

      const result = CreateBookingRulesSchema.safeParse(invalidRule)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0]?.message).toContain(
          'Maximum advance days must be greater than minimum notice days'
        )
      }
    })

    test('should reject invalid maxDaysAdvance (exceeds 365)', () => {
      const invalidRule = {
        guestType: GuestType.REGULAR,
        maxDaysAdvance: 400,
        minDaysNotice: 2,
      }

      const result = CreateBookingRulesSchema.safeParse(invalidRule)
      expect(result.success).toBe(false)
    })

    test('should reject invalid minDaysNotice (exceeds 30)', () => {
      const invalidRule = {
        guestType: GuestType.REGULAR,
        maxDaysAdvance: 90,
        minDaysNotice: 35,
      }

      const result = CreateBookingRulesSchema.safeParse(invalidRule)
      expect(result.success).toBe(false)
    })
  })

  describe('ConfirmBookingSchema', () => {
    test('should validate valid booking confirmation', () => {
      const validInput = {
        bookingId: 'clx1234567890abcdefghijk',
        userId: 'clx9876543210zyxwvutsrqp',
      }

      const result = ConfirmBookingSchema.safeParse(validInput)
      expect(result.success).toBe(true)
    })

    test('should reject invalid booking ID', () => {
      const invalidInput = {
        bookingId: 'invalid-id',
        userId: 'clx9876543210zyxwvutsrqp',
      }

      const result = ConfirmBookingSchema.safeParse(invalidInput)
      expect(result.success).toBe(false)
    })
  })

  describe('CancelBookingSchema', () => {
    test('should validate cancellation with reason', () => {
      const validInput = {
        bookingId: 'clx1234567890abcdefghijk',
        userId: 'clx9876543210zyxwvutsrqp',
        reason: 'Change of plans',
      }

      const result = CancelBookingSchema.safeParse(validInput)
      expect(result.success).toBe(true)
    })

    test('should validate cancellation without reason', () => {
      const validInput = {
        bookingId: 'clx1234567890abcdefghijk',
        userId: 'clx9876543210zyxwvutsrqp',
      }

      const result = CancelBookingSchema.safeParse(validInput)
      expect(result.success).toBe(true)
    })
  })

  describe('UpdateBookingRulesSchema', () => {
    test('should validate partial rule update', () => {
      const validInput = {
        id: 'clx1234567890abcdefghijk',
        maxDaysAdvance: 120,
      }

      const result = UpdateBookingRulesSchema.safeParse(validInput)
      expect(result.success).toBe(true)
    })

    test('should validate complete rule update', () => {
      const validInput = {
        id: 'clx1234567890abcdefghijk',
        guestType: GuestType.REGULAR,
        maxDaysAdvance: 120,
        minDaysNotice: 3,
      }

      const result = UpdateBookingRulesSchema.safeParse(validInput)
      expect(result.success).toBe(true)
    })
  })
})
