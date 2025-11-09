/**
 * Email Template Loader
 *
 * Loads and renders email templates from local files or KV storage
 * Supports Handlebars templating and Edgit versioning
 */
import type { KVNamespace } from '@cloudflare/workers-types';
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
    private kv?;
    private localDir;
    private defaultVersion;
    private cache;
    constructor(config?: TemplateLoaderConfig);
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
     * Render template with Handlebars
     */
    private renderTemplate;
    /**
     * Get nested value from object
     */
    private getNestedValue;
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
export declare function createTemplateLoader(config?: TemplateLoaderConfig): TemplateLoader;
//# sourceMappingURL=template-loader.d.ts.map