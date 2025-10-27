#!/bin/bash
# Aggressive build script that patches Next.js to skip problematic pages

set +e  # Don't exit on error

echo "🔧 Installing dependencies..."
pnpm install --frozen-lockfile --ignore-scripts

echo "📦 Installing Sharp..."
cd node_modules/sharp 2>/dev/null && node install/check.js 2>/dev/null && cd ../.. || echo "Sharp install skipped"

echo "🗄️  Generating Prisma Client..."
pnpm exec prisma generate

echo "🏗️  Building Next.js application..."

# Set environment variables to help with build
export NODE_ENV=production
export NEXT_TELEMETRY_DISABLED=1
export CI=true

# Try normal build first
pnpm exec next build 2>&1 | tee build.log

BUILD_EXIT_CODE=${PIPESTATUS[0]}

# Check if build succeeded
if [ $BUILD_EXIT_CODE -eq 0 ]; then
    echo "✅ Build completed successfully!"
    rm -f build.log
    exit 0
fi

# Check if it's the specific _global-error issue
if grep -q "_global-error" build.log && grep -q "useContext" build.log; then
    echo "⚠️  Detected _global-error prerender issue"
    echo "🔧 Applying workaround..."
    
    # Create a minimal .next directory structure if build partially failed
    mkdir -p .next/server/app
    
    # Try build one more time with more aggressive settings
    echo "🔄 Retrying build with alternative configuration..."
    NEXT_PRIVATE_SKIP_SSG=1 pnpm exec next build
    
    BUILD_EXIT_CODE=$?
    
    if [ $BUILD_EXIT_CODE -eq 0 ]; then
        echo "✅ Build completed with workaround!"
        rm -f build.log
        exit 0
    fi
fi

echo "❌ Build failed with exit code $BUILD_EXIT_CODE"
echo "📋 Last 50 lines of build log:"
tail -50 build.log 2>/dev/null || echo "No log available"
rm -f build.log
exit $BUILD_EXIT_CODE
