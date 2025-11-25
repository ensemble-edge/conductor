/**
 * Inline Agents Integration Tests
 *
 * Tests for inline agent definitions in ensemble YAML files.
 * These tests verify that agents defined directly in ensemble YAML with
 * operation: code and inline code strings work correctly.
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { Executor, type ExecutorConfig } from '../../src/runtime/executor'
import type { EnsembleConfig } from '../../src/runtime/parser'

// Mock Cloudflare environment
const mockEnv = {
  ENVIRONMENT: 'test',
} as any

// Mock execution context
const mockCtx = {
  waitUntil: () => {},
  passThroughOnException: () => {},
} as any

describe('Inline Agents in Ensemble YAML', () => {
  let executor: Executor

  beforeEach(() => {
    const config: ExecutorConfig = {
      env: mockEnv,
      ctx: mockCtx,
    }
    executor = new Executor(config)
  })

  describe('Basic Inline Code Agents', () => {
    it('should execute inline agent with export default async function', async () => {
      const ensemble: EnsembleConfig = {
        name: 'inline-export-default',
        agents: [
          {
            name: 'greeter',
            operation: 'code',
            config: {
              code: `
                export default async function greeter(input) {
                  return { greeting: 'Hello, ' + input.name + '!' };
                }
              `,
            },
          },
        ],
        flow: [{ agent: 'greeter' }],
      }

      const result = await executor.executeEnsemble(ensemble, { name: 'World' })

      expect(result.success).toBe(true)
      expect(result.value?.output).toEqual({ greeting: 'Hello, World!' })
    })

    it('should execute inline agent with export default function (non-async)', async () => {
      const ensemble: EnsembleConfig = {
        name: 'inline-sync-function',
        agents: [
          {
            name: 'calculator',
            operation: 'code',
            config: {
              code: `
                export default function calculator(input) {
                  return { result: input.a + input.b };
                }
              `,
            },
          },
        ],
        flow: [{ agent: 'calculator' }],
      }

      const result = await executor.executeEnsemble(ensemble, { a: 10, b: 5 })

      expect(result.success).toBe(true)
      expect(result.value?.output).toEqual({ result: 15 })
    })

    it('should execute inline agent with async function (named)', async () => {
      const ensemble: EnsembleConfig = {
        name: 'inline-named-async',
        agents: [
          {
            name: 'processor',
            operation: 'code',
            config: {
              code: `
                async function processData(input) {
                  return { processed: input.data.toUpperCase() };
                }
              `,
            },
          },
        ],
        flow: [{ agent: 'processor' }],
      }

      const result = await executor.executeEnsemble(ensemble, { data: 'hello' })

      expect(result.success).toBe(true)
      expect(result.value?.output).toEqual({ processed: 'HELLO' })
    })

    it('should execute inline agent with function (named, non-async)', async () => {
      const ensemble: EnsembleConfig = {
        name: 'inline-named-sync',
        agents: [
          {
            name: 'doubler',
            operation: 'code',
            config: {
              code: `
                function double(input) {
                  return { doubled: input.value * 2 };
                }
              `,
            },
          },
        ],
        flow: [{ agent: 'doubler' }],
      }

      const result = await executor.executeEnsemble(ensemble, { value: 21 })

      expect(result.success).toBe(true)
      expect(result.value?.output).toEqual({ doubled: 42 })
    })
  })

  describe('Inline Agents with Context Access', () => {
    it('should provide context.env to inline agent', async () => {
      const envWithConfig = {
        ...mockEnv,
        CUSTOM_VALUE: 'secret-123',
      }

      const executorWithEnv = new Executor({
        env: envWithConfig,
        ctx: mockCtx,
      })

      const ensemble: EnsembleConfig = {
        name: 'inline-with-env',
        agents: [
          {
            name: 'env-reader',
            operation: 'code',
            config: {
              code: `
                export default async function envReader(input, context) {
                  return {
                    hasEnv: !!context.env,
                    customValue: context.env?.CUSTOM_VALUE || 'not-found'
                  };
                }
              `,
            },
          },
        ],
        flow: [{ agent: 'env-reader' }],
      }

      const result = await executorWithEnv.executeEnsemble(ensemble, {})

      expect(result.success).toBe(true)
      expect(result.value?.output).toMatchObject({
        hasEnv: true,
        customValue: 'secret-123',
      })
    })
  })

  describe('Multiple Inline Agents in Flow', () => {
    it('should execute multiple inline agents in sequence', async () => {
      const ensemble: EnsembleConfig = {
        name: 'multi-inline-sequence',
        agents: [
          {
            name: 'step1',
            operation: 'code',
            config: {
              code: `
                export default async function step1(input) {
                  return { value: input.initial + 10 };
                }
              `,
            },
          },
          {
            name: 'step2',
            operation: 'code',
            config: {
              code: `
                export default async function step2(input) {
                  return { value: input.value * 2 };
                }
              `,
            },
          },
          {
            name: 'step3',
            operation: 'code',
            config: {
              code: `
                export default async function step3(input) {
                  return { final: input.value - 5 };
                }
              `,
            },
          },
        ],
        flow: [{ agent: 'step1' }, { agent: 'step2' }, { agent: 'step3' }],
      }

      // (5 + 10) * 2 - 5 = 25
      const result = await executor.executeEnsemble(ensemble, { initial: 5 })

      expect(result.success).toBe(true)
      expect(result.value?.output).toEqual({ final: 25 })
    })

    it('should handle mix of inline and registered agents', async () => {
      // Register a traditional agent
      const { FunctionAgent } = await import('../../src/agents/function-agent')
      const registeredAgent = new FunctionAgent(
        {
          name: 'registered-multiplier',
          operation: 'code',
          config: {},
        },
        async (context) => ({ multiplied: (context.input as any).value * 3 })
      )
      executor.registerAgent(registeredAgent)

      const ensemble: EnsembleConfig = {
        name: 'mixed-agents',
        agents: [
          {
            name: 'inline-adder',
            operation: 'code',
            config: {
              code: `
                export default async function adder(input) {
                  return { value: input.start + 7 };
                }
              `,
            },
          },
        ],
        flow: [
          { agent: 'inline-adder' },
          { agent: 'registered-multiplier' },
        ],
      }

      // (10 + 7) * 3 = 51
      const result = await executor.executeEnsemble(ensemble, { start: 10 })

      expect(result.success).toBe(true)
      expect(result.value?.output).toEqual({ multiplied: 51 })
    })
  })

  describe('Inline Agent Error Handling', () => {
    it('should handle inline agent throwing error', async () => {
      const ensemble: EnsembleConfig = {
        name: 'inline-error',
        agents: [
          {
            name: 'thrower',
            operation: 'code',
            config: {
              code: `
                export default async function thrower() {
                  throw new Error('Intentional inline error');
                }
              `,
            },
          },
        ],
        flow: [{ agent: 'thrower' }],
      }

      const result = await executor.executeEnsemble(ensemble, {})

      expect(result.success).toBe(false)
      expect(result.error?.message).toContain('Intentional inline error')
    })

    it('should handle syntax error in inline code gracefully', async () => {
      const ensemble: EnsembleConfig = {
        name: 'inline-syntax-error',
        agents: [
          {
            name: 'bad-syntax',
            operation: 'code',
            config: {
              code: `
                export default async function badSyntax(input) {
                  return { broken  // Missing closing brace
              `,
            },
          },
        ],
        flow: [{ agent: 'bad-syntax' }],
      }

      const result = await executor.executeEnsemble(ensemble, {})

      expect(result.success).toBe(false)
      expect(result.error).toBeDefined()
    })

    it('should skip agents without name or operation', async () => {
      const ensemble: EnsembleConfig = {
        name: 'invalid-inline-agent',
        agents: [
          {
            // Missing name
            operation: 'code',
            config: { code: 'export default () => ({})' },
          } as any,
          {
            name: 'valid-agent',
            operation: 'code',
            config: {
              code: `export default async function valid() { return { valid: true }; }`,
            },
          },
        ],
        flow: [{ agent: 'valid-agent' }],
      }

      const result = await executor.executeEnsemble(ensemble, {})

      expect(result.success).toBe(true)
      expect(result.value?.output).toEqual({ valid: true })
    })
  })

  describe('Inline Agent with config.function (Alternative Syntax)', () => {
    it('should support config.function instead of config.code', async () => {
      const ensemble: EnsembleConfig = {
        name: 'inline-function-syntax',
        agents: [
          {
            name: 'func-agent',
            operation: 'code',
            config: {
              function: `
                async function processInput(input) {
                  return { functionSyntax: true, received: input.test };
                }
              `,
            },
          },
        ],
        flow: [{ agent: 'func-agent' }],
      }

      const result = await executor.executeEnsemble(ensemble, { test: 'value' })

      expect(result.success).toBe(true)
      expect(result.value?.output).toEqual({ functionSyntax: true, received: 'value' })
    })
  })

  describe('Real-world YAML-like Patterns', () => {
    it('should handle login authentication pattern from template', async () => {
      const ensemble: EnsembleConfig = {
        name: 'login',
        agents: [
          {
            name: 'authenticate',
            operation: 'code',
            config: {
              code: `
                export default async function authenticate(input, context) {
                  const { email, password } = input;

                  // Validate input
                  if (!email || !password) {
                    return {
                      success: false,
                      error: 'Email and password are required',
                    };
                  }

                  // Demo: Simple check
                  if (email === 'demo@example.com' && password === 'demo123') {
                    return {
                      success: true,
                      token: 'demo-token-' + Date.now(),
                      redirectTo: '/dashboard',
                    };
                  }

                  return {
                    success: false,
                    error: 'Invalid email or password',
                  };
                }
              `,
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
      expect(successResult.value?.output).toMatchObject({
        success: true,
        redirectTo: '/dashboard',
      })
      expect((successResult.value?.output as any).token).toMatch(/^demo-token-/)

      // Test failed login
      const failResult = await executor.executeEnsemble(ensemble, {
        email: 'wrong@example.com',
        password: 'wrongpass',
      })

      expect(failResult.success).toBe(true) // Execution succeeded, but auth failed
      expect(failResult.value?.output).toMatchObject({
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
              code: `
                export default async function transform(input) {
                  const { items } = input;
                  return {
                    count: items.length,
                    processed: items.map(item => ({
                      ...item,
                      processedAt: new Date().toISOString().split('T')[0],
                    })),
                    summary: items.map(i => i.name).join(', '),
                  };
                }
              `,
            },
          },
        ],
        flow: [{ agent: 'transform' }],
      }

      const result = await executor.executeEnsemble(ensemble, {
        items: [{ name: 'Item A', id: 1 }, { name: 'Item B', id: 2 }],
      })

      expect(result.success).toBe(true)
      const output = result.value?.output as any
      expect(output.count).toBe(2)
      expect(output.summary).toBe('Item A, Item B')
      expect(output.processed).toHaveLength(2)
      expect(output.processed[0]).toHaveProperty('processedAt')
    })
  })
})
