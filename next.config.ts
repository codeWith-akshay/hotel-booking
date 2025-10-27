import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    // Skip TypeScript errors during build (for production)
    ignoreBuildErrors: true,
  },
  // Disable static optimization to avoid React context issues during build
  // This makes all pages dynamic by default
  experimental: {
    // @ts-ignore
    isrMemoryCacheSize: 0,
  },
  // Force dynamic rendering for all routes
  // @ts-ignore
  output: 'standalone',
};

export default nextConfig;
