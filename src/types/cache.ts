/**
 * Common Cache Configuration Types
 *
 * Shared cache configuration interfaces for all agent types
 */

/**
 * Base cache configuration for all agents
 */
export interface BaseCacheConfig {
  /** Enable caching */
  enabled: boolean
  /** Cache TTL (seconds) */
  ttl?: number
  /** Cache key generator function */
  keyGenerator?: string
  /** Vary headers for cache key variation */
  vary?: string[]
  /** Enable stale-while-revalidate (seconds to serve stale while revalidating) */
  staleWhileRevalidate?: number
  /** Enable cache warming on deploy */
  warming?: boolean
  /** Alias for warming */
  prewarm?: boolean
  /** Cache tags for smart invalidation */
  tags?: string[]
}

/**
 * Type guard to check if a config has cache support
 */
export function hasCacheConfig(config: any): config is { cache: BaseCacheConfig } {
  return config && typeof config.cache === 'object' && typeof config.cache.enabled === 'boolean'
}

/**
 * Type guard to check if cache warming is enabled
 */
export function isCacheWarmingEnabled(config: any): boolean {
  if (!hasCacheConfig(config)) {
    return false
  }
  return config.cache.enabled && (config.cache.warming === true || config.cache.prewarm === true)
}

/**
 * Extract cache config from any agent config
 */
export function getCacheConfig(config: any): BaseCacheConfig | null {
  return hasCacheConfig(config) ? config.cache : null
}
