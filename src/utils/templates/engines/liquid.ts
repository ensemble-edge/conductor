/**
 * Liquid Template Engine
 *
 * Shopify's Liquid templating with powerful filters and safe execution
 */

import { Liquid } from 'liquidjs';
import type { TemplateContext } from '../types.js';
import { BaseTemplateEngine } from './base.js';

/**
 * Liquid template engine
 */
export class LiquidTemplateEngine extends BaseTemplateEngine {
	name = 'liquid';
	private liquid: Liquid;
	private compiledTemplates: Map<string, any> = new Map();

	constructor() {
		super();
		this.liquid = new Liquid({
			cache: true,
			strictFilters: false, // Allow undefined filters to fail gracefully
			strictVariables: false, // Allow undefined variables
			trimTagLeft: false,
			trimTagRight: false,
			trimOutputLeft: false,
			trimOutputRight: false
		});

		// Register custom filters
		this.registerDefaultFilters();
	}

	/**
	 * Render a template with Liquid
	 */
	async render(template: string, context: TemplateContext): Promise<string> {
		try {
			// Check if we have a compiled version
			let compiledTemplate = this.compiledTemplates.get(template);

			if (!compiledTemplate) {
				compiledTemplate = this.liquid.parse(template);
				// Cache compiled template for reuse
				this.compiledTemplates.set(template, compiledTemplate);
			}

			return await this.liquid.render(compiledTemplate, context);
		} catch (error) {
			throw new Error(
				`Liquid render error: ${error instanceof Error ? error.message : String(error)}`
			);
		}
	}

	/**
	 * Validate template syntax
	 */
	async validate(template: string): Promise<{ valid: boolean; errors?: string[] }> {
		try {
			this.liquid.parse(template);
			return { valid: true };
		} catch (error) {
			return {
				valid: false,
				errors: [error instanceof Error ? error.message : String(error)]
			};
		}
	}

	/**
	 * Compile a template for repeated use
	 */
	async compile(template: string): Promise<any> {
		const compiled = this.liquid.parse(template);
		this.compiledTemplates.set(template, compiled);
		return compiled;
	}

	/**
	 * Register a helper function (Liquid calls them filters)
	 */
	registerHelper(name: string, fn: (...args: unknown[]) => unknown): void {
		this.liquid.registerFilter(name, fn);
	}

	/**
	 * Register default filters
	 */
	private registerDefaultFilters(): void {
		// Money filter - format as currency
		this.liquid.registerFilter('money', (value: any) => {
			const num = parseFloat(value);
			if (isNaN(num)) return value;
			return `$${num.toFixed(2)}`;
		});

		// Money with currency
		this.liquid.registerFilter('money_with_currency', (value: any, currency = 'USD') => {
			const num = parseFloat(value);
			if (isNaN(num)) return value;
			return new Intl.NumberFormat('en-US', {
				style: 'currency',
				currency: currency
			}).format(num);
		});

		// Phone filter - format phone number
		this.liquid.registerFilter('phone', (value: string) => {
			const cleaned = value.replace(/\D/g, '');
			if (cleaned.length === 10) {
				return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
			}
			return value;
		});

		// Pluralize filter
		this.liquid.registerFilter('pluralize', (count: number, singular: string, plural?: string) => {
			if (count === 1) return singular;
			return plural || `${singular}s`;
		});

		// Default filter (like Handlebars default helper)
		this.liquid.registerFilter('default', (value: any, defaultValue: any) => {
			return value ?? defaultValue;
		});

		// JSON filter
		this.liquid.registerFilter('json', (obj: any) => {
			try {
				return JSON.stringify(obj, null, 2);
			} catch {
				return String(obj);
			}
		});

		// Excerpt filter - truncate with ellipsis
		this.liquid.registerFilter('excerpt', (text: string, length = 200) => {
			if (typeof text !== 'string') return text;
			if (text.length <= length) return text;
			return text.substring(0, length).trim() + '...';
		});

		// Strip HTML tags
		this.liquid.registerFilter('strip_html', (text: string) => {
			if (typeof text !== 'string') return text;
			return text.replace(/<[^>]*>/g, '');
		});

		// Highlight filter - wrap search term in mark tags
		this.liquid.registerFilter('highlight', (text: string, term: string) => {
			if (!text || !term) return text;
			const regex = new RegExp(`(${term})`, 'gi');
			return text.replace(regex, '<mark>$1</mark>');
		});

		// File size filter
		this.liquid.registerFilter('file_size', (bytes: number) => {
			if (bytes === 0) return '0 Bytes';
			const k = 1024;
			const sizes = ['Bytes', 'KB', 'MB', 'GB'];
			const i = Math.floor(Math.log(bytes) / Math.log(k));
			return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
		});

		// Time ago filter
		this.liquid.registerFilter('time_ago', (date: Date | string) => {
			const d = date instanceof Date ? date : new Date(date);
			const now = new Date();
			const seconds = Math.floor((now.getTime() - d.getTime()) / 1000);

			const intervals = [
				{ label: 'year', seconds: 31536000 },
				{ label: 'month', seconds: 2592000 },
				{ label: 'week', seconds: 604800 },
				{ label: 'day', seconds: 86400 },
				{ label: 'hour', seconds: 3600 },
				{ label: 'minute', seconds: 60 },
				{ label: 'second', seconds: 1 }
			];

			for (const interval of intervals) {
				const count = Math.floor(seconds / interval.seconds);
				if (count >= 1) {
					return `${count} ${interval.label}${count > 1 ? 's' : ''} ago`;
				}
			}

			return 'just now';
		});
	}

	/**
	 * Clear the template cache
	 */
	clearCache(): void {
		this.compiledTemplates.clear();
	}
}
