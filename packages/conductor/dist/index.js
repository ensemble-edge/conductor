/**
 * @ensemble-edge/conductor
 *
 * Edge-native orchestration for AI agents
 * Built on Cloudflare Workers
 */
// Core Runtime
export { Executor } from './runtime/executor.js';
export { Parser } from './runtime/parser.js';
export { StateManager } from './runtime/state-manager.js';
export { GraphExecutor, hasControlFlowSteps, } from './runtime/graph-executor.js';
export { PluginRegistry, getPluginRegistry, 
// Backwards compatibility
OperationRegistry, getOperationRegistry, } from './runtime/plugin-registry.js';
export { TriggerRegistry, getTriggerRegistry, } from './runtime/trigger-registry.js';
export { HttpMiddlewareRegistry, getHttpMiddlewareRegistry, } from './runtime/http-middleware-registry.js';
// Observability
export { createLogger } from './observability/index.js';
// Durable Objects
// These are available via '@ensemble-edge/conductor/cloudflare' to avoid
// importing cloudflare: protocol modules in non-Cloudflare environments.
// See: src/cloudflare.ts for Cloudflare-specific exports
// Agent Types
export { BaseAgent } from './agents/base-agent.js';
export { FunctionAgent } from './agents/function-agent.js';
export { ThinkAgent } from './agents/think-agent.js';
export { DataAgent } from './agents/data-agent.js';
export { APIAgent } from './agents/api-agent.js';
// Utilities
export { MemberLoader, createLoader } from './utils/loader.js';
export { EnsembleLoader, createEnsembleLoader } from './utils/ensemble-loader.js';
// export { CacheManager } from './utils/cache.js';
// export { Normalizer } from './utils/normalize.js';
// API Layer
// export { Router } from './api/router.js';
// export { createHandler } from './api/handlers.js';
// export { authenticate } from './api/auth.js';
// Authentication Module
export * from './auth/index.js';
// Routing Module
export { UnifiedRouter } from './routing/router.js';
export { DEFAULT_DISCOVERY_CONFIG, DEFAULT_AGENT_DISCOVERY, DEFAULT_ENSEMBLE_DISCOVERY, DEFAULT_DOCS_DISCOVERY, DEFAULT_SCRIPTS_DISCOVERY, mergeDiscoveryConfig, } from './config/discovery.js';
// Build and CLI Managers
export { BuildManager, getBuildManager, resetBuildManager } from './runtime/build-manager.js';
export { CLIManager, getCLIManager, resetCLIManager } from './runtime/cli-manager.js';
// Branded Types - Type-safe identifiers for domain concepts
// Exports both type definitions and factory functions (same name by design)
export { ModelId, AgentName, EnsembleName, ProviderId, PlatformName, BindingName, VersionString, ExecutionId, RequestId, ResumeToken, CacheKey, } from './types/branded.js';
export { isLifecyclePlugin, isFunctionalPlugin, buildPlugin } from './types/plugin.js';
// Docs - First-class component support for markdown documentation
export { DocsManager, getGlobalDocsManager } from './docs/index.js';
// ============================================================================
// Primitives - TypeScript-first authoring for agents and ensembles
// ============================================================================
// The canonical building blocks used by both YAML and TypeScript authoring.
// Both formats produce identical runtime objects through these primitives.
// Step Primitives
export { step, sequence, scriptStep, httpStep, thinkStep, storageStep, dataStep, emailStep, agentStep, } from './primitives/step.js';
// Flow Control Primitives
export { parallel, race, branch, ifThen, ifThenElse, switchStep, foreach, map, repeat, whileStep, doWhile, doUntil, tryStep, fallback, mapReduce, } from './primitives/flow.js';
// Ensemble Primitives
export { createEnsemble, Ensemble, isEnsemble, ensembleFromConfig } from './primitives/ensemble.js';
// Tool Primitives
export { createTool, mcpTool, customTool, httpTool, skillTool, toolCollection, Tool, isTool, isToolConfig, } from './primitives/tool.js';
// Instruction Primitives
export { instruction, systemInstruction, userInstruction, assistantInstruction, fileInstruction, templateInstruction, dynamicInstruction, conditionalInstruction, combineInstructions, prompt, Instruction, isInstruction, isInstructionConfig, } from './primitives/instruction.js';
// Memory Primitives (persistent storage - NOT workflow state)
export { memory, kvMemory, r2Memory, d1Memory, vectorMemory, durableMemory, customMemory, conversationMemory, knowledgeBase, Memory, isMemory, isMemoryConfig, } from './primitives/memory.js';
// Reference Primitives
export { ref, inputRef, stateRef, envRef, stepRef, contextRef, outputRef, computed, template, parseRef, refMap, Reference, isReference, isComputed, isTemplate, isRefExpression, } from './primitives/reference.js';
// Async Primitives (suspension, scheduling, HITL)
export { suspend, checkpoint, sleep, sleepSeconds, sleepMinutes, sleepUntil, schedule, approval, waitForWebhook, waitForInput, isSuspendStep, isSleepStep, isScheduleStep, isApprovalStep, isAsyncStep, } from './primitives/async.js';
// Type Guards from primitives
export { isParallelStep, isAgentStep, isBranchStep, isForeachStep, isTryStep, isSwitchStep, isWhileStep, isMapReduceStep, isFlowControlStep, isControlFlowStep, } from './primitives/types.js';
// ============================================================================
// Ensemble Cloud - /cloud/* endpoint for Ensemble Cloud integration
// ============================================================================
export { handleCloudRequest, isCloudRequest } from './cloud/index.js';
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
export function createConductorHandler(config) {
    return {
        async fetch(request, env, ctx) {
            // This will be implemented after we build the router and loader
            return new Response('Conductor initialized - handler implementation coming soon', {
                headers: { 'content-type': 'text/plain' },
            });
        },
    };
}
