// ==========================================
// PERFORMANCE UTILITIES & HOOKS
// ==========================================
// Collection of performance optimization utilities for the hotel booking app
// PERF: memoization, debouncing, and optimized state selectors

import { useCallback, useRef, useEffect, useState, useMemo } from 'react'

// ==========================================
// DEBOUNCE HOOK
// ==========================================

/**
 * Debounce a value - useful for search inputs and API calls
 * @param value - The value to debounce
 * @param delay - The delay in milliseconds
 */
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value)

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    return () => {
      clearTimeout(timer)
    }
  }, [value, delay])

  return debouncedValue
}

// ==========================================
// DEBOUNCED CALLBACK HOOK
// ==========================================

/**
 * Create a debounced callback function
 * @param callback - The function to debounce
 * @param delay - The delay in milliseconds
 */
export function useDebouncedCallback<T extends (...args: any[]) => any>(
  callback: T,
  delay: number
): (...args: Parameters<T>) => void {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)

  const debouncedCallback = useCallback(
    (...args: Parameters<T>) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }

      timeoutRef.current = setTimeout(() => {
        callback(...args)
      }, delay)
    },
    [callback, delay]
  )

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [])

  return debouncedCallback
}

// ==========================================
// THROTTLE HOOK
// ==========================================

/**
 * Throttle a callback function
 * @param callback - The function to throttle
 * @param limit - The minimum time between calls in milliseconds
 */
export function useThrottledCallback<T extends (...args: any[]) => any>(
  callback: T,
  limit: number
): (...args: Parameters<T>) => void {
  const lastRunRef = useRef<number>(0)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)

  const throttledCallback = useCallback(
    (...args: Parameters<T>) => {
      const now = Date.now()
      const remaining = limit - (now - lastRunRef.current)

      if (remaining <= 0) {
        lastRunRef.current = now
        callback(...args)
      } else if (!timeoutRef.current) {
        timeoutRef.current = setTimeout(() => {
          lastRunRef.current = Date.now()
          timeoutRef.current = null
          callback(...args)
        }, remaining)
      }
    },
    [callback, limit]
  )

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [])

  return throttledCallback
}

// ==========================================
// PREVIOUS VALUE HOOK
// ==========================================

/**
 * Track the previous value of a variable
 * Useful for comparing old vs new values
 */
export function usePreviousValue<T>(value: T): T | undefined {
  const ref = useRef<T>()

  useEffect(() => {
    ref.current = value
  }, [value])

  return ref.current
}

// ==========================================
// INTERSECTION OBSERVER HOOK
// ==========================================

/**
 * Hook for lazy loading elements when they come into view
 * @param options - Intersection observer options
 */
export function useIntersectionObserver(
  options?: IntersectionObserverInit
): [React.RefObject<HTMLDivElement>, boolean] {
  const elementRef = useRef<HTMLDivElement>(null)
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const element = elementRef.current
    if (!element) return

    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setIsVisible(true)
        observer.unobserve(element)
      }
    }, options)

    observer.observe(element)

    return () => {
      observer.disconnect()
    }
  }, [options])

  return [elementRef, isVisible]
}

// ==========================================
// MEDIA QUERY HOOK
// ==========================================

/**
 * Hook for responsive design
 * @param query - The media query string
 */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(() => {
    if (typeof window === 'undefined') return false
    return window.matchMedia(query).matches
  })

  useEffect(() => {
    if (typeof window === 'undefined') return

    const mediaQuery = window.matchMedia(query)
    const handler = (event: MediaQueryListEvent) => setMatches(event.matches)

    setMatches(mediaQuery.matches)
    mediaQuery.addEventListener('change', handler)

    return () => {
      mediaQuery.removeEventListener('change', handler)
    }
  }, [query])

  return matches
}

// Common breakpoints
export const useIsMobile = () => useMediaQuery('(max-width: 767px)')
export const useIsTablet = () => useMediaQuery('(min-width: 768px) and (max-width: 1023px)')
export const useIsDesktop = () => useMediaQuery('(min-width: 1024px)')

// ==========================================
// STABLE CALLBACK HOOK
// ==========================================

/**
 * Returns a stable callback reference that always calls the latest function
 * Useful for event handlers in useEffect dependencies
 */
export function useStableCallback<T extends (...args: any[]) => any>(
  callback: T
): T {
  const callbackRef = useRef(callback)

  useEffect(() => {
    callbackRef.current = callback
  }, [callback])

  return useCallback(
    ((...args) => callbackRef.current(...args)) as T,
    []
  )
}

// ==========================================
// MEMOIZED OBJECT HOOK
// ==========================================

/**
 * Memoize an object based on shallow equality of its values
 * Prevents re-renders when object reference changes but values are the same
 */
export function useShallowMemo<T extends object>(obj: T): T {
  const ref = useRef<T>(obj)

  const isEqual = useMemo(() => {
    const prevKeys = Object.keys(ref.current)
    const nextKeys = Object.keys(obj)

    if (prevKeys.length !== nextKeys.length) return false

    return prevKeys.every(
      (key) => (ref.current as any)[key] === (obj as any)[key]
    )
  }, [obj])

  if (!isEqual) {
    ref.current = obj
  }

  return ref.current
}

// ==========================================
// LOCAL STORAGE HOOK WITH SYNC
// ==========================================

/**
 * Hook for synced localStorage access with SSR support
 */
export function useLocalStorage<T>(
  key: string,
  initialValue: T
): [T, (value: T | ((prev: T) => T)) => void] {
  const [storedValue, setStoredValue] = useState<T>(() => {
    if (typeof window === 'undefined') return initialValue

    try {
      const item = window.localStorage.getItem(key)
      return item ? JSON.parse(item) : initialValue
    } catch (error) {
      console.warn(`Error reading localStorage key "${key}":`, error)
      return initialValue
    }
  })

  const setValue = useCallback(
    (value: T | ((prev: T) => T)) => {
      try {
        const valueToStore = value instanceof Function ? value(storedValue) : value
        setStoredValue(valueToStore)

        if (typeof window !== 'undefined') {
          window.localStorage.setItem(key, JSON.stringify(valueToStore))
        }
      } catch (error) {
        console.warn(`Error setting localStorage key "${key}":`, error)
      }
    },
    [key, storedValue]
  )

  return [storedValue, setValue]
}
