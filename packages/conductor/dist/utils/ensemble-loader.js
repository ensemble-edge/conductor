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
import { Parser, isEnsemble, ensembleFromConfig } from '../runtime/parser.js';
/**
 * EnsembleLoader handles dynamic loading of user-created ensembles
 *
 * Note: In Cloudflare Workers, we can't use Node.js fs module.
 * Ensembles must be bundled at build time using wrangler's module imports.
 */
export class EnsembleLoader {
    constructor(config) {
        this.config = {
            ensemblesDir: config.ensemblesDir || './ensembles',
            env: config.env,
            ctx: config.ctx,
        };
        this.loadedEnsembles = new Map();
    }
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
    async autoDiscover(discoveredEnsembles) {
        for (const ensembleDef of discoveredEnsembles) {
            try {
                if (ensembleDef.instance && isEnsemble(ensembleDef.instance)) {
                    // TypeScript ensemble - register directly
                    this.registerEnsembleInstance(ensembleDef.instance);
                    console.log(`[EnsembleLoader] Auto-discovered TypeScript ensemble: ${ensembleDef.name}`);
                }
                else if (ensembleDef.config) {
                    // YAML ensemble - parse and register
                    const config = Parser.parseEnsemble(ensembleDef.config);
                    this.registerEnsemble(config);
                    console.log(`[EnsembleLoader] Auto-discovered YAML ensemble: ${ensembleDef.name}`);
                }
                else {
                    console.warn(`[EnsembleLoader] Skipping ensemble "${ensembleDef.name}": no config or instance`);
                }
            }
            catch (error) {
                console.error(`[EnsembleLoader] Failed to load ensemble "${ensembleDef.name}":`, error);
                // Continue with other ensembles even if one fails
            }
        }
        console.log(`[EnsembleLoader] Auto-discovery complete: ${this.loadedEnsembles.size} ensembles loaded`);
    }
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
    registerEnsemble(ensembleConfig) {
        // Parse config if it's a string (YAML)
        const config = typeof ensembleConfig === 'string' ? Parser.parseEnsemble(ensembleConfig) : ensembleConfig;
        // Create Ensemble instance from config
        // Cast to primitive EnsembleConfig - Zod schema is source of truth for runtime validation
        const instance = ensembleFromConfig(config);
        // Register inline agents if present and agent loader is available
        if (config.agents && config.agents.length > 0 && this.config.agentLoader) {
            for (const agentDef of config.agents) {
                try {
                    // Register inline agent with the agent loader
                    this.config.agentLoader.registerMember({
                        name: String(agentDef.name),
                        config: agentDef,
                    });
                    console.log(`[EnsembleLoader] Registered inline agent "${agentDef.name}" from ensemble "${config.name}"`);
                }
                catch (error) {
                    console.error(`[EnsembleLoader] Failed to register inline agent "${agentDef.name}":`, error);
                }
            }
        }
        // Store in registry
        this.loadedEnsembles.set(config.name, {
            config,
            instance,
            source: 'yaml',
        });
        return instance;
    }
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
    registerEnsembleInstance(ensemble) {
        if (!isEnsemble(ensemble)) {
            throw new Error('registerEnsembleInstance expects an Ensemble instance');
        }
        // Register inline agents if present and agent loader is available
        if (ensemble.agents && ensemble.agents.length > 0 && this.config.agentLoader) {
            for (const agentDef of ensemble.agents) {
                try {
                    this.config.agentLoader.registerMember({
                        name: agentDef.name,
                        config: agentDef,
                    });
                    console.log(`[EnsembleLoader] Registered inline agent "${agentDef.name}" from TypeScript ensemble "${ensemble.name}"`);
                }
                catch (error) {
                    console.error(`[EnsembleLoader] Failed to register inline agent "${agentDef.name}":`, error);
                }
            }
        }
        // Store in registry
        this.loadedEnsembles.set(ensemble.name, {
            config: ensemble.toConfig(),
            instance: ensemble,
            source: 'typescript',
        });
        return ensemble;
    }
    /**
     * Get an ensemble config by name
     * @deprecated Use getEnsembleInstance() to get the Ensemble instance directly
     */
    getEnsemble(name) {
        return this.loadedEnsembles.get(name)?.config;
    }
    /**
     * Get an Ensemble instance by name
     *
     * This is the preferred method - returns the canonical Ensemble object
     * that can be directly executed.
     */
    getEnsembleInstance(name) {
        return this.loadedEnsembles.get(name)?.instance;
    }
    /**
     * Get full loaded ensemble data (config, instance, and source)
     */
    getLoadedEnsemble(name) {
        return this.loadedEnsembles.get(name);
    }
    /**
     * Get all loaded ensemble configs
     * @deprecated Use getAllEnsembleInstances() to get Ensemble instances directly
     */
    getAllEnsembles() {
        return Array.from(this.loadedEnsembles.values()).map((e) => e.config);
    }
    /**
     * Get all loaded Ensemble instances
     *
     * This is the preferred method - returns canonical Ensemble objects
     * that can be directly executed.
     */
    getAllEnsembleInstances() {
        return Array.from(this.loadedEnsembles.values()).map((e) => e.instance);
    }
    /**
     * Get all loaded ensemble data
     */
    getAllLoadedEnsembles() {
        return Array.from(this.loadedEnsembles.values());
    }
    /**
     * Get all ensemble names
     */
    getEnsembleNames() {
        return Array.from(this.loadedEnsembles.keys());
    }
    /**
     * Check if an ensemble is loaded
     */
    hasEnsemble(name) {
        return this.loadedEnsembles.has(name);
    }
    /**
     * Clear all loaded ensembles
     */
    clear() {
        this.loadedEnsembles.clear();
    }
}
/**
 * Helper function to create an ensemble loader instance
 */
export function createEnsembleLoader(config) {
    return new EnsembleLoader(config);
}
