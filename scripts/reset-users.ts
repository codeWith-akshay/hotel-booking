import { PrismaClient, RoleName } from '@prisma/client'

const prisma = new PrismaClient()

async function resetUsers() {
  console.log('🔄 Starting user reset process...\n')

  try {
    // ==========================================
    // Step 1: Delete all existing users
    // ==========================================
    console.log('🗑️  Deleting all existing users...')
    
    // First delete related records (OTPs, bookings, etc.)
    const otpDeleteResult = await prisma.oTP.deleteMany({})
    console.log(`   ✅ Deleted ${otpDeleteResult.count} OTP records`)
    
    const bookingDeleteResult = await prisma.booking.deleteMany({})
    console.log(`   ✅ Deleted ${bookingDeleteResult.count} booking records`)
    
    const waitlistDeleteResult = await prisma.waitlist.deleteMany({})
    console.log(`   ✅ Deleted ${waitlistDeleteResult.count} waitlist records`)
    
    const paymentDeleteResult = await prisma.payment.deleteMany({})
    console.log(`   ✅ Deleted ${paymentDeleteResult.count} payment records`)
    
    const auditLogDeleteResult = await prisma.bookingAuditLog.deleteMany({})
    console.log(`   ✅ Deleted ${auditLogDeleteResult.count} audit log records`)
    
    const bulkMessageDeleteResult = await prisma.bulkMessage.deleteMany({})
    console.log(`   ✅ Deleted ${bulkMessageDeleteResult.count} bulk message records`)
    
    const invoiceDeleteResult = await prisma.invoice.deleteMany({})
    console.log(`   ✅ Deleted ${invoiceDeleteResult.count} invoice records`)
    
    const notificationDeleteResult = await prisma.notification.deleteMany({})
    console.log(`   ✅ Deleted ${notificationDeleteResult.count} notification records`)
    
    // Now delete all users
    const userDeleteResult = await prisma.user.deleteMany({})
    console.log(`   ✅ Deleted ${userDeleteResult.count} users\n`)

    // ==========================================
    // Step 2: Ensure roles exist
    // ==========================================
    console.log('📋 Ensuring roles exist...')
    
    const adminRole = await prisma.role.upsert({
      where: { name: RoleName.ADMIN },
      update: {},
      create: {
        name: RoleName.ADMIN,
        permissions: JSON.stringify([
          'booking:create',
          'booking:read:all',
          'booking:update:all',
          'booking:delete',
          'user:read:all',
          'room:create',
          'room:update',
          'room:delete',
          'dashboard:access',
        ]),
      },
    })
    console.log(`   ✅ Admin role ready: ${adminRole.id}`)

    const superAdminRole = await prisma.role.upsert({
      where: { name: RoleName.SUPERADMIN },
      update: {},
      create: {
        name: RoleName.SUPERADMIN,
        permissions: JSON.stringify([
          'all:*',
          'system:settings',
          'user:create',
          'user:update',
          'user:delete',
          'role:manage',
          'audit:access',
          'reports:generate',
        ]),
      },
    })
    console.log(`   ✅ SuperAdmin role ready: ${superAdminRole.id}\n`)

    // ==========================================
    // Step 3: Create Admin User
    // ==========================================
    console.log('👤 Creating Admin user...')
    
    const adminUser = await prisma.user.create({
      data: {
        phone: '+919022417920',
        name: 'Admin User',
        email: 'admin9022@gmail.com',
        roleId: adminRole.id,
        vipStatus: 'NONE',
        profileCompleted: true,
        termsAccepted: true,
      },
    })

    console.log('✅ Admin user created:')
    console.log(`   👤 Name: ${adminUser.name}`)
    console.log(`   📱 Phone: ${adminUser.phone}`)
    console.log(`   📧 Email: ${adminUser.email}`)
    console.log(`   🆔 ID: ${adminUser.id}`)
    console.log(`   🔑 Role: ADMIN\n`)

    // ==========================================
    // Step 4: Create SuperAdmin User
    // ==========================================
    console.log('👑 Creating SuperAdmin user...')
    
    const superAdminUser = await prisma.user.create({
      data: {
        phone: '+919307547129',
        name: 'Super Admin User',
        email: 'superAdmin9022@gmail.com',
        roleId: superAdminRole.id,
        vipStatus: 'STAFF',
        profileCompleted: true,
        termsAccepted: true,
      },
    })

    console.log('✅ SuperAdmin user created:')
    console.log(`   👤 Name: ${superAdminUser.name}`)
    console.log(`   📱 Phone: ${superAdminUser.phone}`)
    console.log(`   📧 Email: ${superAdminUser.email}`)
    console.log(`   🆔 ID: ${superAdminUser.id}`)
    console.log(`   🔑 Role: SUPERADMIN\n`)

    // ==========================================
    // Summary
    // ==========================================
    console.log('✅ User reset completed successfully!')
    console.log('\n📊 Summary:')
    console.log('   • All previous users deleted')
    console.log('   • 2 new users created:')
    console.log('     - 1 Admin (9022417920)')
    console.log('     - 1 SuperAdmin (9307547129)')
    console.log('\n💡 You can now log in using OTP with these phone numbers.')

  } catch (error) {
    console.error('❌ Error during user reset:')
    console.error(error)
    process.exit(1)
  }
}

// Execute the reset
resetUsers()
  .catch((error) => {
    console.error('\n💥 Fatal error:', error)
    process.exit(1)
  })
  .finally(async () => {
    console.log('\n🔌 Closing database connection...')
    await prisma.$disconnect()
    console.log('✅ Done!\n')
  })
