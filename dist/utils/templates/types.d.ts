/**
 * Unified Template Engine Types
 */
import type { KVNamespace } from '@cloudflare/workers-types';
/**
 * Supported template engines
 */
export type TemplateEngine = 'simple' | 'handlebars' | 'liquid' | 'mjml';
/**
 * Template context data
 */
export interface TemplateContext {
    [key: string]: any;
}
/**
 * Template source location
 */
export type TemplateSource = 'inline' | 'kv' | 'bundled';
/**
 * Template reference
 */
export interface TemplateRef {
    /** Source type */
    source: TemplateSource;
    /** Template content or path */
    value: string;
    /** Template version (for KV) */
    version?: string;
    /** Template engine to use */
    engine?: TemplateEngine;
}
/**
 * Template manager configuration
 */
export interface TemplateManagerConfig {
    /** Default template engine */
    defaultEngine?: TemplateEngine;
    /** KV namespace for templates */
    kv?: KVNamespace;
    /** Default template version */
    defaultVersion?: string;
    /** Enable template caching */
    cache?: boolean;
}
/**
 * Rendered template result
 */
export interface TemplateResult {
    /** Rendered HTML/text */
    content: string;
    /** Engine used */
    engine: TemplateEngine;
    /** Render time in ms */
    renderTime: number;
}
//# sourceMappingURL=types.d.ts.map