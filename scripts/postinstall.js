#!/usr/bin/env node

/**
 * Prisma Postinstall Script for Vercel Deployment
 * This script ensures Prisma Client is generated correctly during deployment
 */

const { execSync } = require('child_process');
const path = require('path');

const PRISMA_SCHEMA = path.join(__dirname, '..', 'prisma', 'schema.prisma');

console.log('🔧 Running custom Prisma postinstall script...');

try {
  // Check if we're in CI/build environment
  const isCI = process.env.CI === 'true' || process.env.VERCEL === '1';
  
  if (isCI) {
    console.log('📦 Detected CI/Vercel environment');
  }

  // Generate Prisma Client
  console.log('🔄 Generating Prisma Client...');
  execSync('prisma generate', {
    stdio: 'inherit',
    cwd: path.join(__dirname, '..'),
    env: {
      ...process.env,
      PRISMA_GENERATE_SKIP_AUTOINSTALL: 'false',
    },
  });

  console.log('✅ Prisma Client generated successfully!');
} catch (error) {
  console.error('❌ Error generating Prisma Client:', error.message);
  
  // Don't fail the entire install if Prisma generation fails in postinstall
  // It will be handled by the build script
  console.log('⚠️  Prisma generation will be retried during build');
  process.exit(0); // Exit successfully to allow build to continue
}
