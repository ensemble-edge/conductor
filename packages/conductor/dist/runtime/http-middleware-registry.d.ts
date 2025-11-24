/**
 * HTTP Middleware Registry
 *
 * Allows registration of named Hono middleware that can be referenced
 * in YAML ensemble files by string identifier.
 *
 * This is specifically for HTTP trigger middleware (Hono framework).
 *
 * Example usage:
 * ```typescript
 * import { getHttpMiddlewareRegistry } from '@ensemble-edge/conductor'
 * import { logger } from 'hono/logger'
 *
 * const registry = getHttpMiddlewareRegistry()
 * registry.register('logger', logger())
 * ```
 *
 * Then in YAML:
 * ```yaml
 * trigger:
 *   - type: http
 *     middleware: [logger, compress, timing]
 * ```
 */
import type { MiddlewareHandler } from 'hono';
export interface HttpMiddlewareMetadata {
    /**
     * Middleware identifier (e.g., 'logger', 'compress', 'timing')
     */
    name: string;
    /**
     * Human-readable description
     */
    description: string;
    /**
     * Package that provides this middleware (optional)
     */
    package?: string;
    /**
     * Configuration options (optional)
     */
    configurable?: boolean;
}
/**
 * Global registry for named Hono middleware (HTTP trigger specific)
 */
export declare class HttpMiddlewareRegistry {
    private static instance;
    private middleware;
    private metadata;
    private constructor();
    /**
     * Get singleton instance
     */
    static getInstance(): HttpMiddlewareRegistry;
    /**
     * Reset registry (for testing)
     */
    reset(): void;
    /**
     * Register a middleware handler
     */
    register(name: string, handler: MiddlewareHandler, metadata?: Partial<HttpMiddlewareMetadata>): void;
    /**
     * Get middleware handler by name
     */
    get(name: string): MiddlewareHandler | undefined;
    /**
     * Get metadata for a middleware
     */
    getMetadata(name: string): HttpMiddlewareMetadata | undefined;
    /**
     * Check if middleware exists
     */
    has(name: string): boolean;
    /**
     * List all registered middleware names
     */
    list(): string[];
    /**
     * Get all middleware metadata
     */
    getAllMetadata(): HttpMiddlewareMetadata[];
    /**
     * Resolve middleware array from mixed string/function array
     * Supports both YAML (strings) and TypeScript (functions)
     */
    resolve(middlewareArray: (string | MiddlewareHandler)[]): MiddlewareHandler[];
}
/**
 * Get the global HTTP middleware registry instance
 */
export declare function getHttpMiddlewareRegistry(): HttpMiddlewareRegistry;
//# sourceMappingURL=http-middleware-registry.d.ts.map