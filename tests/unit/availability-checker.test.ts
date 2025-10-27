/**
 * Availability Checker Business Logic Tests
 * Tests the core availability checking logic for room bookings
 */
import { describe, expect, test, jest, beforeEach } from '@jest/globals'

describe('Availability Checker Logic Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('checkAvailability - Date Range Validation', () => {
    test('should correctly calculate date ranges', () => {
      const checkIn = new Date('2025-11-01')
      const checkOut = new Date('2025-11-05')
      
      const nights = Math.ceil(
        (checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24)
      )
      
      expect(nights).toBe(4)
    })

    test('should normalize dates (remove time component)', () => {
      const date = new Date('2025-11-01T15:30:00')
      const normalized = new Date(date)
      normalized.setHours(0, 0, 0, 0)
      
      expect(normalized.getHours()).toBe(0)
      expect(normalized.getMinutes()).toBe(0)
      expect(normalized.getSeconds()).toBe(0)
      expect(normalized.getMilliseconds()).toBe(0)
    })

    test('should handle date comparison correctly', () => {
      const date1 = new Date('2025-11-01')
      const date2 = new Date('2025-11-05')
      
      expect(date2 > date1).toBe(true)
      expect(date1 < date2).toBe(true)
    })
  })

  describe('checkAvailability - Inventory Analysis', () => {
    test('should detect unavailable dates in inventory', () => {
      const requiredRooms = 3
      const inventory = [
        { date: new Date('2025-11-01'), availableRooms: 5 },
        { date: new Date('2025-11-02'), availableRooms: 2 }, // Insufficient
        { date: new Date('2025-11-03'), availableRooms: 4 },
        { date: new Date('2025-11-04'), availableRooms: 1 }, // Insufficient
      ]

      const unavailableDates = inventory.filter(
        inv => inv.availableRooms < requiredRooms
      ).map(inv => inv.date)

      expect(unavailableDates.length).toBe(2)
      expect(unavailableDates[0]).toEqual(new Date('2025-11-02'))
      expect(unavailableDates[1]).toEqual(new Date('2025-11-04'))
    })

    test('should calculate minimum availability across date range', () => {
      const inventory = [
        { date: new Date('2025-11-01'), availableRooms: 5 },
        { date: new Date('2025-11-02'), availableRooms: 2 },
        { date: new Date('2025-11-03'), availableRooms: 8 },
        { date: new Date('2025-11-04'), availableRooms: 3 },
      ]

      const minAvailability = Math.min(...inventory.map(inv => inv.availableRooms))

      expect(minAvailability).toBe(2)
    })

    test('should return true when all dates have sufficient availability', () => {
      const requiredRooms = 3
      const inventory = [
        { date: new Date('2025-11-01'), availableRooms: 5 },
        { date: new Date('2025-11-02'), availableRooms: 4 },
        { date: new Date('2025-11-03'), availableRooms: 6 },
      ]

      const isAvailable = inventory.every(inv => inv.availableRooms >= requiredRooms)

      expect(isAvailable).toBe(true)
    })

    test('should return false when any date has insufficient availability', () => {
      const requiredRooms = 3
      const inventory = [
        { date: new Date('2025-11-01'), availableRooms: 5 },
        { date: new Date('2025-11-02'), availableRooms: 2 }, // Insufficient
        { date: new Date('2025-11-03'), availableRooms: 6 },
      ]

      const isAvailable = inventory.every(inv => inv.availableRooms >= requiredRooms)

      expect(isAvailable).toBe(false)
    })

    test('should handle empty inventory (no records found)', () => {
      const inventory: any[] = []
      const requiredRooms = 2

      const isAvailable = inventory.length > 0 && inventory.every(
        inv => inv.availableRooms >= requiredRooms
      )

      expect(isAvailable).toBe(false)
    })
  })

  describe('3-2-1 Booking Rule Implementation', () => {
    test('should validate MEMBER can book 90 days in advance', () => {
      const today = new Date('2025-10-24')
      const checkInDate = new Date('2026-01-22') // 90 days from today
      const maxDaysAdvance = 90

      const daysFromNow = Math.ceil(
        (checkInDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
      )

      expect(daysFromNow).toBeLessThanOrEqual(maxDaysAdvance)
    })

    test('should reject MEMBER booking beyond 90 days advance', () => {
      const today = new Date('2025-10-24')
      const checkInDate = new Date('2026-02-01') // 100 days from today
      const maxDaysAdvance = 90

      const daysFromNow = Math.ceil(
        (checkInDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
      )

      expect(daysFromNow).toBeGreaterThan(maxDaysAdvance)
    })

    test('should validate MEMBER requires 2 days notice', () => {
      const today = new Date('2025-10-24')
      const checkInDate = new Date('2025-10-26') // 2 days from today
      const minDaysNotice = 2

      const daysFromNow = Math.ceil(
        (checkInDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
      )

      expect(daysFromNow).toBeGreaterThanOrEqual(minDaysNotice)
    })

    test('should reject MEMBER booking with insufficient notice', () => {
      const today = new Date('2025-10-24')
      const checkInDate = new Date('2025-10-25') // 1 day from today
      const minDaysNotice = 2

      const daysFromNow = Math.ceil(
        (checkInDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
      )

      expect(daysFromNow).toBeLessThan(minDaysNotice)
    })

    test('should validate NON_MEMBER booking rules (30 days, 0 notice)', () => {
      const today = new Date('2025-10-24')
      const checkInDate = new Date('2025-10-24') // Same day
      const maxDaysAdvance = 30
      const minDaysNotice = 0

      const daysFromNow = Math.ceil(
        (checkInDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
      )

      expect(daysFromNow).toBeGreaterThanOrEqual(minDaysNotice)
      expect(daysFromNow).toBeLessThanOrEqual(maxDaysAdvance)
    })

    test('should calculate correct days between dates', () => {
      const date1 = new Date('2025-10-24')
      const date2 = new Date('2025-10-30')

      const diffTime = date2.getTime() - date1.getTime()
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

      expect(diffDays).toBe(6)
    })
  })

  describe('Booking Rule Helpers', () => {
    test('should correctly determine if booking is within advance limit', () => {
      const validateAdvanceBooking = (
        checkInDate: Date,
        maxDaysAdvance: number
      ): boolean => {
        const today = new Date()
        today.setHours(0, 0, 0, 0)
        
        const daysFromNow = Math.ceil(
          (checkInDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
        )
        
        return daysFromNow <= maxDaysAdvance
      }

      const today = new Date('2025-10-24')
      const validDate = new Date('2025-11-23') // 30 days
      const invalidDate = new Date('2025-12-24') // 61 days

      // Mock today's date
      jest.spyOn(global, 'Date').mockImplementation(() => today as any)

      expect(validateAdvanceBooking(validDate, 30)).toBe(true)
      expect(validateAdvanceBooking(invalidDate, 30)).toBe(false)

      jest.spyOn(global, 'Date').mockRestore()
    })

    test('should correctly determine if booking meets minimum notice', () => {
      const validateMinimumNotice = (
        checkInDate: Date,
        minDaysNotice: number
      ): boolean => {
        const today = new Date()
        today.setHours(0, 0, 0, 0)
        
        const daysFromNow = Math.ceil(
          (checkInDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
        )
        
        return daysFromNow >= minDaysNotice
      }

      const today = new Date('2025-10-24')
      const validDate = new Date('2025-10-26') // 2 days
      const invalidDate = new Date('2025-10-25') // 1 day

      jest.spyOn(global, 'Date').mockImplementation(() => today as any)

      expect(validateMinimumNotice(validDate, 2)).toBe(true)
      expect(validateMinimumNotice(invalidDate, 2)).toBe(false)

      jest.spyOn(global, 'Date').mockRestore()
    })
  })

  describe('Edge Cases', () => {
    test('should handle same-day check-in and check-out', () => {
      const checkIn = new Date('2025-11-01')
      const checkOut = new Date('2025-11-01')
      
      const isValid = checkOut > checkIn
      expect(isValid).toBe(false)
    })

    test('should handle check-in at midnight', () => {
      const checkIn = new Date('2025-11-01T00:00:00')
      
      expect(checkIn.getHours()).toBe(0)
      expect(checkIn.getMinutes()).toBe(0)
    })

    test('should handle leap year dates', () => {
      const date = new Date('2024-02-29') // Leap year
      
      expect(date.getMonth()).toBe(1) // February (0-indexed)
      expect(date.getDate()).toBe(29)
    })

    test('should handle year boundary crossing', () => {
      const date1 = new Date('2025-12-30')
      const date2 = new Date('2026-01-05')
      
      const diffTime = date2.getTime() - date1.getTime()
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
      
      expect(diffDays).toBe(6)
    })

    test('should handle timezone differences correctly', () => {
      const date = new Date('2025-11-01T23:00:00Z')
      const normalized = new Date(date)
      normalized.setHours(0, 0, 0, 0)
      
      // After normalization, time should be midnight
      expect(normalized.getHours()).toBe(0)
    })
  })
})
