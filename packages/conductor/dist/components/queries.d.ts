/**
 * Query Registry
 *
 * Provides typed access to SQL query templates from KV storage.
 * Queries support versioning and can be used with Data agents.
 *
 * @module components/queries
 */
import type { ComponentRegistry } from './registry.js';
/**
 * SQL Query template loaded from KV
 */
export interface QueryTemplate {
    /** Raw SQL query string (may contain placeholders) */
    sql: string;
    /** Optional description */
    description?: string;
    /** Parameter definitions */
    parameters?: Record<string, {
        type: string;
        description?: string;
    }>;
}
/**
 * Query registry for accessing SQL query templates
 *
 * @example
 * ```typescript
 * export default async function(ctx: AgentExecutionContext) {
 *   const { queries } = ctx
 *
 *   // Get a query template
 *   const query = await queries.get('find-users@v1.0.0')
 *
 *   // Get raw SQL
 *   const sql = await queries.getSql('find-users')
 *
 *   // Execute with D1
 *   const stmt = ctx.env.DB.prepare(sql)
 *   const results = await stmt.bind(userId).all()
 *
 *   return { users: results.results }
 * }
 * ```
 */
export declare class QueryRegistry {
    private parent;
    constructor(parent: ComponentRegistry);
    /**
     * Get a query template by name (with optional @version)
     *
     * @param nameOrRef - Query name with optional version (e.g., "find-users" or "find-users@v1.0.0")
     * @returns Query template object
     *
     * @example
     * queries.get('find-users')           // find-users@latest
     * queries.get('find-users@v1.0.0')    // exact version
     */
    get(nameOrRef: string): Promise<QueryTemplate>;
    /**
     * Get raw SQL string from a query template
     *
     * @param nameOrRef - Query name with optional version
     * @returns Raw SQL string
     */
    getSql(nameOrRef: string): Promise<string>;
    /**
     * Check if a query exists
     *
     * @param nameOrRef - Query name with optional version
     * @returns True if query exists
     */
    exists(nameOrRef: string): Promise<boolean>;
}
//# sourceMappingURL=queries.d.ts.map