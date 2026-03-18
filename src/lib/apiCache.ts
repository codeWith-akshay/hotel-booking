// ==========================================
// API UTILITIES WITH CACHING
// ==========================================
// PERF: API call caching and deduplication to reduce network requests

import { useCallback, useEffect, useRef, useState } from 'react'

// ==========================================
// SIMPLE IN-MEMORY CACHE
// ==========================================

interface CacheEntry<T> {
  data: T
  timestamp: number
  expiresAt: number
}

class APICache {
  private cache = new Map<string, CacheEntry<any>>()
  private pendingRequests = new Map<string, Promise<any>>()
  private defaultTTL = 5 * 60 * 1000 // 5 minutes

  /**
   * Get cached data if available and not expired
   */
  get<T>(key: string): T | null {
    const entry = this.cache.get(key)
    if (!entry) return null
    
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key)
      return null
    }
    
    return entry.data as T
  }

  /**
   * Set cached data with optional TTL
   */
  set<T>(key: string, data: T, ttl: number = this.defaultTTL): void {
    const now = Date.now()
    this.cache.set(key, {
      data,
      timestamp: now,
      expiresAt: now + ttl,
    })
  }

  /**
   * Invalidate a specific cache entry
   */
  invalidate(key: string): void {
    this.cache.delete(key)
  }

  /**
   * Invalidate entries matching a pattern
   */
  invalidatePattern(pattern: string | RegExp): void {
    const regex = typeof pattern === 'string' ? new RegExp(pattern) : pattern
    for (const key of this.cache.keys()) {
      if (regex.test(key)) {
        this.cache.delete(key)
      }
    }
  }

  /**
   * Clear all cache entries
   */
  clear(): void {
    this.cache.clear()
  }

  /**
   * Deduplicate concurrent requests to the same endpoint
   */
  async deduplicatedFetch<T>(
    key: string,
    fetchFn: () => Promise<T>,
    ttl?: number
  ): Promise<T> {
    // Check cache first
    const cached = this.get<T>(key)
    if (cached !== null) {
      return cached
    }

    // Check for pending request
    const pending = this.pendingRequests.get(key)
    if (pending) {
      return pending as Promise<T>
    }

    // Create new request
    const request = fetchFn()
      .then((data) => {
        this.set(key, data, ttl)
        this.pendingRequests.delete(key)
        return data
      })
      .catch((error) => {
        this.pendingRequests.delete(key)
        throw error
      })

    this.pendingRequests.set(key, request)
    return request
  }

  /**
   * Get cache statistics
   */
  getStats() {
    const now = Date.now()
    let validEntries = 0
    let expiredEntries = 0

    for (const entry of this.cache.values()) {
      if (now > entry.expiresAt) {
        expiredEntries++
      } else {
        validEntries++
      }
    }

    return {
      totalEntries: this.cache.size,
      validEntries,
      expiredEntries,
      pendingRequests: this.pendingRequests.size,
    }
  }
}

// Global cache instance
export const apiCache = new APICache()

// ==========================================
// USE FETCH WITH CACHE HOOK
// ==========================================

interface UseFetchOptions<T> {
  /** Cache key - defaults to URL if not provided */
  cacheKey?: string
  /** Cache TTL in milliseconds */
  ttl?: number
  /** Whether to skip initial fetch */
  skip?: boolean
  /** Dependencies that trigger refetch */
  deps?: any[]
  /** Transform response data */
  transform?: (data: any) => T
  /** Error retry count */
  retries?: number
  /** Retry delay in milliseconds */
  retryDelay?: number
}

interface UseFetchResult<T> {
  data: T | null
  error: Error | null
  isLoading: boolean
  isValidating: boolean
  mutate: (data?: T) => void
  refresh: () => Promise<void>
}

export function useFetchWithCache<T>(
  url: string | null,
  options: UseFetchOptions<T> = {}
): UseFetchResult<T> {
  const {
    cacheKey,
    ttl = 5 * 60 * 1000,
    skip = false,
    deps = [],
    transform,
    retries = 0,
    retryDelay = 1000,
  } = options

  const [data, setData] = useState<T | null>(() => {
    if (!url) return null
    const key = cacheKey || url
    return apiCache.get<T>(key)
  })
  const [error, setError] = useState<Error | null>(null)
  const [isLoading, setIsLoading] = useState(!data && !skip)
  const [isValidating, setIsValidating] = useState(false)

  const mountedRef = useRef(true)
  const retryCountRef = useRef(0)

  const fetchData = useCallback(async () => {
    if (!url || skip) return

    const key = cacheKey || url

    // Check cache first
    const cached = apiCache.get<T>(key)
    if (cached !== null && !isValidating) {
      setData(cached)
      setIsLoading(false)
      return
    }

    setIsValidating(true)
    if (!data) setIsLoading(true)

    try {
      const result = await apiCache.deduplicatedFetch(
        key,
        async () => {
          const response = await fetch(url)
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`)
          }
          const json = await response.json()
          return transform ? transform(json) : json
        },
        ttl
      )

      if (mountedRef.current) {
        setData(result)
        setError(null)
        retryCountRef.current = 0
      }
    } catch (err) {
      if (mountedRef.current) {
        const shouldRetry = retryCountRef.current < retries
        
        if (shouldRetry) {
          retryCountRef.current++
          setTimeout(fetchData, retryDelay * retryCountRef.current)
        } else {
          setError(err instanceof Error ? err : new Error('Unknown error'))
        }
      }
    } finally {
      if (mountedRef.current) {
        setIsLoading(false)
        setIsValidating(false)
      }
    }
  }, [url, cacheKey, skip, ttl, transform, retries, retryDelay, isValidating, data])

  useEffect(() => {
    mountedRef.current = true
    fetchData()

    return () => {
      mountedRef.current = false
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [url, skip, ...deps])

  const mutate = useCallback((newData?: T) => {
    if (newData !== undefined) {
      setData(newData)
      const key = cacheKey || url
      if (key) {
        apiCache.set(key, newData, ttl)
      }
    }
  }, [cacheKey, url, ttl])

  const refresh = useCallback(async () => {
    const key = cacheKey || url
    if (key) {
      apiCache.invalidate(key)
    }
    await fetchData()
  }, [cacheKey, url, fetchData])

  return {
    data,
    error,
    isLoading,
    isValidating,
    mutate,
    refresh,
  }
}

// ==========================================
// USE MUTATION HOOK
// ==========================================

interface UseMutationOptions<TData, TVariables> {
  onSuccess?: (data: TData, variables: TVariables) => void
  onError?: (error: Error, variables: TVariables) => void
  /** Cache keys to invalidate on success */
  invalidateKeys?: string[]
}

interface UseMutationResult<TData, TVariables> {
  mutate: (variables: TVariables) => Promise<TData>
  data: TData | null
  error: Error | null
  isLoading: boolean
  reset: () => void
}

export function useMutation<TData, TVariables>(
  mutationFn: (variables: TVariables) => Promise<TData>,
  options: UseMutationOptions<TData, TVariables> = {}
): UseMutationResult<TData, TVariables> {
  const { onSuccess, onError, invalidateKeys = [] } = options

  const [data, setData] = useState<TData | null>(null)
  const [error, setError] = useState<Error | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const mutate = useCallback(
    async (variables: TVariables): Promise<TData> => {
      setIsLoading(true)
      setError(null)

      try {
        const result = await mutationFn(variables)
        setData(result)
        
        // Invalidate related caches
        invalidateKeys.forEach((key) => {
          apiCache.invalidatePattern(key)
        })

        onSuccess?.(result, variables)
        return result
      } catch (err) {
        const errorObj = err instanceof Error ? err : new Error('Mutation failed')
        setError(errorObj)
        onError?.(errorObj, variables)
        throw errorObj
      } finally {
        setIsLoading(false)
      }
    },
    [mutationFn, onSuccess, onError, invalidateKeys]
  )

  const reset = useCallback(() => {
    setData(null)
    setError(null)
    setIsLoading(false)
  }, [])

  return {
    mutate,
    data,
    error,
    isLoading,
    reset,
  }
}

// ==========================================
// PREFETCH UTILITY
// ==========================================

/**
 * Prefetch data into cache before it's needed
 */
export async function prefetch<T>(
  url: string,
  options: {
    ttl?: number
    transform?: (data: any) => T
  } = {}
): Promise<void> {
  const { ttl, transform } = options

  try {
    await apiCache.deduplicatedFetch(
      url,
      async () => {
        const response = await fetch(url)
        if (!response.ok) throw new Error('Prefetch failed')
        const json = await response.json()
        return transform ? transform(json) : json
      },
      ttl
    )
  } catch (error) {
    // Silently fail for prefetch - it's just an optimization
    console.warn('Prefetch failed:', url)
  }
}

// ==========================================
// OPTIMISTIC UPDATE HELPER
// ==========================================

/**
 * Helper for optimistic updates with rollback
 */
export function createOptimisticUpdate<T>(
  cacheKey: string,
  transform: (current: T | null) => T
) {
  const previous = apiCache.get<T>(cacheKey)
  const optimistic = transform(previous)
  apiCache.set(cacheKey, optimistic)

  return {
    optimisticData: optimistic,
    rollback: () => {
      if (previous !== null) {
        apiCache.set(cacheKey, previous)
      } else {
        apiCache.invalidate(cacheKey)
      }
    },
    commit: (finalData: T) => {
      apiCache.set(cacheKey, finalData)
    },
  }
}

// ==========================================
// BATCH REQUEST UTILITY
// ==========================================

/**
 * Batch multiple requests into a single promise
 */
export async function batchFetch<T extends Record<string, any>>(
  requests: Record<keyof T, () => Promise<any>>
): Promise<T> {
  const keys = Object.keys(requests) as Array<keyof T>
  const promises = keys.map((key) => requests[key]())

  const results = await Promise.allSettled(promises)

  const data = {} as T
  results.forEach((result, index) => {
    const key = keys[index]
    if (result.status === 'fulfilled') {
      data[key] = result.value
    } else {
      console.error(`Failed to fetch ${String(key)}:`, result.reason)
      data[key] = null as any
    }
  })

  return data
}
