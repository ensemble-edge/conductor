/**
 * Cloudflare Hyperdrive Repository Implementation
 *
 * Provides access to external databases (Postgres, MySQL, etc.) via Hyperdrive.
 * Hyperdrive provides connection pooling, query caching, and low-latency access.
 *
 * Note: Hyperdrive bindings return a D1Database interface for querying.
 */
import { Result } from '../types/result.js';
import { type ConductorError } from '../errors/error-types.js';
/**
 * Database type for dialect-specific SQL
 */
export type DatabaseType = 'postgres' | 'mysql' | 'mariadb';
/**
 * Configuration for Hyperdrive repository
 */
export interface HyperdriveConfig {
    /**
     * Database type (for dialect-specific SQL)
     */
    databaseType: DatabaseType;
    /**
     * Schema name (optional, for Postgres)
     */
    schema?: string;
    /**
     * Connection options
     */
    options?: {
        /**
         * Query timeout (ms)
         */
        timeout?: number;
        /**
         * Read-only mode (prevent writes)
         */
        readOnly?: boolean;
        /**
         * Max rows to return
         */
        maxRows?: number;
    };
}
/**
 * Query result metadata
 */
export interface QueryMetadata {
    /**
     * Number of rows affected (for writes)
     */
    rowsAffected?: number;
    /**
     * Execution time (ms)
     */
    executionTime: number;
    /**
     * Column names
     */
    columns: string[];
    /**
     * Row count
     */
    rowCount: number;
}
/**
 * Query result with metadata
 */
export interface QueryResult<T = unknown> {
    /**
     * Result rows
     */
    rows: T[];
    /**
     * Metadata
     */
    metadata: QueryMetadata;
}
/**
 * Table metadata
 */
export interface TableMetadata {
    /**
     * Table name
     */
    name: string;
    /**
     * Schema name
     */
    schema?: string;
    /**
     * Column definitions
     */
    columns: Array<{
        name: string;
        type: string;
        nullable: boolean;
        defaultValue?: string;
    }>;
    /**
     * Primary key columns
     */
    primaryKey?: string[];
    /**
     * Indexes
     */
    indexes?: Array<{
        name: string;
        columns: string[];
        unique: boolean;
    }>;
}
/**
 * Transaction interface
 */
export interface HyperdriveTransaction {
    /**
     * Execute a query in the transaction
     */
    query<T = unknown>(sql: string, params?: unknown[]): Promise<Result<QueryResult<T>, ConductorError>>;
    /**
     * Commit the transaction
     */
    commit(): Promise<Result<void, ConductorError>>;
    /**
     * Rollback the transaction
     */
    rollback(): Promise<Result<void, ConductorError>>;
}
/**
 * Repository implementation for Cloudflare Hyperdrive
 *
 * Hyperdrive bindings provide a D1Database interface for querying.
 */
export declare class HyperdriveRepository {
    private readonly hyperdrive;
    private readonly config;
    private readonly schema?;
    private readonly timeout;
    private readonly readOnly;
    private readonly maxRows?;
    constructor(hyperdrive: D1Database, config: HyperdriveConfig);
    /**
     * Execute a raw SQL query
     */
    query<T = unknown>(sql: string, params?: unknown[]): Promise<Result<QueryResult<T>, ConductorError>>;
    /**
     * Execute a query with named parameters
     * Converts named parameters (:name) to positional parameters based on database type
     */
    queryNamed<T = unknown>(sql: string, params: Record<string, unknown>): Promise<Result<QueryResult<T>, ConductorError>>;
    /**
     * Execute a write query (INSERT, UPDATE, DELETE)
     */
    execute(sql: string, params?: unknown[]): Promise<Result<{
        rowsAffected: number;
    }, ConductorError>>;
    /**
     * Begin a transaction
     * Note: D1/Hyperdrive transaction support is limited - this is a best-effort implementation
     */
    transaction<T>(callback: (tx: HyperdriveTransaction) => Promise<T>): Promise<Result<T, ConductorError>>;
    /**
     * Get table metadata
     */
    getTableInfo(tableName: string): Promise<Result<TableMetadata, ConductorError>>;
    /**
     * List tables in schema
     */
    listTables(): Promise<Result<string[], ConductorError>>;
    /**
     * Check if a query is a write operation
     */
    private isWriteQuery;
    /**
     * Convert named parameters to positional parameters
     */
    private convertNamedParams;
    /**
     * Get database type
     */
    getDatabaseType(): DatabaseType;
    /**
     * Check if repository is read-only
     */
    isReadOnly(): boolean;
}
//# sourceMappingURL=hyperdrive-repository.d.ts.map