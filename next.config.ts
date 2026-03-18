import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // ==========================================
  // TYPESCRIPT CONFIGURATION
  // ==========================================
  typescript: {
    // Skip TypeScript errors during build (for production)
    ignoreBuildErrors: true,
  },
  
  // ==========================================
  // PERFORMANCE OPTIMIZATIONS
  // ==========================================
  
  // Enable React strict mode for better development experience
  // Helps catch side effects and deprecated APIs
  reactStrictMode: true,
  
  // PERF: Enable React Compiler for automatic memoization (Next.js 16+)
  reactCompiler: true,
  
  // Experimental features for better performance
  experimental: {
    serverActions: {
      bodySizeLimit: '2mb',
    },
    // Enable optimized package imports for smaller bundles
    optimizePackageImports: [
      'lucide-react',
      'recharts',
      'date-fns',
      '@radix-ui/react-dialog',
      '@radix-ui/react-dropdown-menu',
      '@radix-ui/react-tabs',
    ],
  },
  
  // ==========================================
  // TURBOPACK CONFIGURATION (Next.js 16+)
  // ==========================================
  turbopack: {
    // Set workspace root to current directory
    root: process.cwd(),
  },
  
  // ==========================================
  // CACHING & BUILD OPTIMIZATIONS
  // ==========================================
  
  // Generate unique build ID to prevent caching issues
  generateBuildId: async () => {
    return `build-${Date.now()}`
  },
  
  // Skip trailing slash redirect for cleaner URLs
  skipTrailingSlashRedirect: true,
  skipProxyUrlNormalize: true,
  
  // ==========================================
  // IMAGE OPTIMIZATION
  // ==========================================
  images: {
    // Enable modern image formats for smaller sizes
    formats: ['image/avif', 'image/webp'],
    // Optimize images on demand
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },
  
  // ==========================================
  // COMPILER OPTIMIZATIONS
  // ==========================================
  compiler: {
    // Remove console.log in production
    removeConsole: process.env.NODE_ENV === 'production' ? {
      exclude: ['error', 'warn'],
    } : false,
  },
  
  // ==========================================
  // HEADERS FOR CACHING
  // ==========================================
  async headers() {
    return [
      {
        // Static assets caching
        source: '/_next/static/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        // Image caching
        source: '/images/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=86400, stale-while-revalidate=604800',
          },
        ],
      },
      {
        // Font caching
        source: '/fonts/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ];
  },
};

export default nextConfig;
