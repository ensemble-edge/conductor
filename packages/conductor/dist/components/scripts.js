/**
 * Script Registry
 *
 * Provides typed access to JavaScript/TypeScript scripts from KV storage.
 * Scripts can be dynamically loaded and executed at runtime.
 *
 * @module components/scripts
 */
import { parseNameWithVersion } from './registry.js';
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
export class ScriptRegistry {
    constructor(parent) {
        this.parent = parent;
    }
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
    async get(nameOrRef) {
        const { name, version } = parseNameWithVersion(nameOrRef);
        const ref = `scripts/${name}@${version}`;
        const content = await this.parent.resolve(ref);
        // Handle both raw string and structured object
        if (typeof content === 'string') {
            return {
                content,
                metadata: { name, version },
            };
        }
        return {
            content: content.content || content.code || String(content),
            metadata: {
                name,
                version,
                description: content.description,
                exports: content.exports,
            },
        };
    }
    /**
     * Get raw script content as string
     *
     * @param nameOrRef - Script name with optional version
     * @returns Raw script content
     */
    async getContent(nameOrRef) {
        const script = await this.get(nameOrRef);
        return script.content;
    }
    /**
     * Check if a script exists
     *
     * @param nameOrRef - Script name with optional version
     * @returns True if script exists
     */
    async exists(nameOrRef) {
        try {
            await this.get(nameOrRef);
            return true;
        }
        catch {
            return false;
        }
    }
}
