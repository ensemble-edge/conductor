/**
 * Pages Module
 *
 * Hono-based routing and management for Page agents
 */

// Core Components
export { PageLoader } from './page-loader.js'
export { HonoConductorBridge } from './hono-bridge.js'
export { register404Handler, register500Handler } from './error-handling.js'

// Types
export type {
  PageRouteConfig,
  PageOperation,
  RateLimitConfig,
  CorsConfig,
  RouteConfig,
  ResponsesConfig,
  CacheConfig,
} from './hono-bridge.js'

// Re-export OperationContext from operation-registry for convenience
export type { OperationContext } from '../runtime/operation-registry.js'

// Schema
export {
  PageOperationSchema,
  RouteConfigSchema,
  ResponsesConfigSchema,
  CacheConfigSchema,
  PageRouteConfigSchema,
} from './schema.js'
