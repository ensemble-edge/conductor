/**
 * Cache System - Generic caching layer for agent executions
 *
 * Uses Repository pattern for storage-agnostic caching.
 * Supports TTL, cache keys, and invalidation strategies.
 */
import type { Repository } from '../storage/index.js';
import { type AsyncResult } from '../types/result.js';
import { type ConductorError } from '../errors/error-types.js';
export interface CacheConfig {
    defaultTTL?: number;
    enabled?: boolean;
    keyPrefix?: string;
}
export interface CacheOptions {
    ttl?: number;
    tags?: string[];
    bypass?: boolean;
}
export interface CachedValue<T> {
    value: T;
    cachedAt: number;
    expiresAt: number | null;
    tags?: string[];
}
/**
 * Cache interface for agent execution results
 */
export interface Cache<T = any> {
    get(key: string): AsyncResult<T | null, ConductorError>;
    set(key: string, value: T, options?: CacheOptions): AsyncResult<void, ConductorError>;
    delete(key: string): AsyncResult<void, ConductorError>;
    has(key: string): AsyncResult<boolean, ConductorError>;
    clear(): AsyncResult<void, ConductorError>;
    invalidateByTag(tag: string): AsyncResult<void, ConductorError>;
}
/**
 * Repository-based cache implementation
 */
export declare class RepositoryCache<T = any> implements Cache<T> {
    private readonly repository;
    private readonly config;
    constructor(repository: Repository<CachedValue<T>, string>, config?: CacheConfig);
    /**
     * Get value from cache
     */
    get(key: string): AsyncResult<T | null, ConductorError>;
    /**
     * Set value in cache
     */
    set(key: string, value: T, options?: CacheOptions): AsyncResult<void, ConductorError>;
    /**
     * Delete value from cache
     */
    delete(key: string): AsyncResult<void, ConductorError>;
    /**
     * Check if key exists in cache
     */
    has(key: string): AsyncResult<boolean, ConductorError>;
    /**
     * Clear all cache entries (if supported by repository)
     */
    clear(): AsyncResult<void, ConductorError>;
    /**
     * Invalidate cache entries by tag
     */
    invalidateByTag(tag: string): AsyncResult<void, ConductorError>;
    /**
     * Build cache key with prefix
     */
    private buildKey;
    /**
     * Get cache statistics
     */
    getConfig(): CacheConfig;
}
/**
 * In-memory cache implementation (for testing/development)
 */
export declare class MemoryCache<T = any> implements Cache<T> {
    private readonly store;
    private readonly config;
    constructor(config?: CacheConfig);
    get(key: string): AsyncResult<T | null, ConductorError>;
    set(key: string, value: T, options?: CacheOptions): AsyncResult<void, ConductorError>;
    delete(key: string): AsyncResult<void, ConductorError>;
    has(key: string): AsyncResult<boolean, ConductorError>;
    clear(): AsyncResult<void, ConductorError>;
    invalidateByTag(tag: string): AsyncResult<void, ConductorError>;
    private buildKey;
    /**
     * Get cache size (memory only)
     */
    size(): number;
}
/**
 * No-op cache (disables caching)
 */
export declare class NoOpCache<T = any> implements Cache<T> {
    get(): AsyncResult<T | null, ConductorError>;
    set(): AsyncResult<void, ConductorError>;
    delete(): AsyncResult<void, ConductorError>;
    has(): AsyncResult<boolean, ConductorError>;
    clear(): AsyncResult<void, ConductorError>;
    invalidateByTag(): AsyncResult<void, ConductorError>;
}
//# sourceMappingURL=cache.d.ts.map