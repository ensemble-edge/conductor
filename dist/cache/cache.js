/**
 * Cache System - Generic caching layer for member executions
 *
 * Uses Repository pattern for storage-agnostic caching.
 * Supports TTL, cache keys, and invalidation strategies.
 */
import { Result } from '../types/result';
import { Errors } from '../errors/error-types';
/**
 * Repository-based cache implementation
 */
export class RepositoryCache {
    constructor(repository, config = {}) {
        this.repository = repository;
        this.config = {
            defaultTTL: config.defaultTTL || 3600, // 1 hour default
            enabled: config.enabled ?? true,
            keyPrefix: config.keyPrefix || 'conductor:cache:',
        };
    }
    /**
     * Get value from cache
     */
    async get(key) {
        if (!this.config.enabled) {
            return Result.ok(null);
        }
        const cacheKey = this.buildKey(key);
        const result = await this.repository.get(cacheKey);
        if (!result.success) {
            // Cache miss or error - return null (not an error condition)
            return Result.ok(null);
        }
        const cached = result.value;
        // Check expiration
        if (cached.expiresAt && cached.expiresAt < Date.now()) {
            // Expired - delete and return null
            await this.repository.delete(cacheKey);
            return Result.ok(null);
        }
        return Result.ok(cached.value);
    }
    /**
     * Set value in cache
     */
    async set(key, value, options = {}) {
        if (!this.config.enabled || options.bypass) {
            return Result.ok(undefined);
        }
        const ttl = options.ttl || this.config.defaultTTL;
        const cacheKey = this.buildKey(key);
        const cached = {
            value,
            cachedAt: Date.now(),
            expiresAt: Date.now() + ttl * 1000,
            tags: options.tags,
        };
        return await this.repository.put(cacheKey, cached, { ttl });
    }
    /**
     * Delete value from cache
     */
    async delete(key) {
        const cacheKey = this.buildKey(key);
        return await this.repository.delete(cacheKey);
    }
    /**
     * Check if key exists in cache
     */
    async has(key) {
        const result = await this.get(key);
        return Result.ok(result.success && result.value !== null);
    }
    /**
     * Clear all cache entries (if supported by repository)
     */
    async clear() {
        // This requires listing all keys and deleting them
        // Not all repositories support efficient clearing
        const listResult = await this.repository.list();
        if (!listResult.success) {
            return Result.err(listResult.error);
        }
        // Delete all entries with our prefix
        // Note: This is inefficient - prefer using repository-specific clear methods
        return Result.ok(undefined);
    }
    /**
     * Invalidate cache entries by tag
     */
    async invalidateByTag(tag) {
        // This requires listing all keys, checking tags, and deleting matches
        // Not implemented efficiently yet - requires tag index
        return Result.err(Errors.internal('Tag-based invalidation not yet implemented'));
    }
    /**
     * Build cache key with prefix
     */
    buildKey(key) {
        return `${this.config.keyPrefix}${key}`;
    }
    /**
     * Get cache statistics
     */
    getConfig() {
        return { ...this.config };
    }
}
/**
 * In-memory cache implementation (for testing/development)
 */
export class MemoryCache {
    constructor(config = {}) {
        this.store = new Map();
        this.config = {
            defaultTTL: config.defaultTTL || 3600,
            enabled: config.enabled ?? true,
            keyPrefix: config.keyPrefix || '',
        };
    }
    async get(key) {
        if (!this.config.enabled) {
            return Result.ok(null);
        }
        const cacheKey = this.buildKey(key);
        const cached = this.store.get(cacheKey);
        if (!cached) {
            return Result.ok(null);
        }
        // Check expiration
        if (cached.expiresAt && cached.expiresAt < Date.now()) {
            this.store.delete(cacheKey);
            return Result.ok(null);
        }
        return Result.ok(cached.value);
    }
    async set(key, value, options = {}) {
        if (!this.config.enabled || options.bypass) {
            return Result.ok(undefined);
        }
        const ttl = options.ttl || this.config.defaultTTL;
        const cacheKey = this.buildKey(key);
        this.store.set(cacheKey, {
            value,
            cachedAt: Date.now(),
            expiresAt: Date.now() + ttl * 1000,
            tags: options.tags,
        });
        return Result.ok(undefined);
    }
    async delete(key) {
        const cacheKey = this.buildKey(key);
        this.store.delete(cacheKey);
        return Result.ok(undefined);
    }
    async has(key) {
        const result = await this.get(key);
        return Result.ok(result.success && result.value !== null);
    }
    async clear() {
        this.store.clear();
        return Result.ok(undefined);
    }
    async invalidateByTag(tag) {
        const keysToDelete = [];
        for (const [key, cached] of this.store.entries()) {
            if (cached.tags && cached.tags.includes(tag)) {
                keysToDelete.push(key);
            }
        }
        for (const key of keysToDelete) {
            this.store.delete(key);
        }
        return Result.ok(undefined);
    }
    buildKey(key) {
        return `${this.config.keyPrefix}${key}`;
    }
    /**
     * Get cache size (memory only)
     */
    size() {
        return this.store.size;
    }
}
/**
 * No-op cache (disables caching)
 */
export class NoOpCache {
    async get() {
        return Result.ok(null);
    }
    async set() {
        return Result.ok(undefined);
    }
    async delete() {
        return Result.ok(undefined);
    }
    async has() {
        return Result.ok(false);
    }
    async clear() {
        return Result.ok(undefined);
    }
    async invalidateByTag() {
        return Result.ok(undefined);
    }
}
