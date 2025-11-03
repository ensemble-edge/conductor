/**
 * Request ID Middleware
 *
 * Generates unique request ID for tracing and debugging.
 */

import type { MiddlewareHandler } from 'hono'
import type { ConductorContext } from '../types'

export function requestId(): MiddlewareHandler {
  return async (c: ConductorContext, next) => {
    // Check if request ID already exists in header
    let reqId = c.req.header('X-Request-ID')

    // Generate new ID if not present
    if (!reqId) {
      reqId = generateRequestId()
    }

    // Set in context
    c.set('requestId', reqId)

    // Set in response header
    c.header('X-Request-ID', reqId)

    await next()
  }
}

/**
 * Generate cryptographically secure unique request ID
 */
function generateRequestId(): string {
  // Use crypto.randomUUID() for secure, unpredictable request IDs
  return `req_${crypto.randomUUID()}`
}
