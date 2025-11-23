/**
 * Ensemble Loader Utility
 *
 * Dynamically loads user-created ensembles from their project directory
 * This runs in the user's project context, not in the conductor package
 */

import { Parser, type EnsembleConfig } from '../runtime/parser.js'

export interface EnsembleLoaderConfig {
  /**
   * Base directory where ensembles are located
   * @default './ensembles'
   */
  ensemblesDir?: string

  /**
   * Environment context (passed from Worker)
   */
  env: Env

  /**
   * Execution context (passed from Worker)
   */
  ctx: ExecutionContext
}

export interface LoadedEnsemble {
  config: EnsembleConfig
}

/**
 * EnsembleLoader handles dynamic loading of user-created ensembles
 *
 * Note: In Cloudflare Workers, we can't use Node.js fs module.
 * Ensembles must be bundled at build time using wrangler's module imports.
 */
export class EnsembleLoader {
  private config: EnsembleLoaderConfig
  private loadedEnsembles: Map<string, LoadedEnsemble>

  constructor(config: EnsembleLoaderConfig) {
    this.config = {
      ensemblesDir: config.ensemblesDir || './ensembles',
      env: config.env,
      ctx: config.ctx,
    }
    this.loadedEnsembles = new Map()
  }

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
  async autoDiscover(
    discoveredEnsembles: Array<{
      name: string
      config: string
    }>
  ): Promise<void> {
    for (const ensembleDef of discoveredEnsembles) {
      try {
        // Parse YAML config
        const config = Parser.parseEnsemble(ensembleDef.config)

        // Register the ensemble
        this.registerEnsemble(config)

        console.log(`[EnsembleLoader] Auto-discovered ensemble: ${ensembleDef.name}`)
      } catch (error) {
        console.error(`[EnsembleLoader] Failed to load ensemble "${ensembleDef.name}":`, error)
        // Continue with other ensembles even if one fails
      }
    }

    console.log(
      `[EnsembleLoader] Auto-discovery complete: ${this.loadedEnsembles.size} ensembles loaded`
    )
  }

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
  registerEnsemble(ensembleConfig: EnsembleConfig | string): EnsembleConfig {
    // Parse config if it's a string (YAML)
    const config =
      typeof ensembleConfig === 'string' ? Parser.parseEnsemble(ensembleConfig) : ensembleConfig

    // Store in registry
    this.loadedEnsembles.set(config.name, {
      config,
    })

    return config
  }

  /**
   * Get a loaded ensemble by name
   */
  getEnsemble(name: string): EnsembleConfig | undefined {
    return this.loadedEnsembles.get(name)?.config
  }

  /**
   * Get all loaded ensembles
   */
  getAllEnsembles(): EnsembleConfig[] {
    return Array.from(this.loadedEnsembles.values()).map((e) => e.config)
  }

  /**
   * Get all ensemble names
   */
  getEnsembleNames(): string[] {
    return Array.from(this.loadedEnsembles.keys())
  }

  /**
   * Check if an ensemble is loaded
   */
  hasEnsemble(name: string): boolean {
    return this.loadedEnsembles.has(name)
  }

  /**
   * Clear all loaded ensembles
   */
  clear(): void {
    this.loadedEnsembles.clear()
  }
}

/**
 * Helper function to create an ensemble loader instance
 */
export function createEnsembleLoader(config: EnsembleLoaderConfig): EnsembleLoader {
  return new EnsembleLoader(config)
}
