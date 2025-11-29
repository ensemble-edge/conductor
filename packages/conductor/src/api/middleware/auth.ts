/**
 * Authentication Middleware
 *
 * Validates API keys and sets auth context.
 * Supports stealth mode to hide API structure from unauthenticated users.
 *
 * @module api/middleware/auth
 */

import type { MiddlewareHandler } from 'hono'
import type { ConductorContext, AuthConfig, AuthContext } from '../types.js'

/**
 * Extended auth config with stealth mode support
 */
export interface ExtendedAuthConfig extends AuthConfig {
  /**
   * Stealth mode - return generic 404 for all auth failures
   * Hides API structure from unauthenticated users
   * @default false
   */
  stealthMode?: boolean

  /**
   * Minimum response time (ms) for stealth 404 responses
   * Helps prevent timing attacks that could reveal protected endpoints
   *
   * Note: Uses scheduler.wait() which requires:
   * - Cloudflare Workers: Paid plan (Workers Unbound or Workers Paid)
   * - Netlify: Next plan or higher
   *
   * On free tiers, delay is gracefully skipped (no error, no timing protection)
   * Set to 0 to disable timing protection entirely
   *
   * @default 50
   */
  stealthDelayMs?: number
}

/**
 * Create authentication middleware
 *
 * @example
 * ```ts
 * // Standard auth
 * app.use('/api/*', createAuthMiddleware({
 *   apiKeys: ['key1', 'key2'],
 * }))
 *
 * // With stealth mode
 * app.use('/api/*', createAuthMiddleware({
 *   apiKeys: ['key1', 'key2'],
 *   stealthMode: true,
 *   stealthDelayMs: 50,
 * }))
 * ```
 */
export function createAuthMiddleware(config: ExtendedAuthConfig): MiddlewareHandler {
  return async (c: ConductorContext, next) => {
    // Store stealth settings in context for use by other middleware
    if (config.stealthMode) {
      c.set('stealthMode', true)
      c.set('stealthDelayMs', config.stealthDelayMs ?? 50)
    }

    // Extract API key from header
    const apiKey =
      c.req.header('X-API-Key') || c.req.header('Authorization')?.replace('Bearer ', '')

    // Check if anonymous access is allowed
    if (!apiKey && config.allowAnonymous) {
      c.set('auth', {
        authenticated: false,
        tier: 'free',
      } as AuthContext)
      await next()
      return
    }

    // Validate API key - return stealth 404 if stealth mode enabled
    if (!apiKey) {
      if (config.stealthMode) {
        return stealthNotFound(c, config.stealthDelayMs)
      }
      return c.json(
        {
          error: 'Unauthorized',
          message: 'API key is required',
          timestamp: Date.now(),
        },
        401
      )
    }

    // Check if API key is valid
    const isValid = config.apiKeys?.includes(apiKey)
    if (!isValid) {
      if (config.stealthMode) {
        return stealthNotFound(c, config.stealthDelayMs)
      }
      return c.json(
        {
          error: 'Unauthorized',
          message: 'Invalid credentials',
          timestamp: Date.now(),
        },
        401
      )
    }

    // Set auth context
    // In production, look up user details from database
    c.set('auth', {
      authenticated: true,
      apiKey: apiKey,
      userId: `user_${apiKey.substring(0, 8)}`,
      tier: 'pro',
    } as AuthContext)

    await next()
  }
}

/**
 * Require authentication middleware
 * Used after createAuthMiddleware to enforce authentication
 */
export function requireAuth(options?: { stealthMode?: boolean }): MiddlewareHandler {
  return async (c: ConductorContext, next) => {
    const auth = c.get('auth')
    const stealthMode = options?.stealthMode ?? c.get('stealthMode')

    if (!auth?.authenticated) {
      if (stealthMode) {
        const stealthDelayMs = c.get('stealthDelayMs') ?? 50
        return stealthNotFound(c, stealthDelayMs)
      }
      return c.json(
        {
          error: 'Unauthorized',
          message: 'Authentication required',
          timestamp: Date.now(),
        },
        401
      )
    }

    await next()
  }
}

/**
 * Return stealth 404 response with optional timing protection
 *
 * The response is identical to a real 404 to hide API structure.
 * Optional delay prevents timing attacks that could reveal endpoint existence.
 */
async function stealthNotFound(c: ConductorContext, delayMs?: number): Promise<Response> {
  const delay = delayMs ?? 50

  if (delay > 0) {
    const startTime = c.get('startTime')
    if (startTime) {
      const elapsed = Date.now() - startTime
      const remaining = Math.max(0, delay - elapsed)

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
  }

  // Return response identical to real 404
  return c.json(
    {
      success: false,
      error: 'Not Found',
      message: 'The requested resource could not be found.',
      timestamp: new Date().toISOString(),
    },
    404
  )
}
