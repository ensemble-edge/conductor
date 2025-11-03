/**
 * Schedule Manager
 *
 * Manages scheduled ensemble execution using Cloudflare Workers cron triggers.
 * Handles registration, execution, and coordination of scheduled ensembles.
 */
import type { EnsembleConfig, ScheduleConfig } from './parser';
import { type Logger } from '../observability';
/**
 * Cloudflare scheduled event
 */
export interface ScheduledEvent {
    cron: string;
    scheduledTime: number;
    noRetry?: () => void;
}
/**
 * Schedule execution result
 */
export interface ScheduleExecutionResult {
    ensemble: string;
    cron: string;
    success: boolean;
    duration?: number;
    error?: string;
}
/**
 * Schedule Manager
 *
 * Coordinates scheduled ensemble execution across cron triggers.
 */
export declare class ScheduleManager {
    private readonly ensembles;
    private readonly logger;
    constructor(logger?: Logger);
    /**
     * Register ensemble with schedules
     */
    register(ensemble: EnsembleConfig): void;
    /**
     * Register multiple ensembles at once
     */
    registerAll(ensembles: EnsembleConfig[]): void;
    /**
     * Handle scheduled execution
     * Called by Cloudflare Workers scheduled() handler
     */
    handleScheduled(event: ScheduledEvent, env: Env, ctx: ExecutionContext): Promise<ScheduleExecutionResult[]>;
    /**
     * Find ensembles with matching cron expression
     */
    private findMatchingEnsembles;
    /**
     * Get all registered cron expressions
     * Used to generate wrangler.toml configuration
     */
    getAllCronExpressions(): string[];
    /**
     * List all scheduled ensembles
     */
    listScheduledEnsembles(): Array<{
        ensembleName: string;
        schedules: ScheduleConfig[];
    }>;
    /**
     * Get schedules for a specific ensemble
     */
    getEnsembleSchedules(ensembleName: string): ScheduleConfig[] | null;
    /**
     * Get count of registered ensembles with schedules
     */
    getScheduledCount(): number;
    /**
     * Clear all registered ensembles
     */
    clear(): void;
}
//# sourceMappingURL=schedule-manager.d.ts.map