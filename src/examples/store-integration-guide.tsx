// ==========================================
// STORE INTEGRATION GUIDE
// ==========================================
// This file contains copy-paste examples for integrating stores
// into your application. Each section is independent.
// DO NOT import this file directly - copy the patterns you need.
// ==========================================

/* eslint-disable */
// @ts-nocheck

// ==========================================
// APP ROOT LAYOUT - STORE INTEGRATION
// ==========================================
// Copy this pattern to your app/layout.tsx

'use client'

import React, { useEffect } from 'react'
import { initializeStores } from '@/store'

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  useEffect(() => {
    // Initialize auth and theme stores
    const result = initializeStores()
    
    // Log initialization result (remove in production)
    if (process.env.NODE_ENV === 'development') {
      console.log('🚀 Stores initialized:', {
        success: result.success,
        authRestored: result.authRestored,
        themeApplied: result.themeApplied,
      })
      
      if (result.errors.length > 0) {
        console.error('Store initialization errors:', result.errors)
      }
    }
  }, [])

  return (
    <html lang="en">
      <head>
        {/* Prevent theme flash */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  const storage = localStorage.getItem('theme-storage');
                  if (storage) {
                    const { state } = JSON.parse(storage);
                    const mode = state.mode || 'system';
                    
                    let theme = mode;
                    if (mode === 'system') {
                      theme = window.matchMedia('(prefers-color-scheme: dark)').matches
                        ? 'dark'
                        : 'light';
                    }
                    
                    if (theme === 'dark') {
                      document.documentElement.classList.add('dark');
                    }
                  }
                } catch (e) {
                  console.error('Theme initialization error:', e);
                }
              })();
            `,
          }}
        />
      </head>
      <body>{children}</body>
    </html>
  )
}

// ==========================================
// HEADER COMPONENT - THEME TOGGLE INTEGRATION
// ==========================================
// Add ThemeToggle to your Header component

import { ThemeToggle } from '@/components/ui/ThemeToggle'
import { useUser, useAuthActions } from '@/store'

export function Header() {
  const user = useUser()
  const { logout } = useAuthActions()

  return (
    <header className="flex items-center justify-between p-4">
      <div className="text-xl font-bold">My App</div>
      
      <div className="flex items-center gap-4">
        {/* Theme Toggle */}
        <ThemeToggle size="md" />
        
        {/* User Menu */}
        {user && (
          <div className="flex items-center gap-2">
            <span>{user.name}</span>
            <button onClick={logout}>Logout</button>
          </div>
        )}
      </div>
    </header>
  )
}

// ==========================================
// PROTECTED PAGE EXAMPLE
// ==========================================

import { ProtectedRoute } from '@/components/auth/ProtectedRoute'

export default function AdminPage() {
  return (
    <ProtectedRoute allowedRoles={['ADMIN', 'SUPERADMIN']}>
      <div>
        <h1>Admin Dashboard</h1>
        {/* Admin content */}
      </div>
    </ProtectedRoute>
  )
}

// ==========================================
// LOGIN PAGE EXAMPLE
// ==========================================

import { useAuthActions } from '@/store'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const { setUser, setTokens } = useAuthActions()
  const router = useRouter()

  const handleLogin = async (phone: string, password: string) => {
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, password }),
      })

      const data = await response.json()

      if (data.user && data.accessToken) {
        setUser(data.user)
        setTokens(data.accessToken, data.refreshToken)
        router.push('/dashboard')
      }
    } catch (error) {
      console.error('Login error:', error)
    }
  }

  return (
    <div>
      <h1>Login</h1>
      {/* Login form */}
    </div>
  )
}

// ==========================================
// API CALL WITH AUTH EXAMPLE
// ==========================================

import { useAuthStore } from '@/store/auth.store'

async function fetchProtectedData() {
  const { getAuthHeader, isTokenExpired, logout } = useAuthStore.getState()

  // Check token expiration
  if (isTokenExpired()) {
    logout()
    throw new Error('Session expired')
  }

  const response = await fetch('/api/protected-endpoint', {
    headers: {
      'Authorization': getAuthHeader() || '',
    },
  })

  if (!response.ok) {
    throw new Error('API call failed')
  }

  return response.json()
}

// ==========================================
// THEME-AWARE COMPONENT EXAMPLE
// ==========================================

import { useIsDark } from '@/store/theme.store'

export function MyComponent() {
  const isDark = useIsDark()

  return (
    <div className={isDark ? 'dark-variant' : 'light-variant'}>
      <p>This component adapts to theme</p>
    </div>
  )
}

// ==========================================
// ROLE-BASED RENDERING EXAMPLE
// ==========================================

import { hasRole, hasAnyRole } from '@/store'

export function Dashboard() {
  return (
    <div>
      <h1>Dashboard</h1>
      
      {/* Show for all authenticated users */}
      <div>Welcome to dashboard</div>
      
      {/* Show only for admins */}
      {hasRole('ADMIN') && (
        <div>Admin-only section</div>
      )}
      
      {/* Show for admins or superadmins */}
      {hasAnyRole(['ADMIN', 'SUPERADMIN']) && (
        <div>Management section</div>
      )}
    </div>
  )
}
