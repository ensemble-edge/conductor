/**
 * Debug Headers Middleware
 *
 * Adds diagnostic headers in development/preview environments.
 * Automatically disabled in production for security.
 *
 * @module api/middleware/debug-headers
 */
import type { MiddlewareHandler } from 'hono';
/**
 * Debug headers configuration
 */
export interface DebugHeadersConfig {
    /**
     * Force enable/disable (otherwise auto-detect from env)
     * When undefined, checks ENVIRONMENT env var
     */
    enabled?: boolean;
    /**
     * Include execution duration header
     * @default true
     */
    includeDuration?: boolean;
    /**
     * Include cache hit/miss indicator
     * @default true
     */
    includeCacheStatus?: boolean;
    /**
     * Include ensemble name
     * @default true
     */
    includeEnsembleName?: boolean;
    /**
     * Include agent execution details
     * @default false (can expose internal structure)
     */
    includeAgentDetails?: boolean;
}
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
export declare function debugHeaders(config?: DebugHeadersConfig): MiddlewareHandler;
/**
 * Check if environment is production
 */
export declare function isProductionEnvironment(env?: Env): boolean;
//# sourceMappingURL=debug-headers.d.ts.map