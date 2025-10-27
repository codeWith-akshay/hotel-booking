#!/bin/bash
# Render build script for hotel-booking

set -e  # Exit on error

echo "🔧 Installing dependencies (skipping Prisma postinstall)..."
PRISMA_SKIP_POSTINSTALL_GENERATE=true pnpm install --frozen-lockfile

echo "🗄️  Generating Prisma Client..."
pnpm exec prisma generate

echo "🏗️  Building Next.js application..."
pnpm exec next build

echo "✅ Build completed successfully!"
