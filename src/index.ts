/**
 * @ensemble-edge/conductor
 *
 * Edge-native orchestration for AI members
 * Built on Cloudflare Workers
 */

// Core Runtime
export { Executor } from './runtime/executor.js'
export { Parser } from './runtime/parser.js'
export { StateManager } from './runtime/state-manager.js'

// Durable Objects
export { ExecutionState } from './durable-objects/execution-state.js'
export { HITLState } from './durable-objects/hitl-state.js'

// Member Types
export { BaseMember } from './members/base-member.js'
export { FunctionMember } from './members/function-member.js'
export { ThinkMember } from './members/think-member.js'
export { DataMember } from './members/data-member.js'
export { APIMember } from './members/api-member.js'

// Utilities
export { MemberLoader, createLoader } from './utils/loader.js'
// export { CacheManager } from './utils/cache.js';
// export { Normalizer } from './utils/normalize.js';

// API Layer
// export { Router } from './api/router.js';
// export { createHandler } from './api/handlers.js';
// export { authenticate } from './api/auth.js';

// Types
export type {
  EnsembleConfig,
  MemberConfig,
  FlowStep,
  WebhookConfig,
  ScheduleConfig,
} from './runtime/parser.js'

export type {
  StateConfig,
  MemberStateConfig,
  StateContext,
  AccessReport,
} from './runtime/state-manager.js'

export type { MemberExecutionContext, MemberResponse } from './members/base-member.js'

export type { ExecutorConfig, ExecutionResult, ExecutionMetrics } from './runtime/executor.js'

export type {
  ExecutionStatus,
  StoredExecutionState,
  ExecutionProgressEvent,
  ExecutionCompletionEvent,
  ExecutionEvent,
} from './durable-objects/execution-state.js'

export type { HITLStatus, StoredHITLState, HITLEvent } from './durable-objects/hitl-state.js'

/**
 * Create a Cloudflare Worker handler with Conductor
 *
 * @example
 * ```typescript
 * import { createConductorHandler } from '@ensemble-edge/conductor';
 *
 * export default createConductorHandler({
 *   membersDir: './members',
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
