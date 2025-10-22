import { PrismaClient, RoleName } from '@prisma/client'
import * as bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting database seeding...\n')

  try {
    // ==========================================
    // Seed Roles
    // ==========================================
    console.log('📋 Seeding roles...')

    const roles = [
      {
        name: RoleName.MEMBER,
        permissions: JSON.stringify([
          'booking:create',
          'booking:read:own',
          'booking:update:own',
          'profile:read:own',
          'profile:update:own',
        ]),
      },
      {
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
      {
        name: RoleName.SUPERADMIN,
        permissions: JSON.stringify([
          'all:*', // Wildcard permission for super admin
          'system:settings',
          'user:create',
          'user:update',
          'user:delete',
          'role:manage',
          'audit:access',
          'reports:generate',
        ]),
      },
    ]

    const createdRoles = []

    for (const roleData of roles) {
      const role = await prisma.role.upsert({
        where: { name: roleData.name },
        update: {},
        create: roleData,
      })
      createdRoles.push(role)
      console.log(`✅ Role created/verified: ${role.name} (ID: ${role.id})`)
    }

    console.log(`\n✅ Successfully seeded ${createdRoles.length} roles\n`)

    // ==========================================
    // Seed Admin User
    // ==========================================
    console.log('👤 Seeding admin user...')

    // Find Admin role
    const adminRole = createdRoles.find((r) => r.name === RoleName.ADMIN)

    if (!adminRole) {
      throw new Error('Admin role not found')
    }

    // Admin user data
    const adminPhone = '+1234567890'
    const adminEmail = 'admin@hotelbooking.com'
    const adminName = 'System Administrator'
    const adminPassword = 'Admin@123' // In production, use environment variable

    // Hash the admin password for OTP simulation
    const hashedPassword = await bcrypt.hash(adminPassword, 12)

    // Create or update admin user
    const adminUser = await prisma.user.upsert({
      where: { phone: adminPhone },
      update: {
        name: adminName,
        email: adminEmail,
      },
      create: {
        phone: adminPhone,
        name: adminName,
        email: adminEmail,
        roleId: adminRole.id,
      },
    })

    console.log(`✅ Admin user created/verified:`)
    console.log(`   📧 Email: ${adminUser.email}`)
    console.log(`   📱 Phone: ${adminUser.phone}`)
    console.log(`   👤 Name: ${adminUser.name}`)
    console.log(`   🆔 ID: ${adminUser.id}`)
    console.log(`   🔑 Role: ${adminRole.name}`)

    // Create an OTP for admin (for demonstration)
    const otpCode = '123456'
    const otpHash = await bcrypt.hash(otpCode, 10)
    const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000) // 10 minutes

    const adminOTP = await prisma.oTP.create({
      data: {
        userId: adminUser.id,
        otpHash: otpHash,
        expiresAt: otpExpiresAt,
      },
    })

    console.log(`\n🔐 Admin OTP created for testing:`)
    console.log(`   Code: ${otpCode} (for dev/testing only)`)
    console.log(`   Expires: ${otpExpiresAt.toISOString()}`)
    console.log(`   Hash stored: ${adminOTP.otpHash.substring(0, 20)}...`)

    // ==========================================
    // Seed Super Admin User
    // ==========================================
    console.log('\n👑 Seeding super admin user...')

    const superAdminRole = createdRoles.find(
      (r) => r.name === RoleName.SUPERADMIN
    )

    if (!superAdminRole) {
      throw new Error('SuperAdmin role not found')
    }

    const superAdminPhone = '+1987654321'
    const superAdminEmail = 'superadmin@hotelbooking.com'
    const superAdminName = 'Super Administrator'

    const superAdminUser = await prisma.user.upsert({
      where: { phone: superAdminPhone },
      update: {
        name: superAdminName,
        email: superAdminEmail,
      },
      create: {
        phone: superAdminPhone,
        name: superAdminName,
        email: superAdminEmail,
        roleId: superAdminRole.id,
      },
    })

    console.log(`✅ Super admin user created/verified:`)
    console.log(`   📧 Email: ${superAdminUser.email}`)
    console.log(`   📱 Phone: ${superAdminUser.phone}`)
    console.log(`   👤 Name: ${superAdminUser.name}`)
    console.log(`   🆔 ID: ${superAdminUser.id}`)
    console.log(`   🔑 Role: ${superAdminRole.name}`)

    // ==========================================
    // Summary
    // ==========================================
    console.log('\n' + '='.repeat(50))
    console.log('✨ Database seeding completed successfully!')
    console.log('='.repeat(50))
    console.log('\n📊 Summary:')
    console.log(`   • Roles seeded: ${createdRoles.length}`)
    console.log(`   • Admin users created: 2`)
    console.log(`   • OTP records created: 1`)
    console.log('\n🚀 Your database is ready to use!\n')
  } catch (error) {
    console.error('\n❌ Error during seeding:')
    console.error(error)
    throw error
  }
}

main()
  .catch((error) => {
    console.error('\n💥 Fatal error during seed execution:')
    console.error(error)
    process.exit(1)
  })
  .finally(async () => {
    console.log('🔌 Closing database connection...')
    await prisma.$disconnect()
    console.log('✅ Database connection closed.\n')
  })
