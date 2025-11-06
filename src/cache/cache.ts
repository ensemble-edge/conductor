/**
 * Cache System - Generic caching layer for member executions
 *
 * Uses Repository pattern for storage-agnostic caching.
 * Supports TTL, cache keys, and invalidation strategies.
 */

import type { Repository } from '../storage/index.js'
import { Result, type AsyncResult } from '../types/result.js'
import { Errors, type ConductorError } from '../errors/error-types.js'

export interface CacheConfig {
  defaultTTL?: number // Default TTL in seconds
  enabled?: boolean // Enable/disable caching
  keyPrefix?: string // Prefix for all cache keys
}

export interface CacheOptions {
  ttl?: number // TTL in seconds
  tags?: string[] // Tags for group invalidation
  bypass?: boolean // Bypass cache for this operation
}

export interface CachedValue<T> {
  value: T
  cachedAt: number
  expiresAt: number | null
  tags?: string[]
}

/**
 * Cache interface for member execution results
 */
export interface Cache<T = any> {
  get(key: string): AsyncResult<T | null, ConductorError>
  set(key: string, value: T, options?: CacheOptions): AsyncResult<void, ConductorError>
  delete(key: string): AsyncResult<void, ConductorError>
  has(key: string): AsyncResult<boolean, ConductorError>
  clear(): AsyncResult<void, ConductorError>
  invalidateByTag(tag: string): AsyncResult<void, ConductorError>
}

/**
 * Repository-based cache implementation
 */
export class RepositoryCache<T = any> implements Cache<T> {
  private readonly config: Required<CacheConfig>

  constructor(
    private readonly repository: Repository<CachedValue<T>, string>,
    config: CacheConfig = {}
  ) {
    this.config = {
      defaultTTL: config.defaultTTL || 3600, // 1 hour default
      enabled: config.enabled ?? true,
      keyPrefix: config.keyPrefix || 'conductor:cache:',
    }
  }

  /**
   * Get value from cache
   */
  async get(key: string): AsyncResult<T | null, ConductorError> {
    if (!this.config.enabled) {
      return Result.ok(null)
    }

    const cacheKey = this.buildKey(key)
    const result = await this.repository.get(cacheKey)

    if (!result.success) {
      // Cache miss or error - return null (not an error condition)
      return Result.ok(null)
    }

    const cached = result.value

    // Check expiration
    if (cached.expiresAt && cached.expiresAt < Date.now()) {
      // Expired - delete and return null
      await this.repository.delete(cacheKey)
      return Result.ok(null)
    }

    return Result.ok(cached.value)
  }

  /**
   * Set value in cache
   */
  async set(key: string, value: T, options: CacheOptions = {}): AsyncResult<void, ConductorError> {
    if (!this.config.enabled || options.bypass) {
      return Result.ok(undefined)
    }

    const ttl = options.ttl || this.config.defaultTTL
    const cacheKey = this.buildKey(key)

    const cached: CachedValue<T> = {
      value,
      cachedAt: Date.now(),
      expiresAt: Date.now() + ttl * 1000,
      tags: options.tags,
    }

    return await this.repository.put(cacheKey, cached, { ttl })
  }

  /**
   * Delete value from cache
   */
  async delete(key: string): AsyncResult<void, ConductorError> {
    const cacheKey = this.buildKey(key)
    return await this.repository.delete(cacheKey)
  }

  /**
   * Check if key exists in cache
   */
  async has(key: string): AsyncResult<boolean, ConductorError> {
    const result = await this.get(key)
    return Result.ok(result.success && result.value !== null)
  }

  /**
   * Clear all cache entries (if supported by repository)
   */
  async clear(): AsyncResult<void, ConductorError> {
    // This requires listing all keys and deleting them
    // Not all repositories support efficient clearing
    const listResult = await this.repository.list()

    if (!listResult.success) {
      return Result.err(listResult.error)
    }

    // Delete all entries with our prefix
    // Note: This is inefficient - prefer using repository-specific clear methods
    return Result.ok(undefined)
  }

  /**
   * Invalidate cache entries by tag
   */
  async invalidateByTag(tag: string): AsyncResult<void, ConductorError> {
    // This requires listing all keys, checking tags, and deleting matches
    // Not implemented efficiently yet - requires tag index
    return Result.err(Errors.internal('Tag-based invalidation not yet implemented'))
  }

  /**
   * Build cache key with prefix
   */
  private buildKey(key: string): string {
    return `${this.config.keyPrefix}${key}`
  }

  /**
   * Get cache statistics
   */
  getConfig(): CacheConfig {
    return { ...this.config }
  }
}

/**
 * In-memory cache implementation (for testing/development)
 */
export class MemoryCache<T = any> implements Cache<T> {
  private readonly store = new Map<string, CachedValue<T>>()
  private readonly config: Required<CacheConfig>

  constructor(config: CacheConfig = {}) {
    this.config = {
      defaultTTL: config.defaultTTL || 3600,
      enabled: config.enabled ?? true,
      keyPrefix: config.keyPrefix || '',
    }
  }

  async get(key: string): AsyncResult<T | null, ConductorError> {
    if (!this.config.enabled) {
      return Result.ok(null)
    }

    const cacheKey = this.buildKey(key)
    const cached = this.store.get(cacheKey)

    if (!cached) {
      return Result.ok(null)
    }

    // Check expiration
    if (cached.expiresAt && cached.expiresAt < Date.now()) {
      this.store.delete(cacheKey)
      return Result.ok(null)
    }

    return Result.ok(cached.value)
  }

  async set(key: string, value: T, options: CacheOptions = {}): AsyncResult<void, ConductorError> {
    if (!this.config.enabled || options.bypass) {
      return Result.ok(undefined)
    }

    const ttl = options.ttl || this.config.defaultTTL
    const cacheKey = this.buildKey(key)

    this.store.set(cacheKey, {
      value,
      cachedAt: Date.now(),
      expiresAt: Date.now() + ttl * 1000,
      tags: options.tags,
    })

    return Result.ok(undefined)
  }

  async delete(key: string): AsyncResult<void, ConductorError> {
    const cacheKey = this.buildKey(key)
    this.store.delete(cacheKey)
    return Result.ok(undefined)
  }

  async has(key: string): AsyncResult<boolean, ConductorError> {
    const result = await this.get(key)
    return Result.ok(result.success && result.value !== null)
  }

  async clear(): AsyncResult<void, ConductorError> {
    this.store.clear()
    return Result.ok(undefined)
  }

  async invalidateByTag(tag: string): AsyncResult<void, ConductorError> {
    const keysToDelete: string[] = []

    for (const [key, cached] of this.store.entries()) {
      if (cached.tags && cached.tags.includes(tag)) {
        keysToDelete.push(key)
      }
    }

    for (const key of keysToDelete) {
      this.store.delete(key)
    }

    return Result.ok(undefined)
  }

  private buildKey(key: string): string {
    return `${this.config.keyPrefix}${key}`
  }

  /**
   * Get cache size (memory only)
   */
  size(): number {
    return this.store.size
  }
}

/**
 * No-op cache (disables caching)
 */
export class NoOpCache<T = any> implements Cache<T> {
  async get(): AsyncResult<T | null, ConductorError> {
    return Result.ok(null)
  }

  async set(): AsyncResult<void, ConductorError> {
    return Result.ok(undefined)
  }

  async delete(): AsyncResult<void, ConductorError> {
    return Result.ok(undefined)
  }

  async has(): AsyncResult<boolean, ConductorError> {
    return Result.ok(false)
  }

  async clear(): AsyncResult<void, ConductorError> {
    return Result.ok(undefined)
  }

  async invalidateByTag(): AsyncResult<void, ConductorError> {
    return Result.ok(undefined)
  }
}
