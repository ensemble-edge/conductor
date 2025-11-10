/**
 * Component Loader
 *
 * Unified loader for all Edgit components:
 * - Templates (HTML/Handlebars)
 * - Prompts (AI instructions)
 * - Queries (SQL)
 * - Configs (JSON settings)
 * - Components (Compiled JSX)
 * - Pages (Compiled JSX pages)
 * - Forms (Form definitions)
 *
 * URI Format: {protocol}://{path}[@{version}]
 * Version defaults to "latest" if not specified.
 *
 * Examples:
 * - template://components/header          → templates/components/header@latest
 * - template://components/header@latest   → templates/components/header@latest
 * - template://components/header@v1.0.0   → templates/components/header@v1.0.0
 * - prompt://analyze-company@prod         → prompts/analyze-company@prod
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
import { Result } from '../types/result.js';

export type ComponentProtocol =
	| 'template'   // Handlebars/HTML templates
	| 'prompt'     // AI prompts for Think members
	| 'query'      // SQL queries for Data members
	| 'config'     // Configuration objects
	| 'component'  // Compiled JSX components
	| 'page'       // Compiled JSX pages
	| 'form';      // Form definitions

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
		ttl?: number;      // Cache duration in seconds
		bypass?: boolean;  // Skip cache for this load
	};
}

export class ComponentLoader {
	private kv: KVNamespace;
	private cache?: Cache<string>;
	private logger?: Logger;
	private defaultVersion: string;

	constructor(options: ComponentLoaderOptions) {
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
	parseURI(uri: string): ParsedComponentURI {
		// Match: protocol://path or protocol://path@version
		const match = uri.match(/^(\w+):\/\/([^@]+)(?:@(.+))?$/);

		if (!match) {
			throw new Error(
				`Invalid component URI: ${uri}\n` +
				`Expected format: {protocol}://{path}[@{version}]\n` +
				`Examples:\n` +
				`  - template://components/header\n` +
				`  - template://components/header@latest\n` +
				`  - prompt://analyze-company@v1.0.0`
			);
		}

		const [, protocol, path, version] = match;

		// Validate protocol
		const validProtocols: ComponentProtocol[] = [
			'template', 'prompt', 'query', 'config', 'component', 'page', 'form'
		];

		if (!validProtocols.includes(protocol as ComponentProtocol)) {
			throw new Error(
				`Invalid protocol: ${protocol}\n` +
				`Valid protocols: ${validProtocols.join(', ')}`
			);
		}

		return {
			protocol: protocol as ComponentProtocol,
			path,
			version: version || this.defaultVersion, // Default to "latest"
			originalURI: uri
		};
	}

	/**
	 * Map protocol to KV key prefix
	 */
	private getPrefix(protocol: ComponentProtocol): string {
		const prefixMap: Record<ComponentProtocol, string> = {
			template: 'templates',
			prompt: 'prompts',
			query: 'queries',
			config: 'configs',
			component: 'components',
			page: 'pages',
			form: 'forms'
		};
		return prefixMap[protocol];
	}

	/**
	 * Build KV key from parsed URI
	 */
	private buildKVKey(parsed: ParsedComponentURI): string {
		const prefix = this.getPrefix(parsed.protocol);
		return `${prefix}/${parsed.path}@${parsed.version}`;
	}

	/**
	 * Build cache key for component
	 */
	private buildCacheKey(uri: string): string {
		return `components:${uri}`;
	}

	/**
	 * Load component content from KV with standard Conductor caching
	 */
	async load(uri: string, options?: ComponentLoadOptions): Promise<string> {
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
			throw new Error(
				`Component not found: ${uri}\n` +
				`KV key: ${kvKey}\n` +
				`Make sure the component is deployed to KV with:\n` +
				`  edgit components add <name> <path> ${parsed.protocol}\n` +
				`  edgit tag create <name> ${parsed.version}\n` +
				`  edgit deploy set <name> ${parsed.version} --to production`
			);
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
	async loadJSON<T = any>(uri: string, options?: ComponentLoadOptions): Promise<T> {
		const content = await this.load(uri, options);
		try {
			return JSON.parse(content);
		} catch (error) {
			const err = error instanceof Error ? error : new Error(String(error));
			this.logger?.error('JSON parse error', err, { uri });
			throw new Error(
				`Failed to parse JSON component: ${uri}\n` +
				`Error: ${err.message}`
			);
		}
	}

	/**
	 * Load and evaluate compiled component (for JSX components/pages)
	 */
	async loadCompiled<T = any>(uri: string, options?: ComponentLoadOptions): Promise<T> {
		const content = await this.load(uri, options);

		try {
			// Compiled components are stored as ES module exports
			// We wrap in a function and evaluate
			const module = new Function('exports', content);
			const exports: any = {};
			module(exports);

			// Return default export or entire exports object
			return (exports.default || exports) as T;
		} catch (error) {
			const err = error instanceof Error ? error : new Error(String(error));
			this.logger?.error('Component compilation error', err, { uri });
			throw new Error(
				`Failed to load compiled component: ${uri}\n` +
				`Error: ${err.message}\n` +
				`Make sure the component was compiled with: npm run build:pages`
			);
		}
	}

	/**
	 * Check if a component exists in KV
	 */
	async exists(uri: string): Promise<boolean> {
		try {
			const parsed = this.parseURI(uri);
			const kvKey = this.buildKVKey(parsed);
			const metadata = await this.kv.getWithMetadata(kvKey);
			return metadata.value !== null;
		} catch (error) {
			this.logger?.debug('Component exists check failed', { uri, error });
			return false;
		}
	}

	/**
	 * List all versions of a component
	 */
	async listVersions(protocol: ComponentProtocol, path: string): Promise<string[]> {
		const prefix = this.getPrefix(protocol);
		const listPrefix = `${prefix}/${path}@`;

		const list = await this.kv.list({ prefix: listPrefix });

		return list.keys.map(key => {
			// Extract version from key: "templates/components/header@v1.0.0"
			const match = key.name.match(/@(.+)$/);
			return match ? match[1] : 'unknown';
		});
	}

	/**
	 * Invalidate cache for a component
	 */
	async invalidateCache(uri: string): Promise<void> {
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
export function createComponentLoader(options: ComponentLoaderOptions): ComponentLoader {
	return new ComponentLoader(options);
}
