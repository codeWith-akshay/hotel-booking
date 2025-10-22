import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

// ==========================================
// TYPE DEFINITIONS
// ==========================================

export interface User {
  id: string
  phone: string
  name: string
  email: string | null
  role: string
  roleId: string
}

export interface AuthState {
  // State
  user: User | null
  token: string | null
  refreshToken: string | null
  isAuthenticated: boolean
  isLoading: boolean

  // OTP Flow State
  pendingPhone: string | null // Phone number waiting for OTP verification
  otpExpiresAt: string | null // OTP expiration timestamp

  // Actions
  setUser: (user: User | null) => void
  setTokens: (token: string, refreshToken?: string) => void
  setPendingPhone: (phone: string, expiresAt: string) => void
  clearPendingPhone: () => void
  logout: () => void
  setLoading: (loading: boolean) => void

  // Utilities
  isTokenExpired: () => boolean
  getAuthHeader: () => string | null
}

// ==========================================
// ZUSTAND STORE
// ==========================================

/**
 * Zustand Store: Authentication State Management
 * 
 * Features:
 * - Persisted to localStorage (survives page refresh)
 * - User session management
 * - JWT token storage
 * - OTP flow state (pending phone verification)
 * - Auto-logout on token expiration
 * 
 * Usage:
 * ```tsx
 * const { user, token, setUser, logout } = useAuthStore()
 * ```
 */
export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      // ==========================================
      // INITIAL STATE
      // ==========================================
      user: null,
      token: null,
      refreshToken: null,
      isAuthenticated: false,
      isLoading: false,
      pendingPhone: null,
      otpExpiresAt: null,

      // ==========================================
      // ACTIONS
      // ==========================================

      /**
       * Set authenticated user
       * Updates user info and authentication status
       */
      setUser: (user) =>
        set({
          user,
          isAuthenticated: !!user,
        }),

      /**
       * Set JWT tokens
       * Stores access token and optional refresh token
       */
      setTokens: (token, refreshToken) =>
        set({
          token,
          refreshToken: refreshToken || get().refreshToken,
          isAuthenticated: true,
        }),

      /**
       * Set pending phone number (waiting for OTP)
       * Called after successful OTP request
       */
      setPendingPhone: (phone, expiresAt) =>
        set({
          pendingPhone: phone,
          otpExpiresAt: expiresAt,
        }),

      /**
       * Clear pending phone state
       * Called after successful OTP verification or timeout
       */
      clearPendingPhone: () =>
        set({
          pendingPhone: null,
          otpExpiresAt: null,
        }),

      /**
       * Logout user
       * Clears all authentication state
       */
      logout: () =>
        set({
          user: null,
          token: null,
          refreshToken: null,
          isAuthenticated: false,
          pendingPhone: null,
          otpExpiresAt: null,
        }),

      /**
       * Set loading state
       * For showing loading indicators during API calls
       */
      setLoading: (loading) =>
        set({
          isLoading: loading,
        }),

      // ==========================================
      // UTILITIES
      // ==========================================

      /**
       * Check if access token is expired
       * Parses JWT and checks expiration time
       */
      isTokenExpired: () => {
        const { token } = get()
        if (!token) return true

        try {
          // Decode JWT payload (base64)
          const parts = token.split('.')
          if (parts.length !== 3 || !parts[1]) return true
          
          const payload = JSON.parse(atob(parts[1]))
          const exp = payload.exp * 1000 // Convert to milliseconds

          // Check if expired (with 30 second buffer)
          return Date.now() >= exp - 30000
        } catch {
          return true
        }
      },

      /**
       * Get Authorization header value
       * Returns Bearer token or null
       */
      getAuthHeader: () => {
        const { token } = get()
        return token ? `Bearer ${token}` : null
      },
    }),
    {
      name: 'auth-storage', // localStorage key
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        // Only persist these fields
        user: state.user,
        token: state.token,
        refreshToken: state.refreshToken,
        isAuthenticated: state.isAuthenticated,
        pendingPhone: state.pendingPhone,
        otpExpiresAt: state.otpExpiresAt,
      }),
    }
  )
)

// ==========================================
// SELECTORS (for optimized re-renders)
// ==========================================

export const selectUser = (state: AuthState) => state.user
export const selectIsAuthenticated = (state: AuthState) => state.isAuthenticated
export const selectIsLoading = (state: AuthState) => state.isLoading
export const selectPendingPhone = (state: AuthState) => state.pendingPhone
export const selectOtpExpiresAt = (state: AuthState) => state.otpExpiresAt
