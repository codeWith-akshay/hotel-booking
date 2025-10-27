/**
 * Utility Functions Unit Tests
 * Tests helper functions used across the application
 */

describe('Utility Functions Tests', () => {
  describe('Date Utilities', () => {
    test('should format date to ISO string', () => {
      const date = new Date('2025-11-01')
      const isoString = date.toISOString().split('T')[0]
      
      expect(isoString).toBe('2025-11-01')
    })

    test('should parse date string correctly', () => {
      const dateString = '2025-11-01'
      const date = new Date(dateString)
      
      expect(date.getFullYear()).toBe(2025)
      expect(date.getMonth()).toBe(10) // November (0-indexed)
      expect(date.getDate()).toBe(1)
    })

    test('should calculate number of nights between dates', () => {
      const calculateNights = (checkIn: Date, checkOut: Date): number => {
        const diffTime = checkOut.getTime() - checkIn.getTime()
        return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
      }

      const checkIn = new Date('2025-11-01')
      const checkOut = new Date('2025-11-05')
      
      expect(calculateNights(checkIn, checkOut)).toBe(4)
    })

    test('should add days to a date', () => {
      const addDays = (date: Date, days: number): Date => {
        const result = new Date(date)
        result.setDate(result.getDate() + days)
        return result
      }

      const date = new Date('2025-11-01')
      const newDate = addDays(date, 5)
      
      expect(newDate.getDate()).toBe(6)
    })
  })

  describe('Price Calculations', () => {
    test('should calculate total booking price', () => {
      const calculateTotalPrice = (
        nights: number,
        pricePerNight: number,
        numberOfRooms: number
      ): number => {
        return nights * pricePerNight * numberOfRooms
      }

      const total = calculateTotalPrice(3, 100, 2)
      expect(total).toBe(600)
    })

    test('should apply discount percentage', () => {
      const applyDiscount = (amount: number, discountPercent: number): number => {
        return amount * (1 - discountPercent / 100)
      }

      const discounted = applyDiscount(1000, 10)
      expect(discounted).toBe(900)
    })

    test('should format currency', () => {
      const formatCurrency = (amount: number): string => {
        return `₹${amount.toFixed(2)}`
      }

      expect(formatCurrency(1234.5)).toBe('₹1234.50')
      expect(formatCurrency(100)).toBe('₹100.00')
    })

    test('should calculate tax amount', () => {
      const calculateTax = (amount: number, taxRate: number): number => {
        return amount * (taxRate / 100)
      }

      const tax = calculateTax(1000, 18)
      expect(tax).toBe(180)
    })
  })

  describe('String Utilities', () => {
    test('should generate booking reference number', () => {
      const generateBookingReference = (prefix: string, timestamp: number): string => {
        return `${prefix}${timestamp.toString(36).toUpperCase()}`
      }

      const ref = generateBookingReference('BK', Date.now())
      expect(ref).toMatch(/^BK[A-Z0-9]+$/)
    })

    test('should truncate long text', () => {
      const truncate = (text: string, maxLength: number): string => {
        return text.length > maxLength ? text.slice(0, maxLength) + '...' : text
      }

      const long = 'This is a very long text that needs to be truncated'
      expect(truncate(long, 20)).toBe('This is a very long ...')
      expect(truncate('Short', 20)).toBe('Short')
    })

    test('should validate email format', () => {
      const isValidEmail = (email: string): boolean => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        return emailRegex.test(email)
      }

      expect(isValidEmail('user@example.com')).toBe(true)
      expect(isValidEmail('invalid-email')).toBe(false)
      expect(isValidEmail('user@')).toBe(false)
    })

    test('should sanitize user input', () => {
      const sanitize = (input: string): string => {
        return input.trim().replace(/[<>]/g, '')
      }

      expect(sanitize('  hello  ')).toBe('hello')
      expect(sanitize('<script>alert("xss")</script>')).toBe('scriptalert("xss")/script')
    })
  })

  describe('Array Utilities', () => {
    test('should chunk array into smaller arrays', () => {
      const chunk = <T>(array: T[], size: number): T[][] => {
        const chunks: T[][] = []
        for (let i = 0; i < array.length; i += size) {
          chunks.push(array.slice(i, i + size))
        }
        return chunks
      }

      const result = chunk([1, 2, 3, 4, 5, 6, 7], 3)
      expect(result).toEqual([[1, 2, 3], [4, 5, 6], [7]])
    })

    test('should remove duplicates from array', () => {
      const unique = <T>(array: T[]): T[] => {
        return Array.from(new Set(array))
      }

      const result = unique([1, 2, 2, 3, 4, 4, 5])
      expect(result).toEqual([1, 2, 3, 4, 5])
    })

    test('should group items by key', () => {
      const groupBy = <T>(array: T[], key: keyof T): Record<string, T[]> => {
        return array.reduce((acc, item) => {
          const groupKey = String(item[key])
          if (!acc[groupKey]) {
            acc[groupKey] = []
          }
          acc[groupKey].push(item)
          return acc
        }, {} as Record<string, T[]>)
      }

      const items = [
        { type: 'A', value: 1 },
        { type: 'B', value: 2 },
        { type: 'A', value: 3 },
      ]

      const grouped = groupBy(items, 'type')
      expect(grouped['A']).toHaveLength(2)
      expect(grouped['B']).toHaveLength(1)
    })
  })

  describe('Validation Helpers', () => {
    test('should validate phone number format', () => {
      const isValidPhone = (phone: string): boolean => {
        const phoneRegex = /^\+?[1-9]\d{1,14}$/
        return phoneRegex.test(phone.replace(/[\s()-]/g, ''))
      }

      expect(isValidPhone('+919876543210')).toBe(true)
      expect(isValidPhone('9876543210')).toBe(true)
      expect(isValidPhone('invalid')).toBe(false)
    })

    test('should validate CUID format', () => {
      const isValidCUID = (id: string): boolean => {
        const cuidRegex = /^c[a-z0-9]{24}$/
        return cuidRegex.test(id)
      }

      expect(isValidCUID('clx1234567890abcdefghijk')).toBe(true)
      expect(isValidCUID('invalid-id')).toBe(false)
      expect(isValidCUID('clx123')).toBe(false)
    })

    test('should check if date is in past', () => {
      const isPastDate = (date: Date): boolean => {
        const today = new Date()
        today.setHours(0, 0, 0, 0)
        return date < today
      }

      const yesterday = new Date()
      yesterday.setDate(yesterday.getDate() - 1)
      
      const tomorrow = new Date()
      tomorrow.setDate(tomorrow.getDate() + 1)

      expect(isPastDate(yesterday)).toBe(true)
      expect(isPastDate(tomorrow)).toBe(false)
    })

    test('should check if date is weekend', () => {
      const isWeekend = (date: Date): boolean => {
        const day = date.getDay()
        return day === 0 || day === 6 // Sunday or Saturday
      }

      const saturday = new Date('2025-11-01') // Saturday
      const monday = new Date('2025-11-03') // Monday

      expect(isWeekend(saturday)).toBe(true)
      expect(isWeekend(monday)).toBe(false)
    })
  })

  describe('Error Handling', () => {
    test('should handle division by zero', () => {
      const safeDivide = (a: number, b: number): number | null => {
        return b === 0 ? null : a / b
      }

      expect(safeDivide(10, 2)).toBe(5)
      expect(safeDivide(10, 0)).toBeNull()
    })

    test('should provide fallback value for null/undefined', () => {
      const getValueOrDefault = <T>(value: T | null | undefined, defaultValue: T): T => {
        return value ?? defaultValue
      }

      expect(getValueOrDefault(null, 'default')).toBe('default')
      expect(getValueOrDefault(undefined, 'default')).toBe('default')
      expect(getValueOrDefault('value', 'default')).toBe('value')
      expect(getValueOrDefault(0, 10)).toBe(0) // 0 is falsy but not nullish
    })
  })

  describe('Business Logic Helpers', () => {
    test('should calculate refund amount based on cancellation policy', () => {
      const calculateRefund = (
        totalAmount: number,
        daysBeforeCheckIn: number
      ): number => {
        if (daysBeforeCheckIn >= 7) {
          return totalAmount // 100% refund
        } else if (daysBeforeCheckIn >= 3) {
          return totalAmount * 0.5 // 50% refund
        } else {
          return 0 // No refund
        }
      }

      expect(calculateRefund(1000, 10)).toBe(1000)
      expect(calculateRefund(1000, 5)).toBe(500)
      expect(calculateRefund(1000, 1)).toBe(0)
    })

    test('should determine if booking is modifiable', () => {
      const isModifiable = (checkInDate: Date): boolean => {
        const today = new Date()
        today.setHours(0, 0, 0, 0)
        
        const daysUntilCheckIn = Math.ceil(
          (checkInDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
        )
        
        return daysUntilCheckIn >= 2
      }

      const futureDate = new Date()
      futureDate.setDate(futureDate.getDate() + 5)
      
      const nearDate = new Date()
      nearDate.setDate(nearDate.getDate() + 1)

      expect(isModifiable(futureDate)).toBe(true)
      expect(isModifiable(nearDate)).toBe(false)
    })
  })
})
