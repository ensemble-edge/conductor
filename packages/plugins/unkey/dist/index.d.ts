/**
 * @conductor/unkey
 *
 * Unkey authentication plugin for Conductor
 * Provides API key validation, creation, and management
 */
import type { LifecyclePlugin } from '@ensemble-edge/conductor';
export interface UnkeyPluginConfig {
    /** Unkey root key (for management operations) */
    rootKey?: string;
    /** Unkey API ID (for validation) */
    apiId?: string;
    /** Enable caching of validation results */
    cache?: boolean;
    /** Cache TTL in seconds */
    cacheTtl?: number;
}
export interface UnkeyValidateConfig {
    /** API key to validate */
    apiKey: string;
    /** Optional: Unkey API ID (overrides plugin config) */
    apiId?: string;
}
export interface UnkeyCreateConfig {
    /** Unkey API ID */
    apiId?: string;
    /** Key prefix */
    prefix?: string;
    /** Bytes of randomness (default: 16) */
    byteLength?: number;
    /** Owner ID */
    ownerId?: string;
    /** Metadata */
    meta?: Record<string, any>;
    /** Expiration timestamp (ms) */
    expires?: number;
    /** Remaining requests */
    remaining?: number;
    /** Refill configuration */
    refill?: {
        interval: 'daily' | 'monthly';
        amount: number;
    };
    /** Rate limit */
    ratelimit?: {
        type: 'fast' | 'consistent';
        limit: number;
        duration: number;
    };
}
export interface UnkeyRevokeConfig {
    /** Key ID to revoke */
    keyId: string;
}
/**
 * Unkey Authentication Plugin
 *
 * Provides operations for API key management:
 * - unkey:validate - Validate API keys
 * - unkey:create - Create new API keys
 * - unkey:revoke - Revoke API keys
 *
 * @example
 * ```typescript
 * import { unkeyPlugin } from '@conductor/unkey'
 *
 * export default {
 *   plugins: [
 *     unkeyPlugin({
 *       rootKey: env.UNKEY_ROOT_KEY,
 *       apiId: env.UNKEY_API_ID
 *     })
 *   ]
 * }
 * ```
 */
export declare const unkeyPlugin: LifecyclePlugin;
/**
 * Create Unkey plugin with configuration
 *
 * @example
 * ```typescript
 * createUnkeyPlugin({
 *   rootKey: env.UNKEY_ROOT_KEY,
 *   apiId: env.UNKEY_API_ID,
 *   cache: true
 * })
 * ```
 */
export declare function createUnkeyPlugin(config: UnkeyPluginConfig): LifecyclePlugin;
export default unkeyPlugin;
//# sourceMappingURL=index.d.ts.map