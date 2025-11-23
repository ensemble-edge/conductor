/**
 * HonoConductorBridge
 *
 * Bridges Conductor's intelligent page system with Hono's routing.
 * Converts Conductor operations into Hono middleware chains.
 */
import type { Hono, MiddlewareHandler } from 'hono';
import type { PageAgent } from '../agents/page/page-agent.js';
import type { AgentConfig } from '../runtime/parser.js';
import { OperationRegistry, type OperationContext } from '../runtime/operation-registry.js';
/**
 * Page operation definition
 * Operations are converted to Hono middleware
 */
export interface PageOperation {
    name: string;
    operation: string;
    config: Record<string, any>;
    handler?: (context: OperationContext) => Promise<any>;
}
export interface RateLimitConfig {
    requests: number;
    window: number;
    key?: 'ip' | 'user' | ((context: OperationContext) => string);
}
export interface CorsConfig {
    origin?: string | string[];
    methods?: string[];
    allowHeaders?: string[];
    exposeHeaders?: string[];
    credentials?: boolean;
}
export interface RouteConfig {
    path: string;
    methods?: string[];
    auth?: 'none' | 'required' | 'optional';
    rateLimit?: RateLimitConfig;
    cors?: CorsConfig;
    middleware?: MiddlewareHandler[];
}
export interface ResponsesConfig {
    html?: {
        enabled: boolean;
    };
    json?: {
        enabled: boolean;
        transform?: (data: any) => any;
    };
    stream?: {
        enabled: boolean;
        chunkSize?: number;
    };
}
export interface CacheConfig {
    enabled: boolean;
    ttl: number;
    vary?: string[];
    tags?: string[];
    keyGenerator?: (context: OperationContext) => string;
}
/**
 * Extended page route configuration
 * Combines Hono routing + Conductor intelligence
 */
export interface PageRouteConfig extends AgentConfig {
    route: RouteConfig;
    beforeRender?: PageOperation[];
    afterRender?: PageOperation[];
    responses?: ResponsesConfig;
    layout?: string;
    layoutProps?: Record<string, any>;
    cache?: CacheConfig;
}
/**
 * HonoConductorBridge
 *
 * Bridges Conductor's intelligent page system with Hono's routing.
 * Converts Conductor operations into Hono middleware chains.
 */
export declare class HonoConductorBridge {
    private app;
    private pages;
    private layouts;
    private operationRegistry;
    private rateLimiters;
    constructor(app: Hono, operationRegistry?: OperationRegistry);
    /**
     * Register a PageAgent as Hono route(s)
     */
    registerPage(config: PageRouteConfig, agent: PageAgent): void;
    /**
     * Register a layout template
     */
    registerLayout(name: string, agent: PageAgent): void;
    /**
     * Build middleware chain from page configuration
     */
    private buildMiddlewareChain;
    /**
     * Create page handler (final handler in chain)
     */
    private createPageHandler;
    /**
     * Convert Conductor operation to Hono middleware
     */
    private operationToMiddleware;
    /**
     * Create auth middleware
     */
    private createAuthMiddleware;
    /**
     * Create optional auth middleware
     */
    private createOptionalAuthMiddleware;
    /**
     * Create rate limit middleware
     */
    private createRateLimitMiddleware;
    /**
     * Create CORS middleware
     */
    private createCorsMiddleware;
    /**
     * Create cache check middleware
     */
    private createCacheCheckMiddleware;
    /**
     * Get or create rate limiter
     */
    private getRateLimiter;
    /**
     * Generate cache key
     */
    private generateCacheKey;
    /**
     * Normalize path
     */
    private normalizePath;
}
//# sourceMappingURL=hono-bridge.d.ts.map