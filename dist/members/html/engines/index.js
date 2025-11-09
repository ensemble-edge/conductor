/**
 * Template Engine Factory
 *
 * Creates template engines based on type.
 * Currently supports 'simple' engine out of the box.
 * Handlebars, Liquid, and MJML support can be added as optional dependencies.
 */
import { SimpleTemplateEngine } from './simple.js';
/**
 * Create a template engine instance
 */
export function createTemplateEngine(engine) {
    switch (engine) {
        case 'simple':
            return new SimpleTemplateEngine();
        case 'handlebars':
            throw new Error('Handlebars engine not implemented yet. ' +
                'Use "simple" engine or add handlebars support to your project.');
        case 'liquid':
            throw new Error('Liquid engine not implemented yet. ' +
                'Use "simple" engine or add liquidjs support to your project.');
        case 'mjml':
            throw new Error('MJML engine not implemented yet. ' +
                'Use "simple" engine or add mjml support to your project.');
        default:
            throw new Error(`Unknown template engine: ${engine}`);
    }
}
/**
 * Check if an engine is available
 */
export function isEngineAvailable(engine) {
    return engine === 'simple';
}
/**
 * Get list of available engines
 */
export function getAvailableEngines() {
    return ['simple'];
}
// Re-export types and classes
export { BaseTemplateEngine } from './base.js';
export { SimpleTemplateEngine } from './simple.js';
