/**
 * Trigger Registry
 *
 * Allows plugins to register custom trigger types and handlers.
 * Built-in triggers (webhook, http, mcp, email, queue, cron) are registered here.
 * Plugins can extend by registering additional triggers (e.g., twilio-sms, slack, discord).
 */
import { createLogger } from '../observability/index.js';
const logger = createLogger({ serviceName: 'trigger-registry' });
/**
 * Global registry for trigger types and handlers
 */
export class TriggerRegistry {
    constructor() {
        this.handlers = new Map();
        this.metadata = new Map();
        // Private constructor for singleton
    }
    /**
     * Get singleton instance
     */
    static getInstance() {
        if (!TriggerRegistry.instance) {
            TriggerRegistry.instance = new TriggerRegistry();
        }
        return TriggerRegistry.instance;
    }
    /**
     * Reset registry (for testing)
     */
    reset() {
        this.handlers.clear();
        this.metadata.clear();
    }
    /**
     * Register a new trigger type
     */
    register(handler, metadata) {
        const { type } = metadata;
        if (this.handlers.has(type)) {
            logger.warn(`[TriggerRegistry] Overwriting existing trigger type: ${type}`);
        }
        this.handlers.set(type, handler);
        this.metadata.set(type, metadata);
        logger.info(`[TriggerRegistry] Registered trigger: ${type}`, {
            name: metadata.name,
            plugin: metadata.plugin,
        });
    }
    /**
     * Get handler for a trigger type
     */
    getHandler(type) {
        return this.handlers.get(type);
    }
    /**
     * Get metadata for a trigger type
     */
    getMetadata(type) {
        return this.metadata.get(type);
    }
    /**
     * Check if a trigger type is registered
     */
    has(type) {
        return this.handlers.has(type);
    }
    /**
     * Get all registered trigger types
     */
    getAllTypes() {
        return Array.from(this.handlers.keys());
    }
    /**
     * Get all registered trigger metadata
     */
    getAllMetadata() {
        return Array.from(this.metadata.values());
    }
    /**
     * Register all triggers for an ensemble
     * Called during auto-discovery initialization
     *
     * @param app - Hono app instance
     * @param ensemble - Ensemble configuration
     * @param agents - Array of agent instances
     * @param env - Cloudflare environment
     * @param ctx - Execution context
     * @param discovery - Optional discovery data for agents/ensembles/docs
     */
    async registerEnsembleTriggers(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    app, ensemble, agents, env, ctx, discovery) {
        if (!ensemble.trigger || ensemble.trigger.length === 0) {
            return; // No triggers to register
        }
        for (const trigger of ensemble.trigger) {
            const handler = this.getHandler(trigger.type);
            if (!handler) {
                logger.warn(`[TriggerRegistry] No handler found for trigger type: ${trigger.type}`, {
                    ensemble: ensemble.name,
                    availableTypes: this.getAllTypes(),
                });
                continue;
            }
            try {
                await handler({
                    app,
                    ensemble,
                    trigger,
                    agents,
                    env,
                    ctx,
                    discovery,
                });
                logger.info(`[TriggerRegistry] Registered ${trigger.type} trigger for ensemble: ${ensemble.name}`);
            }
            catch (error) {
                logger.error(`[TriggerRegistry] Failed to register ${trigger.type} trigger for ${ensemble.name}`, error instanceof Error ? error : undefined);
            }
        }
    }
}
TriggerRegistry.instance = null;
/**
 * Get the global trigger registry instance
 */
export function getTriggerRegistry() {
    return TriggerRegistry.getInstance();
}
