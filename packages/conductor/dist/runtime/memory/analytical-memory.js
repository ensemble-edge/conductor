/**
 * Analytical Memory - 5th Memory Tier
 *
 * Provides access to structured data across multiple databases via Hyperdrive.
 * This layer is for querying production databases, analytics DBs, and data warehouses.
 */
import { HyperdriveRepository, } from '../../storage/hyperdrive-repository.js';
import { QueryCache } from '../../storage/query-cache.js';
import { Result } from '../../types/result.js';
import { Errors } from '../../errors/error-types.js';
/**
 * Analytical Memory - 5th Memory Tier
 *
 * Provides structured data access across multiple Hyperdrive-connected databases.
 */
export class AnalyticalMemory {
    constructor(_env, // env reserved for future use, databases come from config
    config) {
        this.config = config;
        this.repositories = new Map();
        this.defaultDatabase = config.defaultDatabase;
        // Initialize cache if enabled
        if (config.enableCache && config.cacheKV) {
            this.cache = new QueryCache({
                kv: config.cacheKV,
                defaultTTL: config.cacheTTL || 300,
                keyPrefix: 'analytical:',
                enableStats: true,
            });
        }
        // Initialize repositories for each database
        for (const [alias, dbConfig] of Object.entries(config.databases)) {
            const repository = new HyperdriveRepository(dbConfig.binding, {
                databaseType: dbConfig.type,
                schema: dbConfig.schema,
                options: {
                    readOnly: dbConfig.readOnly,
                    timeout: dbConfig.timeout,
                    maxRows: dbConfig.maxRows,
                },
            });
            this.repositories.set(alias, repository);
        }
    }
    /**
     * Query a specific database
     */
    async query(sql, params, database) {
        const dbAlias = database || this.defaultDatabase;
        if (!dbAlias) {
            throw new Error('No database specified and no default database configured');
        }
        const repository = this.repositories.get(dbAlias);
        if (!repository) {
            throw new Error(`Database not found: ${dbAlias}`);
        }
        // Try cache first if enabled
        if (this.cache && QueryCache.shouldCache(sql)) {
            const cachedResult = await this.cache.get(sql, params, dbAlias);
            if (cachedResult.success && cachedResult.value) {
                return cachedResult.value.rows;
            }
        }
        // Execute query
        const result = await repository.query(sql, params);
        if (!result.success) {
            throw new Error(`Query failed: ${result.error.message}`);
        }
        // Cache the result if caching is enabled
        if (this.cache && QueryCache.shouldCache(sql)) {
            const ttl = QueryCache.getRecommendedTTL(sql);
            await this.cache.set(sql, result.value, params, dbAlias, ttl);
        }
        return result.value.rows;
    }
    /**
     * Query with named parameters
     */
    async queryNamed(sql, params, database) {
        const dbAlias = database || this.defaultDatabase;
        if (!dbAlias) {
            throw new Error('No database specified and no default database configured');
        }
        const repository = this.repositories.get(dbAlias);
        if (!repository) {
            throw new Error(`Database not found: ${dbAlias}`);
        }
        const result = await repository.queryNamed(sql, params);
        if (!result.success) {
            throw new Error(`Query failed: ${result.error.message}`);
        }
        return result.value.rows;
    }
    /**
     * Query with full result metadata
     */
    async queryWithMetadata(sql, params, database) {
        const dbAlias = database || this.defaultDatabase;
        if (!dbAlias) {
            return Result.err(Errors.internal('No database specified and no default database configured'));
        }
        const repository = this.repositories.get(dbAlias);
        if (!repository) {
            return Result.err(Errors.internal(`Database not found: ${dbAlias}`));
        }
        return repository.query(sql, params);
    }
    /**
     * Execute a write query (INSERT, UPDATE, DELETE)
     */
    async execute(sql, params, database) {
        const dbAlias = database || this.defaultDatabase;
        if (!dbAlias) {
            throw new Error('No database specified and no default database configured');
        }
        const repository = this.repositories.get(dbAlias);
        if (!repository) {
            throw new Error(`Database not found: ${dbAlias}`);
        }
        if (repository.isReadOnly()) {
            throw new Error(`Database is read-only: ${dbAlias}`);
        }
        const result = await repository.execute(sql, params);
        if (!result.success) {
            throw new Error(`Execute failed: ${result.error.message}`);
        }
        return result.value.rowsAffected;
    }
    /**
     * Execute queries across multiple databases (federated query)
     */
    async queryMultiple(queries) {
        const results = new Map();
        // Execute queries in parallel
        const promises = queries.map(async (query) => {
            const rows = await this.query(query.sql, query.params, query.database);
            return { database: query.database, rows };
        });
        const queryResults = await Promise.all(promises);
        // Build result map
        for (const result of queryResults) {
            results.set(result.database, result.rows);
        }
        return results;
    }
    /**
     * Begin a transaction on a specific database
     */
    async transaction(database, callback) {
        const repository = this.repositories.get(database);
        if (!repository) {
            throw new Error(`Database not found: ${database}`);
        }
        const result = await repository.transaction(async (tx) => {
            // For now, pass the repository itself since transaction API is limited
            return await callback(repository);
        });
        if (!result.success) {
            throw new Error(`Transaction failed: ${result.error.message}`);
        }
        return result.value;
    }
    /**
     * Get list of available databases
     */
    getDatabases() {
        return Array.from(this.repositories.keys());
    }
    /**
     * Check if a database is available
     */
    hasDatabase(alias) {
        return this.repositories.has(alias);
    }
    /**
     * Get database configuration
     */
    getDatabaseConfig(alias) {
        return this.config.databases[alias];
    }
    /**
     * Get repository for a database
     */
    getRepository(alias) {
        return this.repositories.get(alias);
    }
    /**
     * List tables in a database
     */
    async listTables(database) {
        const dbAlias = database || this.defaultDatabase;
        if (!dbAlias) {
            throw new Error('No database specified and no default database configured');
        }
        const repository = this.repositories.get(dbAlias);
        if (!repository) {
            throw new Error(`Database not found: ${dbAlias}`);
        }
        const result = await repository.listTables();
        if (!result.success) {
            throw new Error(`Failed to list tables: ${result.error.message}`);
        }
        return result.value;
    }
    /**
     * Get table metadata
     */
    async getTableInfo(tableName, database) {
        const dbAlias = database || this.defaultDatabase;
        if (!dbAlias) {
            throw new Error('No database specified and no default database configured');
        }
        const repository = this.repositories.get(dbAlias);
        if (!repository) {
            throw new Error(`Database not found: ${dbAlias}`);
        }
        const result = await repository.getTableInfo(tableName);
        if (!result.success) {
            throw new Error(`Failed to get table info: ${result.error.message}`);
        }
        return result.value;
    }
    /**
     * Get default database alias
     */
    getDefaultDatabase() {
        return this.defaultDatabase;
    }
    /**
     * Set default database
     */
    setDefaultDatabase(alias) {
        if (!this.repositories.has(alias)) {
            throw new Error(`Database not found: ${alias}`);
        }
        this.defaultDatabase = alias;
    }
    /**
     * Get cache statistics (if caching is enabled)
     */
    getCacheStats() {
        return this.cache?.getStats();
    }
    /**
     * Clear cache for a specific database
     */
    async clearCache(database) {
        if (!this.cache) {
            return 0;
        }
        if (database) {
            const result = await this.cache.clearDatabase(database);
            return result.success ? result.value : 0;
        }
        else {
            const result = await this.cache.clearAll();
            return result.success ? result.value : 0;
        }
    }
    /**
     * Reset cache statistics
     */
    resetCacheStats() {
        this.cache?.resetStats();
    }
    /**
     * Check if caching is enabled
     */
    isCacheEnabled() {
        return this.cache !== undefined;
    }
}
