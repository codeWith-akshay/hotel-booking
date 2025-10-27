import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function deleteAllUsers() {
  console.log('🗑️ Deleting all users from the database...\n')

  try {
    // Delete all users - this will cascade to related records
    const deletedUsers = await prisma.user.deleteMany()

    console.log(`✅ Successfully deleted ${deletedUsers.count} users`)
    console.log('⚠️ Note: Related records (OTPs, bookings, payments, etc.) were also deleted due to cascade rules')
  } catch (error) {
    console.error('\n❌ Error deleting users:')
    console.error(error)
    throw error
  }
}

deleteAllUsers()
  .catch((error) => {
    console.error('\n💥 Fatal error during deletion:')
    console.error(error)
    process.exit(1)
  })
  .finally(async () => {
    console.log('🔌 Closing database connection...')
    await prisma.$disconnect()
    console.log('✅ Database connection closed.\n')
  })