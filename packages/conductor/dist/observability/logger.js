/**
 * Structured Logger for Cloudflare Workers
 *
 * Follows Cloudflare Workers Observability best practices (2025):
 * - Uses console.log() for automatic capture by Workers Logs
 * - Outputs structured JSON for automatic field extraction/indexing
 * - Integrates with Analytics Engine for metrics
 * - Supports debug mode via DEBUG environment variable
 * - Thread-safe and immutable context management
 *
 * @see https://developers.cloudflare.com/workers/observability/
 */
import { LogLevel as LogLevelEnum } from './types.js';
/**
 * Log level hierarchy for comparison
 */
const LOG_LEVEL_PRIORITY = {
    [LogLevelEnum.DEBUG]: 0,
    [LogLevelEnum.INFO]: 1,
    [LogLevelEnum.WARN]: 2,
    [LogLevelEnum.ERROR]: 3,
};
/**
 * Structured logger implementation
 *
 * Uses console.log() which is automatically captured by Cloudflare Workers Logs.
 * Outputs JSON for automatic field extraction and indexing in the dashboard.
 */
export class ConductorLogger {
    constructor(config = {}, analyticsEngine, baseContext = {}) {
        // Detect debug mode from environment or config
        // Use type-safe access to globalThis DEBUG flag
        const globalDebug = typeof globalThis !== 'undefined' && 'DEBUG' in globalThis
            ? globalThis.DEBUG === true
            : false;
        const isDebug = config.debug ??
            ((typeof process !== 'undefined' && process.env?.DEBUG === 'true') || globalDebug);
        this.config = {
            level: config.level ?? (isDebug ? LogLevelEnum.DEBUG : LogLevelEnum.INFO),
            serviceName: config.serviceName ?? 'conductor',
            environment: config.environment ?? 'production',
            debug: isDebug,
            enableAnalytics: config.enableAnalytics ?? true,
            baseContext: config.baseContext ?? {},
        };
        this.baseContext = Object.freeze({ ...this.config.baseContext, ...baseContext });
        this.analyticsEngine = analyticsEngine;
    }
    /**
     * Check if a log level should be output
     */
    shouldLog(level) {
        return LOG_LEVEL_PRIORITY[level] >= LOG_LEVEL_PRIORITY[this.config.level];
    }
    /**
     * Create structured log entry
     */
    createLogEntry(level, message, context, error) {
        const entry = {
            timestamp: new Date().toISOString(),
            level,
            message,
            ...(Object.keys({ ...this.baseContext, ...context }).length > 0 && {
                context: { ...this.baseContext, ...context },
            }),
        };
        // Add error details if present
        if (error) {
            entry.error = {
                name: error.name,
                message: error.message,
                stack: error.stack,
                // Include ConductorError specific fields
                ...(this.isConductorError(error) && {
                    code: error.code,
                    details: error.details,
                }),
            };
        }
        return entry;
    }
    /**
     * Type guard for ConductorError
     */
    isConductorError(error) {
        return 'code' in error && 'toJSON' in error;
    }
    /**
     * Output log entry via console
     *
     * Cloudflare Workers Logs automatically captures console output
     * and indexes JSON fields for querying in the dashboard.
     */
    log(entry) {
        if (!this.shouldLog(entry.level)) {
            return;
        }
        // Output as structured JSON
        // Cloudflare Workers Logs will automatically parse and index this
        const logOutput = JSON.stringify(entry);
        // Use appropriate console method for severity
        switch (entry.level) {
            case LogLevelEnum.DEBUG:
                console.debug(logOutput);
                break;
            case LogLevelEnum.INFO:
                console.info(logOutput);
                break;
            case LogLevelEnum.WARN:
                console.warn(logOutput);
                break;
            case LogLevelEnum.ERROR:
                console.error(logOutput);
                break;
        }
    }
    /**
     * Log debug information
     *
     * Only output when DEBUG=true or log level is DEBUG.
     * Useful for development and troubleshooting.
     */
    debug(message, context) {
        const entry = this.createLogEntry(LogLevelEnum.DEBUG, message, context);
        this.log(entry);
    }
    /**
     * Log informational message
     *
     * Use for normal operational events worth tracking.
     */
    info(message, context) {
        const entry = this.createLogEntry(LogLevelEnum.INFO, message, context);
        this.log(entry);
    }
    /**
     * Log warning
     *
     * Use for concerning but non-critical issues.
     */
    warn(message, context) {
        const entry = this.createLogEntry(LogLevelEnum.WARN, message, context);
        this.log(entry);
    }
    /**
     * Log error
     *
     * Use for errors that need attention.
     * Includes full error details and stack trace.
     */
    error(message, error, context) {
        const entry = this.createLogEntry(LogLevelEnum.ERROR, message, context, error);
        this.log(entry);
    }
    /**
     * Create child logger with additional context
     *
     * Useful for adding request-specific or execution-specific context
     * that applies to all logs within a scope.
     *
     * @example
     * const requestLogger = logger.child({ requestId: '123', userId: 'alice' });
     * requestLogger.info('Processing request'); // Includes requestId and userId
     */
    child(context) {
        return new ConductorLogger(this.config, this.analyticsEngine, {
            ...this.baseContext,
            ...context,
        });
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
    metric(name, data) {
        if (!this.config.enableAnalytics || !this.analyticsEngine) {
            return;
        }
        try {
            this.analyticsEngine.writeDataPoint({
                blobs: data.blobs ?? [],
                doubles: data.doubles ?? [],
                indexes: data.indexes ?? [name],
            });
        }
        catch (error) {
            // Don't let metrics failures crash the application
            // Log the error but continue
            this.warn('Failed to write metric', {
                metricName: name,
                error: error instanceof Error ? error.message : 'Unknown error',
            });
        }
    }
}
/**
 * Create a logger instance
 *
 * @example
 * // Basic usage
 * const logger = createLogger();
 *
 * // With config
 * const logger = createLogger({
 *   level: LogLevel.DEBUG,
 *   serviceName: 'my-service',
 *   environment: 'development'
 * });
 *
 * // With Analytics Engine
 * const logger = createLogger({ ... }, env.ANALYTICS);
 */
export function createLogger(config = {}, analyticsEngine) {
    return new ConductorLogger(config, analyticsEngine);
}
/**
 * Global logger instance
 *
 * Can be used for simple logging without passing logger around.
 * For most use cases, prefer dependency injection of Logger.
 */
let globalLogger = null;
/**
 * Set global logger instance
 */
export function setGlobalLogger(logger) {
    globalLogger = logger;
}
/**
 * Get global logger instance
 *
 * Creates a default logger if none exists.
 */
export function getGlobalLogger() {
    if (!globalLogger) {
        globalLogger = createLogger();
    }
    return globalLogger;
}
