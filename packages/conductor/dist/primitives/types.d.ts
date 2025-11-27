/**
 * Primitives Types
 *
 * Shared type definitions for all Conductor primitives.
 * These types are the canonical definitions used by both YAML and TypeScript authoring.
 */
import type { z } from 'zod';
import type { Operation, OperationType } from '../types/operation.js';
export { Operation, type OperationType };
/**
 * Execution context passed to all primitives at runtime
 */
export interface Context {
    /** Input data for the execution */
    input: Record<string, unknown>;
    /** Current state (if state management enabled) */
    state?: Record<string, unknown>;
    /** Environment bindings (KV, D1, etc.) */
    env: Record<string, unknown>;
    /** Cloudflare execution context */
    ctx: ExecutionContext;
    /** Outputs from previous agents */
    previousOutputs?: Record<string, unknown>;
    /** Logger instance */
    logger?: Logger;
    /** User-defined metadata */
    metadata?: Record<string, unknown>;
}
/**
 * Logger interface
 */
export interface Logger {
    debug(message: string, ...args: unknown[]): void;
    info(message: string, ...args: unknown[]): void;
    warn(message: string, ...args: unknown[]): void;
    error(message: string, ...args: unknown[]): void;
}
/**
 * Cloudflare ExecutionContext
 */
export interface ExecutionContext {
    waitUntil(promise: Promise<unknown>): void;
    passThroughOnException(): void;
}
/**
 * Retry configuration for steps
 */
export interface RetryConfig {
    /** Maximum number of retry attempts */
    attempts?: number;
    /** Backoff strategy */
    backoff?: 'linear' | 'exponential' | 'fixed';
    /** Initial delay in milliseconds */
    initialDelay?: number;
    /** Maximum delay in milliseconds */
    maxDelay?: number;
    /** Error types to retry on */
    retryOn?: string[];
}
/**
 * Cache configuration for steps
 */
export interface CacheConfig {
    /** Time-to-live in seconds */
    ttl?: number;
    /** Bypass cache for this execution */
    bypass?: boolean;
    /** Custom cache key */
    key?: string;
}
/**
 * Scoring configuration for steps
 */
export interface ScoringConfig {
    /** Evaluator agent name */
    evaluator: string;
    /** Score thresholds */
    thresholds?: {
        minimum?: number;
        target?: number;
        excellent?: number;
    };
    /** Evaluation criteria */
    criteria?: Record<string, string> | unknown[];
    /** Action on failure */
    onFailure?: 'retry' | 'continue' | 'abort';
    /** Maximum retry attempts for scoring */
    retryLimit?: number;
    /** Require improvement on retry */
    requireImprovement?: boolean;
    /** Minimum improvement threshold */
    minImprovement?: number;
}
/**
 * State access configuration for steps
 */
export interface StateAccessConfig {
    /** State fields to read */
    use?: string[];
    /** State fields to write */
    set?: string[];
}
/**
 * Timeout configuration
 */
export interface TimeoutConfig {
    /** Fallback value on timeout */
    fallback?: unknown;
    /** Throw error on timeout */
    error?: boolean;
}
/**
 * Base step configuration (shared by all step types)
 */
export interface BaseStepConfig {
    /** Step identifier (for referencing in expressions) */
    id?: string;
    /** Input data mapping */
    input?: Record<string, unknown>;
    /** Conditional execution expression */
    condition?: unknown;
    /** Alias for condition */
    when?: unknown;
    /** Dependencies (step names that must complete first) */
    depends_on?: string[];
    /** Retry configuration */
    retry?: RetryConfig;
    /** Timeout in milliseconds */
    timeout?: number;
    /** Timeout behavior */
    onTimeout?: TimeoutConfig;
    /** Cache configuration */
    cache?: CacheConfig;
    /** Scoring configuration */
    scoring?: ScoringConfig;
    /** State access configuration */
    state?: StateAccessConfig;
}
/**
 * Agent step configuration
 */
export interface AgentStepConfig extends BaseStepConfig {
    /** Operation type (think, code, http, etc.) */
    operation?: OperationType;
    /** Script path for code operations */
    script?: string;
    /** Agent-specific configuration */
    config?: Record<string, unknown>;
}
/**
 * Parallel execution options
 */
export interface ParallelOptions {
    /** Wait strategy */
    waitFor?: 'all' | 'any' | 'first';
}
/**
 * Branch options
 */
export interface BranchOptions {
    /** Steps to execute if condition is true */
    then: FlowStepType[];
    /** Steps to execute if condition is false */
    else?: FlowStepType[];
}
/**
 * Foreach options
 */
export interface ForeachOptions {
    /** Maximum concurrent iterations */
    maxConcurrency?: number;
    /** Early exit condition */
    breakWhen?: unknown;
}
/**
 * Try/catch options
 */
export interface TryOptions {
    /** Steps to execute on error */
    catch?: FlowStepType[];
    /** Steps to always execute */
    finally?: FlowStepType[];
}
/**
 * While loop options
 */
export interface WhileOptions {
    /** Maximum iterations (safety limit) */
    maxIterations?: number;
}
/**
 * Map-reduce options
 */
export interface MapReduceOptions {
    /** Maximum concurrent map operations */
    maxConcurrency?: number;
}
/**
 * Agent flow step
 */
export interface AgentFlowStep extends BaseStepConfig {
    /** Agent name to execute */
    agent: string;
}
/**
 * Parallel flow step
 */
export interface ParallelFlowStep {
    type: 'parallel';
    steps: FlowStepType[];
    waitFor?: 'all' | 'any' | 'first';
}
/**
 * Branch flow step
 */
export interface BranchFlowStep {
    type: 'branch';
    condition: unknown;
    then: FlowStepType[];
    else?: FlowStepType[];
}
/**
 * Foreach flow step
 */
export interface ForeachFlowStep {
    type: 'foreach';
    items: unknown;
    step: FlowStepType;
    maxConcurrency?: number;
    breakWhen?: unknown;
}
/**
 * Try flow step
 */
export interface TryFlowStep {
    type: 'try';
    steps: FlowStepType[];
    catch?: FlowStepType[];
    finally?: FlowStepType[];
}
/**
 * Switch flow step
 */
export interface SwitchFlowStep {
    type: 'switch';
    value: unknown;
    cases: Record<string, FlowStepType[]>;
    default?: FlowStepType[];
}
/**
 * While flow step
 */
export interface WhileFlowStep {
    type: 'while';
    condition: unknown;
    steps: FlowStepType[];
    maxIterations?: number;
}
/**
 * Map-reduce flow step
 */
export interface MapReduceFlowStep {
    type: 'map-reduce';
    items: unknown;
    map: FlowStepType;
    reduce: FlowStepType;
    maxConcurrency?: number;
}
/**
 * Union of all flow step types
 */
export type FlowStepType = AgentFlowStep | ParallelFlowStep | BranchFlowStep | ForeachFlowStep | TryFlowStep | SwitchFlowStep | WhileFlowStep | MapReduceFlowStep;
/**
 * Trigger configuration (matches parser.ts)
 */
export type TriggerType = 'webhook' | 'http' | 'mcp' | 'email' | 'queue' | 'cron';
/**
 * State configuration
 */
export interface StateConfig {
    /** State schema definition */
    schema?: Record<string, unknown>;
    /** Initial state values */
    initial?: Record<string, unknown>;
}
/**
 * Ensemble lifecycle hooks
 */
export interface EnsembleHooks {
    /** Called before execution starts */
    beforeExecute?: (context: Context) => void | Promise<void>;
    /** Called after execution completes */
    afterExecute?: (result: unknown, context: Context) => void | Promise<void>;
    /** Called when an error occurs */
    onError?: (error: Error, step: FlowStepType, context: Context) => 'retry' | 'skip' | 'fail';
    /** Dynamic step generator */
    dynamicSteps?: (context: Context) => FlowStepType[] | Promise<FlowStepType[]>;
}
/**
 * Agent lifecycle hooks
 */
export interface AgentHooks {
    /** Called before agent executes */
    beforeExecute?: (input: unknown, context: Context) => void | Promise<void>;
    /** Called after agent completes */
    afterExecute?: (output: unknown, context: Context) => void | Promise<void>;
}
/**
 * Agent schema definition
 */
export interface AgentSchemaConfig {
    /** Input schema */
    input?: Record<string, unknown>;
    /** Output schema */
    output?: Record<string, unknown>;
}
/**
 * JSON Schema type (simplified)
 */
export interface JSONSchema {
    type?: string;
    properties?: Record<string, JSONSchema>;
    required?: string[];
    items?: JSONSchema;
    [key: string]: unknown;
}
/**
 * Tool input/output schema (Zod or JSON Schema)
 */
export type ToolSchema = z.ZodSchema | JSONSchema;
/**
 * Memory provider types
 */
export type MemoryType = 'conversation' | 'semantic' | 'working' | 'persistent';
/**
 * Memory configuration
 */
export interface MemoryConfig {
    /** Memory type */
    type: MemoryType;
    /** Storage provider (e.g., 'cloudflare-kv') */
    provider?: string;
    /** Namespace for isolation */
    namespace?: string;
    /** Time-to-live in seconds */
    ttl?: number;
}
/**
 * Component types that can be referenced
 * Aligned with Edgit's component types for version primitives
 */
export type ComponentType = 'agent' | 'ensemble' | 'tool' | 'prompt' | 'schema' | 'script' | 'template' | 'query' | 'config';
/**
 * Version reference structure
 */
export interface VersionReference {
    /** Component type */
    type: ComponentType;
    /** Full path (e.g., 'agents/analyzer') */
    path: string;
    /** Version (e.g., '1.0.0', 'latest') */
    version: string;
}
/**
 * Suspend step for human-in-the-loop
 */
export interface SuspendStep {
    type: 'suspend';
    /** Unique identifier for resume */
    id: string;
    /** Timeout in milliseconds */
    timeout?: number;
    /** Action on timeout */
    onTimeout?: 'fail' | 'continue';
    /** Additional metadata */
    metadata?: Record<string, unknown>;
}
/**
 * Sleep step for delays
 */
export interface SleepStep {
    type: 'sleep';
    /** Duration in milliseconds */
    duration: number;
}
/**
 * Sleep until step for scheduled execution
 */
export interface SleepUntilStep {
    type: 'sleep-until';
    /** ISO timestamp to sleep until */
    until: string;
}
/**
 * Check if a step is a parallel step
 */
export declare function isParallelStep(step: FlowStepType): step is ParallelFlowStep;
/**
 * Check if a step is a branch step
 */
export declare function isBranchStep(step: FlowStepType): step is BranchFlowStep;
/**
 * Check if a step is a foreach step
 */
export declare function isForeachStep(step: FlowStepType): step is ForeachFlowStep;
/**
 * Check if a step is a try step
 */
export declare function isTryStep(step: FlowStepType): step is TryFlowStep;
/**
 * Check if a step is a switch step
 */
export declare function isSwitchStep(step: FlowStepType): step is SwitchFlowStep;
/**
 * Check if a step is a while step
 */
export declare function isWhileStep(step: FlowStepType): step is WhileFlowStep;
/**
 * Check if a step is a map-reduce step
 */
export declare function isMapReduceStep(step: FlowStepType): step is MapReduceFlowStep;
/**
 * Check if a step is an agent step (no 'type' field)
 */
export declare function isAgentStep(step: FlowStepType): step is AgentFlowStep;
/**
 * Check if a step is a control flow step (has 'type' field)
 */
export declare function isControlFlowStep(step: FlowStepType): step is Exclude<FlowStepType, AgentFlowStep>;
/**
 * Check if a step is any flow control step
 */
export declare function isFlowControlStep(step: FlowStepType): boolean;
/**
 * Step options (used by step() function)
 */
export interface StepOptions {
    /** Operation type (think, code, http, etc.) */
    operation?: OperationType;
    /** Script path for code operations */
    script?: string;
    /** Agent-specific configuration */
    config?: Record<string, unknown>;
    /** Input data mapping */
    input?: Record<string, unknown>;
    /** Conditional execution expression */
    condition?: unknown;
    /** Alias for condition */
    when?: unknown;
    /** Step identifier */
    id?: string;
    /** Dependencies */
    depends_on?: string[];
    /** Retry configuration */
    retry?: RetryConfig;
    /** Timeout in milliseconds */
    timeout?: number;
    /** Timeout behavior */
    onTimeout?: TimeoutConfig;
    /** Cache configuration */
    cache?: CacheConfig;
    /** Scoring configuration */
    scoring?: ScoringConfig;
    /** State access configuration */
    state?: StateAccessConfig;
}
/**
 * Agent configuration (for inline agents in ensembles)
 */
export interface AgentConfig {
    /** Agent name */
    name: string;
    /** Operation type */
    operation?: OperationType;
    /** Description */
    description?: string;
    /** Agent-specific config */
    config?: Record<string, unknown>;
    /** Schema definition */
    schema?: AgentSchemaConfig;
}
/**
 * Output configuration for ensembles
 */
export interface OutputConfig {
    /** Output field mappings */
    [key: string]: unknown;
}
//# sourceMappingURL=types.d.ts.map