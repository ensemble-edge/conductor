/**
 * OpenTelemetry Integration (Optional)
 *
 * Provides compatibility with OpenTelemetry for teams using:
 * - Datadog
 * - New Relic
 * - Honeycomb
 * - Langfuse
 * - Other OTLP-compatible platforms
 *
 * Note: OpenTelemetry has significant overhead. Use only when you need
 * integration with external observability platforms. For Cloudflare-native
 * deployments, use the standard Logger which integrates with Workers Logs.
 */
import type { Logger, LoggerConfig, LogContext, MetricDataPoint } from './types.js';
/**
 * OpenTelemetry configuration
 */
export interface OpenTelemetryConfig {
    /**
     * OTLP exporter endpoint
     * @example 'https://api.honeycomb.io'
     */
    exporterUrl: string;
    /**
     * Service name for traces
     */
    serviceName: string;
    /**
     * Sampling rate (0.0 to 1.0)
     * @default 1.0 (sample everything)
     */
    samplingRate?: number;
    /**
     * Custom headers for authentication
     * @example { 'x-honeycomb-team': 'YOUR_API_KEY' }
     */
    headers?: Record<string, string>;
    /**
     * Enable console logging alongside OTLP export
     * @default true
     */
    enableConsoleLogging?: boolean;
}
/**
 * OpenTelemetry-compatible logger
 *
 * This is a lightweight implementation that sends traces and logs
 * to an OTLP-compatible endpoint. For full OpenTelemetry support,
 * consider using @opentelemetry/api and related packages.
 *
 * Note: This adds ~50-100ms latency to requests due to external calls.
 */
export declare class OpenTelemetryLogger implements Logger {
    private readonly config;
    private readonly loggerConfig;
    private readonly baseContext;
    constructor(config: OpenTelemetryConfig, loggerConfig?: LoggerConfig, baseContext?: LogContext);
    /**
     * Send log/trace to OTLP endpoint
     */
    private sendToOTLP;
    /**
     * Convert LogLevel to OTLP severity number
     */
    private getSeverityNumber;
    /**
     * Convert context to OTLP attributes
     */
    private contextToAttributes;
    /**
     * Convert value to OTLP format
     */
    private valueToOTLP;
    /**
     * Type guard for ConductorError
     */
    private isConductorError;
    /**
     * Log to console (fallback/parallel logging)
     */
    private logToConsole;
    debug(message: string, context?: LogContext): void;
    info(message: string, context?: LogContext): void;
    warn(message: string, context?: LogContext): void;
    error(message: string, error?: Error, context?: LogContext): void;
    child(context: LogContext): Logger;
    /**
     * Metrics not supported in this lightweight implementation
     * Consider using @opentelemetry/api-metrics for full support
     */
    metric(name: string, data: MetricDataPoint): void;
}
/**
 * Create OpenTelemetry-compatible logger
 *
 * @example
 * const logger = createOpenTelemetryLogger({
 *   exporterUrl: 'https://api.honeycomb.io',
 *   serviceName: 'conductor',
 *   headers: {
 *     'x-honeycomb-team': process.env.HONEYCOMB_API_KEY
 *   }
 * });
 */
export declare function createOpenTelemetryLogger(config: OpenTelemetryConfig, loggerConfig?: LoggerConfig): Logger;
//# sourceMappingURL=opentelemetry.d.ts.map