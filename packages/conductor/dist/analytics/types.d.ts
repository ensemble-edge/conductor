/**
 * Analytics Types
 *
 * Types for Workers Analytics Engine integration.
 * Analytics is for aggregated metrics (counts, rates, costs) - not debugging traces.
 */
/**
 * Data point structure for Analytics Engine
 * Matches Cloudflare's writeDataPoint() format
 */
export interface TelemetryDataPoint {
    /** String fields (up to 20) */
    blobs?: string[];
    /** Numeric fields (up to 20) */
    doubles?: number[];
    /** Index field for fast filtering (1 per event) */
    indexes?: string[];
}
/**
 * Standard telemetry event schema for agent invocations
 *
 * This standardized layout enables cross-project querying:
 * - blob1: agent_name
 * - blob2: status (success/error/timeout)
 * - blob3: environment (prod/staging/latest)
 * - blob4: error_type (if failed) or user_id
 * - double1: duration_ms
 * - double2: input_tokens
 * - double3: output_tokens
 * - double4: estimated_cost_usd
 * - index1: project_id
 */
export interface AgentTelemetryEvent {
    /** Agent name */
    agentName: string;
    /** Execution status */
    status: 'success' | 'error' | 'timeout';
    /** Environment */
    environment?: string;
    /** Error type (if failed) */
    errorType?: string;
    /** User ID (if available) */
    userId?: string;
    /** Duration in milliseconds */
    durationMs: number;
    /** Input tokens used */
    inputTokens?: number;
    /** Output tokens generated */
    outputTokens?: number;
    /** Estimated cost in USD */
    costUsd?: number;
    /** Project ID for filtering */
    projectId?: string;
}
/**
 * Standard telemetry event schema for ensemble executions
 */
export interface EnsembleTelemetryEvent {
    /** Ensemble name */
    ensembleName: string;
    /** Execution status */
    status: 'success' | 'error' | 'timeout';
    /** Environment */
    environment?: string;
    /** Error type (if failed) */
    errorType?: string;
    /** Trigger type (http, cron, queue, etc.) */
    triggerType?: string;
    /** Duration in milliseconds */
    durationMs: number;
    /** Number of agents executed */
    agentCount?: number;
    /** Total input tokens across all agents */
    totalInputTokens?: number;
    /** Total output tokens across all agents */
    totalOutputTokens?: number;
    /** Total estimated cost in USD */
    totalCostUsd?: number;
    /** Project ID for filtering */
    projectId?: string;
}
/**
 * Telemetry emitter interface
 *
 * Used by agents to emit custom telemetry events.
 * Events are non-blocking and failures don't affect the main execution.
 */
export interface TelemetryEmitter {
    /**
     * Emit a raw telemetry event to the configured dataset
     *
     * @param event - Data point with blobs, doubles, and indexes
     *
     * @example
     * ```typescript
     * telemetry.emit({
     *   blobs: ['document-extraction', 'pdf', 'success'],
     *   doubles: [confidence, processingTime],
     *   indexes: [projectId],
     * })
     * ```
     */
    emit(event: TelemetryDataPoint): void;
    /**
     * Emit a standardized agent telemetry event
     *
     * @param event - Agent execution event
     */
    emitAgentEvent(event: AgentTelemetryEvent): void;
    /**
     * Emit a standardized ensemble telemetry event
     *
     * @param event - Ensemble execution event
     */
    emitEnsembleEvent(event: EnsembleTelemetryEvent): void;
    /**
     * Emit a custom business event
     *
     * @param eventName - Name of the event (blob1)
     * @param dimensions - String dimensions (blob2-20)
     * @param metrics - Numeric metrics (double1-20)
     * @param index - Index for filtering
     *
     * @example
     * ```typescript
     * telemetry.emitCustom('order_placed', {
     *   dimensions: { category: 'electronics', region: 'us-west' },
     *   metrics: { amount: 99.99, itemCount: 3 },
     *   index: customerId,
     * })
     * ```
     */
    emitCustom(eventName: string, options: {
        dimensions?: Record<string, string>;
        metrics?: Record<string, number>;
        index?: string;
    }): void;
}
/**
 * Instrumentation configuration
 *
 * Controls what gets automatically tracked.
 */
export interface InstrumentationConfig {
    /** Master switch for auto-instrumentation */
    enabled?: boolean;
    /** Dataset name for telemetry (from config.analytics.datasets) */
    dataset?: string;
    /** Track every agent invocation */
    agents?: boolean;
    /** Track every ensemble execution */
    ensembles?: boolean;
    /** Track individual steps within ensembles (verbose) */
    steps?: boolean;
    /** Track errors with categorization */
    errors?: boolean;
    /** Log telemetry to console in dev mode */
    console?: boolean;
}
/**
 * Analytics dataset configuration
 */
export interface AnalyticsDatasetConfig {
    /** CF Analytics Engine binding name */
    dataset: string;
}
/**
 * Analytics configuration
 *
 * Top-level analytics config for ensemble.config.ts
 */
export interface AnalyticsConfig {
    /** Named datasets for different telemetry types */
    datasets?: Record<string, AnalyticsDatasetConfig>;
    /** Auto-instrumentation settings */
    instrumentation?: InstrumentationConfig;
}
/**
 * Default instrumentation config
 */
export declare const DEFAULT_INSTRUMENTATION_CONFIG: Required<InstrumentationConfig>;
/**
 * Telemetry operation config for YAML agents
 */
export interface TelemetryOperationConfig {
    /** Dataset to write to */
    dataset?: string;
}
/**
 * Telemetry operation input
 */
export interface TelemetryOperationInput {
    /** String fields (up to 20) */
    blobs?: string[];
    /** Numeric fields (up to 20) */
    doubles?: number[];
    /** Index field for filtering */
    indexes?: string[];
}
/**
 * Telemetry operation output
 */
export interface TelemetryOperationOutput {
    success: boolean;
    timestamp: number;
}
//# sourceMappingURL=types.d.ts.map