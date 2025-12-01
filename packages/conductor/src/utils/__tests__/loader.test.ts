import { describe, it, expect, beforeEach } from 'vitest'
import { AgentLoader } from '../loader'
import { BaseAgent } from '../../agents/base-agent'

// Mock environment and context
const mockEnv = {} as Env
const mockCtx = {} as ExecutionContext

describe('AgentLoader', () => {
  let loader: AgentLoader

  beforeEach(() => {
    loader = new AgentLoader({
      env: mockEnv,
      ctx: mockCtx,
    })
  })

  describe('autoDiscover', () => {
    it('should discover and register agents from virtual module', async () => {
      const discoveredAgents = [
        {
          name: 'hello-think',
          config: `name: hello-think
operation: think
description: A simple greeting agent
prompt: Say hello to {{name}}`,
        },
      ]

      await loader.autoDiscover(discoveredAgents)

      expect(loader.hasAgent('hello-think')).toBe(true)
      expect(loader.getAgentNames()).toContain('hello-think')
    })

    it('should handle agents with handlers', async () => {
      const mockHandler = async () => ({ output: 'Hello' })

      const discoveredAgents = [
        {
          name: 'hello-code',
          config: `name: hello-code
operation: code
description: A code agent`,
          handler: async () => mockHandler,
        },
      ]

      await loader.autoDiscover(discoveredAgents)

      expect(loader.hasAgent('hello-code')).toBe(true)
      const agent = loader.getAgent('hello-code')
      expect(agent).toBeInstanceOf(BaseAgent)
    })

    it('should handle multiple agents', async () => {
      const discoveredAgents = [
        {
          name: 'agent1',
          config: `name: agent1
operation: think
prompt: Agent 1`,
        },
        {
          name: 'agent2',
          config: `name: agent2
operation: think
prompt: Agent 2`,
        },
        {
          name: 'agent3',
          config: `name: agent3
operation: think
prompt: Agent 3`,
        },
      ]

      await loader.autoDiscover(discoveredAgents)

      expect(loader.getAgentNames()).toHaveLength(3)
      expect(loader.getAgentNames()).toEqual(
        expect.arrayContaining(['agent1', 'agent2', 'agent3'])
      )
    })

    it('should continue on error for individual agents', async () => {
      const discoveredAgents = [
        {
          name: 'valid-agent',
          config: `name: valid-agent
operation: think
prompt: Valid`,
        },
        {
          name: 'invalid-agent',
          config: 'invalid yaml: [[[', // Malformed YAML
        },
        {
          name: 'another-valid',
          config: `name: another-valid
operation: think
prompt: Another valid`,
        },
      ]

      await loader.autoDiscover(discoveredAgents)

      // Should register valid agents despite one failing
      expect(loader.hasAgent('valid-agent')).toBe(true)
      expect(loader.hasAgent('another-valid')).toBe(true)
      expect(loader.hasAgent('invalid-agent')).toBe(false)
    })

    it('should handle empty discovered agents array', async () => {
      await loader.autoDiscover([])
      expect(loader.getAgentNames()).toHaveLength(0)
    })

    it('should handle agents with default export handlers', async () => {
      const defaultHandler = async () => ({ output: 'Default' })

      const discoveredAgents = [
        {
          name: 'with-default',
          config: `name: with-default
operation: code`,
          handler: async () => ({ default: defaultHandler }),
        },
      ]

      await loader.autoDiscover(discoveredAgents)
      expect(loader.hasAgent('with-default')).toBe(true)
    })

    it('should handle agents with named export handlers', async () => {
      const namedHandler = async () => ({ output: 'Named' })

      const discoveredAgents = [
        {
          name: 'with-named',
          config: `name: with-named
operation: code`,
          handler: async () => namedHandler,
        },
      ]

      await loader.autoDiscover(discoveredAgents)
      expect(loader.hasAgent('with-named')).toBe(true)
    })
  })

  describe('registerAgent', () => {
    it('should register agent from YAML string', () => {
      const yaml = `name: test-agent
operation: think
prompt: Test prompt`

      const agent = loader.registerAgent(yaml)
      expect(agent).toBeInstanceOf(BaseAgent)
      expect(loader.hasAgent('test-agent')).toBe(true)
    })

    it('should register agent from config object', () => {
      const config = {
        name: 'test-agent',
        operation: 'think' as const,
        description: 'Test',
        prompt: 'Test prompt',
      }

      const agent = loader.registerAgent(config)
      expect(agent).toBeInstanceOf(BaseAgent)
      expect(loader.hasAgent('test-agent')).toBe(true)
    })
  })

  describe('getAgent', () => {
    it('should return undefined for non-existent agent', () => {
      expect(loader.getAgent('nonexistent')).toBeUndefined()
    })

    it('should return agent instance for registered agent', () => {
      const yaml = `name: test-agent
operation: think
prompt: Test`

      loader.registerAgent(yaml)
      const agent = loader.getAgent('test-agent')
      expect(agent).toBeInstanceOf(BaseAgent)
    })
  })

  describe('getAllAgents', () => {
    it('should return empty array initially', () => {
      expect(loader.getAllAgents()).toHaveLength(0)
    })

    it('should return all registered agents', () => {
      loader.registerAgent(`name: agent1\noperation: think\nprompt: Test1`)
      loader.registerAgent(`name: agent2\noperation: think\nprompt: Test2`)

      const agents = loader.getAllAgents()
      expect(agents).toHaveLength(2)
      expect(agents.every((a) => a instanceof BaseAgent)).toBe(true)
    })
  })

  describe('clear', () => {
    it('should clear all registered agents', () => {
      loader.registerAgent(`name: agent1\noperation: think\nprompt: Test`)
      expect(loader.getAgentNames()).toHaveLength(1)

      loader.clear()
      expect(loader.getAgentNames()).toHaveLength(0)
    })
  })
})
