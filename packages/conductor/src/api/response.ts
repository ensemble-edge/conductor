/**
 * Response Utilities for Conductor API
 *
 * Provides consistent response formatting with:
 * - Standardized JSON structure
 * - Context-bound and context-free helpers
 * - Stealth mode support for auth failures
 *
 * @module api/response
 */

import type { Context } from 'hono'
import type { ConductorContext } from './types.js'

// ==================== Response Shapes ====================

/**
 * Standard success response structure
 */
export interface SuccessResponse<T> {
  success: true
  data: T
  timestamp: string
  requestId?: string
}

/**
 * Standard error response structure
 */
export interface ErrorResponseBody {
  success: false
  error: string
  code?: string
  message?: string
  details?: unknown
  timestamp: string
  requestId?: string
}

/**
 * Stealth mode 404 - identical to real 404
 */
export interface NotFoundResponse {
  success: false
  error: 'Not Found'
  message: 'The requested resource could not be found.'
  timestamp: string
}

// ==================== Cache Header Options ====================

/**
 * HTTP Cache-Control header options
 */
export interface CacheHeaderOptions {
  /** Cache-Control: max-age=N (seconds) */
  maxAge?: number
  /** Cache-Control: public (CDN can cache) */
  public?: boolean
  /** Cache-Control: private (browser only, not CDN) */
  private?: boolean
  /** Cache-Control: no-cache (must revalidate) */
  noCache?: boolean
  /** Cache-Control: no-store (don't cache at all) */
  noStore?: boolean
  /** stale-while-revalidate=N (seconds) */
  staleWhileRevalidate?: number
  /** stale-if-error=N (seconds) */
  staleIfError?: number
  /** Vary header values */
  vary?: string[]
  /** Custom Cache-Control directives */
  custom?: string
}

// ==================== Context-Bound Response Creators ====================
// Use these in HTTP handlers with Hono context

/**
 * Create successful API response
 *
 * @example
 * ```ts
 * return success(c, { users: [...] })
 * return success(c, data, { status: 201, cache: { maxAge: 300 } })
 * ```
 */
export function success<T>(
  c: ConductorContext,
  data: T,
  options?: {
    status?: number
    cache?: CacheHeaderOptions
    headers?: Record<string, string>
  }
): Response {
  const requestId = c.get('requestId')
  const status = options?.status ?? 200

  // Apply cache headers if provided
  if (options?.cache) {
    applyCacheHeaders(c, options.cache)
  }

  // Apply custom headers if provided
  if (options?.headers) {
    for (const [key, value] of Object.entries(options.headers)) {
      c.header(key, value)
    }
  }

  const body: SuccessResponse<T> = {
    success: true,
    data,
    timestamp: new Date().toISOString(),
    ...(requestId && { requestId }),
  }

  return c.json(body, status as any)
}

/**
 * Create error API response
 * In stealth mode, auth errors become 404s
 *
 * @example
 * ```ts
 * return error(c, 'User not found', { status: 404, code: 'USER_NOT_FOUND' })
 * return error(c, 'Unauthorized', { status: 401, isAuthError: true })
 * ```
 */
export function error(
  c: ConductorContext,
  message: string,
  options?: {
    status?: number
    code?: string
    details?: unknown
    isAuthError?: boolean
  }
): Response {
  const requestId = c.get('requestId')
  const status = options?.status ?? 500

  // Check for stealth mode - auth errors become 404
  const stealthMode = c.get('stealthMode')
  if (stealthMode && options?.isAuthError) {
    return stealthNotFound(c)
  }

  const body: ErrorResponseBody = {
    success: false,
    error: getErrorName(status),
    message,
    timestamp: new Date().toISOString(),
  }
  if (options?.code) body.code = options.code
  if (options?.details) body.details = options.details
  if (requestId) body.requestId = requestId

  return c.json(body, status as any)
}

/**
 * Create stealth 404 response
 * Used for auth failures when stealth mode is enabled
 * Returns identical response to real 404
 */
export function stealthNotFound(c: ConductorContext): Response {
  const body: NotFoundResponse = {
    success: false,
    error: 'Not Found',
    message: 'The requested resource could not be found.',
    timestamp: new Date().toISOString(),
  }

  return c.json(body, 404)
}

/**
 * Create stealth 404 with timing attack protection
 * Uses scheduler.wait() if available (requires paid plan)
 */
export async function stealthNotFoundWithDelay(c: ConductorContext): Promise<Response> {
  const stealthDelayMs = c.get('stealthDelayMs') ?? 50
  const startTime = c.get('startTime')

  if (stealthDelayMs > 0 && startTime) {
    const elapsed = Date.now() - startTime
    const remaining = Math.max(0, stealthDelayMs - elapsed)

    if (remaining > 0) {
      try {
        // scheduler.wait() requires paid Workers plan
        // @ts-ignore scheduler is globally available in Workers runtime
        await scheduler.wait(remaining)
      } catch {
        // scheduler.wait not available (free tier) - continue without delay
      }
    }
  }

  return stealthNotFound(c)
}

/**
 * Create health check response
 */
export function health(
  c: ConductorContext,
  status: 'healthy' | 'degraded' | 'unhealthy',
  details?: Record<string, unknown>
): Response {
  const httpStatus = status === 'healthy' ? 200 : status === 'degraded' ? 200 : 503

  return c.json(
    {
      status,
      timestamp: new Date().toISOString(),
      ...(details && { details }),
    },
    httpStatus as any
  )
}

// ==================== Context-Free Response Creators ====================
// Use these in queue handlers, scheduled jobs, or anywhere without Hono context

/**
 * Create response body for success (no context required)
 * Returns plain object suitable for JSON serialization
 */
export function successBody<T>(data: T, requestId?: string): SuccessResponse<T> {
  return {
    success: true,
    data,
    timestamp: new Date().toISOString(),
    ...(requestId && { requestId }),
  }
}

/**
 * Create response body for error (no context required)
 */
export function errorBody(
  message: string,
  options?: {
    code?: string
    details?: unknown
    requestId?: string
    status?: number
  }
): ErrorResponseBody {
  const body: ErrorResponseBody = {
    success: false,
    error: getErrorName(options?.status ?? 500),
    message,
    timestamp: new Date().toISOString(),
  }
  if (options?.code) body.code = options.code
  if (options?.details) body.details = options.details
  if (options?.requestId) body.requestId = options.requestId
  return body
}

/**
 * Create Response object without Hono context
 * Useful for queue handlers returning HTTP-like responses
 */
export function successResponse<T>(
  data: T,
  options?: {
    status?: number
    headers?: Record<string, string>
    requestId?: string
  }
): Response {
  const body = successBody(data, options?.requestId)
  const headers = new Headers({
    'Content-Type': 'application/json',
    ...options?.headers,
  })

  return new Response(JSON.stringify(body), {
    status: options?.status ?? 200,
    headers,
  })
}

/**
 * Create error Response object without Hono context
 */
export function errorResponse(
  message: string,
  options?: {
    status?: number
    code?: string
    headers?: Record<string, string>
    requestId?: string
  }
): Response {
  const body = errorBody(message, options)
  const headers = new Headers({
    'Content-Type': 'application/json',
    ...options?.headers,
  })

  return new Response(JSON.stringify(body), {
    status: options?.status ?? 500,
    headers,
  })
}

// ==================== Helper Functions ====================

/**
 * Apply cache headers to response
 */
export function applyCacheHeaders(c: Context, options: CacheHeaderOptions): void {
  const directives: string[] = []

  if (options.public) directives.push('public')
  if (options.private) directives.push('private')
  if (options.noCache) directives.push('no-cache')
  if (options.noStore) directives.push('no-store')
  if (options.maxAge !== undefined) directives.push(`max-age=${options.maxAge}`)
  if (options.staleWhileRevalidate) {
    directives.push(`stale-while-revalidate=${options.staleWhileRevalidate}`)
  }
  if (options.staleIfError) directives.push(`stale-if-error=${options.staleIfError}`)
  if (options.custom) directives.push(options.custom)

  if (directives.length > 0) {
    c.header('Cache-Control', directives.join(', '))
  }

  // Merge Vary headers
  if (options.vary?.length) {
    const existingVary = c.res.headers.get('Vary')
    const varySet = new Set(existingVary ? existingVary.split(',').map((v) => v.trim()) : [])
    options.vary.forEach((v) => varySet.add(v))
    c.header('Vary', Array.from(varySet).join(', '))
  }
}

/**
 * Build Cache-Control header string from options
 */
export function buildCacheControl(options: CacheHeaderOptions): string {
  const directives: string[] = []

  if (options.public) directives.push('public')
  if (options.private) directives.push('private')
  if (options.noCache) directives.push('no-cache')
  if (options.noStore) directives.push('no-store')
  if (options.maxAge !== undefined) directives.push(`max-age=${options.maxAge}`)
  if (options.staleWhileRevalidate) {
    directives.push(`stale-while-revalidate=${options.staleWhileRevalidate}`)
  }
  if (options.staleIfError) directives.push(`stale-if-error=${options.staleIfError}`)
  if (options.custom) directives.push(options.custom)

  return directives.join(', ')
}

/**
 * Map HTTP status code to error name
 */
function getErrorName(status: number): string {
  const names: Record<number, string> = {
    400: 'Bad Request',
    401: 'Unauthorized',
    403: 'Forbidden',
    404: 'Not Found',
    405: 'Method Not Allowed',
    409: 'Conflict',
    422: 'Unprocessable Entity',
    429: 'Too Many Requests',
    500: 'Internal Server Error',
    502: 'Bad Gateway',
    503: 'Service Unavailable',
    504: 'Gateway Timeout',
  }
  return names[status] || 'Error'
}
