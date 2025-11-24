/**
 * Plugin Registry
 *
 * Global registry for operations that can be used across ALL contexts
 * (ensembles, forms, APIs, webhooks, etc.)
 *
 * This enables:
 * - Dynamic operation registration (plugins can add operations)
 * - Universal operation interface (same operation works everywhere)
 * - Operation discovery and metadata
 */

import type { ConductorEnv } from '../types/env.js'

/**
 * Context in which an operation is being executed
 */
export interface OperationContext {
  /** Cloudflare Request object (if available) */
  request?: Request
  /** Cloudflare Workers environment bindings */
  env: ConductorEnv
  /** Cloudflare Workers execution context */
  ctx: ExecutionContext
  /** URL/route parameters */
  params?: Record<string, string>
  /** Query string parameters */
  query?: Record<string, string>
  /** Request headers */
  headers?: Record<string, string>
  /** Input data for the operation */
  data?: Record<string, any>
  /** Context type where operation is being used */
  contextType: 'ensemble' | 'form' | 'api' | 'webhook'
  /** Agent registry (for agent operations) */
  agentRegistry?: Map<string, any>
}

/**
 * Configuration for an operation
 */
export interface OperationConfig {
  /** Operation name/type (e.g., 'think', 'fetch-data', 'plasmic:render') */
  operation: string
  /** Operation-specific configuration */
  config: Record<string, any>
  /** Optional custom handler (overrides registered handler) */
  handler?: (context: OperationContext) => Promise<any>
}

/**
 * Operation handler interface
 */
export interface OperationHandler {
  /**
   * Execute the operation
   */
  execute(operation: OperationConfig, context: OperationContext): Promise<any>
}

/**
 * Metadata about an operation
 */
export interface OperationMetadata {
  /** Operation identifier */
  name: string
  /** Human-readable description */
  description: string
  /** Version (semver) */
  version?: string
  /** Plugin/package that provides this operation */
  author?: string
  /** Contexts where this operation can be used */
  contexts?: Array<'ensemble' | 'form' | 'api' | 'webhook' | 'all'>
  /** Input schema (for validation/documentation) */
  inputs?: Record<string, any>
  /** Output schema (for validation/documentation) */
  outputs?: Record<string, any>
  /** Tags for categorization */
  tags?: string[]
}

/**
 * Global Plugin Registry
 *
 * Singleton registry for ALL operations across ALL contexts.
 * Enables plugins to register custom operations that work universally.
 */
export class PluginRegistry {
  private static instance: PluginRegistry
  private operations = new Map<string, OperationHandler>()
  private metadata = new Map<string, OperationMetadata>()

  private constructor() {
    // Register built-in operations
    this.registerBuiltInOperations()
  }

  /**
   * Get singleton instance
   */
  static getInstance(): PluginRegistry {
    if (!PluginRegistry.instance) {
      PluginRegistry.instance = new PluginRegistry()
    }
    return PluginRegistry.instance
  }

  /**
   * Register an operation handler
   *
   * This operation will be available in ALL contexts (ensembles, forms, etc.)
   * Plugins use this to add custom operations.
   *
   * @example
   * ```typescript
   * registry.register('plasmic:render', plasmicHandler, {
   *   name: 'plasmic:render',
   *   description: 'Render Plasmic component',
   *   version: '1.0.0',
   *   author: '@conductor/plasmic'
   * })
   * ```
   */
  register(name: string, handler: OperationHandler, metadata?: OperationMetadata): void {
    if (this.operations.has(name)) {
      console.warn(`[PluginRegistry] Overwriting operation: ${name}`)
    }

    this.operations.set(name, handler)

    if (metadata) {
      this.metadata.set(name, {
        ...metadata,
        contexts: metadata.contexts || ['all'],
      })
    }

    console.log(`[PluginRegistry] Registered operation: ${name}`)
  }

  /**
   * Get operation handler
   */
  get(name: string): OperationHandler | undefined {
    return this.operations.get(name)
  }

  /**
   * Get operation metadata
   */
  getMetadata(name: string): OperationMetadata | undefined {
    return this.metadata.get(name)
  }

  /**
   * List all registered operations
   */
  list(): string[] {
    return Array.from(this.operations.keys())
  }

  /**
   * List operations by context type
   */
  listByContext(contextType: 'ensemble' | 'form' | 'api' | 'webhook'): string[] {
    return Array.from(this.metadata.entries())
      .filter(([_, meta]) => {
        if (!meta.contexts || meta.contexts.length === 0) return true
        if (meta.contexts.includes('all')) return true
        return meta.contexts.includes(contextType)
      })
      .map(([name]) => name)
  }

  /**
   * List operations by tag
   */
  listByTag(tag: string): string[] {
    return Array.from(this.metadata.entries())
      .filter(([_, meta]) => meta.tags?.includes(tag))
      .map(([name]) => name)
  }

  /**
   * Check if operation exists
   */
  has(name: string): boolean {
    return this.operations.has(name)
  }

  /**
   * Execute an operation
   */
  async execute(operation: OperationConfig, context: OperationContext): Promise<any> {
    // Use custom handler if provided
    if (operation.handler) {
      return operation.handler(context)
    }

    // Look up registered handler
    const handler = this.get(operation.operation)
    if (!handler) {
      throw new Error(`[PluginRegistry] Unknown operation: ${operation.operation}`)
    }

    return handler.execute(operation, context)
  }

  /**
   * Register built-in operations
   *
   * These are the core operations provided by Conductor.
   * Plugins can add additional operations via register().
   */
  private registerBuiltInOperations(): void {
    // fetch-data: Universal data fetching operation
    this.register(
      'fetch-data',
      {
        async execute(operation: OperationConfig, context: OperationContext) {
          const { source, collection, query } = operation.config
          console.log(`[fetch-data] Fetching from ${source}/${collection}`, query)

          // TODO: Integrate with actual data sources
          // - Payload CMS via @conductor/payload plugin
          // - D1 database
          // - KV storage
          // - R2 storage
          // - External APIs

          return {
            _mock: true,
            source,
            collection,
            query,
            data: [],
          }
        },
      },
      {
        name: 'fetch-data',
        description: 'Fetch data from various sources (Payload, D1, KV, R2, APIs)',
        contexts: ['all'],
        tags: ['data', 'fetch', 'database'],
        inputs: {
          source: 'string (payload, d1, kv, r2, api)',
          collection: 'string (collection/table name)',
          query: 'object (query parameters)',
        },
        outputs: {
          data: 'array (fetched records)',
        },
      }
    )

    // transform-data: Universal data transformation operation
    this.register(
      'transform-data',
      {
        async execute(operation: OperationConfig, context: OperationContext) {
          const { input, transform } = operation.config
          console.log('[transform-data] Transforming data', { input, transform })

          // TODO: Implement actual transformation logic
          // - JSONata expressions
          // - JavaScript functions
          // - Template interpolation

          return {
            _mock: true,
            input,
            transform,
            output: input, // Mock: return input unchanged
          }
        },
      },
      {
        name: 'transform-data',
        description: 'Transform data using JSONata, JavaScript, or templates',
        contexts: ['all'],
        tags: ['data', 'transform', 'processing'],
        inputs: {
          input: 'any (data to transform)',
          transform: 'string (transformation expression)',
        },
        outputs: {
          output: 'any (transformed data)',
        },
      }
    )

    // Custom code operation (inline JavaScript/TypeScript)
    this.register(
      'custom-code',
      {
        async execute(operation: OperationConfig, context: OperationContext) {
          const { code, input } = operation.config
          console.log('[custom-code] Executing custom code')

          // TODO: Implement safe code execution
          // - Sandbox environment
          // - Timeout limits
          // - Memory limits

          return {
            _mock: true,
            code,
            input,
            output: null,
          }
        },
      },
      {
        name: 'custom-code',
        description: 'Execute custom JavaScript/TypeScript code',
        contexts: ['all'],
        tags: ['code', 'custom', 'javascript'],
        inputs: {
          code: 'string (JavaScript code)',
          input: 'any (input data)',
        },
        outputs: {
          output: 'any (code execution result)',
        },
      }
    )

    // Agent invocation operation (invoke registered agents)
    this.register(
      'agent',
      {
        async execute(operation: OperationConfig, context: OperationContext) {
          const { agent: agentName, input } = operation.config

          if (!agentName) {
            throw new Error('[agent] Missing required config: agent (name of agent to invoke)')
          }

          if (!context.agentRegistry) {
            throw new Error(
              '[agent] Agent registry not available in operation context. ' +
                'Make sure agents are registered before using the agent operation.'
            )
          }

          console.log(`[agent] Invoking agent: ${agentName}`)

          // Get agent from registry
          const agentInstance = context.agentRegistry.get(agentName)
          if (!agentInstance) {
            const availableAgents = Array.from(context.agentRegistry.keys()).join(', ')
            throw new Error(
              `[agent] Agent "${agentName}" not found. Available agents: ${availableAgents || 'none'}`
            )
          }

          // Execute agent
          try {
            const result = await agentInstance.execute({
              input: input || {},
              env: context.env,
              ctx: context.ctx,
            })

            // Check if execution was successful
            if (result.success === false) {
              throw new Error(result.error || 'Agent execution failed')
            }

            console.log(`[agent] Agent "${agentName}" completed successfully`)

            // Return the actual output data (unwrap the AgentResponse)
            // Agents return { success, data, output, ... } - we want the data/output
            return result.data || result.output || result
          } catch (error) {
            console.error(`[agent] Agent "${agentName}" execution failed:`, error)
            throw new Error(
              `[agent] Failed to execute agent "${agentName}": ${
                error instanceof Error ? error.message : String(error)
              }`
            )
          }
        },
      },
      {
        name: 'agent',
        description: 'Invoke a registered Conductor agent (think, code, storage, etc.)',
        contexts: ['all'],
        tags: ['agent', 'invoke', 'conductor'],
        inputs: {
          agent: 'string (name of agent to invoke)',
          input: 'object (input data to pass to agent)',
        },
        outputs: {
          output: 'any (agent execution result)',
        },
      }
    )

    console.log('[PluginRegistry] Built-in operations registered')
  }

  /**
   * Unregister an operation (for testing)
   */
  unregister(name: string): boolean {
    const deleted = this.operations.delete(name)
    this.metadata.delete(name)
    return deleted
  }

  /**
   * Clear all operations (for testing)
   */
  clear(): void {
    this.operations.clear()
    this.metadata.clear()
  }

  /**
   * Reset registry to initial state (for testing)
   */
  reset(): void {
    this.clear()
    this.registerBuiltInOperations()
  }
}

/**
 * Get global plugin registry instance
 */
export function getPluginRegistry(): PluginRegistry {
  return PluginRegistry.getInstance()
}

// Backwards compatibility - export as OperationRegistry
/** @deprecated Use PluginRegistry instead */
export const OperationRegistry = PluginRegistry

/** @deprecated Use getPluginRegistry instead */
export const getOperationRegistry = getPluginRegistry
