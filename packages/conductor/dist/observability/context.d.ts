/**
 * Observability Context Management
 *
 * Handles execution context propagation for logging and metrics.
 * Provides scoped loggers and metrics recorders that automatically
 * include request/execution context.
 */
import type { Logger } from './types.js';
import type { ObservabilityConfig, LogEventType, MetricType } from '../config/types.js';
import { LogLevel } from './types.js';
/**
 * Default redaction patterns
 */
export declare const DEFAULT_REDACT_PATTERNS: string[];
/**
 * Default log events to track
 */
export declare const DEFAULT_LOG_EVENTS: LogEventType[];
/**
 * Default metric types to track
 */
export declare const DEFAULT_METRIC_TYPES: MetricType[];
/**
 * Resolved observability configuration with defaults applied
 */
export interface ResolvedObservabilityConfig {
    logging: {
        enabled: boolean;
        level: LogLevel;
        format: 'json' | 'pretty';
        context: string[];
        redact: string[];
        events: Set<LogEventType>;
    };
    metrics: {
        enabled: boolean;
        binding: string;
        track: Set<MetricType>;
        dimensions: string[];
    };
    opentelemetry: {
        enabled: boolean;
        endpoint?: string;
        headers?: Record<string, string>;
        samplingRate: number;
    };
    trackTokenUsage: boolean;
}
/**
 * Resolve observability config with defaults
 */
export declare function resolveObservabilityConfig(config?: ObservabilityConfig): ResolvedObservabilityConfig;
/**
 * Generate a unique execution ID
 */
export declare function generateExecutionId(): string;
/**
 * Generate a unique request ID
 */
export declare function generateRequestId(): string;
/**
 * Execution context for observability
 * Contains all context needed for logging and metrics
 */
export interface ExecutionObservabilityContext {
    /** Unique request ID (from HTTP request) */
    requestId: string;
    /** Unique execution ID (for ensemble execution) */
    executionId: string;
    /** Ensemble name being executed */
    ensembleName?: string;
    /** Current agent name */
    agentName?: string;
    /** Current step index in the flow */
    stepIndex?: number;
    /** User ID (if authenticated) */
    userId?: string;
    /** Session ID */
    sessionId?: string;
    /** Environment name */
    environment?: string;
    /** Custom dimensions */
    [key: string]: unknown;
}
/**
 * Metrics recorder for Analytics Engine
 */
export interface MetricsRecorder {
    /**
     * Record a metric to Analytics Engine
     */
    record(name: string, value: number, dimensions?: Record<string, string>): void;
    /**
     * Record ensemble execution metric
     */
    recordEnsembleExecution(ensembleName: string, durationMs: number, success: boolean): void;
    /**
     * Record agent execution metric
     */
    recordAgentExecution(agentName: string, durationMs: number, success: boolean, cached?: boolean): void;
    /**
     * Record HTTP request metric
     */
    recordHttpRequest(method: string, path: string, statusCode: number, durationMs: number): void;
    /**
     * Record error metric
     */
    recordError(errorType: string, errorCode?: string): void;
    /**
     * Record cache performance metric
     */
    recordCachePerformance(hit: boolean, agentName?: string): void;
}
/**
 * Create a metrics recorder that writes to Analytics Engine
 */
export declare function createMetricsRecorder(analyticsEngine: AnalyticsEngineDataset | undefined, config: ResolvedObservabilityConfig, baseContext: ExecutionObservabilityContext): MetricsRecorder;
/**
 * Redact sensitive fields from an object
 */
export declare function redactSensitiveFields(obj: Record<string, unknown>, patterns: string[]): Record<string, unknown>;
/**
 * Create a scoped logger for execution context
 */
export declare function createScopedLogger(config: ResolvedObservabilityConfig, context: ExecutionObservabilityContext, analyticsEngine?: AnalyticsEngineDataset): Logger;
/**
 * Observability manager for a single request/execution
 */
export declare class ObservabilityManager {
    private config;
    private context;
    private logger;
    private metrics;
    private analyticsEngine?;
    constructor(config: ObservabilityConfig | undefined, initialContext: Partial<ExecutionObservabilityContext>, analyticsEngine?: AnalyticsEngineDataset);
    /**
     * Get the current logger
     */
    getLogger(): Logger;
    /**
     * Get the metrics recorder
     */
    getMetrics(): MetricsRecorder;
    /**
     * Get the current execution context
     */
    getContext(): ExecutionObservabilityContext;
    /**
     * Get the resolved config
     */
    getConfig(): ResolvedObservabilityConfig;
    /**
     * Check if a log event should be logged
     */
    shouldLogEvent(event: LogEventType): boolean;
    /**
     * Check if a metric type should be tracked
     */
    shouldTrackMetric(type: MetricType): boolean;
    /**
     * Create a child manager with additional context (e.g., for an agent)
     */
    forAgent(agentName: string, stepIndex?: number): ObservabilityManager;
    /**
     * Create a child manager for an ensemble
     */
    forEnsemble(ensembleName: string, executionId?: string): ObservabilityManager;
    /**
     * Redact sensitive fields from data
     */
    redact(data: Record<string, unknown>): Record<string, unknown>;
}
/**
 * Create an observability manager
 */
export declare function createObservabilityManager(config?: ObservabilityConfig, initialContext?: Partial<ExecutionObservabilityContext>, analyticsEngine?: AnalyticsEngineDataset): ObservabilityManager;
//# sourceMappingURL=context.d.ts.map