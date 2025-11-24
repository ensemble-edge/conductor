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
import { createLogger } from '../observability/index.js';
const logger = createLogger({ serviceName: 'http-middleware-registry' });
/**
 * Global registry for named Hono middleware (HTTP trigger specific)
 */
export class HttpMiddlewareRegistry {
    constructor() {
        this.middleware = new Map();
        this.metadata = new Map();
        // Private constructor for singleton
    }
    /**
     * Get singleton instance
     */
    static getInstance() {
        if (!HttpMiddlewareRegistry.instance) {
            HttpMiddlewareRegistry.instance = new HttpMiddlewareRegistry();
        }
        return HttpMiddlewareRegistry.instance;
    }
    /**
     * Reset registry (for testing)
     */
    reset() {
        this.middleware.clear();
        this.metadata.clear();
    }
    /**
     * Register a middleware handler
     */
    register(name, handler, metadata) {
        if (this.middleware.has(name)) {
            logger.warn(`[HttpMiddlewareRegistry] Overwriting middleware: ${name}`);
        }
        this.middleware.set(name, handler);
        const fullMetadata = {
            name,
            description: metadata?.description || name,
            package: metadata?.package,
            configurable: metadata?.configurable || false,
        };
        this.metadata.set(name, fullMetadata);
        logger.info(`[HttpMiddlewareRegistry] Registered middleware: ${name}`, {
            package: fullMetadata.package,
        });
    }
    /**
     * Get middleware handler by name
     */
    get(name) {
        return this.middleware.get(name);
    }
    /**
     * Get metadata for a middleware
     */
    getMetadata(name) {
        return this.metadata.get(name);
    }
    /**
     * Check if middleware exists
     */
    has(name) {
        return this.middleware.has(name);
    }
    /**
     * List all registered middleware names
     */
    list() {
        return Array.from(this.middleware.keys());
    }
    /**
     * Get all middleware metadata
     */
    getAllMetadata() {
        return Array.from(this.metadata.values());
    }
    /**
     * Resolve middleware array from mixed string/function array
     * Supports both YAML (strings) and TypeScript (functions)
     */
    resolve(middlewareArray) {
        const resolved = [];
        for (const item of middlewareArray) {
            if (typeof item === 'string') {
                // String identifier - look up in registry
                const handler = this.get(item);
                if (!handler) {
                    logger.warn(`[HttpMiddlewareRegistry] Middleware not found: ${item}`, {
                        available: this.list(),
                    });
                    continue;
                }
                resolved.push(handler);
            }
            else if (typeof item === 'function') {
                // Direct function reference (TypeScript usage)
                resolved.push(item);
            }
            else {
                logger.warn(`[HttpMiddlewareRegistry] Invalid middleware type: ${typeof item}`, { item });
            }
        }
        return resolved;
    }
}
HttpMiddlewareRegistry.instance = null;
/**
 * Get the global HTTP middleware registry instance
 */
export function getHttpMiddlewareRegistry() {
    return HttpMiddlewareRegistry.getInstance();
}
