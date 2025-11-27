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
export {
  PluginRegistry,
  getPluginRegistry,
  // Backwards compatibility
  OperationRegistry,
  getOperationRegistry,
  type OperationHandler,
  type OperationContext,
  type OperationConfig,
  type OperationMetadata,
} from './runtime/plugin-registry.js'
export {
  TriggerRegistry,
  getTriggerRegistry,
  type TriggerHandler,
  type TriggerHandlerContext,
  type TriggerMetadata,
} from './runtime/trigger-registry.js'

export {
  HttpMiddlewareRegistry,
  getHttpMiddlewareRegistry,
  type HttpMiddlewareMetadata,
} from './runtime/http-middleware-registry.js'

// Observability
export { createLogger } from './observability/index.js'

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
// Utilities
export { MemberLoader, createLoader } from './utils/loader.js'
export { EnsembleLoader, createEnsembleLoader } from './utils/ensemble-loader.js'
// export { CacheManager } from './utils/cache.js';
// export { Normalizer } from './utils/normalize.js';

// API Layer
// export { Router } from './api/router.js';
// export { createHandler } from './api/handlers.js';
// export { authenticate } from './api/auth.js';

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
  BuildTriggerConfig,
  CLITriggerConfig,
} from './runtime/parser.js'

// Build and CLI Managers
export { BuildManager, getBuildManager, resetBuildManager } from './runtime/build-manager.js'
export type { BuildExecutionResult } from './runtime/build-manager.js'

export { CLIManager, getCLIManager, resetCLIManager } from './runtime/cli-manager.js'
export type {
  CLICommandMetadata,
  CLIExecutionResult,
  CLIOption,
} from './runtime/cli-manager.js'

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

// Plugin System
export type {
  ConductorPlugin,
  FunctionalPlugin,
  LifecyclePlugin,
  ConductorConfig as PluginConductorConfig,
  PluginContext,
  PluginLogger,
  OperationRegistration,
  MiddlewareRegistration,
  AgentRegistration,
  AuthValidatorRegistration,
  AuthValidationResult,
  PluginDependency,
  PluginMetadata,
} from './types/plugin.js'
export { isLifecyclePlugin, isFunctionalPlugin, buildPlugin } from './types/plugin.js'

// Docs - First-class component support for markdown documentation
export { DocsManager, getGlobalDocsManager } from './docs/index.js'
export type {
  DocsTemplate,
  DocsManagerConfig,
  RenderOptions as DocsRenderOptions,
  RenderedDocs,
} from './docs/index.js'

// ============================================================================
// Primitives - TypeScript-first authoring for agents and ensembles
// ============================================================================
// The canonical building blocks used by both YAML and TypeScript authoring.
// Both formats produce identical runtime objects through these primitives.

// Step Primitives
export {
  step,
  sequence,
  scriptStep,
  httpStep,
  thinkStep,
  storageStep,
  dataStep,
  emailStep,
  agentStep,
} from './primitives/step.js'

// Flow Control Primitives
export {
  parallel,
  race,
  branch,
  ifThen,
  ifThenElse,
  switchStep,
  foreach,
  map,
  repeat,
  whileStep,
  doWhile,
  doUntil,
  tryStep,
  fallback,
  mapReduce,
} from './primitives/flow.js'

// Ensemble Primitives
export { createEnsemble, Ensemble, isEnsemble, ensembleFromConfig } from './primitives/ensemble.js'

// Tool Primitives
export {
  createTool,
  mcpTool,
  customTool,
  httpTool,
  skillTool,
  toolCollection,
  Tool,
  isTool,
  isToolConfig,
} from './primitives/tool.js'

// Instruction Primitives
export {
  instruction,
  systemInstruction,
  userInstruction,
  assistantInstruction,
  fileInstruction,
  templateInstruction,
  dynamicInstruction,
  conditionalInstruction,
  combineInstructions,
  prompt,
  Instruction,
  isInstruction,
  isInstructionConfig,
} from './primitives/instruction.js'

// Memory Primitives (persistent storage - NOT workflow state)
export {
  memory,
  kvMemory,
  r2Memory,
  d1Memory,
  vectorMemory,
  durableMemory,
  customMemory,
  conversationMemory,
  knowledgeBase,
  Memory,
  isMemory,
  isMemoryConfig,
} from './primitives/memory.js'

// Reference Primitives
export {
  ref,
  inputRef,
  stateRef,
  envRef,
  stepRef,
  contextRef,
  outputRef,
  computed,
  template,
  parseRef,
  refMap,
  Reference,
  isReference,
  isComputed,
  isTemplate,
  isRefExpression,
} from './primitives/reference.js'

// Async Primitives (suspension, scheduling, HITL)
export {
  suspend,
  checkpoint,
  sleep,
  sleepSeconds,
  sleepMinutes,
  sleepUntil,
  schedule,
  approval,
  waitForWebhook,
  waitForInput,
  isSuspendStep,
  isSleepStep,
  isScheduleStep,
  isApprovalStep,
  isAsyncStep,
} from './primitives/async.js'

// Type Guards from primitives
export {
  isParallelStep,
  isAgentStep,
  isBranchStep,
  isForeachStep,
  isTryStep,
  isSwitchStep,
  isWhileStep,
  isMapReduceStep,
  isFlowControlStep,
  isControlFlowStep,
} from './primitives/types.js'

// Primitive Types
export type {
  // Context
  Context,
  // Flow step types
  FlowStepType,
  AgentFlowStep,
  ParallelFlowStep,
  BranchFlowStep,
  ForeachFlowStep,
  TryFlowStep,
  SwitchFlowStep,
  WhileFlowStep,
  MapReduceFlowStep,
  // Configuration types
  StepOptions,
  AgentSchemaConfig,
  EnsembleHooks,
  OutputConfig,
  // Option types for flow control
  ParallelOptions,
  BranchOptions,
  ForeachOptions,
  TryOptions,
  WhileOptions,
  MapReduceOptions,
} from './primitives/types.js'

export type {
  EnsembleOptions,
  EnsembleConfig as PrimitiveEnsembleConfig,
  TriggerConfig,
  WebhookTrigger,
  HttpTrigger,
  McpTrigger,
  EmailTrigger,
  QueueTrigger,
  CronTrigger,
  NotificationConfig as PrimitiveNotificationConfig,
  WebhookNotification,
  EmailNotification,
  ScoringConfig,
  InlineAgentConfig,
} from './primitives/ensemble.js'

export type {
  ToolConfig,
  ToolDefinition,
  ToolParameter,
  ToolCollection,
  MCPServerConfig,
  CustomToolConfig,
  HTTPToolConfig,
  SkillToolConfig,
} from './primitives/tool.js'

export type {
  InstructionConfig,
  InstructionSource,
  InstructionContext,
} from './primitives/instruction.js'

export type {
  MemoryConfig as PrimitiveMemoryConfig,
  AgentMemoryConfig,
  MemoryProviderType,
  MemoryScope,
  MemoryEntry,
  VectorMemoryEntry,
  KVMemoryConfig,
  R2MemoryConfig,
  D1MemoryConfig,
  VectorizeMemoryConfig,
  DurableObjectMemoryConfig,
  CustomMemoryConfig,
  MemoryImplementation,
} from './primitives/memory.js'

export type { ReferenceSource, ReferenceOptions } from './primitives/reference.js'

export type {
  SuspensionReason,
  SuspensionState,
  SleepConfig,
  ScheduleConfig as AsyncScheduleConfig,
  ApprovalConfig,
  WebhookWaitConfig,
  SuspendStepConfig,
  SleepStepConfig,
  ScheduleStepConfig,
  ApprovalStepConfig,
} from './primitives/async.js'

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
