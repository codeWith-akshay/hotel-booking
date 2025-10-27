/**
 * Pre-Migration Backup Script
 * 
 * Creates a backup before running database migrations
 * 
 * Usage: pnpm run backup:pre-migration
 */

import { execSync } from 'child_process'
import fs from 'fs'
import path from 'path'

const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
const backupDir = path.join(process.cwd(), 'backups', 'pre-migration')
const backupFile = path.join(backupDir, `migration-backup-${timestamp}.db`)

// Ensure backup directory exists
fs.mkdirSync(backupDir, { recursive: true })

try {
  console.log('🔄 Creating pre-migration backup...')
  console.log('⚠️  Do NOT run migrations until backup is verified!\n')
  
  // Get database path
  const dbPath = process.env.DATABASE_URL?.replace('file:', '') || './prisma/dev.db'
  const fullDbPath = path.join(process.cwd(), dbPath)
  
  if (!fs.existsSync(fullDbPath)) {
    console.error(`❌ Database not found at: ${fullDbPath}`)
    process.exit(1)
  }
  
  // Copy database file
  fs.copyFileSync(fullDbPath, backupFile)
  
  console.log(`✅ Backup created: ${backupFile}`)
  
  // Verify backup
  const stats = fs.statSync(backupFile)
  console.log(`📊 Backup size: ${(stats.size / 1024 / 1024).toFixed(2)} MB`)
  
  // Get migration status
  console.log('\n📋 Current migration status:')
  try {
    const status = execSync('pnpm prisma migrate status', { encoding: 'utf8' })
    console.log(status)
  } catch (error) {
    console.log('Could not get migration status')
  }
  
  // Create metadata
  const metadata = {
    timestamp: new Date().toISOString(),
    dbPath: fullDbPath,
    dbSize: stats.size,
    dbSizeMB: (stats.size / 1024 / 1024).toFixed(2),
    purpose: 'pre-migration',
    migrationCommand: 'pnpm prisma migrate dev',
  }
  
  fs.writeFileSync(
    `${backupFile}.meta.json`,
    JSON.stringify(metadata, null, 2)
  )
  
  console.log('\n✅ Pre-migration backup complete!')
  console.log('\n📝 Next steps:')
  console.log('  1. Review migration files in prisma/migrations/')
  console.log('  2. Run: pnpm prisma migrate dev --name your_migration_name')
  console.log('  3. If migration fails, restore with: pnpm run backup:restore')
  console.log(`\n💾 Backup file: ${backupFile}`)
  
} catch (error) {
  console.error('❌ Backup failed:', error instanceof Error ? error.message : error)
  console.error('⚠️  DO NOT proceed with migration!')
  process.exit(1)
}
