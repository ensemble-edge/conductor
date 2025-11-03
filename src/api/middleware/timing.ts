/**
 * Timing Middleware
 *
 * Tracks request duration and adds timing headers.
 */

import type { MiddlewareHandler } from 'hono'
import type { ConductorContext } from '../types'

export function timing(): MiddlewareHandler {
  return async (c: ConductorContext, next) => {
    const startTime = Date.now()
    c.set('startTime', startTime)

    await next()

    const duration = Date.now() - startTime
    c.header('X-Response-Time', `${duration}ms`)
  }
}
