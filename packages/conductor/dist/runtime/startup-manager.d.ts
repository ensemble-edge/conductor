/**
 * Startup Manager
 *
 * Executes ensembles with `trigger: { type: startup }` during Worker cold start.
 * Runs before HTTP routes are registered, using waitUntil() for non-blocking execution.
 *
 * Key characteristics:
 * - Runs once per cold start (module-level flag prevents re-execution)
 * - Non-blocking via waitUntil() - doesn't delay request handling
 * - Errors are logged but don't crash the Worker
 * - Ideal for cache warming, health checks, initialization tasks
 *
 * Also handles Pulse (anonymous usage metrics) on cold start.
 */
import type { EnsembleConfig } from './parser.js';
import type { ConductorEnv } from '../types/env.js';
import type { BaseAgent } from '../agents/base-agent.js';
import type { ConductorConfig } from '../config/types.js';
import { type ProjectStats, type PulseResult } from '../pulse/index.js';
/**
 * Result of executing a single startup trigger
 */
export interface StartupResult {
    /** Name of the ensemble that was executed */
    ensemble: string;
    /** Whether execution succeeded */
    success: boolean;
    /** Duration in milliseconds */
    duration: number;
    /** Error message if execution failed */
    error?: string;
}
/**
 * Result of running all startup tasks (triggers + pulse)
 */
export interface StartupSummary {
    /** Results from startup-triggered ensembles */
    triggers: StartupResult[];
    /** Result from Pulse signal */
    pulse: PulseResult;
}
/**
 * Run all startup-triggered ensembles.
 *
 * This function should be called from the Worker entry point on every request,
 * wrapped in ctx.waitUntil() for non-blocking execution:
 *
 * ```typescript
 * export default {
 *   async fetch(request, env, ctx) {
 *     ctx.waitUntil(runStartupTriggers(ensembles, agents, env, ctx));
 *     return handleRequest(request, env, ctx);
 *   }
 * }
 * ```
 *
 * The module-level `hasRun` flag ensures this only executes once per cold start.
 *
 * @param ensembles - All loaded ensembles (will be filtered for startup triggers)
 * @param agents - All loaded agents (for registration with executor)
 * @param env - Cloudflare Worker environment bindings
 * @param ctx - Cloudflare Worker execution context
 * @returns Array of results for each startup ensemble executed
 */
export declare function runStartupTriggers(ensembles: EnsembleConfig[], agents: BaseAgent[], env: ConductorEnv, ctx: ExecutionContext): Promise<StartupResult[]>;
/**
 * Run all startup tasks including Pulse and user-defined triggers.
 *
 * This is the main entry point for cold start initialization:
 * 1. Sends Pulse signal (anonymous usage metrics)
 * 2. Executes user-defined startup-triggered ensembles
 *
 * @param config - Conductor configuration (for Pulse settings)
 * @param ensembles - All loaded ensembles (filtered for startup triggers)
 * @param agents - All loaded agents (for executor registration)
 * @param stats - Project statistics (agent/ensemble/component counts)
 * @param env - Cloudflare Worker environment
 * @param ctx - Cloudflare execution context
 * @returns Summary of all startup tasks
 */
export declare function runStartup(config: ConductorConfig, ensembles: EnsembleConfig[], agents: BaseAgent[], stats: ProjectStats, env: ConductorEnv, ctx: ExecutionContext): Promise<StartupSummary>;
/**
 * Reset startup state (for testing only)
 *
 * In production, the module-level flag naturally resets on cold start.
 * This function is exposed only for test isolation.
 */
export declare function resetStartupState(): void;
/**
 * Check if startup has already run
 * Useful for debugging/logging
 */
export declare function hasStartupRun(): boolean;
//# sourceMappingURL=startup-manager.d.ts.map