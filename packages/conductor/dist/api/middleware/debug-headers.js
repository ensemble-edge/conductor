/**
 * Debug Headers Middleware
 *
 * Adds diagnostic headers in development/preview environments.
 * Automatically disabled in production for security.
 *
 * @module api/middleware/debug-headers
 */
/**
 * Debug headers middleware
 *
 * Adds useful debugging information to response headers.
 * Disabled by default in production environments.
 *
 * Headers added:
 * - X-Conductor-Duration: Request processing time
 * - X-Conductor-Cache: HIT or MISS (if cache was used)
 * - X-Conductor-Ensemble: Name of executed ensemble
 * - X-Conductor-Agents: Comma-separated list of agents (if enabled)
 *
 * @example
 * ```ts
 * // Auto-detect (enabled in dev, disabled in prod)
 * app.use('*', debugHeaders())
 *
 * // Force enable
 * app.use('*', debugHeaders({ enabled: true }))
 *
 * // Custom config
 * app.use('*', debugHeaders({
 *   includeDuration: true,
 *   includeAgentDetails: true,
 * }))
 * ```
 */
export function debugHeaders(config) {
    const includeDuration = config?.includeDuration ?? true;
    const includeCacheStatus = config?.includeCacheStatus ?? true;
    const includeEnsembleName = config?.includeEnsembleName ?? true;
    const includeAgentDetails = config?.includeAgentDetails ?? false;
    return async (c, next) => {
        await next();
        // Determine if debug headers should be added
        // Access typed environment variables from ConductorEnv
        const isProduction = c.env?.ENVIRONMENT === 'production' || c.env?.NODE_ENV === 'production';
        const enabled = config?.enabled ?? !isProduction;
        if (!enabled)
            return;
        // Skip if response body is already streaming
        if (c.res.body && 'locked' in c.res.body && c.res.body.locked) {
            return;
        }
        // Duration header
        if (includeDuration) {
            const startTime = c.get('startTime');
            if (startTime) {
                const duration = Date.now() - startTime;
                c.header('X-Conductor-Duration', `${duration}ms`);
            }
        }
        // Cache status header
        if (includeCacheStatus) {
            const cacheHit = c.get('cacheHit');
            if (cacheHit !== undefined) {
                c.header('X-Conductor-Cache', cacheHit ? 'HIT' : 'MISS');
            }
        }
        // Ensemble name header
        if (includeEnsembleName) {
            const ensembleName = c.get('ensembleName');
            if (ensembleName) {
                c.header('X-Conductor-Ensemble', ensembleName);
            }
        }
        // Agent details header (disabled by default - can expose internal structure)
        if (includeAgentDetails) {
            const agents = c.get('executedAgents');
            if (agents && Array.isArray(agents) && agents.length > 0) {
                c.header('X-Conductor-Agents', agents.join(', '));
            }
        }
    };
}
/**
 * Check if environment is production
 */
export function isProductionEnvironment(env) {
    if (!env)
        return false;
    return (env.ENVIRONMENT === 'production' ||
        env.NODE_ENV === 'production' ||
        env.CF_PAGES_BRANCH === 'main');
}
