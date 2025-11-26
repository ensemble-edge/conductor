/**
 * Observability Context Management
 *
 * Handles execution context propagation for logging and metrics.
 * Provides scoped loggers and metrics recorders that automatically
 * include request/execution context.
 */

import type { Logger, LogContext, MetricDataPoint } from './types.js'
import { ConductorLogger, createLogger } from './logger.js'
import type {
  ObservabilityConfig,
  LoggingConfig,
  MetricsConfig,
  LogEventType,
  MetricType,
} from '../config/types.js'
import { LogLevel } from './types.js'

/**
 * Default redaction patterns
 */
export const DEFAULT_REDACT_PATTERNS = [
  'password',
  'apiKey',
  'api_key',
  'token',
  'authorization',
  'secret',
  'creditCard',
  'credit_card',
  'ssn',
  'socialSecurityNumber',
]

/**
 * Default log events to track
 */
export const DEFAULT_LOG_EVENTS: LogEventType[] = [
  'request',
  'response',
  'agent:start',
  'agent:complete',
  'agent:error',
]

/**
 * Default metric types to track
 */
export const DEFAULT_METRIC_TYPES: MetricType[] = [
  'ensemble:execution',
  'agent:execution',
  'http:request',
  'error',
]

/**
 * Resolved observability configuration with defaults applied
 */
export interface ResolvedObservabilityConfig {
  logging: {
    enabled: boolean
    level: LogLevel
    format: 'json' | 'pretty'
    context: string[]
    redact: string[]
    events: Set<LogEventType>
  }
  metrics: {
    enabled: boolean
    binding: string
    track: Set<MetricType>
    dimensions: string[]
  }
  opentelemetry: {
    enabled: boolean
    endpoint?: string
    headers?: Record<string, string>
    samplingRate: number
  }
  trackTokenUsage: boolean
}

/**
 * Resolve observability config with defaults
 */
export function resolveObservabilityConfig(
  config?: ObservabilityConfig
): ResolvedObservabilityConfig {
  // Handle logging config
  let loggingConfig: LoggingConfig
  if (config?.logging === false) {
    loggingConfig = { enabled: false }
  } else if (config?.logging === true || config?.logging === undefined) {
    loggingConfig = { enabled: true }
  } else {
    loggingConfig = config.logging
  }

  // Handle metrics config
  let metricsConfig: MetricsConfig
  if (config?.metrics === false) {
    metricsConfig = { enabled: false }
  } else if (config?.metrics === true || config?.metrics === undefined) {
    metricsConfig = { enabled: true }
  } else {
    metricsConfig = config.metrics
  }

  return {
    logging: {
      enabled: loggingConfig.enabled !== false,
      level: stringToLogLevel(loggingConfig.level ?? 'info'),
      format: loggingConfig.format ?? 'json',
      context: loggingConfig.context ?? ['requestId', 'executionId', 'ensembleName', 'agentName'],
      redact: loggingConfig.redact ?? DEFAULT_REDACT_PATTERNS,
      events: new Set(loggingConfig.events ?? DEFAULT_LOG_EVENTS),
    },
    metrics: {
      enabled: metricsConfig.enabled !== false,
      binding: metricsConfig.binding ?? 'ANALYTICS',
      track: new Set(metricsConfig.track ?? DEFAULT_METRIC_TYPES),
      dimensions: metricsConfig.dimensions ?? [],
    },
    opentelemetry: {
      enabled: config?.opentelemetry?.enabled ?? false,
      endpoint: config?.opentelemetry?.endpoint,
      headers: config?.opentelemetry?.headers,
      samplingRate: config?.opentelemetry?.samplingRate ?? 1.0,
    },
    trackTokenUsage: config?.trackTokenUsage ?? true,
  }
}

/**
 * Convert string log level to LogLevel enum
 */
function stringToLogLevel(level: string): LogLevel {
  switch (level.toLowerCase()) {
    case 'debug':
      return LogLevel.DEBUG
    case 'info':
      return LogLevel.INFO
    case 'warn':
      return LogLevel.WARN
    case 'error':
      return LogLevel.ERROR
    default:
      return LogLevel.INFO
  }
}

/**
 * Generate a unique execution ID
 */
export function generateExecutionId(): string {
  return `exec_${crypto.randomUUID()}`
}

/**
 * Generate a unique request ID
 */
export function generateRequestId(): string {
  return `req_${crypto.randomUUID()}`
}

/**
 * Execution context for observability
 * Contains all context needed for logging and metrics
 */
export interface ExecutionObservabilityContext {
  /** Unique request ID (from HTTP request) */
  requestId: string
  /** Unique execution ID (for ensemble execution) */
  executionId: string
  /** Ensemble name being executed */
  ensembleName?: string
  /** Current agent name */
  agentName?: string
  /** Current step index in the flow */
  stepIndex?: number
  /** User ID (if authenticated) */
  userId?: string
  /** Session ID */
  sessionId?: string
  /** Environment name */
  environment?: string
  /** Custom dimensions */
  [key: string]: unknown
}

/**
 * Metrics recorder for Analytics Engine
 */
export interface MetricsRecorder {
  /**
   * Record a metric to Analytics Engine
   */
  record(name: string, value: number, dimensions?: Record<string, string>): void

  /**
   * Record ensemble execution metric
   */
  recordEnsembleExecution(ensembleName: string, durationMs: number, success: boolean): void

  /**
   * Record agent execution metric
   */
  recordAgentExecution(
    agentName: string,
    durationMs: number,
    success: boolean,
    cached?: boolean
  ): void

  /**
   * Record HTTP request metric
   */
  recordHttpRequest(method: string, path: string, statusCode: number, durationMs: number): void

  /**
   * Record error metric
   */
  recordError(errorType: string, errorCode?: string): void

  /**
   * Record cache performance metric
   */
  recordCachePerformance(hit: boolean, agentName?: string): void
}

/**
 * Create a metrics recorder that writes to Analytics Engine
 */
export function createMetricsRecorder(
  analyticsEngine: AnalyticsEngineDataset | undefined,
  config: ResolvedObservabilityConfig,
  baseContext: ExecutionObservabilityContext
): MetricsRecorder {
  const shouldTrack = (type: MetricType): boolean => {
    return config.metrics.enabled && config.metrics.track.has(type)
  }

  const writeMetric = (data: MetricDataPoint): void => {
    if (!analyticsEngine || !config.metrics.enabled) return

    try {
      analyticsEngine.writeDataPoint({
        blobs: data.blobs ?? [],
        doubles: data.doubles ?? [],
        indexes: data.indexes ?? [],
      })
    } catch {
      // Silently ignore metrics failures - don't crash the app
    }
  }

  return {
    record(name: string, value: number, dimensions?: Record<string, string>): void {
      writeMetric({
        blobs: [name, ...(dimensions ? Object.values(dimensions) : [])],
        doubles: [value],
        indexes: [name],
      })
    },

    recordEnsembleExecution(ensembleName: string, durationMs: number, success: boolean): void {
      if (!shouldTrack('ensemble:execution')) return

      writeMetric({
        blobs: [
          ensembleName,
          success ? 'success' : 'failure',
          baseContext.environment ?? 'unknown',
        ],
        doubles: [durationMs, success ? 1 : 0],
        indexes: ['ensemble.execution'],
      })
    },

    recordAgentExecution(
      agentName: string,
      durationMs: number,
      success: boolean,
      cached = false
    ): void {
      if (!shouldTrack('agent:execution')) return

      writeMetric({
        blobs: [
          agentName,
          success ? 'success' : 'failure',
          cached ? 'cached' : 'executed',
          baseContext.ensembleName ?? 'unknown',
        ],
        doubles: [durationMs, success ? 1 : 0, cached ? 1 : 0],
        indexes: ['agent.execution'],
      })
    },

    recordHttpRequest(method: string, path: string, statusCode: number, durationMs: number): void {
      if (!shouldTrack('http:request')) return

      const statusCategory =
        statusCode < 400 ? 'success' : statusCode < 500 ? 'client_error' : 'server_error'

      writeMetric({
        blobs: [method, path, statusCategory, String(statusCode)],
        doubles: [durationMs, 1],
        indexes: ['http.request'],
      })
    },

    recordError(errorType: string, errorCode?: string): void {
      if (!shouldTrack('error')) return

      writeMetric({
        blobs: [
          errorType,
          errorCode ?? 'unknown',
          baseContext.ensembleName ?? 'unknown',
          baseContext.agentName ?? 'unknown',
        ],
        doubles: [1],
        indexes: ['error'],
      })
    },

    recordCachePerformance(hit: boolean, agentName?: string): void {
      if (!shouldTrack('cache:performance')) return

      writeMetric({
        blobs: [
          hit ? 'hit' : 'miss',
          agentName ?? 'unknown',
          baseContext.ensembleName ?? 'unknown',
        ],
        doubles: [1],
        indexes: ['cache.performance'],
      })
    },
  }
}

/**
 * Redact sensitive fields from an object
 */
export function redactSensitiveFields(
  obj: Record<string, unknown>,
  patterns: string[]
): Record<string, unknown> {
  const result: Record<string, unknown> = {}

  for (const [key, value] of Object.entries(obj)) {
    // Check if this key matches any redaction pattern
    const shouldRedact = patterns.some((pattern) => {
      const lowerKey = key.toLowerCase()
      const lowerPattern = pattern.toLowerCase()
      return lowerKey.includes(lowerPattern) || lowerKey === lowerPattern
    })

    if (shouldRedact) {
      result[key] = '[REDACTED]'
    } else if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      // Recursively redact nested objects
      result[key] = redactSensitiveFields(value as Record<string, unknown>, patterns)
    } else {
      result[key] = value
    }
  }

  return result
}

/**
 * Create a scoped logger for execution context
 */
export function createScopedLogger(
  config: ResolvedObservabilityConfig,
  context: ExecutionObservabilityContext,
  analyticsEngine?: AnalyticsEngineDataset
): Logger {
  if (!config.logging.enabled) {
    // Return a no-op logger
    return {
      debug: () => {},
      info: () => {},
      warn: () => {},
      error: () => {},
      child: () => createScopedLogger(config, context, analyticsEngine),
      metric: () => {},
    }
  }

  // Build base context from execution context
  const baseContext: LogContext = {}
  for (const field of config.logging.context) {
    if (field in context && context[field] !== undefined) {
      baseContext[field] = context[field]
    }
  }

  return new ConductorLogger(
    {
      level: config.logging.level,
      serviceName: 'conductor',
      enableAnalytics: config.metrics.enabled,
      baseContext,
    },
    analyticsEngine,
    baseContext
  )
}

/**
 * Observability manager for a single request/execution
 */
export class ObservabilityManager {
  private config: ResolvedObservabilityConfig
  private context: ExecutionObservabilityContext
  private logger: Logger
  private metrics: MetricsRecorder
  private analyticsEngine?: AnalyticsEngineDataset

  constructor(
    config: ObservabilityConfig | undefined,
    initialContext: Partial<ExecutionObservabilityContext>,
    analyticsEngine?: AnalyticsEngineDataset
  ) {
    this.config = resolveObservabilityConfig(config)
    this.analyticsEngine = analyticsEngine
    this.context = {
      requestId: initialContext.requestId ?? generateRequestId(),
      executionId: initialContext.executionId ?? generateExecutionId(),
      ...initialContext,
    }

    this.logger = createScopedLogger(this.config, this.context, analyticsEngine)
    this.metrics = createMetricsRecorder(analyticsEngine, this.config, this.context)
  }

  /**
   * Get the current logger
   */
  getLogger(): Logger {
    return this.logger
  }

  /**
   * Get the metrics recorder
   */
  getMetrics(): MetricsRecorder {
    return this.metrics
  }

  /**
   * Get the current execution context
   */
  getContext(): ExecutionObservabilityContext {
    return { ...this.context }
  }

  /**
   * Get the resolved config
   */
  getConfig(): ResolvedObservabilityConfig {
    return this.config
  }

  /**
   * Check if a log event should be logged
   */
  shouldLogEvent(event: LogEventType): boolean {
    return this.config.logging.enabled && this.config.logging.events.has(event)
  }

  /**
   * Check if a metric type should be tracked
   */
  shouldTrackMetric(type: MetricType): boolean {
    return this.config.metrics.enabled && this.config.metrics.track.has(type)
  }

  /**
   * Create a child manager with additional context (e.g., for an agent)
   */
  forAgent(agentName: string, stepIndex?: number): ObservabilityManager {
    const childContext = {
      ...this.context,
      agentName,
      stepIndex,
    }

    const manager = new ObservabilityManager(
      undefined, // Will use resolved config
      childContext,
      this.analyticsEngine
    )

    // Copy over the resolved config
    ;(manager as any).config = this.config

    return manager
  }

  /**
   * Create a child manager for an ensemble
   */
  forEnsemble(ensembleName: string, executionId?: string): ObservabilityManager {
    const childContext = {
      ...this.context,
      ensembleName,
      executionId: executionId ?? generateExecutionId(),
    }

    const manager = new ObservabilityManager(undefined, childContext, this.analyticsEngine)

    ;(manager as any).config = this.config

    return manager
  }

  /**
   * Redact sensitive fields from data
   */
  redact(data: Record<string, unknown>): Record<string, unknown> {
    return redactSensitiveFields(data, this.config.logging.redact)
  }
}

/**
 * Create an observability manager
 */
export function createObservabilityManager(
  config?: ObservabilityConfig,
  initialContext?: Partial<ExecutionObservabilityContext>,
  analyticsEngine?: AnalyticsEngineDataset
): ObservabilityManager {
  return new ObservabilityManager(config, initialContext ?? {}, analyticsEngine)
}
