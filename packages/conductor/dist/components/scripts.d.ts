/**
 * Script Registry
 *
 * Provides typed access to JavaScript/TypeScript scripts from KV storage.
 * Scripts can be dynamically loaded and executed at runtime.
 *
 * @module components/scripts
 */
import type { ComponentRegistry } from './registry.js';
/**
 * Script metadata
 */
export interface ScriptMetadata {
    /** Script name */
    name: string;
    /** Script version */
    version: string;
    /** Optional description */
    description?: string;
    /** Export names available from the script */
    exports?: string[];
}
/**
 * Loaded script with content and metadata
 */
export interface LoadedScript {
    /** Raw script content (JavaScript/TypeScript) */
    content: string;
    /** Script metadata if available */
    metadata?: ScriptMetadata;
}
/**
 * Script registry for accessing JavaScript/TypeScript scripts
 *
 * @example
 * ```typescript
 * export default async function(ctx: AgentExecutionContext) {
 *   const { scripts } = ctx
 *
 *   // Get a script's source code
 *   const script = await scripts.get('transform-data@v1.0.0')
 *
 *   // Check if a script exists
 *   if (await scripts.exists('custom-validator')) {
 *     const validator = await scripts.get('custom-validator')
 *     // Use script content...
 *   }
 *
 *   return { processed: true }
 * }
 * ```
 */
export declare class ScriptRegistry {
    private parent;
    constructor(parent: ComponentRegistry);
    /**
     * Get a script by name (with optional @version)
     *
     * @param nameOrRef - Script name with optional version (e.g., "transform" or "transform@v1.0.0")
     * @returns Loaded script with content
     *
     * @example
     * scripts.get('transform')           // transform@latest
     * scripts.get('transform@v1.0.0')    // exact version
     */
    get(nameOrRef: string): Promise<LoadedScript>;
    /**
     * Get raw script content as string
     *
     * @param nameOrRef - Script name with optional version
     * @returns Raw script content
     */
    getContent(nameOrRef: string): Promise<string>;
    /**
     * Check if a script exists
     *
     * @param nameOrRef - Script name with optional version
     * @returns True if script exists
     */
    exists(nameOrRef: string): Promise<boolean>;
}
//# sourceMappingURL=scripts.d.ts.map