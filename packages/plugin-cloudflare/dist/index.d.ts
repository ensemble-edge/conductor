/**
 * @conductor/cloudflare
 *
 * Cloudflare API plugin for Conductor
 * Provides operations for R2, KV, D1, DNS, Workers, and more
 */
import type { LifecyclePlugin } from '@ensemble-edge/conductor';
export interface CloudflarePluginConfig {
    /** Cloudflare API token */
    apiToken?: string;
    /** Cloudflare Account ID */
    accountId?: string;
    /** Cloudflare Zone ID (for DNS operations) */
    zoneId?: string;
}
export interface R2PutConfig {
    /** R2 bucket binding name */
    bucket: string;
    /** Object key */
    key: string;
    /** Object value (string or ReadableStream) */
    value: string | ReadableStream | ArrayBuffer;
    /** Content type */
    contentType?: string;
    /** Custom metadata */
    metadata?: Record<string, string>;
}
export interface R2GetConfig {
    /** R2 bucket binding name */
    bucket: string;
    /** Object key */
    key: string;
}
export interface R2DeleteConfig {
    /** R2 bucket binding name */
    bucket: string;
    /** Object key */
    key: string;
}
export interface R2ListConfig {
    /** R2 bucket binding name */
    bucket: string;
    /** Prefix filter */
    prefix?: string;
    /** Limit results */
    limit?: number;
    /** Cursor for pagination */
    cursor?: string;
}
export interface KVPutConfig {
    /** KV namespace binding name */
    namespace: string;
    /** Key */
    key: string;
    /** Value */
    value: string;
    /** Expiration TTL in seconds */
    expirationTtl?: number;
    /** Metadata */
    metadata?: Record<string, any>;
}
export interface KVGetConfig {
    /** KV namespace binding name */
    namespace: string;
    /** Key */
    key: string;
    /** Return type */
    type?: 'text' | 'json' | 'arrayBuffer' | 'stream';
}
export interface KVDeleteConfig {
    /** KV namespace binding name */
    namespace: string;
    /** Key */
    key: string;
}
export interface KVListConfig {
    /** KV namespace binding name */
    namespace: string;
    /** Prefix filter */
    prefix?: string;
    /** Limit results */
    limit?: number;
    /** Cursor for pagination */
    cursor?: string;
}
export interface D1QueryConfig {
    /** D1 database binding name */
    database: string;
    /** SQL query */
    query: string;
    /** Query parameters */
    params?: any[];
}
export interface D1BatchConfig {
    /** D1 database binding name */
    database: string;
    /** Array of statements with queries and params */
    statements: Array<{
        query: string;
        params?: any[];
    }>;
}
export interface CloudflareAPIRequestConfig {
    /** API endpoint path (e.g., /zones/:zoneId/dns_records) */
    endpoint: string;
    /** HTTP method */
    method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
    /** Request body */
    body?: Record<string, any>;
    /** Query parameters */
    params?: Record<string, string>;
}
export interface DNSRecordCreateConfig {
    /** DNS record type */
    type: 'A' | 'AAAA' | 'CNAME' | 'TXT' | 'MX' | 'SRV';
    /** Record name */
    name: string;
    /** Record content */
    content: string;
    /** TTL (1 = automatic) */
    ttl?: number;
    /** Proxied through Cloudflare */
    proxied?: boolean;
    /** Priority (for MX/SRV records) */
    priority?: number;
    /** Comment */
    comment?: string;
}
/**
 * Cloudflare Plugin
 *
 * Provides operations for Cloudflare services:
 *
 * **R2 Storage:**
 * - cloudflare:r2:put - Upload object to R2
 * - cloudflare:r2:get - Get object from R2
 * - cloudflare:r2:delete - Delete object from R2
 * - cloudflare:r2:list - List objects in R2 bucket
 *
 * **KV Storage:**
 * - cloudflare:kv:put - Write key-value pair
 * - cloudflare:kv:get - Read key-value pair
 * - cloudflare:kv:delete - Delete key-value pair
 * - cloudflare:kv:list - List keys in namespace
 *
 * **D1 Database:**
 * - cloudflare:d1:query - Execute SQL query
 * - cloudflare:d1:batch - Execute batch queries
 *
 * **Cloudflare API:**
 * - cloudflare:api:request - Make Cloudflare API request
 * - cloudflare:dns:create - Create DNS record
 *
 * @example
 * ```typescript
 * import { cloudflarePlugin } from '@conductor/cloudflare'
 *
 * export default {
 *   plugins: [
 *     cloudflarePlugin({
 *       apiToken: env.CLOUDFLARE_API_TOKEN,
 *       accountId: env.CLOUDFLARE_ACCOUNT_ID,
 *       zoneId: env.CLOUDFLARE_ZONE_ID
 *     })
 *   ]
 * }
 * ```
 */
export declare const cloudflarePlugin: LifecyclePlugin;
/**
 * Create Cloudflare plugin with configuration
 *
 * @example
 * ```typescript
 * createCloudflarePlugin({
 *   apiToken: env.CLOUDFLARE_API_TOKEN,
 *   accountId: env.CLOUDFLARE_ACCOUNT_ID,
 *   zoneId: env.CLOUDFLARE_ZONE_ID
 * })
 * ```
 */
export declare function createCloudflarePlugin(config: CloudflarePluginConfig): LifecyclePlugin;
export default cloudflarePlugin;
//# sourceMappingURL=index.d.ts.map