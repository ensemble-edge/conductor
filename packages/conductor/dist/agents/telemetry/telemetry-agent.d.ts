/**
 * Telemetry Agent
 *
 * Emits telemetry events to Cloudflare Analytics Engine.
 * Used for custom business metrics in YAML-defined agents/ensembles.
 */
import { BaseAgent } from '../base-agent.js';
import type { AgentExecutionContext } from '../base-agent.js';
import type { AgentConfig } from '../../runtime/parser.js';
import type { TelemetryOperationOutput } from '../../analytics/types.js';
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
export declare class TelemetryAgent extends BaseAgent {
    private telemetryConfig;
    constructor(config: AgentConfig);
    protected run(ctx: AgentExecutionContext): Promise<TelemetryOperationOutput>;
}
//# sourceMappingURL=telemetry-agent.d.ts.map