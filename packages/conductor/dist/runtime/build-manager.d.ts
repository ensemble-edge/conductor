/**
 * Build Manager
 *
 * Manages build-time ensemble execution.
 * Ensembles with build triggers run during `conductor build` or deploy time.
 *
 * Use cases:
 * - Generate static documentation
 * - Pre-compute data that doesn't change frequently
 * - Generate OpenAPI specs
 * - Build static assets
 */
import type { EnsembleConfig, BuildTriggerConfig } from './parser.js';
import { type Logger } from '../observability/index.js';
/**
 * Build execution result
 */
export interface BuildExecutionResult {
    ensemble: string;
    success: boolean;
    duration: number;
    output?: unknown;
    outputPath?: string;
    error?: string;
}
/**
 * Build Manager
 *
 * Coordinates build-time ensemble execution.
 */
export declare class BuildManager {
    private readonly ensembles;
    private readonly logger;
    constructor(logger?: Logger);
    /**
     * Register ensemble with build triggers
     */
    register(ensemble: EnsembleConfig): void;
    /**
     * Register multiple ensembles at once
     */
    registerAll(ensembles: EnsembleConfig[]): void;
    /**
     * Run all build triggers
     * Called during `conductor build` or deploy
     */
    runBuildTriggers(env: Env, ctx: ExecutionContext, options?: {
        filter?: string[];
        dryRun?: boolean;
    }): Promise<BuildExecutionResult[]>;
    /**
     * List all ensembles with build triggers
     */
    listBuildEnsembles(): Array<{
        ensembleName: string;
        triggers: BuildTriggerConfig[];
    }>;
    /**
     * Get count of registered ensembles with build triggers
     */
    getBuildCount(): number;
    /**
     * Clear all registered ensembles
     */
    clear(): void;
}
/**
 * Get or create the global build manager
 */
export declare function getBuildManager(): BuildManager;
/**
 * Reset the global build manager (for testing)
 */
export declare function resetBuildManager(): void;
//# sourceMappingURL=build-manager.d.ts.map