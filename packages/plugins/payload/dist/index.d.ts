/**
 * @conductor/payload
 *
 * Payload CMS plugin for Conductor
 * Provides operations for querying and mutating Payload collections
 */
import type { LifecyclePlugin } from '@ensemble-edge/conductor';
export interface PayloadPluginConfig {
    /** Payload CMS API URL */
    apiUrl?: string;
    /** Payload API Key */
    apiKey?: string;
    /** Enable request caching */
    cache?: boolean;
    /** Cache TTL in seconds */
    cacheTtl?: number;
}
export interface PayloadFindConfig {
    /** Collection slug */
    collection: string;
    /** Query parameters */
    where?: Record<string, any>;
    /** Depth of population */
    depth?: number;
    /** Limit results */
    limit?: number;
    /** Page number */
    page?: number;
    /** Sort field */
    sort?: string;
    /** Select specific fields */
    select?: string[];
}
export interface PayloadCreateConfig {
    /** Collection slug */
    collection: string;
    /** Document data */
    data: Record<string, any>;
    /** Depth of population */
    depth?: number;
    /** Draft status */
    draft?: boolean;
}
export interface PayloadUpdateConfig {
    /** Collection slug */
    collection: string;
    /** Document ID */
    id: string;
    /** Document data */
    data: Record<string, any>;
    /** Depth of population */
    depth?: number;
    /** Draft status */
    draft?: boolean;
}
export interface PayloadDeleteConfig {
    /** Collection slug */
    collection: string;
    /** Document ID */
    id: string;
}
export interface PayloadFindByIDConfig {
    /** Collection slug */
    collection: string;
    /** Document ID */
    id: string;
    /** Depth of population */
    depth?: number;
}
/**
 * Payload CMS Plugin
 *
 * Provides operations for Payload CMS:
 * - payload:find - Query documents from a collection
 * - payload:findById - Get a single document by ID
 * - payload:create - Create a new document
 * - payload:update - Update an existing document
 * - payload:delete - Delete a document
 *
 * @example
 * ```typescript
 * import { payloadPlugin } from '@conductor/payload'
 *
 * export default {
 *   plugins: [
 *     payloadPlugin({
 *       apiUrl: env.PAYLOAD_API_URL,
 *       apiKey: env.PAYLOAD_API_KEY
 *     })
 *   ]
 * }
 * ```
 */
export declare const payloadPlugin: LifecyclePlugin;
/**
 * Create Payload plugin with configuration
 *
 * @example
 * ```typescript
 * createPayloadPlugin({
 *   apiUrl: env.PAYLOAD_API_URL,
 *   apiKey: env.PAYLOAD_API_KEY,
 *   cache: true
 * })
 * ```
 */
export declare function createPayloadPlugin(config: PayloadPluginConfig): LifecyclePlugin;
export default payloadPlugin;
//# sourceMappingURL=index.d.ts.map