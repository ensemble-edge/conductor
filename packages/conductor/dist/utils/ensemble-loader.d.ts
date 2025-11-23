/**
 * Ensemble Loader Utility
 *
 * Dynamically loads user-created ensembles from their project directory
 * This runs in the user's project context, not in the conductor package
 */
import { type EnsembleConfig } from '../runtime/parser.js';
export interface EnsembleLoaderConfig {
    /**
     * Base directory where ensembles are located
     * @default './ensembles'
     */
    ensemblesDir?: string;
    /**
     * Environment context (passed from Worker)
     */
    env: Env;
    /**
     * Execution context (passed from Worker)
     */
    ctx: ExecutionContext;
}
export interface LoadedEnsemble {
    config: EnsembleConfig;
}
/**
 * EnsembleLoader handles dynamic loading of user-created ensembles
 *
 * Note: In Cloudflare Workers, we can't use Node.js fs module.
 * Ensembles must be bundled at build time using wrangler's module imports.
 */
export declare class EnsembleLoader {
    private config;
    private loadedEnsembles;
    constructor(config: EnsembleLoaderConfig);
    /**
     * Auto-discover and register ensembles from virtual module
     *
     * This method is designed to work with the Vite plugin system that generates
     * a virtual module containing all ensemble definitions at build time.
     *
     * @param discoveredEnsembles - Array of ensemble definitions from virtual:conductor-ensembles
     *
     * @example
     * ```typescript
     * import { ensembles as discoveredEnsembles } from 'virtual:conductor-ensembles';
     *
     * const loader = new EnsembleLoader({ env, ctx });
     * await loader.autoDiscover(discoveredEnsembles);
     * ```
     */
    autoDiscover(discoveredEnsembles: Array<{
        name: string;
        config: string;
    }>): Promise<void>;
    /**
     * Register an ensemble manually
     *
     * @example
     * ```typescript
     * import blogWorkflowConfig from './ensembles/blog-workflow.yaml.js';
     *
     * loader.registerEnsemble(blogWorkflowConfig);
     * ```
     */
    registerEnsemble(ensembleConfig: EnsembleConfig | string): EnsembleConfig;
    /**
     * Get a loaded ensemble by name
     */
    getEnsemble(name: string): EnsembleConfig | undefined;
    /**
     * Get all loaded ensembles
     */
    getAllEnsembles(): EnsembleConfig[];
    /**
     * Get all ensemble names
     */
    getEnsembleNames(): string[];
    /**
     * Check if an ensemble is loaded
     */
    hasEnsemble(name: string): boolean;
    /**
     * Clear all loaded ensembles
     */
    clear(): void;
}
/**
 * Helper function to create an ensemble loader instance
 */
export declare function createEnsembleLoader(config: EnsembleLoaderConfig): EnsembleLoader;
//# sourceMappingURL=ensemble-loader.d.ts.map