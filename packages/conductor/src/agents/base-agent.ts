/**
 * Base Agent class
 *
 * Foundation for all agent types (Think, Function, Data, API, etc.)
 * Provides standard interface, response wrapping, error handling, and cache key generation
 */

import type { AgentConfig } from '../runtime/parser.js'
import type { StateContext } from '../runtime/state-manager.js'
import type { ConductorEnv } from '../types/env.js'
import type { Logger } from '../observability/types.js'
import type { MetricsRecorder } from '../observability/context.js'

/**
 * Execution context passed to agents
 *
 * Contains everything an agent needs to execute:
 * - Input data
 * - State management
 * - Environment bindings
 * - Observability (logger + metrics)
 */
export interface AgentExecutionContext {
  /** Input data for the agent */
  input: Record<string, any>

  /** Shared state (if ensemble has state config) */
  state?: Record<string, any>

  /** Function to update shared state */
  setState?: (updates: Record<string, any>) => void

  /** Cloudflare environment bindings */
  env: ConductorEnv

  /** Cloudflare execution context */
  ctx: ExecutionContext

  /** Outputs from previous agents in the flow */
  previousOutputs?: Record<string, any>

  /**
   * Scoped logger for this agent
   * Pre-configured with agent name, ensemble name, and execution IDs
   *
   * @example
   * ```typescript
   * export default async function(context: AgentExecutionContext) {
   *   const { logger } = context
   *   logger.info('Processing started', { itemCount: items.length })
   *   // ... do work ...
   *   logger.debug('Processing complete', { result })
   *   return result
   * }
   * ```
   */
  logger?: Logger

  /**
   * Metrics recorder for Analytics Engine
   * Pre-configured with agent context
   *
   * @example
   * ```typescript
   * export default async function(context: AgentExecutionContext) {
   *   const { metrics } = context
   *   const startTime = Date.now()
   *   // ... do work ...
   *   metrics.record('items.processed', items.length)
   *   return result
   * }
   * ```
   */
  metrics?: MetricsRecorder

  /**
   * Unique execution ID for tracing
   * Same across all agents in an ensemble execution
   */
  executionId?: string

  /**
   * Unique request ID
   * Same across the entire HTTP request lifecycle
   */
  requestId?: string
}

export interface AgentResponse {
  success: boolean
  data?: unknown
  output?: any // Alias for data, used by some agents
  error?: string
  timestamp: string
  cached: boolean
  executionTime: number
  metadata?: Record<string, unknown>
}

/**
 * Base class for all agent types
 */
export abstract class BaseAgent {
  protected config: AgentConfig
  protected name: string
  protected type: string

  constructor(config: AgentConfig) {
    this.config = config
    this.name = config.name
    this.type = config.operation
  }

  /**
   * Execute the agent with given input and context
   * @param context - Execution context
   * @returns Agent response
   */
  async execute(context: AgentExecutionContext): Promise<AgentResponse> {
    const startTime = Date.now()

    try {
      // Perform the actual work (implemented by subclasses)
      const result = await this.run(context)

      const executionTime = Date.now() - startTime

      return this.wrapSuccess(result, executionTime, false)
    } catch (error) {
      const executionTime = Date.now() - startTime
      return this.wrapError(error, executionTime)
    }
  }

  /**
   * Abstract method to be implemented by each agent type
   * @param context - Execution context
   * @returns Execution result
   */
  protected abstract run(context: AgentExecutionContext): Promise<any>

  /**
   * Wrap successful execution result
   * @param data - Result data
   * @param executionTime - Time taken in milliseconds
   * @param cached - Whether result was cached
   * @returns Wrapped response
   */
  protected wrapSuccess(
    data: unknown,
    executionTime: number,
    cached: boolean = false
  ): AgentResponse {
    return {
      success: true,
      data,
      timestamp: new Date().toISOString(),
      cached,
      executionTime,
      metadata: {
        agent: this.name,
        type: this.type,
      },
    }
  }

  /**
   * Wrap error response
   * @param error - Error object
   * @param executionTime - Time taken in milliseconds
   * @returns Wrapped error response
   */
  protected wrapError(error: unknown, executionTime: number): AgentResponse {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'

    return {
      success: false,
      error: errorMessage,
      timestamp: new Date().toISOString(),
      cached: false,
      executionTime,
      metadata: {
        agent: this.name,
        type: this.type,
      },
    }
  }

  /**
   * Generate cache key for this agent's execution
   * @param input - Input data
   * @returns Cache key string
   */
  async generateCacheKey(input: Record<string, any>): Promise<string> {
    // Create a stable string representation of input
    const inputString = JSON.stringify(this.sortObjectKeys(input))

    // SHA-256 hash for cache key
    const hash = await this.hashString(inputString)
    return `agent:${this.name}:${hash}`
  }

  /**
   * Sort object keys recursively for stable stringification
   * @param obj - Object to sort
   * @returns Sorted object
   */
  private sortObjectKeys(obj: unknown): unknown {
    if (typeof obj !== 'object' || obj === null) {
      return obj
    }

    if (Array.isArray(obj)) {
      return obj.map((item) => this.sortObjectKeys(item))
    }

    const sorted: Record<string, unknown> = {}
    const keys = Object.keys(obj).sort()

    for (const key of keys) {
      sorted[key] = this.sortObjectKeys((obj as Record<string, unknown>)[key])
    }

    return sorted
  }

  /**
   * Cryptographically secure SHA-256 hash function
   * @param str - String to hash
   * @returns Hash value (hex string)
   */
  private async hashString(str: string): Promise<string> {
    // Encode string to Uint8Array
    const encoder = new TextEncoder()
    const data = encoder.encode(str)

    // Calculate SHA-256 hash
    const hashBuffer = await crypto.subtle.digest('SHA-256', data)

    // Convert to hex string
    const hashArray = Array.from(new Uint8Array(hashBuffer))
    const hashHex = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('')

    // Return first 16 chars for reasonable key length
    return hashHex.substring(0, 16)
  }

  /**
   * Get agent configuration
   * @returns Agent configuration
   */
  getConfig(): AgentConfig {
    return this.config
  }

  /**
   * Get agent name
   * @returns Agent name
   */
  getName(): string {
    return this.name
  }

  /**
   * Get agent type
   * @returns Agent type
   */
  getType(): string {
    return this.type
  }
}
