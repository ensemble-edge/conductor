/**
 * Conductor Header Middleware
 *
 * Adds X-Powered-By: Ensemble-Edge Conductor header to responses.
 * Useful for debugging and identification, but can be disabled in production.
 *
 * @module api/middleware/conductor-header
 */
import type { MiddlewareHandler } from 'hono';
/**
 * Conductor header configuration
 */
export interface ConductorHeaderConfig {
    /**
     * Enable the X-Powered-By header
     * @default true
     */
    enabled?: boolean;
    /**
     * Custom product name
     * @default 'Ensemble-Edge Conductor'
     */
    productName?: string;
}
/**
 * Conductor header middleware
 *
 * Adds identification header for debugging and transparency.
 * Note: We intentionally don't include version numbers to avoid fingerprinting.
 *
 * @example
 * ```ts
 * // Enable (default)
 * app.use('*', conductorHeader())
 *
 * // Disable in production
 * app.use('*', conductorHeader({ enabled: env.NODE_ENV !== 'production' }))
 *
 * // Custom product name
 * app.use('*', conductorHeader({ productName: 'My Custom API' }))
 * ```
 */
export declare function conductorHeader(config?: ConductorHeaderConfig): MiddlewareHandler;
//# sourceMappingURL=conductor-header.d.ts.map