/**
 * Discovery Registry Unit Tests
 *
 * Tests the agent and ensemble registry functionality for discovering
 * registered resources without requiring Cloudflare services.
 */

import { describe, it, expect, vi } from 'vitest'
import {
  createAgentRegistry,
  createEnsembleRegistry,
  type AgentMetadata,
  type EnsembleMetadata,
} from '../../../src/components/discovery.js'
import type { BaseAgent } from '../../../src/agents/base-agent.js'
import type { EnsembleConfig } from '../../../src/runtime/parser.js'

describe('createAgentRegistry', () => {
  // Create mock agents for testing
  const createMockAgent = (config: Partial<AgentMetadata>): BaseAgent => {
    return {
      getType: () => config.operation || 'code',
      getConfig: () => ({
        name: config.name,
        operation: config.operation || 'code',
        description: config.description,
        schema: {
          input: config.inputSchema,
          output: config.outputSchema,
        },
      }),
      execute: vi.fn(),
    } as unknown as BaseAgent
  }

  describe('list', () => {
    it('should list all registered agents', () => {
      const agents = new Map<string, BaseAgent>([
        ['scrape', createMockAgent({ name: 'scrape', operation: 'code' })],
        ['validate', createMockAgent({ name: 'validate', operation: 'scoring' })],
        ['custom', createMockAgent({ name: 'custom', operation: 'think' })],
      ])

      const registry = createAgentRegistry(agents)
      const list = registry.list()

      expect(list).toHaveLength(3)
      expect(list.map((a) => a.name).sort()).toEqual(['custom', 'scrape', 'validate'])
    })

    it('should return empty array when no agents registered', () => {
      const registry = createAgentRegistry(new Map())
      const list = registry.list()

      expect(list).toEqual([])
    })

    it('should include metadata for each agent', () => {
      const agents = new Map<string, BaseAgent>([
        [
          'test-agent',
          createMockAgent({
            name: 'test-agent',
            operation: 'think',
            description: 'A test agent',
            inputSchema: { type: 'object', properties: { query: { type: 'string' } } },
            outputSchema: { type: 'object', properties: { result: { type: 'string' } } },
          }),
        ],
      ])

      const registry = createAgentRegistry(agents)
      const list = registry.list()

      expect(list[0]).toMatchObject({
        name: 'test-agent',
        operation: 'think',
        description: 'A test agent',
        inputSchema: { type: 'object', properties: { query: { type: 'string' } } },
        outputSchema: { type: 'object', properties: { result: { type: 'string' } } },
      })
    })

    it('should mark built-in agents correctly', () => {
      const agents = new Map<string, BaseAgent>([
        ['scrape', createMockAgent({ name: 'scrape', operation: 'code' })],
        ['fetch', createMockAgent({ name: 'fetch', operation: 'code' })],
        ['custom-agent', createMockAgent({ name: 'custom-agent', operation: 'code' })],
      ])

      const registry = createAgentRegistry(agents)
      const list = registry.list()

      const scrape = list.find((a) => a.name === 'scrape')
      const fetch = list.find((a) => a.name === 'fetch')
      const custom = list.find((a) => a.name === 'custom-agent')

      expect(scrape?.builtIn).toBe(true)
      expect(fetch?.builtIn).toBe(true)
      expect(custom?.builtIn).toBe(false)
    })
  })

  describe('get', () => {
    it('should return agent metadata by name', () => {
      const agents = new Map<string, BaseAgent>([
        [
          'my-agent',
          createMockAgent({
            name: 'my-agent',
            operation: 'data',
            description: 'My custom agent',
          }),
        ],
      ])

      const registry = createAgentRegistry(agents)
      const agent = registry.get('my-agent')

      expect(agent).toBeDefined()
      expect(agent?.name).toBe('my-agent')
      expect(agent?.operation).toBe('data')
      expect(agent?.description).toBe('My custom agent')
    })

    it('should return undefined for unknown agent', () => {
      const registry = createAgentRegistry(new Map())
      const agent = registry.get('nonexistent')

      expect(agent).toBeUndefined()
    })
  })

  describe('has', () => {
    it('should return true for registered agent', () => {
      const agents = new Map<string, BaseAgent>([
        ['exists', createMockAgent({ name: 'exists' })],
      ])

      const registry = createAgentRegistry(agents)

      expect(registry.has('exists')).toBe(true)
    })

    it('should return false for unregistered agent', () => {
      const registry = createAgentRegistry(new Map())

      expect(registry.has('missing')).toBe(false)
    })
  })
})

describe('createEnsembleRegistry', () => {
  const createEnsembleEntry = (
    name: string,
    config: Partial<EnsembleConfig>,
    source: 'yaml' | 'typescript' = 'yaml'
  ) => ({
    config: {
      name,
      flow: config.flow || [{ agent: 'test', input: {} }],
      ...config,
    } as EnsembleConfig,
    source,
  })

  describe('list', () => {
    it('should list all registered ensembles', () => {
      const ensembles = new Map([
        ['api-endpoint', createEnsembleEntry('api-endpoint', {})],
        ['cron-job', createEnsembleEntry('cron-job', {})],
        ['webhook-handler', createEnsembleEntry('webhook-handler', {})],
      ])

      const registry = createEnsembleRegistry(ensembles)
      const list = registry.list()

      expect(list).toHaveLength(3)
      expect(list.map((e) => e.name).sort()).toEqual([
        'api-endpoint',
        'cron-job',
        'webhook-handler',
      ])
    })

    it('should return empty array when no ensembles registered', () => {
      const registry = createEnsembleRegistry(new Map())
      const list = registry.list()

      expect(list).toEqual([])
    })

    it('should extract HTTP trigger metadata', () => {
      const ensembles = new Map([
        [
          'api',
          createEnsembleEntry('api', {
            trigger: [{ type: 'http', path: '/api/users', methods: ['GET', 'POST'] }],
          }),
        ],
      ])

      const registry = createEnsembleRegistry(ensembles)
      const list = registry.list()

      expect(list[0].triggers).toHaveLength(1)
      expect(list[0].triggers[0]).toMatchObject({
        type: 'http',
        path: '/api/users',
        methods: ['GET', 'POST'],
      })
    })

    it('should extract cron trigger metadata', () => {
      const ensembles = new Map([
        [
          'scheduled',
          createEnsembleEntry('scheduled', {
            trigger: [{ type: 'cron', cron: '0 * * * *' }],
          }),
        ],
      ])

      const registry = createEnsembleRegistry(ensembles)
      const list = registry.list()

      expect(list[0].triggers[0]).toMatchObject({
        type: 'cron',
        cron: '0 * * * *',
      })
    })

    it('should extract multi-path trigger metadata', () => {
      const ensembles = new Map([
        [
          'docs',
          createEnsembleEntry('docs', {
            trigger: [
              {
                type: 'http',
                paths: [
                  { path: '/docs', methods: ['GET'] },
                  { path: '/docs/api', methods: ['GET'] },
                ],
              } as any,
            ],
          }),
        ],
      ])

      const registry = createEnsembleRegistry(ensembles)
      const list = registry.list()

      // Should extract first path
      expect(list[0].triggers[0].path).toBe('/docs')
      expect(list[0].triggers[0].methods).toEqual(['GET'])
    })

    it('should extract agent names from flow', () => {
      const ensembles = new Map([
        [
          'pipeline',
          createEnsembleEntry('pipeline', {
            flow: [
              { agent: 'validate', input: {} },
              { agent: 'process', input: {} },
              { agent: 'notify', input: {} },
            ],
          }),
        ],
      ])

      const registry = createEnsembleRegistry(ensembles)
      const list = registry.list()

      expect(list[0].agentNames).toEqual(['validate', 'process', 'notify'])
      expect(list[0].stepCount).toBe(3)
    })

    it('should include source type', () => {
      const ensembles = new Map([
        ['yaml-ensemble', createEnsembleEntry('yaml-ensemble', {}, 'yaml')],
        ['ts-ensemble', createEnsembleEntry('ts-ensemble', {}, 'typescript')],
      ])

      const registry = createEnsembleRegistry(ensembles)
      const list = registry.list()

      const yamlEnsemble = list.find((e) => e.name === 'yaml-ensemble')
      const tsEnsemble = list.find((e) => e.name === 'ts-ensemble')

      expect(yamlEnsemble?.source).toBe('yaml')
      expect(tsEnsemble?.source).toBe('typescript')
    })
  })

  describe('get', () => {
    it('should return ensemble metadata by name', () => {
      const ensembles = new Map([
        [
          'my-ensemble',
          createEnsembleEntry('my-ensemble', {
            description: 'My custom ensemble',
            trigger: [{ type: 'http', path: '/api', methods: ['GET'] }],
          }),
        ],
      ])

      const registry = createEnsembleRegistry(ensembles)
      const ensemble = registry.get('my-ensemble')

      expect(ensemble).toBeDefined()
      expect(ensemble?.name).toBe('my-ensemble')
      expect(ensemble?.description).toBe('My custom ensemble')
    })

    it('should return undefined for unknown ensemble', () => {
      const registry = createEnsembleRegistry(new Map())
      const ensemble = registry.get('nonexistent')

      expect(ensemble).toBeUndefined()
    })
  })

  describe('has', () => {
    it('should return true for registered ensemble', () => {
      const ensembles = new Map([['exists', createEnsembleEntry('exists', {})]])

      const registry = createEnsembleRegistry(ensembles)

      expect(registry.has('exists')).toBe(true)
    })

    it('should return false for unregistered ensemble', () => {
      const registry = createEnsembleRegistry(new Map())

      expect(registry.has('missing')).toBe(false)
    })
  })
})

describe('registry usage patterns', () => {
  it('should support filtering agents by operation type', () => {
    const createMockAgent = (name: string, operation: string): BaseAgent =>
      ({
        getType: () => operation,
        getConfig: () => ({ name, operation }),
        execute: vi.fn(),
      }) as unknown as BaseAgent

    const agents = new Map<string, BaseAgent>([
      ['scrape', createMockAgent('scrape', 'code')],
      ['validate', createMockAgent('validate', 'scoring')],
      ['think', createMockAgent('think', 'think')],
      ['fetch', createMockAgent('fetch', 'code')],
    ])

    const registry = createAgentRegistry(agents)

    // Filter by operation
    const codeAgents = registry.list().filter((a) => a.operation === 'code')
    expect(codeAgents).toHaveLength(2)
    expect(codeAgents.map((a) => a.name).sort()).toEqual(['fetch', 'scrape'])
  })

  it('should support finding HTTP-triggered ensembles', () => {
    const createEntry = (name: string, triggerType: string, path?: string) => ({
      config: {
        name,
        trigger: [{ type: triggerType, path, methods: ['GET'] }],
        flow: [{ agent: 'a', input: {} }],
      } as EnsembleConfig,
      source: 'yaml' as const,
    })

    const ensembles = new Map([
      ['api', createEntry('api', 'http', '/api')],
      ['webhook', createEntry('webhook', 'webhook', '/hooks')],
      ['cron', createEntry('cron', 'cron')],
    ])

    const registry = createEnsembleRegistry(ensembles)

    // Find HTTP triggered ensembles
    const httpEnsembles = registry
      .list()
      .filter((e) => e.triggers.some((t) => t.type === 'http'))

    expect(httpEnsembles).toHaveLength(1)
    expect(httpEnsembles[0].name).toBe('api')
  })

  it('should support OpenAPI path generation pattern', () => {
    const createEntry = (name: string, path: string, methods: string[]) => ({
      config: {
        name,
        trigger: [{ type: 'http', path, methods }],
        flow: [{ agent: 'handler', input: {} }],
      } as EnsembleConfig,
      source: 'yaml' as const,
    })

    const ensembles = new Map([
      ['users-list', createEntry('users-list', '/api/users', ['GET'])],
      ['users-create', createEntry('users-create', '/api/users', ['POST'])],
      ['users-get', createEntry('users-get', '/api/users/{id}', ['GET'])],
    ])

    const registry = createEnsembleRegistry(ensembles)

    // Generate OpenAPI-style paths object
    const paths: Record<string, Record<string, { operationId: string }>> = {}

    for (const ensemble of registry.list()) {
      for (const trigger of ensemble.triggers) {
        if (trigger.type === 'http' && trigger.path) {
          if (!paths[trigger.path]) {
            paths[trigger.path] = {}
          }
          for (const method of trigger.methods || ['GET']) {
            paths[trigger.path][method.toLowerCase()] = {
              operationId: ensemble.name,
            }
          }
        }
      }
    }

    expect(Object.keys(paths)).toHaveLength(2) // /api/users and /api/users/{id}
    expect(paths['/api/users']['get']).toEqual({ operationId: 'users-list' })
    expect(paths['/api/users']['post']).toEqual({ operationId: 'users-create' })
    expect(paths['/api/users/{id}']['get']).toEqual({ operationId: 'users-get' })
  })
})
