/**
 * HonoConductorBridge
 *
 * Bridges Conductor's intelligent page system with Hono's routing.
 * Converts Conductor operations into Hono middleware chains.
 */
import { OperationRegistry } from '../runtime/operation-registry.js';
/**
 * HonoConductorBridge
 *
 * Bridges Conductor's intelligent page system with Hono's routing.
 * Converts Conductor operations into Hono middleware chains.
 */
export class HonoConductorBridge {
    constructor(app, operationRegistry) {
        this.pages = new Map();
        this.layouts = new Map();
        this.rateLimiters = new Map();
        this.app = app;
        this.operationRegistry = operationRegistry || OperationRegistry.getInstance();
    }
    /**
     * Register a PageAgent as Hono route(s)
     */
    registerPage(config, agent) {
        const { route } = config;
        const path = this.normalizePath(route.path);
        const methods = route.methods || ['GET'];
        // Build middleware chain from Conductor operations
        const middleware = this.buildMiddlewareChain(config);
        // Main handler: execute PageAgent and return response
        const handler = this.createPageHandler(config, agent);
        // Register with Hono for each HTTP method
        for (const method of methods.map((m) => m.toLowerCase())) {
            ;
            this.app[method](path, ...middleware, handler);
        }
        // Store agent reference
        this.pages.set(config.name, agent);
    }
    /**
     * Register a layout template
     */
    registerLayout(name, agent) {
        this.layouts.set(name, agent);
    }
    /**
     * Build middleware chain from page configuration
     */
    buildMiddlewareChain(config) {
        const middleware = [];
        // Initialize conductor data store
        middleware.push(async (c, next) => {
            c.set('conductorData', {});
            await next();
        });
        // Auth middleware
        if (config.route.auth === 'required') {
            middleware.push(this.createAuthMiddleware());
        }
        else if (config.route.auth === 'optional') {
            middleware.push(this.createOptionalAuthMiddleware());
        }
        // Rate limiting middleware
        if (config.route.rateLimit) {
            middleware.push(this.createRateLimitMiddleware(config.route.rateLimit));
        }
        // CORS middleware
        if (config.route.cors) {
            middleware.push(this.createCorsMiddleware(config.route.cors));
        }
        // Custom Hono middleware
        if (config.route.middleware) {
            middleware.push(...config.route.middleware);
        }
        // Cache check middleware (before operations)
        if (config.cache?.enabled) {
            middleware.push(this.createCacheCheckMiddleware(config.cache));
        }
        // Convert beforeRender operations to middleware
        if (config.beforeRender) {
            for (const operation of config.beforeRender) {
                middleware.push(this.operationToMiddleware(operation));
            }
        }
        return middleware;
    }
    /**
     * Create page handler (final handler in chain)
     */
    createPageHandler(config, agent) {
        return async (c) => {
            // Extract route params, query, headers
            const params = c.req.param();
            const query = c.req.query();
            const headers = Object.fromEntries(c.req.raw.headers.entries());
            // Get accumulated data from middleware
            const conductorData = c.get('conductorData') || {};
            // Build input for PageAgent
            const input = {
                params,
                query,
                headers,
                request: c.req.raw,
                data: conductorData,
                env: c.env,
                ctx: c.executionCtx,
            };
            try {
                // Execute PageAgent
                const result = await agent.execute({
                    input,
                    env: c.env,
                    ctx: c.executionCtx,
                    state: {},
                    previousOutputs: {},
                });
                if (!result.success) {
                    throw new Error(result.error || 'Page render failed');
                }
                const output = (result.output || result.data);
                // Content negotiation based on Accept header
                const accept = c.req.header('Accept') || 'text/html';
                // JSON response
                if (config.responses?.json?.enabled && accept.includes('application/json')) {
                    const jsonData = config.responses.json.transform
                        ? config.responses.json.transform(output)
                        : { ...conductorData, html: output.html };
                    return c.json(jsonData);
                }
                // Default: HTML response
                return c.html(output.html, 200, output.headers);
            }
            catch (error) {
                console.error('Page execution error:', error);
                throw error;
            }
        };
    }
    /**
     * Convert Conductor operation to Hono middleware
     */
    operationToMiddleware(operation) {
        return async (c, next) => {
            const context = {
                request: c.req.raw,
                env: c.env,
                ctx: c.executionCtx,
                params: c.req.param(),
                query: c.req.query(),
                headers: Object.fromEntries(c.req.raw.headers.entries()),
                data: c.get('conductorData') || {},
                contextType: 'page',
            };
            try {
                // Get operation from GLOBAL registry
                const handler = this.operationRegistry.get(operation.operation);
                if (handler) {
                    // Execute registered operation handler
                    const operationResult = await handler.execute({
                        operation: operation.operation,
                        config: operation.config,
                    }, {
                        ...context,
                        data: context.data,
                        contextType: 'page',
                    });
                    // Store result in conductor data
                    const existingData = c.get('conductorData') || {};
                    c.set('conductorData', {
                        ...existingData,
                        [operation.name]: operationResult,
                    });
                }
                else if (operation.handler) {
                    // Execute inline handler
                    const operationResult = await operation.handler(context);
                    const existingData = c.get('conductorData') || {};
                    c.set('conductorData', {
                        ...existingData,
                        [operation.name]: operationResult,
                    });
                }
                else {
                    console.warn(`No handler found for operation: ${operation.operation}`);
                }
                await next();
            }
            catch (error) {
                console.error(`Operation error [${operation.name}]:`, error);
                throw error;
            }
        };
    }
    /**
     * Create auth middleware
     */
    createAuthMiddleware() {
        return async (c, next) => {
            const authHeader = c.req.header('Authorization');
            if (!authHeader) {
                return c.json({ error: 'Unauthorized', message: 'Missing Authorization header' }, 401);
            }
            // TODO: Integrate with Conductor's auth system
            const user = { id: 'user-123', authenticated: true };
            c.set('conductorData', {
                ...c.get('conductorData'),
                auth: { authenticated: true, user },
            });
            await next();
        };
    }
    /**
     * Create optional auth middleware
     */
    createOptionalAuthMiddleware() {
        return async (c, next) => {
            const authHeader = c.req.header('Authorization');
            if (authHeader) {
                const user = { id: 'user-123', authenticated: true };
                c.set('conductorData', {
                    ...c.get('conductorData'),
                    auth: { authenticated: true, user },
                });
            }
            else {
                c.set('conductorData', {
                    ...c.get('conductorData'),
                    auth: { authenticated: false },
                });
            }
            await next();
        };
    }
    /**
     * Create rate limit middleware
     */
    createRateLimitMiddleware(config) {
        return async (c, next) => {
            // Generate rate limit key
            let key;
            if (typeof config.key === 'function') {
                const context = {
                    request: c.req.raw,
                    env: c.env,
                    ctx: c.executionCtx,
                    params: c.req.param(),
                    query: c.req.query(),
                    headers: Object.fromEntries(c.req.raw.headers.entries()),
                    data: c.get('conductorData') || {},
                    contextType: 'page',
                };
                key = config.key(context);
            }
            else if (config.key === 'user') {
                const conductorData = c.get('conductorData') || {};
                key = conductorData.auth?.user?.id || c.req.header('CF-Connecting-IP') || 'unknown';
            }
            else {
                // Default: IP-based
                key = c.req.header('CF-Connecting-IP') || 'unknown';
            }
            // Check rate limit
            const rateLimiter = this.getRateLimiter(`${key}:${c.req.path}`);
            const allowed = await rateLimiter.check(config.requests, config.window, c.env);
            if (!allowed) {
                return c.json({
                    error: 'TooManyRequests',
                    message: `Rate limit exceeded: ${config.requests} requests per ${config.window}s`,
                }, 429);
            }
            await next();
        };
    }
    /**
     * Create CORS middleware
     */
    createCorsMiddleware(config) {
        return async (c, next) => {
            const origin = c.req.header('Origin');
            // Check if origin is allowed
            let allowedOrigin = '*';
            if (Array.isArray(config.origin)) {
                if (origin && config.origin.includes(origin)) {
                    allowedOrigin = origin;
                }
            }
            else if (config.origin) {
                allowedOrigin = config.origin;
            }
            // Set CORS headers
            c.header('Access-Control-Allow-Origin', allowedOrigin);
            if (config.methods) {
                c.header('Access-Control-Allow-Methods', config.methods.join(', '));
            }
            if (config.allowHeaders) {
                c.header('Access-Control-Allow-Headers', config.allowHeaders.join(', '));
            }
            if (config.exposeHeaders) {
                c.header('Access-Control-Expose-Headers', config.exposeHeaders.join(', '));
            }
            if (config.credentials) {
                c.header('Access-Control-Allow-Credentials', 'true');
            }
            // Handle preflight
            if (c.req.method === 'OPTIONS') {
                return new Response('', { status: 204 });
            }
            await next();
        };
    }
    /**
     * Create cache check middleware
     */
    createCacheCheckMiddleware(config) {
        return async (c, next) => {
            const env = c.env;
            if (!env.PAGE_CACHE) {
                await next();
                return;
            }
            // Generate cache key
            const context = {
                request: c.req.raw,
                env,
                ctx: c.executionCtx,
                params: c.req.param(),
                query: c.req.query(),
                headers: Object.fromEntries(c.req.raw.headers.entries()),
                data: {},
                contextType: 'page',
            };
            const cacheKey = config.keyGenerator
                ? config.keyGenerator(context)
                : this.generateCacheKey(c.req.path, context.query || {});
            // Check cache
            const cached = await env.PAGE_CACHE.get(cacheKey, 'json');
            if (cached) {
                // Cache hit - return cached response
                const cachedOutput = cached;
                return c.html(cachedOutput.html, 200, cachedOutput.headers);
            }
            // Cache miss - continue to page rendering
            await next();
        };
    }
    /**
     * Get or create rate limiter
     */
    getRateLimiter(key) {
        if (!this.rateLimiters.has(key)) {
            this.rateLimiters.set(key, new RateLimiter(key));
        }
        return this.rateLimiters.get(key);
    }
    /**
     * Generate cache key
     */
    generateCacheKey(path, query) {
        const queryString = Object.entries(query)
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([k, v]) => `${k}=${v}`)
            .join('&');
        return `page:${path}${queryString ? `:${queryString}` : ''}`;
    }
    /**
     * Normalize path
     */
    normalizePath(path) {
        path = path.startsWith('/') ? path : `/${path}`;
        path = path.endsWith('/') && path !== '/' ? path.slice(0, -1) : path;
        return path;
    }
}
/**
 * Simple rate limiter using KV
 */
class RateLimiter {
    constructor(key) {
        this.key = key;
    }
    async check(requests, windowSeconds, env) {
        if (!env.RATE_LIMIT_KV) {
            return true;
        }
        const now = Math.floor(Date.now() / 1000);
        const windowKey = `${this.key}:${Math.floor(now / windowSeconds)}`;
        // Get current count
        const current = await env.RATE_LIMIT_KV.get(windowKey);
        const count = current ? parseInt(current) : 0;
        if (count >= requests) {
            return false;
        }
        // Increment count
        await env.RATE_LIMIT_KV.put(windowKey, String(count + 1), {
            expirationTtl: windowSeconds * 2,
        });
        return true;
    }
}
