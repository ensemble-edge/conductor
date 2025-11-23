/**
 * Conductor API Application
 *
 * Main Hono application with routes and middleware.
 */

import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { logger } from 'hono/logger'
import type { ConductorContext } from './types.js'
import { createAuthMiddleware, errorHandler, requestId, timing } from './middleware/index.js'
import {
  execute,
  agents,
  health,
  stream,
  async,
  webhooks,
  executions,
  schedules,
  mcp,
  email,
} from './routes/index.js'
import { openapi } from './openapi/index.js'
import { ScheduleManager, type ScheduledEvent } from '../runtime/schedule-manager.js'
import { CatalogLoader } from '../runtime/catalog-loader.js'
import { createLogger } from '../observability/index.js'

const appLogger = createLogger({ serviceName: 'api-app' })

export interface APIConfig {
  auth?: {
    apiKeys?: string[]
    allowAnonymous?: boolean
  }
  cors?: {
    origin?: string | string[]
    allowMethods?: string[]
    allowHeaders?: string[]
  }
  logging?: boolean
}

/**
 * Create Conductor API application
 */
export function createConductorAPI(config: APIConfig = {}): Hono {
  const app = new Hono<{ Bindings: Env }>()

  // ==================== Global Middleware ====================

  // Request ID (first, so all logs have it)
  app.use('*', requestId())

  // Timing
  app.use('*', timing())

  // Logger (if enabled)
  if (config.logging !== false) {
    app.use('*', logger())
  }

  // CORS
  app.use(
    '*',
    cors({
      origin: config.cors?.origin || '*',
      allowMethods: config.cors?.allowMethods || ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      allowHeaders: config.cors?.allowHeaders || [
        'Content-Type',
        'X-API-Key',
        'Authorization',
        'X-Request-ID',
      ],
    })
  )

  // Error handler (early in chain)
  app.use('*', errorHandler())

  // Authentication (if configured)
  if (config.auth) {
    app.use(
      '/api/*',
      createAuthMiddleware({
        apiKeys: config.auth.apiKeys || [],
        allowAnonymous: config.auth.allowAnonymous ?? false,
      })
    )
  }

  // ==================== Routes ====================

  // Health checks (public, no auth)
  app.route('/health', health)

  // OpenAPI documentation (public, no auth)
  app.route('/', openapi)

  // API routes (authenticated)
  app.route('/api/v1/execute', execute)
  app.route('/api/v1/agents', agents)
  app.route('/api/v1/stream', stream)
  app.route('/api/v1/async', async)
  app.route('/api/v1/executions', executions)
  app.route('/api/v1/schedules', schedules)

  // Webhook routes (public by default, auth configured per-webhook)
  app.route('/webhooks', webhooks)

  // MCP server routes (expose ensembles as MCP tools)
  app.route('/mcp', mcp)

  // Email handler routes (Cloudflare Email Routing integration)
  app.route('/email', email)

  // Root endpoint
  app.get('/', (c) => {
    return c.json({
      name: 'Conductor API',
      version: '1.0.0',
      description: 'Agentic workflow orchestration framework for Cloudflare Workers',
      documentation: 'https://conductor.dev/docs',
      endpoints: {
        health: '/health',
        execute: '/api/v1/execute',
        agents: '/api/v1/agents',
      },
    })
  })

  // 404 handler
  app.notFound((c) => {
    return c.json(
      {
        error: 'NotFound',
        message: 'Endpoint not found',
        path: c.req.path,
        timestamp: Date.now(),
      },
      404
    )
  })

  // Error handler (catch-all)
  app.onError((err, c) => {
    appLogger.error('Unhandled API error', err instanceof Error ? err : undefined)

    return c.json(
      {
        error: 'InternalServerError',
        message: err.message || 'An unexpected error occurred',
        timestamp: Date.now(),
      },
      500
    )
  })

  return app as any
}

/**
 * Initialize schedule manager with ensembles from catalog
 */
async function initializeScheduleManager(env: Env): Promise<ScheduleManager> {
  const manager = new ScheduleManager()

  try {
    // Load all ensembles with schedules from catalog
    const ensembles = await CatalogLoader.loadScheduledEnsembles(env)

    // Register all scheduled ensembles
    manager.registerAll(ensembles)

    appLogger.info('Schedule manager initialized', {
      totalEnsembles: ensembles.length,
      crons: manager.getAllCronExpressions(),
    })
  } catch (error) {
    appLogger.error(
      'Failed to initialize schedule manager',
      error instanceof Error ? error : undefined
    )
  }

  return manager
}

/**
 * Default export for Cloudflare Workers
 */
export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    // Create API with config from environment
    const config: APIConfig = {
      auth: {
        apiKeys: (env as any).API_KEYS ? ((env as any).API_KEYS as string).split(',') : [],
        allowAnonymous: (env as any).ALLOW_ANONYMOUS === 'true',
      },
      logging: (env as any).DISABLE_LOGGING !== 'true',
    }

    const app = createConductorAPI(config)

    return app.fetch(request, env, ctx)
  },

  /**
   * Handle scheduled cron triggers
   */
  async scheduled(event: ScheduledEvent, env: Env, ctx: ExecutionContext): Promise<void> {
    appLogger.info('Scheduled cron triggered', {
      cron: event.cron,
      scheduledTime: event.scheduledTime,
      timestamp: new Date(event.scheduledTime).toISOString(),
    })

    try {
      // Initialize schedule manager
      const manager = await initializeScheduleManager(env)

      // Handle the scheduled event
      const results = await manager.handleScheduled(event, env, ctx)

      appLogger.info('Scheduled cron completed', {
        cron: event.cron,
        results: results.length,
        successful: results.filter((r) => r.success).length,
        failed: results.filter((r) => !r.success).length,
      })
    } catch (error) {
      appLogger.error('Scheduled cron handler error', error instanceof Error ? error : undefined, {
        cron: event.cron,
      })
    }
  },
}
