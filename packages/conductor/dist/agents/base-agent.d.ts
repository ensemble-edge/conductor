/**
 * Base Agent class
 *
 * Foundation for all agent types (Think, Function, Data, API, etc.)
 * Provides standard interface, response wrapping, error handling, and cache key generation
 */
import type { AgentConfig } from '../runtime/parser.js';
import type { ConductorEnv } from '../types/env.js';
import type { Logger } from '../observability/types.js';
import type { MetricsRecorder } from '../observability/context.js';
/**
 * Execution context passed to agents
 *
 * Contains everything an agent needs to execute:
 * - Input data
 * - State management
 * - Environment bindings
 * - Observability (logger + metrics)
 */
export interface AgentExecutionContext {
    /** Input data for the agent */
    input: Record<string, any>;
    /** Shared state (if ensemble has state config) */
    state?: Record<string, any>;
    /** Function to update shared state */
    setState?: (updates: Record<string, any>) => void;
    /** Cloudflare environment bindings */
    env: ConductorEnv;
    /** Cloudflare execution context */
    ctx: ExecutionContext;
    /** Outputs from previous agents in the flow */
    previousOutputs?: Record<string, any>;
    /**
     * Scoped logger for this agent
     * Pre-configured with agent name, ensemble name, and execution IDs
     *
     * @example
     * ```typescript
     * export default async function(context: AgentExecutionContext) {
     *   const { logger } = context
     *   logger.info('Processing started', { itemCount: items.length })
     *   // ... do work ...
     *   logger.debug('Processing complete', { result })
     *   return result
     * }
     * ```
     */
    logger?: Logger;
    /**
     * Metrics recorder for Analytics Engine
     * Pre-configured with agent context
     *
     * @example
     * ```typescript
     * export default async function(context: AgentExecutionContext) {
     *   const { metrics } = context
     *   const startTime = Date.now()
     *   // ... do work ...
     *   metrics.record('items.processed', items.length)
     *   return result
     * }
     * ```
     */
    metrics?: MetricsRecorder;
    /**
     * Unique execution ID for tracing
     * Same across all agents in an ensemble execution
     */
    executionId?: string;
    /**
     * Unique request ID
     * Same across the entire HTTP request lifecycle
     */
    requestId?: string;
}
export interface AgentResponse {
    success: boolean;
    data?: unknown;
    output?: any;
    error?: string;
    timestamp: string;
    cached: boolean;
    executionTime: number;
    metadata?: Record<string, unknown>;
}
/**
 * Base class for all agent types
 */
export declare abstract class BaseAgent {
    protected config: AgentConfig;
    protected name: string;
    protected type: string;
    constructor(config: AgentConfig);
    /**
     * Execute the agent with given input and context
     * @param context - Execution context
     * @returns Agent response
     */
    execute(context: AgentExecutionContext): Promise<AgentResponse>;
    /**
     * Abstract method to be implemented by each agent type
     * @param context - Execution context
     * @returns Execution result
     */
    protected abstract run(context: AgentExecutionContext): Promise<any>;
    /**
     * Wrap successful execution result
     * @param data - Result data
     * @param executionTime - Time taken in milliseconds
     * @param cached - Whether result was cached
     * @returns Wrapped response
     */
    protected wrapSuccess(data: unknown, executionTime: number, cached?: boolean): AgentResponse;
    /**
     * Wrap error response
     * @param error - Error object
     * @param executionTime - Time taken in milliseconds
     * @returns Wrapped error response
     */
    protected wrapError(error: unknown, executionTime: number): AgentResponse;
    /**
     * Generate cache key for this agent's execution
     * @param input - Input data
     * @returns Cache key string
     */
    generateCacheKey(input: Record<string, any>): Promise<string>;
    /**
     * Sort object keys recursively for stable stringification
     * @param obj - Object to sort
     * @returns Sorted object
     */
    private sortObjectKeys;
    /**
     * Cryptographically secure SHA-256 hash function
     * @param str - String to hash
     * @returns Hash value (hex string)
     */
    private hashString;
    /**
     * Get agent configuration
     * @returns Agent configuration
     */
    getConfig(): AgentConfig;
    /**
     * Get agent name
     * @returns Agent name
     */
    getName(): string;
    /**
     * Get agent type
     * @returns Agent type
     */
    getType(): string;
}
//# sourceMappingURL=base-agent.d.ts.map