/**
 * Unified Template Engine Types
 */

import type { KVNamespace } from '@cloudflare/workers-types'

/**
 * Supported template engines (Workers-compatible)
 * Note: Only 'simple' and 'liquid' - both work in Cloudflare Workers without eval()
 */
export type TemplateEngine = 'simple' | 'liquid'

/**
 * Template context data
 * Note: Uses index signature for flexible template data binding
 */
export interface TemplateContext {
  [key: string]: unknown
}

/**
 * Structured template context with explicit data and helpers
 * Used when wrapping context for template engines
 */
export interface StructuredTemplateContext extends TemplateContext {
  data?: TemplateContext
  helpers?: Record<string, (...args: unknown[]) => unknown>
}

/**
 * Template source location
 */
export type TemplateSource = 'inline' | 'kv' | 'bundled'

/**
 * Template reference
 */
export interface TemplateRef {
  /** Source type */
  source: TemplateSource
  /** Template content or path */
  value: string
  /** Template version (for KV) */
  version?: string
  /** Template engine to use */
  engine?: TemplateEngine
}

/**
 * Template manager configuration
 */
export interface TemplateManagerConfig {
  /** Default template engine */
  defaultEngine?: TemplateEngine
  /** KV namespace for templates */
  kv?: KVNamespace
  /** Default template version */
  defaultVersion?: string
  /** Enable template caching */
  cache?: boolean
}

/**
 * Rendered template result
 */
export interface TemplateResult {
  /** Rendered HTML/text */
  content: string
  /** Engine used */
  engine: TemplateEngine
  /** Render time in ms */
  renderTime: number
}
