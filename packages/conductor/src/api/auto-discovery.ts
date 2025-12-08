/**
 * Auto-Discovery API Wrapper
 *
 * Provides a simplified API that auto-discovers agents and ensembles
 * from the project directory using Vite plugins.
 *
 * This is the recommended way to use Conductor for most projects.
 */

import type { Hono, Context } from 'hono'
import type { ContentfulStatusCode } from 'hono/utils/http-status'
import type { HTTPException } from 'hono/http-exception'
import type { ConductorContext, AuthContext } from './types.js'
import type { ConductorEnv } from '../types/env.js'
import { createConductorAPI, type APIConfig, type ConductorApp } from './app.js'
import { AgentLoader } from '../utils/loader.js'
import { EnsembleLoader } from '../utils/ensemble-loader.js'
import { Executor } from '../runtime/executor.js'
import { createLogger } from '../observability/index.js'
import { getTriggerRegistry } from '../runtime/trigger-registry.js'
import { registerBuiltInTriggers } from '../runtime/built-in-triggers.js'
import { registerBuiltInMiddleware } from '../runtime/built-in-middleware.js'
import { runStartupTriggers } from '../runtime/startup-manager.js'
import { getDocsLoader } from '../docs/index.js'
import { handleCloudRequest, isCloudRequest, type CloudEnv } from '../cloud/index.js'
import { registerAssetRoutes } from '../assets/index.js'
import type { PublicAssetsConfig, ProtectedAssetsConfig } from '../config/types.js'

const logger = createLogger({ serviceName: 'auto-discovery-api' })

/**
 * Type guard to check if output has html property
 */
function isHtmlOutput(output: unknown): output is { html: string } {
  return (
    typeof output === 'object' &&
    output !== null &&
    'html' in output &&
    typeof (output as { html: unknown }).html === 'string'
  )
}

export interface AutoDiscoveryAPIConfig extends APIConfig {
  /**
   * Enable auto-discovery of agents and ensembles
   * @default true
   */
  autoDiscover?: boolean

  /**
   * Virtual agents module (injected by Vite plugin)
   * If not provided, auto-discovery will be skipped
   */
  agents?: Array<{
    name: string
    config: string
    handler?: () => Promise<any>
  }>

  /**
   * Virtual ensembles module (injected by Vite plugin)
   * If not provided, auto-discovery will be skipped
   */
  ensembles?: Array<{
    name: string
    config: string
  }>

  /**
   * Virtual docs module (injected by Vite plugin)
   * If not provided, docs pages will not be available
   */
  docs?: Array<{
    name: string
    content: string
  }>

  /**
   * Configure custom error pages using ensembles
   * Maps HTTP error codes to ensemble names
   *
   * @example
   * ```typescript
   * errorPages: {
   *   404: 'error-404',      // Default 404 page
   *   401: 'error-401',      // Authentication error
   *   403: 'error-403',      // Authorization error
   *   500: 'smart-500',      // AI-powered 500 page with logging
   * }
   * ```
   */
  errorPages?: {
    [statusCode: number]: string
  }

  /**
   * Static assets configuration
   *
   * Settings for public static assets served via Cloudflare Workers Static Assets.
   * Assets in `assets/public/` are served at `/assets/public/*` without auth.
   *
   * @example
   * ```typescript
   * assets: {
   *   cacheControl: 'public, max-age=86400',
   *   rootFiles: {
   *     '/favicon.ico': '/assets/public/favicon.ico',
   *   },
   * }
   * ```
   */
  assets?: PublicAssetsConfig

  /**
   * Protected assets configuration
   *
   * Settings for auth-protected static assets at `/assets/protected/*`.
   * Requires auth.apiKeys or auth.requireAuth to be configured.
   *
   * @example
   * ```typescript
   * protectedAssets: {
   *   cacheControl: 'private, max-age=3600',
   * }
   * ```
   */
  protectedAssets?: ProtectedAssetsConfig
}

// Global loaders (initialized once per Worker instance)
let memberLoader: AgentLoader | null = null
let ensembleLoader: EnsembleLoader | null = null
let initialized = false

/**
 * Type for Hono context in error/notFound handlers
 * These handlers lose generic typing, so we define explicit accessor
 */
type ErrorHandlerContext = Context<{ Bindings: ConductorEnv; Variables: ConductorContext['var'] }>

/**
 * Safely get auth from context, handling the case where it's not set
 */
function getAuthFromContext(c: ErrorHandlerContext): AuthContext | undefined {
  return c.get('auth')
}

/**
 * Register error page handlers
 */
async function registerErrorPages(
  app: ConductorApp,
  config: AutoDiscoveryAPIConfig,
  env: ConductorEnv,
  ctx: ExecutionContext
): Promise<void> {
  if (!config.errorPages || !ensembleLoader || !memberLoader) {
    return
  }

  const errorCodes = Object.keys(config.errorPages).map(Number)
  logger.info(`[Auto-Discovery] Registering ${errorCodes.length} error page handlers`)

  // Register Hono error handlers for each status code
  for (const [statusCode, ensembleName] of Object.entries(config.errorPages)) {
    const code = Number(statusCode)
    const ensemble = ensembleLoader.getEnsemble(ensembleName)

    if (!ensemble) {
      logger.warn(`[Auto-Discovery] Error page ensemble not found: ${ensembleName}`)
      continue
    }

    // Register an error handler that executes the ensemble
    // Note: Hono's onError loses generic typing, so we cast to our known type
    app.onError(async (error, c) => {
      // Only handle errors matching this status code
      // HTTPException has a status property, regular Error doesn't
      const errorStatus = 'status' in error ? (error as HTTPException).status : 500
      if (errorStatus !== code) {
        return c.text(`Error ${errorStatus}: ${error.message}`, errorStatus)
      }

      try {
        const auth = getAuthFromContext(c as ErrorHandlerContext)
        const executor = new Executor({ env, ctx, auth })
        const agents = memberLoader!.getAllAgents()
        for (const agent of agents) {
          executor.registerAgent(agent)
        }

        // Execute the error page ensemble with error context
        // Note: executeEnsemble expects input directly, not wrapped
        const result = await executor.executeEnsemble(ensemble, {
          error: error.message,
          stack: error.stack,
          path: c.req.path,
          method: c.req.method,
          requestId: c.req.header('cf-ray') || `req_${Date.now()}`,
          timestamp: new Date().toISOString(),
          headers: {
            'user-agent': c.req.header('user-agent'),
            referer: c.req.header('referer'),
          },
          dev: env.ENVIRONMENT === 'development',
        })

        if (!result.success) {
          logger.error(`[Auto-Discovery] Error page execution failed: ${result.error.message}`)
          return c.text(`Error ${code}: ${error.message}`, code as ContentfulStatusCode)
        }

        // Return HTML if available, otherwise JSON
        const executionOutput = result.value
        const agentOutput = executionOutput.output
        if (isHtmlOutput(agentOutput)) {
          return c.html(agentOutput.html, code as ContentfulStatusCode)
        }
        return c.json(executionOutput.output, code as ContentfulStatusCode)
      } catch (executionError) {
        logger.error(
          `[Auto-Discovery] Failed to execute error page ensemble: ${ensembleName}`,
          executionError instanceof Error ? executionError : undefined
        )
        return c.text(`Error ${code}: ${error.message}`, code as ContentfulStatusCode)
      }
    })

    logger.info(`[Auto-Discovery] Registered error page for ${code} -> ${ensembleName}`)
  }

  // Register catch-all 404 handler if specified
  if (config.errorPages[404]) {
    // Note: Hono's notFound loses generic typing, so we cast to our known type
    app.notFound(async (c) => {
      // First, try to serve static assets from /assets/*
      // With run_worker_first = true, we need to explicitly fetch from ASSETS binding
      const path = c.req.path
      if (path.startsWith('/assets/') && env.ASSETS) {
        try {
          const assetResponse = await env.ASSETS.fetch(c.req.raw)
          if (assetResponse.status !== 404) {
            return assetResponse
          }
          // Asset not found, continue to 404 page
        } catch {
          // ASSETS.fetch failed, continue to 404 page
        }
      }

      const ensemble = ensembleLoader!.getEnsemble(config.errorPages![404])
      if (!ensemble) {
        return c.text('404 Not Found', 404)
      }

      try {
        const auth = getAuthFromContext(c as ErrorHandlerContext)
        const executor = new Executor({ env, ctx, auth })
        const agents = memberLoader!.getAllAgents()
        for (const agent of agents) {
          executor.registerAgent(agent)
        }

        // Note: executeEnsemble expects input directly, not wrapped
        const result = await executor.executeEnsemble(ensemble, {
          path: c.req.path,
          method: c.req.method,
          params: c.req.param(),
          query: c.req.query(),
          headers: {
            'user-agent': c.req.header('user-agent'),
            referer: c.req.header('referer'),
          },
        })

        if (!result.success) {
          logger.error('[Auto-Discovery] 404 page execution failed')
          return c.text('404 Not Found', 404)
        }

        const executionOutput = result.value
        const agentOutput = executionOutput.output
        if (isHtmlOutput(agentOutput)) {
          return c.html(agentOutput.html, 404)
        }
        return c.json(executionOutput.output, 404)
      } catch (error) {
        logger.error(
          '[Auto-Discovery] Failed to execute 404 page ensemble',
          error instanceof Error ? error : undefined
        )
        return c.text('404 Not Found', 404)
      }
    })

    logger.info(`[Auto-Discovery] Registered 404 handler`)
  }
}

/**
 * Initialize loaders with auto-discovered agents and ensembles
 */
async function initializeLoaders(
  env: ConductorEnv,
  ctx: ExecutionContext,
  config: AutoDiscoveryAPIConfig
): Promise<void> {
  if (initialized) {
    return // Already initialized
  }

  try {
    // Register built-in triggers (http, webhook, etc.)
    registerBuiltInTriggers()
    logger.info('[Auto-Discovery] Registered built-in triggers')

    // Register built-in HTTP middleware (logger, compress, etc.)
    registerBuiltInMiddleware()
    logger.info('[Auto-Discovery] Registered built-in HTTP middleware')

    // Initialize AgentLoader
    memberLoader = new AgentLoader({
      agentsDir: './agents',
      ensemblesDir: './ensembles',
      env,
      ctx,
    })

    // Auto-discover agents if enabled and available
    if (config.autoDiscover !== false && config.agents && config.agents.length > 0) {
      logger.info(`[Auto-Discovery] Discovering ${config.agents.length} agents...`)
      await memberLoader.autoDiscover(config.agents)
      logger.info(`[Auto-Discovery] Agents loaded: ${memberLoader.getAgentNames().join(', ')}`)
    }

    // Initialize EnsembleLoader with agent loader reference for inline agents
    ensembleLoader = new EnsembleLoader({
      ensemblesDir: './ensembles',
      env,
      ctx,
      agentLoader: memberLoader, // Pass agent loader to register inline agents
    })

    // Auto-discover ensembles if enabled and available
    if (config.autoDiscover !== false && config.ensembles && config.ensembles.length > 0) {
      logger.info(`[Auto-Discovery] Discovering ${config.ensembles.length} ensembles...`)
      await ensembleLoader.autoDiscover(config.ensembles)
      logger.info(
        `[Auto-Discovery] Ensembles loaded: ${ensembleLoader.getEnsembleNames().join(', ')}`
      )
    }

    // Auto-discover docs if enabled and available
    if (config.autoDiscover !== false && config.docs && config.docs.length > 0) {
      logger.info(`[Auto-Discovery] Discovering ${config.docs.length} docs pages...`)
      const docsLoader = getDocsLoader()
      // Convert array to Map format expected by DocsDirectoryLoader.init()
      const markdownFiles = new Map<string, string>()
      for (const doc of config.docs) {
        markdownFiles.set(doc.name, doc.content)
      }
      await docsLoader.init(undefined, markdownFiles)
      logger.info(
        `[Auto-Discovery] Docs pages loaded: ${config.docs.map((d) => d.name).join(', ')}`
      )
    }

    initialized = true
  } catch (error) {
    logger.error(
      '[Auto-Discovery] Failed to initialize loaders',
      error instanceof Error ? error : undefined
    )
    throw error
  }
}

/**
 * Create Conductor API with auto-discovery support
 *
 * This is the recommended way to create a Conductor API for most projects.
 * It automatically discovers and registers agents and ensembles from your
 * project directory.
 *
 * @example
 * ```typescript
 * // src/index.ts
 * import { createConductorAPI } from '@ensemble-edge/conductor/api';
 * import { agents } from 'virtual:conductor-agents';
 * import { ensembles } from 'virtual:conductor-ensembles';
 *
 * export default createConductorAPI({
 *   autoDiscover: true,
 *   agents,
 *   ensembles,
 *   auth: {
 *     allowAnonymous: true,
 *   },
 *   logging: true,
 * });
 * ```
 */
export function createAutoDiscoveryAPI(config: AutoDiscoveryAPIConfig = {}) {
  const app: ConductorApp = createConductorAPI(config)

  // Register asset routes (convenience redirects and protected asset auth)
  // This must be done before ensemble triggers to ensure proper route priority
  registerAssetRoutes(app, {
    assets: config.assets,
    protectedAssets: config.protectedAssets,
    auth: {
      apiKeys: config.auth?.apiKeys,
      allowAnonymous: config.auth?.allowAnonymous,
    },
    stealthMode: config.response?.stealthMode,
  })

  // Return a Worker export with auto-discovery initialization
  return {
    async fetch(
      request: Request,
      env: ConductorEnv & CloudEnv,
      ctx: ExecutionContext
    ): Promise<Response> {
      // Handle /cloud/* requests separately (bypasses Hono app)
      // Cloud endpoint has its own authentication using ENSEMBLE_CLOUD_KEY
      if (isCloudRequest(request)) {
        // Inject stealthMode from config into env for cloud handler
        const cloudEnv = {
          ...env,
          CONDUCTOR_STEALTH_MODE: config.response?.stealthMode
            ? 'true'
            : env.CONDUCTOR_STEALTH_MODE,
        }
        return handleCloudRequest(request, cloudEnv, ctx)
      }

      // Lazy initialization on first request
      if (!initialized) {
        await initializeLoaders(env, ctx, config)

        // Register triggers from discovered ensembles
        if (ensembleLoader && memberLoader) {
          const triggerRegistry = getTriggerRegistry()
          const ensembles = ensembleLoader.getAllEnsembles()
          const agents = memberLoader.getAllAgents()

          // Build discovery data from loaders to pass to trigger handlers
          // This enables agents (like docs) to access ensemble/agent/docs registries
          const docsLoader = getDocsLoader()
          const discoveryData = {
            ensembles: ensembleLoader.getRegistryData(),
            docs: docsLoader.isInitialized() ? docsLoader.getRegistryData() : new Map(),
          }

          for (const ensemble of ensembles) {
            await triggerRegistry.registerEnsembleTriggers(
              app,
              ensemble,
              agents,
              env,
              ctx,
              discoveryData
            )
          }

          logger.info(`[Auto-Discovery] Registered triggers for ${ensembles.length} ensembles`)

          // Register error pages if configured
          await registerErrorPages(app, config, env, ctx)

          // Run startup triggers (non-blocking via waitUntil)
          // These execute once per cold start, before the first request is processed
          ctx.waitUntil(runStartupTriggers(ensembles, agents, env, ctx))
        }
      }

      // Execute the request through the Hono app
      return app.fetch(request, env, ctx)
    },

    async scheduled(
      event: ScheduledEvent,
      env: ConductorEnv,
      ctx: ExecutionContext
    ): Promise<void> {
      // Lazy initialization
      if (!initialized) {
        await initializeLoaders(env, ctx, config)
      }

      // Handle scheduled events
      logger.info('Scheduled event triggered', { cron: event.cron })

      if (!ensembleLoader || !memberLoader) {
        logger.error('Loaders not initialized')
        return
      }

      // Run startup triggers (cron events also cold start the Worker)
      const allEnsembles = ensembleLoader.getAllEnsembles()
      const allAgents = memberLoader.getAllAgents()
      ctx.waitUntil(runStartupTriggers(allEnsembles, allAgents, env, ctx))

      // Find ensembles with matching cron schedules
      const matchingEnsembles = allEnsembles.filter((ensemble) => {
        const cronTriggers = ensemble.trigger?.filter((t) => t.type === 'cron')
        return cronTriggers?.some((t) => 'cron' in t && t.cron === event.cron)
      })

      logger.info(`Found ${matchingEnsembles.length} ensembles with matching cron`, {
        cron: event.cron,
      })

      // Execute each matching ensemble
      for (const ensemble of matchingEnsembles) {
        try {
          const executor = new Executor({
            env,
            ctx,
          })

          // Register agents with executor
          for (const agent of allAgents) {
            executor.registerAgent(agent)
          }

          const cronTrigger = ensemble.trigger?.find(
            (
              t
            ): t is {
              type: 'cron'
              cron: string
              input?: Record<string, unknown>
              metadata?: Record<string, unknown>
            } => t.type === 'cron' && 'cron' in t && t.cron === event.cron
          )

          await executor.executeEnsemble(ensemble, {
            input: cronTrigger?.input || {},
            metadata: {
              trigger: 'cron',
              cron: event.cron,
              scheduledTime: event.scheduledTime,
              ...(cronTrigger?.metadata || {}),
            },
          })

          logger.info(`Successfully executed ensemble: ${ensemble.name}`)
        } catch (error) {
          logger.error(
            `Failed to execute ensemble: ${ensemble.name}`,
            error instanceof Error ? error : undefined
          )
        }
      }
    },
  }
}

/**
 * Get the initialized MemberLoader instance
 * Returns null if not yet initialized
 */
export function getMemberLoader(): AgentLoader | null {
  return memberLoader
}

/**
 * Get the initialized EnsembleLoader instance
 * Returns null if not yet initialized
 */
export function getEnsembleLoader(): EnsembleLoader | null {
  return ensembleLoader
}
