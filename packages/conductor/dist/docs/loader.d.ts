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
import type { DocsDefinition, DocsPage, DocsNavItem } from './types.js';
/**
 * Docs directory loader
 *
 * Manages the docs/ first-class component directory:
 * - Loads markdown pages
 * - Builds navigation
 * - Renders pages with Handlebars
 */
export declare class DocsDirectoryLoader {
    private definition;
    private pages;
    private manager;
    private basePath;
    private initialized;
    constructor();
    /**
     * Initialize with docs definition and markdown pages
     *
     * @param definition - Docs definition (passed from ensemble flow config)
     * @param markdownFiles - Map of file paths to markdown content
     */
    init(definition: Partial<DocsDefinition> | undefined, markdownFiles: Map<string, string>): Promise<void>;
    /**
     * Parse a markdown file into a DocsPage
     */
    private parseMarkdownPage;
    /**
     * Parse YAML frontmatter from markdown
     */
    private parseFrontmatter;
    /**
     * Extract title from first heading in markdown
     */
    private extractTitleFromContent;
    /**
     * Convert slug to title (e.g., 'getting-started' -> 'Getting Started')
     */
    private slugToTitle;
    /**
     * Get order from nav config
     */
    private getOrderFromNav;
    /**
     * Get the docs definition
     */
    getDefinition(): DocsDefinition;
    /**
     * Get base path for docs
     * Note: Always returns '/docs' - custom paths should be configured
     * via the docs-serve ensemble's trigger configuration.
     */
    getBasePath(): string;
    /**
     * Get a page by slug
     */
    getPage(slug: string): DocsPage | null;
    /**
     * Get all pages
     */
    getAllPages(): DocsPage[];
    /**
     * Get pages sorted by order
     */
    getSortedPages(): DocsPage[];
    /**
     * Build navigation items
     */
    buildNavigation(activePath?: string): DocsNavItem[];
    /**
     * Render a page with Handlebars variables
     */
    renderPage(slug: string, variables?: Record<string, unknown>): Promise<{
        content: string;
        page: DocsPage;
    } | null>;
    /**
     * Check if docs are initialized
     */
    isInitialized(): boolean;
    /**
     * Get page count
     */
    getPageCount(): number;
    /**
     * Register a custom Handlebars helper
     */
    registerHelper(name: string, fn: (...args: unknown[]) => unknown): void;
    /**
     * Register a Handlebars partial
     */
    registerPartial(name: string, template: string): void;
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
    getRegistryData(): Map<string, {
        content: string;
        title: string;
        slug: string;
    }>;
}
/**
 * Get or create the global docs loader
 */
export declare function getDocsLoader(): DocsDirectoryLoader;
/**
 * Set the global docs loader (for testing)
 */
export declare function setDocsLoader(loader: DocsDirectoryLoader | null): void;
/**
 * Reset the global docs loader
 */
export declare function resetDocsLoader(): void;
//# sourceMappingURL=loader.d.ts.map