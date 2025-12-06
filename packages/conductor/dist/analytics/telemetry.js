/**
 * Telemetry Emitter
 *
 * Writes telemetry events to Cloudflare Analytics Engine.
 * Non-blocking - failures don't affect main execution.
 */
import { DEFAULT_INSTRUMENTATION_CONFIG } from './types.js';
import { createLogger } from '../observability/index.js';
const logger = createLogger({ serviceName: 'analytics' });
/**
 * Create a telemetry emitter for Analytics Engine
 *
 * @param analyticsEngine - CF Analytics Engine binding (or undefined for dev/test)
 * @param config - Instrumentation configuration
 * @param baseContext - Base context to include in all events
 */
export function createTelemetryEmitter(analyticsEngine, config = {}, baseContext = {}) {
    const resolvedConfig = {
        ...DEFAULT_INSTRUMENTATION_CONFIG,
        ...config,
    };
    const emit = (event) => {
        // If disabled, do nothing
        if (!resolvedConfig.enabled)
            return;
        // Log to console in dev mode
        if (resolvedConfig.console && !analyticsEngine) {
            logToConsole('telemetry', event);
            return;
        }
        // Write to Analytics Engine
        if (analyticsEngine) {
            try {
                analyticsEngine.writeDataPoint({
                    blobs: event.blobs ?? [],
                    doubles: event.doubles ?? [],
                    indexes: event.indexes ?? [],
                });
                // Also log to console if enabled
                if (resolvedConfig.console) {
                    logToConsole('telemetry', event);
                }
            }
            catch (error) {
                // Silently ignore telemetry failures - never crash the app
                logger.debug('Failed to write telemetry', { error });
            }
        }
    };
    const emitAgentEvent = (event) => {
        if (!resolvedConfig.agents)
            return;
        const blobs = [
            event.agentName,
            event.status,
            event.environment ?? baseContext.environment ?? 'unknown',
            event.errorType ?? event.userId ?? 'anonymous',
        ];
        const doubles = [
            event.durationMs,
            event.inputTokens ?? 0,
            event.outputTokens ?? 0,
            event.costUsd ?? 0,
        ];
        const indexes = [event.projectId ?? baseContext.projectId ?? 'default'];
        emit({ blobs, doubles, indexes });
    };
    const emitEnsembleEvent = (event) => {
        if (!resolvedConfig.ensembles)
            return;
        const blobs = [
            event.ensembleName,
            event.status,
            event.environment ?? baseContext.environment ?? 'unknown',
            event.triggerType ?? 'unknown',
            event.errorType ?? '',
        ];
        const doubles = [
            event.durationMs,
            event.agentCount ?? 0,
            event.totalInputTokens ?? 0,
            event.totalOutputTokens ?? 0,
            event.totalCostUsd ?? 0,
        ];
        const indexes = [event.projectId ?? baseContext.projectId ?? 'default'];
        emit({ blobs, doubles, indexes });
    };
    const emitCustom = (eventName, options) => {
        const blobs = [eventName];
        if (options.dimensions) {
            blobs.push(...Object.values(options.dimensions));
        }
        const doubles = options.metrics ? Object.values(options.metrics) : [];
        const indexes = options.index
            ? [options.index]
            : [baseContext.projectId ?? 'default'];
        emit({ blobs, doubles, indexes });
    };
    return {
        emit,
        emitAgentEvent,
        emitEnsembleEvent,
        emitCustom,
    };
}
/**
 * Create a no-op telemetry emitter for tests
 */
export function createNoopTelemetryEmitter() {
    return {
        emit: () => { },
        emitAgentEvent: () => { },
        emitEnsembleEvent: () => { },
        emitCustom: () => { },
    };
}
/**
 * Create a capturing telemetry emitter for tests
 * Captures all events for later inspection
 */
export function createCapturingTelemetryEmitter() {
    const captured = [];
    const emitter = createTelemetryEmitter(undefined, { enabled: true, console: false });
    return {
        emit: (event) => {
            captured.push(event);
        },
        emitAgentEvent: (event) => {
            // Convert to data point and capture
            const blobs = [
                event.agentName,
                event.status,
                event.environment ?? 'unknown',
                event.errorType ?? event.userId ?? 'anonymous',
            ];
            const doubles = [
                event.durationMs,
                event.inputTokens ?? 0,
                event.outputTokens ?? 0,
                event.costUsd ?? 0,
            ];
            const indexes = [event.projectId ?? 'default'];
            captured.push({ blobs, doubles, indexes });
        },
        emitEnsembleEvent: (event) => {
            const blobs = [
                event.ensembleName,
                event.status,
                event.environment ?? 'unknown',
                event.triggerType ?? 'unknown',
                event.errorType ?? '',
            ];
            const doubles = [
                event.durationMs,
                event.agentCount ?? 0,
                event.totalInputTokens ?? 0,
                event.totalOutputTokens ?? 0,
                event.totalCostUsd ?? 0,
            ];
            const indexes = [event.projectId ?? 'default'];
            captured.push({ blobs, doubles, indexes });
        },
        emitCustom: (eventName, options) => {
            const blobs = [eventName, ...(options.dimensions ? Object.values(options.dimensions) : [])];
            const doubles = options.metrics ? Object.values(options.metrics) : [];
            const indexes = options.index ? [options.index] : ['default'];
            captured.push({ blobs, doubles, indexes });
        },
        getCapturedEvents: () => [...captured],
        clear: () => {
            captured.length = 0;
        },
    };
}
/**
 * Format telemetry for console logging
 */
function logToConsole(prefix, event) {
    const parts = [];
    // Format blobs (name=value style for key ones)
    if (event.blobs && event.blobs.length > 0) {
        const [name, status, env, ...rest] = event.blobs;
        if (name)
            parts.push(`name=${name}`);
        if (status)
            parts.push(`status=${status}`);
        if (env && env !== 'unknown')
            parts.push(`env=${env}`);
        if (rest.length > 0) {
            parts.push(`extra=[${rest.filter(Boolean).join(',')}]`);
        }
    }
    // Format key doubles
    if (event.doubles && event.doubles.length > 0) {
        const [duration, tokens1, tokens2, cost] = event.doubles;
        if (duration !== undefined && duration > 0)
            parts.push(`duration=${duration}ms`);
        if (tokens1 !== undefined && tokens1 > 0)
            parts.push(`in_tokens=${tokens1}`);
        if (tokens2 !== undefined && tokens2 > 0)
            parts.push(`out_tokens=${tokens2}`);
        if (cost !== undefined && cost > 0)
            parts.push(`cost=$${cost.toFixed(4)}`);
    }
    console.log(`[${prefix}] ${parts.join(' ')}`);
}
