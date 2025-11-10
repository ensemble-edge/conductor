/**
 * Template Engine Factory
 *
 * Creates template engines based on type.
 * Currently supports 'simple' engine out of the box.
 * Handlebars, Liquid, and MJML support can be added as optional dependencies.
 */

import type { TemplateEngine } from '../types.js';
import { BaseTemplateEngine } from './base.js';
import { SimpleTemplateEngine } from './simple.js';
import { HandlebarsTemplateEngine } from './handlebars.js';
import { LiquidTemplateEngine } from './liquid.js';
import { MJMLTemplateEngine } from './mjml.js';

/**
 * Create a template engine instance
 */
export function createTemplateEngine(engine: TemplateEngine): BaseTemplateEngine {
	switch (engine) {
		case 'simple':
			return new SimpleTemplateEngine();

		case 'handlebars':
			return new HandlebarsTemplateEngine();

		case 'liquid':
			return new LiquidTemplateEngine();

		case 'mjml':
			return new MJMLTemplateEngine();

		default:
			throw new Error(`Unknown template engine: ${engine}`);
	}
}

/**
 * Check if an engine is available
 */
export function isEngineAvailable(engine: TemplateEngine): boolean {
	return engine === 'simple' || engine === 'handlebars' || engine === 'liquid' || engine === 'mjml';
}

/**
 * Get list of available engines
 */
export function getAvailableEngines(): TemplateEngine[] {
	return ['simple', 'handlebars', 'liquid', 'mjml']; // simple first as default
}

// Re-export types and classes
export { BaseTemplateEngine } from './base.js';
export { SimpleTemplateEngine } from './simple.js';
export { HandlebarsTemplateEngine } from './handlebars.js';
export { LiquidTemplateEngine } from './liquid.js';
export { MJMLTemplateEngine } from './mjml.js';
