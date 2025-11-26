/**
 * Tests for the 'agent' operation
 *
 * Verifies that the agent operation can invoke registered agents
 * from pages, ensembles, and other contexts.
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { PluginRegistry } from '../plugin-registry.js'
import type { OperationContext } from '../plugin-registry.js'
import { ThinkAgent } from '../../agents/think-agent.js'
import { FunctionAgent } from '../../agents/function-agent.js'
import type { AgentConfig } from '../parser.js'
import { Operation } from '../../types/constants.js'

describe('Agent Operation', () => {
  let registry: PluginRegistry
  let mockAgentRegistry: Map<string, any>
  let mockContext: OperationContext

  beforeEach(() => {
    // Create fresh registry for each test
    registry = PluginRegistry.getInstance()
    registry.reset()

    // Create mock agent registry
    mockAgentRegistry = new Map()

    // Create mock context
    mockContext = {
      env: {} as any,
      ctx: {} as any,
      contextType: 'ensemble',
      agentRegistry: mockAgentRegistry,
    }
  })

  it('should be registered as a built-in operation', () => {
    expect(registry.has('agent')).toBe(true)
  })

  it('should have correct metadata', () => {
    const metadata = registry.getMetadata('agent')
    expect(metadata).toBeDefined()
    expect(metadata?.name).toBe('agent')
    expect(metadata?.description).toContain('Conductor agent')
    expect(metadata?.contexts).toContain('all')
    expect(metadata?.tags).toContain('agent')
  })

  it('should throw error if agent name is missing', async () => {
    const operation = {
      operation: 'agent',
      config: {
        // Missing agent name!
        input: { test: 'data' },
      },
    }

    await expect(registry.execute(operation, mockContext)).rejects.toThrow(
      'Missing required config: agent'
    )
  })

  it('should throw error if agent registry is not available', async () => {
    const contextWithoutRegistry: OperationContext = {
      ...mockContext,
      agentRegistry: undefined,
    }

    const operation = {
      operation: 'agent',
      config: {
        agent: 'test-agent',
        input: {},
      },
    }

    await expect(registry.execute(operation, contextWithoutRegistry)).rejects.toThrow(
      'Agent registry not available'
    )
  })

  it('should throw error if agent is not found', async () => {
    const operation = {
      operation: 'agent',
      config: {
        agent: 'nonexistent-agent',
        input: {},
      },
    }

    await expect(registry.execute(operation, mockContext)).rejects.toThrow(
      'Agent "nonexistent-agent" not found'
    )
  })

  it('should successfully invoke a function agent', async () => {
    // Create a simple function agent
    const agentConfig: AgentConfig = {
      name: 'test-function',
      operation: Operation.code,
    }

    const implementation = async ({ input }: any) => {
      return {
        message: `Hello, ${input.name}!`,
        processedAt: new Date().toISOString(),
      }
    }

    const functionAgent = new FunctionAgent(agentConfig, implementation)
    mockAgentRegistry.set('test-function', functionAgent)

    // Invoke via agent operation
    const operation = {
      operation: 'agent',
      config: {
        agent: 'test-function',
        input: {
          name: 'Alice',
        },
      },
    }

    const result = await registry.execute(operation, mockContext)

    expect(result).toBeDefined()
    expect(result.message).toBe('Hello, Alice!')
    expect(result.processedAt).toBeDefined()
  })

  it('should successfully invoke a think agent', async () => {
    // Create a think agent (mock provider)
    const thinkConfig: AgentConfig = {
      name: 'test-think',
      operation: Operation.think,
      config: {
        model: '@cf/meta/llama-3.1-8b-instruct',
        provider: 'workers-ai',
      },
    }

    // Mock the provider registry to avoid actual AI calls
    const mockProviderRegistry = {
      get: () => ({
        execute: async () => ({
          content: 'Mock AI response',
          model: '@cf/meta/llama-3.1-8b-instruct',
          usage: { tokens: 100 },
        }),
        getConfigError: () => null, // No config errors
      }),
      getProviderIds: () => ['workers-ai'],
    }

    const thinkAgent = new ThinkAgent(thinkConfig, mockProviderRegistry as any)
    mockAgentRegistry.set('test-think', thinkAgent)

    // Invoke via agent operation
    const operation = {
      operation: 'agent',
      config: {
        agent: 'test-think',
        input: {
          prompt: 'Say hello',
        },
      },
    }

    const result = await registry.execute(operation, mockContext)

    expect(result).toBeDefined()
    expect(result.content).toBe('Mock AI response')
    // Model info is now in _meta for cleaner user-facing output
    expect(result._meta.model).toBe('@cf/meta/llama-3.1-8b-instruct')
  })

  it('should pass input correctly to the agent', async () => {
    let receivedInput: any = null

    const agentConfig: AgentConfig = {
      name: 'input-capture',
      operation: Operation.code,
    }

    const implementation = async ({ input }: any) => {
      receivedInput = input
      return { received: true }
    }

    const agent = new FunctionAgent(agentConfig, implementation)
    mockAgentRegistry.set('input-capture', agent)

    const testInput = {
      name: 'Bob',
      age: 30,
      tags: ['developer', 'tester'],
    }

    const operation = {
      operation: 'agent',
      config: {
        agent: 'input-capture',
        input: testInput,
      },
    }

    await registry.execute(operation, mockContext)

    expect(receivedInput).toEqual(testInput)
  })

  it('should handle agent execution errors gracefully', async () => {
    const agentConfig: AgentConfig = {
      name: 'failing-agent',
      operation: Operation.code,
    }

    const implementation = async () => {
      throw new Error('Intentional test failure')
    }

    const agent = new FunctionAgent(agentConfig, implementation)
    mockAgentRegistry.set('failing-agent', agent)

    const operation = {
      operation: 'agent',
      config: {
        agent: 'failing-agent',
        input: {},
      },
    }

    await expect(registry.execute(operation, mockContext)).rejects.toThrow(
      'Failed to execute agent "failing-agent"'
    )
  })

  it('should work in different context types', async () => {
    const agentConfig: AgentConfig = {
      name: 'context-aware',
      operation: Operation.code,
    }

    const implementation = async ({ input }: any) => ({
      echo: input.message,
    })

    const agent = new FunctionAgent(agentConfig, implementation)
    mockAgentRegistry.set('context-aware', agent)

    const operation = {
      operation: 'agent',
      config: {
        agent: 'context-aware',
        input: { message: 'test' },
      },
    }

    // Test in different contexts
    const contexts: Array<'ensemble' | 'form' | 'api' | 'webhook'> = [
      'ensemble',
      'form',
      'api',
      'webhook',
    ]

    for (const contextType of contexts) {
      const testContext: OperationContext = {
        ...mockContext,
        contextType,
      }

      const result = await registry.execute(operation, testContext)
      expect(result.echo).toBe('test')
    }
  })
})
