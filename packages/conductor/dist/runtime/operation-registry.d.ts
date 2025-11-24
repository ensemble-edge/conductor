/**
 * Operation Registry
 *
 * Global registry for operations that can be used across ALL contexts
 * (ensembles, pages, forms, APIs, webhooks, etc.)
 *
 * This enables:
 * - Dynamic operation registration (plugins can add operations)
 * - Universal operation interface (same operation works everywhere)
 * - Operation discovery and metadata
 */
import type { ConductorEnv } from '../types/env.js';
/**
 * Context in which an operation is being executed
 */
export interface OperationContext {
    /** Cloudflare Request object (if available) */
    request?: Request;
    /** Cloudflare Workers environment bindings */
    env: ConductorEnv;
    /** Cloudflare Workers execution context */
    ctx: ExecutionContext;
    /** URL/route parameters */
    params?: Record<string, string>;
    /** Query string parameters */
    query?: Record<string, string>;
    /** Request headers */
    headers?: Record<string, string>;
    /** Input data for the operation */
    data?: Record<string, any>;
    /** Context type where operation is being used */
    contextType: 'ensemble' | 'page' | 'form' | 'api' | 'webhook';
    /** Agent registry (for agent operations) */
    agentRegistry?: Map<string, any>;
}
/**
 * Configuration for an operation
 */
export interface OperationConfig {
    /** Operation name/type (e.g., 'think', 'fetch-data', 'plasmic:render') */
    operation: string;
    /** Operation-specific configuration */
    config: Record<string, any>;
    /** Optional custom handler (overrides registered handler) */
    handler?: (context: OperationContext) => Promise<any>;
}
/**
 * Operation handler interface
 */
export interface OperationHandler {
    /**
     * Execute the operation
     */
    execute(operation: OperationConfig, context: OperationContext): Promise<any>;
}
/**
 * Metadata about an operation
 */
export interface OperationMetadata {
    /** Operation identifier */
    name: string;
    /** Human-readable description */
    description: string;
    /** Version (semver) */
    version?: string;
    /** Plugin/package that provides this operation */
    author?: string;
    /** Contexts where this operation can be used */
    contexts?: Array<'ensemble' | 'page' | 'form' | 'api' | 'webhook' | 'all'>;
    /** Input schema (for validation/documentation) */
    inputs?: Record<string, any>;
    /** Output schema (for validation/documentation) */
    outputs?: Record<string, any>;
    /** Tags for categorization */
    tags?: string[];
}
/**
 * Global Operation Registry
 *
 * Singleton registry for ALL operations across ALL contexts.
 * Enables plugins to register custom operations that work universally.
 */
export declare class OperationRegistry {
    private static instance;
    private operations;
    private metadata;
    private constructor();
    /**
     * Get singleton instance
     */
    static getInstance(): OperationRegistry;
    /**
     * Register an operation handler
     *
     * This operation will be available in ALL contexts (ensembles, pages, forms, etc.)
     * Plugins use this to add custom operations.
     *
     * @example
     * ```typescript
     * registry.register('plasmic:render', plasmicHandler, {
     *   name: 'plasmic:render',
     *   description: 'Render Plasmic component',
     *   version: '1.0.0',
     *   author: '@conductor/plasmic'
     * })
     * ```
     */
    register(name: string, handler: OperationHandler, metadata?: OperationMetadata): void;
    /**
     * Get operation handler
     */
    get(name: string): OperationHandler | undefined;
    /**
     * Get operation metadata
     */
    getMetadata(name: string): OperationMetadata | undefined;
    /**
     * List all registered operations
     */
    list(): string[];
    /**
     * List operations by context type
     */
    listByContext(contextType: 'ensemble' | 'page' | 'form' | 'api' | 'webhook'): string[];
    /**
     * List operations by tag
     */
    listByTag(tag: string): string[];
    /**
     * Check if operation exists
     */
    has(name: string): boolean;
    /**
     * Execute an operation
     */
    execute(operation: OperationConfig, context: OperationContext): Promise<any>;
    /**
     * Register built-in operations
     *
     * These are the core operations provided by Conductor.
     * Plugins can add additional operations via register().
     */
    private registerBuiltInOperations;
    /**
     * Unregister an operation (for testing)
     */
    unregister(name: string): boolean;
    /**
     * Clear all operations (for testing)
     */
    clear(): void;
    /**
     * Reset registry to initial state (for testing)
     */
    reset(): void;
}
/**
 * Get global operation registry instance
 */
export declare function getOperationRegistry(): OperationRegistry;
//# sourceMappingURL=operation-registry.d.ts.map