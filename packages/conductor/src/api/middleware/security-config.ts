/**
 * Security Config Middleware
 *
 * Injects security configuration into Hono context.
 * This eliminates global mutable state - config is passed per-request.
 */

import type { MiddlewareHandler } from 'hono'
import type { SecurityConfig } from '../../config/security.js'
import { createSecurityConfig } from '../../config/security.js'

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
export function securityConfig(config: Partial<SecurityConfig> = {}): MiddlewareHandler {
  const resolvedConfig = createSecurityConfig(config)

  return async (c, next) => {
    c.set('securityConfig', resolvedConfig)
    await next()
  }
}
