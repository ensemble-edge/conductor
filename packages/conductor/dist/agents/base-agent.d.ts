/**
 * Base Agent class
 *
 * Foundation for all agent types (Think, Function, Data, API, etc.)
 * Provides standard interface, response wrapping, error handling, and cache key generation
 */
import type { AgentConfig } from '../runtime/parser.js';
import type { ConductorEnv } from '../types/env.js';
import type { Logger } from '../observability/types.js';
export interface AgentExecutionContext {
    input: Record<string, any>;
    state?: Record<string, any>;
    setState?: (updates: Record<string, any>) => void;
    env: ConductorEnv;
    ctx: ExecutionContext;
    previousOutputs?: Record<string, any>;
    logger?: Logger;
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