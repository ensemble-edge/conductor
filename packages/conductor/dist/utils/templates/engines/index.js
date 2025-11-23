/**
 * Template Engine Factory
 *
 * Creates template engines based on type.
 * Supports Workers-compatible engines: 'simple' and 'liquid'
 * Note: handlebars/mjml removed - use eval(), fail in Cloudflare Workers
 */
import { SimpleTemplateEngine } from './simple.js';
import { LiquidTemplateEngine } from './liquid.js';
/**
 * Create a template engine instance (Workers-compatible only)
 */
export function createTemplateEngine(engine) {
    switch (engine) {
        case 'simple':
            return new SimpleTemplateEngine();
        case 'liquid':
            return new LiquidTemplateEngine();
        default:
            throw new Error(`Unknown template engine: ${engine}`);
    }
}
/**
 * Check if an engine is available (Workers-compatible)
 */
export function isEngineAvailable(engine) {
    return engine === 'simple' || engine === 'liquid';
}
/**
 * Get list of available engines (Workers-compatible)
 */
export function getAvailableEngines() {
    return ['simple', 'liquid']; // simple first as default
}
// Re-export types and classes
export { BaseTemplateEngine } from './base.js';
export { SimpleTemplateEngine } from './simple.js';
export { HandlebarsTemplateEngine } from './handlebars.js';
export { LiquidTemplateEngine } from './liquid.js';
export { MJMLTemplateEngine } from './mjml.js';
