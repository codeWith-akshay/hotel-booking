/**
 * Test file demonstrating usage of OTP validation schemas
 * Run with: npx tsx src/lib/validation/__tests__/otp.schemas.test.ts
 */

import {
  requestOTPSchema,
  verifyOTPSchema,
  resendOTPSchema,
  isValidPhone,
  isValidOTP,
  formatPhoneNumber,
  extractCountryCode,
  type RequestOTPInput,
  type VerifyOTPInput,
  type ResendOTPInput,
} from '../otp.schemas'

console.log('🧪 Testing OTP Validation Schemas\n')

// ==========================================
// TEST 1: Request OTP Schema
// ==========================================
console.log('📋 Test 1: Request OTP Schema')

try {
  // Valid request
  const validRequest: RequestOTPInput = {
    phone: '1234567890',
    countryCode: '+1',
  }
  const result = requestOTPSchema.parse(validRequest)
  console.log('✅ Valid request parsed:')
  console.log('   Input:', validRequest)
  console.log('   Output:', result)
} catch (error) {
  console.log('❌ Error:', error)
}

try {
  // Invalid request - phone too short
  const invalidRequest = {
    phone: '123',
    countryCode: '+1',
  }
  requestOTPSchema.parse(invalidRequest)
} catch (error: any) {
  console.log('✅ Correctly rejected short phone:', error.message || error)
}

console.log('')

// ==========================================
// TEST 2: Verify OTP Schema
// ==========================================
console.log('📋 Test 2: Verify OTP Schema')

try {
  // Valid verification
  const validVerify: VerifyOTPInput = {
    phone: '+11234567890',
    otp: '123456',
  }
  const result = verifyOTPSchema.parse(validVerify)
  console.log('✅ Valid verification parsed:', result)
} catch (error) {
  console.log('❌ Error:', error)
}

try {
  // Invalid OTP - wrong length
  const invalidVerify = {
    phone: '+11234567890',
    otp: '123',
  }
  verifyOTPSchema.parse(invalidVerify)
} catch (error: any) {
  console.log('✅ Correctly rejected short OTP:', error.message || error)
}

try {
  // Invalid OTP - contains letters
  const invalidVerify = {
    phone: '+11234567890',
    otp: '12345a',
  }
  verifyOTPSchema.parse(invalidVerify)
} catch (error: any) {
  console.log('✅ Correctly rejected non-numeric OTP:', error.message || error)
}

console.log('')

// ==========================================
// TEST 3: Resend OTP Schema
// ==========================================
console.log('📋 Test 3: Resend OTP Schema')

try {
  const validResend: ResendOTPInput = {
    phone: '+11234567890',
    reason: 'expired',
  }
  const result = resendOTPSchema.parse(validResend)
  console.log('✅ Valid resend parsed:', result)
} catch (error) {
  console.log('❌ Error:', error)
}

console.log('')

// ==========================================
// TEST 4: Utility Functions
// ==========================================
console.log('📋 Test 4: Utility Functions')

console.log('Phone validation:')
console.log('  +11234567890:', isValidPhone('+11234567890'))
console.log('  1234567890:', isValidPhone('1234567890'))
console.log('  +1-123-456-7890:', isValidPhone('+1-123-456-7890'))

console.log('\nOTP validation:')
console.log('  123456:', isValidOTP('123456'))
console.log('  12345:', isValidOTP('12345'))
console.log('  123abc:', isValidOTP('123abc'))

console.log('\nPhone formatting:')
console.log('  Format 1234567890:', formatPhoneNumber('1234567890'))
console.log('  Format 9876543210 (+44):', formatPhoneNumber('9876543210', '+44'))

console.log('\nExtract country code:')
console.log('  From +11234567890:', extractCountryCode('+11234567890'))
console.log('  From +441234567890:', extractCountryCode('+441234567890'))

console.log('\n✅ All tests completed!\n')
