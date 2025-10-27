// ==========================================
// THEME PROVIDER
// ==========================================
// Client component that initializes and manages theme
// Features: Auto-init, system preference sync, no FOUC

'use client'

import { useEffect } from 'react'
import { useThemeStore } from '@/store/themeStore'

// ==========================================
// THEME PROVIDER COMPONENT
// ==========================================

/**
 * Theme Provider Component
 * 
 * Initializes theme system on mount.
 * Should be placed in root layout near the top of component tree.
 * 
 * Features:
 * - Initializes theme from localStorage or system preference
 * - Syncs with system theme changes when in 'system' mode
 * - Prevents flash of unstyled content (FOUC)
 * 
 * @example
 * ```tsx
 * // In root layout
 * import { ThemeProvider } from '@/components/theme/ThemeProvider'
 * 
 * export default function RootLayout({ children }) {
 *   return (
 *     <html lang="en">
 *       <body>
 *         <ThemeProvider />
 *         {children}
 *       </body>
 *     </html>
 *   )
 * }
 * ```
 */
export function ThemeProvider() {
  const initTheme = useThemeStore((state) => state.initTheme)
  
  useEffect(() => {
    // Initialize theme on mount
    initTheme()
  }, [initTheme])
  
  return null
}
