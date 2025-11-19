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
import { MemberLoader } from '../utils/loader.js'
import { EnsembleLoader } from '../utils/ensemble-loader.js'
import { Executor } from '../runtime/executor.js'
import { createLogger } from '../observability/index.js'

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
}

// Global loaders (initialized once per Worker instance)
let memberLoader: MemberLoader | null = null
let ensembleLoader: EnsembleLoader | null = null
let initialized = false

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
    // Initialize MemberLoader
    memberLoader = new MemberLoader({
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
    logger.error('[Auto-Discovery] Failed to initialize loaders', error instanceof Error ? error : undefined)
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

          const cronTrigger = ensemble.trigger?.find((t: any) => t.type === 'cron' && t.cron === event.cron) as any

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
export function getMemberLoader(): MemberLoader | null {
  return memberLoader
}

/**
 * Get the initialized EnsembleLoader instance
 * Returns null if not yet initialized
 */
export function getEnsembleLoader(): EnsembleLoader | null {
  return ensembleLoader
}
