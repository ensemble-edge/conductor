/**
 * Docs Module
 *
 * First-class docs/ component directory with:
 * - Route configuration (like agents)
 * - Markdown documentation with Handlebars rendering
 * - Auto-generated navigation from file structure
 * - Reserved routes for agents, ensembles, API reference
 */
// Core docs manager (Handlebars rendering)
export { DocsManager, getGlobalDocsManager } from './docs-manager.js';
// Docs directory loader
export { DocsDirectoryLoader, getDocsLoader, setDocsLoader, resetDocsLoader } from './loader.js';
// Navigation builder
export { buildNavHTML, markdownToHTML, getDocsPageStyles, renderDocsPage } from './navigation.js';
export { DEFAULT_DOCS_DEFINITION, RESERVED_ROUTES, isReservedRoute, mergeDocsDefinition, } from './types.js';
