/**
 * Template Loader
 *
 * Handles loading templates from various sources:
 * - Inline strings
 * - KV storage (Edgit-versioned templates)
 * - R2 storage (static templates)
 * - File system (development)
 */

import type { TemplateSource, TemplateLoadResult, TemplateEngine } from '../types/index.js';

/**
 * Detect template engine from file extension or content
 */
export function detectTemplateEngine(key: string, content?: string): TemplateEngine {
	// Check file extension
	if (key.endsWith('.hbs') || key.endsWith('.handlebars')) {
		return 'handlebars';
	}
	if (key.endsWith('.liquid')) {
		return 'liquid';
	}
	if (key.endsWith('.mjml')) {
		return 'mjml';
	}

	// Check content for MJML tags
	if (content && content.includes('<mjml>')) {
		return 'mjml';
	}

	// Check content for Handlebars syntax
	if (content && /\{\{.*\}\}/.test(content)) {
		return 'handlebars';
	}

	// Check content for Liquid syntax
	if (content && /\{%.*%\}/.test(content)) {
		return 'liquid';
	}

	// Default to simple template engine
	return 'simple';
}

/**
 * Load template from configured source
 */
export async function loadTemplate(
	source: TemplateSource,
	env?: { TEMPLATES?: KVNamespace; ASSETS?: R2Bucket }
): Promise<TemplateLoadResult> {
	// Inline template
	if (source.inline) {
		const engine = source.engine || detectTemplateEngine('inline', source.inline);
		return {
			content: source.inline,
			engine,
			source: 'inline'
		};
	}

	// KV template (Edgit-versioned)
	if (source.kv) {
		if (!env?.TEMPLATES) {
			throw new Error('KV namespace TEMPLATES is not configured');
		}

		const content = await env.TEMPLATES.get(source.kv, 'text');

		if (!content) {
			throw new Error(`Template not found in KV: ${source.kv}`);
		}

		const engine = source.engine || detectTemplateEngine(source.kv, content);
		return {
			content,
			engine,
			source: 'kv'
		};
	}

	// R2 template (static assets)
	if (source.r2) {
		if (!env?.ASSETS) {
			throw new Error('R2 bucket ASSETS is not configured');
		}

		const object = await env.ASSETS.get(source.r2);

		if (!object) {
			throw new Error(`Template not found in R2: ${source.r2}`);
		}

		const content = await object.text();
		const engine = source.engine || detectTemplateEngine(source.r2, content);
		return {
			content,
			engine,
			source: 'r2'
		};
	}

	// File template (development only - not available in Workers)
	if (source.file) {
		throw new Error(
			'File-based templates are not supported in Cloudflare Workers. ' +
				'Use inline, KV (TEMPLATES), or R2 (ASSETS) instead.'
		);
	}

	throw new Error('No valid template source specified (inline, kv, or r2)');
}

/**
 * Validate template source configuration
 */
export function validateTemplateSource(source: TemplateSource): { valid: boolean; errors?: string[] } {
	const errors: string[] = [];
	const sourceCount = [source.inline, source.kv, source.r2, source.file].filter(Boolean).length;

	if (sourceCount === 0) {
		errors.push('No template source specified (must provide inline, kv, r2, or file)');
	}

	if (sourceCount > 1) {
		errors.push('Multiple template sources specified (provide only one: inline, kv, r2, or file)');
	}

	return {
		valid: errors.length === 0,
		errors: errors.length > 0 ? errors : undefined
	};
}

/**
 * Normalize template source from string or object
 */
export function normalizeTemplateSource(source: string | TemplateSource): TemplateSource {
	if (typeof source === 'string') {
		// Detect source type from string format
		if (source.startsWith('kv://')) {
			return { kv: source.slice(5) };
		}
		if (source.startsWith('r2://')) {
			return { r2: source.slice(5) };
		}
		if (source.startsWith('file://')) {
			return { file: source.slice(7) };
		}
		// Default to inline
		return { inline: source };
	}

	return source;
}

/**
 * Cache key for template loading
 */
export function getTemplateCacheKey(source: TemplateSource): string | null {
	if (source.kv) {
		return `template:kv:${source.kv}`;
	}
	if (source.r2) {
		return `template:r2:${source.r2}`;
	}
	// Don't cache inline templates
	return null;
}
