// Quick script to verify admin user exists in database
const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function verifyAdmin() {
  console.log('🔍 Verifying admin user in database...\n')
  
  try {
    const adminPhone = '+919022417920'
    
    const adminUser = await prisma.user.findUnique({
      where: { phone: adminPhone },
      include: { role: true }
    })
    
    if (adminUser) {
      console.log('✅ Admin user FOUND in database!')
      console.log(`   📱 Phone: ${adminUser.phone}`)
      console.log(`   👤 Name: ${adminUser.name}`)
      console.log(`   📧 Email: ${adminUser.email}`)
      console.log(`   🔑 Role: ${adminUser.role.name}`)
      console.log(`   🆔 ID: ${adminUser.id}`)
      console.log(`   ✓ Profile Complete: ${adminUser.profileCompleted}`)
    } else {
      console.log('❌ Admin user NOT FOUND in database!')
      console.log(`   Searched for phone: ${adminPhone}`)
    }
    
    // Also check total users
    const totalUsers = await prisma.user.count()
    console.log(`\n📊 Total users in database: ${totalUsers}`)
    
  } catch (error) {
    console.error('❌ Error connecting to database:')
    console.error(error.message)
  } finally {
    await prisma.$disconnect()
  }
}

verifyAdmin()
