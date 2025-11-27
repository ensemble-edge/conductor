/**
 * Build Manager
 *
 * Manages build-time ensemble execution.
 * Ensembles with build triggers run during `conductor build` or deploy time.
 *
 * Use cases:
 * - Generate static documentation
 * - Pre-compute data that doesn't change frequently
 * - Generate OpenAPI specs
 * - Build static assets
 */

import type { EnsembleConfig, BuildTriggerConfig, TriggerConfig } from './parser.js'
import { Executor } from './executor.js'
import { createLogger, type Logger } from '../observability/index.js'

/**
 * Build execution result
 */
export interface BuildExecutionResult {
  ensemble: string
  success: boolean
  duration: number
  output?: unknown
  outputPath?: string
  error?: string
}

/**
 * Build Manager
 *
 * Coordinates build-time ensemble execution.
 */
export class BuildManager {
  private readonly ensembles: Map<string, EnsembleConfig> = new Map()
  private readonly logger: Logger

  constructor(logger?: Logger) {
    this.logger = logger || createLogger({ serviceName: 'build-manager' })
  }

  /**
   * Register ensemble with build triggers
   */
  register(ensemble: EnsembleConfig): void {
    const buildTriggers = ensemble.trigger?.filter((t) => t.type === 'build') || []
    if (buildTriggers.length === 0) {
      return
    }

    this.ensembles.set(ensemble.name, ensemble)
  }

  /**
   * Register multiple ensembles at once
   */
  registerAll(ensembles: EnsembleConfig[]): void {
    for (const ensemble of ensembles) {
      this.register(ensemble)
    }
  }

  /**
   * Run all build triggers
   * Called during `conductor build` or deploy
   */
  async runBuildTriggers(
    env: Env,
    ctx: ExecutionContext,
    options?: {
      filter?: string[] // Only run specific ensembles
      dryRun?: boolean // Log what would run without executing
    }
  ): Promise<BuildExecutionResult[]> {
    const results: BuildExecutionResult[] = []

    // Get ensembles to run
    let ensemblesToRun = Array.from(this.ensembles.values())
    if (options?.filter && options.filter.length > 0) {
      ensemblesToRun = ensemblesToRun.filter((e) => options.filter!.includes(e.name))
    }

    if (ensemblesToRun.length === 0) {
      this.logger.info('No build triggers to run')
      return results
    }

    this.logger.info(`Running ${ensemblesToRun.length} build trigger(s)`, {
      ensembles: ensemblesToRun.map((e) => e.name),
      dryRun: options?.dryRun,
    })

    const executor = new Executor({ env, ctx })

    for (const ensemble of ensemblesToRun) {
      // Get build trigger(s) for this ensemble
      const buildTriggers = ensemble.trigger?.filter(
        (t): t is BuildTriggerConfig => t.type === 'build'
      ) || []

      for (const trigger of buildTriggers) {
        // Skip disabled triggers
        if (trigger.enabled === false) {
          this.logger.debug(`Skipping disabled build trigger for ${ensemble.name}`)
          continue
        }

        if (options?.dryRun) {
          this.logger.info(`[DRY RUN] Would run build trigger for ${ensemble.name}`, {
            output: trigger.output,
            input: trigger.input,
          })
          results.push({
            ensemble: ensemble.name,
            success: true,
            duration: 0,
            outputPath: trigger.output,
          })
          continue
        }

        const startTime = Date.now()

        try {
          // Prepare input with build metadata
          const input = {
            ...(trigger.input || {}),
            _build: {
              triggeredAt: Date.now(),
              output: trigger.output,
              metadata: trigger.metadata,
            },
          }

          // Execute ensemble
          const result = await executor.executeEnsemble(ensemble, input)
          const duration = Date.now() - startTime

          if (result.success) {
            this.logger.info(`Build trigger completed for ${ensemble.name}`, {
              durationMs: duration,
              outputPath: trigger.output,
            })

            results.push({
              ensemble: ensemble.name,
              success: true,
              duration,
              output: result.value?.output,
              outputPath: trigger.output,
            })
          } else {
            this.logger.error(`Build trigger failed for ${ensemble.name}`, undefined, {
              durationMs: duration,
              error: result.error?.message,
            })

            results.push({
              ensemble: ensemble.name,
              success: false,
              duration,
              error: result.error?.message || 'Unknown error',
              outputPath: trigger.output,
            })
          }
        } catch (error) {
          const duration = Date.now() - startTime
          const errorMessage = error instanceof Error ? error.message : 'Unknown error'

          this.logger.error(
            `Build trigger error for ${ensemble.name}`,
            error instanceof Error ? error : undefined,
            { durationMs: duration }
          )

          results.push({
            ensemble: ensemble.name,
            success: false,
            duration,
            error: errorMessage,
            outputPath: trigger.output,
          })
        }
      }
    }

    // Summary
    const successful = results.filter((r) => r.success).length
    const failed = results.filter((r) => !r.success).length

    this.logger.info('Build triggers completed', {
      total: results.length,
      successful,
      failed,
    })

    return results
  }

  /**
   * List all ensembles with build triggers
   */
  listBuildEnsembles(): Array<{
    ensembleName: string
    triggers: BuildTriggerConfig[]
  }> {
    const buildEnsembles: Array<{ ensembleName: string; triggers: BuildTriggerConfig[] }> = []

    for (const ensemble of this.ensembles.values()) {
      const buildTriggers = ensemble.trigger?.filter(
        (t): t is BuildTriggerConfig => t.type === 'build'
      ) || []

      if (buildTriggers.length > 0) {
        buildEnsembles.push({
          ensembleName: ensemble.name,
          triggers: buildTriggers,
        })
      }
    }

    return buildEnsembles
  }

  /**
   * Get count of registered ensembles with build triggers
   */
  getBuildCount(): number {
    return this.ensembles.size
  }

  /**
   * Clear all registered ensembles
   */
  clear(): void {
    this.ensembles.clear()
  }
}

/**
 * Global build manager instance
 */
let globalBuildManager: BuildManager | null = null

/**
 * Get or create the global build manager
 */
export function getBuildManager(): BuildManager {
  if (!globalBuildManager) {
    globalBuildManager = new BuildManager()
  }
  return globalBuildManager
}

/**
 * Reset the global build manager (for testing)
 */
export function resetBuildManager(): void {
  globalBuildManager = null
}
