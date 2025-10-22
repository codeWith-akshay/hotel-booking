// ==========================================
// THEME STORE
// ==========================================
// Zustand store for theme management (light/dark mode)
// Persists theme preference to localStorage

import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

// ==========================================
// TYPE DEFINITIONS
// ==========================================

/**
 * Available theme modes
 */
export type ThemeMode = 'light' | 'dark' | 'system'

/**
 * Resolved theme (actual theme being used)
 */
export type ResolvedTheme = 'light' | 'dark'

/**
 * Theme state interface
 */
export interface ThemeState {
  // State
  /** Current theme mode (light/dark/system) */
  mode: ThemeMode
  
  /** Resolved theme (actual theme being displayed) */
  resolvedTheme: ResolvedTheme
  
  /** Whether to use system theme preference */
  useSystemTheme: boolean

  // Actions
  /** Set theme mode */
  setTheme: (mode: ThemeMode) => void
  
  /** Toggle between light and dark */
  toggleTheme: () => void
  
  /** Set resolved theme (internal use) */
  setResolvedTheme: (theme: ResolvedTheme) => void
  
  /** Reset to system default */
  resetToSystem: () => void

  // Utilities
  /** Check if dark mode is active */
  isDark: () => boolean
  
  /** Check if light mode is active */
  isLight: () => boolean
  
  /** Get CSS class for current theme */
  getThemeClass: () => string
}

// ==========================================
// SYSTEM THEME DETECTION
// ==========================================

/**
 * Detect system's preferred color scheme
 * 
 * @returns 'light' or 'dark' based on system preference
 */
function getSystemTheme(): ResolvedTheme {
  if (typeof window === 'undefined') return 'light'
  
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
  return prefersDark ? 'dark' : 'light'
}

/**
 * Resolve theme mode to actual theme
 * 
 * @param mode - Theme mode (light/dark/system)
 * @returns Resolved theme (light or dark)
 */
function resolveTheme(mode: ThemeMode): ResolvedTheme {
  if (mode === 'system') {
    return getSystemTheme()
  }
  return mode
}

// ==========================================
// ZUSTAND STORE
// ==========================================

/**
 * Theme Store
 * 
 * Manages application theme with support for:
 * - Light/Dark modes
 * - System preference detection
 * - localStorage persistence
 * - CSS class application
 * 
 * Usage:
 * ```tsx
 * const { mode, toggleTheme, setTheme, isDark } = useThemeStore()
 * 
 * // Toggle theme
 * <button onClick={toggleTheme}>
 *   {isDark() ? '🌙' : '☀️'}
 * </button>
 * 
 * // Set specific theme
 * <select onChange={(e) => setTheme(e.target.value as ThemeMode)}>
 *   <option value="light">Light</option>
 *   <option value="dark">Dark</option>
 *   <option value="system">System</option>
 * </select>
 * ```
 */
export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      // ==========================================
      // INITIAL STATE
      // ==========================================
      mode: 'system',
      resolvedTheme: 'light',
      useSystemTheme: true,

      // ==========================================
      // ACTIONS
      // ==========================================

      /**
       * Set theme mode
       * 
       * @param mode - Theme mode to set ('light', 'dark', or 'system')
       * 
       * @example
       * ```tsx
       * setTheme('dark')  // Force dark mode
       * setTheme('light') // Force light mode
       * setTheme('system') // Use system preference
       * ```
       */
      setTheme: (mode) => {
        const resolved = resolveTheme(mode)
        
        set({
          mode,
          resolvedTheme: resolved,
          useSystemTheme: mode === 'system',
        })

        // Apply theme to document
        applyThemeToDOM(resolved)
      },

      /**
       * Toggle between light and dark themes
       * If currently using system theme, switches to explicit light/dark
       * 
       * @example
       * ```tsx
       * <button onClick={toggleTheme}>
       *   Toggle Theme
       * </button>
       * ```
       */
      toggleTheme: () => {
        const { mode, resolvedTheme } = get()
        
        // If using system theme, toggle to opposite of current resolved theme
        if (mode === 'system') {
          const newMode: ThemeMode = resolvedTheme === 'dark' ? 'light' : 'dark'
          get().setTheme(newMode)
          return
        }

        // Toggle between light and dark
        const newMode: ThemeMode = mode === 'dark' ? 'light' : 'dark'
        get().setTheme(newMode)
      },

      /**
       * Set resolved theme (internal use)
       * Called when system theme changes
       */
      setResolvedTheme: (theme) => {
        set({ resolvedTheme: theme })
        applyThemeToDOM(theme)
      },

      /**
       * Reset to system default theme
       * 
       * @example
       * ```tsx
       * <button onClick={resetToSystem}>
       *   Use System Theme
       * </button>
       * ```
       */
      resetToSystem: () => {
        get().setTheme('system')
      },

      // ==========================================
      // UTILITIES
      // ==========================================

      /**
       * Check if dark mode is currently active
       * 
       * @returns true if dark mode is active
       */
      isDark: () => {
        return get().resolvedTheme === 'dark'
      },

      /**
       * Check if light mode is currently active
       * 
       * @returns true if light mode is active
       */
      isLight: () => {
        return get().resolvedTheme === 'light'
      },

      /**
       * Get CSS class for current theme
       * 
       * @returns 'dark' or 'light' class name
       */
      getThemeClass: () => {
        return get().resolvedTheme
      },
    }),
    {
      name: 'theme-storage', // localStorage key
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        // Only persist theme mode
        mode: state.mode,
      }),
    }
  )
)

// ==========================================
// DOM THEME APPLICATION
// ==========================================

/**
 * Apply theme to document root
 * Adds/removes 'dark' class on <html> element
 * 
 * @param theme - Theme to apply ('light' or 'dark')
 */
function applyThemeToDOM(theme: ResolvedTheme) {
  if (typeof window === 'undefined') return

  const root = document.documentElement

  if (theme === 'dark') {
    root.classList.add('dark')
  } else {
    root.classList.remove('dark')
  }

  // Set data attribute for CSS
  root.setAttribute('data-theme', theme)
}

// ==========================================
// SYSTEM THEME LISTENER
// ==========================================

/**
 * Initialize system theme listener
 * Watches for system theme changes and updates store
 * 
 * Call this once in your app initialization (e.g., _app.tsx or layout.tsx)
 * 
 * @example
 * ```tsx
 * useEffect(() => {
 *   const cleanup = initializeThemeListener()
 *   return cleanup
 * }, [])
 * ```
 */
export function initializeThemeListener() {
  if (typeof window === 'undefined') return () => {}

  const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')

  const handleChange = (e: MediaQueryListEvent | MediaQueryList) => {
    const store = useThemeStore.getState()
    
    // Only update if using system theme
    if (store.useSystemTheme) {
      const systemTheme = e.matches ? 'dark' : 'light'
      store.setResolvedTheme(systemTheme)
    }
  }

  // Initial check
  handleChange(mediaQuery)

  // Listen for changes
  mediaQuery.addEventListener('change', handleChange)

  // Cleanup function
  return () => {
    mediaQuery.removeEventListener('change', handleChange)
  }
}

/**
 * Initialize theme on app mount
 * Apply saved theme to DOM immediately to prevent flash
 * 
 * Call this in your root layout or _app.tsx
 * 
 * @example
 * ```tsx
 * useEffect(() => {
 *   initializeTheme()
 * }, [])
 * ```
 */
export function initializeTheme() {
  const store = useThemeStore.getState()
  const resolved = resolveTheme(store.mode)
  
  store.setResolvedTheme(resolved)
  applyThemeToDOM(resolved)
  
  // Start listening for system changes
  return initializeThemeListener()
}

// ==========================================
// SELECTORS (for optimized re-renders)
// ==========================================

export const selectThemeMode = (state: ThemeState) => state.mode
export const selectResolvedTheme = (state: ThemeState) => state.resolvedTheme
export const selectIsDark = (state: ThemeState) => state.resolvedTheme === 'dark'
export const selectIsLight = (state: ThemeState) => state.resolvedTheme === 'light'
export const selectUseSystemTheme = (state: ThemeState) => state.useSystemTheme

// ==========================================
// CUSTOM HOOKS
// ==========================================

/**
 * Hook to get theme mode only (optimized)
 * 
 * @example
 * ```tsx
 * const mode = useThemeMode()
 * ```
 */
export function useThemeMode() {
  return useThemeStore(selectThemeMode)
}

/**
 * Hook to check if dark mode is active (optimized)
 * 
 * @example
 * ```tsx
 * const isDark = useIsDark()
 * ```
 */
export function useIsDark() {
  return useThemeStore(selectIsDark)
}

/**
 * Hook to check if light mode is active (optimized)
 * 
 * @example
 * ```tsx
 * const isLight = useIsLight()
 * ```
 */
export function useIsLight() {
  return useThemeStore(selectIsLight)
}

/**
 * Hook to get resolved theme (optimized)
 * 
 * @example
 * ```tsx
 * const resolvedTheme = useResolvedTheme()
 * ```
 */
export function useResolvedTheme() {
  return useThemeStore(selectResolvedTheme)
}
