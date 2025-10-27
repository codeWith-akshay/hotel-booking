import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    // Skip TypeScript errors during build (for production)
    ignoreBuildErrors: true,
  },
  eslint: {
    // Skip ESLint during build
    ignoreDuringBuilds: true,
  },
  // Standalone output for Docker/Render deployment
  output: 'standalone',
  // Disable React strict mode
  reactStrictMode: false,
  // Disable telemetry
  telemetry: false,
  // Disable static page generation completely
  experimental: {
    // @ts-ignore
    isrMemoryCacheSize: 0,
    // @ts-ignore
    disableOptimizedLoading: true,
    // @ts-ignore
    serverActions: {
      bodySizeLimit: '2mb',
    },
  },
  // Generate unique build ID to prevent caching issues
  generateBuildId: async () => {
    return `build-${Date.now()}`
  },
  // Skip trailing slash redirect
  skipTrailingSlashRedirect: true,
  // Skip middleware redirect
  skipMiddlewareUrlNormalize: true,
};

export default nextConfig;
