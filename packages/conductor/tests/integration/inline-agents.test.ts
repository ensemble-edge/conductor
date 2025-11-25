/**
 * Code Agent Integration Tests
 *
 * Tests for code agents in ensemble YAML files.
 * These tests verify that agents defined with operation: code and
 * pre-compiled handlers work correctly.
 *
 * Note: Inline code strings (config.code) are NOT supported in Cloudflare Workers
 * due to security restrictions. Use config.handler (function) or config.script
 * (bundled script reference) instead.
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { Executor, type ExecutorConfig } from '../../src/runtime/executor'
import type { EnsembleConfig } from '../../src/runtime/parser'
import { Operation } from '../../src/types/operation'

// Mock Cloudflare environment
const mockEnv = {
  ENVIRONMENT: 'test',
} as any

// Mock execution context
const mockCtx = {
  waitUntil: () => {},
  passThroughOnException: () => {},
} as any

// Helper to extract result value with type assertion for tests
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const getOutput = (result: any): any => result.value?.output
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const getError = (result: any): any => result.error

describe('Code Agents in Ensemble YAML', () => {
  let executor: Executor

  beforeEach(() => {
    const config: ExecutorConfig = {
      env: mockEnv,
      ctx: mockCtx,
    }
    executor = new Executor(config)
  })

  describe('Basic Code Agents with Handlers', () => {
    it('should execute code agent with async handler', async () => {
      const ensemble: EnsembleConfig = {
        name: 'handler-async',
        agents: [
          {
            name: 'greeter',
            operation: 'code',
            config: {
              handler: async (context: any) => {
                const input = context.input
                return { greeting: 'Hello, ' + input.name + '!' }
              },
            },
          },
        ],
        flow: [{ agent: 'greeter' }],
      }

      const result = await executor.executeEnsemble(ensemble, { name: 'World' })

      expect(result.success).toBe(true)
      expect(getOutput(result)).toEqual({ greeting: 'Hello, World!' })
    })

    it('should execute code agent with sync handler', async () => {
      const ensemble: EnsembleConfig = {
        name: 'handler-sync',
        agents: [
          {
            name: 'calculator',
            operation: 'code',
            config: {
              handler: (context: any) => {
                const input = context.input
                return { result: input.a + input.b }
              },
            },
          },
        ],
        flow: [{ agent: 'calculator' }],
      }

      const result = await executor.executeEnsemble(ensemble, { a: 10, b: 5 })

      expect(result.success).toBe(true)
      expect(getOutput(result)).toEqual({ result: 15 })
    })

    it('should execute code agent with context access', async () => {
      const ensemble: EnsembleConfig = {
        name: 'handler-with-context',
        agents: [
          {
            name: 'processor',
            operation: 'code',
            config: {
              handler: async (context: any) => {
                const input = context.input
                return {
                  processed: input.data.toUpperCase(),
                  hasEnv: !!context.env,
                }
              },
            },
          },
        ],
        flow: [{ agent: 'processor' }],
      }

      const result = await executor.executeEnsemble(ensemble, { data: 'hello' })

      expect(result.success).toBe(true)
      expect(getOutput(result)).toMatchObject({ processed: 'HELLO' })
    })
  })

  describe('Code Agents with Context Access', () => {
    it('should provide context.env to code agent', async () => {
      const envWithConfig = {
        ...mockEnv,
        CUSTOM_VALUE: 'secret-123',
      }

      const executorWithEnv = new Executor({
        env: envWithConfig,
        ctx: mockCtx,
      })

      const ensemble: EnsembleConfig = {
        name: 'handler-with-env',
        agents: [
          {
            name: 'env-reader',
            operation: 'code',
            config: {
              handler: async (context: any) => {
                return {
                  hasEnv: !!context.env,
                  customValue: context.env?.CUSTOM_VALUE || 'not-found',
                }
              },
            },
          },
        ],
        flow: [{ agent: 'env-reader' }],
      }

      const result = await executorWithEnv.executeEnsemble(ensemble, {})

      expect(result.success).toBe(true)
      expect(getOutput(result)).toMatchObject({
        hasEnv: true,
        customValue: 'secret-123',
      })
    })
  })

  describe('Multiple Code Agents in Flow', () => {
    it('should execute multiple code agents in sequence', async () => {
      const ensemble: EnsembleConfig = {
        name: 'multi-handler-sequence',
        agents: [
          {
            name: 'step1',
            operation: 'code',
            config: {
              handler: async (context: any) => {
                const input = context.input
                return { value: input.initial + 10 }
              },
            },
          },
          {
            name: 'step2',
            operation: 'code',
            config: {
              handler: async (context: any) => {
                const input = context.input
                return { value: input.value * 2 }
              },
            },
          },
          {
            name: 'step3',
            operation: 'code',
            config: {
              handler: async (context: any) => {
                const input = context.input
                return { final: input.value - 5 }
              },
            },
          },
        ],
        flow: [{ agent: 'step1' }, { agent: 'step2' }, { agent: 'step3' }],
      }

      // (5 + 10) * 2 - 5 = 25
      const result = await executor.executeEnsemble(ensemble, { initial: 5 })

      expect(result.success).toBe(true)
      expect(getOutput(result)).toEqual({ final: 25 })
    })

    it('should handle mix of inline and registered agents', async () => {
      // Register a traditional agent
      const { FunctionAgent } = await import('../../src/agents/function-agent')
      const registeredAgent = new FunctionAgent(
        {
          name: 'registered-multiplier',
          operation: Operation.code,
          config: {},
        },
        async (context) => ({ multiplied: (context.input as any).value * 3 })
      )
      executor.registerAgent(registeredAgent)

      const ensemble: EnsembleConfig = {
        name: 'mixed-agents',
        agents: [
          {
            name: 'handler-adder',
            operation: 'code',
            config: {
              handler: async (context: any) => {
                const input = context.input
                return { value: input.start + 7 }
              },
            },
          },
        ],
        flow: [{ agent: 'handler-adder' }, { agent: 'registered-multiplier' }],
      }

      // (10 + 7) * 3 = 51
      const result = await executor.executeEnsemble(ensemble, { start: 10 })

      expect(result.success).toBe(true)
      expect(getOutput(result)).toEqual({ multiplied: 51 })
    })
  })

  describe('Code Agent Error Handling', () => {
    it('should handle code agent throwing error', async () => {
      const ensemble: EnsembleConfig = {
        name: 'handler-error',
        agents: [
          {
            name: 'thrower',
            operation: 'code',
            config: {
              handler: async () => {
                throw new Error('Intentional handler error')
              },
            },
          },
        ],
        flow: [{ agent: 'thrower' }],
      }

      const result = await executor.executeEnsemble(ensemble, {})

      expect(result.success).toBe(false)
      expect(getError(result)?.message).toContain('Intentional handler error')
    })

    it('should skip agents without name or operation', async () => {
      const ensemble: EnsembleConfig = {
        name: 'invalid-agent',
        agents: [
          {
            // Missing name
            operation: 'code',
            config: { handler: () => ({}) },
          } as any,
          {
            name: 'valid-agent',
            operation: 'code',
            config: {
              handler: async () => ({ valid: true }),
            },
          },
        ],
        flow: [{ agent: 'valid-agent' }],
      }

      const result = await executor.executeEnsemble(ensemble, {})

      expect(result.success).toBe(true)
      expect(getOutput(result)).toEqual({ valid: true })
    })
  })

  describe('Real-world Patterns', () => {
    it('should handle login authentication pattern', async () => {
      const ensemble: EnsembleConfig = {
        name: 'login',
        agents: [
          {
            name: 'authenticate',
            operation: 'code',
            config: {
              handler: async (context: any) => {
                const { email, password } = context.input

                // Validate input
                if (!email || !password) {
                  return {
                    success: false,
                    error: 'Email and password are required',
                  }
                }

                // Demo: Simple check
                if (email === 'demo@example.com' && password === 'demo123') {
                  return {
                    success: true,
                    token: 'demo-token-' + Date.now(),
                    redirectTo: '/dashboard',
                  }
                }

                return {
                  success: false,
                  error: 'Invalid email or password',
                }
              },
            },
          },
        ],
        flow: [{ agent: 'authenticate' }],
      }

      // Test successful login
      const successResult = await executor.executeEnsemble(ensemble, {
        email: 'demo@example.com',
        password: 'demo123',
      })

      expect(successResult.success).toBe(true)
      expect(getOutput(successResult)).toMatchObject({
        success: true,
        redirectTo: '/dashboard',
      })
      expect(getOutput(successResult).token).toMatch(/^demo-token-/)

      // Test failed login
      const failResult = await executor.executeEnsemble(ensemble, {
        email: 'wrong@example.com',
        password: 'wrongpass',
      })

      expect(failResult.success).toBe(true) // Execution succeeded, but auth failed
      expect(getOutput(failResult)).toMatchObject({
        success: false,
        error: 'Invalid email or password',
      })
    })

    it('should handle data transformation pattern', async () => {
      const ensemble: EnsembleConfig = {
        name: 'data-transform',
        agents: [
          {
            name: 'transform',
            operation: 'code',
            config: {
              handler: async (context: any) => {
                const { items } = context.input
                return {
                  count: items.length,
                  processed: items.map((item: any) => ({
                    ...item,
                    processedAt: new Date().toISOString().split('T')[0],
                  })),
                  summary: items.map((i: any) => i.name).join(', '),
                }
              },
            },
          },
        ],
        flow: [{ agent: 'transform' }],
      }

      const result = await executor.executeEnsemble(ensemble, {
        items: [
          { name: 'Item A', id: 1 },
          { name: 'Item B', id: 2 },
        ],
      })

      expect(result.success).toBe(true)
      const output = getOutput(result) as any
      expect(output.count).toBe(2)
      expect(output.summary).toBe('Item A, Item B')
      expect(output.processed).toHaveLength(2)
      expect(output.processed[0]).toHaveProperty('processedAt')
    })
  })

  describe('Inline Code Rejection (Cloudflare Workers Compatibility)', () => {
    it('should reject inline code strings (config.code)', async () => {
      const ensemble: EnsembleConfig = {
        name: 'inline-code-rejected',
        agents: [
          {
            name: 'should-fail',
            operation: 'code',
            config: {
              code: `
                export default async function() {
                  return { shouldNotWork: true };
                }
              `,
            },
          },
        ],
        flow: [{ agent: 'should-fail' }],
      }

      // The agent with inline code should be skipped/rejected during registration
      // and execution should fail because the agent won't be found
      const result = await executor.executeEnsemble(ensemble, {})

      // Inline code is rejected, so either the execution fails or the agent is skipped
      // The behavior depends on the executor implementation
      expect(result.success).toBe(false)
    })

    it('should reject config.function strings', async () => {
      const ensemble: EnsembleConfig = {
        name: 'function-string-rejected',
        agents: [
          {
            name: 'should-fail',
            operation: 'code',
            config: {
              function: `
                async function processData() {
                  return { shouldNotWork: true };
                }
              `,
            },
          },
        ],
        flow: [{ agent: 'should-fail' }],
      }

      const result = await executor.executeEnsemble(ensemble, {})

      // config.function strings are also rejected
      expect(result.success).toBe(false)
    })
  })
})
