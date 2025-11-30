/**
 * API Config Middleware
 *
 * Injects API configuration (Execute API controls) into Hono context.
 * This allows the execute routes to read the user's api.execution settings
 * from conductor.config.ts.
 */
import { DEFAULT_CONFIG } from '../../config/types.js';
/**
 * Default API config
 */
export const DEFAULT_API_CONFIG = DEFAULT_CONFIG.api ?? {
    execution: {
        agents: { requireExplicit: false },
        ensembles: { requireExplicit: false },
    },
};
/**
 * Create a resolved API config with defaults
 */
export function createApiConfig(config = {}) {
    return {
        execution: {
            agents: {
                requireExplicit: config.execution?.agents?.requireExplicit ??
                    DEFAULT_API_CONFIG.execution?.agents?.requireExplicit ??
                    false,
            },
            ensembles: {
                requireExplicit: config.execution?.ensembles?.requireExplicit ??
                    DEFAULT_API_CONFIG.execution?.ensembles?.requireExplicit ??
                    false,
            },
        },
    };
}
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
export function apiConfig(config = {}) {
    const resolvedConfig = createApiConfig(config);
    return async (c, next) => {
        c.set('apiConfig', resolvedConfig);
        await next();
    };
}
