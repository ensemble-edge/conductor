/**
 * Component Loader
 *
 * Unified loader for all Edgit components:
 * - Templates (HTML/Handlebars)
 * - Prompts (AI instructions)
 * - Queries (SQL)
 * - Configs (JSON settings)
 * - Scripts (JavaScript/TypeScript)
 * - Schemas (JSON Schema definitions)
 * - Docs (Markdown documentation)
 *
 * URI Format: {protocol}://{path}[@{version}]
 * Version defaults to "latest" if not specified.
 *
 * Examples:
 * - template://components/header          → templates/components/header@latest
 * - template://components/header@latest   → templates/components/header@latest
 * - template://components/header@v1.0.0   → templates/components/header@v1.0.0
 * - prompt://analyze-company@prod         → prompts/analyze-company@prod
 * - script://transform-data@v1.0.0        → scripts/transform-data@v1.0.0
 * - schema://invoice@latest               → schemas/invoice@latest
 * - docs://getting-started@latest         → docs/getting-started@latest
 *
 * Cache Configuration:
 * - Default: All components cached for 1 hour (3600 seconds)
 * - Custom TTL: Pass options.cache.ttl for custom duration
 * - Bypass: Pass options.cache.bypass = true to skip cache
 *
 * Examples:
 * - await loader.load(uri)                        // Default 1h cache
 * - await loader.load(uri, { cache: { ttl: 7200 }}) // 2h cache
 * - await loader.load(uri, { cache: { bypass: true }}) // No cache
 */
import type { Cache } from '../cache/cache.js';
import type { Logger } from '../observability/types.js';
export type ComponentProtocol = 'template' | 'prompt' | 'query' | 'config' | 'script' | 'schema' | 'docs';
export interface ParsedComponentURI {
    protocol: ComponentProtocol;
    path: string;
    version: string;
    originalURI: string;
}
export interface ComponentLoaderOptions {
    kv: KVNamespace;
    cache?: Cache<string>;
    logger?: Logger;
    defaultVersion?: string;
}
export interface ComponentLoadOptions {
    cache?: {
        ttl?: number;
        bypass?: boolean;
    };
}
export declare class ComponentLoader {
    private kv;
    private cache?;
    private logger?;
    private defaultVersion;
    constructor(options: ComponentLoaderOptions);
    /**
     * Parse component URI
     *
     * Supports:
     * - template://components/header          (defaults to @latest)
     * - template://components/header@latest
     * - template://components/header@v1.0.0
     * - prompt://analyze-company@prod
     */
    parseURI(uri: string): ParsedComponentURI;
    /**
     * Map protocol to KV key prefix
     */
    private getPrefix;
    /**
     * Build KV key from parsed URI
     */
    private buildKVKey;
    /**
     * Build cache key for component
     */
    private buildCacheKey;
    /**
     * Load component content from KV with standard Conductor caching
     */
    load(uri: string, options?: ComponentLoadOptions): Promise<string>;
    /**
     * Load and parse JSON component
     */
    loadJSON<T = any>(uri: string, options?: ComponentLoadOptions): Promise<T>;
    /**
     * Load and evaluate compiled component (for JSX components/pages)
     */
    loadCompiled<T = any>(uri: string, options?: ComponentLoadOptions): Promise<T>;
    /**
     * Check if a component exists in KV
     */
    exists(uri: string): Promise<boolean>;
    /**
     * List all versions of a component
     */
    listVersions(protocol: ComponentProtocol, path: string): Promise<string[]>;
    /**
     * Invalidate cache for a component
     */
    invalidateCache(uri: string): Promise<void>;
}
/**
 * Create a ComponentLoader instance
 */
export declare function createComponentLoader(options: ComponentLoaderOptions): ComponentLoader;
//# sourceMappingURL=component-loader.d.ts.map