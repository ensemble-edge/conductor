/**
 * API Config Middleware
 *
 * Injects API configuration (Execute API controls) into Hono context.
 * This allows the execute routes to read the user's api.execution settings
 * from conductor.config.ts.
 */
import type { MiddlewareHandler } from 'hono';
import type { ApiConfig } from '../../config/types.js';
/**
 * Default API config
 */
export declare const DEFAULT_API_CONFIG: ApiConfig;
/**
 * Create a resolved API config with defaults
 */
export declare function createApiConfig(config?: Partial<ApiConfig>): ApiConfig;
/**
 * Create middleware that injects API config into context
 *
 * @param config - Partial API config to merge with defaults
 * @returns Middleware handler
 *
 * @example
 * ```typescript
 * app.use('*', apiConfig({
 *   execution: {
 *     agents: { requireExplicit: true },
 *     ensembles: { requireExplicit: false },
 *   }
 * }))
 *
 * // Later in route handler:
 * const config = c.get('apiConfig')
 * if (config.execution?.agents?.requireExplicit) {
 *   // Strict mode: only execute if apiExecutable: true
 * }
 * ```
 */
export declare function apiConfig(config?: Partial<ApiConfig>): MiddlewareHandler;
//# sourceMappingURL=api-config.d.ts.map