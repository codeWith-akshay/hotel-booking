/**
 * Backup Script - Create database backup
 * 
 * Usage: pnpm run backup:create
 */

import { execSync } from 'child_process'
import fs from 'fs'
import path from 'path'

const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
const backupDir = path.join(process.cwd(), 'backups')
const backupFile = path.join(backupDir, `backup-${timestamp}.db`)

// Ensure backup directory exists
fs.mkdirSync(backupDir, { recursive: true })

try {
  console.log('🔄 Creating database backup...')
  
  // Get database path from environment
  const dbPath = process.env.DATABASE_URL?.replace('file:', '') || './prisma/dev.db'
  const fullDbPath = path.join(process.cwd(), dbPath)
  
  if (!fs.existsSync(fullDbPath)) {
    console.error(`❌ Database not found at: ${fullDbPath}`)
    process.exit(1)
  }
  
  // Copy database file
  fs.copyFileSync(fullDbPath, backupFile)
  
  // Get backup stats
  const stats = fs.statSync(backupFile)
  const sizeMB = (stats.size / 1024 / 1024).toFixed(2)
  
  console.log(`✅ Backup created: ${backupFile}`)
  console.log(`📊 Backup size: ${sizeMB} MB`)
  
  // Create metadata file
  const metadata = {
    timestamp: new Date().toISOString(),
    dbPath: fullDbPath,
    size: stats.size,
    sizeMB,
  }
  
  fs.writeFileSync(
    `${backupFile}.meta.json`,
    JSON.stringify(metadata, null, 2)
  )
  
  console.log('✅ Backup complete!')
  
  // List recent backups
  const backups = fs.readdirSync(backupDir)
    .filter(f => f.endsWith('.db'))
    .map(f => ({
      name: f,
      mtime: fs.statSync(path.join(backupDir, f)).mtime,
      size: fs.statSync(path.join(backupDir, f)).size,
    }))
    .sort((a, b) => b.mtime.getTime() - a.mtime.getTime())
    .slice(0, 5)
  
  console.log('\n📁 Recent backups:')
  backups.forEach(b => {
    const sizeMB = (b.size / 1024 / 1024).toFixed(2)
    console.log(`  - ${b.name} (${sizeMB} MB)`)
  })
  
} catch (error) {
  console.error('❌ Backup failed:', error instanceof Error ? error.message : error)
  process.exit(1)
}
