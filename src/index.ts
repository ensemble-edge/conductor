/**
 * @ensemble-edge/conductor
 *
 * Edge-native orchestration for AI members
 * Built on Cloudflare Workers
 */

// Core Runtime
export { Executor } from './runtime/executor';
export { Parser } from './runtime/parser';
export { StateManager } from './runtime/state-manager';

// Durable Objects
export { ExecutionState } from './durable-objects/execution-state';
export { HITLState } from './durable-objects/hitl-state';

// Member Types
export { BaseMember } from './members/base-member';
export { FunctionMember } from './members/function-member';
export { ThinkMember } from './members/think-member';
export { DataMember } from './members/data-member';
export { APIMember } from './members/api-member';

// Utilities
export { MemberLoader, createLoader } from './utils/loader';
// export { CacheManager } from './utils/cache';
// export { Normalizer } from './utils/normalize';

// API Layer
// export { Router } from './api/router';
// export { createHandler } from './api/handlers';
// export { authenticate } from './api/auth';

// Types
export type {
	EnsembleConfig,
	MemberConfig,
	FlowStep,
	WebhookConfig,
	ScheduleConfig
} from './runtime/parser';

export type {
	StateConfig,
	MemberStateConfig,
	StateContext,
	AccessReport
} from './runtime/state-manager';

export type {
	MemberExecutionContext,
	MemberResponse
} from './members/base-member';

export type {
	ExecutorConfig,
	ExecutionResult,
	ExecutionMetrics
} from './runtime/executor';

export type {
	ExecutionStatus,
	StoredExecutionState,
	ExecutionProgressEvent,
	ExecutionCompletionEvent,
	ExecutionEvent
} from './durable-objects/execution-state';

export type {
	HITLStatus,
	StoredHITLState,
	HITLEvent
} from './durable-objects/hitl-state';

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
	membersDir?: string;
	ensemblesDir?: string;
}): ExportedHandler<Env> {
	return {
		async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
			// This will be implemented after we build the router and loader
			return new Response('Conductor initialized - handler implementation coming soon', {
				headers: { 'content-type': 'text/plain' }
			});
		}
	};
}
