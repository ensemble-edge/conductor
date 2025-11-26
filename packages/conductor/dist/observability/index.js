/**
 * Conductor Observability
 *
 * Production-ready logging, tracing, and metrics for Cloudflare Workers.
 *
 * ## Features
 *
 * - **Structured JSON Logging**: Automatic field extraction in Cloudflare Workers Logs
 * - **Debug Mode**: Set DEBUG=true for verbose logging
 * - **Analytics Engine**: High-cardinality metrics with SQL querying
 * - **OpenTelemetry**: Optional integration with external platforms
 * - **Child Loggers**: Scoped context for request/execution tracking
 *
 * ## Quick Start
 *
 * ```typescript
 * import { createLogger } from './observability.js';
 *
 * // Basic usage
 * const logger = createLogger();
 * logger.info('Application started');
 *
 * // With context
 * const requestLogger = logger.child({ requestId: '123' });
 * requestLogger.info('Processing request');
 *
 * // With metrics
 * const logger = createLogger({}, env.ANALYTICS);
 * logger.metric('request.duration', {
 *   doubles: [123.45],
 *   indexes: ['request.duration']
 * });
 * ```
 *
 * @see https://developers.cloudflare.com/workers/observability/
 */
export { LogLevel } from './types.js';
export { ConductorLogger, createLogger, setGlobalLogger, getGlobalLogger } from './logger.js';
export { OpenTelemetryLogger, createOpenTelemetryLogger } from './opentelemetry.js';
// Context management
export { ObservabilityManager, createObservabilityManager, createScopedLogger, createMetricsRecorder, resolveObservabilityConfig, generateExecutionId, generateRequestId, redactSensitiveFields, DEFAULT_REDACT_PATTERNS, DEFAULT_LOG_EVENTS, DEFAULT_METRIC_TYPES, } from './context.js';
