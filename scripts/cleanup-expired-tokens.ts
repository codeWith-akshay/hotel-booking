// ==========================================
// SECURITY UTILITY: Cleanup Expired Tokens
// ==========================================
// Cron job script to clean up expired refresh tokens
// Run this periodically (daily/weekly) to keep database clean
//
// Usage:
//   pnpm security:cleanup-tokens
//   node scripts/cleanup-expired-tokens.js (in cron)

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

/**
 * Clean up expired and revoked refresh tokens
 * Removes tokens that are:
 * - Expired (past expiresAt date)
 * - Revoked more than 30 days ago (keep recent for audit)
 */
async function cleanupExpiredTokens() {
  console.log('\n🧹 REFRESH TOKEN CLEANUP\n')
  console.log('='.repeat(60))

  try {
    const now = new Date()
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)

    console.log('\n1️⃣  Cleaning up expired tokens...')

    // Delete expired tokens
    const expiredResult = await prisma.$executeRaw`
      DELETE FROM refresh_tokens
      WHERE expires_at < ${now}
    `

    console.log(`   ✅ Deleted ${expiredResult} expired tokens`)

    console.log('\n2️⃣  Cleaning up old revoked tokens...')

    // Delete old revoked tokens (revoked more than 30 days ago)
    const revokedResult = await prisma.$executeRaw`
      DELETE FROM refresh_tokens
      WHERE revoked_at IS NOT NULL
      AND revoked_at < ${thirtyDaysAgo}
    `

    console.log(`   ✅ Deleted ${revokedResult} old revoked tokens`)

    console.log('\n3️⃣  Getting database statistics...')

    // Get remaining token stats
    const stats = await prisma.$queryRaw<
      Array<{ status: string; count: bigint }>
    >`
      SELECT
        CASE
          WHEN revoked_at IS NOT NULL THEN 'revoked'
          WHEN expires_at < ${now} THEN 'expired'
          ELSE 'active'
        END as status,
        COUNT(*) as count
      FROM refresh_tokens
      GROUP BY status
    `

    console.log('\n📊 REFRESH TOKEN STATISTICS\n')
    
    if (stats.length === 0) {
      console.log('   No refresh tokens in database.')
    } else {
      stats.forEach((stat) => {
        const count = Number(stat.count)
        const emoji = stat.status === 'active' ? '✅' : stat.status === 'revoked' ? '🚫' : '⏰'
        console.log(`   ${emoji} ${stat.status.toUpperCase()}: ${count}`)
      })
    }

    // Calculate total cleanup
    const totalCleaned = Number(expiredResult) + Number(revokedResult)

    console.log('\n='.repeat(60))
    console.log(`\n✅ Cleanup complete! Removed ${totalCleaned} tokens total.\n`)

    // Recommendations
    if (totalCleaned > 1000) {
      console.log('⚠️  RECOMMENDATION: High number of tokens cleaned.')
      console.log('    Consider running this script more frequently.\n')
    }

    return {
      expired: Number(expiredResult),
      revoked: Number(revokedResult),
      total: totalCleaned,
      stats: stats.map((s) => ({ status: s.status, count: Number(s.count) })),
    }
  } catch (error) {
    console.error('\n❌ Error during cleanup:', error)

    if (error instanceof Error && error.message.includes('no such table')) {
      console.log('\n⚠️  refresh_tokens table not found.')
      console.log('    Run database migration:')
      console.log('    pnpm prisma migrate deploy\n')
    }

    throw error
  } finally {
    await prisma.$disconnect()
  }
}

/**
 * Clean up old OTP attempts
 * Remove attempts older than 30 days
 */
async function cleanupOTPAttempts() {
  console.log('\n🧹 OTP ATTEMPT CLEANUP\n')
  console.log('='.repeat(60))

  try {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)

    console.log('\n1️⃣  Cleaning up old OTP attempts...')

    const result = await prisma.$executeRaw`
      DELETE FROM otp_attempts
      WHERE attempted_at < ${thirtyDaysAgo}
    `

    console.log(`   ✅ Deleted ${result} old OTP attempts`)

    // Get remaining stats
    const stats = await prisma.$queryRaw<
      Array<{ attempt_type: string; success: boolean; count: bigint }>
    >`
      SELECT attempt_type, success, COUNT(*) as count
      FROM otp_attempts
      WHERE attempted_at >= ${thirtyDaysAgo}
      GROUP BY attempt_type, success
    `

    console.log('\n📊 OTP ATTEMPT STATISTICS (Last 30 Days)\n')

    if (stats.length === 0) {
      console.log('   No OTP attempts in last 30 days.')
    } else {
      stats.forEach((stat) => {
        const emoji = stat.success ? '✅' : '❌'
        const status = stat.success ? 'Success' : 'Failed'
        console.log(
          `   ${emoji} ${stat.attempt_type} ${status}: ${Number(stat.count)}`
        )
      })
    }

    console.log('\n='.repeat(60))
    console.log(`\n✅ OTP cleanup complete! Removed ${result} attempts.\n`)

    return Number(result)
  } catch (error) {
    console.error('\n❌ Error during OTP cleanup:', error)

    if (error instanceof Error && error.message.includes('no such table')) {
      console.log('\n⚠️  otp_attempts table not found.')
      console.log('    Run database migration:')
      console.log('    pnpm prisma migrate deploy\n')
    }

    throw error
  }
}

/**
 * Clean up old security events
 * Archive or delete events older than 90 days (adjust based on compliance needs)
 */
async function cleanupSecurityEvents() {
  console.log('\n🧹 SECURITY EVENT CLEANUP\n')
  console.log('='.repeat(60))

  try {
    const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000)

    console.log('\n1️⃣  Cleaning up old security events (>90 days)...')

    // NOTE: In production, consider archiving to cold storage instead of deleting
    const result = await prisma.$executeRaw`
      DELETE FROM security_events
      WHERE occurred_at < ${ninetyDaysAgo}
      AND severity IN ('LOW', 'MEDIUM')
    `

    console.log(`   ✅ Deleted ${result} old low/medium severity events`)
    console.log('   ℹ️  HIGH and CRITICAL events are preserved for compliance')

    // Get event stats
    const stats = await prisma.$queryRaw<
      Array<{ severity: string; count: bigint }>
    >`
      SELECT severity, COUNT(*) as count
      FROM security_events
      GROUP BY severity
    `

    console.log('\n📊 SECURITY EVENT STATISTICS\n')

    if (stats.length === 0) {
      console.log('   No security events in database.')
    } else {
      stats.forEach((stat) => {
        const emoji =
          stat.severity === 'CRITICAL'
            ? '🚨'
            : stat.severity === 'HIGH'
            ? '⚠️'
            : stat.severity === 'MEDIUM'
            ? '📝'
            : 'ℹ️'
        console.log(`   ${emoji} ${stat.severity}: ${Number(stat.count)}`)
      })
    }

    console.log('\n='.repeat(60))
    console.log(`\n✅ Security event cleanup complete! Removed ${result} events.\n`)

    return Number(result)
  } catch (error) {
    console.error('\n❌ Error during security event cleanup:', error)

    if (error instanceof Error && error.message.includes('no such table')) {
      console.log('\n⚠️  security_events table not found.')
      console.log('    Run database migration:')
      console.log('    pnpm prisma migrate deploy\n')
    }

    throw error
  }
}

/**
 * Main cleanup function
 * Runs all cleanup tasks
 */
async function runAllCleanup() {
  console.log('\n╔════════════════════════════════════════════════════════════╗')
  console.log('║          SECURITY DATABASE CLEANUP UTILITY                 ║')
  console.log('╚════════════════════════════════════════════════════════════╝\n')

  const startTime = Date.now()

  try {
    // Run all cleanup tasks
    const tokenResult = await cleanupExpiredTokens()
    const otpResult = await cleanupOTPAttempts()
    const securityResult = await cleanupSecurityEvents()

    // Summary
    const duration = ((Date.now() - startTime) / 1000).toFixed(2)

    console.log('\n╔════════════════════════════════════════════════════════════╗')
    console.log('║                    CLEANUP SUMMARY                         ║')
    console.log('╚════════════════════════════════════════════════════════════╝\n')
    console.log(`   ⏱️  Duration: ${duration}s`)
    console.log(`   🗑️  Refresh Tokens Cleaned: ${tokenResult.total}`)
    console.log(`   🗑️  OTP Attempts Cleaned: ${otpResult}`)
    console.log(`   🗑️  Security Events Cleaned: ${securityResult}`)
    console.log(
      `   📊 Total Records Cleaned: ${tokenResult.total + otpResult + securityResult}\n`
    )

    console.log('✅ All cleanup tasks completed successfully!\n')
  } catch (error) {
    console.error('\n❌ Cleanup failed:', error)
    process.exit(1)
  }
}

// Run if executed directly
if (require.main === module) {
  runAllCleanup()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error)
      process.exit(1)
    })
}

export { cleanupExpiredTokens, cleanupOTPAttempts, cleanupSecurityEvents, runAllCleanup }
