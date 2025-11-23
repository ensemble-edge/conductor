/**
 * Template Engine Factory
 *
 * Creates template engines based on type.
 * Supports Workers-compatible engines: 'simple' and 'liquid'
 * Note: handlebars/mjml removed - use eval(), fail in Cloudflare Workers
 */
import type { TemplateEngine } from '../types.js';
import { BaseTemplateEngine } from './base.js';
/**
 * Create a template engine instance (Workers-compatible only)
 */
export declare function createTemplateEngine(engine: TemplateEngine): BaseTemplateEngine;
/**
 * Check if an engine is available (Workers-compatible)
 */
export declare function isEngineAvailable(engine: TemplateEngine): boolean;
/**
 * Get list of available engines (Workers-compatible)
 */
export declare function getAvailableEngines(): TemplateEngine[];
export { BaseTemplateEngine } from './base.js';
export { SimpleTemplateEngine } from './simple.js';
export { HandlebarsTemplateEngine } from './handlebars.js';
export { LiquidTemplateEngine } from './liquid.js';
export { MJMLTemplateEngine } from './mjml.js';
//# sourceMappingURL=index.d.ts.map