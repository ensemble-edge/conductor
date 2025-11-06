/**
 * Cloudflare D1 Repository Implementation
 *
 * Provides a Repository interface over Cloudflare D1 (SQL database).
 */
import { Result } from '../types/result.js';
import { type ConductorError } from '../errors/error-types.js';
import type { Repository, PutOptions, ListOptions, Serializer } from './repository.js';
/**
 * Configuration for D1 repository
 */
export interface D1RepositoryConfig {
    /**
     * Table name
     */
    tableName: string;
    /**
     * ID column name (default: 'id')
     */
    idColumn?: string;
    /**
     * Value column name (default: 'value')
     */
    valueColumn?: string;
    /**
     * Created at column name (default: 'created_at')
     */
    createdAtColumn?: string;
    /**
     * Updated at column name (default: 'updated_at')
     */
    updatedAtColumn?: string;
    /**
     * Expiration column name (optional)
     */
    expirationColumn?: string;
}
/**
 * Repository implementation for Cloudflare D1
 */
export declare class D1Repository<T> implements Repository<T, string> {
    private readonly binding;
    private readonly serializer;
    private readonly tableName;
    private readonly idColumn;
    private readonly valueColumn;
    private readonly createdAtColumn;
    private readonly updatedAtColumn;
    private readonly expirationColumn?;
    constructor(binding: D1Database, config: D1RepositoryConfig, serializer?: Serializer<T>);
    /**
     * Get a value from D1
     */
    get(id: string): Promise<Result<T, ConductorError>>;
    /**
     * Store a value in D1
     */
    put(id: string, value: T, options?: PutOptions): Promise<Result<void, ConductorError>>;
    /**
     * Delete a value from D1
     */
    delete(id: string): Promise<Result<void, ConductorError>>;
    /**
     * List values from D1
     */
    list(options?: ListOptions): Promise<Result<T[], ConductorError>>;
    /**
     * Check if an ID exists in D1
     */
    has(id: string): Promise<Result<boolean, ConductorError>>;
    /**
     * Clean up expired entries
     */
    cleanExpired(): Promise<Result<number, ConductorError>>;
}
//# sourceMappingURL=d1-repository.d.ts.map