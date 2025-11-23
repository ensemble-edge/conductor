/**
 * Docs Manager
 *
 * Manages markdown documentation with:
 * - Handlebars template rendering
 * - In-memory caching for performance
 * - Variable substitution
 * - Component reference support (docs://path@version)
 * - File-based auto-loading
 */
import type { TemplateContext } from '../utils/templates/types.js';
export interface DocsTemplate {
    /** Template name (file name without extension) */
    name: string;
    /** Markdown content (may contain Handlebars) */
    content: string;
    /** Metadata extracted from frontmatter (optional) */
    metadata?: {
        title?: string;
        description?: string;
        version?: string;
        [key: string]: any;
    };
}
export interface DocsManagerConfig {
    /** Enable in-memory caching */
    cacheEnabled?: boolean;
    /** Enable Handlebars rendering */
    handlebarsEnabled?: boolean;
}
export interface RenderOptions {
    /** Variables to inject into template */
    variables?: TemplateContext;
    /** Skip Handlebars rendering (return raw markdown) */
    skipHandlebars?: boolean;
}
export interface RenderedDocs {
    /** Rendered markdown content */
    content: string;
    /** Template metadata */
    metadata?: DocsTemplate['metadata'];
}
/**
 * Docs Manager - First-class component support for markdown documentation
 *
 * Works exactly like PromptManager with Handlebars rendering and caching.
 */
export declare class DocsManager {
    private cache;
    private handlebars;
    private config;
    constructor(config?: DocsManagerConfig);
    /**
     * Register a docs template in cache
     */
    register(template: DocsTemplate): void;
    /**
     * Get a docs template from cache
     */
    get(name: string): DocsTemplate | null;
    /**
     * Check if docs template exists in cache
     */
    has(name: string): boolean;
    /**
     * List all cached docs templates
     */
    list(): Array<{
        name: string;
        title?: string;
    }>;
    /**
     * Clear cache
     */
    clearCache(): void;
    /**
     * Render markdown with Handlebars
     */
    render(template: DocsTemplate, options?: RenderOptions): Promise<RenderedDocs>;
    /**
     * Render docs by name from cache
     */
    renderByName(name: string, options?: RenderOptions): Promise<RenderedDocs>;
    /**
     * Load docs from markdown string
     *
     * Supports optional YAML frontmatter:
     * ---
     * title: Getting Started
     * description: Quick start guide
     * ---
     * # Content here
     */
    loadFromMarkdown(markdown: string, name: string): DocsTemplate;
    /**
     * Parse YAML frontmatter from markdown
     */
    private parseFrontmatter;
    /**
     * Register a custom Handlebars helper
     */
    registerHelper(name: string, fn: (...args: any[]) => any): void;
    /**
     * Register a Handlebars partial
     */
    registerPartial(name: string, template: string): void;
}
/**
 * Get or create the global docs manager
 */
export declare function getGlobalDocsManager(config?: DocsManagerConfig): DocsManager;
//# sourceMappingURL=docs-manager.d.ts.map