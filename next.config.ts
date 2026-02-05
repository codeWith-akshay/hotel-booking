import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    // Skip TypeScript errors during build (for production)
    ignoreBuildErrors: true,
  },
  // Standalone output for Docker/Render deployment
  
  // Disable React strict mode
  reactStrictMode: false,
  // Experimental features
  experimental: {
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
  // Use new config option instead of deprecated one
  skipProxyUrlNormalize: true,
};

export default nextConfig;
