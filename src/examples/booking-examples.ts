// ==========================================
// BOOKING SYSTEM USAGE EXAMPLES
// ==========================================
// Examples demonstrating how to use the booking system
// Features: Provisional bookings, confirmations, cancellations, and rule management

import {
  createProvisionalBooking,
  confirmBooking,
  cancelBooking,
  getUserBookings,
  checkAvailability,
} from '@/actions/bookings/booking.action'
import {
  createBookingRules,
  getBookingRules,
  updateBookingRules,
} from '@/actions/bookings/booking-rules.action'
import { GuestType } from '@prisma/client'

// ==========================================
// EXAMPLE 1: CREATE PROVISIONAL BOOKING
// ==========================================

/**
 * Example: Member creates a provisional booking
 */
export async function exampleCreateProvisionalBooking() {
  console.log('📅 Creating provisional booking...')
  
  const result = await createProvisionalBooking({
    userId: 'user123', // Replace with actual user ID
    roomTypeId: 'room456', // Replace with actual room type ID
    startDate: new Date('2024-01-15'),
    endDate: new Date('2024-01-18'), // 3 nights
  })

  if (result.success) {
    console.log('✅ Provisional booking created!')
    console.log('Booking ID:', result.data?.booking.id)
    console.log('Total Price:', result.data?.booking.totalPrice)
    console.log('Status:', result.data?.booking.status)
    
    if (result.data?.conflicts) {
      console.log('⚠️ Conflicts detected:', result.data.conflicts)
    }
  } else {
    console.log('❌ Booking failed:', result.message)
  }

  return result
}

// ==========================================
// EXAMPLE 2: CONFIRM BOOKING
// ==========================================

/**
 * Example: Confirm a provisional booking
 */
export async function exampleConfirmBooking(bookingId: string, userId: string) {
  console.log('✅ Confirming booking...')
  
  const result = await confirmBooking({
    bookingId,
    userId,
  })

  if (result.success) {
    console.log('✅ Booking confirmed!')
    console.log('Booking ID:', result.data?.booking.id)
    console.log('Status:', result.data?.booking.status)
    console.log('Inventory Updated:', result.data?.inventoryUpdated)
  } else {
    console.log('❌ Confirmation failed:', result.message)
  }

  return result
}

// ==========================================
// EXAMPLE 3: CANCEL BOOKING
// ==========================================

/**
 * Example: Cancel a booking
 */
export async function exampleCancelBooking(bookingId: string, userId: string) {
  console.log('❌ Cancelling booking...')
  
  const result = await cancelBooking({
    bookingId,
    userId,
    reason: 'Change of plans',
  })

  if (result.success) {
    console.log('✅ Booking cancelled!')
    console.log('Booking ID:', result.data?.booking.id)
    console.log('Status:', result.data?.booking.status)
    console.log('Inventory Restored:', result.data?.inventoryRestored)
    
    if (result.data?.refundAmount) {
      console.log('💰 Refund Amount:', result.data.refundAmount)
    }
  } else {
    console.log('❌ Cancellation failed:', result.message)
  }

  return result
}

// ==========================================
// EXAMPLE 4: CHECK AVAILABILITY
// ==========================================

/**
 * Example: Check room availability before booking
 */
export async function exampleCheckAvailability() {
  console.log('🔍 Checking room availability...')
  
  const result = await checkAvailability({
    roomTypeId: 'room456',
    startDate: new Date('2024-01-20'),
    endDate: new Date('2024-01-23'),
  })

  if (result.success) {
    console.log('✅ Availability check completed!')
    console.log('Available:', result.data?.isAvailable)
    console.log('Available Rooms:', result.data?.availableRooms)
    
    if (result.data?.conflicts) {
      console.log('⚠️ Conflicts:', result.data.conflicts)
    }
  } else {
    console.log('❌ Availability check failed:', result.message)
  }

  return result
}

// ==========================================
// EXAMPLE 5: GET USER BOOKINGS
// ==========================================

/**
 * Example: Get all bookings for a user
 */
export async function exampleGetUserBookings(userId: string) {
  console.log('📋 Getting user bookings...')
  
  const result = await getUserBookings({
    userId,
    page: 1,
    pageSize: 10,
  })

  if (result.success) {
    console.log('✅ User bookings retrieved!')
    console.log('Total Bookings:', result.data?.pagination.totalCount)
    console.log('Bookings:', result.data?.bookings.map(b => ({
      id: b.id,
      status: b.status,
      roomType: b.roomTypeName,
      dates: `${b.startDate.toISOString().split('T')[0]} to ${b.endDate.toISOString().split('T')[0]}`,
      price: b.totalPrice,
    })))
  } else {
    console.log('❌ Failed to get bookings:', result.message)
  }

  return result
}

// ==========================================
// EXAMPLE 6: MANAGE BOOKING RULES
// ==========================================

/**
 * Example: Create booking rules for different guest types
 */
export async function exampleCreateBookingRules() {
  console.log('📋 Creating booking rules...')
  
  // Create rules for VIP guests
  const vipRules = await createBookingRules({
    guestType: GuestType.VIP,
    maxDaysAdvance: 365, // Can book 1 year in advance
    minDaysNotice: 0,    // No minimum notice required
  })

  if (vipRules.success) {
    console.log('✅ VIP rules created!')
    console.log('Max Days Advance:', vipRules.data?.maxDaysAdvance)
    console.log('Min Days Notice:', vipRules.data?.minDaysNotice)
  }

  // Create rules for Corporate guests
  const corporateRules = await createBookingRules({
    guestType: GuestType.CORPORATE,
    maxDaysAdvance: 180, // Can book 6 months in advance
    minDaysNotice: 0,    // No minimum notice required
  })

  if (corporateRules.success) {
    console.log('✅ Corporate rules created!')
  }

  // Create rules for Regular guests
  const regularRules = await createBookingRules({
    guestType: GuestType.REGULAR,
    maxDaysAdvance: 90,  // Can book 3 months in advance
    minDaysNotice: 1,    // Must book at least 1 day in advance
  })

  if (regularRules.success) {
    console.log('✅ Regular rules created!')
  }

  return { vipRules, corporateRules, regularRules }
}

/**
 * Example: Get all booking rules
 */
export async function exampleGetBookingRules() {
  console.log('📋 Getting booking rules...')
  
  const result = await getBookingRules({})

  if (result.success) {
    console.log('✅ Booking rules retrieved!')
    result.data?.forEach(rule => {
      console.log(`${rule.guestType}:`)
      console.log(`  Max Days Advance: ${rule.maxDaysAdvance}`)
      console.log(`  Min Days Notice: ${rule.minDaysNotice}`)
      console.log(`  Applicable Users: ${rule.applicableUserCount}`)
      console.log(`  Active: ${rule.isActive}`)
    })
  } else {
    console.log('❌ Failed to get rules:', result.message)
  }

  return result
}

// ==========================================
// EXAMPLE 7: FULL BOOKING FLOW
// ==========================================

/**
 * Example: Complete booking flow from creation to confirmation
 */
export async function exampleFullBookingFlow() {
  console.log('🚀 Starting full booking flow...')
  
  try {
    // Step 1: Check availability
    console.log('\n1️⃣ Checking availability...')
    const availability = await checkAvailability({
      roomTypeId: 'room456',
      startDate: new Date('2024-02-01'),
      endDate: new Date('2024-02-04'),
    })

    if (!availability.success || !availability.data?.isAvailable) {
      console.log('❌ Rooms not available!')
      return
    }

    console.log('✅ Rooms available:', availability.data.availableRooms)

    // Step 2: Create provisional booking
    console.log('\n2️⃣ Creating provisional booking...')
    const booking = await createProvisionalBooking({
      userId: 'user123',
      roomTypeId: 'room456',
      startDate: new Date('2024-02-01'),
      endDate: new Date('2024-02-04'),
    })

    if (!booking.success || !booking.data?.booking) {
      console.log('❌ Failed to create booking!')
      return
    }

    console.log('✅ Provisional booking created:', booking.data.booking.id)

    // Step 3: Confirm booking
    console.log('\n3️⃣ Confirming booking...')
    const confirmation = await confirmBooking({
      bookingId: booking.data.booking.id,
      userId: 'user123',
    })

    if (!confirmation.success) {
      console.log('❌ Failed to confirm booking!')
      return
    }

    console.log('✅ Booking confirmed!')
    console.log('Final Status:', confirmation.data?.booking.status)
    console.log('Total Price:', confirmation.data?.booking.totalPrice)

    // Step 4: Get updated user bookings
    console.log('\n4️⃣ Getting user bookings...')
    const userBookings = await getUserBookings({
      userId: 'user123',
      page: 1,
      pageSize: 5,
    })

    if (userBookings.success) {
      console.log('✅ User has', userBookings.data?.pagination.totalCount, 'booking(s)')
    }

    console.log('\n🎉 Booking flow completed successfully!')

  } catch (error) {
    console.error('💥 Error in booking flow:', error)
  }
}

// ==========================================
// EXAMPLE 8: BUSINESS RULES VALIDATION
// ==========================================

/**
 * Example: Demonstrating booking rules validation
 */
export async function exampleBookingRulesValidation() {
  console.log('📏 Testing booking rules validation...')

  // Test Regular guest booking too far in advance (should fail)
  console.log('\n🔍 Test 1: Regular guest booking 120 days in advance (should fail)')
  const farAdvanceBooking = await createProvisionalBooking({
    userId: 'regularUser123', // Assuming this is a regular user
    roomTypeId: 'room456',
    startDate: new Date(Date.now() + 120 * 24 * 60 * 60 * 1000), // 120 days from now
    endDate: new Date(Date.now() + 123 * 24 * 60 * 60 * 1000),   // 123 days from now
  })

  if (!farAdvanceBooking.success) {
    console.log('✅ Correctly rejected:', farAdvanceBooking.message)
  } else {
    console.log('❌ Should have been rejected!')
  }

  // Test VIP guest booking far in advance (should succeed)
  console.log('\n🔍 Test 2: VIP guest booking 200 days in advance (should succeed)')
  const vipAdvanceBooking = await createProvisionalBooking({
    userId: 'vipUser123', // Assuming this is a VIP user
    roomTypeId: 'room456',
    startDate: new Date(Date.now() + 200 * 24 * 60 * 60 * 1000), // 200 days from now
    endDate: new Date(Date.now() + 203 * 24 * 60 * 60 * 1000),   // 203 days from now
  })

  if (vipAdvanceBooking.success) {
    console.log('✅ VIP booking allowed:', vipAdvanceBooking.data?.booking.id)
  } else {
    console.log('❌ VIP booking should have been allowed!', vipAdvanceBooking.message)
  }

  // Test same-day booking for regular guest (should fail)
  console.log('\n🔍 Test 3: Regular guest same-day booking (should fail)')
  const sameDayBooking = await createProvisionalBooking({
    userId: 'regularUser123',
    roomTypeId: 'room456',
    startDate: new Date(), // Today
    endDate: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
  })

  if (!sameDayBooking.success) {
    console.log('✅ Correctly rejected same-day booking:', sameDayBooking.message)
  } else {
    console.log('❌ Same-day booking should have been rejected!')
  }

  console.log('\n✅ Booking rules validation tests completed!')
}

// ==========================================
// UTILITY FUNCTIONS
// ==========================================

/**
 * Helper: Generate test dates
 */
export function generateTestDates(daysFromNow: number, nights: number = 3) {
  const startDate = new Date(Date.now() + daysFromNow * 24 * 60 * 60 * 1000)
  const endDate = new Date(startDate.getTime() + nights * 24 * 60 * 60 * 1000)
  
  return { startDate, endDate, nights }
}

/**
 * Helper: Format booking summary
 */
export function formatBookingSummary(booking: any) {
  return {
    id: booking.id,
    status: booking.status,
    guest: booking.user.name,
    room: booking.roomType.name,
    checkIn: booking.startDate.toISOString().split('T')[0],
    checkOut: booking.endDate.toISOString().split('T')[0],
    nights: Math.ceil(
      (booking.endDate.getTime() - booking.startDate.getTime()) / (1000 * 60 * 60 * 24)
    ),
    totalPrice: `$${(booking.totalPrice / 100).toFixed(2)}`,
    pricePerNight: `$${(booking.roomType.pricePerNight / 100).toFixed(2)}`,
  }
}

/**
 * Helper: Calculate booking statistics
 */
export function calculateBookingStats(bookings: any[]) {
  const stats = {
    total: bookings.length,
    provisional: 0,
    confirmed: 0,
    cancelled: 0,
    totalRevenue: 0,
    averageNights: 0,
    averageValue: 0,
  }

  let totalNights = 0

  bookings.forEach(booking => {
    switch (booking.status) {
      case 'PROVISIONAL':
        stats.provisional++
        break
      case 'CONFIRMED':
        stats.confirmed++
        stats.totalRevenue += booking.totalPrice
        break
      case 'CANCELLED':
        stats.cancelled++
        break
    }

    const nights = Math.ceil(
      (booking.endDate.getTime() - booking.startDate.getTime()) / (1000 * 60 * 60 * 24)
    )
    totalNights += nights
  })

  stats.averageNights = stats.total > 0 ? totalNights / stats.total : 0
  stats.averageValue = stats.confirmed > 0 ? stats.totalRevenue / stats.confirmed : 0

  return stats
}

// Export all examples for easy testing
export const bookingExamples = {
  createProvisionalBooking: exampleCreateProvisionalBooking,
  confirmBooking: exampleConfirmBooking,
  cancelBooking: exampleCancelBooking,
  checkAvailability: exampleCheckAvailability,
  getUserBookings: exampleGetUserBookings,
  createBookingRules: exampleCreateBookingRules,
  getBookingRules: exampleGetBookingRules,
  fullBookingFlow: exampleFullBookingFlow,
  bookingRulesValidation: exampleBookingRulesValidation,
}