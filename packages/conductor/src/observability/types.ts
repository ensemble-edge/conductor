/**
 * Observability Types
 *
 * Type definitions for logging, tracing, and metrics following
 * Cloudflare Workers Observability best practices (2025).
 */

/**
 * Log levels following standard severity hierarchy
 */
export enum LogLevel {
  DEBUG = 'debug',
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error',
}

/**
 * Log context - structured data attached to log entries
 *
 * Cloudflare Workers Logs automatically indexes JSON fields,
 * so rich context enables powerful queries in the dashboard.
 */
export interface LogContext {
  // Request tracking
  requestId?: string
  executionId?: string

  // Execution context
  ensembleName?: string
  agentName?: string
  stepIndex?: number
  attemptNumber?: number

  // Performance
  durationMs?: number

  // User/session
  userId?: string
  sessionId?: string

  // Additional metadata
  [key: string]: unknown
}

/**
 * Structured log entry format
 *
 * This format is automatically parsed and indexed by Cloudflare Workers Logs
 */
export interface LogEntry {
  timestamp: string
  level: LogLevel
  message: string
  context?: LogContext
  error?: {
    name: string
    message: string
    stack?: string
    code?: string
    details?: unknown
  }
}

/**
 * Log output format
 */
export type LogOutputFormat = 'json' | 'pretty'

/**
 * Logger configuration
 */
export interface LoggerConfig {
  /**
   * Minimum log level to output
   * @default LogLevel.INFO in production, LogLevel.DEBUG in development
   */
  level?: LogLevel

  /**
   * Service name for log identification
   * @default 'conductor'
   */
  serviceName?: string

  /**
   * Environment name
   * @default 'production'
   */
  environment?: string

  /**
   * Enable debug mode (outputs all logs including DEBUG level)
   * Can be controlled via DEBUG env variable
   * @default false
   */
  debug?: boolean

  /**
   * Enable Analytics Engine integration for metrics
   * @default true
   */
  enableAnalytics?: boolean

  /**
   * Base context to include in all logs
   */
  baseContext?: LogContext

  /**
   * Output format for logs
   * - 'json': Structured JSON (good for production, machine-parseable)
   * - 'pretty': Dev-friendly format like [conductor:info] Message
   * @default 'pretty' in development, 'json' in production
   */
  outputFormat?: LogOutputFormat
}

/**
 * Analytics Engine data point
 *
 * High-cardinality metrics for querying with SQL API
 */
export interface MetricDataPoint {
  /**
   * String values (up to 20)
   */
  blobs?: string[]

  /**
   * Numeric values (up to 20)
   */
  doubles?: number[]

  /**
   * Index keys for querying (up to 20)
   */
  indexes?: string[]
}

/**
 * Trace span for distributed tracing
 */
export interface TraceSpan {
  name: string
  startTime: number
  endTime?: number
  attributes: Record<string, unknown>
  events: TraceEvent[]
  status: 'ok' | 'error'
  error?: Error
}

/**
 * Trace event within a span
 */
export interface TraceEvent {
  timestamp: number
  name: string
  attributes: Record<string, unknown>
}

/**
 * Logger interface
 *
 * All logging should go through this interface to ensure
 * consistent structure and integration with Cloudflare observability.
 */
export interface Logger {
  /**
   * Log debug information (development/troubleshooting)
   */
  debug(message: string, context?: LogContext): void

  /**
   * Log informational message
   */
  info(message: string, context?: LogContext): void

  /**
   * Log warning
   */
  warn(message: string, context?: LogContext): void

  /**
   * Log error
   */
  error(message: string, error?: Error, context?: LogContext): void

  /**
   * Create child logger with additional context
   */
  child(context: LogContext): Logger

  /**
   * Record metric to Analytics Engine
   */
  metric(name: string, data: MetricDataPoint): void
}

/**
 * Observability provider interface for extensibility
 */
export interface ObservabilityProvider {
  /**
   * Log a message
   */
  log(entry: LogEntry): void

  /**
   * Record a metric
   */
  recordMetric(name: string, data: MetricDataPoint): void

  /**
   * Start a trace span
   */
  startSpan(name: string, attributes: Record<string, unknown>): TraceSpan

  /**
   * End a trace span
   */
  endSpan(span: TraceSpan): void
}
