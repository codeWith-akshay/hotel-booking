/**
 * Test Script: Verify Booking Room Type Fix
 * 
 * Run this in the browser console after opening the booking page
 */

console.log('🧪 Starting Booking Room Type Validation Test...\n')

// Test 1: Check Store Version
console.log('📦 Test 1: Store Version Check')
const storeKey = 'booking-store'
const rawStore = localStorage.getItem(storeKey)

if (rawStore) {
  try {
    const parsed = JSON.parse(rawStore)
    console.log('✅ Current store version:', parsed.version)
    
    if (parsed.version === 3) {
      console.log('✅ Store is at correct version (v3)')
    } else {
      console.log('⚠️  Store is at older version. Should auto-upgrade on next load.')
    }
    
    // Check for selectedRooms
    if (parsed.state?.selectedRooms?.length > 0) {
      console.log('📋 Found cached room selections:')
      parsed.state.selectedRooms.forEach(room => {
        console.log(`   - ${room.roomTypeName} (${room.roomTypeId}): ${room.quantity} rooms`)
      })
    } else {
      console.log('ℹ️  No cached room selections found')
    }
  } catch (e) {
    console.error('❌ Error parsing store:', e)
  }
} else {
  console.log('ℹ️  No booking store found in localStorage (clean state)')
}

console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')

// Test 2: Fetch Current Room Types
console.log('📦 Test 2: Fetch Current Room Types from API')

fetch('/api/room-types?t=' + Date.now())
  .then(res => res.json())
  .then(data => {
    console.log('✅ Room types successfully loaded:')
    data.roomTypes.forEach(room => {
      console.log(`   - ${room.name} (ID: ${room.id})`)
    })
    
    // Test 3: Validate Cached Selections
    if (rawStore) {
      const parsed = JSON.parse(rawStore)
      const selectedRooms = parsed.state?.selectedRooms || []
      
      if (selectedRooms.length > 0) {
        console.log('\n📦 Test 3: Validate Cached Room IDs')
        const validIds = data.roomTypes.map(r => r.id)
        let hasStale = false
        
        selectedRooms.forEach(room => {
          if (validIds.includes(room.roomTypeId)) {
            console.log(`   ✅ ${room.roomTypeName} (${room.roomTypeId}) - VALID`)
          } else {
            console.log(`   ❌ ${room.roomTypeName} (${room.roomTypeId}) - STALE`)
            hasStale = true
          }
        })
        
        if (hasStale) {
          console.log('\n⚠️  STALE DATA DETECTED!')
          console.log('   The system will automatically clear these on next room selection.')
        } else {
          console.log('\n✅ All cached room selections are valid!')
        }
      }
    }
  })
  .catch(error => {
    console.error('❌ Error fetching room types:', error)
  })

console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')

// Test 4: Simulate Booking Submission
console.log('📦 Test 4: Booking Submission Validation')
console.log('ℹ️  To test booking submission, complete the booking flow normally.')
console.log('   Watch for these console logs:')
console.log('   - "🏨 Loaded room types from API"')
console.log('   - "🔑 Room type IDs: [...]"')
console.log('   - "⚠️  Detected stale room selections, clearing..." (if stale)')
console.log('   - "📤 Sending booking data to API"')
console.log('   - "✅ Booking created" (success)')

console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')

// Test 5: Force Cache Clear (Manual Test)
console.log('📦 Test 5: Manual Cache Clear')
console.log('ℹ️  To manually clear the cache, run:')
console.log('   localStorage.removeItem("booking-store")')
console.log('   sessionStorage.removeItem("booking-store")')
console.log('   location.reload()')

console.log('\n🎉 Test script completed!\n')
