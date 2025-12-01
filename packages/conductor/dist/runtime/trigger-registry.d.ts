/**
 * Trigger Registry
 *
 * Allows plugins to register custom trigger types and handlers.
 * Built-in triggers (webhook, http, mcp, email, queue, cron) are registered here.
 * Plugins can extend by registering additional triggers (e.g., twilio-sms, slack, discord).
 */
import type { Hono } from 'hono';
import type { z } from 'zod';
import type { EnsembleConfig } from './parser.js';
import type { BaseAgent } from '../agents/base-agent.js';
import type { ConductorEnv } from '../types/env.js';
import type { DiscoveryData } from './executor.js';
/**
 * Trigger handler context provided to trigger handlers
 * Uses generic Hono to accept any app typing (ConductorApp or bare Hono)
 */
export interface TriggerHandlerContext {
    app: Hono<any, any, any>;
    ensemble: EnsembleConfig;
    trigger: unknown;
    agents: BaseAgent[];
    env: ConductorEnv;
    ctx: ExecutionContext;
    /**
     * Discovery data for agents, ensembles, and docs
     * Passed to Executor to enable ctx.agentRegistry and ctx.ensembleRegistry
     */
    discovery?: DiscoveryData;
}
/**
 * Trigger handler function
 * Responsible for registering routes/listeners for a specific trigger type
 */
export type TriggerHandler = (context: TriggerHandlerContext) => void | Promise<void>;
/**
 * Trigger registration metadata
 */
export interface TriggerMetadata {
    /**
     * Trigger type identifier (e.g., 'http', 'twilio-sms', 'slack')
     */
    type: string;
    /**
     * Human-readable name
     */
    name: string;
    /**
     * Description of what this trigger does
     */
    description: string;
    /**
     * Zod schema for validating trigger configuration
     * This should be a z.object() schema
     */
    schema: z.ZodObject<z.ZodRawShape, any, any>;
    /**
     * Whether this trigger requires authentication by default
     */
    requiresAuth?: boolean;
    /**
     * Tags for categorization (e.g., ['messaging', 'sms'])
     */
    tags?: string[];
    /**
     * Plugin that registered this trigger (optional)
     */
    plugin?: string;
}
/**
 * Global registry for trigger types and handlers
 */
export declare class TriggerRegistry {
    private static instance;
    private handlers;
    private metadata;
    private constructor();
    /**
     * Get singleton instance
     */
    static getInstance(): TriggerRegistry;
    /**
     * Reset registry (for testing)
     */
    reset(): void;
    /**
     * Register a new trigger type
     */
    register(handler: TriggerHandler, metadata: TriggerMetadata): void;
    /**
     * Get handler for a trigger type
     */
    getHandler(type: string): TriggerHandler | undefined;
    /**
     * Get metadata for a trigger type
     */
    getMetadata(type: string): TriggerMetadata | undefined;
    /**
     * Check if a trigger type is registered
     */
    has(type: string): boolean;
    /**
     * Get all registered trigger types
     */
    getAllTypes(): string[];
    /**
     * Get all registered trigger metadata
     */
    getAllMetadata(): TriggerMetadata[];
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
    registerEnsembleTriggers(app: Hono<any, any, any>, ensemble: EnsembleConfig, agents: BaseAgent[], env: ConductorEnv, ctx: ExecutionContext, discovery?: DiscoveryData): Promise<void>;
}
/**
 * Get the global trigger registry instance
 */
export declare function getTriggerRegistry(): TriggerRegistry;
//# sourceMappingURL=trigger-registry.d.ts.map