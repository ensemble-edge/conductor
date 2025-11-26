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
export class ComponentLoader {
    constructor(options) {
        this.kv = options.kv;
        this.cache = options.cache;
        this.logger = options.logger;
        this.defaultVersion = options.defaultVersion || 'latest';
    }
    /**
     * Parse component URI
     *
     * Supports:
     * - template://components/header          (defaults to @latest)
     * - template://components/header@latest
     * - template://components/header@v1.0.0
     * - prompt://analyze-company@prod
     */
    parseURI(uri) {
        // Match: protocol://path or protocol://path@version
        const match = uri.match(/^(\w+):\/\/([^@]+)(?:@(.+))?$/);
        if (!match) {
            throw new Error(`Invalid component URI: ${uri}\n` +
                `Expected format: {protocol}://{path}[@{version}]\n` +
                `Examples:\n` +
                `  - template://components/header\n` +
                `  - template://components/header@latest\n` +
                `  - prompt://analyze-company@v1.0.0`);
        }
        const [, protocol, path, version] = match;
        // Validate protocol
        const validProtocols = [
            'template',
            'prompt',
            'query',
            'config',
            'script',
            'schema',
            'docs',
        ];
        if (!validProtocols.includes(protocol)) {
            throw new Error(`Invalid protocol: ${protocol}\n` + `Valid protocols: ${validProtocols.join(', ')}`);
        }
        return {
            protocol: protocol,
            path,
            version: version || this.defaultVersion, // Default to "latest"
            originalURI: uri,
        };
    }
    /**
     * Map protocol to KV key prefix
     */
    getPrefix(protocol) {
        const prefixMap = {
            template: 'templates',
            prompt: 'prompts',
            query: 'queries',
            config: 'configs',
            script: 'scripts',
            schema: 'schemas',
            docs: 'docs',
        };
        return prefixMap[protocol];
    }
    /**
     * Build KV key from parsed URI
     */
    buildKVKey(parsed) {
        const prefix = this.getPrefix(parsed.protocol);
        return `${prefix}/${parsed.path}@${parsed.version}`;
    }
    /**
     * Build cache key for component
     */
    buildCacheKey(uri) {
        return `components:${uri}`;
    }
    /**
     * Load component content from KV with standard Conductor caching
     */
    async load(uri, options) {
        const cacheKey = this.buildCacheKey(uri);
        const bypass = options?.cache?.bypass ?? false;
        const ttl = options?.cache?.ttl ?? 3600;
        // Check standard Conductor cache first (unless bypassed)
        if (this.cache && !bypass) {
            const cacheResult = await this.cache.get(cacheKey);
            if (cacheResult.success && cacheResult.value !== null) {
                this.logger?.debug('Component cache hit', { uri, cacheKey });
                return cacheResult.value;
            }
        }
        // Parse URI
        const parsed = this.parseURI(uri);
        const kvKey = this.buildKVKey(parsed);
        // Load from KV
        this.logger?.debug('Loading component from KV', { uri, kvKey, bypass });
        const content = await this.kv.get(kvKey, 'text');
        if (!content) {
            this.logger?.warn('Component not found', { uri, kvKey });
            throw new Error(`Component not found: ${uri}\n` +
                `KV key: ${kvKey}\n` +
                `Make sure the component is deployed to KV with:\n` +
                `  edgit components add <name> <path> ${parsed.protocol}\n` +
                `  edgit tag create <name> ${parsed.version}\n` +
                `  edgit deploy set <name> ${parsed.version} --to production`);
        }
        // Cache using standard Conductor cache (unless bypassed)
        if (this.cache && !bypass) {
            const cacheResult = await this.cache.set(cacheKey, content, { ttl });
            if (cacheResult.success) {
                this.logger?.debug('Component cached', { uri, cacheKey, ttl });
            }
        }
        return content;
    }
    /**
     * Load and parse JSON component
     */
    async loadJSON(uri, options) {
        const content = await this.load(uri, options);
        try {
            return JSON.parse(content);
        }
        catch (error) {
            const err = error instanceof Error ? error : new Error(String(error));
            this.logger?.error('JSON parse error', err, { uri });
            throw new Error(`Failed to parse JSON component: ${uri}\n` + `Error: ${err.message}`);
        }
    }
    /**
     * Load and evaluate compiled component (for JSX components/pages)
     *
     * @deprecated This method uses new Function() which is blocked in Cloudflare Workers.
     * For scripts, use the ScriptLoader with bundled scripts instead:
     *
     * ```typescript
     * import { scriptsMap } from 'virtual:conductor-scripts'
     * import { createScriptLoader } from '@ensemble-edge/conductor'
     *
     * const loader = createScriptLoader(scriptsMap)
     * const handler = loader.resolve('script://my-script')
     * ```
     *
     * For other compiled components, bundle them at build time using Vite plugins.
     */
    async loadCompiled(uri, options) {
        // Log deprecation warning
        this.logger?.warn('loadCompiled() is deprecated and will not work in Cloudflare Workers', {
            uri,
        });
        const content = await this.load(uri, options);
        try {
            // Compiled components are stored as ES module exports
            // We wrap in a function and evaluate
            // NOTE: This uses new Function() which is blocked in Cloudflare Workers
            const module = new Function('exports', content);
            const exports = {};
            module(exports);
            // Return default export or entire exports object
            return (exports.default || exports);
        }
        catch (error) {
            const err = error instanceof Error ? error : new Error(String(error));
            this.logger?.error('Component compilation error', err, { uri });
            throw new Error(`Failed to load compiled component: ${uri}\n` +
                `Error: ${err.message}\n\n` +
                `Note: This method uses new Function() which is blocked in Cloudflare Workers.\n` +
                `For Workers compatibility, use bundled scripts via script:// URIs instead.\n` +
                `See: https://docs.ensemble.ai/conductor/guides/migrate-inline-code`);
        }
    }
    /**
     * Check if a component exists in KV
     */
    async exists(uri) {
        try {
            const parsed = this.parseURI(uri);
            const kvKey = this.buildKVKey(parsed);
            const metadata = await this.kv.getWithMetadata(kvKey);
            return metadata.value !== null;
        }
        catch (error) {
            this.logger?.debug('Component exists check failed', { uri, error });
            return false;
        }
    }
    /**
     * List all versions of a component
     */
    async listVersions(protocol, path) {
        const prefix = this.getPrefix(protocol);
        const listPrefix = `${prefix}/${path}@`;
        const list = await this.kv.list({ prefix: listPrefix });
        return list.keys.map((key) => {
            // Extract version from key: "templates/components/header@v1.0.0"
            const match = key.name.match(/@(.+)$/);
            return match ? match[1] : 'unknown';
        });
    }
    /**
     * Invalidate cache for a component
     */
    async invalidateCache(uri) {
        if (this.cache) {
            const cacheKey = this.buildCacheKey(uri);
            const result = await this.cache.delete(cacheKey);
            if (result.success) {
                this.logger?.info('Component cache invalidated', { uri, cacheKey });
            }
        }
    }
}
/**
 * Create a ComponentLoader instance
 */
export function createComponentLoader(options) {
    return new ComponentLoader(options);
}
