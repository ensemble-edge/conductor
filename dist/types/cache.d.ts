/**
 * Common Cache Configuration Types
 *
 * Shared cache configuration interfaces for all member types
 */
/**
 * Base cache configuration for all members
 */
export interface BaseCacheConfig {
    /** Enable caching */
    enabled: boolean;
    /** Cache TTL (seconds) */
    ttl?: number;
    /** Cache key generator function */
    keyGenerator?: string;
    /** Vary headers for cache key variation */
    vary?: string[];
    /** Enable stale-while-revalidate (seconds to serve stale while revalidating) */
    staleWhileRevalidate?: number;
    /** Enable cache warming on deploy */
    warming?: boolean;
    /** Alias for warming */
    prewarm?: boolean;
    /** Cache tags for smart invalidation */
    tags?: string[];
}
/**
 * Type guard to check if a config has cache support
 */
export declare function hasCacheConfig(config: any): config is {
    cache: BaseCacheConfig;
};
/**
 * Type guard to check if cache warming is enabled
 */
export declare function isCacheWarmingEnabled(config: any): boolean;
/**
 * Extract cache config from any member config
 */
export declare function getCacheConfig(config: any): BaseCacheConfig | null;
//# sourceMappingURL=cache.d.ts.map