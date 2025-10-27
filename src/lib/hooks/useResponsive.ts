// ==========================================
// RESPONSIVE DESIGN UTILITIES
// ==========================================
// Hooks and utilities for responsive breakpoints and device detection

'use client'

import { useState, useEffect, useCallback } from 'react'

// ==========================================
// BREAKPOINT DEFINITIONS
// ==========================================

export const breakpoints = {
  xs: 0,
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  '2xl': 1536,
} as const

export type Breakpoint = keyof typeof breakpoints

// ==========================================
// MEDIA QUERY HOOK
// ==========================================

/**
 * Hook to match media queries
 * 
 * @example
 * ```tsx
 * const isMobile = useMediaQuery('(max-width: 768px)')
 * ```
 */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    const mediaQuery = window.matchMedia(query)
    setMatches(mediaQuery.matches)

    const handleChange = (event: MediaQueryListEvent) => {
      setMatches(event.matches)
    }

    mediaQuery.addEventListener('change', handleChange)

    return () => {
      mediaQuery.removeEventListener('change', handleChange)
    }
  }, [query])

  // Return false during SSR to prevent hydration mismatch
  return mounted ? matches : false
}

// ==========================================
// BREAKPOINT HOOK
// ==========================================

/**
 * Hook to get current active breakpoint
 * 
 * @example
 * ```tsx
 * const breakpoint = useBreakpoint()
 * const isMobile = breakpoint === 'xs' || breakpoint === 'sm'
 * ```
 */
export function useBreakpoint(): Breakpoint {
  const [breakpoint, setBreakpoint] = useState<Breakpoint>('lg')

  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth
      
      if (width < breakpoints.sm) setBreakpoint('xs')
      else if (width < breakpoints.md) setBreakpoint('sm')
      else if (width < breakpoints.lg) setBreakpoint('md')
      else if (width < breakpoints.xl) setBreakpoint('lg')
      else if (width < breakpoints['2xl']) setBreakpoint('xl')
      else setBreakpoint('2xl')
    }

    handleResize()
    window.addEventListener('resize', handleResize)

    return () => window.removeEventListener('resize', handleResize)
  }, [])

  return breakpoint
}

// ==========================================
// MOBILE DETECTION HOOKS
// ==========================================

/**
 * Hook to detect if device is mobile
 * 
 * @example
 * ```tsx
 * const isMobile = useIsMobile()
 * ```
 */
export function useIsMobile(): boolean {
  return useMediaQuery('(max-width: 768px)')
}

/**
 * Hook to detect if device is tablet
 * 
 * @example
 * ```tsx
 * const isTablet = useIsTablet()
 * ```
 */
export function useIsTablet(): boolean {
  return useMediaQuery('(min-width: 768px) and (max-width: 1024px)')
}

/**
 * Hook to detect if device is desktop
 * 
 * @example
 * ```tsx
 * const isDesktop = useIsDesktop()
 * ```
 */
export function useIsDesktop(): boolean {
  return useMediaQuery('(min-width: 1024px)')
}

// ==========================================
// TOUCH DETECTION HOOK
// ==========================================

/**
 * Hook to detect if device supports touch
 * 
 * @example
 * ```tsx
 * const isTouch = useIsTouch()
 * ```
 */
export function useIsTouch(): boolean {
  const [isTouch, setIsTouch] = useState(false)

  useEffect(() => {
    setIsTouch(
      'ontouchstart' in window ||
      navigator.maxTouchPoints > 0 ||
      // @ts-ignore - for older browsers
      navigator.msMaxTouchPoints > 0
    )
  }, [])

  return isTouch
}

// ==========================================
// VIEWPORT SIZE HOOK
// ==========================================

/**
 * Hook to get current viewport dimensions
 * 
 * @example
 * ```tsx
 * const { width, height } = useViewportSize()
 * ```
 */
export function useViewportSize() {
  const [size, setSize] = useState({
    width: 0,
    height: 0,
  })

  useEffect(() => {
    const handleResize = () => {
      setSize({
        width: window.innerWidth,
        height: window.innerHeight,
      })
    }

    handleResize()
    window.addEventListener('resize', handleResize)

    return () => window.removeEventListener('resize', handleResize)
  }, [])

  return size
}

// ==========================================
// ORIENTATION HOOK
// ==========================================

/**
 * Hook to detect device orientation
 * 
 * @example
 * ```tsx
 * const orientation = useOrientation()
 * ```
 */
export function useOrientation(): 'portrait' | 'landscape' {
  const [orientation, setOrientation] = useState<'portrait' | 'landscape'>('portrait')

  useEffect(() => {
    const handleOrientationChange = () => {
      setOrientation(
        window.innerHeight > window.innerWidth ? 'portrait' : 'landscape'
      )
    }

    handleOrientationChange()
    window.addEventListener('resize', handleOrientationChange)

    return () => window.removeEventListener('resize', handleOrientationChange)
  }, [])

  return orientation
}

// ==========================================
// RESPONSIVE VALUE HOOK
// ==========================================

/**
 * Hook to get responsive values based on breakpoint
 * 
 * @example
 * ```tsx
 * const columns = useResponsiveValue({ xs: 1, sm: 2, md: 3, lg: 4 })
 * ```
 */
export function useResponsiveValue<T>(
  values: Partial<Record<Breakpoint, T>>
): T | undefined {
  const breakpoint = useBreakpoint()
  
  // Find the appropriate value for current breakpoint
  const breakpointOrder: Breakpoint[] = ['2xl', 'xl', 'lg', 'md', 'sm', 'xs']
  const currentIndex = breakpointOrder.indexOf(breakpoint)
  
  for (let i = currentIndex; i < breakpointOrder.length; i++) {
    const bp = breakpointOrder[i]
    if (bp && values[bp] !== undefined) {
      return values[bp]
    }
  }
  
  return undefined
}

// ==========================================
// CONTAINER QUERY HOOK
// ==========================================

/**
 * Hook to observe element width for container queries
 * 
 * @example
 * ```tsx
 * const { ref, width } = useContainerWidth<HTMLDivElement>()
 * return <div ref={ref}>Width: {width}px</div>
 * ```
 */
export function useContainerWidth<T extends HTMLElement>() {
  const [width, setWidth] = useState(0)
  const [ref, setRef] = useState<T | null>(null)

  const refCallback = useCallback((node: T | null) => {
    setRef(node)
  }, [])

  useEffect(() => {
    if (!ref) return

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setWidth(entry.contentRect.width)
      }
    })

    observer.observe(ref)

    return () => {
      observer.disconnect()
    }
  }, [ref])

  return { ref: refCallback, width }
}
