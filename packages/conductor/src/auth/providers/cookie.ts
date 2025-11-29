/**
 * Cookie Session Authentication Provider
 *
 * Session-based authentication using cookies and KV storage
 *
 * Features:
 * - Session management with KV
 * - Secure cookie handling
 * - Session expiration
 * - CSRF protection
 * - Remember me support
 *
 * @see https://developers.cloudflare.com/kv
 */

import type { AuthValidator, AuthValidationResult, AuthContext, SessionData } from '../types.js'
import type { ConductorEnv } from '../../types/env.js'
import { createLogger } from '../../observability/index.js'

const logger = createLogger({ serviceName: 'auth-cookie' })

/**
 * Cookie session configuration
 */
export interface CookieConfig {
  /** KV namespace binding name for sessions */
  kvNamespace: string

  /** Cookie name */
  cookieName?: string

  /** Cookie domain */
  domain?: string

  /** Cookie path */
  path?: string

  /** Secure flag (https only) */
  secure?: boolean

  /** HttpOnly flag */
  httpOnly?: boolean

  /** SameSite policy */
  sameSite?: 'strict' | 'lax' | 'none'

  /** Session TTL in seconds */
  sessionTTL?: number
}

/**
 * Cookie Session Validator
 */
export class CookieValidator implements AuthValidator {
  constructor(private config: CookieConfig) {}

  /**
   * Extract session token from cookie
   */
  extractToken(request: Request): string | null {
    const cookieName = this.config.cookieName || 'session_token'
    const cookieHeader = request.headers.get('Cookie')

    if (!cookieHeader) {
      return null
    }

    // Parse cookies
    const cookies = cookieHeader.split(';').map((c) => c.trim())
    for (const cookie of cookies) {
      const [name, value] = cookie.split('=')
      if (name === cookieName && value) {
        return decodeURIComponent(value)
      }
    }

    return null
  }

  /**
   * Validate session token format
   */
  private isValidFormat(token: string): boolean {
    // Session tokens should be long random strings (UUIDs, etc.)
    return Boolean(token && token.length >= 16 && token.length <= 512)
  }

  /**
   * Validate cookie session
   */
  async validate(request: Request, env: ConductorEnv): Promise<AuthValidationResult> {
    const sessionToken = this.extractToken(request)

    // No session token provided
    if (!sessionToken) {
      return {
        valid: false,
        error: 'invalid_token',
        message: 'No session token provided',
      }
    }

    // Invalid format
    if (!this.isValidFormat(sessionToken)) {
      return {
        valid: false,
        error: 'invalid_token',
        message: 'Invalid session token format',
      }
    }

    // Get KV namespace
    const kv = env[this.config.kvNamespace]
    if (!kv) {
      logger.error(`KV namespace "${this.config.kvNamespace}" not found in env`)
      return {
        valid: false,
        error: 'unknown',
        message: 'Authentication service error',
      }
    }

    // Look up session in KV
    try {
      const sessionJson = await kv.get(`session:${sessionToken}`)
      if (!sessionJson) {
        return {
          valid: false,
          error: 'invalid_token',
          message: 'Invalid or expired session',
        }
      }

      const session: SessionData = JSON.parse(sessionJson)

      // Check expiration
      if (session.expiresAt && Date.now() > session.expiresAt) {
        // Delete expired session
        await kv.delete(`session:${sessionToken}`)
        return {
          valid: false,
          error: 'expired',
          message: 'Session has expired',
        }
      }

      // Build auth context
      const context: AuthContext = {
        authenticated: true,
        method: 'cookie',
        token: sessionToken,
        user: {
          id: session.userId,
          email: session.email,
          roles: session.roles || [],
          permissions: session.permissions || [],
          metadata: {
            ...session.metadata,
            sessionId: session.sessionId,
            sessionCreated: session.createdAt,
          },
        },
        expiresAt: session.expiresAt,
      }

      return {
        valid: true,
        context,
      }
    } catch (error) {
      logger.error('Cookie session validation error', error as Error)
      return {
        valid: false,
        error: 'unknown',
        message: 'Authentication validation failed',
      }
    }
  }

  /**
   * Create session cookie header
   */
  createCookie(sessionToken: string, options?: { maxAge?: number; expires?: Date }): string {
    const cookieName = this.config.cookieName || 'session_token'
    const parts: string[] = [`${cookieName}=${encodeURIComponent(sessionToken)}`]

    if (this.config.domain) {
      parts.push(`Domain=${this.config.domain}`)
    }

    if (this.config.path || this.config.path === '') {
      parts.push(`Path=${this.config.path}`)
    } else {
      parts.push('Path=/')
    }

    if (options?.maxAge !== undefined) {
      parts.push(`Max-Age=${options.maxAge}`)
    } else if (options?.expires) {
      parts.push(`Expires=${options.expires.toUTCString()}`)
    }

    if (this.config.secure !== false) {
      parts.push('Secure')
    }

    if (this.config.httpOnly !== false) {
      parts.push('HttpOnly')
    }

    const sameSite = this.config.sameSite || 'lax'
    parts.push(`SameSite=${sameSite.charAt(0).toUpperCase() + sameSite.slice(1)}`)

    return parts.join('; ')
  }

  /**
   * Create session in KV
   */
  async createSession(
    kv: KVNamespace,
    sessionData: Omit<SessionData, 'sessionId' | 'createdAt' | 'expiresAt'> & { expiresAt?: number }
  ): Promise<string> {
    // Generate session token
    const sessionToken = crypto.randomUUID()
    const sessionId = crypto.randomUUID()

    const now = Date.now()
    const ttl = this.config.sessionTTL || 86400 // 24 hours default
    const expiresAt = sessionData.expiresAt || now + ttl * 1000

    const session: SessionData = {
      ...sessionData,
      sessionId,
      createdAt: now,
      expiresAt,
    }

    // Store in KV with TTL
    await kv.put(`session:${sessionToken}`, JSON.stringify(session), { expirationTtl: ttl })

    return sessionToken
  }

  /**
   * Delete session from KV
   */
  async deleteSession(kv: KVNamespace, sessionToken: string): Promise<void> {
    await kv.delete(`session:${sessionToken}`)
  }
}

/**
 * Create Cookie validator from environment
 */
export function createCookieValidator(env: ConductorEnv): CookieValidator | null {
  // KV namespace must be configured
  const kvNamespace = env.SESSION_KV_NAMESPACE || 'SESSIONS'

  // Check if KV namespace exists
  if (!env[kvNamespace]) {
    return null
  }

  return new CookieValidator({
    kvNamespace,
    cookieName: env.SESSION_COOKIE_NAME || 'session_token',
    domain: env.SESSION_COOKIE_DOMAIN,
    path: env.SESSION_COOKIE_PATH || '/',
    secure: env.SESSION_COOKIE_SECURE !== 'false',
    httpOnly: env.SESSION_COOKIE_HTTP_ONLY !== 'false',
    sameSite: (env.SESSION_COOKIE_SAME_SITE as 'strict' | 'lax' | 'none') || 'lax',
    sessionTTL: env.SESSION_TTL ? parseInt(env.SESSION_TTL) : 86400,
  })
}
