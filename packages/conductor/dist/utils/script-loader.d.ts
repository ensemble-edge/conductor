/**
 * Script Loader Utility
 *
 * Resolves script URIs to pre-bundled handler functions.
 * This approach avoids `new Function()` which is blocked in Cloudflare Workers.
 *
 * Supports two URI formats (consistent with other component protocols):
 * - Full URI: "script://transforms/csv" or "script://transforms/csv@v1.0.0"
 * - Shorthand: "script/transforms/csv" or "script/transforms/csv@v1.0.0"
 *
 * Scripts are discovered at build time by vite-plugin-script-discovery and
 * bundled into a scriptsMap that can be passed to this loader.
 *
 * @example
 * ```typescript
 * import { scriptsMap } from 'virtual:conductor-scripts'
 * import { createScriptLoader } from './utils/script-loader'
 *
 * const loader = createScriptLoader(scriptsMap)
 * const handler = loader.resolve('script://transforms/csv')
 * // or: loader.resolve('script/transforms/csv')
 * const result = await handler(context)
 * ```
 */
import type { AgentExecutionContext } from '../agents/base-agent.js';
/**
 * Script handler function signature
 * Same as agent handlers - receives full execution context
 */
export type ScriptHandler = (context: AgentExecutionContext) => Promise<unknown> | unknown;
/**
 * Script loader for resolving script:// URIs to bundled handlers
 */
export interface ScriptLoader {
    /**
     * Resolve a script:// URI to its handler function
     * @param uri - Script URI (e.g., "script://transforms/csv")
     * @returns The handler function
     * @throws Error if script not found in bundle
     */
    resolve(uri: string): ScriptHandler;
    /**
     * Check if a script exists in the bundle
     * @param uri - Script URI
     * @returns true if script is bundled
     */
    has(uri: string): boolean;
    /**
     * Get all available script names
     * @returns Array of script names (without script:// prefix)
     */
    list(): string[];
}
/**
 * Parse a script reference to extract the script name
 *
 * Supports multiple formats (consistent with other component protocols):
 * - Full URI: "script://transforms/csv" or "script://transforms/csv@v1.0.0"
 * - Shorthand: "scripts/transforms/csv" or "scripts/transforms/csv@v1.0.0"
 *
 * @example
 * parseScriptURI('script://transforms/csv') // returns 'transforms/csv'
 * parseScriptURI('scripts/transforms/csv') // returns 'transforms/csv'
 * parseScriptURI('scripts/health-check@v1.0.0') // returns 'health-check'
 */
export declare function parseScriptURI(uri: string): string;
/**
 * Check if a string is a script reference
 * @param value - The value to check
 * @returns true if it's a script reference (script:// or scripts/)
 */
export declare function isScriptReference(value: unknown): value is string;
/**
 * Create a script loader from a Map of bundled scripts
 *
 * @param scriptsMap - Map from script name to handler function
 *                     (typically from virtual:conductor-scripts)
 * @returns ScriptLoader instance
 */
export declare function createScriptLoader(scriptsMap: Map<string, ScriptHandler>): ScriptLoader;
/**
 * Set the global script loader
 * Call this during app initialization with the bundled scriptsMap
 *
 * @example
 * ```typescript
 * import { scriptsMap } from 'virtual:conductor-scripts'
 * import { setGlobalScriptLoader, createScriptLoader } from '@ensemble-edge/conductor'
 *
 * setGlobalScriptLoader(createScriptLoader(scriptsMap))
 * ```
 */
export declare function setGlobalScriptLoader(loader: ScriptLoader): void;
/**
 * Get the global script loader
 * @throws Error if not initialized
 */
export declare function getGlobalScriptLoader(): ScriptLoader;
/**
 * Check if a global script loader is available
 */
export declare function hasGlobalScriptLoader(): boolean;
//# sourceMappingURL=script-loader.d.ts.map