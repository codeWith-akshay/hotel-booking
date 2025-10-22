// ==========================================
// STORE UTILITIES
// ==========================================
// Helper functions and hooks for auth and theme stores

import { useAuthStore, type User } from './auth.store'
import { useThemeStore, type ThemeMode, type ResolvedTheme } from './theme.store'

// ==========================================
// TYPE DEFINITIONS
// ==========================================

/**
 * Combined session and theme state
 */
export interface SessionTheme {
  // Auth
  user: User | null
  isAuthenticated: boolean
  token: string | null
  
  // Theme
  theme: ResolvedTheme
  themeMode: ThemeMode
  isDark: boolean
}

/**
 * Store initialization result
 */
export interface StoreInitResult {
  success: boolean
  authRestored: boolean
  themeApplied: boolean
  errors: string[]
}

// ==========================================
// COMBINED STORE HOOKS
// ==========================================

/**
 * Get combined session and theme state
 * 
 * Useful when you need both auth and theme info in one component
 * 
 * @returns Combined session and theme state
 * 
 * @example
 * ```tsx
 * const { user, isAuthenticated, theme, isDark } = useSessionTheme()
 * 
 * return (
 *   <div className={isDark ? 'dark' : 'light'}>
 *     <p>Hello, {user?.name || 'Guest'}</p>
 *   </div>
 * )
 * ```
 */
export function useSessionTheme(): SessionTheme {
  const { user, isAuthenticated, token } = useAuthStore()
  const { resolvedTheme, mode, isDark } = useThemeStore()

  return {
    user,
    isAuthenticated,
    token,
    theme: resolvedTheme,
    themeMode: mode,
    isDark: isDark(),
  }
}

/**
 * Get user info only (optimized)
 * 
 * @example
 * ```tsx
 * const user = useUser()
 * ```
 */
export function useUser(): User | null {
  return useAuthStore((state) => state.user)
}

/**
 * Get authentication status only (optimized)
 * 
 * @example
 * ```tsx
 * const isAuth = useIsAuthenticated()
 * ```
 */
export function useIsAuthenticated(): boolean {
  return useAuthStore((state) => state.isAuthenticated)
}

/**
 * Get auth actions only (optimized)
 * 
 * @example
 * ```tsx
 * const { logout, setUser } = useAuthActions()
 * ```
 */
export function useAuthActions() {
  return useAuthStore((state) => ({
    setUser: state.setUser,
    setTokens: state.setTokens,
    logout: state.logout,
    setLoading: state.setLoading,
  }))
}

/**
 * Get theme actions only (optimized)
 * 
 * @example
 * ```tsx
 * const { toggleTheme, setTheme } = useThemeActions()
 * ```
 */
export function useThemeActions() {
  return useThemeStore((state) => ({
    setTheme: state.setTheme,
    toggleTheme: state.toggleTheme,
    resetToSystem: state.resetToSystem,
  }))
}

// ==========================================
// STORE INITIALIZATION
// ==========================================

/**
 * Initialize all stores
 * 
 * Call this once in your app root (layout.tsx or _app.tsx)
 * 
 * @returns Initialization result
 * 
 * @example
 * ```tsx
 * // In app/layout.tsx
 * useEffect(() => {
 *   const result = initializeStores()
 *   console.log('Stores initialized:', result)
 * }, [])
 * ```
 */
export function initializeStores(): StoreInitResult {
  const errors: string[] = []
  let authRestored = false
  let themeApplied = false

  try {
    // Initialize auth store
    const authState = useAuthStore.getState()
    
    // Check if session was restored from localStorage
    authRestored = !!(authState.user && authState.token)
    
    // Validate token if exists
    if (authState.token && authState.isTokenExpired()) {
      console.log('[Store Init] Token expired, clearing session')
      authState.logout()
      authRestored = false
    }
  } catch (error) {
    errors.push(`Auth initialization error: ${error}`)
  }

  try {
    // Initialize theme store
    const { initializeTheme } = require('./theme.store')
    initializeTheme()
    themeApplied = true
  } catch (error) {
    errors.push(`Theme initialization error: ${error}`)
  }

  return {
    success: errors.length === 0,
    authRestored,
    themeApplied,
    errors,
  }
}

/**
 * Clear all stores
 * 
 * Useful for testing or complete logout
 * 
 * @example
 * ```tsx
 * const handleCompleteLogout = () => {
 *   clearAllStores()
 *   router.push('/login')
 * }
 * ```
 */
export function clearAllStores() {
  // Clear auth
  useAuthStore.getState().logout()
  
  // Reset theme to system default
  useThemeStore.getState().resetToSystem()
  
  // Clear localStorage manually if needed
  if (typeof window !== 'undefined') {
    localStorage.removeItem('auth-storage')
    // Don't remove theme-storage as user preference should persist
  }
}

// ==========================================
// VALIDATION HELPERS
// ==========================================

/**
 * Check if user session is valid
 * 
 * @returns true if user is logged in and token is valid
 * 
 * @example
 * ```tsx
 * if (!isSessionValid()) {
 *   router.push('/login')
 * }
 * ```
 */
export function isSessionValid(): boolean {
  const { user, token, isTokenExpired } = useAuthStore.getState()
  
  if (!user || !token) return false
  if (isTokenExpired()) return false
  
  return true
}

/**
 * Check if user has specific role
 * 
 * @param requiredRole - Role to check
 * @returns true if user has the role
 * 
 * @example
 * ```tsx
 * if (hasRole('ADMIN')) {
 *   // Show admin tools
 * }
 * ```
 */
export function hasRole(requiredRole: string): boolean {
  const user = useAuthStore.getState().user
  return user?.role === requiredRole
}

/**
 * Check if user has any of the required roles
 * 
 * @param requiredRoles - Array of roles
 * @returns true if user has any of the roles
 * 
 * @example
 * ```tsx
 * if (hasAnyRole(['ADMIN', 'SUPERADMIN'])) {
 *   // Show management tools
 * }
 * ```
 */
export function hasAnyRole(requiredRoles: string[]): boolean {
  const user = useAuthStore.getState().user
  return !!user && requiredRoles.includes(user.role)
}

// ==========================================
// DEBUG HELPERS
// ==========================================

/**
 * Get all store states (for debugging)
 * 
 * @example
 * ```tsx
 * console.log('Current stores:', getStoreSnapshot())
 * ```
 */
export function getStoreSnapshot() {
  return {
    auth: {
      user: useAuthStore.getState().user,
      isAuthenticated: useAuthStore.getState().isAuthenticated,
      hasToken: !!useAuthStore.getState().token,
      tokenExpired: useAuthStore.getState().isTokenExpired(),
    },
    theme: {
      mode: useThemeStore.getState().mode,
      resolved: useThemeStore.getState().resolvedTheme,
      isDark: useThemeStore.getState().isDark(),
    },
  }
}

/**
 * Log store state to console (for debugging)
 * 
 * @example
 * ```tsx
 * <button onClick={logStoreState}>Debug Stores</button>
 * ```
 */
export function logStoreState() {
  console.group('🔍 Store State')
  console.log('Auth:', useAuthStore.getState())
  console.log('Theme:', useThemeStore.getState())
  console.groupEnd()
}

// ==========================================
// SYNC HELPERS
// ==========================================

/**
 * Sync auth state with server
 * Call this to validate session with backend
 * 
 * @example
 * ```tsx
 * useEffect(() => {
 *   validateSessionWithServer()
 * }, [])
 * ```
 */
export async function validateSessionWithServer(): Promise<boolean> {
  try {
    const { token, getAuthHeader, logout, setUser } = useAuthStore.getState()
    
    if (!token) return false

    // Make API call to validate token
    const response = await fetch('/api/auth/validate', {
      headers: {
        'Authorization': getAuthHeader() || '',
      },
    })

    if (!response.ok) {
      // Token invalid, logout
      logout()
      return false
    }

    const data = await response.json()
    
    // Update user info if changed
    if (data.user) {
      setUser(data.user)
    }

    return true
  } catch (error) {
    console.error('[Store] Session validation error:', error)
    return false
  }
}

/**
 * Refresh JWT token
 * 
 * @example
 * ```tsx
 * const success = await refreshAuthToken()
 * ```
 */
export async function refreshAuthToken(): Promise<boolean> {
  try {
    const { refreshToken, setTokens, logout } = useAuthStore.getState()
    
    if (!refreshToken) {
      logout()
      return false
    }

    // Make API call to refresh token
    const response = await fetch('/api/auth/refresh', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ refreshToken }),
    })

    if (!response.ok) {
      logout()
      return false
    }

    const data = await response.json()
    
    if (data.accessToken) {
      setTokens(data.accessToken, data.refreshToken)
      return true
    }

    return false
  } catch (error) {
    console.error('[Store] Token refresh error:', error)
    return false
  }
}

// ==========================================
// EXPORTS
// ==========================================

export {
  useAuthStore,
  useThemeStore,
  type User,
  type ThemeMode,
  type ResolvedTheme,
}
