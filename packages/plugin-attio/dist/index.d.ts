/**
 * @conductor/attio
 *
 * Attio CRM plugin for Conductor
 * Provides operations for managing records, lists, and notes in Attio
 */
import type { LifecyclePlugin } from '@ensemble-edge/conductor';
export interface AttioPluginConfig {
    /** Attio API base URL (default: https://api.attio.com/v2) */
    apiUrl?: string;
    /** Attio access token */
    accessToken?: string;
    /** Workspace ID */
    workspaceId?: string;
    /** Enable request caching */
    cache?: boolean;
    /** Cache TTL in seconds */
    cacheTtl?: number;
}
export interface AttioQueryRecordsConfig {
    /** Object type (e.g., 'people', 'companies', custom objects) */
    object: string;
    /** Filter conditions */
    filter?: Record<string, any>;
    /** Limit results */
    limit?: number;
    /** Offset for pagination */
    offset?: number;
    /** Sort configuration */
    sorts?: Array<{
        attribute: string;
        direction: 'asc' | 'desc';
    }>;
}
export interface AttioCreateRecordConfig {
    /** Object type */
    object: string;
    /** Record data */
    data: Record<string, any>;
}
export interface AttioUpdateRecordConfig {
    /** Object type */
    object: string;
    /** Record ID */
    recordId: string;
    /** Record data to update */
    data: Record<string, any>;
}
export interface AttioDeleteRecordConfig {
    /** Object type */
    object: string;
    /** Record ID */
    recordId: string;
}
export interface AttioGetRecordConfig {
    /** Object type */
    object: string;
    /** Record ID */
    recordId: string;
}
export interface AttioCreateNoteConfig {
    /** Parent object type */
    parentObject: string;
    /** Parent record ID */
    parentRecordId: string;
    /** Note title */
    title?: string;
    /** Note content */
    content: string;
    /** Format (default: 'plaintext') */
    format?: 'plaintext' | 'html' | 'markdown';
}
export interface AttioListRecordsConfig {
    /** List ID or slug */
    list: string;
    /** Limit results */
    limit?: number;
    /** Offset for pagination */
    offset?: number;
}
/**
 * Attio CRM Plugin
 *
 * Provides operations for Attio CRM:
 * - attio:queryRecords - Query records from an object
 * - attio:getRecord - Get a single record by ID
 * - attio:createRecord - Create a new record
 * - attio:updateRecord - Update an existing record
 * - attio:deleteRecord - Delete a record
 * - attio:createNote - Create a note on a record
 * - attio:listRecords - Get records from a list
 *
 * @example
 * ```typescript
 * import { attioPlugin } from '@conductor/attio'
 *
 * export default {
 *   plugins: [
 *     attioPlugin({
 *       accessToken: env.ATTIO_ACCESS_TOKEN,
 *       workspaceId: env.ATTIO_WORKSPACE_ID
 *     })
 *   ]
 * }
 * ```
 */
export declare const attioPlugin: LifecyclePlugin;
/**
 * Create Attio plugin with configuration
 *
 * @example
 * ```typescript
 * createAttioPlugin({
 *   accessToken: env.ATTIO_ACCESS_TOKEN,
 *   workspaceId: env.ATTIO_WORKSPACE_ID
 * })
 * ```
 */
export declare function createAttioPlugin(config: AttioPluginConfig): LifecyclePlugin;
export default attioPlugin;
//# sourceMappingURL=index.d.ts.map