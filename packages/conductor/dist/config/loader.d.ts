/**
 * Configuration Loader (CLI-only)
 *
 * Load and validate Conductor configuration files from the filesystem.
 *
 * ⚠️ WARNING: This module uses Node.js filesystem APIs and is designed EXCLUSIVELY
 * for CLI tools that run in Node.js. These functions will NOT work on Cloudflare Workers.
 *
 * For Worker runtime configuration, use `createConfig()` from './loader-workers.js'
 * which supports environment variables, KV storage, and direct object configuration.
 */
import type { ConductorConfig } from './types.js';
import { Result } from '../types/result.js';
/**
 * Load configuration from project directory (CLI-only)
 *
 * ⚠️ WARNING: Uses Node.js `fs/promises` - will NOT work on Cloudflare Workers.
 * For Worker runtime, use `createConfig()` from './loader-workers.js'.
 *
 * @param projectPath - Path to the project directory
 * @returns Result with ConductorConfig or Error
 */
export declare function loadConfig(projectPath: string): Promise<Result<ConductorConfig, Error>>;
/**
 * Load configuration synchronously (CLI-only)
 *
 * ⚠️ WARNING: This function uses Node.js `fs` module and will NOT work on Cloudflare Workers.
 * It is designed exclusively for CLI tools and build-time operations.
 * For Worker runtime, configuration should be passed via environment variables or bindings.
 *
 * @param projectPath - Path to the project directory
 * @returns ConductorConfig - Merged configuration with defaults
 */
export declare function loadConfigSync(projectPath: string): ConductorConfig;
/**
 * Get config value with type safety
 */
export declare function getConfigValue<K extends keyof ConductorConfig>(config: ConductorConfig, key: K): ConductorConfig[K];
//# sourceMappingURL=loader.d.ts.map