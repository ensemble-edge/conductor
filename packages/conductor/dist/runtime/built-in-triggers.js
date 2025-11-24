/**
 * Built-in Trigger Handlers
 *
 * Registers core trigger types that ship with Conductor.
 * Plugins can register additional triggers via the TriggerRegistry.
 */
import { z } from 'zod';
import { getTriggerRegistry } from './trigger-registry.js';
import { Executor } from './executor.js';
import { createLogger } from '../observability/index.js';
import { cors } from 'hono/cors';
const logger = createLogger({ serviceName: 'built-in-triggers' });
/**
 * Rate limiter for HTTP-based triggers
 */
class RateLimiter {
    constructor(maxRequests, windowSeconds) {
        this.maxRequests = maxRequests;
        this.windowSeconds = windowSeconds;
        this.requests = new Map();
    }
    async check(key) {
        const now = Date.now();
        const windowStart = now - this.windowSeconds * 1000;
        const existing = this.requests.get(key) || [];
        const validRequests = existing.filter((time) => time > windowStart);
        if (validRequests.length >= this.maxRequests) {
            return false;
        }
        validRequests.push(now);
        this.requests.set(key, validRequests);
        return true;
    }
}
/**
 * HTTP Trigger Handler
 */
async function handleHTTPTrigger(context) {
    const { app, ensemble, trigger, agents, env, ctx } = context;
    const path = trigger.path || `/${ensemble.name}`;
    const methods = trigger.methods || ['GET'];
    logger.info(`[HTTP] Registering: ${methods.join(',')} ${path} → ${ensemble.name}`);
    // Build middleware chain
    const middlewareChain = [];
    // CORS
    if (trigger.cors) {
        middlewareChain.push(cors(trigger.cors));
    }
    // Rate limiting
    if (trigger.rateLimit) {
        const rateLimiter = new RateLimiter(trigger.rateLimit.requests, trigger.rateLimit.window);
        middlewareChain.push(async (c, next) => {
            const key = trigger.rateLimit.key === 'user'
                ? c.get('userId') || 'anonymous'
                : c.req.header('cf-connecting-ip') || 'unknown';
            if (!(await rateLimiter.check(key))) {
                return c.json({ error: 'Rate limit exceeded' }, 429);
            }
            await next();
        });
    }
    // Custom middleware
    if (trigger.middleware) {
        middlewareChain.push(...trigger.middleware);
    }
    // Auth
    if (trigger.auth) {
        middlewareChain.push(async (c, next) => {
            const authHeader = c.req.header('authorization');
            if (!authHeader) {
                return c.json({ error: 'Authorization required' }, 401);
            }
            if (trigger.auth.type === 'bearer') {
                const token = authHeader.replace(/^Bearer\s+/i, '');
                if (token !== trigger.auth.secret) {
                    return c.json({ error: 'Invalid token' }, 401);
                }
            }
            await next();
        });
    }
    else if (trigger.public !== true) {
        logger.warn(`[HTTP] Skipping ${path}: no auth and not public`);
        return;
    }
    // Main handler
    const handler = async (c) => {
        try {
            const input = await extractInput(c);
            const executor = new Executor({ env, ctx });
            for (const agent of agents) {
                executor.registerAgent(agent);
            }
            const result = await executor.executeEnsemble(ensemble, {
                input,
                metadata: {
                    trigger: 'http',
                    method: c.req.method,
                    path: c.req.path,
                    params: c.req.param(),
                    query: c.req.query(),
                    headers: Object.fromEntries(c.req.raw.headers.entries()),
                },
            });
            if (!result.success) {
                logger.error(`[HTTP] Ensemble execution failed: ${ensemble.name}`, result.error);
                return c.json({
                    error: 'Ensemble execution failed',
                    message: result.error.message
                }, 500);
            }
            return renderResponse(c, result.value, trigger);
        }
        catch (error) {
            logger.error(`[HTTP] Execution failed: ${ensemble.name}`, error instanceof Error ? error : undefined);
            return c.json({ error: 'Execution failed' }, 500);
        }
    };
    // Register routes
    for (const method of methods) {
        const m = method.toLowerCase();
        if (middlewareChain.length > 0) {
            app[m](path, ...middlewareChain, handler);
        }
        else {
            app[m](path, handler);
        }
    }
}
/**
 * Webhook Trigger Handler
 * Simpler than HTTP - just POST endpoints
 */
async function handleWebhookTrigger(context) {
    const { app, ensemble, trigger, agents, env, ctx } = context;
    const path = trigger.path || `/${ensemble.name}`;
    const methods = trigger.methods || ['POST'];
    logger.info(`[Webhook] Registering: ${methods.join(',')} ${path} → ${ensemble.name}`);
    // Auth middleware
    const middlewareChain = [];
    if (trigger.auth) {
        middlewareChain.push(async (c, next) => {
            const authHeader = c.req.header('authorization');
            if (!authHeader) {
                return c.json({ error: 'Authorization required' }, 401);
            }
            if (trigger.auth.type === 'bearer') {
                const token = authHeader.replace(/^Bearer\s+/i, '');
                if (token !== trigger.auth.secret) {
                    return c.json({ error: 'Invalid token' }, 401);
                }
            }
            await next();
        });
    }
    else if (trigger.public !== true) {
        logger.warn(`[Webhook] Skipping ${path}: no auth and not public`);
        return;
    }
    // Handler
    const handler = async (c) => {
        try {
            const input = await c.req.json().catch(() => ({}));
            const executor = new Executor({ env, ctx });
            for (const agent of agents) {
                executor.registerAgent(agent);
            }
            const result = await executor.executeEnsemble(ensemble, {
                input,
                metadata: { trigger: 'webhook', path: c.req.path },
            });
            if (!result.success) {
                logger.error(`[Webhook] Ensemble execution failed: ${ensemble.name}`, result.error);
                return c.json({
                    error: 'Ensemble execution failed',
                    message: result.error.message
                }, 500);
            }
            return c.json(result.value.output);
        }
        catch (error) {
            logger.error(`[Webhook] Execution failed: ${ensemble.name}`, error instanceof Error ? error : undefined);
            return c.json({ error: 'Execution failed' }, 500);
        }
    };
    // Register routes
    for (const method of methods) {
        const m = method.toLowerCase();
        if (middlewareChain.length > 0) {
            app[m](path, ...middlewareChain, handler);
        }
        else {
            app[m](path, handler);
        }
    }
}
/**
 * Extract input from HTTP request
 */
async function extractInput(c) {
    const method = c.req.method;
    const contentType = c.req.header('content-type') || '';
    let body = {};
    if (['POST', 'PUT', 'PATCH'].includes(method)) {
        try {
            if (contentType.includes('application/json')) {
                body = await c.req.json();
            }
            else if (contentType.includes('form')) {
                body = await c.req.parseBody();
            }
        }
        catch (e) {
            // Ignore parsing errors
        }
    }
    return {
        ...body,
        params: c.req.param(),
        query: c.req.query(),
    };
}
/**
 * Render HTTP response
 * Handles ExecutionOutput from the executor
 */
function renderResponse(c, executionOutput, trigger) {
    const accept = c.req.header('accept') || '';
    const output = executionOutput.output;
    // HTML rendering
    if (trigger.responses?.html?.enabled && accept.includes('text/html')) {
        // Check if output has HTML (from html agent)
        if (output && output.html) {
            return c.html(output.html);
        }
        // Fallback: check if output itself is a string (might be HTML)
        if (typeof output === 'string') {
            return c.html(output);
        }
        return c.json({ error: 'HTML output not found. Ensure your ensemble uses operation: html to generate HTML content.' }, 500);
    }
    // JSON (default or explicit)
    if (trigger.responses?.json?.enabled) {
        const data = trigger.responses.json.transform
            ? trigger.responses.json.transform(output)
            : output;
        return c.json(data);
    }
    // Default: return output as JSON
    return c.json(output);
}
/**
 * Register all built-in triggers
 * Called during Conductor initialization
 */
export function registerBuiltInTriggers() {
    const registry = getTriggerRegistry();
    // HTTP Trigger
    registry.register(handleHTTPTrigger, {
        type: 'http',
        name: 'HTTP Trigger',
        description: 'Full web routing with Hono features (CORS, rate limiting, caching)',
        schema: z.object({
            type: z.literal('http'),
            path: z.string().optional(),
            methods: z.array(z.enum(['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS'])).optional(),
            auth: z.object({ type: z.enum(['bearer', 'signature', 'basic']), secret: z.string() }).optional(),
            public: z.boolean().optional(),
            rateLimit: z.object({ requests: z.number(), window: z.number() }).optional(),
            cors: z.object({ origin: z.union([z.string(), z.array(z.string())]).optional() }).optional(),
            responses: z.object({
                html: z.object({ enabled: z.boolean() }).optional(),
                json: z.object({ enabled: z.boolean() }).optional(),
            }).optional(),
            templateEngine: z.enum(['handlebars', 'liquid', 'simple']).optional(),
            middleware: z.array(z.any()).optional(),
        }),
        requiresAuth: false,
        tags: ['http', 'web', 'routing'],
    });
    // Webhook Trigger
    registry.register(handleWebhookTrigger, {
        type: 'webhook',
        name: 'Webhook Trigger',
        description: 'Simple POST endpoints for receiving webhooks',
        schema: z.object({
            type: z.literal('webhook'),
            path: z.string().optional(),
            methods: z.array(z.enum(['POST', 'GET', 'PUT', 'PATCH', 'DELETE'])).optional(),
            auth: z.object({ type: z.enum(['bearer', 'signature', 'basic']), secret: z.string() }).optional(),
            public: z.boolean().optional(),
        }),
        requiresAuth: false,
        tags: ['webhook', 'api'],
    });
    logger.info('[Built-in Triggers] Registered HTTP and Webhook triggers');
}
