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
  // Disable static optimization completely
  // This makes all pages dynamic by default
  experimental: {
    // @ts-ignore - Force ISR off
    isrMemoryCacheSize: 0,
  },
  // Standalone output for Docker/Render deployment
  output: 'standalone',
  // Disable React strict mode to avoid double renders in dev
  reactStrictMode: false,
};

export default nextConfig;
