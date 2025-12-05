/**
 * Docs Directory Loader
 *
 * Loads and manages the docs/ first-class component directory.
 * Handles:
 * - Loading markdown pages from docs/*.md
 * - Parsing frontmatter metadata
 * - Building navigation from file structure
 *
 * Note: Docs configuration is passed via the docs-serve ensemble's flow config,
 * not via a separate docs.yaml file.
 */
import { DocsManager } from './docs-manager.js';
import { DEFAULT_DOCS_DEFINITION, mergeDocsDefinition, isReservedRoute, } from './types.js';
import { createLogger } from '../observability/index.js';
const logger = createLogger({ serviceName: 'docs-loader' });
/**
 * Docs directory loader
 *
 * Manages the docs/ first-class component directory:
 * - Loads markdown pages
 * - Builds navigation
 * - Renders pages with Handlebars
 */
export class DocsDirectoryLoader {
    constructor() {
        this.definition = DEFAULT_DOCS_DEFINITION;
        this.pages = new Map();
        this.basePath = '/docs';
        this.initialized = false;
        this.manager = new DocsManager({
            cacheEnabled: true,
            handlebarsEnabled: true,
        });
    }
    /**
     * Initialize with docs definition and markdown pages
     *
     * @param definition - Docs definition (passed from ensemble flow config)
     * @param markdownFiles - Map of file paths to markdown content
     */
    async init(definition, markdownFiles) {
        // Merge with defaults
        this.definition = mergeDocsDefinition(definition);
        // Note: basePath is always /docs - routing is handled by the docs-serve ensemble's trigger
        // Load markdown pages
        for (const [filePath, content] of markdownFiles) {
            const page = this.parseMarkdownPage(filePath, content);
            if (page && !isReservedRoute(page.slug)) {
                this.pages.set(page.slug, page);
                // Register with DocsManager for Handlebars rendering
                this.manager.loadFromMarkdown(content, page.slug);
            }
        }
        this.initialized = true;
        logger.info(`Docs loader initialized with ${this.pages.size} pages`);
    }
    /**
     * Parse a markdown file into a DocsPage
     */
    parseMarkdownPage(filePath, content) {
        // Extract slug from file path (e.g., 'getting-started.md' -> 'getting-started')
        const fileName = filePath.split('/').pop();
        if (!fileName)
            return null;
        const slug = fileName.replace(/\.md$/, '');
        // Skip docs.yaml, docs.ts, README
        if (slug === 'docs' || slug === 'README') {
            return null;
        }
        // Parse frontmatter
        const { frontmatter, body } = this.parseFrontmatter(content);
        // Extract title from frontmatter or first heading
        const title = frontmatter.title || this.extractTitleFromContent(body) || this.slugToTitle(slug);
        // Determine order
        const order = frontmatter.order ?? this.getOrderFromNav(slug) ?? 999;
        return {
            slug,
            path: filePath,
            content: body,
            frontmatter,
            title,
            order,
        };
    }
    /**
     * Parse YAML frontmatter from markdown
     */
    parseFrontmatter(content) {
        const frontmatterRegex = /^---\s*\n([\s\S]*?)\n---\s*\n([\s\S]*)$/;
        const match = content.match(frontmatterRegex);
        if (!match) {
            return { frontmatter: {}, body: content };
        }
        const [, yaml, body] = match;
        try {
            // Simple YAML parser for frontmatter
            const frontmatter = {};
            const lines = yaml.split('\n');
            for (const line of lines) {
                const colonIndex = line.indexOf(':');
                if (colonIndex === -1)
                    continue;
                const key = line.substring(0, colonIndex).trim();
                let value = line.substring(colonIndex + 1).trim();
                // Remove quotes
                value = value.replace(/^["']|["']$/g, '');
                // Parse booleans and numbers into proper types
                let parsedValue = value;
                if (value === 'true')
                    parsedValue = true;
                else if (value === 'false')
                    parsedValue = false;
                else if (/^\d+$/.test(value))
                    parsedValue = parseInt(value, 10);
                value = parsedValue;
                frontmatter[key] = value;
            }
            return { frontmatter, body };
        }
        catch (error) {
            logger.warn('Failed to parse frontmatter', { error: String(error) });
            return { frontmatter: {}, body: content };
        }
    }
    /**
     * Extract title from first heading in markdown
     */
    extractTitleFromContent(content) {
        const headingMatch = content.match(/^#\s+(.+)$/m);
        return headingMatch ? headingMatch[1].trim() : null;
    }
    /**
     * Convert slug to title (e.g., 'getting-started' -> 'Getting Started')
     */
    slugToTitle(slug) {
        return slug
            .split('-')
            .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
    }
    /**
     * Get order from nav config
     */
    getOrderFromNav(slug) {
        const navOrder = this.definition.nav?.order;
        if (!navOrder)
            return null;
        const index = navOrder.indexOf(slug);
        return index >= 0 ? index : null;
    }
    /**
     * Get the docs definition
     */
    getDefinition() {
        return this.definition;
    }
    /**
     * Get base path for docs
     * Note: Always returns '/docs' - custom paths should be configured
     * via the docs-serve ensemble's trigger configuration.
     */
    getBasePath() {
        return this.basePath;
    }
    /**
     * Get a page by slug
     */
    getPage(slug) {
        return this.pages.get(slug) || null;
    }
    /**
     * Get all pages
     */
    getAllPages() {
        return Array.from(this.pages.values());
    }
    /**
     * Get pages sorted by order
     */
    getSortedPages() {
        const hidden = new Set(this.definition.nav?.hide || []);
        return Array.from(this.pages.values())
            .filter((page) => !page.frontmatter.hidden && !hidden.has(page.slug))
            .sort((a, b) => a.order - b.order);
    }
    /**
     * Build navigation items
     */
    buildNavigation(activePath) {
        const items = [];
        const showReserved = this.definition.nav?.showReserved;
        // Add markdown pages
        for (const page of this.getSortedPages()) {
            items.push({
                slug: page.slug,
                title: page.title,
                icon: page.frontmatter.icon,
                path: `${this.basePath}/${page.slug}`,
                active: activePath === page.slug,
                reserved: false,
            });
        }
        // Add reserved sections
        if (showReserved?.agents !== false) {
            items.push({
                slug: 'agents',
                title: 'Agents',
                icon: '🤖',
                path: `${this.basePath}/agents`,
                active: activePath === 'agents',
                reserved: true,
            });
        }
        if (showReserved?.ensembles !== false) {
            items.push({
                slug: 'ensembles',
                title: 'Ensembles',
                icon: '🎭',
                path: `${this.basePath}/ensembles`,
                active: activePath === 'ensembles',
                reserved: true,
            });
        }
        if (showReserved?.api !== false) {
            items.push({
                slug: 'api',
                title: 'API Reference',
                icon: '📖',
                path: `${this.basePath}/api`,
                active: activePath === 'api',
                reserved: true,
            });
        }
        return items;
    }
    /**
     * Render a page with Handlebars variables
     */
    async renderPage(slug, variables) {
        const page = this.pages.get(slug);
        if (!page)
            return null;
        try {
            const rendered = await this.manager.renderByName(slug, { variables });
            return {
                content: rendered.content,
                page,
            };
        }
        catch (error) {
            logger.error(`Failed to render page: ${slug}`, error instanceof Error ? error : undefined);
            return null;
        }
    }
    /**
     * Check if docs are initialized
     */
    isInitialized() {
        return this.initialized;
    }
    /**
     * Get page count
     */
    getPageCount() {
        return this.pages.size;
    }
    /**
     * Register a custom Handlebars helper
     */
    registerHelper(name, fn) {
        this.manager.registerHelper(name, fn);
    }
    /**
     * Register a Handlebars partial
     */
    registerPartial(name, template) {
        this.manager.registerPartial(name, template);
    }
    /**
     * Get registry data for discovery
     *
     * Returns a Map suitable for passing to the Executor's discovery data.
     * This enables agents to discover available documentation pages.
     *
     * @example
     * ```typescript
     * const executor = new Executor({
     *   env,
     *   ctx,
     *   discovery: {
     *     docs: docsLoader.getRegistryData(),
     *   }
     * });
     * ```
     */
    getRegistryData() {
        const result = new Map();
        for (const [slug, page] of this.pages) {
            result.set(slug, {
                content: page.content,
                title: page.title,
                slug: page.slug,
            });
        }
        return result;
    }
}
/**
 * Global docs loader instance
 */
let globalLoader = null;
/**
 * Get or create the global docs loader
 */
export function getDocsLoader() {
    if (!globalLoader) {
        globalLoader = new DocsDirectoryLoader();
    }
    return globalLoader;
}
/**
 * Set the global docs loader (for testing)
 */
export function setDocsLoader(loader) {
    globalLoader = loader;
}
/**
 * Reset the global docs loader
 */
export function resetDocsLoader() {
    globalLoader = null;
}
