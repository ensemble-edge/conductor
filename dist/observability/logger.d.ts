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
import type { Logger, LoggerConfig, LogContext, MetricDataPoint } from './types';
/**
 * Structured logger implementation
 *
 * Uses console.log() which is automatically captured by Cloudflare Workers Logs.
 * Outputs JSON for automatic field extraction and indexing in the dashboard.
 */
export declare class ConductorLogger implements Logger {
    private readonly config;
    private readonly baseContext;
    private readonly analyticsEngine?;
    constructor(config?: LoggerConfig, analyticsEngine?: AnalyticsEngineDataset, baseContext?: LogContext);
    /**
     * Check if a log level should be output
     */
    private shouldLog;
    /**
     * Create structured log entry
     */
    private createLogEntry;
    /**
     * Type guard for ConductorError
     */
    private isConductorError;
    /**
     * Output log entry via console
     *
     * Cloudflare Workers Logs automatically captures console output
     * and indexes JSON fields for querying in the dashboard.
     */
    private log;
    /**
     * Log debug information
     *
     * Only output when DEBUG=true or log level is DEBUG.
     * Useful for development and troubleshooting.
     */
    debug(message: string, context?: LogContext): void;
    /**
     * Log informational message
     *
     * Use for normal operational events worth tracking.
     */
    info(message: string, context?: LogContext): void;
    /**
     * Log warning
     *
     * Use for concerning but non-critical issues.
     */
    warn(message: string, context?: LogContext): void;
    /**
     * Log error
     *
     * Use for errors that need attention.
     * Includes full error details and stack trace.
     */
    error(message: string, error?: Error, context?: LogContext): void;
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
    child(context: LogContext): Logger;
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
    metric(name: string, data: MetricDataPoint): void;
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
export declare function createLogger(config?: LoggerConfig, analyticsEngine?: AnalyticsEngineDataset): Logger;
/**
 * Set global logger instance
 */
export declare function setGlobalLogger(logger: Logger): void;
/**
 * Get global logger instance
 *
 * Creates a default logger if none exists.
 */
export declare function getGlobalLogger(): Logger;
//# sourceMappingURL=logger.d.ts.map