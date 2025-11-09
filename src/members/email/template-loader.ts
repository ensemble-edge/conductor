/**
 * Email Template Loader
 *
 * Loads and renders email templates from local files or KV storage
 * Supports Handlebars templating and Edgit versioning
 */

import type { KVNamespace } from '@cloudflare/workers-types';

/**
 * Template data for rendering
 */
export interface TemplateData {
	[key: string]: any;
}

/**
 * Template loader configuration
 */
export interface TemplateLoaderConfig {
	/** KV namespace for templates (optional) */
	kv?: KVNamespace;
	/** Local templates directory (optional) */
	localDir?: string;
	/** Default template version */
	defaultVersion?: string;
}

/**
 * Template reference parsing result
 */
interface TemplateRef {
	/** Storage type */
	type: 'kv' | 'local' | 'inline';
	/** Template path */
	path: string;
	/** Template version (for KV) */
	version?: string;
}

/**
 * Email Template Loader
 */
export class TemplateLoader {
	private kv?: KVNamespace;
	private localDir: string;
	private defaultVersion: string;
	private cache: Map<string, string>;

	constructor(config: TemplateLoaderConfig = {}) {
		this.kv = config.kv;
		this.localDir = config.localDir || 'templates';
		this.defaultVersion = config.defaultVersion || 'latest';
		this.cache = new Map();
	}

	/**
	 * Load and render template
	 */
	async render(template: string, data: TemplateData = {}): Promise<string> {
		// Parse template reference
		const ref = this.parseTemplateRef(template);

		// Load template content
		const content = await this.loadTemplate(ref);

		// Render template
		return this.renderTemplate(content, data);
	}

	/**
	 * Parse template reference
	 */
	private parseTemplateRef(template: string): TemplateRef {
		// KV reference: kv://templates/email/welcome@v1.0.0
		if (template.startsWith('kv://')) {
			const path = template.slice(5);
			const [pathPart, version] = path.split('@');
			return {
				type: 'kv',
				path: pathPart,
				version: version || this.defaultVersion,
			};
		}

		// Local file reference: templates/email/welcome.html
		if (template.includes('/') || template.endsWith('.html') || template.endsWith('.mjml')) {
			return {
				type: 'local',
				path: template,
			};
		}

		// Inline HTML
		return {
			type: 'inline',
			path: template,
		};
	}

	/**
	 * Load template from storage
	 */
	private async loadTemplate(ref: TemplateRef): Promise<string> {
		// Check cache first
		const cacheKey = `${ref.type}:${ref.path}${ref.version ? `@${ref.version}` : ''}`;
		if (this.cache.has(cacheKey)) {
			return this.cache.get(cacheKey)!;
		}

		let content: string;

		switch (ref.type) {
			case 'kv':
				content = await this.loadFromKv(ref.path, ref.version);
				break;

			case 'local':
				content = await this.loadFromLocal(ref.path);
				break;

			case 'inline':
				content = ref.path;
				break;
		}

		// Cache template
		this.cache.set(cacheKey, content);

		return content;
	}

	/**
	 * Load template from KV
	 */
	private async loadFromKv(path: string, version?: string): Promise<string> {
		if (!this.kv) {
			throw new Error('KV namespace not configured for template loading');
		}

		// Build KV key: templates/email/welcome@v1.0.0
		const key = version ? `${path}@${version}` : path;

		const content = await this.kv.get(key, 'text');
		if (!content) {
			throw new Error(`Template not found in KV: ${key}`);
		}

		return content;
	}

	/**
	 * Load template from local file system
	 */
	private async loadFromLocal(path: string): Promise<string> {
		// In Cloudflare Workers, we can't access the file system directly
		// Templates must be bundled with the Worker or loaded from KV
		throw new Error(
			'Local file system access not available in Cloudflare Workers. ' +
				'Use KV storage (kv://...) or inline templates instead.'
		);
	}

	/**
	 * Render template with Handlebars
	 */
	private renderTemplate(content: string, data: TemplateData): string {
		// Simple Handlebars-style variable replacement
		// For more complex templates, use the handlebars library
		let rendered = content;

		// Replace {{variable}} with data values
		rendered = rendered.replace(/\{\{([^}]+)\}\}/g, (match, key) => {
			const trimmedKey = key.trim();

			// Handle nested properties: {{user.name}}
			const value = this.getNestedValue(data, trimmedKey);

			// Return value or empty string if undefined
			return value !== undefined ? String(value) : '';
		});

		// Handle {{#if condition}} blocks (simple implementation)
		rendered = rendered.replace(
			/\{\{#if\s+([^}]+)\}\}([\s\S]*?)\{\{\/if\}\}/g,
			(match, condition, content) => {
				const value = this.getNestedValue(data, condition.trim());
				return value ? content : '';
			}
		);

		// Handle {{#each array}} blocks (simple implementation)
		rendered = rendered.replace(
			/\{\{#each\s+([^}]+)\}\}([\s\S]*?)\{\{\/each\}\}/g,
			(match, arrayKey, template) => {
				const array = this.getNestedValue(data, arrayKey.trim());
				if (!Array.isArray(array)) return '';

				return array
					.map((item) => {
						// Render template for each item
						return this.renderTemplate(template, { ...data, this: item });
					})
					.join('');
			}
		);

		return rendered;
	}

	/**
	 * Get nested value from object
	 */
	private getNestedValue(obj: any, path: string): any {
		if (path === 'this') return obj;

		const keys = path.split('.');
		let value = obj;

		for (const key of keys) {
			if (value === undefined || value === null) return undefined;
			value = value[key];
		}

		return value;
	}

	/**
	 * Clear template cache
	 */
	clearCache(): void {
		this.cache.clear();
	}

	/**
	 * Preload template into cache
	 */
	async preload(template: string): Promise<void> {
		const ref = this.parseTemplateRef(template);
		await this.loadTemplate(ref);
	}
}

/**
 * Create template loader instance
 */
export function createTemplateLoader(config?: TemplateLoaderConfig): TemplateLoader {
	return new TemplateLoader(config);
}
