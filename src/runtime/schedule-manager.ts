/**
 * Schedule Manager
 *
 * Manages scheduled ensemble execution using Cloudflare Workers cron triggers.
 * Handles registration, execution, and coordination of scheduled ensembles.
 */

import type { EnsembleConfig, ScheduleConfig } from './parser.js'
import { Executor } from './executor.js'
import { createLogger, type Logger } from '../observability/index.js'

/**
 * Cloudflare scheduled event
 */
export interface ScheduledEvent {
  cron: string
  scheduledTime: number
  noRetry?: () => void
}

/**
 * Schedule execution result
 */
export interface ScheduleExecutionResult {
  ensemble: string
  cron: string
  success: boolean
  duration?: number
  error?: string
}

/**
 * Schedule Manager
 *
 * Coordinates scheduled ensemble execution across cron triggers.
 */
export class ScheduleManager {
  private readonly ensembles: Map<string, EnsembleConfig> = new Map()
  private readonly logger: Logger

  constructor(logger?: Logger) {
    this.logger = logger || createLogger({ serviceName: 'schedule-manager' })
  }

  /**
   * Register ensemble with schedules
   */
  register(ensemble: EnsembleConfig): void {
    if (!ensemble.schedules || ensemble.schedules.length === 0) {
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
   * Handle scheduled execution
   * Called by Cloudflare Workers scheduled() handler
   */
  async handleScheduled(
    event: ScheduledEvent,
    env: Env,
    ctx: ExecutionContext
  ): Promise<ScheduleExecutionResult[]> {
    const results: ScheduleExecutionResult[] = []

    // Find all ensembles with matching cron
    const matches = this.findMatchingEnsembles(event.cron)

    if (matches.length === 0) {
      this.logger.info('No ensembles found for cron', { cron: event.cron })
      return results
    }

    this.logger.info('Found scheduled ensembles', {
      cron: event.cron,
      count: matches.length,
      ensembles: matches.map((m) => m.ensemble.name),
    })

    // Execute all matching ensembles
    const executor = new Executor({ env, ctx })

    for (const { ensemble, schedule } of matches) {
      if (schedule.enabled === false) {
        this.logger.debug('Skipping disabled schedule', {
          ensembleName: ensemble.name,
          cron: schedule.cron,
        })
        continue
      }

      const startTime = Date.now()

      try {
        const input = schedule.input || {}

        // Add schedule metadata to input
        const executionInput = {
          ...input,
          _schedule: {
            cron: schedule.cron,
            timezone: schedule.timezone,
            scheduledTime: event.scheduledTime,
            triggeredAt: Date.now(),
            metadata: schedule.metadata,
          },
        }

        // Execute in background
        ctx.waitUntil(
          executor
            .executeEnsemble(ensemble, executionInput)
            .then((result) => {
              const duration = Date.now() - startTime

              if (result.success) {
                this.logger.info('Scheduled execution completed', {
                  ensembleName: ensemble.name,
                  cron: schedule.cron,
                  durationMs: duration,
                  success: true,
                })
              } else {
                this.logger.error('Scheduled execution failed', undefined, {
                  ensembleName: ensemble.name,
                  cron: schedule.cron,
                  durationMs: duration,
                  error: result.error,
                })
              }
            })
            .catch((error) => {
              const duration = Date.now() - startTime

              this.logger.error(
                'Scheduled execution error',
                error instanceof Error ? error : undefined,
                {
                  ensembleName: ensemble.name,
                  cron: schedule.cron,
                  durationMs: duration,
                }
              )
            })
        )

        results.push({
          ensemble: ensemble.name,
          cron: schedule.cron,
          success: true,
        })
      } catch (error) {
        const duration = Date.now() - startTime

        this.logger.error(
          'Failed to start scheduled execution',
          error instanceof Error ? error : undefined,
          {
            ensembleName: ensemble.name,
            cron: schedule.cron,
          }
        )

        results.push({
          ensemble: ensemble.name,
          cron: schedule.cron,
          success: false,
          duration,
          error: error instanceof Error ? error.message : 'Unknown error',
        })
      }
    }

    return results
  }

  /**
   * Find ensembles with matching cron expression
   */
  private findMatchingEnsembles(cron: string): Array<{
    ensemble: EnsembleConfig
    schedule: ScheduleConfig
  }> {
    const matches: Array<{ ensemble: EnsembleConfig; schedule: ScheduleConfig }> = []

    for (const ensemble of this.ensembles.values()) {
      if (!ensemble.schedules) continue

      for (const schedule of ensemble.schedules) {
        if (schedule.cron === cron) {
          matches.push({ ensemble, schedule })
        }
      }
    }

    return matches
  }

  /**
   * Get all registered cron expressions
   * Used to generate wrangler.toml configuration
   */
  getAllCronExpressions(): string[] {
    const crons = new Set<string>()

    for (const ensemble of this.ensembles.values()) {
      if (ensemble.schedules) {
        for (const schedule of ensemble.schedules) {
          if (schedule.enabled !== false) {
            crons.add(schedule.cron)
          }
        }
      }
    }

    return Array.from(crons).sort()
  }

  /**
   * List all scheduled ensembles
   */
  listScheduledEnsembles(): Array<{
    ensembleName: string
    schedules: ScheduleConfig[]
  }> {
    const scheduled: Array<{ ensembleName: string; schedules: ScheduleConfig[] }> = []

    for (const ensemble of this.ensembles.values()) {
      if (ensemble.schedules && ensemble.schedules.length > 0) {
        scheduled.push({
          ensembleName: ensemble.name,
          schedules: ensemble.schedules,
        })
      }
    }

    return scheduled
  }

  /**
   * Get schedules for a specific ensemble
   */
  getEnsembleSchedules(ensembleName: string): ScheduleConfig[] | null {
    const ensemble = this.ensembles.get(ensembleName)
    return ensemble?.schedules || null
  }

  /**
   * Get count of registered ensembles with schedules
   */
  getScheduledCount(): number {
    let count = 0
    for (const ensemble of this.ensembles.values()) {
      if (ensemble.schedules && ensemble.schedules.length > 0) {
        count++
      }
    }
    return count
  }

  /**
   * Clear all registered ensembles
   */
  clear(): void {
    this.ensembles.clear()
  }
}
