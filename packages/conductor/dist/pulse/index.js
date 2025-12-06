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
import { createLogger } from '../observability/index.js';
const logger = createLogger({ serviceName: 'pulse' });
/** Pulse endpoint */
const PULSE_URL = 'https://pulse.ensemble.ai';
const CONDUCTOR_VERSION = typeof __CONDUCTOR_VERSION__ !== 'undefined' ? __CONDUCTOR_VERSION__ : '0.0.0-dev';
/**
 * Check if Pulse is enabled based on config and environment
 *
 * Precedence (first match wins):
 * 1. DO_NOT_TRACK=1 → disabled (industry standard)
 * 2. CONDUCTOR_PULSE=false → disabled
 * 3. config.cloud.pulse=false → disabled
 * 4. Default → enabled
 */
export function isPulseEnabled(config, env) {
    // Industry standard opt-out
    if (env['DO_NOT_TRACK'] === '1') {
        return false;
    }
    // Conductor-specific opt-out via env
    if (env['CONDUCTOR_PULSE'] === 'false') {
        return false;
    }
    // Config-based opt-out
    if (config.cloud?.pulse === false) {
        return false;
    }
    return true;
}
/**
 * Get projectId from config, or generate one for upgraded projects
 *
 * New projects get projectId at `conductor init`.
 * Projects upgrading from older versions get one auto-generated at runtime.
 */
function getProjectId(config) {
    if (config.cloud?.projectId) {
        return config.cloud.projectId;
    }
    // Auto-generate for upgraded projects that don't have one yet
    // This ensures older projects still participate after upgrading
    const generatedId = generateProjectId();
    logger.info('[Pulse] Auto-generated projectId for upgraded project', {
        projectId: generatedId.slice(0, 8) + '...',
    });
    return generatedId;
}
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
export async function sendPulse(config, stats, ctx) {
    const projectId = getProjectId(config);
    const payload = {
        pid: projectId,
        e: 'server.start',
        v: CONDUCTOR_VERSION,
        cc: stats.componentCount,
        ac: stats.agentCount,
        ec: stats.ensembleCount,
    };
    const sendSignal = async () => {
        try {
            const response = await fetch(PULSE_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });
            const acknowledged = response.ok;
            if (acknowledged) {
                logger.debug('Pulse sent successfully', {
                    projectId: projectId.slice(0, 8) + '...',
                    version: payload.v,
                });
            }
            else {
                logger.debug('Pulse sent but not acknowledged', {
                    status: response.status,
                });
            }
            return { sent: true, acknowledged };
        }
        catch (error) {
            // Pulse must never crash the app - fail silently
            const message = error instanceof Error ? error.message : 'Unknown error';
            logger.debug('Pulse failed (non-blocking)', { error: message });
            return { sent: true, acknowledged: false, error: message };
        }
    };
    // If we have an execution context, use waitUntil for non-blocking send
    if (ctx) {
        ctx.waitUntil(sendSignal());
        return { sent: true, acknowledged: false }; // Can't know if acknowledged yet
    }
    // Otherwise, await the result
    return sendSignal();
}
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
export async function initPulse(config, env, stats, ctx) {
    if (!isPulseEnabled(config, env)) {
        logger.debug('Pulse disabled by config or environment');
        return { sent: false, acknowledged: false };
    }
    return sendPulse(config, stats, ctx);
}
/**
 * Generate a new project ID (UUID v4)
 *
 * Used by:
 * - CLI at `conductor init` to generate cloud.projectId
 * - Runtime for upgraded projects without a projectId
 */
export function generateProjectId() {
    return crypto.randomUUID();
}
