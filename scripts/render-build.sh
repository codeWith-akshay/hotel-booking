#!/bin/bash
# Render build script for hotel-booking

set -e  # Exit on error

echo "🔧 Installing dependencies (skipping all postinstall scripts)..."
pnpm install --frozen-lockfile --ignore-scripts

echo "📦 Running Sharp install manually..."
cd node_modules/sharp && node install/check.js && cd ../..

echo "🗄️  Generating Prisma Client..."
pnpm exec prisma generate

echo "🏗️  Building Next.js application..."
pnpm exec next build

echo "✅ Build completed successfully!"
