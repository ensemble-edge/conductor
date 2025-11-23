/**
 * Analytical Memory - 5th Memory Tier
 *
 * Provides access to structured data across multiple databases via Hyperdrive.
 * This layer is for querying production databases, analytics DBs, and data warehouses.
 */
import { HyperdriveRepository, type DatabaseType, type QueryResult } from '../../storage/hyperdrive-repository.js';
import type { ConductorError } from '../../errors/error-types.js';
import { Result } from '../../types/result.js';
/**
 * Database configuration
 */
export interface DatabaseConfig {
    /**
     * Hyperdrive binding (returns D1Database interface)
     */
    binding: D1Database;
    /**
     * Database type
     */
    type: DatabaseType;
    /**
     * Schema name (optional)
     */
    schema?: string;
    /**
     * Read-only mode
     */
    readOnly?: boolean;
    /**
     * Query timeout (ms)
     */
    timeout?: number;
    /**
     * Max rows per query
     */
    maxRows?: number;
}
/**
 * Analytical memory configuration
 */
export interface AnalyticalMemoryConfig {
    /**
     * Database configurations by alias
     */
    databases: Record<string, DatabaseConfig>;
    /**
     * Default database alias
     */
    defaultDatabase?: string;
    /**
     * Enable query result caching
     */
    enableCache?: boolean;
    /**
     * Cache TTL for query results (seconds)
     */
    cacheTTL?: number;
    /**
     * KV namespace for caching (required if enableCache is true)
     */
    cacheKV?: KVNamespace;
}
/**
 * Federated query - query across multiple databases
 */
export interface FederatedQuery {
    /**
     * Database alias
     */
    database: string;
    /**
     * SQL query
     */
    sql: string;
    /**
     * Query parameters
     */
    params?: unknown[];
}
/**
 * Analytical Memory - 5th Memory Tier
 *
 * Provides structured data access across multiple Hyperdrive-connected databases.
 */
export declare class AnalyticalMemory {
    private readonly env;
    private readonly config;
    private repositories;
    private defaultDatabase?;
    private cache?;
    constructor(env: Env, config: AnalyticalMemoryConfig);
    /**
     * Query a specific database
     */
    query<T = unknown>(sql: string, params?: unknown[], database?: string): Promise<T[]>;
    /**
     * Query with named parameters
     */
    queryNamed<T = unknown>(sql: string, params: Record<string, unknown>, database?: string): Promise<T[]>;
    /**
     * Query with full result metadata
     */
    queryWithMetadata<T = unknown>(sql: string, params?: unknown[], database?: string): Promise<Result<QueryResult<T>, ConductorError>>;
    /**
     * Execute a write query (INSERT, UPDATE, DELETE)
     */
    execute(sql: string, params?: unknown[], database?: string): Promise<number>;
    /**
     * Execute queries across multiple databases (federated query)
     */
    queryMultiple(queries: FederatedQuery[]): Promise<Map<string, unknown[]>>;
    /**
     * Begin a transaction on a specific database
     */
    transaction<T>(database: string, callback: (repository: HyperdriveRepository) => Promise<T>): Promise<T>;
    /**
     * Get list of available databases
     */
    getDatabases(): string[];
    /**
     * Check if a database is available
     */
    hasDatabase(alias: string): boolean;
    /**
     * Get database configuration
     */
    getDatabaseConfig(alias: string): DatabaseConfig | undefined;
    /**
     * Get repository for a database
     */
    getRepository(alias: string): HyperdriveRepository | undefined;
    /**
     * List tables in a database
     */
    listTables(database?: string): Promise<string[]>;
    /**
     * Get table metadata
     */
    getTableInfo(tableName: string, database?: string): Promise<import("../../storage/hyperdrive-repository.js").TableMetadata>;
    /**
     * Get default database alias
     */
    getDefaultDatabase(): string | undefined;
    /**
     * Set default database
     */
    setDefaultDatabase(alias: string): void;
    /**
     * Get cache statistics (if caching is enabled)
     */
    getCacheStats(): import("../../storage/query-cache.js").CacheStats | undefined;
    /**
     * Clear cache for a specific database
     */
    clearCache(database?: string): Promise<number>;
    /**
     * Reset cache statistics
     */
    resetCacheStats(): void;
    /**
     * Check if caching is enabled
     */
    isCacheEnabled(): boolean;
}
//# sourceMappingURL=analytical-memory.d.ts.map