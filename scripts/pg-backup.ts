/**
 * PostgreSQL Database Backup Script (TypeScript version)
 * 
 * Usage: pnpm run backup:pg
 * 
 * This script creates a compressed PostgreSQL backup using pg_dump
 * and supports uploading to cloud storage (AWS S3, Google Cloud Storage, Supabase).
 */

import { execSync } from 'child_process'
import fs from 'fs'
import path from 'path'

interface BackupMetadata {
  timestamp: string
  database: string
  host: string
  port: string
  size: number
  sizeHuman: string
  backupFile: string
}

// Colors for console output
const colors = {
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  reset: '\x1b[0m'
}

function log(message: string, color: keyof typeof colors = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`)
}

function parseConnectionUrl(databaseUrl: string) {
  // Parse postgresql://user:password@host:port/database
  const regex = /postgresql:\/\/([^:]+):([^@]+)@([^:/?]+):?(\d+)?\/([^?]+)/
  const match = databaseUrl.match(regex)
  
  if (!match) {
    throw new Error('Invalid DATABASE_URL format. Expected: postgresql://user:password@host:port/database')
  }
  
  return {
    user: match[1]!,
    password: match[2]!,
    host: match[3]!,
    port: match[4] || '5432',
    database: match[5]!
  }
}

function formatBytes(bytes: number): string {
  const units = ['B', 'KB', 'MB', 'GB']
  let size = bytes
  let unitIndex = 0
  
  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024
    unitIndex++
  }
  
  return `${size.toFixed(2)} ${units[unitIndex]}`
}

async function createBackup() {
  try {
    log('📦 Starting PostgreSQL backup...', 'yellow')
    
    // Get configuration
    const databaseUrl = process.env.DATABASE_URL
    if (!databaseUrl) {
      throw new Error('DATABASE_URL environment variable is not set')
    }
    
    const backupDir = process.env.BACKUP_DIR || path.join(process.cwd(), 'backups')
    const timestamp = new Date().toISOString().split('T')[0]
    const backupFile = path.join(backupDir, `hotel_db_${timestamp}.dump`)
    
    // Create backup directory
    fs.mkdirSync(backupDir, { recursive: true })
    
    // Parse connection details
    const conn = parseConnectionUrl(databaseUrl)
    log(`Database: ${conn.database}`, 'yellow')
    log(`Host: ${conn.host}:${conn.port}`, 'yellow')
    
    // Set environment for pg_dump
    const env = {
      ...process.env,
      PGPASSWORD: conn.password
    }
    
    // Create backup command
    const command = `pg_dump -Fc --no-acl --no-owner -h ${conn.host} -p ${conn.port} -U ${conn.user} -d ${conn.database} -f "${backupFile}"`
    
    log('Running pg_dump...', 'yellow')
    execSync(command, { env, stdio: 'inherit' })
    
    // Get backup file size
    const stats = fs.statSync(backupFile)
    const sizeHuman = formatBytes(stats.size)
    
    log('✅ Backup created successfully!', 'green')
    log(`   File: ${backupFile}`, 'green')
    log(`   Size: ${sizeHuman}`, 'green')
    
    // Create metadata file
    const metadata: BackupMetadata = {
      timestamp: new Date().toISOString(),
      database: conn.database,
      host: conn.host,
      port: conn.port,
      size: stats.size,
      sizeHuman,
      backupFile
    }
    
    const metadataFile = `${backupFile}.meta.json`
    fs.writeFileSync(metadataFile, JSON.stringify(metadata, null, 2))
    log(`   Metadata: ${metadataFile}`, 'green')
    
    // Upload to cloud storage if configured
    await uploadToCloud(backupFile, metadata)
    
    log('🎉 Backup process completed!', 'green')
    
    return metadata
  } catch (error) {
    log(`❌ Backup failed: ${error instanceof Error ? error.message : String(error)}`, 'red')
    process.exit(1)
  }
}

async function uploadToCloud(backupFile: string, metadata: BackupMetadata) {
  // AWS S3 Upload
  if (process.env.AWS_S3_BUCKET && process.env.AWS_ACCESS_KEY_ID) {
    try {
      log('📤 Uploading to AWS S3...', 'yellow')
      const bucket = process.env.AWS_S3_BUCKET
      const region = process.env.AWS_REGION || 'us-east-1'
      const s3Path = `s3://${bucket}/backups/daily/${path.basename(backupFile)}`
      
      execSync(
        `aws s3 cp "${backupFile}" "${s3Path}" --region ${region} --storage-class STANDARD_IA`,
        { stdio: 'inherit' }
      )
      
      log('✅ Uploaded to AWS S3', 'green')
    } catch (error) {
      log(`⚠️  S3 upload failed: ${error instanceof Error ? error.message : String(error)}`, 'yellow')
    }
  }
  
  // Google Cloud Storage Upload
  if (process.env.GCS_BUCKET && process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    try {
      log('📤 Uploading to Google Cloud Storage...', 'yellow')
      const bucket = process.env.GCS_BUCKET
      const gcsPath = `gs://${bucket}/backups/daily/${path.basename(backupFile)}`
      
      execSync(`gsutil cp "${backupFile}" "${gcsPath}"`, { stdio: 'inherit' })
      
      log('✅ Uploaded to Google Cloud Storage', 'green')
    } catch (error) {
      log(`⚠️  GCS upload failed: ${error instanceof Error ? error.message : String(error)}`, 'yellow')
    }
  }
  
  // Supabase Storage Upload (via API)
  if (process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_KEY) {
    try {
      log('📤 Uploading to Supabase Storage...', 'yellow')
      log('⚠️  Supabase upload requires custom implementation via API', 'yellow')
      // Implementation would use Supabase client library
    } catch (error) {
      log(`⚠️  Supabase upload failed: ${error instanceof Error ? error.message : String(error)}`, 'yellow')
    }
  }
}

// Run backup
if (require.main === module) {
  createBackup()
}

export { createBackup }
