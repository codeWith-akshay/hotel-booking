// ==========================================
// ZUSTAND STORES USAGE EXAMPLES
// ==========================================

'use client'

import React, { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  useUser,
  useIsAuthenticated,
  useAuthActions,
  useThemeActions,
  useSessionTheme,
  initializeStores,
  clearAllStores,
  isSessionValid,
  hasRole,
  hasAnyRole,
  logStoreState,
} from '@/store'
import { useThemeStore } from '@/store/theme.store'
import { ThemeToggle, SimpleThemeToggle, ThemeStatus } from '@/components/ui/ThemeToggle'

// ==========================================
// EXAMPLE 1: Basic Auth Usage
// ==========================================

export function Example1_BasicAuth() {
  const user = useUser()
  const isAuthenticated = useIsAuthenticated()
  const { logout } = useAuthActions()

  return (
    <div className="rounded-lg border p-4">
      <h3 className="mb-2 font-bold">Example 1: Basic Auth</h3>
      
      {isAuthenticated ? (
        <div>
          <p>Welcome, {user?.name || 'User'}!</p>
          <p className="text-sm text-gray-600">Email: {user?.email}</p>
          <p className="text-sm text-gray-600">Role: {user?.role}</p>
          <button
            onClick={logout}
            className="mt-2 rounded bg-red-500 px-3 py-1 text-white"
          >
            Logout
          </button>
        </div>
      ) : (
        <p>Not logged in</p>
      )}
    </div>
  )
}

// ==========================================
// EXAMPLE 2: Theme Toggle
// ==========================================

export function Example2_ThemeToggle() {
  const { mode, resolvedTheme } = useThemeStore()
  const { setTheme, toggleTheme } = useThemeActions()

  return (
    <div className="rounded-lg border p-4">
      <h3 className="mb-2 font-bold">Example 2: Theme Toggle</h3>
      
      <div className="mb-4">
        <p className="text-sm">Current Mode: <strong>{mode}</strong></p>
        <p className="text-sm">Resolved Theme: <strong>{resolvedTheme}</strong></p>
      </div>

      <div className="flex flex-wrap gap-2">
        {/* Dropdown with label */}
        <ThemeToggle showLabel />
        
        {/* Simple toggle button */}
        <SimpleThemeToggle />
        
        {/* Button group */}
        <ThemeToggle variant="buttons" showLabel />
      </div>

      {/* Manual controls */}
      <div className="mt-4 flex gap-2">
        <button
          onClick={() => setTheme('light')}
          className="rounded bg-blue-500 px-3 py-1 text-white"
        >
          Light
        </button>
        <button
          onClick={() => setTheme('dark')}
          className="rounded bg-gray-800 px-3 py-1 text-white"
        >
          Dark
        </button>
        <button
          onClick={() => setTheme('system')}
          className="rounded bg-purple-500 px-3 py-1 text-white"
        >
          System
        </button>
        <button
          onClick={toggleTheme}
          className="rounded bg-green-500 px-3 py-1 text-white"
        >
          Toggle
        </button>
      </div>
    </div>
  )
}

// ==========================================
// EXAMPLE 3: Combined Session & Theme
// ==========================================

export function Example3_CombinedState() {
  const { user, isAuthenticated, theme, isDark } = useSessionTheme()

  return (
    <div className="rounded-lg border p-4">
      <h3 className="mb-2 font-bold">Example 3: Combined State</h3>
      
      <div className="space-y-2">
        <p className="text-sm">
          User: <strong>{user?.name || 'Guest'}</strong>
        </p>
        <p className="text-sm">
          Authenticated: <strong>{isAuthenticated ? 'Yes' : 'No'}</strong>
        </p>
        <p className="text-sm">
          Theme: <strong>{theme}</strong> (Dark: {isDark ? 'Yes' : 'No'})
        </p>
      </div>

      <div className="mt-4">
        <ThemeStatus />
      </div>
    </div>
  )
}

// ==========================================
// EXAMPLE 4: Role-Based UI
// ==========================================

export function Example4_RoleBasedUI() {
  const user = useUser()

  return (
    <div className="rounded-lg border p-4">
      <h3 className="mb-2 font-bold">Example 4: Role-Based UI</h3>
      
      <div className="space-y-2">
        {/* All users */}
        <div className="rounded bg-gray-100 p-2 dark:bg-gray-800">
          <p className="text-sm">🌐 Public content (everyone)</p>
        </div>

        {/* Members only */}
        {user && (
          <div className="rounded bg-blue-100 p-2 dark:bg-blue-900/20">
            <p className="text-sm">👤 Member content</p>
          </div>
        )}

        {/* Admins only */}
        {hasRole('ADMIN') && (
          <div className="rounded bg-yellow-100 p-2 dark:bg-yellow-900/20">
            <p className="text-sm">⚙️ Admin content</p>
          </div>
        )}

        {/* Super Admins only */}
        {hasRole('SUPERADMIN') && (
          <div className="rounded bg-red-100 p-2 dark:bg-red-900/20">
            <p className="text-sm">👑 Super Admin content</p>
          </div>
        )}

        {/* Admin or Super Admin */}
        {hasAnyRole(['ADMIN', 'SUPERADMIN']) && (
          <div className="rounded bg-purple-100 p-2 dark:bg-purple-900/20">
            <p className="text-sm">🔧 Management content</p>
          </div>
        )}
      </div>
    </div>
  )
}

// ==========================================
// EXAMPLE 5: Store Initialization
// ==========================================

export function Example5_StoreInit() {
  const [initResult, setInitResult] = React.useState<any>(null)

  const handleInit = () => {
    const result = initializeStores()
    setInitResult(result)
  }

  return (
    <div className="rounded-lg border p-4">
      <h3 className="mb-2 font-bold">Example 5: Store Initialization</h3>
      
      <button
        onClick={handleInit}
        className="mb-2 rounded bg-blue-500 px-3 py-1 text-white"
      >
        Initialize Stores
      </button>

      {initResult && (
        <div className="space-y-1 text-sm">
          <p>Success: <strong>{initResult.success ? 'Yes' : 'No'}</strong></p>
          <p>Auth Restored: <strong>{initResult.authRestored ? 'Yes' : 'No'}</strong></p>
          <p>Theme Applied: <strong>{initResult.themeApplied ? 'Yes' : 'No'}</strong></p>
          {initResult.errors.length > 0 && (
            <div className="text-red-600">
              <p>Errors:</p>
              <ul>
                {initResult.errors.map((err: string, i: number) => (
                  <li key={i}>- {err}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ==========================================
// EXAMPLE 6: Session Validation
// ==========================================

export function Example6_SessionValidation() {
  const router = useRouter()
  const [isValid, setIsValid] = React.useState<boolean | null>(null)

  const checkSession = () => {
    const valid = isSessionValid()
    setIsValid(valid)
    
    if (!valid) {
      alert('Session invalid! Redirecting to login...')
      router.push('/login')
    }
  }

  return (
    <div className="rounded-lg border p-4">
      <h3 className="mb-2 font-bold">Example 6: Session Validation</h3>
      
      <button
        onClick={checkSession}
        className="mb-2 rounded bg-green-500 px-3 py-1 text-white"
      >
        Check Session
      </button>

      {isValid !== null && (
        <p className="text-sm">
          Session Valid: <strong>{isValid ? 'Yes ✓' : 'No ✗'}</strong>
        </p>
      )}
    </div>
  )
}

// ==========================================
// EXAMPLE 7: Complete Logout
// ==========================================

export function Example7_CompleteLogout() {
  const router = useRouter()

  const handleLogout = () => {
    if (confirm('Clear all stores and logout?')) {
      clearAllStores()
      router.push('/login')
    }
  }

  return (
    <div className="rounded-lg border p-4">
      <h3 className="mb-2 font-bold">Example 7: Complete Logout</h3>
      
      <button
        onClick={handleLogout}
        className="rounded bg-red-500 px-3 py-1 text-white"
      >
        Complete Logout
      </button>
      
      <p className="mt-2 text-xs text-gray-600">
        Clears auth store (theme preference is preserved)
      </p>
    </div>
  )
}

// ==========================================
// EXAMPLE 8: Debug Store State
// ==========================================

export function Example8_DebugState() {
  return (
    <div className="rounded-lg border p-4">
      <h3 className="mb-2 font-bold">Example 8: Debug Store State</h3>
      
      <button
        onClick={logStoreState}
        className="rounded bg-gray-600 px-3 py-1 text-white"
      >
        Log Store State to Console
      </button>
      
      <p className="mt-2 text-xs text-gray-600">
        Check browser console (F12) for output
      </p>
    </div>
  )
}

// ==========================================
// EXAMPLE 9: Layout Root Initialization
// ==========================================

export function Example9_LayoutRoot() {
  useEffect(() => {
    // Initialize stores on app mount
    const result = initializeStores()
    console.log('🚀 Stores initialized:', result)
  }, [])

  return (
    <div className="rounded-lg border p-4">
      <h3 className="mb-2 font-bold">Example 9: Layout Root Initialization</h3>
      
      <p className="text-sm text-gray-600">
        This pattern should be used in app/layout.tsx:
      </p>
      
      <pre className="mt-2 overflow-x-auto rounded bg-gray-100 p-2 text-xs dark:bg-gray-800">
{`'use client'

export default function RootLayout({
  children 
}: {
  children: React.ReactNode
}) {
  useEffect(() => {
    initializeStores()
  }, [])

  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}`}
      </pre>
    </div>
  )
}

// ==========================================
// EXAMPLE 10: Protected Component
// ==========================================

export function Example10_ProtectedComponent() {
  const user = useUser()
  const { logout } = useAuthActions()

  // Redirect if not authenticated
  useEffect(() => {
    if (!user) {
      window.location.href = '/login'
    }
  }, [user])

  if (!user) {
    return <div>Redirecting to login...</div>
  }

  return (
    <div className="rounded-lg border p-4">
      <h3 className="mb-2 font-bold">Example 10: Protected Component</h3>
      
      <p className="text-sm">
        This component only renders when user is authenticated
      </p>
      
      <div className="mt-2 space-y-1 text-sm text-gray-600">
        <p>User: {user.name}</p>
        <p>Email: {user.email}</p>
        <p>Role: {user.role}</p>
      </div>

      <button
        onClick={logout}
        className="mt-2 rounded bg-red-500 px-3 py-1 text-white"
      >
        Logout
      </button>
    </div>
  )
}

// ==========================================
// DEMO PAGE
// ==========================================

export default function ZustandStoresExamplesPage() {
  return (
    <div className="min-h-screen bg-white p-8 dark:bg-gray-900">
      <div className="mx-auto max-w-4xl">
        <h1 className="mb-6 text-3xl font-bold">Zustand Stores Examples</h1>
        
        <div className="grid gap-4 md:grid-cols-2">
          <Example1_BasicAuth />
          <Example2_ThemeToggle />
          <Example3_CombinedState />
          <Example4_RoleBasedUI />
          <Example5_StoreInit />
          <Example6_SessionValidation />
          <Example7_CompleteLogout />
          <Example8_DebugState />
        </div>

        <div className="mt-4">
          <Example9_LayoutRoot />
        </div>
      </div>
    </div>
  )
}
