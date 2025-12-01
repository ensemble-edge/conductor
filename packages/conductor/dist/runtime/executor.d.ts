/**
 * Core Executor - Refactored with Result Types
 *
 * Orchestrates ensemble execution with explicit error handling using Result types.
 * Makes all error cases explicit and checked at compile time.
 */
import { type EnsembleConfig, type AgentConfig } from './parser.js';
import { type AccessReport } from './state-manager.js';
import type { BaseAgent } from '../agents/base-agent.js';
import type { ConductorEnv } from '../types/env.js';
import { type AsyncResult } from '../types/result.js';
import { type ConductorError } from '../errors/error-types.js';
import { type ScoringState } from './scoring/index.js';
import { type SuspendedExecutionState } from './resumption-manager.js';
import { type Logger } from '../observability/index.js';
import type { RequestId } from '../types/branded.js';
import type { ObservabilityConfig } from '../config/types.js';
import { type OutputFormat } from './output-resolver.js';
import type { AuthContext } from '../auth/types.js';
/**
 * Discovery data for agents, ensembles, and other resources
 *
 * Allows agents to discover and enumerate available resources at runtime.
 * This is the canonical way to pass auto-discovered resources to the executor.
 *
 * The interface is designed to be extensible for future resource types.
 * Each resource type provides the Map format expected by its registry.
 *
 * @example
 * ```typescript
 * const executor = new Executor({
 *   env,
 *   ctx,
 *   discovery: {
 *     ensembles: ensembleLoader.getRegistryData(),
 *     agents: agentLoader.getRegistryData(),
 *     docs: docsLoader.getRegistryData(),
 *   }
 * });
 * ```
 */
export interface DiscoveryData {
    /**
     * Ensemble registry data from EnsembleLoader.getRegistryData()
     * Used to populate ctx.ensembleRegistry for agent access
     */
    ensembles?: Map<string, {
        config: EnsembleConfig;
        source: 'yaml' | 'typescript';
    }>;
    /**
     * Agent metadata for discovery (agents are also passed via registerAgent)
     * This provides additional discovery data beyond what's in the agent registry
     */
    agents?: Map<string, {
        config: AgentConfig;
        source: 'yaml' | 'typescript';
    }>;
    /**
     * Docs pages from DocsDirectoryLoader
     * Allows agents to discover available documentation pages
     */
    docs?: Map<string, {
        content: string;
        title: string;
        slug: string;
    }>;
    /**
     * Extensible custom discovery data
     * Use this for project-specific or future resource types
     *
     * @example
     * ```typescript
     * discovery: {
     *   custom: {
     *     'workflows': myWorkflowsMap,
     *     'integrations': myIntegrationsMap,
     *   }
     * }
     * ```
     */
    custom?: Record<string, Map<string, unknown>>;
}
export interface ExecutorConfig {
    env: ConductorEnv;
    ctx: ExecutionContext;
    logger?: Logger;
    /** Observability configuration from conductor.config.ts */
    observability?: ObservabilityConfig;
    /** Request ID from incoming HTTP request (for tracing) - branded type for type safety */
    requestId?: RequestId;
    /** Authentication context from the request */
    auth?: AuthContext;
    /** Default timeout for agent execution in milliseconds (default: 30000) */
    defaultTimeout?: number;
    /** Discovery data for agents and ensembles - enables ctx.agentRegistry and ctx.ensembleRegistry */
    discovery?: DiscoveryData;
}
/**
 * Response metadata for HTTP responses
 */
export interface ResponseMetadata {
    /** HTTP status code (default: 200) */
    status: number;
    /** Custom response headers */
    headers?: Record<string, string>;
    /** Redirect configuration */
    redirect?: {
        url: string;
        status?: 301 | 302 | 307 | 308;
    };
    /** If true, output is raw string (not JSON) */
    isRawBody?: boolean;
    /** Output format for Content-Type and serialization (triggers only) */
    format?: OutputFormat;
}
/**
 * Successful execution output
 */
export interface ExecutionOutput {
    output: unknown;
    metrics: ExecutionMetrics;
    stateReport?: AccessReport;
    scoring?: ScoringState;
    /** Response metadata for HTTP responses (status, headers, redirect) */
    response?: ResponseMetadata;
}
/**
 * Legacy execution result for backwards compatibility
 * New code should use Result<ExecutionOutput, ConductorError>
 */
export interface ExecutionResult {
    success: boolean;
    output?: unknown;
    error?: string;
    metrics: ExecutionMetrics;
    stateReport?: AccessReport;
}
export interface ExecutionMetrics {
    ensemble: string;
    totalDuration: number;
    agents: AgentMetric[];
    cacheHits: number;
    stateAccess?: AccessReport;
}
export interface AgentMetric {
    name: string;
    duration: number;
    cached: boolean;
    success: boolean;
}
/**
 * Core execution engine for ensembles with Result-based error handling
 */
export declare class Executor {
    private env;
    private ctx;
    private agentRegistry;
    private logger;
    private observabilityConfig?;
    private requestId?;
    private auth?;
    private defaultTimeout;
    private discoveryData?;
    constructor(config: ExecutorConfig);
    /**
     * Register an agent for use in ensembles
     */
    registerAgent(agent: BaseAgent): void;
    /**
     * Resolve an agent by reference with explicit error handling
     * Supports both simple names and versioned references (name@version)
     *
     * Loading priority:
     * 1. Check built-in agents (scrape, validate, rag, hitl, fetch)
     * 2. Check user-defined agents (registered via registerAgent)
     * 3. Error if not found
     *
     * @param agentRef - Agent reference (e.g., "greet" or "analyze-company@production")
     * @returns Result containing the agent or an error
     */
    private resolveAgent;
    /**
     * Create an agent instance from config
     * Used for dynamically loading agents from Edgit
     */
    private createAgentFromConfig;
    /**
     * Resolve input for a step based on explicit mapping, previous output, or ensemble input
     * @private
     */
    private resolveStepInput;
    /**
     * Build the agent execution context with all necessary dependencies
     * @private
     */
    private buildAgentContext;
    /**
     * Execute agent with scoring/retry logic
     * @private
     */
    private executeAgentWithScoring;
    /**
     * Execute agent without scoring (normal path)
     * @private
     */
    private executeAgentDirect;
    /**
     * Record agent execution metrics
     * @private
     */
    private recordAgentMetrics;
    /**
     * Execute a single flow step with all associated logic
     * Only handles AgentFlowStep - control flow steps should use GraphExecutor
     * @private
     */
    private executeStep;
    /**
     * Execute ensemble flow from a given step
     * Automatically uses GraphExecutor for flows with control flow steps (parallel, branch, etc.)
     * @private
     */
    private executeFlow;
    /**
     * Execute flow using GraphExecutor for control flow constructs
     * Handles parallel, branch, foreach, try/catch, switch, while, and map-reduce steps
     * @private
     */
    private executeFlowWithGraph;
    /**
     * Register inline agents defined in an ensemble's agents array
     *
     * Supports:
     * 1. script:// URIs - Resolved from bundled scripts (Works in Workers!)
     * 2. Pre-compiled handlers - Function objects passed in config.handler
     * 3. Inline code strings - DEPRECATED, only works in test environments
     *
     * @private
     */
    private registerInlineAgents;
    /**
     * Resolve a script:// URI to a handler function from bundled scripts
     * @private
     */
    private resolveScriptHandler;
    /**
     * Create memory manager from ensemble config
     * Extracts userId/sessionId from input and auth context
     * @private
     */
    private createMemoryManager;
    /**
     * Execute an ensemble with Result-based error handling
     * @param ensemble - Parsed ensemble configuration
     * @param input - Input data for the ensemble
     * @returns Result containing execution output or error
     */
    executeEnsemble(ensemble: EnsembleConfig, input: Record<string, any>): AsyncResult<ExecutionOutput, ConductorError>;
    /**
     * Load and execute an ensemble from YAML with Result-based error handling
     */
    executeFromYAML(yamlContent: string, input: Record<string, any>): AsyncResult<ExecutionOutput, ConductorError>;
    /**
     * Get all registered agent names (both built-in and user-defined)
     */
    getRegisteredMembers(): string[];
    /**
     * Check if a agent is registered (checks both built-in and user-defined)
     */
    hasMember(agentName: string): boolean;
    /**
     * Get all built-in agent metadata
     */
    getBuiltInMembers(): import("../agents/built-in/types.js").BuiltInAgentMetadata[];
    /**
     * Resume execution from suspended state
     * Used for HITL approval workflows and webhook resumption
     */
    resumeExecution(suspendedState: SuspendedExecutionState, resumeInput?: Record<string, any>): AsyncResult<ExecutionOutput, ConductorError>;
}
//# sourceMappingURL=executor.d.ts.map