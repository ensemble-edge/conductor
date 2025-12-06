/**
 * Startup Manager
 *
 * Executes ensembles with `trigger: { type: startup }` during Worker cold start.
 * Runs before HTTP routes are registered, using waitUntil() for non-blocking execution.
 *
 * Key characteristics:
 * - Runs once per cold start (module-level flag prevents re-execution)
 * - Non-blocking via waitUntil() - doesn't delay request handling
 * - Errors are logged but don't crash the Worker
 * - Ideal for cache warming, health checks, initialization tasks
 */

import { createLogger } from '../observability/index.js'
import { Executor } from './executor.js'
import type { EnsembleConfig, StartupTriggerConfig } from './parser.js'
import type { ConductorEnv } from '../types/env.js'
import type { BaseAgent } from '../agents/base-agent.js'

const logger = createLogger({ serviceName: 'startup-manager' })

// Module-level flag - ensures startup runs only once per cold start
let hasRun = false

/**
 * Result of executing a single startup trigger
 */
export interface StartupResult {
  /** Name of the ensemble that was executed */
  ensemble: string
  /** Whether execution succeeded */
  success: boolean
  /** Duration in milliseconds */
  duration: number
  /** Error message if execution failed */
  error?: string
}

/**
 * Run all startup-triggered ensembles.
 *
 * This function should be called from the Worker entry point on every request,
 * wrapped in ctx.waitUntil() for non-blocking execution:
 *
 * ```typescript
 * export default {
 *   async fetch(request, env, ctx) {
 *     ctx.waitUntil(runStartupTriggers(ensembles, agents, env, ctx));
 *     return handleRequest(request, env, ctx);
 *   }
 * }
 * ```
 *
 * The module-level `hasRun` flag ensures this only executes once per cold start.
 *
 * @param ensembles - All loaded ensembles (will be filtered for startup triggers)
 * @param agents - All loaded agents (for registration with executor)
 * @param env - Cloudflare Worker environment bindings
 * @param ctx - Cloudflare Worker execution context
 * @returns Array of results for each startup ensemble executed
 */
export async function runStartupTriggers(
  ensembles: EnsembleConfig[],
  agents: BaseAgent[],
  env: ConductorEnv,
  ctx: ExecutionContext
): Promise<StartupResult[]> {
  // Only run once per cold start
  if (hasRun) {
    return []
  }
  hasRun = true

  const results: StartupResult[] = []

  try {
    // Filter to ensembles with enabled startup triggers
    const startupEnsembles = ensembles.filter((ensemble) =>
      ensemble.trigger?.some(
        (t): t is StartupTriggerConfig => t.type === 'startup' && t.enabled !== false
      )
    )

    if (startupEnsembles.length === 0) {
      return []
    }

    logger.info(`[Startup] Running ${startupEnsembles.length} startup trigger(s)...`)

    // Execute each startup ensemble
    for (const ensemble of startupEnsembles) {
      const startTime = Date.now()
      const trigger = ensemble.trigger?.find(
        (t): t is StartupTriggerConfig => t.type === 'startup'
      )

      try {
        const executor = new Executor({ env, ctx })

        // Register all agents with executor
        for (const agent of agents) {
          executor.registerAgent(agent)
        }

        // Execute ensemble with trigger input/metadata
        await executor.executeEnsemble(ensemble, {
          ...(trigger?.input || {}),
          _metadata: {
            ...trigger?.metadata,
            trigger: 'startup',
            coldStart: true,
            timestamp: new Date().toISOString(),
          },
        })

        const duration = Date.now() - startTime
        logger.info(`[Startup] OK ${ensemble.name} (${duration}ms)`)

        results.push({
          ensemble: ensemble.name,
          success: true,
          duration,
        })
      } catch (error) {
        const duration = Date.now() - startTime
        const message = error instanceof Error ? error.message : String(error)
        logger.error(`[Startup] FAIL ${ensemble.name}: ${message}`)

        results.push({
          ensemble: ensemble.name,
          success: false,
          duration,
          error: message,
        })
        // Continue with other startup ensembles - don't fail the whole Worker
      }
    }

    const succeeded = results.filter((r) => r.success).length
    const failed = results.filter((r) => !r.success).length

    if (results.length > 0) {
      logger.info(`[Startup] Complete: ${succeeded} succeeded, ${failed} failed`)
    }
  } catch (error) {
    logger.error(
      `[Startup] Failed to run startup triggers: ${error instanceof Error ? error.message : error}`
    )
  }

  return results
}

/**
 * Reset startup state (for testing only)
 *
 * In production, the module-level flag naturally resets on cold start.
 * This function is exposed only for test isolation.
 */
export function resetStartupState(): void {
  hasRun = false
}

/**
 * Check if startup has already run
 * Useful for debugging/logging
 */
export function hasStartupRun(): boolean {
  return hasRun
}
