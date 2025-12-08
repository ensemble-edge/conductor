/**
 * Discovery Registries for Agents and Ensembles
 *
 * Provides read-only access to discover and inspect registered agents and ensembles.
 * Used by TypeScript handlers that need to enumerate available resources (e.g., OpenAPI generation).
 *
 * @module components/discovery
 */

import type { BaseAgent } from '../agents/base-agent.js'
import type { EnsembleConfig } from '../runtime/parser.js'

/**
 * Metadata about a registered agent
 */
export interface AgentMetadata {
  /** Agent name */
  name: string
  /** Operation type (think, code, data, api, etc.) */
  operation: string
  /** Agent description */
  description?: string
  /** Input schema if defined */
  inputSchema?: Record<string, unknown>
  /** Output schema if defined */
  outputSchema?: Record<string, unknown>
  /** Whether this is a built-in agent */
  builtIn: boolean
}

/**
 * Metadata about a registered ensemble
 */
export interface EnsembleMetadata {
  /** Ensemble name */
  name: string
  /** Ensemble description */
  description?: string
  /** Triggers configured for this ensemble */
  triggers: Array<{
    type: string
    path?: string
    methods?: string[]
    cron?: string
  }>
  /** Input schema if defined */
  inputSchema?: Record<string, unknown>
  /** Output schema if defined */
  outputSchema?: unknown
  /** Source type (yaml or typescript) */
  source: 'yaml' | 'typescript'
  /** Names of agents used in the flow */
  agentNames: string[]
  /** Number of steps in the flow */
  stepCount: number
}

/**
 * Read-only registry for discovering agents
 *
 * @example
 * ```typescript
 * export default async function(ctx: AgentExecutionContext) {
 *   const agents = ctx.agentRegistry?.list() || []
 *
 *   // Find all data agents
 *   const dataAgents = agents.filter(a => a.operation === 'data')
 *
 *   // Get specific agent metadata
 *   const scraper = ctx.agentRegistry?.get('scrape')
 *
 *   return { agentCount: agents.length }
 * }
 * ```
 */
export interface AgentRegistry {
  /**
   * List all registered agents with their metadata
   */
  list(): AgentMetadata[]

  /**
   * Get metadata for a specific agent by name
   */
  get(name: string): AgentMetadata | undefined

  /**
   * Check if an agent is registered
   */
  has(name: string): boolean
}

/**
 * Read-only registry for discovering ensembles
 *
 * @example
 * ```typescript
 * export default async function(ctx: AgentExecutionContext) {
 *   const ensembles = ctx.ensembleRegistry?.list() || []
 *
 *   // Find all HTTP-triggered ensembles
 *   const httpEnsembles = ensembles.filter(e =>
 *     e.triggers.some(t => t.type === 'http')
 *   )
 *
 *   // Generate OpenAPI paths
 *   const paths = {}
 *   for (const ensemble of httpEnsembles) {
 *     for (const trigger of ensemble.triggers) {
 *       if (trigger.type === 'http' && trigger.path) {
 *         paths[trigger.path] = { ... }
 *       }
 *     }
 *   }
 *
 *   return { paths }
 * }
 * ```
 */
export interface EnsembleRegistry {
  /**
   * List all registered ensembles with their metadata
   */
  list(): EnsembleMetadata[]

  /**
   * Get metadata for a specific ensemble by name
   */
  get(name: string): EnsembleMetadata | undefined

  /**
   * Check if an ensemble is registered
   */
  has(name: string): boolean
}

/**
 * Metadata about a documentation page
 */
export interface DocsPageMetadata {
  /** Page slug (URL-friendly identifier) */
  slug: string
  /** Page title */
  title: string
  /** Markdown content */
  content: string
  /** Page order in navigation */
  order?: number
}

/**
 * Read-only registry for discovering documentation pages
 *
 * @example
 * ```typescript
 * export default async function(ctx: AgentExecutionContext) {
 *   const pages = ctx.docsRegistry?.list() || []
 *
 *   // Find a specific page
 *   const gettingStarted = ctx.docsRegistry?.get('getting-started')
 *
 *   // Check if page exists
 *   if (ctx.docsRegistry?.has('advanced')) {
 *     // ...
 *   }
 *
 *   return { pageCount: pages.length }
 * }
 * ```
 */
export interface DocsRegistry {
  /**
   * List all documentation pages with their metadata
   */
  list(): DocsPageMetadata[]

  /**
   * Get a specific page by slug
   */
  get(slug: string): DocsPageMetadata | undefined

  /**
   * Check if a page exists
   */
  has(slug: string): boolean
}

/**
 * Create an AgentRegistry from a Map of BaseAgent instances
 */
export function createAgentRegistry(agents: Map<string, BaseAgent>): AgentRegistry {
  return {
    list(): AgentMetadata[] {
      const result: AgentMetadata[] = []
      for (const [name, agent] of agents) {
        result.push(extractAgentMetadata(name, agent))
      }
      return result
    },

    get(name: string): AgentMetadata | undefined {
      const agent = agents.get(name)
      if (!agent) return undefined
      return extractAgentMetadata(name, agent)
    },

    has(name: string): boolean {
      return agents.has(name)
    },
  }
}

/**
 * Extract metadata from a BaseAgent instance
 */
function extractAgentMetadata(name: string, agent: BaseAgent): AgentMetadata {
  const config = agent.getConfig?.() || {}
  return {
    name,
    operation: agent.getType?.() || config.operation || 'unknown',
    description: config.description,
    // AgentConfig stores input/output schema under config.schema
    inputSchema: config.schema?.input,
    outputSchema: config.schema?.output,
    builtIn: isBuiltInAgent(name),
  }
}

/**
 * Check if an agent is a built-in type
 */
function isBuiltInAgent(name: string): boolean {
  const builtInNames = [
    'scrape',
    'validate',
    'rag',
    'hitl',
    'fetch',
    'html',
    'form',
    'storage',
    'queue',
    'pdf',
    'email',
    'sms',
  ]
  return builtInNames.includes(name)
}

/**
 * Create an EnsembleRegistry from a Map of EnsembleConfig instances
 */
export function createEnsembleRegistry(
  ensembles: Map<string, { config: EnsembleConfig; source: 'yaml' | 'typescript' }>
): EnsembleRegistry {
  return {
    list(): EnsembleMetadata[] {
      const result: EnsembleMetadata[] = []
      for (const [name, { config, source }] of ensembles) {
        result.push(extractEnsembleMetadata(name, config, source))
      }
      return result
    },

    get(name: string): EnsembleMetadata | undefined {
      const entry = ensembles.get(name)
      if (!entry) return undefined
      return extractEnsembleMetadata(name, entry.config, entry.source)
    },

    has(name: string): boolean {
      return ensembles.has(name)
    },
  }
}

/**
 * Extract metadata from an EnsembleConfig
 */
function extractEnsembleMetadata(
  name: string,
  config: EnsembleConfig,
  source: 'yaml' | 'typescript'
): EnsembleMetadata {
  // Extract triggers
  const triggers =
    config.trigger?.map((t: any) => ({
      type: t.type,
      path: t.path || t.paths?.[0]?.path,
      methods: t.methods || t.paths?.[0]?.methods,
      cron: t.cron,
    })) || []

  // Extract agent names from flow
  const agentNames: string[] = []
  if (Array.isArray(config.flow)) {
    for (const step of config.flow) {
      if ('agent' in step && typeof step.agent === 'string') {
        agentNames.push(step.agent)
      }
    }
  }

  return {
    name,
    description: config.description,
    triggers,
    inputSchema: config.input,
    outputSchema: config.output,
    source,
    agentNames,
    stepCount: Array.isArray(config.flow) ? config.flow.length : 0,
  }
}

/**
 * Create a DocsRegistry from a Map of docs pages
 *
 * @param docs - Map from DocsDirectoryLoader.getRegistryData()
 */
export function createDocsRegistry(
  docs: Map<string, { content: string; title: string; slug: string; order?: number }>
): DocsRegistry {
  return {
    list(): DocsPageMetadata[] {
      const result: DocsPageMetadata[] = []
      for (const [slug, page] of docs) {
        result.push({
          slug,
          title: page.title,
          content: page.content,
          order: page.order,
        })
      }
      // Sort by order if available
      return result.sort((a, b) => (a.order ?? 999) - (b.order ?? 999))
    },

    get(slug: string): DocsPageMetadata | undefined {
      const page = docs.get(slug)
      if (!page) return undefined
      return {
        slug,
        title: page.title,
        content: page.content,
        order: page.order,
      }
    },

    has(slug: string): boolean {
      return docs.has(slug)
    },
  }
}
