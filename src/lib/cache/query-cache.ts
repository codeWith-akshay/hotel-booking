/**
 * Query Cache Layer for Hotel Booking System
 * 
 * Implements in-memory caching with TTL for read-heavy endpoints.
 * Uses LRU eviction to prevent memory overflow.
 * 
 * Features:
 * - Time-based expiration (TTL)
 * - LRU (Least Recently Used) eviction
 * - Cache key generation
 * - Cache invalidation patterns
 * - Memory-safe with size limits
 * 
 * Use Cases:
 * - Room types (rarely change)
 * - Room availability (cache for 1-5 minutes)
 * - Booking rules (rarely change)
 * - Deposit policies (rarely change)
 * - Special days (daily updates)
 */

interface CacheEntry<T> {
  data: T
  timestamp: number
  expiresAt: number
  hits: number
}

interface CacheConfig {
  maxSize: number // Maximum number of entries
  defaultTTL: number // Default TTL in milliseconds
}

class QueryCache {
  private cache = new Map<string, CacheEntry<any>>()
  private config: CacheConfig

  constructor(config: Partial<CacheConfig> = {}) {
    this.config = {
      maxSize: config.maxSize || 1000,
      defaultTTL: config.defaultTTL || 5 * 60 * 1000, // 5 minutes default
    }
  }

  /**
   * Get cached data if available and not expired
   */
  get<T>(key: string): T | null {
    const entry = this.cache.get(key)
    
    if (!entry) {
      return null
    }

    // Check expiration
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key)
      return null
    }

    // Update hit count and timestamp
    entry.hits++
    entry.timestamp = Date.now()

    return entry.data as T
  }

  /**
   * Set cached data with optional custom TTL
   */
  set<T>(key: string, data: T, ttl?: number): void {
    // Enforce cache size limit using LRU eviction
    if (this.cache.size >= this.config.maxSize) {
      this.evictLRU()
    }

    const now = Date.now()
    const expiresAt = now + (ttl || this.config.defaultTTL)

    this.cache.set(key, {
      data,
      timestamp: now,
      expiresAt,
      hits: 0,
    })
  }

  /**
   * Check if key exists and is not expired
   */
  has(key: string): boolean {
    return this.get(key) !== null
  }

  /**
   * Delete specific cache entry
   */
  delete(key: string): boolean {
    return this.cache.delete(key)
  }

  /**
   * Delete all cache entries matching pattern
   * Useful for invalidation (e.g., invalidate all room type caches)
   */
  deletePattern(pattern: string | RegExp): number {
    const regex = typeof pattern === 'string' ? new RegExp(pattern) : pattern
    let deletedCount = 0

    for (const key of this.cache.keys()) {
      if (regex.test(key)) {
        this.cache.delete(key)
        deletedCount++
      }
    }

    return deletedCount
  }

  /**
   * Clear all cache entries
   */
  clear(): void {
    this.cache.clear()
  }

  /**
   * Get cache statistics
   */
  stats() {
    let totalHits = 0
    let expiredCount = 0
    const now = Date.now()

    for (const entry of this.cache.values()) {
      totalHits += entry.hits
      if (now > entry.expiresAt) {
        expiredCount++
      }
    }

    return {
      size: this.cache.size,
      maxSize: this.config.maxSize,
      totalHits,
      expiredCount,
      hitRate: totalHits > 0 ? totalHits / this.cache.size : 0,
    }
  }

  /**
   * Evict least recently used entry (LRU)
   */
  private evictLRU(): void {
    let oldestKey: string | null = null
    let oldestTimestamp = Infinity

    for (const [key, entry] of this.cache.entries()) {
      if (entry.timestamp < oldestTimestamp) {
        oldestTimestamp = entry.timestamp
        oldestKey = key
      }
    }

    if (oldestKey) {
      this.cache.delete(oldestKey)
    }
  }

  /**
   * Clean up expired entries (run periodically)
   */
  cleanup(): number {
    const now = Date.now()
    let cleanedCount = 0

    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiresAt) {
        this.cache.delete(key)
        cleanedCount++
      }
    }

    return cleanedCount
  }
}

// ==========================================
// SINGLETON INSTANCE
// ==========================================

export const queryCache = new QueryCache({
  maxSize: 1000,
  defaultTTL: 5 * 60 * 1000, // 5 minutes
})

// Periodic cleanup every 10 minutes
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    queryCache.cleanup()
  }, 10 * 60 * 1000)
}

// ==========================================
// CACHE KEY GENERATORS
// ==========================================

export const CacheKeys = {
  // Room Types
  roomTypes: () => 'room_types:all',
  roomType: (id: string) => `room_type:${id}`,

  // Room Availability
  roomAvailability: (roomTypeId: string, startDate: string, endDate: string) =>
    `availability:${roomTypeId}:${startDate}:${endDate}`,
  
  allRoomAvailability: (startDate: string, endDate: string) =>
    `availability:all:${startDate}:${endDate}`,

  // Booking Rules
  bookingRules: () => 'booking_rules:all',
  bookingRule: (guestType: string) => `booking_rule:${guestType}`,

  // Deposit Policies
  depositPolicies: () => 'deposit_policies:all',
  depositPolicy: (roomsBooked: number) => `deposit_policy:rooms_${roomsBooked}`,

  // Special Days
  specialDays: (startDate: string, endDate: string) =>
    `special_days:${startDate}:${endDate}`,
  
  specialDay: (date: string, roomTypeId?: string) =>
    `special_day:${date}${roomTypeId ? `:${roomTypeId}` : ''}`,

  // User data
  user: (id: string) => `user:${id}`,
  userBookings: (userId: string, status?: string) =>
    `user_bookings:${userId}${status ? `:${status}` : ''}`,

  // Reports (cache for shorter duration)
  occupancyReport: (startDate: string, endDate: string, roomTypeId?: string) =>
    `report:occupancy:${startDate}:${endDate}${roomTypeId ? `:${roomTypeId}` : ''}`,
  
  revenueReport: (startDate: string, endDate: string) =>
    `report:revenue:${startDate}:${endDate}`,
}

// ==========================================
// CACHE INVALIDATION HELPERS
// ==========================================

export const CacheInvalidation = {
  /**
   * Invalidate all room-related caches when inventory changes
   */
  onInventoryUpdate: (roomTypeId: string) => {
    queryCache.deletePattern(new RegExp(`^availability:${roomTypeId}:`))
    queryCache.deletePattern(/^availability:all:/)
  },

  /**
   * Invalidate booking-related caches when booking is created/updated
   */
  onBookingUpdate: (userId: string, roomTypeId: string) => {
    queryCache.deletePattern(new RegExp(`^user_bookings:${userId}`))
    queryCache.deletePattern(new RegExp(`^availability:${roomTypeId}:`))
    queryCache.deletePattern(/^availability:all:/)
    queryCache.deletePattern(/^report:/)
  },

  /**
   * Invalidate room type cache when room type is updated
   */
  onRoomTypeUpdate: (roomTypeId: string) => {
    queryCache.delete(CacheKeys.roomTypes())
    queryCache.delete(CacheKeys.roomType(roomTypeId))
    queryCache.deletePattern(new RegExp(`^availability:${roomTypeId}:`))
  },

  /**
   * Invalidate special days cache when special day is created/updated
   */
  onSpecialDayUpdate: () => {
    queryCache.deletePattern(/^special_day/)
    queryCache.deletePattern(/^availability:/)
  },

  /**
   * Invalidate deposit policy cache
   */
  onDepositPolicyUpdate: () => {
    queryCache.deletePattern(/^deposit_policy/)
  },

  /**
   * Invalidate booking rules cache
   */
  onBookingRuleUpdate: () => {
    queryCache.deletePattern(/^booking_rule/)
  },

  /**
   * Invalidate all report caches (called after major data changes)
   */
  onReportDataChange: () => {
    queryCache.deletePattern(/^report:/)
  },
}

// ==========================================
// CACHE TTL PRESETS
// ==========================================

export const CacheTTL = {
  VERY_SHORT: 1 * 60 * 1000, // 1 minute - for availability checks
  SHORT: 5 * 60 * 1000, // 5 minutes - for dynamic data
  MEDIUM: 15 * 60 * 1000, // 15 minutes - for semi-static data
  LONG: 60 * 60 * 1000, // 1 hour - for static config
  VERY_LONG: 24 * 60 * 60 * 1000, // 24 hours - for rarely changing data
}

// ==========================================
// CACHE WRAPPER HELPER
// ==========================================

/**
 * Wrapper function to cache query results
 * 
 * @example
 * ```ts
 * const roomTypes = await withCache(
 *   CacheKeys.roomTypes(),
 *   async () => await prisma.roomType.findMany(),
 *   CacheTTL.LONG
 * )
 * ```
 */
export async function withCache<T>(
  key: string,
  queryFn: () => Promise<T>,
  ttl?: number
): Promise<T> {
  // Check cache first
  const cached = queryCache.get<T>(key)
  if (cached !== null) {
    return cached
  }

  // Execute query
  const result = await queryFn()

  // Store in cache
  queryCache.set(key, result, ttl)

  return result
}
