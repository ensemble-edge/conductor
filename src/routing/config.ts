/**
 * Routing Configuration Types
 *
 * Types for centralized routing configuration (conductor.config.ts)
 */

import type { AuthRequirement, AuthMethod } from '../auth/types.js'

/**
 * Auth failure action
 */
export interface AuthFailureAction {
  /** Action to take on auth failure */
  action: 'error' | 'redirect' | 'page'

  /** Redirect URL (for redirect action) */
  redirectTo?: string

  /** Preserve return URL in query (for redirect action) */
  preserveReturn?: boolean

  /** Page agent name (for page action) */
  page?: string

  /** Context to pass to error/page */
  context?: Record<string, any>
}

/**
 * Rate limit configuration
 */
export interface RateLimitConfig {
  /** Max requests per window */
  requests: number

  /** Window size in seconds */
  window: number

  /** Key to rate limit by */
  keyBy: 'user' | 'ip' | 'apiKey'
}

/**
 * Route auth configuration
 */
export interface RouteAuthConfig {
  /** Auth requirement level */
  requirement: AuthRequirement

  /** Allowed auth methods */
  methods?: AuthMethod[]

  /** Required permissions */
  permissions?: string[]

  /** Required roles */
  roles?: string[]

  /** Service account only */
  serviceAccountOnly?: boolean

  /** Stealth mode (404 instead of 401) */
  stealthMode?: boolean

  /** Custom validator name */
  customValidator?: string

  /** Action on auth failure */
  onFailure?: AuthFailureAction

  /** Audit log enabled */
  auditLog?: boolean

  /** Rate limit configuration */
  rateLimit?: RateLimitConfig
}

/**
 * CORS configuration
 */
export interface CORSConfig {
  /** Allowed origins (or '*' for all) */
  origins?: string[] | '*'

  /** Allowed HTTP methods */
  methods?: string[]

  /** Allowed headers */
  allowedHeaders?: string[]

  /** Exposed headers */
  exposedHeaders?: string[]

  /** Allow credentials */
  credentials?: boolean

  /** Max age for preflight cache (seconds) */
  maxAge?: number
}

/**
 * Route configuration
 */
export interface RouteConfig {
  /** Route path pattern */
  pattern: string

  /** Auth configuration */
  auth?: Partial<RouteAuthConfig>

  /** Rate limit configuration */
  rateLimit?: RateLimitConfig

  /** Priority (lower = higher priority) */
  priority?: number

  /** Response headers to add/override */
  headers?: Record<string, string>

  /** CORS configuration */
  cors?: CORSConfig
}

/**
 * Type-specific auth defaults
 */
export interface AuthDefaults {
  /** Page defaults */
  pages?: Partial<RouteAuthConfig> & { rateLimit?: RateLimitConfig }

  /** API defaults */
  api?: Partial<RouteAuthConfig> & { rateLimit?: RateLimitConfig }

  /** Webhook defaults */
  webhooks?: Partial<RouteAuthConfig> & { rateLimit?: RateLimitConfig }

  /** Form defaults */
  forms?: Partial<RouteAuthConfig> & { rateLimit?: RateLimitConfig }

  /** Docs defaults */
  docs?: Partial<RouteAuthConfig> & { rateLimit?: RateLimitConfig }
}

/**
 * Routing configuration
 */
export interface RoutingConfig {
  /** Auth configuration */
  auth?: {
    /** Type-specific defaults */
    defaults?: AuthDefaults

    /** Path-based rules */
    rules?: RouteConfig[]

    /** Global default (fallback) */
    global?: Partial<RouteAuthConfig> & { rateLimit?: RateLimitConfig }
  }

  /** Auto-discover pages */
  autoDiscover?: boolean

  /** Base path for all routes */
  basePath?: string
}

/**
 * Conductor configuration
 */
export interface ConductorConfig {
  /** Project name */
  name?: string

  /** Project version */
  version?: string

  /** Routing configuration */
  routing?: RoutingConfig

  /** Environment variables */
  env?: Record<string, string>
}

/**
 * Agent type for route resolution
 */
export type Operation = 'page' | 'api' | 'webhook' | 'form' | 'docs' | 'static' | 'health' | 'auth'

/**
 * Resolved route auth config (after applying defaults and rules)
 */
export interface ResolvedRouteAuthConfig extends RouteAuthConfig {
  /** Source of config (for debugging) */
  source: 'agent' | 'rule' | 'type-default' | 'global-default'

  /** Rate limit config */
  rateLimit?: RateLimitConfig
}

/**
 * Route match result
 */
export interface RouteMatch {
  /** Matched path pattern */
  pattern: string

  /** Route params extracted from path */
  params: Record<string, string>

  /** Resolved auth config */
  auth: ResolvedRouteAuthConfig

  /** Agent type */
  operation: Operation

  /** Priority */
  priority: number

  /** Response headers to add */
  headers?: Record<string, string>

  /** CORS configuration */
  cors?: CORSConfig
}
