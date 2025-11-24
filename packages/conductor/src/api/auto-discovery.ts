/**
 * Auto-Discovery API Wrapper
 *
 * Provides a simplified API that auto-discovers agents and ensembles
 * from the project directory using Vite plugins.
 *
 * This is the recommended way to use Conductor for most projects.
 */

import type { Hono } from 'hono'
import { createConductorAPI, type APIConfig } from './app.js'
import { AgentLoader } from '../utils/loader.js'
import { EnsembleLoader } from '../utils/ensemble-loader.js'
import { Executor } from '../runtime/executor.js'
import { createLogger } from '../observability/index.js'
import { getTriggerRegistry } from '../runtime/trigger-registry.js'
import { registerBuiltInTriggers } from '../runtime/built-in-triggers.js'
import { registerBuiltInMiddleware } from '../runtime/built-in-middleware.js'

const logger = createLogger({ serviceName: 'auto-discovery-api' })

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
}

// Global loaders (initialized once per Worker instance)
let memberLoader: AgentLoader | null = null
let ensembleLoader: EnsembleLoader | null = null
let initialized = false

/**
 * Register error page handlers
 */
async function registerErrorPages(
  app: Hono,
  config: AutoDiscoveryAPIConfig,
  env: Env,
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
    app.onError(async (error, c) => {
      // Only handle errors matching this status code
      const errorStatus = (error as any).status || 500
      if (errorStatus !== code) {
        return c.text(`Error ${errorStatus}: ${error.message}`, errorStatus)
      }

      try {
        const executor = new Executor({ env, ctx })
        const agents = memberLoader!.getAllMembers()
        for (const agent of agents) {
          executor.registerAgent(agent)
        }

        // Execute the error page ensemble with error context
        const result = await executor.executeEnsemble(ensemble, {
          input: {
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
          },
          metadata: { trigger: 'error', statusCode: code },
        })

        if (!result.success) {
          logger.error(`[Auto-Discovery] Error page execution failed: ${result.error.message}`)
          return c.text(`Error ${code}: ${error.message}`, code as any)
        }

        // Return HTML if available, otherwise JSON
        const executionOutput = result.value
        const agentOutput = executionOutput.output as any
        if (agentOutput && agentOutput.html) {
          return c.html(agentOutput.html, code as any)
        }
        return c.json(executionOutput.output, code as any)
      } catch (executionError) {
        logger.error(
          `[Auto-Discovery] Failed to execute error page ensemble: ${ensembleName}`,
          executionError instanceof Error ? executionError : undefined
        )
        return c.text(`Error ${code}: ${error.message}`, code as any)
      }
    })

    logger.info(`[Auto-Discovery] Registered error page for ${code} -> ${ensembleName}`)
  }

  // Register catch-all 404 handler if specified
  if (config.errorPages[404]) {
    app.notFound(async (c) => {
      const ensemble = ensembleLoader!.getEnsemble(config.errorPages![404])
      if (!ensemble) {
        return c.text('404 Not Found', 404)
      }

      try {
        const executor = new Executor({ env, ctx })
        const agents = memberLoader!.getAllMembers()
        for (const agent of agents) {
          executor.registerAgent(agent)
        }

        const result = await executor.executeEnsemble(ensemble, {
          input: {
            path: c.req.path,
            method: c.req.method,
            params: c.req.param(),
            query: c.req.query(),
            headers: {
              'user-agent': c.req.header('user-agent'),
              referer: c.req.header('referer'),
            },
          },
          metadata: { trigger: 'error', statusCode: 404 },
        })

        if (!result.success) {
          logger.error('[Auto-Discovery] 404 page execution failed')
          return c.text('404 Not Found', 404)
        }

        const executionOutput = result.value
        const agentOutput = executionOutput.output as any
        if (agentOutput && agentOutput.html) {
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
  env: Env,
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
      membersDir: './agents',
      ensemblesDir: './ensembles',
      env,
      ctx,
    })

    // Auto-discover agents if enabled and available
    if (config.autoDiscover !== false && config.agents && config.agents.length > 0) {
      logger.info(`[Auto-Discovery] Discovering ${config.agents.length} agents...`)
      await memberLoader.autoDiscover(config.agents)
      logger.info(`[Auto-Discovery] Agents loaded: ${memberLoader.getMemberNames().join(', ')}`)
    }

    // Initialize EnsembleLoader
    ensembleLoader = new EnsembleLoader({
      ensemblesDir: './ensembles',
      env,
      ctx,
    })

    // Auto-discover ensembles if enabled and available
    if (config.autoDiscover !== false && config.ensembles && config.ensembles.length > 0) {
      logger.info(`[Auto-Discovery] Discovering ${config.ensembles.length} ensembles...`)
      await ensembleLoader.autoDiscover(config.ensembles)
      logger.info(
        `[Auto-Discovery] Ensembles loaded: ${ensembleLoader.getEnsembleNames().join(', ')}`
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
  const app = createConductorAPI(config) as Hono

  // Return a Worker export with auto-discovery initialization
  return {
    async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
      // Lazy initialization on first request
      if (!initialized) {
        await initializeLoaders(env, ctx, config)

        // Register triggers from discovered ensembles
        if (ensembleLoader && memberLoader) {
          const triggerRegistry = getTriggerRegistry()
          const ensembles = ensembleLoader.getAllEnsembles()
          const agents = memberLoader.getAllMembers()

          for (const ensemble of ensembles) {
            await triggerRegistry.registerEnsembleTriggers(app, ensemble, agents, env, ctx)
          }

          logger.info(`[Auto-Discovery] Registered triggers for ${ensembles.length} ensembles`)

          // Register error pages if configured
          await registerErrorPages(app, config, env, ctx)
        }
      }

      // Execute the request through the Hono app
      return app.fetch(request, env, ctx)
    },

    async scheduled(event: any, env: Env, ctx: ExecutionContext): Promise<void> {
      // Lazy initialization
      if (!initialized) {
        await initializeLoaders(env, ctx, config)
      }

      // Handle scheduled events
      logger.info('Scheduled event triggered', { cron: event.cron })

      if (!ensembleLoader) {
        logger.error('EnsembleLoader not initialized')
        return
      }

      // Find ensembles with matching cron schedules
      const allEnsembles = ensembleLoader.getAllEnsembles()
      const matchingEnsembles = allEnsembles.filter((ensemble) => {
        const cronTriggers = ensemble.trigger?.filter((t) => t.type === 'cron')
        return cronTriggers?.some((t: any) => t.cron === event.cron)
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

          // Register agents from memberLoader
          if (memberLoader) {
            for (const agent of memberLoader.getAllMembers()) {
              executor.registerAgent(agent)
            }
          }

          const cronTrigger = ensemble.trigger?.find(
            (t: any) => t.type === 'cron' && t.cron === event.cron
          ) as any

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
