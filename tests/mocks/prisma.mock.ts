/**
 * Mock Prisma Client for Testing
 * Provides a fully mocked Prisma client for integration tests
 */

import { PrismaClient, BookingStatus, GuestType, PaymentStatus } from '@prisma/client'

export const createMockPrismaClient = (): any => {
  // In-memory storage
  const users: any[] = []
  const bookings: any[] = []
  const roomTypes: any[] = []
  const roomInventory: any[] = []
  const payments: any[] = []
  const bookingRules: any[] = []

  const mockPrisma: any = {
    user: {
      findUnique: jest.fn((args: any) => {
        const user = users.find(u => 
          (args.where.id && u.id === args.where.id) ||
          (args.where.email && u.email === args.where.email)
        )
        return Promise.resolve(user || null)
      }),
      findMany: jest.fn(() => Promise.resolve(users)),
      create: jest.fn((args: any) => {
        const user = {
          id: `user_${Date.now()}`,
          createdAt: new Date(),
          updatedAt: new Date(),
          ...args.data,
        }
        users.push(user)
        return Promise.resolve(user)
      }),
      update: jest.fn((args: any) => {
        const index = users.findIndex(u => u.id === args.where.id)
        if (index !== -1) {
          users[index] = { ...users[index], ...args.data, updatedAt: new Date() }
          return Promise.resolve(users[index])
        }
        return Promise.reject(new Error('User not found'))
      }),
      delete: jest.fn((args: any) => {
        const index = users.findIndex(u => u.id === args.where.id)
        if (index !== -1) {
          const deleted = users.splice(index, 1)[0]
          return Promise.resolve(deleted)
        }
        return Promise.reject(new Error('User not found'))
      }),
    },

    booking: {
      findUnique: jest.fn((args: any) => {
        const booking = bookings.find(b => b.id === args.where.id)
        return Promise.resolve(booking || null)
      }),
      findMany: jest.fn((args: any) => {
        let filtered = [...bookings]
        
        if (args?.where) {
          if (args.where.userId) {
            filtered = filtered.filter(b => b.userId === args.where.userId)
          }
          if (args.where.status) {
            filtered = filtered.filter(b => b.status === args.where.status)
          }
          if (args.where.roomTypeId) {
            filtered = filtered.filter(b => b.roomTypeId === args.where.roomTypeId)
          }
        }
        
        return Promise.resolve(filtered)
      }),
      create: jest.fn((args: any) => {
        const booking = {
          id: `booking_${Date.now()}`,
          createdAt: new Date(),
          updatedAt: new Date(),
          status: BookingStatus.PROVISIONAL,
          ...args.data,
        }
        bookings.push(booking)
        return Promise.resolve(booking)
      }),
      update: jest.fn((args: any) => {
        const index = bookings.findIndex(b => b.id === args.where.id)
        if (index !== -1) {
          bookings[index] = { ...bookings[index], ...args.data, updatedAt: new Date() }
          return Promise.resolve(bookings[index])
        }
        return Promise.reject(new Error('Booking not found'))
      }),
      delete: jest.fn((args: any) => {
        const index = bookings.findIndex(b => b.id === args.where.id)
        if (index !== -1) {
          const deleted = bookings.splice(index, 1)[0]
          return Promise.resolve(deleted)
        }
        return Promise.reject(new Error('Booking not found'))
      }),
    },

    roomType: {
      findUnique: jest.fn((args: any) => {
        const roomType = roomTypes.find(rt => rt.id === args.where.id)
        return Promise.resolve(roomType || null)
      }),
      findMany: jest.fn(() => Promise.resolve(roomTypes)),
      create: jest.fn((args: any) => {
        const roomType = {
          id: `roomtype_${Date.now()}`,
          createdAt: new Date(),
          updatedAt: new Date(),
          ...args.data,
        }
        roomTypes.push(roomType)
        return Promise.resolve(roomType)
      }),
      update: jest.fn((args: any) => {
        const index = roomTypes.findIndex(rt => rt.id === args.where.id)
        if (index !== -1) {
          roomTypes[index] = { ...roomTypes[index], ...args.data, updatedAt: new Date() }
          return Promise.resolve(roomTypes[index])
        }
        return Promise.reject(new Error('Room type not found'))
      }),
    },

    roomInventory: {
      findUnique: jest.fn((args: any) => {
        if (args.where.id) {
          const inventory = roomInventory.find(i => i.id === args.where.id)
          return Promise.resolve(inventory || null)
        }
        if (args.where.roomTypeId_date) {
          const inventory = roomInventory.find(i => 
            i.roomTypeId === args.where.roomTypeId_date.roomTypeId &&
            i.date.getTime() === new Date(args.where.roomTypeId_date.date).getTime()
          )
          return Promise.resolve(inventory || null)
        }
        return Promise.resolve(null)
      }),
      findMany: jest.fn((args: any) => {
        let filtered = [...roomInventory]
        
        if (args?.where) {
          if (args.where.roomTypeId) {
            filtered = filtered.filter(i => i.roomTypeId === args.where.roomTypeId)
          }
          if (args.where.date) {
            if (args.where.date.gte) {
              filtered = filtered.filter(i => i.date >= new Date(args.where.date.gte))
            }
            if (args.where.date.lt) {
              filtered = filtered.filter(i => i.date < new Date(args.where.date.lt))
            }
          }
        }
        
        return Promise.resolve(filtered)
      }),
      create: jest.fn((args: any) => {
        const inventory = {
          id: `inventory_${Date.now()}`,
          createdAt: new Date(),
          updatedAt: new Date(),
          ...args.data,
        }
        roomInventory.push(inventory)
        return Promise.resolve(inventory)
      }),
      update: jest.fn((args: any) => {
        const index = roomInventory.findIndex(i => i.id === args.where.id)
        if (index !== -1) {
          roomInventory[index] = { ...roomInventory[index], ...args.data, updatedAt: new Date() }
          return Promise.resolve(roomInventory[index])
        }
        return Promise.reject(new Error('Inventory not found'))
      }),
      upsert: jest.fn((args: any) => {
        const existing = roomInventory.find(i => 
          i.roomTypeId === args.where.roomTypeId_date.roomTypeId &&
          i.date.getTime() === new Date(args.where.roomTypeId_date.date).getTime()
        )
        
        if (existing) {
          Object.assign(existing, args.update, { updatedAt: new Date() })
          return Promise.resolve(existing)
        } else {
          const newInventory = {
            id: `inventory_${Date.now()}`,
            createdAt: new Date(),
            updatedAt: new Date(),
            ...args.create,
          }
          roomInventory.push(newInventory)
          return Promise.resolve(newInventory)
        }
      }),
    },

    payment: {
      findUnique: jest.fn((args: any) => {
        const payment = payments.find(p => p.id === args.where.id)
        return Promise.resolve(payment || null)
      }),
      findMany: jest.fn((args: any) => {
        let filtered = [...payments]
        
        if (args?.where) {
          if (args.where.bookingId) {
            filtered = filtered.filter(p => p.bookingId === args.where.bookingId)
          }
          if (args.where.userId) {
            filtered = filtered.filter(p => p.userId === args.where.userId)
          }
        }
        
        return Promise.resolve(filtered)
      }),
      create: jest.fn((args: any) => {
        const payment = {
          id: `payment_${Date.now()}`,
          createdAt: new Date(),
          updatedAt: new Date(),
          status: PaymentStatus.PENDING,
          ...args.data,
        }
        payments.push(payment)
        return Promise.resolve(payment)
      }),
      update: jest.fn((args: any) => {
        const index = payments.findIndex(p => p.id === args.where.id)
        if (index !== -1) {
          payments[index] = { ...payments[index], ...args.data, updatedAt: new Date() }
          return Promise.resolve(payments[index])
        }
        return Promise.reject(new Error('Payment not found'))
      }),
    },

    bookingRules: {
      findUnique: jest.fn((args: any) => {
        const rule = bookingRules.find(r => r.id === args.where.id)
        return Promise.resolve(rule || null)
      }),
      findMany: jest.fn((args: any) => {
        let filtered = [...bookingRules]
        
        if (args?.where?.guestType) {
          filtered = filtered.filter(r => r.guestType === args.where.guestType)
        }
        
        return Promise.resolve(filtered)
      }),
      create: jest.fn((args: any) => {
        const rule = {
          id: `rule_${Date.now()}`,
          createdAt: new Date(),
          updatedAt: new Date(),
          ...args.data,
        }
        bookingRules.push(rule)
        return Promise.resolve(rule)
      }),
      update: jest.fn((args: any) => {
        const index = bookingRules.findIndex(r => r.id === args.where.id)
        if (index !== -1) {
          bookingRules[index] = { ...bookingRules[index], ...args.data, updatedAt: new Date() }
          return Promise.resolve(bookingRules[index])
        }
        return Promise.reject(new Error('Booking rule not found'))
      }),
    },

    $transaction: jest.fn((callback: any) => {
      if (typeof callback === 'function') {
        return callback(mockPrisma)
      }
      return Promise.all(callback)
    }),
  }

  return mockPrisma
}

/**
 * Helper to seed mock data
 */
export const seedMockData = (mockPrisma: any) => {
  // Seed booking rules (3-2-1 system)
  const rules = [
    {
      id: 'rule_regular',
      guestType: GuestType.REGULAR,
      maxDaysAdvance: 90,
      minDaysNotice: 2,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: 'rule_vip',
      guestType: GuestType.VIP,
      maxDaysAdvance: 60,
      minDaysNotice: 1,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: 'rule_corporate',
      guestType: GuestType.CORPORATE,
      maxDaysAdvance: 30,
      minDaysNotice: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ]

  rules.forEach(rule => mockPrisma.bookingRules.create({ data: rule }))

  // Seed room types
  const roomType = {
    id: 'roomtype_deluxe',
    name: 'Deluxe Room',
    description: 'Spacious room with modern amenities',
    basePrice: 5000,
    totalRooms: 10,
    amenities: ['AC', 'TV', 'WiFi'],
    createdAt: new Date(),
    updatedAt: new Date(),
  }

  mockPrisma.roomType.create({ data: roomType })

  // Seed inventory for next 30 days
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  for (let i = 0; i < 30; i++) {
    const date = new Date(today)
    date.setDate(date.getDate() + i)
    
    mockPrisma.roomInventory.create({
      data: {
        id: `inventory_${i}`,
        roomTypeId: 'roomtype_deluxe',
        date,
        availableRooms: 10,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    })
  }

  // Seed test user
  mockPrisma.user.create({
    data: {
      id: 'user_test',
      email: 'test@example.com',
      firstName: 'Test',
      lastName: 'User',
      // role: UserRole.MEMBER, // Removed, not exported by @prisma/client
      guestType: GuestType.REGULAR,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  })
}
