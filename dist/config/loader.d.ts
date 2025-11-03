/**
 * Configuration Loader
 *
 * Load and validate Conductor configuration files.
 */
import type { ConductorConfig } from './types';
import { Result } from '../types/result';
/**
 * Load configuration from project directory
 */
export declare function loadConfig(projectPath: string): Promise<Result<ConductorConfig, Error>>;
/**
 * Load configuration synchronously (for templates)
 */
export declare function loadConfigSync(projectPath: string): ConductorConfig;
/**
 * Get config value with type safety
 */
export declare function getConfigValue<K extends keyof ConductorConfig>(config: ConductorConfig, key: K): ConductorConfig[K];
//# sourceMappingURL=loader.d.ts.map