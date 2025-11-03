/**
 * Workers-Compatible Configuration Loader
 *
 * Config loading strategies that work in Cloudflare Workers environment.
 * No filesystem dependencies - uses environment variables, direct objects,
 * KV storage, or bundled imports.
 */
import type { ConductorConfig } from './types';
import { Result } from '../types/result';
/**
 * Configuration source types
 */
export type ConfigSource = {
    type: 'object';
    config: Partial<ConductorConfig>;
} | {
    type: 'env';
    env: Record<string, string>;
} | {
    type: 'kv';
    namespace: KVNamespace;
    key?: string;
} | {
    type: 'imported';
    module: {
        default: Partial<ConductorConfig>;
    };
};
/**
 * Create configuration from source (Workers-compatible)
 *
 * @example Direct object
 * ```typescript
 * const config = await createConfig({
 *   type: 'object',
 *   config: { docs: { useAI: true } }
 * });
 * ```
 *
 * @example Environment variables
 * ```typescript
 * const config = await createConfig({
 *   type: 'env',
 *   env: process.env  // or Cloudflare env bindings
 * });
 * ```
 *
 * @example KV storage
 * ```typescript
 * const config = await createConfig({
 *   type: 'kv',
 *   namespace: env.CONDUCTOR_KV
 * });
 * ```
 *
 * @example Bundled import (Wrangler bundles this)
 * ```typescript
 * import config from './conductor.config';
 * const result = await createConfig({
 *   type: 'imported',
 *   module: config
 * });
 * ```
 */
export declare function createConfig(source?: ConfigSource): Promise<Result<ConductorConfig, Error>>;
/**
 * Get config value with type safety
 */
export declare function getConfigValue<K extends keyof ConductorConfig>(config: ConductorConfig, key: K): ConductorConfig[K];
//# sourceMappingURL=loader-workers.d.ts.map