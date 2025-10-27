#!/usr/bin/env node

/**
 * Automated Staging Testing Script
 * 
 * This script performs automated checks on the staging environment
 * to verify deployment success and basic functionality.
 * 
 * Usage:
 *   node scripts/test-staging.js <STAGING_URL>
 * 
 * Example:
 *   node scripts/test-staging.js https://hotel-booking-staging.vercel.app
 */

const https = require('https');
const http = require('http');

const STAGING_URL = process.argv[2];

if (!STAGING_URL) {
  console.error('❌ Error: Staging URL required');
  console.log('\nUsage: node scripts/test-staging.js <STAGING_URL>');
  console.log('Example: node scripts/test-staging.js https://hotel-booking-staging.vercel.app');
  process.exit(1);
}

// ANSI colors
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  bright: '\x1b[1m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function makeRequest(url) {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https') ? https : http;
    const startTime = Date.now();

    protocol.get(url, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        const endTime = Date.now();
        const responseTime = endTime - startTime;

        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          body: data,
          responseTime,
        });
      });
    }).on('error', (err) => {
      reject(err);
    });
  });
}

async function testEndpoint(name, path, expectedStatus = 200, checkBody = null) {
  const url = `${STAGING_URL}${path}`;

  try {
    log(`\n📝 Testing: ${name}`, 'cyan');
    log(`   URL: ${url}`, 'reset');

    const response = await makeRequest(url);
    const { statusCode, responseTime, body } = response;

    // Check status code
    if (statusCode === expectedStatus) {
      log(`   ✅ Status: ${statusCode} (Expected: ${expectedStatus})`, 'green');
    } else {
      log(`   ❌ Status: ${statusCode} (Expected: ${expectedStatus})`, 'red');
      return false;
    }

    // Check response time
    if (responseTime < 1000) {
      log(`   ✅ Response Time: ${responseTime}ms`, 'green');
    } else if (responseTime < 3000) {
      log(`   ⚠️  Response Time: ${responseTime}ms (slow)`, 'yellow');
    } else {
      log(`   ❌ Response Time: ${responseTime}ms (too slow)`, 'red');
    }

    // Check body content if provided
    if (checkBody) {
      const result = checkBody(body);
      if (result === true) {
        log(`   ✅ Body validation passed`, 'green');
      } else {
        log(`   ❌ Body validation failed: ${result}`, 'red');
        return false;
      }
    }

    return true;
  } catch (error) {
    log(`   ❌ Request failed: ${error.message}`, 'red');
    return false;
  }
}

async function runTests() {
  log('\n' + '='.repeat(70), 'bright');
  log('  🧪 Hotel Booking - Staging Environment Tests', 'bright');
  log('='.repeat(70), 'bright');
  log(`\n🌐 Staging URL: ${STAGING_URL}`, 'cyan');
  log(`⏰ Test Started: ${new Date().toLocaleString()}`, 'cyan');

  const results = {
    total: 0,
    passed: 0,
    failed: 0,
  };

  // Test 1: Homepage
  results.total++;
  const homepageTest = await testEndpoint(
    'Homepage',
    '/',
    200,
    (body) => body.includes('<!DOCTYPE html') || 'Expected HTML document'
  );
  if (homepageTest) results.passed++;
  else results.failed++;

  // Test 2: API Health Check
  results.total++;
  const healthTest = await testEndpoint(
    'API Health Check',
    '/api/health',
    200,
    (body) => {
      try {
        const json = JSON.parse(body);
        return json.status === 'ok' || 'Expected status: ok';
      } catch {
        return 'Expected JSON response';
      }
    }
  );
  if (healthTest) results.passed++;
  else results.failed++;

  // Test 3: Database Health Check
  results.total++;
  const dbHealthTest = await testEndpoint(
    'Database Health Check',
    '/api/db/health',
    200,
    (body) => {
      try {
        const json = JSON.parse(body);
        return json.database === 'connected' || 'Expected database: connected';
      } catch {
        return 'Expected JSON response';
      }
    }
  );
  if (dbHealthTest) results.passed++;
  else results.failed++;

  // Test 4: Signup Page
  results.total++;
  const signupTest = await testEndpoint(
    'Signup Page',
    '/signup',
    200
  );
  if (signupTest) results.passed++;
  else results.failed++;

  // Test 5: Login Page
  results.total++;
  const loginTest = await testEndpoint(
    'Login Page',
    '/login',
    200
  );
  if (loginTest) results.passed++;
  else results.failed++;

  // Test 6: Rooms Page
  results.total++;
  const roomsTest = await testEndpoint(
    'Rooms Page',
    '/rooms',
    200
  );
  if (roomsTest) results.passed++;
  else results.failed++;

  // Test 7: Admin Page (should redirect or require auth)
  results.total++;
  const adminTest = await testEndpoint(
    'Admin Page (Auth Check)',
    '/admin',
    302 // Expecting redirect to login
  );
  if (adminTest) results.passed++;
  else results.failed++;

  // Test 8: Stripe Config API
  results.total++;
  const stripeTest = await testEndpoint(
    'Stripe Config API',
    '/api/stripe/config',
    200,
    (body) => {
      try {
        const json = JSON.parse(body);
        return json.publishableKey ? true : 'Expected publishableKey in response';
      } catch {
        return 'Expected JSON response';
      }
    }
  );
  if (stripeTest) results.passed++;
  else results.failed++;

  // Test 9: 404 Page
  results.total++;
  const notFoundTest = await testEndpoint(
    '404 Page',
    '/this-page-does-not-exist',
    404
  );
  if (notFoundTest) results.passed++;
  else results.failed++;

  // Print Results
  log('\n' + '='.repeat(70), 'bright');
  log('  📊 Test Results', 'bright');
  log('='.repeat(70), 'bright');

  log(`\n  Total Tests: ${results.total}`, 'cyan');
  log(`  ✅ Passed: ${results.passed}`, 'green');
  log(`  ❌ Failed: ${results.failed}`, results.failed > 0 ? 'red' : 'green');

  const passRate = ((results.passed / results.total) * 100).toFixed(1);
  log(`\n  Pass Rate: ${passRate}%`, passRate >= 80 ? 'green' : 'red');

  if (results.failed === 0) {
    log('\n  🎉 All automated tests passed!', 'green');
    log('  ✅ Staging environment is healthy', 'green');
    log('\n  Next Steps:', 'cyan');
    log('  1. Run manual tests from STAGING_TEST_PLAN.md', 'reset');
    log('  2. Test OTP authentication flow', 'reset');
    log('  3. Test payment processing', 'reset');
    log('  4. Test admin dashboard', 'reset');
    log('  5. Document results in STAGING_TEST_REPORT.md', 'reset');
  } else {
    log('\n  ⚠️  Some tests failed', 'yellow');
    log('  Please investigate the failures above', 'yellow');
    log('  Check Vercel logs for detailed error messages', 'yellow');
    log(`\n  View logs: vercel logs ${STAGING_URL} --follow`, 'cyan');
  }

  log('\n' + '='.repeat(70), 'bright');
  log(`⏰ Test Completed: ${new Date().toLocaleString()}`, 'cyan');
  log('='.repeat(70) + '\n', 'bright');

  process.exit(results.failed > 0 ? 1 : 0);
}

// Run tests
runTests().catch((error) => {
  log(`\n❌ Test suite failed: ${error.message}`, 'red');
  process.exit(1);
});
