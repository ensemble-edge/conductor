/**
 * Query Result Caching Layer
 *
 * Provides TTL-based caching for SQL query results using Cloudflare KV.
 * Reduces database load and improves query performance for frequently accessed data.
 */
import type { QueryResult } from './hyperdrive-repository.js';
import { Result } from '../types/result.js';
import { type ConductorError } from '../errors/error-types.js';
/**
 * Cache configuration
 */
export interface QueryCacheConfig {
    /**
     * KV namespace for caching
     */
    kv: KVNamespace;
    /**
     * Default TTL in seconds (default: TTL.CACHE_SHORT = 5 minutes)
     */
    defaultTTL?: number;
    /**
     * Key prefix for cache entries
     */
    keyPrefix?: string;
    /**
     * Enable cache statistics tracking
     */
    enableStats?: boolean;
}
/**
 * Cache statistics
 */
export interface CacheStats {
    hits: number;
    misses: number;
    sets: number;
    deletes: number;
    errors: number;
    hitRate: number;
}
/**
 * Query Cache - TTL-based caching for query results
 */
export declare class QueryCache {
    private readonly kv;
    private readonly defaultTTL;
    private readonly keyPrefix;
    private readonly enableStats;
    private stats;
    constructor(config: QueryCacheConfig);
    /**
     * Get cached query result
     */
    get<T = unknown>(sql: string, params?: unknown[], database?: string): Promise<Result<QueryResult<T> | null, ConductorError>>;
    /**
     * Set cached query result
     */
    set<T = unknown>(sql: string, result: QueryResult<T>, params?: unknown[], database?: string, ttl?: number): Promise<Result<void, ConductorError>>;
    /**
     * Delete cached query result
     */
    delete(sql: string, params?: unknown[], database?: string): Promise<Result<void, ConductorError>>;
    /**
     * Clear all cached queries for a database
     */
    clearDatabase(database: string): Promise<Result<number, ConductorError>>;
    /**
     * Clear all cached queries
     */
    clearAll(): Promise<Result<number, ConductorError>>;
    /**
     * Get cache statistics
     */
    getStats(): CacheStats;
    /**
     * Reset cache statistics
     */
    resetStats(): void;
    /**
     * Generate cache key from query, params, and database
     */
    private generateKey;
    /**
     * Cryptographically secure SHA-256 hash function
     * Uses Web Crypto API for secure, collision-resistant hashing
     */
    private sha256Hash;
    /**
     * Check if caching is enabled for a query
     * Certain query types should not be cached (writes, transactions, etc.)
     */
    static shouldCache(sql: string): boolean;
    /**
     * Get recommended TTL based on query type
     */
    static getRecommendedTTL(sql: string): number;
}
//# sourceMappingURL=query-cache.d.ts.map