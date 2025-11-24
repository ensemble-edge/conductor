/**
 * Data Agent - SQL Databases and Structured Data
 *
 * Handles database operations through a unified Repository interface.
 * Database backend is injected, making it testable and platform-agnostic.
 *
 * Database types:
 * - D1: SQLite database (Cloudflare D1)
 * - Hyperdrive: PostgreSQL/MySQL connection pooling (Cloudflare Hyperdrive)
 * - Vectorize: Vector database for embeddings (Cloudflare Vectorize)
 * - External: Supabase, Neon, PlanetScale, etc.
 */
import { BaseAgent } from './base-agent.js';
import { D1Repository, JSONSerializer } from '../storage/index.js';
import { DatabaseType } from '../types/constants.js';
import { exportData, createStreamingExport, } from './data/export-formats.js';
/**
 * Data Agent performs database operations via Repository pattern
 *
 * Benefits of Repository pattern:
 * - Platform-agnostic (works with any database backend)
 * - Testable (easy to inject mock repositories)
 * - Composable (repositories can be chained, cached, etc.)
 * - Type-safe (Result types for error handling)
 */
export class DataAgent extends BaseAgent {
    constructor(config, repository) {
        super(config);
        this.repository = repository;
        const cfg = config.config;
        this.dataConfig = {
            database: cfg?.database,
            operation: cfg?.operation,
            binding: cfg?.binding,
            tableName: cfg?.tableName,
            exportFormat: cfg?.exportFormat,
            exportOptions: cfg?.exportOptions,
        };
        // Validate config
        if (!this.dataConfig.database) {
            throw new Error(`Data agent "${config.name}" requires database type (d1, hyperdrive, vectorize, etc.)`);
        }
        if (!this.dataConfig.operation) {
            throw new Error(`Data agent "${config.name}" requires operation type`);
        }
    }
    /**
     * Execute data operation via repository
     */
    async run(context) {
        const { input, env } = context;
        // Get or create repository
        const repo = this.repository || this.createRepository(env);
        switch (this.dataConfig.operation) {
            case 'get':
                return await this.executeGet(repo, input);
            case 'put':
                return await this.executePut(repo, input);
            case 'delete':
                return await this.executeDelete(repo, input);
            case 'list':
                return await this.executeList(repo, input);
            case 'query':
                return await this.executeQuery(repo, input);
            case 'export':
                return await this.executeExport(repo, input);
            default:
                throw new Error(`Unknown operation: ${this.dataConfig.operation}`);
        }
    }
    /**
     * Execute GET operation
     */
    async executeGet(repo, input) {
        if (!input.key) {
            throw new Error('GET operation requires "key" in input');
        }
        const result = await repo.get(input.key);
        if (result.success) {
            return {
                key: input.key,
                value: result.value,
                found: true,
            };
        }
        else {
            return {
                key: input.key,
                value: null,
                found: false,
                error: result.error.message,
            };
        }
    }
    /**
     * Execute PUT operation
     */
    async executePut(repo, input) {
        if (!input.key || input.value === undefined) {
            throw new Error('PUT operation requires "key" and "value" in input');
        }
        const result = await repo.put(input.key, input.value);
        if (result.success) {
            return {
                key: input.key,
                success: true,
            };
        }
        else {
            return {
                key: input.key,
                success: false,
                error: result.error.message,
            };
        }
    }
    /**
     * Execute DELETE operation
     */
    async executeDelete(repo, input) {
        if (!input.key) {
            throw new Error('DELETE operation requires "key" in input');
        }
        const result = await repo.delete(input.key);
        if (result.success) {
            return {
                key: input.key,
                success: true,
            };
        }
        else {
            return {
                key: input.key,
                success: false,
                error: result.error.message,
            };
        }
    }
    /**
     * Execute LIST operation
     */
    async executeList(repo, input) {
        const result = await repo.list({
            prefix: input.prefix,
            limit: input.limit,
            cursor: input.cursor,
        });
        if (result.success) {
            return {
                items: result.value,
                success: true,
            };
        }
        else {
            return {
                items: [],
                success: false,
                error: result.error.message,
            };
        }
    }
    /**
     * Create repository from environment bindings
     * Falls back to original behavior if no repository injected
     */
    createRepository(env) {
        const bindingName = this.getBindingName();
        const binding = env[bindingName];
        if (!binding) {
            throw new Error(`Binding "${bindingName}" not found. ` +
                `Add it to wrangler.toml or inject a repository in constructor.`);
        }
        switch (this.dataConfig.database) {
            case DatabaseType.D1:
                return new D1Repository(binding, {
                    tableName: this.dataConfig.tableName || 'data',
                    idColumn: 'key',
                    valueColumn: 'value'
                }, new JSONSerializer());
            case DatabaseType.Hyperdrive:
                // TODO: Implement HyperdriveRepository for PostgreSQL/MySQL
                throw new Error('Hyperdrive repository not yet implemented');
            case DatabaseType.Vectorize:
                // TODO: Implement VectorizeRepository for vector operations
                throw new Error('Vectorize repository not yet implemented');
            case DatabaseType.Supabase:
            case DatabaseType.Neon:
            case DatabaseType.PlanetScale:
                // TODO: Implement external database repositories
                throw new Error(`${this.dataConfig.database} repository not yet implemented`);
            default:
                throw new Error(`Unknown database type: ${this.dataConfig.database}`);
        }
    }
    /**
     * Get binding name with sensible defaults
     */
    getBindingName() {
        if (this.dataConfig.binding) {
            return this.dataConfig.binding;
        }
        // Default binding names for databases
        switch (this.dataConfig.database) {
            case DatabaseType.D1:
                return 'DB';
            case DatabaseType.Hyperdrive:
                return 'HYPERDRIVE';
            case DatabaseType.Vectorize:
                return 'VECTORIZE';
            case DatabaseType.Supabase:
                return 'SUPABASE_URL';
            case DatabaseType.Neon:
                return 'NEON_URL';
            case DatabaseType.PlanetScale:
                return 'PLANETSCALE_URL';
            default:
                return 'DATABASE';
        }
    }
    /**
     * Execute QUERY operation (D1 only)
     */
    async executeQuery(repo, input) {
        // Query operations are storage-specific
        // For now, use list with filtering
        const listResult = await repo.list({
            prefix: input.prefix,
            limit: input.limit,
            cursor: input.cursor,
        });
        if (!listResult.success) {
            return {
                items: [],
                success: false,
                error: listResult.error.message,
            };
        }
        let items = listResult.value;
        // Apply filters if provided
        if (input.filter) {
            items = items.filter((item) => {
                return Object.entries(input.filter).every(([key, value]) => {
                    return item[key] === value;
                });
            });
        }
        // Apply sorting if provided
        if (input.sort) {
            const [field, order = 'asc'] = input.sort.split(':');
            items = items.sort((a, b) => {
                const aVal = a[field];
                const bVal = b[field];
                if (order === 'desc') {
                    return bVal > aVal ? 1 : bVal < aVal ? -1 : 0;
                }
                return aVal > bVal ? 1 : aVal < bVal ? -1 : 0;
            });
        }
        return {
            items,
            count: items.length,
            success: true,
        };
    }
    /**
     * Execute EXPORT operation
     */
    async executeExport(repo, input) {
        // Get data to export
        const listResult = await repo.list({
            prefix: input.prefix,
            limit: input.limit || 10000, // Default to large limit for exports
            cursor: input.cursor,
        });
        if (!listResult.success) {
            return {
                success: false,
                error: listResult.error.message,
            };
        }
        let items = listResult.value;
        // Apply filters if provided
        if (input.filter) {
            items = items.filter((item) => {
                return Object.entries(input.filter).every(([key, value]) => {
                    return item[key] === value;
                });
            });
        }
        // Prepare export options
        const exportOptions = {
            format: input.format || this.dataConfig.exportFormat || 'json',
            ...this.dataConfig.exportOptions,
            ...input.exportOptions,
        };
        // Handle streaming export for large datasets
        if (input.streaming || items.length > 1000) {
            // Create async iterable for streaming
            async function* dataSource() {
                const batchSize = exportOptions.batchSize || 100;
                for (let i = 0; i < items.length; i += batchSize) {
                    yield items.slice(i, i + batchSize);
                }
            }
            const exportResult = createStreamingExport(dataSource(), exportOptions);
            return {
                success: true,
                streaming: true,
                stream: exportResult.data,
                contentType: exportResult.contentType,
                extension: exportResult.extension,
                count: items.length,
            };
        }
        // Non-streaming export
        const exportResult = await exportData(items, exportOptions);
        return {
            success: true,
            streaming: false,
            data: exportResult.data,
            contentType: exportResult.contentType,
            extension: exportResult.extension,
            size: exportResult.size,
            count: items.length,
        };
    }
    /**
     * Get Data configuration
     */
    getDataConfig() {
        return { ...this.dataConfig };
    }
}
