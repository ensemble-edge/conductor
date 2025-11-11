/**
 * Authentication Types
 *
 * Unified authentication system for all routes
 */

/**
 * Auth methods supported
 */
export type AuthMethod = 'bearer' | 'apiKey' | 'cookie' | 'unkey' | 'basic' | 'custom'

/**
 * Auth requirement levels
 */
export type AuthRequirement = 'public' | 'required' | 'optional'

/**
 * Authentication context available to all handlers
 */
export interface AuthContext {
  /** Whether request is authenticated */
  authenticated: boolean

  /** Auth method used */
  method?: AuthMethod

  /** User information (if authenticated) */
  user?: {
    id: string
    email?: string
    roles?: string[]
    permissions?: string[]
    metadata?: Record<string, any>
  }

  /** Original token/key */
  token?: string

  /** Token expiration */
  expiresAt?: number

  /** Unkey-specific data */
  unkey?: {
    keyId: string
    ownerId?: string
    isServiceAccount: boolean
    ratelimit?: {
      remaining: number
      limit: number
      reset: number
    }
  }

  /** Custom auth data */
  custom?: Record<string, any>
}

/**
 * Auth configuration for routes
 */
export interface RouteAuthConfig {
  /** Auth requirement level */
  requirement: AuthRequirement

  /** Allowed auth methods (defaults to all if not specified) */
  methods?: AuthMethod[]

  /** Required permissions */
  permissions?: string[]

  /** Required roles */
  roles?: string[]

  /** Custom validator function name */
  customValidator?: string
}

/**
 * Auth validation result
 */
export interface AuthValidationResult {
  /** Whether auth is valid */
  valid: boolean

  /** Auth context if valid */
  context?: AuthContext

  /** Error code if invalid */
  error?: 'invalid_token' | 'expired' | 'insufficient_permissions' | 'rate_limited' | 'unknown'

  /** Error message */
  message?: string

  /** Rate limit info (if applicable) */
  ratelimit?: {
    remaining: number
    limit: number
    reset: number
  }
}

/**
 * Auth validator interface
 */
export interface AuthValidator {
  /**
   * Validate authentication
   */
  validate(request: Request, env: any): Promise<AuthValidationResult>

  /**
   * Extract token/key from request
   */
  extractToken(request: Request): string | null
}

/**
 * Token payload for JWT
 */
export interface TokenPayload {
  sub: string // User ID
  email?: string
  roles?: string[]
  permissions?: string[]
  exp: number // Expiration timestamp
  iat: number // Issued at
  iss?: string // Issuer
  aud?: string // Audience
  [key: string]: any // Custom claims
}

/**
 * API key metadata
 */
export interface ApiKeyMetadata {
  keyId: string
  userId?: string
  name?: string
  permissions?: string[]
  rateLimit?: {
    requests: number
    window: number
  }
  expiresAt?: number
  metadata?: Record<string, any>
}

/**
 * Session data
 */
export interface SessionData {
  sessionId: string
  userId: string
  email?: string
  roles?: string[]
  permissions?: string[]
  createdAt: number
  expiresAt: number
  metadata?: Record<string, any>
}
