/**
 * Tests for Startup Manager
 *
 * Verifies that startup triggers are executed correctly on Worker cold start.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
  runStartupTriggers,
  resetStartupState,
  hasStartupRun,
} from '../startup-manager.js'
import type { EnsembleConfig } from '../parser.js'
import type { BaseAgent } from '../../agents/base-agent.js'

// Mock the logger
vi.mock('../../observability/index.js', () => ({
  createLogger: () => ({
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
  }),
}))

// Mock the Executor
vi.mock('../executor.js', () => ({
  Executor: vi.fn().mockImplementation(() => ({
    registerAgent: vi.fn(),
    executeEnsemble: vi.fn().mockResolvedValue({
      success: true,
      value: { output: { initialized: true } },
    }),
  })),
}))

describe('Startup Manager', () => {
  const mockEnv = { ENVIRONMENT: 'test' } as any
  const mockCtx = {
    waitUntil: vi.fn(),
    passThroughOnException: vi.fn(),
  } as any
  const mockAgents: BaseAgent[] = []

  beforeEach(() => {
    vi.clearAllMocks()
    resetStartupState()
  })

  describe('hasStartupRun', () => {
    it('should return false before any execution', () => {
      expect(hasStartupRun()).toBe(false)
    })

    it('should return true after execution', async () => {
      const ensembles: EnsembleConfig[] = [
        {
          name: 'test-startup',
          trigger: [{ type: 'startup' as const }],
        },
      ]

      await runStartupTriggers(ensembles, mockAgents, mockEnv, mockCtx)
      expect(hasStartupRun()).toBe(true)
    })
  })

  describe('resetStartupState', () => {
    it('should reset the hasRun flag', async () => {
      const ensembles: EnsembleConfig[] = [
        {
          name: 'test-startup',
          trigger: [{ type: 'startup' as const }],
        },
      ]

      await runStartupTriggers(ensembles, mockAgents, mockEnv, mockCtx)
      expect(hasStartupRun()).toBe(true)

      resetStartupState()
      expect(hasStartupRun()).toBe(false)
    })
  })

  describe('runStartupTriggers', () => {
    it('should return empty array when no ensembles have startup triggers', async () => {
      const ensembles: EnsembleConfig[] = [
        {
          name: 'http-only',
          trigger: [{ type: 'http' as const, public: true }],
        },
        {
          name: 'cron-only',
          trigger: [{ type: 'cron' as const, cron: '0 * * * *' }],
        },
      ]

      const results = await runStartupTriggers(ensembles, mockAgents, mockEnv, mockCtx)
      expect(results).toEqual([])
    })

    it('should only run once per cold start', async () => {
      const ensembles: EnsembleConfig[] = [
        {
          name: 'startup-ensemble',
          trigger: [{ type: 'startup' as const }],
        },
      ]

      // First call should execute
      const firstResults = await runStartupTriggers(ensembles, mockAgents, mockEnv, mockCtx)
      expect(firstResults.length).toBe(1)

      // Second call should return empty (already ran)
      const secondResults = await runStartupTriggers(ensembles, mockAgents, mockEnv, mockCtx)
      expect(secondResults).toEqual([])
    })

    it('should skip disabled startup triggers', async () => {
      const ensembles: EnsembleConfig[] = [
        {
          name: 'disabled-startup',
          trigger: [{ type: 'startup' as const, enabled: false }],
        },
        {
          name: 'enabled-startup',
          trigger: [{ type: 'startup' as const, enabled: true }],
        },
      ]

      const results = await runStartupTriggers(ensembles, mockAgents, mockEnv, mockCtx)

      // Only the enabled one should run
      expect(results.length).toBe(1)
      expect(results[0].ensemble).toBe('enabled-startup')
    })

    it('should execute multiple startup ensembles', async () => {
      const ensembles: EnsembleConfig[] = [
        {
          name: 'startup-1',
          trigger: [{ type: 'startup' as const }],
        },
        {
          name: 'startup-2',
          trigger: [{ type: 'startup' as const }],
        },
        {
          name: 'startup-3',
          trigger: [{ type: 'startup' as const }],
        },
      ]

      const results = await runStartupTriggers(ensembles, mockAgents, mockEnv, mockCtx)

      expect(results.length).toBe(3)
      expect(results.map((r) => r.ensemble)).toEqual(['startup-1', 'startup-2', 'startup-3'])
      expect(results.every((r) => r.success)).toBe(true)
    })

    it('should continue executing after a failure', async () => {
      // Re-mock Executor to fail for specific ensemble
      const { Executor } = await import('../executor.js')
      vi.mocked(Executor).mockImplementation(() => ({
        registerAgent: vi.fn(),
        executeEnsemble: vi.fn().mockImplementation((ensemble) => {
          if (ensemble.name === 'failing-startup') {
            return Promise.reject(new Error('Simulated failure'))
          }
          return Promise.resolve({
            success: true,
            value: { output: { ok: true } },
          })
        }),
      }) as any)

      resetStartupState()

      const ensembles: EnsembleConfig[] = [
        {
          name: 'startup-before',
          trigger: [{ type: 'startup' as const }],
        },
        {
          name: 'failing-startup',
          trigger: [{ type: 'startup' as const }],
        },
        {
          name: 'startup-after',
          trigger: [{ type: 'startup' as const }],
        },
      ]

      const results = await runStartupTriggers(ensembles, mockAgents, mockEnv, mockCtx)

      // All three should have results (failure doesn't stop others)
      expect(results.length).toBe(3)
      expect(results[0].success).toBe(true)
      expect(results[1].success).toBe(false)
      expect(results[1].error).toBe('Simulated failure')
      expect(results[2].success).toBe(true)
    })

    it('should handle ensembles with mixed trigger types', async () => {
      const ensembles: EnsembleConfig[] = [
        {
          name: 'multi-trigger',
          trigger: [
            { type: 'http' as const, path: '/api/test', public: true },
            { type: 'startup' as const },
            { type: 'cron' as const, cron: '0 * * * *' },
          ],
        },
      ]

      const results = await runStartupTriggers(ensembles, mockAgents, mockEnv, mockCtx)

      expect(results.length).toBe(1)
      expect(results[0].ensemble).toBe('multi-trigger')
      expect(results[0].success).toBe(true)
    })

    it('should track execution duration', async () => {
      const ensembles: EnsembleConfig[] = [
        {
          name: 'timed-startup',
          trigger: [{ type: 'startup' as const }],
        },
      ]

      const results = await runStartupTriggers(ensembles, mockAgents, mockEnv, mockCtx)

      expect(results[0].duration).toBeGreaterThanOrEqual(0)
      expect(typeof results[0].duration).toBe('number')
    })

    it('should return empty array for empty ensembles list', async () => {
      const results = await runStartupTriggers([], mockAgents, mockEnv, mockCtx)
      expect(results).toEqual([])
    })
  })
})
