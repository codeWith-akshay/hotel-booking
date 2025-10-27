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
# Set environment variables to force dynamic rendering and skip static optimization
export NEXT_PRIVATE_STANDALONE=1
export NODE_ENV=production
export NEXT_DISABLE_SWC_WASM=1
export __NEXT_EXPERIMENTAL_SKIP_STANDALONE_BUILD=1

# Build with dynamic rendering only
pnpm exec next build || {
  echo "⚠️  First build attempt failed, trying with alternative approach..."
  # If build fails, try without experimental flags
  unset __NEXT_EXPERIMENTAL_SKIP_STANDALONE_BUILD
  pnpm exec next build
}

echo "✅ Build completed successfully!"
