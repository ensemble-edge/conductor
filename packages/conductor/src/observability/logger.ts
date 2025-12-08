/**
 * Structured Logger for Cloudflare Workers
 *
 * Follows Cloudflare Workers Observability best practices (2025):
 * - Uses console.log() for automatic capture by Workers Logs
 * - Outputs structured JSON for automatic field extraction/indexing in production
 * - Outputs dev-friendly colored format in development (like Wrangler's [wrangler:info])
 * - Integrates with Analytics Engine for metrics
 * - Supports debug mode via DEBUG environment variable
 * - Thread-safe and immutable context management
 *
 * @see https://developers.cloudflare.com/workers/observability/
 */

import type {
  Logger,
  LoggerConfig,
  LogLevel,
  LogContext,
  LogEntry,
  MetricDataPoint,
  LogOutputFormat,
} from './types.js'
import { LogLevel as LogLevelEnum } from './types.js'
import type { ConductorError } from '../errors/error-types.js'

// ============================================================================
// ANSI Colors & Formatting
// ============================================================================

/**
 * ANSI escape codes for terminal colors
 * Compatible with most terminals, including Wrangler's dev output
 */
const ANSI = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  dim: '\x1b[2m',
  italic: '\x1b[3m',
  underline: '\x1b[4m',

  // Foreground colors (matching Wrangler's color scheme)
  black: '\x1b[30m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
  gray: '\x1b[90m',

  // Bright variants
  brightRed: '\x1b[91m',
  brightGreen: '\x1b[92m',
  brightYellow: '\x1b[93m',
  brightBlue: '\x1b[94m',
  brightMagenta: '\x1b[95m',
  brightCyan: '\x1b[96m',
} as const

/**
 * Color configuration for each log level
 * Inspired by Wrangler's clean, readable output style
 */
const LEVEL_STYLES: Record<LogLevel, { color: string; abbr: string }> = {
  [LogLevelEnum.DEBUG]: { color: ANSI.gray, abbr: 'dbg' },
  [LogLevelEnum.INFO]: { color: ANSI.cyan, abbr: 'inf' },
  [LogLevelEnum.WARN]: { color: ANSI.yellow, abbr: 'wrn' },
  [LogLevelEnum.ERROR]: { color: ANSI.red, abbr: 'err' },
}

/**
 * Log level hierarchy for filtering
 */
const LOG_LEVEL_PRIORITY: Record<LogLevel, number> = {
  [LogLevelEnum.DEBUG]: 0,
  [LogLevelEnum.INFO]: 1,
  [LogLevelEnum.WARN]: 2,
  [LogLevelEnum.ERROR]: 3,
}

// ============================================================================
// Pretty Formatter
// ============================================================================

/**
 * Format a log entry for human-readable console output
 *
 * Output format matches Wrangler's style:
 * [conductor:inf] Your message here
 *
 * With context (when present):
 * [conductor:inf] Your message here  (key=value, key2=value2)
 *
 * With errors (stack trace dimmed):
 * [conductor:err] Error message
 *   Error: Something went wrong
 *     at function (file.js:10:5)
 */
function formatPretty(entry: LogEntry, serviceName: string): string {
  const style = LEVEL_STYLES[entry.level]
  const { color, abbr } = style

  // Build the prefix: [conductor:inf]
  const prefix = `${color}[${serviceName}:${abbr}]${ANSI.reset}`

  // Build main message line
  let output = `${prefix} ${entry.message}`

  // Append context if present (as dimmed key=value pairs)
  if (entry.context && Object.keys(entry.context).length > 0) {
    const contextPairs = Object.entries(entry.context)
      .filter(([_, value]) => value !== undefined && value !== null)
      .map(([key, value]) => {
        // Format values appropriately
        const formatted = typeof value === 'object' ? JSON.stringify(value) : String(value)
        return `${key}=${formatted}`
      })
      .join(', ')

    if (contextPairs) {
      output += `  ${ANSI.dim}(${contextPairs})${ANSI.reset}`
    }
  }

  // Append error details if present
  if (entry.error) {
    output += '\n'
    // Error name and message
    output += `${ANSI.dim}  ${entry.error.name}: ${entry.error.message}${ANSI.reset}`

    // Stack trace (further dimmed, only first 5 lines)
    if (entry.error.stack) {
      const stackLines = entry.error.stack
        .split('\n')
        .slice(1, 6) // Skip first line (already have name/message), limit to 5
        .map((line) => `${ANSI.dim}${line}${ANSI.reset}`)
        .join('\n')
      if (stackLines) {
        output += '\n' + stackLines
      }
    }
  }

  return output
}

/**
 * Format a log entry as JSON for production/machine consumption
 */
function formatJSON(entry: LogEntry): string {
  return JSON.stringify(entry)
}

// ============================================================================
// Environment Detection
// ============================================================================

/**
 * Cache for environment detection (computed once per isolate)
 */
let cachedIsDev: boolean | null = null

/**
 * Detect if we're running in a development environment
 *
 * Detection strategy (in order of priority):
 * 1. ENVIRONMENT env var set to 'development' (explicit, from wrangler.toml vars)
 * 2. NODE_ENV set to 'development' (standard Node.js convention)
 * 3. Running in workerd local (heuristic: no CF-* headers available)
 *
 * @returns true if development, false if production
 */
function detectDevEnvironment(): boolean {
  // Return cached result if available
  if (cachedIsDev !== null) {
    return cachedIsDev
  }

  // Strategy 1: Check ENVIRONMENT var (most reliable when set in wrangler.toml)
  // This is the recommended approach - set [vars] ENVIRONMENT = "development" in wrangler.toml
  if (typeof globalThis !== 'undefined') {
    // Check if we have access to a global env object (some setups expose this)
    const g = globalThis as { ENVIRONMENT?: string }
    if (g.ENVIRONMENT === 'development') {
      cachedIsDev = true
      return true
    }
    if (g.ENVIRONMENT === 'production') {
      cachedIsDev = false
      return false
    }
  }

  // Strategy 2: Check process.env (Node.js environments, tests)
  if (typeof process !== 'undefined' && process.env) {
    if (process.env.ENVIRONMENT === 'development' || process.env.NODE_ENV === 'development') {
      cachedIsDev = true
      return true
    }
    if (process.env.ENVIRONMENT === 'production' || process.env.NODE_ENV === 'production') {
      cachedIsDev = false
      return false
    }
  }

  // Strategy 3: Heuristic - assume local if not explicitly production
  // In Cloudflare production, ENVIRONMENT should be set to 'production' in wrangler.toml
  // Local wrangler dev typically has ENVIRONMENT = 'development'
  // If neither is set, we assume development for safety (better to have readable logs locally)
  cachedIsDev = true
  return true
}

/**
 * Reset environment detection cache (useful for testing)
 */
export function resetEnvironmentCache(): void {
  cachedIsDev = null
}

// ============================================================================
// Logger Implementation
// ============================================================================

/**
 * Structured logger with automatic format switching
 *
 * In development: Outputs readable, colored logs like Wrangler
 * In production: Outputs structured JSON for Cloudflare Workers Logs
 *
 * @example
 * // Development output:
 * // [conductor:inf] Server started on port 8787
 * // [conductor:wrn] Rate limit approaching  (requests=95, limit=100)
 *
 * // Production output (JSON):
 * // {"timestamp":"...","level":"info","message":"Server started on port 8787"}
 */
export class ConductorLogger implements Logger {
  private readonly config: Required<LoggerConfig> & { outputFormat: LogOutputFormat }
  private readonly baseContext: Readonly<LogContext>
  private readonly analyticsEngine?: AnalyticsEngineDataset

  constructor(
    config: LoggerConfig = {},
    analyticsEngine?: AnalyticsEngineDataset,
    baseContext: LogContext = {}
  ) {
    // Detect debug mode from multiple sources
    const globalDebug =
      typeof globalThis !== 'undefined' && 'DEBUG' in globalThis
        ? (globalThis as { DEBUG?: boolean }).DEBUG === true
        : false
    const processDebug = typeof process !== 'undefined' && process.env?.DEBUG === 'true'
    const isDebug = config.debug ?? (processDebug || globalDebug)

    // Determine output format (explicit config takes precedence)
    const isDev = detectDevEnvironment()
    const outputFormat: LogOutputFormat = config.outputFormat ?? (isDev ? 'pretty' : 'json')

    this.config = {
      level: config.level ?? (isDebug ? LogLevelEnum.DEBUG : LogLevelEnum.INFO),
      serviceName: config.serviceName ?? 'conductor',
      environment: config.environment ?? (isDev ? 'development' : 'production'),
      debug: isDebug,
      enableAnalytics: config.enableAnalytics ?? true,
      baseContext: config.baseContext ?? {},
      outputFormat,
    }

    this.baseContext = Object.freeze({ ...this.config.baseContext, ...baseContext })
    this.analyticsEngine = analyticsEngine
  }

  /**
   * Check if a log level should be output based on configured minimum
   */
  private shouldLog(level: LogLevel): boolean {
    return LOG_LEVEL_PRIORITY[level] >= LOG_LEVEL_PRIORITY[this.config.level]
  }

  /**
   * Type guard for ConductorError
   */
  private isConductorError(error: Error): error is ConductorError {
    return 'code' in error && 'toJSON' in error
  }

  /**
   * Create a structured log entry from components
   */
  private createLogEntry(
    level: LogLevel,
    message: string,
    context?: LogContext,
    error?: Error
  ): LogEntry {
    const mergedContext = { ...this.baseContext, ...context }
    const hasContext = Object.keys(mergedContext).length > 0

    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      ...(hasContext && { context: mergedContext }),
    }

    if (error) {
      entry.error = {
        name: error.name,
        message: error.message,
        stack: error.stack,
        // Include ConductorError fields if available
        ...(this.isConductorError(error) && {
          code: error.code,
          details: error.details,
        }),
      }
    }

    return entry
  }

  /**
   * Output a log entry to the console
   *
   * Uses the appropriate console method for the severity level,
   * which helps with filtering in browser dev tools and Wrangler output.
   */
  private log(entry: LogEntry): void {
    if (!this.shouldLog(entry.level)) {
      return
    }

    // Format based on configuration
    const output =
      this.config.outputFormat === 'pretty'
        ? formatPretty(entry, this.config.serviceName)
        : formatJSON(entry)

    // Use appropriate console method for severity
    // This affects icon/styling in browser dev tools and Wrangler output
    switch (entry.level) {
      case LogLevelEnum.DEBUG:
        console.debug(output)
        break
      case LogLevelEnum.INFO:
        console.info(output)
        break
      case LogLevelEnum.WARN:
        console.warn(output)
        break
      case LogLevelEnum.ERROR:
        console.error(output)
        break
    }
  }

  // ============================================================================
  // Public API
  // ============================================================================

  /**
   * Log debug information
   *
   * Only output when DEBUG=true or log level is DEBUG.
   * Useful for development and troubleshooting.
   */
  debug(message: string, context?: LogContext): void {
    this.log(this.createLogEntry(LogLevelEnum.DEBUG, message, context))
  }

  /**
   * Log informational message
   *
   * Use for normal operational events worth tracking.
   */
  info(message: string, context?: LogContext): void {
    this.log(this.createLogEntry(LogLevelEnum.INFO, message, context))
  }

  /**
   * Log warning
   *
   * Use for concerning but non-critical issues.
   */
  warn(message: string, context?: LogContext): void {
    this.log(this.createLogEntry(LogLevelEnum.WARN, message, context))
  }

  /**
   * Log error
   *
   * Use for errors that need attention.
   * Includes full error details and stack trace.
   */
  error(message: string, error?: Error, context?: LogContext): void {
    this.log(this.createLogEntry(LogLevelEnum.ERROR, message, context, error))
  }

  /**
   * Create child logger with additional context
   *
   * Returns a new logger that includes the specified context in all logs.
   * Useful for adding request-specific or execution-specific context.
   *
   * @example
   * const requestLogger = logger.child({ requestId: '123', userId: 'alice' });
   * requestLogger.info('Processing request'); // Includes requestId and userId
   */
  child(context: LogContext): Logger {
    return new ConductorLogger(this.config, this.analyticsEngine, {
      ...this.baseContext,
      ...context,
    })
  }

  /**
   * Record metric to Analytics Engine
   *
   * Analytics Engine provides unlimited-cardinality analytics at scale.
   * Use for high-volume metrics that need SQL querying.
   *
   * @example
   * logger.metric('ensemble.execution', {
   *   blobs: ['user-workflow', 'completed'],
   *   doubles: [1234], // duration in ms
   *   indexes: ['ensemble.execution']
   * });
   */
  metric(name: string, data: MetricDataPoint): void {
    if (!this.config.enableAnalytics || !this.analyticsEngine) {
      return
    }

    try {
      this.analyticsEngine.writeDataPoint({
        blobs: data.blobs ?? [],
        doubles: data.doubles ?? [],
        indexes: data.indexes ?? [name],
      })
    } catch (error) {
      // Don't let metrics failures crash the application
      this.warn('Failed to write metric', {
        metricName: name,
        error: error instanceof Error ? error.message : 'Unknown error',
      })
    }
  }
}

// ============================================================================
// Factory Functions
// ============================================================================

/**
 * Create a logger instance
 *
 * @example
 * // Basic usage (auto-detects format)
 * const logger = createLogger();
 *
 * // With config
 * const logger = createLogger({
 *   level: LogLevel.DEBUG,
 *   serviceName: 'my-service',
 *   outputFormat: 'pretty', // or 'json'
 * });
 *
 * // With Analytics Engine
 * const logger = createLogger({ ... }, env.ANALYTICS);
 */
export function createLogger(
  config: LoggerConfig = {},
  analyticsEngine?: AnalyticsEngineDataset
): Logger {
  return new ConductorLogger(config, analyticsEngine)
}

// ============================================================================
// Global Logger
// ============================================================================

/**
 * Global logger instance
 *
 * Can be used for simple logging without dependency injection.
 * For most use cases, prefer passing Logger through constructors.
 */
let globalLogger: Logger | null = null

/**
 * Set global logger instance
 */
export function setGlobalLogger(logger: Logger): void {
  globalLogger = logger
}

/**
 * Get global logger instance
 *
 * Creates a default logger if none exists.
 */
export function getGlobalLogger(): Logger {
  if (!globalLogger) {
    globalLogger = createLogger()
  }
  return globalLogger
}
