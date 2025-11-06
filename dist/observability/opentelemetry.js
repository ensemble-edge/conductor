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
import { LogLevel } from './types.js';
/**
 * OpenTelemetry-compatible logger
 *
 * This is a lightweight implementation that sends traces and logs
 * to an OTLP-compatible endpoint. For full OpenTelemetry support,
 * consider using @opentelemetry/api and related packages.
 *
 * Note: This adds ~50-100ms latency to requests due to external calls.
 */
export class OpenTelemetryLogger {
    constructor(config, loggerConfig = {}, baseContext = {}) {
        this.config = {
            exporterUrl: config.exporterUrl,
            serviceName: config.serviceName,
            samplingRate: config.samplingRate ?? 1.0,
            headers: config.headers ?? {},
            enableConsoleLogging: config.enableConsoleLogging ?? true,
        };
        this.loggerConfig = {
            level: loggerConfig.level ?? LogLevel.INFO,
            serviceName: loggerConfig.serviceName ?? 'conductor',
            environment: loggerConfig.environment ?? 'production',
            debug: loggerConfig.debug ?? false,
            enableAnalytics: loggerConfig.enableAnalytics ?? false,
        };
        this.baseContext = Object.freeze(baseContext);
    }
    /**
     * Send log/trace to OTLP endpoint
     */
    async sendToOTLP(level, message, context, error) {
        // Apply sampling
        if (Math.random() > this.config.samplingRate) {
            return;
        }
        const payload = {
            resourceLogs: [
                {
                    resource: {
                        attributes: [
                            { key: 'service.name', value: { stringValue: this.config.serviceName } },
                            {
                                key: 'service.environment',
                                value: { stringValue: this.loggerConfig.environment },
                            },
                        ],
                    },
                    scopeLogs: [
                        {
                            scope: {
                                name: this.loggerConfig.serviceName,
                                version: '1.0.0',
                            },
                            logRecords: [
                                {
                                    timeUnixNano: String(Date.now() * 1_000_000),
                                    severityText: level.toUpperCase(),
                                    severityNumber: this.getSeverityNumber(level),
                                    body: {
                                        stringValue: message,
                                    },
                                    attributes: [
                                        ...this.contextToAttributes({ ...this.baseContext, ...context }),
                                        ...(error
                                            ? [
                                                { key: 'error.name', value: { stringValue: error.name } },
                                                { key: 'error.message', value: { stringValue: error.message } },
                                                ...(error.stack
                                                    ? [{ key: 'error.stack', value: { stringValue: error.stack } }]
                                                    : []),
                                                ...(this.isConductorError(error)
                                                    ? [
                                                        { key: 'error.code', value: { stringValue: error.code } },
                                                        {
                                                            key: 'error.details',
                                                            value: { stringValue: JSON.stringify(error.details) },
                                                        },
                                                    ]
                                                    : []),
                                            ]
                                            : []),
                                    ],
                                },
                            ],
                        },
                    ],
                },
            ],
        };
        try {
            await fetch(`${this.config.exporterUrl}/v1/logs`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...this.config.headers,
                },
                body: JSON.stringify(payload),
            });
        }
        catch (err) {
            // Don't let OTLP failures crash the application
            // Fall back to console logging
            if (this.config.enableConsoleLogging) {
                console.error('Failed to send logs to OTLP endpoint:', err);
            }
        }
    }
    /**
     * Convert LogLevel to OTLP severity number
     */
    getSeverityNumber(level) {
        switch (level) {
            case LogLevel.DEBUG:
                return 5; // DEBUG
            case LogLevel.INFO:
                return 9; // INFO
            case LogLevel.WARN:
                return 13; // WARN
            case LogLevel.ERROR:
                return 17; // ERROR
            default:
                return 0; // UNSPECIFIED
        }
    }
    /**
     * Convert context to OTLP attributes
     */
    contextToAttributes(context) {
        if (!context)
            return [];
        return Object.entries(context).map(([key, value]) => ({
            key,
            value: this.valueToOTLP(value),
        }));
    }
    /**
     * Convert value to OTLP format
     */
    valueToOTLP(value) {
        if (typeof value === 'string') {
            return { stringValue: value };
        }
        else if (typeof value === 'number') {
            return Number.isInteger(value) ? { intValue: value } : { doubleValue: value };
        }
        else if (typeof value === 'boolean') {
            return { boolValue: value };
        }
        else {
            return { stringValue: JSON.stringify(value) };
        }
    }
    /**
     * Type guard for ConductorError
     */
    isConductorError(error) {
        return 'code' in error && 'toJSON' in error;
    }
    /**
     * Log to console (fallback/parallel logging)
     */
    logToConsole(level, message, context, error) {
        if (!this.config.enableConsoleLogging) {
            return;
        }
        const logData = {
            timestamp: new Date().toISOString(),
            level,
            message,
            ...(context && { context: { ...this.baseContext, ...context } }),
            ...(error && {
                error: {
                    name: error.name,
                    message: error.message,
                    stack: error.stack,
                },
            }),
        };
        const logOutput = JSON.stringify(logData);
        switch (level) {
            case LogLevel.DEBUG:
                console.debug(logOutput);
                break;
            case LogLevel.INFO:
                console.info(logOutput);
                break;
            case LogLevel.WARN:
                console.warn(logOutput);
                break;
            case LogLevel.ERROR:
                console.error(logOutput);
                break;
        }
    }
    debug(message, context) {
        this.logToConsole(LogLevel.DEBUG, message, context);
        void this.sendToOTLP(LogLevel.DEBUG, message, context);
    }
    info(message, context) {
        this.logToConsole(LogLevel.INFO, message, context);
        void this.sendToOTLP(LogLevel.INFO, message, context);
    }
    warn(message, context) {
        this.logToConsole(LogLevel.WARN, message, context);
        void this.sendToOTLP(LogLevel.WARN, message, context);
    }
    error(message, error, context) {
        this.logToConsole(LogLevel.ERROR, message, context, error);
        void this.sendToOTLP(LogLevel.ERROR, message, context, error);
    }
    child(context) {
        return new OpenTelemetryLogger(this.config, this.loggerConfig, {
            ...this.baseContext,
            ...context,
        });
    }
    /**
     * Metrics not supported in this lightweight implementation
     * Consider using @opentelemetry/api-metrics for full support
     */
    metric(name, data) {
        // Not implemented in lightweight version
        // Use Cloudflare Analytics Engine or full OpenTelemetry SDK
        this.warn('Metrics not supported in lightweight OpenTelemetry implementation', {
            metricName: name,
        });
    }
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
export function createOpenTelemetryLogger(config, loggerConfig) {
    return new OpenTelemetryLogger(config, loggerConfig);
}
