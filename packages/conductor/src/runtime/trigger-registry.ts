/**
 * Trigger Registry
 *
 * Allows plugins to register custom trigger types and handlers.
 * Built-in triggers (webhook, http, mcp, email, queue, cron) are registered here.
 * Plugins can extend by registering additional triggers (e.g., twilio-sms, slack, discord).
 */

import type { Hono } from 'hono'
import type { z } from 'zod'
import type { EnsembleConfig } from './parser.js'
import type { BaseAgent } from '../agents/base-agent.js'
import { createLogger } from '../observability/index.js'
import type { ConductorEnv } from '../types/env.js'
import type { DiscoveryData } from './executor.js'

const logger = createLogger({ serviceName: 'trigger-registry' })

/**
 * Trigger handler context provided to trigger handlers
 * Uses generic Hono to accept any app typing (ConductorApp or bare Hono)
 */
export interface TriggerHandlerContext {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  app: Hono<any, any, any>
  ensemble: EnsembleConfig
  trigger: unknown // The specific trigger config (typed by handler)
  agents: BaseAgent[]
  env: ConductorEnv
  ctx: ExecutionContext
  /**
   * Discovery data for agents, ensembles, and docs
   * Passed to Executor to enable ctx.agentRegistry and ctx.ensembleRegistry
   */
  discovery?: DiscoveryData
}

/**
 * Trigger handler function
 * Responsible for registering routes/listeners for a specific trigger type
 */
export type TriggerHandler = (context: TriggerHandlerContext) => void | Promise<void>

/**
 * Trigger registration metadata
 */
export interface TriggerMetadata {
  /**
   * Trigger type identifier (e.g., 'http', 'twilio-sms', 'slack')
   */
  type: string

  /**
   * Human-readable name
   */
  name: string

  /**
   * Description of what this trigger does
   */
  description: string

  /**
   * Zod schema for validating trigger configuration
   * This should be a z.object() schema
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  schema: z.ZodObject<z.ZodRawShape, any, any>

  /**
   * Whether this trigger requires authentication by default
   */
  requiresAuth?: boolean

  /**
   * Tags for categorization (e.g., ['messaging', 'sms'])
   */
  tags?: string[]

  /**
   * Plugin that registered this trigger (optional)
   */
  plugin?: string
}

/**
 * Global registry for trigger types and handlers
 */
export class TriggerRegistry {
  private static instance: TriggerRegistry | null = null
  private handlers: Map<string, TriggerHandler> = new Map()
  private metadata: Map<string, TriggerMetadata> = new Map()

  private constructor() {
    // Private constructor for singleton
  }

  /**
   * Get singleton instance
   */
  static getInstance(): TriggerRegistry {
    if (!TriggerRegistry.instance) {
      TriggerRegistry.instance = new TriggerRegistry()
    }
    return TriggerRegistry.instance
  }

  /**
   * Reset registry (for testing)
   */
  reset(): void {
    this.handlers.clear()
    this.metadata.clear()
  }

  /**
   * Register a new trigger type
   */
  register(handler: TriggerHandler, metadata: TriggerMetadata): void {
    const { type } = metadata

    if (this.handlers.has(type)) {
      logger.warn(`[TriggerRegistry] Overwriting existing trigger type: ${type}`)
    }

    this.handlers.set(type, handler)
    this.metadata.set(type, metadata)

    logger.info(`[TriggerRegistry] Registered trigger: ${type}`, {
      name: metadata.name,
      plugin: metadata.plugin,
    })
  }

  /**
   * Get handler for a trigger type
   */
  getHandler(type: string): TriggerHandler | undefined {
    return this.handlers.get(type)
  }

  /**
   * Get metadata for a trigger type
   */
  getMetadata(type: string): TriggerMetadata | undefined {
    return this.metadata.get(type)
  }

  /**
   * Check if a trigger type is registered
   */
  has(type: string): boolean {
    return this.handlers.has(type)
  }

  /**
   * Get all registered trigger types
   */
  getAllTypes(): string[] {
    return Array.from(this.handlers.keys())
  }

  /**
   * Get all registered trigger metadata
   */
  getAllMetadata(): TriggerMetadata[] {
    return Array.from(this.metadata.values())
  }

  /**
   * Register all triggers for an ensemble
   * Called during auto-discovery initialization
   *
   * @param app - Hono app instance
   * @param ensemble - Ensemble configuration
   * @param agents - Array of agent instances
   * @param env - Cloudflare environment
   * @param ctx - Execution context
   * @param discovery - Optional discovery data for agents/ensembles/docs
   */
  async registerEnsembleTriggers(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    app: Hono<any, any, any>,
    ensemble: EnsembleConfig,
    agents: BaseAgent[],
    env: ConductorEnv,
    ctx: ExecutionContext,
    discovery?: DiscoveryData
  ): Promise<void> {
    if (!ensemble.trigger || ensemble.trigger.length === 0) {
      return // No triggers to register
    }

    for (const trigger of ensemble.trigger) {
      const handler = this.getHandler(trigger.type)

      if (!handler) {
        logger.warn(`[TriggerRegistry] No handler found for trigger type: ${trigger.type}`, {
          ensemble: ensemble.name,
          availableTypes: this.getAllTypes(),
        })
        continue
      }

      try {
        await handler({
          app,
          ensemble,
          trigger,
          agents,
          env,
          ctx,
          discovery,
        })

        logger.info(
          `[TriggerRegistry] Registered ${trigger.type} trigger for ensemble: ${ensemble.name}`
        )
      } catch (error) {
        logger.error(
          `[TriggerRegistry] Failed to register ${trigger.type} trigger for ${ensemble.name}`,
          error instanceof Error ? error : undefined
        )
      }
    }
  }
}

/**
 * Get the global trigger registry instance
 */
export function getTriggerRegistry(): TriggerRegistry {
  return TriggerRegistry.getInstance()
}
