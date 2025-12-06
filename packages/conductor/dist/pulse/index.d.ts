/**
 * Conductor Pulse
 *
 * Anonymous usage metrics that help improve Conductor.
 * Sends lightweight signals to pulse.ensemble.ai on Worker cold start.
 *
 * What we collect:
 * - Project ID (random UUID, not identifiable)
 * - Event type (e.g., server.start)
 * - Conductor version
 * - Agent/ensemble/component counts
 * - Country code (from Cloudflare, not your IP)
 *
 * What we DON'T collect:
 * - IP addresses
 * - Project names or file paths
 * - Agent/ensemble names or contents
 * - Prompts, schemas, or any user content
 * - API keys or secrets
 *
 * Opt out via:
 * - config: cloud.pulse = false
 * - env: DO_NOT_TRACK=1
 * - env: CONDUCTOR_PULSE=false
 *
 * @see https://docs.ensemble.ai/pulse
 */
import type { ConductorConfig } from '../config/types.js';
/**
 * Pulse payload sent to the collector
 */
export interface PulsePayload {
    /** Project ID (UUID) */
    pid: string;
    /** Event type */
    e: string;
    /** Conductor version */
    v: string;
    /** Component count */
    cc: number;
    /** Agent count */
    ac: number;
    /** Ensemble count */
    ec: number;
}
/**
 * Pulse result
 */
export interface PulseResult {
    /** Whether the pulse was sent (not necessarily received) */
    sent: boolean;
    /** Whether the pulse was acknowledged by the collector */
    acknowledged: boolean;
    /** Error message if sending failed */
    error?: string;
}
/**
 * Environment variables that affect Pulse
 *
 * Uses Record<string, unknown> to be compatible with ConductorEnv
 * which has an index signature.
 */
type PulseEnv = Record<string, unknown>;
/**
 * Project stats for Pulse payload
 */
export interface ProjectStats {
    /** Number of components (prompts, schemas, configs, etc.) */
    componentCount: number;
    /** Number of agents */
    agentCount: number;
    /** Number of ensembles */
    ensembleCount: number;
}
/**
 * Check if Pulse is enabled based on config and environment
 *
 * Precedence (first match wins):
 * 1. DO_NOT_TRACK=1 → disabled (industry standard)
 * 2. CONDUCTOR_PULSE=false → disabled
 * 3. config.cloud.pulse=false → disabled
 * 4. Default → enabled
 */
export declare function isPulseEnabled(config: ConductorConfig, env: PulseEnv): boolean;
/**
 * Send a Pulse signal to the collector
 *
 * This is a fire-and-forget operation that:
 * - Never throws errors
 * - Never blocks the request
 * - Fails gracefully if the collector is unavailable
 *
 * @param config - Conductor configuration
 * @param stats - Project statistics
 * @param ctx - Cloudflare execution context for waitUntil
 * @returns PulseResult indicating whether the signal was sent/acknowledged
 */
export declare function sendPulse(config: ConductorConfig, stats: ProjectStats, ctx?: ExecutionContext): Promise<PulseResult>;
/**
 * Initialize Pulse on cold start
 *
 * This is the main entry point for Pulse, called from startup-manager.
 * It checks if Pulse is enabled and sends a signal if so.
 *
 * @param config - Conductor configuration
 * @param env - Environment variables (checked for opt-out)
 * @param stats - Project statistics from discovery
 * @param ctx - Cloudflare execution context
 */
export declare function initPulse(config: ConductorConfig, env: PulseEnv, stats: ProjectStats, ctx?: ExecutionContext): Promise<PulseResult>;
/**
 * Generate a new project ID (UUID v4)
 *
 * Used by:
 * - CLI at `conductor init` to generate cloud.projectId
 * - Runtime for upgraded projects without a projectId
 */
export declare function generateProjectId(): string;
export {};
//# sourceMappingURL=index.d.ts.map