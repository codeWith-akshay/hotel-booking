#!/bin/bash
# Simple and reliable build script for Render

set -e  # Exit on error

echo "🔧 Installing dependencies..."
pnpm install --frozen-lockfile

echo "🗄️  Generating Prisma Client..."
pnpm exec prisma generate

echo "🏗️  Building Next.js application..."
export NODE_ENV=production
export NEXT_TELEMETRY_DISABLED=1

pnpm exec next build

echo "✅ Build completed successfully!"
