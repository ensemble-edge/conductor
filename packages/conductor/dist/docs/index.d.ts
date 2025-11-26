/**
 * Docs Module
 *
 * First-class docs/ component directory with:
 * - Route configuration (like agents)
 * - Markdown documentation with Handlebars rendering
 * - Auto-generated navigation from file structure
 * - Reserved routes for agents, ensembles, API reference
 */
export { DocsManager, getGlobalDocsManager } from './docs-manager.js';
export type { DocsTemplate, DocsManagerConfig, RenderOptions, RenderedDocs, } from './docs-manager.js';
export { DocsDirectoryLoader, getDocsLoader, setDocsLoader, resetDocsLoader } from './loader.js';
export { buildNavHTML, markdownToHTML, getDocsPageStyles, renderDocsPage } from './navigation.js';
export type { RenderDocsPageProps } from './navigation.js';
export type { DocsDefinition, DocsRouteConfig, DocsNavConfig, DocsNavGroup, DocsFrontmatter, DocsPage, DocsNavItem, ReservedRoute, } from './types.js';
export { DEFAULT_DOCS_DEFINITION, RESERVED_ROUTES, isReservedRoute, mergeDocsDefinition, } from './types.js';
//# sourceMappingURL=index.d.ts.map