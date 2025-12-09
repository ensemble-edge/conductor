/**
 * API Key Authentication Provider
 *
 * API key validation using KV storage
 *
 * Features:
 * - Multiple key sources (header, cookie)
 * - KV-based key storage
 * - Key prefix validation
 * - Metadata extraction
 * - Expiration checking
 *
 * @see https://developers.cloudflare.com/kv
 */

import type { AuthValidator, AuthValidationResult, AuthContext, ApiKeyMetadata } from '../types.js'
import type { ConductorEnv } from '../../types/env.js'
import { createLogger } from '../../observability/index.js'

const logger = createLogger({ serviceName: 'auth-apikey' })

/**
 * API Key configuration
 */
export interface ApiKeyConfig {
  /** KV namespace binding name */
  kvNamespace: string

  /** Key sources to check (default: ['header']) */
  sources?: ('header' | 'cookie')[]

  /** Header name for API key (default: 'X-API-Key') */
  headerName?: string

  /** Cookie name for API key (default: 'api_key') */
  cookieName?: string

  /** Expected key prefix (e.g., 'myapp_') */
  prefix?: string

  /** Enable stealth mode (404 instead of 401) */
  stealthMode?: boolean
}

/**
 * API Key Validator
 */
export class ApiKeyValidator implements AuthValidator {
  constructor(private config: ApiKeyConfig) {}

  /**
   * Extract API key from request
   *
   * Checks sources in order of preference: header → cookie
   */
  extractToken(request: Request): string | null {
    const sources = this.config.sources || ['header']
    const headerName = this.config.headerName || 'X-API-Key'
    const cookieName = this.config.cookieName || 'api_key'

    // Try header first (most secure)
    if (sources.includes('header')) {
      const headerValue = request.headers.get(headerName)
      if (headerValue) return headerValue
    }

    // Try cookie (reasonably secure with httpOnly)
    if (sources.includes('cookie')) {
      const cookieHeader = request.headers.get('Cookie')
      if (cookieHeader) {
        const cookies = cookieHeader.split(';').map((c) => c.trim())
        for (const cookie of cookies) {
          const [name, value] = cookie.split('=')
          if (name === cookieName && value) {
            return decodeURIComponent(value)
          }
        }
      }
    }

    return null
  }

  /**
   * Validate key format
   */
  private isValidFormat(apiKey: string): boolean {
    if (!apiKey) return false

    // Check prefix if configured
    if (this.config.prefix && !apiKey.startsWith(this.config.prefix)) {
      return false
    }

    // Basic format validation (non-empty, reasonable length)
    return apiKey.length >= 8 && apiKey.length <= 256
  }

  /**
   * Validate API key
   */
  async validate(request: Request, env: ConductorEnv): Promise<AuthValidationResult> {
    const apiKey = this.extractToken(request)

    // No API key provided
    if (!apiKey) {
      return {
        valid: false,
        error: 'invalid_token',
        message: 'No API key provided',
      }
    }

    // Invalid format
    if (!this.isValidFormat(apiKey)) {
      return {
        valid: false,
        error: 'invalid_token',
        message: 'Invalid API key format',
      }
    }

    // Get KV namespace
    const kv = env[this.config.kvNamespace]
    if (!kv) {
      logger.error(`KV namespace "${this.config.kvNamespace}" not found in env`, undefined, {
        kvNamespace: this.config.kvNamespace,
      })
      return {
        valid: false,
        error: 'unknown',
        message: 'Authentication service error',
      }
    }

    // Look up key in KV
    try {
      const metadataJson = await kv.get(apiKey)
      if (!metadataJson) {
        return {
          valid: false,
          error: 'invalid_token',
          message: 'Invalid API key',
        }
      }

      const metadata: ApiKeyMetadata = JSON.parse(metadataJson)

      // Check expiration
      if (metadata.expiresAt && Date.now() > metadata.expiresAt) {
        return {
          valid: false,
          error: 'expired',
          message: 'API key has expired',
        }
      }

      // Build auth context
      const context: AuthContext = {
        authenticated: true,
        method: 'apiKey',
        token: apiKey,
        user: {
          id: metadata.userId || metadata.keyId,
          permissions: metadata.permissions || [],
          roles: [],
          metadata: {
            ...metadata.metadata,
            keyId: metadata.keyId,
            keyName: metadata.name,
          },
        },
        expiresAt: metadata.expiresAt,
      }

      return {
        valid: true,
        context,
        ratelimit: metadata.rateLimit
          ? {
              limit: metadata.rateLimit.requests,
              remaining: metadata.rateLimit.requests, // TODO: Implement actual rate limiting
              reset: Math.floor(Date.now() / 1000) + metadata.rateLimit.window,
            }
          : undefined,
      }
    } catch (error) {
      logger.error('API key validation error', error instanceof Error ? error : undefined)
      return {
        valid: false,
        error: 'unknown',
        message: 'Authentication validation failed',
      }
    }
  }
}

/**
 * Create API Key validator from environment
 *
 * Environment variables:
 * - API_KEY_KV_NAMESPACE: KV binding name (default: 'API_KEYS')
 * - API_KEY_SOURCES: Comma-separated sources (default: 'header')
 * - API_KEY_HEADER_NAME: Custom header name (default: 'X-API-Key')
 * - API_KEY_COOKIE_NAME: Custom cookie name (default: 'api_key')
 * - API_KEY_PREFIX: Required key prefix
 * - API_KEY_STEALTH_MODE: Return 404 instead of 401 (default: false)
 */
export function createApiKeyValidator(env: ConductorEnv): ApiKeyValidator | null {
  // KV namespace must be configured
  const kvNamespace = env.API_KEY_KV_NAMESPACE || 'API_KEYS'

  // Check if KV namespace exists
  if (!env[kvNamespace]) {
    return null
  }

  // Parse sources - default to header-only
  let sources: ('header' | 'cookie')[] = ['header']
  if (env.API_KEY_SOURCES) {
    sources = env.API_KEY_SOURCES.split(',')
      .map((s: string) => s.trim())
      .filter((s: string): s is 'header' | 'cookie' => s === 'header' || s === 'cookie')
  }

  return new ApiKeyValidator({
    kvNamespace,
    sources,
    headerName: env.API_KEY_HEADER_NAME || 'X-API-Key',
    cookieName: env.API_KEY_COOKIE_NAME || 'api_key',
    prefix: env.API_KEY_PREFIX,
    stealthMode: env.API_KEY_STEALTH_MODE === 'true',
  })
}
