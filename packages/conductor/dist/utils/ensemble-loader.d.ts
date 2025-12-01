/**
 * Ensemble Loader Utility
 *
 * Dynamically loads user-created ensembles from their project directory.
 * Supports both YAML and TypeScript ensemble authoring:
 *
 * - YAML: Parsed via Parser → EnsembleConfig → Ensemble instance
 * - TypeScript: Direct import of Ensemble instances via createEnsemble()
 *
 * Both authoring paths produce identical Ensemble instances for execution.
 */
import { type EnsembleConfig, Ensemble } from '../runtime/parser.js';
import type { ConductorEnv } from '../types/env.js';
import type { AgentLoader } from './loader.js';
export interface EnsembleLoaderConfig {
    /**
     * Base directory where ensembles are located
     * @default './ensembles'
     */
    ensemblesDir?: string;
    /**
     * Environment context (passed from Worker)
     */
    env: ConductorEnv;
    /**
     * Execution context (passed from Worker)
     */
    ctx: ExecutionContext;
    /**
     * Agent loader instance for registering inline agents
     * Optional - if provided, inline agents will be automatically registered
     */
    agentLoader?: AgentLoader;
}
export interface LoadedEnsemble {
    /** The original config (for YAML-loaded ensembles) */
    config: EnsembleConfig;
    /** The Ensemble instance (canonical runtime object) */
    instance: Ensemble;
    /** Source type */
    source: 'yaml' | 'typescript';
    /** Whether this ensemble is from the catalog (vs user-defined) */
    isFromCatalog?: boolean;
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
     * Supports both YAML configs and TypeScript Ensemble instances.
     *
     * @param discoveredEnsembles - Array of ensemble definitions from virtual:conductor-ensembles
     *
     * @example
     * ```typescript
     * // YAML ensembles
     * import { ensembles as discoveredEnsembles } from 'virtual:conductor-ensembles';
     *
     * // TypeScript ensembles
     * import dataPipeline from './ensembles/data-pipeline.ts';
     *
     * const loader = new EnsembleLoader({ env, ctx });
     * await loader.autoDiscover([
     *   ...discoveredEnsembles,
     *   { name: 'data-pipeline', instance: dataPipeline }
     * ]);
     * ```
     */
    autoDiscover(discoveredEnsembles: Array<{
        name: string;
        config?: string;
        instance?: Ensemble;
    }>): Promise<void>;
    /**
     * Register an ensemble from a config object or YAML string
     *
     * @example
     * ```typescript
     * import blogWorkflowConfig from './ensembles/blog-workflow.yaml.js';
     *
     * loader.registerEnsemble(blogWorkflowConfig);
     * ```
     */
    registerEnsemble(ensembleConfig: EnsembleConfig | string, isFromCatalog?: boolean): Ensemble;
    /**
     * Register a TypeScript Ensemble instance directly
     *
     * Use this when you have an Ensemble created via createEnsemble() in TypeScript.
     *
     * @example
     * ```typescript
     * import { createEnsemble, step, parallel } from '@ensemble-edge/conductor';
     *
     * const myPipeline = createEnsemble({
     *   name: 'my-pipeline',
     *   steps: [
     *     parallel([step('fetch-a'), step('fetch-b')]),
     *     step('merge')
     *   ]
     * });
     *
     * loader.registerEnsembleInstance(myPipeline);
     * ```
     */
    registerEnsembleInstance(ensemble: Ensemble, isFromCatalog?: boolean): Ensemble;
    /**
     * Get an ensemble config by name
     * @deprecated Use getEnsembleInstance() to get the Ensemble instance directly
     */
    getEnsemble(name: string): EnsembleConfig | undefined;
    /**
     * Get an Ensemble instance by name
     *
     * This is the preferred method - returns the canonical Ensemble object
     * that can be directly executed.
     */
    getEnsembleInstance(name: string): Ensemble | undefined;
    /**
     * Get full loaded ensemble data (config, instance, and source)
     */
    getLoadedEnsemble(name: string): LoadedEnsemble | undefined;
    /**
     * Get all loaded ensemble configs
     * @deprecated Use getAllEnsembleInstances() to get Ensemble instances directly
     */
    getAllEnsembles(): EnsembleConfig[];
    /**
     * Get all loaded Ensemble instances
     *
     * This is the preferred method - returns canonical Ensemble objects
     * that can be directly executed.
     */
    getAllEnsembleInstances(): Ensemble[];
    /**
     * Get all loaded ensemble data
     */
    getAllLoadedEnsembles(): LoadedEnsemble[];
    /**
     * Get ensemble data in registry format for createEnsembleRegistry()
     * Returns a Map suitable for passing to the Executor's discovery data
     */
    getRegistryData(): Map<string, {
        config: EnsembleConfig;
        source: 'yaml' | 'typescript';
    }>;
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