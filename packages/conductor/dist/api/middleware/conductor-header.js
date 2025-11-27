/**
 * Conductor Header Middleware
 *
 * Adds X-Powered-By: Ensemble-Edge Conductor header to responses.
 * Useful for debugging and identification, but can be disabled in production.
 *
 * @module api/middleware/conductor-header
 */
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
export function conductorHeader(config) {
    const enabled = config?.enabled ?? true;
    const productName = config?.productName ?? 'Ensemble-Edge Conductor';
    return async (c, next) => {
        await next();
        if (!enabled)
            return;
        // Skip if response body is already streaming
        if (c.res.body && 'locked' in c.res.body && c.res.body.locked) {
            return;
        }
        c.header('X-Powered-By', productName);
    };
}
