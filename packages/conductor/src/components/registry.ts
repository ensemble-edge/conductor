/**
 * Component Registry
 *
 * Unified component access for all component types:
 * - schemas - JSON Schema definitions
 * - prompts - AI prompt templates
 * - configs - Configuration objects
 * - queries - SQL query templates
 * - scripts - JavaScript/TypeScript scripts
 * - templates - HTML/Handlebars templates
 *
 * Used by both YAML expression resolution and TypeScript handlers.
 *
 * @module components/registry
 */

import {
  resolveValue,
  type ComponentResolutionContext,
  type ResolvedComponent,
} from '../utils/component-resolver.js'
import { SchemaRegistry } from './schemas.js'
import { PromptRegistry } from './prompts.js'
import { ConfigRegistry } from './configs.js'
import { QueryRegistry } from './queries.js'
import { ScriptRegistry } from './scripts.js'
import { TemplateRegistry } from './templates.js'

/**
 * Parse name with optional version
 *
 * @example
 * parseNameWithVersion('order')           → { name: 'order', version: 'latest' }
 * parseNameWithVersion('order@v1.0.0')    → { name: 'order', version: 'v1.0.0' }
 * parseNameWithVersion('order@^2.0.0')    → { name: 'order', version: '^2.0.0' }
 * parseNameWithVersion('order@latest')    → { name: 'order', version: 'latest' }
 */
export function parseNameWithVersion(nameOrRef: string): { name: string; version: string } {
  if (nameOrRef.includes('@')) {
    const atIndex = nameOrRef.lastIndexOf('@')
    const name = nameOrRef.substring(0, atIndex)
    const version = nameOrRef.substring(atIndex + 1)
    return { name, version }
  }
  return { name: nameOrRef, version: 'latest' }
}

/**
 * Unified component registry for accessing schemas, prompts, configs
 *
 * Used by both YAML expression resolution and TypeScript handlers.
 *
 * @example
 * ```typescript
 * // Create registry
 * const registry = new ComponentRegistry({ env })
 *
 * // Access schemas
 * const schema = await registry.schemas.get('order@v1.0.0')
 * const isValid = await registry.schemas.isValid('order', data)
 *
 * // Access prompts
 * const prompt = await registry.prompts.get('extraction')
 * const rendered = await registry.prompts.render('docs-writer', { page: 'intro' })
 *
 * // Access configs
 * const settings = await registry.configs.get('docs-settings')
 * ```
 */
export class ComponentRegistry {
  private resolutionContext: ComponentResolutionContext
  private cache = new Map<string, any>()

  // Sub-registries (lazily initialized)
  private _schemas?: SchemaRegistry
  private _prompts?: PromptRegistry
  private _configs?: ConfigRegistry
  private _queries?: QueryRegistry
  private _scripts?: ScriptRegistry
  private _templates?: TemplateRegistry

  constructor(context: ComponentResolutionContext) {
    this.resolutionContext = context
  }

  /**
   * Schema registry - access and validate against schemas
   */
  get schemas(): SchemaRegistry {
    if (!this._schemas) {
      this._schemas = new SchemaRegistry(this)
    }
    return this._schemas!
  }

  /**
   * Prompt registry - access and render prompts
   */
  get prompts(): PromptRegistry {
    if (!this._prompts) {
      this._prompts = new PromptRegistry(this)
    }
    return this._prompts!
  }

  /**
   * Config component registry - access config components
   */
  get configs(): ConfigRegistry {
    if (!this._configs) {
      this._configs = new ConfigRegistry(this)
    }
    return this._configs!
  }

  /**
   * Query registry - access SQL query templates
   */
  get queries(): QueryRegistry {
    if (!this._queries) {
      this._queries = new QueryRegistry(this)
    }
    return this._queries!
  }

  /**
   * Script registry - access JavaScript/TypeScript scripts
   */
  get scripts(): ScriptRegistry {
    if (!this._scripts) {
      this._scripts = new ScriptRegistry(this)
    }
    return this._scripts!
  }

  /**
   * Template registry - access HTML/Handlebars templates
   */
  get templates(): TemplateRegistry {
    if (!this._templates) {
      this._templates = new TemplateRegistry(this)
    }
    return this._templates!
  }

  /**
   * Resolve any component reference
   *
   * This is the core resolution method that delegates to resolveValue()
   * from component-resolver.ts. Results are cached within the execution.
   *
   * @param ref - Component reference (e.g., "schemas/order@v1.0.0")
   * @returns Resolved component content
   */
  async resolve(ref: string): Promise<any> {
    // Check cache first
    if (this.cache.has(ref)) {
      return this.cache.get(ref)
    }

    // Resolve using the low-level component resolver
    const resolved: ResolvedComponent = await resolveValue(ref, this.resolutionContext)

    // Cache the resolved content
    this.cache.set(ref, resolved.content)

    return resolved.content
  }

  /**
   * Resolve with full metadata (source, version, etc.)
   *
   * @param ref - Component reference
   * @returns Full resolved component with metadata
   */
  async resolveWithMetadata(ref: string): Promise<ResolvedComponent> {
    return resolveValue(ref, this.resolutionContext)
  }

  /**
   * Check if a component exists
   *
   * @param ref - Component reference
   * @returns True if component exists
   */
  async exists(ref: string): Promise<boolean> {
    try {
      await this.resolve(ref)
      return true
    } catch {
      return false
    }
  }

  /**
   * Clear component cache
   *
   * Useful for testing or long-running processes that need fresh data.
   */
  clearCache(): void {
    this.cache.clear()
  }

  /**
   * Get cache statistics
   *
   * @returns Cache hit information
   */
  getCacheStats(): { size: number; keys: string[] } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys()),
    }
  }

  /**
   * Get the resolution context
   *
   * Useful for passing to other functions that need KV access.
   */
  getContext(): ComponentResolutionContext {
    return this.resolutionContext
  }
}

/**
 * Create a component registry from Cloudflare environment
 *
 * @param env - Cloudflare environment with KV bindings
 * @returns Configured ComponentRegistry
 *
 * @example
 * ```typescript
 * const registry = createComponentRegistry(env)
 * const schema = await registry.schemas.get('order')
 * ```
 */
export function createComponentRegistry(env: {
  EDGIT?: KVNamespace
  COMPONENTS?: KVNamespace
  [key: string]: any
}): ComponentRegistry {
  return new ComponentRegistry({ env })
}
