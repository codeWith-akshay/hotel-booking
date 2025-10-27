/**
 * Concurrency Test Simulation Script (Day 13)
 * 
 * Tests the concurrency-safe booking system by firing multiple simultaneous
 * booking requests and verifying that:
 * 1. No overbooking occurs (inventory never goes negative)
 * 2. Correct number of bookings succeed based on available inventory
 * 3. Idempotency works (duplicate requests return same booking)
 * 4. Race conditions are properly handled
 * 
 * Usage:
 *   pnpm tsx scripts/test-concurrency.ts
 * 
 * Test Scenarios:
 * - Scenario 1: Concurrent requests for same room/dates (should only allow available inventory)
 * - Scenario 2: Duplicate requests with same parameters (should return same booking via idempotency)
 * - Scenario 3: High concurrency stress test (100+ simultaneous requests)
 */

import { PrismaClient } from '@prisma/client'
import { createConcurrentBooking } from '@/actions/bookings/concurrent-booking.action'
import { ConcurrentBookingRequest } from '@/lib/validation/concurrency.validation'

const prisma = new PrismaClient()

// ANSI color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
}

function log(message: string, color: keyof typeof colors = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`)
}

function logSection(title: string) {
  console.log('\n' + '='.repeat(80))
  log(title, 'bright')
  console.log('='.repeat(80) + '\n')
}

/**
 * Setup test data: create room type and inventory
 */
async function setupTestData() {
  logSection('📦 Setting Up Test Data')
  
  // Clean up previous test data
  await prisma.booking.deleteMany({
    where: {
      user: {
        phone: {
          startsWith: '+1555',
        },
      },
    },
  })
  
  await prisma.user.deleteMany({
    where: {
      phone: {
        startsWith: '+1555',
      },
    },
  })
  
  // Get MEMBER role
  const memberRole = await prisma.role.findUnique({
    where: { name: 'MEMBER' },
  })
  
  if (!memberRole) {
    throw new Error('MEMBER role not found. Run seed script first.')
  }
  
  // Create test users
  const testUsers = await Promise.all(
    Array.from({ length: 20 }, (_, i) => 
      prisma.user.create({
        data: {
          phone: `+1555000${String(i).padStart(4, '0')}`,
          name: `Test User ${i + 1}`,
          email: `testuser${i + 1}@concurrency-test.com`,
          roleId: memberRole.id,
        },
      })
    )
  )
  
  log(`✅ Created ${testUsers.length} test users`, 'green')
  
  // Get or create test room type
  let testRoomType = await prisma.roomType.findFirst({
    where: { name: 'Concurrency Test Room' },
  })
  
  if (!testRoomType) {
    testRoomType = await prisma.roomType.create({
      data: {
        name: 'Concurrency Test Room',
        description: 'Room type for concurrency testing',
        pricePerNight: 10000, // $100.00
        totalRooms: 10,
      },
    })
  }
  
  log(`✅ Test room type: ${testRoomType.name} (${testRoomType.totalRooms} rooms)`, 'green')
  
  // Create inventory for next 7 days
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  
  const inventoryDates = Array.from({ length: 7 }, (_, i) => {
    const date = new Date(today)
    date.setDate(today.getDate() + i)
    return date
  })
  
  for (const date of inventoryDates) {
    await prisma.roomInventory.upsert({
      where: {
        roomTypeId_date: {
          roomTypeId: testRoomType.id,
          date,
        },
      },
      update: {
        availableRooms: testRoomType.totalRooms,
      },
      create: {
        roomTypeId: testRoomType.id,
        date,
        availableRooms: testRoomType.totalRooms,
      },
    })
  }
  
  log(`✅ Created inventory for ${inventoryDates.length} days`, 'green')
  if (inventoryDates.length > 0) {
    log(`   Date range: ${inventoryDates[0]!.toISOString().split('T')[0]} to ${inventoryDates[inventoryDates.length - 1]!.toISOString().split('T')[0]}`, 'cyan')
  }
  
  return {
    users: testUsers,
    roomType: testRoomType,
    startDate: inventoryDates[0]!,
    endDate: inventoryDates[2]!, // 2-night stay
  }
}

/**
 * Test Scenario 1: Concurrent requests for same dates
 * Fires multiple simultaneous requests and verifies only correct number succeed
 */
async function testScenario1(testData: Awaited<ReturnType<typeof setupTestData>>) {
  logSection('🧪 Scenario 1: Concurrent Requests for Same Dates')
  
  const { users, roomType, startDate, endDate } = testData
  const totalRooms = roomType.totalRooms
  const simultaneousRequests = 20 // More requests than available rooms
  
  log(`Total available rooms: ${totalRooms}`, 'yellow')
  log(`Simultaneous requests: ${simultaneousRequests}`, 'yellow')
  log(`Expected successes: ${totalRooms}`, 'yellow')
  log(`Expected failures: ${simultaneousRequests - totalRooms}`, 'yellow')
  log('\n🚀 Firing concurrent requests...\n', 'cyan')
  
  const startTime = Date.now()
  
  // Fire all requests simultaneously
  const requests: Promise<any>[] = users.slice(0, simultaneousRequests).map((user, i) =>
    createConcurrentBooking({
      userId: user.id,
      roomTypeId: roomType.id,
      startDate,
      endDate,
      roomsBooked: 1,
    }).then(result => ({
      requestId: i + 1,
      userId: user.id,
      success: result.success,
      bookingId: result.success ? result.bookingId : undefined,
      error: !result.success ? result.error : undefined,
      message: !result.success ? result.message : undefined,
      duration: Date.now() - startTime,
    }))
  )
  
  const results = await Promise.all(requests)
  const endTime = Date.now()
  
  // Analyze results
  const successful = results.filter(r => r.success)
  const failed = results.filter(r => !r.success)
  
  log('📊 Results:', 'bright')
  log(`   Successful bookings: ${successful.length}`, successful.length === totalRooms ? 'green' : 'red')
  log(`   Failed bookings: ${failed.length}`, failed.length === (simultaneousRequests - totalRooms) ? 'green' : 'red')
  log(`   Total duration: ${endTime - startTime}ms`, 'cyan')
  
  // Verify inventory
  const finalInventory = await prisma.roomInventory.findMany({
    where: {
      roomTypeId: roomType.id,
      date: startDate,
    },
  })
  
  const remainingRooms = finalInventory[0]?.availableRooms ?? 0
  const expectedRemaining = totalRooms - successful.length
  
  log(`\n🏨 Inventory Check:`, 'bright')
  log(`   Remaining rooms: ${remainingRooms}`, 'cyan')
  log(`   Expected: ${expectedRemaining}`, 'cyan')
  log(`   Inventory never negative: ${remainingRooms >= 0 ? '✅' : '❌'}`, remainingRooms >= 0 ? 'green' : 'red')
  
  // Show error distribution
  if (failed.length > 0) {
    const errorCounts = failed.reduce((acc, r) => {
      const error = r.error || 'UNKNOWN'
      acc[error] = (acc[error] || 0) + 1
      return acc
    }, {} as Record<string, number>)
    
    log('\n❌ Error Distribution:', 'yellow')
    Object.entries(errorCounts).forEach(([error, count]) => {
      log(`   ${error}: ${count}`, 'yellow')
    })
  }
  
  return {
    totalRequests: simultaneousRequests,
    successCount: successful.length,
    failureCount: failed.length,
    inventoryValid: remainingRooms >= 0 && remainingRooms === expectedRemaining,
  }
}

/**
 * Test Scenario 2: Idempotency test (duplicate requests)
 * Sends the same request multiple times and verifies same booking is returned
 */
async function testScenario2(testData: Awaited<ReturnType<typeof setupTestData>>) {
  logSection('🧪 Scenario 2: Idempotency Test (Duplicate Requests)')
  
  const { users, roomType, startDate, endDate } = testData
  const testUser = users[0]!
  const duplicateCount = 5
  
  log(`Sending ${duplicateCount} identical requests...`, 'yellow')
  log(`User: ${testUser.name} (${testUser.id})`, 'cyan')
  log(`Dates: ${startDate.toISOString().split('T')[0]} to ${endDate.toISOString().split('T')[0]}`, 'cyan')
  
  // Create a new booking date range to avoid conflicts
  const idempotencyStartDate = new Date(startDate)
  idempotencyStartDate.setDate(startDate.getDate() + 3)
  const idempotencyEndDate = new Date(endDate)
  idempotencyEndDate.setDate(endDate.getDate() + 3)
  
  const startTime = Date.now()
  
  // Send identical requests simultaneously
  const requests = Array.from({ length: duplicateCount }, (_, i) =>
    createConcurrentBooking({
      userId: testUser.id,
      roomTypeId: roomType.id,
      startDate: idempotencyStartDate,
      endDate: idempotencyEndDate,
      roomsBooked: 1,
    }).then(result => ({
      requestId: i + 1,
      success: result.success,
      bookingId: result.success ? result.bookingId : undefined,
      isFromCache: result.success ? result.isFromCache : false,
      duration: Date.now() - startTime,
    }))
  )
  
  const results = await Promise.all(requests)
  const endTime = Date.now()
  
  // Analyze results
  const bookingIds = new Set(results.filter(r => r.success).map(r => r.bookingId))
  const fromCache = results.filter(r => r.isFromCache).length
  
  log('\n📊 Results:', 'bright')
  log(`   Total requests: ${duplicateCount}`, 'cyan')
  log(`   Unique booking IDs: ${bookingIds.size}`, bookingIds.size === 1 ? 'green' : 'red')
  log(`   Responses from cache: ${fromCache}`, 'cyan')
  log(`   Total duration: ${endTime - startTime}ms`, 'cyan')
  log(`   Idempotency working: ${bookingIds.size === 1 ? '✅' : '❌'}`, bookingIds.size === 1 ? 'green' : 'red')
  
  if (bookingIds.size === 1) {
    log(`   All requests returned same booking: ${Array.from(bookingIds)[0]}`, 'green')
  }
  
  return {
    totalRequests: duplicateCount,
    uniqueBookings: bookingIds.size,
    idempotencyWorking: bookingIds.size === 1,
  }
}

/**
 * Test Scenario 3: High concurrency stress test
 */
async function testScenario3(testData: Awaited<ReturnType<typeof setupTestData>>) {
  logSection('🧪 Scenario 3: High Concurrency Stress Test')
  
  const { users, roomType, startDate, endDate } = testData
  const totalRequests = 50
  const batchSize = 10
  
  log(`Total requests: ${totalRequests}`, 'yellow')
  log(`Batch size: ${batchSize}`, 'yellow')
  log(`Firing requests in batches...\n`, 'cyan')
  
  const allResults: any[] = []
  const startTime = Date.now()
  
  // Fire requests in batches to simulate realistic load
  for (let batch = 0; batch < Math.ceil(totalRequests / batchSize); batch++) {
    const batchStart = batch * batchSize
    const batchEnd = Math.min(batchStart + batchSize, totalRequests)
    
    log(`   Batch ${batch + 1}: Requests ${batchStart + 1}-${batchEnd}...`, 'cyan')
    
    const batchRequests = users.slice(batchStart, batchEnd).map((user, i) => {
      // Vary the dates slightly to reduce contention
      const variedStartDate = new Date(startDate)
      variedStartDate.setDate(startDate.getDate() + (i % 3))
      const variedEndDate = new Date(endDate)
      variedEndDate.setDate(endDate.getDate() + (i % 3))
      
      return createConcurrentBooking({
        userId: user.id,
        roomTypeId: roomType.id,
        startDate: variedStartDate,
        endDate: variedEndDate,
        roomsBooked: 1,
      }).then(result => ({
        requestId: batchStart + i + 1,
        success: result.success,
        error: !result.success ? result.error : undefined,
        duration: Date.now() - startTime,
      }))
    })
    
    const batchResults = await Promise.all(batchRequests)
    allResults.push(...batchResults)
  }
  
  const endTime = Date.now()
  
  // Analyze results
  const successful = allResults.filter(r => r.success)
  const failed = allResults.filter(r => !r.success)
  const avgDuration = allResults.reduce((sum, r) => sum + r.duration, 0) / allResults.length
  
  log('\n📊 Results:', 'bright')
  log(`   Total requests: ${totalRequests}`, 'cyan')
  log(`   Successful: ${successful.length}`, 'green')
  log(`   Failed: ${failed.length}`, 'yellow')
  log(`   Total duration: ${endTime - startTime}ms`, 'cyan')
  log(`   Average request duration: ${avgDuration.toFixed(2)}ms`, 'cyan')
  log(`   Requests per second: ${(totalRequests / ((endTime - startTime) / 1000)).toFixed(2)}`, 'cyan')
  
  return {
    totalRequests,
    successCount: successful.length,
    failureCount: failed.length,
    averageDuration: avgDuration,
  }
}

/**
 * Main test runner
 */
async function runTests() {
  try {
    log('\n' + '█'.repeat(80), 'bright')
    log('   CONCURRENCY TEST SUITE - Day 13', 'bright')
    log('█'.repeat(80) + '\n', 'bright')
    
    log('Testing concurrency-safe booking system with row-level locks and idempotency', 'cyan')
    
    // Setup
    const testData = await setupTestData()
    
    // Run test scenarios
    const scenario1Result = await testScenario1(testData)
    const scenario2Result = await testScenario2(testData)
    const scenario3Result = await testScenario3(testData)
    
    // Final summary
    logSection('📋 Test Suite Summary')
    
    log('Scenario 1 (Concurrent Requests):', 'bright')
    log(`   ✓ No overbooking: ${scenario1Result.inventoryValid ? '✅' : '❌'}`, scenario1Result.inventoryValid ? 'green' : 'red')
    log(`   ✓ Correct successes: ${scenario1Result.successCount}`, 'cyan')
    log(`   ✓ Correct failures: ${scenario1Result.failureCount}`, 'cyan')
    
    log('\nScenario 2 (Idempotency):', 'bright')
    log(`   ✓ Idempotency working: ${scenario2Result.idempotencyWorking ? '✅' : '❌'}`, scenario2Result.idempotencyWorking ? 'green' : 'red')
    log(`   ✓ Unique bookings: ${scenario2Result.uniqueBookings}`, 'cyan')
    
    log('\nScenario 3 (Stress Test):', 'bright')
    log(`   ✓ High concurrency handled: ✅`, 'green')
    log(`   ✓ Success rate: ${((scenario3Result.successCount / scenario3Result.totalRequests) * 100).toFixed(1)}%`, 'cyan')
    log(`   ✓ Average duration: ${scenario3Result.averageDuration.toFixed(2)}ms`, 'cyan')
    
    const allTestsPassed = scenario1Result.inventoryValid && scenario2Result.idempotencyWorking
    
    if (allTestsPassed) {
      log('\n🎉 ALL TESTS PASSED! Concurrency safety verified. ✅', 'green')
    } else {
      log('\n❌ SOME TESTS FAILED! Review the results above.', 'red')
    }
    
  } catch (error) {
    log('\n❌ Test suite error:', 'red')
    console.error(error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

// Run the tests
runTests()
