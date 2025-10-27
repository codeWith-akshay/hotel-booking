'use client'

import dynamic from 'next/dynamic'
import { ReactNode } from 'react'

// Dynamically import client components with no SSR
const ReduxProvider = dynamic(() => import('@/redux/ReduxProvider'), {
  ssr: false,
  loading: () => null,
})

const ThemeProvider = dynamic(() => import('@/components/theme/ThemeProvider').then(mod => ({ default: mod.ThemeProvider })), {
  ssr: false,
  loading: () => null,
})

const AppLayoutWrapper = dynamic(() => import('@/components/layout/AppLayoutWrapper'), {
  ssr: false,
  loading: () => null,
})

interface ClientProvidersProps {
  children: ReactNode
}

export function ClientProviders({ children }: ClientProvidersProps) {
  return (
    <ReduxProvider>
      <ThemeProvider />
      <AppLayoutWrapper>
        {children}
      </AppLayoutWrapper>
    </ReduxProvider>
  )
}
