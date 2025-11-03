/**
 * Conductor API - Exports
 *
 * Main exports for the Conductor HTTP API.
 */

export { createConductorAPI } from './app'
export type { APIConfig } from './app'

export type {
  ExecuteRequest,
  ExecuteResponse,
  AsyncExecuteRequest,
  AsyncExecuteResponse,
  StreamEvent,
  MemberListResponse,
  MemberDetailResponse,
  HealthResponse,
  ErrorResponse,
  AuthConfig,
  AuthContext,
  RateLimitConfig,
  RateLimitResult,
  ConductorContext,
} from './types'

export { createAuthMiddleware, requireAuth, errorHandler, requestId, timing } from './middleware'

export { execute, members, health, stream, async } from './routes'

export { openAPISpec, openapi } from './openapi'
export type { OpenAPISpec } from './openapi'
