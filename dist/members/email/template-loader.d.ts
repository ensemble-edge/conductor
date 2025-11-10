/**
 * Email Template Loader
 *
 * Loads and renders email templates from local files or KV storage
 * Supports Handlebars templating and Edgit versioning
 */
import type { KVNamespace } from '@cloudflare/workers-types';
import type { BaseTemplateEngine } from '../../utils/templates/index.js';
/**
 * Template data for rendering
 */
export interface TemplateData {
    [key: string]: any;
}
/**
 * Template loader configuration
 */
export interface TemplateLoaderConfig {
    /** Template engine for rendering */
    engine: BaseTemplateEngine;
    /** KV namespace for templates (optional) */
    kv?: KVNamespace;
    /** Local templates directory (optional) */
    localDir?: string;
    /** Default template version */
    defaultVersion?: string;
}
/**
 * Email Template Loader
 */
export declare class TemplateLoader {
    private engine;
    private kv?;
    private localDir;
    private defaultVersion;
    private cache;
    constructor(config: TemplateLoaderConfig);
    /**
     * Load and render template
     */
    render(template: string, data?: TemplateData): Promise<string>;
    /**
     * Parse template reference
     */
    private parseTemplateRef;
    /**
     * Load template from storage
     */
    private loadTemplate;
    /**
     * Load template from KV
     */
    private loadFromKv;
    /**
     * Load template from local file system
     */
    private loadFromLocal;
    /**
     * Clear template cache
     */
    clearCache(): void;
    /**
     * Preload template into cache
     */
    preload(template: string): Promise<void>;
}
/**
 * Create template loader instance
 */
export declare function createTemplateLoader(config: TemplateLoaderConfig): TemplateLoader;
//# sourceMappingURL=template-loader.d.ts.map