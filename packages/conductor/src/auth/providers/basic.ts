/**
 * Basic Authentication Provider
 *
 * Implements HTTP Basic Authentication (RFC 7617).
 * Validates username:password credentials sent in the Authorization header.
 *
 * Features:
 * - Standard HTTP Basic auth validation
 * - Multiple credential support
 * - Optional realm specification
 * - Secure comparison to prevent timing attacks
 *
 * @see https://docs.ensemble.ai/conductor/building/security-authentication
 */

import type { AuthValidator, AuthValidationResult, AuthContext } from '../types.js'

/**
 * Basic auth configuration
 */
export interface BasicAuthConfig {
  /**
   * Credentials in "username:password" format.
   * Can be a single string or array of valid credentials.
   */
  credentials: string | string[]

  /**
   * Authentication realm (displayed in browser prompt)
   * @default "Conductor API"
   */
  realm?: string
}

/**
 * Parsed credentials
 */
interface Credentials {
  username: string
  password: string
}

/**
 * Timing-safe string comparison to prevent timing attacks
 */
function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) {
    return false
  }

  let result = 0
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i)
  }
  return result === 0
}

/**
 * Parse credentials from "username:password" format
 */
function parseCredentials(credential: string): Credentials | null {
  const colonIndex = credential.indexOf(':')
  if (colonIndex === -1) {
    return null
  }

  return {
    username: credential.substring(0, colonIndex),
    password: credential.substring(colonIndex + 1),
  }
}

/**
 * Basic Auth Validator
 *
 * Validates HTTP Basic Authentication credentials.
 */
export class BasicAuthValidator implements AuthValidator {
  private readonly credentials: Credentials[]
  private readonly realm: string

  constructor(config: BasicAuthConfig) {
    this.realm = config.realm || 'Conductor API'

    // Parse all valid credentials
    const credentialList = Array.isArray(config.credentials)
      ? config.credentials
      : [config.credentials]

    this.credentials = credentialList
      .map(parseCredentials)
      .filter((c): c is Credentials => c !== null)

    if (this.credentials.length === 0) {
      throw new Error(
        'BasicAuthValidator: No valid credentials provided. Format: "username:password"'
      )
    }
  }

  /**
   * Extract base64-encoded credentials from Authorization header
   */
  extractToken(request: Request): string | null {
    const authHeader = request.headers.get('Authorization')
    if (!authHeader?.startsWith('Basic ')) {
      return null
    }
    return authHeader.substring(6) // Remove "Basic " prefix
  }

  /**
   * Validate basic auth credentials
   */
  async validate(request: Request, _env: any): Promise<AuthValidationResult> {
    const token = this.extractToken(request)

    if (!token) {
      return {
        valid: false,
        error: 'invalid_token',
        message: 'Missing or invalid Authorization header. Expected: Basic <base64-credentials>',
      }
    }

    // Decode base64 credentials
    let decoded: string
    try {
      decoded = atob(token)
    } catch {
      return {
        valid: false,
        error: 'invalid_token',
        message: 'Invalid base64 encoding in Authorization header',
      }
    }

    // Parse username:password
    const provided = parseCredentials(decoded)
    if (!provided) {
      return {
        valid: false,
        error: 'invalid_token',
        message: 'Invalid credential format. Expected: username:password',
      }
    }

    // Check against all valid credentials
    let matchedUsername: string | null = null
    for (const valid of this.credentials) {
      // Use timing-safe comparison for both username and password
      const usernameMatch = timingSafeEqual(provided.username, valid.username)
      const passwordMatch = timingSafeEqual(provided.password, valid.password)

      if (usernameMatch && passwordMatch) {
        matchedUsername = valid.username
        break
      }
    }

    if (!matchedUsername) {
      return {
        valid: false,
        error: 'invalid_token',
        message: 'Invalid username or password',
      }
    }

    // Build auth context
    const context: AuthContext = {
      authenticated: true,
      method: 'basic',
      user: {
        id: matchedUsername,
        metadata: {
          authMethod: 'basic',
          realm: this.realm,
        },
      },
    }

    return {
      valid: true,
      context,
    }
  }

  /**
   * Get WWW-Authenticate header value for 401 responses
   */
  getWWWAuthenticateHeader(): string {
    return `Basic realm="${this.realm}", charset="UTF-8"`
  }
}

/**
 * Create a basic auth validator
 */
export function createBasicValidator(config: BasicAuthConfig): BasicAuthValidator
export function createBasicValidator(credentials: string | string[]): BasicAuthValidator
export function createBasicValidator(
  configOrCredentials: BasicAuthConfig | string | string[]
): BasicAuthValidator {
  if (typeof configOrCredentials === 'string' || Array.isArray(configOrCredentials)) {
    return new BasicAuthValidator({ credentials: configOrCredentials })
  }
  return new BasicAuthValidator(configOrCredentials)
}

/**
 * Create a basic auth validator from environment variable
 *
 * Looks for BASIC_AUTH_CREDENTIALS in the environment.
 * Can be a single credential or comma-separated list.
 */
export function createBasicValidatorFromEnv(
  env: Record<string, string>
): BasicAuthValidator | null {
  const credentials = env.BASIC_AUTH_CREDENTIALS
  if (!credentials) {
    return null
  }

  // Support comma-separated credentials for multiple users
  const credentialList = credentials.includes(',')
    ? credentials.split(',').map((c) => c.trim())
    : [credentials]

  return new BasicAuthValidator({ credentials: credentialList })
}
