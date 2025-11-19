/**
 * @ensemble-edge/conductor
 *
 * Edge-native orchestration for AI agents
 * Built on Cloudflare Workers
 */

// Core Runtime
export { Executor } from './runtime/executor.js'
export { Parser } from './runtime/parser.js'
export { StateManager } from './runtime/state-manager.js'

// Durable Objects
// These are available via '@ensemble-edge/conductor/cloudflare' to avoid
// importing cloudflare: protocol modules in non-Cloudflare environments.
// See: src/cloudflare.ts for Cloudflare-specific exports

// Agent Types
export { BaseAgent } from './agents/base-agent.js'
export { FunctionAgent } from './agents/function-agent.js'
export { ThinkAgent } from './agents/think-agent.js'
export { DataAgent } from './agents/data-agent.js'
export { APIAgent } from './agents/api-agent.js'
export { PageAgent } from './agents/page/page-agent.js'
export { DocsMember } from './agents/docs/docs-agent.js'

// Utilities
export { MemberLoader, createLoader } from './utils/loader.js'
// export { CacheManager } from './utils/cache.js';
// export { Normalizer } from './utils/normalize.js';

// API Layer
// export { Router } from './api/router.js';
// export { createHandler } from './api/handlers.js';
// export { authenticate } from './api/auth.js';

// Pages Module
export { PageRouter } from './pages/index.js'
export type { PageRoute, PageRouterConfig } from './pages/index.js'

// Authentication Module
export * from './auth/index.js'

// Routing Module
export { UnifiedRouter } from './routing/router.js'
export type {
  ConductorConfig,
  RoutingConfig,
  RouteConfig,
  RouteAuthConfig as RoutingAuthConfig,
  ResolvedRouteAuthConfig,
  RouteMatch,
  Operation,
  AuthDefaults,
  RateLimitConfig as RoutingRateLimitConfig,
  AuthFailureAction,
} from './routing/config.js'

// Config Module (full config type for conductor.config.ts)
export type { ConductorConfig as FullConductorConfig } from './config/types.js'

// Types
export type {
  EnsembleConfig,
  AgentConfig,
  FlowStep,
  ExposeConfig,
  NotificationConfig,
  ScheduleConfig,
} from './runtime/parser.js'

export type {
  StateConfig,
  MemberStateConfig,
  StateContext,
  AccessReport,
} from './runtime/state-manager.js'

export type { AgentExecutionContext, AgentResponse } from './agents/base-agent.js'

export type { ExecutorConfig, ExecutionResult, ExecutionMetrics } from './runtime/executor.js'

export type {
  ExecutionStatus,
  StoredExecutionState,
  ExecutionProgressEvent,
  ExecutionCompletionEvent,
  ExecutionEvent,
} from './durable-objects/execution-state.js'

export type { HITLStatus, StoredHITLState, HITLEvent } from './durable-objects/hitl-state.js'

// Docs - First-class component support for markdown documentation
export { DocsManager, getGlobalDocsManager } from './docs/index.js'
export type {
  DocsTemplate,
  DocsManagerConfig,
  RenderOptions as DocsRenderOptions,
  RenderedDocs,
} from './docs/index.js'

/**
 * Create a Cloudflare Worker handler with Conductor
 *
 * @example
 * ```typescript
 * import { createConductorHandler } from '@ensemble-edge/conductor';
 *
 * export default createConductorHandler({
 *   membersDir: './agents',
 *   ensemblesDir: './ensembles'
 * });
 * ```
 */
export function createConductorHandler(config?: {
  membersDir?: string
  ensemblesDir?: string
}): ExportedHandler<Env> {
  return {
    async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
      // This will be implemented after we build the router and loader
      return new Response('Conductor initialized - handler implementation coming soon', {
        headers: { 'content-type': 'text/plain' },
      })
    },
  }
}
