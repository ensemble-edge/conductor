/**
 * Trigger Authentication Bridge
 *
 * Bridges trigger auth configuration (from YAML) to the unified auth provider system.
 * This allows triggers to use the same auth mechanisms as API routes.
 *
 * Features:
 * - Unified auth handling for HTTP, Webhook, and MCP triggers
 * - Support for bearer, signature, basic, and apiKey auth
 * - Automatic provider selection based on config
 * - Consistent auth context for all routes
 *
 * @see https://docs.ensemble.ai/conductor/building/security-authentication
 */

import type { AuthValidator, AuthValidationResult, AuthContext } from './types.js'
import { BearerValidator } from './providers/bearer.js'
import {
  SignatureValidator,
  createSignatureValidator,
  signaturePresets,
} from './providers/signature.js'
import { BasicAuthValidator, createBasicValidator } from './providers/basic.js'
import { ApiKeyValidator } from './providers/apikey.js'

/**
 * Trigger auth configuration (from YAML)
 */
export interface TriggerAuthConfig {
  /** Auth type */
  type: 'bearer' | 'signature' | 'basic' | 'apiKey' | 'unkey'

  /** Shared secret (for bearer, signature, basic) */
  secret?: string

  /** Hash algorithm for signature auth (default: sha256) */
  algorithm?: 'sha256' | 'sha1' | 'sha384' | 'sha512'

  /** Custom signature header name */
  signatureHeader?: string

  /** Custom timestamp header name */
  timestampHeader?: string

  /** Timestamp tolerance in seconds (default: 300) */
  timestampTolerance?: number

  /** Preset signature format (github, stripe, slack, default) */
  preset?: 'github' | 'stripe' | 'slack' | 'default'

  /** Basic auth realm */
  realm?: string
}

/**
 * Simple Bearer Token Validator
 *
 * Used when JWT_SECRET is not available - does simple token comparison.
 * This is the behavior triggers had before the bridge.
 */
class SimpleBearerValidator implements AuthValidator {
  constructor(private readonly secret: string) {}

  extractToken(request: Request): string | null {
    const authHeader = request.headers.get('Authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return null
    }
    return authHeader.substring(7)
  }

  async validate(request: Request, _env: any): Promise<AuthValidationResult> {
    const token = this.extractToken(request)

    if (!token) {
      return {
        valid: false,
        error: 'invalid_token',
        message: 'Missing or invalid Authorization header. Expected: Bearer <token>',
      }
    }

    // Simple token comparison (timing-safe)
    const isValid = this.timingSafeEqual(token, this.secret)

    if (!isValid) {
      return {
        valid: false,
        error: 'invalid_token',
        message: 'Invalid bearer token',
      }
    }

    return {
      valid: true,
      context: {
        authenticated: true,
        method: 'bearer',
        token,
      },
    }
  }

  private timingSafeEqual(a: string, b: string): boolean {
    if (a.length !== b.length) {
      return false
    }
    let result = 0
    for (let i = 0; i < a.length; i++) {
      result |= a.charCodeAt(i) ^ b.charCodeAt(i)
    }
    return result === 0
  }
}

/**
 * Get the appropriate auth validator based on trigger config
 */
export function getValidatorForTrigger(config: TriggerAuthConfig, env: any): AuthValidator {
  switch (config.type) {
    case 'bearer':
      // Use JWT validation if JWT_SECRET exists, otherwise simple token match
      if (env.JWT_SECRET) {
        return new BearerValidator({
          secret: env.JWT_SECRET,
          issuer: env.JWT_ISSUER,
          audience: env.JWT_AUDIENCE,
        })
      }
      if (!config.secret) {
        throw new Error('Bearer auth requires a secret')
      }
      return new SimpleBearerValidator(config.secret)

    case 'signature':
      if (!config.secret) {
        throw new Error('Signature auth requires a secret')
      }

      // Use preset if specified
      if (config.preset) {
        const presetConfig = signaturePresets[config.preset](config.secret)
        return createSignatureValidator(presetConfig)
      }

      // Use custom config
      return createSignatureValidator({
        secret: config.secret,
        algorithm: config.algorithm || 'sha256',
        signatureHeader: config.signatureHeader,
        timestampHeader: config.timestampHeader,
        timestampTolerance: config.timestampTolerance,
      })

    case 'basic':
      if (!config.secret) {
        throw new Error('Basic auth requires credentials (format: username:password)')
      }
      return createBasicValidator({
        credentials: config.secret,
        realm: config.realm,
      })

    case 'apiKey':
      return new ApiKeyValidator(env)

    case 'unkey':
      // Unkey validator requires the unkey package
      // For now, fall back to API key validation
      // TODO: Import UnkeyValidator when available
      return new ApiKeyValidator(env)

    default:
      throw new Error(`Unknown trigger auth type: ${(config as any).type}`)
  }
}

/**
 * Create auth middleware for triggers using the unified provider system
 *
 * This is the main entry point for trigger auth. It creates a Hono middleware
 * that validates authentication using the appropriate provider.
 *
 * @param authConfig - Auth configuration from trigger YAML
 * @param env - Environment bindings (for KV, secrets, etc.)
 * @returns Hono middleware function
 */
export function createTriggerAuthMiddleware(
  authConfig: TriggerAuthConfig,
  env: any
): (c: any, next: () => Promise<void>) => Promise<Response | void> {
  const validator = getValidatorForTrigger(authConfig, env)

  return async (c: any, next: () => Promise<void>) => {
    const request = c.req.raw as Request

    try {
      const result = await validator.validate(request, env)

      if (!result.valid) {
        // Build appropriate error response
        const status = result.error === 'expired' ? 401 : 401
        const response: Record<string, any> = {
          error: result.error || 'unauthorized',
          message: result.message || 'Authentication failed',
        }

        // Add WWW-Authenticate header for basic auth
        if (authConfig.type === 'basic' && validator instanceof BasicAuthValidator) {
          c.header('WWW-Authenticate', validator.getWWWAuthenticateHeader())
        }

        // Add rate limit info if available
        if (result.ratelimit) {
          c.header('X-RateLimit-Remaining', result.ratelimit.remaining.toString())
          c.header('X-RateLimit-Limit', result.ratelimit.limit.toString())
          c.header('X-RateLimit-Reset', result.ratelimit.reset.toString())
        }

        return c.json(response, status)
      }

      // Store auth context for downstream handlers
      if (result.context) {
        c.set('auth', result.context)
        c.set('authenticated', true)

        if (result.context.user) {
          c.set('user', result.context.user)
          c.set('userId', result.context.user.id)
        }

        if (result.context.custom) {
          c.set('authCustom', result.context.custom)
        }
      }

      await next()
    } catch (error) {
      // Handle validation errors gracefully
      console.error('[TriggerAuth] Validation error:', error)
      return c.json(
        {
          error: 'auth_error',
          message: error instanceof Error ? error.message : 'Authentication error',
        },
        500
      )
    }
  }
}

/**
 * Validate trigger auth config
 *
 * Used during build/startup to catch configuration errors early.
 */
export function validateTriggerAuthConfig(config: TriggerAuthConfig): string[] {
  const errors: string[] = []

  if (!config.type) {
    errors.push('Auth type is required')
    return errors
  }

  const validTypes = ['bearer', 'signature', 'basic', 'apiKey', 'unkey']
  if (!validTypes.includes(config.type)) {
    errors.push(`Invalid auth type: ${config.type}. Valid types: ${validTypes.join(', ')}`)
  }

  // Type-specific validation
  switch (config.type) {
    case 'bearer':
    case 'basic':
      if (!config.secret) {
        errors.push(`${config.type} auth requires a secret`)
      }
      break

    case 'signature':
      if (!config.secret) {
        errors.push('signature auth requires a secret')
      }
      if (config.algorithm && !['sha256', 'sha1', 'sha384', 'sha512'].includes(config.algorithm)) {
        errors.push(`Invalid signature algorithm: ${config.algorithm}`)
      }
      if (config.preset && !['github', 'stripe', 'slack', 'default'].includes(config.preset)) {
        errors.push(`Invalid signature preset: ${config.preset}`)
      }
      break
  }

  return errors
}

/**
 * Re-export types for convenience
 */
export type { AuthValidator, AuthValidationResult, AuthContext }
