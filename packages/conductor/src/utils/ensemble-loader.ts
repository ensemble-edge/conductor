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

import {
  Parser,
  type EnsembleConfig,
  Ensemble,
  isEnsemble,
  ensembleFromConfig,
} from '../runtime/parser.js'
import type { ConductorEnv } from '../types/env.js'
import type { AgentLoader } from './loader.js'
import { createLogger } from '../observability/index.js'

const logger = createLogger({ serviceName: 'ensemble-loader' })

export interface EnsembleLoaderConfig {
  /**
   * Base directory where ensembles are located
   * @default './ensembles'
   */
  ensemblesDir?: string

  /**
   * Environment context (passed from Worker)
   */
  env: ConductorEnv

  /**
   * Execution context (passed from Worker)
   */
  ctx: ExecutionContext

  /**
   * Agent loader instance for registering inline agents
   * Optional - if provided, inline agents will be automatically registered
   */
  agentLoader?: AgentLoader
}

export interface LoadedEnsemble {
  /** The original config (for YAML-loaded ensembles) */
  config: EnsembleConfig
  /** The Ensemble instance (canonical runtime object) */
  instance: Ensemble
  /** Source type */
  source: 'yaml' | 'typescript'
  /** Whether this ensemble is from the catalog (vs user-defined) */
  isFromCatalog?: boolean
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
  async autoDiscover(
    discoveredEnsembles: Array<{
      name: string
      config?: string // YAML config string
      instance?: Ensemble // TypeScript Ensemble instance
      type?: 'yaml' | 'typescript' // Source type hint
    }>
  ): Promise<void> {
    for (const ensembleDef of discoveredEnsembles) {
      try {
        if (ensembleDef.instance) {
          // TypeScript ensemble - validate and register
          if (isEnsemble(ensembleDef.instance)) {
            this.registerEnsembleInstance(ensembleDef.instance)
            logger.debug(`Auto-discovered TypeScript ensemble: ${ensembleDef.name}`)
          } else {
            logger.warn(
              `TypeScript ensemble "${ensembleDef.name}" does not export a valid Ensemble. ` +
                `Expected: export default createEnsemble({...})`
            )
          }
        } else if (ensembleDef.config) {
          // YAML ensemble - parse and register
          const config = Parser.parseEnsemble(ensembleDef.config)
          this.registerEnsemble(config)
          logger.debug(`Auto-discovered YAML ensemble: ${ensembleDef.name}`)
        } else {
          logger.warn(`Skipping ensemble "${ensembleDef.name}": no config or instance`)
        }
      } catch (error) {
        logger.error(`Failed to load ensemble "${ensembleDef.name}"`, error as Error)
        // Continue with other ensembles even if one fails
      }
    }

    logger.info(`Auto-discovery complete: ${this.loadedEnsembles.size} ensembles loaded`)
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
  registerEnsemble(ensembleConfig: EnsembleConfig | string, isFromCatalog = false): Ensemble {
    // Parse config if it's a string (YAML)
    const config =
      typeof ensembleConfig === 'string' ? Parser.parseEnsemble(ensembleConfig) : ensembleConfig

    // Check for naming conflicts
    const existing = this.loadedEnsembles.get(config.name)
    if (existing) {
      if (existing.isFromCatalog && !isFromCatalog) {
        // User ensemble overriding catalog ensemble - warn them
        logger.warn(
          `Ensemble name conflict: "${config.name}" already exists in the catalog. ` +
            `Your ensemble will override it. Consider renaming to avoid confusion.`
        )
      } else if (!existing.isFromCatalog && !isFromCatalog) {
        // Two user ensembles with same name - warn them
        logger.warn(
          `Duplicate ensemble name: "${config.name}" is defined multiple times. ` +
            `The later definition will override the earlier one.`
        )
      }
    }

    // Create Ensemble instance from config
    // Cast to primitive EnsembleConfig - Zod schema is source of truth for runtime validation
    const instance = ensembleFromConfig(
      config as import('../primitives/ensemble.js').EnsembleConfig
    )

    // Register inline agents if present and agent loader is available
    if (config.agents && config.agents.length > 0 && this.config.agentLoader) {
      for (const agentDef of config.agents) {
        try {
          // Inline agents are validated AgentConfig objects from the ensemble YAML
          // Cast to AgentConfig since they follow the same schema
          const agentConfig = agentDef as import('../runtime/parser.js').AgentConfig
          this.config.agentLoader.registerAgent(agentConfig)
          logger.debug(
            `Registered inline agent "${agentConfig.name}" from ensemble "${config.name}"`
          )
        } catch (error) {
          logger.error(
            `Failed to register inline agent "${(agentDef as { name?: string }).name}"`,
            error as Error
          )
        }
      }
    }

    // Store in registry
    this.loadedEnsembles.set(config.name, {
      config,
      instance,
      source: 'yaml',
      isFromCatalog,
    })

    return instance
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
  registerEnsembleInstance(ensemble: Ensemble, isFromCatalog = false): Ensemble {
    if (!isEnsemble(ensemble)) {
      throw new Error('registerEnsembleInstance expects an Ensemble instance')
    }

    // Check for naming conflicts
    const existing = this.loadedEnsembles.get(ensemble.name)
    if (existing) {
      if (existing.isFromCatalog && !isFromCatalog) {
        // User ensemble overriding catalog ensemble - warn them
        logger.warn(
          `Ensemble name conflict: "${ensemble.name}" already exists in the catalog. ` +
            `Your ensemble will override it. Consider renaming to avoid confusion.`
        )
      } else if (!existing.isFromCatalog && !isFromCatalog) {
        // Two user ensembles with same name - warn them
        logger.warn(
          `Duplicate ensemble name: "${ensemble.name}" is defined multiple times. ` +
            `The later definition will override the earlier one.`
        )
      }
    }

    // Register inline agents if present and agent loader is available
    if (ensemble.agents && ensemble.agents.length > 0 && this.config.agentLoader) {
      for (const agentDef of ensemble.agents) {
        try {
          // TypeScript ensemble agents follow InlineAgentConfig which is compatible with AgentConfig
          const agentConfig = agentDef as unknown as import('../runtime/parser.js').AgentConfig
          this.config.agentLoader.registerAgent(agentConfig)
          logger.debug(
            `Registered inline agent "${agentConfig.name}" from TypeScript ensemble "${ensemble.name}"`
          )
        } catch (error) {
          logger.error(`Failed to register inline agent "${agentDef.name}"`, error as Error)
        }
      }
    }

    // Store in registry
    this.loadedEnsembles.set(ensemble.name, {
      config: ensemble.toConfig(),
      instance: ensemble,
      source: 'typescript',
      isFromCatalog,
    })

    return ensemble
  }

  /**
   * Get an ensemble config by name
   */
  getEnsemble(name: string): EnsembleConfig | undefined {
    return this.loadedEnsembles.get(name)?.config
  }

  /**
   * Get an Ensemble instance by name
   *
   * This is the preferred method - returns the canonical Ensemble object
   * that can be directly executed.
   */
  getEnsembleInstance(name: string): Ensemble | undefined {
    return this.loadedEnsembles.get(name)?.instance
  }

  /**
   * Get full loaded ensemble data (config, instance, and source)
   */
  getLoadedEnsemble(name: string): LoadedEnsemble | undefined {
    return this.loadedEnsembles.get(name)
  }

  /**
   * Get all loaded ensemble configs
   */
  getAllEnsembles(): EnsembleConfig[] {
    return Array.from(this.loadedEnsembles.values()).map((e) => e.config)
  }

  /**
   * Get all loaded Ensemble instances
   *
   * This is the preferred method - returns canonical Ensemble objects
   * that can be directly executed.
   */
  getAllEnsembleInstances(): Ensemble[] {
    return Array.from(this.loadedEnsembles.values()).map((e) => e.instance)
  }

  /**
   * Get all loaded ensemble data
   */
  getAllLoadedEnsembles(): LoadedEnsemble[] {
    return Array.from(this.loadedEnsembles.values())
  }

  /**
   * Get ensemble data in registry format for createEnsembleRegistry()
   * Returns a Map suitable for passing to the Executor's discovery data
   */
  getRegistryData(): Map<string, { config: EnsembleConfig; source: 'yaml' | 'typescript' }> {
    const result = new Map<string, { config: EnsembleConfig; source: 'yaml' | 'typescript' }>()
    for (const [name, loaded] of this.loadedEnsembles) {
      result.set(name, { config: loaded.config, source: loaded.source })
    }
    return result
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
