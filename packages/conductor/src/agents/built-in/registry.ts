/**
 * Built-In Agent Registry
 *
 * Manages registration, discovery, and lazy loading of built-in agents.
 *
 * Features:
 * - Lazy loading (only load agents when used)
 * - Auto-discovery (list all available agents)
 * - Versioning (each agent has a version)
 * - Metadata (description, schemas, examples)
 */

import type { BaseAgent } from '../base-agent.js'
import type { AgentConfig } from '../../runtime/parser.js'
import type { BuiltInAgentMetadata, BuiltInAgentFactory, BuiltInAgentEntry } from './types.js'
import { Operation } from '../../types/constants.js'
import type { ConductorEnv } from '../../types/env.js'

export class BuiltInAgentRegistry {
  private agents = new Map<string, BuiltInAgentEntry>()

  /**
   * Register a built-in agent
   */
  register(metadata: BuiltInAgentMetadata, factory: BuiltInAgentFactory): void {
    this.agents.set(metadata.name, {
      metadata,
      factory,
      loaded: false,
    })
  }

  /**
   * Check if a agent is built-in
   */
  isBuiltIn(name: string): boolean {
    return this.agents.has(name)
  }

  /**
   * Get a built-in agent instance (lazy loading)
   */
  async create(name: string, config: AgentConfig, env: ConductorEnv): Promise<BaseAgent> {
    const entry = this.agents.get(name)

    if (!entry) {
      throw new Error(
        `Built-in agent "${name}" not found. ` + `Available: ${this.getAvailableNames().join(', ')}`
      )
    }

    // Create instance using factory (lazy loading)
    entry.loaded = true
    return await entry.factory(config, env)
  }

  /**
   * Get metadata for a built-in agent
   */
  getMetadata(name: string): BuiltInAgentMetadata | undefined {
    return this.agents.get(name)?.metadata
  }

  /**
   * List all built-in agents
   */
  list(): BuiltInAgentMetadata[] {
    return Array.from(this.agents.values()).map((entry) => entry.metadata)
  }

  /**
   * Get available agent names
   */
  getAvailableNames(): string[] {
    return Array.from(this.agents.keys())
  }

  /**
   * Get agents by type
   */
  listByType(type: string): BuiltInAgentMetadata[] {
    return this.list().filter((m) => m.operation === type)
  }

  /**
   * Get agents by tag
   */
  listByTag(tag: string): BuiltInAgentMetadata[] {
    return this.list().filter((m) => m.tags?.includes(tag))
  }
}

// Singleton registry instance
let registry: BuiltInAgentRegistry | null = null

/**
 * Get the built-in agent registry (singleton)
 */
export function getBuiltInRegistry(): BuiltInAgentRegistry {
  if (!registry) {
    registry = new BuiltInAgentRegistry()
    registerAllBuiltInAgents(registry)
  }
  return registry
}

/**
 * Register all built-in agents
 * This is called once when the registry is first accessed
 *
 * Note: Most agents have been moved to template-based agents that users own and can customize.
 * See: catalog/cloud/cloudflare/templates/agents/system/
 *
 * Only RAG and HITL remain as true built-ins because they require deep framework integration:
 * - RAG: Tight Cloudflare Vectorize and Workers AI embedding integration
 * - HITL: Requires Durable Objects runtime coordination for workflow suspension
 */
function registerAllBuiltInAgents(registry: BuiltInAgentRegistry): void {
  // Import and register each built-in agent
  // This happens lazily, so only loaded when first accessed

  // RAG agent
  registry.register(
    {
      name: 'rag',
      version: '1.0.0',
      description: 'RAG system using Cloudflare Vectorize and AI embeddings',
      operation: Operation.storage,
      tags: ['rag', 'vectorize', 'embeddings', 'search', 'ai'],
      examples: [
        {
          name: 'index-content',
          description: 'Index content into vector database',
          input: {
            content: 'Document content...',
            id: 'doc-123',
            source: 'https://example.com',
          },
          config: {
            operation: 'index',
            chunkStrategy: 'semantic',
            chunkSize: 512,
          },
          output: { indexed: 10, chunks: 10 },
        },
        {
          name: 'search-content',
          description: 'Search for relevant content',
          input: { query: 'What is the company mission?' },
          config: {
            operation: 'search',
            topK: 5,
            rerank: true,
          },
          output: { results: [], count: 5 },
        },
      ],
      documentation: 'https://docs.conductor.dev/built-in-agents/rag',
    },
    async (config, env) => {
      const { RAGMember } = await import('./rag/index.js')
      return new RAGMember(config, env)
    }
  )

  // HITL agent
  registry.register(
    {
      name: 'hitl',
      version: '1.0.0',
      description: 'Human-in-the-loop workflows with approval gates and notifications',
      operation: Operation.code,
      tags: ['workflow', 'approval', 'human-in-loop', 'durable-objects'],
      examples: [
        {
          name: 'approval-gate',
          description: 'Suspend workflow for manual approval',
          input: {
            approvalData: {
              transaction: { amount: 10000, to: 'account-123' },
              risk_score: 0.85,
            },
          },
          config: {
            action: 'suspend',
            timeout: 86400000,
            notificationChannel: 'slack',
          },
          output: {
            status: 'suspended',
            executionId: 'exec-123',
            approvalUrl: 'https://app.com/approve/exec-123',
          },
        },
      ],
      documentation: 'https://docs.conductor.dev/built-in-agents/hitl',
    },
    async (config, env) => {
      const { HITLMember } = await import('./hitl/index.js')
      return new HITLMember(config, env)
    }
  )
}

// Backward compatibility alias
export const BuiltInMemberRegistry = BuiltInAgentRegistry
