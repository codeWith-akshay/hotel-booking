/**
 * Route segment config for all app pages
 * Forces dynamic rendering to avoid static generation issues
 * 
 * This file prevents Next.js from trying to statically generate pages
 * that contain client components with React context/hooks
 */

// Force all routes to be dynamic (no static generation)
export const dynamic = 'force-dynamic'

// Use Node.js runtime for full React support
export const runtime = 'nodejs'

// Disable revalidation
export const revalidate = 0

// Export empty object to satisfy TypeScript
export default {}
