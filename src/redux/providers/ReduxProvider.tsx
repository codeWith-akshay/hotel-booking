'use client'

// ==========================================
// REDUX PROVIDER COMPONENT
// ==========================================
// Wrap your app with this provider to enable Redux

import React from 'react'
import { Provider } from 'react-redux'
import { store } from '../store'

interface ReduxProviderProps {
  children: React.ReactNode
}

/**
 * Redux Provider Component
 * 
 * Wraps application with Redux Provider to make store available
 * Use in app/layout.tsx or _app.tsx
 * 
 * @example
 * ```tsx
 * // In app/layout.tsx
 * import { ReduxProvider } from '@/redux/providers/ReduxProvider'
 * 
 * export default function RootLayout({ children }) {
 *   return (
 *     <html>
 *       <body>
 *         <ReduxProvider>
 *           {children}
 *         </ReduxProvider>
 *       </body>
 *     </html>
 *   )
 * }
 * ```
 */
export function ReduxProvider({ children }: ReduxProviderProps) {
  return <Provider store={store}>{children}</Provider>
}
