/**
 * Template Engine Factory
 *
 * Creates template engines based on type.
 * Currently supports 'simple' engine out of the box.
 * Handlebars, Liquid, and MJML support can be added as optional dependencies.
 */

import type { TemplateEngine } from '../types/index.js';
import { BaseTemplateEngine } from './base.js';
import { SimpleTemplateEngine } from './simple.js';

/**
 * Create a template engine instance
 */
export function createTemplateEngine(engine: TemplateEngine): BaseTemplateEngine {
	switch (engine) {
		case 'simple':
			return new SimpleTemplateEngine();

		case 'handlebars':
			throw new Error(
				'Handlebars engine not implemented yet. ' +
					'Use "simple" engine or add handlebars support to your project.'
			);

		case 'liquid':
			throw new Error(
				'Liquid engine not implemented yet. ' +
					'Use "simple" engine or add liquidjs support to your project.'
			);

		case 'mjml':
			throw new Error(
				'MJML engine not implemented yet. ' +
					'Use "simple" engine or add mjml support to your project.'
			);

		default:
			throw new Error(`Unknown template engine: ${engine}`);
	}
}

/**
 * Check if an engine is available
 */
export function isEngineAvailable(engine: TemplateEngine): boolean {
	return engine === 'simple';
}

/**
 * Get list of available engines
 */
export function getAvailableEngines(): TemplateEngine[] {
	return ['simple'];
}

// Re-export types and classes
export { BaseTemplateEngine } from './base.js';
export { SimpleTemplateEngine } from './simple.js';
