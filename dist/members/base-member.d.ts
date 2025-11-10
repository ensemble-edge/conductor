/**
 * Base Member class
 *
 * Foundation for all member types (Think, Function, Data, API, etc.)
 * Provides standard interface, response wrapping, error handling, and cache key generation
 */
import type { MemberConfig } from '../runtime/parser.js';
import type { ConductorEnv } from '../types/env.js';
import type { Logger } from '../observability/types.js';
export interface MemberExecutionContext {
    input: Record<string, any>;
    state?: Record<string, any>;
    setState?: (updates: Record<string, any>) => void;
    env: ConductorEnv;
    ctx: ExecutionContext;
    previousOutputs?: Record<string, any>;
    logger?: Logger;
}
export interface MemberResponse {
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
 * Base class for all member types
 */
export declare abstract class BaseMember {
    protected config: MemberConfig;
    protected name: string;
    protected type: string;
    constructor(config: MemberConfig);
    /**
     * Execute the member with given input and context
     * @param context - Execution context
     * @returns Member response
     */
    execute(context: MemberExecutionContext): Promise<MemberResponse>;
    /**
     * Abstract method to be implemented by each member type
     * @param context - Execution context
     * @returns Execution result
     */
    protected abstract run(context: MemberExecutionContext): Promise<any>;
    /**
     * Wrap successful execution result
     * @param data - Result data
     * @param executionTime - Time taken in milliseconds
     * @param cached - Whether result was cached
     * @returns Wrapped response
     */
    protected wrapSuccess(data: unknown, executionTime: number, cached?: boolean): MemberResponse;
    /**
     * Wrap error response
     * @param error - Error object
     * @param executionTime - Time taken in milliseconds
     * @returns Wrapped error response
     */
    protected wrapError(error: unknown, executionTime: number): MemberResponse;
    /**
     * Generate cache key for this member's execution
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
     * Get member configuration
     * @returns Member configuration
     */
    getConfig(): MemberConfig;
    /**
     * Get member name
     * @returns Member name
     */
    getName(): string;
    /**
     * Get member type
     * @returns Member type
     */
    getType(): string;
}
//# sourceMappingURL=base-member.d.ts.map