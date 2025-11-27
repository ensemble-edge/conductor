/**
 * Query Registry
 *
 * Provides typed access to SQL query templates from KV storage.
 * Queries support versioning and can be used with Data agents.
 *
 * @module components/queries
 */
import { parseNameWithVersion } from './registry.js';
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
export class QueryRegistry {
    constructor(parent) {
        this.parent = parent;
    }
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
    async get(nameOrRef) {
        const { name, version } = parseNameWithVersion(nameOrRef);
        const ref = `queries/${name}@${version}`;
        const content = await this.parent.resolve(ref);
        // Handle both raw SQL string and structured query object
        if (typeof content === 'string') {
            return { sql: content };
        }
        return content;
    }
    /**
     * Get raw SQL string from a query template
     *
     * @param nameOrRef - Query name with optional version
     * @returns Raw SQL string
     */
    async getSql(nameOrRef) {
        const template = await this.get(nameOrRef);
        return template.sql;
    }
    /**
     * Check if a query exists
     *
     * @param nameOrRef - Query name with optional version
     * @returns True if query exists
     */
    async exists(nameOrRef) {
        try {
            await this.get(nameOrRef);
            return true;
        }
        catch {
            return false;
        }
    }
}
