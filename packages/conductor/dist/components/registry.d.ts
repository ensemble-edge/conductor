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
import { type ComponentResolutionContext, type ResolvedComponent } from '../utils/component-resolver.js';
import { SchemaRegistry } from './schemas.js';
import { PromptRegistry } from './prompts.js';
import { ConfigRegistry } from './configs.js';
import { QueryRegistry } from './queries.js';
import { ScriptRegistry } from './scripts.js';
import { TemplateRegistry } from './templates.js';
/**
 * Parse name with optional version
 *
 * @example
 * parseNameWithVersion('order')           → { name: 'order', version: 'latest' }
 * parseNameWithVersion('order@v1.0.0')    → { name: 'order', version: 'v1.0.0' }
 * parseNameWithVersion('order@^2.0.0')    → { name: 'order', version: '^2.0.0' }
 * parseNameWithVersion('order@latest')    → { name: 'order', version: 'latest' }
 */
export declare function parseNameWithVersion(nameOrRef: string): {
    name: string;
    version: string;
};
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
export declare class ComponentRegistry {
    private resolutionContext;
    private cache;
    private _schemas?;
    private _prompts?;
    private _configs?;
    private _queries?;
    private _scripts?;
    private _templates?;
    constructor(context: ComponentResolutionContext);
    /**
     * Schema registry - access and validate against schemas
     */
    get schemas(): SchemaRegistry;
    /**
     * Prompt registry - access and render prompts
     */
    get prompts(): PromptRegistry;
    /**
     * Config component registry - access config components
     */
    get configs(): ConfigRegistry;
    /**
     * Query registry - access SQL query templates
     */
    get queries(): QueryRegistry;
    /**
     * Script registry - access JavaScript/TypeScript scripts
     */
    get scripts(): ScriptRegistry;
    /**
     * Template registry - access HTML/Handlebars templates
     */
    get templates(): TemplateRegistry;
    /**
     * Resolve any component reference
     *
     * This is the core resolution method that delegates to resolveValue()
     * from component-resolver.ts. Results are cached within the execution.
     *
     * @param ref - Component reference (e.g., "schemas/order@v1.0.0")
     * @returns Resolved component content
     */
    resolve(ref: string): Promise<any>;
    /**
     * Resolve with full metadata (source, version, etc.)
     *
     * @param ref - Component reference
     * @returns Full resolved component with metadata
     */
    resolveWithMetadata(ref: string): Promise<ResolvedComponent>;
    /**
     * Check if a component exists
     *
     * @param ref - Component reference
     * @returns True if component exists
     */
    exists(ref: string): Promise<boolean>;
    /**
     * Clear component cache
     *
     * Useful for testing or long-running processes that need fresh data.
     */
    clearCache(): void;
    /**
     * Get cache statistics
     *
     * @returns Cache hit information
     */
    getCacheStats(): {
        size: number;
        keys: string[];
    };
    /**
     * Get the resolution context
     *
     * Useful for passing to other functions that need KV access.
     */
    getContext(): ComponentResolutionContext;
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
export declare function createComponentRegistry(env: {
    EDGIT?: KVNamespace;
    COMPONENTS?: KVNamespace;
    [key: string]: any;
}): ComponentRegistry;
//# sourceMappingURL=registry.d.ts.map