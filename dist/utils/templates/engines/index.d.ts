/**
 * Template Engine Factory
 *
 * Creates template engines based on type.
 * Currently supports 'simple' engine out of the box.
 * Handlebars, Liquid, and MJML support can be added as optional dependencies.
 */
import type { TemplateEngine } from '../types.js';
import { BaseTemplateEngine } from './base.js';
/**
 * Create a template engine instance
 */
export declare function createTemplateEngine(engine: TemplateEngine): BaseTemplateEngine;
/**
 * Check if an engine is available
 */
export declare function isEngineAvailable(engine: TemplateEngine): boolean;
/**
 * Get list of available engines
 */
export declare function getAvailableEngines(): TemplateEngine[];
export { BaseTemplateEngine } from './base.js';
export { SimpleTemplateEngine } from './simple.js';
export { HandlebarsTemplateEngine } from './handlebars.js';
export { LiquidTemplateEngine } from './liquid.js';
export { MJMLTemplateEngine } from './mjml.js';
//# sourceMappingURL=index.d.ts.map