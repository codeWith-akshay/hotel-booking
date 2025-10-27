// ==========================================
// RATE LIMITER - Token Bucket Implementation
// ==========================================
// Production-ready rate limiting for API endpoints and OTP flows
//
// Features:
// - Token bucket algorithm (smooth rate limiting)
// - In-memory store (development)
// - Redis adapter (production-ready)
// - Per-user, per-IP, and custom key support
// - Configurable limits and windows
// - Automatic cleanup of expired entries
//
// Usage:
// - Call `checkRateLimit(key, config)` before allowing action
// - Returns { allowed, remaining, resetAt }
// - Supports multiple rate limiters with different configs
//
// Production: Use Redis for distributed systems
//
// @see https://en.wikipedia.org/wiki/Token_bucket

// ==========================================
// TYPE DEFINITIONS
// ==========================================

/**
 * Rate limit configuration
 */
export interface RateLimitConfig {
  /** Maximum number of requests allowed */
  maxRequests: number
  /** Time window in seconds */
  windowSeconds: number
  /** Custom identifier (optional) */
  keyPrefix?: string
}

/**
 * Rate limit result
 */
export interface RateLimitResult {
  /** Whether request is allowed */
  allowed: boolean
  /** Remaining requests in current window */
  remaining: number
  /** Timestamp when limit resets (milliseconds) */
  resetAt: number
  /** Current request count */
  current: number
}

/**
 * Token bucket entry
 */
interface TokenBucket {
  tokens: number
  lastRefill: number
  resetAt: number
}

/**
 * Abstract rate limiter store interface
 * Allows pluggable backends (in-memory, Redis, etc.)
 */
export interface RateLimiterStore {
  get(key: string): Promise<TokenBucket | null>
  set(key: string, value: TokenBucket, ttlSeconds: number): Promise<void>
  delete(key: string): Promise<void>
  cleanup?(): Promise<void>
}

// ==========================================
// IN-MEMORY STORE (Development)
// ==========================================

/**
 * In-memory token bucket store
 * Use for development/testing only
 * NOT suitable for production with multiple instances
 */
class InMemoryStore implements RateLimiterStore {
  private store: Map<string, TokenBucket> = new Map()
  private cleanupInterval: NodeJS.Timeout | null = null

  constructor() {
    // Cleanup expired entries every 60 seconds
    this.cleanupInterval = setInterval(() => {
      this.cleanup()
    }, 60_000)
  }

  async get(key: string): Promise<TokenBucket | null> {
    const entry = this.store.get(key)
    
    if (!entry) {
      return null
    }

    // Check if expired
    if (entry.resetAt < Date.now()) {
      this.store.delete(key)
      return null
    }

    return entry
  }

  async set(key: string, value: TokenBucket, ttlSeconds: number): Promise<void> {
    this.store.set(key, value)
  }

  async delete(key: string): Promise<void> {
    this.store.delete(key)
  }

  async cleanup(): Promise<void> {
    const now = Date.now()
    let cleaned = 0

    for (const [key, bucket] of this.store.entries()) {
      if (bucket.resetAt < now) {
        this.store.delete(key)
        cleaned++
      }
    }

    if (cleaned > 0) {
      console.log(`🧹 Rate limiter cleanup: removed ${cleaned} expired entries`)
    }
  }

  destroy() {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval)
    }
    this.store.clear()
  }
}

// ==========================================
// REDIS STORE (Production)
// ==========================================

/**
 * Redis-backed token bucket store
 * Suitable for production with horizontal scaling
 * 
 * Install: pnpm add ioredis
 * Usage:
 *   import Redis from 'ioredis'
 *   const redis = new Redis(process.env.REDIS_URL)
 *   const store = new RedisStore(redis)
 */
export class RedisStore implements RateLimiterStore {
  constructor(private redis: any) {} // Use 'any' to avoid requiring ioredis as dependency

  async get(key: string): Promise<TokenBucket | null> {
    try {
      const data = await this.redis.get(key)
      return data ? JSON.parse(data) : null
    } catch (error) {
      console.error('Redis get error:', error)
      return null
    }
  }

  async set(key: string, value: TokenBucket, ttlSeconds: number): Promise<void> {
    try {
      await this.redis.setex(key, ttlSeconds, JSON.stringify(value))
    } catch (error) {
      console.error('Redis set error:', error)
    }
  }

  async delete(key: string): Promise<void> {
    try {
      await this.redis.del(key)
    } catch (error) {
      console.error('Redis delete error:', error)
    }
  }

  async cleanup(): Promise<void> {
    // Redis handles TTL-based expiration automatically
  }
}

// ==========================================
// RATE LIMITER CLASS
// ==========================================

export class RateLimiter {
  private store: RateLimiterStore

  constructor(store?: RateLimiterStore) {
    this.store = store || new InMemoryStore()
  }

  /**
   * Check if request is allowed under rate limit
   * Uses token bucket algorithm
   * 
   * @param {string} key - Unique identifier (user ID, IP, etc.)
   * @param {RateLimitConfig} config - Rate limit configuration
   * @returns {Promise<RateLimitResult>} Rate limit result
   * 
   * @example
   * ```typescript
   * const limiter = new RateLimiter()
   * const result = await limiter.checkLimit('user_123', {
   *   maxRequests: 10,
   *   windowSeconds: 60,
   *   keyPrefix: 'otp_request'
   * })
   * 
   * if (!result.allowed) {
   *   throw new Error(`Rate limit exceeded. Try again in ${result.resetAt - Date.now()}ms`)
   * }
   * ```
   */
  async checkLimit(key: string, config: RateLimitConfig): Promise<RateLimitResult> {
    const fullKey = config.keyPrefix ? `${config.keyPrefix}:${key}` : key
    const now = Date.now()
    const windowMs = config.windowSeconds * 1000

    // Get existing bucket
    let bucket = await this.store.get(fullKey)

    if (!bucket) {
      // Create new bucket
      bucket = {
        tokens: config.maxRequests - 1, // Consume one token for current request
        lastRefill: now,
        resetAt: now + windowMs,
      }

      await this.store.set(fullKey, bucket, config.windowSeconds)

      return {
        allowed: true,
        remaining: bucket.tokens,
        resetAt: bucket.resetAt,
        current: 1,
      }
    }

    // Refill tokens based on time passed
    const timePassedMs = now - bucket.lastRefill
    const refillRate = config.maxRequests / windowMs
    const tokensToAdd = Math.floor(timePassedMs * refillRate)

    if (tokensToAdd > 0) {
      bucket.tokens = Math.min(config.maxRequests, bucket.tokens + tokensToAdd)
      bucket.lastRefill = now
    }

    // Check if window has expired
    if (now >= bucket.resetAt) {
      bucket.tokens = config.maxRequests
      bucket.lastRefill = now
      bucket.resetAt = now + windowMs
    }

    // Check if request is allowed
    const allowed = bucket.tokens > 0
    const current = config.maxRequests - bucket.tokens + (allowed ? 1 : 0)

    if (allowed) {
      bucket.tokens -= 1
    }

    // Update bucket
    await this.store.set(fullKey, bucket, config.windowSeconds)

    return {
      allowed,
      remaining: Math.max(0, bucket.tokens),
      resetAt: bucket.resetAt,
      current,
    }
  }

  /**
   * Reset rate limit for a key
   * 
   * @param {string} key - Unique identifier
   * @param {string} keyPrefix - Optional key prefix
   */
  async resetLimit(key: string, keyPrefix?: string): Promise<void> {
    const fullKey = keyPrefix ? `${keyPrefix}:${key}` : key
    await this.store.delete(fullKey)
  }

  /**
   * Get current limit status without consuming a token
   * 
   * @param {string} key - Unique identifier
   * @param {RateLimitConfig} config - Rate limit configuration
   * @returns {Promise<RateLimitResult>} Current limit status
   */
  async getStatus(key: string, config: RateLimitConfig): Promise<RateLimitResult> {
    const fullKey = config.keyPrefix ? `${config.keyPrefix}:${key}` : key
    const bucket = await this.store.get(fullKey)

    if (!bucket) {
      return {
        allowed: true,
        remaining: config.maxRequests,
        resetAt: Date.now() + config.windowSeconds * 1000,
        current: 0,
      }
    }

    return {
      allowed: bucket.tokens > 0,
      remaining: bucket.tokens,
      resetAt: bucket.resetAt,
      current: config.maxRequests - bucket.tokens,
    }
  }
}

// ==========================================
// SINGLETON INSTANCES
// ==========================================

let defaultRateLimiter: RateLimiter | null = null

/**
 * Get or create default rate limiter instance
 * Uses in-memory store by default
 * 
 * @returns {RateLimiter} Default rate limiter
 */
export function getRateLimiter(): RateLimiter {
  if (!defaultRateLimiter) {
    defaultRateLimiter = new RateLimiter()
  }
  return defaultRateLimiter
}

/**
 * Initialize rate limiter with custom store
 * Call this once at app startup for production
 * 
 * @param {RateLimiterStore} store - Custom store implementation
 * 
 * @example
 * ```typescript
 * // In app startup (e.g., instrumentation.ts)
 * import Redis from 'ioredis'
 * import { initRateLimiter, RedisStore } from '@/lib/rateLimiter'
 * 
 * const redis = new Redis(process.env.REDIS_URL)
 * initRateLimiter(new RedisStore(redis))
 * ```
 */
export function initRateLimiter(store: RateLimiterStore): void {
  defaultRateLimiter = new RateLimiter(store)
}

// ==========================================
// PRESET CONFIGURATIONS
// ==========================================

/**
 * Preset rate limit configurations for common use cases
 */
export const RATE_LIMIT_PRESETS = {
  /** OTP Request: 3 requests per 5 minutes per phone */
  OTP_REQUEST_PHONE: {
    maxRequests: 3,
    windowSeconds: 300, // 5 minutes
    keyPrefix: 'otp_req_phone',
  },

  /** OTP Request: 10 requests per 15 minutes per IP */
  OTP_REQUEST_IP: {
    maxRequests: 10,
    windowSeconds: 900, // 15 minutes
    keyPrefix: 'otp_req_ip',
  },

  /** OTP Verify: 5 attempts per 10 minutes per phone */
  OTP_VERIFY_PHONE: {
    maxRequests: 5,
    windowSeconds: 600, // 10 minutes
    keyPrefix: 'otp_verify_phone',
  },

  /** OTP Verify: 15 attempts per 10 minutes per IP */
  OTP_VERIFY_IP: {
    maxRequests: 15,
    windowSeconds: 600, // 10 minutes
    keyPrefix: 'otp_verify_ip',
  },

  /** API General: 100 requests per minute */
  API_GENERAL: {
    maxRequests: 100,
    windowSeconds: 60,
    keyPrefix: 'api_general',
  },

  /** API Strict: 10 requests per minute (for sensitive operations) */
  API_STRICT: {
    maxRequests: 10,
    windowSeconds: 60,
    keyPrefix: 'api_strict',
  },

  /** Login Attempts: 5 attempts per 15 minutes */
  LOGIN_ATTEMPTS: {
    maxRequests: 5,
    windowSeconds: 900, // 15 minutes
    keyPrefix: 'login_attempts',
  },
} as const

// ==========================================
// HELPER FUNCTIONS
// ==========================================

/**
 * Get client IP from request
 * Handles various proxy headers
 * 
 * @param {Request} request - HTTP request
 * @returns {string} Client IP address
 */
export function getClientIP(request: Request): string {
  // Check common proxy headers
  const forwardedFor = request.headers.get('x-forwarded-for')
  const realIp = request.headers.get('x-real-ip')
  const cfConnectingIp = request.headers.get('cf-connecting-ip') // Cloudflare

  if (forwardedFor) {
    // X-Forwarded-For can contain multiple IPs, take the first one
    return forwardedFor.split(',')[0].trim()
  }

  if (realIp) {
    return realIp
  }

  if (cfConnectingIp) {
    return cfConnectingIp
  }

  return 'unknown'
}

/**
 * Create rate limit error response
 * 
 * @param {RateLimitResult} result - Rate limit result
 * @returns {object} Error response object
 */
export function createRateLimitError(result: RateLimitResult) {
  const retryAfterSeconds = Math.ceil((result.resetAt - Date.now()) / 1000)

  return {
    success: false,
    error: 'Rate limit exceeded',
    code: 'RATE_LIMIT_EXCEEDED',
    message: `Too many requests. Please try again in ${retryAfterSeconds} seconds.`,
    retryAfter: retryAfterSeconds,
    resetAt: result.resetAt,
  }
}
