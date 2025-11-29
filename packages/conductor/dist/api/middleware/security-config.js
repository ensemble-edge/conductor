/**
 * Security Config Middleware
 *
 * Injects security configuration into Hono context.
 * This eliminates global mutable state - config is passed per-request.
 */
import { createSecurityConfig } from '../../config/security.js';
/**
 * Create middleware that injects security config into context
 *
 * @param config - Partial security config to merge with defaults
 * @returns Middleware handler
 *
 * @example
 * ```typescript
 * app.use('*', securityConfig({
 *   requireAuth: true,
 *   allowDirectAgentExecution: false,
 * }))
 *
 * // Later in route handler:
 * const config = c.get('securityConfig')
 * if (isDirectAgentExecutionAllowed(config)) {
 *   // ...
 * }
 * ```
 */
export function securityConfig(config = {}) {
    const resolvedConfig = createSecurityConfig(config);
    return async (c, next) => {
        c.set('securityConfig', resolvedConfig);
        await next();
    };
}
