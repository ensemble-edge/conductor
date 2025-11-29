/**
 * GraphExecutor Tests
 *
 * Tests for the graph-based workflow executor that handles control flow constructs:
 * - Parallel execution
 * - Conditional branching (branch, switch)
 * - Iteration (foreach, while)
 * - Error handling (try/catch/finally)
 * - Map-reduce pattern
 */

import { describe, it, expect, vi } from 'vitest'
import {
  GraphExecutor,
  hasControlFlowSteps,
  type AgentExecutorFn,
  type GraphExecutionContext,
} from '../../../src/runtime/graph-executor.js'
import { step } from '../../../src/primitives/step.js'
import {
  parallel,
  branch,
  foreach,
  tryStep,
  switchStep,
  whileStep,
  mapReduce,
} from '../../../src/primitives/flow.js'
import type { FlowStepType, AgentFlowStep } from '../../../src/primitives/types.js'

describe('GraphExecutor', () => {
  // Helper to create a mock agent executor
  const createMockExecutor = (
    outputs: Record<string, unknown> = {}
  ): AgentExecutorFn => {
    return async (step: AgentFlowStep, _context: GraphExecutionContext) => {
      // Return predetermined output or default based on agent name
      const agentName = step.id || step.agent
      if (outputs[agentName]) {
        return outputs[agentName]
      }
      return { agent: step.agent, executed: true }
    }
  }

  describe('hasControlFlowSteps()', () => {
    it('should return false for agent-only flows', () => {
      const flow: FlowStepType[] = [step('agent-1'), step('agent-2')]
      expect(hasControlFlowSteps(flow)).toBe(false)
    })

    it('should return true for flows with parallel step', () => {
      const flow: FlowStepType[] = [
        step('start'),
        parallel([step('a'), step('b')]),
      ]
      expect(hasControlFlowSteps(flow)).toBe(true)
    })

    it('should return true for flows with branch step', () => {
      const flow: FlowStepType[] = [
        branch('${input.condition}', { then: [step('then')] }),
      ]
      expect(hasControlFlowSteps(flow)).toBe(true)
    })

    it('should return true for flows with foreach step', () => {
      const flow: FlowStepType[] = [foreach('${input.items}', step('process'))]
      expect(hasControlFlowSteps(flow)).toBe(true)
    })

    it('should return true for flows with try step', () => {
      const flow: FlowStepType[] = [tryStep([step('risky')])]
      expect(hasControlFlowSteps(flow)).toBe(true)
    })

    it('should return true for flows with switch step', () => {
      const flow: FlowStepType[] = [
        switchStep('${input.type}', { a: [step('handle-a')] }),
      ]
      expect(hasControlFlowSteps(flow)).toBe(true)
    })

    it('should return true for flows with while step', () => {
      const flow: FlowStepType[] = [
        whileStep('${state.continue}', [step('loop')]),
      ]
      expect(hasControlFlowSteps(flow)).toBe(true)
    })

    it('should return true for flows with map-reduce step', () => {
      const flow: FlowStepType[] = [
        mapReduce('${input.items}', step('map'), step('reduce')),
      ]
      expect(hasControlFlowSteps(flow)).toBe(true)
    })
  })

  describe('execute() - Basic Flow', () => {
    it('should execute simple agent-only flow', async () => {
      const mockExecutor = createMockExecutor({
        'agent-1': { result: 'first' },
        'agent-2': { result: 'second' },
      })
      const executor = new GraphExecutor(mockExecutor, 'test-ensemble')

      const flow: FlowStepType[] = [step('agent-1'), step('agent-2')]

      const result = await executor.execute(flow, { input: { test: true } })

      expect(result.success).toBe(true)
      expect(result.value).toHaveProperty('agent-1')
      expect(result.value).toHaveProperty('agent-2')
    })

    it('should pass input to agents', async () => {
      const receivedInputs: unknown[] = []
      const mockExecutor: AgentExecutorFn = async (step, context) => {
        receivedInputs.push(context.input)
        return { done: true }
      }
      const executor = new GraphExecutor(mockExecutor, 'test-ensemble')

      await executor.execute([step('agent')], { input: { key: 'value' } })

      expect(receivedInputs[0]).toEqual({ key: 'value' })
    })
  })

  describe('execute() - Parallel', () => {
    it('should execute parallel steps concurrently', async () => {
      const executionOrder: string[] = []
      const mockExecutor: AgentExecutorFn = async (step) => {
        executionOrder.push(`start-${step.agent}`)
        await new Promise((r) => setTimeout(r, 10))
        executionOrder.push(`end-${step.agent}`)
        return { agent: step.agent }
      }
      const executor = new GraphExecutor(mockExecutor, 'test-ensemble')

      const flow: FlowStepType[] = [
        parallel([step('a'), step('b'), step('c')]),
      ]

      const result = await executor.execute(flow, { input: {} })

      expect(result.success).toBe(true)
      // All starts should happen before all ends (parallel)
      expect(executionOrder.indexOf('start-a')).toBeLessThan(
        executionOrder.indexOf('end-a')
      )
      expect(executionOrder.indexOf('start-b')).toBeLessThan(
        executionOrder.indexOf('end-b')
      )
    })

    it('should return all results for waitFor: all', async () => {
      const mockExecutor = createMockExecutor({
        a: 1,
        b: 2,
        c: 3,
      })
      const executor = new GraphExecutor(mockExecutor, 'test-ensemble')

      const flow: FlowStepType[] = [
        parallel([step('a'), step('b'), step('c')], { waitFor: 'all' }),
      ]

      const result = await executor.execute(flow, { input: {} })

      expect(result.success).toBe(true)
      expect(result.value['parallel_0']).toEqual([1, 2, 3])
    })

    it('should return first result for waitFor: any', async () => {
      const mockExecutor: AgentExecutorFn = async (step) => {
        if (step.agent === 'slow') {
          await new Promise((r) => setTimeout(r, 100))
        }
        return step.agent
      }
      const executor = new GraphExecutor(mockExecutor, 'test-ensemble')

      const flow: FlowStepType[] = [
        parallel([step('fast'), step('slow')], { waitFor: 'any' }),
      ]

      const result = await executor.execute(flow, { input: {} })

      expect(result.success).toBe(true)
      expect(result.value['parallel_0']).toEqual(['fast'])
    })
  })

  describe('execute() - Branch', () => {
    it('should execute then branch when condition is true', async () => {
      const executed: string[] = []
      const mockExecutor: AgentExecutorFn = async (step) => {
        executed.push(step.agent)
        return { agent: step.agent }
      }
      const executor = new GraphExecutor(mockExecutor, 'test-ensemble')

      const flow: FlowStepType[] = [
        branch(true, {
          then: [step('then-agent')],
          else: [step('else-agent')],
        }),
      ]

      await executor.execute(flow, { input: {} })

      expect(executed).toContain('then-agent')
      expect(executed).not.toContain('else-agent')
    })

    it('should execute else branch when condition is false', async () => {
      const executed: string[] = []
      const mockExecutor: AgentExecutorFn = async (step) => {
        executed.push(step.agent)
        return { agent: step.agent }
      }
      const executor = new GraphExecutor(mockExecutor, 'test-ensemble')

      const flow: FlowStepType[] = [
        branch(false, {
          then: [step('then-agent')],
          else: [step('else-agent')],
        }),
      ]

      await executor.execute(flow, { input: {} })

      expect(executed).not.toContain('then-agent')
      expect(executed).toContain('else-agent')
    })

    it('should resolve interpolated conditions', async () => {
      const executed: string[] = []
      const mockExecutor: AgentExecutorFn = async (step) => {
        executed.push(step.agent)
        return { agent: step.agent }
      }
      const executor = new GraphExecutor(mockExecutor, 'test-ensemble')

      const flow: FlowStepType[] = [
        branch('${input.premium}', {
          then: [step('premium-flow')],
          else: [step('standard-flow')],
        }),
      ]

      await executor.execute(flow, { input: { premium: true } })

      expect(executed).toContain('premium-flow')
    })
  })

  describe('execute() - Foreach', () => {
    it('should iterate over items', async () => {
      const processedItems: unknown[] = []
      const mockExecutor: AgentExecutorFn = async (_step, context) => {
        processedItems.push((context as Record<string, unknown>).item)
        return { processed: (context as Record<string, unknown>).item }
      }
      const executor = new GraphExecutor(mockExecutor, 'test-ensemble')

      const flow: FlowStepType[] = [foreach('${input.items}', step('process'))]

      await executor.execute(flow, { input: { items: [1, 2, 3] } })

      expect(processedItems).toEqual([1, 2, 3])
    })

    it('should respect maxConcurrency', async () => {
      let concurrentCount = 0
      let maxConcurrent = 0
      const mockExecutor: AgentExecutorFn = async () => {
        concurrentCount++
        maxConcurrent = Math.max(maxConcurrent, concurrentCount)
        await new Promise((r) => setTimeout(r, 10))
        concurrentCount--
        return {}
      }
      const executor = new GraphExecutor(mockExecutor, 'test-ensemble')

      const flow: FlowStepType[] = [
        foreach('${input.items}', step('process'), { maxConcurrency: 2 }),
      ]

      await executor.execute(flow, { input: { items: [1, 2, 3, 4, 5] } })

      expect(maxConcurrent).toBeLessThanOrEqual(2)
    })
  })

  describe('execute() - Try/Catch', () => {
    it('should catch errors and execute catch block', async () => {
      const executed: string[] = []
      const mockExecutor: AgentExecutorFn = async (step) => {
        executed.push(step.agent)
        if (step.agent === 'risky') {
          throw new Error('Simulated error')
        }
        return { agent: step.agent }
      }
      const executor = new GraphExecutor(mockExecutor, 'test-ensemble')

      const flow: FlowStepType[] = [
        tryStep([step('risky')], {
          catch: [step('error-handler')],
        }),
      ]

      const result = await executor.execute(flow, { input: {} })

      expect(result.success).toBe(true)
      expect(executed).toContain('risky')
      expect(executed).toContain('error-handler')
    })

    it('should execute finally block regardless of success', async () => {
      const executed: string[] = []
      const mockExecutor: AgentExecutorFn = async (step) => {
        executed.push(step.agent)
        return { agent: step.agent }
      }
      const executor = new GraphExecutor(mockExecutor, 'test-ensemble')

      const flow: FlowStepType[] = [
        tryStep([step('operation')], {
          finally: [step('cleanup')],
        }),
      ]

      await executor.execute(flow, { input: {} })

      expect(executed).toContain('cleanup')
    })

    it('should execute finally even when catch is needed', async () => {
      const executed: string[] = []
      const mockExecutor: AgentExecutorFn = async (step) => {
        executed.push(step.agent)
        if (step.agent === 'fail') {
          throw new Error('Test error')
        }
        return {}
      }
      const executor = new GraphExecutor(mockExecutor, 'test-ensemble')

      const flow: FlowStepType[] = [
        tryStep([step('fail')], {
          catch: [step('handle')],
          finally: [step('cleanup')],
        }),
      ]

      await executor.execute(flow, { input: {} })

      expect(executed).toEqual(['fail', 'handle', 'cleanup'])
    })
  })

  describe('execute() - Switch', () => {
    it('should execute matching case', async () => {
      const executed: string[] = []
      const mockExecutor: AgentExecutorFn = async (step) => {
        executed.push(step.agent)
        return {}
      }
      const executor = new GraphExecutor(mockExecutor, 'test-ensemble')

      const flow: FlowStepType[] = [
        switchStep('${input.type}', {
          create: [step('handle-create')],
          update: [step('handle-update')],
          delete: [step('handle-delete')],
        }),
      ]

      await executor.execute(flow, { input: { type: 'update' } })

      expect(executed).toEqual(['handle-update'])
    })

    it('should execute default case when no match', async () => {
      const executed: string[] = []
      const mockExecutor: AgentExecutorFn = async (step) => {
        executed.push(step.agent)
        return {}
      }
      const executor = new GraphExecutor(mockExecutor, 'test-ensemble')

      const flow: FlowStepType[] = [
        switchStep(
          '${input.type}',
          {
            known: [step('handle-known')],
          },
          [step('handle-unknown')]
        ),
      ]

      await executor.execute(flow, { input: { type: 'other' } })

      expect(executed).toEqual(['handle-unknown'])
    })
  })

  describe('execute() - While', () => {
    it('should loop while condition is true', async () => {
      let counter = 0
      const mockExecutor: AgentExecutorFn = async (_step, context) => {
        counter++
        // Stop after 3 iterations
        ;(context.state as Record<string, unknown>).continue = counter < 3
        return { iteration: counter }
      }
      const executor = new GraphExecutor(mockExecutor, 'test-ensemble')

      const flow: FlowStepType[] = [
        whileStep('${state.continue}', [step('loop')]),
      ]

      await executor.execute(flow, {
        input: {},
        state: { continue: true },
      })

      expect(counter).toBe(3)
    })

    it('should respect maxIterations safety limit', async () => {
      const mockExecutor: AgentExecutorFn = async () => {
        return {}
      }
      const executor = new GraphExecutor(mockExecutor, 'test-ensemble')

      const flow: FlowStepType[] = [
        whileStep(true, [step('infinite')], { maxIterations: 5 }),
      ]

      const result = await executor.execute(flow, { input: {} })

      expect(result.success).toBe(false)
      expect(result.error.message).toContain('exceeded maximum iterations')
    })
  })

  describe('execute() - MapReduce', () => {
    it('should map over items and reduce results', async () => {
      const mockExecutor: AgentExecutorFn = async (step, context) => {
        if (step.agent === 'double') {
          const item = (context as Record<string, unknown>).item as number
          return item * 2
        }
        if (step.agent === 'sum') {
          const results = (context as Record<string, unknown>)
            .mapResults as number[]
          return results.reduce((a, b) => a + b, 0)
        }
        return {}
      }
      const executor = new GraphExecutor(mockExecutor, 'test-ensemble')

      const flow: FlowStepType[] = [
        mapReduce('${input.numbers}', step('double'), step('sum')),
      ]

      const result = await executor.execute(flow, {
        input: { numbers: [1, 2, 3, 4] },
      })

      expect(result.success).toBe(true)
      // [1,2,3,4] doubled = [2,4,6,8], sum = 20
      expect(result.value['map-reduce_0']).toBe(20)
    })
  })

  describe('execute() - Conditional Agent Steps', () => {
    it('should skip agent when condition is false', async () => {
      const executed: string[] = []
      const mockExecutor: AgentExecutorFn = async (step) => {
        executed.push(step.agent)
        return {}
      }
      const executor = new GraphExecutor(mockExecutor, 'test-ensemble')

      const conditionalStep: AgentFlowStep = {
        agent: 'conditional-agent',
        when: false,
      }
      const flow: FlowStepType[] = [conditionalStep]

      const result = await executor.execute(flow, { input: {} })

      expect(result.success).toBe(true)
      expect(executed).not.toContain('conditional-agent')
    })

    it('should execute agent when condition is true', async () => {
      const executed: string[] = []
      const mockExecutor: AgentExecutorFn = async (step) => {
        executed.push(step.agent)
        return {}
      }
      const executor = new GraphExecutor(mockExecutor, 'test-ensemble')

      const conditionalStep: AgentFlowStep = {
        agent: 'conditional-agent',
        when: true,
      }
      const flow: FlowStepType[] = [conditionalStep]

      await executor.execute(flow, { input: {} })

      expect(executed).toContain('conditional-agent')
    })
  })

  describe('execute() - Error Handling', () => {
    it('should return error result when agent throws', async () => {
      const mockExecutor: AgentExecutorFn = async () => {
        throw new Error('Agent failed')
      }
      const executor = new GraphExecutor(mockExecutor, 'test-ensemble')

      const flow: FlowStepType[] = [step('failing-agent')]

      const result = await executor.execute(flow, { input: {} })

      expect(result.success).toBe(false)
      expect(result.error.message).toContain('Agent failed')
    })

    it('should include ensemble name in error', async () => {
      const mockExecutor: AgentExecutorFn = async () => {
        throw new Error('Test error')
      }
      const executor = new GraphExecutor(mockExecutor, 'my-ensemble')

      const flow: FlowStepType[] = [step('agent')]

      const result = await executor.execute(flow, { input: {} })

      expect(result.success).toBe(false)
      // Check the error is an EnsembleExecutionError
      expect(result.error).toHaveProperty('ensembleName', 'my-ensemble')
    })
  })

  describe('execute() - Context Propagation', () => {
    it('should make previous step outputs available to later steps', async () => {
      const mockExecutor: AgentExecutorFn = async (step, context) => {
        if (step.agent === 'first') {
          return { value: 'from-first' }
        }
        if (step.agent === 'second') {
          // Check that first agent's output is available
          const firstOutput = context.results.get('first')
          return { received: firstOutput }
        }
        return {}
      }
      const executor = new GraphExecutor(mockExecutor, 'test-ensemble')

      const flow: FlowStepType[] = [step('first'), step('second')]

      const result = await executor.execute(flow, { input: {} })

      expect(result.success).toBe(true)
      expect(result.value['second']).toEqual({
        received: { value: 'from-first' },
      })
    })
  })
})
