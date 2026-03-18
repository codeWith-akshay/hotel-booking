// ==========================================
// HYDRATION UTILITIES - Safe Client-Side Operations
// ==========================================
// Utilities to prevent React error #185 (hydration mismatch)
// between server and client rendering

'use client'

import React, { useState, useEffect, useId, useRef, useCallback } from 'react'

// ==========================================
// STABLE ID GENERATION (replaces Math.random())
// ==========================================

/**
 * Generate a stable unique ID that's consistent between server and client
 * Uses React's useId() hook which is hydration-safe
 */
export function useStableId(prefix?: string): string {
  const id = useId()
  return prefix ? `${prefix}-${id}` : id
}

/**
 * Counter for generating unique IDs in event handlers (not during render)
 * This is safe because it's only called in response to user actions
 */
let idCounter = 0
export function generateEventId(prefix = 'id'): string {
  return `${prefix}-${++idCounter}-${Date.now()}`
}

// ==========================================
// CLIENT-ONLY STATE (run after hydration)
// ==========================================

/**
 * Hook that returns true only after client-side hydration
 * Use this to conditionally render client-only content
 */
export function useHasMounted(): boolean {
  const [hasMounted, setHasMounted] = useState(false)
  
  useEffect(() => {
    setHasMounted(true)
  }, [])
  
  return hasMounted
}

/**
 * Hook that returns a value only after mount
 * Server returns defaultValue, client returns computed value
 */
export function useClientValue<T>(
  computeValue: () => T,
  defaultValue: T
): T {
  const [value, setValue] = useState<T>(defaultValue)
  
  useEffect(() => {
    setValue(computeValue())
  }, []) // Only run once on mount
  
  return value
}

// ==========================================
// DATE UTILITIES (hydration-safe)
// ==========================================

/**
 * Get current year in a hydration-safe way
 * Returns 2026 (or current year) consistently
 */
export function useCurrentYear(): number {
  // Use a stable default value that matches server
  const [year, setYear] = useState(2026) // Default year for SSR
  
  useEffect(() => {
    setYear(new Date().getFullYear())
  }, [])
  
  return year
}

/**
 * Hook to get the current date, only computed client-side
 * Server returns null, client returns Date
 */
export function useCurrentDate(): Date | null {
  const [date, setDate] = useState<Date | null>(null)
  
  useEffect(() => {
    setDate(new Date())
  }, [])
  
  return date
}

/**
 * Format a date only on the client side
 * Returns placeholder on server, formatted date on client
 */
export function useFormattedDate(
  date: Date | string | null | undefined,
  options?: Intl.DateTimeFormatOptions,
  placeholder = '—'
): string {
  const hasMounted = useHasMounted()
  
  if (!hasMounted || !date) return placeholder
  
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date
    return dateObj.toLocaleDateString(undefined, options)
  } catch {
    return placeholder
  }
}

/**
 * Calculate days difference from a date (client-side only)
 */
export function useDaysFromNow(targetDate: Date | string | null | undefined): number | null {
  const [days, setDays] = useState<number | null>(null)
  
  useEffect(() => {
    if (!targetDate) {
      setDays(null)
      return
    }
    
    const target = typeof targetDate === 'string' ? new Date(targetDate) : targetDate
    const now = new Date()
    const diffTime = target.getTime() - now.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    setDays(diffDays)
  }, [targetDate])
  
  return days
}

// ==========================================
// WINDOW/DOCUMENT ACCESS (hydration-safe)
// ==========================================

/**
 * Check if we're in a browser environment
 */
export const isBrowser = typeof window !== 'undefined'

/**
 * Get window dimensions (hydration-safe)
 */
export function useWindowSize(): { width: number; height: number } {
  const [size, setSize] = useState({ width: 1024, height: 768 }) // Default for SSR
  
  useEffect(() => {
    function handleResize() {
      setSize({
        width: window.innerWidth,
        height: window.innerHeight,
      })
    }
    
    // Set initial size
    handleResize()
    
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])
  
  return size
}

/**
 * Check if viewport is mobile (hydration-safe)
 */
export function useIsMobileView(breakpoint = 768): boolean {
  const { width } = useWindowSize()
  const hasMounted = useHasMounted()
  
  // Return false (desktop) on server to match most users
  if (!hasMounted) return false
  
  return width < breakpoint
}

/**
 * Safe localStorage access
 */
export function useLocalStorage<T>(
  key: string,
  initialValue: T
): [T, (value: T | ((prev: T) => T)) => void] {
  const [storedValue, setStoredValue] = useState<T>(initialValue)
  
  useEffect(() => {
    try {
      const item = window.localStorage.getItem(key)
      if (item) {
        setStoredValue(JSON.parse(item))
      }
    } catch (error) {
      console.warn(`Error reading localStorage key "${key}":`, error)
    }
  }, [key])
  
  const setValue = useCallback((value: T | ((prev: T) => T)) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value
      setStoredValue(valueToStore)
      window.localStorage.setItem(key, JSON.stringify(valueToStore))
    } catch (error) {
      console.warn(`Error setting localStorage key "${key}":`, error)
    }
  }, [key, storedValue])
  
  return [storedValue, setValue]
}

// ==========================================
// RENDER SUPPRESSION FOR DYNAMIC CONTENT
// ==========================================

/**
 * Component wrapper that suppresses hydration warnings for dynamic content
 * Use sparingly - only for content that MUST differ between server/client
 */
export function ClientOnly({ 
  children, 
  fallback = null 
}: { 
  children: React.ReactNode
  fallback?: React.ReactNode 
}): React.ReactNode {
  const hasMounted = useHasMounted()
  
  if (!hasMounted) {
    return fallback
  }
  
  return children
}

/**
 * Wrapper for elements that should suppress hydration warnings
 * Use for dates, random IDs, etc. that will differ
 */
export function SuppressHydrationWarning({ 
  children,
  as = 'span',
}: { 
  children: React.ReactNode
  as?: 'span' | 'div' | 'p'
}): React.ReactElement {
  const Element = as
  return (
    <Element suppressHydrationWarning>
      {children}
    </Element>
  )
}
