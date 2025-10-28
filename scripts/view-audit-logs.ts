// ==========================================
// SECURITY UTILITY: View Audit Logs
// ==========================================
// Quick script to view recent audit logs for security review
//
// Usage:
//   pnpm security:audit-logs
//   pnpm security:audit-logs --admin-only
//   pnpm security:audit-logs --security-only
//   pnpm security:audit-logs --limit 50

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

interface CLIArgs {
  adminOnly?: boolean
  securityOnly?: boolean
  limit?: number
}

async function viewAuditLogs() {
  // Parse CLI arguments
  const args: CLIArgs = {}
  process.argv.slice(2).forEach((arg) => {
    if (arg === '--admin-only') args.adminOnly = true
    if (arg === '--security-only') args.securityOnly = true
    if (arg.startsWith('--limit=')) {
      const limitValue = arg.split('=')[1]
      args.limit = parseInt(limitValue || '20', 10)
    }
  })

  const limit = args.limit || 20

  console.log('\n🔍 SECURITY AUDIT LOG VIEWER\n')
  console.log('='.repeat(80))

  try {
    // Admin Audit Logs
    if (!args.securityOnly) {
      console.log('\n📋 ADMIN AUDIT LOGS (Recent Actions)\n')

      const adminLogs = await prisma.$queryRaw<any[]>`
        SELECT * FROM admin_audit_logs
        ORDER BY created_at DESC
        LIMIT ${limit}
      `

      if (adminLogs.length === 0) {
        console.log('  No admin audit logs found.\n')
      } else {
        adminLogs.forEach((log, index) => {
          const changes = log.changes ? JSON.parse(log.changes) : null
          const metadata = log.metadata ? JSON.parse(log.metadata) : null

          console.log(`  ${index + 1}. ${log.action} [${new Date(log.created_at).toISOString()}]`)
          console.log(`     Admin ID: ${log.admin_id}`)
          console.log(`     Target: ${log.target_type} → ${log.target_id}`)
          console.log(`     Reason: ${log.reason}`)
          if (changes) {
            console.log(`     Changes: ${JSON.stringify(changes)}`)
          }
          if (metadata) {
            console.log(`     Metadata: ${JSON.stringify(metadata)}`)
          }
          console.log('')
        })
      }
    }

    // Security Event Logs
    if (!args.adminOnly) {
      console.log('\n🔒 SECURITY EVENT LOGS (Recent Events)\n')

      const securityLogs = await prisma.$queryRaw<any[]>`
        SELECT * FROM security_events
        ORDER BY occurred_at DESC
        LIMIT ${limit}
      `

      if (securityLogs.length === 0) {
        console.log('  No security events found.\n')
      } else {
        const severityColors: Record<string, string> = {
          LOW: '\x1b[32m',      // Green
          MEDIUM: '\x1b[33m',   // Yellow
          HIGH: '\x1b[91m',     // Red
          CRITICAL: '\x1b[41m', // Red background
        }
        const reset = '\x1b[0m'

        securityLogs.forEach((log, index) => {
          const color = severityColors[log.severity] || ''
          const metadata = log.metadata ? JSON.parse(log.metadata) : null

          console.log(
            `  ${index + 1}. ${color}[${log.severity}]${reset} ${log.event_type} [${new Date(log.occurred_at).toISOString()}]`
          )
          console.log(`     IP: ${log.ip}`)
          console.log(`     Message: ${log.message}`)
          if (log.user_id) {
            console.log(`     User ID: ${log.user_id}`)
          }
          if (metadata) {
            console.log(`     Metadata: ${JSON.stringify(metadata)}`)
          }
          console.log('')
        })

        // Summary by severity
        console.log('\n📊 SUMMARY BY SEVERITY\n')
        const summary = securityLogs.reduce((acc, log) => {
          acc[log.severity] = (acc[log.severity] || 0) + 1
          return acc
        }, {} as Record<string, number>)

        Object.entries(summary).forEach(([severity, count]) => {
          const color = severityColors[severity] || ''
          console.log(`  ${color}${severity}${reset}: ${count}`)
        })
        console.log('')
      }
    }

    // OTP Attempt Stats
    if (!args.adminOnly && !args.securityOnly) {
      console.log('\n🔐 OTP ATTEMPT STATISTICS (Last 24 Hours)\n')

      const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000)

      const otpStats = await prisma.$queryRaw<any[]>`
        SELECT
          attempt_type,
          success,
          COUNT(*) as count
        FROM otp_attempts
        WHERE attempted_at >= ${oneDayAgo}
        GROUP BY attempt_type, success
      `

      if (otpStats.length === 0) {
        console.log('  No OTP attempts in last 24 hours.\n')
      } else {
        otpStats.forEach((stat) => {
          const type = stat.attempt_type
          const status = stat.success ? '✅ Success' : '❌ Failed'
          console.log(`  ${type} ${status}: ${stat.count}`)
        })
        console.log('')
      }
    }

    console.log('='.repeat(80))
    console.log('\n✅ Audit log review complete.\n')
  } catch (error) {
    console.error('\n❌ Error viewing audit logs:', error)
    
    if (error instanceof Error && error.message.includes('no such table')) {
      console.log('\n⚠️  Security tables not found. Run database migration:')
      console.log('    pnpm prisma migrate deploy\n')
    }
  } finally {
    await prisma.$disconnect()
  }
}

// Run if executed directly
if (require.main === module) {
  viewAuditLogs()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error)
      process.exit(1)
    })
}

export { viewAuditLogs }
