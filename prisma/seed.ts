import { PrismaClient, RoleName, GuestType } from '@prisma/client'
import * as bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

/**
 * Hash password using bcrypt
 */
async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10)
}

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
    // Delete ALL existing users first
    // ==========================================
    console.log('�️  Deleting all existing users...')

    await prisma.user.deleteMany({})
    console.log('✅ All existing users deleted\n')

    // ==========================================
    // Find roles
    // ==========================================
    const adminRole = createdRoles.find((r) => r.name === RoleName.ADMIN)
    const superAdminRole = createdRoles.find((r) => r.name === RoleName.SUPERADMIN)

    if (!adminRole || !superAdminRole) {
      throw new Error('Required roles not found')
    }

    // ==========================================
    // Seed Admin User
    // ==========================================
    console.log('👤 Creating Admin user...')

    const adminEmail = 'admin@hotel.com'
    const adminPassword = 'Admin@123456'
    const adminName = 'Hotel Admin'
    const hashedAdminPassword = await hashPassword(adminPassword)

    const adminUser = await prisma.user.create({
      data: {
        email: adminEmail,
        password: hashedAdminPassword,
        name: adminName,
        roleId: adminRole.id,
        profileCompleted: true,
      },
    })

    console.log(`✅ Admin user created:`)
    console.log(`   📧 Email: ${adminUser.email}`)
    console.log(`   🔑 Password: ${adminPassword}`)
    console.log(`   👤 Name: ${adminUser.name}`)
    console.log(`   🆔 ID: ${adminUser.id}`)
    console.log(`   🔑 Role: ADMIN`)

    // ==========================================
    // Seed Super Admin User
    // ==========================================
    console.log('\n👑 Creating Super Admin user...')

    const superAdminEmail = 'superadmin@hotel.com'
    const superAdminPassword = 'SuperAdmin@123456'
    const superAdminName = 'Hotel Super Admin'
    const hashedSuperAdminPassword = await hashPassword(superAdminPassword)

    const superAdminUser = await prisma.user.create({
      data: {
        email: superAdminEmail,
        password: hashedSuperAdminPassword,
        name: superAdminName,
        roleId: superAdminRole.id,
        profileCompleted: true,
      },
    })

    console.log(`✅ Super Admin user created:`)
    console.log(`   📧 Email: ${superAdminUser.email}`)
    console.log(`   🔑 Password: ${superAdminPassword}`)
    console.log(`   👤 Name: ${superAdminUser.name}`)
    console.log(`   🆔 ID: ${superAdminUser.id}`)
    console.log(`   🔑 Role: SUPERADMIN`)

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
    // Seed Booking Rules
    // ==========================================
    console.log('\n📋 Seeding booking rules...')

    const bookingRules = [
      {
        guestType: GuestType.REGULAR,
        maxDaysAdvance: 90,
        minDaysNotice: 1,
      },
      {
        guestType: GuestType.VIP,
        maxDaysAdvance: 365,
        minDaysNotice: 0,
      },
      {
        guestType: GuestType.CORPORATE,
        maxDaysAdvance: 180,
        minDaysNotice: 0,
      },
    ]

    let createdBookingRules = 0

    for (const rule of bookingRules) {
      await prisma.bookingRules.upsert({
        where: { guestType: rule.guestType },
        update: {
          maxDaysAdvance: rule.maxDaysAdvance,
          minDaysNotice: rule.minDaysNotice,
        },
        create: rule,
      })

      createdBookingRules++
      console.log(
        `✅ ${rule.guestType}: ${rule.maxDaysAdvance} days advance, ${rule.minDaysNotice} days notice`
      )
    }

    console.log(`\n✅ Total booking rules seeded: ${createdBookingRules}`)

    // ==========================================
    // Seed Deposit Policies (DAY 12)
    // ==========================================
    console.log('\n💰 Seeding deposit policies...')

    const depositPolicies = [
      {
        minRooms: 10,
        maxRooms: 19,
        type: 'percent',
        value: 20.0, // 20% deposit
        description: '10-19 rooms require 20% deposit',
        active: true,
      },
      {
        minRooms: 20,
        maxRooms: 49,
        type: 'percent',
        value: 30.0, // 30% deposit
        description: '20-49 rooms require 30% deposit',
        active: true,
      },
      {
        minRooms: 50,
        maxRooms: 100,
        type: 'percent',
        value: 50.0, // 50% deposit
        description: '50+ rooms require 50% deposit',
        active: true,
      },
    ]

    let createdDepositPolicies = 0

    for (const policy of depositPolicies) {
      await prisma.depositPolicy.create({
        data: policy,
      })

      createdDepositPolicies++
      console.log(
        `✅ ${policy.minRooms}-${policy.maxRooms} rooms: ${policy.value}% deposit`
      )
    }

    console.log(`\n✅ Total deposit policies seeded: ${createdDepositPolicies}`)

    // ==========================================
    // Seed Special Days (DAY 12)
    // ==========================================
    console.log('\n🎉 Seeding special days...')

    const specialDayDate = new Date()
    specialDayDate.setHours(0, 0, 0, 0)

    const specialDays = [
      // Christmas - Premium rates (50% increase)
      {
        date: new Date(specialDayDate.getFullYear(), 11, 25), // Dec 25
        roomTypeId: null, // Apply to all room types
        ruleType: 'special_rate',
        rateType: 'multiplier',
        rateValue: 1.5,
        description: 'Christmas - Premium Rates (50% increase)',
        active: true,
      },
      // New Year - Premium rates (75% increase)
      {
        date: new Date(specialDayDate.getFullYear(), 11, 31), // Dec 31
        roomTypeId: null,
        ruleType: 'special_rate',
        rateType: 'multiplier',
        rateValue: 1.75,
        description: "New Year's Eve - Premium Rates (75% increase)",
        active: true,
      },
      // Valentine's Day - Premium rates (30% increase)
      {
        date: new Date(specialDayDate.getFullYear() + 1, 1, 14), // Feb 14 next year
        roomTypeId: null,
        ruleType: 'special_rate',
        rateType: 'multiplier',
        rateValue: 1.3,
        description: "Valentine's Day - Premium Rates (30% increase)",
        active: true,
      },
      // Maintenance block (example - 30 days from now)
      {
        date: new Date(specialDayDate.getTime() + 30 * 24 * 60 * 60 * 1000),
        roomTypeId: null,
        ruleType: 'blocked',
        rateType: null,
        rateValue: null,
        description: 'Property Maintenance - No Bookings Allowed',
        active: true,
      },
      // Summer sale - Discounted rates (20% off)
      {
        date: new Date(specialDayDate.getFullYear() + 1, 5, 15), // Jun 15 next year
        roomTypeId: null,
        ruleType: 'special_rate',
        rateType: 'multiplier',
        rateValue: 0.8,
        description: 'Summer Sale - 20% Off',
        active: true,
      },
    ]

    let createdSpecialDays = 0

    for (const specialDay of specialDays) {
      await prisma.specialDay.create({
        data: specialDay,
      })

      createdSpecialDays++
      console.log(
        `✅ ${specialDay.date.toLocaleDateString()}: ${specialDay.description} (${specialDay.ruleType})`
      )
    }

    console.log(`\n✅ Total special days seeded: ${createdSpecialDays}`)

    // ==========================================
    // Summary
    // ==========================================
    console.log('\n' + '='.repeat(50))
    console.log('✨ Database seeding completed successfully!')
    console.log('='.repeat(50))
    console.log('\n📊 Summary:')
    console.log(`   • Roles seeded: ${createdRoles.length}`)
    console.log(`   • Admin users created: 2`)
    console.log(`     - Admin: ${adminEmail} | Password: ${adminPassword}`)
    console.log(`     - Super Admin: ${superAdminEmail} | Password: ${superAdminPassword}`)
    console.log(`   • Room types seeded: ${createdRoomTypes.length}`)
    console.log(`   • Inventory records created: ${totalInventoryRecords}`)
    console.log(`   • Booking rules created: ${createdBookingRules}`)
    console.log(`   • Deposit policies created: ${createdDepositPolicies}`)
    console.log(`   • Special days created: ${createdSpecialDays}`)
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
