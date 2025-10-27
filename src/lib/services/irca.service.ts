// ==========================================
// IRCA MEMBERSHIP SERVICE (PRODUCTION)
// ==========================================
// Real IRCA API integration service with secure handling
// Features: API key management, retry logic, error handling, caching

import type {
  IRCACheckRequest,
  IRCAResponse,
  IRCAMembershipData,
  IRCAStatus,
  IRCALevel,
} from '@/lib/validation/profile.schemas'
import {
  IRCACheckRequestSchema,
  IRCAResponseSchema,
} from '@/lib/validation/profile.schemas'

// ==========================================
// CONFIGURATION
// ==========================================

interface IRCAConfig {
  apiUrl: string
  apiKey: string
  timeout: number
  retryAttempts: number
  retryDelay: number
  cacheEnabled: boolean
  cacheDuration: number
}

// ==========================================
// CACHE MANAGEMENT
// ==========================================

interface CacheEntry {
  data: IRCAMembershipData
  timestamp: number
}

const membershipCache = new Map<string, CacheEntry>()

// ==========================================
// SERVICE CLASS
// ==========================================

/**
 * IRCA Membership Service
 * Provides real integration with IRCA membership system
 * 
 * @example
 * ```typescript
 * const service = new IRCAMembershipService()
 * const result = await service.checkMembership('IRCA-2024-001')
 * ```
 */
export class IRCAMembershipService {
  private readonly config: IRCAConfig

  constructor() {
    // Load configuration from environment variables
    this.config = {
      apiUrl: process.env.NEXT_PUBLIC_IRCA_API_URL || '',
      apiKey: process.env.IRCA_API_KEY || '',
      timeout: parseInt(process.env.IRCA_API_TIMEOUT || '10000', 10),
      retryAttempts: parseInt(process.env.IRCA_RETRY_ATTEMPTS || '3', 10),
      retryDelay: parseInt(process.env.IRCA_RETRY_DELAY || '1000', 10),
      cacheEnabled: process.env.IRCA_CACHE_ENABLED !== 'false',
      cacheDuration: parseInt(process.env.IRCA_CACHE_DURATION || '300000', 10), // 5 minutes default
    }

    // Validate configuration
    this.validateConfig()
  }

  /**
   * Validate IRCA API configuration
   * @private
   */
  private validateConfig(): void {
    if (!this.config.apiUrl) {
      console.warn('[IRCA] API URL not configured. Set NEXT_PUBLIC_IRCA_API_URL environment variable.')
    }
    if (!this.config.apiKey) {
      console.warn('[IRCA] API Key not configured. Set IRCA_API_KEY environment variable.')
    }
  }

  /**
   * Check if service is properly configured
   * @returns {boolean} True if configured
   */
  isConfigured(): boolean {
    return Boolean(this.config.apiUrl && this.config.apiKey)
  }

  /**
   * Check IRCA membership status
   * 
   * @param {string} membershipId - IRCA membership ID
   * @param {boolean} forceRefresh - Bypass cache and force API call
   * @returns {Promise<IRCAResponse>} Membership data or error
   * 
   * @example
   * ```typescript
   * const result = await service.checkMembership('IRCA-2024-001')
   * if (result.success && result.data) {
   *   console.log(`Status: ${result.data.status}`)
   * }
   * ```
   */
  async checkMembership(membershipId: string, forceRefresh = false): Promise<IRCAResponse> {
    try {
      // Validate input
      const validation = IRCACheckRequestSchema.safeParse({ membershipId })
      if (!validation.success) {
        return {
          success: false,
          data: null,
          error: 'VALIDATION_ERROR',
          message: validation.error.issues[0]?.message || 'Invalid membership ID format',
        }
      }

      // Check if service is configured
      if (!this.isConfigured()) {
        return {
          success: false,
          data: null,
          error: 'CONFIGURATION_ERROR',
          message: 'IRCA service is not properly configured. Please contact support.',
        }
      }

      // Check cache if enabled
      if (this.config.cacheEnabled && !forceRefresh) {
        const cachedData = this.getCachedMembership(membershipId)
        if (cachedData) {
          console.log(`[IRCA] Cache hit for membership: ${membershipId}`)
          return {
            success: true,
            data: cachedData,
            message: 'Membership verified successfully (cached)',
          }
        }
      }

      // Call real IRCA API with retry logic
      const membershipData = await this.callIRCAAPIWithRetry(membershipId)

      // Cache the result
      if (this.config.cacheEnabled && membershipData) {
        this.cacheMembership(membershipId, membershipData)
      }

      // Return success response
      return {
        success: true,
        data: membershipData,
        message: 'Membership verified successfully',
      }
    } catch (error) {
      console.error('[IRCA Service] Error checking membership:', error)
      
      // Return appropriate error response
      if (error instanceof Error) {
        if (error.message.includes('NOT_FOUND')) {
          return {
            success: false,
            data: null,
            error: 'NOT_FOUND',
            message: 'Membership ID not found in IRCA system',
          }
        }
        if (error.message.includes('timeout') || error.message.includes('TIMEOUT')) {
          return {
            success: false,
            data: null,
            error: 'TIMEOUT',
            message: 'IRCA service is temporarily unavailable. Please try again later.',
          }
        }
        if (error.message.includes('UNAUTHORIZED')) {
          return {
            success: false,
            data: null,
            error: 'UNAUTHORIZED',
            message: 'Authentication failed with IRCA service. Please contact support.',
          }
        }
      }

      return {
        success: false,
        data: null,
        error: 'SERVICE_ERROR',
        message: 'Failed to verify membership. Please try again later.',
      }
    }
  }

  /**
   * Verify multiple memberships at once
   * 
   * @param {string[]} membershipIds - Array of membership IDs
   * @returns {Promise<Array>} Array of results
   */
  async checkMultipleMemberships(
    membershipIds: string[]
  ): Promise<Array<{ membershipId: string; result: IRCAResponse }>> {
    const results = await Promise.all(
      membershipIds.map(async (id) => {
        const result = await this.checkMembership(id)
        return { membershipId: id, result }
      })
    )

    return results
  }

  /**
   * Clear cached membership data
   * 
   * @param {string} membershipId - Optional specific ID to clear
   */
  clearCache(membershipId?: string): void {
    if (membershipId) {
      membershipCache.delete(membershipId)
      console.log(`[IRCA] Cleared cache for membership: ${membershipId}`)
    } else {
      membershipCache.clear()
      console.log('[IRCA] Cleared all membership cache')
    }
  }

  // ==========================================
  // PUBLIC METHODS - UTILITY
  // ==========================================

  /**
   * Get membership status badge information
   * Returns color and label for UI display
   * 
   * @param {IRCAStatus} status - Membership status
   * @returns {Object} Badge color and label
   */
  getStatusBadge(status: IRCAStatus): { color: string; label: string } {
    const badges: Record<IRCAStatus, { color: string; label: string }> = {
      active: { color: 'green', label: 'Active' },
      expired: { color: 'red', label: 'Expired' },
      pending: { color: 'yellow', label: 'Pending' },
      suspended: { color: 'orange', label: 'Suspended' },
      cancelled: { color: 'gray', label: 'Cancelled' },
    }
    return badges[status] || { color: 'gray', label: 'Unknown' }
  }

  /**
   * Get membership level details
   * Returns benefits and pricing information
   * 
   * @param {IRCALevel} level - Membership level
   * @returns {Object} Level details
   */
  getLevelDetails(level: IRCALevel): {
    name: string
    annualFee: number
    description: string
  } {
    const levels: Record<
      IRCALevel,
      { name: string; annualFee: number; description: string }
    > = {
      Basic: {
        name: 'Basic',
        annualFee: 100,
        description: 'Entry-level membership with basic benefits',
      },
      Standard: {
        name: 'Standard',
        annualFee: 250,
        description: 'Standard membership with enhanced benefits',
      },
      Premium: {
        name: 'Premium',
        annualFee: 500,
        description: 'Premium membership with exclusive benefits',
      },
      Corporate: {
        name: 'Corporate',
        annualFee: 1000,
        description: 'Corporate membership for businesses',
      },
      Lifetime: {
        name: 'Lifetime',
        annualFee: 0,
        description: 'Lifetime membership with all benefits',
      },
    }
    return levels[level] || levels.Basic
  }

  /**
   * Check if membership is currently valid
   * 
   * @param {IRCAMembershipData} membership - Membership data
   * @returns {boolean} True if membership is valid
   */
  isMembershipValid(membership: IRCAMembershipData): boolean {
    if (membership.status !== 'active') {
      return false
    }

    if (membership.expiresAt) {
      const expiryDate = new Date(membership.expiresAt)
      return expiryDate > new Date()
    }

    return true
  }

  /**
   * Get days until membership expiration
   * 
   * @param {IRCAMembershipData} membership - Membership data
   * @returns {number | null} Days until expiration, or null if no expiry
   */
  getDaysUntilExpiry(membership: IRCAMembershipData): number | null {
    if (!membership.expiresAt) {
      return null
    }

    const expiryDate = new Date(membership.expiresAt)
    const today = new Date()
    const diffTime = expiryDate.getTime() - today.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

    return diffDays
  }

  // ==========================================
  // PRIVATE METHODS - CACHE MANAGEMENT
  // ==========================================

  /**
   * Get cached membership data if still valid
   * @private
   */
  private getCachedMembership(membershipId: string): IRCAMembershipData | null {
    const cached = membershipCache.get(membershipId)
    
    if (!cached) {
      return null
    }

    // Check if cache is still valid
    const age = Date.now() - cached.timestamp
    if (age > this.config.cacheDuration) {
      membershipCache.delete(membershipId)
      return null
    }

    return cached.data
  }

  /**
   * Cache membership data
   * @private
   */
  private cacheMembership(membershipId: string, data: IRCAMembershipData): void {
    membershipCache.set(membershipId, {
      data,
      timestamp: Date.now(),
    })
  }

  // ==========================================
  // PRIVATE METHODS - API CALLS
  // ==========================================

  /**
   * Call IRCA API with retry logic
   * @private
   */
  private async callIRCAAPIWithRetry(membershipId: string): Promise<IRCAMembershipData> {
    let lastError: Error | null = null

    for (let attempt = 1; attempt <= this.config.retryAttempts; attempt++) {
      try {
        console.log(`[IRCA] API call attempt ${attempt}/${this.config.retryAttempts} for ${membershipId}`)
        return await this.callIRCAAPI(membershipId)
      } catch (error) {
        lastError = error as Error
        console.warn(`[IRCA] Attempt ${attempt} failed:`, error)

        // Don't retry on validation errors or not found
        if (lastError.message.includes('NOT_FOUND') || lastError.message.includes('VALIDATION_ERROR')) {
          throw lastError
        }

        // Wait before retrying (exponential backoff)
        if (attempt < this.config.retryAttempts) {
          const delay = this.config.retryDelay * Math.pow(2, attempt - 1)
          console.log(`[IRCA] Waiting ${delay}ms before retry...`)
          await new Promise(resolve => setTimeout(resolve, delay))
        }
      }
    }

    throw lastError || new Error('API call failed after all retries')
  }

  /**
   * Call real IRCA API
   * @private
   */
  private async callIRCAAPI(membershipId: string): Promise<IRCAMembershipData> {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), this.config.timeout)

    try {
      const url = `${this.config.apiUrl}/api/v1/membership/${encodeURIComponent(membershipId)}`
      
      console.log(`[IRCA] Calling API: ${url}`)

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.config.apiKey}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'User-Agent': 'Hotel-Booking-System/1.0',
        },
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      // Handle HTTP errors
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('NOT_FOUND: Membership ID not found')
        }
        if (response.status === 401 || response.status === 403) {
          throw new Error('UNAUTHORIZED: Invalid API credentials')
        }
        if (response.status === 429) {
          throw new Error('RATE_LIMIT: Too many requests')
        }
        if (response.status >= 500) {
          throw new Error(`SERVICE_ERROR: IRCA server error (${response.status})`)
        }
        throw new Error(`HTTP_ERROR: ${response.status} ${response.statusText}`)
      }

      // Parse response
      const data = await response.json()

      // Validate response structure
      const validation = IRCAResponseSchema.safeParse(data)
      if (!validation.success) {
        console.error('[IRCA] Invalid API response:', validation.error)
        throw new Error('VALIDATION_ERROR: Invalid API response format')
      }

      if (!validation.data.success || !validation.data.data) {
        throw new Error(validation.data.error || 'NOT_FOUND: Membership not found')
      }

      // Update last verified timestamp
      const membershipData: IRCAMembershipData = {
        ...validation.data.data,
        lastVerified: new Date().toISOString(),
      }

      console.log(`[IRCA] Successfully retrieved membership: ${membershipId}`)
      return membershipData

    } catch (error) {
      clearTimeout(timeoutId)

      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          throw new Error(`TIMEOUT: API request timed out after ${this.config.timeout}ms`)
        }
        throw error
      }

      throw new Error('UNKNOWN_ERROR: Failed to call IRCA API')
    }
  }
}

// ==========================================
// SINGLETON INSTANCE
// ==========================================

/**
 * Singleton instance of IRCA Membership Service
 * Use this throughout the application
 * 
 * @example
 * ```typescript
 * import { ircaService } from '@/lib/services/irca.service'
 * const result = await ircaService.checkMembership('IRCA-2024-001')
 * ```
 */
export const ircaService = new IRCAMembershipService()

// ==========================================
// UTILITY FUNCTIONS
// ==========================================

/**
 * Format membership expiry date
 * 
 * @param {string | null} expiresAt - ISO date string
 * @returns {string} Formatted date or 'Never'
 */
export function formatExpiryDate(expiresAt: string | null): string {
  if (!expiresAt) {
    return 'Never'
  }

  const date = new Date(expiresAt)
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

/**
 * Format currency amount
 * 
 * @param {number} amount - Amount in dollars
 * @returns {string} Formatted currency string
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount)
}
