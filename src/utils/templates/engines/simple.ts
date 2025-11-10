/**
 * Simple Template Engine
 *
 * Lightweight template engine with {{variable}} syntax.
 * No external dependencies, perfect for basic interpolation.
 *
 * Supports:
 * - Variables: {{name}}
 * - Nested paths: {{user.name}}
 * - Conditionals: {{#if condition}}...{{/if}}
 * - Loops: {{#each items}}...{{/each}}
 * - Partials: {{> componentName}} or {{> uri://path@version}}
 * - Helpers: {{uppercase name}}
 */

import { BaseTemplateEngine } from './base.js';
import type { TemplateContext } from '../types/index.js';
import type { ComponentLoader } from '../../../runtime/component-loader.js';

export class SimpleTemplateEngine extends BaseTemplateEngine {
	name = 'simple';
	private componentLoader?: ComponentLoader;
	private partials: Map<string, string> = new Map();

	/**
	 * Set the component loader for partial support
	 */
	setComponentLoader(loader: ComponentLoader): void {
		this.componentLoader = loader;
	}

	/**
	 * Register a partial template
	 */
	registerPartial(name: string, content: string): void {
		this.partials.set(name, content);
	}

	/**
	 * Render template with simple {{variable}} replacement
	 */
	async render(template: string, context: TemplateContext): Promise<string> {
		let result = template;

		// Handle both structured context {data: {...}} and flat context {...}
		const data = (context as any).data !== undefined ? (context as any).data : context;
		const helpers = (context as any).helpers;

		// Process conditionals FIRST (recursively processes content)
		result = await this.processConditionalsRecursive(result, data, context);

		// Process loops SECOND (recursively processes content)
		result = await this.processLoopsRecursive(result, data, context);

		// Process partials THIRD (partials may contain variables)
		result = await this.processPartials(result, { ...context, data });

		// Replace {{variable}} with context data FOURTH
		result = result.replace(/\{\{(\s*[\w.]+\s*)\}\}/g, (match, key) => {
			const trimmedKey = key.trim();
			const value = this.resolveValue(data, trimmedKey);

			if (value === undefined) {
				return ''; // undefined -> empty string
			}

			if (value === null) {
				return 'null'; // null -> string "null"
			}

			return String(value);
		});

		// Call helpers if available
		if (helpers) {
			result = this.processHelpers(result, helpers);
		}

		return result;
	}

	/**
	 * Validate template syntax
	 */
	async validate(template: string): Promise<{ valid: boolean; errors?: string[] }> {
		const errors: string[] = [];

		// Check for balanced braces
		const openBraces = (template.match(/\{\{/g) || []).length;
		const closeBraces = (template.match(/\}\}/g) || []).length;

		if (openBraces !== closeBraces) {
			errors.push(`Unbalanced braces: ${openBraces} opening {{ but ${closeBraces} closing }}`);
		}

		// Check for balanced conditionals
		const ifBlocks = (template.match(/\{\{#if\s+\w+\}\}/g) || []).length;
		const endifBlocks = (template.match(/\{\{\/if\}\}/g) || []).length;

		if (ifBlocks !== endifBlocks) {
			errors.push(`Unbalanced conditionals: ${ifBlocks} {{#if}} but ${endifBlocks} {{/if}}`);
		}

		// Check for balanced loops
		const eachBlocks = (template.match(/\{\{#each\s+\w+\}\}/g) || []).length;
		const endEachBlocks = (template.match(/\{\{\/each\}\}/g) || []).length;

		if (eachBlocks !== endEachBlocks) {
			errors.push(`Unbalanced loops: ${eachBlocks} {{#each}} but ${endEachBlocks} {{/each}}`);
		}

		return {
			valid: errors.length === 0,
			errors: errors.length > 0 ? errors : undefined
		};
	}

	/**
	 * Resolve nested object path (e.g., "user.name" -> context.user.name)
	 */
	private resolveValue(data: Record<string, unknown>, path: string): unknown {
		const keys = path.split('.');
		let value: unknown = data;

		for (const key of keys) {
			if (value && typeof value === 'object' && key in value) {
				value = (value as Record<string, unknown>)[key];
			} else {
				return undefined;
			}
		}

		return value;
	}

	/**
	 * Process {{#if condition}}...{{else}}...{{/if}} blocks recursively
	 * This allows conditionals to contain partials and other templates
	 */
	private async processConditionalsRecursive(
		template: string,
		data: Record<string, unknown>,
		context: TemplateContext
	): Promise<string> {
		// Use a manual loop to process all conditionals
		const conditionalRegex = /\{\{#if\s+(\w+)\}\}([\s\S]*?)\{\{\/if\}\}/;
		let result = template;
		let match;

		while ((match = conditionalRegex.exec(result)) !== null) {
			const [fullMatch, key, content] = match;
			const value = this.resolveValue(data, key);

			// Check if there's an {{else}} block
			const elseMatch = content.match(/^([\s\S]*?)\{\{else\}\}([\s\S]*)$/);

			let selectedContent: string;
			if (elseMatch) {
				const [, ifContent, elseContent] = elseMatch;
				selectedContent = value ? ifContent : elseContent;
			} else {
				selectedContent = value ? content : '';
			}

			// Recursively render the selected content with same context
			const rendered = await this.render(selectedContent, { ...context, data });
			result = result.replace(fullMatch, rendered);
		}

		return result;
	}

	/**
	 * Process {{#each array}}...{{/each}} blocks recursively
	 * This allows loops to contain partials with access to loop item data
	 */
	private async processLoopsRecursive(
		template: string,
		data: Record<string, unknown>,
		context: TemplateContext
	): Promise<string> {
		// Use a manual loop to process all loops
		const loopRegex = /\{\{#each\s+(\w+)\}\}([\s\S]*?)\{\{\/each\}\}/;
		let result = template;
		let match;

		while ((match = loopRegex.exec(result)) !== null) {
			const [fullMatch, key, content] = match;
			const array = this.resolveValue(data, key);

			if (!Array.isArray(array)) {
				result = result.replace(fullMatch, '');
				continue;
			}

			// Render each item with its own context
			const renderedItems = await Promise.all(
				array.map(async (item, index) => {
					// Build item context
					const itemData = typeof item === 'object' && item !== null
						? { ...data, ...item, '@index': index, '@first': index === 0, '@last': index === array.length - 1 }
						: { ...data, 'this': item, '@index': index, '@first': index === 0, '@last': index === array.length - 1 };

					// Recursively render content with item context
					return await this.render(content, { ...context, data: itemData });
				})
			);

			result = result.replace(fullMatch, renderedItems.join(''));
		}

		return result;
	}

	/**
	 * Process {{#if condition}}...{{else}}...{{/if}} blocks (non-recursive, legacy)
	 * @deprecated Use processConditionalsRecursive instead
	 */
	private processConditionals(template: string, data: Record<string, unknown>): string {
		return template.replace(/\{\{#if\s+(\w+)\}\}([\s\S]*?)\{\{\/if\}\}/g, (match, key, content) => {
			const value = this.resolveValue(data, key);

			// Check if there's an {{else}} block
			const elseMatch = content.match(/^([\s\S]*?)\{\{else\}\}([\s\S]*)$/);

			if (elseMatch) {
				const [, ifContent, elseContent] = elseMatch;
				return value ? ifContent : elseContent;
			}

			return value ? content : '';
		});
	}

	/**
	 * Process {{#each array}}...{{/each}} blocks
	 */
	private processLoops(template: string, data: Record<string, unknown>): string {
		return template.replace(/\{\{#each\s+(\w+)\}\}([\s\S]*?)\{\{\/each\}\}/g, (match, key, content) => {
			const array = this.resolveValue(data, key);

			if (!Array.isArray(array)) {
				return '';
			}

			return array
				.map((item, index) => {
					let itemContent = content;

					// Replace {{this}} with item value
					itemContent = itemContent.replace(/\{\{this\}\}/g, String(item));

					// Replace {{@index}} with index
					itemContent = itemContent.replace(/\{\{@index\}\}/g, String(index));

					// Replace {{@first}} with boolean
					itemContent = itemContent.replace(/\{\{@first\}\}/g, String(index === 0));

					// Replace {{@last}} with boolean
					itemContent = itemContent.replace(/\{\{@last\}\}/g, String(index === array.length - 1));

					// If item is an object, replace {{key}} with item[key]
					if (typeof item === 'object' && item !== null) {
						itemContent = itemContent.replace(/\{\{(\w+)\}\}/g, (m: string, k: string) => {
							const val = (item as Record<string, unknown>)[k];
							return val !== undefined ? String(val) : m;
						});
					}

					return itemContent;
				})
				.join('');
		});
	}

	/**
	 * Process {{> partialName}} or {{> uri://path@version}} includes
	 */
	private async processPartials(template: string, context: TemplateContext): Promise<string> {
		// Match {{> partialName}} or {{> uri://path@version}}
		const partialRegex = /\{\{>\s*([^}\s]+)(?:\s+([^}]+))?\s*\}\}/g;
		const matches = Array.from(template.matchAll(partialRegex));

		if (matches.length === 0) {
			return template;
		}

		let result = template;

		// Process each partial
		for (const match of matches) {
			const [fullMatch, partialRef, argsStr] = match;

			// Parse arguments if provided (e.g., {{> header title="My Site"}})
			const partialData = argsStr ? this.parsePartialArgs(argsStr, context.data) : context.data;

			try {
				let partialContent: string;

				// Check if it's a URI (contains ://)
				if (partialRef.includes('://')) {
					// Load from ComponentLoader
					if (!this.componentLoader) {
						throw new Error(
							`Component loader not configured. ` +
							`Cannot load component: ${partialRef}`
						);
					}

					partialContent = await this.componentLoader.load(partialRef);
				} else {
					// Look up registered partial
					partialContent = this.partials.get(partialRef) || '';

					if (!partialContent) {
						throw new Error(`Partial not found: ${partialRef}`);
					}
				}

				// Recursively render the partial with its data
				const rendered = await this.render(partialContent, {
					...context,
					data: partialData
				});

				result = result.replace(fullMatch, rendered);
			} catch (error) {
				// Include error in output for debugging
				const errorMsg = error instanceof Error ? error.message : String(error);
				result = result.replace(
					fullMatch,
					`<!-- Partial error: ${errorMsg} -->`
				);
			}
		}

		return result;
	}

	/**
	 * Parse partial arguments
	 * Example: title="My Site" count=5 -> { title: "My Site", count: 5 }
	 */
	private parsePartialArgs(argsStr: string, contextData: Record<string, unknown>): Record<string, unknown> {
		const args: Record<string, unknown> = { ...contextData };

		// Match key=value or key="value"
		const argRegex = /(\w+)=(?:"([^"]*)"|'([^']*)'|(\S+))/g;
		let match;

		while ((match = argRegex.exec(argsStr)) !== null) {
			const [, key, quotedVal1, quotedVal2, unquotedVal] = match;
			const value = quotedVal1 || quotedVal2 || unquotedVal;

			// Try to resolve from context if it looks like a variable
			if (value && !value.startsWith('"') && !value.startsWith("'")) {
				const contextValue = this.resolveValue(contextData, value);
				args[key] = contextValue !== undefined ? contextValue : value;
			} else {
				args[key] = value;
			}
		}

		return args;
	}

	/**
	 * Process helper functions {{helper arg1 arg2}}
	 */
	private processHelpers(template: string, helpers: Record<string, (...args: unknown[]) => unknown>): string {
		return template.replace(/\{\{(\w+)\s+([^}]+)\}\}/g, (match, helperName, args) => {
			const helper = helpers[helperName];

			if (!helper) {
				return match; // Keep original if helper not found
			}

			// Parse arguments (simple space-separated)
			const parsedArgs = args.split(/\s+/);

			try {
				const result = helper(...parsedArgs);
				return String(result);
			} catch {
				return match; // Keep original on error
			}
		});
	}
}
