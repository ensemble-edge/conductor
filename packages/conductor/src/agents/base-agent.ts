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
import type { AuthContext } from '../auth/types.js'
import type { SchemaRegistry } from '../components/schemas.js'
import type { PromptRegistry } from '../components/prompts.js'
import type { ConfigRegistry } from '../components/configs.js'
import type { QueryRegistry } from '../components/queries.js'
import type { ScriptRegistry } from '../components/scripts.js'
import type { TemplateRegistry } from '../components/templates.js'
import type { AgentRegistry, EnsembleRegistry, DocsRegistry } from '../components/discovery.js'
import type { SafeFetchOptions } from '../utils/safe-fetch.js'
import { safeFetch } from '../utils/safe-fetch.js'
import type { ExecutionId, RequestId } from '../types/branded.js'
import type { MemoryManager } from '../runtime/memory/memory-manager.js'

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
   * Branded type ensures type safety - use ExecutionId.unwrap() to get string
   */
  executionId?: ExecutionId

  /**
   * Unique request ID
   * Same across the entire HTTP request lifecycle
   * Branded type ensures type safety - use RequestId.unwrap() to get string
   */
  requestId?: RequestId

  /**
   * Authentication context from the request
   * Available when request was authenticated via trigger auth or API middleware
   *
   * @example
   * ```typescript
   * export default async function(context: AgentExecutionContext) {
   *   const { auth } = context
   *   if (auth?.authenticated) {
   *     logger.info('Request from user', { userId: auth.user?.id })
   *   }
   *   return { userAuthenticated: auth?.authenticated ?? false }
   * }
   * ```
   */
  auth?: AuthContext

  /**
   * Schema registry for validating data against JSON schemas
   * Schemas are loaded from KV storage with versioning support
   *
   * @example
   * ```typescript
   * export default async function(context: AgentExecutionContext) {
   *   const { schemas, input } = context
   *
   *   // Validate input against a schema
   *   const result = await schemas.validate('order@v1.0.0', input)
   *   if (!result.valid) {
   *     throw new Error(`Validation failed: ${result.errors[0].message}`)
   *   }
   *
   *   // Quick boolean check
   *   if (await schemas.isValid('order', input)) {
   *     // process valid order
   *   }
   *
   *   return { validated: true }
   * }
   * ```
   */
  schemas?: SchemaRegistry

  /**
   * Prompt registry for accessing and rendering prompt templates
   * Prompts are loaded from KV storage with Handlebars rendering
   *
   * @example
   * ```typescript
   * export default async function(context: AgentExecutionContext) {
   *   const { prompts, input } = context
   *
   *   // Get raw prompt template
   *   const template = await prompts.get('extraction@v1.0.0')
   *
   *   // Render with variables
   *   const rendered = await prompts.render('docs-writer', {
   *     page: input.page,
   *     projectName: 'MyApp'
   *   })
   *
   *   return { prompt: rendered }
   * }
   * ```
   */
  prompts?: PromptRegistry

  /**
   * Config registry for accessing shared configuration components
   * Configs are loaded from KV storage with versioning and merging support
   *
   * @example
   * ```typescript
   * export default async function(context: AgentExecutionContext) {
   *   const { configs } = context
   *
   *   // Get full config
   *   const settings = await configs.get('docs-settings')
   *
   *   // Get nested value with default
   *   const theme = await configs.getValueOrDefault(
   *     'docs-settings',
   *     'theme.primaryColor',
   *     '#3B82F6'
   *   )
   *
   *   // Merge with overrides
   *   const customSettings = await configs.merge('docs-settings', {
   *     theme: { primaryColor: '#FF0000' }
   *   })
   *
   *   return { theme }
   * }
   * ```
   */
  configs?: ConfigRegistry

  /**
   * Query registry for accessing SQL query templates
   * Queries are loaded from KV storage with versioning support
   *
   * @example
   * ```typescript
   * export default async function(context: AgentExecutionContext) {
   *   const { queries, env } = context
   *
   *   // Get a query template
   *   const sql = await queries.getSql('find-users@v1.0.0')
   *
   *   // Execute with D1
   *   const stmt = env.DB.prepare(sql)
   *   const results = await stmt.bind(userId).all()
   *
   *   return { users: results.results }
   * }
   * ```
   */
  queries?: QueryRegistry

  /**
   * Script registry for accessing JavaScript/TypeScript scripts
   * Scripts are loaded from KV storage with versioning support
   *
   * @example
   * ```typescript
   * export default async function(context: AgentExecutionContext) {
   *   const { scripts } = context
   *
   *   // Get a script's source code
   *   const script = await scripts.get('transform-data@v1.0.0')
   *
   *   // Check if a script exists
   *   if (await scripts.exists('custom-validator')) {
   *     const validator = await scripts.get('custom-validator')
   *   }
   *
   *   return { processed: true }
   * }
   * ```
   */
  scripts?: ScriptRegistry

  /**
   * Template registry for accessing HTML/Handlebars templates
   * Templates are loaded from KV storage with versioning and rendering support
   *
   * @example
   * ```typescript
   * export default async function(context: AgentExecutionContext) {
   *   const { templates } = context
   *
   *   // Get a template
   *   const template = await templates.get('email-header@v1.0.0')
   *
   *   // Render with variables
   *   const html = await templates.render('page-layout', {
   *     title: 'Welcome',
   *     content: 'Hello World',
   *   })
   *
   *   return { html }
   * }
   * ```
   */
  templates?: TemplateRegistry

  /**
   * Agent-specific configuration from the ensemble definition
   * This is the `config` block defined for this agent in the YAML
   *
   * @example
   * ```yaml
   * # In ensemble YAML:
   * agents:
   *   - name: my-agent
   *     operation: code
   *     config:
   *       apiKey: ${env.API_KEY}
   *       maxRetries: 3
   *       options:
   *         verbose: true
   * ```
   *
   * ```typescript
   * export default async function(context: AgentExecutionContext) {
   *   const { config } = context
   *
   *   const apiKey = config?.apiKey as string
   *   const maxRetries = config?.maxRetries ?? 1
   *   const verbose = config?.options?.verbose ?? false
   *
   *   return { configured: true }
   * }
   * ```
   */
  config?: Record<string, any>

  /**
   * Agent registry for discovering available agents
   * Useful for introspection and dynamic orchestration
   *
   * @example
   * ```typescript
   * export default async function(ctx: AgentExecutionContext) {
   *   const { agentRegistry } = ctx
   *
   *   // List all available agents
   *   const agents = agentRegistry?.list() || []
   *
   *   // Find agents by type
   *   const dataAgents = agents.filter(a => a.operation === 'data')
   *
   *   // Check if a specific agent exists
   *   if (agentRegistry?.has('my-custom-agent')) {
   *     const meta = agentRegistry.get('my-custom-agent')
   *     // Use agent metadata...
   *   }
   *
   *   return { availableAgents: agents.map(a => a.name) }
   * }
   * ```
   */
  agentRegistry?: AgentRegistry

  /**
   * Ensemble registry for discovering available ensembles
   * Useful for generating API docs (OpenAPI) or building orchestration UIs
   *
   * @example
   * ```typescript
   * export default async function(ctx: AgentExecutionContext) {
   *   const { ensembleRegistry } = ctx
   *
   *   // List all ensembles
   *   const ensembles = ensembleRegistry?.list() || []
   *
   *   // Find HTTP-triggered ensembles for OpenAPI generation
   *   const httpEnsembles = ensembles.filter(e =>
   *     e.triggers.some(t => t.type === 'http')
   *   )
   *
   *   // Generate paths for OpenAPI spec
   *   const paths = {}
   *   for (const ensemble of httpEnsembles) {
   *     for (const trigger of ensemble.triggers) {
   *       if (trigger.type === 'http' && trigger.path) {
   *         paths[trigger.path] = {
   *           [trigger.methods?.[0]?.toLowerCase() || 'get']: {
   *             summary: ensemble.description,
   *             operationId: ensemble.name,
   *           }
   *         }
   *       }
   *     }
   *   }
   *
   *   return { openapi: { paths } }
   * }
   * ```
   */
  ensembleRegistry?: EnsembleRegistry

  /**
   * Docs registry for discovering documentation pages
   * Useful for rendering markdown pages in documentation agents
   *
   * @example
   * ```typescript
   * export default async function(ctx: AgentExecutionContext) {
   *   const { docsRegistry, input } = ctx
   *
   *   // List all available docs pages
   *   const pages = docsRegistry?.list() || []
   *
   *   // Get a specific page by slug
   *   const page = docsRegistry?.get(input.slug)
   *   if (!page) {
   *     return { error: 'not_found', message: `Page not found: ${input.slug}` }
   *   }
   *
   *   return { page }
   * }
   * ```
   */
  docsRegistry?: DocsRegistry

  /**
   * Memory manager for persistent conversation and context
   *
   * Provides access to 5 memory tiers:
   * - **Working**: In-memory storage for current execution
   * - **Session**: KV-based conversation history with TTL
   * - **Long-Term**: D1-based persistent user data
   * - **Semantic**: Vectorize-based semantic search (RAG)
   * - **Analytical**: Hyperdrive SQL database access
   *
   * @example
   * ```typescript
   * export default async function(context: AgentExecutionContext) {
   *   const { memory, input } = context
   *
   *   // Get conversation history
   *   const history = await memory?.getConversationHistory() ?? []
   *
   *   // Add a new message
   *   await memory?.addMessage({
   *     role: 'user',
   *     content: input.message,
   *     timestamp: Date.now()
   *   })
   *
   *   // Search semantic memory (RAG)
   *   const relevant = await memory?.searchSemantic(input.query, { topK: 5 }) ?? []
   *
   *   // Store in long-term memory
   *   await memory?.setLongTerm('user.preferences', { theme: 'dark' })
   *
   *   return { history, relevant }
   * }
   * ```
   */
  memory?: MemoryManager

  /**
   * SSRF-protected fetch function for making HTTP requests
   *
   * **ALWAYS use this instead of the global `fetch()`** when making requests
   * to URLs that come from user input or external sources.
   *
   * By default, this blocks requests to:
   * - Private IP ranges (10.x, 172.16.x, 192.168.x)
   * - Localhost (127.0.0.1, ::1)
   * - Cloud metadata services (169.254.169.254)
   * - Internal hostnames (.local, .internal)
   *
   * @example
   * ```typescript
   * export default async function(context: AgentExecutionContext) {
   *   const { fetch, input } = context
   *
   *   // Safe - SSRF protection is automatic
   *   const response = await fetch(input.url)
   *   const data = await response.json()
   *
   *   return { data }
   * }
   * ```
   *
   * @example
   * ```typescript
   * // If you MUST access internal URLs (use with extreme caution!)
   * const response = await fetch(internalUrl, {
   *   allowInternalRequests: true
   * })
   * ```
   */
  fetch?: (input: string | URL | Request, init?: SafeFetchOptions) => Promise<Response>
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
 * Security settings for agents
 * Read from AgentConfig.security and used to control automatic security features
 */
export interface AgentSecuritySettings {
  /**
   * Enable SSRF protection for fetch requests
   * When true (default), requests to private IPs, localhost, and metadata services are blocked
   * @default true
   */
  ssrf: boolean
  // Future security features:
  // inputSanitization: boolean
  // rateLimiting: boolean
}

/**
 * Default security settings - secure by default
 */
const DEFAULT_SECURITY_SETTINGS: AgentSecuritySettings = {
  ssrf: true,
}

/**
 * Base class for all agent types
 */
export abstract class BaseAgent {
  protected config: AgentConfig
  protected name: string
  protected type: string
  protected security: AgentSecuritySettings

  constructor(config: AgentConfig) {
    this.config = config
    this.name = config.name
    this.type = config.operation

    // Initialize security settings from config, with secure defaults
    this.security = {
      ...DEFAULT_SECURITY_SETTINGS,
      ...config.security,
    }
  }

  /**
   * Execute the agent with given input and context
   * @param context - Execution context
   * @returns Agent response
   */
  async execute(context: AgentExecutionContext): Promise<AgentResponse> {
    const startTime = Date.now()

    // Enrich context with security features before passing to run()
    const enrichedContext = this.enrichContext(context)

    try {
      // Perform the actual work (implemented by subclasses)
      const result = await this.run(enrichedContext)

      const executionTime = Date.now() - startTime

      return this.wrapSuccess(result, executionTime, false)
    } catch (error) {
      const executionTime = Date.now() - startTime
      return this.wrapError(error, executionTime)
    }
  }

  /**
   * Enrich the execution context with automatic security features
   *
   * This method injects security utilities into the context based on
   * the agent's security settings. Developers don't need to remember
   * to add these - they're automatic.
   *
   * @param context - Original execution context
   * @returns Enriched context with security features
   */
  protected enrichContext(context: AgentExecutionContext): AgentExecutionContext {
    // Start with the original context
    const enriched: AgentExecutionContext = { ...context }

    // SSRF-protected fetch (if enabled and not already set)
    if (this.security.ssrf && !context.fetch) {
      enriched.fetch = safeFetch
    } else if (!this.security.ssrf && !context.fetch) {
      // SSRF disabled - use global fetch
      enriched.fetch = fetch
    }
    // If context.fetch is already set, preserve it (allows override)

    // Future security features would be added here:
    // if (this.security.inputSanitization) { ... }
    // if (this.security.rateLimiting) { ... }

    return enriched
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
