// ==========================================
// THEME STORE
// ==========================================
// Zustand store for managing application theme (light/dark mode)
// Features: Persistence, system preference detection, smooth transitions

'use client'

import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

// ==========================================
// TYPE DEFINITIONS
// ==========================================

export type Theme = 'light' | 'dark' | 'system'

interface ThemeStore {
  /** Current theme setting */
  theme: Theme
  
  /** Actual theme being displayed (resolved from system if theme is 'system') */
  resolvedTheme: 'light' | 'dark'
  
  /** Set theme */
  setTheme: (theme: Theme) => void
  
  /** Toggle between light and dark */
  toggleTheme: () => void
  
  /** Initialize theme from system preference */
  initTheme: () => void
}

// ==========================================
// HELPER FUNCTIONS
// ==========================================

/**
 * Get system theme preference
 */
const getSystemTheme = (): 'light' | 'dark' => {
  if (typeof window === 'undefined') return 'light'
  
  return window.matchMedia('(prefers-color-scheme: dark)').matches
    ? 'dark'
    : 'light'
}

/**
 * Apply theme to document
 */
const applyTheme = (theme: 'light' | 'dark') => {
  if (typeof window === 'undefined') return
  
  const root = document.documentElement
  
  // Remove both classes first
  root.classList.remove('light', 'dark')
  
  // Add new theme class
  root.classList.add(theme)
  
  // Update color-scheme for native elements
  root.style.colorScheme = theme
  
  // Update meta theme-color for mobile browsers
  const metaThemeColor = document.querySelector('meta[name="theme-color"]')
  if (metaThemeColor) {
    metaThemeColor.setAttribute(
      'content',
      theme === 'dark' ? '#1f2937' : '#ffffff'
    )
  }
}

// ==========================================
// THEME STORE
// ==========================================

/**
 * Theme Store
 * 
 * Manages application theme with:
 * - Light/Dark/System modes
 * - LocalStorage persistence
 * - System preference detection
 * - Smooth transitions
 * 
 * @example
 * ```tsx
 * import { useThemeStore } from '@/store/themeStore'
 * 
 * function ThemeToggle() {
 *   const { theme, toggleTheme } = useThemeStore()
 *   return <button onClick={toggleTheme}>{theme}</button>
 * }
 * ```
 */
export const useThemeStore = create<ThemeStore>()(
  persist(
    (set, get) => ({
      theme: 'system',
      resolvedTheme: 'light',
      
      setTheme: (theme: Theme) => {
        const resolvedTheme = theme === 'system' ? getSystemTheme() : theme
        
        // Apply theme to DOM
        applyTheme(resolvedTheme)
        
        set({ theme, resolvedTheme })
      },
      
      toggleTheme: () => {
        const { resolvedTheme } = get()
        const newTheme = resolvedTheme === 'light' ? 'dark' : 'light'
        get().setTheme(newTheme)
      },
      
      initTheme: () => {
        const { theme } = get()
        const resolvedTheme = theme === 'system' ? getSystemTheme() : theme
        
        // Apply theme to DOM
        applyTheme(resolvedTheme)
        
        set({ resolvedTheme })
        
        // Listen for system theme changes
        if (typeof window !== 'undefined' && theme === 'system') {
          const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
          
          const handleChange = (e: MediaQueryListEvent) => {
            const newTheme = e.matches ? 'dark' : 'light'
            applyTheme(newTheme)
            set({ resolvedTheme: newTheme })
          }
          
          mediaQuery.addEventListener('change', handleChange)
        }
      },
    }),
    {
      name: 'hotel-booking-theme',
      storage: createJSONStorage(() => {
        // Use localStorage with SSR safety
        if (typeof window === 'undefined') {
          return {
            getItem: () => null,
            setItem: () => {},
            removeItem: () => {},
          }
        }
        return localStorage
      }),
    }
  )
)

// ==========================================
// THEME INITIALIZATION SCRIPT
// ==========================================

/**
 * Script to prevent flash of unstyled content (FOUC)
 * Add this to your root layout before any content
 */
export const themeInitScript = `
(function() {
  try {
    const stored = localStorage.getItem('hotel-booking-theme');
    const theme = stored ? JSON.parse(stored).state.theme : 'system';
    
    let resolvedTheme = theme;
    if (theme === 'system') {
      resolvedTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    
    document.documentElement.classList.add(resolvedTheme);
    document.documentElement.style.colorScheme = resolvedTheme;
  } catch (e) {
    console.error('Failed to initialize theme:', e);
  }
})();
`
