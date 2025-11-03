/**
 * Query Result Caching Layer
 *
 * Provides TTL-based caching for SQL query results using Cloudflare KV.
 * Reduces database load and improves query performance for frequently accessed data.
 */

import type { QueryResult } from './hyperdrive-repository.js';
import { Result } from '../types/result.js';
import { Errors, type ConductorError } from '../errors/error-types.js';
import { TTL } from '../config/constants.js';

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
 * Cache metadata stored with query results
 */
interface CacheEntry<T = unknown> {
	/**
	 * Cached query result
	 */
	result: QueryResult<T>;

	/**
	 * Cache timestamp (ms)
	 */
	cachedAt: number;

	/**
	 * TTL in seconds
	 */
	ttl: number;

	/**
	 * Query metadata for debugging
	 */
	metadata: {
		sql: string;
		database?: string;
		paramCount: number;
	};
}

/**
 * Query Cache - TTL-based caching for query results
 */
export class QueryCache {
	private readonly kv: KVNamespace;
	private readonly defaultTTL: number;
	private readonly keyPrefix: string;
	private readonly enableStats: boolean;

	// Statistics
	private stats = {
		hits: 0,
		misses: 0,
		sets: 0,
		deletes: 0,
		errors: 0
	};

	constructor(config: QueryCacheConfig) {
		this.kv = config.kv;
		this.defaultTTL = config.defaultTTL || TTL.CACHE_SHORT;
		this.keyPrefix = config.keyPrefix || 'query:';
		this.enableStats = config.enableStats !== false;
	}

	/**
	 * Get cached query result
	 */
	async get<T = unknown>(
		sql: string,
		params?: unknown[],
		database?: string
	): Promise<Result<QueryResult<T> | null, ConductorError>> {
		try {
			const key = await this.generateKey(sql, params, database);
			const cached = await this.kv.get<CacheEntry<T>>(key, 'json');

			if (!cached) {
				if (this.enableStats) this.stats.misses++;
				return Result.ok(null);
			}

			// Verify cache hasn't expired (additional check beyond KV TTL)
			const age = (Date.now() - cached.cachedAt) / 1000;
			if (age > cached.ttl) {
				// Expired - delete and return null
				await this.delete(sql, params, database);
				if (this.enableStats) this.stats.misses++;
				return Result.ok(null);
			}

			if (this.enableStats) this.stats.hits++;
			return Result.ok(cached.result);
		} catch (error) {
			if (this.enableStats) this.stats.errors++;
			return Result.err(
				Errors.internal('Cache get failed', error instanceof Error ? error : undefined)
			);
		}
	}

	/**
	 * Set cached query result
	 */
	async set<T = unknown>(
		sql: string,
		result: QueryResult<T>,
		params?: unknown[],
		database?: string,
		ttl?: number
	): Promise<Result<void, ConductorError>> {
		try {
			const key = await this.generateKey(sql, params, database);
			const cacheTTL = ttl || this.defaultTTL;

			const entry: CacheEntry<T> = {
				result,
				cachedAt: Date.now(),
				ttl: cacheTTL,
				metadata: {
					sql: sql.substring(0, 200), // Truncate for storage
					database,
					paramCount: params?.length || 0
				}
			};

			// Store in KV with TTL
			await this.kv.put(key, JSON.stringify(entry), {
				expirationTtl: cacheTTL
			});

			if (this.enableStats) this.stats.sets++;
			return Result.ok(undefined);
		} catch (error) {
			if (this.enableStats) this.stats.errors++;
			return Result.err(
				Errors.internal('Cache set failed', error instanceof Error ? error : undefined)
			);
		}
	}

	/**
	 * Delete cached query result
	 */
	async delete(sql: string, params?: unknown[], database?: string): Promise<Result<void, ConductorError>> {
		try {
			const key = await this.generateKey(sql, params, database);
			await this.kv.delete(key);

			if (this.enableStats) this.stats.deletes++;
			return Result.ok(undefined);
		} catch (error) {
			if (this.enableStats) this.stats.errors++;
			return Result.err(
				Errors.internal('Cache delete failed', error instanceof Error ? error : undefined)
			);
		}
	}

	/**
	 * Clear all cached queries for a database
	 */
	async clearDatabase(database: string): Promise<Result<number, ConductorError>> {
		try {
			// List all keys with database prefix
			const prefix = `${this.keyPrefix}${database}:`;
			const list = await this.kv.list({ prefix });

			let deleted = 0;
			for (const key of list.keys) {
				await this.kv.delete(key.name);
				deleted++;
			}

			if (this.enableStats) this.stats.deletes += deleted;
			return Result.ok(deleted);
		} catch (error) {
			if (this.enableStats) this.stats.errors++;
			return Result.err(
				Errors.internal('Cache clear failed', error instanceof Error ? error : undefined)
			);
		}
	}

	/**
	 * Clear all cached queries
	 */
	async clearAll(): Promise<Result<number, ConductorError>> {
		try {
			const list = await this.kv.list({ prefix: this.keyPrefix });

			let deleted = 0;
			for (const key of list.keys) {
				await this.kv.delete(key.name);
				deleted++;
			}

			if (this.enableStats) this.stats.deletes += deleted;
			return Result.ok(deleted);
		} catch (error) {
			if (this.enableStats) this.stats.errors++;
			return Result.err(
				Errors.internal('Cache clear all failed', error instanceof Error ? error : undefined)
			);
		}
	}

	/**
	 * Get cache statistics
	 */
	getStats(): CacheStats {
		const total = this.stats.hits + this.stats.misses;
		return {
			...this.stats,
			hitRate: total > 0 ? this.stats.hits / total : 0
		};
	}

	/**
	 * Reset cache statistics
	 */
	resetStats(): void {
		this.stats = {
			hits: 0,
			misses: 0,
			sets: 0,
			deletes: 0,
			errors: 0
		};
	}

	/**
	 * Generate cache key from query, params, and database
	 */
	private async generateKey(sql: string, params?: unknown[], database?: string): Promise<string> {
		// Normalize SQL (remove extra whitespace, lowercase)
		const normalizedSQL = sql.trim().replace(/\s+/g, ' ').toLowerCase();

		// Create deterministic key from SQL + params + database
		const components = [database || 'default', normalizedSQL];

		if (params && params.length > 0) {
			// Convert params to deterministic string
			const paramString = JSON.stringify(params);
			components.push(paramString);
		}

		// Hash the components for a shorter key
		const hash = await this.sha256Hash(components.join('|'));

		return `${this.keyPrefix}${hash}`;
	}

	/**
	 * Cryptographically secure SHA-256 hash function
	 * Uses Web Crypto API for secure, collision-resistant hashing
	 */
	private async sha256Hash(str: string): Promise<string> {
		// Encode string to Uint8Array
		const encoder = new TextEncoder();
		const data = encoder.encode(str);

		// Calculate SHA-256 hash
		const hashBuffer = await crypto.subtle.digest('SHA-256', data);

		// Convert to hex string
		const hashArray = Array.from(new Uint8Array(hashBuffer));
		const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

		// Return first 16 chars (64 bits) for reasonable key length while maintaining security
		return hashHex.substring(0, 16);
	}

	/**
	 * Check if caching is enabled for a query
	 * Certain query types should not be cached (writes, transactions, etc.)
	 */
	static shouldCache(sql: string): boolean {
		const upperSQL = sql.trim().toUpperCase();

		// Don't cache write operations
		if (/^(INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|TRUNCATE|REPLACE)/i.test(upperSQL)) {
			return false;
		}

		// Don't cache transactions
		if (/^(BEGIN|COMMIT|ROLLBACK|START TRANSACTION)/i.test(upperSQL)) {
			return false;
		}

		// Don't cache queries with non-deterministic functions
		if (/\b(NOW|CURRENT_TIMESTAMP|RANDOM|UUID|NEWID)\b/i.test(upperSQL)) {
			return false;
		}

		return true;
	}

	/**
	 * Get recommended TTL based on query type
	 */
	static getRecommendedTTL(sql: string): number {
		const upperSQL = sql.trim().toUpperCase();

		// Analytics queries - longer TTL (1 hour)
		if (/\b(COUNT|SUM|AVG|GROUP BY|AGGREGATE)\b/i.test(upperSQL)) {
			return 3600;
		}

		// Lookup queries - medium TTL (15 minutes)
		if (/\bWHERE\s+\w+\s*=\s*[$?:\d]/i.test(upperSQL)) {
			return 900;
		}

		// List queries - short TTL (5 minutes)
		if (/\bSELECT\b/i.test(upperSQL)) {
			return 300;
		}

		// Default (5 minutes)
		return 300;
	}
}
