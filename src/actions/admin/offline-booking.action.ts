/**
 * Offline Customer Booking Actions
 * Server actions for admin/superAdmin to create walk-in customer bookings
 * Handles customer creation + booking + check-in without customer login
 */

'use server'

import { prisma } from '@/lib/prisma'
import { BookingStatus, PaymentStatus, RoleName, VipStatus } from '@prisma/client'
import { revalidatePath } from 'next/cache'
import { getCurrentUser } from '@/lib/middleware/auth.utils'

// ==========================================
// TYPES
// ==========================================

export interface OfflineCustomerData {
  name: string
  phone: string
  email?: string
  address?: string
  idType?: string // Passport, Driver's License, Aadhar, etc.
  idNumber?: string
  vipStatus?: VipStatus
  ircaMembershipId?: string
}

export interface OfflineBookingData {
  // Customer info
  customer: OfflineCustomerData
  
  // Booking details
  roomTypeId: string
  startDate: string // ISO date string (YYYY-MM-DD)
  endDate: string   // ISO date string (YYYY-MM-DD)
  roomsBooked: number
  
  // Payment info (optional - can be paid later)
  paymentAmount?: number // Amount in cents
  paymentMethod?: 'CASH' | 'CARD' | 'BANK_TRANSFER' | 'CHEQUE' | 'OTHER'
  referenceNumber?: string
  paymentNotes?: string
  
  // Booking notes
  notes?: string
  specialRequests?: string
  
  // Auto check-in option
  autoCheckIn?: boolean
}

export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

export interface OfflineBookingResult {
  booking: {
    id: string
    userId: string
    roomTypeId: string
    startDate: Date
    endDate: Date
    status: BookingStatus
    totalPrice: number
    roomsBooked: number
  }
  customer: {
    id: string
    name: string
    phone: string
    email: string | null
  }
  payment?: {
    id: string
    amount: number
    status: PaymentStatus
  }
  isCheckedIn: boolean
}

// ==========================================
// AUTHORIZATION HELPER
// ==========================================

async function requireAdminAuth() {
  const userContext = await getCurrentUser()
  
  if (!userContext) {
    throw new Error('Unauthorized: Please login')
  }

  const user = await prisma.user.findUnique({
    where: { id: userContext.userId },
    include: { role: true }
  })

  if (!user || (user.role.name !== RoleName.ADMIN && user.role.name !== RoleName.SUPERADMIN)) {
    throw new Error('Unauthorized: Admin or Super Admin access required')
  }

  return user
}

// ==========================================
// HELPER FUNCTIONS
// ==========================================

/**
 * Calculate number of nights between dates
 */
function calculateNights(startDate: Date, endDate: Date): number {
  const diff = endDate.getTime() - startDate.getTime()
  return Math.ceil(diff / (1000 * 60 * 60 * 24))
}

/**
 * Validate room availability for booking
 */
async function checkRoomAvailability(
  roomTypeId: string,
  startDate: Date,
  endDate: Date,
  roomsNeeded: number
): Promise<{ available: boolean; message?: string }> {
  // Get room type details
  const roomType = await prisma.roomType.findUnique({
    where: { id: roomTypeId }
  })

  if (!roomType) {
    return { available: false, message: 'Room type not found' }
  }

  // Check inventory for each date in the range
  const currentDate = new Date(startDate)
  currentDate.setHours(0, 0, 0, 0) // Normalize to start of day
  
  const lastDate = new Date(endDate)
  lastDate.setHours(0, 0, 0, 0)
  
  while (currentDate < lastDate) {
    // Create a clean date for lookup
    const lookupDate = new Date(currentDate)
    lookupDate.setHours(0, 0, 0, 0)
    
    const inventory = await prisma.roomInventory.findUnique({
      where: {
        roomTypeId_date: {
          roomTypeId,
          date: lookupDate
        }
      }
    })

    if (!inventory || inventory.availableRooms < roomsNeeded) {
      return {
        available: false,
        message: `Insufficient rooms available on ${currentDate.toISOString().split('T')[0]}`
      }
    }

    currentDate.setDate(currentDate.getDate() + 1)
  }

  return { available: true }
}

/**
 * Update room inventory after booking
 */
async function updateRoomInventory(
  roomTypeId: string,
  startDate: Date,
  endDate: Date,
  roomsBooked: number,
  tx: any
) {
  const currentDate = new Date(startDate)
  currentDate.setHours(0, 0, 0, 0) // Normalize to start of day
  
  const lastDate = new Date(endDate)
  lastDate.setHours(0, 0, 0, 0)
  
  while (currentDate < lastDate) {
    // Create a clean date for update
    const updateDate = new Date(currentDate)
    updateDate.setHours(0, 0, 0, 0)
    
    await tx.roomInventory.update({
      where: {
        roomTypeId_date: {
          roomTypeId,
          date: updateDate
        }
      },
      data: {
        availableRooms: {
          decrement: roomsBooked
        }
      }
    })

    currentDate.setDate(currentDate.getDate() + 1)
  }
}

// ==========================================
// MAIN ACTIONS
// ==========================================

/**
 * Create or find existing customer
 * Returns existing user if phone number matches, otherwise creates new user
 */
async function findOrCreateCustomer(
  customerData: OfflineCustomerData,
  tx: any
): Promise<{ id: string; name: string; phone: string; email: string | null; isNew: boolean }> {
  // Check if user already exists by phone
  const existingUser = await tx.user.findUnique({
    where: { phone: customerData.phone }
  })

  if (existingUser) {
    // Update user info if provided
    const updatedUser = await tx.user.update({
      where: { id: existingUser.id },
      data: {
        name: customerData.name || existingUser.name,
        email: customerData.email || existingUser.email,
        address: customerData.address || existingUser.address,
        vipStatus: customerData.vipStatus || existingUser.vipStatus,
        ircaMembershipId: customerData.ircaMembershipId || existingUser.ircaMembershipId,
      }
    })

    return {
      id: updatedUser.id,
      name: updatedUser.name,
      phone: updatedUser.phone,
      email: updatedUser.email,
      isNew: false
    }
  }

  // Get MEMBER role
  const memberRole = await tx.role.findUnique({
    where: { name: RoleName.MEMBER }
  })

  if (!memberRole) {
    throw new Error('Member role not found in database')
  }

  // Create new user
  const newUser = await tx.user.create({
    data: {
      phone: customerData.phone,
      name: customerData.name,
      email: customerData.email,
      address: customerData.address,
      vipStatus: customerData.vipStatus || VipStatus.NONE,
      ircaMembershipId: customerData.ircaMembershipId,
      roleId: memberRole.id,
      profileCompleted: true,
      termsAccepted: true,
    }
  })

  return {
    id: newUser.id,
    name: newUser.name,
    phone: newUser.phone,
    email: newUser.email,
    isNew: true
  }
}

/**
 * Create offline customer booking with optional auto check-in
 * This is the main function for walk-in customers
 */
export async function createOfflineBooking(
  payload: OfflineBookingData
): Promise<ApiResponse<OfflineBookingResult>> {
  try {
    const admin = await requireAdminAuth()

    // Validate dates
    const startDate = new Date(payload.startDate)
    const endDate = new Date(payload.endDate)
    
    if (startDate >= endDate) {
      return {
        success: false,
        error: 'End date must be after start date'
      }
    }

    // Validate room count
    if (payload.roomsBooked < 1) {
      return {
        success: false,
        error: 'At least 1 room must be booked'
      }
    }

    // Check room availability
    const availabilityCheck = await checkRoomAvailability(
      payload.roomTypeId,
      startDate,
      endDate,
      payload.roomsBooked
    )

    if (!availabilityCheck.available) {
      return {
        success: false,
        error: availabilityCheck.message || 'Rooms not available'
      }
    }

    // Get room type for pricing
    const roomType = await prisma.roomType.findUnique({
      where: { id: payload.roomTypeId }
    })

    if (!roomType) {
      return {
        success: false,
        error: 'Room type not found'
      }
    }

    // Calculate pricing
    const nights = calculateNights(startDate, endDate)
    const totalPrice = roomType.pricePerNight * nights * payload.roomsBooked

    // Create booking in transaction
    const result = await prisma.$transaction(async (tx) => {
      // 1. Find or create customer
      const customer = await findOrCreateCustomer(payload.customer, tx)

      // 2. Update room inventory
      await updateRoomInventory(
        payload.roomTypeId,
        startDate,
        endDate,
        payload.roomsBooked,
        tx
      )

      // 3. Create booking
      const booking = await tx.booking.create({
        data: {
          userId: customer.id,
          roomTypeId: payload.roomTypeId,
          startDate,
          endDate,
          totalPrice,
          roomsBooked: payload.roomsBooked,
          status: payload.autoCheckIn ? BookingStatus.CONFIRMED : BookingStatus.PROVISIONAL,
        }
      })

      // 4. Create payment if provided
      let payment = null
      if (payload.paymentAmount && payload.paymentAmount > 0) {
        payment = await tx.payment.create({
          data: {
            userId: customer.id,
            bookingId: booking.id,
            amount: payload.paymentAmount,
            status: PaymentStatus.SUCCEEDED,
            provider: 'OFFLINE',
            providerPaymentId: payload.referenceNumber || `OFFLINE-${Date.now()}`,
            paidAt: new Date(),
          }
        })

        // Check if fully paid and auto-confirm if not already confirmed
        if (payload.paymentAmount >= totalPrice && booking.status === BookingStatus.PROVISIONAL) {
          await tx.booking.update({
            where: { id: booking.id },
            data: { status: BookingStatus.CONFIRMED }
          })
        }
      }

      // 5. Create audit log for booking creation
      await tx.bookingAuditLog.create({
        data: {
          bookingId: booking.id,
          adminId: admin.id,
          action: 'OFFLINE_BOOKING_CREATED',
          metadata: JSON.stringify({
            customerIsNew: customer.isNew,
            customerName: customer.name,
            customerPhone: customer.phone,
            roomsBooked: payload.roomsBooked,
            totalPrice,
            paymentAmount: payload.paymentAmount,
            paymentMethod: payload.paymentMethod,
            autoCheckIn: payload.autoCheckIn,
            notes: payload.notes,
            specialRequests: payload.specialRequests,
            performedBy: admin.name
          })
        }
      })

      // 6. Create check-in audit log if auto check-in enabled
      if (payload.autoCheckIn) {
        await tx.bookingAuditLog.create({
          data: {
            bookingId: booking.id,
            adminId: admin.id,
            action: 'CHECK_IN',
            metadata: JSON.stringify({
              notes: 'Auto check-in for offline booking',
              actualCheckInTime: new Date(),
              offlineBooking: true,
              performedBy: admin.name
            })
          }
        })
      }

      return { booking, customer, payment }
    })

    revalidatePath('/admin/dashboard')
    revalidatePath('/admin/bookings')

    return {
      success: true,
      data: {
        booking: result.booking,
        customer: result.customer,
        payment: result.payment || undefined,
        isCheckedIn: payload.autoCheckIn || false
      },
      message: payload.autoCheckIn 
        ? 'Offline booking created and customer checked in successfully'
        : 'Offline booking created successfully'
    }
  } catch (error) {
    console.error('Offline booking error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create offline booking'
    }
  }
}

/**
 * Quick check-in for walk-in customer (no advance booking)
 * Creates customer, booking, and checks in all at once
 */
export async function quickCheckIn(
  payload: Omit<OfflineBookingData, 'autoCheckIn'>
): Promise<ApiResponse<OfflineBookingResult>> {
  return createOfflineBooking({
    ...payload,
    autoCheckIn: true
  })
}

/**
 * Get available room types for date range
 */
export async function getAvailableRoomTypes(
  startDate: string,
  endDate: string,
  roomsNeeded: number = 1
): Promise<ApiResponse<any[]>> {
  try {
    await requireAdminAuth()

    // Parse dates and normalize to start of day
    const start = new Date(startDate)
    start.setHours(0, 0, 0, 0)
    
    const end = new Date(endDate)
    end.setHours(0, 0, 0, 0)

    if (start >= end) {
      return {
        success: false,
        error: 'End date must be after start date'
      }
    }

    // Get all room types
    const roomTypes = await prisma.roomType.findMany({
      orderBy: { pricePerNight: 'asc' }
    })

    // Check availability for each room type
    const availableRoomTypes = []

    for (const roomType of roomTypes) {
      const check = await checkRoomAvailability(roomType.id, start, end, roomsNeeded)
      
      if (check.available) {
        const nights = calculateNights(start, end)
        availableRoomTypes.push({
          ...roomType,
          totalPrice: roomType.pricePerNight * nights * roomsNeeded,
          nights
        })
      }
    }

    return {
      success: true,
      data: availableRoomTypes
    }
  } catch (error) {
    console.error('Get available rooms error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get available rooms'
    }
  }
}

/**
 * Validate customer phone number (check if exists)
 */
export async function validateCustomerPhone(
  phone: string
): Promise<ApiResponse<{ exists: boolean; customer?: any }>> {
  try {
    await requireAdminAuth()

    const user = await prisma.user.findUnique({
      where: { phone },
      select: {
        id: true,
        name: true,
        phone: true,
        email: true,
        address: true,
        vipStatus: true,
        ircaMembershipId: true,
      }
    })

    return {
      success: true,
      data: {
        exists: !!user,
        customer: user || undefined
      }
    }
  } catch (error) {
    console.error('Validate phone error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to validate phone'
    }
  }
}
