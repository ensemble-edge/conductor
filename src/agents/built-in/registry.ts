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
import type { BuiltInMemberMetadata, BuiltInMemberFactory, BuiltInMemberEntry } from './types.js'
import { Operation } from '../../types/constants.js'
import type { ConductorEnv } from '../../types/env.js'

export class BuiltInMemberRegistry {
  private agents = new Map<string, BuiltInMemberEntry>()

  /**
   * Register a built-in agent
   */
  register(metadata: BuiltInMemberMetadata, factory: BuiltInMemberFactory): void {
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
  create(name: string, config: AgentConfig, env: ConductorEnv): BaseAgent {
    const entry = this.agents.get(name)

    if (!entry) {
      throw new Error(
        `Built-in agent "${name}" not found. ` +
          `Available: ${this.getAvailableNames().join(', ')}`
      )
    }

    // Create instance using factory (lazy loading)
    entry.loaded = true
    return entry.factory(config, env)
  }

  /**
   * Get metadata for a built-in agent
   */
  getMetadata(name: string): BuiltInMemberMetadata | undefined {
    return this.agents.get(name)?.metadata
  }

  /**
   * List all built-in agents
   */
  list(): BuiltInMemberMetadata[] {
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
  listByType(type: string): BuiltInMemberMetadata[] {
    return this.list().filter((m) => m.operation === type)
  }

  /**
   * Get agents by tag
   */
  listByTag(tag: string): BuiltInMemberMetadata[] {
    return this.list().filter((m) => m.tags?.includes(tag))
  }
}

// Singleton registry instance
let registry: BuiltInMemberRegistry | null = null

/**
 * Get the built-in agent registry (singleton)
 */
export function getBuiltInRegistry(): BuiltInMemberRegistry {
  if (!registry) {
    registry = new BuiltInMemberRegistry()
    registerAllBuiltInMembers(registry)
  }
  return registry
}

/**
 * Register all built-in agents
 * This is called once when the registry is first accessed
 */
function registerAllBuiltInMembers(registry: BuiltInMemberRegistry): void {
  // Import and register each built-in agent
  // This happens lazily, so only loaded when first accessed

  // Scrape agent
  registry.register(
    {
      name: 'scrape',
      version: '1.0.0',
      description: '3-tier web scraping with bot protection and fallback strategies',
      operation: Operation.code,
      tags: ['web', 'scraping', 'cloudflare', 'browser-rendering'],
      examples: [
        {
          name: 'basic-scrape',
          description: 'Simple web scraping with balanced strategy',
          input: { url: 'https://example.com' },
          config: { strategy: 'balanced', returnFormat: 'markdown' },
          output: { markdown: '...', tier: 1, duration: 350 },
        },
        {
          name: 'aggressive-scrape',
          description: 'Aggressive scraping with all fallback tiers',
          input: { url: 'https://example.com' },
          config: { strategy: 'aggressive', returnFormat: 'markdown' },
          output: { markdown: '...', tier: 3, duration: 4500 },
        },
      ],
      documentation: 'https://docs.conductor.dev/built-in-agents/scrape',
    },
    (config, env) => {
      const { ScrapeMember } = require('./scrape')
      return new ScrapeMember(config, env)
    }
  )

  // Validate agent
  registry.register(
    {
      name: 'validate',
      version: '1.0.0',
      description:
        'Validation and evaluation with pluggable evaluators (judge, NLP, embedding, rule)',
      operation: Operation.scoring,
      tags: ['validation', 'evaluation', 'scoring', 'quality'],
      examples: [
        {
          name: 'rule-validation',
          description: 'Validate content using custom rules',
          input: { content: 'Sample content...' },
          config: {
            evalType: 'rule',
            rules: [{ name: 'minLength', check: 'content.length >= 800', weight: 0.5 }],
            threshold: 0.7,
          },
          output: { passed: true, score: 0.85, details: {} },
        },
        {
          name: 'llm-judge',
          description: 'Evaluate quality using LLM judge',
          input: { content: 'Sample content...', reference: 'Expected output...' },
          config: {
            evalType: 'judge',
            criteria: [
              { name: 'accuracy', weight: 0.4 },
              { name: 'relevance', weight: 0.3 },
            ],
            threshold: 0.8,
          },
        },
      ],
      documentation: 'https://docs.conductor.dev/built-in-agents/validate',
    },
    (config, env) => {
      const { ValidateMember } = require('./validate')
      return new ValidateMember(config, env)
    }
  )

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
    (config, env) => {
      const { RAGMember } = require('./rag')
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
    (config, env) => {
      const { HITLMember } = require('./hitl')
      return new HITLMember(config, env)
    }
  )

  // Fetch agent
  registry.register(
    {
      name: 'fetch',
      version: '1.0.0',
      description: 'HTTP client with retry logic and exponential backoff',
      operation: Operation.code,
      tags: ['http', 'api', 'fetch', 'retry'],
      examples: [
        {
          name: 'basic-fetch',
          description: 'Simple HTTP GET request',
          input: { url: 'https://api.example.com/data' },
          config: { method: 'GET', retry: 3, timeout: 5000 },
          output: { status: 200, body: {}, headers: {} },
        },
        {
          name: 'post-with-retry',
          description: 'POST request with retry logic',
          input: {
            url: 'https://api.example.com/submit',
            body: { data: 'value' },
          },
          config: {
            method: 'POST',
            retry: 5,
            timeout: 10000,
            headers: { 'Content-Type': 'application/json' },
          },
        },
      ],
      documentation: 'https://docs.conductor.dev/built-in-agents/fetch',
    },
    (config, env) => {
      const { FetchMember } = require('./fetch')
      return new FetchMember(config, env)
    }
  )

  // Queries agent
  registry.register(
    {
      name: 'queries',
      version: '1.0.0',
      description:
        'Execute SQL queries across Hyperdrive-connected databases with query catalog support',
      operation: Operation.storage,
      tags: ['sql', 'database', 'queries', 'hyperdrive', 'analytics'],
      examples: [
        {
          name: 'catalog-query',
          description: 'Execute query from catalog',
          input: {
            queryName: 'user-analytics',
            input: {
              startDate: '2024-01-01',
              endDate: '2024-01-31',
            },
          },
          config: {
            defaultDatabase: 'analytics',
            readOnly: true,
            transform: 'camelCase',
          },
          output: {
            rows: [],
            count: 25,
            metadata: {
              columns: ['date', 'user_count', 'active_users'],
              executionTime: 150,
              cached: false,
              database: 'analytics',
            },
          },
        },
        {
          name: 'inline-query',
          description: 'Execute inline SQL query',
          input: {
            sql: 'SELECT * FROM users WHERE created_at > $1 LIMIT 100',
            input: ['2024-01-01'],
          },
          config: {
            defaultDatabase: 'production',
            readOnly: true,
            maxRows: 100,
          },
        },
      ],
      inputSchema: {
        type: 'object',
        properties: {
          queryName: { type: 'string', description: 'Query name from catalog' },
          sql: { type: 'string', description: 'Inline SQL query' },
          input: {
            oneOf: [{ type: 'object' }, { type: 'array' }],
            description: 'Query parameters',
          },
          database: { type: 'string', description: 'Database alias' },
        },
      },
      outputSchema: {
        type: 'object',
        properties: {
          rows: { type: 'array' },
          count: { type: 'number' },
          metadata: { type: 'object' },
        },
      },
      configSchema: {
        type: 'object',
        properties: {
          defaultDatabase: { type: 'string' },
          cacheTTL: { type: 'number' },
          maxRows: { type: 'number' },
          timeout: { type: 'number' },
          readOnly: { type: 'boolean' },
          transform: { type: 'string', enum: ['none', 'camelCase', 'snakeCase'] },
          includeMetadata: { type: 'boolean' },
        },
      },
      documentation: 'https://docs.conductor.dev/built-in-agents/queries',
    },
    (config, env) => {
      const { QueriesMember } = require('./queries')
      return new QueriesMember(config, env)
    }
  )
}
