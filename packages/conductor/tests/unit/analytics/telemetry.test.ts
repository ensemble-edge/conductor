/**
 * Telemetry Tests
 *
 * Tests for the analytics telemetry emitter.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  createTelemetryEmitter,
  createNoopTelemetryEmitter,
  createCapturingTelemetryEmitter,
} from '../../../src/analytics/telemetry'
import type { InstrumentationConfig } from '../../../src/analytics/types'

describe('TelemetryEmitter', () => {
  describe('createTelemetryEmitter', () => {
    it('should create an emitter without analytics engine (dev mode)', () => {
      const emitter = createTelemetryEmitter(undefined, { enabled: true, console: false })

      expect(emitter).toBeDefined()
      expect(typeof emitter.emit).toBe('function')
      expect(typeof emitter.emitAgentEvent).toBe('function')
      expect(typeof emitter.emitEnsembleEvent).toBe('function')
      expect(typeof emitter.emitCustom).toBe('function')
    })

    it('should emit to analytics engine when available', () => {
      const mockAnalytics = {
        writeDataPoint: vi.fn(),
      }

      const emitter = createTelemetryEmitter(
        mockAnalytics as unknown as AnalyticsEngineDataset,
        { enabled: true, console: false }
      )

      emitter.emit({
        blobs: ['test-event', 'success'],
        doubles: [100],
        indexes: ['project-1'],
      })

      expect(mockAnalytics.writeDataPoint).toHaveBeenCalledTimes(1)
      expect(mockAnalytics.writeDataPoint).toHaveBeenCalledWith({
        blobs: ['test-event', 'success'],
        doubles: [100],
        indexes: ['project-1'],
      })
    })

    it('should do nothing when disabled', () => {
      const mockAnalytics = {
        writeDataPoint: vi.fn(),
      }

      const emitter = createTelemetryEmitter(
        mockAnalytics as unknown as AnalyticsEngineDataset,
        { enabled: false }
      )

      emitter.emit({
        blobs: ['test-event'],
        doubles: [100],
        indexes: ['project-1'],
      })

      expect(mockAnalytics.writeDataPoint).not.toHaveBeenCalled()
    })

    it('should not crash when analytics engine throws', () => {
      const mockAnalytics = {
        writeDataPoint: vi.fn().mockImplementation(() => {
          throw new Error('Analytics Engine error')
        }),
      }

      const emitter = createTelemetryEmitter(
        mockAnalytics as unknown as AnalyticsEngineDataset,
        { enabled: true, console: false }
      )

      // Should not throw
      expect(() => {
        emitter.emit({
          blobs: ['test'],
          doubles: [1],
          indexes: ['p1'],
        })
      }).not.toThrow()
    })
  })

  describe('emitAgentEvent', () => {
    it('should format agent events correctly', () => {
      const mockAnalytics = {
        writeDataPoint: vi.fn(),
      }

      const emitter = createTelemetryEmitter(
        mockAnalytics as unknown as AnalyticsEngineDataset,
        { enabled: true, agents: true, console: false }
      )

      emitter.emitAgentEvent({
        agentName: 'test-agent',
        status: 'success',
        environment: 'production',
        durationMs: 150,
        inputTokens: 100,
        outputTokens: 50,
        costUsd: 0.0015,
        projectId: 'proj-123',
      })

      expect(mockAnalytics.writeDataPoint).toHaveBeenCalledTimes(1)
      const call = mockAnalytics.writeDataPoint.mock.calls[0][0]

      expect(call.blobs[0]).toBe('test-agent')
      expect(call.blobs[1]).toBe('success')
      expect(call.blobs[2]).toBe('production')
      expect(call.doubles[0]).toBe(150) // duration
      expect(call.doubles[1]).toBe(100) // input tokens
      expect(call.doubles[2]).toBe(50) // output tokens
      expect(call.doubles[3]).toBe(0.0015) // cost
      expect(call.indexes[0]).toBe('proj-123')
    })

    it('should use defaults for missing fields', () => {
      const mockAnalytics = {
        writeDataPoint: vi.fn(),
      }

      const emitter = createTelemetryEmitter(
        mockAnalytics as unknown as AnalyticsEngineDataset,
        { enabled: true, agents: true, console: false },
        { environment: 'staging', projectId: 'default-proj' }
      )

      emitter.emitAgentEvent({
        agentName: 'simple-agent',
        status: 'error',
        durationMs: 50,
      })

      const call = mockAnalytics.writeDataPoint.mock.calls[0][0]

      expect(call.blobs[0]).toBe('simple-agent')
      expect(call.blobs[1]).toBe('error')
      expect(call.blobs[2]).toBe('staging') // from baseContext
      expect(call.blobs[3]).toBe('anonymous') // default
      expect(call.doubles[1]).toBe(0) // input tokens default
      expect(call.indexes[0]).toBe('default-proj') // from baseContext
    })

    it('should not emit when agents tracking is disabled', () => {
      const mockAnalytics = {
        writeDataPoint: vi.fn(),
      }

      const emitter = createTelemetryEmitter(
        mockAnalytics as unknown as AnalyticsEngineDataset,
        { enabled: true, agents: false, console: false }
      )

      emitter.emitAgentEvent({
        agentName: 'test',
        status: 'success',
        durationMs: 100,
      })

      expect(mockAnalytics.writeDataPoint).not.toHaveBeenCalled()
    })
  })

  describe('emitEnsembleEvent', () => {
    it('should format ensemble events correctly', () => {
      const mockAnalytics = {
        writeDataPoint: vi.fn(),
      }

      const emitter = createTelemetryEmitter(
        mockAnalytics as unknown as AnalyticsEngineDataset,
        { enabled: true, ensembles: true, console: false }
      )

      emitter.emitEnsembleEvent({
        ensembleName: 'my-workflow',
        status: 'success',
        environment: 'production',
        triggerType: 'http',
        durationMs: 500,
        agentCount: 3,
        totalInputTokens: 200,
        totalOutputTokens: 150,
        totalCostUsd: 0.005,
        projectId: 'proj-456',
      })

      const call = mockAnalytics.writeDataPoint.mock.calls[0][0]

      expect(call.blobs[0]).toBe('my-workflow')
      expect(call.blobs[1]).toBe('success')
      expect(call.blobs[2]).toBe('production')
      expect(call.blobs[3]).toBe('http')
      expect(call.doubles[0]).toBe(500) // duration
      expect(call.doubles[1]).toBe(3) // agent count
      expect(call.indexes[0]).toBe('proj-456')
    })
  })

  describe('emitCustom', () => {
    it('should format custom events correctly', () => {
      const mockAnalytics = {
        writeDataPoint: vi.fn(),
      }

      const emitter = createTelemetryEmitter(
        mockAnalytics as unknown as AnalyticsEngineDataset,
        { enabled: true, console: false }
      )

      emitter.emitCustom('order_placed', {
        dimensions: { category: 'electronics', region: 'us-west' },
        metrics: { amount: 99.99, itemCount: 3 },
        index: 'customer-123',
      })

      const call = mockAnalytics.writeDataPoint.mock.calls[0][0]

      expect(call.blobs[0]).toBe('order_placed')
      expect(call.blobs[1]).toBe('electronics')
      expect(call.blobs[2]).toBe('us-west')
      expect(call.doubles[0]).toBe(99.99)
      expect(call.doubles[1]).toBe(3)
      expect(call.indexes[0]).toBe('customer-123')
    })
  })

  describe('createNoopTelemetryEmitter', () => {
    it('should return an emitter that does nothing', () => {
      const emitter = createNoopTelemetryEmitter()

      // Should not throw
      emitter.emit({ blobs: ['test'] })
      emitter.emitAgentEvent({ agentName: 'test', status: 'success', durationMs: 100 })
      emitter.emitEnsembleEvent({
        ensembleName: 'test',
        status: 'success',
        durationMs: 100,
      })
      emitter.emitCustom('test', {})
    })
  })

  describe('createCapturingTelemetryEmitter', () => {
    it('should capture all emitted events', () => {
      const emitter = createCapturingTelemetryEmitter()

      emitter.emit({ blobs: ['event1'], doubles: [1], indexes: ['idx1'] })
      emitter.emit({ blobs: ['event2'], doubles: [2], indexes: ['idx2'] })

      const captured = emitter.getCapturedEvents()

      expect(captured).toHaveLength(2)
      expect(captured[0].blobs?.[0]).toBe('event1')
      expect(captured[1].blobs?.[0]).toBe('event2')
    })

    it('should capture agent events', () => {
      const emitter = createCapturingTelemetryEmitter()

      emitter.emitAgentEvent({
        agentName: 'test-agent',
        status: 'success',
        durationMs: 100,
      })

      const captured = emitter.getCapturedEvents()

      expect(captured).toHaveLength(1)
      expect(captured[0].blobs?.[0]).toBe('test-agent')
      expect(captured[0].blobs?.[1]).toBe('success')
    })

    it('should clear captured events', () => {
      const emitter = createCapturingTelemetryEmitter()

      emitter.emit({ blobs: ['event1'] })
      expect(emitter.getCapturedEvents()).toHaveLength(1)

      emitter.clear()
      expect(emitter.getCapturedEvents()).toHaveLength(0)
    })
  })
})
