/**
 * Queries Member
 *
 * Execute SQL queries across Hyperdrive-connected databases.
 * Queries can be loaded from catalog (like prompts) or executed inline.
 */
import { BaseMember, type MemberExecutionContext } from '../../base-member.js';
import type { MemberConfig } from '../../../runtime/parser.js';
import type { ConductorEnv } from '../../../types/env.js';
/**
 * Query input - either from catalog or inline SQL
 */
export interface QueriesInput {
    /**
     * Query name from catalog (mutually exclusive with sql)
     */
    queryName?: string;
    /**
     * Inline SQL query (mutually exclusive with queryName)
     */
    sql?: string;
    /**
     * Query parameters (named or positional)
     */
    input?: Record<string, unknown> | unknown[];
    /**
     * Database alias (overrides default)
     */
    database?: string;
}
/**
 * Queries configuration
 */
export interface QueriesConfig {
    /**
     * Default database alias
     */
    defaultDatabase?: string;
    /**
     * Cache TTL for query results (seconds)
     */
    cacheTTL?: number;
    /**
     * Max rows to return
     */
    maxRows?: number;
    /**
     * Query timeout (ms)
     */
    timeout?: number;
    /**
     * Read-only mode (prevent writes)
     */
    readOnly?: boolean;
    /**
     * Transform column names
     */
    transform?: 'none' | 'camelCase' | 'snakeCase';
    /**
     * Return metadata with results
     */
    includeMetadata?: boolean;
}
/**
 * Queries output
 */
export interface QueriesOutput {
    /**
     * Query results
     */
    rows: unknown[];
    /**
     * Row count
     */
    count: number;
    /**
     * Execution metadata
     */
    metadata: {
        /**
         * Columns returned
         */
        columns: string[];
        /**
         * Execution time (ms)
         */
        executionTime: number;
        /**
         * Cache hit?
         */
        cached: boolean;
        /**
         * Database used
         */
        database: string;
        /**
         * Query that was executed
         */
        query?: string;
    };
}
/**
 * Queries Member - SQL Query Execution
 *
 * Executes SQL queries across Hyperdrive-connected databases.
 * Queries can be stored in catalog like prompts or executed inline.
 */
export declare class QueriesMember extends BaseMember {
    private readonly env;
    private queriesConfig;
    constructor(config: MemberConfig, env: ConductorEnv);
    protected run(context: MemberExecutionContext): Promise<QueriesOutput>;
    /**
     * Load query from catalog
     */
    private loadQueryFromCatalog;
    /**
     * Prepare query with parameters
     */
    private prepareQuery;
    /**
     * Execute query via Hyperdrive/D1
     */
    private executeQuery;
    /**
     * Check if query is a write operation
     */
    private isWriteQuery;
    /**
     * Transform object keys to camelCase
     */
    private toCamelCase;
    /**
     * Transform object keys to snake_case
     */
    private toSnakeCase;
}
//# sourceMappingURL=queries-member.d.ts.map