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
    // Seed Room Types
    // ==========================================
    console.log('\n🏨 Seeding room types...')

    const roomTypes = [
      {
        name: 'Deluxe Room',
        description:
          'Spacious and elegantly designed room featuring a king-size bed, modern amenities, and a private balcony with city views. Perfect for business travelers and couples. Includes complimentary Wi-Fi, 50" Smart TV, mini-bar, coffee maker, and a luxurious marble bathroom with rain shower. Room size: 350 sq ft.',
        pricePerNight: 15000, // $150.00 per night (in cents)
        totalRooms: 20,
      },
      {
        name: 'Executive Suite',
        description:
          'Premium suite with separate living and sleeping areas, featuring a king-size bed, work desk, and exclusive lounge access. Ideal for extended stays and executive travelers. Includes all Deluxe Room amenities plus a spacious living room with sofa bed, dining area, kitchenette, two 55" Smart TVs, premium bathroom with bathtub and separate shower, and complimentary breakfast. Room size: 650 sq ft.',
        pricePerNight: 25000, // $250.00 per night (in cents)
        totalRooms: 10,
      },
      {
        name: 'Presidential Suite',
        description:
          'The pinnacle of luxury accommodation featuring panoramic views, separate master bedroom with king-size bed, opulent living room, private dining area, and personal butler service. Perfect for VIP guests and special occasions. Includes all Executive Suite amenities plus a grand piano, home theater system, private bar, premium jacuzzi, walk-in closet, 24/7 butler service, and complimentary airport transfers. Room size: 1,200 sq ft.',
        pricePerNight: 50000, // $500.00 per night (in cents)
        totalRooms: 3,
      },
    ]

    const createdRoomTypes = []

    for (const roomTypeData of roomTypes) {
      const roomType = await prisma.roomType.upsert({
        where: { name: roomTypeData.name },
        update: {
          description: roomTypeData.description,
          pricePerNight: roomTypeData.pricePerNight,
          totalRooms: roomTypeData.totalRooms,
        },
        create: roomTypeData,
      })
      createdRoomTypes.push(roomType)
      console.log(`✅ Room type created/verified: ${roomType.name}`)
      console.log(`   💰 Price: $${(roomType.pricePerNight / 100).toFixed(2)} per night`)
      console.log(`   🛏️  Total rooms: ${roomType.totalRooms}`)
      console.log(`   🆔 ID: ${roomType.id}`)
    }

    console.log(`\n✅ Successfully seeded ${createdRoomTypes.length} room types`)

    // ==========================================
    // Seed Room Inventory (Next 90 days)
    // ==========================================
    console.log('\n📅 Seeding room inventory for next 90 days...')

    const today = new Date()
    today.setHours(0, 0, 0, 0) // Start of today
    const daysToSeed = 90
    let totalInventoryRecords = 0

    for (const roomType of createdRoomTypes) {
      let roomTypeInventoryCount = 0

      for (let dayOffset = 0; dayOffset < daysToSeed; dayOffset++) {
        const inventoryDate = new Date(today)
        inventoryDate.setDate(today.getDate() + dayOffset)

        await prisma.roomInventory.upsert({
          where: {
            roomTypeId_date: {
              roomTypeId: roomType.id,
              date: inventoryDate,
            },
          },
          update: {
            availableRooms: roomType.totalRooms,
          },
          create: {
            roomTypeId: roomType.id,
            availableRooms: roomType.totalRooms,
            date: inventoryDate,
          },
        })

        roomTypeInventoryCount++
        totalInventoryRecords++
      }

      console.log(
        `✅ ${roomType.name}: ${roomTypeInventoryCount} inventory records created`
      )
    }

    console.log(`\n✅ Total inventory records seeded: ${totalInventoryRecords}`)
    console.log(`   📆 Date range: ${today.toISOString().split('T')[0]} to ${new Date(today.getTime() + (daysToSeed - 1) * 24 * 60 * 60 * 1000).toISOString().split('T')[0]}`)

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
    console.log(`   • Room types seeded: ${createdRoomTypes.length}`)
    console.log(`   • Inventory records created: ${totalInventoryRecords}`)
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
