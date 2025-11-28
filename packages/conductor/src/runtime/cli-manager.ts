/**
 * CLI Manager
 *
 * Manages CLI-triggered ensemble execution.
 * Ensembles with CLI triggers can be invoked via `conductor run <command>`.
 *
 * Use cases:
 * - Generate documentation on demand
 * - Run data migrations
 * - Execute maintenance tasks
 * - Custom development commands
 */

import type { EnsembleConfig, CLITriggerConfig, TriggerConfig } from './parser.js'
import { Executor } from './executor.js'
import { createLogger, type Logger } from '../observability/index.js'

/**
 * CLI command option definition
 */
export interface CLIOption {
  name: string
  type?: 'string' | 'number' | 'boolean'
  default?: string | number | boolean
  description?: string
  required?: boolean
}

/**
 * CLI command metadata
 */
export interface CLICommandMetadata {
  command: string
  description?: string
  options: CLIOption[]
  ensembleName: string
}

/**
 * CLI execution result
 */
export interface CLIExecutionResult {
  command: string
  ensemble: string
  success: boolean
  duration: number
  output?: unknown
  error?: string
}

/**
 * CLI Manager
 *
 * Coordinates CLI-triggered ensemble execution.
 */
export class CLIManager {
  private readonly commands: Map<string, { ensemble: EnsembleConfig; trigger: CLITriggerConfig }> =
    new Map()
  private readonly logger: Logger

  constructor(logger?: Logger) {
    this.logger = logger || createLogger({ serviceName: 'cli-manager' })
  }

  /**
   * Register ensemble with CLI triggers
   */
  register(ensemble: EnsembleConfig): void {
    const cliTriggers =
      ensemble.trigger?.filter((t): t is CLITriggerConfig => t.type === 'cli') || []

    for (const trigger of cliTriggers) {
      if (trigger.enabled === false) continue

      if (this.commands.has(trigger.command)) {
        this.logger.warn(`CLI command "${trigger.command}" already registered, overwriting`)
      }

      this.commands.set(trigger.command, { ensemble, trigger })
      this.logger.debug(`Registered CLI command: ${trigger.command} → ${ensemble.name}`)
    }
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
   * Check if a command is registered
   */
  hasCommand(command: string): boolean {
    return this.commands.has(command)
  }

  /**
   * Get command metadata
   */
  getCommandMetadata(command: string): CLICommandMetadata | null {
    const entry = this.commands.get(command)
    if (!entry) return null

    return {
      command: entry.trigger.command,
      description: entry.trigger.description,
      options: entry.trigger.options || [],
      ensembleName: entry.ensemble.name,
    }
  }

  /**
   * Run a CLI command
   */
  async runCommand(
    command: string,
    options: Record<string, string | number | boolean>,
    env: Env,
    ctx: ExecutionContext
  ): Promise<CLIExecutionResult> {
    const entry = this.commands.get(command)

    if (!entry) {
      return {
        command,
        ensemble: '',
        success: false,
        duration: 0,
        error: `Command not found: ${command}`,
      }
    }

    const { ensemble, trigger } = entry
    const startTime = Date.now()

    this.logger.info(`Running CLI command: ${command}`, {
      ensemble: ensemble.name,
      options,
    })

    try {
      // Parse and validate options
      const parsedOptions = this.parseOptions(trigger.options || [], options)

      // Prepare input with CLI metadata
      const input = {
        ...parsedOptions,
        _cli: {
          command,
          triggeredAt: Date.now(),
          options: parsedOptions,
        },
      }

      // Create executor
      const executor = new Executor({ env, ctx })

      // Execute ensemble
      const result = await executor.executeEnsemble(ensemble, input)
      const duration = Date.now() - startTime

      if (result.success) {
        this.logger.info(`CLI command completed: ${command}`, {
          durationMs: duration,
        })

        return {
          command,
          ensemble: ensemble.name,
          success: true,
          duration,
          output: result.value?.output,
        }
      } else {
        this.logger.error(`CLI command failed: ${command}`, undefined, {
          durationMs: duration,
          error: result.error?.message,
        })

        return {
          command,
          ensemble: ensemble.name,
          success: false,
          duration,
          error: result.error?.message || 'Unknown error',
        }
      }
    } catch (error) {
      const duration = Date.now() - startTime
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'

      this.logger.error(
        `CLI command error: ${command}`,
        error instanceof Error ? error : undefined,
        { durationMs: duration }
      )

      return {
        command,
        ensemble: ensemble.name,
        success: false,
        duration,
        error: errorMessage,
      }
    }
  }

  /**
   * Parse and validate command options
   */
  private parseOptions(
    definitions: CLIOption[],
    provided: Record<string, string | number | boolean>
  ): Record<string, string | number | boolean> {
    const result: Record<string, string | number | boolean> = {}

    for (const def of definitions) {
      const value = provided[def.name]

      if (value === undefined) {
        if (def.required) {
          throw new Error(`Missing required option: --${def.name}`)
        }
        if (def.default !== undefined) {
          result[def.name] = def.default
        }
        continue
      }

      // Type coercion
      switch (def.type) {
        case 'number':
          const num = Number(value)
          if (isNaN(num)) {
            throw new Error(`Option --${def.name} must be a number`)
          }
          result[def.name] = num
          break
        case 'boolean':
          result[def.name] = value === true || value === 'true' || value === '1' || value === 'yes'
          break
        default:
          result[def.name] = String(value)
      }
    }

    // Include any extra options not in definitions
    for (const [key, value] of Object.entries(provided)) {
      if (!(key in result)) {
        result[key] = value
      }
    }

    return result
  }

  /**
   * List all registered CLI commands
   */
  listCommands(): CLICommandMetadata[] {
    const commands: CLICommandMetadata[] = []

    for (const [command, entry] of this.commands) {
      commands.push({
        command,
        description: entry.trigger.description,
        options: entry.trigger.options || [],
        ensembleName: entry.ensemble.name,
      })
    }

    return commands.sort((a, b) => a.command.localeCompare(b.command))
  }

  /**
   * Get count of registered commands
   */
  getCommandCount(): number {
    return this.commands.size
  }

  /**
   * Clear all registered commands
   */
  clear(): void {
    this.commands.clear()
  }
}

/**
 * Global CLI manager instance
 */
let globalCLIManager: CLIManager | null = null

/**
 * Get or create the global CLI manager
 */
export function getCLIManager(): CLIManager {
  if (!globalCLIManager) {
    globalCLIManager = new CLIManager()
  }
  return globalCLIManager
}

/**
 * Reset the global CLI manager (for testing)
 */
export function resetCLIManager(): void {
  globalCLIManager = null
}
