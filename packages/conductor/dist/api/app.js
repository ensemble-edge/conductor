/**
 * Conductor API Application
 *
 * Main Hono application with routes and middleware.
 */
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { createAuthMiddleware, errorHandler, requestId, timing, securityHeaders, securityConfig as securityConfigMiddleware, conductorHeader, debugHeaders, apiSecurityPreset, } from './middleware/index.js';
import { execute, agents, ensembles, health, stream, async, webhooks, executions, schedules, mcp, email, callbacks, } from './routes/index.js';
import { openapi } from './openapi/index.js';
import { ScheduleManager } from '../runtime/schedule-manager.js';
import { CatalogLoader } from '../runtime/catalog-loader.js';
import { createLogger } from '../observability/index.js';
const appLogger = createLogger({ serviceName: 'api-app' });
/**
 * Create Conductor API application
 */
export function createConductorAPI(config = {}) {
    const app = new Hono();
    // Build security configuration (to be injected via middleware)
    const securityConfig = {
        requireAuth: config.auth?.requireAuth ?? true, // SECURE BY DEFAULT
        allowDirectAgentExecution: config.security?.allowDirectAgentExecution ?? true,
        autoPermissions: config.security?.autoPermissions ?? false,
    };
    // ==================== Global Middleware ====================
    // Request ID (first, so all logs have it)
    app.use('*', requestId());
    // Timing
    app.use('*', timing());
    // Security configuration (injected into context for all routes)
    app.use('*', securityConfigMiddleware(securityConfig));
    // Logger (if enabled)
    if (config.logging !== false) {
        app.use('*', logger());
    }
    // Security headers (default: enabled with API preset)
    if (config.response?.securityHeaders !== false) {
        const securityConfig = typeof config.response?.securityHeaders === 'object'
            ? config.response.securityHeaders
            : apiSecurityPreset;
        app.use('*', securityHeaders(securityConfig));
    }
    // Conductor header (default: enabled unless explicitly disabled)
    if (config.response?.conductorHeader !== false) {
        app.use('*', conductorHeader());
    }
    // Debug headers (auto-enabled in non-production environments)
    app.use('*', debugHeaders({
        enabled: config.response?.debugHeaders,
    }));
    // CORS
    app.use('*', cors({
        origin: config.cors?.origin || '*',
        allowMethods: config.cors?.allowMethods || ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
        allowHeaders: config.cors?.allowHeaders || [
            'Content-Type',
            'X-API-Key',
            'Authorization',
            'X-Request-ID',
        ],
    }));
    // Error handler (early in chain)
    app.use('*', errorHandler());
    // SECURE BY DEFAULT: Apply auth middleware to built-in /api/v1/* routes only
    // User-defined trigger routes (e.g., /api/protected) handle their own auth via trigger config
    // This prevents the global auth from blocking trigger-specific auth
    const requireAuth = config.auth?.requireAuth ?? true;
    if (requireAuth) {
        app.use('/api/v1/*', createAuthMiddleware({
            apiKeys: config.auth?.apiKeys || [],
            allowAnonymous: config.auth?.allowAnonymous ?? false,
            // Pass stealth mode settings
            stealthMode: config.response?.stealthMode,
            stealthDelayMs: config.response?.stealthDelayMs,
        }));
    }
    else if (config.auth) {
        // Auth configured but not required - still apply middleware for optional auth
        app.use('/api/v1/*', createAuthMiddleware({
            apiKeys: config.auth.apiKeys || [],
            allowAnonymous: true, // Allow anonymous when requireAuth is false
            stealthMode: config.response?.stealthMode,
            stealthDelayMs: config.response?.stealthDelayMs,
        }));
    }
    // ==================== Routes ====================
    // Health checks (public, no auth)
    app.route('/health', health);
    // NOTE: Documentation routes (/docs/*) are now provided via the docs-serve ensemble
    // Include ensembles/system/docs/serve.yaml in your project and use createAutoDiscoveryAPI
    // Or manually add docs routes: import { docs } from '@ensemble-edge/conductor/api/routes'
    // OpenAPI documentation (public, no auth)
    app.route('/', openapi);
    // API routes (authenticated)
    app.route('/api/v1/execute', execute);
    app.route('/api/v1/agents', agents);
    app.route('/api/v1/ensembles', ensembles);
    app.route('/api/v1/stream', stream);
    app.route('/api/v1/async', async);
    app.route('/api/v1/executions', executions);
    app.route('/api/v1/schedules', schedules);
    // Webhook routes (public by default, auth configured per-webhook)
    app.route('/webhooks', webhooks);
    // MCP server routes (expose ensembles as MCP tools)
    app.route('/mcp', mcp);
    // Email handler routes (Cloudflare Email Routing integration)
    app.route('/email', email);
    // HITL resumption routes (token-based auth - the token IS the authentication)
    // Configurable base path - defaults to /callback
    const resumeBasePath = config.hitl?.resumeBasePath || '/callback';
    app.route(resumeBasePath, callbacks);
    // Root endpoint
    app.get('/', (c) => {
        return c.json({
            name: 'Conductor API',
            version: '1.0.0',
            description: 'Agentic workflow orchestration framework for Cloudflare Workers',
            documentation: '/docs',
            endpoints: {
                docs: '/docs',
                health: '/health',
                execute: '/api/v1/execute',
                agents: '/api/v1/agents',
                ensembles: '/api/v1/ensembles',
            },
        });
    });
    // 404 handler - uses same format as stealth 404 for consistency
    app.notFound((c) => {
        return c.json({
            success: false,
            error: 'Not Found',
            message: 'The requested resource could not be found.',
            timestamp: new Date().toISOString(),
        }, 404);
    });
    // Error handler (catch-all)
    app.onError((err, c) => {
        appLogger.error('Unhandled API error', err instanceof Error ? err : undefined);
        return c.json({
            error: 'InternalServerError',
            message: err.message || 'An unexpected error occurred',
            timestamp: Date.now(),
        }, 500);
    });
    return app;
}
/**
 * Initialize schedule manager with ensembles from catalog
 */
async function initializeScheduleManager(env) {
    const manager = new ScheduleManager();
    try {
        // Load all ensembles with schedules from catalog
        const ensembles = await CatalogLoader.loadScheduledEnsembles(env);
        // Register all scheduled ensembles
        manager.registerAll(ensembles);
        appLogger.info('Schedule manager initialized', {
            totalEnsembles: ensembles.length,
            crons: manager.getAllCronExpressions(),
        });
    }
    catch (error) {
        appLogger.error('Failed to initialize schedule manager', error instanceof Error ? error : undefined);
    }
    return manager;
}
/**
 * Default export for Cloudflare Workers
 */
export default {
    async fetch(request, env, ctx) {
        // Cast env to ConductorEnv for typed access to environment variables
        const conductorEnv = env;
        // Create API with config from environment
        const config = {
            auth: {
                apiKeys: conductorEnv.API_KEYS ? conductorEnv.API_KEYS.split(',') : [],
                allowAnonymous: conductorEnv.ALLOW_ANONYMOUS === 'true',
            },
            logging: conductorEnv.DISABLE_LOGGING !== 'true',
        };
        const app = createConductorAPI(config);
        return app.fetch(request, env, ctx);
    },
    /**
     * Handle scheduled cron triggers
     */
    async scheduled(event, env, ctx) {
        appLogger.info('Scheduled cron triggered', {
            cron: event.cron,
            scheduledTime: event.scheduledTime,
            timestamp: new Date(event.scheduledTime).toISOString(),
        });
        try {
            // Initialize schedule manager
            const manager = await initializeScheduleManager(env);
            // Handle the scheduled event
            const results = await manager.handleScheduled(event, env, ctx);
            appLogger.info('Scheduled cron completed', {
                cron: event.cron,
                results: results.length,
                successful: results.filter((r) => r.success).length,
                failed: results.filter((r) => !r.success).length,
            });
        }
        catch (error) {
            appLogger.error('Scheduled cron handler error', error instanceof Error ? error : undefined, {
                cron: event.cron,
            });
        }
    },
};
