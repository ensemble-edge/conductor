/**
 * Conductor API - Exports
 *
 * Main exports for the Conductor HTTP API.
 */

export { createConductorAPI } from './app.js'
export type { APIConfig } from './app.js'

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
} from './types.js'

export {
  createAuthMiddleware,
  requireAuth,
  errorHandler,
  requestId,
  timing,
} from './middleware/index.js'

export { execute, members, health, stream, async } from './routes/index.js'

export { openAPISpec, openapi } from './openapi/index.js'
export type { OpenAPISpec } from './openapi/index.js'
