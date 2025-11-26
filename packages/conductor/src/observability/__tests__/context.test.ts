/**
 * Observability Context Tests
 *
 * Tests for the observability context management system including:
 * - Config resolution with defaults
 * - Execution ID generation
 * - Scoped logger creation
 * - Metrics recorder
 * - Sensitive field redaction
 * - ObservabilityManager lifecycle
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  resolveObservabilityConfig,
  generateExecutionId,
  generateRequestId,
  createScopedLogger,
  createMetricsRecorder,
  redactSensitiveFields,
  ObservabilityManager,
  DEFAULT_REDACT_PATTERNS,
  DEFAULT_LOG_EVENTS,
  DEFAULT_METRIC_TYPES,
  type ResolvedObservabilityConfig,
  type ExecutionObservabilityContext,
} from '../context.js'
import { LogLevel } from '../types.js'

describe('Observability Context', () => {
  describe('resolveObservabilityConfig', () => {
    it('should return defaults when no config provided', () => {
      const resolved = resolveObservabilityConfig(undefined)

      expect(resolved.logging.enabled).toBe(true)
      expect(resolved.logging.level).toBe(LogLevel.INFO)
      expect(resolved.logging.format).toBe('json')
      expect(resolved.logging.context).toEqual([
        'requestId',
        'executionId',
        'ensembleName',
        'agentName',
      ])
      expect(resolved.logging.redact).toEqual(DEFAULT_REDACT_PATTERNS)
      expect(resolved.logging.events).toEqual(new Set(DEFAULT_LOG_EVENTS))

      expect(resolved.metrics.enabled).toBe(true)
      expect(resolved.metrics.binding).toBe('ANALYTICS')
      expect(resolved.metrics.track).toEqual(new Set(DEFAULT_METRIC_TYPES))

      expect(resolved.opentelemetry.enabled).toBe(false)
      expect(resolved.trackTokenUsage).toBe(true)
    })

    it('should disable logging when logging: false', () => {
      const resolved = resolveObservabilityConfig({ logging: false })
      expect(resolved.logging.enabled).toBe(false)
    })

    it('should enable logging when logging: true', () => {
      const resolved = resolveObservabilityConfig({ logging: true })
      expect(resolved.logging.enabled).toBe(true)
    })

    it('should use custom logging config', () => {
      const resolved = resolveObservabilityConfig({
        logging: {
          enabled: true,
          level: 'debug',
          format: 'pretty',
          context: ['requestId'],
          redact: ['custom_secret'],
          events: ['agent:error'],
        },
      })

      expect(resolved.logging.level).toBe(LogLevel.DEBUG)
      expect(resolved.logging.format).toBe('pretty')
      expect(resolved.logging.context).toEqual(['requestId'])
      expect(resolved.logging.redact).toEqual(['custom_secret'])
      expect(resolved.logging.events).toEqual(new Set(['agent:error']))
    })

    it('should disable metrics when metrics: false', () => {
      const resolved = resolveObservabilityConfig({ metrics: false })
      expect(resolved.metrics.enabled).toBe(false)
    })

    it('should use custom metrics config', () => {
      const resolved = resolveObservabilityConfig({
        metrics: {
          enabled: true,
          binding: 'CUSTOM_ANALYTICS',
          track: ['ensemble:execution'],
          dimensions: ['region'],
        },
      })

      expect(resolved.metrics.binding).toBe('CUSTOM_ANALYTICS')
      expect(resolved.metrics.track).toEqual(new Set(['ensemble:execution']))
      expect(resolved.metrics.dimensions).toEqual(['region'])
    })

    it('should configure opentelemetry when enabled', () => {
      const resolved = resolveObservabilityConfig({
        opentelemetry: {
          enabled: true,
          endpoint: 'https://otel.example.com',
          headers: { 'x-api-key': 'secret' },
          samplingRate: 0.5,
        },
      })

      expect(resolved.opentelemetry.enabled).toBe(true)
      expect(resolved.opentelemetry.endpoint).toBe('https://otel.example.com')
      expect(resolved.opentelemetry.headers).toEqual({ 'x-api-key': 'secret' })
      expect(resolved.opentelemetry.samplingRate).toBe(0.5)
    })

    it('should convert string log levels correctly', () => {
      expect(resolveObservabilityConfig({ logging: { level: 'debug' } }).logging.level).toBe(
        LogLevel.DEBUG
      )
      expect(resolveObservabilityConfig({ logging: { level: 'info' } }).logging.level).toBe(
        LogLevel.INFO
      )
      expect(resolveObservabilityConfig({ logging: { level: 'warn' } }).logging.level).toBe(
        LogLevel.WARN
      )
      expect(resolveObservabilityConfig({ logging: { level: 'error' } }).logging.level).toBe(
        LogLevel.ERROR
      )
    })
  })

  describe('generateExecutionId', () => {
    it('should generate unique execution IDs', () => {
      const id1 = generateExecutionId()
      const id2 = generateExecutionId()

      expect(id1).not.toBe(id2)
      expect(id1).toMatch(/^exec_[a-f0-9-]+$/)
      expect(id2).toMatch(/^exec_[a-f0-9-]+$/)
    })
  })

  describe('generateRequestId', () => {
    it('should generate unique request IDs', () => {
      const id1 = generateRequestId()
      const id2 = generateRequestId()

      expect(id1).not.toBe(id2)
      expect(id1).toMatch(/^req_[a-f0-9-]+$/)
      expect(id2).toMatch(/^req_[a-f0-9-]+$/)
    })
  })

  describe('redactSensitiveFields', () => {
    it('should redact fields matching default patterns', () => {
      const input = {
        username: 'john',
        password: 'secret123',
        apiKey: 'key-abc',
        data: 'normal',
      }

      const redacted = redactSensitiveFields(input, DEFAULT_REDACT_PATTERNS)

      expect(redacted.username).toBe('john')
      expect(redacted.password).toBe('[REDACTED]')
      expect(redacted.apiKey).toBe('[REDACTED]')
      expect(redacted.data).toBe('normal')
    })

    it('should redact nested objects', () => {
      const input = {
        user: {
          name: 'john',
          creditCard: '1234-5678',
        },
        metadata: {
          deep: {
            authorization: 'Bearer xyz',
          },
        },
      }

      const redacted = redactSensitiveFields(input, DEFAULT_REDACT_PATTERNS)

      expect((redacted.user as any).name).toBe('john')
      expect((redacted.user as any).creditCard).toBe('[REDACTED]')
      expect((redacted.metadata as any).deep.authorization).toBe('[REDACTED]')
    })

    it('should handle case-insensitive matching', () => {
      const input = {
        PASSWORD: 'secret',
        Api_Key: 'key123',
        TOKEN: 'abc',
      }

      const redacted = redactSensitiveFields(input, DEFAULT_REDACT_PATTERNS)

      expect(redacted.PASSWORD).toBe('[REDACTED]')
      expect(redacted.Api_Key).toBe('[REDACTED]')
      expect(redacted.TOKEN).toBe('[REDACTED]')
    })

    it('should handle partial matches', () => {
      const input = {
        myApiKey: 'value',
        user_password_hash: 'hash',
        someToken: 'tok',
      }

      const redacted = redactSensitiveFields(input, DEFAULT_REDACT_PATTERNS)

      expect(redacted.myApiKey).toBe('[REDACTED]')
      expect(redacted.user_password_hash).toBe('[REDACTED]')
      expect(redacted.someToken).toBe('[REDACTED]')
    })

    it('should not modify arrays', () => {
      const input = {
        items: ['a', 'b', 'c'],
        password: 'secret',
      }

      const redacted = redactSensitiveFields(input, DEFAULT_REDACT_PATTERNS)

      expect(redacted.items).toEqual(['a', 'b', 'c'])
      expect(redacted.password).toBe('[REDACTED]')
    })

    it('should handle null and undefined values', () => {
      const input = {
        nullValue: null,
        undefinedValue: undefined,
        password: 'secret',
      }

      const redacted = redactSensitiveFields(input, DEFAULT_REDACT_PATTERNS)

      expect(redacted.nullValue).toBe(null)
      expect(redacted.undefinedValue).toBe(undefined)
      expect(redacted.password).toBe('[REDACTED]')
    })

    it('should use custom patterns', () => {
      const input = {
        myCustomSecret: 'value',
        regularField: 'normal',
      }

      const redacted = redactSensitiveFields(input, ['customSecret'])

      expect(redacted.myCustomSecret).toBe('[REDACTED]')
      expect(redacted.regularField).toBe('normal')
    })
  })

  describe('createScopedLogger', () => {
    const baseContext: ExecutionObservabilityContext = {
      requestId: 'req_123',
      executionId: 'exec_456',
      ensembleName: 'test-ensemble',
      agentName: 'test-agent',
    }

    it('should return no-op logger when logging disabled', () => {
      const config = resolveObservabilityConfig({ logging: false })
      const logger = createScopedLogger(config, baseContext)

      // Should not throw
      logger.debug('test')
      logger.info('test')
      logger.warn('test')
      logger.error('test')
    })

    it('should create logger with base context', () => {
      const config = resolveObservabilityConfig({ logging: true })
      const logger = createScopedLogger(config, baseContext)

      expect(logger).toBeDefined()
      expect(typeof logger.debug).toBe('function')
      expect(typeof logger.info).toBe('function')
      expect(typeof logger.warn).toBe('function')
      expect(typeof logger.error).toBe('function')
      expect(typeof logger.child).toBe('function')
    })
  })

  describe('createMetricsRecorder', () => {
    let mockAnalyticsEngine: any
    let baseContext: ExecutionObservabilityContext

    beforeEach(() => {
      mockAnalyticsEngine = {
        writeDataPoint: vi.fn(),
      }
      baseContext = {
        requestId: 'req_123',
        executionId: 'exec_456',
        ensembleName: 'test-ensemble',
        environment: 'test',
      }
    })

    it('should record ensemble execution metric', () => {
      const config = resolveObservabilityConfig({ metrics: true })
      const recorder = createMetricsRecorder(mockAnalyticsEngine, config, baseContext)

      recorder.recordEnsembleExecution('my-ensemble', 150, true)

      expect(mockAnalyticsEngine.writeDataPoint).toHaveBeenCalledWith({
        blobs: ['my-ensemble', 'success', 'test'],
        doubles: [150, 1],
        indexes: ['ensemble.execution'],
      })
    })

    it('should record agent execution metric', () => {
      const config = resolveObservabilityConfig({ metrics: true })
      const recorder = createMetricsRecorder(mockAnalyticsEngine, config, baseContext)

      recorder.recordAgentExecution('my-agent', 50, true, false)

      expect(mockAnalyticsEngine.writeDataPoint).toHaveBeenCalledWith({
        blobs: ['my-agent', 'success', 'executed', 'test-ensemble'],
        doubles: [50, 1, 0],
        indexes: ['agent.execution'],
      })
    })

    it('should record cached agent execution', () => {
      const config = resolveObservabilityConfig({ metrics: true })
      const recorder = createMetricsRecorder(mockAnalyticsEngine, config, baseContext)

      recorder.recordAgentExecution('my-agent', 5, true, true)

      expect(mockAnalyticsEngine.writeDataPoint).toHaveBeenCalledWith({
        blobs: ['my-agent', 'success', 'cached', 'test-ensemble'],
        doubles: [5, 1, 1],
        indexes: ['agent.execution'],
      })
    })

    it('should record HTTP request metric', () => {
      const config = resolveObservabilityConfig({ metrics: true })
      const recorder = createMetricsRecorder(mockAnalyticsEngine, config, baseContext)

      recorder.recordHttpRequest('POST', '/api/execute', 200, 100)

      expect(mockAnalyticsEngine.writeDataPoint).toHaveBeenCalledWith({
        blobs: ['POST', '/api/execute', 'success', '200'],
        doubles: [100, 1],
        indexes: ['http.request'],
      })
    })

    it('should categorize HTTP errors correctly', () => {
      const config = resolveObservabilityConfig({ metrics: true })
      const recorder = createMetricsRecorder(mockAnalyticsEngine, config, baseContext)

      recorder.recordHttpRequest('GET', '/api/test', 404, 10)
      expect(mockAnalyticsEngine.writeDataPoint).toHaveBeenLastCalledWith({
        blobs: ['GET', '/api/test', 'client_error', '404'],
        doubles: [10, 1],
        indexes: ['http.request'],
      })

      recorder.recordHttpRequest('GET', '/api/test', 500, 10)
      expect(mockAnalyticsEngine.writeDataPoint).toHaveBeenLastCalledWith({
        blobs: ['GET', '/api/test', 'server_error', '500'],
        doubles: [10, 1],
        indexes: ['http.request'],
      })
    })

    it('should record error metric', () => {
      const config = resolveObservabilityConfig({ metrics: true })
      const recorder = createMetricsRecorder(mockAnalyticsEngine, config, baseContext)

      recorder.recordError('ValidationError', 'INVALID_INPUT')

      expect(mockAnalyticsEngine.writeDataPoint).toHaveBeenCalledWith({
        blobs: ['ValidationError', 'INVALID_INPUT', 'test-ensemble', 'unknown'],
        doubles: [1],
        indexes: ['error'],
      })
    })

    it('should record cache performance metric', () => {
      const config = resolveObservabilityConfig({
        metrics: { track: ['cache:performance'] },
      })
      const recorder = createMetricsRecorder(mockAnalyticsEngine, config, baseContext)

      recorder.recordCachePerformance(true, 'my-agent')

      expect(mockAnalyticsEngine.writeDataPoint).toHaveBeenCalledWith({
        blobs: ['hit', 'my-agent', 'test-ensemble'],
        doubles: [1],
        indexes: ['cache.performance'],
      })
    })

    it('should not record when metrics disabled', () => {
      const config = resolveObservabilityConfig({ metrics: false })
      const recorder = createMetricsRecorder(mockAnalyticsEngine, config, baseContext)

      recorder.recordEnsembleExecution('my-ensemble', 150, true)

      expect(mockAnalyticsEngine.writeDataPoint).not.toHaveBeenCalled()
    })

    it('should not record untracked metric types', () => {
      const config = resolveObservabilityConfig({
        metrics: { track: ['ensemble:execution'] },
      })
      const recorder = createMetricsRecorder(mockAnalyticsEngine, config, baseContext)

      recorder.recordAgentExecution('my-agent', 50, true, false)
      expect(mockAnalyticsEngine.writeDataPoint).not.toHaveBeenCalled()

      recorder.recordEnsembleExecution('my-ensemble', 150, true)
      expect(mockAnalyticsEngine.writeDataPoint).toHaveBeenCalledTimes(1)
    })

    it('should handle missing analytics engine gracefully', () => {
      const config = resolveObservabilityConfig({ metrics: true })
      const recorder = createMetricsRecorder(undefined, config, baseContext)

      // Should not throw
      recorder.recordEnsembleExecution('my-ensemble', 150, true)
    })

    it('should handle analytics engine errors gracefully', () => {
      mockAnalyticsEngine.writeDataPoint.mockImplementation(() => {
        throw new Error('Analytics Engine error')
      })

      const config = resolveObservabilityConfig({ metrics: true })
      const recorder = createMetricsRecorder(mockAnalyticsEngine, config, baseContext)

      // Should not throw
      recorder.recordEnsembleExecution('my-ensemble', 150, true)
    })

    it('should record custom metrics', () => {
      const config = resolveObservabilityConfig({ metrics: true })
      const recorder = createMetricsRecorder(mockAnalyticsEngine, config, baseContext)

      recorder.record('custom.metric', 42, { region: 'us-east' })

      expect(mockAnalyticsEngine.writeDataPoint).toHaveBeenCalledWith({
        blobs: ['custom.metric', 'us-east'],
        doubles: [42],
        indexes: ['custom.metric'],
      })
    })
  })

  describe('ObservabilityManager', () => {
    it('should initialize with auto-generated IDs', () => {
      const manager = new ObservabilityManager(undefined, {})
      const context = manager.getContext()

      expect(context.requestId).toMatch(/^req_/)
      expect(context.executionId).toMatch(/^exec_/)
    })

    it('should use provided IDs', () => {
      const manager = new ObservabilityManager(undefined, {
        requestId: 'req_custom',
        executionId: 'exec_custom',
      })
      const context = manager.getContext()

      expect(context.requestId).toBe('req_custom')
      expect(context.executionId).toBe('exec_custom')
    })

    it('should provide access to logger and metrics', () => {
      const manager = new ObservabilityManager(undefined, {})

      expect(manager.getLogger()).toBeDefined()
      expect(manager.getMetrics()).toBeDefined()
    })

    it('should correctly check if events should be logged', () => {
      const manager = new ObservabilityManager(
        {
          logging: {
            events: ['agent:start', 'agent:error'],
          },
        },
        {}
      )

      expect(manager.shouldLogEvent('agent:start')).toBe(true)
      expect(manager.shouldLogEvent('agent:error')).toBe(true)
      expect(manager.shouldLogEvent('agent:complete')).toBe(false)
    })

    it('should correctly check if metrics should be tracked', () => {
      const manager = new ObservabilityManager(
        {
          metrics: {
            track: ['ensemble:execution'],
          },
        },
        {}
      )

      expect(manager.shouldTrackMetric('ensemble:execution')).toBe(true)
      expect(manager.shouldTrackMetric('agent:execution')).toBe(false)
    })

    it('should create child manager for agent', () => {
      const manager = new ObservabilityManager(undefined, {
        requestId: 'req_123',
        ensembleName: 'my-ensemble',
      })

      const agentManager = manager.forAgent('my-agent', 2)
      const context = agentManager.getContext()

      expect(context.requestId).toBe('req_123')
      expect(context.ensembleName).toBe('my-ensemble')
      expect(context.agentName).toBe('my-agent')
      expect(context.stepIndex).toBe(2)
    })

    it('should create child manager for ensemble', () => {
      const manager = new ObservabilityManager(undefined, {
        requestId: 'req_123',
      })

      const ensembleManager = manager.forEnsemble('new-ensemble')
      const context = ensembleManager.getContext()

      expect(context.requestId).toBe('req_123')
      expect(context.ensembleName).toBe('new-ensemble')
      expect(context.executionId).toMatch(/^exec_/)
    })

    it('should redact sensitive fields', () => {
      const manager = new ObservabilityManager(
        {
          logging: {
            redact: ['password', 'apiKey'],
          },
        },
        {}
      )

      const redacted = manager.redact({
        username: 'john',
        password: 'secret',
        apiKey: 'key123',
      })

      expect(redacted.username).toBe('john')
      expect(redacted.password).toBe('[REDACTED]')
      expect(redacted.apiKey).toBe('[REDACTED]')
    })

    it('should return false for event check when logging disabled', () => {
      const manager = new ObservabilityManager({ logging: false }, {})

      expect(manager.shouldLogEvent('agent:start')).toBe(false)
    })

    it('should return false for metric check when metrics disabled', () => {
      const manager = new ObservabilityManager({ metrics: false }, {})

      expect(manager.shouldTrackMetric('ensemble:execution')).toBe(false)
    })
  })
})
