// ==========================================
// REDUX PROVIDER COMPONENT
// ==========================================
// Client-side Redux Provider wrapper for Next.js App Router

'use client'

import { Provider } from 'react-redux'
import { store } from './store'

interface ReduxProviderProps {
  children: React.ReactNode
}

/**
 * Redux Provider Component
 * 
 * Wraps the application with Redux Provider to make the store
 * available to all components.
 * 
 * Must be a client component ('use client') for Next.js App Router.
 * 
 * @example
 * ```tsx
 * <ReduxProvider>
 *   <YourApp />
 * </ReduxProvider>
 * ```
 */
export default function ReduxProvider({ children }: ReduxProviderProps) {
  return <Provider store={store}>{children}</Provider>
}
