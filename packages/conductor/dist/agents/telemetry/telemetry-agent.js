/**
 * Telemetry Agent
 *
 * Emits telemetry events to Cloudflare Analytics Engine.
 * Used for custom business metrics in YAML-defined agents/ensembles.
 */
import { BaseAgent } from '../base-agent.js';
import { createTelemetryEmitter } from '../../analytics/telemetry.js';
import { createLogger } from '../../observability/index.js';
const logger = createLogger({ serviceName: 'telemetry-agent' });
/**
 * Telemetry Agent for emitting custom analytics events
 *
 * @example YAML usage:
 * ```yaml
 * agents:
 *   - name: log-extraction
 *     operation: telemetry
 *     config:
 *       dataset: telemetry
 *     input:
 *       blobs:
 *         - document-extraction
 *         - ${extract.output.status}
 *         - ${input.document_type}
 *       doubles:
 *         - ${extract.output.confidence}
 *         - ${context.duration_ms}
 *       indexes:
 *         - ${context.project_id}
 * ```
 */
export class TelemetryAgent extends BaseAgent {
    constructor(config) {
        super(config);
        this.telemetryConfig = (config.config || {});
    }
    async run(ctx) {
        const input = ctx.input;
        // Validate input
        if (!input.blobs && !input.doubles && !input.indexes) {
            logger.warn('Telemetry event has no data', { agentName: this.name });
            return { success: false, timestamp: Date.now() };
        }
        // Get or create telemetry emitter
        const telemetry = ctx.telemetry ??
            createTelemetryEmitter(ctx.env?.ANALYTICS, { enabled: true, console: true }, {});
        // Emit the event
        try {
            telemetry.emit({
                blobs: input.blobs ?? [],
                doubles: input.doubles ?? [],
                indexes: input.indexes ?? [],
            });
            logger.debug('Telemetry event emitted', {
                agentName: this.name,
                blobCount: input.blobs?.length ?? 0,
                doubleCount: input.doubles?.length ?? 0,
            });
            return { success: true, timestamp: Date.now() };
        }
        catch (error) {
            // Telemetry failures should not crash the agent
            logger.warn('Failed to emit telemetry event', {
                agentName: this.name,
                error: error instanceof Error ? error.message : 'Unknown error',
            });
            return { success: false, timestamp: Date.now() };
        }
    }
}
