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
import { HandlebarsTemplateEngine } from '../utils/templates/engines/handlebars.js';
/**
 * Docs Manager - First-class component support for markdown documentation
 *
 * Works exactly like PromptManager with Handlebars rendering and caching.
 */
export class DocsManager {
    constructor(config = {}) {
        this.cache = new Map();
        this.config = {
            cacheEnabled: config.cacheEnabled ?? true,
            handlebarsEnabled: config.handlebarsEnabled ?? true,
        };
        this.handlebars = new HandlebarsTemplateEngine();
    }
    /**
     * Register a docs template in cache
     */
    register(template) {
        const key = template.name;
        this.cache.set(key, template);
    }
    /**
     * Get a docs template from cache
     */
    get(name) {
        return this.cache.get(name) || null;
    }
    /**
     * Check if docs template exists in cache
     */
    has(name) {
        return this.cache.has(name);
    }
    /**
     * List all cached docs templates
     */
    list() {
        return Array.from(this.cache.values()).map((template) => ({
            name: template.name,
            title: template.metadata?.title,
        }));
    }
    /**
     * Clear cache
     */
    clearCache() {
        this.cache.clear();
    }
    /**
     * Render markdown with Handlebars
     */
    async render(template, options) {
        let content = template.content;
        // Apply Handlebars rendering if enabled
        if (this.config.handlebarsEnabled && !options?.skipHandlebars) {
            const variables = options?.variables || {};
            content = await this.handlebars.render(content, variables);
        }
        return {
            content,
            metadata: template.metadata,
        };
    }
    /**
     * Render docs by name from cache
     */
    async renderByName(name, options) {
        const template = this.get(name);
        if (!template) {
            throw new Error(`Docs template not found: ${name}`);
        }
        return this.render(template, options);
    }
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
    loadFromMarkdown(markdown, name) {
        const { content, metadata } = this.parseFrontmatter(markdown);
        const template = {
            name,
            content,
            metadata,
        };
        if (this.config.cacheEnabled) {
            this.register(template);
        }
        return template;
    }
    /**
     * Parse YAML frontmatter from markdown
     */
    parseFrontmatter(markdown) {
        // Check for frontmatter (--- at start)
        const frontmatterRegex = /^---\s*\n([\s\S]*?)\n---\s*\n([\s\S]*)$/;
        const match = markdown.match(frontmatterRegex);
        if (!match) {
            return { content: markdown };
        }
        const [, frontmatterYaml, content] = match;
        try {
            // Simple YAML parser for frontmatter
            const metadata = {};
            const lines = frontmatterYaml.split('\n');
            for (const line of lines) {
                const colonIndex = line.indexOf(':');
                if (colonIndex === -1)
                    continue;
                const key = line.substring(0, colonIndex).trim();
                const value = line.substring(colonIndex + 1).trim();
                // Remove quotes
                metadata[key] = value.replace(/^["']|["']$/g, '');
            }
            return { content, metadata };
        }
        catch (error) {
            console.warn('Failed to parse frontmatter, using raw markdown:', error);
            return { content: markdown };
        }
    }
    /**
     * Register a custom Handlebars helper
     */
    registerHelper(name, fn) {
        this.handlebars.registerHelper(name, fn);
    }
    /**
     * Register a Handlebars partial
     */
    registerPartial(name, template) {
        this.handlebars.registerPartial(name, template);
    }
}
/**
 * Global docs manager instance
 */
let globalManager = null;
/**
 * Get or create the global docs manager
 */
export function getGlobalDocsManager(config) {
    if (!globalManager) {
        globalManager = new DocsManager(config);
    }
    return globalManager;
}
