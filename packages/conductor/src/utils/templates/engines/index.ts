/**
 * Template Engine Factory
 *
 * Creates template engines based on type.
 * Supports Workers-compatible engines: 'simple' and 'liquid'
 * Note: handlebars/mjml removed - use eval(), fail in Cloudflare Workers
 */

import type { TemplateEngine } from '../types.js'
import { BaseTemplateEngine } from './base.js'
import { SimpleTemplateEngine } from './simple.js'
import { HandlebarsTemplateEngine } from './handlebars.js' // Kept for DocsManager (server-side only)
import { LiquidTemplateEngine } from './liquid.js'
import { MJMLTemplateEngine } from './mjml.js' // Kept for EmailAgent (server-side rendering)

/**
 * Create a template engine instance (Workers-compatible only)
 */
export function createTemplateEngine(engine: TemplateEngine): BaseTemplateEngine {
  switch (engine) {
    case 'simple':
      return new SimpleTemplateEngine()

    case 'liquid':
      return new LiquidTemplateEngine()

    default:
      throw new Error(`Unknown template engine: ${engine}`)
  }
}

/**
 * Check if an engine is available (Workers-compatible)
 */
export function isEngineAvailable(engine: TemplateEngine): boolean {
  return engine === 'simple' || engine === 'liquid'
}

/**
 * Get list of available engines (Workers-compatible)
 */
export function getAvailableEngines(): TemplateEngine[] {
  return ['simple', 'liquid'] // simple first as default
}

// Re-export types and classes
export { BaseTemplateEngine } from './base.js'
export { SimpleTemplateEngine } from './simple.js'
export { HandlebarsTemplateEngine } from './handlebars.js'
export { LiquidTemplateEngine } from './liquid.js'
export { MJMLTemplateEngine } from './mjml.js'
