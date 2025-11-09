/**
 * Base Template Engine
 *
 * Abstract base class for all template rendering engines.
 */

import type { TemplateContext } from '../types/index.js';

export abstract class BaseTemplateEngine {
	abstract name: string;

	/**
	 * Render a template with the given context
	 */
	abstract render(template: string, context: TemplateContext): Promise<string>;

	/**
	 * Validate template syntax
	 */
	abstract validate(template: string): Promise<{ valid: boolean; errors?: string[] }>;

	/**
	 * Compile a template for repeated use (optional optimization)
	 */
	async compile(template: string): Promise<unknown> {
		// Default: no compilation
		return template;
	}

	/**
	 * Register a helper function
	 */
	registerHelper(name: string, fn: (...args: unknown[]) => unknown): void {
		// Default: no-op (engines can override)
	}

	/**
	 * Register a partial template
	 */
	registerPartial(name: string, template: string): void {
		// Default: no-op (engines can override)
	}
}
