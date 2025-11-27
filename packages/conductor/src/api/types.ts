/**
 * API Types
 *
 * Type definitions for the Conductor HTTP API.
 */

import type { Context } from 'hono'

/**
 * API Request/Response Types
 */

export interface ExecuteRequest {
  agent: string
  input: Record<string, unknown>
  config?: Record<string, unknown>
  userId?: string
  sessionId?: string
  metadata?: Record<string, unknown>
}

export interface ExecuteResponse {
  success: boolean
  data?: unknown
  error?: string
  metadata: {
    executionId: string
    duration: number
    timestamp: number
  }
}

export interface AsyncExecuteRequest extends ExecuteRequest {
  callbackUrl?: string
  priority?: 'low' | 'normal' | 'high'
}

export interface AsyncExecuteResponse {
  executionId: string
  status: 'queued' | 'running' | 'completed' | 'failed'
  queuePosition?: number
  estimatedTime?: number
}

export interface StreamEvent {
  type: 'start' | 'data' | 'error' | 'end'
  data?: unknown
  error?: string
  timestamp: number
}

export interface MemberListResponse {
  agents: Array<{
    name: string
    operation: string
    version?: string
    description?: string
    builtIn: boolean
  }>
  count: number
}

export interface MemberDetailResponse {
  name: string
  operation: string
  version?: string
  description?: string
  builtIn: boolean
  config?: {
    schema?: Record<string, unknown>
    defaults?: Record<string, unknown>
  }
  input?: {
    schema?: Record<string, unknown>
    examples?: unknown[]
  }
  output?: {
    schema?: Record<string, unknown>
    examples?: unknown[]
  }
}

export interface HealthResponse {
  status: 'healthy' | 'degraded' | 'unhealthy'
  timestamp: number
  version: string
  checks: {
    database?: boolean
    cache?: boolean
    queue?: boolean
  }
}

export interface ErrorResponse {
  error: string
  message: string
  code?: string
  details?: unknown
  timestamp: number
  requestId?: string
}

/**
 * Authentication Types
 */

export interface AuthConfig {
  apiKeys?: string[]
  allowAnonymous?: boolean
  rateLimits?: {
    authenticated: {
      requests: number
      window: number
    }
    anonymous: {
      requests: number
      window: number
    }
  }
}

// Import the canonical AuthContext from auth module
import type { AuthContext as CanonicalAuthContext } from '../auth/types.js'

// Re-export for external use
export type { AuthContext as CanonicalAuthContext } from '../auth/types.js'

// Use the canonical AuthContext in this module
// This type alias ensures proper typing for Hono context
export type AuthContext = CanonicalAuthContext

/**
 * Rate Limiting Types
 */

export interface RateLimitConfig {
  requests: number
  window: number // seconds
  keyPrefix?: string
}

export interface RateLimitResult {
  allowed: boolean
  remaining: number
  resetAt: number
  retryAfter?: number
}

/**
 * Extended Hono Context
 *
 * Extends Hono's Context with Conductor-specific variables:
 * - auth: Authentication context from auth middleware
 * - requestId: Unique request identifier for tracing
 * - startTime: Request start timestamp for duration tracking
 * - stealthMode: Whether stealth mode is enabled (auth failures return 404)
 * - stealthDelayMs: Minimum delay for stealth responses (timing attack protection)
 * - cacheHit: Whether response was served from cache
 * - ensembleName: Name of the ensemble being executed
 * - executedAgents: List of agents executed in this request
 */
export type ConductorContext = Context<{
  Bindings: Env
  Variables: {
    auth?: AuthContext
    requestId?: string
    startTime?: number
    // Response standardization variables
    stealthMode?: boolean
    stealthDelayMs?: number
    // Debug header variables
    cacheHit?: boolean
    ensembleName?: string
    executedAgents?: string[]
  }
}>
