/**
 * Telemetry Emitter
 *
 * Writes telemetry events to Cloudflare Analytics Engine.
 * Non-blocking - failures don't affect main execution.
 */
import type { TelemetryEmitter, TelemetryDataPoint, InstrumentationConfig } from './types.js';
/**
 * Create a telemetry emitter for Analytics Engine
 *
 * @param analyticsEngine - CF Analytics Engine binding (or undefined for dev/test)
 * @param config - Instrumentation configuration
 * @param baseContext - Base context to include in all events
 */
export declare function createTelemetryEmitter(analyticsEngine: AnalyticsEngineDataset | undefined, config?: InstrumentationConfig, baseContext?: {
    projectId?: string;
    environment?: string;
}): TelemetryEmitter;
/**
 * Create a no-op telemetry emitter for tests
 */
export declare function createNoopTelemetryEmitter(): TelemetryEmitter;
/**
 * Create a capturing telemetry emitter for tests
 * Captures all events for later inspection
 */
export declare function createCapturingTelemetryEmitter(): TelemetryEmitter & {
    getCapturedEvents: () => TelemetryDataPoint[];
    clear: () => void;
};
//# sourceMappingURL=telemetry.d.ts.map